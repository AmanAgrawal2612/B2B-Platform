const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { sequelize } = require('./models');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.use(helmet());
app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api', limiter);

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/shops', require('./routes/shopRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/ml', require('./routes/mlRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/catalog', require('./routes/masterCatalogRoutes'));
app.use('/api/taxonomy', require('./routes/taxonomyRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/forecast', require('./routes/forecastRoutes'));

// Global error handler must be last
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: true }).then(() => {
  console.log("Database synced successfully");
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error("Failed to sync db:", err);
});
