
import React, { useState, useMemo } from 'react';
import { Product, CartItem, Sale, PaymentMethod } from '../types';
import { ShoppingCart, Trash2, Search, DollarSign, PackageCheck, History, Sparkles, ScanBarcode, ImageIcon, RefreshCcw, ArrowRight, Wallet, Banknote, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ScannerModal from './ScannerModal';
import { generateId } from '../constants';

interface SalesProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  exchangeRate: number;
  onViewHistory?: () => void;
}

const Sales: React.FC<SalesProps> = ({ products, setProducts, sales, setSales, exchangeRate, onViewHistory }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.EFECTIVO_USD);
  const [creditInfo, setCreditInfo] = useState({ name: '', date: new Date().toISOString().split('T')[0] });
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Scanner
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showScanner, setShowScanner] = useState(false);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category))).filter(Boolean);
    return ['all', ...cats.sort((a, b) => a.localeCompare(b))];
  }, [products]);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    audio.play().catch(() => {});
    
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleScanResult = (result: string) => {
    setShowScanner(false);
    const found = products.find(p => p.barcode === result);
    
    if (found) {
      if (found.stock > 0) {
        addToCart(found);
      } else {
        alert(`¡${found.name} está agotado!`);
      }
    } else {
      setProductSearch(result);
    }
  };

  const totalUsd = useMemo(() => cart.reduce((acc, item) => acc + (item.priceUsd * item.quantity), 0), [cart]);
  const totalBs = useMemo(() => totalUsd * exchangeRate, [totalUsd, exchangeRate]);

  const todayTotalUsd = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return sales
      .filter(s => s.date.startsWith(today))
      .reduce((acc, s) => acc + s.totalUsd, 0);
  }, [sales]);

  const availableProducts = useMemo(() => {
    return products
      .filter(p => 
        p.stock > 0 && 
        (selectedCategory === 'all' || p.category === selectedCategory) &&
        (
          p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
          (p.barcode && p.barcode.includes(productSearch)) ||
          p.category.toLowerCase().includes(productSearch.toLowerCase())
        )
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, productSearch, selectedCategory]);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    if (paymentMethod === PaymentMethod.CREDITO && !creditInfo.name) {
      alert("Ingrese el nombre del cliente para el crédito.");
      return;
    }

    setIsProcessing(true);
    try {
      const newSale: Sale = {
        id: generateId(),
        date: new Date().toISOString(),
        items: cart.map(item => {
          const { image, ...rest } = item;
          return rest as CartItem;
        }),
        totalUsd,
        exchangeRate,
        paymentMethod,
        clientName: paymentMethod === PaymentMethod.CREDITO ? creditInfo.name : undefined,
        creditDate: paymentMethod === PaymentMethod.CREDITO ? creditInfo.date : undefined,
        creditAmount: paymentMethod === PaymentMethod.CREDITO ? totalUsd : undefined,
      };

      setProducts(prevProducts => prevProducts.map(p => {
        const inCart = cart.find(c => c.id === p.id);
        if (inCart) return { ...p, stock: p.stock - inCart.quantity };
        return p;
      }));

      setSales(prev => [newSale, ...prev]);
      setCart([]);
      setPaymentMethod(PaymentMethod.EFECTIVO_USD);
      setCreditInfo({ name: '', date: new Date().toISOString().split('T')[0] });
    } catch (error) {
      console.error("Error in checkout:", error);
      alert("Error al procesar la venta.");
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmDelete = async () => {
    if (!saleToDelete) return;
    try {
      setProducts(prevProducts => prevProducts.map(p => {
        const soldItem = saleToDelete.items.find(item => item.id === p.id);
        if (soldItem) return { ...p, stock: p.stock + soldItem.quantity };
        return p;
      }));

      setSales(prevSales => prevSales.filter(s => s.id !== saleToDelete.id));
      setSaleToDelete(null);
    } catch (e) {
      alert("Error al anular.");
    }
  };

  return (
    <div className="h-full space-y-4 md:space-y-6">
      <AnimatePresence>
        {showScanner && <ScannerModal onScan={handleScanResult} onClose={() => setShowScanner(false)} />}
        {saleToDelete && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSaleToDelete(null)} className="absolute inset-0 bg-brand-dark/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 max-w-sm w-full relative z-10 border-4 border-white shadow-2xl text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><History size={28} /></div>
              <h3 className="text-xl md:text-2xl font-black text-slate-800">¿Anular Venta?</h3>
              <p className="text-slate-500 font-bold mt-2 text-xs md:text-sm">Los productos volverán al stock.</p>
              <div className="flex gap-3 md:gap-4 mt-6 md:mt-8">
                <button onClick={() => setSaleToDelete(null)} className="flex-1 py-3 md:py-4 font-black text-slate-400 hover:bg-slate-50 rounded-2xl md:rounded-3xl">VOLVER</button>
                <button onClick={confirmDelete} className="flex-1 py-3 md:py-4 bg-red-400 text-white font-black rounded-2xl md:rounded-3xl shadow-lg shadow-red-100">ANULAR</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 h-full">
        {/* Left Col: Products */}
        <div className="lg:col-span-8 flex flex-col gap-4 md:gap-6 min-h-0">
          <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl border border-white flex flex-col flex-1 min-h-[400px] md:min-h-0 overflow-hidden">
            <div className="p-4 md:p-6 bg-white border-b border-brand-bg flex items-center gap-2 md:gap-4 sticky top-0 z-10">
               <div className="bg-brand-bg p-2 md:p-3 rounded-xl md:rounded-2xl text-brand-primary">
                  <Search size={20}/>
               </div>
               <input type="text" placeholder="¿Qué se llevan hoy?" value={productSearch} onChange={e => setProductSearch(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-base md:text-xl font-black text-slate-700 placeholder:text-slate-300" />
               <div className="flex flex-col items-end px-2 md:px-4 border-l border-brand-bg whitespace-nowrap">
                  <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Hoy</span>
                  <span className="text-sm md:text-lg font-black text-brand-dark">${todayTotalUsd.toFixed(2)}</span>
               </div>
               <button onClick={() => setShowScanner(true)} className="p-2 md:p-3 bg-brand-primary/10 text-brand-primary rounded-xl md:rounded-2xl hover:bg-brand-primary/20 transition-all"><ScanBarcode size={20} /></button>
            </div>

            {/* Category Selector */}
            <div className="px-4 py-4 bg-white border-b border-brand-bg flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth">
               {categories.map(cat => (
                 <button 
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-5 py-2.5 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border-2
                    ${selectedCategory === cat 
                      ? 'bg-brand-primary border-brand-primary text-white shadow-lg shadow-brand-primary/30 scale-105 active:scale-95' 
                      : 'bg-brand-bg border-transparent text-slate-500 hover:border-brand-primary/20 hover:bg-brand-bg/80 active:scale-95'
                    }
                  `}
                 >
                   {cat === 'all' ? (
                     <div className="flex items-center gap-2">
                       <Sparkles size={14} />
                       TODOS
                     </div>
                   ) : cat}
                 </button>
               ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-brand-bg/30">
               <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                  <AnimatePresence mode="popLayout">
                    {availableProducts.map(product => (
                      <motion.button 
                        key={product.id} layout initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                        onClick={() => addToCart(product)}
                        className="bg-white rounded-2xl md:rounded-3xl border-2 border-transparent hover:border-brand-primary/50 transition-all text-left shadow-sm hover:shadow-xl hover:shadow-purple-100 group flex flex-col overflow-hidden"
                      >
                         <div className="h-24 md:h-28 bg-brand-bg flex items-center justify-center overflow-hidden border-b border-purple-50">
                            {product.image ? <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /> : <ImageIcon className="text-purple-200" size={24} />}
                         </div>
                         <div className="p-3 md:p-4 flex flex-col flex-1 justify-between gap-1 md:gap-2">
                            <div>
                               <div className="text-[9px] md:text-[11px] font-black uppercase tracking-widest text-brand-secondary mb-0.5">{product.category}</div>
                               <div className="text-xs md:text-sm font-black text-slate-700 line-clamp-2 leading-tight group-hover:text-brand-primary transition-colors">{product.name}</div>
                            </div>
                            <div className="flex justify-between items-center mt-1 md:mt-2">
                               <div className="text-sm md:text-lg font-black text-brand-dark">${product.priceUsd}</div>
                               <div className={`text-[8px] md:text-[10px] font-black px-1.5 md:py-0.5 rounded-full ${product.stock < 5 ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-400'}`}>{product.stock} un</div>
                            </div>
                         </div>
                      </motion.button>
                    ))}
                  </AnimatePresence>
                  {availableProducts.length === 0 && (
                    <div className="col-span-full py-12 md:py-24 text-center text-slate-300">
                       <PackageCheck size={48} className="mx-auto mb-4 opacity-20" />
                       <p className="font-black uppercase tracking-widest text-[10px]">
                         {productSearch 
                           ? `No se encontró "${productSearch}"` 
                           : selectedCategory !== 'all' 
                             ? `No hay productos en ${selectedCategory}` 
                             : 'No hay productos'}
                       </p>
                    </div>
                  )}
               </div>
            </div>
          </div>

          {/* Recent Sales History */}
          <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border border-white h-auto md:h-[200px] flex flex-col overflow-hidden">
             <div className="px-5 md:px-8 py-3 md:py-4 border-b border-brand-bg flex items-center justify-between">
                <h3 className="text-xs md:text-sm font-black text-brand-dark flex items-center gap-2 uppercase tracking-widest leading-none"><History size={16} /> Historial</h3>
                <button onClick={onViewHistory} className="text-[9px] md:text-[10px] font-black text-brand-primary hover:underline uppercase tracking-widest">Ver Todo</button>
             </div>
             <div className="flex-1 overflow-x-auto overflow-y-hidden">
                <div className="flex items-center gap-3 md:gap-4 p-4 md:p-6 h-full">
                   {sales.slice(0, 5).map(sale => (
                      <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} key={sale.id} className="min-w-[140px] md:min-w-[200px] h-full bg-brand-bg p-3 md:p-4 rounded-2xl md:rounded-3xl flex flex-col justify-between group relative overflow-hidden">
                         <div className="flex items-center justify-between mb-1 md:mb-2">
                            <span className="text-[8px] md:text-[10px] font-black text-slate-400">#{sale.id.slice(0,5)}</span>
                            <button onClick={() => setSaleToDelete(sale)} className="opacity-100 md:opacity-0 group-hover:opacity-100 p-1.5 md:p-2 text-red-400 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={12} /></button>
                         </div>
                         <div>
                            <div className="text-xs md:text-sm font-black text-slate-800">${sale.totalUsd.toFixed(2)}</div>
                            <div className="text-[8px] md:text-[10px] font-bold text-brand-secondary capitalize">{sale.paymentMethod}</div>
                         </div>
                      </motion.div>
                   ))}
                </div>
             </div>
          </div>
        </div>

        {/* Right Col: Cart */}
        <div className="lg:col-span-4 bg-white rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl border-4 border-white flex flex-col overflow-hidden min-h-[400px] lg:min-h-0">
           <div className="p-6 md:p-8 bg-brand-dark text-white flex justify-between items-center">
              <div className="flex items-center gap-2 md:gap-3">
                 <ShoppingCart className="text-brand-yellow" size={24} />
                 <h2 className="text-base md:text-xl font-black uppercase tracking-widest">Pedido</h2>
              </div>
              <span className="bg-white/20 px-3 md:px-4 py-1 rounded-full font-black text-[10px] md:text-xs">{cart.length}</span>
           </div>

           <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 md:space-y-3 bg-brand-bg/20">
              <AnimatePresence mode="popLayout">
                {cart.map(item => (
                   <motion.div layout initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} key={item.id} className="bg-white p-3 md:p-4 rounded-2xl md:rounded-3xl border border-transparent shadow-sm flex items-center justify-between group">
                      <div className="flex-1 min-w-0">
                         <div className="text-xs md:text-sm font-black text-slate-800 truncate">{item.name}</div>
                         <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] md:text-[10px] font-black bg-purple-50 text-brand-primary px-1.5 md:px-2 py-0.5 rounded-lg">{item.quantity}</span>
                            <span className="text-[9px] md:text-[10px] font-bold text-slate-400 whitespace-nowrap">x ${item.priceUsd}</span>
                         </div>
                      </div>
                      <div className="flex items-center gap-3 md:gap-4 ml-2">
                         <div className="text-xs md:text-sm font-black text-slate-700">${(item.quantity * item.priceUsd).toFixed(2)}</div>
                         <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-300 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
                      </div>
                   </motion.div>
                ))}
              </AnimatePresence>
              {cart.length === 0 && (
                <div className="h-full py-12 flex flex-col items-center justify-center text-slate-300 gap-3">
                   <Sparkles size={32} className="opacity-10" />
                   <p className="text-[8px] md:text-[10px] font-black tracking-[0.3em] uppercase">Vacio</p>
                </div>
              )}
           </div>

           <div className="p-6 md:p-8 space-y-4 md:space-y-6 bg-white border-t border-brand-bg">
              <div className="space-y-3 md:space-y-4">
                 <div>
                    <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Método de Pago</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                       {Object.values(PaymentMethod).map(m => (
                         <button key={m} onClick={() => setPaymentMethod(m)} className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all ${paymentMethod === m ? 'bg-brand-primary border-brand-primary text-white shadow-lg' : 'bg-brand-bg border-transparent text-slate-400 hover:bg-purple-100'}`}>
                            {m === PaymentMethod.EFECTIVO_USD ? <Wallet size={14} /> : m === PaymentMethod.EFECTIVO_BS ? <Banknote size={14} /> : m === PaymentMethod.PAGO_MOVIL ? <RefreshCcw size={14} /> : <CreditCard size={14} />}
                            <span className="text-[8px] md:text-[9px] font-black leading-tight text-center">{m.split(' ')[0]}</span>
                         </button>
                       ))}
                    </div>
                 </div>

                 <AnimatePresence>
                   {paymentMethod === PaymentMethod.CREDITO && (
                     <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-2 overflow-hidden">
                        <input type="text" placeholder="Nombre Cliente" value={creditInfo.name} onChange={e => setCreditInfo({...creditInfo, name: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-brand-bg font-black text-slate-700 outline-none text-xs" />
                        <input type="date" value={creditInfo.date} onChange={e => setCreditInfo({...creditInfo, date: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-brand-bg font-black text-slate-700 outline-none text-xs" />
                     </motion.div>
                   )}
                 </AnimatePresence>
              </div>

              <div className="bg-brand-bg/50 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] space-y-1.5">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total USD</span>
                    <span className="text-xl md:text-3xl font-black text-brand-dark">${totalUsd.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-center pt-1.5 border-t border-white">
                    <span className="text-[8px] md:text-[10px] font-black text-brand-mint uppercase tracking-widest">Bs.</span>
                    <span className="text-xs md:text-sm font-black text-slate-600">Bs. {totalBs.toFixed(2)}</span>
                 </div>
              </div>

              <button 
                onClick={handleCheckout} disabled={cart.length === 0 || isProcessing}
                className="w-full py-4 md:py-5 bg-brand-primary text-white font-black rounded-2xl md:rounded-[2rem] shadow-xl shadow-brand-primary/20 transition-all text-[10px] md:text-sm flex items-center justify-center gap-2 md:gap-3 disabled:bg-slate-200"
              >
                {isProcessing ? <RefreshCcw className="animate-spin" size={18} /> : <DollarSign size={18} />}
                {isProcessing ? 'PROCESANDO...' : 'REALIZAR VENTA'}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Sales;
