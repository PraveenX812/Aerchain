import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import RfpDetail from './pages/RfpDetail';
import './App.css';

function App() {
  return (
    <Router>
      <div className="container">
        <h1>Procurement Helper</h1>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/rfp/:id" element={<RfpDetail />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
