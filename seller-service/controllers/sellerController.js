// seller-service/controllers/sellerController.js

const sellerRepository = require('../repositories/sellerRepository');
const axios = require('axios');

// user-service base URL
const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL || 'http://user-service:5006';

const userServiceClient = axios.create({
  baseURL: USER_SERVICE_URL,
  timeout: 1000,
});

/* =====================================================
   Seller Profile
   ===================================================== */

exports.getSellerProfile = async (req, res) => {
  try {
    const userId = req.user.id; // 🔐 SINGLE SOURCE

    const profile = await sellerRepository.findProfileByUserId(userId);
    if (!profile) {
      return res.status(404).json({ message: 'Seller profile not found.' });
    }

    res.status(200).json(profile);
  } catch (err) {
    console.error('Error getting seller profile:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.createSellerProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log('[SELLER PROFILE] userId:', userId);

    const profileData = {
      userId,
      companyName: req.body.companyName,
      aboutUs: req.body.aboutUs,
      fullAddress: req.body.fullAddress,
      city: req.body.city,
      state: req.body.state,
      pincode: req.body.pincode,
      gstNumber: req.body.gstNumber,
      panNumber: req.body.panNumber,
      companyType: req.body.companyType,
      businessType: req.body.businessType,
      yearOfEstablishment: req.body.yearOfEstablishment,

      companyLogo: req.files?.companyLogo?.[0]?.location || null,
      gstCertificate: req.files?.gstCertificate?.[0]?.location || null,
      panCard: req.files?.panCard?.[0]?.location || null,

      bankAccountName: req.body.bankAccountName,
      bankAccountNumber: req.body.bankAccountNumber,
      ifscCode: req.body.ifscCode,
    };

    if (!profileData.companyName) {
      return res.status(400).json({ message: 'companyName is required' });
    }

    const existing = await sellerRepository.findProfileByUserId(userId);
    if (existing) {
      return res.status(409).json({ message: 'Seller profile already exists' });
    }

    const [newProfile] =
      await sellerRepository.createProfile(profileData);

    // onboarding update
    await userServiceClient.put(`/users/${userId}`, {
      onboardingComplete: true,
    });

    res.status(201).json(newProfile);
  } catch (err) {
    console.error('Error creating seller profile:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.updateSellerProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const updateData = {
      ...req.body,
      ...(req.files?.companyLogo && {
        companyLogo: req.files.companyLogo[0].location,
      }),
      ...(req.files?.gstCertificate && {
        gstCertificate: req.files.gstCertificate[0].location,
      }),
      ...(req.files?.panCard && {
        panCard: req.files.panCard[0].location,
      }),
    };

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'Nothing to update' });
    }

    const [updatedProfile] =
      await sellerRepository.updateProfile(userId, updateData);

    if (!updatedProfile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.status(200).json(updatedProfile);
  } catch (err) {
    console.error('Error updating seller profile:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

/* =====================================================
   Plans
   ===================================================== */

exports.getAllPlans = async (req, res) => {
  try {
    const plans = await sellerRepository.findAllPlans();
    res.status(200).json(plans);
  } catch (err) {
    console.error('Error getting plans:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

/* =====================================================
   Subscriptions
   ===================================================== */

exports.getSubscription = async (req, res) => {
  try {
    const userId = req.user.id;

    const subscription =
      await sellerRepository.findSubscriptionByUserId(userId);

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found.' });
    }

    res.status(200).json(subscription);
  } catch (err) {
    console.error('Error getting subscription:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.createSubscription = async (req, res) => {
  try {
    const userId = req.user.id;

    const [newSubscription] =
      await sellerRepository.createSubscription({
        ...req.body,
        userId,
      });

    res.status(201).json(newSubscription);
  } catch (err) {
    console.error('Error creating subscription:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.updateSubscription = async (req, res) => {
  try {
    const userId = req.user.id;

    const [updatedSubscription] =
      await sellerRepository.updateSubscription(userId, req.body);

    if (!updatedSubscription) {
      return res.status(404).json({ message: 'Subscription not found.' });
    }

    res.status(200).json(updatedSubscription);
  } catch (err) {
    console.error('Error updating subscription:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

/* =====================================================
   Payments
   ===================================================== */

exports.getPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment =
      await sellerRepository.findPaymentById(paymentId);

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    res.status(200).json(payment);
  } catch (err) {
    console.error('Error getting payment:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.createPayment = async (req, res) => {
  try {
    const [newPayment] =
      await sellerRepository.createPayment(req.body);

    res.status(201).json(newPayment);
  } catch (err) {
    console.error('Error creating payment:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

/* =====================================================
   Onboarding
   ===================================================== */

exports.markOnboardingComplete = async (req, res) => {
  const userId = req.user.id;

  console.log(
    `[ONBOARDING] Updating onboardingComplete for user ${userId} => true`
  );

  try {
    const response = await userServiceClient.put(`/users/${userId}`, {
      onboardingComplete: true,
    });

    return res.status(200).json(response.data);
  } catch (err) {
    console.error(
      '[ONBOARDING] Error:',
      err.response?.data || err.message
    );

    return res.status(500).json({
      message: 'Failed to update onboarding status',
    });
  }
};
