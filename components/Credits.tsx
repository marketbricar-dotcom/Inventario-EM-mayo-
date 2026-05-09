import React, { useState, useMemo } from 'react';
import { Sale, PaymentMethod } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { WalletCards, Search, CheckCircle2, FileDown, CalendarClock, User, Star, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CreditsProps {
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  exchangeRate: number;
}

const Credits: React.FC<CreditsProps> = ({ sales, setSales, exchangeRate }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter only unpaid credit sales
  const pendingCredits = useMemo(() => {
    return sales.filter(sale => 
      sale.paymentMethod === PaymentMethod.CREDITO && 
      !sale.isPaid &&
      (sale.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Oldest first
  }, [sales, searchTerm]);

  const totalPendingUsd = useMemo(() => pendingCredits.reduce((acc, curr) => acc + curr.totalUsd, 0), [pendingCredits]);

  const handleMarkAsPaid = async (saleId: string, clientName: string) => {
    if (window.confirm(`¿Confirmas que ${clientName} ha pagado su deuda?`)) {
      setSales(prev => prev.map(s => s.id === saleId ? { ...s, isPaid: true } : s));
    }
  };

  const generateCreditsPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(236, 72, 153);
    doc.text("Cuentas por Cobrar EM Cute", 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(`Generado: ${new Date().toLocaleString()} | Tasa: Bs. ${exchangeRate}`, 14, 28);

    const tableData = pendingCredits.map(sale => [
      sale.clientName || 'Cliente',
      new Date(sale.creditDate || sale.date).toLocaleDateString(),
      sale.items.map(i => `${i.quantity}x ${i.name}`).join(', '),
      `$${sale.totalUsd.toFixed(2)}`,
      `Bs. ${(sale.totalUsd * exchangeRate).toFixed(2)}`
    ]);

    autoTable(doc, {
      head: [['Cliente', 'Fecha', 'Detalle', 'USD', 'Bs.']],
      body: tableData,
      startY: 35,
      headStyles: { fillColor: [236, 72, 153] }
    });

    doc.save(`creditos_${new Date().getTime()}.pdf`);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
           <motion.h2 initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="text-3xl font-black text-brand-dark flex items-center gap-3">
             Cuentas por Cobrar <WalletCards className="text-brand-pink" size={32} />
           </motion.h2>
           <motion.p initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Gestión de deudas</motion.p>
        </div>

        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-[2.5rem] border-4 border-white shadow-xl shadow-pink-100/50 flex items-center gap-6">
           <div className="w-14 h-14 bg-brand-pink/20 text-brand-pink rounded-3xl flex items-center justify-center"><CalendarClock size={28} /></div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Pendiente</p>
              <div className="text-3xl font-black text-brand-dark">${totalPendingUsd.toFixed(2)}</div>
           </div>
        </motion.div>
      </div>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="bg-white p-4 rounded-[2.5rem] border-4 border-white shadow-sm flex flex-col sm:flex-row gap-4 items-center">
         <div className="relative flex-1 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-pink/40 w-5 h-5 group-focus-within:text-brand-pink transition-colors" />
            <input type="text" placeholder="Buscar cliente..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-14 pr-8 py-4 rounded-[2rem] bg-brand-bg font-black text-slate-700 outline-none text-sm placeholder:text-slate-300" />
         </div>
         <button onClick={generateCreditsPDF} disabled={pendingCredits.length === 0} className="px-8 py-4 bg-brand-pink text-white font-black rounded-[2rem] shadow-lg shadow-pink-100 flex items-center gap-3 hover:scale-105 active:scale-95 transition-all text-xs disabled:opacity-30">
            <FileDown size={20} /> REPORTE PDF
         </button>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <AnimatePresence mode="popLayout">
          {pendingCredits.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-12 md:py-24 flex flex-col items-center justify-center text-center opacity-30 gap-6">
               <div className="w-20 md:w-24 h-20 md:h-24 bg-white rounded-full flex items-center justify-center shadow-lg"><Star size={40} className="text-brand-mint fill-brand-mint" /></div>
               <p className="font-black uppercase tracking-[0.3em] text-[10px] md:text-xs">¡Estamos al día!</p>
            </motion.div>
          ) : (
            pendingCredits.map((sale, idx) => (
              <motion.div layout initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: idx * 0.05 }} key={sale.id} className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-8 border-4 border-white shadow-xl shadow-purple-50 group hover:shadow-purple-200 transition-all">
                 <div className="flex justify-between items-start mb-4 md:mb-6">
                    <div className="flex items-center gap-3 md:gap-4">
                       <div className="w-10 h-10 md:w-12 md:h-12 bg-brand-bg rounded-xl md:rounded-2xl flex items-center justify-center text-brand-pink"><User size={20} /></div>
                       <div>
                          <h4 className="font-black text-slate-800 text-base md:text-lg leading-tight truncate max-w-[150px]">{sale.clientName || 'Cliente'}</h4>
                          <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{new Date(sale.creditDate || sale.date).toLocaleDateString()}</p>
                       </div>
                    </div>
                 </div>

                 <div className="text-2xl md:text-3xl font-black text-brand-dark mb-4 md:mb-6">${sale.totalUsd.toFixed(2)}</div>

                 <div className="bg-brand-bg/50 p-4 md:p-5 rounded-[1.5rem] md:rounded-[2rem] mb-6 md:mb-8 space-y-2">
                    <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Artículos</p>
                    {sale.items.map((item, i) => (
                       <div key={i} className="flex justify-between text-[11px] font-bold text-slate-600">
                          <span className="line-clamp-1">{item.name}</span>
                          <span className="text-brand-primary whitespace-nowrap">{item.quantity}un</span>
                       </div>
                    ))}
                 </div>

                 <button onClick={() => handleMarkAsPaid(sale.id, sale.clientName || 'este cliente')} className="w-full py-4 md:py-5 rounded-[1.5rem] md:rounded-[2rem] bg-brand-mint text-emerald-800 font-black text-[10px] md:text-xs shadow-xl shadow-emerald-100 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 md:gap-3">
                    <CheckCircle2 size={18} /> COBRAR DEUDA <ArrowRight size={14} className="hidden md:block" />
                 </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Credits;
