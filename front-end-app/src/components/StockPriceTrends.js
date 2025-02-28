import React, { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import axios from "axios";

const StockPriceTrends = ({ ticker }) => {
  const [stockPrices, setStockPrices] = useState([]);

  useEffect(() => {
    const fetchStockPrices = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/stock-prices?ticker=${ticker}&start_date=2020-01-01&end_date=2025-01-01`
        );
        setStockPrices(response.data);
      } catch (error) {
        console.error("Error fetching stock prices:", error);
      }
    };

    fetchStockPrices();
  }, [ticker]);

  return (
    <Plot
      data={[
        {
          x: stockPrices.map((d) => d.isRecordedOn),
          y: stockPrices.map((d) => d.priceValue),
          type: "scatter",
          mode: "lines",
          marker: { color: "blue" },
        },
      ]}
      layout={{
        title: `Stock Price Trends for ${ticker}`,
        xaxis: { title: "Date" },
        yaxis: { title: "Stock Price (USD)" },
        height: 400,
      }}
      useResizeHandler
      style={{ width: "100%", height: "100%" }}
    />
  );
};

export default StockPriceTrends;
