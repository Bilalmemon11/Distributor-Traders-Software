# Qadri Distributor & Traders ERP Management System

A high-performance, full-stack ERP and POS business management system built specifically for Distributors, Wholesale Traders, and Retail Counters.

Developed with modern web architecture: **Laravel 12 (REST API + Sanctum)** and **React 18 (Vite + Tailwind CSS)**.

---

## 🚀 Key Features & Modules

### 1. 🔐 Authentication & Role-Based Access Control (RBAC)
- **Role Permissions:** Distinct privilege tiers for `👑 Admin` and `💼 Cashier`.
- **Cashier Restrictions:** Cashiers are restricted from sensitive financial data, vendor ledgers, purchase records, profit & loss, settings, and full system reports.
- **Secure Token Auth:** Powered by Laravel Sanctum Bearer tokens with auto-expiration and protection.
- **Security & User Management:** Logged-in admin can change their password, update email/name, and reset passwords for counter cashiers from the Settings panel.

### 2. 🧾 POS Billing & Smart Invoicing
- **Multi-Mode Printing:** Supports both 80mm/58mm Thermal Receipt printing and full A4/A5 Laser Invoice printing.
- **Split Payment Methods:** Accept payments across multiple channels in a single sale (e.g. Split between Cash, Bank Transfer, and Balance/Credit).
- **Hold & Resume Invoices:** Park incomplete orders and resume them seamlessly during busy rush hours.
- **Credit Limit & Overdue Warning:** Real-time customer balance alerts preventing sales that exceed approved credit limits.
- **Customized Branding:** Professional footer branding and invoice templates.

### 3. 📦 Inventory, Batch & Expiry Management
- **Multi-Variant Products:** Track stock by carton, box, pack, piece, weight, and size.
- **Batch Numbers & Expiry Tracking:** Batch-wise inventory tracking with color-coded expiry alerts (Near Expiry, Expired, Safe).
- **Stock Movement History:** Complete audit trail of every stock addition, deduction, purchase return, and sale return.
- **Fast-Moving vs Dead-Stock Analysis:** Identify best-selling items and slow-moving stagnant inventory to optimize capital.

### 4. 🚚 Area, Salesmen & Supply Delivery Management
- **Area / Route Mapping:** Organize customers by geographic distribution routes and recovery areas.
- **Field Salesmen Tracking:** Assign salesmen to customer accounts, track sales volume, and analyze booking performance.
- **Delivery / Supply Men Dispatch:** Assign pending invoices to delivery drivers, print load sheets/delivery challans, and record delivery statuses (Dispatched, Delivered, Returned).
- **Area Recovery Reports:** View route-wise outstanding balances to streamline recovery teams.

### 5. 👥 Customer & Vendor Ledgers
- Complete double-entry style running ledgers with debits, credits, and balances.
- Downloadable and printable PDF statements for customers and suppliers.
- Quick receipt creation with discount handling.

### 6. 📊 Profit & Loss, Analytics & Reporting
- **Accurate P&L Calculations:** Real-time Gross Profit, Operating Expenses, Net Profit, and Profit Margins.
- **Date-Range Filtering:** Filter by Today, Yesterday, This Week, This Month, or Custom Date ranges.
- **Comprehensive Reports:**
  - Area Sales & Route Recovery Reports
  - Salesmen & Delivery Drivers Performance
  - Inventory Valuation & Expiry Alerts
  - Customer & Vendor Balance Summaries
  - Fast-Moving & Slow-Moving Stock Reports

### 7. ⚙️ System Settings & Data Safety
- Business profile, logo, currency, tax, and thermal printer customization.
- **One-Click Backup & Restore:** Generate complete database and media backup zip archives with restore capability.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Backend** | Laravel 12, PHP 8.2+, SQLite / MySQL, Laravel Sanctum, Barryvdh DomPDF |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons, Headless UI, Axios |
| **Styling & UI** | Tailwind CSS with responsive modern navy & slate enterprise themes |
| **Print Engine** | Browser Print + Clean Thermal CSS + Server-side DomPDF |

---

## 💻 Local Setup & Installation

### Prerequisites
- PHP 8.2 or higher
- Composer
- Node.js 18+ and npm
- SQLite3 or MySQL

### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install PHP dependencies
composer install

# Database migration & seeders (includes default admin & cashier accounts)
php artisan migrate:fresh
php artisan optimize:clear
php artisan cache:clear
php artisan db:seed --class=UserSeeder

# Environment configuration
cp .env.example .env
php artisan key:generate


# Start backend server
php artisan serve --port=8005
```

### 2. Frontend Setup
```bash
# Navigate to frontend directory
cd ../frontend

# Install JavaScript dependencies
npm install

# Start Vite development server
npm run dev
```

---

## 🔑 Default Login Credentials

| Role | Email / Username | Default Password |
|---|---|---|
| **Admin** | `admin@qadri.com` | `admin123` |
| **Cashier** | `cashier@qadri.com` | `cashier123` |

> *Note: For security in production, change default passwords immediately via the Settings → Security & Passwords tab.*

---

## 📞 Support & Credits

Software Created & Maintained by **StackNova-Tech**  
Contact: `+923-373375526`
