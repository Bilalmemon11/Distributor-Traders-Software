import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import Topbar from "../components/Topbar";
import Modal from "../components/Modal";

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;
function ProductForm({ initial, onSubmit, onCancel }) {
  const { categories, units, addCategory, addUnit } = useApp();

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);

  const [newCategory, setNewCategory] = useState("");
  const [barcode, setBarcode] = useState("");

  const handleBarcodeScan = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const code = barcode.trim();
      if (!code) return;

      const newVariants = [...form.variants];
      if (newVariants.length === 1 && !newVariants[0].sku) {
        newVariants[0].sku = code;
      } else {
        newVariants.push({
            variant_name: "",
            sku: code,
            price: "",
            cost_price: "",
            stock_qty: "",
            reorder_level: "",
        });
      }
      setForm({ ...form, variants: newVariants });
      setBarcode("");
    }
  };
  const [newUnit, setNewUnit] = useState("");

  const [form, setForm] = useState(
    initial ? { ...initial, categoryId: initial.categoryId || initial.category_id, unitId: initial.unitId || initial.unit_id } : {
      name: "",
      categoryId: "",
      brand: "",
      unitId: "",
      status: true,
      description: "",

      variants: [
        {
          variant_name: "",

          sku: "",
          price: "",
          cost_price: "",
          stock_qty: "",
          reorder_level: "",
        },
      ],
    },
  );
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const inputCls =
    "w-full bg-[#f4f7fb] border border-[#e2e8f0] text-[#1e293b] rounded-lg px-3 py-2 text-sm focus:border-[#6c63ff] focus:outline-none transition-colors";
  const labelCls = "block text-[#64748b] text-xs font-medium mb-1";

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.categoryId) {
      alert("Please select category");
      return;
    }

    if (!form.unitId) {
      alert("Please select unit");
      return;
    }

    onSubmit({
      name: form.name,
      category_id: Number(form.categoryId),
      brand: form.brand,
      unit_id: Number(form.unitId),
      status: form.status,
      description: form.description,

      variants: form.variants.map((v) => ({
        id: v.id,
        variant_name: v.variant_name,
        sku: v.sku,

        cost_price: Number(v.cost_price),
        price: Number(v.price),
        stock_qty: Number(v.stock_qty),
        reorder_level: Number(v.reorder_level),
      })),
    });
  };
  const addVariant = () => {
    setForm((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          variant_name: "",
          sku: "",
          price: "",
          cost_price: "",
          stock_qty: "",
          reorder_level: "",
        },
      ],
    }));
  };

  const removeVariant = (index) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const updateVariant = (index, field, value) => {
    setForm((prev) => {
      const variants = [...prev.variants];

      variants[index][field] = value;

      return {
        ...prev,
        variants,
      };
    });
  };

  const profit = (v) => Number(v.price || 0) - Number(v.cost_price || 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={labelCls}>Product Name *</label>
          <input
            className={inputCls}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Lawn Fabric"
            required
          />
        </div>

        <div>
          <label className={labelCls}>Brand</label>

          <input
            className={inputCls}
            value={form.brand}
            onChange={(e) => set("brand", e.target.value)}
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className={labelCls}>Category</label>

            <button
              type="button"
              onClick={() => setShowCategoryModal(true)}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              + Add Category
            </button>
          </div>

          <select
            className={inputCls}
            value={form.categoryId || ""}
            onChange={(e) => set("categoryId", Number(e.target.value))}
          >
            <option value="">Select Category</option>

            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className={labelCls}>Unit</label>

            <button
              type="button"
              onClick={() => setShowUnitModal(true)}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              + Add Unit
            </button>
          </div>

          <select
            className={inputCls}
            value={form.unitId || ""}
            onChange={(e) => set("unitId", Number(e.target.value))}
          >
            <option value="">Select Unit</option>

            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-2 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[#1e293b] font-semibold">Product Variants</h3>

            <button
              type="button"
              onClick={addVariant}
              className="px-3 py-1 bg-[#1e3a8a] rounded text-white text-sm"
            >
              + Add Variant
            </button>
          </div>

          <div className="mb-4 bg-[#f1f5f9] p-3 rounded-lg border border-[#1e3a8a]/30">
            <label className="text-[#1e293b] text-sm font-semibold mb-2 block">📷 Scan Barcode to Add Variant</label>
            <input 
              type="text" 
              value={barcode} 
              onChange={(e) => setBarcode(e.target.value)} 
              onKeyDown={handleBarcodeScan} 
              placeholder="Click here & scan barcode..." 
              className="w-full bg-[#f4f7fb] border border-[#e2e8f0] text-[#1e293b] text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-[#6c63ff]"
            />
          </div>
          <div className="space-y-4">
            {form.variants.map((v, index) => (
              <div
                key={index}
                className="border border-[#e2e8f0] rounded-xl p-4 bg-white shadow-sm"
              >
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm text-[#1e293b]">Variant {index + 1}</h4>

                  {form.variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="text-red-600 hover:text-red-700 font-medium text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    className={inputCls}
                    placeholder="Color / Size"
                    value={v.variant_name}
                    onChange={(e) =>
                      updateVariant(index, "variant_name", e.target.value)
                    }
                  />

                  <input
                    className={inputCls}
                    placeholder="SKU"
                    value={v.sku}
                    onChange={(e) =>
                      updateVariant(index, "sku", e.target.value)
                    }
                  />

                  <input
                    type="number"
                    className={inputCls}
                    placeholder="Sale Price"
                    value={v.price}
                    onChange={(e) =>
                      updateVariant(index, "price", e.target.value)
                    }
                  />

                  <input
                    type="number"
                    className={inputCls}
                    placeholder="Cost Price"
                    value={v.cost_price}
                    onChange={(e) =>
                      updateVariant(index, "cost_price", e.target.value)
                    }
                  />

                  <input
                    type="number"
                    className={inputCls}
                    placeholder="Stock"
                    value={v.stock_qty}
                    onChange={(e) =>
                      updateVariant(index, "stock_qty", e.target.value)
                    }
                  />

                  <input
                    type="number"
                    className={inputCls}
                    placeholder="Reorder"
                    value={v.reorder_level}
                    onChange={(e) =>
                      updateVariant(index, "reorder_level", e.target.value)
                    }
                  />
                  <div className="col-span-2 flex justify-between mt-2">
                    <span className="text-green-400 text-sm">
                      Margin :
                      {Number(v.price) > 0
                        ? Math.round(
                            ((Number(v.price) - Number(v.cost_price)) /
                              Number(v.price)) *
                              100,
                          )
                        : 0}
                      %
                    </span>

                    <span className="text-cyan-400 text-sm">
                      Profit : {fmt(profit(v))}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <label className={labelCls}>Status</label>

          <select
            className={inputCls}
            value={form.status}
            onChange={(e) => set("status", e.target.value === "true")}
          >
            <option value={true}>Active</option>
            <option value={false}>Inactive</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Description</label>

          <textarea
            rows={3}
            className={inputCls}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>
      </div>
      {/* {form.price && form.cost && (
        <div className="bg-[#f1f5f9] rounded-lg p-3 text-sm">
          <span className="text-[#64748b]">Profit Margin: </span>
          <span className="text-[#22c55e] font-semibold">
            {form.price > 0
              ? Math.round(((form.price - form.cost) / form.price) * 100)
              : 0}
            %
          </span>
          <span className="text-[#64748b] ml-2">
            ({fmt(form.price - form.cost)} per unit)
          </span>
        </div>
      )} */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm border border-[#e2e8f0] text-[#64748b] rounded-lg hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 text-sm bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-lg font-medium transition-colors"
        >
          Save Product
        </button>
      </div>
      <Modal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="Add Category"
      >
        <div className="space-y-4">
          <input
            className={inputCls}
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Category Name"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCategoryModal(false)}
              className="px-4 py-2 border border-[#e2e8f0] rounded-lg"
            >
              Cancel
            </button>

            <button
              type="button"
              className="px-4 py-2 bg-[#1e3a8a] rounded-lg text-white"
              onClick={async () => {
                await addCategory(newCategory);

                const cat = categories.find((x) => x.name === newCategory);

                if (cat) {
                  set("categoryId", cat.id);
                }

                setNewCategory("");

                setShowCategoryModal(false);
              }}
            >
              Save
            </button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={showUnitModal}
        onClose={() => setShowUnitModal(false)}
        title="Add Unit"
      >
        <div className="space-y-4">
          <input
            className={inputCls}
            value={newUnit}
            onChange={(e) => setNewUnit(e.target.value)}
            placeholder="Unit Name"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowUnitModal(false)}
              className="px-4 py-2 border border-[#e2e8f0] rounded-lg"
            >
              Cancel
            </button>

            <button
              type="button"
              className="px-4 py-2 bg-[#1e3a8a] rounded-lg text-white"
              onClick={async () => {
                await addUnit(newUnit);

                const unit = units.find(
                  (x) => x.name.toLowerCase() === newUnit.toLowerCase(),
                );

                if (unit) {
                  set("unitId", unit.id);
                }

                setNewUnit("");

                setShowUnitModal(false);
              }}
            >
              Save
            </button>
          </div>
        </div>
      </Modal>
    </form>
  );
}

export default function Products() {
  const { products, addProduct, updateProduct, deleteProduct } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [editProd, setEditProd] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const firstVariant = (p) => p.variants?.[0] || {};

  const margin = (p) => {
    const v = firstVariant(p);

    return Number(v.price) > 0
      ? Math.round(
          ((Number(v.price) - Number(v.cost_price)) / Number(v.price)) * 100,
        )
      : 0;
  };

  const stockColor = (p) => {
    const v = firstVariant(p);

    if (Number(v.stock_qty) === 0) return "bg-[#ef4444]/20 text-[#ef4444]";

    if (Number(v.stock_qty) <= Number(v.reorder_level))
      return "bg-[#f59e0b]/20 text-[#f59e0b]";

    return "bg-[#22c55e]/20 text-[#22c55e]";
  };
  const isLowStock = (p) => {
    const v = firstVariant(p);

    return (
      Number(v.stock_qty) <= Number(v.reorder_level) && Number(v.stock_qty) > 0
    );
  };
  const productCategories = useMemo(() => {
    return [...new Set(products.map((p) => p.category).filter(Boolean))];
  }, [products]);
  const totalVariants = useMemo(() => {
    return products.reduce(
      (total, product) => total + (product.variants?.length || 0),
      0,
    );
  }, [products]);
  const filteredProducts = products.filter((p) => {
    const keyword =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || "").toLowerCase().includes(search.toLowerCase());

    const category = !categoryFilter || p.category === categoryFilter;
    return keyword && category;
  });

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      await deleteProduct(id);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <Topbar
        title="Products"
        action={
          <button
            onClick={() => setShowAdd(true)}
            className="px-4 py-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <span>+</span> Add Product
          </button>
        }
      />
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-4">
            <p className="text-xs text-gray-400">Total Products</p>

            <h2 className="text-3xl font-bold text-[#1e293b]">{products.length}</h2>
          </div>

          <div className="bg-white border border-[#e2e8f0] rounded-xl p-4">
            <p className="text-xs text-gray-400">Categories</p>

            <h2 className="text-3xl font-bold text-cyan-400">
              {productCategories.length}
            </h2>
          </div>

          <div className="bg-white border border-[#e2e8f0] rounded-xl p-4">
            <p className="text-xs text-gray-400">Variants</p>

            <h2 className="text-3xl font-bold text-green-400">
              {totalVariants}
            </h2>
          </div>
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-4">
            <p className="text-xs text-gray-400">Brands</p>

            <h2 className="text-3xl font-bold text-yellow-400">
              {
                [...new Set(products.map((p) => p.brand).filter(Boolean))]
                  .length
              }
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <input
            className="px-3 py-2 rounded-lg bg-[#f4f7fb] border border-[#e2e8f0] text-[#1e293b]"
            placeholder="Search by Product Name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[#f4f7fb] border border-[#e2e8f0] text-[#1e293b]"
          >
            <option value="">All Categories</option>

            {productCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div className="bg-white rounded-xl border border-[#e2e8f0]">
          <div className="p-4 border-b border-[#e2e8f0] flex items-center justify-between">
            <h3 className="text-[#1e293b] font-semibold">All Products</h3>
            <span className="text-[#64748b] text-xs">
              {filteredProducts.length} products
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-[#e2e8f0]">
                  {[
                    "SKU",
                    "Product",
                    "Color / Size",

                    "Brand",
                    "Category",
                    "Sale Price",
                    "Cost",
                    "Margin",
                    "Stock",
                    "Action",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left text-[#64748b] text-xs font-semibold uppercase tracking-wider px-4 py-3 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* {products.map((p) => ( */}
                {filteredProducts.map((p) => (
                  <tr
                    key={p.id}
                    className={`border-b border-[#e2e8f0]/50 ${p.id % 2 === 0 ? "bg-[#f1f5f9]" : ""}hover:bg-[#f1f5f9] transition-colors
                    ${isLowStock(p) ? "bg-red-500/5" : ""}
                    `}
                  >
                    <td className="px-4 py-3 font-mono text-[#14b8a6]">
                      {p.sku}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <p className="text-[#1e293b] font-medium">{p.name}</p>

                        {isLowStock(p) && (
                          <span className="text-[10px] bg-red-500/20 text-red-600 hover:text-red-700 font-medium px-2 py-0.5 rounded-full">
                            Low Stock
                          </span>
                        )}
                      </div>
                      <p className="text-[#64748b] text-xs">{p.unit}</p>
                    </td>
                    <td className="px-4 py-3 text-[#1e293b] font-medium">
                      {firstVariant(p).variant_name || "-"}
                    </td>

                    <td className="px-4 py-3 text-[#1e293b] font-medium">{p.brand || "-"}</td>
                    <td className="px-4 py-3">
                      <span className="bg-[#1e3a8a]/10 text-[#1e3a8a] text-xs px-2 py-0.5 rounded-full">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#1e293b] font-medium">
                      {fmt(firstVariant(p).price)}
                    </td>
                    <td className="px-4 py-3 text-[#64748b]">
                      {fmt(firstVariant(p).cost_price)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-[#e2e8f0] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#22c55e] rounded-full"
                            style={{ width: `${Math.min(margin(p), 100)}%` }}
                          />
                        </div>
                        <span className="text-[#22c55e] text-xs font-medium">
                          {margin(p)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${stockColor(p)}`}
                      >
                        {firstVariant(p).stock_qty} {p.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex items-center gap-2">
                      <button
                        onClick={() => setEditProd(p)}
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium transition-all"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-xs bg-[#ef4444] hover:bg-[#dc2626] text-white px-3 py-2 rounded-lg font-medium transition-all"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="text-center text-[#64748b] py-12"
                    >
                      No products added yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add New Product"
        size="md"
      >
        <ProductForm
          onSubmit={(data) => {
            addProduct(data);
            setShowAdd(false);
          }}
          onCancel={() => setShowAdd(false)}
        />
      </Modal>

      <Modal
        isOpen={!!editProd}
        onClose={() => setEditProd(null)}
        title="Edit Product"
        size="md"
      >
        {editProd && (
          <ProductForm
            initial={editProd}
            onSubmit={(data) => {
              updateProduct({
                ...editProd,
                ...data,
              });

              setEditProd(null);
            }}
            onCancel={() => setEditProd(null)}
          />
        )}
      </Modal>
    </div>
  );
}
