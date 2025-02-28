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
from rdflib import Graph, Namespace, Literal, URIRef
from rdflib.namespace import RDF, XSD
from SPARQLWrapper import SPARQLWrapper, JSON

EX = Namespace("http://example.org/finance#")

# Add the parent directory to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from data_etl_pipeline.sentiment_analysis import analyze_sentiments
from data_etl_pipeline.sparql_queries import (
    financial_metrics_query,
    news_sentiment_query,
    performance_overview_query
)
from data_etl_pipeline.data_extraction import StockPriceExtractor, NewsAPIExtractor, YahooFinanceExtractor
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




# @app.route('/financial-ontology', methods=['GET'])
# def get_financial_ontology():
#     try:
#         tickers = request.args.get('tickers', 'AAPL,TSLA,GOOG').split(',')
#         ontology_data = {"nodes": [], "edges": []}

#         for ticker in tickers:
#             stock = yf.Ticker(ticker)
#             company_name = stock.info.get("shortName", ticker)
#             pe_ratio = stock.info.get("trailingPE", "N/A")
#             revenue = stock.info.get("totalRevenue", "N/A")
#             market_cap = stock.info.get("marketCap", "N/A")
#             stock_price = stock.info.get("currentPrice", "N/A")
#             market_sentiment = "Positive" if stock.info.get("recommendationKey") == "buy" else "Neutral"

#             # Add company node
#             ontology_data["nodes"].append({"id": ticker, "label": ticker, "title": company_name, "shape": "box", "color": "#4caf50"})

#             # Add financial metric nodes
#             if pe_ratio != "N/A":
#                 ontology_data["nodes"].append({"id": f"{ticker}_pe", "label": "P/E Ratio", "title": f"P/E: {pe_ratio}", "color": "#ff9800"})
#                 ontology_data["edges"].append({"from": ticker, "to": f"{ticker}_pe", "label": "has metric"})

#             if revenue != "N/A":
#                 ontology_data["nodes"].append({"id": f"{ticker}_rev", "label": "Revenue", "title": f"Revenue: ${revenue:,}", "color": "#ffeb3b"})
#                 ontology_data["edges"].append({"from": ticker, "to": f"{ticker}_rev", "label": "has metric"})

#             if market_cap != "N/A":
#                 ontology_data["nodes"].append({"id": f"{ticker}_cap", "label": "Market Cap", "title": f"Market Cap: ${market_cap:,}", "color": "#2196f3"})
#                 ontology_data["edges"].append({"from": ticker, "to": f"{ticker}_cap", "label": "has market cap"})

#             if stock_price != "N/A":
#                 ontology_data["nodes"].append({"id": f"{ticker}_price", "label": "Stock Price", "title": f"Current Price: ${stock_price}", "color": "#00bcd4"})
#                 ontology_data["edges"].append({"from": ticker, "to": f"{ticker}_price", "label": "has stock price"})

#             # Sentiment node with color
#             sentiment_color = "#9c27b0" if market_sentiment == "Positive" else "#d32f2f"
#             ontology_data["nodes"].append({"id": f"{ticker}_sentiment", "label": "Market Sentiment", "title": market_sentiment, "color": sentiment_color})
#             ontology_data["edges"].append({"from": ticker, "to": f"{ticker}_sentiment", "label": "has sentiment"})

#         return jsonify(ontology_data)

#     except Exception as e:
#         return jsonify({"error": str(e)}), 500


# # Define RDF Namespace
# EX = Namespace("http://www.semanticweb.org/viljo/ontologies/2024/10/untitled-ontology-3/")

# # Function to generate RDF data dynamically
# def generate_rdf_for_stock(ticker, years):
#     g = Graph()

#     # Define company entity
#     company_uri = URIRef(EX + ticker)

#     # Fetch stock price data dynamically
#     stock = yf.Ticker(ticker)
#     historical_data = stock.history(period=f"{years}y")

#     if historical_data.empty:
#         return None  # No data available

#     for index, row in historical_data.iterrows():
#         stock_uri = URIRef(EX + f"{ticker}_Stock_{index.date()}")
#         g.add((stock_uri, RDF.type, EX.StockPrice))
#         g.add((stock_uri, EX.priceDate, Literal(index.date(), datatype=XSD.date)))
#         g.add((stock_uri, EX.priceValue, Literal(row["Close"], datatype=XSD.float)))
#         g.add((stock_uri, EX.currency, Literal("USD")))

