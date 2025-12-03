const router = require('express').Router();
let Proposal = require('../models/proposal.model');

router.route('/rfp/:rfpId').get((req, res) => {
  Proposal.find({ rfp: req.params.rfpId })
    .populate('vendor')
    .then(proposals => res.json(proposals))
    .catch(err => res.status(400).json('Error: ' + err));
});

module.exports = router;
