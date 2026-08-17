const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Connection = sequelize.define('Connection', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  shopId: { type: DataTypes.INTEGER, allowNull: false },
  customerId: { type: DataTypes.INTEGER, allowNull: false }, 
  status: {
    type: DataTypes.ENUM('Active', 'Blocked'),
    defaultValue: 'Active'
  }
});

module.exports = Connection;
