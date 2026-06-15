-- Create Database
CREATE DATABASE IF NOT EXISTS sales_expense_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sales_expense_db;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
  customer_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  mobile VARCHAR(15),
  company_name VARCHAR(100),
  address TEXT,
  city VARCHAR(50),
  gst_number VARCHAR(20),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_name (name),
  INDEX idx_mobile (mobile)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sales Entries Table
CREATE TABLE IF NOT EXISTS sales_entries (
  sale_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  customer_id INT NOT NULL,
  sale_date DATE NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL,
  payment_mode ENUM('Cash', 'UPI', 'Bank Transfer', 'Cheque') NOT NULL,
  payment_status ENUM('Paid', 'Partially Paid', 'Pending') NOT NULL DEFAULT 'Pending',
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE RESTRICT,
  INDEX idx_user_id (user_id),
  INDEX idx_customer_id (customer_id),
  INDEX idx_sale_date (sale_date),
  INDEX idx_payment_status (payment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sales Line Items Table
CREATE TABLE IF NOT EXISTS sales_line_items (
  item_id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  product_name VARCHAR(100) NOT NULL,
  quantity DECIMAL(12, 2) NOT NULL,
  rate DECIMAL(12, 2) NOT NULL,
  total DECIMAL(12, 2) NOT NULL,
  unit VARCHAR(20) DEFAULT 'Units',
  FOREIGN KEY (sale_id) REFERENCES sales_entries(sale_id) ON DELETE CASCADE,
  INDEX idx_sale_id (sale_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payment Tracking Table
CREATE TABLE IF NOT EXISTS payment_tracking (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT UNIQUE NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL,
  amount_received DECIMAL(12, 2) DEFAULT 0,
  balance_amount DECIMAL(12, 2) NOT NULL,
  payment_status ENUM('Paid', 'Partially Paid', 'Pending') NOT NULL DEFAULT 'Pending',
  last_payment_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (sale_id) REFERENCES sales_entries(sale_id) ON DELETE CASCADE,
  INDEX idx_status (payment_status),
  INDEX idx_balance (balance_amount)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Online Payments Table
CREATE TABLE IF NOT EXISTS online_payments (
  online_payment_id INT AUTO_INCREMENT PRIMARY KEY,
  payment_id INT NOT NULL,
  reference_number VARCHAR(50),
  payment_type ENUM('Cash', 'UPI', 'Bank Transfer', 'Cheque'),
  amount_received DECIMAL(12, 2),
  payment_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES payment_tracking(payment_id) ON DELETE CASCADE,
  INDEX idx_reference (reference_number),
  INDEX idx_payment_type (payment_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
  expense_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  expense_date DATE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  category ENUM('Transport', 'Labour', 'Electricity', 'Rent', 'Food', 'Miscellaneous') NOT NULL,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_date (expense_date),
  INDEX idx_category (category),
  INDEX idx_user_date (user_id, expense_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cash Book Table
CREATE TABLE IF NOT EXISTS cash_book (
  cash_book_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  entry_date DATE NOT NULL,
  opening_balance DECIMAL(12, 2) NOT NULL,
  cash_received DECIMAL(12, 2) DEFAULT 0,
  cash_paid DECIMAL(12, 2) DEFAULT 0,
  closing_balance DECIMAL(12, 2) NOT NULL,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user_date (user_id, entry_date),
  UNIQUE KEY unique_user_date (user_id, entry_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Refresh Tokens Table
CREATE TABLE IF NOT EXISTS refresh_tokens (
  token_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(50) NOT NULL,
  table_name VARCHAR(50) NOT NULL,
  record_id INT,
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  INDEX idx_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Indexes for better performance
CREATE INDEX idx_customer_user ON customers(user_id);
CREATE INDEX idx_sales_user_date ON sales_entries(user_id, sale_date);
CREATE INDEX idx_expenses_user_date ON expenses(user_id, expense_date);
