import React from 'react';
import { Route, Routes, Link, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Tabs, Tab, Container, Box, Paper } from '@mui/material';
import { motion } from 'framer-motion';
import ComparativeAnalysis from './components/ComparativeAnalysis';
import AnalysisPrediction from './components/AnalysisPrediction';
import MonteCarloSimulation from "./components/MonteCarloSimulation";
import FinnhubTabs from './components/FinnhubTabs';
import Learn from './components/Learn';

//  Define Routes Properly
const routes = [
  { path: "/", label: "Investment Analysis", component: <ComparativeAnalysis /> },
  { path: "/finnhub-data", label: "Linked Open Data Visualization", component: <FinnhubTabs /> },
  { path: "/predict", label: "Analysis Prediction", component: <AnalysisPrediction /> },
  { path: "/montecarlo", label: "Monte Carlo Simulation", component: <MonteCarloSimulation /> },
  { path: "/lear", label: "Learning", component: <Learn /> }
];


//  Navigation Bar Component
const Navigation = () => {
  const location = useLocation();
  const currentTab = routes.findIndex(route => route.path === location.pathname);

  return (
    <AppBar position="sticky" sx={{ background: "#1e1e1e", boxShadow: "none" }}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="h5" sx={{ fontWeight: "bold", color: "#ffcc00" }}>
          📈 VilCorp Investing
        </Typography>
        <Tabs value={currentTab >= 0 ? currentTab : 0} textColor="inherit" indicatorColor="secondary">
          {routes.map((route, index) => (
            <Tab
              key={index}
              label={route.label}
              component={Link}
              to={route.path}
              sx={{ fontWeight: "bold", color: "#fff", "&.Mui-selected": { color: "#ffcc00" } }}
            />
          ))}
        </Tabs>
      </Toolbar>
    </AppBar>
  );
};

//  Main App Component (No <Router> here)
const App = () => {
  return (
    <>
      <Navigation />
      <Container maxWidth={false} sx={{ maxWidth: "100%", width: "100%", padding: "20px" }}>
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "80vh",
          paddingTop: "20px",
        }}
      >
        <Routes>
          {routes.map((route, index) => (
            <Route key={index} path={route.path} element={route.component} />
          ))}
        </Routes>
      </Box>
    </Container>

      {/*  Footer */}
      <Paper elevation={0} sx={{ textAlign: "center", padding: "20px", marginTop: "40px", background: "#1e1e1e" }}>
        <Typography variant="body2" color="#ffcc00">
          © {new Date().getFullYear()} VilCorp Investing. All Rights Reserved.
        </Typography>
      </Paper>
    </>
  );
};

export default App;
