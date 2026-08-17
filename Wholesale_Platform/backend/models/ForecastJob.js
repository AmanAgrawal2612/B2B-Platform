const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ForecastJob = sequelize.define('ForecastJob', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  shopId: { type: DataTypes.INTEGER, allowNull: false },
  status: {
    type: DataTypes.ENUM('Pending', 'Processing', 'Completed', 'Failed'),
    defaultValue: 'Pending'
  },
  resultJson: {
    type: DataTypes.TEXT('long'), 
    allowNull: true
  }
});

module.exports = ForecastJob;
