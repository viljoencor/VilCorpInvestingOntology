import React from 'react';
import ReactDOM from 'react-dom/client'; // ✅ React 19 requires createRoot()
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

// Performance Monitoring (Optional)
reportWebVitals();
