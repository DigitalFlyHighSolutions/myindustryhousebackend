// seller-service/controllers/sellerController.js

const sellerRepository = require('../repositories/sellerRepository');
const axios = require('axios');

// 👇 user-service ka base URL (Docker network ke andar service name se call hoga)
const USER_SERVICE_URL =
    process.env.USER_SERVICE_URL || 'http://user-service:5006';

// axios instance with timeout (important for Krakend timeout se pehle fail hone ke liye)
const userServiceClient = axios.create({
    baseURL: USER_SERVICE_URL,
    timeout: 1000, // 1 second – Krakend ka timeout 3s hai, to isse pehle hi response aa jayega
});

// -----------------------------------------------------
// Seller Profiles
// -----------------------------------------------------
exports.getSellerProfile = async (req, res) => {
    try {
        const { userId } = req.params;
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
    const { userId } = req.params;

    console.log("BODY:", req.body);
    console.log("FILES:", req.files);

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
      return res.status(400).json({ message: "companyName is required" });
    }

    const [newProfile] =
      await sellerRepository.createProfile(profileData);

    res.status(201).json(newProfile);
  } catch (err) {
    console.error("Error creating seller profile:", err);
    res.status(500).json({ message: "Server Error" });
  }
};


exports.updateSellerProfile = async (req, res) => {
  try {
    const { userId } = req.params;

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
      return res.status(400).json({ message: "Nothing to update" });
    }

    const [updatedProfile] =
      await sellerRepository.updateProfile(userId, updateData);

    res.status(200).json(updatedProfile);
  } catch (err) {
    console.error("Error updating seller profile:", err);
    res.status(500).json({ message: "Server Error" });
  }
};


// -----------------------------------------------------
// Plans
// -----------------------------------------------------
exports.getAllPlans = async (req, res) => {
    try {
        const plans = await sellerRepository.findAllPlans();
        res.status(200).json(plans);
    } catch (err) {
        console.error('Error getting plans:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// -----------------------------------------------------
// Subscriptions
// -----------------------------------------------------
exports.getSubscription = async (req, res) => {
    try {
        const { userId } = req.params;
        const subscription = await sellerRepository.findSubscriptionByUserId(
            userId
        );
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
        const { userId } = req.params;
        const [newSubscription] = await sellerRepository.createSubscription({
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
        const { userId } = req.params;
        const [updatedSubscription] = await sellerRepository.updateSubscription(
            userId,
            req.body
        );
        if (!updatedSubscription) {
            return res.status(404).json({ message: 'Subscription not found.' });
        }
        res.status(200).json(updatedSubscription);
    } catch (err) {
        console.error('Error updating subscription:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// -----------------------------------------------------
// Payments
// -----------------------------------------------------
exports.getPayment = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const payment = await sellerRepository.findPaymentById(paymentId);
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
        const [newPayment] = await sellerRepository.createPayment(req.body);
        res.status(201).json(newPayment);
    } catch (err) {
        console.error('Error creating payment:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// -----------------------------------------------------
// Onboarding complete  (users.onboardingComplete update karega)
// -----------------------------------------------------
exports.markOnboardingComplete = async (req, res) => {
    const { userId } = req.params;
    const { onboardingComplete } = req.body || {};

    if (!userId) {
        return res.status(400).json({ message: 'userId is required.' });
    }

    // body me aaye to use karo, warna default true rakho
    const flag =
        typeof onboardingComplete === 'boolean' ? onboardingComplete : true;

    console.log(
        `[ONBOARDING] Updating onboardingComplete for user ${userId} =>`,
        flag
    );

    try {
        // 🧠 IMPORTANT:
        // onboardingComplete column "users" table me hai, "seller_profiles" me nahi.
        // Isliye yahan se user-service ko call kar rahe hain:

        const response = await userServiceClient.put(`/users/${userId}`, {
            onboardingComplete: flag,
        });

        console.log('[ONBOARDING] User-service response:', response.data);

        return res.status(200).json({
            message: 'Onboarding status updated successfully (users table).',
            data: response.data,
        });
    } catch (err) {
        // Agar timeout / connection error hua to turant log & return
        if (err.code === 'ECONNABORTED') {
            console.error(
                `[ONBOARDING] user-service timeout (axios):`,
                err.message
            );
        } else if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
            console.error(
                `[ONBOARDING] user-service not reachable:`,
                err.message
            );
        } else {
            console.error(
                '[ONBOARDING] Error updating onboarding status in user-service:',
                err.response?.data || err.message
            );
        }

        const status = err.response?.status || 500;
        const data =
            err.response?.data || {
                message: 'Failed to update onboarding status',
            };

        return res.status(status).json(data);
    }
};

