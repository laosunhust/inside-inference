"""Validate prospective scenarios; these functions do not execute or score them.

Generated records enforce field shapes. These checks enforce cross-record identity
and chronology. Runtime engines still accept only their existing run bindings.
"""
from inside_inference.declarations_generated import CustomerInteraction, ResourceGraph


def validate_resource_graph(value):
    graph = ResourceGraph.from_dict(value)
    nodes = set()
    for node in graph.nodes:
        if node.id in nodes:
            raise ValueError(f'nodes: duplicate resource identity {node.id}')
        nodes.add(node.id)
    links = set()
    for link in graph.links:
        if link.id in links or link.id in nodes:
            raise ValueError(f'links: duplicate resource identity {link.id}')
        links.add(link.id)
        if link.source not in nodes or link.target not in nodes:
            raise ValueError(f'links.{link.id}: source and target must name declared nodes')
        if link.source == link.target:
            raise ValueError(f'links.{link.id}: local transfers are not graph links')
    return graph


def validate_customer_interaction(value):
    interaction = CustomerInteraction.from_dict(value)
    submitted, cancelled, consumed = set(), set(), {}
    previous = -1
    for index, action in enumerate(interaction.actions):
        prefix = f'actions[{index}] ({action.request_id})'
        if action.at_us < previous:
            raise ValueError(f'{prefix}: actions must be chronological')
        previous = action.at_us
        if action.kind == 'submit':
            if action.request_id in submitted:
                raise ValueError(f'{prefix}: duplicate submission; use a new invocation identity')
            submitted.add(action.request_id)
        else:
            if action.request_id not in submitted:
                raise ValueError(f'{prefix}: action precedes submission')
            if action.kind == 'cancel':
                if action.request_id in cancelled:
                    raise ValueError(f'{prefix}: duplicate cancellation intent')
                cancelled.add(action.request_id)
            else:
                if action.output_bytes < consumed.get(action.request_id, 0):
                    raise ValueError(f'{prefix}: cumulative consumption cannot decrease')
                consumed[action.request_id] = action.output_bytes
                # Buffered output can be consumed after cancellation intent.
                # Availability must be checked against a future execution trace.
    return interaction
