from rdflib import Graph
from rdflib.namespace import RDF
from rdflib.util import guess_format

class RDFValidator:
    @staticmethod
    def validate_rdf_syntax(rdf_file):
        """
        Validate the RDF file syntax.

        Args:
            rdf_file (str): Path to the RDF file.

        Returns:
            bool: True if valid, raises an exception otherwise.
        """
        graph = Graph()
        rdf_format = guess_format(rdf_file)

        try:
            graph.parse(rdf_file, format=rdf_format)
            print(f"RDF Syntax Validation Passed for {rdf_file}")
            return True
        except Exception as e:
            raise ValueError(f"RDF Syntax Validation Failed: {e}")

    @staticmethod
    def validate_ontology_alignment(graph, ontology_file):
        """
        Validate that the RDF graph aligns with the provided ontology.

        Args:
            graph (Graph): An rdflib Graph instance.
            ontology_file (str): Path to the ontology file.

        Returns:
            None: Prints issues if any.
        """
        ontology = Graph()
        try:
            ontology.parse(ontology_file, format=guess_format(ontology_file))
            print("Ontology loaded successfully.")

            # Check that all classes and predicates in the RDF graph exist in the ontology
            missing_classes = []
            for s, p, o in graph:
                if (s, RDF.type, o) not in ontology:
                    missing_classes.append(o)

            if missing_classes:
                print("Missing Classes in Ontology:", missing_classes)
            else:
                print("All Classes Align with the Ontology.")
        except Exception as e:
            print(f"Ontology Validation Failed: {e}")

# Example Usage
if __name__ == "__main__":
    rdf_file = "VilCorpInvestingOntology_data.rdf"
    ontology_file = "vilcorp_ontology.rdf"

    validator = RDFValidator()
    validator.validate_rdf_syntax(rdf_file)

    graph = Graph()
    graph.parse(rdf_file, format=guess_format(rdf_file))

    validator.validate_ontology_alignment(graph, ontology_file)