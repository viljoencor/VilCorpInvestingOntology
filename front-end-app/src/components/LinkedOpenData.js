// LinkedOpenFigi.js
import React, { useState } from 'react';
import { Container, Typography, TextField, Button, Card, CardContent, Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import axios from 'axios';

const LinkedOpenFigi = () => {
  const [ticker, setTicker] = useState("");
  const [exchCode, setExchCode] = useState("US");
  const [figiData, setFigiData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTickerChange = (e) => {
    setTicker(e.target.value);
  };

  const handleExchChange = (e) => {
    setExchCode(e.target.value);
  };

  const fetchFigiData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post("http://localhost:5002/openfigi", { ticker, exchCode });
      setFigiData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || "Error fetching FIGI data");
      setFigiData(null);
    }
    setLoading(false);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        OpenFIGI Data Explorer
      </Typography>
      <Typography variant="body1" gutterBottom>
        Enter a ticker (and choose an exchange) to fetch mapping data from OpenFIGI.
      </Typography>
      <TextField
        label="Ticker"
        value={ticker}
        onChange={handleTickerChange}
        fullWidth
        margin="normal"
        placeholder="e.g. GOOG, TSLA, MSFT"
      />
      <FormControl fullWidth margin="normal">
        <InputLabel id="exchange-select-label">Exchange Code</InputLabel>
        <Select
          labelId="exchange-select-label"
          value={exchCode}
          label="Exchange Code"
          onChange={handleExchChange}
        >
          <MenuItem value="US">US</MenuItem>
          <MenuItem value="LN">London</MenuItem>
          <MenuItem value="JP">Japan</MenuItem>
          {/* Add more exchange codes as needed */}
        </Select>
      </FormControl>
      <Button variant="contained" color="primary" onClick={fetchFigiData} disabled={loading || !ticker}>
        {loading ? "Loading..." : "Fetch FIGI Data"}
      </Button>
      {error && (
        <Typography variant="body2" color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}
      {figiData && (
        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Typography variant="h6">FIGI Mapping Results</Typography>
            <Box sx={{ mt: 2 }}>
              <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {JSON.stringify(figiData, null, 2)}
              </pre>
            </Box>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default LinkedOpenFigi;
