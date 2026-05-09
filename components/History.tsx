
import React, { useState, useMemo } from 'react';
import { Sale, Product } from '../types';
import { History as HistoryIcon, Search, Calendar, Trash2, ChevronRight, X, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HistoryProps {
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

const History: React.FC<HistoryProps> = ({ sales, setSales, products, setProducts }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const filteredSales = useMemo(() => {
    return sales.filter(s => 
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.clientName && s.clientName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [sales, searchTerm]);

  const handleDelete = async (sale: Sale) => {
    if (window.confirm('¿Anular esta venta? El stock será devuelto.')) {
      try {
        setProducts(prev => prev.map(p => {
          const item = sale.items.find(i => i.id === p.id);
          return item ? { ...p, stock: p.stock + item.quantity } : p;
        }));

        setSales(prev => prev.filter(s => s.id !== sale.id));
        setSelectedSale(null);
      } catch (err) {
        alert('Error al anular la venta.');
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-brand-dark flex items-center gap-3">
             Historial de Ventas <HistoryIcon className="text-brand-primary" size={32} />
          </h2>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Registros completos</p>
        </div>

        <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-white flex items-center gap-6 min-w-[200px]">
           <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary">
              <Calendar size={24} />
           </div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Ventas</p>
              <div className="text-2xl font-black text-brand-dark">{sales.length}</div>
           </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-[2.5rem] border-4 border-white shadow-sm flex flex-col sm:flex-row gap-4 items-center">
         <div className="relative flex-1 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-primary/40 w-5 h-5 group-focus-within:text-brand-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar por ID o Cliente..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="w-full pl-14 pr-8 py-4 rounded-[2rem] bg-brand-bg font-black text-slate-700 outline-none text-sm placeholder:text-slate-300" 
            />
         </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {filteredSales.length === 0 ? (
          <div className="col-span-full py-24 text-center opacity-30">
            <HistoryIcon size={64} className="mx-auto mb-4" />
            <p className="font-black uppercase tracking-widest text-xs">No hay ventas registradas</p>
          </div>
        ) : (
          filteredSales.map((sale, idx) => (
            <motion.div 
              layout
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              transition={{ delay: idx * 0.05 }}
              key={sale.id} 
              className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-8 border-4 border-white shadow-xl shadow-purple-50 group hover:shadow-purple-200 transition-all cursor-pointer relative"
              onClick={() => setSelectedSale(sale)}
            >
               <div className="flex justify-between items-start mb-4">
                  <div className="text-[8px] md:text-[10px] font-black text-slate-300 uppercase tracking-widest">#{sale.id.slice(0,8)}</div>
                  <div className={`px-2 md:px-3 py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest ${sale.paymentMethod.includes('EFECTIVO') ? 'bg-emerald-50 text-emerald-500' : 'bg-brand-primary/10 text-brand-primary'}`}>
                    {sale.paymentMethod}
                  </div>
               </div>

               <div className="text-xl md:text-2xl font-black text-slate-800 mb-1">${sale.totalUsd.toFixed(2)}</div>
               <div className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                 {new Date(sale.date).toLocaleString()}
               </div>

               <div className="mt-4 md:mt-6 flex items-center justify-between">
                  <div className="flex -space-x-2">
                     {sale.items.slice(0, 3).map((item, i) => (
                        <div key={i} className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-brand-bg border-2 border-white flex items-center justify-center text-[8px] md:text-[10px] font-black text-brand-primary">
                           {item.name.charAt(0)}
                        </div>
                     ))}
                     {sale.items.length > 3 && (
                        <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] md:text-[10px] font-black text-slate-400">
                           +{sale.items.length - 3}
                        </div>
                     )}
                  </div>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
               </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {selectedSale && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedSale(null)} className="absolute inset-0 bg-brand-dark/40 backdrop-blur-md" />
             <motion.div initial={{ scale: 0.9, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 40 }} className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-8 bg-brand-dark text-white flex justify-between items-center shrink-0">
                   <div>
                      <h3 className="text-xl font-black uppercase tracking-widest">Venta #{selectedSale.id.slice(0,8)}</h3>
                      <p className="text-[10px] text-purple-200 font-bold uppercase tracking-widest mt-1">{new Date(selectedSale.date).toLocaleString()}</p>
                   </div>
                   <button onClick={() => setSelectedSale(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"><X size={24} /></button>
                </div>

                <div className="p-8 overflow-y-auto space-y-8 flex-1">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-brand-bg/50 p-6 rounded-[2rem]">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Método</p>
                         <p className="text-sm font-black text-brand-dark">{selectedSale.paymentMethod}</p>
                      </div>
                      <div className="bg-brand-bg/50 p-6 rounded-[2rem]">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tasa</p>
                         <p className="text-sm font-black text-brand-dark">Bs. {selectedSale.exchangeRate}</p>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-brand-bg pb-2">Artículos</h4>
                      <div className="space-y-3">
                         {selectedSale.items.map((item, i) => (
                            <div key={i} className="flex items-center gap-4 group">
                               <div className="w-12 h-12 bg-brand-bg rounded-2xl flex items-center justify-center text-brand-primary shrink-0"><Package size={20} /></div>
                               <div className="flex-1">
                                  <p className="text-sm font-black text-slate-700 leading-tight">{item.name}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase">{item.quantity} unidades x ${item.priceUsd}</p>
                               </div>
                               <div className="text-sm font-black text-brand-dark">${(item.quantity * item.priceUsd).toFixed(2)}</div>
                            </div>
                         ))}
                      </div>
                   </div>

                   <div className="pt-6 border-t border-brand-bg space-y-2">
                       <div className="flex justify-between items-center text-slate-400">
                          <span className="text-[10px] font-black uppercase tracking-widest">Subtotal</span>
                          <span className="font-black">${selectedSale.totalUsd.toFixed(2)}</span>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-xs font-black uppercase tracking-widest text-brand-primary">Total Pagado</span>
                          <span className="text-3xl font-black text-brand-dark">${selectedSale.totalUsd.toFixed(2)}</span>
                       </div>
                       <div className="flex justify-between items-center pt-2 text-[10px] font-bold text-slate-400 uppercase">
                          <span>Equivalente</span>
                          <span>Bs. {(selectedSale.totalUsd * selectedSale.exchangeRate).toFixed(2)}</span>
                       </div>
                   </div>
                </div>

                <div className="p-8 bg-brand-bg/30 border-t border-brand-bg shrink-0">
                   <button 
                     onClick={() => handleDelete(selectedSale)}
                     className="w-full py-5 bg-red-50 text-red-500 font-black rounded-3xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-[10px] shadow-sm"
                   >
                     <Trash2 size={20} /> Anular Venta y Devolver Stock
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default History;
