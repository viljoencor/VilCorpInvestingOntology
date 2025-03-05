from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import plotly
import rdflib
import requests
import yfinance as yf
from sklearn.linear_model import LinearRegression
import numpy as np
import sys
import os
from datetime import datetime, timedelta
from sklearn.preprocessing import PolynomialFeatures
from sklearn.pipeline import make_pipeline
import matplotlib.pyplot as plt
import plotly.graph_objects as go
import json
from rdflib import Graph, Namespace
from textblob import TextBlob

from SPARQLWrapper import SPARQLWrapper, JSON

# Add the parent directory to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from data_etl_pipeline.graph_funcations import parse_rdf_file
from data_etl_pipeline.sparql_queries import (
    financial_metrics_query
)
from data_etl_pipeline.data_extraction import StockPriceExtractor, NewsAPIExtractor, YahooFinanceExtractor
from data_etl_pipeline.generate_rdf import generate_rdf_for_stock 

app = Flask(__name__)
CORS(app)

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
        return jsonify({"error": str(e)}), 500
  
@app.route('/stock-prices/dynamic', methods=['GET'])
def get_dynamic_stock_prices():
    try:
        ticker = request.args.get('ticker')
        period = request.args.get('period', '1y')  # Default to 1 Year

        if not ticker:
            return jsonify({"error": "Missing required parameter: 'ticker'."}), 400

        stock = yf.Ticker(ticker)
        historical_data = stock.history(period=period)

        if historical_data.empty:
            return jsonify({"error": f"No stock price data found for {ticker}."}), 404

        # Reset index and rename columns
        historical_data.reset_index(inplace=True)
        historical_data.rename(columns={"Date": "isRecordedOn", "Close": "priceValue"}, inplace=True)

        print("DEBUG: Stock Price Data", historical_data.head())  # 🚀 Debug Print

        return jsonify(historical_data[["isRecordedOn", "priceValue"]].to_dict(orient="records"))

    except Exception as e:
        print("ERROR:", e)  # 🚀 Debug Print
        return jsonify({'error': str(e)}), 500

def clean_news_articles(news_data, company_name):
    if not isinstance(news_data, list):
        raise ValueError("Expected a list of news articles.")

    unique_articles = {article['title']: article for article in news_data if isinstance(article, dict)}
    for article in unique_articles.values():
        article['title'] = article.get('title', '').strip()
        article['mentionsCompany'] = company_name if company_name.lower() in article['title'].lower() else None
        article['sentimentScore'] = TextBlob(article['title']).sentiment.polarity

    return list(unique_articles.values())

@app.route('/run-pipeline', methods=['POST'])
def run_pipeline():
    try:
        data = request.json
        required_fields = ['company_name', 'ticker', 'start_date', 'end_date']
        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            return jsonify({"error": f"Missing required fields: {', '.join(missing_fields)}"}), 400

        company_name = data['company_name']
        ticker = data['ticker']
        start_date = data['start_date']
        end_date = data['end_date']

        # ✅ Fetch stock prices (Ensures it returns a DataFrame)
        stock_extractor = StockPriceExtractor(ticker, start_date, end_date)
        stock_prices = stock_extractor.fetch_stock_prices()

        # ✅ Debugging Print
        print(f"DEBUG: stock_prices type: {type(stock_prices)}")

        # ✅ Ensure stock_prices is a DataFrame
        if not isinstance(stock_prices, pd.DataFrame):
            print("🚨 ERROR: Expected DataFrame but got:", type(stock_prices))
            return jsonify({"error": "Internal Server Error: Stock Prices Data Issue"}), 500

        # ✅ Fix potential list indexing error
        if "isRecordedOn" in stock_prices:
            stock_prices["isRecordedOn"] = pd.to_datetime(stock_prices["isRecordedOn"]).dt.tz_localize(None)

        # ✅ Fetch news articles
        news_extractor = NewsAPIExtractor(api_key="d745b20dc64046fb9e52cc8e407427b2", company=company_name, start_date=start_date, end_date=end_date)
        news_articles = clean_news_articles(news_extractor.fetch_news_articles(), company_name)

        # ✅ Fetch financial metrics
        yahoo_extractor = YahooFinanceExtractor(ticker)
        financial_metrics = yahoo_extractor.fetch_financial_metrics()

        # ✅ Fetch performance overview
        performance_overview = yahoo_extractor.fetch_performance_overview()

        return jsonify({
            "stock_prices": stock_prices.to_dict(orient="records"),  # ✅ Always return list
            "news_insights": news_articles,
            "financial_metrics": financial_metrics,
            "performance_overview": performance_overview
        })
    except Exception as e:
        print(f"ERROR: {str(e)}")  # Debugging print
        return jsonify({"error": str(e)}), 500

