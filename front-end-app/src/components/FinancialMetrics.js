import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Grid } from '@mui/material';
import axios from 'axios';

const FinancialMetrics = () => {
    const [metrics, setMetrics] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("http://localhost:5000/financial-metrics")
            .then((response) => response.json())
            .then((data) => {
                // Ensure the API response is in the expected format
                if (data && data.results && data.results.bindings) {
                    const formattedMetrics = data.results.bindings.map((item) => ({
                        name: item.metricName.value,
                        value: parseFloat(item.metricValue.value),
                        unit: item.metricUnit.value || "",
                    }));
                    setMetrics(formattedMetrics);
                } else {
                    setMetrics([]); // Fallback to empty array if API response is unexpected
                }
            })
            .catch((error) => {
                console.error("Error fetching metrics:", error);
                setMetrics([]); // Handle fetch errors
            });
    }, []);

    if (!Array.isArray(metrics)) {
        return <div>Error: Metrics data is not available or in the wrong format.</div>;
    }
}

export default FinancialMetrics;
