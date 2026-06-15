# Installation Guide

Complete setup instructions for Sales & Expense Management Application.

## Prerequisites

Before starting, ensure you have installed:

1. **Node.js** (v14 or higher)
   - Download from: https://nodejs.org/
   - Verify: `node --version` and `npm --version`

2. **MySQL** (v8 or higher)
   - Download from: https://www.mysql.com/
   - Verify: `mysql --version`

3. **Git** (optional)
   - For version control

## Installation Steps

### 1. Database Setup

```bash
# Start MySQL service
# Linux/Mac: brew services start mysql (if installed via Homebrew)
# Windows: Start MySQL from Services or MySQL Installer

# Connect to MySQL
mysql -u root -p

# In MySQL shell, run:
CREATE DATABASE sales_expense_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Create Database Tables

```bash
# From the project root directory
mysql -u root -p sales_expense_db < backend/src/config/schema.sql

# OR manually execute the SQL commands from backend/src/config/schema.sql
```

### 3. Backend Installation

```bash
# Navigate to backend directory
cd backend

# Create .env file (already created, but edit if needed)
# Edit backend/.env with your MySQL credentials
nano .env
# or
code .env

# Key environment variables to verify/update:
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_mysql_password
# DB_NAME=sales_expense_db
# DB_PORT=3306

# Install dependencies
npm install

# Verify installation
npm list

# Start backend server
npm run dev

# You should see:
# ✓ Database connection successful
# 🚀 Server started on port 5000
```

**Backend is now running at:** `http://localhost:5000`

### 4. Frontend Installation

**In a NEW terminal window:**

```bash
# Navigate to frontend directory
cd frontend

# Create .env file (already created, but verify)
# Edit frontend/.env if needed
nano .env
# or
code .env

# Key environment variables:
# REACT_APP_API_URL=http://localhost:5000/api

# Install dependencies
npm install

# Verify installation
npm list

# Start frontend development server
npm start

# Browser should automatically open to http://localhost:3000
```

**Frontend is now running at:** `http://localhost:3000`

## Verification

### Test Backend API

```bash
# Test health check
curl http://localhost:5000/health

# Expected response:
# {"status":"OK","timestamp":"2026-06-14T..."}
```

### Test Frontend

1. Open browser: `http://localhost:3000`
2. You should see the Login page
3. Click on "Register here" to create an account

## First Time Setup

### 1. Create Test Account

1. Go to `http://localhost:3000`
2. Click "Register here"
3. Fill in:
   - Name: `Test User`
   - Email: `test@example.com`
   - Password: `password123`
   - Confirm Password: `password123`
4. Click "Create Account"

### 2. Login

1. Enter your email and password
2. Click "Sign in"
3. You should see the Dashboard

### 3. Add Test Customer

1. Click on "Customers" (when implemented)
2. Click "Add Customer"
3. Fill in sample data
4. Click "Save"

## Common Issues & Solutions

### Issue: MySQL Connection Failed

**Error:** `Error: connect ECONNREFUSED 127.0.0.1:3306`

**Solution:**
```bash
# Check if MySQL is running
# Mac: brew services list
# Linux: sudo systemctl status mysql
# Windows: Check Services > MySQL

# Start MySQL if not running
# Mac: brew services start mysql
# Linux: sudo systemctl start mysql
# Windows: net start MySQL80 (or your MySQL version)
```

### Issue: Port Already in Use

**Error:** `EADDRINUSE: address already in use :::5000`

**Solution:**
```bash
# Kill process using port 5000
# Mac/Linux:
lsof -ti:5000 | xargs kill -9

# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or change PORT in backend/.env to 5001
PORT=5001
```

### Issue: Database Not Found

**Error:** `Error: Unknown database 'sales_expense_db'`

**Solution:**
```bash
# Create the database
mysql -u root -p < backend/src/config/schema.sql

# Or manually:
mysql -u root -p
CREATE DATABASE sales_expense_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Issue: npm Dependencies Issue

**Error:** `Module not found` or `Cannot find module`

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Or for yarn:
yarn install
```

### Issue: CORS Error

**Error:** `Access to XMLHttpRequest blocked by CORS policy`

**Solution:**
1. Verify `FRONTEND_URL` in backend/.env
2. Verify `REACT_APP_API_URL` in frontend/.env
3. Restart backend server
4. Clear browser cache and hard refresh (Ctrl+Shift+R)

### Issue: Blank Dashboard

**Error:** Dashboard shows loading but no data

**Solution:**
1. Check browser console (F12 > Console tab)
2. Verify API is running: `curl http://localhost:5000/health`
3. Check network tab (F12 > Network tab)
4. Verify authentication token is saved: `localStorage.getItem('accessToken')`

## Production Deployment

### Backend Deployment

1. **Create .env.production**
```
DB_HOST=your_production_db_host
DB_USER=your_db_user
DB_PASSWORD=your_secure_password
DB_NAME=sales_expense_db_prod
NODE_ENV=production
JWT_SECRET=generate_a_secure_random_key
JWT_REFRESH_SECRET=generate_another_secure_key
FRONTEND_URL=https://your-domain.com
API_URL=https://api.your-domain.com
```

2. **Build and Deploy**
```bash
cd backend
npm install
npm run build
npm start
```

3. **Deploy to Cloud** (AWS, GCP, Azure, Heroku)
   - Use Docker if needed
   - Set environment variables on hosting platform
   - Setup HTTPS/SSL certificate

### Frontend Deployment

1. **Build the app**
```bash
cd frontend
npm run build
```

2. **Deploy to** (choose one):
   - **Vercel**: `vercel --prod`
   - **Netlify**: Drag and drop `build` folder
   - **AWS S3**: Upload `build` folder
   - **GitHub Pages**: Configure in package.json and run `npm run deploy`

## Monitoring & Maintenance

### Check Logs

**Backend:**
```bash
# Tail logs
tail -f backend/logs/app.log

# Or view in console when running npm run dev
```

**Frontend:**
```bash
# Check browser console (F12)
# Check network requests (F12 > Network tab)
```

### Database Backup

```bash
# Backup database
mysqldump -u root -p sales_expense_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database
mysql -u root -p sales_expense_db < backup_20260614_120000.sql
```

### Update Dependencies

```bash
# Backend
cd backend
npm update
npm audit fix

# Frontend
cd frontend
npm update
npm audit fix
```

## Performance Tuning

### Backend Optimization
1. Enable query caching in MySQL
2. Add proper indexes (already done in schema)
3. Use connection pooling (already configured)
4. Compress responses with gzip

### Frontend Optimization
1. Code splitting (React.lazy)
2. Image optimization
3. Minification (automatic in production build)
4. Service Worker for offline support

## Next Steps

1. ✅ Installation complete
2. 📖 Read [README.md](README.md) for feature documentation
3. 🏗️ Review [DESIGN.md](DESIGN.md) for architecture
4. 🚀 Start building your business features
5. 📱 Test on mobile devices
6. 🧪 Run tests before deployment

## Support

For issues:
1. Check the Troubleshooting section above
2. Review browser console (F12)
3. Check backend logs
4. Verify environment variables
5. Contact: manishjain@nuclaysolutions.com

---

**Installation complete! Your application is ready to use.** 🎉
