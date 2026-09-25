import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { BarcodeLabelCard } from '../utils/barcode';
import {
  exportBarcodesToPdf,
  exportSingleBarcodeToPdf,
  BarcodePdfItem,
} from '../utils/exportBarcodePdf';
import {
  Barcode,
  Download,
  Search,
  RefreshCw,
  CheckCircle2,
  CheckSquare,
  Square,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

export const BarcodeGenerator: React.FC = () => {
  const { isDark, products, categories, updateProduct } = useStore();

  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [notification, setNotification] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [lastExportedFile, setLastExportedFile] = useState<{ name: string; count: number } | null>(null);

  // Set of selected product IDs to print/export (defaults to all products)
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(() => {
    return new Set(products.map((p) => p.id));
  });

  // Filtered products to display
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCat === 'all' || p.categoryId === selectedCat;
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCat, search]);

  // Toggle single item selection
  const toggleSelect = (id: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Select all visible / filtered items
  const handleSelectAllFiltered = () => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      filteredProducts.forEach((p) => next.add(p.id));
      return next;
    });
  };

  // Deselect all visible / filtered items
  const handleDeselectAllFiltered = () => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      filteredProducts.forEach((p) => next.delete(p.id));
      return next;
    });
  };

  // Select all products
  const handleSelectAll = () => {
    setSelectedProductIds(new Set(products.map((p) => p.id)));
  };

  // Deselect all products
  const handleDeselectAll = () => {
    setSelectedProductIds(new Set());
  };

  // Regenerate/Assign Barcodes to All Products
  const handleGenerateAllBarcodes = () => {
    products.forEach((p) => {
      if (!p.barcode || !p.barcode.startsWith('EXINS-')) {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        updateProduct(p.id, { barcode: `EXINS-${randomNum}` });
      }
    });
    setNotification('✓ All product barcode tags successfully synchronized!');
    setTimeout(() => setNotification(null), 3000);
  };

  // Export Selected Barcodes directly to PDF
  const handleExportSelectedPdf = async () => {
    const selectedItems: BarcodePdfItem[] = products
      .filter((p) => selectedProductIds.has(p.id))
      .map((p) => ({
        id: p.id,
        name: p.name,
        barcode: p.barcode,
        sellingPrice: p.sellingPrice,
        size: p.size,
      }));

    if (selectedItems.length === 0) {
      setNotification('⚠️ Please select at least one barcode to export.');
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    try {
      setIsExporting(true);
      setNotification(`⏳ Generating PDF with ${selectedItems.length} vector barcode stickers...`);
      
      const fileName = `EXINS-Barcodes-${new Date().toISOString().slice(0, 10)}.pdf`;
      await exportBarcodesToPdf(selectedItems, fileName);

      setLastExportedFile({ name: fileName, count: selectedItems.length });
      setNotification(`✓ Successfully downloaded ${fileName} (${selectedItems.length} stickers)!`);
      setTimeout(() => setNotification(null), 5000);
    } catch (err: any) {
      console.error('PDF export failed:', err);
      setNotification(`❌ Export failed: ${err?.message || 'Could not generate PDF'}`);
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  // Export single item to PDF
  const handleExportSinglePdf = async (p: typeof products[0]) => {
    try {
      setIsExporting(true);
      const safeName = p.name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 15);
      const fileName = `EXINS-Tag-${p.barcode || safeName}.pdf`;
      
      await exportSingleBarcodeToPdf(
        {
          id: p.id,
          name: p.name,
          barcode: p.barcode,
          sellingPrice: p.sellingPrice,
          size: p.size,
        },
        fileName
      );

      setNotification(`✓ Downloaded ${fileName} for ${p.name}!`);
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      console.error('Single PDF export failed:', err);
      setNotification(`❌ Export failed: ${err?.message || 'Could not generate PDF'}`);
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header & Export Control Bar (Hidden in Print) */}
      <div
        className={`no-print p-6 rounded-3xl border ${
          isDark ? 'bg-stone-900/80 border-orange-500/20' : 'bg-white/90 border-orange-200'
        } backdrop-blur-xl shadow-lg space-y-4`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-orange-400 font-bold text-xs uppercase tracking-wider mb-1">
              <Barcode className="w-4 h-4" />
              <span>Barcode Tagging & Thermal Label System</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">EXINS Standard Product Barcode Generator</h1>
            <p className="text-xs text-stone-400 mt-0.5">
              Exact label specification: Header: <strong>EXINS Jksur+</strong> | Product Name | Code: <strong>EXINS-XXXX</strong> | Price: <strong>₱Amount</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleGenerateAllBarcodes}
              className="px-3.5 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border border-stone-700"
            >
              <RefreshCw className="w-4 h-4 text-orange-400" />
              <span>Refresh Codes</span>
            </button>

            <button
              onClick={handleExportSelectedPdf}
              disabled={isExporting || selectedProductIds.size === 0}
              className="px-5 py-2.5 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-black shadow-lg shadow-orange-950/40 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Download className="w-4 h-4 text-white" />
              )}
              <span>
                {isExporting
                  ? 'Generating PDF...'
                  : `Export Selected (${selectedProductIds.size}) to PDF`}
              </span>
            </button>
          </div>
        </div>

        {notification && (
          <div
            className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all ${
              notification.startsWith('❌')
                ? 'bg-rose-500/20 border border-rose-500/30 text-rose-300'
                : notification.startsWith('⏳')
                ? 'bg-amber-500/20 border border-amber-500/30 text-amber-300'
                : 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
            }`}
          >
            {notification.startsWith('⏳') ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : notification.startsWith('❌') ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>{notification}</span>
          </div>
        )}

        {/* Selection & Filter Toolbar */}
        <div className="pt-3 border-t border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          {/* Quick Selection Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-stone-400">Select for Export:</span>
            <button
              onClick={handleSelectAll}
              className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold border border-stone-700 cursor-pointer flex items-center gap-1.5"
            >
              <CheckSquare className="w-3.5 h-3.5 text-orange-400" />
              <span>Select All ({products.length})</span>
            </button>
            <button
              onClick={handleDeselectAll}
              className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold border border-stone-700 cursor-pointer flex items-center gap-1.5"
            >
              <Square className="w-3.5 h-3.5 text-stone-400" />
              <span>Deselect All</span>
            </button>
            {selectedCat !== 'all' && (
              <button
                onClick={handleSelectAllFiltered}
                className="px-3 py-1.5 rounded-lg bg-orange-600/20 hover:bg-orange-600/30 text-orange-300 font-bold border border-orange-500/40 cursor-pointer"
              >
                Select Filtered ({filteredProducts.length})
              </button>
            )}
          </div>

          <div className="text-stone-400 font-semibold">
            <span className="text-orange-400 font-bold">{selectedProductIds.size}</span> of{' '}
            <span className="text-stone-200 font-bold">{products.length}</span> barcodes selected for PDF export
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search product name or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-9 pr-3 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-stone-100 border-stone-300'
              }`}
            />
          </div>

          <div>
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-stone-100 border-stone-300'
              }`}
            >
              <option value="all">All Apparel Categories ({products.length} products)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Barcode Labels Grid (Formatted for both screen preview and PDF export) */}
      <div className="printable-area">
        <div className="no-print mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold text-stone-400 px-1">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            <span>Check tags to include in your PDF sticker sheet export</span>
          </div>
          <div className="flex items-center gap-3 text-stone-400">
            <span className="bg-stone-800 text-stone-300 px-2.5 py-1 rounded-md border border-stone-700">
              A4 Sheet: 3 cols × 7 rows (21 labels / page)
            </span>
            <span className="hidden md:inline">Standard Tag: 58mm × 35mm</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts.map((p) => {
            const isSelected = selectedProductIds.has(p.id);

            return (
              <div
                key={p.id}
                className={`flex flex-col items-center p-3 rounded-2xl transition-all duration-200 ${
                  isSelected
                    ? 'border-2 border-orange-500 bg-orange-500/5 shadow-md shadow-orange-950/20'
                    : 'border border-stone-800/80 bg-stone-900/30 opacity-60 no-print'
                }`}
              >
                {/* Selector checkbox & single actions (Hidden in Print) */}
                <div className="no-print flex items-center justify-between w-full mb-2 px-1 gap-1">
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(p.id)}
                      className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 cursor-pointer accent-orange-600"
                    />
                    <span className={isSelected ? 'text-orange-400 font-bold' : 'text-stone-500'}>
                      {isSelected ? 'Selected' : 'Skip'}
                    </span>
                  </label>

                  <button
                    onClick={() => handleExportSinglePdf(p)}
                    disabled={isExporting}
                    className="text-[10px] text-amber-300 hover:text-white px-2 py-0.5 rounded bg-amber-950/60 hover:bg-amber-900 border border-amber-500/40 transition-colors flex items-center gap-1 cursor-pointer font-bold disabled:opacity-50"
                    title="Download this single barcode sticker as PDF"
                  >
                    <Download className="w-3 h-3 text-amber-400" />
                    <span>PDF</span>
                  </button>
                </div>

                {/* Printable Label Sticker Card (renders Product Name, Barcode & Price) */}
                <div className="w-full flex justify-center">
                  <BarcodeLabelCard
                    barcode={p.barcode}
                    price={p.sellingPrice}
                    productName={p.name}
                    size={p.size}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16 text-stone-400 no-print">
            <Barcode className="w-12 h-12 mx-auto text-stone-500 mb-2" />
            <p>No products match the selected criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};
