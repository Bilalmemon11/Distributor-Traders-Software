import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useState,
} from "react";
import api from "../services/api";
import { API_BASE_URL } from "../config";

const AppContext = createContext(null);

const mapProduct = (p) => ({
  id: p.id,
  sku: p.sku,
  name: p.name,

  category_id: p.category_id,
  category: p.category?.name || "",

  unit_id: p.unit_id,
  unit: p.unit?.name || "",

  brand: p.brand || "",

  status: p.status,

  description: p.description || "",

  variants: (p.variants || []).map((v) => ({
    id: v.id,
    variant_name: v.variant_name,
    sku: v.sku,

    price: Number(v.price),
    cost_price: Number(v.cost_price),

    stock_qty: Number(v.stock_qty),
    reorder_level: Number(v.reorder_level),
  })),
});

const mapCustomer = (c) => ({
  id: c.id,
  name: c.name,
  phone: c.phone || "",
  type: c.type,
  balance: Number(c.balance),
  totalBuy: Number(c.total_purchase),
});

const mapVendor = (v) => ({
  id: v.id,
  name: v.name,
  phone: v.phone || "",
  city: v.city || "",
  balance: Number(v.balance),
  totalPurchase: Number(v.total_purchase),
});

const mapInvoice = (inv) => ({
  id: inv.id,
  invoiceNo: inv.invoice_no,
  customerId: inv.customer_id,
  customerName: inv.customer_name || inv.customer?.name || "",
  date: String(inv.date).split("T")[0],
  subtotal: Number(inv.subtotal),
  discount: Number(inv.discount),
  total: Number(inv.total),
  paid: Number(inv.paid),
  balance: Number(inv.balance),
  type: inv.payment_type,
  items: (inv.items || []).map((i) => ({
    productId: i.product_id,
    variantId: i.product_variant_id,
    variantName: i.product_variant?.variant_name || i.variant_name || "",

    productName: i.product?.name || i.product_name || "",

    qty: Number(i.qty),

    returnedQty: Number(i.returned_qty || 0),

    remainingQty: Number(i.remaining_qty || i.qty),

    price: Number(i.unit_price),

    total: Number(i.total),
  })),
});

const mapPurchase = (p) => ({
  id: p.id,
  poNo: p.po_no,
  vendorId: p.vendor_id,
  vendorName: p.vendor_name || p.vendor?.name || "",
  date: String(p.date).split("T")[0],

  items: (p.items || []).map((i) => ({
    id: i.id,
    productId: i.product_id,
    variantId: i.variant_id,
    productName: (i.product?.name || "") + (i.variant?.variant_name ? ` (${i.variant.variant_name})` : ""),
    qty: Number(i.qty),
    returnedQty: Number(i.returned_qty || 0),
    remainingQty: Number(i.remaining_qty || i.qty),
    unitCost: Number(i.unit_cost),
    total: Number(i.total),
  })),

  total: Number(p.total),
  paid: Number(p.paid),
  balance: Number(p.balance),
});

const mapExpense = (e) => ({
  id: e.id,
  date: String(e.date).split("T")[0],
  category: e.category,
  description: e.description || "",
  amount: Number(e.amount),
});
const mapInventoryTransaction = (t) => ({
  id: t.id,
  productId: t.product_id,
  productName: (t.product?.name || "") + (t.variant?.variant_name ? ` (${t.variant.variant_name})` : ""),
  sku: t.variant?.sku || t.product?.sku || "",
  type: t.type,
  qty: Number(t.qty),
  stockBefore: Number(t.stock_before),
  stockAfter: Number(t.stock_after),
  notes: t.notes || "",
  createdAt: t.created_at,
});

const mapPurchaseReturn = (r) => ({
  id: r.id,
  returnNo: r.return_no,
  purchaseId: r.purchase_id,
  vendorName: r.vendor?.name,
  date: r.date,
  total: Number(r.total),
  reason: r.reason || "",
  items: (r.items || []).map((i) => ({
    productId: i.product_id,
    productName: i.product?.name,
    qty: Number(i.qty),
    unitCost: Number(i.unit_cost),
    total: Number(i.total),
  })),
});

const mapSaleReturn = (r) => ({
  id: r.id,
  returnNo: r.return_no,

  invoiceId: r.invoice_id,
  invoiceNo: r.invoice?.invoice_no || r.invoice_no || "",

  customerName: r.customer?.name || "",

  date: r.date,
  total: Number(r.total),
  reason: r.reason || "",

  items: (r.items || []).map((i) => ({
    id: i.id,
    productId: i.product_id,
    productName: i.product?.name,
    qty: Number(i.qty),
    price: Number(i.unit_price),
    total: Number(i.total),
  })),
});

