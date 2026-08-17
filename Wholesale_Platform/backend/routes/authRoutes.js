const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { User, Shop } = require('../models');
const { registerValidator, loginValidator } = require('../middleware/validators');
const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs for auth routes
  message: { message: 'Too many authentication attempts, please try again after 15 minutes' }
});

// Register
router.post('/register', authLimiter, registerValidator, async (req, res) => {
  const { name, email, password, role, shopName, phone, city, state } = req.body;
  
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({ name, email, password: hashedPassword, role });

  // Automatically create shop for ShopOwners
  if (role === 'ShopOwner') {
    const uniqueCode = 'SHOP-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    await Shop.create({ 
      ownerId: user.id, 
      shopName: shopName || `${name}'s Shop`, 
      uniqueCode,
      phone: phone || null,
      city: city || null,
      state: state || null
    });
  }

  res.status(201).json({ message: 'User created successfully' });
});

// Login
router.post('/login', authLimiter, loginValidator, async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });
  
  if (!user) return res.status(400).json({ message: 'Invalid credentials' });
  if (user.status === 'Blocked') return res.status(403).json({ message: 'Account is blocked' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

  const token = jwt.sign(
    { id: user.id, role: user.role }, 
    process.env.JWT_SECRET || 'supersecret',
    { expiresIn: '1d' }
  );

  res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
});

module.exports = router;
