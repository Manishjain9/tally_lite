module.exports = {
  // HTTP Status Codes
  STATUS_CODES: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_ERROR: 500,
  },

  // Error Messages
  ERROR_MESSAGES: {
    INVALID_CREDENTIALS: 'Invalid email or password',
    USER_EXISTS: 'User already exists',
    USER_NOT_FOUND: 'User not found',
    UNAUTHORIZED: 'Unauthorized access',
    INVALID_TOKEN: 'Invalid or expired token',
    CUSTOMER_NOT_FOUND: 'Customer not found',
    SALE_NOT_FOUND: 'Sale not found',
    INVALID_INPUT: 'Invalid input data',
    DUPLICATE_ENTRY: 'Duplicate entry',
    INTERNAL_ERROR: 'Internal server error',
    DB_ERROR: 'Database operation failed',
  },

  // Payment Statuses
  PAYMENT_STATUS: {
    PAID: 'Paid',
    PARTIALLY_PAID: 'Partially Paid',
    PENDING: 'Pending',
  },

  // Payment Modes
  PAYMENT_MODE: {
    CASH: 'Cash',
    UPI: 'UPI',
    BANK_TRANSFER: 'Bank Transfer',
    CHEQUE: 'Cheque',
  },

  // Expense Categories
  EXPENSE_CATEGORIES: {
    TRANSPORT: 'Transport',
    LABOUR: 'Labour',
    ELECTRICITY: 'Electricity',
    RENT: 'Rent',
    FOOD: 'Food',
    MISCELLANEOUS: 'Miscellaneous',
  },

  // Audit Actions
  AUDIT_ACTIONS: {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
  },

  // Pagination
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },

  // JWT
  JWT: {
    ALGORITHM: 'HS256',
  },

  // Validation
  VALIDATION: {
    MIN_PASSWORD_LENGTH: 6,
    MAX_NAME_LENGTH: 100,
    MOBILE_PATTERN: /^[0-9]{10}$/,
    GST_PATTERN: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/,
    EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
};
