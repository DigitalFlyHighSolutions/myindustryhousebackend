const db = require('../db');

// Seller Profiles
const findProfileByUserId = (userId) => {
    return db('seller_profiles').where({ userId }).first();
};

const createProfile = (profileData) => {
    return db('seller_profiles').insert(profileData).returning('*');
};

const updateProfile = (userId, profileData) => {
    return db('seller_profiles').where({ userId }).update(profileData).returning('*');
};

// Plans
const findAllPlans = () => {
    return db('plans').select('*');
};

// Subscriptions
const findSubscriptionByUserId = (userId) => {
    return db('subscriptions').where({ userId }).first();
};

const createSubscription = (subscriptionData) => {
    return db('subscriptions').insert(subscriptionData).returning('*');
};

const updateSubscription = (userId, subscriptionData) => {
    return db('subscriptions').where({ userId }).update(subscriptionData).returning('*');
};

// Payments
const findPaymentById = (paymentId) => {
    return db('payments').where({ id: paymentId }).first();
};

const createPayment = (paymentData) => {
    return db('payments').insert(paymentData).returning('*');
};

module.exports = {
    findProfileByUserId,
    createProfile,
    updateProfile,
    findAllPlans,
    findSubscriptionByUserId,
    createSubscription,
    updateSubscription,
    findPaymentById,
    createPayment,
};
