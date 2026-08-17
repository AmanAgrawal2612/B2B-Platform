const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const MasterItem = sequelize.define('MasterItem', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  categoryId: { type: DataTypes.INTEGER, allowNull: true },
  subcategoryId: { type: DataTypes.INTEGER, allowNull: true },
  itemName: { type: DataTypes.STRING, allowNull: false },
  addedBy: { type: DataTypes.INTEGER, allowNull: true },
  status: { 
    type: DataTypes.ENUM('Pending', 'Approved'),
    defaultValue: 'Pending'
  }
});

module.exports = MasterItem;
