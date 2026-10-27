// Seed data for Hashmi Fabrics Business Management System

export const seedProducts = [
  { id: 'p1', name: 'Lawn Fabric', category: 'Fabric', price: 850, cost: 550, stock: 120, unit: 'Meter', reorderLevel: 20 },
  { id: 'p2', name: 'Khaddar Suit Piece', category: 'Suit Piece', price: 2200, cost: 1400, stock: 45, unit: 'Piece', reorderLevel: 10 },
  { id: 'p3', name: 'Chiffon Dupatta', category: 'Dupatta', price: 1100, cost: 650, stock: 8, unit: 'Piece', reorderLevel: 15 },
  { id: 'p4', name: 'Cotton Shirting', category: 'Fabric', price: 550, cost: 320, stock: 200, unit: 'Meter', reorderLevel: 30 },
  { id: 'p5', name: 'Silk Fabric', category: 'Fabric', price: 3200, cost: 2100, stock: 35, unit: 'Meter', reorderLevel: 10 },
  { id: 'p6', name: 'Embroidered Panel', category: 'Panel', price: 1800, cost: 1100, stock: 5, unit: 'Piece', reorderLevel: 8 },
];

export const seedCustomers = [
  { id: 'c1', name: 'Fatima Boutique', phone: '0300-1234567', type: 'wholesale', balance: 15500, totalBuy: 125000 },
  { id: 'c2', name: 'Rashida Khatoon', phone: '0301-9876543', type: 'retail', balance: 3200, totalBuy: 28005 },
  { id: 'c3', name: 'Nadia Fashion Hub', phone: '0311-5557777', type: 'wholesale', balance: 42000, totalBuy: 320000 },
  { id: 'c4', name: 'Sana Textiles', phone: '0333-2223344', type: 'wholesale', balance: 0, totalBuy: 89000 },
  { id: 'c5', name: 'Rukhsana Bibi', phone: '0345-6789012', type: 'retail', balance: 1800, totalBuy: 15500 },
];

export const seedVendors = [
  { id: 'v1', name: 'Al-Hamd Fabrics', city: 'Faisalabad', phone: '041-1234567', balance: 45000, totalPurchase: 380050 },
  { id: 'v2', name: 'Soorty Enterprises', city: 'Karachi', phone: '021-9876543', balance: 12000, totalPurchase: 215000 },
  { id: 'v3', name: 'Mahmood Textile Mills', city: 'Lahore', phone: '042-5556666', balance: 0, totalPurchase: 150000 },
  { id: 'v4', name: 'Kohinoor Fabrics', city: 'Multan', phone: '061-3334455', balance: 28500, totalPurchase: 195000 },
];

export const seedInvoices = [
  {
    id: 'inv1',
    invoiceNo: 'HF-001',
    date: '2026-06-01',
    customerId: 'c1',
    customerName: 'Fatima Boutique',
    items: [
      { productId: 'p1', productName: 'Lawn Fabric', qty: 20, price: 850, total: 17000 },
      { productId: 'p4', productName: 'Cotton Shirting', qty: 10, price: 550, total: 5500 },
    ],
    subtotal: 22500,
    discount: 500,
    total: 22000,
    paid: 10000,
    balance: 12000,
    type: 'credit',
  },
  {
    id: 'inv2',
    invoiceNo: 'HF-002',
    date: '2026-06-03',
    customerId: 'c2',
    customerName: 'Rashida Khatoon',
    items: [
      { productId: 'p3', productName: 'Chiffon Dupatta', qty: 2, price: 1100, total: 2200 },
      { productId: 'p6', productName: 'Embroidered Panel', qty: 1, price: 1800, total: 1800 },
    ],
    subtotal: 4000,
    discount: 0,
    total: 4000,
    paid: 4000,
    balance: 0,
    type: 'cash',
  },
  {
    id: 'inv3',
    invoiceNo: 'HF-003',
    date: '2026-06-05',
    customerId: 'c3',
    customerName: 'Nadia Fashion Hub',
    items: [
      { productId: 'p2', productName: 'Khaddar Suit Piece', qty: 15, price: 2200, total: 33000 },
      { productId: 'p5', productName: 'Silk Fabric', qty: 5, price: 3200, total: 16000 },
    ],
    subtotal: 49000,
    discount: 1000,
    total: 48005,
    paid: 28005,
    balance: 20000,
    type: 'credit',
  },
  {
    id: 'inv4',
    invoiceNo: 'HF-004',
    date: '2026-06-08',
    customerId: 'c5',
    customerName: 'Rukhsana Bibi',
    items: [
      { productId: 'p1', productName: 'Lawn Fabric', qty: 3, price: 850, total: 2550 },
    ],
    subtotal: 2550,
    discount: 0,
    total: 2550,
    paid: 1000,
    balance: 1550,
    type: 'credit',
  },
];

export const seedPurchases = [
  {
    id: 'pur1',
    poNo: 'PO-001',
    date: '2026-05-10',
    vendorId: 'v1',
    vendorName: 'Al-Hamd Fabrics',
    description: 'Lawn Fabric 500m, Cotton Shirting 300m',
    total: 125000,
    paid: 80050,
    balance: 45000,
  },
  {
    id: 'pur2',
    poNo: 'PO-002',
    date: '2026-05-15',
    vendorId: 'v2',
    vendorName: 'Soorty Enterprises',
    description: 'Silk Fabric 50m, Chiffon Dupatta 30pcs',
    total: 82000,
    paid: 70000,
    balance: 12000,
  },
  {
    id: 'pur3',
    poNo: 'PO-003',
    date: '2026-05-20',
    vendorId: 'v3',
    vendorName: 'Mahmood Textile Mills',
    description: 'Khaddar Suit Piece 100pcs',
    total: 95000,
    paid: 95000,
    balance: 0,
  },
  {
    id: 'pur4',
    poNo: 'PO-004',
    date: '2026-06-02',
    vendorId: 'v4',
    vendorName: 'Kohinoor Fabrics',
    description: 'Embroidered Panel 50pcs, Lawn Fabric 200m',
    total: 68500,
    paid: 40000,
    balance: 28500,
  },
];

export const seedExpenses = [
  { id: 'exp1', date: '2026-06-01', category: 'Rent', description: 'Monthly shop rent', amount: 25000 },
  { id: 'exp2', date: '2026-06-05', category: 'Salary', description: 'Staff salaries - June', amount: 35000 },
  { id: 'exp3', date: '2026-06-07', category: 'Electricity', description: 'LESCO bill June', amount: 8500 },
  { id: 'exp4', date: '2026-06-08', category: 'Transport', description: 'Fabric transport from Faisalabad', amount: 4500 },
  { id: 'exp5', date: '2026-06-09', category: 'Packing', description: 'Polythene bags and boxes', amount: 2200 },
];

export const seedVendorPayments = [];
