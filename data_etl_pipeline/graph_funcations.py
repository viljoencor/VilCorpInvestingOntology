from rdflib import Graph
from rdflib import Graph, Namespace, URIRef
from rdflib.namespace import RDF, OWL

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

# Example Function to Add External Links
def enhance_rdf_with_links(graph, company_uri, external_id):
    """
    Enhances the RDF graph with external dataset links.
    """
    if not external_id:
        return graph  # Skip if no external ID is available

    wikidata_uri = URIRef(external_id)
    graph.add((company_uri, OWL.sameAs, wikidata_uri))
    return graph