const initialState = {
  products: [],
  customers: [],
  vendors: [],
  invoices: [],
  purchases: [],
  expenses: [],
  inventoryTransactions: [],
  purchaseReturns: [],
  saleReturns: [],

  loading: true,
  error: null,
};

function appReducer(state, action) {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_ALL":
      return { ...state, ...action.payload, loading: false, error: null };
    case "SET_PRODUCTS":
      return { ...state, products: action.payload };
    case "SET_CUSTOMERS":
      return { ...state, customers: action.payload };
    case "SET_VENDORS":
      return { ...state, vendors: action.payload };
    case "SET_INVOICES":
      return { ...state, invoices: action.payload };
    case "SET_PURCHASES":
      return { ...state, purchases: action.payload };
    case "SET_EXPENSES":
      return { ...state, expenses: action.payload };
    case "SET_INVENTORY_TRANSACTIONS":
      return {
        ...state,
        inventoryTransactions: action.payload,
      };
    case "SET_SALE_RETURNS":
      return {
        ...state,
        saleReturns: action.payload,
      };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [reportDashboard, setReportDashboard] = useState(null);
  const [company, setCompany] = useState(null);
  const [backups, setBackups] = useState([]);
  const [profitLoss, setProfitLoss] = useState(null);

  const [monthlySales, setMonthlySales] = useState([]);
  const showError = (msg) => {
    dispatch({ type: "SET_ERROR", payload: msg });
    alert(msg);
  };

  const refreshAll = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const [
        productsRes,
        customersRes,
        vendorsRes,
        invoicesRes,
        purchasesRes,
        expensesRes,
        inventoryRes,
        purchaseReturnRes,
        saleReturnRes,
      ] = await Promise.all([
        api.get("/products"),
        api.get("/customers"),
        api.get("/vendors"),
        api.get("/invoices"),
        api.get("/purchases"),
        api.get("/expenses"),
        api.get("/inventory-transactions"),
        api.get("/purchase-returns"),
        api.get("/sale-returns"),
      ]);

      dispatch({
        type: "SET_ALL",
        payload: {
          products: productsRes.data.data.map(mapProduct),
          customers: customersRes.data.data.map(mapCustomer),
          vendors: vendorsRes.data.data.map(mapVendor),
          invoices: invoicesRes.data.data.map(mapInvoice),
          purchases: purchasesRes.data.data.map(mapPurchase),
          expenses: expensesRes.data.data.map(mapExpense),
          purchaseReturns: purchaseReturnRes.data.data.map(mapPurchaseReturn),
          saleReturns: saleReturnRes.data.data.map(mapSaleReturn),
          inventoryTransactions: inventoryRes.data.data.map(
            mapInventoryTransaction,
          ),
        },
      });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to connect to server";
      dispatch({ type: "SET_ERROR", payload: msg });
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  const loadCategories = async () => {
    const res = await api.get("/categories");
    setCategories(res.data.data);
  };

  const loadUnits = async () => {
    const res = await api.get("/units");
    setUnits(res.data.data);
  };

  const loadExpenseCategories = async () => {
    const res = await api.get("/expense-categories");
    setExpenseCategories(res.data.data);
  };

  const addCategory = async (name) => {
    try {
      await api.post("/categories", { name });
      await loadCategories();
    } catch (err) {
      showError(err.response?.data?.message || "Failed to add category");
    }
  };

  const addUnit = async (name) => {
    try {
      await api.post("/units", { name });
      await loadUnits();
    } catch (err) {
      showError(err.response?.data?.message || "Failed to add unit");
    }
  };

  const addExpenseCategory = async (name) => {
    await api.post("/expense-categories", {
      name,
    });

    await loadExpenseCategories();
  };

  useEffect(() => {
    localStorage.removeItem("qadri_distributors_state");

    refreshAll();

    loadCategories();

    loadUnits();

    loadExpenseCategories();

    loadBackups();
  }, [refreshAll]);

  // fetchCompany()
  async function fetchCompany() {
    try {
      const res = await api.get("/company");

      setCompany(res.data.data);

      return res.data.data;
    } catch (err) {
      console.error(err);
    }
  }
  // saveCompany()

  async function saveCompany(formData) {
    const res = await api.post("/company", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    setCompany(res.data.data);

    return res.data.data;
  }

  // ============================
  // BACKUPS
  // ============================

  async function loadBackups() {
    const res = await api.get("/backups");

    setBackups(res.data.data);

    return res.data.data;
  }

  async function createBackup() {
    const res = await api.post("/backups");

    await loadBackups();

    return res.data;
  }

  async function downloadBackup(id) {
    window.open(
      `${API_BASE_URL}/backups/${id}/download`,
      "_blank",
    );
  }

  async function deleteBackup(id) {
    await api.delete(`/backups/${id}`);

    await loadBackups();
  }

  async function restoreBackup(formData) {
    await api.post("/backups/restore", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    await refreshAll();

    await loadBackups();
  }

  const addInvoice = async (invoiceData) => {
    try {
      const payload = {
        customer_id: invoiceData.customerId,
        date: invoiceData.date,
        subtotal: invoiceData.subtotal,
        discount: invoiceData.discount || 0,
        total: invoiceData.total,
        paid: invoiceData.paid || 0,
        balance: invoiceData.balance || 0,
        payment_type: invoiceData.type === "credit" ? "credit" : "cash",
        items: invoiceData.items.map((i) => ({
          product_id: i.productId,
          product_variant_id: i.variantId, // <-- Ye add karo

          qty: i.qty,
          unit_price: i.price,
          total: i.total,
        })),
      };
      const res = await api.post("/invoices", payload);
      await refreshAll();
      return mapInvoice(res.data.data);
    } catch (err) {
      showError(err.response?.data?.message || "Failed to create invoice");
      throw err;
    }
  };

  const fetchInvoice = async (id) => {
    const res = await api.get(`/invoices/${id}`);
    return mapInvoice(res.data.data);
  };
  const updateInvoice = async (id, invoiceData) => {
    try {
      const payload = {
        customer_id: invoiceData.customerId,
        date: invoiceData.date,
        subtotal: invoiceData.subtotal,
        discount: invoiceData.discount,
        total: invoiceData.total,
        paid: invoiceData.paid,
        balance: invoiceData.balance,
        payment_type: invoiceData.type,

        items: invoiceData.items.map((i) => ({
          product_id: i.productId,
          product_variant_id: i.variantId, // <-- Ye line add karo
          qty: i.qty,
          unit_price: i.price,
          total: i.total,
        })),
      };

      const res = await api.put(`/invoices/${id}`, payload);

      await refreshAll();

      return mapInvoice(res.data.data);
    } catch (err) {
      showError(err.response?.data?.message || "Failed to update invoice");
      throw err;
    }
  };
  const deleteInvoice = async (id) => {
    try {
      await api.delete(`/invoices/${id}`);

      await refreshAll();
    } catch (err) {
      showError(err.response?.data?.message || "Failed to delete invoice");
      throw err;
    }
  };
  const printInvoice = (id, size = 'a4') => {
    window.open(`${API_BASE_URL}/invoices/${id}/print?size=${size}`, "_blank");
  };

  const addSaleReturn = async (data) => {
    try {
      await api.post("/sale-returns", data);

      await refreshAll();
    } catch (err) {
      showError(err.response?.data?.message || "Failed to create sale return");

      throw err;
    }
  };

  const fetchSaleReturn = async (id) => {
    const res = await api.get(`/sale-returns/${id}`);

    return mapSaleReturn(res.data.data);
  };

  const deleteSaleReturn = async (id) => {
    try {
      await api.delete(`/sale-returns/${id}`);

      await refreshAll();
    } catch (err) {
      showError(err.response?.data?.message || "Failed to delete sale return");

      throw err;
    }
  };
  const printSaleReturn = (id) => {
    window.open(
      `${API_BASE_URL}/sale-returns/${id}/print`,
      "_blank",
    );
  };

  const addCustomer = async (data) => {
    try {
      await api.post("/customers", data);
      const res = await api.get("/customers");
      dispatch({
        type: "SET_CUSTOMERS",
        payload: res.data.data.map(mapCustomer),
      });
    } catch (err) {
      showError(err.response?.data?.message || "Failed to add customer");
    }
  };
  const updateCustomer = async (id, data) => {
    try {
      await api.put(`/customers/${id}`, data);

      const res = await api.get("/customers");

      dispatch({
        type: "SET_CUSTOMERS",
        payload: res.data.data.map(mapCustomer),
      });
    } catch (err) {
      showError(err.response?.data?.message || "Failed to update customer");
      throw err;
    }
  };

  const deleteCustomer = async (id) => {
    try {
      await api.delete(`/customers/${id}`);

      dispatch({
        type: "SET_CUSTOMERS",
        payload: state.customers.filter((c) => c.id !== id),
      });
    } catch (err) {
      showError(err.response?.data?.message || "Failed to delete customer");
      throw err;
    }
  };
  const addVendor = async (data) => {
    try {
      await api.post("/vendors", data);
      const res = await api.get("/vendors");
      dispatch({ type: "SET_VENDORS", payload: res.data.data.map(mapVendor) });
    } catch (err) {
      showError(err.response?.data?.message || "Failed to add vendor");
    }
  };
  const getVendorPayments = async (vendorId) => {
    const res = await api.get(`/vendors/${vendorId}/payments`);
    return res.data.data;
  };
  const updateVendor = async (data) => {
    try {
      await api.put(`/vendors/${data.id}`, {
        name: data.name,
        phone: data.phone,
        city: data.city,
      });

      const res = await api.get("/vendors");

      dispatch({
        type: "SET_VENDORS",
        payload: res.data.data.map(mapVendor),
      });
    } catch (err) {
      showError(err.response?.data?.message || "Failed to update vendor");
    }
  };

  const deleteVendor = async (id) => {
    try {
      await api.delete(`/vendors/${id}`);

      dispatch({
        type: "SET_VENDORS",
        payload: state.vendors.filter((v) => v.id !== id),
      });
    } catch (err) {
      alert(err.response?.data?.message || "Cannot delete vendor");
      throw err;
    }
  };

  const addProduct = async (data) => {
    console.log("PRODUCT DATA:", data);

    try {
      await api.post("/products", {
        name: data.name,

        category_id: data.category_id,

        brand: data.brand,

        unit_id: data.unit_id,

        status: data.status,

        description: data.description,

        variants: data.variants,
      });

      const res = await api.get("/products");

      dispatch({
        type: "SET_PRODUCTS",
        payload: res.data.data.map(mapProduct),
      });
    } catch (err) {
      showError(err.response?.data?.message || "Failed to add product");
    }
  };

  const updateProduct = async (data) => {
    try {
      await api.put(`/products/${data.id}`, {
        name: data.name,

        category_id: data.category_id,

        brand: data.brand,

        unit_id: data.unit_id,

        status: data.status,

        description: data.description,

        variants: data.variants,
      });

      const res = await api.get("/products");

      dispatch({
        type: "SET_PRODUCTS",
        payload: res.data.data.map(mapProduct),
      });
    } catch (err) {
      showError(err.response?.data?.message || "Failed to update product");
    }
  };
  const updateStock = async (productId, variantId, qty) => {
    try {
      await api.post("/inventory-transactions/adjust", {
        product_id: productId,
        variant_id: variantId,
        qty,
      });

      await refreshAll();
    } catch (err) {
      showError(err.response?.data?.message || "Failed to update stock");
    }
  };
  const deleteProduct = async (id) => {
    try {
      await api.delete(`/products/${id}`);

      dispatch({
        type: "SET_PRODUCTS",
        payload: state.products.filter((p) => p.id !== id),
      });
    } catch (err) {
      showError(err.response?.data?.message || "Failed to delete product");
    }
  };

  const addPurchase = async (purchaseData) => {
    try {
      const payload = {
        vendor_id: purchaseData.vendorId,
        date: purchaseData.date,
        paid: purchaseData.paid || 0,
        items: purchaseData.items.map((item) => ({
          product_id: item.productId,
          variant_id: item.variantId,
          qty: item.qty,
          unit_cost: item.unitCost,
        })),
      };

      console.log(payload);

      await api.post("/purchases", payload);

      await refreshAll();
    } catch (err) {
      console.log(err.response?.data);

      showError(err.response?.data?.message || "Failed to create purchase");

      throw err;
    }
  };
  const fetchPurchase = async (id) => {
    const res = await api.get(`/purchases/${id}`);
    return mapPurchase(res.data.data);
  };

  const updatePurchase = async (id, purchaseData) => {
    try {
      const payload = {
        vendor_id: purchaseData.vendorId,
        date: purchaseData.date,
        paid: purchaseData.paid,

        items: purchaseData.items.map((item) => ({
          product_id: item.productId,
          variant_id: item.variantId,
          qty: item.qty,
          unit_cost: item.unitCost,
        })),
      };

      const res = await api.put(`/purchases/${id}`, payload);

      await refreshAll();

      return mapPurchase(res.data.data);
    } catch (err) {
      showError(err.response?.data?.message || "Failed to update purchase");

      throw err;
    }
  };

  const deletePurchase = async (id) => {
    try {
      await api.delete(`/purchases/${id}`);

      await refreshAll();
    } catch (err) {
      showError(err.response?.data?.message || "Failed to delete purchase");

      throw err;
    }
  };

  const getPurchaseReturn = async (id) => {
    const res = await api.get(`/purchase-returns/${id}`);
    return res.data.data;
  };

  const addPurchaseReturn = async (data) => {
    try {
      await api.post("/purchase-returns", data);

      await refreshAll();
    } catch (err) {
      showError(
        err.response?.data?.message || "Failed to create purchase return",
      );
      throw err;
    }
  };

  const fetchPurchaseReturn = async (id) => {
    const res = await api.get(`/purchase-returns/${id}`);

    return mapPurchaseReturn(res.data.data);
  };

  const deletePurchaseReturn = async (id) => {
    try {
      await api.delete(`/purchase-returns/${id}`);

      await refreshAll();
    } catch (err) {
      showError(
        err.response?.data?.message || "Failed to delete purchase return",
      );

      throw err;
    }
  };

  const printPurchaseReturn = (id) => {
    window.open(
      `${API_BASE_URL}/purchase-returns/${id}/print`,
      "_blank",
    );
  };

  const addExpense = async (data) => {
    try {
      await api.post("/expenses", data);
      const res = await api.get("/expenses");
      dispatch({
        type: "SET_EXPENSES",
        payload: res.data.data.map(mapExpense),
      });
    } catch (err) {
      showError(err.response?.data?.message || "Failed to add expense");
    }
  };

  const deleteExpense = async (id) => {
    try {
      await api.delete(`/expenses/${id}`);
      dispatch({
        type: "SET_EXPENSES",
        payload: state.expenses.filter((e) => e.id !== id),
      });
    } catch (err) {
      showError(err.response?.data?.message || "Failed to delete expense");
    }
  };

  const receivePayment = async (paymentData) => {
    try {
      const response = await api.post(
        `/customers/${paymentData.customerId}/receive-payment`,
        paymentData,
      );

      const res = await api.get("/customers");

      dispatch({
        type: "SET_CUSTOMERS",
        payload: res.data.data.map(mapCustomer),
      });

      // Backend ka response return karo
      return response.data;
    } catch (err) {
      showError(err.response?.data?.message || "Failed to receive payment");
      throw err;
    }
  };

  const getCustomerPayments = async (customerId) => {
    const res = await api.get(`/customers/${customerId}/payments`);
    return res.data.data;
  };

  const payVendor = async (vendorId, amount, date) => {
    try {
      await api.post(`/vendors/${vendorId}/pay`, { amount, date });
      const res = await api.get("/vendors");
      dispatch({ type: "SET_VENDORS", payload: res.data.data.map(mapVendor) });
    } catch (err) {
      showError(err.response?.data?.message || "Failed to pay vendor");
    }
  };

  const printStockHistory = (params = {}) => {
    const query = new URLSearchParams(params).toString();

    window.open(`${API_URL}/inventory-transactions/print?${query}`, "_blank");
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        refreshAll,

        categories,
        units,

        loadCategories,
        loadUnits,

        addCategory,
        addUnit,

        expenseCategories,

        loadExpenseCategories,

        addExpenseCategory,

        addInvoice,
        deleteInvoice,
        printInvoice,
        fetchInvoice,
        updateInvoice,

        addSaleReturn,
        fetchSaleReturn,
        deleteSaleReturn,
        printSaleReturn,

        company,
        fetchCompany,
        saveCompany,

        backups,

        loadBackups,
        createBackup,
        downloadBackup,
        deleteBackup,
        restoreBackup,

        addCustomer,
        updateCustomer,
        deleteCustomer,

        addVendor,
        getVendorPayments,
        updateVendor,
        deleteVendor,

        addProduct,
        updateProduct,
        updateStock,
        deleteProduct,

        addPurchase,
        fetchPurchase,
        updatePurchase,
        deletePurchase,
        addPurchaseReturn,
        getPurchaseReturn,
        fetchPurchaseReturn,
        deletePurchaseReturn,
        printPurchaseReturn,

        printStockHistory,
        addExpense,
        deleteExpense,
        receivePayment,
        getCustomerPayments,
        payVendor,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
