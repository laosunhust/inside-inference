"""AWS static delivery adapter; no credentials or visitor inputs enter release assets."""
import argparse
import json
from pathlib import Path
import subprocess
from scripts import ROOT
from scripts.build.structured import read_yaml
from scripts.build.hosting.release import verify, entries, digest
from scripts.build.hosting.layout import asset_root

CONFIG = ROOT/'infrastructure/aws/deployment.yaml'
TEMPLATE = ROOT/'infrastructure/aws/site.yaml'
PROJECT = 'InsideInference'


def ownership_tags(environment):
    return {'Project':PROJECT, 'Environment':environment}


def aws(config, *args, **kwargs):
    result = subprocess.run(['aws', *args, '--region', config['region'], '--output', 'json', '--no-cli-pager'],
                            text=True, capture_output=True, **kwargs)
    if result.returncode: raise RuntimeError(result.stderr.strip())
    return json.loads(result.stdout) if result.stdout.strip().startswith(('{', '[')) else result.stdout.strip()


def configuration():
    config = read_yaml(CONFIG)
    actual = aws(config, 'sts', 'get-caller-identity')['Account']
    if actual != config['account']: raise ValueError('AWS account differs from deployment authority')
    return config


def stack(config, environment):
    value = aws(config, 'cloudformation', 'describe-stacks', '--stack-name', config['environments'][environment]['stack'])['Stacks'][0]
    tags = {item['Key']:item['Value'] for item in value.get('Tags', [])}
    if tags.get('Project') != PROJECT or tags.get('Environment') != environment:
        raise ValueError('Refusing a stack without matching project/environment ownership tags')
    return value


def outputs(value):
    return {item['OutputKey']: item['OutputValue'] for item in value.get('Outputs', [])}


def hostname(config, environment):
    subdomain = config['environments'][environment]['subdomain']
    return (subdomain+'.' if subdomain else '')+config['domain']


def zone(config):
    zones = aws(config, 'route53', 'list-hosted-zones-by-name', '--dns-name', config['domain'])['HostedZones']
    matches = [z for z in zones if z['Name'] == config['domain']+'.' and not z['Config']['PrivateZone']]
    if len(matches) != 1: raise ValueError('Require exactly one public hosted zone for the registered domain')
    return matches[0]['Id'].split('/')[-1]


def infrastructure(config, environment):
    settings = config['environments'][environment]
    if settings.get('enabled') is not True: raise ValueError('Environment is disabled')
    existing = aws(config, 'cloudformation', 'list-stacks')['StackSummaries']
    if any(s['StackName'] == settings['stack'] and s['StackStatus'] != 'DELETE_COMPLETE' for s in existing):
        print(json.dumps(stack(config, environment), indent=2)); return
    aws(config, 'cloudformation', 'validate-template', '--template-body', 'file://'+str(TEMPLATE))
    parameters = [{'ParameterKey':'Hostname', 'ParameterValue':hostname(config, environment)},
                  {'ParameterKey':'HostedZoneId', 'ParameterValue':zone(config)},
                  {'ParameterKey':'Enabled', 'ParameterValue':'true'}]
    result = aws(config, 'cloudformation', 'create-stack', '--stack-name', settings['stack'],
                 '--template-body', 'file://'+str(TEMPLATE), '--parameters', json.dumps(parameters),
                 '--tags', json.dumps([{'Key':key,'Value':value} for key,value in ownership_tags(environment).items()]))
    print(json.dumps(result))


