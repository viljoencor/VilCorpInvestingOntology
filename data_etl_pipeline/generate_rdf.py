import rdflib
import yfinance as yf
from rdflib import Graph, Literal, Namespace, RDF, URIRef, XSD

EX = Namespace("http://www.semanticweb.org/viljo/ontologies/2024/financial-ontology#")
XSD_NS = Namespace("http://www.w3.org/2001/XMLSchema#")

def generate_rdf_for_stock(ticker, years=5):
    """Generate RDF representation of stock price and financial metrics"""
    try:
        stock = yf.Ticker(ticker)
        hist = stock.history(period=f"{years}y")
        info = stock.info

        g = Graph()
        g.bind("ex", EX)
        g.bind("xsd", XSD_NS)

        #  Create Company Entity
        company_uri = URIRef(EX[ticker])
        g.add((company_uri, RDF.type, EX.Company))
        g.add((company_uri, EX.ticker, Literal(ticker, datatype=XSD_NS.string)))
        g.add((company_uri, EX.companyName, Literal(info.get("longName", ticker), datatype=XSD_NS.string)))

        #  Financial Metrics
        metrics = {
            "Market Cap": info.get("marketCap"),
            "P/E Ratio": info.get("trailingPE"),
            "Revenue": info.get("totalRevenue"),
            "Debt/Equity": info.get("debtToEquity"),
        }

        for metric, value in metrics.items():
            if value is not None:
                sanitized_metric = metric.replace("/", "_").replace(" ", "_")  #  Fix special characters
                metric_uri = URIRef(EX[f"{ticker}_{sanitized_metric}"])
                g.add((metric_uri, RDF.type, EX.FinancialMetric))
                g.add((metric_uri, EX.metricName, Literal(metric, datatype=XSD_NS.string)))
                g.add((metric_uri, EX.metricValue, Literal(value, datatype=XSD_NS.float)))
                g.add((company_uri, EX.hasMetric, metric_uri))

        #  Stock Price Data
        for date, row in hist.iterrows():
            stock_price_uri = URIRef(EX[f"{ticker}_Stock_{date.date()}"])
            g.add((stock_price_uri, RDF.type, EX.StockPrice))
            g.add((stock_price_uri, EX.priceDate, Literal(date.date(), datatype=XSD_NS.date)))
            g.add((stock_price_uri, EX.priceValue, Literal(row["Close"], datatype=XSD_NS.float)))
            g.add((company_uri, EX.hasStockPrice, stock_price_uri))

        return g.serialize(format="turtle")

    except Exception as e:
        print(f"ERROR: {e}")
        return None

