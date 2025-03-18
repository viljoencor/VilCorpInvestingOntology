import React from "react";
import { Card, CardContent, Typography } from "@mui/material";

const InvestmentSummary = ({ ticker, results, financialStatistics }) => {
  if (!results[ticker] || !financialStatistics[ticker]) return "No data available.";

  const { performance_overview, financial_metrics, news_insights } = results[ticker];
  const stats = financialStatistics[ticker];

  const oneYearReturn = performance_overview?.["1-Year Return"] || "N/A";
  const twoYearReturn = performance_overview?.["2-Year Return"] || "N/A";
  const threeYearReturn = performance_overview?.["3-Year Return"] || "N/A";
  const profitMargin = (financial_metrics?.["Profit Margin"] || 0) * 100;
  const peRatio = financial_metrics?.["PE Ratio"] || "N/A";
  const cash = stats?.["Balance Sheet and Cash Flow"]?.["Total Cash (mrq)"] || "N/A";
  const debtEquity = stats?.["Balance Sheet and Cash Flow"]?.["Total Debt/Equity (mrq)"] || "N/A";

  // Calculate average sentiment but handle missing data
  const sentimentScores = news_insights?.map((news) => news.sentimentScore).filter((s) => typeof s === "number");
  const avgSentiment = sentimentScores.length
    ? (sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length) * 1000
    : "N/A";

  const formattedSentiment = typeof avgSentiment === "number" ? avgSentiment.toFixed(2) : "N/A";

  // Industry-average P/E ratio for comparison (assumed to be 20)
  const industryPeAverage = 20;
  // Overvaluation condition: P/E > (industryPeAverage * 2) i.e., P/E > 40
  const isOvervalued = peRatio !== "N/A" && peRatio > industryPeAverage * 2;

  // Strong profitability indicator: Profit Margin must be at least 15%
  const isProfitable = profitMargin >= 15;

  // Financial stability: Debt/Equity ratio must be less than 50 (if available)
  const isFinanciallyStable = debtEquity !== "N/A" && debtEquity < 50;

  // Market Sentiment: Negative sentiment if the formatted sentiment score is below 50
  const isNegativeSentiment = formattedSentiment !== "N/A" && formattedSentiment < 50;

  return (
    <Card sx={{ marginBottom: 2, padding: 2, borderRadius: 2, boxShadow: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: "bold", color: "#1565c0" }}>
          {ticker} Investment Summary
        </Typography>

        {/* Performance Overview */}
        <Typography variant="subtitle1" sx={{ fontWeight: "bold", marginTop: 1 }}>
          📈 Performance Overview:
        </Typography>
        {oneYearReturn !== "N/A" && <Typography>- 1-Year Return: <strong>{oneYearReturn}%</strong></Typography>}
        {twoYearReturn !== "N/A" && <Typography>- 2-Year Return: <strong>{twoYearReturn}%</strong></Typography>}
        {threeYearReturn !== "N/A" && <Typography>- 3-Year Return: <strong>{threeYearReturn}%</strong></Typography>}

        {/* Financial Overview */}
        <Typography variant="subtitle1" sx={{ fontWeight: "bold", marginTop: 2 }}>
          💰 Financial Overview:
        </Typography>
        <Typography>- Profit Margin: <strong>{profitMargin.toFixed(2)}%</strong></Typography>
        <Typography>- P/E Ratio: <strong>{peRatio}</strong> (Industry Avg: {industryPeAverage}; overvalued if greater than {industryPeAverage * 2})</Typography>
        <Typography>- Cash Reserves: <strong>{cash}</strong></Typography>
        <Typography>- Debt/Equity Ratio: <strong>{debtEquity}</strong></Typography>

        {/* Market Sentiment */}
        <Typography variant="subtitle1" sx={{ fontWeight: "bold", marginTop: 2 }}>
          📰 Market Sentiment:
        </Typography>
        <Typography>
          - Recent news sentiment averages at <strong>{formattedSentiment}%</strong>, indicating{" "}
          {formattedSentiment !== "N/A" ? (formattedSentiment > 50 ? "positive" : "neutral") : "no major sentiment trends."}
        </Typography>

        {/* Investment Decision - Warning or Potential */}
        {isOvervalued || !isProfitable || !isFinanciallyStable || isNegativeSentiment ? (
          <Typography variant="body1" sx={{ marginTop: 2, fontWeight: "bold", color: "red" }}>
            🚨 Investment Warning: While {ticker} exhibits some positive attributes, it currently faces risks such as{" "}
            {isOvervalued ? "a high valuation" : ""}{!isProfitable ? ", weak profitability" : ""}{!isFinanciallyStable ? ", financial instability" : ""}{isNegativeSentiment ? " negative news sentiment" : ""}.
          </Typography>
        ) : (
          <Typography variant="body1" sx={{ marginTop: 2, fontWeight: "bold", color: "green" }}>
            Investment Potential: {ticker} appears to be a solid long-term investment with strong profitability, financial stability, reasonable valuation, and positive news sentiment.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default InvestmentSummary;
