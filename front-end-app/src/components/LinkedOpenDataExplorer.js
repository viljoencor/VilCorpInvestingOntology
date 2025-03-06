// LinkedOpenDataExplorer.js
import React, { useEffect, useRef, useState } from "react";
import { DataSet, Network } from "vis-network/standalone/esm/vis-network";
import "vis-network/styles/vis-network.css";
import { Box, Typography } from "@mui/material";

// Real API call to Wikidata using SPARQL to fetch company profile details
async function fetchCompanyProfile(ticker) {
  const query = `
    SELECT ?company ?companyLabel ?industryLabel ?foundingDate ?hqLabel WHERE {
      ?company wdt:P249 ?ticker.
      FILTER(LCASE(?ticker) = "${ticker.toLowerCase()}")
      OPTIONAL { ?company wdt:P452 ?industry. }
      OPTIONAL { ?company wdt:P571 ?foundingDate. }
      OPTIONAL { ?company wdt:P159 ?hq. ?hq rdfs:label ?hqLabel. FILTER(LANG(?hqLabel)="en") }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    LIMIT 1
  `;
  const url = "https://query.wikidata.org/sparql?format=json&query=" + encodeURIComponent(query);
  const response = await fetch(url);
  const data = await response.json();
  if (data.results.bindings.length > 0) {
    return data.results.bindings[0];
  }
  return null;
}

// Real API call to Finnhub for dividend data
async function fetchDividendData(ticker) {
  const token = "cv4aevhr01qn2ga92l9gcv4aevhr01qn2ga92la0"; // Replace with your Finnhub API key
  const url = `https://finnhub.io/api/v1/stock/dividend?symbol=${ticker}&token=${token}`;
  const response = await fetch(url);
  const data = await response.json();
  return data; // Finnhub returns an array of dividend events
}

// Real API call to Finnhub for competitor data
async function fetchCompetitorData(ticker) {
  const token = "cv4aevhr01qn2ga92l9gcv4aevhr01qn2ga92la0"; // Replace with your Finnhub API key
  const url = `https://finnhub.io/api/v1/stock/competitors?symbol=${ticker}&token=${token}`;
  const response = await fetch(url);
  const data = await response.json();
  return data; // Finnhub returns an array of competitor symbols/names
}

