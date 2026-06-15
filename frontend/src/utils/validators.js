export const validators = {
  email: (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  mobile: (mobile) => {
    return /^[0-9]{10}$/.test(mobile);
  },

  gst: (gst) => {
    if (!gst) return true;
    const re = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
    return re.test(gst);
  },

  password: (password) => {
    return password && password.length >= 6;
  },

  amount: (amount) => {
    return !isNaN(amount) && amount > 0;
  },

  required: (value) => {
    return value !== '' && value !== null && value !== undefined;
  },
};

export const getErrorMessage = (field, value) => {
  if (!validators.required(value)) {
    return `${field} is required`;
  }

  if (field.toLowerCase().includes('email') && value && !validators.email(value)) {
    return 'Invalid email address';
  }

  if (field.toLowerCase().includes('mobile') && value && !validators.mobile(value)) {
    return 'Mobile must be 10 digits';
  }

  if (field.toLowerCase().includes('gst') && value && !validators.gst(value)) {
    return 'Invalid GST number';
  }

  if (field.toLowerCase().includes('password') && value && !validators.password(value)) {
    return 'Password must be at least 6 characters';
  }

  if (field.toLowerCase().includes('amount') && value && !validators.amount(value)) {
    return 'Amount must be greater than 0';
  }

  return '';
};
