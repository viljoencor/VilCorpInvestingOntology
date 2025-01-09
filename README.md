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
project-root/
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx
│   │   ├── NewsInsights.jsx
│   │   ├── ComparativeAnalysis.jsx
│   │   ├── PerformanceOverview.jsx
│   │   ├── FinancialData.jsx
│   │   ├── RDFGraphSimplified.jsx
│   │   ├── RDFGraphDetailed.jsx
│   ├── App.js
│   ├── index.js
│
├── backend/
│   ├── app.py           # Flask backend
│   ├── sparql_queries.py # SPARQL query definitions
│   ├── data_ingestion.py # Ingestion and RDF transformation
│
├── data/
│   ├── ontology.owl      # Ontology definition in RDF/OWL format
│   ├── sample_data.ttl   # Sample RDF triples
│
├── package.json
├── README.md
```

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

## License
This project is licensed under the [MIT License](LICENSE).

## Contact
If you have any questions or feedback, feel free to reach out:
- Email: your-email@example.com
- LinkedIn: [Your LinkedIn Profile](#)

## Acknowledgments
Special thanks to the contributors, mentors, and open-source libraries that made this project possible.


