import React, { useState, useEffect, useMemo } from 'react';

/**
 * Ghi chú dành cho môi trường Local:
 * 1. Chạy lệnh: npm install @supabase/supabase-js
 * 2. Mở comment dòng import dưới đây
 */
// import { createClient } from '@supabase/supabase-js';

import { 
  LayoutDashboard, 
  BarChart3, 
  Users, 
  Plus, 
  TrendingUp, 
  ChevronRight, 
  Signal, 
  Wifi, 
  Battery, 
  Trash2, 
  Clock,
  CheckCircle2,
  Search,
  CreditCard,
  Settings,
  ChevronLeft,
  History,
  Wallet,
  ArrowDownCircle,
  PlusCircle,
  AlertCircle,
  ArrowUpRight,
  Info,
  CalendarDays,
  ArrowUp,
  ArrowDown,
  LineChart,
  Store,
  LayoutList,
  ChevronLeftCircle,
  ChevronRightCircle,
  DatabaseBackup,
  Coins
} from 'lucide-react';

// ----------------------------------------------------------------------
// 1. CẤU HÌNH KẾT NỐI (FIX LỖI IMPORT.META VÀ RESOLVE MODULE)
// ----------------------------------------------------------------------
// Hàm lấy biến môi trường an toàn để không làm sập trình biên dịch preview
const getSafeEnv = (key) => {
  try {
    // Sử dụng cách truy cập gián tiếp để tránh lỗi esbuild khi gặp import.meta
    const env = (import.meta as any).env;
    return env ? env[key] : '';
  } catch (e) {
    return '';
  }
};

const supabaseUrl = getSafeEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getSafeEnv('VITE_SUPABASE_ANON_KEY');

// Khởi tạo Supabase Client an toàn
let supabase = null;
const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && typeof createClient !== 'undefined');

