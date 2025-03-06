// LinkedFinnhubExplorer.js
import React, { useEffect, useRef } from "react";
import { DataSet, Network } from "vis-network/standalone/esm/vis-network";
import "vis-network/styles/vis-network.css";
import { Box, Typography } from "@mui/material";

const LinkedFinnhubExplorer = ({ mode, dataSet, description }) => {
  const containerRef = useRef(null);
  const networkRef = useRef(null);

  // Build nodes and edges based on the chosen mode.
  const buildGraphData = () => {
    const nodes = [];
    const edges = [];

    if (!dataSet) return { nodes, edges };

    // Use the company profile data for the central node.
    const profile = dataSet.profile;
    let companyId = "UnknownCompany";
    let companyLabel = "Unknown";
    if (profile && !profile.error) {
      companyId = profile.ticker || "UnknownCompany";
      companyLabel = profile.name || profile.ticker || "Unknown";
    }

    // Main Company Node
    nodes.push({
      id: companyId,
      label: companyLabel,
      group: "Company",
      title: `Company: ${companyLabel}\nTicker: ${profile ? profile.ticker : "N/A"}`,
    });

    if (mode === "profile" && profile && !profile.error) {
        const details = [
          `Industry: ${profile.finnhubIndustry || "N/A"}`,
          `Market Cap: ${profile.marketCapitalization || "N/A"}`,
          `Website: ${profile.weburl || "N/A"}`,
          `IPO: ${profile.ipo || "N/A"}`
        ].join("\n");
        const profileNodeId = `${companyId}_profile`;
      
        // Parent node for Profile
        nodes.push({
          id: profileNodeId,
          label: "Profile",
          group: "Profile",
          title: "Company profile data from Finnhub"
        });
        edges.push({ from: companyId, to: profileNodeId, label: "has profile" });
      
        // Sub-nodes for each key field
        const subNodeData = [
          { label: "Industry", value: profile.finnhubIndustry },
          { label: "Market Cap", value: profile.marketCapitalization },
          { label: "Website", value: profile.weburl },
          { label: "IPO", value: profile.ipo }
        ];
      
        subNodeData.forEach((item, idx) => {
          const itemNodeId = `${profileNodeId}_item${idx}`;
          nodes.push({
            id: itemNodeId,
            label: `${item.label}: ${item.value || "N/A"}`,
            group: "Profile",
            title: `${item.label}\n${item.value || "N/A"}`
          });
          edges.push({ from: profileNodeId, to: itemNodeId, label: "field" });
        });
      }
      

    if (mode === "financials" && dataSet.financials && !dataSet.financials.error) {
        // dataSet.financials might be an array or an object with a 'data' array
        const finData = Array.isArray(dataSet.financials)
          ? dataSet.financials
          : dataSet.financials.data;
      
        if (Array.isArray(finData) && finData.length > 0) {
          // Create a main node for all financials
          const finNodeId = `${companyId}_financials`;
          nodes.push({
            id: finNodeId,
            label: "Financials",
            group: "Financials",
            title: "Financial statements from Finnhub",
          });
          edges.push({ from: companyId, to: finNodeId, label: "has financials" });
      
          // For each financial statement entry (limit to 5 for clarity)
          finData.slice(0, 5).forEach((statement, idx) => {
            const periodNodeId = `${finNodeId}_period${idx}`;
      
            // The node label is the end date (e.g. "2015-12-31")
            const periodLabel = statement.endDate
              ? `Period: ${statement.endDate.slice(0, 10)}`
              : `Period ${idx + 1}`;
      
            // We'll gather some top-level info in a short summary
            const summary = [
              `End Date: ${statement.endDate || "N/A"}`,
              `Accepted Date: ${statement.acceptedDate || "N/A"}`,
              `Form: ${statement.form || "N/A"}`,
              `Year: ${statement.year || "N/A"}`
            ].join("\n");
      
            // Create a node for this period
            nodes.push({
              id: periodNodeId,
              label: periodLabel,
              group: "FinancialsItem",
              title: summary
            });
            edges.push({ from: finNodeId, to: periodNodeId, label: "statement" });
      
            // Now we parse the sub-arrays: bs, cf, ic
            const { bs, cf, ic } = statement.report || {};
      
            // 1) Balance Sheet
            if (Array.isArray(bs) && bs.length > 0) {
              const bsNodeId = `${periodNodeId}_bs`;
              nodes.push({
                id: bsNodeId,
                label: "Balance Sheet",
                group: "FinancialsItem",
                title: "Balance sheet line items"
              });
              edges.push({ from: periodNodeId, to: bsNodeId, label: "BS" });
      
              // Show top 3 line items from the BS array
              bs.slice(0, 3).forEach((line, lineIdx) => {
                const lineNodeId = `${bsNodeId}_line${lineIdx}`;
                const lineSummary = [
                  `Concept: ${line.concept}`,
                  `Label: ${line.label}`,
                  `Value: ${line.value}`
                ].join("\n");
      
                nodes.push({
                  id: lineNodeId,
                  label: line.label || `BS Item ${lineIdx + 1}`,
                  group: "FinancialsItem",
                  title: lineSummary
                });
                edges.push({ from: bsNodeId, to: lineNodeId, label: "item" });
              });
            }
      
            // 2) Cash Flow
            if (Array.isArray(cf) && cf.length > 0) {
              const cfNodeId = `${periodNodeId}_cf`;
              nodes.push({
                id: cfNodeId,
                label: "Cash Flow",
                group: "FinancialsItem",
                title: "Cash flow line items"
              });
              edges.push({ from: periodNodeId, to: cfNodeId, label: "CF" });
      
              cf.slice(0, 3).forEach((line, lineIdx) => {
                const lineNodeId = `${cfNodeId}_line${lineIdx}`;
                const lineSummary = [
                  `Concept: ${line.concept}`,
                  `Label: ${line.label}`,
                  `Value: ${line.value}`
                ].join("\n");
      
                nodes.push({
                  id: lineNodeId,
                  label: line.label || `CF Item ${lineIdx + 1}`,
                  group: "FinancialsItem",
                  title: lineSummary
                });
                edges.push({ from: cfNodeId, to: lineNodeId, label: "item" });
              });
            }
      
            // 3) Income Statement
            if (Array.isArray(ic) && ic.length > 0) {
              const icNodeId = `${periodNodeId}_ic`;
              nodes.push({
                id: icNodeId,
                label: "Income Statement",
                group: "FinancialsItem",
                title: "Income statement line items"
              });
              edges.push({ from: periodNodeId, to: icNodeId, label: "IC" });
      
              ic.slice(0, 3).forEach((line, lineIdx) => {
                const lineNodeId = `${icNodeId}_line${lineIdx}`;
                const lineSummary = [
                  `Concept: ${line.concept}`,
                  `Label: ${line.label}`,
                  `Value: ${line.value}`
                ].join("\n");
      
                nodes.push({
                  id: lineNodeId,
                  label: line.label || `IC Item ${lineIdx + 1}`,
                  group: "FinancialsItem",
                  title: lineSummary
                });
                edges.push({ from: icNodeId, to: lineNodeId, label: "item" });
              });
            }
          });
        }
      }
      

    if (mode === "secFilings" && dataSet.secFilings && !dataSet.secFilings.error) {
    const filings = Array.isArray(dataSet.secFilings) ? dataSet.secFilings : [];
    if (filings.length > 0) {
        const secNodeId = `${companyId}_sec`;
        nodes.push({
        id: secNodeId,
        label: "SEC Filings",
        group: "Filings",
        title: "List of SEC Filings from Finnhub"
        });
        edges.push({ from: companyId, to: secNodeId, label: "has filings" });
    
        // Show top 5 filings
        filings.slice(0, 5).forEach((filing, idx) => {
        const filingNodeId = `${secNodeId}_filing${idx}`;
        const summary = [
            `Form: ${filing.form}`,
            `Filed Date: ${filing.filedDate || "N/A"}`,
            `Accepted Date: ${filing.acceptedDate || "N/A"}`,
            `URL: ${filing.filingUrl}`
        ].join("\n");
        nodes.push({
            id: filingNodeId,
            label: filing.form ? `Form: ${filing.form}` : `Filing ${idx + 1}`,
            group: "FilingsItem",
            title: summary
        });
        edges.push({ from: secNodeId, to: filingNodeId, label: "filing" });
        });
    }
      }
      

    if (mode === "insider" && dataSet.insider && !dataSet.insider.error) {
    // Assume the insider data is in dataSet.insider.data (an array)
    const insiderData = Array.isArray(dataSet.insider.data)
        ? dataSet.insider.data
        : [];
    if (insiderData.length > 0) {
        const insiderNodeId = `${companyId}_insider`;
        nodes.push({
        id: insiderNodeId,
        label: "Insider Transactions",
        group: "Insider",
        title: "Insider transactions and institutional holdings from Finnhub"
        });
        edges.push({ from: companyId, to: insiderNodeId, label: "has insider data" });
        
        // Sort the transactions by the number of shares (largest first)
        const sortedInsider = insiderData.sort((a, b) => {
        const sharesA = Number(a.share) || 0;
        const sharesB = Number(b.share) || 0;
        return sharesB - sharesA;
        });
        
        // Take the top 10 transactions
        const top10 = sortedInsider.slice(0, 10);
        top10.forEach((transaction, idx) => {
        const transNodeId = `${insiderNodeId}_item${idx}`;
        const summary = [
            `Name: ${transaction.name}`,
            `Transaction Date: ${transaction.transactionDate}`,
            `Filing Date: ${transaction.filingDate}`,
            `Shares: ${transaction.share}`,
            `Change: ${transaction.change}`,
            `Transaction Price: ${transaction.transactionPrice}`,
            `Code: ${transaction.transactionCode}`
        ].join("\n");
        nodes.push({
            id: transNodeId,
            label: `${transaction.name} (${transaction.transactionDate})`,
            group: "InsiderItem",
            title: summary
        });
        edges.push({ from: insiderNodeId, to: transNodeId, label: "transaction" });
        });
    }
    }
      

    if (mode === "news" && dataSet.news && !dataSet.news.error) {
        const newsArray = Array.isArray(dataSet.news) ? dataSet.news : [];
        if (newsArray.length > 0) {
          const newsNodeId = `${companyId}_news`;
          nodes.push({
            id: newsNodeId,
            label: "News",
            group: "News",
            title: "Recent company news from Finnhub"
          });
          edges.push({ from: companyId, to: newsNodeId, label: "has news" });
      
          // Show top 5 news articles
          newsArray.slice(0, 5).forEach((article, idx) => {
            const articleNodeId = `${newsNodeId}_article${idx}`;
            const summary = [
              `Headline: ${article.headline || "N/A"}`,
              `Date: ${
                article.datetime
                  ? new Date(article.datetime * 1000).toLocaleString()
                  : "N/A"
              }`,
              `Source: ${article.source || "N/A"}`,
              `URL: ${article.url || "N/A"}`
            ].join("\n");
      
            nodes.push({
              id: articleNodeId,
              label: article.headline?.slice(0, 30) || `Article ${idx + 1}`,
              group: "NewsArticle",
              title: summary
            });
            edges.push({ from: newsNodeId, to: articleNodeId, label: "article" });
          });
        }
      }
      

    if (mode === "wikidata" && dataSet.wikidata && !dataSet.wikidata.note) {
    const wdNodeId = `${companyId}_wikidata`;
    nodes.push({
        id: wdNodeId,
        label: "Wikidata",
        group: "Wikidata",
        title: "Additional data from Wikidata"
    });
    edges.push({ from: companyId, to: wdNodeId, label: "enriched by" });
    
    // Suppose we look for headquartersLabel, inception, etc.
    const headQ = dataSet.wikidata.headquartersLabel?.value;
    const inception = dataSet.wikidata.inception?.value;
    
    if (headQ) {
        const hqNodeId = `${wdNodeId}_hq`;
        nodes.push({
        id: hqNodeId,
        label: `HQ: ${headQ}`,
        group: "WikidataItem",
        title: `Headquarters: ${headQ}`
        });
        edges.push({ from: wdNodeId, to: hqNodeId, label: "headquarters" });
    }
    
    if (inception) {
        const incNodeId = `${wdNodeId}_inception`;
        nodes.push({
        id: incNodeId,
        label: `Inception: ${inception.slice(0, 10)}`,
        group: "WikidataItem",
        title: `Inception date: ${inception}`
        });
        edges.push({ from: wdNodeId, to: incNodeId, label: "inception" });
    }
    }
      
    return { nodes, edges };
  };

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
        Financials: { color: { background: "#B39DDB", border: "#5E35B1" } },
        FinancialsItem: { color: { background: "#D1C4E9", border: "#7E57C2" } },
        Filings: { color: { background: "#FFE082", border: "#FFA000" } },
        FilingsItem: { color: { background: "#FFD54F", border: "#FFA000" } },
        Ownership: { color: { background: "#80CBC4", border: "#00897B" } },
        Holder: { color: { background: "#4DB6AC", border: "#00695C" } },
        News: { color: { background: "#EF9A9A", border: "#E53935" } },
        NewsArticle: { color: { background: "#FFCDD2", border: "#E53935" } },
        Wikidata: { color: { background: "#CE93D8", border: "#AB47BC" } },
        WikidataItem: { color: { background: "#F48FB1", border: "#EC407A" } },
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
        }
      });
    }
  }, [mode, dataSet]);

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {description}
      </Typography>
      <div ref={containerRef} style={{ height: "600px", border: "1px solid #CCC" }}></div>
    </Box>
  );
};

export default LinkedFinnhubExplorer;
