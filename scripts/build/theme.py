"""Shared visual authority: authored page CSS owns layout, theme.css owns appearance."""
import re


LAYOUT = re.compile(r'^(?:display|position|inset(?:-.+)?|top|right|bottom|left|width|height|(?:min|max)-(?:width|height)|margin(?:-.+)?|padding(?:-.+)?|gap|row-gap|column-gap|grid(?:-.+)?|flex(?:-.+)?|align-.+|justify-.+|overflow(?:-.+)?|resize|transform(?:-.+)?|float|clear|box-sizing|border-collapse|border-spacing|clip(?:-.+)?|scroll-(?:margin|padding)(?:-.+)?|text-align|white-space|z-index)$', re.I)


def is_layout(declaration):
    name=declaration.split(':',1)[0].strip()
    if not re.fullmatch(r'(?:--)?[a-zA-Z][a-zA-Z0-9-]*',name):
        raise ValueError('CSS authority requires plain property names')
    return bool(LAYOUT.fullmatch(name))



def rules(source):
    """Read the repository's plain CSS rules and nested media blocks, preserving order."""
    source = re.sub(r'/\*.*?\*/', '', source, flags=re.S)
    offset = 0
    while source[offset:].strip():
        start = source.find('{', offset)
        if start < 0: raise ValueError('CSS must contain complete rules')
        selector = source[offset:start].strip()
        depth, end = 1, start + 1
        while end < len(source) and depth:
            depth += (source[end] == '{') - (source[end] == '}')
            end += 1
        if depth: raise ValueError('Unclosed CSS rule')
        yield selector, source[start+1:end-1]
        offset = end


def split(source):
    appearance, layout = [], []
    for selector, body in rules(source):
        if selector.startswith('@media') or selector.startswith('@supports'):
            paint, structure = split(body)
        elif selector.startswith('@'):
            raise ValueError(f'Unsupported CSS authority block: {selector}')
        else:
            declarations = [d.strip() for d in body.split(';') if d.strip()]
            paint = ';'.join(d for d in declarations if not is_layout(d))
            structure = ';'.join(d for d in declarations if is_layout(d))
        if paint: appearance.append(f'{selector}{{{paint}}}')
        if structure: layout.append(f'{selector}{{{structure}}}')
    return '\n'.join(appearance), '\n'.join(layout)


def check_theme(root):
    if not (root/'web/theme.css').is_file(): raise ValueError('Missing shared web/theme.css')
    for path in sorted((root/'web').rglob('*.css')):
        if path == root/'web/theme.css': continue
        paint, _ = split(path.read_text())
        if paint: raise ValueError(f'{path.relative_to(root)}: appearance belongs in web/theme.css; page CSS owns layout')
    for path in sorted((root/'web').rglob('*.js')):
        if '.generated.' in path.name: continue
        if re.search(r'\.style\.(?:color|background\w*|border\w*|font\w*)\s*=',path.read_text()):
            raise ValueError(f'{path.relative_to(root)}: use a data-valued CSS custom property; theme.css owns appearance')
