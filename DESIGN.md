# Sales & Expense Management Application - Design Document

## 1. ARCHITECTURE OVERVIEW

### 1.1 System Architecture (Microservices Pattern)
```
┌─────────────────┐
│   Mobile/Web    │
│   React App     │
└────────┬────────┘
         │ (REST API + JWT Auth)
         │
┌────────▼────────────────────────┐
│   Backend (Node.js + Express)   │
├─────────────────────────────────┤
│ • Authentication Service        │
│ • Customer Management Service   │
│ • Sales Entry Service           │
│ • Payment Tracking Service      │
│ • Cash Book Service             │
│ • Expense Management Service    │
│ • Reporting Service             │
│ • Dashboard Service             │
└────────┬─────────────────────────┘
         │ (Connection Pool)
         │
┌────────▼──────────────┐
│  MySQL Database       │
│  (Normalized Schema)  │
└───────────────────────┘
```

### 1.2 Technology Stack

**Frontend:**
- React 18+
- React Router v6
- Axios for API calls
- Tailwind CSS for styling
- React Query for state management
- DatePicker, Table components
- Chart.js/Recharts for reports

**Backend:**
- Node.js 18+
- Express.js
- JWT (jsonwebtoken) for authentication
- MySQL2/Promise for database
- Bcrypt for password hashing
- CORS for cross-origin requests
- Joi for validation
- Multer for file uploads
- Excel.js for export functionality

**Database:**
- MySQL 8+
- Connection pooling
- Indexed queries for performance

### 1.3 Authentication Flow
```
Login Request
    ↓
Validate credentials
    ↓
Generate JWT token (access + refresh)
    ↓
Store refresh token in DB
    ↓
Return tokens to client
    ↓
Client stores access token in localStorage/sessionStorage
    ↓
Include token in Authorization header for all requests
    ↓
Backend validates token on each request
```

---

## 2. DATABASE SCHEMA

### 2.1 ER Diagram (Text Representation)

```
┌──────────────┐
│    users     │
├──────────────┤
│ user_id (PK) │
│ email        │
│ password     │
│ name         │
│ created_at   │
└──────┬───────┘
       │
       ├──────────────────┬─────────────────┬──────────────────┐
       │                  │                 │                  │
┌──────▼──────────┐ ┌────▼────────┐ ┌────▼────────┐ ┌────▼──────────┐
│   customers     │ │sales_entries │ │ expenses    │ │ cash_book     │
├─────────────────┤ ├─────────────┤ ├─────────────┤ ├───────────────┤
│cust_id (PK)     │ │sale_id (PK) │ │expense_id   │ │cash_book_id   │
│user_id (FK)     │ │user_id (FK) │ │user_id (FK) │ │user_id (FK)   │
│name             │ │cust_id (FK) │ │date         │ │date           │
│mobile           │ │sale_date    │ │amount       │ │opening_bal    │
│company_name     │ │amount       │ │category     │ │cash_received  │
│address          │ │payment_mode │ │remarks      │ │cash_paid      │
│city             │ │payment_status
│gst_number       │ │remarks      │ │created_at   │ │closing_bal    │
│notes            │ │created_at   │ └─────────────┘ │created_at     │
│created_at       │ └──────┬──────┘                 └───────────────┘
└─────────────────┘        │
                  ┌─────────▼──────────┐
                  │ sales_line_items   │
                  ├────────────────────┤
                  │ item_id (PK)       │
                  │ sale_id (FK)       │
                  │ product_name       │
                  │ quantity           │
                  │ rate               │
                  │ total              │
                  └────────────────────┘

┌──────────────────────┐
│ payment_tracking     │
├──────────────────────┤
│ payment_id (PK)      │
│ sale_id (FK)         │
│ total_amount         │
│ amount_received      │
│ balance_amount       │
│ payment_status       │
│ last_payment_date    │
│ updated_at           │
└──────────────────────┘

┌──────────────────────┐
│ online_payments      │
├──────────────────────┤
│ online_payment_id    │
│ payment_id (FK)      │
│ reference_number     │
│ payment_type (UPI,   │
│  Bank Transfer,      │
│  Cheque)             │
│ date                 │
│ created_at           │
└──────────────────────┘

┌──────────────────────┐
│ audit_logs           │
├──────────────────────┤
│ log_id (PK)          │
│ user_id (FK)         │
│ action               │
│ table_name           │
│ record_id            │
│ old_values           │
│ new_values           │
│ timestamp            │
└──────────────────────┘
```

### 2.2 SQL Schema

