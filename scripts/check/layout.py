"""Keep workflow adapters layered and prevent core code from depending on scripts."""
import ast
from scripts import ROOT

# Checks may exercise every adapter; runtime/build code must not depend on checks.
DEPENDENCIES = {
    'build': {'build'},
    'dev': {'build', 'dev'},
    'experiments': {'experiments'},
    'check': {'build', 'dev', 'experiments', 'check'},
}


def check_source(path, source):
    parts = path.parts
    if parts[0] == 'scripts' and path.name != '__init__.py':
        if len(parts) < 3 or parts[1] not in DEPENDENCIES:
            raise ValueError(f'{path}: workflow needs an owning layer')
    if path.suffix != '.py': return
    for node in ast.walk(ast.parse(source)):
        modules=[]
        if isinstance(node,ast.Import): modules=[alias.name for alias in node.names]
        elif isinstance(node,ast.ImportFrom):
            module=node.module or ''
            if node.level:
                package=list(parts[:-1])
                module='.'.join(package[:len(package)-node.level+1]+([module] if module else []))
            # Include imported submodules: `from scripts import check` must not
            # bypass the same rule as `import scripts.check`.
            modules=[module+'.'+alias.name for alias in node.names]
        for module in modules:
            if module != 'scripts' and not module.startswith('scripts.'): continue
            if parts[0] == 'inside_inference':
                raise ValueError(f'{path}: core cannot depend on workflow adapters')
            if module=='scripts.ROOT': continue
            target=module.split('.')[1:2]
            owner=parts[1] if len(parts)>2 else None
            if target and parts[0]=='scripts' and target[0] not in DEPENDENCIES.get(owner,set()):
                raise ValueError(f'{path}: forbidden dependency on {module}')


def main():
    for folder in ('scripts','inside_inference'):
        for path in (ROOT / folder).rglob('*'):
            if path.suffix in ('.py','.js','.mjs','.sh'):
                check_source(path.relative_to(ROOT),path.read_text())
    print('Workflow layout and Python dependency direction checked.')


if __name__ == '__main__': main()
