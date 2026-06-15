const VALIDATION = require('../config/constants').VALIDATION;

const validators = {
  isValidEmail: (email) => {
    return VALIDATION.EMAIL_PATTERN.test(email);
  },

  isValidMobile: (mobile) => {
    return VALIDATION.MOBILE_PATTERN.test(mobile);
  },

  isValidGST: (gst) => {
    return gst ? VALIDATION.GST_PATTERN.test(gst) : true;
  },

  isValidPassword: (password) => {
    return password && password.length >= VALIDATION.MIN_PASSWORD_LENGTH;
  },

  isValidAmount: (amount) => {
    return !isNaN(amount) && amount > 0;
  },

  isValidDate: (date) => {
    const d = new Date(date);
    return d instanceof Date && !isNaN(d);
  },

  sanitize: (input) => {
    if (typeof input !== 'string') return input;
    return input
      .replace(/[<>]/g, '')
      .trim();
  },

  calculateBalance: (totalAmount, amountReceived) => {
    return Math.max(0, totalAmount - amountReceived);
  },

  calculateClosingBalance: (openingBalance, cashReceived, cashPaid) => {
    return openingBalance + cashReceived - cashPaid;
  },

  determinePaymentStatus: (totalAmount, amountReceived) => {
    if (amountReceived === 0) return 'Pending';
    if (amountReceived >= totalAmount) return 'Paid';
    return 'Partially Paid';
  },
};

module.exports = validators;
