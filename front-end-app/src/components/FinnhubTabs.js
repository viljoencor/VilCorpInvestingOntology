// FinnhubTabs.js
import React, { useState, useEffect } from 'react';
import { Container, Typography, Tabs, Tab, Box, TextField, Button, Grid } from '@mui/material';
import axios from 'axios';
import LinkedFinnhubExplorer from './LinkedFinnhubExplorer'; // Our linked data explorer component

const FinnhubTabs = () => {
  const [ticker, setTicker] = useState("");
  const [finnhubData, setFinnhubData] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5002/finnhub-data?ticker=${ticker}`);
      setFinnhubData(response.data);
    } catch (err) {
      console.error("Error fetching data from finnhub-data:", err);
      setFinnhubData(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Fetch initial data on mount
    fetchData();
  }, []);

  const handleTickerChange = (e) => {
    setTicker(e.target.value);
  };

  const handleRefresh = () => {
    fetchData();
  };

  // FinnhubTabs.js - Tab Descriptions
  const tabDescriptions = [
    "Company Profiles: Displays company details such as name, industry, market cap, website, and IPO date retrieved from Finnhub.",
    "Financials: Presents standardized financial statements including balance sheet, cash flow, and income statement data.",
    "SEC Filings: Provides links to recent SEC filings for deeper regulatory insight.",
    "Insider Transactions: Shows top 10 insider transactions and institutional holdings data.",
    "Company News: Displays recent news articles and headlines related to the company.",
    "Wikidata Enrichment: Retrieves additional details such as headquarters location and founding date from Wikidata."
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
    <Typography variant="h4" align="center" gutterBottom>
    Finnhub Linked Data Explorer
    </Typography>
    <Typography variant="body1" align="center" gutterBottom>
    Linked Open Data Visualization is a way of showing how different pieces of financial data are connected in a graph.
    Each node in the graph represents a specific type of information (like the company profile, financial statements, SEC filings, insider transactions, or news),
    and the lines (or edges) between them show how they relate to each other.
    This interactive view lets you quickly see and understand how various data points – from a company's basic details to its latest news – fit together,
    making it easier for you to make informed investment decisions.
    </Typography>


      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={8}>
          <TextField
            label="Stock Ticker"
            value={ticker || ""}
            onChange={handleTickerChange}
            fullWidth      
            margin="normal"
            required
            placeholder="Example: AAPL, TSLA, GOOG"
          />
          
        </Grid>
        <Grid item xs={12} sm={4}>
          <Button variant="contained" onClick={handleRefresh} fullWidth disabled={loading}>
            {loading ? "Loading..." : "Fetch Data"}
          </Button>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Tabs value={activeTab} onChange={handleTabChange} centered>
          <Tab label="Profile" />
          <Tab label="Financials" />
          <Tab label="SEC Filings" />
          <Tab label="Insider" />
          <Tab label="Company News" />
          <Tab label="Wikidata" />
        </Tabs>

        {finnhubData && (
          <Box sx={{ mt: 3 }}>
            {activeTab === 0 && (
              <LinkedFinnhubExplorer
                mode="profile"
                dataSet={finnhubData}
                description={tabDescriptions[0]}
              />
            )}
            {activeTab === 1 && (
              <LinkedFinnhubExplorer
                mode="financials"
                dataSet={finnhubData}
                description={tabDescriptions[1]}
              />
            )}
            {activeTab === 2 && (
              <LinkedFinnhubExplorer
                mode="secFilings"
                dataSet={finnhubData}
                description={tabDescriptions[2]}
              />
            )}
            {activeTab === 3 && (
              <LinkedFinnhubExplorer
                mode="insider"
                dataSet={finnhubData}
                description={tabDescriptions[3]}
              />
            )}
            {activeTab === 4 && (
              <LinkedFinnhubExplorer
                mode="news"
                dataSet={finnhubData}
                description={tabDescriptions[4]}
              />
            )}
            {activeTab === 5 && (
              <LinkedFinnhubExplorer
                mode="wikidata"
                dataSet={finnhubData}
                description={tabDescriptions[5]}
              />
            )}
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default FinnhubTabs;
