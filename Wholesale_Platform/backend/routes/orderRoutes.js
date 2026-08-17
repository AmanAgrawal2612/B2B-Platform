const express = require('express');
const { Order, OrderItem, Inventory, Shop, MasterItem } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

router.post('/place', authenticate, async (req, res) => {
  const { shopId, items } = req.body; 
  
  const order = await Order.create({ customerId: req.user.id, shopId, status: 'Pending' });
  
  for (let i of items) {
    const inventoryItem = await Inventory.findByPk(i.itemId, { include: [MasterItem] });
    if (!inventoryItem || inventoryItem.currentStock < i.quantity) {
      return res.status(400).json({ message: `Insufficient stock for ${inventoryItem?.MasterItem?.itemName || 'item'}` });
    }
    await OrderItem.create({
      orderId: order.id,
      itemId: i.itemId,
      quantity: i.quantity,
      priceAtTimeOfOrder: inventoryItem.price
    });
  }
  res.status(201).json({ message: 'Order placed successfully', order });
});

router.get('/my-orders', authenticate, authorize(['Customer']), async (req, res) => {
  const orders = await Order.findAll({
    where: { customerId: req.user.id },
    include: [{ model: Shop }, { model: OrderItem, include: [{ model: Inventory, include: [MasterItem] }] }]
  });
  res.json(orders);
});

router.get('/incoming', authenticate, authorize(['ShopOwner']), async (req, res) => {
  const shop = await Shop.findOne({ where: { ownerId: req.user.id } });
  const orders = await Order.findAll({ 
    where: { shopId: shop.id },
    include: [{ model: OrderItem, include: [{ model: Inventory, include: [MasterItem] }] }]
  });
  res.json(orders);
});

router.post('/:id/status', authenticate, authorize(['ShopOwner']), async (req, res) => {
  const { status } = req.body;
  const order = await Order.findByPk(req.params.id, { include: [OrderItem] });
  
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (order.status !== 'Pending') return res.status(400).json({ message: 'Order already processed' });
  
  order.status = status;
  await order.save();
  
  if (status === 'Approved') {
    // Inventory is only reduced upon explicit approval (guarantees perfect ML sales data!)
    for (let item of order.OrderItems) {
      const inventory = await Inventory.findByPk(item.itemId);
      inventory.currentStock -= item.quantity;
      await inventory.save();
    }
  }
  
  res.json({ message: `Order ${status}` });
});

module.exports = router;
