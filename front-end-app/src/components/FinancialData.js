import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
} from '@mui/material';
import axios from 'axios';

const FinancialData = () => {
  const [financialData, setFinancialData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch financial data from the backend
    axios.get('http://localhost:5000/financial-data')
      .then((response) => {
        setFinancialData(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching financial data:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <Typography variant="h6">Loading Financial Data...</Typography>;
  }

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Financial Data
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {/* Dynamically render table headers */}
              <TableCell>Metric</TableCell>
              {financialData.length > 0 &&
                Object.keys(financialData[0])
                  .filter((key) => key !== 'Metric')
                  .map((key, index) => (
                    <TableCell key={index} align="right">{key}</TableCell>
                  ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Render table rows */}
            {financialData.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                <TableCell>{row.Metric}</TableCell>
                {Object.keys(row)
                  .filter((key) => key !== 'Metric')
                  .map((key, cellIndex) => (
                    <TableCell key={cellIndex} align="right">
                      {row[key]}
                    </TableCell>
                  ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default FinancialData;
