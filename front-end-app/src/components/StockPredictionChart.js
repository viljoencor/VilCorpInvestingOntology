import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import { FormControl, InputLabel, MenuItem, Select, Card, CardContent, Typography } from "@mui/material";
import axios from "axios";

const StockPredictionChart = ({ ticker }) => {
  const [daysToPredict, setDaysToPredict] = useState(30);
  const [predictionData, setPredictionData] = useState([]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]); // Get today's date

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/predict-stock-prices?ticker=${ticker}&days=${daysToPredict}&end_date=${endDate}`);
        setPredictionData(response.data);
      } catch (error) {
        console.error("Error fetching stock predictions:", error);
      }
    };

    if (ticker) {
      fetchPredictions();
    }
  }, [ticker, daysToPredict, endDate]);

  return (
    <Card sx={{ marginTop: 4, padding: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          📊 {ticker} Stock Price Prediction
        </Typography>

        {/* Dropdown to Select Prediction Duration */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Predict Next</InputLabel>
          <Select value={daysToPredict} onChange={(e) => setDaysToPredict(e.target.value)}>
            <MenuItem value={182}>6 Months</MenuItem>
            <MenuItem value={365}>1 Year</MenuItem>
            <MenuItem value={730}>2 Year</MenuItem>
            <MenuItem value={1825}>5 Year</MenuItem>
            <MenuItem value={3650}>10 Year</MenuItem>
          </Select>
        </FormControl>

        {/* Line Chart */}
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={predictionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="predicted_price" stroke="#ff7300" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default StockPredictionChart;
