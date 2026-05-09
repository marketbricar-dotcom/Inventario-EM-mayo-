import React, { useState, useEffect, useRef } from 'react';
import { Package, ShoppingCart, BarChart3, Download, Upload, X, WalletCards, RefreshCcw, Sparkles, DollarSign, Info, History as HistoryIcon, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Inventory from './components/Inventory';
import Sales from './components/Sales';
import Reports from './components/Reports';
import Credits from './components/Credits';
import History from './components/History';
import { Product, Sale } from './types';
import { INITIAL_RATE } from './constants';

const App: React.FC = () => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'inventory' | 'sales' | 'reports' | 'credits' | 'history'>('inventory');
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Application Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number>(INITIAL_RATE);

  // Initialize Data
  useEffect(() => {
    loadDataFromLocalStorage();
    setIsLoading(false);
  }, []);

  const loadDataFromLocalStorage = () => {
    const savedProducts = localStorage.getItem('em_products');
    const savedSales = localStorage.getItem('em_sales');
    const savedRate = localStorage.getItem('em_rate');

    if (savedProducts) setProducts(JSON.parse(savedProducts));
    if (savedSales) setSales(JSON.parse(savedSales));
    if (savedRate) setExchangeRate(parseFloat(savedRate));
  };

  // Sync state changes to localStorage
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('em_rate', exchangeRate.toString());
    }
  }, [exchangeRate, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('em_products', JSON.stringify(products));
    }
  }, [products, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('em_sales', JSON.stringify(sales));
    }
  }, [sales, isLoading]);

  const handleExportData = () => {
    const dataStr = JSON.stringify({ products, sales, exchangeRate, date: new Date().toISOString() }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tienda_cute_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed.products && Array.isArray(parsed.products)) {
          if (window.confirm("¿Restaurar respaldo? Se borrarán los datos actuales.")) {
            setProducts(parsed.products);
            setSales(parsed.sales || []);
            setExchangeRate(parsed.exchangeRate || INITIAL_RATE);
            setShowSyncModal(false);
          }
        }
      } catch (err) { alert("Archivo inválido."); }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg select-none pb-24 md:pb-8">
      {/* Dynamic Header */}
      <header className="bg-brand-dark text-white shadow-xl shadow-brand-primary/20 sticky top-0 z-50 rounded-b-[1.5rem] md:rounded-b-[2.5rem]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
           <div className="flex items-center gap-3 md:gap-4">
              <motion.div 
                whileHover={{ rotate: 10, scale: 1.1 }}
                className="bg-white p-1.5 md:p-2 rounded-xl md:rounded-2xl shadow-lg shadow-purple-900/30 border-2 border-white/40"
              >
                 <Package size={20} className="text-brand-primary md:w-6 md:h-6" />
              </motion.div>
              <div>
                 <h1 className="text-lg md:text-2xl font-black tracking-tight leading-none uppercase">EM Tienda</h1>
                 <p className="text-[8px] md:text-[10px] text-purple-200 font-bold uppercase tracking-[0.2em] mt-0.5">Online Cute</p>
              </div>
           </div>

           <div className="flex items-center gap-2 md:gap-4">
              {/* Tasa Widget */}
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-2xl border border-white/10 backdrop-blur-md">
                 <span className="hidden md:inline text-[10px] font-bold text-purple-100 uppercase tracking-widest">Tasa:</span>
                 <div className="flex items-center gap-1 font-black text-brand-yellow">
                    <span className="text-xs">Bs.</span>
                    <input 
                       type="number" 
                       value={exchangeRate} 
                       onChange={e => setExchangeRate(parseFloat(e.target.value))}
                       className="w-14 md:w-20 bg-transparent border-none text-center outline-none focus:ring-0"
                    />
                 </div>
              </div>

              {/* Settings button */}
              <button 
                onClick={() => setShowSyncModal(true)}
                className="p-3 bg-brand-primary text-white rounded-2xl transition-all shadow-lg active:scale-95"
              >
                <Settings size={20} />
              </button>
           </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              key="loader"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32"
            >
               <RefreshCcw className="text-brand-primary animate-spin mb-6" size={64} />
               <p className="text-brand-secondary font-black animate-pulse text-lg uppercase tracking-widest">Abriendo Tienda...</p>
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "circOut" }}
            >
              {activeTab === 'inventory' && <Inventory products={products} setProducts={setProducts} exchangeRate={exchangeRate} />}
              {activeTab === 'sales' && <Sales products={products} setProducts={setProducts} sales={sales} setSales={setSales} exchangeRate={exchangeRate} onViewHistory={() => setActiveTab('history')} />}
              {activeTab === 'reports' && <Reports products={products} sales={sales} exchangeRate={exchangeRate} />}
              {activeTab === 'credits' && <Credits sales={sales} setSales={setSales} exchangeRate={exchangeRate} />}
              {activeTab === 'history' && <History sales={sales} setSales={setSales} products={products} setProducts={setProducts} />}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Bar for Mobile & Desktop Tabs */}
      <nav className="fixed bottom-0 left-0 right-0 p-3 bg-brand-dark/95 backdrop-blur-xl border-t border-white/10 z-[100] md:relative md:bg-transparent md:border-none md:p-0 md:mb-12">
        <div className="max-w-md mx-auto bg-brand-dark md:bg-white p-2 rounded-[2rem] md:rounded-full shadow-2xl md:shadow-xl md:border md:border-brand-border flex justify-around md:gap-2">
           <NavTab active={activeTab === 'sales'} icon={ShoppingCart} label="Caja" onClick={() => setActiveTab('sales')} />
           <NavTab active={activeTab === 'inventory'} icon={Package} label="Depósito" onClick={() => setActiveTab('inventory')} />
           <NavTab active={activeTab === 'reports'} icon={BarChart3} label="Dash" onClick={() => setActiveTab('reports')} />
           <NavTab active={activeTab === 'history'} icon={HistoryIcon} label="Historial" onClick={() => setActiveTab('history')} />
           <NavTab active={activeTab === 'credits'} icon={WalletCards} label="Fiados" onClick={() => setActiveTab('credits')} />
        </div>
      </nav>

      {/* Settings / Sync Modal */}
      <AnimatePresence>
        {showSyncModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setShowSyncModal(false)}
               className="absolute inset-0 bg-brand-dark/40 backdrop-blur-md"
             />
             <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 40 }}
               className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl relative overflow-hidden p-8 border-4 border-white"
             >
                <div className="flex justify-between items-start mb-8">
                   <div className="flex items-center gap-4 text-brand-dark">
                      <div className="w-14 h-14 bg-brand-bg rounded-3xl flex items-center justify-center text-brand-primary">
                         <Settings size={32} />
                      </div>
                      <div>
                         <h3 className="text-2xl font-black">Ajustes</h3>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Backup & Restore</p>
                      </div>
                   </div>
                   <button onClick={() => setShowSyncModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                     <X size={24} />
                   </button>
                </div>

                <div className="space-y-4">
                   <div className="p-5 bg-brand-bg rounded-[2rem] border border-brand-border flex gap-4">
                      <Info size={24} className="text-brand-primary shrink-0" />
                      <p className="text-xs font-bold text-brand-secondary leading-relaxed">
                        Tus datos se guardan localmente en este dispositivo. Usa las opciones de abajo para crear respaldos y evitar perder tu información.
                      </p>
                   </div>

                   <div className="grid grid-cols-2 gap-4 pt-4">
                      <button onClick={handleExportData} className="flex flex-col items-center gap-3 p-6 bg-brand-bg hover:bg-purple-100 rounded-[2.5rem] border border-brand-border transition-all group">
                         <Download size={32} className="text-brand-primary group-hover:scale-110 transition-transform" />
                         <span className="text-[10px] font-black text-brand-dark uppercase tracking-widest">Respaldo</span>
                      </button>
                      <label className="flex flex-col items-center gap-3 p-6 bg-brand-bg hover:bg-purple-100 rounded-[2.5rem] border border-brand-border transition-all group cursor-pointer">
                         <Upload size={32} className="text-brand-secondary group-hover:scale-110 transition-transform" />
                         <span className="text-[10px] font-black text-brand-dark uppercase tracking-widest">Restaurar</span>
                         <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
                      </label>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const NavTab: React.FC<{ active: boolean, icon: any, label: string, onClick: () => void }> = ({ active, icon: Icon, label, onClick }) => (
  <button 
    onClick={onClick} 
    className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-3 px-2 md:px-6 py-2 md:py-4 rounded-2xl md:rounded-full transition-all group flex-1 md:flex-none
      ${active ? 'bg-brand-primary text-white shadow-xl shadow-brand-primary/20 scale-105' : 'text-slate-400 hover:text-brand-primary md:hover:bg-purple-50'}
    `}
  >
    <Icon size={18} className={active ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'} />
    <span className={`text-[8px] md:text-sm font-black tracking-tight uppercase ${active ? 'block' : 'hidden md:block'}`}>{label}</span>
  </button>
);

export default App;