```sql
-- Users Table
CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
);

-- Customers Table
CREATE TABLE customers (
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
);

-- Sales Entries Table
CREATE TABLE sales_entries (
  sale_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  customer_id INT NOT NULL,
  sale_date DATE NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_mode ENUM('Cash', 'UPI', 'Bank Transfer', 'Cheque') NOT NULL,
  payment_status ENUM('Paid', 'Partially Paid', 'Pending') NOT NULL DEFAULT 'Pending',
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE RESTRICT,
  INDEX idx_user_id (user_id),
  INDEX idx_customer_id (customer_id),
  INDEX idx_sale_date (sale_date)
);

-- Sales Line Items Table
CREATE TABLE sales_line_items (
  item_id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  product_name VARCHAR(100) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  rate DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales_entries(sale_id) ON DELETE CASCADE,
  INDEX idx_sale_id (sale_id)
);

-- Payment Tracking Table
CREATE TABLE payment_tracking (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT UNIQUE NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  amount_received DECIMAL(10, 2) DEFAULT 0,
  balance_amount DECIMAL(10, 2) NOT NULL,
  payment_status ENUM('Paid', 'Partially Paid', 'Pending') NOT NULL DEFAULT 'Pending',
  last_payment_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (sale_id) REFERENCES sales_entries(sale_id) ON DELETE CASCADE,
  INDEX idx_status (payment_status)
);

-- Online Payments Table
CREATE TABLE online_payments (
  online_payment_id INT AUTO_INCREMENT PRIMARY KEY,
  payment_id INT NOT NULL,
  reference_number VARCHAR(50),
  payment_type ENUM('UPI', 'Bank Transfer', 'Cheque') NOT NULL,
  payment_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES payment_tracking(payment_id) ON DELETE CASCADE,
  INDEX idx_reference (reference_number)
);

-- Expenses Table
CREATE TABLE expenses (
  expense_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  expense_date DATE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  category ENUM('Transport', 'Labour', 'Electricity', 'Rent', 'Food', 'Miscellaneous') NOT NULL,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_date (expense_date),
  INDEX idx_category (category)
);

-- Cash Book Table
CREATE TABLE cash_book (
  cash_book_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  entry_date DATE NOT NULL,
  opening_balance DECIMAL(10, 2) NOT NULL,
  cash_received DECIMAL(10, 2) DEFAULT 0,
  cash_paid DECIMAL(10, 2) DEFAULT 0,
  closing_balance DECIMAL(10, 2) NOT NULL,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user_date (user_id, entry_date),
  UNIQUE KEY unique_user_date (user_id, entry_date)
);

-- Audit Logs Table
CREATE TABLE audit_logs (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  action VARCHAR(50) NOT NULL,
  table_name VARCHAR(50) NOT NULL,
  record_id INT,
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);

-- Refresh Tokens Table
CREATE TABLE refresh_tokens (
  token_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
);
```

---

## 3. FOLDER STRUCTURE

### 3.1 Backend Structure
```
backend/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   ├── env.js
│   │   └── constants.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   ├── validation.js
│   │   └── auditLog.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── customerController.js
│   │   ├── salesController.js
│   │   ├── paymentController.js
│   │   ├── cashBookController.js
│   │   ├── expenseController.js
│   │   ├── reportController.js
│   │   └── dashboardController.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── customerService.js
│   │   ├── salesService.js
│   │   ├── paymentService.js
│   │   ├── cashBookService.js
│   │   ├── expenseService.js
│   │   ├── reportService.js
│   │   └── exportService.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── customerRoutes.js
│   │   ├── salesRoutes.js
│   │   ├── paymentRoutes.js
│   │   ├── cashBookRoutes.js
│   │   ├── expenseRoutes.js
│   │   ├── reportRoutes.js
│   │   ├── dashboardRoutes.js
│   │   └── index.js
│   ├── utils/
│   │   ├── validators.js
│   │   ├── helpers.js
│   │   ├── dateUtils.js
│   │   └── excelExport.js
│   └── app.js
├── .env.example
├── .env.local (git ignored)
├── package.json
└── server.js
```

