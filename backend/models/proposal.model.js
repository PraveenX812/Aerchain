const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const proposalSchema = new Schema({
  rfp: {
    type: Schema.Types.ObjectId,
    ref: 'RFP',
    required: true
  },
  vendor: {
    type: Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  deliveryDate: {
    type: Date
  },
  warranty: {
    type: String
  },
  rawResponse: {
    type: String
  },
  aiSummary: {
    type: String
  }
}, {
  timestamps: true,
});

const Proposal = mongoose.model('Proposal', proposalSchema);

module.exports = Proposal;
