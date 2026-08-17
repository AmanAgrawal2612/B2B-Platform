const express = require('express');
const { Shop, Inventory, Connection, User } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

router.get('/my-shop', authenticate, authorize(['ShopOwner']), async (req, res) => {
  const shop = await Shop.findOne({ where: { ownerId: req.user.id } });
  res.json(shop);
});

router.get('/inventory', authenticate, authorize(['ShopOwner']), async (req, res) => {
  const shop = await Shop.findOne({ where: { ownerId: req.user.id } });
  const items = await Inventory.findAll({ where: { shopId: shop.id } });
  res.json(items);
});

router.post('/inventory', authenticate, authorize(['ShopOwner']), async (req, res) => {
  const shop = await Shop.findOne({ where: { ownerId: req.user.id } });
  const { itemName, currentStock, price } = req.body;
  const item = await Inventory.create({ shopId: shop.id, itemName, currentStock, price });
  res.status(201).json(item);
});

router.post('/connect', authenticate, async (req, res) => {
  const { uniqueCode } = req.body;
  const shop = await Shop.findOne({ where: { uniqueCode } });
  
  if (!shop) return res.status(404).json({ message: 'Shop not found' });
  
  await Connection.findOrCreate({
    where: { shopId: shop.id, customerId: req.user.id }
  });
  
  res.json({ message: 'Successfully connected to shop' });
});

router.get('/connected-shops', authenticate, async (req, res) => {
  const connections = await Connection.findAll({ 
    where: { customerId: req.user.id, status: 'Active' },
    include: [{ model: Shop }]
  });
  res.json(connections);
});

// === SHOP OWNER NETWORK ROUTES ===

router.get('/network', authenticate, authorize(['ShopOwner']), async (req, res) => {
  const shop = await Shop.findOne({ where: { ownerId: req.user.id } });
  if (!shop) return res.status(404).json({ message: 'Shop not found' });

  const connections = await Connection.findAll({
    where: { shopId: shop.id },
    include: [{ model: User, as: 'Customer', attributes: ['id', 'name', 'email', 'role'] }]
  });
  res.json(connections);
});

router.put('/network/:id/status', authenticate, authorize(['ShopOwner']), async (req, res) => {
  const { status } = req.body;
  if (!['Active', 'Blocked'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const connection = await Connection.findByPk(req.params.id);
  if (!connection) return res.status(404).json({ message: 'Connection not found' });

  const shop = await Shop.findOne({ where: { ownerId: req.user.id } });
  if (connection.shopId !== shop.id) {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  connection.status = status;
  await connection.save();
  res.json({ message: `Customer ${status === 'Blocked' ? 'deactivated' : 'activated'} successfully`, connection });
});

router.delete('/network/:id', authenticate, authorize(['ShopOwner']), async (req, res) => {
  const connection = await Connection.findByPk(req.params.id);
  if (!connection) return res.status(404).json({ message: 'Connection not found' });

  const shop = await Shop.findOne({ where: { ownerId: req.user.id } });
  if (connection.shopId !== shop.id) {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  await connection.destroy();
  res.json({ message: 'Customer permanently deleted from your shop network' });
});

module.exports = router;
