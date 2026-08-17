const sequelize = require('../config/db');
const User = require('./User');
const Shop = require('./Shop');
const Connection = require('./Connection');
const Inventory = require('./Inventory');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const ForecastJob = require('./ForecastJob');
const MasterItem = require('./MasterItem');
const Category = require('./Category');
const SubCategory = require('./SubCategory');

// A User (ShopOwner) can have many Shops
User.hasMany(Shop, { foreignKey: 'ownerId' });
Shop.belongsTo(User, { foreignKey: 'ownerId', as: 'Owner' });

// Taxonomy
Category.hasMany(SubCategory, { foreignKey: 'categoryId' });
SubCategory.belongsTo(Category, { foreignKey: 'categoryId' });

Category.hasMany(MasterItem, { foreignKey: 'categoryId' });
MasterItem.belongsTo(Category, { foreignKey: 'categoryId' });

SubCategory.hasMany(MasterItem, { foreignKey: 'subcategoryId' });
MasterItem.belongsTo(SubCategory, { foreignKey: 'subcategoryId' });

// MasterItems created by User
User.hasMany(MasterItem, { foreignKey: 'addedBy' });
MasterItem.belongsTo(User, { foreignKey: 'addedBy', as: 'Creator' });

// A Shop can have many Connections (Customers)
Shop.hasMany(Connection, { foreignKey: 'shopId' });
Connection.belongsTo(Shop, { foreignKey: 'shopId' });

// A User can be connected to many Shops (as a Customer)
User.hasMany(Connection, { foreignKey: 'customerId' });
Connection.belongsTo(User, { foreignKey: 'customerId', as: 'Customer' });

// MasterItem -> Inventory
MasterItem.hasMany(Inventory, { foreignKey: 'masterItemId' });
Inventory.belongsTo(MasterItem, { foreignKey: 'masterItemId' });

// Shop -> Inventory
Shop.hasMany(Inventory, { foreignKey: 'shopId' });
Inventory.belongsTo(Shop, { foreignKey: 'shopId' });

// Orders
User.hasMany(Order, { foreignKey: 'customerId' });
Order.belongsTo(User, { foreignKey: 'customerId', as: 'Customer' });

Shop.hasMany(Order, { foreignKey: 'shopId' });
Order.belongsTo(Shop, { foreignKey: 'shopId' });

// Order Items
Order.hasMany(OrderItem, { foreignKey: 'orderId' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

Inventory.hasMany(OrderItem, { foreignKey: 'itemId' });
OrderItem.belongsTo(Inventory, { foreignKey: 'itemId' });

// Forecast Jobs
Shop.hasMany(ForecastJob, { foreignKey: 'shopId' });
ForecastJob.belongsTo(Shop, { foreignKey: 'shopId' });

module.exports = {
  sequelize,
  User,
  Shop,
  Connection,
  MasterItem,
  Category,
  SubCategory,
  Inventory,
  Order,
  OrderItem,
  ForecastJob
};
