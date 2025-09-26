// backend/controllers/userController.js
const User = require('../models/User');
const SellerProfile = require('../models/SellerProfile');
const { cloudinary } = require('../config/cloudinary');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const bcrypt = require('bcrypt');
const Conversation = require('../models/Conversation');
const Product = require('../models/Product');
const Requirement = require('../models/Requirement');

exports.sellerOnboarding = async (req, res) => {
    try {
        const userId = req.user._id;

        const existingProfile = await SellerProfile.findOne({ userId });
        if (existingProfile) {
            return res.status(409).json({ message: 'A seller profile already exists for this user account.' });
        }

        const user = await User.findById(userId);

        if (!user || user.role !== 'seller') {
            return res.status(403).json({ message: 'Forbidden: Invalid user or role.' });
        }

        const profileData = { ...req.body, userId };
        
        if (profileData.pincode && profileData.pincode.length === 6) {
            const locationResponse = await axios.get(`https://api.postalpincode.in/pincode/${profileData.pincode}`);
            if (locationResponse.data && locationResponse.data[0].Status === 'Success') {
                const postOffice = locationResponse.data[0].PostOffice[0];
                profileData.city = postOffice.District;
                profileData.state = postOffice.State;
            } else {
                return res.status(400).json({ message: 'Invalid pincode provided.' });
            }
        } else {
            return res.status(400).json({ message: 'A valid 6-digit pincode is required.' });
        }


        if (req.files) {
            if (req.files.companyLogo) {
                profileData.companyLogo = { url: req.files.companyLogo[0].path, public_id: req.files.companyLogo[0].filename };
            }
            if (req.files.gstCertificate) {
                profileData.gstCertificate = { url: req.files.gstCertificate[0].path, public_id: req.files.gstCertificate[0].filename };
            }
            if (req.files.panCard) {
                profileData.panCard = { url: req.files.panCard[0].path, public_id: req.files.panCard[0].filename };
            }
        }

        const newSellerProfile = new SellerProfile(profileData);
        await newSellerProfile.save();
        
        user.onboardingComplete = true;
        await user.save();
        
        const userPayload = { 
            _id: user._id, 
            name: user.name, 
            email: user.email, 
            role: user.role, 
            contactNumber: user.contactNumber,
            onboardingComplete: user.onboardingComplete 
        };
        const token = jwt.sign({ user: userPayload }, process.env.JWT_SECRET);
        
        res.status(200).json({ message: "Onboarding complete!", user: userPayload, token });
    } catch (err) {
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join('. ') });
        }
        console.error('Onboarding server error:', err);
        res.status(500).json({ message: 'An unexpected error occurred during onboarding.' });
    }
};

