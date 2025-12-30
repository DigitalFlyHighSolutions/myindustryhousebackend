const gstRepository = require('../repositories/gstRepository');

async function getGstDetails(req, res) {
  try {
    const { gstNumber } = req.params;
    const gstDetails = await gstRepository.findByGstNumber(gstNumber);
    if (gstDetails) {
      res.json(gstDetails);
    } else {
      res.status(404).json({ message: 'GST details not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  getGstDetails,
};
