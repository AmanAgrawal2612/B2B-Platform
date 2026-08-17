const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Simplify error response format to easily display on frontend
    const errorMessages = errors.array().map(err => err.msg).join(', ');
    return res.status(400).json({ message: errorMessages, errors: errors.array() });
  }
  next();
};

const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role').isIn(['ShopOwner', 'Customer']).withMessage('Invalid role'),
  handleValidationErrors
];

const loginValidator = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

const catalogItemValidator = [
  body('categoryId').isInt().withMessage('Valid Category is required'),
  body('subcategoryId').isInt().withMessage('Valid Subcategory is required'),
  body('itemName').trim().notEmpty().withMessage('Item name is required'),
  body('price').optional({ checkFalsy: true }).isFloat({ gt: 0 }).withMessage('Price must be greater than 0'),
  body('currentStock').optional({ checkFalsy: true }).isInt({ min: 0 }).withMessage('Stock cannot be negative'),
  handleValidationErrors
];

module.exports = {
  registerValidator,
  loginValidator,
  catalogItemValidator
};
