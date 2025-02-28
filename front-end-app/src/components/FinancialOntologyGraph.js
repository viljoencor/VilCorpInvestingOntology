import React, { useEffect, useState } from "react";
import { Container, Typography, Box, Paper, CircularProgress, TextField, Button } from "@mui/material";
import axios from "axios";
import Plot from "react-plotly.js";
import { Network } from "vis-network/standalone/esm/vis-network";

const OntologyStockGraph = () => {
  const [selectedCompany, setSelectedCompany] = useState(null);
  //const [stockPrices, setStockPrices] = useState([]);
  const [financialMetrics, setFinancialMetrics] = useState({});
  const [investmentInsights, setInvestmentInsights] = useState(""); // AI-Generated Insights
  const [loadingStock, setLoadingStock] = useState(false);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showResults, setShowResults] = useState(false); // Controls visibility
  const [rdfData, setRdfData] = useState(null);
  const [ticker, setTicker] = useState("");
  const [years, setYears] = useState(5);
  const [loading, setLoading] = useState(false);
  const [stockPrices, setStockPrices] = useState(null);

  // ✅ Fetch stock prices
  const fetchStockPrices = async (ticker) => {
    try {
      setLoadingStock(true);
      const response = await axios.get(`http://localhost:5000/stock-prices?ticker=${ticker}`);
  
      if (response.data.error) {
        console.error("⚠️ Stock Price API Error:", response.data.error);
        setStockPrices([]);
      } else {
        setStockPrices(response.data);
      }
    } catch (error) {
      console.error("❌ Error fetching stock prices:", error);
      setStockPrices([]);
    } finally {
      setLoadingStock(false);
    }
  };

  // ✅ Fetch financial metrics using company name
  const fetchFinancialMetrics = async (ticker) => {
    try {
      setLoadingMetrics(true);
      const response = await axios.get(`http://localhost:5000/rdf-stock-data?ticker=${ticker}`);

      if (response.data.results && response.data.results.bindings.length > 0) {
        const metrics = response.data.results.bindings.reduce((acc, item) => {
          acc[item.metricName.value] = item.metricValue.value;
          return acc;
        }, {});
        setFinancialMetrics(metrics);
      } else {
        setFinancialMetrics({});
      }

      setLoadingMetrics(false);
    } catch (error) {
      console.error("Error fetching financial metrics:", error);
      setLoadingMetrics(false);
    }
  };

  // ✅ Fetch AI-Generated Investment Insights (SPARQL + NLG)
  const fetchInvestmentInsights = async (ticker) => {
    try {
      setLoadingInsights(true);
      const response = await axios.post("http://localhost:5000/investment-insights", { ticker });

      if (response.data.insight) {
        setInvestmentInsights(response.data.insight);
      } else {
        setInvestmentInsights("No insights found.");
      }

      setLoadingInsights(false);
    } catch (error) {
      console.error("Error fetching investment insights:", error);
      setLoadingInsights(false);
    }
  };

  // ✅ Load and Show Data on Button Click
  const handleAnalyzeInvestment = async () => {
    setLoading(true);

    try {
      const rdfResponse = await axios.get(`http://localhost:5000/rdf-stock-data?ticker=${ticker}&years=${years}`);
      setRdfData(rdfResponse.data);
    } catch (error) {
      console.error("❌ Error fetching RDF data:", error);
      setRdfData(null);
    }

    try {
      const stockResponse = await axios.get(`http://localhost:5000/stock-prices?ticker=${ticker}`);
      
      if (stockResponse.data.error) {
        console.error("⚠️ Stock Price API Error:", stockResponse.data.error);
        setStockPrices(null);
      } else {
        setStockPrices(stockResponse.data);
      }
    } catch (error) {
      console.error("❌ Error fetching stock prices:", error);
      setStockPrices(null);
    }

    setLoading(false);
  };
  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom textAlign="center">
        Ontology Visualization & Stock Trends
      </Typography>

      {/* ✅ Form for Stock Selection */}
      <Paper elevation={3} sx={{ padding: 3, marginBottom: 3, borderRadius: 2 }}>
        <Typography variant="h6">Stock Analysis</Typography>
        <TextField
          label="Stock Tickers (comma-separated)"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          fullWidth
          margin="normal"
          placeholder="Example: AAPL, TSLA, GOOG"
        />
        <TextField
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="End Date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
        />
        <Button variant="contained" color="primary" fullWidth sx={{ marginTop: 2 }} onClick={handleAnalyzeInvestment}>
          Analyze Investment
        </Button>
      </Paper>

      {/* ✅ Only Show Results After Button Click */}
      {showResults && (
        <>
          {/* ✅ Ontology Graph */}
          <Paper elevation={3} sx={{ padding: 3, marginBottom: 3, borderRadius: 2 }}>
            <Typography variant="h6">Interactive Ontology Graph</Typography>
            <Box id="ontologyGraph" sx={{ height: "500px", border: "1px solid #ddd", marginTop: 2 }}></Box>
          </Paper>

          {/* ✅ Financial Metrics */}
          {selectedCompany && (
            <Paper elevation={3} sx={{ padding: 3, marginBottom: 3, borderRadius: 2 }}>
              <Typography variant="h6">Company Overview: {selectedCompany}</Typography>
              {loadingMetrics ? (
                <CircularProgress />
              ) : (
                <>
                  <Typography variant="body1">Revenue: ${financialMetrics.Revenue || "N/A"}</Typography>
                  <Typography variant="body1">P/E Ratio: {financialMetrics["P/E Ratio"] || "N/A"}</Typography>
                </>
              )}
            </Paper>
          )}

          {loading && <CircularProgress />}

          {rdfData && (
            <Paper elevation={3} sx={{ padding: 3, marginBottom: 3 }}>
              <Typography variant="h6">RDF Data</Typography>
              <pre>{rdfData}</pre>
            </Paper>
          )}

          {/* ✅ Stock Prices */}
          {selectedCompany && (
            <Paper elevation={3} sx={{ padding: 3, marginBottom: 3, borderRadius: 2 }}>
              <Typography variant="h6">Stock Price Trends for {selectedCompany}</Typography>
              {loadingStock ? (
                <CircularProgress />
              ) : (
                <Plot
                  data={[{
                    x: stockPrices.dates,
                    y: stockPrices.prices,
                    type: "scatter",
                    mode: "lines",
                    marker: { color: "blue" }
                  }]}
                  layout={{ title: `Stock Prices for ${selectedCompany}`, xaxis: { title: "Date" }, yaxis: { title: "Price (USD)" } }}
                  useResizeHandler
                  style={{ width: "100%", height: "400px" }}
                />
              )}
            </Paper>
          )}

          {/* ✅ AI-Generated Investment Insights */}
          <Paper elevation={3} sx={{ padding: 3, marginBottom: 3, borderRadius: 2 }}>
            <Typography variant="h6">Investment Insights</Typography>
            {loadingInsights ? <CircularProgress /> : <Typography variant="body1">{investmentInsights}</Typography>}
          </Paper>
        </>
      )}
    </Container>
  );
};

export default OntologyStockGraph;
