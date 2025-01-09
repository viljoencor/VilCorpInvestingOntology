from flask import Flask, jsonify, request
from flask_cors import CORS
import sys
import os

# Add the parent directory to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from data_etl_pipeline.sparql_queries import (
    financial_metrics_query,
    news_sentiment_query,
    stock_price_query,
    performance_overview_query
)
from data_etl_pipeline.data_extraction import YahooFinanceExtractor
from data_etl_pipeline.graph_funcations import parse_rdf_file

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend-backend communication

@app.route('/rdf-graph-data', methods=['GET'])
def get_rdf_graph_data():
    try:
        rdf_file = "VilCorpInvestingOntology_data.rdf"
        graph_data = parse_rdf_file(rdf_file)
        return jsonify(graph_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/financial-metrics', methods=['GET'])
def get_financial_metrics():
    try:
        company_name = request.args.get('company', 'Capitec Bank')
        metrics = financial_metrics_query(company_name)
        return jsonify(metrics)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/news-insights', methods=['GET'])
def get_news_insights():
    try:
        # Get query parameters with default values
        company_name = request.args.get('company', 'Capitec Bank')
        min_sentiment = float(request.args.get('min_sentiment', -1.0))
        max_sentiment = float(request.args.get('max_sentiment', 1.0))

        # Execute the SPARQL query
        raw_news = news_sentiment_query(company_name, min_sentiment, max_sentiment)

        # Transform raw SPARQL query results into a list of articles
        if raw_news and 'results' in raw_news and 'bindings' in raw_news['results']:
            formatted_news = [
                {
                    "headline": item.get("headline", {}).get("value", "No headline"),
                    "publicationDate": item.get("publicationDate", {}).get("value", "No date"),
                    "sentimentScore": float(item.get("sentimentScore", {}).get("value", 0.0)),
                }
                for item in raw_news['results']['bindings']
            ]
        else:
            formatted_news = []  # Default to empty list if results are malformed or missing

        return jsonify(formatted_news)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/stock-prices', methods=['GET'])
def get_stock_prices():
    try:
        start_date = request.args.get('start_date', '2024-11-01')
        end_date = request.args.get('end_date', '2024-11-30')
        stock_prices = stock_price_query(start_date, end_date)
        return jsonify(stock_prices)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/comparative-analysis', methods=['GET'])
def get_comparative_analysis():
    try:
        # Mock list of companies for comparison
        companies = ["Capitec Bank", "Standard Bank", "FirstRand Bank"]

        # Fetch financial metrics for each company
        comparison_data = []
        for company in companies:
            metrics = financial_metrics_query(company)  # Assuming this fetches financial metrics
            if metrics and 'results' in metrics and 'bindings' in metrics['results']:
                # Parse metrics for PE Ratio and ROE
                pe_ratio = next(
                    (float(item['metricValue']['value'])
                     for item in metrics['results']['bindings']
                     if item['metricName']['value'] == 'PE Ratio'),
                    None
                )
                roe = next(
                    (float(item['metricValue']['value'])
                     for item in metrics['results']['bindings']
                     if item['metricName']['value'] == 'ROE'),
                    None
                )

                # Add to comparison data
                comparison_data.append({
                    "company": company,
                    "peRatio": pe_ratio,
                    "roe": roe
                })

        return jsonify(comparison_data)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/performance-overview', methods=['GET'])
def get_performance_overview():
    try:
        # Fetch the company name from query parameters
        company_name = request.args.get('company', 'Capitec Bank')

        # Query the SPARQL endpoint
        raw_performance_data = performance_overview_query(company_name)

        # Transform SPARQL results into structured JSON
        if raw_performance_data and 'results' in raw_performance_data and 'bindings' in raw_performance_data['results']:
            formatted_performance_data = {
                item['period']['value']: {
                    "CPI.JO Return": item['cpiReturn']['value'],
                    "All Share Index Return": item['indexReturn']['value']
                }
                for item in raw_performance_data['results']['bindings']
            }
        else:
            formatted_performance_data = {}

        return jsonify(formatted_performance_data)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/financial-data', methods=['GET'])
def get_financial_data():
    try:
        # Initialize the extractor with your chromedriver path
        extractor = YahooFinanceExtractor(driver_path="C:/chromedriver-win64/chromedriver.exe")

        # Specify the Yahoo Finance financials URL
        url = "https://finance.yahoo.com/quote/CPI.JO/financials/"
        
        # Scrape financial data
        financial_data_df = extractor.scrape_yahoo_financials(url)

        # Convert the DataFrame to JSON format for the frontend
        financial_data_json = financial_data_df.reset_index().to_dict(orient='records')
        return jsonify(financial_data_json)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
