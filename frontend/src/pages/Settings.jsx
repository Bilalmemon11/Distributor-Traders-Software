import { useEffect, useState } from "react";
import Topbar from "../components/Topbar";
import { useApp } from "../context/AppContext";
import { BACKEND_URL } from "../config";
import api from "../services/api";

export default function Settings() {
  const { fetchCompany, saveCompany, user, isAdmin } = useApp();
  const [activeTab, setActiveTab] = useState("general");
  const [previewLogo, setPreviewLogo] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Security Form State
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profileEmail, setProfileEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [profileUpdating, setProfileUpdating] = useState(false);

  // Users Management State
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState(null);
  const [resetPasswordVal, setResetPasswordVal] = useState("");
  const [resettingUser, setResettingUser] = useState(false);

  const [form, setForm] = useState({
    company_name: "",
    owner_name: "",
    email: "",
    phone: "",
    whatsapp: "",
    ntn: "",
    strn: "",
    address: "",
    city: "",
    country: "",
    currency: "PKR",

    invoice_prefix: "INV",
    purchase_prefix: "PUR",
    return_prefix: "RET",

    tax_percent: 0,
    discount_percent: 0,

    footer_text: "",
    terms: "",

    default_invoice_size: "a4",
    show_previous_balance: true,
    show_signatures: true,
    show_customer_area: true,

    low_stock_threshold: 10,
    expiry_alert_days: 60,
    allow_negative_stock: false,

    logo: null,
  });

  useEffect(() => {
    loadCompany();
  }, []);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || "");
      setProfileEmail(user.email || "");
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === "security" && isAdmin) {
      loadUsersList();
    }
  }, [activeTab, isAdmin]);

  async function loadCompany() {
    try {
      const data = await fetchCompany();
      if (data) {
        setForm((prev) => ({
          ...prev,
          ...data,
          default_invoice_size: data.default_invoice_size || "a4",
          show_previous_balance: data.show_previous_balance !== undefined ? Boolean(data.show_previous_balance) : true,
          show_signatures: data.show_signatures !== undefined ? Boolean(data.show_signatures) : true,
          show_customer_area: data.show_customer_area !== undefined ? Boolean(data.show_customer_area) : true,
          low_stock_threshold: data.low_stock_threshold !== undefined ? Number(data.low_stock_threshold) : 10,
          expiry_alert_days: data.expiry_alert_days !== undefined ? Number(data.expiry_alert_days) : 60,
          allow_negative_stock: data.allow_negative_stock !== undefined ? Boolean(data.allow_negative_stock) : false,
          logo: null,
        }));
        if (data.logo) {
          setPreviewLogo(`${BACKEND_URL}/storage/${data.logo}`);
        }
      }
    } catch (err) {
      console.error("Failed to load company settings:", err);
      showToast("error", "Failed to load company settings.");
    }
  }

  async function loadUsersList() {
    setLoadingUsers(true);
    try {
      const res = await api.get("/users");
      if (res.data?.success) {
        setUsersList(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch users list", err);
    } finally {
      setLoadingUsers(false);
    }
  }

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const inputClass =
    "w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-4 py-2.5 text-[#1e293b] text-sm focus:outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] transition-all";
  const labelClass = "block text-xs font-semibold text-[#475569] mb-1.5 uppercase tracking-wide";

  async function handleSave() {
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === "logo") {
          if (value instanceof File) {
            fd.append("logo", value);
          }
        } else if (typeof value === "boolean") {
          fd.append(key, value ? "1" : "0");
        } else {
          fd.append(key, value ?? "");
        }
      });

      await saveCompany(fd);
      showToast("success", "Settings saved successfully! Invoices & alerts will now reflect updated rules.");
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to save settings. Please check your connection.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateProfile(e) {
    e.preventDefault();
    if (!profileName.trim() || !profileEmail.trim()) {
      showToast("error", "Name and Email cannot be empty.");
      return;
    }

    setProfileUpdating(true);
    try {
      const res = await api.post("/update-profile", {
        name: profileName.trim(),
        email: profileEmail.trim(),
      });
      if (res.data?.success) {
        showToast("success", "Account profile updated successfully!");
        const updatedUser = res.data.data;
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to update profile.");
    } finally {
      setProfileUpdating(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (!currentPassword) {
      showToast("error", "Please enter your current password.");
      return;
    }
    if (newPassword.length < 6) {
      showToast("error", "New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("error", "New password and Confirm password do not match.");
      return;
    }

    setPasswordUpdating(true);
    try {
      const res = await api.post("/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });

      if (res.data?.success) {
        showToast("success", "Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to update password.");
    } finally {
      setPasswordUpdating(false);
    }
  }

  async function handleAdminResetPassword(e) {
    e.preventDefault();
    if (!selectedUserForReset) return;
    if (resetPasswordVal.length < 6) {
      showToast("error", "Password must be at least 6 characters.");
      return;
    }

    setResettingUser(true);
    try {
      const res = await api.put(`/users/${selectedUserForReset.id}`, {
        password: resetPasswordVal,
      });
      if (res.data?.success) {
        showToast("success", `Password for ${selectedUserForReset.name} updated successfully!`);
        setSelectedUserForReset(null);
        setResetPasswordVal("");
        loadUsersList();
      }
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to reset user password.");
    } finally {
      setResettingUser(false);
    }
  }

  const tabs = [
    { id: "general", label: "General", icon: "🏢" },
    { id: "contact", label: "Contact", icon: "📞" },
    { id: "taxes", label: "Taxes & Legal", icon: "🏛️" },
    { id: "documents", label: "Documents & Print", icon: "📄" },
    { id: "inventory", label: "Inventory & Alerts", icon: "⚙️" },
    { id: "security", label: "Security & Passwords", icon: "🔐" },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc]">
      <Topbar title="System Settings" />

      {/* Floating Notification Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg border text-sm font-semibold ${
              toast.type === "success"
                ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                : "bg-red-50 border-red-300 text-red-800"
            }`}
          >
            <span className="text-lg">{toast.type === "success" ? "✅" : "⚠️"}</span>
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-3 text-xs opacity-60 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Admin Reset User Password Modal */}
      {selectedUserForReset && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-[#1e293b] flex items-center gap-2">
                <span>🔑</span> Reset Password for {selectedUserForReset.name}
              </h3>
              <button
                onClick={() => {
                  setSelectedUserForReset(null);
                  setResetPasswordVal("");
                }}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdminResetPassword} className="mt-4 space-y-4">
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900">
                User: <strong>{selectedUserForReset.name}</strong> ({selectedUserForReset.email})<br />
                Role: <span className="font-bold uppercase">{selectedUserForReset.role}</span>
              </div>

              <div>
                <label className={labelClass}>New Password (Min 6 Characters)</label>
                <input
                  type="text"
                  required
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  placeholder="Enter new password"
                  className={inputClass}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUserForReset(null);
                    setResetPasswordVal("");
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resettingUser}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#1e3a8a] hover:bg-[#1e40af] transition shadow-sm disabled:opacity-50"
                >
                  {resettingUser ? "Saving..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row gap-6">
          
          {/* Sidebar Tabs */}
          <div className="w-full md:w-64 shrink-0 space-y-4">
            <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden shadow-sm">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-5 py-4 text-sm font-medium transition-all border-l-4 text-left ${
                    activeTab === tab.id
                      ? "border-[#1e3a8a] bg-[#eff6ff] text-[#1e3a8a] font-bold"
                      : "border-transparent text-[#64748b] hover:bg-[#f8fafc] hover:text-[#1e293b]"
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {activeTab !== "security" && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-[#1e3a8a] hover:bg-[#1e40af] text-white px-6 py-3.5 rounded-xl font-bold shadow-md shadow-[#1e3a8a]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    <span>Save Company Settings</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Form Content */}
          <div className="flex-1">
            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 md:p-8 min-h-[520px] shadow-sm">
              
              {/* Tab 1: General */}
              {activeTab === "general" && (
                <div className="space-y-6">
                  <div className="border-b border-[#e2e8f0] pb-4 mb-6">
                    <h2 className="text-xl font-bold text-[#1e293b]">General Information</h2>
                    <p className="text-[#64748b] text-sm mt-1">
                      Company profile, legal title, and address that prints on all invoices and reports.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className={labelClass}>Company / Distribution Name</label>
                      <input
                        className={inputClass}
                        value={form.company_name}
                        onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                        placeholder="e.g. QADRI DISTRIBUTOR & TRADERS"
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Owner / Manager Name</label>
                      <input
                        className={inputClass}
                        value={form.owner_name}
                        onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                        placeholder="e.g. Bilal Memon"
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Currency Symbol</label>
                      <input
                        className={inputClass}
                        value={form.currency}
                        onChange={(e) => setForm({ ...form, currency: e.target.value })}
                        placeholder="PKR"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className={labelClass}>Business Address</label>
                      <input
                        className={inputClass}
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        placeholder="e.g. Shop # 12, Main Market, Qasimabad"
                      />
                    </div>

                    <div>
                      <label className={labelClass}>City</label>
                      <input
                        className={inputClass}
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        placeholder="Hyderabad"
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Country</label>
                      <input
                        className={inputClass}
                        value={form.country}
                        onChange={(e) => setForm({ ...form, country: e.target.value })}
                        placeholder="Pakistan"
                      />
                    </div>

                    <div className="md:col-span-2 pt-4 border-t border-[#f1f5f9]">
                      <label className={labelClass}>Company Logo (Optional)</label>
                      <div className="flex items-center gap-6 mt-2">
                        <div className="h-20 w-28 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-center overflow-hidden shrink-0">
                          {previewLogo ? (
                            <img src={previewLogo} alt="Logo" className="w-full h-full object-contain" />
                          ) : (
                            <span className="text-3xl">🏢</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            className="text-sm text-[#64748b] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#1e3a8a]/10 file:text-[#1e3a8a] hover:file:bg-[#1e3a8a]/20 cursor-pointer"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              setForm({ ...form, logo: file });
                              if (file) setPreviewLogo(URL.createObjectURL(file));
                            }}
                          />
                          <p className="text-xs text-[#64748b] mt-2">Recommended size: 250x100px. Max size: 2MB.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Contact */}
              {activeTab === "contact" && (
                <div className="space-y-6">
                  <div className="border-b border-[#e2e8f0] pb-4 mb-6">
                    <h2 className="text-xl font-bold text-[#1e293b]">Contact Details</h2>
                    <p className="text-[#64748b] text-sm mt-1">
                      Contact numbers and channels shown on bills and dispatch sheets.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className={labelClass}>Phone Numbers (Prints on Bill Header)</label>
                      <input
                        className={inputClass}
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="e.g. 0319-4083445 / 0316-3128491"
                      />
                    </div>

                    <div>
                      <label className={labelClass}>WhatsApp Official Number</label>
                      <input
                        className={inputClass}
                        value={form.whatsapp}
                        onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                        placeholder="e.g. 03194083445"
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Email Address</label>
                      <input
                        className={inputClass}
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="e.g. info@qadritraders.com"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Taxes & Legal */}
              {activeTab === "taxes" && (
                <div className="space-y-6">
                  <div className="border-b border-[#e2e8f0] pb-4 mb-6">
                    <h2 className="text-xl font-bold text-[#1e293b]">Taxes & Legal Identification</h2>
                    <p className="text-[#64748b] text-sm mt-1">
                      Configure your government registration numbers and default rates.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>NTN Number</label>
                      <input
                        className={inputClass}
                        value={form.ntn}
                        onChange={(e) => setForm({ ...form, ntn: e.target.value })}
                        placeholder="National Tax Number"
                      />
                    </div>

                    <div>
                      <label className={labelClass}>STRN Number</label>
                      <input
                        className={inputClass}
                        value={form.strn}
                        onChange={(e) => setForm({ ...form, strn: e.target.value })}
                        placeholder="Sales Tax Reg Number"
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Default Tax % (Per Invoice)</label>
                      <input
                        type="number"
                        step="0.01"
                        className={inputClass}
                        value={form.tax_percent}
                        onChange={(e) => setForm({ ...form, tax_percent: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Default Discount %</label>
                      <input
                        type="number"
                        step="0.01"
                        className={inputClass}
                        value={form.discount_percent}
                        onChange={(e) => setForm({ ...form, discount_percent: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Documents & Print */}
              {activeTab === "documents" && (
                <div className="space-y-6">
                  <div className="border-b border-[#e2e8f0] pb-4 mb-6">
                    <h2 className="text-xl font-bold text-[#1e293b]">Documents & Printing Preferences</h2>
                    <p className="text-[#64748b] text-sm mt-1">
                      Control how invoices, thermal slips, and vouchers are formatted and printed.
                    </p>
                  </div>

                  {/* Prefixes */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className={labelClass}>Sale Invoice Prefix</label>
                      <input
                        className={inputClass}
                        value={form.invoice_prefix}
                        onChange={(e) => setForm({ ...form, invoice_prefix: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Purchase Order Prefix</label>
                      <input
                        className={inputClass}
                        value={form.purchase_prefix}
                        onChange={(e) => setForm({ ...form, purchase_prefix: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Return Invoice Prefix</label>
                      <input
                        className={inputClass}
                        value={form.return_prefix}
                        onChange={(e) => setForm({ ...form, return_prefix: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Print Options & Toggles */}
                  <div className="pt-4 border-t border-[#f1f5f9] space-y-4">
                    <h3 className="text-sm font-bold text-[#1e293b] uppercase tracking-wide">
                      Invoice Print Customization
                    </h3>

                    <div>
                      <label className={labelClass}>Default Invoice Print Format</label>
                      <select
                        className={inputClass}
                        value={form.default_invoice_size}
                        onChange={(e) => setForm({ ...form, default_invoice_size: e.target.value })}
                      >
                        <option value="a4">📄 A4 Full Sheet (Standard Distribution Invoice)</option>
                        <option value="thermal">🧾 80mm Thermal Receipt (POS Slip)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                      <label className="flex items-center gap-3 p-3.5 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] hover:bg-[#eff6ff] transition cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.show_previous_balance}
                          onChange={(e) => setForm({ ...form, show_previous_balance: e.target.checked })}
                          className="w-4 h-4 text-[#1e3a8a] rounded border-[#cbd5e1] focus:ring-[#1e3a8a]"
                        />
                        <div>
                          <span className="text-xs font-bold text-[#1e293b] block">Print Previous Udhar</span>
                          <span className="text-[11px] text-[#64748b]">Show customer's prior balance on bill</span>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3.5 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] hover:bg-[#eff6ff] transition cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.show_signatures}
                          onChange={(e) => setForm({ ...form, show_signatures: e.target.checked })}
                          className="w-4 h-4 text-[#1e3a8a] rounded border-[#cbd5e1] focus:ring-[#1e3a8a]"
                        />
                        <div>
                          <span className="text-xs font-bold text-[#1e293b] block">Print Signature Blocks</span>
                          <span className="text-[11px] text-[#64748b]">Customer, rider & authorized sign</span>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3.5 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] hover:bg-[#eff6ff] transition cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.show_customer_area}
                          onChange={(e) => setForm({ ...form, show_customer_area: e.target.checked })}
                          className="w-4 h-4 text-[#1e3a8a] rounded border-[#cbd5e1] focus:ring-[#1e3a8a]"
                        />
                        <div>
                          <span className="text-xs font-bold text-[#1e293b] block">Print Customer Area</span>
                          <span className="text-[11px] text-[#64748b]">E.g. Qasimabad, Latifabad</span>
                        </div>
                      </label>
                    </div>

                    <div>
                      <label className={labelClass}>Standard Invoice Terms & Conditions</label>
                      <textarea
                        rows={3}
                        className={inputClass}
                        value={form.terms}
                        onChange={(e) => setForm({ ...form, terms: e.target.value })}
                        placeholder="e.g. 1. Goods once sold will not be returned without bill. 2. Claims must be made within 3 days."
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Invoice Footer Note / Greeting</label>
                      <input
                        className={inputClass}
                        value={form.footer_text}
                        onChange={(e) => setForm({ ...form, footer_text: e.target.value })}
                        placeholder="e.g. Thank you for your business! Have a great day."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: Inventory & Alerts */}
              {activeTab === "inventory" && (
                <div className="space-y-6">
                  <div className="border-b border-[#e2e8f0] pb-4 mb-6">
                    <h2 className="text-xl font-bold text-[#1e293b]">Inventory & Alert Rules</h2>
                    <p className="text-[#64748b] text-sm mt-1">
                      Set automated warnings for low stock levels and expiring batches.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] space-y-2">
                      <label className={labelClass}>⚠️ Low Stock Alert Level (Units / Quantity)</label>
                      <input
                        type="number"
                        min="0"
                        className={inputClass}
                        value={form.low_stock_threshold}
                        onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })}
                      />
                      <p className="text-xs text-[#64748b]">
                        When an item's stock reaches or falls below this number, the Dashboard and Inventory Report will highlight it in orange/red.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] space-y-2">
                      <label className={labelClass}>⏳ Expiry Warning Alert Window (Days)</label>
                      <input
                        type="number"
                        min="1"
                        className={inputClass}
                        value={form.expiry_alert_days}
                        onChange={(e) => setForm({ ...form, expiry_alert_days: e.target.value })}
                      />
                      <p className="text-xs text-[#64748b]">
                        Items expiring within this number of days (e.g. 30, 60, or 90 days) will be flagged as "Expiring Soon".
                      </p>
                    </div>

                    <div className="md:col-span-2 pt-2">
                      <label className="flex items-start gap-4 p-4 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] hover:bg-[#eff6ff] transition cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.allow_negative_stock}
                          onChange={(e) => setForm({ ...form, allow_negative_stock: e.target.checked })}
                          className="mt-1 w-5 h-5 text-[#1e3a8a] rounded border-[#cbd5e1] focus:ring-[#1e3a8a]"
                        />
                        <div>
                          <span className="text-sm font-bold text-[#1e293b] block">
                            Allow Negative Stock Billing
                          </span>
                          <span className="text-xs text-[#64748b] leading-relaxed block mt-0.5">
                            If checked, the system will allow invoices to be booked even if stock is zero. If unchecked (recommended), the system will strictly prevent sales when physical stock is unavailable.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 6: Security & Passwords */}
              {activeTab === "security" && (
                <div className="space-y-8 animate-in fade-in duration-200">
                  <div className="border-b border-[#e2e8f0] pb-4">
                    <h2 className="text-xl font-bold text-[#1e293b]">Admin Security & User Passwords</h2>
                    <p className="text-[#64748b] text-sm mt-1">
                      Update your administrator credentials and manage passwords for counter cashier accounts.
                    </p>
                  </div>

                  {/* Section A: My Account Profile */}
                  <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">👤</span>
                      <div>
                        <h3 className="font-bold text-sm text-slate-800">My Account Profile</h3>
                        <p className="text-xs text-slate-500">Update your login username and official email</p>
                      </div>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className={labelClass}>Account Display Name</label>
                        <input
                          type="text"
                          required
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Login Email Address</label>
                        <input
                          type="email"
                          required
                          value={profileEmail}
                          onChange={(e) => setProfileEmail(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div className="md:col-span-2 flex justify-end">
                        <button
                          type="submit"
                          disabled={profileUpdating}
                          className="px-5 py-2.5 rounded-xl bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
                        >
                          {profileUpdating ? "Saving..." : "Update Profile Info"}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Section B: Change My Password */}
                  <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🔑</span>
                      <div>
                        <h3 className="font-bold text-sm text-slate-800">Change Admin Password</h3>
                        <p className="text-xs text-slate-500">Ensure your software admin account is protected with a secure password</p>
                      </div>
                    </div>

                    <form onSubmit={handleChangePassword} className="space-y-4 pt-2">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className={labelClass}>Current Password</label>
                          <input
                            type="password"
                            required
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Current password"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>New Password (Min 6)</label>
                          <input
                            type="password"
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="New password"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Confirm New Password</label>
                          <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-type new password"
                            className={inputClass}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          disabled={passwordUpdating}
                          className="px-5 py-2.5 rounded-xl bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
                        >
                          {passwordUpdating ? "Updating..." : "Save New Password"}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Section C: Manage Cashier & Staff Accounts (Admin Only) */}
                  {isAdmin && (
                    <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">👥</span>
                          <div>
                            <h3 className="font-bold text-sm text-slate-800">System Users & Cashier Management</h3>
                            <p className="text-xs text-slate-500">Reset passwords for counter billing staff directly</p>
                          </div>
                        </div>
                        <button
                          onClick={loadUsersList}
                          className="text-xs text-[#1e3a8a] font-semibold hover:underline"
                        >
                          ↻ Refresh List
                        </button>
                      </div>

                      <div className="overflow-x-auto pt-2">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-100/70 text-slate-600 font-bold border-b border-slate-200">
                              <th className="py-2.5 px-3">#</th>
                              <th className="py-2.5 px-3">User Name</th>
                              <th className="py-2.5 px-3">Email / Login ID</th>
                              <th className="py-2.5 px-3">Assigned Role</th>
                              <th className="py-2.5 px-3">Status</th>
                              <th className="py-2.5 px-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {loadingUsers ? (
                              <tr>
                                <td colSpan="6" className="py-4 text-center text-slate-400">Loading accounts...</td>
                              </tr>
                            ) : usersList.length === 0 ? (
                              <tr>
                                <td colSpan="6" className="py-4 text-center text-slate-400">No users found</td>
                              </tr>
                            ) : (
                              usersList.map((u, idx) => (
                                <tr key={u.id} className="hover:bg-slate-50 transition">
                                  <td className="py-3 px-3 font-bold text-slate-500">{idx + 1}</td>
                                  <td className="py-3 px-3 font-semibold text-slate-800">{u.name}</td>
                                  <td className="py-3 px-3 text-slate-600">{u.email}</td>
                                  <td className="py-3 px-3">
                                    {u.role === "admin" ? (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                        👑 Admin
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                        💼 Cashier
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3 px-3">
                                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-right">
                                    <button
                                      onClick={() => {
                                        setSelectedUserForReset(u);
                                        setResetPasswordVal("");
                                      }}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1e3a8a] font-bold text-[11px] border border-blue-200 transition"
                                    >
                                      <span>🔑</span>
                                      <span>Reset Password</span>
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
