import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Grid } from '@mui/material';
import axios from 'axios';

const NewsInsights = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get('http://localhost:5000/news-insights')
      .then((response) => {
        setNews(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching news:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <Typography variant="h6">Loading News Insights...</Typography>;
  }

  return (
    <div>
      <Typography variant="h4" gutterBottom>News Insights</Typography>
      <Grid container spacing={2}>
        {Array.isArray(news) && news.length > 0 ? (
          news.map((article, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>{article.headline}</Typography>
                  <Typography variant="subtitle1" color="textSecondary">
                    Published On: {article.publicationDate || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    Sentiment Score: {article.sentimentScore || 'N/A'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          <Typography variant="h6" color="textSecondary">
            No news articles available.
          </Typography>
        )}
      </Grid>
    </div>
  );
};

export default NewsInsights;
