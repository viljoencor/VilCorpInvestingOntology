from rdflib import Graph, Namespace, URIRef, Literal
from rdflib.namespace import RDF, XSD

VILCORP = Namespace("http://www.semanticweb.org/viljo/ontologies/2024/10/untitled-ontology-3/")

def create_rdf_graph(stock_data, news_data, financial_metrics, performance_data, company_name):
    graph = Graph()
    graph.bind("vilcorp", VILCORP)

    company_uri = URIRef(f"{VILCORP}Company/{company_name.replace(' ', '_')}")
    graph.add((company_uri, RDF.type, VILCORP.Company))
    graph.add((company_uri, VILCORP.hasName, Literal(company_name, datatype=XSD.string)))

    if stock_data is not None:
        for _, row in stock_data.iterrows():
            stock_price_uri = URIRef(f"{VILCORP}StockPrice/{row['isRecordedOn'].date()}")
            graph.add((stock_price_uri, RDF.type, VILCORP.StockPrice))
            graph.add((stock_price_uri, VILCORP.isRecordedOn, Literal(row["isRecordedOn"].date(), datatype=XSD.date)))
            graph.add((stock_price_uri, VILCORP.priceValue, Literal(row["priceValue"], datatype=XSD.float)))
            graph.add((stock_price_uri, VILCORP.volume, Literal(row["volume"], datatype=XSD.integer)))
            graph.add((company_uri, VILCORP.hasStockPrice, stock_price_uri))

    if news_data:
        for article in news_data:
            news_uri = URIRef(f"{VILCORP}NewsArticle/{hash(article['title'])}")
            graph.add((news_uri, RDF.type, VILCORP.NewsArticle))
            graph.add((news_uri, VILCORP.headline, Literal(article['title'], datatype=XSD.string)))
            graph.add((news_uri, VILCORP.publicationDate, Literal(article["publicationDate"], datatype=XSD.dateTime)))
            graph.add((news_uri, VILCORP.hasSentiment, Literal(article.get('sentimentScore', 0), datatype=XSD.float)))
            graph.add((news_uri, VILCORP.mentionsCompany, company_uri))

    if financial_metrics:
        for metric in financial_metrics:
            metric_uri = URIRef(f"{VILCORP}FinancialMetric/{metric['metricName'].replace(' ', '_')}")
            graph.add((metric_uri, RDF.type, VILCORP.FinancialMetric))
            graph.add((metric_uri, VILCORP.metricName, Literal(metric["metricName"], datatype=XSD.string)))
            graph.add((metric_uri, VILCORP.metricValue, Literal(metric["metricValue"], datatype=XSD.float)))
            graph.add((company_uri, VILCORP.hasFinancialMetric, metric_uri))

    return graph
