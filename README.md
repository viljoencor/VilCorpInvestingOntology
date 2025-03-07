# Linked Data Visualization for Company Evaluation

This project implements an interactive **Linked Data Visualization** tool to holistically evaluate companies by integrating financial metrics, performance overviews, news insights, and comparative analysis. The tool uses RDF-based ontologies and advanced visualization techniques to provide users with intuitive, actionable insights.

## **Project Overview**
The primary goal of this project is to create a platform that combines **Linked Data principles** with **clarity and simplicity** to allow users to:
- Evaluate a company's financial health.
- Analyze comparative performance metrics.
- Explore market-influencing news with sentiment analysis.
- Cross-reference data to uncover deeper insights.

By integrating data from various sources, such as financial reports, news articles, and stock market data, the tool offers a comprehensive understanding of a company's position in the market.

---

## **Features**
1. **Dynamic Linked Data Visualization**
   - Interactive graph-based visualization of companies, metrics, and news articles.
   - Two views:
     - **Simplified View**: High-level overview of relationships and key entities.
     - **Detailed View**: Comprehensive graph showing all RDF triples and relationships.

2. **Dynamic Filtering**
   - Filter nodes by categories:
     - Financial Metrics
     - Performance Overview
     - News Articles
     - Companies
   - Maintain relevant relationships while filtering.

3. **Performance Overview**
   - Visualize YTD, 1-Year, 3-Year, and 5-Year returns.
   - Includes benchmarks for comparative performance.

4. **News Sentiment Analysis**
   - Displays news articles linked to a company.
   - Includes sentiment scores and confidence levels.

5. **Comparative Analysis**
   - Compare financial metrics and returns for multiple companies.

6. **Interactive Features**
   - Color-coded nodes and edges for clarity.
   - Hover tooltips for detailed insights.
   - Expandable nodes for deeper exploration.

---

## **Technologies Used**
### **Frontend**
- **React**: Framework for building the UI.
- **vis-network**: Library for graph-based visualization.
- **D3.js**: For additional charting and visualizations.

### **Backend**
- **Flask**: API layer to serve SPARQL queries and handle data requests.
- **Apache Jena Fuseki**: Triplestore for storing and querying RDF triples.

### **Data Pipeline**
- **Python**: For data ingestion, transformation, and RDF triple generation.
- **RDFlib**: Library for working with RDF data.
- **FuzzyWuzzy**: For aligning entity names across datasets.

---

## **Project Structure**
```plaintext
VILCORPINVESTINGONTOLOGY/
├── data_etl_pipeline/
│   ├── data_extraction.py          # Extraction of stock prices, news articles, and financial metrics
│   ├── data_transformation.py      # Conversion of raw data into RDF graphs; enhancement with external links
│   ├── generate_rdf.py             # Generates RDF representations using yfinance and rdflib
│   ├── graph_functions.py          # Utilities for parsing RDF into nodes/edges for visualization
│   └── sparql_queries.py           # SPARQL queries for retrieving financial metrics, news sentiment, etc.
├── flask_api/
│   ├── app.py                      # Flask API backend serving multiple endpoints (e.g., predictions, RDF operations)
│   └── finnhub_api.py              # Endpoints to fetch and enrich Finnhub data, including news and SEC filings
├── front_end_app/                  # (Static assets if needed)
├── src/
│   ├── components/
│   │   ├── AnalysisPrediction.js     # Interactive prediction tool with Plotly charts
│   │   ├── ComparativeAnalysis.js    # Multi-tab investment analysis & pipeline input (also exported as PipelineInputForm)
│   │   ├── FinhubTabs.js             # Tabbed interface to explore Finnhub data via LinkedFinnhubExplorer
│   │   ├── InvestmentSummary.js      # Displays concise investment summaries with key metrics
│   │   ├── Learn.js                  # Educational module (placeholder)
│   │   ├── LinkedDataExplorer.js     # Interactive RDF graph visualization using vis-network
│   │   ├── LinkedFinhubExplorer.js   # Graph visualization focused on Finnhub data
│   │   ├── LoadingSpinner.js         # Reusable component for indicating loading states
│   │   ├── MonteCarloSimulation.js   # Runs Monte Carlo simulations; displays simulation results with Plotly
│   │   ├── PipelineInputForm.js      # Alternative pipeline interface for comprehensive investment analysis
│   │   └── StockPriceChart.js        # Renders dynamic stock price line charts using Recharts
│   ├── App.css
│   ├── App.js                        # Main application component with routing and navigation
│   └── index.js
├── package-lock.json
├── package.json
├── ontology/
│   └── financial_ontology.ttl        # RDF/Turtle file defining the financial ontology (Company, FinancialMetric, NewsArticle, StockPrice)
├── rdf_data/
│   └── GOOG_5y.ttl                   # Example RDF file for 5-year stock data
├── testing/
│   ├── graph_validation.py           # Tests for RDF graph parsing and visualization correctness
│   └── sparql_testing.py             # Tests for SPARQL query accuracy and performance
└── dependency_requirements.txt       # List of project dependencies
```