exports.updateUserContactDetails = async (req, res) => {
    try {
        const userId = req.user._id;
        const { name, contactNumber } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        if (name) user.name = name;
        if (contactNumber) user.contactNumber = contactNumber;

        await user.save();
        
        if (user.role === 'seller' && name) {
            await SellerProfile.findOneAndUpdate({ userId }, { companyName: name });
        }

        const userPayload = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            onboardingComplete: user.onboardingComplete,
            contactNumber: user.contactNumber
        };

        const token = jwt.sign({ user: userPayload }, process.env.JWT_SECRET);

        res.status(200).json({ message: "Profile updated successfully!", user: userPayload, token });
    } catch (err) {
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join('. ') });
        }
        console.error('Error updating user contact details:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const userId = req.user._id;
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid current password.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ message: 'Password updated successfully!' });

    } catch (err) {
        console.error('Error changing password:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.updateSellerProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        if (req.user._id.toString() !== userId) {
            return res.status(403).json({ message: "Forbidden: You can only update your own profile." });
        }

        const profile = await SellerProfile.findOne({ userId });
        if (!profile) {
            return res.status(404).json({ message: "Seller profile not found." });
        }

        const updatedData = { ...req.body };
        
        delete updatedData.gstNumber;

        if (req.file) {
            if (profile.companyLogo && profile.companyLogo.public_id) {
                await cloudinary.uploader.destroy(profile.companyLogo.public_id);
            }
            updatedData.companyLogo = { url: req.file.path, public_id: req.file.filename };
        }

        const updatedProfile = await SellerProfile.findOneAndUpdate({ userId }, updatedData, { new: true });
        
        res.status(200).json(updatedProfile);
    } catch (err) {
        console.error('Error updating seller profile:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getSellerProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const sellerProfile = await SellerProfile.findOne({ userId }).populate('userId', 'name email contactNumber');
        if (!sellerProfile) return res.status(404).json({ message: 'Seller profile not found.' });
        res.status(200).json(sellerProfile);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getUserProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const userProfile = await User.findById(userId).select('name role');
        
        if (!userProfile) {
            return res.status(404).json({ message: 'User not found.' });
        }
        
        res.status(200).json(userProfile);

    } catch (err) {
        console.error('Error fetching user profile:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

// ✅ NEW: Unified function to get a public profile for any user role
exports.getPublicUserProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).select('name email contactNumber createdAt role addresses');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        let profileData = {};

        if (user.role === 'seller') {
            const sellerProfile = await SellerProfile.findOne({ userId: user._id });
            profileData = {
                _id: user._id,
                name: sellerProfile?.companyName || user.name,
                contactNumber: user.contactNumber,
                email: user.email,
                memberSince: user.createdAt,
                address: sellerProfile?.fullAddress || 'Not provided',
                productsOfInterest: [], // Sellers don't post requirements
                stats: { requirementsTillDate: 0, replies: 0 },
                role: 'seller'
            };
        } else { // Assumes buyer
            const requirements = await Requirement.find({ buyerId: userId }).sort({ createdAt: -1 }).limit(10);
            const requirementsTillDate = await Requirement.countDocuments({ buyerId: userId });
            const replies = await Conversation.countDocuments({ participants: userId });
            const primaryAddress = user.addresses.find(a => a.isDefault) || user.addresses[0];
            
            profileData = {
                _id: user._id,
                name: user.name,
                contactNumber: user.contactNumber,
                email: user.email,
                memberSince: user.createdAt,
                address: primaryAddress ? primaryAddress.details : 'Not provided',
                productsOfInterest: requirements.map(r => r.productName),
                stats: { requirementsTillDate, replies },
                role: 'buyer'
            };
        }
        
        res.status(200).json(profileData);
    } catch (error) {
        console.error("Error fetching public user profile:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getAllSuppliers = async (req, res) => {
    try {
        const allSuppliers = await SellerProfile.find({}).populate('userId', 'name email');
        res.status(200).json(allSuppliers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.manageAddress = async (req, res, action) => {
    try {
        const userId = req.user._id;
        const { addressId } = req.params;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        switch (action) {
            case 'get':
                return res.status(200).json(user.addresses);
            case 'add':
                const { type, details } = req.body;
                if (user.addresses.length === 0) {
                    user.addresses.push({ type, details, isDefault: true });
                } else {
                    user.addresses.push({ type, details, isDefault: false });
                }
                break;
            
            case 'update':
                const addressToUpdate = user.addresses.id(addressId);
                if (!addressToUpdate) return res.status(404).json({ message: 'Address not found' });
                addressToUpdate.type = req.body.type;
                addressToUpdate.details = req.body.details;
                break;

            case 'delete':
                const addressToDelete = user.addresses.id(addressId);
                 if (!addressToDelete) return res.status(404).json({ message: 'Address not found' });
                
                const wasDefault = addressToDelete.isDefault;
                addressToDelete.remove();

                if (wasDefault && user.addresses.length > 0) {
                    user.addresses[0].isDefault = true;
                }
                break;

            case 'default':
                user.addresses.forEach(addr => {
                    addr.isDefault = addr._id.toString() === addressId;
                });
                break;

            default:
                return res.status(400).json({ message: 'Invalid action' });
        }
        
        await user.save();
        res.status(200).json(user.addresses);
    } catch (err) {
        console.error(`Error with address action "${action}":`, err);
        res.status(500).json({ message: 'Server Error' });
    }
};