const express = require('express');
const { MasterItem, User, Shop, Order, Category, SubCategory } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/admin/stats - Fetch system statistics
router.get('/stats', authenticate, authorize(['Admin']), async (req, res) => {
  const userCount = await User.count();
  const shopCount = await Shop.count();
  const orderCount = await Order.count();
  
  res.json({
    users: userCount,
    shops: shopCount,
    orders: orderCount
  });
});

// GET /api/admin/catalog/pending - Fetch pending master items
router.get('/catalog/pending', authenticate, authorize(['Admin']), async (req, res) => {
  const pendingItems = await MasterItem.findAll({ where: { status: 'Pending' } });
  res.json(pendingItems);
});

// PUT /api/admin/catalog/:id/approve - Approve a master item
router.put('/catalog/:id/approve', authenticate, authorize(['Admin']), async (req, res) => {
  const item = await MasterItem.findByPk(req.params.id);
  if (!item) return res.status(404).json({ message: 'Item not found' });

  item.status = 'Approved';
  await item.save();

  res.json(item);
});

// DELETE /api/admin/catalog/:id - Delete a master item (spam)
router.delete('/catalog/:id', authenticate, authorize(['Admin']), async (req, res) => {
  const item = await MasterItem.findByPk(req.params.id);
  if (!item) return res.status(404).json({ message: 'Item not found' });

  await item.destroy();
  res.json({ message: 'Item deleted' });
});

// --- Taxonomy Management ---

router.post('/taxonomy/category', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const category = await Category.create({ name: req.body.name });
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ message: 'Error creating category' });
  }
});

router.put('/taxonomy/category/:id', authenticate, authorize(['Admin']), async (req, res) => {
  const category = await Category.findByPk(req.params.id);
  if (!category) return res.status(404).json({ message: 'Category not found' });
  category.name = req.body.name;
  await category.save();
  res.json(category);
});

router.delete('/taxonomy/category/:id', authenticate, authorize(['Admin']), async (req, res) => {
  const count = await MasterItem.count({ where: { categoryId: req.params.id } });
  if (count > 0) return res.status(400).json({ message: 'Cannot delete: Items exist in this category' });
  
  const subCount = await SubCategory.count({ where: { categoryId: req.params.id } });
  if (subCount > 0) return res.status(400).json({ message: 'Cannot delete: Subcategories exist in this category' });

  await Category.destroy({ where: { id: req.params.id } });
  res.json({ message: 'Category deleted' });
});

router.post('/taxonomy/subcategory', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const subCategory = await SubCategory.create({ name: req.body.name, categoryId: req.body.categoryId });
    res.status(201).json(subCategory);
  } catch (error) {
    res.status(400).json({ message: 'Error creating subcategory' });
  }
});

router.put('/taxonomy/subcategory/:id', authenticate, authorize(['Admin']), async (req, res) => {
  const subCategory = await SubCategory.findByPk(req.params.id);
  if (!subCategory) return res.status(404).json({ message: 'SubCategory not found' });
  subCategory.name = req.body.name;
  await subCategory.save();
  res.json(subCategory);
});

router.delete('/taxonomy/subcategory/:id', authenticate, authorize(['Admin']), async (req, res) => {
  const count = await MasterItem.count({ where: { subcategoryId: req.params.id } });
  if (count > 0) return res.status(400).json({ message: 'Cannot delete: Items exist in this subcategory' });

  await SubCategory.destroy({ where: { id: req.params.id } });
  res.json({ message: 'SubCategory deleted' });
});

module.exports = router;