if (isSupabaseConfigured) {
  try {
    // @ts-ignore
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (e) {
    console.warn("Lỗi khởi tạo Supabase:", e);
  }
}
// ----------------------------------------------------------------------

// --- UTILS ---
const getLocalISODate = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatNumberInput = (val) => {
  if (!val) return '';
  const numbers = val.toString().replace(/\D/g, '');
  if (!numbers) return '';
  return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const formatVND = (amount) => {
  if (!amount || isNaN(amount)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', { 
    style: 'decimal',
    minimumFractionDigits: amount % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1
  }).format(amount) + ' ₫';
};

const formatDate = (dateString) => {
  if (!dateString) return '--/--/----';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const getDaysInMonth = (month, year) => {
  const date = new Date(year, month, 1);
  const days = [];
  while (date.getMonth() === month) {
    days.push(getLocalISODate(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [shops, setShops] = useState([]);
  const [providers, setProviders] = useState([]);
  const [adsLogs, setAdsLogs] = useState([]);
  const [providerPayments, setProviderPayments] = useState([]); 
  const [activeTab, setActiveTab] = useState('home');
  const [selectedProviderId, setSelectedProviderId] = useState(null); 
  
  const [showAddLogModal, setShowAddLogModal] = useState(false);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showShopModal, setShowShopModal] = useState(false);
  
  const [editingLog, setEditingLog] = useState(null);
  const [editingProvider, setEditingProvider] = useState(null);
  const [editingShop, setEditingShop] = useState(null);
  
  const [amountInput, setAmountInput] = useState('');
  const [paymentAmountInput, setPaymentAmountInput] = useState('');
  
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(getLocalISODate());
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!supabase) {
      localStorage.setItem('m_shops', JSON.stringify(shops));
      localStorage.setItem('m_logs', JSON.stringify(adsLogs));
      localStorage.setItem('m_providers', JSON.stringify(providers));
      localStorage.setItem('m_p_payments', JSON.stringify(providerPayments));
    }
  }, [shops, adsLogs, providers, providerPayments]);

  useEffect(() => {
    const fetchData = async () => {
      if (!supabase) {
        const savedShops = JSON.parse(localStorage.getItem('m_shops') || '[]');
        const savedLogs = JSON.parse(localStorage.getItem('m_logs') || '[]');
        const savedProviders = JSON.parse(localStorage.getItem('m_providers') || '[]');
        const savedPayments = JSON.parse(localStorage.getItem('m_p_payments') || '[]');

        if (savedShops.length > 0 || savedLogs.length > 0 || savedProviders.length > 0) {
          setShops(savedShops);
          setAdsLogs(savedLogs);
          setProviders(savedProviders);
          setProviderPayments(savedPayments);
        } else {
          const initProviders = [{ id: 'p1', name: 'BC Agency', rentalFee: 4.5 }];
          const initShops = [
            { id: 's1', name: 'Thời Trang GenZ', percent: 10.5, providerId: 'p1' },
            { id: 's2', name: 'Mỹ Phẩm Luxury', percent: 8.0, providerId: 'p1' }
          ];
          setProviders(initProviders);
          setShops(initShops);
        }
        setIsLoading(false);
        return;
      }

      try {
        const [
          { data: pData },
          { data: sData },
          { data: lData },
          { data: ppData }
        ] = await Promise.all([
          supabase.from('providers').select('*'),
          supabase.from('shops').select('*'),
          supabase.from('ads_logs').select('*'),
          supabase.from('provider_payments').select('*')
        ]);

        if (pData) setProviders(pData.map(p => ({ ...p, rentalFee: Number(p.rental_fee) || 0 })));
        if (sData) setShops(sData.map(s => ({ ...s, percent: Number(s.percent) || 0, providerId: s.provider_id })));
        if (lData) setAdsLogs(lData.map(l => ({ 
          ...l, 
          amount: Number(l.amount) || 0,
          shopId: l.shop_id, 
          feePercent: Number(l.fee_percent) || 0, 
          providerId: l.provider_id, 
          providerRentalFee: Number(l.provider_rental_fee) || 0 
        })));
        if (ppData) setProviderPayments(ppData.map(pp => ({ 
          ...pp, 
          amount: Number(pp.amount) || 0,
          providerId: pp.provider_id 
        })));
      } catch (error) {
        console.error("Lỗi fetch dữ liệu:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isSupabaseConfigured]);

  const currentMonthLogs = useMemo(() => {
    return adsLogs.filter(log => {
      const d = new Date(log.date);
      return d.getMonth() === viewMonth && d.getFullYear() === viewYear;
    });
  }, [adsLogs, viewMonth, viewYear]);

  const totals = useMemo(() => {
    let spend = 0, paidSpend = 0, revenue = 0, pendingRevenue = 0, totalRentalFeePaid = 0;
    
    currentMonthLogs.forEach(log => {
      spend += log.amount;
      const shop = shops.find(s => s.id === log.shopId);
      const fallbackProvider = providers.find(p => p.id === shop?.providerId);
      const feeP = log.feePercent !== undefined ? log.feePercent : (shop?.percent || 0);
      const logRevenue = (log.amount + (log.amount * feeP / 100));
      
      if (log.status === 'unpaid') {
        pendingRevenue += logRevenue;
      } else {
        revenue += logRevenue;
        paidSpend += log.amount;
      }
      
      const pFee = log.providerRentalFee !== undefined ? log.providerRentalFee : (fallbackProvider?.rentalFee || 0);
      if (log.providerId || fallbackProvider) {
        totalRentalFeePaid += (log.amount * pFee / 100);
      }
    });

    return { spend, revenue, pendingRevenue, profit: revenue - spend - totalRentalFeePaid, totalFeesCollected: revenue - paidSpend };
  }, [currentMonthLogs, shops, providers]);

  const selectedDayTotals = useMemo(() => {
    const logs = adsLogs.filter(l => l.date === selectedDate);
    let spend = 0, fees = 0, total = 0;
    
    logs.forEach(log => {
      const shop = shops.find(s => s.id === log.shopId);
      const feeP = log.feePercent ?? (shop?.percent || 0);
      const logFee = (log.amount * feeP / 100);
      
      spend += log.amount;
      fees += logFee;
      total += (log.amount + logFee);
    });

    return { spend, fees, total, count: logs.length };
  }, [adsLogs, selectedDate, shops]);

  const statsByDay = useMemo(() => {
    const monthDays = getDaysInMonth(viewMonth, viewYear);
    return monthDays.map(dateStr => {
      const logsForDay = adsLogs.filter(log => log.date === dateStr);
      let dayRev = 0, daySpend = 0, dayRental = 0;
      logsForDay.forEach(log => {
        const shop = shops.find(s => s.id === log.shopId);
        const fallbackProvider = providers.find(p => p.id === shop?.providerId);
        const feeP = log.feePercent !== undefined ? log.feePercent : (shop?.percent || 0);
        daySpend += log.amount;
        if (log.status !== 'unpaid') dayRev += (log.amount + (log.amount * feeP / 100));
        const pFee = log.providerRentalFee !== undefined ? log.providerRentalFee : (fallbackProvider?.rentalFee || 0);
        if (log.providerId || fallbackProvider) dayRental += (log.amount * pFee / 100);
      });
      return { date: dateStr, day: parseInt(dateStr.split('-')[2]), profit: dayRev - daySpend - dayRental };
    });
  }, [adsLogs, shops, providers, viewMonth, viewYear]);

  const maxAbsProfit = useMemo(() => {
    const max = Math.max(...statsByDay.map(d => Math.abs(d.profit)), 1);
    return max;
  }, [statsByDay]);

  const providerSummary = useMemo(() => {
    return providers.map(p => {
      const relatedShops = shops.filter(s => s.providerId === p.id);
      const relatedShopIds = relatedShops.map(s => s.id);
      const history = adsLogs.filter(log => log.providerId === p.id || (!log.providerId && relatedShopIds.includes(log.shopId)))
        .map(log => ({ ...log, shopName: shops.find(s => s.id === log.shopId)?.name || 'Shop cũ' }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      const totalSpend = history.reduce((sum, log) => sum + log.amount, 0);
      const totalRentalFee = history.reduce((sum, log) => sum + (log.amount * (log.providerRentalFee ?? p.rentalFee) / 100), 0);
      const paidAmount = providerPayments.filter(pay => pay.providerId === p.id).reduce((sum, pay) => sum + pay.amount, 0);
      
      return { ...p, totalSpend, totalRentalFee, totalPayable: totalSpend + totalRentalFee, paidAmount, debt: (totalSpend + totalRentalFee) - paidAmount, history, paymentsHistory: providerPayments.filter(pay => pay.providerId === p.id).sort((a, b) => new Date(b.date) - new Date(a.date)) };
    });
  }, [providers, shops, adsLogs, providerPayments]);

  // --- ACTIONS ---
  const toggleLogStatus = async (e, log) => {
    e.stopPropagation();
    const newStatus = log.status === 'unpaid' ? 'paid' : 'unpaid';
    setAdsLogs(adsLogs.map(l => l.id === log.id ? { ...l, status: newStatus } : l));
    if (supabase) {
      await supabase.from('ads_logs').update({ status: newStatus }).eq('id', log.id);
    }
  };

  const handleSaveLog = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const amount = parseFloat(fd.get('amount').toString().replace(/\D/g, '') || 0);
    const shopId = fd.get('shopId');
    const shop = shops.find(s => s.id === shopId);
    const provider = providers.find(p => p.id === shop?.providerId);
    
    const logData = { 
      shop_id: shopId, amount, date: fd.get('date'), status: fd.get('isPaid') === 'on' ? 'paid' : 'unpaid',
      fee_percent: shop?.percent || 0, provider_id: provider?.id || null, provider_rental_fee: provider?.rentalFee || 0
    };

    if (supabase) {
      if (editingLog) {
        const { data } = await supabase.from('ads_logs').update(logData).eq('id', editingLog.id).select();
        if (data) setAdsLogs(adsLogs.map(l => l.id === editingLog.id ? { ...data[0], shopId: data[0].shop_id, feePercent: data[0].fee_percent } : l));
      } else {
        const { data } = await supabase.from('ads_logs').insert([logData]).select();
        if (data) setAdsLogs([{ ...data[0], shopId: data[0].shop_id, feePercent: data[0].fee_percent }, ...adsLogs]);
      }
    } else {
      const localData = { ...logData, id: editingLog?.id || Date.now().toString(), shopId: logData.shop_id, feePercent: logData.fee_percent };
      setAdsLogs(editingLog ? adsLogs.map(l => l.id === editingLog.id ? localData : l) : [localData, ...adsLogs]);
    }
    setShowAddLogModal(false); setEditingLog(null); setAmountInput('');
  };

  const handleDeleteLog = async (id) => {
    if (supabase) await supabase.from('ads_logs').delete().eq('id', id);
    setAdsLogs(adsLogs.filter(l => l.id !== id));
    setShowAddLogModal(false);
  };

  const handleSaveShop = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const shopData = { name: fd.get('name'), percent: parseFloat(fd.get('percent')), provider_id: fd.get('providerId') };
    if (supabase) {
      const { data } = editingShop ? await supabase.from('shops').update(shopData).eq('id', editingShop.id).select() : await supabase.from('shops').insert([shopData]).select();
      if (data) setShops(editingShop ? shops.map(s => s.id === editingShop.id ? { ...data[0], providerId: data[0].provider_id } : s) : [...shops, { ...data[0], providerId: data[0].provider_id }]);
    } else {
      const local = { ...shopData, id: editingShop?.id || 's' + Date.now(), providerId: shopData.provider_id };
      setShops(editingShop ? shops.map(s => s.id === editingShop.id ? local : s) : [...shops, local]);
    }
    setShowShopModal(false); setEditingShop(null);
  };

  const handleSaveProvider = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const pData = { name: fd.get('name'), rental_fee: parseFloat(fd.get('rentalFee')) };
    if (supabase) {
      const { data } = editingProvider ? await supabase.from('providers').update(pData).eq('id', editingProvider.id).select() : await supabase.from('providers').insert([pData]).select();
      if (data) setProviders(editingProvider ? providers.map(p => p.id === editingProvider.id ? { ...data[0], rentalFee: data[0].rental_fee } : p) : [...providers, { ...data[0], rentalFee: data[0].rental_fee }]);
    } else {
      const local = { ...pData, id: editingProvider?.id || 'p' + Date.now(), rentalFee: pData.rental_fee };
      setProviders(editingProvider ? providers.map(p => p.id === editingProvider.id ? local : p) : [...providers, local]);
    }
    setShowProviderModal(false); setEditingProvider(null);
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payData = { provider_id: selectedProviderId, amount: parseFloat(fd.get('amount').toString().replace(/\D/g, '')), date: fd.get('date'), note: fd.get('note') };
    if (supabase) {
      const { data } = await supabase.from('provider_payments').insert([payData]).select();
      if (data) setProviderPayments([...providerPayments, { ...data[0], amount: Number(data[0].amount), providerId: data[0].provider_id }]);
    } else {
      setProviderPayments([...providerPayments, { ...payData, id: Date.now().toString(), providerId: payData.provider_id }]);
    }
    setShowPaymentModal(false); setPaymentAmountInput('');
  };

  // --- RENDERING VIEWS ---

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const HomeView = () => (
    <div className="space-y-5 pb-24">
      {/* Dashboard Thống kê tháng */}
      <div className="bg-white p-2 rounded-[32px] border border-slate-100 shadow-sm space-y-2">
        <div className="bg-gradient-to-br from-indigo-600 via-blue-700 to-slate-900 rounded-[26px] p-6 text-white relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-blue-100/60 text-[10px] font-bold uppercase tracking-widest mb-1">Lợi nhuận ròng T.{viewMonth + 1}/{viewYear}</p>
            <h2 className="text-4xl font-black mb-4 tracking-tight">{formatVND(totals.profit)}</h2>
            <div className="flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl text-[10px] font-bold backdrop-blur-sm">
                <TrendingUp size={12}/> Phí đã thu: +{formatVND(totals.totalFeesCollected)}
              </div>
              {totals.pendingRevenue > 0 && (
                <div className="inline-flex items-center gap-1.5 bg-rose-500/20 text-rose-100 px-3 py-1.5 rounded-xl text-[10px] font-bold backdrop-blur-sm border border-rose-400/30">
                  <AlertCircle size={12}/> Chờ thu: {formatVND(totals.pendingRevenue)}
                </div>
              )}
            </div>
          </div>
          <div className="absolute top-0 right-0 p-4 opacity-10"><AlertCircle size={80}/></div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-50/80 p-4 rounded-[22px] text-center border border-slate-100/50">
            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Tổng đã thu tháng</p>
            <p className="text-sm font-black text-slate-900">{formatVND(totals.revenue)}</p>
          </div>
          <div className="bg-slate-50/80 p-4 rounded-[22px] text-center border border-slate-100/50">
            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Ads gốc tháng</p>
            <p className="text-sm font-black text-rose-500">{formatVND(totals.spend)}</p>
          </div>
        </div>
      </div>

      {/* Lịch và Nhật ký ngày */}
      <div>
        <div className="flex justify-between items-center bg-white p-1.5 rounded-[24px] border border-slate-100 shadow-sm mb-4 w-full">
          {[...Array(7)].map((_, i) => {
            const d = new Date(); d.setDate(d.getDate() - (6 - i));
            const dateStr = getLocalISODate(d);
            const isSelected = dateStr === selectedDate;
            return (
              <button key={i} onClick={() => setSelectedDate(dateStr)} className={`flex flex-col items-center justify-center gap-1 p-2 rounded-[18px] transition-all flex-1 ${isSelected ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>
                <span className="text-[9px] font-black uppercase">{d.toLocaleDateString('vi-VN', { weekday: 'short' })}</span>
                <span className="text-sm font-black">{d.getDate()}</span>
              </button>
            );
          })}
        </div>

        {/* Tổng hợp ngày chọn */}
        <div className="bg-white rounded-[28px] p-5 border border-slate-100 shadow-sm mb-5 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
             <Coins size={16} className="text-amber-500" />
             <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Tổng hợp ngày {selectedDate.split('-')[2]}/{selectedDate.split('-')[1]}</h3>
          </div>
          <div className="grid grid-cols-3 gap-4 relative z-10">
            <div><p className="text-[8px] font-black text-slate-400 uppercase mb-1">Chi gốc</p><p className="text-[13px] font-black text-slate-700">{formatVND(selectedDayTotals.spend)}</p></div>
            <div className="border-l border-slate-100 pl-4"><p className="text-[8px] font-black text-slate-400 uppercase mb-1">Phí thu</p><p className="text-[13px] font-black text-indigo-600">+{formatVND(selectedDayTotals.fees)}</p></div>
            <div className="border-l border-slate-100 pl-4"><p className="text-[8px] font-black text-blue-600 uppercase mb-1">Tổng thu</p><p className="text-[13px] font-black text-blue-600">{formatVND(selectedDayTotals.total)}</p></div>
          </div>
          <div className="absolute -bottom-2 -right-2 opacity-[0.03] text-slate-900"><Coins size={80}/></div>
        </div>

        <div className="space-y-3">
          {adsLogs.filter(l => l.date === selectedDate).length > 0 ? adsLogs.filter(l => l.date === selectedDate).map(log => {
             const shop = shops.find(s => s.id === log.shopId);
             const isPaid = log.status !== 'unpaid';
             const feeP = log.feePercent ?? (shop?.percent || 0);
             const clientFee = log.amount * feeP / 100;
             return (
               <div key={log.id} onClick={() => { setEditingLog(log); setAmountInput(formatNumberInput(log.amount)); setShowAddLogModal(true); }} className="bg-white p-4 rounded-[24px] border border-slate-50 shadow-sm active:scale-[0.98] transition-transform">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={(e) => toggleLogStatus(e, log)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isPaid ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-300'}`}>
                        <CheckCircle2 size={20} />
                      </button>
                      <div>
                        <p className="font-black text-slate-800 text-[13px]">{shop?.name || 'Shop đã xóa'}</p>
                        <p className={`text-[9px] font-bold uppercase ${isPaid ? 'text-emerald-500' : 'text-slate-400'}`}>{isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'} • Phí: {feeP}%</p>
                      </div>
                    </div>
                  </div>
                  <div className={`grid grid-cols-3 gap-2 p-3 rounded-2xl ${isPaid ? 'bg-slate-50/50' : 'bg-rose-50/50'}`}>
                    <div><p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Tiền gốc</p><p className="text-xs font-bold text-slate-700">{formatVND(log.amount)}</p></div>
                    <div className="border-l border-slate-100 pl-2"><p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Phí</p><p className="text-xs font-bold text-indigo-600">+{formatVND(clientFee)}</p></div>
                    <div className="border-l border-slate-100 pl-2"><p className={`text-[8px] font-black uppercase mb-0.5 ${isPaid ? 'text-blue-600' : 'text-rose-500'}`}>{isPaid ? 'Tổng thu' : 'Chờ thu'}</p><p className={`text-xs font-black ${isPaid ? 'text-blue-600' : 'text-rose-500'}`}>{formatVND(log.amount + clientFee)}</p></div>
                  </div>
               </div>
             );
          }) : <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-slate-100"><Info size={24} className="mx-auto text-slate-200 mb-2"/><p className="text-slate-300 font-bold text-[10px] uppercase">Trống ngày {selectedDate.split('-')[2]}/{selectedDate.split('-')[1]}</p></div>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 select-none text-slate-900">
      <div className="relative mx-auto border-[8px] border-slate-800 rounded-[60px] h-[844px] w-[390px] bg-white shadow-2xl overflow-hidden flex flex-col">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-8 bg-black rounded-b-3xl z-[60] mt-1"></div>
        <div className="h-11 flex justify-between items-center px-8 z-50 text-black font-bold text-[12px] pt-2">
          <span>{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
          <div className="flex items-center gap-1.5"><Signal size={12}/><Wifi size={12}/><Battery size={14}/></div>
        </div>
        
        <div className="flex-1 overflow-y-auto bg-slate-50 px-6 pt-6 relative no-scrollbar flex flex-col">
          <header className="flex justify-between items-center mb-6 shrink-0">
            <div>
              <h1 className="text-xl font-black tracking-tighter italic uppercase">Ads Finance</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[8px] font-bold text-blue-600 uppercase tracking-widest">Management v0.0</p>
                {!supabase && <span className="flex items-center gap-1 bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter shadow-sm border border-amber-200"><DatabaseBackup size={10}/> Local Mode</span>}
              </div>
            </div>
            <button onClick={() => setActiveTab('stats')} className={`w-10 h-10 rounded-full border flex items-center justify-center shadow-sm transition-all ${activeTab === 'stats' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-100 text-slate-400'}`}><BarChart3 size={18}/></button>
          </header>

          <div className="flex-1">
            {activeTab === 'home' && <HomeView />}
            {activeTab === 'shops' && (
              <div className="space-y-4 pb-24">
                <div className="flex justify-between items-center"><h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cửa hàng</h3><button onClick={() => { setEditingShop(null); setShowShopModal(true); }} className="text-blue-600 font-black text-[10px] uppercase flex items-center gap-1"><PlusCircle size={14}/> Thêm Shop</button></div>
                {shops.map(s => <div key={s.id} onClick={() => {setEditingShop(s); setShowShopModal(true);}} className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex justify-between items-center active:scale-[0.98] transition-transform"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><Store size={24}/></div><div><h4 className="font-black text-slate-900 text-sm">{s.name}</h4><span className="text-[8px] px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded font-black uppercase">Phí: {s.percent}%</span></div></div><ChevronRight size={18} className="text-slate-300"/></div>)}
              </div>
            )}
            {activeTab === 'providers' && (
              selectedProviderId ? (
                <div className="space-y-6 pb-24">
                  <button onClick={() => setSelectedProviderId(null)} className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase"><ChevronLeft size={16}/> Quay lại</button>
                  {(() => {
                    const p = providerSummary.find(x => x.id === selectedProviderId);
                    return p && (
                      <div className="space-y-4">
                        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
                           <h2 className="text-xl font-black text-slate-900 mb-1">{p.name}</h2>
                           <p className="text-2xl font-black text-rose-500 tracking-tight">{formatVND(p.debt)}</p>
                           <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Tổng nợ chưa thanh toán</p>
                        </div>
                        <button onClick={() => { setPaymentAmountInput(''); setShowPaymentModal(true); }} className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl text-[10px] uppercase shadow-lg shadow-emerald-100 active:scale-95 transition-all">Ghi nhận trả tiền</button>
                        
                        <div className="bg-white p-5 rounded-[32px] border border-slate-100">
                          <h3 className="text-[10px] font-black text-slate-900 uppercase mb-4">Lịch sử thanh toán</h3>
                          <div className="space-y-3">
                            {p.paymentsHistory.map(h => (
                              <div key={h.id} className="flex justify-between items-center bg-slate-50/50 p-3 rounded-2xl">
                                <div><p className="text-[10px] font-bold">{formatDate(h.date)}</p><p className="text-[8px] text-slate-400">{h.note || 'Thanh toán'}</p></div>
                                <p className="text-xs font-black text-emerald-600">-{formatVND(h.amount)}</p>
                              </div>
                            ))}
                            {p.paymentsHistory.length === 0 && <p className="text-[9px] text-slate-300 text-center py-4">Chưa có giao dịch</p>}
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              ) : (
                <div className="space-y-4 pb-24">
                  <div className="flex justify-between items-center"><h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Providers</h3><button onClick={() => {setEditingProvider(null); setShowProviderModal(true);}} className="text-blue-600 font-black text-[10px] uppercase flex items-center gap-1"><PlusCircle size={14}/> Thêm mới</button></div>
                  {providerSummary.map(p => <div key={p.id} onClick={() => setSelectedProviderId(p.id)} className="bg-white rounded-[32px] border border-slate-100 p-5 shadow-sm flex justify-between items-center active:scale-[0.98] transition-transform"><div><h4 className="font-black text-slate-900">{p.name}</h4><span className="text-[8px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded font-black uppercase">Phí thuê: {p.rentalFee}%</span></div><div className="text-right"><p className="text-[8px] font-black text-rose-500 uppercase">Dư nợ</p><p className="text-lg font-black text-rose-500">{formatVND(p.debt)}</p></div></div>)}
                </div>
              )
            )}
            {activeTab === 'stats' && (
              <div className="space-y-4 pb-24">
                <div className="flex items-center justify-between bg-white px-5 py-4 rounded-[28px] border border-slate-100 shadow-sm"><button onClick={() => setViewMonth(viewMonth === 0 ? 11 : viewMonth - 1)} className="p-2"><ChevronLeftCircle size={24} className="text-slate-200"/></button><h2 className="text-sm font-black uppercase tracking-tight">Tháng {viewMonth + 1}/{viewYear}</h2><button onClick={() => setViewMonth(viewMonth === 11 ? 0 : viewMonth + 1)} className="p-2"><ChevronRightCircle size={24} className="text-slate-200"/></button></div>
                <div className="bg-white p-5 rounded-[32px] border border-slate-100 h-[450px] flex flex-col shadow-sm">
                   <h3 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Lợi nhuận theo ngày</h3>
                   <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
                      {[...statsByDay].reverse().map(d => (
                        <div key={d.date} className="space-y-1.5">
                          <div className="flex justify-between text-[9px] font-black uppercase">
                            <span className="text-slate-400">{d.day}/{viewMonth+1}</span>
                            <span className={d.profit > 0 ? 'text-slate-700' : 'text-rose-500'}>{formatVND(d.profit)}</span>
                          </div>
                          <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100/50">
                             <div className={`h-full rounded-full transition-all duration-700 ${d.profit > 0 ? 'bg-blue-500' : 'bg-rose-500'}`} style={{width: `${(Math.abs(d.profit)/maxAbsProfit)*100}%`}}></div>
                          </div>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            )}
          </div>

          {activeTab === 'home' && <button onClick={() => { setEditingLog(null); setAmountInput(''); setShowAddLogModal(true); }} className="absolute bottom-[100px] right-6 w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-xl flex items-center justify-center z-40 border-4 border-white active:scale-90 transition-all"><Plus size={28} strokeWidth={3}/></button>}
        </div>

        <nav className="bg-white border-t border-slate-100 px-6 py-5 pb-8 flex justify-around items-center rounded-t-[32px] shadow-lg shrink-0">
          <button onClick={() => { setActiveTab('home'); setSelectedProviderId(null); }} className={`flex flex-col items-center gap-1.5 ${activeTab === 'home' ? 'text-blue-600' : 'text-slate-300'}`}><LayoutDashboard size={22}/><span className="text-[8px] font-black uppercase tracking-tighter">Giao dịch</span></button>
          <button onClick={() => { setActiveTab('shops'); setSelectedProviderId(null); }} className={`flex flex-col items-center gap-1.5 ${activeTab === 'shops' ? 'text-blue-600' : 'text-slate-300'}`}><Store size={22}/><span className="text-[8px] font-black uppercase tracking-tighter">Shop</span></button>
          <button onClick={() => { setActiveTab('providers'); setSelectedProviderId(null); }} className={`flex flex-col items-center gap-1.5 ${activeTab === 'providers' ? 'text-blue-600' : 'text-slate-300'}`}><Users size={22}/><span className="text-[8px] font-black uppercase tracking-tighter">Công nợ</span></button>
        </nav>

        {/* --- MODALS --- */}
        {showAddLogModal && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] z-[100] flex items-end">
            <div className="bg-white w-full rounded-t-[40px] p-6 pb-10 animate-in slide-in-from-bottom duration-300 shadow-2xl">
              <div className="w-10 h-1 bg-slate-100 rounded-full mx-auto mb-6"></div>
              <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-black text-slate-900 uppercase italic">{editingLog ? 'Sửa chi tiêu' : 'Nhập chi tiêu'}</h3>{editingLog && <button type="button" onClick={() => handleDeleteLog(editingLog.id)} className="text-rose-500"><Trash2 size={20}/></button>}</div>
              <form onSubmit={handleSaveLog} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-2xl border"><label className="block text-[8px] font-black text-slate-400 uppercase">Cửa hàng</label><select name="shopId" required defaultValue={editingLog?.shopId || ""} className="w-full bg-transparent border-none font-bold text-xs p-0 focus:ring-0">{shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                  <div className="bg-slate-50 p-3 rounded-2xl border"><label className="block text-[8px] font-black text-slate-400 uppercase">Ngày</label><input type="date" name="date" required defaultValue={editingLog?.date || selectedDate} className="w-full bg-transparent border-none font-bold text-xs p-0 focus:ring-0"/></div>
                </div>
                <div className="bg-slate-50 p-5 rounded-3xl border text-center"><label className="block text-[8px] font-black text-slate-400 uppercase mb-2">Số tiền gốc (Spend)</label><input name="amount" type="text" inputMode="numeric" required value={amountInput} onChange={(e) => setAmountInput(formatNumberInput(e.target.value))} className="w-full bg-transparent border-none text-center font-black text-3xl text-blue-600 focus:ring-0 p-0" placeholder="0"/></div>
                <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center border"><div><label className="block text-[10px] font-black uppercase">Đã thu tiền khách</label></div><input type="checkbox" name="isPaid" defaultChecked={editingLog ? editingLog.status !== 'unpaid' : true} className="w-5 h-5 accent-blue-600"/></div>
                <div className="flex gap-3"><button type="button" onClick={() => setShowAddLogModal(false)} className="flex-1 bg-slate-100 text-slate-500 font-black py-4 rounded-2xl text-[10px] uppercase">Hủy</button><button type="submit" className="flex-[2] bg-blue-600 text-white font-black py-4 rounded-2xl text-[10px] uppercase shadow-lg shadow-blue-200">Lưu giao dịch</button></div>
              </form>
            </div>
          </div>
        )}

        {showShopModal && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] z-[100] flex items-end">
            <div className="bg-white w-full rounded-t-[40px] p-6 pb-10 animate-in slide-in-from-bottom duration-300">
              <div className="w-10 h-1 bg-slate-100 rounded-full mx-auto mb-6"></div>
              <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-black text-slate-900 uppercase italic">{editingShop ? 'Sửa Shop' : 'Thêm Shop'}</h3>{editingShop && <button type="button" onClick={() => handleDeleteShop(editingShop.id)} className="text-rose-500"><Trash2 size={20}/></button>}</div>
              <form onSubmit={handleSaveShop} className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border"><label className="block text-[8px] font-black text-slate-400 uppercase">Tên Shop</label><input name="name" required defaultValue={editingShop?.name || ""} className="w-full bg-transparent border-none font-bold focus:ring-0 p-0"/></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-4 rounded-2xl border"><label className="block text-[8px] font-black text-slate-400 uppercase">Phí thu khách (%)</label><input name="percent" type="number" step="0.1" required defaultValue={editingShop?.percent || ""} className="w-full bg-transparent border-none font-black text-xl text-blue-600 focus:ring-0 p-0"/></div>
                  <div className="bg-slate-50 p-4 rounded-2xl border"><label className="block text-[8px] font-black text-slate-400 uppercase">Provider</label><select name="providerId" required defaultValue={editingShop?.providerId || ""} className="w-full bg-transparent border-none font-bold text-xs p-0 focus:ring-0">{providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                </div>
                <div className="flex gap-3"><button type="button" onClick={() => setShowShopModal(false)} className="flex-1 bg-slate-100 text-slate-500 font-black py-4 rounded-2xl text-[10px] uppercase">Hủy</button><button type="submit" className="flex-[2] bg-blue-600 text-white font-black py-4 rounded-2xl text-[10px] uppercase shadow-lg">Lưu Shop</button></div>
              </form>
            </div>
          </div>
        )}

        {showProviderModal && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] z-[100] flex items-end">
            <div className="bg-white w-full rounded-t-[40px] p-6 pb-10 animate-in slide-in-from-bottom duration-300">
              <div className="w-10 h-1 bg-slate-100 rounded-full mx-auto mb-6"></div>
              <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-black text-slate-900 uppercase italic">{editingProvider ? 'Sửa Provider' : 'Thêm Provider'}</h3>{editingProvider && <button type="button" onClick={() => handleDeleteProvider(editingProvider.id)} className="text-rose-500"><Trash2 size={20}/></button>}</div>
              <form onSubmit={handleSaveProvider} className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border"><label className="block text-[8px] font-black text-slate-400 uppercase">Tên Provider</label><input name="name" required defaultValue={editingProvider?.name || ""} className="w-full bg-transparent border-none font-bold focus:ring-0 p-0"/></div>
                <div className="bg-slate-50 p-4 rounded-2xl border"><label className="block text-[8px] font-black text-slate-400 uppercase">Phí thuê (%)</label><input name="rentalFee" type="number" step="0.1" required defaultValue={editingProvider?.rentalFee || ""} className="w-full bg-transparent border-none font-black text-xl text-blue-600 focus:ring-0 p-0"/></div>
                <div className="flex gap-3"><button type="button" onClick={() => setShowProviderModal(false)} className="flex-1 bg-slate-100 text-slate-500 font-black py-4 rounded-2xl text-[10px] uppercase">Hủy</button><button type="submit" className="flex-[2] bg-indigo-600 text-white font-black py-4 rounded-2xl text-[10px] uppercase shadow-lg">Lưu Provider</button></div>
              </form>
            </div>
          </div>
        )}

        {showPaymentModal && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] z-[120] flex items-center justify-center p-6">
            <div className="bg-white w-full rounded-[32px] p-6 shadow-2xl scale-in-center">
              <h3 className="text-lg font-black uppercase italic mb-6">Thanh toán nợ</h3>
              <form onSubmit={handleAddPayment} className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border"><label className="block text-[8px] font-black uppercase">Số tiền</label><input name="amount" type="text" inputMode="numeric" required value={paymentAmountInput} onChange={(e) => setPaymentAmountInput(formatNumberInput(e.target.value))} className="w-full bg-transparent border-none font-black text-xl text-emerald-600 p-0 focus:ring-0" placeholder="0"/></div>
                <div className="bg-slate-50 p-4 rounded-2xl border"><label className="block text-[8px] font-black uppercase">Ngày</label><input type="date" name="date" required defaultValue={getLocalISODate()} className="w-full bg-transparent border-none font-bold text-sm p-0 focus:ring-0"/></div>
                <div className="bg-slate-50 p-4 rounded-2xl border"><label className="block text-[8px] font-black uppercase">Ghi chú</label><input name="note" className="w-full bg-transparent border-none font-bold text-sm p-0 focus:ring-0" placeholder="Chuyển khoản..."/></div>
                <button type="submit" className="w-full py-4 font-black text-[10px] uppercase text-white bg-emerald-600 rounded-2xl shadow-lg active:scale-95 transition-all">Xác nhận</button>
                <button type="button" onClick={() => setShowPaymentModal(false)} className="w-full text-[10px] font-bold text-slate-400 uppercase mt-2">Hủy</button>
              </form>
            </div>
          </div>
        )}
      </div>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes slideInFromBottom { 0% { transform: translateY(100%); } 100% { transform: translateY(0); } }
        .animate-in { animation: slideInFromBottom 0.3s ease-out; }
        @keyframes scaleInCenter { 0% { transform: scale(0.9); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .scale-in-center { animation: scaleInCenter 0.3s cubic-bezier(0.250, 0.460, 0.450, 0.940) both; }
      `}</style>
    </div>
  );
};

export default App;
