import React, { useState } from "react";
import { TextField, Button, Container, Typography, Box, Paper, Select, MenuItem } from "@mui/material";
import axios from "axios";
import Plot from "react-plotly.js";

const AnalysisPrediction = () => {
  const [ticker, setTicker] = useState("");
  const [years, setYears] = useState(1);
  const [method, setMethod] = useState("linear");
  const [plotData, setPlotData] = useState(null);

  const fetchPredictions = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/predict-stock-prices/${method}?ticker=${ticker}&years=${years}`
      );
      setPlotData(JSON.parse(response.data.plot_data));
    } catch (error) {
      console.error("Error fetching predictions:", error);
    }
  };

  return (
    <Container maxWidth="lg">
      {/* ✅ Educational Section */}
      <Paper elevation={3} sx={{ padding: 3, marginBottom: 3, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom textAlign="center">
          📈 Stock Price Prediction
        </Typography>

        <Typography variant="h6" gutterBottom>
          🔹 What is Linear Regression?
        </Typography>
        <Typography variant="body1">
          Linear Regression is a simple model that assumes stock prices follow a straight-line trend over time.
          It predicts future prices based on past trends.
        </Typography>
        <Typography variant="body2">✅ Best for: Stocks with steady trends.</Typography>
        <Typography variant="body2">✅ How it works: Finds a line that best fits past stock prices.</Typography>
        <Typography variant="body2">✅ Limitation: Not accurate if stock prices have ups and downs.</Typography>

        <Typography variant="h6" gutterBottom sx={{ marginTop: 2 }}>
          🔹 What is Polynomial Regression?
        </Typography>
        <Typography variant="body1">
          Polynomial Regression is a more advanced model that captures curves instead of straight lines.
          It is useful for stocks that rise and fall unpredictably.
        </Typography>

        <Typography variant="body2">✅ Best for: Stocks with ups and downs or non-linear trends.</Typography>
        <Typography variant="body2">✅ How it works: Uses a curved equation to fit stock price movements.</Typography>
        <Typography variant="body2">✅ Limitation: Can sometimes overfit the data and predict patterns that aren't real.</Typography>
      </Paper>

      {/* 📌 User Input Section */}
      <Paper elevation={3} sx={{ padding: 3, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom>
          🔍 Predict Stock Prices
        </Typography>

        <TextField
          label="Stock Ticker (e.g., AAPL, TSLA)"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          fullWidth
          margin="normal"
          placeholder="Enter stock symbol..."
        />

        <TextField
          label="Years to Predict"
          type="number"
          value={years}
          onChange={(e) => setYears(parseInt(e.target.value))}
          fullWidth
          margin="normal"
          placeholder="Select forecast period (1-10 years)"
        />

        <Select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          fullWidth
          margin="normal"
          sx={{ marginBottom: 2 }}
        >
          <MenuItem value="linear">Linear Regression</MenuItem>
          <MenuItem value="polynomial">Polynomial Regression</MenuItem>
        </Select>

        <Button variant="contained" color="primary" onClick={fetchPredictions} fullWidth>
          Predict
        </Button>
      </Paper>

      {/* 📌 Display Prediction Graph */}
      {plotData && (
        <Box mt={3}>
          <Plot
            data={plotData.data}
            layout={{
              ...plotData.layout,
              title: `📈 Stock Price Prediction for ${ticker} (${method === "linear" ? "Linear" : "Polynomial"} Regression)`,
              xaxis: {
                title: "Time",
                showgrid: true,
                zeroline: false,
              },
              yaxis: {
                title: "Stock Price ($)",
                showgrid: true,
                zeroline: false,
              },
              template: "plotly_dark",
              hovermode: "x unified",
              height: 700, // 🔥 Make graph bigger
              showlegend: true,
            }}
            config={{
              scrollZoom: true, // 🔍 Allow zooming
              responsive: true, // 📱 Make it responsive
            }}
            useResizeHandler
            style={{ width: "100%", height: "700px" }} // 🔥 Adjust width & height dynamically
          />
        </Box>
      )}

    </Container>
  );
};

export default AnalysisPrediction;
