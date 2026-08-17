const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { Shop, Order } = require('../models');
const { exec } = require('child_process');
const path = require('path');

// GET /api/forecast - Get AI sales forecast for the logged-in Shop Owner
router.get('/', authenticate, authorize(['ShopOwner']), async (req, res) => {
  const shop = await Shop.findOne({ where: { ownerId: req.user.id } });
  
  if (!shop) {
    return res.status(404).json({ message: 'Shop not found' });
  }

  // Check data threshold (6 months of approved sales required)
  const earliestOrder = await Order.findOne({
    where: { shopId: shop.id, status: 'Approved' },
    order: [['createdAt', 'ASC']]
  });

  if (!earliestOrder) {
    return res.json({ locked: true, requiredMonths: 6, currentMonths: 0 });
  }

  const firstDate = new Date(earliestOrder.createdAt);
  const currentDate = new Date();
  
  const monthDiff = (currentDate.getFullYear() - firstDate.getFullYear()) * 12 + 
                    (currentDate.getMonth() - firstDate.getMonth()) + 1;

  // The threshold is 6 months
  if (monthDiff < 6) {
    return res.json({ locked: true, requiredMonths: 6, currentMonths: monthDiff });
  }

  // If unlocked, run the ML prediction script
  // Note: The Python script expects the store ID. 
  // We pass shop.id to make it dynamic as requested.
  const scriptPath = path.resolve(__dirname, '../../../Global_ML_pipeline/predict.py');
  const scriptDir = path.dirname(scriptPath);
  const command = `python "${scriptPath}" ${shop.id}`;

  exec(command, { cwd: scriptDir }, (error, stdout, stderr) => {
    if (error) {
      console.error("Forecast Error:", error);
      console.error("Stderr:", stderr);
      return res.status(500).json({ message: 'Failed to generate AI forecast', error: stderr });
    }

    try {
      // Parse the JSON output from the Python script
      const jsonStart = stdout.indexOf('===JSON_START===') + '===JSON_START==='.length;
      const jsonEnd = stdout.indexOf('===JSON_END===');
      
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('Invalid JSON boundaries in Python output');
      }

      const jsonStr = stdout.substring(jsonStart, jsonEnd).trim();
      const predictions = JSON.parse(jsonStr);

      res.json({ locked: false, predictions });
    } catch (parseErr) {
      console.error("JSON Parse Error:", parseErr);
      console.log("Raw output:", stdout);
      res.status(500).json({ message: 'Failed to parse AI forecast data' });
    }
  });
});

module.exports = router;
