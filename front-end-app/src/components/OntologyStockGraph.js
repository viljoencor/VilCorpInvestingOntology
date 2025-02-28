import React, { useEffect, useState } from "react";
import { Container, Typography, Box, Paper } from "@mui/material";
import axios from "axios";
import { Network } from "vis-network/standalone/esm/vis-network";

const FinancialOntologyGraph = () => {
  const [graphData, setGraphData] = useState(null);
  const [ticker, setTicker] = useState("AAPL");
  const [years, setYears] = useState(5);

  useEffect(() => {
    axios.get(`http://localhost:5000/rdf-stock-data?ticker=${ticker}&years=${years}`)
      .then((response) => {
        parseRDF(response.data);
      })
      .catch((error) => {
        console.error("Error loading RDF data:", error);
      });
  }, [ticker, years]);

  const parseRDF = (rdfData) => {
    const nodes = [];
    const edges = [];

    const lines = rdfData.split("\n");
    lines.forEach(line => {
      if (line.includes("StockPrice")) {
        const parts = line.split(" ");
        const stockDate = parts[0].split("_").pop();
        const price = parseFloat(parts[parts.length - 2]);

        nodes.push({ id: stockDate, label: stockDate, group: "StockPrice" });
        edges.push({ from: ticker, to: stockDate, label: `$${price}` });
      }
    });

    setGraphData({ nodes, edges });
  };

  useEffect(() => {
    if (!graphData) return;
    
    const container = document.getElementById("ontologyGraph");
    const options = { nodes: { shape: "dot", size: 15 }, edges: { arrows: "to" } };
    new Network(container, graphData, options);
  }, [graphData]);

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom textAlign="center">
        Financial Knowledge Graph
      </Typography>
      <Paper elevation={3} sx={{ padding: 3 }}>
        <Box id="ontologyGraph" sx={{ height: "500px", border: "1px solid #ddd" }}></Box>
      </Paper>
    </Container>
  );
};

export default FinancialOntologyGraph;
