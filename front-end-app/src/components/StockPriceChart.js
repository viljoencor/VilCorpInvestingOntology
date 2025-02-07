import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { FormControl, MenuItem, Select } from "@mui/material";
import axios from "axios";
import LoadingSpinner from "./LoadingSpinner"; // Import the reusable loading spinner

const StockPriceChart = ({ tickers }) => {
  const [selectedRange, setSelectedRange] = useState("1Y");
  const [stockData, setStockData] = useState({});
  const [loading, setLoading] = useState(false); // Track loading state

  // Yahoo Finance's valid period values
  const timeRanges = {
    "6M": "6mo",
    "1Y": "1y",
    "2Y": "2y",
    "5Y": "5y",
    "10Y": "10y",
  };

  useEffect(() => {
    const fetchStockPrices = async () => {
      setLoading(true); // Start loading
      let newStockData = {};

      for (const ticker of tickers) {
        try {
          const response = await axios.get(
            `http://localhost:5000/stock-prices/dynamic?ticker=${ticker}&period=${timeRanges[selectedRange]}`
          );

          if (Array.isArray(response.data)) {
            newStockData[ticker] = response.data;
          } else {
            console.error(`Invalid data format for ${ticker}:`, response.data);
            newStockData[ticker] = [];
          }
        } catch (error) {
          console.error(`Error fetching stock prices for ${ticker}:`, error);
          newStockData[ticker] = [];
        }
      }

      setStockData(newStockData);
      setLoading(false); // Stop loading
    };

    fetchStockPrices();
  }, [selectedRange, tickers]);

  if (loading) {
    return <LoadingSpinner message="Fetching stock price data..." />;
  }

  if (Object.keys(stockData).length === 0) {
    return <p>No stock price data available.</p>;
  }

  const formatXAxis = (dateStr) => {
    const date = new Date(dateStr);
    return selectedRange === "6M" ? date.toISOString().split("T")[0] : date.toISOString().slice(0, 7);
  };

  let mergedData = [];
  Object.keys(stockData).forEach((ticker) => {
    stockData[ticker]?.forEach((entry) => {
      const dateFormatted = new Date(entry.isRecordedOn).toISOString().split("T")[0];

      const existingEntry = mergedData.find((e) => e.isRecordedOn === dateFormatted);
      if (existingEntry) {
        existingEntry[ticker] = entry.priceValue;
      } else {
        mergedData.push({ isRecordedOn: dateFormatted, [ticker]: entry.priceValue });
      }
    });
  });

  mergedData.sort((a, b) => new Date(a.isRecordedOn) - new Date(b.isRecordedOn));

  const colors = ["#3e95cd", "#8e5ea2", "#3cba9f", "#e8c3b9", "#c45850", "#ff8c00", "#4b0082"];

  return (
    <>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <Select value={selectedRange} onChange={(e) => setSelectedRange(e.target.value)}>
          {Object.keys(timeRanges).map((key) => (
            <MenuItem key={key} value={key}>
              {key}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={mergedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="isRecordedOn" tickFormatter={formatXAxis} minTickGap={20} />
          <YAxis />
          <Tooltip />
          <Legend />

          {Object.keys(stockData).map((ticker, index) => (
            <Line
              key={ticker}
              type="monotone"
              dataKey={ticker}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </>
  );
};

export default StockPriceChart;
