from flask import Flask, jsonify, request
from flask_cors import CORS
import sys
import os
import pandas as pd

# Add the parent directory to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from data_etl_pipeline.sentiment_analysis import analyze_sentiments
from data_etl_pipeline.sparql_queries import (
    financial_metrics_query,
    news_sentiment_query,
    performance_overview_query
)
from data_etl_pipeline.data_extraction import StockPriceExtractor, NewsAPIExtractor
from data_etl_pipeline.graph_funcations import parse_rdf_file
from data_etl_pipeline.data_cleaning import clean_stock_prices, clean_news_articles
from data_etl_pipeline.data_loading import upload_rdf_to_fuseki
from data_etl_pipeline.data_transformation import create_rdf_graph

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

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
        company_name = request.args.get('company')
        if not company_name:
            return jsonify({"error": "Missing 'company' parameter."}), 400
        metrics = financial_metrics_query(company_name)
        return jsonify(metrics)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/stock-prices', methods=['GET'])
def get_stock_prices():
    try:
        ticker = request.args.get('ticker')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')

        if not ticker or not start_date or not end_date:
            return jsonify({"error": "Missing required parameters: 'ticker', 'start_date', 'end_date'."}), 400

        extractor = StockPriceExtractor(ticker=ticker, start_date=start_date, end_date=end_date)
        stock_prices = extractor.fetch_stock_prices()

        # Convert DataFrame to a list of dictionaries
        if isinstance(stock_prices, pd.DataFrame):
            stock_prices = stock_prices.to_dict(orient='records')

        return jsonify(stock_prices)
    except Exception as e:
        return jsonify({'error': str(e)}), 500



@app.route('/run-pipeline', methods=['POST'])
def run_pipeline():
    try:
        data = request.json

        # Validate input fields
        required_fields = ['company_name', 'ticker', 'start_date', 'end_date']
        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            return jsonify({"error": f"Missing required fields: {', '.join(missing_fields)}"}), 400

        company_name = data['company_name']
        ticker = data['ticker']
        start_date = data['start_date']
        end_date = data['end_date']

        # Fetch stock prices
        stock_extractor = StockPriceExtractor(ticker, start_date, end_date)
        stock_prices = stock_extractor.fetch_stock_prices()
        stock_prices["isRecordedOn"] = stock_prices["isRecordedOn"].dt.tz_localize(None)

        # Fetch news articles
        news_extractor = NewsAPIExtractor(api_key="d745b20dc64046fb9e52cc8e407427b2", company=company_name, start_date=start_date, end_date=end_date)
        news_articles = clean_news_articles(news_extractor.fetch_news_articles(), company_name)

        # Fetch financial metrics
        financial_metrics = financial_metrics_query(company_name).get("results", {}).get("bindings", [])
        if not financial_metrics:
            print(f"No financial metrics found for company: {company_name}")

        # Fetch performance overview
        raw_performance = performance_overview_query(company_name)
        performance_overview = [
            {
                "period": binding["period"]["value"],
                "cpiReturn": float(binding["cpiReturn"]["value"]),
                "indexReturn": float(binding["indexReturn"]["value"])
            }
            for binding in raw_performance.get("results", {}).get("bindings", [])
        ]

        # Return the complete pipeline results
        return jsonify({
            "stock_prices": stock_prices.to_dict(orient="records"),
            "news_insights": news_articles,
            "financial_metrics": financial_metrics,
            "performance_overview": performance_overview
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
