const express = require('express');
const { Inventory, MasterItem, Shop, Category, SubCategory } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const { Connection } = require('../models');

const router = express.Router();

// GET /api/inventory - Get inventory for the logged-in ShopOwner
router.get('/', authenticate, authorize(['ShopOwner']), async (req, res) => {
  const shop = await Shop.findOne({ where: { ownerId: req.user.id } });
  if (!shop) return res.status(404).json({ message: 'Shop not found' });

  const items = await Inventory.findAll({
    where: { shopId: shop.id },
    include: [{ 
      model: MasterItem,
      include: [
        { model: Category },
        { model: SubCategory }
      ]
    }],
    order: [
      [MasterItem, Category, 'name', 'ASC'],
      [MasterItem, SubCategory, 'name', 'ASC'],
      [MasterItem, 'itemName', 'ASC']
    ]
  });
  
  res.json(items);
});

// GET /api/inventory/catalog/:uniqueCode - Secure route for Customers to view a connected shop's catalog
router.get('/catalog/:uniqueCode', authenticate, async (req, res) => {
  const { uniqueCode } = req.params;

  // Find the shop by uniqueCode
  const shop = await Shop.findOne({ where: { uniqueCode } });
  if (!shop) {
    return res.status(404).json({ message: 'Shop not found.' });
  }

  // Verify they have an active connection to this shop
  const connection = await Connection.findOne({
    where: { shopId: shop.id, customerId: req.user.id, status: 'Active' }
  });

  if (!connection) {
    return res.status(403).json({ message: 'You must be connected and approved by this shop to view their catalog.' });
  }

  const items = await Inventory.findAll({
    where: { shopId: shop.id },
    include: [{ 
      model: MasterItem,
      include: [
        { model: Category },
        { model: SubCategory }
      ]
    }],
    order: [
      [MasterItem, Category, 'name', 'ASC'],
      [MasterItem, SubCategory, 'name', 'ASC'],
      [MasterItem, 'itemName', 'ASC']
    ]
  });

  res.json({ shopId: shop.id, inventory: items });
});

// POST /api/inventory - Add a MasterItem to shop's inventory
router.post('/', authenticate, authorize(['ShopOwner']), async (req, res) => {
  const { masterItemId, currentStock, price } = req.body;
  
  const shop = await Shop.findOne({ where: { ownerId: req.user.id } });
  if (!shop) return res.status(404).json({ message: 'Shop not found' });

  // Check if item already exists in this shop's inventory
  const existing = await Inventory.findOne({
    where: { shopId: shop.id, masterItemId }
  });
  
  if (existing) {
    return res.status(400).json({ message: 'Item already exists in your inventory', masterItemId });
  }

  const newItem = await Inventory.create({
    shopId: shop.id,
    masterItemId,
    currentStock: currentStock || 0,
    price
  });

  // Fetch again with MasterItem included for frontend
  const createdItem = await Inventory.findByPk(newItem.id, {
    include: [{ 
      model: MasterItem,
      include: [
        { model: Category },
        { model: SubCategory }
      ]
    }]
  });

  res.status(201).json(createdItem);
});

// PUT /api/inventory/:id - Update stock and price
router.put('/:id', authenticate, authorize(['ShopOwner']), async (req, res) => {
  const { currentStock, price } = req.body;
  const inventoryId = req.params.id;

  const inventory = await Inventory.findByPk(inventoryId);
  if (!inventory) return res.status(404).json({ message: 'Item not found' });

  // Ensure shop owns this inventory
  const shop = await Shop.findOne({ where: { ownerId: req.user.id } });
  if (inventory.shopId !== shop.id) {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  inventory.currentStock = currentStock !== undefined ? currentStock : inventory.currentStock;
  inventory.price = price !== undefined ? price : inventory.price;
  await inventory.save();

  res.json(inventory);
});

// DELETE /api/inventory/:id
router.delete('/:id', authenticate, authorize(['ShopOwner']), async (req, res) => {
  const inventoryId = req.params.id;
  const inventory = await Inventory.findByPk(inventoryId);
  if (!inventory) return res.status(404).json({ message: 'Item not found' });

  const shop = await Shop.findOne({ where: { ownerId: req.user.id } });
  if (inventory.shopId !== shop.id) {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  await inventory.destroy();
  res.json({ message: 'Item removed from inventory' });
});

module.exports = router;
