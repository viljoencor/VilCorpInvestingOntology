import requests
from bs4 import BeautifulSoup
import yfinance as yf
import pandas as pd
from rdflib import Graph, Namespace, URIRef, Literal
from rdflib.namespace import RDF, XSD

# Namespace for RDF
VILCORP = Namespace("http://www.semanticweb.org/viljo/ontologies/2024/10/untitled-ontology-3/")

# Scraper to Extract Financial Statement Data
def scrape_financial_statements(url):
    """
    Scrapes financial data (e.g., EPS, Net Income, Shareholders' Equity) from the company's investor relations page.
    Args:
        url (str): URL of the investor relations page.
    Returns:
        dict: Extracted financial metrics.
    """
    response = requests.get(url)
    soup = BeautifulSoup(response.content, "html.parser")

    # Example: Locate specific financial metrics (adjust selectors as needed)
    eps = float(soup.find("div", {"id": "eps"}).text.strip())
    net_income = float(soup.find("div", {"id": "net_income"}).text.strip().replace(",", ""))
    equity = float(soup.find("div", {"id": "equity"}).text.strip().replace(",", ""))

    return {
        "eps": eps,
        "net_income": net_income,
        "equity": equity,
    }

# Fetch Stock Prices
def fetch_stock_prices(ticker, start_date, end_date):
    """
    Fetches stock price data using Yahoo Finance.
    Args:
        ticker (str): Stock ticker.
        start_date (str): Start date for fetching data.
        end_date (str): End date for fetching data.
    Returns:
        pd.DataFrame: Stock price data.
    """
    stock = yf.Ticker(ticker)
    return stock.history(start=start_date, end=end_date)

# Calculate Financial Metrics
def calculate_metrics(stock_data, financial_data):
    """
    Calculates financial metrics like PE Ratio and ROE.
    Args:
        stock_data (pd.DataFrame): Stock price data.
        financial_data (dict): Extracted financial data.
    Returns:
        list: Calculated financial metrics.
    """
    latest_price = stock_data["Close"].iloc[-1]
    eps = financial_data["eps"]
    net_income = financial_data["net_income"]
    equity = financial_data["equity"]

    metrics = [
        {"metricName": "PE Ratio", "metricValue": latest_price / eps, "metricUnit": ""},
        {"metricName": "ROE", "metricValue": (net_income / equity) * 100, "metricUnit": "%"},
    ]
    return metrics

