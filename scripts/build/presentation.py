"""HTML projections of the admitted ontology; no authored owner map."""
from html.parser import HTMLParser


class Elements(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.elements = []
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        self.elements.append((tag, dict(attrs)))


def entities(source, *, anchors=False):
    return {attrs['data-term']: attrs['id'] if anchors else attrs['data-entity']
            for _, attrs in Elements(source).elements
            if 'data-term' in attrs and 'data-entity' in attrs}
