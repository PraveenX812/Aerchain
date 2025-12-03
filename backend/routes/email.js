const router = require('express').Router();
const multer = require('multer');
const { GoogleGenerativeAI } = require("@google/generative-ai");
let RFP = require('../models/rfp.model');
let Vendor = require('../models/vendor.model');
let Proposal = require('../models/proposal.model');

const upload = multer();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

router.route('/receive').post(upload.any(), async (req, res) => {
  try {
    const from = req.body.from;
    const to = req.body.to;
    const emailBody = req.body.text;

    if (!from || !to || !emailBody) {
        return res.status(400).send('Bad Request: Missing from, to, or text field in the email payload.');
    }

    const vendorEmailMatch = from.match(/<(.+)>/);
    if (!vendorEmailMatch) {
        return res.status(400).send('Could not parse vendor email from "from" field.');
    }
    const vendorEmail = vendorEmailMatch[1];
    const vendor = await Vendor.findOne({ email: vendorEmail });
    if (!vendor) {
      return res.status(404).send('Vendor not found');
    }

    const rfpIdMatch = to.match(/\+(.+)@/);
    if (!rfpIdMatch) {
        return res.status(400).send('Could not parse RFP ID from "to" field.');
    }
    const rfpId = rfpIdMatch[1];
    const rfp = await RFP.findById(rfpId);
    if (!rfp) {
      return res.status(404).send('RFP not found');
    }

    const prompt = `Extract the key details from this vendor proposal email into a valid JSON object. 
                The email is: "${emailBody}". The JSON object must have the following fields: "price" (number), "deliveryDate" (string in YYYY-MM-DD format), and "warranty" (string). 
                Do not include any text, explanations, or markdown formatting like \`\`\`json ... \`\`\` outside of the JSON object itself.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonResponse = response.text()
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const parsedProposal = JSON.parse(jsonResponse);

    const newProposal = new Proposal({
      rfp: rfp._id,
      vendor: vendor._id,
      price: parsedProposal.price,
      deliveryDate: parsedProposal.deliveryDate,
      warranty: parsedProposal.warranty,
      rawResponse: emailBody,
    });

    await newProposal.save();

    res.status(200).send('Proposal received and processed.');
  } catch (error) {
    console.error('Error processing inbound email:', error);
    res.status(500).send('Error processing email.');
  }
});

module.exports = router;
