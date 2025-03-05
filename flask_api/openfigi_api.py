# openfigi_api.py
import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

# OpenFIGI mapping endpoint and API key.
OPENFIGI_ENDPOINT = "https://api.openfigi.com/v3/mapping"
OPENFIGI_API_KEY = os.environ.get("OPENFIGI_API_KEY", "5e473043-727d-4ca6-9f23-30c471a854da")

@app.route('/openfigi', methods=['POST'])
def openfigi():
    data = request.get_json()
    ticker = data.get("ticker")
    exchCode = data.get("exchCode", "US")  # default exchange code
    if not ticker:
        return jsonify({"error": "Missing ticker parameter."}), 400

    headers = {
        "Content-Type": "application/json",
    }
    if OPENFIGI_API_KEY != "YOUR_API_KEY_HERE":
        headers["X-OPENFIGI-APIKEY"] = OPENFIGI_API_KEY

    # Prepare payload for mapping. OpenFIGI expects an array.
    payload = [{
        "idType": "TICKER",
        "idValue": ticker,
        "exchCode": exchCode
    }]

    response = requests.post(OPENFIGI_ENDPOINT, headers=headers, data=json.dumps(payload))
    if response.status_code != 200:
        return jsonify({"error": f"OpenFIGI API error: {response.text}"}), response.status_code

    mapping_results = response.json()  # Returns an array with mapping info
    if not mapping_results:
        return jsonify({"error": f"No data found for ticker {ticker}"}), 404

    return jsonify(mapping_results)

if __name__ == '__main__':
    app.run(debug=True, port=5002)
