import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Grid } from '@mui/material';
import axios from 'axios';

const ComparativeAnalysis = () => {
  const [comparisonData, setComparisonData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get('http://localhost:5000/comparative-analysis')
      .then((response) => {
        setComparisonData(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching comparative analysis:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <Typography variant="h6">Loading Comparative Analysis...</Typography>;
  }

  return (
    <div>
      <Typography variant="h4" gutterBottom>Comparative Analysis</Typography>
      <Grid container spacing={2}>
        {comparisonData.map((companyData, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>{companyData.company}</Typography>
                <Typography variant="body1">
                  PE Ratio: {companyData.peRatio || 'N/A'}
                </Typography>
                <Typography variant="body1">
                  ROE: {companyData.roe ? `${companyData.roe}%` : 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </div>
  );
};

export default ComparativeAnalysis;
