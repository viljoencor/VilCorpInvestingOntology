import React, { useState } from "react";
import {
  TextField,
  Button,
  Container,
  Typography,
  Tabs,
  Tab,
  Box,
  Grid,
  Card,
  CardContent,
  Divider,
} from "@mui/material";
import axios from "axios";
import StockPriceChart from "./StockPriceChart";
import InvestmentSummary from "./InvestmentSummary"; // Import InvestmentSummary
import LoadingSpinner from "./LoadingSpinner";

const PipelineInputForm = () => {
  const [tickers, setTickers] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [results, setResults] = useState({});
  const [financialStatistics, setFinancialStatistics] = useState({});
  const [tabIndex, setTabIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const tickerList = tickers.split(",").map((t) => t.trim().toUpperCase());
    let resultsData = {};
    let statsData = {};

    for (const ticker of tickerList) {
      try {
        const pipelineResponse = await axios.post(
          "http://localhost:5000/run-pipeline",
          { company_name: ticker, ticker, start_date: startDate, end_date: endDate }
        );

        const statsResponse = await axios.get(
          `http://localhost:5000/financial-statistics?ticker=${ticker}`
        );

        resultsData[ticker] = pipelineResponse.data;
        statsData[ticker] = statsResponse.data;
      } catch (error) {
        console.error(`Error fetching data for ${ticker}:`, error);
      }
    }

    setResults(resultsData);
    setFinancialStatistics(statsData);
    setLoading(false);
  };

  const handleTabChange = (event, newIndex) => {
    setTabIndex(newIndex);
  };

  if (loading) {
    return <LoadingSpinner message="Fetching Investment Data..." />;
  }

  return (
    <Container maxWidth="lg">
      {/* Page Title */}
      <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold", textAlign: "center" }}>
        Investment Analysis
      </Typography>

      {/* Explanation of Metrics */}
      <Typography variant="body1" paragraph sx={{ textAlign: "justify", mb: 2 }}>
        This tool leverages quantitative analysis to evaluate stocks and help you make informed investment decisions.
        It calculates key financial ratios and market trends, ensuring a data-driven approach to investing.
      </Typography>

      <Typography variant="h6" sx={{ mt: 2 }}>
        🔍 Key Stock Evaluation Metrics
      </Typography>
      <Typography variant="body2">
        - P/E Ratio: Measures stock price vs. earnings per share (high P/E = high growth potential). <br />
        - Revenue Growth: Tracks how much a company’s revenue is increasing. <br />
        - Return on Assets (ROA): Shows how well a company utilizes assets to generate profit. <br />
        - Debt-to-Equity Ratio: Measures financial stability (lower ratio = stronger financial position).
      </Typography>

      <Typography variant="h6" sx={{ mt: 3 }}>
        📊 How Quantitative Analysis Works
      </Typography>
      <Typography variant="body2" paragraph>
        This tool uses mathematical models to analyze financial statements, valuations, and market trends.
        By calculating ratios like earnings per share, return on assets, and debt-to-equity, it determines stock value.
        Statistical methods like regression analysis help predict future performance.
      </Typography>

      {/* Investment Analysis Form */}
      <form onSubmit={handleSubmit}>
        <TextField
          label="Stock Tickers (comma-separated)"
          value={tickers || undefined || ""}
          onChange={(e) => setTickers(e.target.value)}
          fullWidth
          margin="normal"
          required
          placeholder="Example: AAPL, TSLA, GOOG"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Start Date for News"
          type="date"
          value={startDate || undefined || ""}
          onChange={(e) => setStartDate(e.target.value)}
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
          required
        />
        <TextField
          label="End Date for News"
          type="date"
          value={endDate || undefined}
          onChange={(e) => setEndDate(e.target.value)}
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
          required
        />
        <Button variant="contained" color="primary" type="submit">
          Analyze Investment
        </Button>
      </form>

      {Object.keys(results).length > 0 && (
        <div>
          <Tabs value={tabIndex} onChange={handleTabChange} style={{ marginTop: "20px" }}>
            <Tab label="Investment Summary" />
            <Tab label="Stock Prices" />
            <Tab label="News Insights" />
            <Tab label="Performance Overview" />
            <Tab label="Financial Metrics" />
            <Tab label="Financial Statistics" />
          </Tabs>

          {/* Investment Summary Comparison */}
          <Box hidden={tabIndex !== 0}>
            <Typography variant="h6">Investment Summary</Typography>
            <Grid container spacing={2}>
              {Object.keys(results).map((ticker) => (
                <Grid item xs={12} md={6} key={ticker}>
                  <InvestmentSummary
                    ticker={ticker}
                    results={results}
                    financialStatistics={financialStatistics}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Stock Prices - Line Graph with Dynamic Range Selection */}
          <Box hidden={tabIndex !== 1}>
            <Typography variant="h6">Stock Prices (Line Chart)</Typography>
            <Card>
              <CardContent>
                <StockPriceChart tickers={Object.keys(results)} />
              </CardContent>
            </Card>
          </Box>

          {/* News Insights */}
          <Box hidden={tabIndex !== 2}>
            <Typography variant="h6">News Insights</Typography>
            <Grid container spacing={2}>
              {Object.keys(results).map((ticker) => (
                <Grid item xs={12} md={6} key={ticker}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">{ticker}</Typography>
                      <Divider />
                      {results[ticker].news_insights.map((news, index) => (
                        <Box key={index} mb={1}>
                          <Typography>
                            📰 <strong>{news.title}</strong> ({news.publicationDate})
                          </Typography>
                          <Typography>
                            🌍 <a href={news.url} target="_blank" rel="noopener noreferrer">
                              Read More
                            </a>
                          </Typography>
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Performance Overview */}
          <Box hidden={tabIndex !== 3}>
            <Typography variant="h6">Performance Overview</Typography>
            <Grid container spacing={2}>
              {Object.keys(results).map((ticker) => (
                <Grid item xs={12} md={6} key={ticker}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">{ticker}</Typography>
                      <Divider />
                      {Object.entries(results[ticker].performance_overview)
                        .sort((a, b) => {
                          const order = {
                            "1-Year Return": 1,
                            "2-Year Return": 2,
                            "3-Year Return": 3,
                            "5-Year Return": 5,
                            "10-Year Return": 10,
                          };
                          return (order[a[0]] || 99) - (order[b[0]] || 99);
                        })
                        .map(([key, value]) => (
                          <Typography key={key}>
                            📊 {key}: <strong>{value}%</strong>
                          </Typography>
                        ))}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>


          {/* Financial Metrics */}
          <Box hidden={tabIndex !== 4}>
            <Typography variant="h6">Financial Metrics</Typography>
            <Grid container spacing={2}>
              {Object.keys(results).map((ticker) => (
                <Grid item xs={12} md={6} key={ticker}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">{ticker}</Typography>
                      <Divider />
                      {Object.entries(results[ticker].financial_metrics).map(([key, value]) => (
                        <Typography key={key}>
                          💵 {key}: <strong>{value}</strong>
                        </Typography>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Financial Statistics */}
          <Box hidden={tabIndex !== 5}>
            <Typography variant="h6">Financial Statistics</Typography>
            <Grid container spacing={2}>
              {Object.keys(financialStatistics).map((ticker) => (
                <Grid item xs={12} md={6} key={ticker}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">{ticker}</Typography>
                      <Divider />
                      {Object.entries(financialStatistics[ticker]).map(([section, stats]) => (
                        <Box key={section} mt={2}>
                          <Typography variant="subtitle1"><strong>{section}</strong></Typography>
                          {Object.entries(stats).map(([key, value]) => (
                            <Typography key={key}>
                              🔹 {key}: <strong>{value}</strong>
                            </Typography>
                          ))}
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </div>
      )}
    </Container>
  );
};


export default PipelineInputForm;