#     # Fetch financial metrics dynamically
#     stock_info = stock.info
#     pe_ratio = stock_info.get("trailingPE", None)
#     revenue = stock_info.get("totalRevenue", None)

#     if pe_ratio:
#         pe_metric_uri = URIRef(EX + f"{ticker}_PE")
#         g.add((pe_metric_uri, RDF.type, EX.FinancialMetric))
#         g.add((pe_metric_uri, EX.metricName, Literal("P/E Ratio")))
#         g.add((pe_metric_uri, EX.metricValue, Literal(pe_ratio, datatype=XSD.float)))

#     if revenue:
#         revenue_metric_uri = URIRef(EX + f"{ticker}_Revenue")
#         g.add((revenue_metric_uri, RDF.type, EX.FinancialMetric))
#         g.add((revenue_metric_uri, EX.metricName, Literal("Total Revenue")))
#         g.add((revenue_metric_uri, EX.metricValue, Literal(revenue, datatype=XSD.float)))

#     return g.serialize(format="turtle")


# # Flask API Endpoint for SPARQL Querying
# @app.route('/sparql', methods=['POST'])
# def sparql_query():
#     try:
#         query = request.json.get("query")
#         if not query:
#             return jsonify({"error": "No query provided"}), 400

#         # Load RDF data into a local SPARQL endpoint
#         g = Graph()
#         g.parse(data=generate_rdf_for_stock("AAPL", 5), format="turtle")

#         # Execute SPARQL Query
#         result = g.query(query)
#         response = [{"metric": str(row.metric), "value": str(row.value)} for row in result]

#         return jsonify(response)
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500


# def store_rdf_in_fuseki(graph):
#     fuseki_url = "http://localhost:3030/rdf-finance/data"
#     headers = {"Content-Type": "text/turtle"}
#     response = requests.post(fuseki_url, data=graph.serialize(format="turtle"), headers=headers)
#     return response.status_code

# @app.route('/rdf-store', methods=['POST'])
# def store_rdf():
#     ticker = request.json.get("ticker")
#     years = request.json.get("years", 5)
    
#     rdf_data = generate_rdf_for_stock(ticker, years)
#     if rdf_data is None:
#         return jsonify({"error": "No data available"}), 404
    
#     status = store_rdf_in_fuseki(rdf_data)
#     return jsonify({"status": "success", "stored": status == 200})


# # ✅ Helper function to convert RDF Turtle to JSON for frontend visualization
# def parse_rdf_to_json(rdf_data):
#     g = rdflib.Graph()
#     g.parse(data=rdf_data, format="turtle")

#     json_data = {"nodes": [], "edges": []}
#     node_labels = {}

#     for subj, pred, obj in g:
#         subj_id = str(subj).split("/")[-1]  # Extract entity name
#         pred_label = str(pred).split("/")[-1]
#         obj_id = str(obj).split("/")[-1] if isinstance(obj, rdflib.URIRef) else str(obj)

#         # ✅ Add Nodes
#         if subj_id not in node_labels:
#             node_labels[subj_id] = {"id": subj_id, "label": subj_id, "color": "blue"}

#         # ✅ Append Financial Data to Node Labels
#         if pred_label in ["priceValue", "metricValue"]:
#             node_labels[subj_id]["label"] += f"\n{pred_label}: {obj_id}"

#         # ✅ Create Edges (Links Between Data)
#         if isinstance(obj, rdflib.URIRef):
#             json_data["edges"].append({"from": subj_id, "to": obj_id, "label": pred_label})

#     json_data["nodes"] = list(node_labels.values())
#     return json_data

# # ✅ Flask API Endpoint to Serve RDF as JSON
# @app.route("/rdf-stock-data", methods=["GET"])
# def get_rdf_stock_data():
#     try:
#         ticker = request.args.get("ticker")
#         years = int(request.args.get("years", 5))

#         # ✅ Simulated RDF Data (Replace with Dynamic Generation)
#         rdf_data = generate_rdf_for_stock(ticker, years)

#         if rdf_data is None:
#             return jsonify({"error": "No stock data available"}), 404

#         # ✅ Convert RDF to JSON for the frontend
#         json_data = parse_rdf_to_json(rdf_data)

#         # ✅ Return RDF or JSON based on request
#         if request.headers.get("Accept") == "application/json":
#             return jsonify(json_data)
#         else:
#             return rdf_data, 200, {"Content-Type": "text/turtle"}

#     except Exception as e:
#         return jsonify({"error": str(e)}), 500










if __name__ == '__main__':
    app.run(debug=True, port=5000)
