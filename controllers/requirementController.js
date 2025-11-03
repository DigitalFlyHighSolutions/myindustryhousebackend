// backend/controllers/requirementController.js
const Requirement = require('../models/Requirement');

exports.postRequirement = async (req, res) => {
    try {
        const newRequirement = new Requirement({
            ...req.body,
            buyerId: req.user._id
        });
        await newRequirement.save();
        res.status(201).json(newRequirement);
    } catch (error) {
        console.error("Error posting requirement:", error);
        res.status(500).json({ message: 'Server Error while posting requirement.' });
    }
};

exports.getBuyerRequirements = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: 'User not authenticated.' });
        }
        const requirements = await Requirement.find({ buyerId: req.user._id })
            .populate('contactedSellers', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json(requirements);
    } catch (error) {
        console.error("Error fetching buyer requirements:", error);
        res.status(500).json({ message: 'Server Error while fetching requirements.' });
    }
};

exports.getRequirementDetails = async (req, res) => {
    try {
        const requirement = await Requirement.findById(req.params.id)
            .populate({
                path: 'contactedSellers',
                select: 'name sellerProfile',
                populate: {
                    path: 'sellerProfile',
                    select: 'companyName'
                }
            });
            
        if (!requirement) {
            return res.status(404).json({ message: 'Requirement not found' });
        }
        
        res.status(200).json(requirement);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getAvailableLeads = async (req, res) => {
    try {
        const leads = await Requirement.find({ 
            status: 'Open',
            buyerId: { $ne: req.user._id } 
        })
        .populate('buyerId', 'name createdAt')
        .sort({ createdAt: -1 });

        const leadsWithStatus = leads.map(lead => {
            const leadObject = lead.toObject();
            return {
                ...leadObject,
                isContacted: lead.contactedSellers.some(id => id.toString() === req.user._id)
            };
        });

        res.status(200).json(leadsWithStatus);
    } catch (error) {
        console.error("Error fetching available leads:", error);
        res.status(500).json({ message: 'Server error while fetching leads.' });
    }
};

// ✅ NEW: Function to update requirement status
exports.updateRequirementStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['Open', 'Closed'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status provided.' });
        }

        const requirement = await Requirement.findById(id);

        if (!requirement) {
            return res.status(404).json({ message: 'Requirement not found.' });
        }

        if (requirement.buyerId.toString() !== req.user._id) {
            return res.status(403).json({ message: 'Forbidden: You can only update your own requirements.' });
        }

        requirement.status = status;
        await requirement.save();

        res.status(200).json({ message: `Requirement status updated to ${status}.`, requirement });
    } catch (error) {
        console.error("Error updating requirement status:", error);
        res.status(500).json({ message: 'Server error while updating requirement.' });
    }
};