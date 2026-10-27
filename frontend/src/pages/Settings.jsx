import { useEffect, useState, useRef } from "react";
import Topbar from "../components/Topbar";
import { useApp } from "../context/AppContext";
import { BACKEND_URL } from "../config";

export default function Settings() {
  const { fetchCompany, saveCompany } = useApp();
  const [activeTab, setActiveTab] = useState("general");
  const [previewLogo, setPreviewLogo] = useState(null);
  
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

    logo: null,
  });

  useEffect(() => {
    loadCompany();
  }, []);

  async function loadCompany() {
    try {
      const data = await fetchCompany();
      if (data) {
        setForm((prev) => ({
          ...prev,
          ...data,
          logo: null, // Keep file input empty on load
        }));
        if (data.logo) {
            setPreviewLogo(`${BACKEND_URL}/storage/${data.logo}`); // Quick hack for local dev to see logo
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  const inputClass =
    "w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-4 py-2.5 text-[#1e293b] text-sm focus:outline-none focus:border-[#6c63ff] transition-colors";
  const labelClass = "block text-xs font-medium text-[#64748b] mb-1.5 uppercase tracking-wide";

  async function handleSave() {
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === "logo") {
          if (value instanceof File) {
            fd.append("logo", value);
          }
        } else {
          fd.append(key, value ?? "");
        }
      });

      await saveCompany(fd);
      alert("Settings Saved Successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save settings.");
    }
  }

  const tabs = [
    { id: "general", label: "General", icon: "🏢" },
    { id: "contact", label: "Contact", icon: "📞" },
    { id: "taxes", label: "Taxes & Legal", icon: "🏛️" },
    { id: "documents", label: "Documents", icon: "📄" },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#f4f7fb]">
      <Topbar title="System Settings" />

      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6">
          
          {/* Sidebar Tabs */}
          <div className="w-full md:w-64 shrink-0">
            <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-5 py-4 text-sm font-medium transition-colors border-l-4 ${
                    activeTab === tab.id 
                      ? "border-[#6c63ff] bg-[#f8fafc] text-[#1e293b]" 
                      : "border-transparent text-[#64748b] hover:bg-[#f8fafc]/50 hover:text-[#1e293b]"
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
            
            <div className="mt-6">
                <button
                    onClick={handleSave}
                    className="w-full bg-[#1e3a8a] hover:bg-[#5a52e0] text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-[#6c63ff]/20 transition-all active:scale-[0.98]"
                >
                    Save Changes
                </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1">
            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 md:p-8 min-h-[500px]">
              
              {activeTab === "general" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="border-b border-[#e2e8f0] pb-4 mb-6">
                    <h2 className="text-xl font-semibold text-[#1e293b]">General Information</h2>
                    <p className="text-[#64748b] text-sm mt-1">Update your company's core details and identity.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>Company Name</label>
                      <input className={inputClass} value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>Owner Name</label>
                      <input className={inputClass} value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} />
                    </div>
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className={labelClass}>Currency</label>
                          <input className={inputClass} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
                        </div>
                        <div className="md:col-span-2">
                          <label className={labelClass}>Address</label>
                          <input className={inputClass} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                        </div>
                    </div>
                    <div>
                      <label className={labelClass}>City</label>
                      <input className={inputClass} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>Country</label>
                      <input className={inputClass} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
                    </div>
                    
                    <div className="md:col-span-2 pt-4">
                      <label className={labelClass}>Company Logo</label>
                      <div className="flex items-center gap-6 mt-2">
                        <div className="h-20 w-20 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-center overflow-hidden shrink-0">
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
                            className="text-sm text-[#64748b] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#1e3a8a]/10 file:text-[#1e3a8a] hover:file:bg-[#1e3a8a]/20"
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

              {activeTab === "contact" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="border-b border-[#e2e8f0] pb-4 mb-6">
                    <h2 className="text-xl font-semibold text-[#1e293b]">Contact Details</h2>
                    <p className="text-[#64748b] text-sm mt-1">How your customers and vendors can reach you.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>Email Address</label>
                      <input className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>Phone Number</label>
                      <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>WhatsApp Number</label>
                      <input className={inputClass} value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "taxes" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="border-b border-[#e2e8f0] pb-4 mb-6">
                    <h2 className="text-xl font-semibold text-[#1e293b]">Taxes & Legal</h2>
                    <p className="text-[#64748b] text-sm mt-1">Configure your tax identification and default rates.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>NTN Number</label>
                      <input className={inputClass} value={form.ntn} onChange={(e) => setForm({ ...form, ntn: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>STRN Number</label>
                      <input className={inputClass} value={form.strn} onChange={(e) => setForm({ ...form, strn: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>Default Tax %</label>
                      <input type="number" className={inputClass} value={form.tax_percent} onChange={(e) => setForm({ ...form, tax_percent: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>Default Discount %</label>
                      <input type="number" className={inputClass} value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: e.target.value })} />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "documents" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="border-b border-[#e2e8f0] pb-4 mb-6">
                    <h2 className="text-xl font-semibold text-[#1e293b]">Documents & Printing</h2>
                    <p className="text-[#64748b] text-sm mt-1">Customize prefixes and terms for generated PDFs.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className={labelClass}>Invoice Prefix</label>
                      <input className={inputClass} value={form.invoice_prefix} onChange={(e) => setForm({ ...form, invoice_prefix: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>Purchase Prefix</label>
                      <input className={inputClass} value={form.purchase_prefix} onChange={(e) => setForm({ ...form, purchase_prefix: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>Return Prefix</label>
                      <input className={inputClass} value={form.return_prefix} onChange={(e) => setForm({ ...form, return_prefix: e.target.value })} />
                    </div>
                    
                    <div className="md:col-span-3">
                      <label className={labelClass}>Invoice Terms & Conditions</label>
                      <textarea rows={4} className={inputClass} value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} placeholder="Enter standard terms shown at the bottom of invoices..." />
                    </div>
                    
                    <div className="md:col-span-3">
                      <label className={labelClass}>Footer Text</label>
                      <input className={inputClass} value={form.footer_text} onChange={(e) => setForm({ ...form, footer_text: e.target.value })} placeholder="E.g., Thank you for your business!" />
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
