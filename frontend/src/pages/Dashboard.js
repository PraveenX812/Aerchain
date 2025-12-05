import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllRfps, getAllVendors, addVendor } from '../services/api';
import './Dashboard.css';

function Dashboard() {
  const [rfps, setRfps] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for the new vendor form
  const [newVendorName, setNewVendorName] = useState('');
  const [newVendorEmail, setNewVendorEmail] = useState('');
  const [isAddingVendor, setIsAddingVendor] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [rfpsRes, vendorsRes] = await Promise.all([
          getAllRfps(),
          getAllVendors()
        ]);
        setRfps(rfpsRes.data);
        setVendors(vendorsRes.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch data. Make sure the backend server is running.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddVendor = async (e) => {
    e.preventDefault();
    if (!newVendorName.trim() || !newVendorEmail.trim()) {
      alert('Please provide both a name and an email for the vendor.');
      return;
    }
    try {
      setIsAddingVendor(true);
      const response = await addVendor({ name: newVendorName, email: newVendorEmail });
      // Add the new vendor to the list without a full refetch
      setVendors(prev => [...prev, response.data]);
      setNewVendorName('');
      setNewVendorEmail('');
    } catch (err) {
      alert('Failed to add vendor. The email might already exist.');
      console.error(err);
    } finally {
      setIsAddingVendor(false);
    }
  };

  return (
    <div className="dashboard-grid">
      <div className="rfp-section">
        <div className="dashboard-header">
          <h2>RFP Dashboard</h2>
          <Link to="/rfp/new" className="btn btn-primary">New RFP</Link>
        </div>
        {isLoading && <p>Loading RFPs...</p>}
        {error && <p className="error-message">{error}</p>}
        {!isLoading && !error && (
          <ul className="rfp-list">
            {rfps.length > 0 ? rfps.map(rfp => (
              <li key={rfp._id} className="rfp-item">
                <Link to={`/rfp/${rfp._id}`}>
                  <h3>{rfp.title}</h3>
                  <p>Status: <span className={`status status-${rfp.status.toLowerCase()}`}>{rfp.status}</span></p>
                </Link>
              </li>
            )) : (
              <p>No RFPs found. Create one to get started!</p>
            )}
          </ul>
        )}
      </div>
      <div className="vendor-section">
        <h2>Vendor Management</h2>
        <div className="add-vendor-form">
          <h3>Add New Vendor</h3>
          <form onSubmit={handleAddVendor}>
            <input
              type="text"
              placeholder="Vendor Name"
              value={newVendorName}
              onChange={(e) => setNewVendorName(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Vendor Email"
              value={newVendorEmail}
              onChange={(e) => setNewVendorEmail(e.target.value)}
              required
            />
            <button type="submit" className="btn" disabled={isAddingVendor}>
              {isAddingVendor ? 'Adding...' : 'Add Vendor'}
            </button>
          </form>
        </div>
        <div className="vendor-master-list">
          <h3>All Vendors</h3>
          <ul>
            {vendors.map(vendor => (
              <li key={vendor._id}>{vendor.name} ({vendor.email})</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
