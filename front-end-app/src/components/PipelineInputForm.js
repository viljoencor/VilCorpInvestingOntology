import React, { useState } from 'react';
import { TextField, Button, Container, Typography } from '@mui/material';
import axios from 'axios';

const PipelineInputForm = () => {
  const [ticker, setTicker] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    axios
      .post('http://localhost:5000/run-pipeline', {
        company_name: companyName,
        ticker: ticker,
        start_date: startDate,
        end_date: endDate,
      })
      .then((response) => {
        setResult(response.data);
      })
      .catch((error) => {
        console.error('Error running pipeline:', error);
      });
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Run Data Pipeline
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Company Name"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Stock Ticker"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
          required
        />
        <TextField
          label="End Date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
          required
        />
        <Button variant="contained" color="primary" type="submit">
          Run Pipeline
        </Button>
      </form>
      {result && (
        <div>
          <Typography variant="h6" gutterBottom>
            Pipeline Results
          </Typography>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </Container>
  );
};

export default PipelineInputForm;
