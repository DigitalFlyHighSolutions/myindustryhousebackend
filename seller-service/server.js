const express = require('express');
const app = express();
const port = 5007;

const sellerController = require('./controllers/sellerController');
const upload = require('./middlewares/s3Upload'); // ✅ FIX HERE

app.use(express.json());

// Seller Profiles
app.get('/seller/:userId/profile', sellerController.getSellerProfile);

app.post(
  '/seller/:userId/profile',
  upload.fields([
    { name: 'companyLogo', maxCount: 1 },
    { name: 'gstCertificate', maxCount: 1 },
    { name: 'panCard', maxCount: 1 },
  ]),
  sellerController.createSellerProfile
);

app.put(
  '/seller/:userId/profile',
  upload.fields([
    { name: 'companyLogo', maxCount: 1 },
    { name: 'gstCertificate', maxCount: 1 },
    { name: 'panCard', maxCount: 1 },
  ]),
  sellerController.updateSellerProfile
);

// ✅ Onboarding complete
app.put(
  '/seller/:userId/onboarding-complete',
  sellerController.markOnboardingComplete
);

// Plans
app.get('/plans', sellerController.getAllPlans);

// Subscriptions
app.get('/seller/:userId/subscription', sellerController.getSubscription);
app.post('/seller/:userId/subscription', sellerController.createSubscription);
app.put('/seller/:userId/subscription', sellerController.updateSubscription);

// Payments
app.get('/payment/:paymentId', sellerController.getPayment);
app.post('/payment', sellerController.createPayment);

app.listen(port, () => {
  console.log(`✅ Seller service listening at http://localhost:${port}`);
});
