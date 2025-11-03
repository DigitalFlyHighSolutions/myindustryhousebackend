// // backend/controllers/verificationController.js
// const axios = require('axios');
// const User = require('../models/User');

// // Using the exact URL from the documentation
// const APPYFLOW_VERIFY_GST_URL = 'https://appyflow.in/api/verifyGST';

// exports.verifyGstAndPan = async (req, res) => {
//     try {
//         const user = await User.findById(req.user._id);
//         if (!user) {
//             return res.status(404).json({ message: 'User not found.' });
//         }

//         const { gstNumber, companyName } = req.body;
//         const apiKey = process.env.APPYFLOW_API_KEY;

//         if (!gstNumber) {
//             return res.status(400).json({ message: 'GST Number is required.' });
//         }
//         if (!apiKey) {
//             console.error("CRITICAL: APPYFLOW_API_KEY is not set in the .env file.");
//             return res.status(500).json({ message: "Server configuration error: Verification API key is missing." });
//         }

//         // Sending API key and GST number in the request body as per docs
//         const response = await axios.post(APPYFLOW_VERIFY_GST_URL, {
//             key_secret: apiKey,
//             gstNo: gstNumber
//         });
        
//         console.log("Appyflow GSTIN Response:", response.data);

//         if (response.data.error === true || !response.data.taxpayerInfo) {
//             return res.status(400).json({ message: response.data.message || 'Invalid GSTIN provided.' });
//         }

//         const taxpayerInfo = response.data.taxpayerInfo;

//         if (taxpayerInfo.sts !== 'Active') {
//             return res.status(400).json({ message: 'GSTIN is not active.' });
//         }
        
//         // --- ✅ MODIFIED: Name Verification Step ---
//         // This now prioritizes the company name from the form against the GST record's legal and trade names.
//         const gstLegalName = (taxpayerInfo.lgnm || '').toLowerCase().trim();
//         const gstTradeName = (taxpayerInfo.tradeNam || '').toLowerCase().trim();
//         const companyInputName = (companyName || '').toLowerCase().trim();

//         if (!companyInputName) {
//             return res.status(400).json({ message: 'Company name is required for verification.' });
//         }

//         // Check if the user-provided company name is part of the official legal name or trade name.
//         const isNameMatch = gstLegalName.includes(companyInputName) ||
//                             gstTradeName.includes(companyInputName);

//         if (!isNameMatch) {
//             return res.status(400).json({ 
//                 message: `Verification failed: The company name "${companyName}" does not match the GST record's legal name ("${taxpayerInfo.lgnm}") or trade name ("${taxpayerInfo.tradeNam}").` 
//             });
//         }

//         // --- Final Success Response ---
//         res.status(200).json({
//             message: 'GSTIN successfully verified!',
//             gstDetails: {
//                 lgnm: taxpayerInfo.lgnm 
//             }
//         });

//     } catch (error) {
//         console.error('Appyflow API Error:', error.response ? error.response.data : error.message);
        
//         const apiErrorMessage =
//             error.response?.data?.message ||
//             'The verification service failed. Please check your details and try again.';
            
//         return res.status(error.response?.status || 500).json({ message: apiErrorMessage });
//     }
// };

// backend/controllers/verificationController.js
const User = require('../models/User');

exports.verifyGstAndPan = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const { gstNumber, panNumber, companyName } = req.body;

    // Basic input validation (still check if fields exist)
    if (!gstNumber || !panNumber || !companyName) {
      return res.status(400).json({ message: 'GST, PAN, and Company Name are required.' });
    }

    // ✅ Skip actual AppyFlow API call — just simulate a success response
    console.log(`✅ [Mock Verify] GST: ${gstNumber}, PAN: ${panNumber}, Company: ${companyName}`);

    return res.status(200).json({
      message: 'Documents verified successfully (mock mode).',
      gstDetails: {
        lgnm: companyName.toUpperCase(),
        gstin: gstNumber,
        pan: panNumber,
        mock: true,
      },
    });

  } catch (error) {
    console.error('Verification Error:', error);
    return res.status(500).json({ message: 'Verification failed. Please try again later.' });
  }
};
