import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import NewsInsights from './components/NewsInsights';
import ComparativeAnalysis from './components/ComparativeAnalysis';
import PerformanceOverview from './components/PerformanceOverview';
import FinancialData from './components/FinancialData';
import LinkedDataVisulazation from './components/LinkedDataVisulazation';

const App = () => {
  return (
    <Router>
      <header>
        <h1>VilCorp Investing</h1>
        <nav>
          <Link to="/">Dashboard</Link> 
          | <Link to="/news">News Insights</Link> 
          | <Link to="/compare">Comparative Analysis</Link>
          | <Link to="/perform">Performance Overview</Link>
          | <Link to="/findata">Financial Data</Link>
          | <Link to="/linkdataviz">Linked Data Visulazation</Link>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/news" element={<NewsInsights />} />
          <Route path="/compare" element={<ComparativeAnalysis />} />
          <Route path="/perform" element={<PerformanceOverview />} />
          <Route path="/findata" element={<FinancialData />} />
          <Route path="/linkdataviz" element={<LinkedDataVisulazation />} />
        </Routes>
      </main>
    </Router>
  );
};

export default App;
