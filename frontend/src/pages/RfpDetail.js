import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getRfpById, 
  createRfpFromText, 
  getAllVendors, 
  getProposalsForRfp, 
  sendRfpToVendors,
  getAiRecommendation
} from '../services/api';
import './RfpDetail.css';

function RfpDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [rfp, setRfp] = useState(null);
  const [naturalLanguageRequest, setNaturalLanguageRequest] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [vendors, setVendors] = useState([]);
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isRecommending, setIsRecommending] = useState(false);

  useEffect(() => {
    // This is the robust check. It only fetches data if the ID is present and not 'new'.
    if (id && !isNew) {
      const fetchRfpData = async () => {
        try {
          setIsLoading(true);
          setError(null);
          const [rfpRes, vendorsRes, proposalsRes] = await Promise.all([
            getRfpById(id),
            getAllVendors(),
            getProposalsForRfp(id)
          ]);
          setRfp(rfpRes.data);
          setVendors(vendorsRes.data);
          setProposals(proposalsRes.data);
        } catch (err) {
          setError('Failed to fetch RFP data.');
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchRfpData();
    } else {
      // This handles both the 'new' case and the initial undefined 'id' case.
      setIsLoading(false);
    }
  }, [id, isNew]);

  const handleCreateRfp = async (e) => {
    e.preventDefault();
    if (!naturalLanguageRequest.trim()) return;
    try {
      setIsLoading(true);
      setError(null);
      const response = await createRfpFromText(naturalLanguageRequest);
      navigate(`/rfp/${response.data._id}`);
    } catch (err) {
      setError('Failed to create RFP.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVendorSelect = (vendorId) => {
    setSelectedVendors(prev => 
      prev.includes(vendorId) 
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId]
    );
  };

  const handleSendRfp = async () => {
    if (selectedVendors.length === 0) {
      alert('Please select at least one vendor.');
      return;
    }
    try {
      setIsSending(true);
      await sendRfpToVendors(id, selectedVendors);
      alert('RFP sent successfully!');
      const response = await getRfpById(id);
      setRfp(response.data);
    } catch (err) {
      alert('Failed to send RFP.');
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const handleGetRecommendation = async () => {
    try {
      setIsRecommending(true);
      const response = await getAiRecommendation(id);
      setRecommendation(response.data);
    } catch (err) {
      alert('Failed to get AI recommendation.');
      console.error(err);
    } finally {
      setIsRecommending(false);
    }
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="rfp-detail">
      {isNew ? (
        <div className="rfp-create-form">
          <h2>Create New RFP</h2>
          <p>Describe what you want to buy in plain English. The AI will structure it for you.</p>
          <form onSubmit={handleCreateRfp}>
            <textarea
              value={naturalLanguageRequest}
              onChange={(e) => setNaturalLanguageRequest(e.target.value)}
              placeholder="e.g., I need 20 laptops with 16GB RAM..."
              rows="6"
            />
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create RFP'}
            </button>
          </form>
        </div>
      ) : rfp && (
        <div className="rfp-view">
          <div className="rfp-view-header">
            <h2>{rfp.title}</h2>
            <span className={`status status-${rfp.status.toLowerCase()}`}>{rfp.status}</span>
          </div>
          
          <div className="section">
            <h3>RFP Details</h3>
            <div className="rfp-summary-grid">
                <div className="summary-item">
                    <h4>Budget</h4>
                    <p>${rfp.budget ? rfp.budget.toLocaleString() : 'N/A'}</p>
                </div>
                <div className="summary-item">
                    <h4>Delivery By</h4>
                    <p>{rfp.deliveryDate ? new Date(rfp.deliveryDate).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div className="summary-item">
                    <h4>Warranty</h4>
                    <p>{rfp.warranty || 'N/A'}</p>
                </div>
                <div className="summary-item">
                    <h4>Payment Terms</h4>
                    <p>{rfp.paymentTerms || 'N/A'}</p>
                </div>
            </div>
            <table className="items-table">
                <thead>
                <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Specifications</th>
                </tr>
                </thead>
                <tbody>
                {rfp.items.map(item => (
                    <tr key={item._id}>
                    <td>{item.name}</td>
                    <td>{item.quantity}</td>
                    <td>{item.specs}</td>
                    </tr>
                ))}
                </tbody>
            </table>
          </div>

          {rfp.status === 'Draft' && (
            <div className="section">
              <h3>Send to Vendors</h3>
              <div className="vendor-list">
                {vendors.map(vendor => (
                  <div key={vendor._id} className="vendor-item">
                    <input 
                      type="checkbox" 
                      id={`vendor-${vendor._id}`}
                      checked={selectedVendors.includes(vendor._id)}
                      onChange={() => handleVendorSelect(vendor._id)}
                    />
                    <label htmlFor={`vendor-${vendor._id}`}>{vendor.name} ({vendor.email})</label>
                  </div>
                ))}
              </div>
              <button onClick={handleSendRfp} className="btn btn-primary" disabled={isSending}>
                {isSending ? 'Sending...' : 'Send RFP'}
              </button>
            </div>
          )}

          <div className="section">
            <h3>Proposals Received</h3>
            {proposals.length > 0 ? (
              <>
                <table className="proposals-table">
                  <thead>
                    <tr>
                      <th>Vendor</th>
                      <th>Price</th>
                      <th>Delivery</th>
                      <th>Warranty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proposals.map(p => (
                      <tr key={p._id}>
                        <td>{p.vendor.name}</td>
                        <td>${p.price.toLocaleString()}</td>
                        <td>{new Date(p.deliveryDate).toLocaleDateString()}</td>
                        <td>{p.warranty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="recommendation-section">
                  <button onClick={handleGetRecommendation} className="btn btn-primary" disabled={isRecommending}>
                    {isRecommending ? 'Analyzing...' : 'Get AI Recommendation'}
                  </button>
                  {recommendation && (
                    <div className="ai-recommendation">
                      <h4>AI Analysis</h4>
                      <p><strong>Recommended Vendor:</strong> {recommendation.recommendedVendor}</p>
                      <p><strong>Summary:</strong> {recommendation.summary}</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p>No proposals received yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default RfpDetail;
