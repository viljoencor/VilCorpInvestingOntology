import React, { useState } from "react";
import {
  TextField,
  Button,
  Container,
  Typography,
  Tabs,
  Tab,
  Box,
  Switch,
  FormControlLabel,
} from "@mui/material";
import axios from "axios";

const PipelineInputForm = () => {
  const [ticker, setTicker] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [result, setResult] = useState(null);
  const [financialStatistics, setFinancialStatistics] = useState(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [showRawJson, setShowRawJson] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Fetch the full pipeline data
      const pipelineResponse = await axios.post(
        "http://localhost:5000/run-pipeline",
        {
          company_name: companyName,
          ticker: ticker,
          start_date: startDate,
          end_date: endDate,
        }
      );

      // Fetch financial statistics
      const statsResponse = await axios.get(
        `http://localhost:5000/financial-statistics?ticker=${ticker}`
      );

      setResult(pipelineResponse.data);
      setFinancialStatistics(statsResponse.data);
    } catch (error) {
      console.error("Error running pipeline or fetching statistics:", error);
    }
  };

  const handleTabChange = (event, newIndex) => {
    setTabIndex(newIndex);
  };

  const handleToggleRawJson = () => {
    setShowRawJson((prev) => !prev);
  };

  const generateInvestmentSummary = () => {
    if (!result || !financialStatistics) return "No data available.";
  
    const { performance_overview, financial_metrics } = result;
    const stats = financialStatistics;
  
    // Handle missing or fallback values
    const oneYearReturn = performance_overview?.["1-Year Return"] || "N/A";
    const twoYearReturn = performance_overview?.["2-Year Return"] || "N/A";
    const threeYearReturn = performance_overview?.["3-Year Return"] || "N/A";
    const profitMargin = (financial_metrics?.["Profit Margin"] || 0) * 100;
    const peRatio = financial_metrics?.["PE Ratio"] || "N/A";
    const cash = stats?.["Balance Sheet and Cash Flow"]?.["Total Cash (mrq)"] || "N/A";
    const debtEquity = stats?.["Balance Sheet and Cash Flow"]?.["Total Debt/Equity (mrq)"] || "N/A";
    const sentimentScores = result.news_insights?.map((news) => news.sentimentScore) || [];
    const avgSentiment = sentimentScores.length
      ? (sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length) * 100
      : "N/A";
  
    // Conditions for determining the company's performance
    const isUnderperforming = twoYearReturn < 10 || threeYearReturn < 10 || profitMargin < 10;
    const isFinanciallyUnstable = debtEquity > 50 || cash === "N/A";
    const isOvervalued = peRatio > 25;
    const isNegativeSentiment = avgSentiment < 5;
  
    if (isUnderperforming || isFinanciallyUnstable || isOvervalued || isNegativeSentiment) {
      return `
        ${companyName} is currently not performing well as an investment option.
        - 1-Year Return: ${oneYearReturn}%, 2-Year Return: ${twoYearReturn}%, 3-Year Return: ${threeYearReturn}%, indicating ${oneYearReturn < 0 ? "negative growth" : "sluggish performance"} over time.
        - The profit margin is ${profitMargin.toFixed(2)}%, which is ${profitMargin < 10 ? "below industry standards" : "adequate"}.
        - The company has ${cash} in cash reserves and a Debt/Equity ratio of ${debtEquity}, suggesting ${
        debtEquity > 50 ? "financial instability" : "moderate financial health"
      }.
        - With a Price-to-Earnings Ratio of ${peRatio}, the stock appears ${isOvervalued ? "overvalued" : "fairly priced"}.
        - Recent news sentiment averages at ${avgSentiment.toFixed(2)}%, indicating ${
        avgSentiment < 5 ? "negative" : "neutral"
      } market sentiment.
  
        Consider evaluating alternative investment opportunities with better performance and stability.
      `;
    } else {
      return `
        ${companyName} has delivered a 1-Year Return of ${oneYearReturn}% a 2-Year Return of ${twoYearReturn}%, and a 3-Year Return of ${threeYearReturn}%, reflecting long-term growth potential.
        - The company has a profit margin of ${profitMargin.toFixed(2)}%, indicating strong profitability.
        - With a Price-to-Earnings Ratio of ${peRatio}, the stock appears ${
        peRatio > 20 ? "reasonably priced for growth" : "undervalued"
      }.
        - Its balance sheet shows ${cash} in cash reserves and a Debt/Equity ratio of ${debtEquity}, suggesting ${
        debtEquity < 50 ? "financial stability" : "higher leverage"
      }.
        - Recent news sentiment averages at ${avgSentiment.toFixed(2)}%, suggesting ${
        avgSentiment > 50 ? "positive" : "neutral"
      } market sentiment.
  
        Overall, this company appears to be a solid long-term investment opportunity.
      `;
    }
  };
  

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Investment Analysis Pipeline
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Company Name"
          value={companyName || undefined}
          onChange={(e) => setCompanyName(e.target.value)}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Stock Ticker"
          value={ticker || undefined}
          onChange={(e) => setTicker(e.target.value)}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Start Date"
          type="date"
          value={startDate || undefined}
          onChange={(e) => setStartDate(e.target.value)}
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
          required
        />
        <TextField
          label="End Date"
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
      {result && (
        <div>
          <Tabs value={tabIndex} onChange={handleTabChange} style={{ marginTop: "20px" }}>
            <Tab label="Investment Summary" />
            <Tab label="Stock Prices" />
            <Tab label="News Insights" />
            <Tab label="Performance Overview" />
            <Tab label="Financial Metrics" />
            <Tab label="Financial Statistics" />
          </Tabs>
          <Box style={{ marginTop: "10px" }}>
            <FormControlLabel
              control={<Switch checked={showRawJson} onChange={handleToggleRawJson} />}
              label="Show Raw JSON"
            />
          </Box>
          <Box hidden={tabIndex !== 0}>
            <Typography variant="h6">Investment Summary</Typography>
            {showRawJson ? (
              <pre>{JSON.stringify(result.investment_summary, null, 2)}</pre>
            ) : (
              <Typography>{generateInvestmentSummary()}</Typography>
            )}
          </Box>
          <Box hidden={tabIndex !== 1}>
            <Typography variant="h6">Stock Prices</Typography>
            <pre>{JSON.stringify(result.stock_prices, null, 2)}</pre>
          </Box>
          <Box hidden={tabIndex !== 2}>
            <Typography variant="h6">News Insights</Typography>
            <pre>{JSON.stringify(result.news_insights, null, 2)}</pre>
          </Box>
          <Box hidden={tabIndex !== 3}>
            <Typography variant="h6">Performance Overview</Typography>
            <pre>{JSON.stringify(result.performance_overview, null, 2)}</pre>
          </Box>
          <Box hidden={tabIndex !== 4}>
            <Typography variant="h6">Financial Metrics</Typography>
            <pre>{JSON.stringify(result.financial_metrics, null, 2)}</pre>
          </Box>
          <Box hidden={tabIndex !== 5}>
            <Typography variant="h6">Financial Statistics</Typography>
            {showRawJson ? (
              <pre>{JSON.stringify(financialStatistics, null, 2)}</pre>
            ) : financialStatistics ? (
              <div>
                {Object.entries(financialStatistics).map(([section, stats]) => (
                  <div key={section}>
                    <Typography variant="h6">{section}</Typography>
                    <ul>
                      {Object.entries(stats).map(([key, value]) => (
                        <li key={key}>
                          <strong>{key}:</strong> {value}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <Typography>No financial statistics available.</Typography>
            )}
          </Box>
        </div>
      )}
    </Container>
  );
};

export default PipelineInputForm;
