# Distributor & Traders Management Software

Full-stack business management system for Distributors and Traders.

## Tech Stack
- **Backend:** Laravel 12 + SQLite / MySQL
- **Frontend:** React 18 + Vite + Tailwind CSS

## Local Setup

### Requirements
- PHP 8.2+
- Composer
- Node.js 18+

### Backend Setup
```bash
cd backend
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Features
- Invoices & POS Billing with Thermal Printing
- Product & Multi-Variant Inventory Management
- Stock Purchases & Supplier Management
- Customer & Vendor Ledgers
- Sales Returns & Purchase Returns
- Expense Tracking
- Profit & Loss Reports with Analytics
- Database Backup & Restore
