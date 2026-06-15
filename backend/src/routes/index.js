const express = require('express');

const authRoutes = require('./authRoutes');
const customerRoutes = require('./customerRoutes');
const salesRoutes = require('./salesRoutes');
const paymentRoutes = require('./paymentRoutes');
const expenseRoutes = require('./expenseRoutes');
const cashBookRoutes = require('./cashBookRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const reportRoutes = require('./reportRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/customers', customerRoutes);
router.use('/sales', salesRoutes);
router.use('/payments', paymentRoutes);
router.use('/expenses', expenseRoutes);
router.use('/cash-book', cashBookRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);

module.exports = router;