## Code Files Description
#### data_etl_pipeline/data_extraction.py: 
  Contains classes for extracting stock prices (using yfinance), news articles (via NewsApiClient), and financial metrics (via YahooFinanceExtractor). 

#### data_etl_pipeline/data_transformation.py: 
  Implements functions to create RDF graphs from stock, news, and financial data using rdflib, and includes support for external link enhancement. 

#### data_etl_pipeline/generate_rdf.py: 
  Generates an RDF representation of a stock's data (including financial metrics and historical stock prices) using yfinance and rdflib. 

#### data_etl_pipeline/graph_functions.py: 
  Provides utilities for parsing RDF files into nodes and edges for visualization, as well as a helper to add external links (e.g., linking to Wikidata). 

#### data_etl_pipeline/sparql_queries.py: 
 Contains functions to execute SPARQL queries against a Fuseki endpoint and helper queries for fetching financial metrics, news sentiment, stock prices, performance 
 overview, and linked data. It also includes an example usage section. 

#### flask_api/app.py: 
 Implements a Flask API backend with multiple endpoints to serve financial metrics, stock prices (both static and dynamic), predictions (linear, polynomial, and Monte Carlo simulation), investment insights, and RDF operations. It integrates data extraction, RDF generation, and visualization using Plotly. 

#### flask_api/finnhub_api.py: 
 Provides endpoints to fetch Finnhub data, including company profile, financials, SEC filings, insider transactions/institutional holdings, and company news, with optional 
 Wikidata enrichment. 

============================================================================================

#### AnalysisPrediction.js
   Provides an educational and interactive interface for stock price prediction. Users can input a stock ticker, choose a forecast period and a prediction method (linear or polynomial regression), then view an interactive Plotly chart displaying the predicted stock prices.

#### ComparativeAnalysis.js
   (Also exported as PipelineInputForm in this file) Presents a form where users can enter comma-separated tickers and select a news date range. It then calls the backend pipeline to fetch investment data. The interface displays results through multiple tabs covering investment summaries, stock prices, news insights, performance overview, financial statistics, and a linked data visualization.

#### FinhubTabs.js
   Implements a tabbed interface that retrieves Finnhub data via an API call (using axios) and displays various aspects of the company's information (profile, financials, SEC filings, insider transactions, news, and Wikidata enrichment) through the reusable component LinkedFinnhubExplorer.

#### InvestmentSummary.js
   Displays a concise investment summary for a given stock, including performance metrics, financial ratios, cash/debt data, and sentiment analysis. It also highlights potential investment warnings or opportunities based on these metrics.

#### Learn.js
   (Placeholder) Intended for educational content or tutorials. Its content wasn’t provided, but it’s part of the overall learning module.

#### LinkedDataExplorer.js
   Uses the vis-network library to render an interactive graph visualization of investment data. It builds nodes and edges based on performance, financial metrics, financial statistics, and news insights, and offers filtering options (by company and group) along with physics toggling for dynamic layout adjustments.

