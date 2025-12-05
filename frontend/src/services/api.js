import axios from 'axios';

// The proxy in package.json will automatically handle redirecting these requests
// to http://localhost:5000. For example, a request to '/rfps' will go to
// 'http://localhost:5000/rfps'.

// RFP Endpoints
export const getAllRfps = () => axios.get('/rfps');
export const getRfpById = (id) => axios.get(`/rfps/${id}`);
export const createRfpFromText = (text) => axios.post('/rfps/create-from-text', { naturalLanguageRequest: text });
export const sendRfpToVendors = (id, vendorIds) => axios.post(`/rfps/${id}/send`, { vendorIds });
export const getAiRecommendation = (id) => axios.post(`/rfps/${id}/recommendation`);

// Vendor Endpoints
export const getAllVendors = () => axios.get('/vendors');
export const addVendor = (vendorData) => axios.post('/vendors/add', vendorData);

// Proposal Endpoints
export const getProposalsForRfp = (rfpId) => axios.get(`/proposals/rfp/${rfpId}`);

const apis = {
    getAllRfps,
    getRfpById,
    createRfpFromText,
    sendRfpToVendors,
    getAiRecommendation,
    getAllVendors,
    addVendor,
    getProposalsForRfp
};

export default apis;