@app.route('/financial-statistics', methods=['GET'])
def get_financial_statistics():
    try:
        ticker = request.args.get('ticker')
        if not ticker:
            return jsonify({"error": "Missing 'ticker' parameter."}), 400

        # Use the YahooFinanceExtractor to fetch financial statistics
        extractor = YahooFinanceExtractor(ticker)
        financial_statistics = extractor.fetch_financial_statistics()

        return jsonify(financial_statistics)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/predict-stock-prices/linear', methods=['GET'])
def predict_stock_prices_linear():
    try:
        ticker = request.args.get('ticker')
        days = int(request.args.get('days', 365))
        end_date = request.args.get('end_date')

        if not ticker:
            return jsonify({"error": "Missing required parameter: 'ticker'."}), 400

        if not end_date:
            end_date = datetime.today().strftime('%Y-%m-%d')

        start_date = (datetime.strptime(end_date, '%Y-%m-%d') - timedelta(days=365 * 10)).strftime('%Y-%m-%d')

        stock = yf.Ticker(ticker)
        historical_data = stock.history(start=start_date, end=end_date)

        if historical_data.empty:
            return jsonify({"error": f"No stock price data found for {ticker}."}), 404

        historical_data.reset_index(inplace=True)
        historical_data['days_since_start'] = (historical_data['Date'] - historical_data['Date'].min()).dt.days
        X = historical_data[['days_since_start']]
        y = historical_data['Close']

        model = LinearRegression()
        model.fit(X, y)

        future_dates = pd.DataFrame({'days_since_start': [(X['days_since_start'].max() + i) for i in range(1, days + 1)]})
        predicted_prices = model.predict(future_dates[['days_since_start']])

        predictions = [{
            "date": (datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=i)).strftime('%Y-%m-%d'),
            "predicted_price": round(predicted_prices[i], 2)
        } for i in range(len(predicted_prices))]

        # ✅ Create a more engaging Plotly figure
        fig = go.Figure()

        # 📌 Add historical stock prices
        fig.add_trace(go.Scatter(
            x=historical_data['Date'],
            y=historical_data['Close'],
            mode="lines",
            name="Historical Prices",
            line=dict(color="blue", width=2),
            hovertemplate="Date: %{x} <br>Price: $%{y}"
        ))

        # 📌 Add predicted prices with confidence band
        fig.add_trace(go.Scatter(
            x=[datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=i) for i in range(1, days + 1)],
            y=predicted_prices,
            mode="lines",
            name="Predicted Prices",
            line=dict(color="red", width=3, dash="dash"),
            hovertemplate="Date: %{x} <br>Predicted Price: $%{y}"
        ))

        # 📌 Add confidence interval (±5% margin)
        lower_bound = predicted_prices * 0.95
        upper_bound = predicted_prices * 1.05
        fig.add_trace(go.Scatter(
            x=[datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=i) for i in range(1, days + 1)],
            y=upper_bound,
            mode="lines",
            fill="tonexty",
            name="Upper Confidence",
            line=dict(color="rgba(255, 0, 0, 0.3)"),
            hoverinfo="skip"
        ))
        fig.add_trace(go.Scatter(
            x=[datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=i) for i in range(1, days + 1)],
            y=lower_bound,
            mode="lines",
            fill="tonexty",
            name="Lower Confidence",
            line=dict(color="rgba(255, 0, 0, 0.3)"),
            hoverinfo="skip"
        ))

        # 🎨 Enhance graph layout
        fig.update_layout(
            title=f"Stock Price Prediction for {ticker} (Linear Regression)",
            xaxis_title="Time",
            yaxis_title="Stock Price ($)",
            template="plotly_dark",
            hovermode="x unified",
            showlegend=True,
        )

        plot_data_json = json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)

        return jsonify({"status": "success", "predictions": predictions, "plot_data": plot_data_json})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/predict-stock-prices/polynomial', methods=['GET'])
