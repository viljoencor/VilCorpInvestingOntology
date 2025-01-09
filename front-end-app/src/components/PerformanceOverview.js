import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Grid } from '@mui/material';
import axios from 'axios';

const PerformanceOverview = () => {
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch performance overview data from your backend
    axios
      .get('http://localhost:5000/performance-overview')
      .then((response) => {
        setPerformanceData(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching performance overview data:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <Typography variant="h6">Loading Performance Overview...</Typography>;
  }

  if (!performanceData) {
    return <Typography variant="h6">No performance data available.</Typography>;
  }

  return (
    <div>
      <Typography variant="h4" gutterBottom>Performance Overview: CPI.JO</Typography>
      <Grid container spacing={2}>
        {Object.keys(performanceData).map((key, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>{key}</Typography>
                <Typography variant="body1">
                  CPI.JO: {performanceData[key]["CPI.JO Return"] || 'N/A'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  All Share Index: {performanceData[key]["All Share Index Return"] || 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </div>
  );
};

export default PerformanceOverview;
