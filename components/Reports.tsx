
import React, { useMemo } from 'react';
import { Product, Sale, PaymentMethod } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileText, ClipboardList, TrendingUp, Download, Star, DollarSign, Package, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface ReportsProps {
  products: Product[];
  sales: Sale[];
  exchangeRate: number;
}

const Reports: React.FC<ReportsProps> = ({ products, sales, exchangeRate }) => {

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter(s => s.date.startsWith(today));
    const todayTotal = todaySales.reduce((acc, s) => acc + s.totalUsd, 0);
    
    const inventoryValue = products.reduce((acc, p) => acc + (p.priceUsd * p.stock), 0);
    const lowStockCount = products.filter(p => p.stock <= 5).length;
    
    return { todayTotal, inventoryValue, lowStockCount, todayCount: todaySales.length };
  }, [sales, products]);

  const generateSalesPDF = (period: 'daily' | 'monthly') => {
    const doc = new jsPDF();
    const now = new Date();
    
    let filteredSales = sales;
    let title = "";

    if (period === 'daily') {
      const todayStr = now.toISOString().split('T')[0];
      filteredSales = sales.filter(s => s.date.startsWith(todayStr));
      title = `Reporte del Día (${todayStr})`;
    } else {
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      filteredSales = sales.filter(s => {
        const d = new Date(s.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
      title = `Reporte del Mes (${currentMonth + 1}/${currentYear})`;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(124, 58, 237);
    doc.text("EM Cute - Reporte de Ventas", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(`${title} | Tasa: Bs. ${exchangeRate}`, 14, 28);

    const tableData = filteredSales.map(sale => [
      new Date(sale.date).toLocaleString(),
      sale.items.map(i => `${i.quantity}x ${i.name}`).join(', '),
      sale.paymentMethod,
      `$${sale.totalUsd.toFixed(2)}`,
      `Bs. ${(sale.totalUsd * sale.exchangeRate).toFixed(2)}`
    ]);

    autoTable(doc, {
      head: [['Fecha', 'Artículos', 'Pago', 'USD', 'Bs.']],
      body: tableData,
      startY: 35,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [124, 58, 237] },
      alternateRowStyles: { fillColor: [250, 245, 255] }
    });

    const totalUsd = filteredSales.reduce((acc, s) => acc + s.totalUsd, 0);
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setFontSize(12);
    doc.setTextColor(124, 58, 237);
    doc.text(`TOTAL VENDIDO: $${totalUsd.toFixed(2)}`, 14, finalY);

    doc.save(`reporte_${period}.pdf`);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="text-center space-y-2">
        <motion.h2 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-black text-brand-dark">Reportes EM Cute</motion.h2>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Tus estadísticas lindas en PDF</motion.p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
         <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-4 border-white shadow-xl shadow-purple-100/50 flex flex-col items-center text-center">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-brand-mint/20 text-emerald-500 rounded-2xl flex items-center justify-center mb-3 md:mb-4"><DollarSign size={20} /></div>
            <div className="text-2xl md:text-3xl font-black text-slate-800">${stats.todayTotal.toFixed(2)}</div>
            <div className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase mt-1 md:mt-2 tracking-widest">Ventas Hoy ({stats.todayCount})</div>
         </motion.div>

         <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-4 border-white shadow-xl shadow-purple-100/50 flex flex-col items-center text-center">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-brand-primary/10 text-brand-primary rounded-2xl flex items-center justify-center mb-3 md:mb-4"><Package size={20} /></div>
            <div className="text-2xl md:text-3xl font-black text-slate-800">${stats.inventoryValue.toFixed(2)}</div>
            <div className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase mt-1 md:mt-2 tracking-widest">Valor Inventario</div>
         </motion.div>

         <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 }} className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-4 border-white shadow-xl shadow-purple-100/50 flex flex-col items-center text-center sm:col-span-2 md:col-span-1">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-red-50 text-red-400 rounded-2xl flex items-center justify-center mb-3 md:mb-4"><AlertCircle size={20} /></div>
            <div className="text-2xl md:text-3xl font-black text-slate-800">{stats.lowStockCount}</div>
            <div className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase mt-1 md:mt-2 tracking-widest">Poco Stock</div>
         </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="bg-white p-8 rounded-[3rem] border border-white shadow-xl flex flex-col items-center text-center gap-6">
           <div className="w-20 h-20 bg-brand-yellow/20 text-yellow-600 rounded-[2rem] flex items-center justify-center group-hover:scale-110 transition-transform"><TrendingUp size={40} /></div>
           <div>
              <h3 className="text-xl font-black text-slate-800">Reporte de Ventas</h3>
              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-tight">Descarga el detalle por fecha</p>
           </div>
           <div className="w-full flex gap-3">
              <button onClick={() => generateSalesPDF('daily')} className="flex-1 py-4 bg-brand-bg hover:bg-brand-primary/10 text-brand-primary font-black rounded-3xl transition-all flex items-center justify-center gap-2 text-xs">
                 <Star size={16}/> HOY
              </button>
              <button onClick={() => generateSalesPDF('monthly')} className="flex-1 py-4 bg-brand-dark text-white font-black rounded-3xl shadow-lg border-2 border-brand-dark hover:bg-transparent hover:text-brand-dark transition-all flex items-center justify-center gap-2 text-xs">
                 <Download size={16}/> MES
              </button>
           </div>
        </motion.div>

        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="bg-white p-8 rounded-[3rem] border border-white shadow-xl flex flex-col items-center text-center gap-6">
           <div className="w-20 h-20 bg-brand-mint/20 text-emerald-500 rounded-[2rem] flex items-center justify-center group-hover:scale-110 transition-transform"><ClipboardList size={40} /></div>
           <div>
              <h3 className="text-xl font-black text-slate-800">Inventario Completo</h3>
              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-tight">Listado detallado con stock y precios</p>
           </div>
           <button onClick={() => generateSalesPDF('monthly')} className="w-full py-4 bg-brand-primary text-white font-black rounded-3xl shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-xs flex items-center justify-center gap-3">
              <FileText size={20} /> DESCARGAR LISTA COMPLETA
           </button>
        </motion.div>
      </div>
    </div>
  );
};

export default Reports;
