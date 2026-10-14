"""Separate stable document routes from a content-addressed static payload."""
import hashlib
from pathlib import Path
import re
import shutil


def asset_root(site):
    roots = list((site/'assets').iterdir())
    if len(roots) != 1 or not re.fullmatch('[0-9a-f]{64}', roots[0].name):
        raise ValueError('Expected exactly one content-addressed payload')
    return roots[0]


def seal_assets(site):
    files = sorted(p for p in site.rglob('*') if p.is_file() and p.suffix != '.html')
    inventory = ''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.relative_to(site).as_posix()+'\n' for p in files)
    identity = hashlib.sha256(inventory.encode()).hexdigest()
    destination = site/'assets'/identity
    children = list(site.iterdir())
    destination.mkdir(parents=True)
    for child in children:
        if child.suffix != '.html': shutil.move(str(child), destination/child.name)
    prefix = '/assets/'+identity+'/'
    def resource(match):
        attr, value = match.groups()
        if value.startswith(('/', '#')) or ':' in value: return match.group(0)
        return attr+'="'+prefix+value+'"'
    for page in site.glob('*.html'):
        # Document links already use absolute clean routes. Only assets are relative.
        page.write_text(re.sub(r'(href|src)="([^"]+)"', resource, page.read_text()))
        if page.name != 'index.html':
            target = site/page.stem/'index.html'
            target.parent.mkdir()
            page.rename(target)
    return destination
