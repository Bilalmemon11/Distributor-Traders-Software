import { useState } from "react";
import { useApp } from "../context/AppContext";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import Modal from "../components/Modal";

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;

const catColors = {
  Rent: "bg-[#1e3a8a]/20 text-[#1e3a8a]",
  Salary: "bg-[#14b8a6]/20 text-[#14b8a6]",
  Electricity: "bg-[#f59e0b]/20 text-[#f59e0b]",
  Transport: "bg-[#22c55e]/20 text-[#22c55e]",
  Packing: "bg-[#ef4444]/20 text-[#ef4444]",
  Other: "bg-[#8892a4]/20 text-[#64748b]",
};

export default function Expenses() {
  const { expenses, addExpense, deleteExpense } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const { expenseCategories, addExpenseCategory } = useApp();
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    category: "Rent",
    description: "",
    amount: "",
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const catTotals = expenseCategories.reduce((acc, cat) => {
    acc[cat.name] = expenses
      .filter((e) => e.category === cat.name)
      .reduce((s, e) => s + e.amount, 0);

    return acc;
  }, {});

  const topCats = expenseCategories
    .map((c) => c.name)
    .filter((c) => catTotals[c] > 0)
    .slice(0, 4);

  const inputCls =
    "w-full bg-[#f4f7fb] border border-[#e2e8f0] text-[#1e293b] rounded-lg px-3 py-2 text-sm focus:border-[#6c63ff] focus:outline-none transition-colors";
  const labelCls = "block text-[#64748b] text-xs font-medium mb-1";

  const icons = ["🏠", "👤", "⚡", "🚛", "📦", "💼", "💰", "🛒"];

  const handleSubmit = (e) => {
    e.preventDefault();
    addExpense({ ...form, amount: Number(form.amount) });
    setForm({
      date: new Date().toISOString().split("T")[0],
      category: "Rent",
      description: "",
      amount: "",
    });
    setShowAdd(false);
  };

  const catColorArr = ["accent", "teal", "amber", "green"];

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;

    await addExpenseCategory(newCategory);

    setForm((prev) => ({
      ...prev,
      category: newCategory,
    }));

    setNewCategory("");

    setShowCategoryModal(false);
    
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <Topbar
        title="Expenses"
        action={
          <button
            onClick={() => setShowAdd(true)}
            className="px-4 py-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <span>+</span> Add Expense
          </button>
        }
      />
      <div className="p-6 space-y-6">
        {/* Top Category Cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {topCats.map((cat, i) => (
            <StatCard
              key={cat}
              label={cat}
              value={fmt(catTotals[cat])}
              sub={`${expenses.filter((e) => e.category === cat).length} entries`}
              color={catColorArr[i] || "accent"}
              icon={icons[i] || "💼"}
            />
          ))}
          {topCats.length === 0 && (
            <div className="col-span-4 text-center text-[#64748b] text-sm py-4">
              No expense data yet
            </div>
          )}
        </div>

        {/* Expense Table */}
        <div className="bg-white rounded-xl border border-[#e2e8f0]">
          <div className="p-4 border-b border-[#e2e8f0] flex items-center justify-between">
            <h3 className="text-[#1e293b] font-semibold">All Expenses</h3>
            <span className="text-[#ef4444] font-bold text-sm">
              Total: {fmt(totalExpenses)}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e2e8f0]">
                  {["Date", "Category", "Description", "Amount", "Action"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left text-[#64748b] text-xs font-semibold uppercase tracking-wider px-4 py-3 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr
                    key={exp.id}
                    className="border-b border-[#e2e8f0]/50 hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="px-4 py-3 text-[#64748b]">{exp.date}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full text-xs px-2 py-0.5 font-medium ${catColors[exp.category] || catColors.Other}`}
                      >
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#1e293b]">
                      {exp.description}
                    </td>
                    <td className="px-4 py-3 text-[#ef4444] font-semibold">
                      {fmt(exp.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          if (confirm("Delete this expense?"))
                            deleteExpense(exp.id);
                        }}
                        className="text-xs text-[#ef4444] border border-[#ef4444]/30 px-2 py-1 rounded-lg hover:bg-[#ef4444]/10 transition-all"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center text-[#64748b] py-12"
                    >
                      No expenses recorded
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {expenses.length > 0 && (
            <div className="p-4 border-t border-[#e2e8f0] flex justify-end">
              <div className="bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg px-4 py-2">
                <span className="text-[#64748b] text-xs">Grand Total: </span>
                <span className="text-[#ef4444] font-bold">
                  {fmt(totalExpenses)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add Expense"
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Date</label>
            <input
              type="date"
              className={inputCls}
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelCls}>Category</label>

              <button
                type="button"
                onClick={() => setShowCategoryModal(true)}
                className="text-xs text-[#1e3a8a] hover:text-[#8d86ff]"
              >
                + Add Category
              </button>
            </div>
            <select
              className={inputCls}
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
            >
              {expenseCategories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <input
              className={inputCls}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="e.g. Monthly shop rent"
            />
          </div>
          <div>
            <label className={labelCls}>Amount (Rs.) *</label>
            <input
              type="number"
              className={inputCls}
              value={form.amount}
              onChange={(e) => set("amount", e.target.value)}
              placeholder="0"
              min="0"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 text-sm border border-[#e2e8f0] text-[#64748b] rounded-lg hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-lg font-medium transition-colors"
            >
              Add Expense
            </button>
          </div>
        </form>
      </Modal>
      <Modal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="Add Expense Category"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Category Name</label>

            <input
              className={inputCls}
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="e.g. Internet"
            />
          </div>

          <div className="flex justify-end gap-3">

            <button
              type="button"
              onClick={() => setShowCategoryModal(false)}
              className="px-4 py-2 border border-[#e2e8f0] rounded-lg text-[#64748b]"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleAddCategory}
              className="px-5 py-2 bg-[#1e3a8a] hover:bg-[#1e40af] rounded-lg text-white"
            >
              Save Category
            </button>

          </div>
        </div>
      </Modal>
    </div>
  );
}
