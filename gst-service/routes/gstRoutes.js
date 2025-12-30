const express = require('express');
const router = express.Router();
const gstController = require('../controllers/gstController');

router.get('/:gstNumber', gstController.getGstDetails);

module.exports = router;
