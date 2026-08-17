const express = require('express');
const { ForecastJob, Shop } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

router.post('/forecast', authenticate, authorize(['ShopOwner']), async (req, res) => {
  const shop = await Shop.findOne({ where: { ownerId: req.user.id } });
  
  const existing = await ForecastJob.findOne({ 
    where: { shopId: shop.id, status: ['Pending', 'Processing'] }
  });
  
  if (existing) {
    return res.status(400).json({ message: 'A forecast job is already running for your shop.' });
  }

  // Create the Asynchronous Job
  const job = await ForecastJob.create({ shopId: shop.id, status: 'Pending' });
  res.json({ message: 'Forecast job queued successfully', jobId: job.id });
});

router.get('/forecast/:jobId', authenticate, authorize(['ShopOwner']), async (req, res) => {
  const job = await ForecastJob.findByPk(req.params.jobId);
  if (!job) return res.status(404).json({ message: 'Job not found' });
  
  res.json(job);
});

module.exports = router;
