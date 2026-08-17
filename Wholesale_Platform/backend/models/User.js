const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { 
    type: DataTypes.ENUM('Admin', 'ShopOwner', 'Customer'), 
    allowNull: false 
  },
  status: {
    type: DataTypes.ENUM('Active', 'Blocked'),
    defaultValue: 'Active'
  }
});

module.exports = User;
