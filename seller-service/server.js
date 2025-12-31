const express = require('express');
const app = express();
const port = 5007;

const sellerController = require('./controllers/sellerController');
const upload = require('./middlewares/s3Upload');
const auth = require('./middlewares/auth'); // 🔐 NEW

app.use(express.json());

/* =====================================================
   Seller Profile
   ===================================================== */

app.get(
  '/seller/profile',
  auth,
  sellerController.getSellerProfile
);

app.post(
  '/seller/profile',
  auth,
  upload.fields([
    { name: 'companyLogo', maxCount: 1 },
    { name: 'gstCertificate', maxCount: 1 },
    { name: 'panCard', maxCount: 1 },
  ]),
  sellerController.createSellerProfile
);

app.put(
  '/seller/profile',
  auth,
  upload.fields([
    { name: 'companyLogo', maxCount: 1 },
    { name: 'gstCertificate', maxCount: 1 },
    { name: 'panCard', maxCount: 1 },
  ]),
  sellerController.updateSellerProfile
);

/* =====================================================
   Onboarding
   ===================================================== */

app.put(
  '/seller/onboarding-complete',
  auth,
  sellerController.markOnboardingComplete
);

/* =====================================================
   Plans (Public)
   ===================================================== */

app.get('/plans', sellerController.getAllPlans);

/* =====================================================
   Subscriptions
   ===================================================== */

app.get(
  '/seller/subscription',
  auth,
  sellerController.getSubscription
);

app.post(
  '/seller/subscription',
  auth,
  sellerController.createSubscription
);

app.put(
  '/seller/subscription',
  auth,
  sellerController.updateSubscription
);

/* =====================================================
   Payments
   ===================================================== */

app.get('/payment/:paymentId', sellerController.getPayment);

app.post(
  '/payment',
  auth,
  sellerController.createPayment
);

app.listen(port, () => {
  console.log(`✅ Seller service listening at http://localhost:${port}`);
});
