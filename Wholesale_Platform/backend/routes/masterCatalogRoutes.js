const express = require('express');
const { MasterItem, Inventory, Shop, Category, SubCategory } = require('../models');
const { authenticate } = require('../middleware/auth');
const { catalogItemValidator } = require('../middleware/validators');

const router = express.Router();

// GET /api/catalog - Fetch all Approved items + Pending items created by this user
router.get('/', authenticate, async (req, res) => {
  const items = await MasterItem.findAll({
    include: [
      { model: Category },
      { model: SubCategory }
    ],
    order: [['itemName', 'ASC']]
  });
  
  // Filter logic: Only Approved OR (Pending AND addedBy === req.user.id)
  const filteredItems = items.filter(item => {
    if (item.status === 'Approved') return true;
    if (item.status === 'Pending' && item.addedBy === req.user.id) return true;
    return false;
  }).map(item => {
    const plain = item.toJSON();
    return {
      ...plain,
      category: plain.Category ? plain.Category.name : 'Unknown',
      subCategory: plain.SubCategory ? plain.SubCategory.name : 'Unknown'
    };
  });
  res.json(filteredItems);
});

// POST /api/catalog - Create a new MasterItem
router.post('/', authenticate, catalogItemValidator, async (req, res) => {
  let { categoryId, subcategoryId, itemName, price, currentStock } = req.body;
  const addedBy = req.user.id;
  const status = req.user.role === 'Admin' ? 'Approved' : 'Pending';

  let finalCategoryId = parseInt(categoryId);
  if (isNaN(finalCategoryId) && req.user.role === 'Admin') {
    const [cat] = await Category.findOrCreate({ where: { name: categoryId } });
    finalCategoryId = cat.id;
  } else if (isNaN(finalCategoryId)) {
    return res.status(403).json({ message: 'Only Admins can create new Categories.' });
  }

  let finalSubcategoryId = parseInt(subcategoryId);
  if (isNaN(finalSubcategoryId)) {
    const [sub] = await SubCategory.findOrCreate({ 
      where: { name: subcategoryId, categoryId: finalCategoryId } 
    });
    finalSubcategoryId = sub.id;
  }

  // Check if it already exists (case-insensitive)
  const allItems = await MasterItem.findAll();
  const existing = allItems.find(item => 
    item.categoryId === finalCategoryId &&
    item.subcategoryId === finalSubcategoryId &&
    item.itemName.toLowerCase() === itemName.toLowerCase()
  );
  
  if (existing) {
    if (price && req.user.role !== 'Admin') {
      const shop = await Shop.findOne({ where: { ownerId: req.user.id } });
      if (shop) {
        const existingInventory = await Inventory.findOne({
          where: { shopId: shop.id, masterItemId: existing.id }
        });
        
        if (!existingInventory) {
          await Inventory.create({
            shopId: shop.id,
            masterItemId: existing.id,
            currentStock: currentStock || 0,
            price
          });
        } else {
           existingInventory.currentStock = currentStock || existingInventory.currentStock;
           existingInventory.price = price;
           await existingInventory.save();
        }
      }
      return res.status(200).json({ 
        message: 'Item successfully added!',
        item: existing 
      });
    }
    return res.status(400).json({ message: 'Item already exists in the catalog' });
  }

  const newItem = await MasterItem.create({
    categoryId: finalCategoryId,
    subcategoryId: finalSubcategoryId,
    itemName,
    addedBy,
    status
  });

  // If price is provided, add to user's inventory immediately
  if (price && req.user.role !== 'Admin') {
    const shop = await Shop.findOne({ where: { ownerId: req.user.id } });
    if (shop) {
      await Inventory.create({
        shopId: shop.id,
        masterItemId: newItem.id,
        currentStock: currentStock || 0,
        price
      });
    }
  }

  res.status(201).json({ 
    message: req.user.role === 'Admin' ? 'Item added to Global Catalog.' : 'Master item created.',
    item: newItem 
  });
});

module.exports = router;