#### LinkedFinnhubExplorer.js
   Similar to LinkedDataExplorer but focused on Finnhub data. Depending on the selected mode (profile, financials, SEC filings, insider, news, or Wikidata), it builds and displays a graph that illustrates the relationships within the retrieved Finnhub dataset.

#### LoadingSpinner.js
   A simple, reusable component that shows a CircularProgress indicator and a customizable loading message.

#### MonteCarloSimulation.js
   Allows users to run a Monte Carlo simulation for a stock’s future prices. Users input a ticker and the number of years to predict; the component then fetches simulation data from the backend and displays key simulation results (current price, expected price, price range) along with an interactive Plotly chart of multiple simulated price trajectories.

#### PipelineInputForm.js
   Provides another interface for running the investment analysis pipeline. It collects inputs (company name, ticker, start and end dates), fetches pipeline results and financial statistics, and displays them under several tabs (investment summary, stock prices, news insights, performance overview, financial metrics, and financial statistics). It also includes an option to toggle raw JSON display.

#### StockPriceChart.js
   Fetches dynamic stock price data for selected tickers over various time ranges (e.g., 6 months, 1 year, etc.) and renders a combined line chart using Recharts. It merges price data by date and allows the user to select the time range for display.

#### App.js
   The main application component that defines the navigation and routing for the front-end. It sets up an AppBar with tabs (using react-router-dom and MUI), and routes to the different sections: Investment Analysis (ComparativeAnalysis/PipelineInputForm), Linked Open Data Visualization (FinhubTabs), Analysis Prediction (AnalysisPrediction), Monte Carlo Simulation (MonteCarloSimulation), and Learning (Learn). It also includes a footer and uses framer-motion for animated transitions.

## Installation and Setup

### 1. Prerequisites
- Node.js and npm
- Python 3.8+
- Apache Jena Fuseki
- Git

### 2. Clone the Repository
```bash
# Clone the repository
git clone https://github.com/your-username/linked-data-visualization.git
cd linked-data-visualization
```

### 3. Install Frontend Dependencies
```bash
# Navigate to the frontend directory
cd src
# Install dependencies
npm install
```

### 4. Install Backend Dependencies
```bash
# Navigate to the backend directory
cd backend
# Install dependencies
pip install -r requirements.txt
```

### 5. Set Up Apache Jena Fuseki
1. Download and install Apache Jena Fuseki.
2. Start the Fuseki server and create a new dataset.
3. Import `sample_data.ttl` into the triplestore.

### 6. Run the Backend Server
```bash
# Start the backend server
cd backend
python app.py
```

### 7. Run the Frontend
```bash
# Start the frontend server
cd src
npm start
```

## Usage
1. Open your browser and navigate to [http://localhost:3000](http://localhost:3000).
2. Explore the dashboard:
   - **Simplified View**: Get a high-level overview of company insights.
   - **Detailed View**: Delve deeper into RDF relationships.
3. Use filters to focus on specific categories like financial metrics, news, or performance.
4. Interact with nodes and edges to reveal additional insights.

## Contributions
Contributions are welcome! To contribute:

1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add feature-name"
   ```
4. Push to the branch:
   ```bash
   git push origin feature-name
   ```
5. Open a Pull Request.

## Future Enhancements
- Implement real-time data updates with live API integration.
- Optimize performance for large-scale graphs.
- Add advanced visualizations like heatmaps and time sliders.
- Enable user-defined queries for custom insights.

<iframe width="768" height="432" src="https://miro.com/app/live-embed/uXjVLvgMITI=/?moveToViewport=2102,1432,3592,1326&embedId=149403013758" frameborder="0" scrolling="no" allow="fullscreen; clipboard-read; clipboard-write" allowfullscreen></iframe>

## License
This project is licensed under the [MIT License](LICENSE).

## Contact
If you have any questions or feedback, feel free to reach out:
- Email: your-email@example.com
- LinkedIn: [Your LinkedIn Profile](#)

## Acknowledgments
Special thanks to the contributors, mentors, and open-source libraries that made this project possible.


