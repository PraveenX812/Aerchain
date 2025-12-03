const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const vendorSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
}, {
  timestamps: true,
});

const Vendor = mongoose.model('Vendor', vendorSchema);

module.exports = Vendor;
