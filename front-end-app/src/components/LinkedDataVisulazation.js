import React, { useEffect, useState } from 'react';
import { DataSet, Network } from 'vis-network/standalone/esm/vis-network';
import 'vis-network/styles/vis-network.css';

const RDFGraphSimplified = () => {
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState('detailed'); // Toggle between views

  useEffect(() => {
    fetch('http://localhost:5000/rdf-graph-data')
      .then((response) => response.json())
      .then((data) => {
        const simplifiedData = simplifyGraph(data);
        const detailedData = createDetailedGraph(data);
        setGraphData({ simplified: simplifiedData, detailed: detailedData });
      })
      .catch((error) => console.error('Error fetching RDF graph data:', error));
  }, []);

  // Simplify graph: Create a high-level, summarized structure
  const simplifyGraph = (data) => {
    const nodes = [];
    const edges = [];
    const seen = new Set();

    const addNode = (id, label, group) => {
      if (!seen.has(id)) {
        nodes.push({ id, label, group });
        seen.add(id);
      }
    };

    const addEdge = (from, to, label) => edges.push({ from, to, label });

    // Add company node
    const companyNode = data.nodes.find((n) => n.label === 'Capitec_Bank');
    if (companyNode) addNode(companyNode.id, 'Capitec Bank', 'Company');

    // Add financial metrics
    addNode('financial-metrics', 'Financial Metrics', 'Summary');
    addEdge(companyNode.id, 'financial-metrics', 'hasMetrics');

    data.nodes
      .filter((n) => n.id.includes('FinancialMetric'))
      .forEach((metric) => {
        const valueEdge = data.edges.find((e) => e.from === metric.id && e.label === 'metricValue');
        addNode(metric.id, `${metric.label}: ${valueEdge?.to || ''}`, 'Financial');
        addEdge('financial-metrics', metric.id);
      });

    // Add performance overview
    addNode('performance', 'Performance Overview', 'Summary');
    addEdge(companyNode.id, 'performance', 'hasPerformance');

    data.nodes
      .filter((n) => n.id.includes('PerformanceOverview'))
      .forEach((overview) => {
        const cpiReturnEdge = data.edges.find((e) => e.from === overview.id && e.label === 'cpiReturn');
        addNode(overview.id, `${overview.label}: ${cpiReturnEdge?.to || ''}%`, 'Performance');
        addEdge('performance', overview.id);
      });

    // Add news articles
    addNode('news', 'News Articles', 'Summary');
    addEdge(companyNode.id, 'news', 'hasNews');

    data.nodes
      .filter((n) => n.id.includes('NewsArticle'))
      .forEach((article) => {
        const headlineEdge = data.edges.find((e) => e.from === article.id && e.label === 'headline');
        addNode(article.id, headlineEdge?.to || 'News', 'News');
        addEdge('news', article.id, 'mentions');
      });

    return { nodes, edges };
  };

  
  // Create a detailed graph view
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
      }
      else if(nodeMap.has(edge.from) && nodeMap.has(edge.to)){
        edges.push({ from: edge.from, to: edge.to, label: edge.label, arrows: 'to' });
      }
    });

    return { nodes: Array.from(nodeMap.values()), edges };
  };

  const determineGroup = (label) => {
    if (label.includes('Return')) return 'Performance';
    if (label.includes('News') || label.includes('Blog')) return 'News';
    if (label.includes('PE') || label.includes('ROE')) return 'Financial';
    if (label.includes('Bank')) return 'Company';
    return 'Other';
  };

  const applyFilter = (type) => {
    setFilterType(type);
  };

  const currentGraph = () => {
    const graph = viewMode === 'detailed' ? graphData.detailed : graphData.simplified;
    return filterType === 'all'
      ? graph
      : {
          nodes: graph.nodes.filter((node) => node.group === filterType),
          edges: graph.edges,
        };
  };

  useEffect(() => {
    if (graphData.detailed) {
      const container = document.getElementById('rdf-graph-container');
      const filteredGraph = currentGraph();

      const data = {
        nodes: new DataSet(filteredGraph.nodes),
        edges: new DataSet(filteredGraph.edges),
      };

      const options = {
        layout: {
          improvedLayout: true,
        },
        physics: {
          enabled: true,
          stabilization: { iterations: 100 },
        },
        edges: {
          smooth: true,
          arrows: 'to',
        },
        nodes: {
          shape: 'dot',
          size: 20,
          font: { size: 14 },
        },
        groups: {
          Company: { color: { background: '#99CCFF', border: '#3366FF' } },
          Financial: { color: { background: '#FF9999', border: '#FF3333' } },
          Performance: { color: { background: '#99FF99', border: '#33CC33' } },
          News: { color: { background: '#FFCCFF', border: '#FF66FF' } },
          Other: { color: { background: '#CCCCCC', border: '#999999' } },
        },
      };

      new Network(container, data, options);
    }
  }, [graphData, filterType, viewMode]);

  return (
    <div>
      <h2>RDF Graph Visualization</h2>

      {/* Filter Controls */}
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
        </select>
      </div>

      {/* Graph Container */}
      <div id="rdf-graph-container" style={{ height: '600px', border: '1px solid black' }}></div>
    </div>
  );
};

export default RDFGraphSimplified;
