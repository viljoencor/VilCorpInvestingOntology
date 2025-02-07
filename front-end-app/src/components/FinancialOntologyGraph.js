import React, { useEffect, useState } from "react";
import { Container, Typography, Box, Paper, Divider, CircularProgress } from "@mui/material";
import axios from "axios";
import Plot from "react-plotly.js";
import { Network } from "vis-network/standalone/esm/vis-network";

const OntologyStockGraph = () => {
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [stockPrices, setStockPrices] = useState([]);
  const [financialMetrics, setFinancialMetrics] = useState({});
  const [loadingStock, setLoadingStock] = useState(false);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // Fetch stock prices from API
  const fetchStockPrices = async (ticker) => {
    try {
      setLoadingStock(true);
      const endDate = new Date().toISOString().split("T")[0];
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 2);
      const formattedStartDate = startDate.toISOString().split("T")[0];

      const response = await axios.get(
        `http://localhost:5000/stock-prices?ticker=${ticker}&start_date=${formattedStartDate}&end_date=${endDate}`
      );

      setStockPrices(response.data);
      setLoadingStock(false);
    } catch (error) {
      console.error("Error fetching stock prices:", error);
      setLoadingStock(false);
    }
  };

  // Fetch financial metrics from API
  const fetchFinancialMetrics = async (companyName) => {
    try {
      setLoadingMetrics(true);
      const response = await axios.get(`http://localhost:5000/financial-metrics?company=${companyName}`);
      setFinancialMetrics(response.data);
      setLoadingMetrics(false);
    } catch (error) {
      console.error("Error fetching financial metrics:", error);
      setLoadingMetrics(false);
    }
  };

  // Initialize Ontology Visualization
  useEffect(() => {
    const container = document.getElementById("ontologyGraph");

    // Sample ontology nodes (Companies, Stock Market, Financial Metrics, Earnings)
    const nodes = [
      { id: 1, label: "Apple (AAPL)", group: "company", ticker: "AAPL", company: "Apple" },
      { id: 2, label: "Tesla (TSLA)", group: "company", ticker: "TSLA", company: "Tesla" },
      { id: 3, label: "Microsoft (MSFT)", group: "company", ticker: "MSFT", company: "Microsoft" },
      { id: 4, label: "Stock Market", group: "category" },
      { id: 5, label: "Earnings Report", group: "finance" },
      { id: 6, label: "Revenue Growth", group: "finance" },
      { id: 7, label: "Market Sentiment", group: "finance" },
    ];

    const edges = [
      { from: 1, to: 4, label: "Trades in" },
      { from: 2, to: 4, label: "Trades in" },
      { from: 3, to: 4, label: "Trades in" },
      { from: 1, to: 5, label: "Reports earnings" },
      { from: 2, to: 5, label: "Reports earnings" },
      { from: 3, to: 5, label: "Reports earnings" },
      { from: 1, to: 6, label: "Influences" },
      { from: 2, to: 6, label: "Influences" },
      { from: 3, to: 6, label: "Influences" },
      { from: 1, to: 7, label: "Affects sentiment" },
      { from: 2, to: 7, label: "Affects sentiment" },
      { from: 3, to: 7, label: "Affects sentiment" },
    ];

    const data = { nodes, edges };
    const options = {
      nodes: { shape: "dot", size: 20 },
      edges: { arrows: "to", font: { align: "top" } },
      interaction: { hover: true },
      physics: { stabilization: true },
    };

    const network = new Network(container, data, options);

    // Listen for node clicks
    network.on("click", (event) => {
      const nodeId = event.nodes[0]; // Get clicked node
      const node = nodes.find((n) => n.id === nodeId);

      if (node && node.group === "company") {
        setSelectedCompany(node);
        fetchStockPrices(node.ticker);
        fetchFinancialMetrics(node.company);
      }
    });
  }, []);

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom textAlign="center">
        📊 Ontology Visualization & Stock Trends
      </Typography>

      <Paper elevation={3} sx={{ padding: 3, marginBottom: 3, borderRadius: 2 }}>
        <Typography variant="h6">🔍 Interactive Ontology Graph</Typography>
        <Box id="ontologyGraph" sx={{ height: "400px", border: "1px solid #ddd", marginTop: 2 }}></Box>
      </Paper>

      {/* Side Panel for Financial Metrics */}
      {selectedCompany && (
        <Paper elevation={3} sx={{ padding: 3, marginBottom: 3, borderRadius: 2 }}>
          <Typography variant="h6">📌 Company Overview: {selectedCompany.label}</Typography>
          {loadingMetrics ? (
            <CircularProgress />
          ) : (
            <>
              <Typography variant="body1">Market Cap: ${financialMetrics.market_cap}</Typography>
              <Typography variant="body1">Revenue: ${financialMetrics.revenue}</Typography>
              <Typography variant="body1">P/E Ratio: {financialMetrics.pe_ratio}</Typography>
              <Typography variant="body1">Earnings Growth: {financialMetrics.earnings_growth}%</Typography>
              <Divider sx={{ marginY: 2 }} />
              <Typography variant="body2">
                Market sentiment and financial health impact stock performance.
              </Typography>
            </>
          )}
        </Paper>
      )}

      {/* Time-Series Stock Price Chart */}
      {selectedCompany && (
        <Paper elevation={3} sx={{ padding: 3, marginBottom: 3, borderRadius: 2 }}>
          <Typography variant="h6">
            📈 Stock Price Trends for {selectedCompany.label}
          </Typography>
          {loadingStock ? (
            <CircularProgress />
          ) : (
            <Plot
              data={[
                {
                  x: stockPrices.map((d) => d.isRecordedOn),
                  y: stockPrices.map((d) => d.priceValue),
                  type: "scatter",
                  mode: "lines",
                  marker: { color: "#1f77b4" },
                },
              ]}
              layout={{
                title: `Historical Stock Prices for ${selectedCompany.label}`,
                xaxis: { title: "Date" },
                yaxis: { title: "Stock Price (USD)" },
                height: 400,
              }}
              useResizeHandler
              style={{ width: "100%", height: "100%" }}
            />
          )}
        </Paper>
      )}
    </Container>
  );
};

export default OntologyStockGraph;
