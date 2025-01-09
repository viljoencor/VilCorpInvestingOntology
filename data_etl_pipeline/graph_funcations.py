from rdflib import Graph

def parse_rdf_file(rdf_file):
    # Load the RDF graph
    graph = Graph()
    graph.parse(rdf_file, format='xml')

    nodes = []
    edges = []

    for subj, pred, obj in graph:
        # Add subject and object as nodes
        nodes.append({"id": str(subj), "label": subj.split("/")[-1]})
        nodes.append({"id": str(obj), "label": obj.split("/")[-1]})

        # Add the predicate as an edge
        edges.append({"from": str(subj), "to": str(obj), "label": pred.split("/")[-1]})

    # Deduplicate nodes
    nodes = {node["id"]: node for node in nodes}.values()

    return {"nodes": list(nodes), "edges": edges}
