# Sales & Expense Management Application

A production-ready web application for managing non-billed business transactions. Built with React, Node.js, Express, and MySQL.

## Features

✅ **Customer Management**
- Add, edit, search, and manage customer records
- Track customer transaction history
- Monitor outstanding balances per customer

✅ **Sales Entry**
- Create sales entries with multiple line items
- Automatic total calculation
- Payment mode tracking (Cash, UPI, Bank Transfer, Cheque)
- Payment status management (Paid, Partially Paid, Pending)

✅ **Payment Tracking**
- Record payments for outstanding transactions
- Track payment history
- Outstanding payment reports
- Customer-wise payment summaries

✅ **Cash Book Management**
- Daily cash entry and reconciliation
- Opening and closing balance tracking
- Real-time cash position

✅ **Expense Tracking**
- Categorized expense management
- Daily, monthly, and category-wise reports
- Expense analytics

✅ **Dashboard & Reports**
- Real-time business metrics
- Daily, monthly, and customer reports
- Export to Excel and PDF
- Payment due tracking

✅ **Security**
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Audit logging
- Input validation and sanitization

## Tech Stack

**Frontend:**
- React 18
- React Router v6
- Axios
- Tailwind CSS
- React Query
- React Hot Toast
- Recharts (for charts)

**Backend:**
- Node.js
- Express.js
- MySQL 8
- JWT (jsonwebtoken)
- Bcryptjs
- Joi (validation)
- ExcelJS & PDFKit (reports)

## Installation

### Prerequisites

- Node.js 14+
- MySQL 8+
- npm or yarn

### Setup Instructions

#### 1. Database Setup

```bash
# Create MySQL database and tables
mysql -u root -p < backend/src/config/schema.sql
```

#### 2. Backend Setup

```bash
cd backend

# Copy environment file
cp .env.example .env

# Install dependencies
npm install

# Start the server
npm run dev
```

**Backend will run on:** `http://localhost:5000`

#### 3. Frontend Setup

```bash
cd frontend

# Copy environment file
cp .env.example .env

# Install dependencies
npm install

# Start the development server
npm start
```

**Frontend will run on:** `http://localhost:3000`

## Environment Configuration

### Backend (.env)

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=sales_expense_db
DB_PORT=3306

PORT=5000
NODE_ENV=development

JWT_SECRET=your_super_secret_jwt_key
JWT_REFRESH_SECRET=your_super_secret_refresh_key
JWT_EXPIRE=1h
JWT_REFRESH_EXPIRE=7d

FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:5000
```

### Frontend (.env)

```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_APP_NAME=Sales & Expense App
```

## API Documentation

### Authentication

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
```

### Customers

```
GET    /api/customers
GET    /api/customers/search?q=name
GET    /api/customers/:id
POST   /api/customers
PUT    /api/customers/:id
DELETE /api/customers/:id
GET    /api/customers/:id/transactions
GET    /api/customers/:id/outstanding-balance
```

### Sales

```
GET    /api/sales
GET    /api/sales/:id
POST   /api/sales
PUT    /api/sales/:id
DELETE /api/sales/:id
GET    /api/sales/date-range?from=date&to=date
GET    /api/sales/daily-total?date=date
```

### Payments

```
GET    /api/payments/outstanding
GET    /api/payments/outstanding-summary
PUT    /api/payments/:saleId/record
GET    /api/payments/:saleId/status
GET    /api/payments/:saleId/history
GET    /api/payments/customer/:customerId
GET    /api/payments/due?daysOverdue=30
```

### Expenses

```
GET    /api/expenses
POST   /api/expenses
PUT    /api/expenses/:id
DELETE /api/expenses/:id
GET    /api/expenses/date-range?from=date&to=date
GET    /api/expenses/by-category?from=date&to=date
```

### Cash Book

```
GET    /api/cash-book
POST   /api/cash-book
GET    /api/cash-book/:date
PUT    /api/cash-book/:date
GET    /api/cash-book/reconcile/:date
```

### Dashboard

```
GET    /api/dashboard/today
GET    /api/dashboard/monthly?month=6&year=2026
GET    /api/dashboard/chart?type=sales&period=month
GET    /api/dashboard/transactions?limit=10
GET    /api/dashboard/metrics
```