def deploy(config, environment, release):
    if config['environments'][environment].get('enabled') is not True:
        raise ValueError('Environment is disabled')
    site = ROOT/'out/releases'/release/'site'
    verify(site, release)
    asset_root(site)  # Legacy archived layouts must not be deployed through clean routing.
    local = json.loads((site.parent/'local-qualification.json').read_text())
    if local.get('passed') is not True or local.get('site_sha256') != release:
        raise ValueError('Missing matching local qualification')
    current = stack(config, environment)
    if current['StackStatus'] not in ('CREATE_COMPLETE', 'UPDATE_COMPLETE'):
        raise ValueError('Infrastructure is not ready: '+current['StackStatus'])
    target = outputs(current)
    prefix = 'releases/'+release+'/'
    objects = aws(config, 's3api', 'list-objects-v2', '--bucket', target['Bucket'], '--prefix', prefix)
    if any(o['Key'] == prefix+'SHA256SUMS' for o in objects.get('Contents', [])):
        import tempfile
        with tempfile.TemporaryDirectory() as directory:
            manifest = Path(directory)/'SHA256SUMS'
            aws(config, 's3api', 'get-object', '--bucket', target['Bucket'], '--key', prefix+'SHA256SUMS', str(manifest))
            if manifest.read_bytes() != (site/'SHA256SUMS').read_bytes():
                raise ValueError('Existing immutable release manifest differs')
    else:
        aws(config, 's3', 'cp', str(site)+'/', 's3://'+target['Bucket']+'/'+prefix,
            '--recursive', '--exclude', 'SHA256SUMS', '--cache-control', 'public,max-age=31536000,immutable', '--only-show-errors')
        verify(site, release)
        aws(config, 's3', 'cp', str(site/'SHA256SUMS'), 's3://'+target['Bucket']+'/'+prefix+'SHA256SUMS',
            '--content-type', 'text/plain', '--cache-control', 'public,max-age=31536000,immutable', '--only-show-errors')
    # Payload URLs are independent of the document release, so old tabs stay pinned.
    if (site/'assets').is_dir():
        aws(config, 's3', 'cp', str(site/'assets')+'/', 's3://'+target['Bucket']+'/releases/assets/',
            '--recursive', '--cache-control', 'public,max-age=31536000,immutable', '--only-show-errors')
    for page in site.rglob('*.html'):
        aws(config, 's3', 'cp', str(page), 's3://'+target['Bucket']+'/'+prefix+page.relative_to(site).as_posix(),
            '--content-type', 'text/html', '--cache-control', 'no-cache', '--only-show-errors')
    aws(config, 's3', 'cp', str(site.parent/'local-qualification.json'),
        's3://'+target['Bucket']+'/qualifications/'+release+'/local.json', '--only-show-errors')
    # Apply infrastructure even when the active release identity is unchanged.
    aws(config, 'cloudformation', 'deploy', '--stack-name', config['environments'][environment]['stack'],
        '--template-file', str(TEMPLATE), '--parameter-overrides',
        'Hostname='+hostname(config, environment), 'HostedZoneId='+zone(config),
        'Release='+release, 'Enabled=true', '--tags', *(key+'='+value for key,value in ownership_tags(environment).items()),
        '--no-fail-on-empty-changeset')
    print(json.dumps({'environment':environment, 'release':release, 'url':'https://'+target['Hostname']}))


def disable(config, environment):
    if config['environments'][environment].get('enabled') is not False:
        raise ValueError('Disable requires declared disabled environment')
    current = outputs(stack(config, environment))
    aws(config, 'cloudformation', 'deploy', '--stack-name', config['environments'][environment]['stack'],
        '--template-file', str(TEMPLATE), '--parameter-overrides',
        'Hostname='+hostname(config, environment), 'HostedZoneId='+zone(config),
        'Release='+current['Release'], 'Enabled=false', '--tags',
        *(key+'='+value for key,value in ownership_tags(environment).items()), '--no-fail-on-empty-changeset')


def restore(config, environment, release):
    import re
    if not re.fullmatch('[0-9a-f]{64}', release): raise ValueError('Invalid release identity')
    target = outputs(stack(config, environment))
    site = ROOT/'out/releases'/release/'site'
    if site.exists(): raise ValueError('Local release exists; verify it instead of overwriting')
    import tempfile
    (ROOT/'out').mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(dir=ROOT/'out') as directory:
        temporary = Path(directory)/'site'; temporary.mkdir()
        prefix = 'releases/'+release+'/'
        aws(config, 's3api', 'get-object', '--bucket', target['Bucket'], '--key', prefix+'SHA256SUMS', str(temporary/'SHA256SUMS'))
        raw = (temporary/'SHA256SUMS').read_bytes()
        if digest(raw) != release: raise ValueError('Remote release identity differs')
        expected = set(entries(raw)) | {'SHA256SUMS'}
        objects = aws(config, 's3api', 'list-objects-v2', '--bucket', target['Bucket'], '--prefix', prefix)
        if {obj['Key'][len(prefix):] for obj in objects.get('Contents', [])} != expected:
            raise ValueError('Remote release inventory differs')
        aws(config, 's3', 'cp', 's3://'+target['Bucket']+'/'+prefix, str(temporary)+'/', '--recursive', '--only-show-errors')
        verify(temporary, release)
        qualification = Path(directory)/'local-qualification.json'
        aws(config, 's3api', 'get-object', '--bucket', target['Bucket'],
            '--key', 'qualifications/'+release+'/local.json', str(qualification))
        proof = json.loads(qualification.read_text())
        if proof.get('passed') is not True or proof.get('site_sha256') != release:
            raise ValueError('Stored qualification does not match release')
        site.parent.mkdir(parents=True, exist_ok=True)
        import shutil
        shutil.move(str(temporary), site)
        shutil.move(str(qualification), site.parent/'local-qualification.json')
    print(release)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['infrastructure', 'status', 'deploy', 'restore', 'disable'])
    parser.add_argument('--environment', choices=['dev', 'prod'], required=True)
    parser.add_argument('--release')
    args = parser.parse_args()
    config = configuration()
    if args.action == 'infrastructure': infrastructure(config, args.environment)
    elif args.action == 'status': print(json.dumps(stack(config, args.environment), indent=2))
    elif args.action == 'disable': disable(config, args.environment)
    elif not args.release: parser.error('--release is required')
    elif args.action == 'restore': restore(config, args.environment, args.release)
    else: deploy(config, args.environment, args.release)


if __name__ == '__main__': main()