### 3.2 Frontend Structure
```
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── LoginPage.jsx
│   │   │   └── RegisterPage.jsx
│   │   ├── Layout/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Header.jsx
│   │   │   └── MainLayout.jsx
│   │   ├── Dashboard/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── SalesCard.jsx
│   │   │   ├── ExpensesCard.jsx
│   │   │   └── ChartComponent.jsx
│   │   ├── Customers/
│   │   │   ├── CustomerList.jsx
│   │   │   ├── CustomerForm.jsx
│   │   │   ├── CustomerSearch.jsx
│   │   │   └── CustomerHistory.jsx
│   │   ├── Sales/
│   │   │   ├── SalesEntry.jsx
│   │   │   ├── SalesList.jsx
│   │   │   ├── LineItemForm.jsx
│   │   │   └── SalesDetails.jsx
│   │   ├── Payments/
│   │   │   ├── PaymentTracker.jsx
│   │   │   ├── PaymentForm.jsx
│   │   │   ├── PaymentList.jsx
│   │   │   └── OutstandingPayments.jsx
│   │   ├── CashBook/
│   │   │   ├── CashBook.jsx
│   │   │   ├── DailyEntry.jsx
│   │   │   └── CashSummary.jsx
│   │   ├── Expenses/
│   │   │   ├── ExpenseEntry.jsx
│   │   │   ├── ExpenseList.jsx
│   │   │   └── ExpenseAnalysis.jsx
│   │   ├── Reports/
│   │   │   ├── ReportSelector.jsx
│   │   │   ├── DailyReport.jsx
│   │   │   ├── MonthlyReport.jsx
│   │   │   ├── CustomerReport.jsx
│   │   │   ├── CashReport.jsx
│   │   │   └── ExportOptions.jsx
│   │   └── Common/
│   │       ├── Modal.jsx
│   │       ├── Loader.jsx
│   │       ├── Toast.jsx
│   │       ├── DatePicker.jsx
│   │       └── Table.jsx
│   ├── pages/
│   │   ├── HomePage.jsx
│   │   ├── NotFoundPage.jsx
│   │   └── ErrorPage.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useFetch.js
│   │   └── useForm.js
│   ├── context/
│   │   ├── AuthContext.js
│   │   └── DataContext.js
│   ├── api/
│   │   ├── client.js
│   │   ├── authAPI.js
│   │   ├── customerAPI.js
│   │   ├── salesAPI.js
│   │   ├── paymentAPI.js
│   │   ├── cashBookAPI.js
│   │   ├── expenseAPI.js
│   │   ├── reportAPI.js
│   │   └── dashboardAPI.js
│   ├── styles/
│   │   ├── globals.css
│   │   └── tailwind.css
│   ├── utils/
│   │   ├── formatters.js
│   │   ├── validators.js
│   │   ├── localStorage.js
│   │   └── dateUtils.js
│   ├── App.jsx
│   └── index.js
├── package.json
└── tailwind.config.js
```

---

## 4. UI WIREFRAMES

### 4.1 Login Screen
```
┌─────────────────────────────────────────┐
│                                         │
│          SALES & EXPENSE APP            │
│                                         │
│     ┌───────────────────────────┐       │
│     │  Login                    │       │
│     ├───────────────────────────┤       │
│     │                           │       │
│     │ Email: [______________]   │       │
│     │ Password: [____________]  │       │
│     │                           │       │
│     │ [  Login  ]  [Register]   │       │
│     │                           │       │
│     └───────────────────────────┘       │
│                                         │
└─────────────────────────────────────────┘
```

