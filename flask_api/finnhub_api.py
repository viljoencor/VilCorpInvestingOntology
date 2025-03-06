# finnhub_api.py
import os
import requests
import json
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

FINNHUB_API_KEY = os.environ.get("FINNHUB_API_KEY", "cv4aevhr01qn2ga92l9gcv4aevhr01qn2ga92la0")
WIKIDATA_ENDPOINT = "https://query.wikidata.org/sparql"

@app.route('/finnhub-data', methods=['GET'])
def get_finnhub_data():
    """
    Example endpoint that fetches:
    - Company Profile
    - Financials
    - SEC Filings
    - Insider Transactions / Institutional Holdings (instead of Ownership)
    - Company News
    plus optional Wikidata enrichment
    for the given ticker.
    """
    ticker = request.args.get("ticker")
    if not ticker:
        return jsonify({"error": "Missing 'ticker' parameter"}), 400

    profile_data = fetch_company_profile(ticker)
    financials_data = fetch_financials(ticker)
    sec_filings_data = fetch_sec_filings(ticker)
    insider_data = fetch_insider(ticker)  # Replacing fetch_ownership
    news_data = fetch_company_news(ticker)

    # Optional: Wikidata Enrichment (by company name if available)
    wikidata_data = {}
    if profile_data and "name" in profile_data:
        wikidata_data = fetch_wikidata(profile_data["name"])

    return jsonify({
        "profile": profile_data,
        "financials": financials_data,
        "secFilings": sec_filings_data,
        "insider": insider_data,  # New key for insider transactions / institutional holdings
        "news": news_data,
        "wikidata": wikidata_data
    })

def fetch_company_profile(ticker):
    """Fetch company profile from Finnhub."""
    url = f"https://finnhub.io/api/v1/stock/profile2?symbol={ticker}&token={FINNHUB_API_KEY}"
    r = requests.get(url)
    if r.status_code == 200:
        return r.json()
    return {"error": f"Profile not found for {ticker}"}

def fetch_financials(ticker):
    """Fetch standardized or as-reported financials from Finnhub."""
    url = f"https://finnhub.io/api/v1/stock/financials-reported?symbol={ticker}&token={FINNHUB_API_KEY}"
    r = requests.get(url)
    if r.status_code == 200:
        return r.json()
    return {"error": f"Financials not found for {ticker}"}

def fetch_sec_filings(ticker):
    """Fetch SEC filings from Finnhub."""
    url = f"https://finnhub.io/api/v1/stock/filings?symbol={ticker}&token={FINNHUB_API_KEY}"
    r = requests.get(url)
    if r.status_code == 200:
        return r.json()
    return {"error": f"SEC filings not found for {ticker}"}

def fetch_insider(ticker):
    """Fetch insider transactions / institutional holdings from Finnhub."""
    url = f"https://finnhub.io/api/v1/stock/insider-transactions?symbol={ticker}&token={FINNHUB_API_KEY}"
    r = requests.get(url)
    if r.status_code == 200:
        return r.json()
    return {"error": f"Insider data not found for {ticker}"}

def fetch_company_news(ticker):
    """Fetch last 365 days of company news from Finnhub."""
    import datetime
    end_date = datetime.date.today()
    start_date = end_date - datetime.timedelta(days=365)
    url = f"https://finnhub.io/api/v1/company-news?symbol={ticker}&from={start_date}&to={end_date}&token={FINNHUB_API_KEY}"
    r = requests.get(url)
    if r.status_code == 200:
        return r.json()
    return {"error": f"Company news not found for {ticker}"}

def fetch_wikidata(company_name):
    """Optional: query Wikidata by company name for enrichment."""
    query = f"""
    SELECT ?item ?itemLabel ?headquartersLabel ?inception WHERE {{
      ?item rdfs:label "{company_name}"@en .
      OPTIONAL {{ ?item wdt:P159 ?headquarters. }}
      OPTIONAL {{ ?item wdt:P571 ?inception. }}
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
    }}
    LIMIT 1
    """
    url = WIKIDATA_ENDPOINT + "?format=json&query=" + requests.utils.quote(query)
    r = requests.get(url)
    if r.status_code == 200:
        data = r.json()
        if data["results"]["bindings"]:
            return data["results"]["bindings"][0]
    return {"note": f"No Wikidata match for {company_name}"}

if __name__ == "__main__":
    app.run(debug=True, port=5002)
