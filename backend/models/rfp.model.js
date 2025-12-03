const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const itemSchema = new Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  specs: { type: String }
});

const rfpSchema = new Schema({
  title: { type: String, required: true },
  naturalLanguageRequest: { type: String, required: true },
  budget: { type: Number },
  deliveryDate: { type: Date },
  paymentTerms: { type: String },
  warranty: { type: String },
  items: [itemSchema],
  status: {
    type: String,
    required: true,
    enum: ['Draft', 'Sent', 'Completed'],
    default: 'Draft'
  },
  vendors: [{ type: Schema.Types.ObjectId, ref: 'Vendor' }]
}, {
  timestamps: true,
});

const RFP = mongoose.model('RFP', rfpSchema);

module.exports = RFP;
