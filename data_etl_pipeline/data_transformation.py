from rdflib import Graph, Namespace, URIRef, Literal
from rdflib.namespace import RDF, XSD

VILCORP = Namespace("http://www.semanticweb.org/viljo/ontologies/2024/10/untitled-ontology-3/")

def create_rdf_graph(stock_data, news_data, financial_metrics, performance_data, company_name):
    """
    Converts stock, news, financial metrics, and performance overview data into RDF format.
    """
    graph = Graph()
    graph.bind("vilcorp", VILCORP)

    # Add company information
    company_uri = URIRef(f"{VILCORP}Company/{company_name.replace(' ', '_')}")
    graph.add((company_uri, RDF.type, VILCORP.Company))
    graph.add((company_uri, VILCORP.hasName, Literal(company_name, datatype=XSD.string)))

    # Add stock price data
    for _, row in stock_data.iterrows():
        stock_price_uri = URIRef(f"{VILCORP}StockPrice/{row['isRecordedOn'].date()}")

        graph.add((stock_price_uri, RDF.type, VILCORP.StockPrice))
        graph.add((stock_price_uri, VILCORP.isRecordedOn, Literal(row["isRecordedOn"].date(), datatype=XSD.date)))
        graph.add((stock_price_uri, VILCORP.priceValue, Literal(row["priceValue"], datatype=XSD.float)))
        graph.add((stock_price_uri, VILCORP.volume, Literal(row["volume"], datatype=XSD.integer)))

        # Link stock price to company
        graph.add((company_uri, VILCORP.hasStockPrice, stock_price_uri))

    # Add news article data
    for article in news_data:
        news_uri = URIRef(f"{VILCORP}NewsArticle/{hash(article['title'])}")
        graph.add((news_uri, RDF.type, VILCORP.NewsArticle))
        graph.add((news_uri, VILCORP.headline, Literal(article['title'], datatype=XSD.string)))

        # Add publication date if available
        if article.get("publicationDate"):
            graph.add((news_uri, VILCORP.publicationDate, Literal(article["publicationDate"], datatype=XSD.dateTime)))

        # Add sentiment score if available
        if 'sentimentScore' in article:
            graph.add((news_uri, VILCORP.hasSentiment, Literal(article['sentimentScore'], datatype=XSD.float)))

        # Link to company if mentioned
        if article.get("mentionsCompany"):
            graph.add((news_uri, VILCORP.mentionsCompany, company_uri))

    # Add financial metrics data
    for metric in financial_metrics:
        metric_uri = URIRef(f"{VILCORP}FinancialMetric/{metric['metricName'].replace(' ', '_')}")
        graph.add((metric_uri, RDF.type, VILCORP.FinancialMetric))
        graph.add((metric_uri, VILCORP.metricName, Literal(metric["metricName"], datatype=XSD.string)))
        graph.add((metric_uri, VILCORP.metricValue, Literal(metric["metricValue"], datatype=XSD.float)))
        graph.add((metric_uri, VILCORP.metricUnit, Literal(metric["metricUnit"], datatype=XSD.string)))
        graph.add((company_uri, VILCORP.hasFinancialMetric, metric_uri))

    # Add performance overview data
    for period, overview in performance_data.items():
        overview_uri = URIRef(f"{VILCORP}PerformanceOverview/{period.replace(' ', '_')}")
        graph.add((overview_uri, RDF.type, VILCORP.PerformanceOverview))
        graph.add((overview_uri, VILCORP.period, Literal(period, datatype=XSD.string)))
        graph.add((overview_uri, VILCORP.cpiReturn, Literal(overview["cpiReturn"], datatype=XSD.float)))
        graph.add((overview_uri, VILCORP.indexReturn, Literal(overview["indexReturn"], datatype=XSD.float)))

        # Link performance overview to company
        graph.add((overview_uri, VILCORP.company, company_uri))

    return graph
