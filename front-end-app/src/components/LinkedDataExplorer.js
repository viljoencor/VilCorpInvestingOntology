// LinkedDataExplorer.js
import React, { useEffect, useState, useRef } from "react";
import { DataSet, Network } from "vis-network/standalone/esm/vis-network";
import "vis-network/styles/vis-network.css";
import {
  Box,
  Typography,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

const LinkedDataExplorer = ({ results, financialStatistics }) => {
  const containerRef = useRef(null);
  const networkRef = useRef(null);
  // Dropdown states for filtering
  const [selectedCompany, setSelectedCompany] = useState("All");
  const [selectedGroup, setSelectedGroup] = useState("All");
  const [physicsEnabled, setPhysicsEnabled] = useState(true);

  // Define how each high-level group maps to sub-groups that should be shown
  const groupMapping = {
    Performance: ["Performance", "PerformanceMetric", "Company"],
    Financial: ["Financial", "FinancialMetric", "Company"],
    Statistics: ["Statistics", "StatisticsSection", "Statistic", "Company"],
    News: ["News", "NewsItem", "Company"],
  };

  // Build the complete nodes array (with edges)
  const buildNodesAndEdges = () => {
    const nodes = [];
    const edges = [];

    // For each ticker in results
    Object.keys(results).forEach((ticker) => {
      // Company node
      nodes.push({
        id: ticker,
        label: ticker,
        group: "Company",
        title: `Company: ${ticker}`,
      });

      // Performance Overview aggregated node
      if (results[ticker].performance_overview) {
        const perfNodeId = `${ticker}_performance`;
        nodes.push({
          id: perfNodeId,
          label: "Performance",
          group: "Performance",
          title: "Performance Overview",
        });
        edges.push({ from: ticker, to: perfNodeId, label: "Performance" });

        // Individual performance metric nodes
        Object.entries(results[ticker].performance_overview).forEach(
          ([metric, value]) => {
            const metricNodeId = `${ticker}_perf_${metric}`;
            nodes.push({
              id: metricNodeId,
              label: `${metric}: ${value}%`,
              group: "PerformanceMetric",
              title: `${metric} value: ${value}%`,
            });
            edges.push({ from: perfNodeId, to: metricNodeId, label: metric });
          }
        );
      }

      // Financial Metrics aggregated node
      if (results[ticker].financial_metrics) {
        const finNodeId = `${ticker}_financial`;
        nodes.push({
          id: finNodeId,
          label: "Financial Metrics",
          group: "Financial",
          title: "Financial Metrics",
        });
        edges.push({ from: ticker, to: finNodeId, label: "Financial Metrics" });

        Object.entries(results[ticker].financial_metrics).forEach(
          ([key, value]) => {
            const finMetricNodeId = `${ticker}_fin_${key}`;
            nodes.push({
              id: finMetricNodeId,
              label: `${key}: ${value}`,
              group: "FinancialMetric",
              title: `${key} = ${value}`,
            });
            edges.push({ from: finNodeId, to: finMetricNodeId, label: key });
          }
        );
      }

      // Financial Statistics aggregated node
      if (financialStatistics[ticker]) {
        const statsNodeId = `${ticker}_stats`;
        nodes.push({
          id: statsNodeId,
          label: "Financial Statistics",
          group: "Statistics",
          title: "Financial Statistics",
        });
        edges.push({ from: ticker, to: statsNodeId, label: "Statistics" });

        Object.entries(financialStatistics[ticker]).forEach(
          ([section, stats]) => {
            const sectionNodeId = `${ticker}_stats_${section}`;
            nodes.push({
              id: sectionNodeId,
              label: section,
              group: "StatisticsSection",
              title: section,
            });
            edges.push({ from: statsNodeId, to: sectionNodeId, label: section });
            Object.entries(stats).forEach(([key, value]) => {
              const statNodeId = `${ticker}_stats_${section}_${key}`;
              nodes.push({
                id: statNodeId,
                label: `${key}: ${value}`,
                group: "Statistic",
                title: `${key} = ${value}`,
              });
              edges.push({ from: sectionNodeId, to: statNodeId, label: key });
            });
          }
        );
      }

      // News Insights aggregated node
      if (
        results[ticker].news_insights &&
        results[ticker].news_insights.length > 0
      ) {
        const newsNodeId = `${ticker}_news`;
        nodes.push({
          id: newsNodeId,
          label: "News",
          group: "News",
          title: "News Insights",
        });
        edges.push({ from: ticker, to: newsNodeId, label: "News" });

        const sortedNews = [...results[ticker].news_insights].sort(
          (a, b) =>
            new Date(b.publicationDate) - new Date(a.publicationDate)
        );
        const top5News = sortedNews.slice(0, 5);
        top5News.forEach((news, index) => {
          const newsItemId = `${ticker}_news_${index}`;
          nodes.push({
            id: newsItemId,
            label: news.title,
            group: "NewsItem",
            title: `Published on ${news.publicationDate}\n${news.url}`,
          });
          edges.push({ from: newsNodeId, to: newsItemId, label: "Article" });
        });
      }
    });

    return { nodes, edges };
  };

  // Filter nodes based on selected company & group
  const filterNodes = (nodes) => {
    return nodes.filter((node) => {
      // 1) If a specific company is selected, show only that company & its related nodes
      if (selectedCompany !== "All") {
        // If node's ID starts with the selected ticker or is exactly the ticker node
        const isThisCompanyNode = node.id.startsWith(selectedCompany);
        const isCompanyNodeItself = node.group === "Company" && node.id === selectedCompany;
        if (!isThisCompanyNode && !isCompanyNodeItself) {
          return false;
        }
      }

      // 2) If a specific group is selected, show that group and any subgroups we define
      if (selectedGroup !== "All") {
        const groupsToShow = groupMapping[selectedGroup] || [selectedGroup, "Company"];
        return groupsToShow.includes(node.group);
      }

      // Default: if no filtering is triggered, show all
      return true;
    });
  };

  useEffect(() => {
    const { nodes, edges } = buildNodesAndEdges();

    // Deduplicate nodes by id
    const uniqueNodes = {};
    nodes.forEach((node) => {
      uniqueNodes[node.id] = node;
    });
    const nodeArray = Object.values(uniqueNodes);
    const filteredNodes = filterNodes(nodeArray);

    const data = {
      nodes: new DataSet(filteredNodes),
      edges: new DataSet(edges),
    };

    const options = {
      nodes: {
        shape: "box",
        font: { size: 14 },
        color: {
          border: "#333333",
          background: "#FFFFFF",
          highlight: { background: "#FFEB3B", border: "#FBC02D" },
        },
      },
      edges: {
        arrows: "to",
        smooth: true,
      },
      groups: {
        Company: { color: { background: "#99CCFF", border: "#3366FF" } },
        Performance: { color: { background: "#99FF99", border: "#33CC33" } },
        PerformanceMetric: { color: { background: "#C8E6C9", border: "#388E3C" } },
        Financial: { color: { background: "#FF9999", border: "#FF3333" } },
        FinancialMetric: { color: { background: "#FFCDD2", border: "#D32F2F" } },
        Statistics: { color: { background: "#D1C4E9", border: "#673AB7" } },
        StatisticsSection: { color: { background: "#B39DDB", border: "#5E35B1" } },
        Statistic: { color: { background: "#E1BEE7", border: "#8E24AA" } },
        News: { color: { background: "#FFE082", border: "#FFA000" } },
        NewsItem: { color: { background: "#FFF9C4", border: "#FBC02D" } },
        default: { color: { background: "#CCCCCC", border: "#999999" } },
      },
      layout: { improvedLayout: true },
      physics: { enabled: physicsEnabled, stabilization: { iterations: 100 } },
    };

    // Initialize or update the network
    if (containerRef.current) {
      networkRef.current = new Network(containerRef.current, data, options);

      // Node click event to show details (alert for simplicity)
      networkRef.current.on("click", (params) => {
        if (params.nodes.length) {
          const nodeId = params.nodes[0];
          const nodeData = data.nodes.get(nodeId);
          alert(
            `Node Details:\nLabel: ${nodeData.label}\nGroup: ${nodeData.group}\nTitle: ${
              nodeData.title || "No details"
            }`
          );
        }
      });

      // Hover event logging
      networkRef.current.on("hoverNode", (params) => {
        console.log("Hovering over node:", params.node);
      });

      // Cluster news items per ticker as before
      Object.keys(results).forEach((ticker) => {
        const newsNodeId = `${ticker}_news`;
        // Check if the node exists in the filtered DataSet
        if (data.nodes.get(newsNodeId)) {
          try {
            networkRef.current.clusterByConnection({
              nodeId: newsNodeId,
              joinCondition: (childOptions) =>
                childOptions.group === "NewsItem",
              clusterNodeProperties: {
                id: `${ticker}_news_cluster`,
                label: "News Cluster",
                shape: "ellipse",
              },
            });
          } catch (err) {
            console.error(`Error clustering news for ${ticker}:`, err.message);
          }
        } else {
          console.warn(
            `Skipping clustering for ${ticker}: News node "${newsNodeId}" not found in the current dataset.`
          );
        }
      });
    }
  }, [results, financialStatistics, selectedCompany, selectedGroup, physicsEnabled]);

  // Handler for company dropdown change
  const handleCompanyChange = (e) => {
    setSelectedCompany(e.target.value);
  };

  // Handler for group dropdown change
  const handleGroupChange = (e) => {
    setSelectedGroup(e.target.value);
  };

  // Handler to toggle physics
  const togglePhysics = () => {
    setPhysicsEnabled((prev) => !prev);
    if (networkRef.current) {
      networkRef.current.setOptions({ physics: { enabled: !physicsEnabled } });
    }
  };

  // Gather list of companies (tickers) from results
  const companyOptions = Object.keys(results);

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Linked Data Exploration
      </Typography>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel id="company-dropdown-label">Select Company</InputLabel>
            <Select
              labelId="company-dropdown-label"
              value={selectedCompany}
              label="Select Company"
              onChange={handleCompanyChange}
            >
              <MenuItem value="All">All</MenuItem>
              {companyOptions.map((comp) => (
                <MenuItem key={comp} value={comp}>
                  {comp}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel id="group-dropdown-label">Filter by Group</InputLabel>
            <Select
              labelId="group-dropdown-label"
              value={selectedGroup}
              label="Filter by Group"
              onChange={handleGroupChange}
            >
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="Performance">Performance</MenuItem>
              <MenuItem value="Financial">Financial</MenuItem>
              <MenuItem value="Statistics">Statistics</MenuItem>
              <MenuItem value="News">News</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Button variant="contained" onClick={togglePhysics} fullWidth>
            {physicsEnabled ? "Disable Physics" : "Enable Physics"}
          </Button>
        </Grid>
      </Grid>
      <div
        ref={containerRef}
        id="linked-data-container"
        style={{ height: "600px", border: "1px solid gray" }}
      ></div>
    </Box>
  );
};

export default LinkedDataExplorer;
