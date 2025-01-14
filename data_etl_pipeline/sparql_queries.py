import requests
import pandas as pd

# Configuration
FUSEKI_URL = "http://localhost:3030"
DATASET_NAME = "vilcorp_data"

def execute_sparql_query(query):
    headers = {'Content-Type': 'application/sparql-query'}
    response = requests.post(
        f"{FUSEKI_URL}/{DATASET_NAME}/query",
        data=query,
        headers=headers
    )
    if response.status_code == 200:
        try:
            return response.json()
        except ValueError:
            raise ValueError("Failed to parse SPARQL response as JSON.")
    else:
        raise Exception(f"SPARQL query failed: {response.status_code}\n{response.text}")

def financial_metrics_query(company_name):
    query = f"""
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX vilcorp: <http://www.semanticweb.org/viljo/ontologies/2024/10/untitled-ontology-3/>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

    SELECT ?metricName ?metricValue ?metricUnit
    WHERE {{
        ?company rdf:type vilcorp:Company ;
                vilcorp:hasName "{company_name}" ;
                vilcorp:hasFinancialMetric ?metric .
        ?metric vilcorp:metricName ?metricName ;
                vilcorp:metricValue ?metricValue ;
                vilcorp:metricUnit ?metricUnit .
    }}
    """
    return execute_sparql_query(query)

def news_sentiment_query(company_name, min_sentiment=-1.0, max_sentiment=1.0):
    query = f"""
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX vilcorp: <http://www.semanticweb.org/viljo/ontologies/2024/10/untitled-ontology-3/>
    SELECT ?headline ?publicationDate ?sentimentScore ?company
    WHERE {{
        ?news a vilcorp:NewsArticle ;
              vilcorp:headline ?headline ;
              vilcorp:hasSentiment ?sentimentScore .
        FILTER (?sentimentScore >= {min_sentiment} && ?sentimentScore <= {max_sentiment})
    }}
    """
    result = execute_sparql_query(query)
    
    # Validate the output
    if not isinstance(result, dict):
        raise ValueError("SPARQL query did not return a valid JSON object.")
    
    return result


def stock_price_query(start_date, end_date):
    """
    Fetches stock price data over a specific date range.
    """
    query = f"""
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX vilcorp: <http://www.semanticweb.org/viljo/ontologies/2024/10/untitled-ontology-3/>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    
    SELECT ?date ?price ?volume
    WHERE {{
        ?stock a vilcorp:StockPrice ;
               vilcorp:isRecordedOn ?date ;
               vilcorp:priceValue ?price ;
               vilcorp:volume ?volume
    }}
    ORDER BY ?date
    """
    return execute_sparql_query(query)

def performance_overview_query(company_name):
    query = f"""
    PREFIX vilcorp: <http://www.semanticweb.org/viljo/ontologies/2024/10/untitled-ontology-3/>
    SELECT ?index ?period ?cpiReturn ?indexReturn
    WHERE {{
        ?overview vilcorp:company ?company ;
                  vilcorp:period ?period ;
                  vilcorp:cpiReturn ?cpiReturn ;
                  vilcorp:indexReturn ?indexReturn .
    }}
    """
    return execute_sparql_query(query)

# Utility function to pretty-print results
def print_results(query_results, columns):
    """
    Prints query results in a tabular format.
    
    Args:
        query_results (dict): JSON response from the SPARQL endpoint.
        columns (list): Column names to extract from the results.
    """
    if query_results.get("results", {}).get("bindings"):
        data = [
            {col: row[col]["value"] for col in columns if col in row}
            for row in query_results["results"]["bindings"]
        ]
        df = pd.DataFrame(data)
        print(df)
    else:
        print("No results found.")

# Example Usage
if __name__ == "__main__":
    try:
        # Financial Metrics Query
        company = "Capitec Bank"
        print(f"Financial Metrics for {company}:")
        metrics = financial_metrics_query(company)
        print_results(metrics, ["metricName", "metricValue", "metricUnit"])

        # News Sentiment Query
        print(f"\nNews Sentiment for {company}:")
        sentiment = news_sentiment_query(company, min_sentiment=0.0)
        print_results(sentiment, ["headline", "publicationDate", "sentimentScore"])

        # Stock Price Query
        start_date = "2024-11-05"
        end_date = "2024-11-15"
        print(f"\nStock Prices between {start_date} and {end_date}:")
        stock_prices = stock_price_query(start_date, end_date)
        print_results(stock_prices, ["date", "price", "volume"])

        # Performance Overview Query
        print(f"\nPerformance Overview for {company}:")
        performance = performance_overview_query(company)
        print_results(performance, ["period", "cpiReturn", "indexReturn"])

    except Exception as e:
        print(f"Error: {e}")