const Joi = require('joi');
const { VALIDATION } = require('../config/constants');

const validateRequest = (schema, source = 'body') => {
  return (req, res, next) => {
    const toValidate = source === 'body' ? req.body : req.query;
    const { error, value } = schema.validate(toValidate, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: details,
      });
    }

    req[source] = value;
    next();
  };
};

// Common schemas
const schemas = {
  register: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({ 'string.email': 'Invalid email' }),
    password: Joi.string()
      .min(VALIDATION.MIN_PASSWORD_LENGTH)
      .required()
      .messages({ 'string.min': `Password must be at least ${VALIDATION.MIN_PASSWORD_LENGTH} characters` }),
    name: Joi.string()
      .max(VALIDATION.MAX_NAME_LENGTH)
      .required(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  customer: Joi.object({
    name: Joi.string().max(VALIDATION.MAX_NAME_LENGTH).required(),
    mobile: Joi.string().pattern(/^[0-9]{10}$/).empty('').optional(),
    company_name: Joi.string().empty('').optional(),
    address: Joi.string().empty('').optional(),
    city: Joi.string().empty('').optional(),
    gst_number: Joi.string().empty('').optional(),
    notes: Joi.string().empty('').optional(),
  }),

  salesEntry: Joi.object({
    customer_id: Joi.number().integer().required(),
    sale_date: Joi.date().required(),
    payment_mode: Joi.string()
      .valid('Cash', 'UPI', 'Bank Transfer', 'Cheque')
      .required(),
    payment_status: Joi.string()
      .valid('Paid', 'Partially Paid', 'Pending')
      .optional(),
    remarks: Joi.string().empty('').optional(),
    items: Joi.array()
      .items(
        Joi.object({
          product_name: Joi.string().required(),
          quantity: Joi.number().positive().required(),
          rate: Joi.number().positive().required(),
        })
      )
      .required(),
  }),

  expense: Joi.object({
    expense_date: Joi.date().required(),
    amount: Joi.number().positive().required(),
    category: Joi.string()
      .valid('Transport', 'Labour', 'Electricity', 'Rent', 'Food', 'Miscellaneous')
      .required(),
    remarks: Joi.string().empty('').optional(),
  }),

  cashBook: Joi.object({
    entry_date: Joi.date().required(),
    opening_balance: Joi.number().required(),
    cash_received: Joi.number().default(0),
    cash_paid: Joi.number().default(0),
    remarks: Joi.string().empty('').optional(),
  }),

  paymentUpdate: Joi.object({
    amount_received: Joi.number().positive().required(),
    payment_type: Joi.string()
      .valid('Cash', 'UPI', 'Bank Transfer', 'Cheque')
      .optional(),
    reference_number: Joi.string().empty('').optional(),
  }),
};

module.exports = { validateRequest, schemas };
