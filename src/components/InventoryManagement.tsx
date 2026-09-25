import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Product, Bale, Category, Supplier } from '../types';
import {
  Package,
  Layers,
  ListOrdered,
  Truck,
  Plus,
  Search,
  Edit2,
  Trash2,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Upload,
  ExternalLink,
  Save,
  Check,
} from 'lucide-react';

export const InventoryManagement: React.FC = () => {
  const {
    currentUser,
    isDark,
    inventoryTab,
    setInventoryTab,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    suppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    bales,
    addBale,
    updateBale,
    updateBaleStatus,
    deleteBale,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
  } = useStore();

  // Permitted tabs based on role:
  // Both Staff and Owner can access and manage: 'bales', 'categories', 'products', 'suppliers'
  const allowedTabs = useMemo(() => {
    return [
      { id: 'bales', label: 'Bale Management', icon: Layers },
      { id: 'categories', label: 'Product Categories', icon: Package },
      { id: 'products', label: 'Product List', icon: ListOrdered },
      { id: 'suppliers', label: 'Bale Suppliers', icon: Truck },
    ] as { id: 'bales' | 'categories' | 'products' | 'suppliers'; label: string; icon: any }[];
  }, []);

  const currentTab = inventoryTab;

  // ================= 1. BALE MANAGEMENT FORM STATE =================
  const [editingBaleId, setEditingBaleId] = useState<string | null>(null);
  const [baleName, setBaleName] = useState('');
  const [baleCategory, setBaleCategory] = useState(categories[0]?.id || '');
  const [baleSupplier, setBaleSupplier] = useState(suppliers[0]?.id || '');
  const [balePrice, setBalePrice] = useState<number | ''>('');
  const [baleQty, setBaleQty] = useState<number | ''>('');
  const [baleDesc, setBaleDesc] = useState('');

  // Auto-calculated price per piece
  const calculatedPricePerPiece = useMemo(() => {
    const p = Number(balePrice) || 0;
    const q = Number(baleQty) || 0;
    if (p > 0 && q > 0) {
      return (p / q).toFixed(2);
    }
    return '0.00';
  }, [balePrice, baleQty]);

  // Auto-generated next bale code
  const generatedBaleCode = useMemo(() => {
    const nextNum = bales.length + 1;
    return `EXINS-BALE-${String(nextNum).padStart(3, '0')}`;
  }, [bales.length]);

  const handleStartEditBale = (bale: Bale) => {
    setEditingBaleId(bale.id);
    setBaleName(bale.name);
    setBaleCategory(bale.categoryId);
    setBaleSupplier(bale.supplierId);
    setBalePrice(bale.totalPrice);
    setBaleQty(bale.quantity);
    setBaleDesc(bale.description || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEditBale = () => {
    setEditingBaleId(null);
    setBaleName('');
    setBalePrice('');
    setBaleQty('');
    setBaleDesc('');
  };

  const handleSaveBale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!baleName || !balePrice || !baleQty) return;

    if (editingBaleId) {
      updateBale(editingBaleId, {
        name: baleName,
        categoryId: baleCategory,
        supplierId: baleSupplier,
        totalPrice: Number(balePrice),
        quantity: Number(baleQty),
        description: baleDesc,
      });
      handleCancelEditBale();
      return;
    }

    addBale({
      code: generatedBaleCode,
      name: baleName,
      categoryId: baleCategory,
      supplierId: baleSupplier,
      totalPrice: Number(balePrice),
      quantity: Number(baleQty),
      description: baleDesc,
      status: 'opened',
      dateAdded: new Date().toISOString().split('T')[0],
    });

    handleCancelEditBale();
  };

  // ================= 2. PRODUCT CATEGORIES STATE =================
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catColor, setCatColor] = useState('#ea580c'); // orange-600

  const handleStartEditCategory = (cat: Category) => {
    setEditingCategoryId(cat.id);
    setCatName(cat.name);
    setCatDesc(cat.description || '');
    setCatColor(cat.color || '#ea580c');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEditCategory = () => {
    setEditingCategoryId(null);
    setCatName('');
    setCatDesc('');
    setCatColor('#ea580c');
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    if (editingCategoryId) {
      updateCategory(editingCategoryId, {
        name: catName.trim(),
        description: catDesc.trim(),
        color: catColor,
      });
      handleCancelEditCategory();
      return;
    }

    addCategory({
      name: catName.trim(),
      description: catDesc.trim(),
      color: catColor,
    });

    handleCancelEditCategory();
  };

  // ================= 3. PRODUCT LIST STATE =================
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState(categories[0]?.id || '');
  const [prodBale, setProdBale] = useState(bales[0]?.id || '');
  const [prodQty, setProdQty] = useState<number | ''>(5);
  const [prodSellingPrice, setProdSellingPrice] = useState<number | ''>(450);
  const [prodCostPrice, setProdCostPrice] = useState<number | ''>(120);
  const [prodSize, setProdSize] = useState('Medium');
  const [prodImage, setProdImage] = useState(
    'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=600&q=80'
  );
  const [prodLink, setProdLink] = useState('https://www.instagram.com/exins.jksurplus');
  const [prodDesc, setProdDesc] = useState('');
  const [productSearch, setProductSearch] = useState('');

  // Auto-fill cost price when selected bale changes
  const handleBaleSelectChange = (baleId: string) => {
    setProdBale(baleId);
    const matchedBale = bales.find((b) => b.id === baleId);
    if (matchedBale) {
      setProdCostPrice(matchedBale.pricePerPiece);
      if (matchedBale.categoryId) {
        setProdCategory(matchedBale.categoryId);
      }
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim() || !prodSellingPrice || !prodQty) return;

    if (editingProductId) {
      updateProduct(editingProductId, {
        name: prodName.trim(),
        categoryId: prodCategory,
        baleId: prodBale,
        quantity: Number(prodQty),
        sellingPrice: Number(prodSellingPrice),
        costPrice: Number(prodCostPrice) || 0,
        size: prodSize,
        image: prodImage,
        link: prodLink,
        description: prodDesc,
      });
      setEditingProductId(null);
    } else {
      addProduct({
        name: prodName.trim(),
        categoryId: prodCategory,
        baleId: prodBale,
        quantity: Number(prodQty),
        sellingPrice: Number(prodSellingPrice),
        costPrice: Number(prodCostPrice) || 0,
        size: prodSize,
        image: prodImage,
        link: prodLink,
        description: prodDesc,
      });
    }

    // Reset
    setProdName('');
    setProdDesc('');
    setEditingProductId(null);
  };

  const handleStartEditProduct = (p: Product) => {
    setEditingProductId(p.id);
    setProdName(p.name);
    setProdCategory(p.categoryId);
    setProdBale(p.baleId);
    setProdQty(p.quantity);
    setProdSellingPrice(p.sellingPrice);
    setProdCostPrice(p.costPrice);
    setProdSize(p.size);
    setProdImage(p.image);
    setProdLink(p.link);
    setProdDesc(p.description);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const filteredProductsTable = useMemo(() => {
    return products.filter((p) => {
      const q = productSearch.toLowerCase();
      const cat = categories.find((c) => c.id === p.categoryId)?.name.toLowerCase() || '';
      const b = bales.find((bl) => bl.id === p.baleId)?.code.toLowerCase() || '';
      return (
        p.name.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        p.size.toLowerCase().includes(q) ||
        cat.includes(q) ||
        b.includes(q)
      );
    });
  }, [products, productSearch, categories, bales]);

  // ================= 4. BALE SUPPLIERS STATE =================
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [supName, setSupName] = useState('');
  const [supContactPerson, setSupContactPerson] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supAddress, setSupAddress] = useState('');
  const [supDesc, setSupDesc] = useState('');

  const handleStartEditSupplier = (sup: Supplier) => {
    setEditingSupplierId(sup.id);
    setSupName(sup.name);
    setSupContactPerson(sup.contactPerson);
    setSupEmail(sup.email);
    setSupPhone(sup.phone);
    setSupAddress(sup.address);
    setSupDesc(sup.description || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEditSupplier = () => {
    setEditingSupplierId(null);
    setSupName('');
    setSupContactPerson('');
    setSupEmail('');
    setSupPhone('');
    setSupAddress('');
    setSupDesc('');
  };

  const handleRegisterSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) return;

    if (editingSupplierId) {
      updateSupplier(editingSupplierId, {
        name: supName.trim(),
        contactPerson: supContactPerson.trim(),
        email: supEmail.trim(),
        phone: supPhone.trim(),
        address: supAddress.trim(),
        description: supDesc.trim(),
      });
      handleCancelEditSupplier();
      return;
    }

    addSupplier({
      name: supName.trim(),
      contactPerson: supContactPerson.trim(),
      email: supEmail.trim(),
      phone: supPhone.trim(),
      address: supAddress.trim(),
      description: supDesc.trim(),
    });

    handleCancelEditSupplier();
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Inventory Navigation Tabs */}
      <div
        className={`p-4 rounded-3xl border transition-all ${
          isDark ? 'bg-stone-900/80 border-orange-500/20' : 'bg-white/90 border-orange-200'
        } backdrop-blur-xl shadow-lg`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Thrift & Surplus Inventory Management</h1>
            <p className="text-xs text-stone-400 mt-0.5">
              Bale costing, break-even progress bars, category distribution, and supplier sourcing.
            </p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-stone-800/40 rounded-2xl border border-orange-500/20">
            {allowedTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setInventoryTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-orange-600 text-white shadow-md'
                      : isDark
                      ? 'text-stone-300 hover:text-white'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================= SECTION 1: BALE MANAGEMENT ================= */}
      {currentTab === 'bales' && (
        <div className="space-y-8">
          {/* Add Bale Form */}
          <div
            className={`p-6 rounded-3xl border ${
              isDark ? 'bg-stone-900/80 border-orange-500/20' : 'bg-white/90 border-orange-200'
            } backdrop-blur-xl shadow-lg`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-orange-400 font-bold text-xs uppercase tracking-wider">
                <Layers className="w-4 h-4" />
                <span>{editingBaleId ? 'Edit Bale Details' : 'Record New Imported Bale'}</span>
              </div>
              {editingBaleId && (
                <button
                  type="button"
                  onClick={handleCancelEditBale}
                  className="text-xs text-stone-400 hover:text-white underline cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </div>
            <h2 className="text-lg font-black mb-4">
              {editingBaleId ? 'Update Bale Specifications' : 'Bale Registration & Automatic Cost Calculation'}
            </h2>

            <form onSubmit={handleSaveBale} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-stone-300 font-semibold mb-1">Bale Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grade A Japanese Track Jackets"
                  value={baleName}
                  onChange={(e) => setBaleName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">Bale Code (Auto Generated)</label>
                <input
                  type="text"
                  disabled
                  value={generatedBaleCode}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-orange-500/30 bg-orange-500/10 text-orange-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">Product Category</label>
                <select
                  value={baleCategory}
                  onChange={(e) => setBaleCategory(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-300'
                  }`}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">Select Supplier</label>
                <select
                  value={baleSupplier}
                  onChange={(e) => setBaleSupplier(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-300'
                  }`}
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">Total Bale Purchase Price (₱)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 12000"
                  value={balePrice}
                  onChange={(e) => setBalePrice(e.target.value ? Number(e.target.value) : '')}
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">Quantity Purchased (Piece Count)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 100"
                  value={baleQty}
                  onChange={(e) => setBaleQty(e.target.value ? Number(e.target.value) : '')}
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">Price Per Piece (Automatically Calculated)</label>
                <div className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-800/40 text-emerald-400 font-black text-sm">
                  ₱{calculatedPricePerPiece} / pc
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-stone-300 font-semibold mb-1">Description / Notes</label>
                <input
                  type="text"
                  placeholder="Origin, grade notes, mix varieties, warehouse lot..."
                  value={baleDesc}
                  onChange={(e) => setBaleDesc(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-300'
                  }`}
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-orange-950/40 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingBaleId ? 'Update Bale Database' : 'Save Bale to Database'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Bale Database with Break-Even Status */}
          <div
            className={`p-6 rounded-3xl border ${
              isDark ? 'bg-stone-900/80 border-orange-500/20' : 'bg-white/90 border-orange-200'
            } backdrop-blur-xl shadow-lg`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-black">Bale Master Database & Break-Even Progress</h2>
                <p className="text-xs text-stone-400">
                  Track recovery of initial bale investment, sales revenue generated, and surplus profit margins.
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 self-start">
                Total Bales: {bales.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr
                    className={`border-b ${
                      isDark ? 'border-stone-800 text-stone-400' : 'border-stone-200 text-stone-500'
                    } uppercase text-[10px] tracking-wider`}
                  >
                    <th className="py-3 px-4 font-bold">Bale Code & Name</th>
                    <th className="py-3 px-4 font-bold">Category & Supplier</th>
                    <th className="py-3 px-4 font-bold">Pieces Count</th>
                    <th className="py-3 px-4 font-bold">Total Bale Price</th>
                    <th className="py-3 px-4 font-bold">Price / Piece</th>
                    <th className="py-3 px-4 font-bold">Total Sales Made</th>
                    <th className="py-3 px-4 font-bold min-w-[200px]">Break-Even Status</th>
                    <th className="py-3 px-4 font-bold">Bale Status</th>
                    <th className="py-3 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/50">
                  {bales.map((b) => {
                    const catName = categories.find((c) => c.id === b.categoryId)?.name || 'Mixed';
                    const supName = suppliers.find((s) => s.id === b.supplierId)?.name || 'Unknown Supplier';

                    // Break-even math
                    const isExceeded = b.totalSales >= b.totalPrice;
                    const breakEvenPercent =
                      b.totalPrice > 0 ? Math.min(200, Math.round((b.totalSales / b.totalPrice) * 100)) : 0;
                    const needed = Math.max(0, b.totalPrice - b.totalSales);
                    const profitExceeded = Math.max(0, b.totalSales - b.totalPrice);

                    return (
                      <tr
                        key={b.id}
                        className={`hover:bg-orange-500/5 transition-colors ${
                          isDark ? 'text-stone-200' : 'text-stone-800'
                        }`}
                      >
                        <td className="py-4 px-4 font-medium">
                          <span className="font-mono font-bold text-orange-400 block">{b.code}</span>
                          <span className="font-semibold text-stone-100">{b.name}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-medium block">{catName}</span>
                          <span className="text-[10px] text-stone-400">{supName}</span>
                        </td>
                        <td className="py-4 px-4 font-bold text-stone-300">{b.quantity} pcs</td>
                        <td className="py-4 px-4 font-black">₱{b.totalPrice.toLocaleString()}</td>
                        <td className="py-4 px-4 font-semibold text-stone-300">
                          ₱{b.pricePerPiece.toLocaleString()}
                        </td>
                        <td className="py-4 px-4 font-black text-emerald-400">
                          ₱{b.totalSales.toLocaleString()}
                        </td>

                        {/* Break-even Status column with requested format */}
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-[11px] font-bold">
                              <span>{breakEvenPercent}%</span>
                              {isExceeded ? (
                                <span className="text-emerald-400 font-black">
                                  +{profitExceeded > 0 ? `₱${profitExceeded.toLocaleString()}` : 'Break-Even'}{' '}
                                  profit
                                </span>
                              ) : (
                                <span className="text-rose-400 font-bold">
                                  Need: ₱{needed.toLocaleString()}
                                </span>
                              )}
                            </div>
                            {/* Progress bar */}
                            <div className="w-full h-2.5 bg-stone-800 rounded-full overflow-hidden p-0.5">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isExceeded
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                    : 'bg-gradient-to-r from-orange-600 to-amber-400'
                                }`}
                                style={{ width: `${Math.min(100, breakEvenPercent)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Bale Status dropdown */}
                        <td className="py-4 px-4">
                          <select
                            value={b.status}
                            onChange={(e) =>
                              updateBaleStatus(b.id, e.target.value as 'sealed' | 'opened' | 'depleted')
                            }
                            className={`px-2.5 py-1 rounded-xl text-xs font-bold border capitalize cursor-pointer focus:outline-none ${
                              b.status === 'sealed'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : b.status === 'opened'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-stone-800 text-stone-400 border-stone-700'
                            }`}
                          >
                            <option value="sealed">Sealed</option>
                            <option value="opened">Opened</option>
                            <option value="depleted">Depleted</option>
                          </select>
                        </td>

                        {/* Actions: Edit & Delete */}
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleStartEditBale(b)}
                              className="p-1.5 rounded-lg hover:bg-stone-700/60 text-stone-400 hover:text-white transition-colors cursor-pointer"
                              title="Edit Bale Details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete bale "${b.name}" (${b.code}) from database?`)) {
                                  deleteBale(b.id);
                                }
                              }}
                              className="p-1.5 rounded-lg hover:bg-rose-500/20 text-stone-400 hover:text-rose-400 transition-colors cursor-pointer"
                              title="Delete Bale"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= SECTION 2: PRODUCT CATEGORIES ================= */}
      {currentTab === 'categories' && (
        <div className="space-y-8">
          {/* Add Category Form */}
          <div
            className={`p-6 rounded-3xl border ${
              isDark ? 'bg-stone-900/80 border-orange-500/20' : 'bg-white/90 border-orange-200'
            } backdrop-blur-xl shadow-lg`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-orange-400 font-bold text-xs uppercase tracking-wider">
                <Package className="w-4 h-4" />
                <span>{editingCategoryId ? 'Edit Garment Category' : 'Create Garment Category'}</span>
              </div>
              {editingCategoryId && (
                <button
                  type="button"
                  onClick={handleCancelEditCategory}
                  className="text-xs text-stone-400 hover:text-white underline cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </div>
            <h2 className="text-lg font-black mb-4">
              {editingCategoryId ? 'Update Category Definition' : 'Product Category Definition'}
            </h2>

            <form onSubmit={handleSaveCategory} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-stone-300 font-semibold mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Varsity Jackets, Caps, Retro Sneakers"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">Color Palette Tag</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={catColor}
                    onChange={(e) => setCatColor(e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-stone-700 bg-transparent p-0.5"
                  />
                  <input
                    type="text"
                    value={catColor}
                    onChange={(e) => setCatColor(e.target.value)}
                    className={`flex-1 px-3.5 py-2.5 rounded-xl border text-xs font-mono uppercase ${
                      isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-300'
                    }`}
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-stone-300 font-semibold mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Thrift apparel details, styles, fabric mix..."
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-300'
                  }`}
                />
              </div>

              <div className="sm:col-span-3 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-orange-950/40 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{editingCategoryId ? 'Update Category' : 'Add Category'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Category Cards with circle color, stock count, Edit & Delete */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className={`p-6 rounded-3xl border transition-all ${
                  isDark
                    ? 'bg-stone-900/80 border-orange-500/20 text-stone-100 hover:border-orange-500/40'
                    : 'bg-white border-orange-200 text-stone-900 shadow-md'
                } backdrop-blur-xl flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {/* Circle showing the color */}
                      <div
                        className="w-5 h-5 rounded-full shrink-0 shadow-md"
                        style={{ backgroundColor: cat.color }}
                      />
                      <h3 className="font-black text-base">{cat.name}</h3>
                    </div>

                    {/* Edit & Delete Action Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEditCategory(cat)}
                        className="p-1.5 rounded-lg hover:bg-stone-700/60 text-stone-400 hover:text-white transition-colors cursor-pointer"
                        title="Edit Category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete category "${cat.name}" from database?`)) {
                            deleteCategory(cat.id);
                          }
                        }}
                        className="p-1.5 rounded-lg hover:bg-rose-500/20 text-stone-400 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed">{cat.description}</p>
                </div>

                <div className="pt-4 mt-4 border-t border-stone-800/60 flex items-center justify-between">
                  <span className="text-xs text-stone-400">Total in stock for this category:</span>
                  <span className="text-sm font-black text-orange-400">
                    {cat.inStock ?? 0} pieces
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= SECTION 3: PRODUCT LIST ================= */}
      {currentTab === 'products' && (
        <div className="space-y-8">
          {/* Add / Edit Product Form */}
          <div
            className={`p-6 rounded-3xl border ${
              isDark ? 'bg-stone-900/80 border-orange-500/20' : 'bg-white/90 border-orange-200'
            } backdrop-blur-xl shadow-lg`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-orange-400 font-bold text-xs uppercase tracking-wider">
                <ListOrdered className="w-4 h-4" />
                <span>{editingProductId ? 'Edit Product Item' : 'List New Garment Product'}</span>
              </div>
              {editingProductId && (
                <button
                  onClick={() => {
                    setEditingProductId(null);
                    setProdName('');
                    setProdDesc('');
                  }}
                  className="text-xs text-stone-400 hover:text-white underline cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </div>
            <h2 className="text-lg font-black mb-4">Product Specifications & Source Bale Link</h2>

            <form onSubmit={handleSaveProduct} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-stone-300 font-semibold mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 90s Vintage Windbreaker with Patches"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">Product Category</label>
                <select
                  value={prodCategory}
                  onChange={(e) => setProdCategory(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-300'
                  }`}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">
                  Select Bale Category (Source)
                </label>
                <select
                  value={prodBale}
                  onChange={(e) => handleBaleSelectChange(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-300'
                  }`}
                >
                  {bales.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code} - {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">Available Quantity (Stock)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={prodQty}
                  onChange={(e) => setProdQty(e.target.value ? Number(e.target.value) : '')}
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">Selling Price (₱)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={prodSellingPrice}
                  onChange={(e) => setProdSellingPrice(e.target.value ? Number(e.target.value) : '')}
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">
                  Cost Price (Auto-filled from Bale)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={prodCostPrice}
                  onChange={(e) => setProdCostPrice(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-800/40 text-orange-300 font-bold"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">Size</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Small, Large, 9.5 US, Free Size"
                  value={prodSize}
                  onChange={(e) => setProdSize(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-300'
                  }`}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-stone-300 font-semibold mb-1">Product Image (URL or file)</label>
                <input
                  type="text"
                  placeholder="Image URL https://..."
                  value={prodImage}
                  onChange={(e) => setProdImage(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-300'
                  }`}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-stone-300 font-semibold mb-1">Product Link (IG / Showcase)</label>
                <input
                  type="text"
                  placeholder="https://www.instagram.com/..."
                  value={prodLink}
                  onChange={(e) => setProdLink(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-300'
                  }`}
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-stone-300 font-semibold mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Condition rating (e.g. 9/10), fabric material, wash notes..."
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-300'
                  }`}
                />
              </div>

              <div className="sm:col-span-4 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-orange-950/40 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{editingProductId ? 'Update Product Details' : 'List Product'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Product Database with Search */}
          <div
            className={`p-6 rounded-3xl border ${
              isDark ? 'bg-stone-900/80 border-orange-500/20' : 'bg-white/90 border-orange-200'
            } backdrop-blur-xl shadow-lg`}
          >
            {/* Search Button & Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-black">Product Inventory Masterlist</h2>
                <p className="text-xs text-stone-400">
                  Search and manage stock quantities, barcode tags, and pricing.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-72">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search product, barcode, size..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-stone-100 border-stone-300'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr
                    className={`border-b ${
                      isDark ? 'border-stone-800 text-stone-400' : 'border-stone-200 text-stone-500'
                    } uppercase text-[10px] tracking-wider`}
                  >
                    <th className="py-3 px-3 font-bold">Image & Barcode</th>
                    <th className="py-3 px-3 font-bold">Name & Size</th>
                    <th className="py-3 px-3 font-bold">Category</th>
                    <th className="py-3 px-3 font-bold">Source Bale</th>
                    <th className="py-3 px-3 font-bold">Selling Price</th>
                    <th className="py-3 px-3 font-bold">Stock Quantity</th>
                    <th className="py-3 px-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/50">
                  {filteredProductsTable.map((p) => {
                    const cat = categories.find((c) => c.id === p.categoryId);
                    const bale = bales.find((b) => b.id === p.baleId);

                    return (
                      <tr
                        key={p.id}
                        className={`hover:bg-orange-500/5 transition-colors ${
                          isDark ? 'text-stone-200' : 'text-stone-800'
                        }`}
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-10 h-10 rounded-lg object-cover bg-stone-800"
                            />
                            <span className="font-mono text-[11px] font-bold text-stone-400">
                              {p.barcode}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold block truncate max-w-xs">{p.name}</span>
                          <span className="text-[10px] text-stone-400">Size: {p.size}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className="inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold"
                            style={{
                              backgroundColor: `${cat?.color || '#ea580c'}22`,
                              color: cat?.color || '#ea580c',
                            }}
                          >
                            {cat?.name || 'Category'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-stone-300">
                          {bale?.code || 'None'}
                        </td>
                        <td className="py-3 px-3 font-black text-orange-400">
                          ₱{p.sellingPrice.toLocaleString()}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`font-black px-2 py-0.5 rounded-md ${
                              p.quantity <= 2
                                ? 'bg-amber-500/20 text-amber-400 animate-pulse'
                                : 'text-stone-200'
                            }`}
                          >
                            {p.quantity} pcs
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleStartEditProduct(p)}
                              className="p-1.5 rounded-lg hover:bg-stone-700/60 text-stone-400 hover:text-white transition-colors cursor-pointer"
                              title="Edit product"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete product ${p.name}?`)) {
                                  deleteProduct(p.id);
                                }
                              }}
                              className="p-1.5 rounded-lg hover:bg-rose-500/20 text-stone-400 hover:text-rose-400 transition-colors cursor-pointer"
                              title="Delete product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= SECTION 4: BALE SUPPLIERS ================= */}
      {currentTab === 'suppliers' && (currentUser.role === 'owner' || currentUser.role === 'staff') && (
        <div className="space-y-8">
          {/* Register Supplier Form */}
          <div
            className={`p-6 rounded-3xl border ${
              isDark ? 'bg-stone-900/80 border-orange-500/20' : 'bg-white/90 border-orange-200'
            } backdrop-blur-xl shadow-lg`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-orange-400 font-bold text-xs uppercase tracking-wider">
                <Truck className="w-4 h-4" />
                <span>{editingSupplierId ? 'Edit Sourcing Partner' : 'Register Sourcing Partner'}</span>
              </div>
              {editingSupplierId && (
                <button
                  type="button"
                  onClick={handleCancelEditSupplier}
                  className="text-xs text-stone-400 hover:text-white underline cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </div>
            <h2 className="text-lg font-black mb-4">
              {editingSupplierId ? 'Update Supplier Profile' : 'Bale Supplier & Wholesaler Registration'}
            </h2>

            <form onSubmit={handleRegisterSupplier} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-stone-300 font-semibold mb-1">Company / Supplier Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tokyo Vintage Surplus Wholesalers"
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">Contact Person</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bryan / Kenji"
                  value={supContactPerson}
                  onChange={(e) => setSupContactPerson(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="supplier@cargo.com"
                  value={supEmail}
                  onChange={(e) => setSupEmail(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">Contact Number</label>
                <input
                  type="tel"
                  required
                  placeholder="+63 917 882 1092"
                  value={supPhone}
                  onChange={(e) => setSupPhone(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-300'
                  }`}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-stone-300 font-semibold mb-1">Warehouse Address</label>
                <input
                  type="text"
                  required
                  placeholder="Port Pier / Warehouse hub location"
                  value={supAddress}
                  onChange={(e) => setSupAddress(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-300'
                  }`}
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-stone-300 font-semibold mb-1">Description / Cargo Notes</label>
                <input
                  type="text"
                  placeholder="Grade specializations, terms, shipping ports..."
                  value={supDesc}
                  onChange={(e) => setSupDesc(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-300'
                  }`}
                />
              </div>

              <div className="sm:col-span-3 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-orange-950/40 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{editingSupplierId ? 'Update Supplier' : 'Register Supplier'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Supplier KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {suppliers.map((s) => (
              <div
                key={s.id}
                className={`p-6 rounded-3xl border transition-all ${
                  isDark
                    ? 'bg-stone-900/80 border-orange-500/20 text-stone-100 hover:border-orange-500/40'
                    : 'bg-white border-orange-200 text-stone-900 shadow-md'
                } backdrop-blur-xl flex flex-col justify-between space-y-4`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">
                      Verified Sourcing Partner
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEditSupplier(s)}
                        className="p-1.5 rounded-lg hover:bg-stone-700/60 text-stone-400 hover:text-white transition-colors cursor-pointer"
                        title="Edit Supplier"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete supplier "${s.name}" from database?`)) {
                            deleteSupplier(s.id);
                          }
                        }}
                        className="p-1.5 rounded-lg hover:bg-rose-500/20 text-stone-400 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete Supplier"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-black text-lg text-white">{s.name}</h3>
                  <p className="text-xs text-stone-300 font-semibold mt-1">
                    Contact: {s.contactPerson}
                  </p>
                  <div className="text-xs text-stone-400 space-y-1 mt-2">
                    <p>📧 {s.email}</p>
                    <p>📞 {s.phone}</p>
                    <p className="truncate">📍 {s.address}</p>
                  </div>
                  <p className="text-xs text-stone-400 italic mt-3 line-clamp-2">
                    "{s.description}"
                  </p>
                </div>

                {/* Total Bales Sourced count requested by prompt */}
                <div className="pt-4 border-t border-stone-800/60 flex items-center justify-between">
                  <span className="text-xs text-stone-400">Bales Volume:</span>
                  <span className="text-xs font-black px-3 py-1 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    Total Bales Sourced: {s.totalBalesSourced} bales
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
