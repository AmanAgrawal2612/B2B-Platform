const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Inventory = sequelize.define('Inventory', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  shopId: { type: DataTypes.INTEGER, allowNull: false },
  masterItemId: { type: DataTypes.INTEGER, allowNull: false },
  currentStock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false }
});

module.exports = Inventory;
