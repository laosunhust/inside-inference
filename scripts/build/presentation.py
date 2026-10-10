"""HTML projections of the admitted ontology and catalog; no authored owner map."""
from html import escape
from html.parser import HTMLParser
import re


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


def lab_subjects(catalog):
    return {owner for entry in catalog['innovations']
            for owner in [entry['ontology_binding']['primary'], *entry['ontology_binding']['related']]}


def concept_label(owner):
    return re.sub(r'(?<=[a-z])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])', ' ', owner)


def lab_index(ontology, catalog, statuses):
    body = ('<h1>Explore inference concepts</h1><p>Find a lab to inspect a mechanism or investigate what changes. '
            'Related references lead to that same lab; they are not additional experiments. '
            'Planned labs have no executable experiment.</p>')
    subjects = lab_subjects(catalog)
    for owner in ontology['terms']:
        if owner not in subjects: continue
        primary = [e for e in catalog['innovations'] if e['ontology_binding']['primary'] == owner]
        related = [e for e in catalog['innovations'] if owner in e['ontology_binding']['related']]
        body += f'<section id="{owner}"><h2>{escape(concept_label(owner))}</h2><a href="ontology.html#{owner}">Ontology ↗</a>'
        for entry in primary:
            body += (f'<article id="lab-{entry["id"]}" data-lab="{entry["id"]}" data-primary="{owner}">'
                     f'<h3><a href="labs/{entry["id"]}.html">{escape(entry["name"])}</a></h3>'
                     f'<p>{statuses[entry["status"]]} · Primary subject</p>'
                     f'<p>{escape(entry["question"])}</p><p>{escape(entry["limit"])}</p></article>')
        if related:
            body += '<p>Related references:</p><ul>'
            for entry in related:
                body += (f'<li><a href="#lab-{entry["id"]}">{escape(entry["name"])}</a>'
                         f' · {statuses[entry["status"]]} · primary: {escape(concept_label(entry["ontology_binding"]["primary"]))}</li>')
            body += '</ul>'
        body += '</section>'
    return body
