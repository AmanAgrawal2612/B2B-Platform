const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Shop = sequelize.define('Shop', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ownerId: { type: DataTypes.INTEGER, allowNull: false },
  shopName: { type: DataTypes.STRING, allowNull: false },
  uniqueCode: { type: DataTypes.STRING, allowNull: false, unique: true },
  phone: { type: DataTypes.STRING, allowNull: true },
  state: { type: DataTypes.STRING, allowNull: true },
  district: { type: DataTypes.STRING, allowNull: true },
  city: { type: DataTypes.STRING, allowNull: true }
});

module.exports = Shop;