### Reports

```
GET    /api/reports/daily?date=2026-06-14&format=json
GET    /api/reports/monthly?month=6&year=2026&format=excel
GET    /api/reports/customer?customerId=1&format=pdf
GET    /api/reports/cash?startDate=2026-06-01&endDate=2026-06-30
GET    /api/reports/outstanding-payments?format=excel
GET    /api/reports/expenses?startDate=2026-06-01&endDate=2026-06-30
```

## Database Schema

The application uses 12 main tables:

- **users** - User accounts and authentication
- **customers** - Customer information
- **sales_entries** - Sales transactions
- **sales_line_items** - Line items for each sale
- **payment_tracking** - Payment status and history
- **online_payments** - Online payment records
- **expenses** - Business expenses
- **cash_book** - Daily cash management
- **refresh_tokens** - JWT token management
- **audit_logs** - System audit trail

All tables include proper relationships, indexes, and constraints for data integrity.

## Project Structure

```
tally-lite/
├── backend/
│   ├── src/
│   │   ├── config/          # Database and config files
│   │   ├── controllers/      # Route handlers
│   │   ├── services/         # Business logic
│   │   ├── routes/           # API endpoints
│   │   ├── middleware/       # Auth, validation, error handling
│   │   └── utils/            # Utilities and helpers
│   ├── package.json
│   ├── server.js
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── api/              # API client and endpoints
│   │   ├── hooks/            # Custom hooks
│   │   ├── context/          # React context
│   │   ├── utils/            # Utility functions
│   │   ├── styles/           # CSS files
│   │   ├── App.jsx
│   │   └── index.js
│   ├── package.json
│   ├── tailwind.config.js
│   └── .env.example
│
├── DESIGN.md                 # Architecture design document
└── README.md
```

## Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### Production Build

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
```

## Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Security Best Practices

1. **Authentication** - JWT tokens with refresh token rotation
2. **Password Security** - Bcryptjs hashing with salt rounds
3. **Input Validation** - Joi schema validation on all inputs
4. **SQL Injection Prevention** - Parameterized queries with mysql2
5. **CORS** - Configured for frontend-backend communication
6. **Rate Limiting** - Express rate limit middleware
7. **Helmet** - Security headers
8. **Audit Logging** - All user actions logged
9. **Error Handling** - Comprehensive error handling with proper status codes
10. **HTTPS Ready** - Environment-based configuration

## Deployment

### Backend Deployment (Cloud)

1. **Docker Setup:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 5000
CMD ["npm", "start"]
```

2. **Environment:** Set production environment variables
3. **Database:** Use managed MySQL service
4. **Deploy to:** AWS, GCP, Azure, Heroku, DigitalOcean

### Frontend Deployment

1. **Build:** `npm run build`
2. **Deploy to:** Vercel, Netlify, AWS S3, GitHub Pages, GCP

## Troubleshooting

### Database Connection Error
- Check MySQL is running
- Verify credentials in .env
- Ensure database is created

### CORS Error
- Check FRONTEND_URL in backend .env
- Verify API_URL in frontend .env

### Port Already in Use
- Change PORT in .env
- Kill process: `lsof -ti:5000 | xargs kill -9`

### Module Not Found
- Run `npm install` in respective directory
- Clear node_modules and reinstall

## Support & Documentation

- See **DESIGN.md** for architecture details
- Check API endpoints above for request/response formats
- Review code comments for implementation details

## Performance Optimization

- Database indexes on frequently queried columns
- Connection pooling for database
- Frontend code splitting
- Lazy loading of components
- API response caching
- Gzip compression

## Future Enhancements

- [ ] Invoice generation
- [ ] Inventory management
- [ ] Multi-user roles and permissions
- [ ] Mobile app (React Native)
- [ ] WhatsApp integration for notifications
- [ ] GST/Tax compliance reports
- [ ] Data backup and restore
- [ ] Multi-language support
- [ ] Analytics dashboard
- [ ] Email notifications

## License

MIT

## Support

For issues and questions, please contact: manishjain@nuclaysolutions.com

---

**Built with ❤️ for retail and wholesale businesses**
