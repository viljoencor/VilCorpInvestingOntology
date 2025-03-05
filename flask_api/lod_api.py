# lod_api.py
from flask import Flask, jsonify, request
from flask_cors import CORS
from SPARQLWrapper import SPARQLWrapper, JSON

app = Flask(__name__)
CORS(app)

WIKIDATA_ENDPOINT = "https://query.wikidata.org/sparql"

@app.route('/lod-data', methods=['GET'])
def lod_data():
    ticker = request.args.get('ticker')
    if not ticker:
        return jsonify({"error": "Missing 'ticker' parameter."}), 400

    sparql = SPARQLWrapper(WIKIDATA_ENDPOINT)
    # Using a regex filter for case-insensitive matching on ticker symbol (P249)
    query = f"""
    SELECT ?company ?companyLabel ?industryLabel ?foundingDate ?description WHERE {{
      ?company wdt:P249 ?tickerSymbol .
      FILTER(regex(?tickerSymbol, "^{ticker}$", "i"))
      OPTIONAL {{ ?company wdt:P452 ?industry. }}
      OPTIONAL {{ ?company wdt:P571 ?foundingDate. }}
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
      OPTIONAL {{
        ?company schema:description ?description.
        FILTER(LANG(?description) = "en")
      }}
    }}
    LIMIT 1
    """
    sparql.setQuery(query)
    sparql.setReturnFormat(JSON)
    results = sparql.query().convert()
    bindings = results.get("results", {}).get("bindings", [])
    if not bindings:
        return jsonify({"error": f"No data found for ticker {ticker}"}), 404

    data = bindings[0]
    company_data = {
        "company": data.get("company", {}).get("value"),
        "companyLabel": data.get("companyLabel", {}).get("value"),
        "industryLabel": data.get("industryLabel", {}).get("value") if "industryLabel" in data else None,
        "foundingDate": data.get("foundingDate", {}).get("value") if "foundingDate" in data else None,
        "description": data.get("description", {}).get("value") if "description" in data else None,
    }
    return jsonify(company_data)

if __name__ == '__main__':
    app.run(debug=True, port=5001)