const LinkedOpenDataExplorer = ({ mode, enrichedData, description }) => {
  const containerRef = useRef(null);
  const networkRef = useRef(null);
  const [externalData, setExternalData] = useState({});

  // Build graph data using OpenFIGI mapping (enrichedData) and the external API data.
  const buildGraphData = () => {
    const nodes = [];
    const edges = [];
    if (!enrichedData || enrichedData.length === 0) {
      return { nodes, edges };
    }
    // Use the first mapping result from OpenFIGI data.
    const mapping = enrichedData[0].data[0];
    const companyId = mapping.figi; // FIGI as the unique identifier
    const companyLabel = mapping.name;
    const ticker = mapping.ticker;
    const securityDesc = mapping.securityDescription;

    // Company Node: always present.
    nodes.push({
      id: companyId,
      label: companyLabel,
      group: "Company",
      title: `Company: ${companyLabel}\nTicker: ${ticker}\nDescription: ${securityDesc}`,
    });

    // Build additional nodes and edges based on the selected mode.
    if (mode === "companyProfiles" && externalData.profile) {
      const profile = externalData.profile;
      nodes.push({
        id: `${companyId}_profile`,
        label: "Company Profile",
        group: "Profile",
        title: `Management: ${profile.hqLabel ? profile.hqLabel.value : "N/A"}\nFounding Date: ${profile.foundingDate ? profile.foundingDate.value : "N/A"}\nIndustry: ${profile.industryLabel ? profile.industryLabel.value : "N/A"}`,
      });
      edges.push({
        from: companyId,
        to: `${companyId}_profile`,
        label: "has profile",
      });
    } else if (mode === "dividendActions" && externalData.dividend && externalData.dividend.length > 0) {
      // Use the most recent dividend event.
      const lastDividend = externalData.dividend[0];
      nodes.push({
        id: `${companyId}_dividend`,
        label: "Dividend & Corporate Actions",
        group: "Dividend",
        title: `Dividend Yield: ${lastDividend.dividendYield || "N/A"}\nLast Dividend: ${lastDividend.amount || "N/A"} on ${lastDividend.paymentDate || "N/A"}`,
      });
      edges.push({
        from: companyId,
        to: `${companyId}_dividend`,
        label: "has dividend",
      });
    } else if (mode === "semanticAnnotations" && externalData.profile) {
      // Reuse company profile data to represent semantic annotations.
      nodes.push({
        id: `${companyId}_semantic`,
        label: "Semantic Annotations",
        group: "Semantic",
        title: `Annotated with Schema.org & FOAF\nCompany: ${companyLabel}\nTicker: ${ticker}`,
      });
      edges.push({
        from: companyId,
        to: `${companyId}_semantic`,
        label: "annotated as",
      });
    } else if (mode === "competitorMapping" && externalData.competitors) {
      const competitors = externalData.competitors;
      competitors.forEach((comp, index) => {
        nodes.push({
          id: `${companyId}_comp${index}`,
          label: comp.name,
          group: "Competitor",
          title: `Ticker: ${comp.ticker}\nFIGI: ${comp.figi}`,
        });
        edges.push({
          from: companyId,
          to: `${companyId}_comp${index}`,
          label: "competes with",
        });
      });
    }

    return { nodes, edges };
  };

  // Fetch external data based on the selected mode using real API calls.
  useEffect(() => {
    if (!enrichedData || enrichedData.length === 0) return;
    const mapping = enrichedData[0].data[0];
    const ticker = mapping.ticker;
    const fetchData = async () => {
      let extData = {};
      if (mode === "companyProfiles") {
        extData.profile = await fetchCompanyProfile(ticker);
      } else if (mode === "dividendActions") {
        extData.dividend = await fetchDividendData(ticker);
      } else if (mode === "semanticAnnotations") {
        extData.profile = await fetchCompanyProfile(ticker);
      } else if (mode === "competitorMapping") {
        extData.competitors = await fetchCompetitorData(ticker);
      }
      setExternalData(extData);
    };
    fetchData();
  }, [mode, enrichedData]);

  // Build and render graph whenever mode, externalData, or enrichedData change.
  useEffect(() => {
    const { nodes, edges } = buildGraphData();
    const data = {
      nodes: new DataSet(nodes),
      edges: new DataSet(edges),
    };
    const options = {
      nodes: {
        shape: "box",
        font: { size: 14 },
        color: {
          border: "#333",
          background: "#FFF",
          highlight: { background: "#FFEB3B", border: "#FBC02D" },
        },
      },
      edges: {
        arrows: "to",
        smooth: true,
      },
      groups: {
        Company: { color: { background: "#99CCFF", border: "#3366FF" } },
        Profile: { color: { background: "#C5E1A5", border: "#7CB342" } },
        Dividend: { color: { background: "#FFCC80", border: "#FF9800" } },
        Semantic: { color: { background: "#CE93D8", border: "#AB47BC" } },
        Competitor: { color: { background: "#EF9A9A", border: "#E53935" } },
      },
      layout: { improvedLayout: true },
      physics: { enabled: true, stabilization: { iterations: 100 } },
    };

    if (containerRef.current) {
      networkRef.current = new Network(containerRef.current, data, options);
      networkRef.current.on("click", (params) => {
        if (params.nodes.length) {
          const nodeId = params.nodes[0];
          const nodeData = data.nodes.get(nodeId);
          alert(`Node Details:\n${nodeData.title || "No details available"}`);
        }
      });
    }
  }, [mode, externalData, enrichedData]);

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {description}
      </Typography>
      <div ref={containerRef} style={{ height: "600px", border: "1px solid #CCC" }}></div>
    </Box>
  );
};

export default LinkedOpenDataExplorer;