### 4.2 Dashboard
```
┌──────────────────────────────────────────────────────────────┐
│ MENU │ Sales & Expense Dashboard          Profile │ Logout  │
├──────────────────────────────────────────────────────────────┤
│ ┌────────────────────────┬──────────────────────────────────┐│
│ │ • Dashboard            │ Today's Sales:   ₹ 15,000        ││
│ │ • Customers            │ Today's Expenses: ₹  2,500       ││
│ │ • Sales Entry          ├──────────────────────────────────┤│
│ │ • Payments             │ Cash in Hand:     ₹ 25,000       ││
│ │ • Cash Book            │ Pending Payments: ₹ 18,500       ││
│ │ • Expenses             ├──────────────────────────────────┤│
│ │ • Reports              │      Monthly Sales Chart         ││
│ │ • Settings             │    ╔═════════════════════╗        ││
│ │                        │    ║  📊  [Sales Data]   ║        ││
│ │                        │    ╚═════════════════════╝        ││
│ │                        ├──────────────────────────────────┤│
│ │                        │ Recent Transactions               ││
│ │                        │ ┌────────────────────────────────┐││
│ │                        │ │ Cust │ Amount │ Date │ Status  │││
│ │                        │ │ ─────┼────────┼──────┼─────────│││
│ │                        │ │ John │ ₹5,000 │ 14.6 │ Pending │││
│ │                        │ │ Jane │ ₹8,000 │ 14.6 │ Paid    │││
│ │                        │ └────────────────────────────────┘││
│ └────────────────────────┴──────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

### 4.3 Sales Entry Screen
```
┌──────────────────────────────────────────────────────────────┐
│ MENU │ New Sales Entry                                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ Date: [14-06-2026]                                            │
│                                                               │
│ Customer: [Search: ___________] [Recent ▼]  [+ New]          │
│                                                               │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Product │ Quantity │ Rate │ Total                        │ │
│ ├──────────────────────────────────────────────────────────┤ │
│ │ [_____] │ [_____]  │[___] │ ₹ [Auto]                    │ │
│ │ [_____] │ [_____]  │[___] │ ₹ [Auto]                    │ │
│ │ [_____] │ [_____]  │[___] │ ₹ [Auto]                    │ │
│ │                               [+ Add Item]               │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                               │
│ Total Amount: ₹ [Auto Calculated]                             │
│                                                               │
│ Payment Mode: [ Cash ▼ ]  [ UPI ]  [ Bank ]  [ Cheque ]      │
│                                                               │
│ Payment Status: [ Paid ▼ ]                                    │
│                                                               │
│ Remarks: [__________________________________]                │
│                                                               │
│                    [Cancel]  [Save & New]  [Save]            │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 4.4 Mobile View (Sales Entry)
```
┌─────────────────────────────┐
│ ☰  Sales Entry              │
├─────────────────────────────┤
│                             │
│ Date                        │
│ [14-06-2026]                │
│                             │
│ Customer                    │
│ [Search Customer ___]       │
│ [Recent Customers ▼]        │
│                             │
│ ITEMS                       │
│                             │
│ Product: [________]         │
│ Qty: [__] Rate: [____]      │
│ ✓ ₹ Total                   │
│                             │
│ Product: [________]         │
│ Qty: [__] Rate: [____]      │
│ ✓ ₹ Total                   │
│                             │
│ [+ Add Item]                │
│                             │
│ Total: ₹ 13,000             │
│                             │
│ Payment Mode:               │
│ [Cash] [UPI] [Bank]         │
│                             │
│ Status: [Paid ▼]            │
│                             │
│ [Save Transaction]          │
│                             │
└─────────────────────────────┘
```

### 4.5 Payments Screen
```
┌──────────────────────────────────────────────────────────────┐
│ MENU │ Outstanding Payments                                   │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ Filter: [All ▼] Date Range: [___] to [___] [Search]          │
│                                                               │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Cust │ Total │ Received │ Balance │ Status │ Action   │ │
│ ├──────────────────────────────────────────────────────────┤ │
│ │ John │₹5000  │ ₹2000    │ ₹3000   │ Part.  │ [Receive]│ │
│ │ Jane │₹8000  │ ₹0       │ ₹8000   │ Pend.  │ [Receive]│ │
│ │ Mike │₹3500  │ ₹3500    │ ₹0      │ Paid   │ [View]   │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                               │
│ Pending Total: ₹ 11,000   Outstanding: ₹ 11,000             │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. REAL-WORLD IMPROVEMENTS FOR RETAIL SHOP USAGE

### 5.1 Mobile-First Design
- ✅ Large, easy-to-tap buttons (min 44px)
- ✅ Simplified entry forms for quick input
- ✅ Single-hand navigation
- ✅ Minimal scrolling
- ✅ Offline mode support (local storage caching)

### 5.2 Quick Data Entry
- ✅ Auto-complete customer names (as you type)
- ✅ Recently used customers (quick access)
- ✅ Quick payment buttons for common amounts
- ✅ Voice input for amounts (optional)
- ✅ Barcode scanning integration (future)

### 5.3 Cash Flow Management
- ✅ Daily cash-in and cash-out tracking
- ✅ Opening and closing balance
- ✅ Real-time balance display
- ✅ Cash discrepancy alerts
- ✅ Daily reconciliation checklist

### 5.4 Business Intelligence
- ✅ Best-selling products tracking
- ✅ Customer purchase frequency analysis
- ✅ Seasonal sales trends
- ✅ Profit/loss per transaction
- ✅ Customer credit limit alerts

### 5.5 Notifications & Reminders
- ✅ Alert for outstanding payments reaching 30+ days
- ✅ Daily opening balance reminder
- ✅ Low inventory warnings (future)
- ✅ Business limit notifications

### 5.6 Data Backup & Recovery
- ✅ Daily automatic backup
- ✅ Cloud backup option
- ✅ One-click restore
- ✅ Data export (Excel, CSV, PDF)
- ✅ Duplicate entry detection

### 5.7 User Experience Enhancements
- ✅ Undo/Redo for recent entries
- ✅ Quick shortcuts (Ctrl+S, Ctrl+N)
- ✅ Dark mode support
- ✅ Customizable currency symbol
- ✅ Multi-language support (Hindi, English)

---

## 6. IMPLEMENTATION ROADMAP & MODULE BREAKDOWN

### Phase 1: Foundation (Weeks 1-2)
1. Project setup (Node/React scaffolding)
2. Database setup & schema creation
3. Authentication system (Login/Register)
4. Basic project structure
5. API scaffolding

### Phase 2: Core Features (Weeks 3-5)
1. Customer Management (Add, Edit, Search, List)
2. Sales Entry (with line items)
3. Payment Tracking (Outstanding payments)
4. Basic Dashboard

### Phase 3: Advanced Features (Weeks 6-8)
1. Cash Book Management
2. Expense Tracking
3. Reports & Export
4. Advanced Filtering & Search

### Phase 4: Optimization & Polish (Weeks 9-10)
1. Mobile optimization
2. Performance tuning
3. Security hardening
4. Testing & bug fixes

### Phase 5: Deployment (Week 11+)
1. Docker containerization
2. Cloud deployment (AWS/GCP/Azure)
3. Monitoring & logging
4. Documentation

---

## 7. API ENDPOINTS OVERVIEW

```
AUTH
  POST   /api/auth/register
  POST   /api/auth/login
  POST   /api/auth/refresh
  POST   /api/auth/logout

