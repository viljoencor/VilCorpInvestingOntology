from data_etl_pipeline.sparql_queries import fetch_wikidata_id
from data_etl_pipeline.graph_funcations import enhance_rdf_with_links



# Input data
company_name = "Google"

# Fetch Wikidata ID
wikidata_id = fetch_wikidata_id(company_name)
print(f"Wikidata ID for {company_name}: {wikidata_id}")

# Create RDF with external links
rdf_graph = create_rdf_graph_with_links(stock_data, news_data, financial_metrics, performance_data, company_name)

# Save and validate RDF
rdf_graph.serialize(destination="enhanced_graph.rdf", format="xml")
validate_rdf_file("enhanced_graph.rdf")
