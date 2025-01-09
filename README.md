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
