from rdflib import Graph

### 3. **Steps to Use**

# 1. **Validate RDF Syntax**:
#    - Run `rdf_validation.py`.
#    - Ensure the RDF file parses correctly and aligns with the ontology.

# 2. **Test SPARQL Queries**:
#    - Run `sparql_testing.py`.
#    - Verify that all queries return meaningful results.

# 3. **Iterate and Improve**:
#    - Refine your RDF graph and queries based on test outcomes.


def test_sparql_query(graph, query, description):
    """
    Test a SPARQL query on the given RDF graph.

    Args:
        graph (Graph): An rdflib Graph instance.
        query (str): SPARQL query string.
        description (str): Description of the test.

    Returns:
        None: Prints results or errors.
    """
    print(f"\nRunning Test: {description}")
    try:
        results = graph.query(query)
        for row in results:
            print(row)
        print(f"Test Passed: {description}")
    except Exception as e:
        print(f"Test Failed: {description}\nError: {e}")

if __name__ == "__main__":
    rdf_file = "VilCorpInvestingOntology_data.rdf"
    graph = Graph()
    graph.parse(rdf_file, format="xml")

    # Test 1: Fetch all news articles mentioning a specific company
    query1 = """
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX vilcorp: <http://www.semanticweb.org/viljo/ontologies/2024/10/untitled-ontology-3/>

    SELECT ?headline ?publicationDate
    WHERE {
        ?news rdf:type vilcorp:NewsArticle ;
              vilcorp:mentionsCompany "Google" ;
              vilcorp:headline ?headline ;
              vilcorp:publicationDate ?publicationDate .
    }
    """
    test_sparql_query(graph, query1, "Fetch all news articles mentioning Google")

    # Test 2: Fetch performance overview data
    query2 = """
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX vilcorp: <http://www.semanticweb.org/viljo/ontologies/2024/10/untitled-ontology-3/>

    SELECT ?period ?cpiReturn ?indexReturn
    WHERE {
        ?overview rdf:type vilcorp:PerformanceOverview ;
                  vilcorp:period ?period ;
                  vilcorp:cpiReturn ?cpiReturn ;
                  vilcorp:indexReturn ?indexReturn .
    }
    """
    test_sparql_query(graph, query2, "Fetch performance overview data")

    # Test 3: Fetch all stock prices
    query3 = """
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX vilcorp: <http://www.semanticweb.org/viljo/ontologies/2024/10/untitled-ontology-3/>

    SELECT ?date ?priceValue ?volume
    WHERE {
        ?stock rdf:type vilcorp:StockPrice ;
               vilcorp:isRecordedOn ?date ;
               vilcorp:priceValue ?priceValue ;
               vilcorp:volume ?volume .
    }
    ORDER BY ?date
    """
    test_sparql_query(graph, query3, "Fetch all stock prices")