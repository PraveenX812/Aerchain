const router = require('express').Router();
let RFP = require('../models/rfp.model');
let Vendor = require('../models/vendor.model');
let Proposal = require('../models/proposal.model');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

router.route('/').get((req, res) => {
  RFP.find()
    .populate('vendors')
    .then(rfps => res.json(rfps))
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/create-from-text').post(async (req, res) => {
  const { naturalLanguageRequest } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json('Error: Gemini API key is not configured.');
  }

  const prompt = `Extract the key details from this procurement request into a valid JSON object. 
  The request is: "${naturalLanguageRequest}". The JSON object must have the following fields: "title" (string), "budget" (number), "deliveryDate" (string in YYYY-MM-DD format), "paymentTerms" (string), "warranty" (string), and "items" (an array of objects with "name", "quantity", and "specs").
   Do not include any text, explanations, or markdown formatting like \`\`\`json ... \`\`\` outside of the JSON object itself.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonResponse = response.text()
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const parsedRFP = JSON.parse(jsonResponse);

    const newRFP = new RFP({
      ...parsedRFP,
      naturalLanguageRequest,
    });

    await newRFP.save();
    res.json(newRFP);
  } catch (error) {
    console.error('Error during Gemini content generation:', error);
    res.status(500).json('Error: ' + error.message);
  }
});

router.route('/:id').get((req, res) => {
  RFP.findById(req.params.id)
    .populate('vendors')
    .then(rfp => res.json(rfp))
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/:id/send').post(async (req, res) => {
  try {
    const rfp = await RFP.findById(req.params.id);
    if (!rfp) {
      return res.status(404).json('Error: RFP not found');
    }

    const { vendorIds } = req.body;
    const vendors = await Vendor.find({ '_id': { $in: vendorIds } });

    const emailHtml = `
      <h1>Request for Proposal: ${rfp.title}</h1>
      <p>Please find the details of the RFP below:</p>
      <ul>
        <li><strong>Budget:</strong> ${rfp.budget}</li>
        <li><strong>Delivery Deadline:</strong> ${new Date(rfp.deliveryDate).toLocaleDateString()}</li>
        <li><strong>Payment Terms:</strong> ${rfp.paymentTerms}</li>
        <li><strong>Warranty:</strong> ${rfp.warranty}</li>
      </ul>
      <h2>Items:</h2>
      <table border="1" cellpadding="5" cellspacing="0">
        <thead>
          <tr>
            <th>Item</th>
            <th>Quantity</th>
            <th>Specifications</th>
          </tr>
        </thead>
        <tbody>
          ${rfp.items.map(item => `
            <tr>
              <td>${item.name}</td>
              <td>${item.quantity}</td>
              <td>${item.specs}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <p>To respond, please reply to this email with your proposal.</p>
    `;

    const messages = vendors.map(vendor => ({
      to: vendor.email,
      from: process.env.FROM_EMAIL,
      subject: `RFP: ${rfp.title}`,
      html: emailHtml,
    }));

    await sgMail.send(messages);

    rfp.status = 'Sent';
    rfp.vendors = vendorIds;
    await rfp.save();

    res.json('RFP sent successfully!');
  } catch (error) {
    console.error(error);
    if (error.response) {
      console.error(error.response.body)
    }
    res.status(500).json('Error: ' + error);
  }
});

router.route('/:id/recommendation').post(async (req, res) => {
    try {
        const rfp = await RFP.findById(req.params.id);
        if (!rfp) {
            return res.status(404).json('Error: RFP not found');
        }

        const proposals = await Proposal.find({ rfp: req.params.id }).populate('vendor');
        if (proposals.length === 0) {
            return res.status(400).json('Error: No proposals found for this RFP to analyze.');
        }

        let proposalsText = '';
        proposals.forEach((p, index) => {
            proposalsText += `
                Proposal ${index + 1}:
                - Vendor: ${p.vendor.name}
                - Price: $${p.price}
                - Delivery Date: ${new Date(p.deliveryDate).toLocaleDateString()}
                - Warranty: ${p.warranty}
            `;
        });

        const prompt = `
            You are an expert procurement manager's assistant. Your task is to analyze vendor proposals for a given Request for Proposal (RFP) and provide a summary and a final recommendation.

            **Original RFP:**
            "${rfp.naturalLanguageRequest}"

            **Here are the vendor proposals received:**
            ${proposalsText}

            **Your Task:**
            Based on the original RFP and the proposals, provide a JSON object with two keys: "summary" and "recommendedVendor".
            - The "summary" should be a brief, professional analysis explaining the pros and cons of each proposal and the reasoning for your recommendation.
            - The "recommendedVendor" should be the name of the vendor you recommend.
            Do not include any text, explanations, or markdown formatting like \`\`\`json ... \`\`\` outside of the JSON object itself.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const jsonResponse = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedRecommendation = JSON.parse(jsonResponse);

        res.json(parsedRecommendation);

    } catch (error) {
        console.error('Error generating recommendation:', error);
        res.status(500).json('Error: ' + error.message);
    }
});

module.exports = router;
