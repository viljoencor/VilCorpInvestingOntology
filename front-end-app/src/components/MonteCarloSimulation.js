import React, { useState } from "react";
import { TextField, Button, Container, Typography, Box, Paper } from "@mui/material";
import axios from "axios";
import Plot from "react-plotly.js";

const MonteCarloSimulation = () => {
  const [ticker, setTicker] = useState("");
  const [years, setYears] = useState(1);
  const [prediction, setPrediction] = useState(null);
  const [plotData, setPlotData] = useState(null);

  const fetchPredictions = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/predict-stock-prices/monte-carlo?ticker=${ticker}&years=${years}`
      );

      setPrediction({
        ticker: response.data.ticker,
        current_price: response.data.current_price,  // Added current price
        expected_price: response.data.expected_price,
        price_range: response.data.price_range,
      });

      setPlotData(JSON.parse(response.data.plot_data)); // Convert Plotly JSON
    } catch (error) {
      console.error("Error fetching predictions:", error);
    }
  };

  return (
    <Container maxWidth="lg">
      {/* ✅ Educational Section */}
      <Paper elevation={3} sx={{ padding: 3, marginBottom: 3, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom textAlign="center">
          📊 Monte Carlo Stock Price Simulation
        </Typography>
        <Typography variant="body1" paragraph>
          Monte Carlo Simulation is a mathematical technique used to predict future stock prices by running thousands of random simulations. 
          Instead of guessing one future price, it shows a range of possible outcomes, helping investors understand risk & uncertainty.
        </Typography>

        <Typography variant="h6" gutterBottom>
          🔹 Why is Monte Carlo Useful?
        </Typography>
        <Typography variant="body1">✅ Risk Assessment – Helps investors see the best & worst cases.</Typography>
        <Typography variant="body1">✅ Multiple Outcomes – Shows many possible price movements, not just one.</Typography>
        <Typography variant="body1">✅ Better Decision-Making – Helps in long-term investing & options pricing.</Typography>
      </Paper>

      {/* 📌 User Input Section */}
      <Paper elevation={3} sx={{ padding: 3, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom>
          🔍 Run a Monte Carlo Simulation
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

        <Button variant="contained" color="primary" onClick={fetchPredictions} fullWidth sx={{ marginTop: 2 }}>
          Run Simulation
        </Button>
      </Paper>

      {/* 📌 Display Prediction Results */}
      {prediction && (
        <Box mt={3} textAlign="center">
          <Paper elevation={3} sx={{ padding: 3, borderRadius: 2 }}>
            <Typography variant="h6">Simulation Results for {prediction.ticker}</Typography>
            <Typography variant="body1">
              📈 Current Price: <strong>${prediction.current_price.toFixed(2)}</strong>
            </Typography>
            <Typography variant="body1">
              📊 Expected Price: <strong>${prediction.expected_price.toFixed(2)}</strong>
            </Typography>
            <Typography variant="body1">
              🔻 Possible Low: <strong>${prediction.price_range[0].toFixed(2)}</strong>
            </Typography>
            <Typography variant="body1">
              🚀 Possible High: <strong>${prediction.price_range[1].toFixed(2)}</strong>
            </Typography>
          </Paper>
        </Box>
      )}

      {/* 📌 Display Monte Carlo Graph */}
      {plotData && (
        <Box mt={3}>
          <Plot 
            data={plotData.data} 
            layout={{
              ...plotData.layout,
              title: `Monte Carlo Simulation for ${ticker}`,
              xaxis_title: "Trading Days",
              yaxis_title: "Stock Price",
              template: "plotly_dark",
              height: 600,
            }}
            useResizeHandler
            style={{ width: "100%", height: "600px" }}
          />
        </Box>
      )}
    </Container>
  );
};

export default MonteCarloSimulation;
