import React from 'react';
import { Card, Typography, Grid } from '@mui/material';

const InvestmentSummary = ({ data }) => {
  const { company, performanceOverview, financialMetrics, sentimentScore } = data;

  return (
    <Card style={{ padding: '20px' }}>
      <Typography variant="h4">{company.name}</Typography>
      <Typography variant="subtitle1">{company.description}</Typography>

      <Grid container spacing={3} style={{ marginTop: '20px' }}>
        <Grid item xs={12} sm={6}>
          <Typography variant="h6">Performance Overview</Typography>
          {performanceOverview.map((item, index) => (
            <Typography key={index}>
              {item.period}: {item.cpiReturn}% (Index: {item.indexReturn}%)
            </Typography>
          ))}
        </Grid>

        <Grid item xs={12} sm={6}>
          <Typography variant="h6">Financial Metrics</Typography>
          {financialMetrics.length > 0 ? (
            financialMetrics.map((metric, index) => (
              <Typography key={index}>
                {metric.metricName}: {metric.metricValue} {metric.metricUnit}
              </Typography>
            ))
          ) : (
            <Typography>No financial metrics available.</Typography>
          )}
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6">News Sentiment</Typography>
          <Typography>Overall Sentiment Score: {sentimentScore}</Typography>
          <Typography>
            Recent Positive News: Google leads AI innovation with record growth.
          </Typography>
        </Grid>
      </Grid>
    </Card>
  );
};

export default InvestmentSummary;
