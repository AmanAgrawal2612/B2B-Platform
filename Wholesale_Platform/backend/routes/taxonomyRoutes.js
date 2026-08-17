const express = require('express');
const router = express.Router();
const { Category, SubCategory } = require('../models');

// GET /api/taxonomy
// Returns the full tree of categories and subcategories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.findAll({
      include: [{ model: SubCategory }]
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching taxonomy', error: error.message });
  }
});

module.exports = router;
