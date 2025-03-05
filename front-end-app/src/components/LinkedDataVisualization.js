import React, { useEffect, useState } from 'react';
import { DataSet, Network } from 'vis-network/standalone/esm/vis-network';
import 'vis-network/styles/vis-network.css';

const RDFGraphVisualization = () => {
  // graphData holds two views: simplified and detailed
  const [graphData, setGraphData] = useState({ simplified: { nodes: [], edges: [] }, detailed: { nodes: [], edges: [] } });
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState('detailed'); // "detailed" or "simplified"
  const [ticker, setTicker] = useState(''); // default ticker

  // Fetch graph data using the ticker input
  const fetchGraphData = () => {
    fetch(`http://localhost:5000/rdf-graph-data?ticker=${ticker}`)
      .then((response) => response.json())
      .then((data) => {
        if (!data.nodes) {
          console.error("Invalid data structure:", data);
          return;
        }
        const simplifiedData = simplifyGraph(data, ticker);
        const detailedData = createDetailedGraph(data);
        setGraphData({ simplified: simplifiedData, detailed: detailedData });
      })
      .catch((error) => console.error('Error fetching RDF graph data:', error));
  };

  // Initial load with default ticker
  useEffect(() => {
    fetchGraphData();
  }, []);

  // Handlers for ticker input and load button
  const handleTickerChange = (e) => {
    setTicker(e.target.value);
  };

  const handleLoadGraph = () => {
    fetchGraphData();
  };

  // Simplify graph: create a high-level, summarized structure
  const simplifyGraph = (data, ticker) => {
    const nodes = [];
    const edges = [];
    const seen = new Set();

    const addNode = (id, label, group) => {
      if (!seen.has(id)) {
        nodes.push({ id, label, group });
        seen.add(id);
      }
    };

    const addEdge = (from, to, label) => {
      edges.push({ from, to, label });
    };

    // Dynamically add company node based on the ticker
    const companyNode = data.nodes.find((n) => n.label === ticker);
    if (companyNode) {
      addNode(companyNode.id, companyNode.label, 'Company');
      addEdge(companyNode.id, 'financial-metrics', 'hasMetrics');
    } else {
      console.warn("Company node with label", ticker, "not found.");
    }

    // Add a summary node for financial metrics
    addNode('financial-metrics', 'Financial Metrics', 'Summary');
    data.nodes
      .filter((n) =>
        n.id.includes('FinancialMetric') ||
        n.id.includes('Debt') ||
        n.id.includes('Market_Cap') ||
        n.id.includes('P/E') ||
        n.id.includes('Revenue')
      )
      .forEach((metric) => {
        const valueEdge = data.edges.find((e) => e.from === metric.id && e.label === 'metricValue');
        addNode(metric.id, `${metric.label}: ${valueEdge ? valueEdge.to : ''}`, 'Financial');
        addEdge('financial-metrics', metric.id, 'hasMetric');
      });

    // Add performance overview section (if any)
    addNode('performance', 'Performance Overview', 'Summary');
    if (companyNode) {
      addEdge(companyNode.id, 'performance', 'hasPerformance');
    }
    data.nodes
      .filter((n) => n.id.includes('PerformanceOverview'))
      .forEach((overview) => {
        const cpiReturnEdge = data.edges.find((e) => e.from === overview.id && e.label === 'cpiReturn');
        addNode(overview.id, `${overview.label}: ${cpiReturnEdge ? cpiReturnEdge.to : ''}%`, 'Performance');
        addEdge('performance', overview.id, 'includes');
      });

    // Add news articles summary (if any)
    addNode('news', 'News Articles', 'Summary');
    if (companyNode) {
      addEdge(companyNode.id, 'news', 'hasNews');
    }
    data.nodes
      .filter((n) => n.id.includes('NewsArticle'))
      .forEach((article) => {
        const headlineEdge = data.edges.find((e) => e.from === article.id && e.label === 'headline');
        addNode(article.id, headlineEdge ? headlineEdge.to : 'News', 'News');
        addEdge('news', article.id, 'mentions');
      });

    return { nodes, edges };
  };

  // Create detailed graph view
  const createDetailedGraph = (data) => {
    const nodes = [];
    const edges = [];
    const nodeMap = new Map();

    data.nodes.forEach((node) => {
      let group = determineGroup(node.label);
      if (!nodeMap.has(node.id)) {
        nodeMap.set(node.id, {
          id: node.id,
          label: node.label,
          title: `Details: ${node.label}`,
          group: group,
        });
      }
    });

    data.edges.forEach((edge) => {
      if (nodeMap.has(edge.from) && nodeMap.has(edge.to) && edge.label !== '22-rdf-syntax-ns#type') {
        edges.push({ from: edge.from, to: edge.to, label: edge.label, arrows: 'to' });
      } else if (nodeMap.has(edge.from) && nodeMap.has(edge.to)) {
        edges.push({ from: edge.from, to: edge.to, label: edge.label, arrows: 'to' });
      }
    });

    return { nodes: Array.from(nodeMap.values()), edges };
  };

  // Determine node group based on its label
  const determineGroup = (label) => {
    if (label.includes('Return')) return 'Performance';
    if (label.includes('News') || label.includes('Blog')) return 'News';
    if (label.includes('PE') || label.includes('ROE')) return 'Financial';
    if (label === ticker) return 'Company';
    return 'Other';
  };

  // Apply filter to graph nodes
  const applyFilter = (type) => {
    setFilterType(type);
  };

  // Get current graph view based on view mode and filter
  const currentGraph = () => {
    const graph = viewMode === 'detailed' ? graphData.detailed : graphData.simplified;
    return filterType === 'all'
      ? graph
      : {
          nodes: graph.nodes.filter((node) => node.group === filterType),
          edges: graph.edges,
        };
  };

  // Render the graph whenever data, filter, or view mode changes
  useEffect(() => {
    if (graphData.detailed.nodes.length > 0) {
      const container = document.getElementById('rdf-graph-container');
      const filteredGraph = currentGraph();

      const data = {
        nodes: new DataSet(filteredGraph.nodes),
        edges: new DataSet(filteredGraph.edges),
      };

      const options = {
        layout: { improvedLayout: true },
        physics: { enabled: true, stabilization: { iterations: 100 } },
        edges: { smooth: true, arrows: 'to' },
        nodes: { shape: 'dot', size: 20, font: { size: 14 } },
        groups: {
          Company: { color: { background: '#99CCFF', border: '#3366FF' } },
          Financial: { color: { background: '#FF9999', border: '#FF3333' } },
          Performance: { color: { background: '#99FF99', border: '#33CC33' } },
          News: { color: { background: '#FFCCFF', border: '#FF66FF' } },
          Other: { color: { background: '#CCCCCC', border: '#999999' } },
          Summary: { color: { background: '#FFD700', border: '#FFA500' } },
        },
      };

      new Network(container, data, options);
    }
  }, [graphData, filterType, viewMode]);

  return (
    <div>
      <h2>RDF Graph Visualization</h2>
      <div>
        <label>Ticker: </label>
        <input type="text" value={ticker} onChange={handleTickerChange} />
        <button onClick={handleLoadGraph}>Load Graph</button>
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label>View Mode: </label>
        <button onClick={() => setViewMode('simplified')}>Simplified</button>
        <button onClick={() => setViewMode('detailed')}>Detailed</button>
        <label style={{ marginLeft: '10px' }}>Filter Nodes: </label>
        <select onChange={(e) => applyFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="Company">Company</option>
          <option value="Financial">Financial Metrics</option>
          <option value="Performance">Performance Overview</option>
          <option value="News">News Articles</option>
          <option value="Summary">Summary</option>
        </select>
      </div>
      <div id="rdf-graph-container" style={{ height: '600px', border: '1px solid black' }}></div>
    </div>
  );
};

export default RDFGraphVisualization;