CUSTOMERS
  GET    /api/customers
  GET    /api/customers/search?q=name
  GET    /api/customers/:id
  POST   /api/customers
  PUT    /api/customers/:id
  DELETE /api/customers/:id
  GET    /api/customers/:id/transactions

SALES
  GET    /api/sales
  GET    /api/sales/date-range?from=date&to=date
  GET    /api/sales/:id
  POST   /api/sales
  PUT    /api/sales/:id
  DELETE /api/sales/:id

PAYMENTS
  GET    /api/payments
  GET    /api/payments/outstanding
  GET    /api/payments/:id
  PUT    /api/payments/:id/record-payment
  POST   /api/online-payments

CASH BOOK
  GET    /api/cash-book
  GET    /api/cash-book/:date
  POST   /api/cash-book
  PUT    /api/cash-book/:id

EXPENSES
  GET    /api/expenses
  GET    /api/expenses/category/:category
  GET    /api/expenses/:id
  POST   /api/expenses
  PUT    /api/expenses/:id
  DELETE /api/expenses/:id

REPORTS
  GET    /api/reports/daily?date=date
  GET    /api/reports/monthly?month=month
  GET    /api/reports/customer/:customerId
  GET    /api/reports/cash-summary
  GET    /api/reports/expense-summary
  GET    /api/reports/export?type=pdf&format=daily

DASHBOARD
  GET    /api/dashboard/summary
  GET    /api/dashboard/today
  GET    /api/dashboard/charts?type=sales&period=monthly
```

---

## 8. SECURITY CHECKLIST

- ✅ JWT token-based authentication
- ✅ Password hashing (Bcrypt)
- ✅ Input validation & sanitization
- ✅ SQL injection prevention (prepared statements)
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Audit logging for all actions
- ✅ Refresh token rotation
- ✅ HTTPS enforcement
- ✅ XSS protection
- ✅ CSRF protection
- ✅ Environment variable management

---

## 9. PERFORMANCE OPTIMIZATION

- ✅ Database indexing on frequently queried columns
- ✅ Query optimization & pagination
- ✅ Connection pooling
- ✅ Frontend code splitting
- ✅ Lazy loading of components
- ✅ Caching strategies (Redis optional)
- ✅ Image optimization
- ✅ Gzip compression

---

## Next Steps

1. **Review & Approve** this design document
2. **Database Setup** - Create MySQL schema
3. **Backend Setup** - Initialize Node.js project
4. **Frontend Setup** - Initialize React project
5. **Start Phase 1** - Build foundation
6. **Build Phase 2** - Core features
7. **Build Phase 3** - Advanced features
8. **Deploy** - Cloud deployment

---

**Ready to proceed with implementation? Please review the design and let me know:**
- Any changes or modifications needed?
- Any additional features you'd like to add?
- Any specific preferences for UI/styling?