def predict_stock_prices_polynomial():
    try:
        ticker = request.args.get('ticker')
        days = int(request.args.get('days', 365))
        end_date = request.args.get('end_date')

        if not ticker:
            return jsonify({"error": "Missing required parameter: 'ticker'."}), 400

        if not end_date:
            end_date = datetime.today().strftime('%Y-%m-%d')

        start_date = (datetime.strptime(end_date, '%Y-%m-%d') - timedelta(days=365 * 5)).strftime('%Y-%m-%d')

        stock = yf.Ticker(ticker)
        historical_data = stock.history(start=start_date, end=end_date)

        if historical_data.empty:
            return jsonify({"error": f"No stock price data found for {ticker}."}), 404

        historical_data.reset_index(inplace=True)
        historical_data['days_since_start'] = (historical_data['Date'] - historical_data['Date'].min()).dt.days
        X = historical_data[['days_since_start']]
        y = historical_data['Close']

        # ✅ Train Polynomial Regression Model (Degree = 3 for flexibility)
        poly_model = make_pipeline(PolynomialFeatures(degree=3), LinearRegression())
        poly_model.fit(X, y)

        # ✅ Predict future prices
        future_dates = pd.DataFrame({'days_since_start': [(X['days_since_start'].max() + i) for i in range(1, days + 1)]})
        predicted_prices = poly_model.predict(future_dates[['days_since_start']])

        predictions = [{"date": (datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=i)).strftime('%Y-%m-%d'),
                        "predicted_price": round(predicted_prices[i], 2)} for i in range(len(predicted_prices))]

        # ✅ Create an engaging Plotly figure
        fig = go.Figure()

        # 📌 Add historical stock prices
        fig.add_trace(go.Scatter(
            x=historical_data['Date'],
            y=historical_data['Close'],
            mode="lines",
            name="Historical Prices",
            line=dict(color="blue", width=2),
            hovertemplate="Date: %{x} <br>Price: $%{y}"
        ))

        # 📌 Add predicted prices with confidence bands
        fig.add_trace(go.Scatter(
            x=[datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=i) for i in range(1, days + 1)],
            y=predicted_prices,
            mode="lines",
            name="Predicted Prices",
            line=dict(color="orange", width=3, dash="dash"),
            hovertemplate="Date: %{x} <br>Predicted Price: $%{y}"
        ))

        # 📌 Add confidence interval (±5% margin)
        lower_bound = predicted_prices * 0.95
        upper_bound = predicted_prices * 1.05
        fig.add_trace(go.Scatter(
            x=[datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=i) for i in range(1, days + 1)],
            y=upper_bound,
            mode="lines",
            fill="tonexty",
            name="Upper Confidence",
            line=dict(color="rgba(255, 140, 0, 0.3)"),
            hoverinfo="skip"
        ))
        fig.add_trace(go.Scatter(
            x=[datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=i) for i in range(1, days + 1)],
            y=lower_bound,
            mode="lines",
            fill="tonexty",
            name="Lower Confidence",
            line=dict(color="rgba(255, 140, 0, 0.3)"),
            hoverinfo="skip"
        ))

        # 🎨 Enhance graph layout
        fig.update_layout(
            title=f"Stock Price Prediction for {ticker} (Polynomial Regression)",
            xaxis_title="Time",
            yaxis_title="Stock Price ($)",
            template="plotly_dark",
            hovermode="x unified",
            showlegend=True,
        )

        plot_data_json = json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)

        return jsonify({
            "status": "success",
            "predictions": predictions,
            "plot_data": plot_data_json  # 🔥 Ensure plot_data is always included
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/predict-stock-prices/monte-carlo', methods=['GET'])
def monte_carlo_simulation():
    ticker = request.args.get("ticker")
    years = request.args.get("years", type=int)

    if not ticker or not years:
        return jsonify({"error": "Missing 'ticker' or 'years' parameter."}), 400

    # Fetch the latest stock price
    stock = yf.Ticker(ticker)
    data = stock.history(period="5y")["Close"]

    if data.empty:
        return jsonify({"error": "No historical data available for simulation."})

    current_price = round(data.iloc[-1], 2)  # Get latest closing price

    # Simulation Parameters
    np.random.seed(42)
    simulations = 1000
    T = years * 252  # Trading days in a year
    mu, sigma = data.pct_change().dropna().mean(), data.pct_change().dropna().std()

    # Monte Carlo Simulation
    price_paths = np.zeros((T, simulations))
    price_paths[0] = current_price

    for t in range(1, T):
        random_shocks = np.random.normal(loc=mu, scale=sigma, size=simulations)
        price_paths[t] = price_paths[t - 1] * (1 + random_shocks)

    # Compute percentiles
    percentiles = np.percentile(price_paths, [5, 50, 95], axis=1)
    expected_price = round(percentiles[1, -1], 2)
    price_range = [round(percentiles[0, -1], 2), round(percentiles[2, -1], 2)]

    # Create Plotly graph JSON
    fig = go.Figure()
    for i in range(10):
        fig.add_trace(go.Scatter(
            x=list(range(T)),
            y=price_paths[:, i],
            mode="lines",
            opacity=0.3,
            name=f"Possible Stock Price Trajectory {i+1}"  # Renamed traces
        ))

    fig.update_layout(
        title=f"Monte Carlo Simulation for {ticker}",
        xaxis_title="Trading Days",
        yaxis_title="Stock Price",
        template="plotly_dark"
    )

    return jsonify({
        "ticker": ticker,
        "current_price": current_price,  # Added current price
        "expected_price": expected_price,
        "price_range": price_range,
        "plot_data": fig.to_json()
    })

@app.route('/investment-insights', methods=['POST'])
def investment_insights():
    try:
        data = request.json
        ticker = data.get("ticker")

        if not ticker:
            return jsonify({"error": "Missing 'ticker' parameter"}), 400

        query = f"""
        PREFIX ex: <http://example.org/finance#>

        SELECT ?metricName ?metricValue
        WHERE {{
            ?company a ex:Company ;
                     ex:hasTicker "{ticker}" ;
                     ex:hasFinancialMetric ?metric .

            ?metric ex:metricName ?metricName ;
                    ex:metricValue ?metricValue .
        }}
        """
        results = run_sparql_query(query)
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500





RDF_STORAGE_DIR = os.path.join(os.getcwd(), "rdf_data")
os.makedirs(RDF_STORAGE_DIR, exist_ok=True) 

def get_rdf_file_path(ticker, years):
    """Generate RDF file path for a given stock and duration"""
    return os.path.join(RDF_STORAGE_DIR, f"{ticker}_{years}y.ttl")

# Define Namespace for RDF Ontology
EX = Namespace("http://www.semanticweb.org/viljo/ontologies/2024/financial-ontology#")
XSD_NS = Namespace("http://www.w3.org/2001/XMLSchema#")

# Apache Fuseki Endpoint
FUSEKI_ENDPOINT = "http://localhost:3030/financial-data"

# Load RDF Graph for Querying
rdf_graph = Graph()
rdf_graph.parse("ontology/financial_ontology.ttl", format="turtle")

@app.route('/rdf-graph-data', methods=['GET'])
def get_rdf_graph_data():
    try:
        ticker = request.args.get("ticker")
        if not ticker:
            return jsonify({"error": "Missing ticker parameter"}), 400

        # You can optionally support a 'years' parameter. Here default is "5y"
        years = request.args.get("years", "5y")
        rdf_file = os.path.join(RDF_STORAGE_DIR, f"{ticker}_{years}.ttl")
        
        if not os.path.exists(rdf_file):
            return jsonify({"error": f"RDF file for {ticker} not found at {rdf_file}"}), 404
        
        graph_data = parse_rdf_file(rdf_file)
        return jsonify(graph_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def store_rdf_in_fuseki(graph):
    """Uploads RDF data to Apache Fuseki."""
    headers = {"Content-Type": "text/turtle"}
    response = requests.post(f"{FUSEKI_ENDPOINT}/data", data=graph.serialize(format="turtle"), headers=headers)
    return response.status_code == 200

@app.route('/rdf-store', methods=['POST'])
def store_rdf():
    ticker = request.json.get("ticker")
    years = request.json.get("years", 5)
    
    rdf_data = generate_rdf_for_stock(ticker, years)
    if rdf_data is None:
        return jsonify({"error": "No data available"}), 404
    
    success = store_rdf_in_fuseki(rdf_data)
    return jsonify({"status": "success" if success else "failed"})


def run_sparql_query(query):
    """Executes a SPARQL query against the RDF knowledge graph."""
    try:
        qres = rdf_graph.query(query)
        results = []
        for row in qres:
            results.append({var: str(value) for var, value in zip(qres.vars, row)})
        return {"head": {"vars": list(qres.vars)}, "results": {"bindings": results}}
    except Exception as e:
        return {"error": str(e)}

@app.route('/rdf-stock-data', methods=['GET'])
def get_rdf_stock_data():
    ticker = request.args.get('ticker')
    years = int(request.args.get('years', 5))

    if not ticker:
        return jsonify({"error": "Missing 'ticker' parameter."}), 400

    rdf_file_path = get_rdf_file_path(ticker, years)

    if not os.path.exists(rdf_file_path):
        print(f"🚨 RDF for {ticker} ({years} years) not found. Generating RDF...")
        rdf_data = generate_rdf_for_stock(ticker, years)

        if rdf_data:
            with open(rdf_file_path, "w", encoding="utf-8") as rdf_file:
                rdf_file.write(rdf_data)
            print(f"✅ RDF saved at {rdf_file_path}")
        else:
            print(f"❌ Failed to generate RDF for {ticker}. Check logs for errors.")
            return jsonify({"error": f"Failed to generate RDF for {ticker}"}), 500

    # ✅ Load RDF Graph from file
    rdf_graph = rdflib.Graph()
    rdf_graph.parse(rdf_file_path, format="turtle")

    json_data = parse_rdf_to_json(rdf_graph)

    return jsonify(json_data)


def parse_rdf_to_json(rdf_graph):
    """Convert RDF Graph to JSON for frontend visualization"""
    json_data = {"nodes": [], "edges": []}
    node_labels = {}

    for subj, pred, obj in rdf_graph:
        subj_id = str(subj).split("/")[-1]  # Extract entity name
        pred_label = str(pred).split("/")[-1]
        obj_id = str(obj).split("/")[-1] if isinstance(obj, rdflib.URIRef) else str(obj)

        if subj_id not in node_labels:
            node_labels[subj_id] = {"id": subj_id, "label": subj_id, "color": "blue"}

        if pred_label in ["priceValue", "metricValue"]:
            node_labels[subj_id]["label"] += f"\n{pred_label}: {obj_id}"

        if isinstance(obj, rdflib.URIRef):
            json_data["edges"].append({"from": subj_id, "to": obj_id, "label": pred_label})

    json_data["nodes"] = list(node_labels.values())
    return json_data

@app.route('/financial-ontology', methods=['GET'])
def get_financial_ontology():
    
    try:
        tickers = request.args.get('tickers', 'AAPL,TSLA,GOOG').split(',')
        ontology_data = {"nodes": [], "edges": []}

        for ticker in tickers:
            stock = yf.Ticker(ticker)
            company_name = stock.info.get("shortName", ticker)
            pe_ratio = stock.info.get("trailingPE", "N/A")
            revenue = stock.info.get("totalRevenue", "N/A")
            market_cap = stock.info.get("marketCap", "N/A")
            stock_price = stock.info.get("currentPrice", "N/A")
            market_sentiment = "Positive" if stock.info.get("recommendationKey") == "buy" else "Neutral"

            # ✅ Add company node
            ontology_data["nodes"].append({"id": ticker, "label": ticker, "title": company_name, "shape": "box", "color": "#4caf50"})

            # ✅ Add financial metric nodes
            for metric, value in [("P/E Ratio", pe_ratio), ("Revenue", revenue), ("Market Cap", market_cap), ("Stock Price", stock_price)]:
                if value != "N/A":
                    ontology_data["nodes"].append({"id": f"{ticker}_{metric.replace(' ', '_')}", "label": metric, "title": f"{metric}: ${value}", "color": "#ff9800"})
                    ontology_data["edges"].append({"from": ticker, "to": f"{ticker}_{metric.replace(' ', '_')}", "label": "has metric"})

            # ✅ Sentiment node
            sentiment_color = "#9c27b0" if market_sentiment == "Positive" else "#d32f2f"
            ontology_data["nodes"].append({"id": f"{ticker}_sentiment", "label": "Market Sentiment", "title": market_sentiment, "color": sentiment_color})
            ontology_data["edges"].append({"from": ticker, "to": f"{ticker}_sentiment", "label": "has sentiment"})

        return jsonify(ontology_data)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


def load_rdf_graph():
    """Loads RDF Graph and ensures all necessary namespaces are bound."""
    g = Graph()
    g.bind("ex", EX)
    g.bind("xsd", XSD_NS)  # ✅ Explicitly bind xsd

    try:
        g.parse("ontology/financial_ontology.ttl", format="turtle")
        print("✅ RDF Graph Loaded Successfully!")
        return g
    except Exception as e:
        print(f"🚨 ERROR: {e}")
        return None
rdf_graph = load_rdf_graph()




# -----------------------------------------------
# 🔹 5. Flask App Runner
# -----------------------------------------------
if __name__ == '__main__':
    app.run(debug=True, port=5000)