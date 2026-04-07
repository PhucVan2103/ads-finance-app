import React, { useState, useEffect, useMemo } from 'react';
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
  DatabaseBackup
} from 'lucide-react';

// ----------------------------------------------------------------------
// 1. CẤU HÌNH SUPABASE (DÀNH CHO LOCAL & VERCEL)
// ----------------------------------------------------------------------
// LƯU Ý KHI CHẠY TRÊN MÁY TÍNH (LOCAL): Hãy BỎ COMMENT 3 dòng code dưới đây
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// DÀNH CHO MÔI TRƯỜNG PREVIEW TRÊN WEB NÀY (Mock để không bị lỗi biên dịch):
//const createClient = (url, key) => { return null; };
//const supabaseUrl = '';
//const supabaseAnonKey = '';

//const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;
//const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;
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
  if (!amount || amount === 0) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', { 
    style: 'decimal',
    minimumFractionDigits: amount % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1
  }).format(amount) + ' ₫';
};

const formatDate = (dateString) => {
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
  
  // Date State for View
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(getLocalISODate());
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // LƯU DỮ LIỆU LOCALSTORAGE NẾU KHÔNG DÙNG SUPABASE
  useEffect(() => {
    if (!isSupabaseConfigured) {
      localStorage.setItem('m_shops', JSON.stringify(shops));
      localStorage.setItem('m_logs', JSON.stringify(adsLogs));
      localStorage.setItem('m_providers', JSON.stringify(providers));
      localStorage.setItem('m_p_payments', JSON.stringify(providerPayments));
    }
  }, [shops, adsLogs, providers, providerPayments]);

  // FETCH DATA TỪ SUPABASE HOẶC LOCALSTORAGE
  useEffect(() => {
    const fetchData = async () => {
      // Fallback: Nếu không có DB, lấy từ localStorage
      if (!isSupabaseConfigured || !supabase) {
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
          // Khởi tạo data mẫu nếu trống
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

      // Supabase Fetch Logic
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
        console.error("Lỗi khi tải dữ liệu từ Supabase:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- CALCULATIONS ---
  const currentMonthLogs = useMemo(() => {
    return adsLogs.filter(log => {
      const d = new Date(log.date);
      return d.getMonth() === viewMonth && d.getFullYear() === viewYear;
    });
  }, [adsLogs, viewMonth, viewYear]);

  const totals = useMemo(() => {
    let spend = 0;
    let paidSpend = 0;
    let revenue = 0;
    let pendingRevenue = 0;
    let totalRentalFeePaid = 0;
    
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
      
      const pId = log.providerId !== undefined ? log.providerId : fallbackProvider?.id;
      const pFee = log.providerRentalFee !== undefined ? log.providerRentalFee : (fallbackProvider?.rentalFee || 0);
      
      if (pId) {
        totalRentalFeePaid += (log.amount * pFee / 100);
      }
    });

    return { 
      spend, 
      revenue, 
      pendingRevenue,
      profit: revenue - spend - totalRentalFeePaid,
      totalFeesCollected: revenue - paidSpend
    };
  }, [currentMonthLogs, shops, providers]);

  const statsByDay = useMemo(() => {
    const monthDays = getDaysInMonth(viewMonth, viewYear);
    
    return monthDays.map(dateStr => {
      const logsForDay = adsLogs.filter(log => log.date === dateStr);
      let dayRevenue = 0;
      let daySpend = 0;
      let dayRentalFee = 0;

      logsForDay.forEach(log => {
        const shop = shops.find(s => s.id === log.shopId);
        const fallbackProvider = providers.find(p => p.id === shop?.providerId);
        const feeP = log.feePercent !== undefined ? log.feePercent : (shop?.percent || 0);
        
        daySpend += log.amount;
        
        const logRevenue = (log.amount + (log.amount * feeP / 100));
        if (log.status !== 'unpaid') {
          dayRevenue += logRevenue;
        }
        
        const pId = log.providerId !== undefined ? log.providerId : fallbackProvider?.id;
        const pFee = log.providerRentalFee !== undefined ? log.providerRentalFee : (fallbackProvider?.rentalFee || 0);
        
        if (pId) {
          dayRentalFee += (log.amount * pFee / 100);
        }
      });

      return {
        date: dateStr,
        day: parseInt(dateStr.split('-')[2]),
        profit: dayRevenue - daySpend - dayRentalFee
      };
    });
  }, [adsLogs, shops, providers, viewMonth, viewYear]);

  const maxAbsProfit = useMemo(() => {
    const profits = statsByDay.map(d => Math.abs(d.profit));
    const max = Math.max(...profits);
    return max > 0 ? max : 1;
  }, [statsByDay]);

  const providerSummary = useMemo(() => {
    return providers.map(p => {
      const relatedShops = shops.filter(s => s.providerId === p.id);
      const relatedShopIds = relatedShops.map(s => s.id);
      
      const history = adsLogs
        .filter(log => {
          if (log.providerId !== undefined) return log.providerId === p.id;
          return relatedShopIds.includes(log.shopId);
        })
        .map(log => ({ ...log, shopName: shops.find(s => s.id === log.shopId)?.name || 'N/A' }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      const totalSpend = history.reduce((sum, log) => sum + log.amount, 0);
      const totalRentalFee = history.reduce((sum, log) => {
        const pFee = log.providerRentalFee !== undefined ? log.providerRentalFee : p.rentalFee;
        return sum + (log.amount * pFee / 100);
      }, 0);
      const totalPayable = totalSpend + totalRentalFee;
      const paidAmount = providerPayments.filter(pay => pay.providerId === p.id).reduce((sum, pay) => sum + pay.amount, 0);
      
      return {
        ...p,
        totalSpend,
        totalRentalFee,
        totalPayable,
        paidAmount,
        debt: totalPayable - paidAmount,
        history,
        paymentsHistory: providerPayments.filter(pay => pay.providerId === p.id).sort((a, b) => new Date(b.date) - new Date(a.date))
      };
    });
  }, [providers, shops, adsLogs, providerPayments]);

  const filteredLogsByDate = useMemo(() => {
    return adsLogs.filter(log => log.date === selectedDate);
  }, [adsLogs, selectedDate]);


  // --- ACTIONS WITH SUPABASE OR LOCAL ---

  const changeMonth = (offset) => {
    let newMonth = viewMonth + offset;
    let newYear = viewYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    setViewMonth(newMonth);
    setViewYear(newYear);
  };

  const toggleLogStatus = async (e, log) => {
    e.stopPropagation();
    const newStatus = log.status === 'unpaid' ? 'paid' : 'unpaid';
    
    if (!isSupabaseConfigured || !supabase) {
      setAdsLogs(adsLogs.map(l => l.id === log.id ? { ...l, status: newStatus } : l));
      return;
    }

    // Cập nhật State ngay lập tức (Optimistic UI)
    setAdsLogs(adsLogs.map(l => l.id === log.id ? { ...l, status: newStatus } : l));
    const { error } = await supabase.from('ads_logs').update({ status: newStatus }).eq('id', log.id);
    if (error) {
      setAdsLogs(adsLogs.map(l => l.id === log.id ? { ...l, status: log.status } : l));
      console.error("Lỗi khi cập nhật trạng thái thanh toán:", error);
    }
  };

  const handleSaveLog = async (e) => {
    e.preventDefault();

    const fd = new FormData(e.currentTarget);
    const shopId = fd.get('shopId');
    const amountStr = fd.get('amount') || '';
    const amount = parseFloat(amountStr.toString().replace(/\D/g, '') || 0);
    const date = fd.get('date');
    const isPaid = fd.get('isPaid') === 'on';
    
    const shop = shops.find(s => s.id === shopId);
    const provider = providers.find(p => p.id === shop?.providerId);
    
    if (amount <= 0) return;
    
    if (!isSupabaseConfigured || !supabase) {
      const localLogData = { 
        id: editingLog ? editingLog.id : Date.now().toString(),
        shopId: shopId, 
        amount: amount, 
        date: date, 
        status: isPaid ? 'paid' : 'unpaid', 
        feePercent: shop ? shop.percent : 0,
        providerId: provider?.id || null,
        providerRentalFee: provider?.rentalFee || 0
      };
      
      if (editingLog) {
        setAdsLogs(adsLogs.map(l => l.id === editingLog.id ? localLogData : l));
      } else {
        setAdsLogs([localLogData, ...adsLogs]);
      }
      setShowAddLogModal(false);
      setEditingLog(null);
      setAmountInput('');
      return;
    }

    const dbData = { 
      shop_id: shopId, 
      amount: amount, 
      date: date, 
      status: isPaid ? 'paid' : 'unpaid', 
      fee_percent: shop ? shop.percent : 0,
      provider_id: provider?.id || null,
      provider_rental_fee: provider?.rentalFee || 0
    };
    
    if (editingLog) {
      const { data, error } = await supabase.from('ads_logs').update(dbData).eq('id', editingLog.id).select();
      if (!error && data) {
        const updatedLog = { ...data[0], amount: Number(data[0].amount), shopId: data[0].shop_id, feePercent: Number(data[0].fee_percent), providerId: data[0].provider_id, providerRentalFee: Number(data[0].provider_rental_fee) };
        setAdsLogs(adsLogs.map(l => l.id === editingLog.id ? updatedLog : l));
      }
    } else {
      const { data, error } = await supabase.from('ads_logs').insert([dbData]).select();
      if (!error && data) {
        const newLog = { ...data[0], amount: Number(data[0].amount), shopId: data[0].shop_id, feePercent: Number(data[0].fee_percent), providerId: data[0].provider_id, providerRentalFee: Number(data[0].provider_rental_fee) };
        setAdsLogs([newLog, ...adsLogs]);
      }
    }
    
    setShowAddLogModal(false);
    setEditingLog(null);
    setAmountInput('');
  };

  const handleDeleteLog = async (id) => {
    if (!isSupabaseConfigured || !supabase) {
      setAdsLogs(adsLogs.filter(l => l.id !== id));
      setShowAddLogModal(false);
      setEditingLog(null);
      setAmountInput('');
      return;
    }

    const { error } = await supabase.from('ads_logs').delete().eq('id', id);
    if (!error) {
      setAdsLogs(adsLogs.filter(l => l.id !== id));
      setShowAddLogModal(false);
      setEditingLog(null);
      setAmountInput('');
    }
  };

  const handleSaveShop = async (e) => {
    e.preventDefault();

    const fd = new FormData(e.currentTarget);
    const name = fd.get('name');
    const percent = parseFloat(fd.get('percent') || 0);
    const providerId = fd.get('providerId') || null;

    if (!isSupabaseConfigured || !supabase) {
      if (editingShop) {
        setShops(shops.map(s => s.id === editingShop.id ? { ...s, name, percent, providerId } : s));
      } else {
        setShops([...shops, { id: 's' + Date.now(), name, percent, providerId }]);
      }
      setShowShopModal(false);
      setEditingShop(null);
      return;
    }

    const dbData = { 
      name: name, 
      percent: percent,
      provider_id: providerId
    };

    if (editingShop) {
      const { data, error } = await supabase.from('shops').update(dbData).eq('id', editingShop.id).select();
      if (!error && data) {
        setShops(shops.map(s => s.id === editingShop.id ? { ...data[0], percent: Number(data[0].percent), providerId: data[0].provider_id } : s));
      }
    } else {
      const { data, error } = await supabase.from('shops').insert([dbData]).select();
      if (!error && data) {
        setShops([...shops, { ...data[0], percent: Number(data[0].percent), providerId: data[0].provider_id }]);
      }
    }
    
    setShowShopModal(false);
    setEditingShop(null);
  };

  const handleDeleteShop = async (id) => {
    if (!isSupabaseConfigured || !supabase) {
      setShops(shops.filter(s => s.id !== id));
      setShowShopModal(false);
      setEditingShop(null);
      return;
    }

    const { error } = await supabase.from('shops').delete().eq('id', id);
    if (!error) {
      setShops(shops.filter(s => s.id !== id));
      setShowShopModal(false);
      setEditingShop(null);
    }
  };

  const handleSaveProvider = async (e) => {
    e.preventDefault();

    const fd = new FormData(e.currentTarget);
    const name = fd.get('name');
    const rentalFee = parseFloat(fd.get('rentalFee') || 0);

    if (!isSupabaseConfigured || !supabase) {
      if (editingProvider) {
        setProviders(providers.map(p => p.id === editingProvider.id ? { ...p, name, rentalFee } : p));
      } else {
        setProviders([...providers, { id: 'p' + Date.now(), name, rentalFee }]);
      }
      setShowProviderModal(false);
      setEditingProvider(null);
      return;
    }

    const dbData = { 
      name: name, 
      rental_fee: rentalFee 
    };

    if (editingProvider) {
      const { data, error } = await supabase.from('providers').update(dbData).eq('id', editingProvider.id).select();
      if (!error && data) {
        setProviders(providers.map(p => p.id === editingProvider.id ? { ...data[0], rentalFee: Number(data[0].rental_fee) } : p));
      }
    } else {
      const { data, error } = await supabase.from('providers').insert([dbData]).select();
      if (!error && data) {
        setProviders([...providers, { ...data[0], rentalFee: Number(data[0].rental_fee) }]);
      }
    }
    
    setShowProviderModal(false);
    setEditingProvider(null);
  };

  const handleDeleteProvider = async (id) => {
    if (!isSupabaseConfigured || !supabase) {
      setProviders(providers.filter(p => p.id !== id));
      setShowProviderModal(false);
      setEditingProvider(null);
      setSelectedProviderId(null);
      return;
    }

    const { error } = await supabase.from('providers').delete().eq('id', id);
    if (!error) {
      setProviders(providers.filter(p => p.id !== id));
      setShowProviderModal(false);
      setEditingProvider(null);
      setSelectedProviderId(null);
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();

    const fd = new FormData(e.currentTarget);
    const amountStr = fd.get('amount') || '';
    const amount = parseFloat(amountStr.toString().replace(/\D/g, '') || 0);
    const date = fd.get('date');
    const note = fd.get('note');
    
    if (amount <= 0) return;

    if (!isSupabaseConfigured || !supabase) {
      setProviderPayments([...providerPayments, { id: Date.now().toString(), providerId: selectedProviderId, amount, date, note }]);
      setShowPaymentModal(false);
      setPaymentAmountInput('');
      return;
    }

    const dbData = { 
      provider_id: selectedProviderId, 
      amount: amount, 
      date: date, 
      note: note 
    };

    const { data, error } = await supabase.from('provider_payments').insert([dbData]).select();
    
    if (!error && data) {
      setProviderPayments([...providerPayments, { ...data[0], amount: Number(data[0].amount), providerId: data[0].provider_id }]);
      setShowPaymentModal(false);
      setPaymentAmountInput('');
    }
  };

  // --- VIEWS ---

  // Màn hình Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const HomeView = () => (
    <div className="space-y-5 pb-24">
      <div className="bg-gradient-to-br from-indigo-600 via-blue-700 to-slate-900 rounded-[28px] p-6 text-white shadow-xl relative overflow-hidden">
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

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm text-center">
          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Tổng đã thu</p>
          <p className="text-sm font-black text-slate-900">{formatVND(totals.revenue)}</p>
        </div>
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm text-center">
          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Ads gốc tháng</p>
          <p className="text-sm font-black text-rose-500">{formatVND(totals.spend)}</p>
        </div>
      </div>

      <div>
        <h3 className="font-black text-slate-900 uppercase text-[10px] tracking-widest mb-3 px-1 flex items-center gap-2">
          <Clock size={14} className="text-blue-600" /> Ghi nhận chi tiêu
        </h3>
        
        <div className="flex justify-between items-center bg-white p-1.5 rounded-[24px] border border-slate-100 shadow-sm mb-4 w-full">
          {[...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const dateStr = getLocalISODate(d);
            const isSelected = dateStr === selectedDate;
            return (
              <button key={i} onClick={() => setSelectedDate(dateStr)} className={`flex flex-col items-center justify-center gap-1 p-2 rounded-[18px] transition-all flex-1 ${isSelected ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-slate-400 hover:bg-slate-50'}`}>
                <span className="text-[9px] font-black uppercase">{d.toLocaleDateString('vi-VN', { weekday: 'short' })}</span>
                <span className="text-sm font-black">{d.getDate()}</span>
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          {filteredLogsByDate.length > 0 ? filteredLogsByDate.map(log => {
             const shop = shops.find(s => s.id === log.shopId);
             const isPaid = log.status !== 'unpaid';
             const feeP = log.feePercent !== undefined ? log.feePercent : (shop?.percent || 0);
             const clientFee = log.amount * feeP / 100;
             const totalClientPay = log.amount + clientFee;
             
             return (
               <div key={log.id} onClick={() => { setEditingLog(log); setAmountInput(formatNumberInput(log.amount)); setShowAddLogModal(true); }} className="bg-white p-4 rounded-[24px] border border-slate-50 shadow-sm active:scale-[0.98] transition-transform">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={(e) => toggleLogStatus(e, log)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isPaid ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-300 hover:bg-slate-200'}`}>
                        <CheckCircle2 size={20} />
                      </button>
                      <div>
                        <p className="font-black text-slate-800 text-[13px]">{shop?.name || 'Shop đã xóa'}</p>
                        <p className={`text-[9px] font-bold uppercase ${isPaid ? 'text-emerald-500' : 'text-slate-400'}`}>
                          {isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'} • Phí: {feeP}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`grid grid-cols-3 gap-2 p-3 rounded-2xl ${isPaid ? 'bg-slate-50/50' : 'bg-rose-50/50'}`}>
                    <div><p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Tiền gốc</p><p className="text-xs font-bold text-slate-700">{formatVND(log.amount)}</p></div>
                    <div className="border-l border-slate-100 pl-2"><p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Phí</p><p className="text-xs font-bold text-indigo-600">+{formatVND(clientFee)}</p></div>
                    <div className="border-l border-slate-100 pl-2"><p className={`text-[8px] font-black uppercase mb-0.5 ${isPaid ? 'text-blue-600' : 'text-rose-500'}`}>{isPaid ? 'Tổng thu' : 'Chờ thu'}</p><p className={`text-xs font-black ${isPaid ? 'text-blue-600' : 'text-rose-500'}`}>{formatVND(totalClientPay)}</p></div>
                  </div>
               </div>
             );
          }) : (
            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
               <Info size={24} className="mx-auto text-slate-200 mb-2" />
               <p className="text-slate-300 font-bold text-[10px] uppercase tracking-widest">Không có dữ liệu ngày {selectedDate.split('-')[2]}/{selectedDate.split('-')[1]}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const ShopsView = () => (
    <div className="space-y-5 pb-24">
      <div className="flex justify-between items-center px-1">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quản lý Cửa hàng</h3>
        <button onClick={() => { setEditingShop(null); setShowShopModal(true); }} className="text-blue-600 font-black text-[10px] uppercase flex items-center gap-1.5"><PlusCircle size={14}/> Thêm Shop</button>
      </div>

      <div className="grid gap-3">
        {shops.map(shop => {
          const provider = providers.find(p => p.id === shop.providerId);
          return (
            <div key={shop.id} onClick={() => { setEditingShop(shop); setShowShopModal(true); }} className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex justify-between items-center active:scale-[0.98] transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><Store size={24}/></div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm">{shop.name}</h4>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[8px] px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded font-black uppercase">Phí: {shop.percent}%</span>
                    <span className="text-[8px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-black uppercase">{provider?.name || 'Chưa gán'}</span>
                  </div>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-300" />
            </div>
          );
        })}
      </div>
    </div>
  );

  const StatsView = () => {
    const activeStats = [...statsByDay].reverse();
    const monthName = new Date(viewYear, viewMonth).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

    return (
      <div className="flex flex-col h-full space-y-5 pb-24">
        {/* Month Navigation */}
        <div className="flex items-center justify-between bg-white px-5 py-4 rounded-[28px] border border-slate-100 shadow-sm shrink-0">
          <button onClick={() => changeMonth(-1)} className="p-2 text-slate-400 hover:text-blue-600 active:scale-90 transition-all">
            <ChevronLeftCircle size={26} />
          </button>
          <div className="text-center">
            <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5 tracking-tighter">Báo cáo tháng</p>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">{monthName}</h2>
          </div>
          <button onClick={() => changeMonth(1)} className="p-2 text-slate-400 hover:text-blue-600 active:scale-90 transition-all">
            <ChevronRightCircle size={26} />
          </button>
        </div>

        {/* Báo cáo tóm tắt */}
        <div className="grid grid-cols-2 gap-3 shrink-0">
          <div className="bg-emerald-50 p-4 rounded-3xl border border-emerald-100">
             <p className="text-[8px] font-black text-emerald-600 uppercase mb-1">Ngày cao nhất</p>
             <p className="text-xs font-black text-emerald-700">{formatVND(Math.max(...statsByDay.map(d => d.profit), 0))}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-3xl border border-blue-100 text-right">
             <p className="text-[8px] font-black text-blue-600 uppercase mb-1">Lợi nhuận ròng</p>
             <p className="text-xs font-black text-blue-700">{formatVND(totals.profit)}</p>
          </div>
        </div>

        {/* Biểu đồ cột ngang */}
        <div className="flex-1 bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chi tiết theo ngày</h3>
            <span className="text-[8px] font-bold text-slate-300">Vuốt để xem thêm</span>
          </div>
          
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1">
            {activeStats.map((d, i) => {
              const widthPercent = (Math.abs(d.profit) / maxAbsProfit) * 100;
              const isToday = d.date === getLocalISODate();
              const isLoss = d.profit < 0;
              
              return (
                <div key={`${d.date}-${i}`} className="group">
                  <div className="flex justify-between items-center mb-1.5 px-1">
                    <span className={`text-[9px] font-black uppercase ${isToday ? 'text-blue-600 font-black' : 'text-slate-400'}`}>
                      {d.day}/{viewMonth + 1} {isToday && '•'}
                    </span>
                    <span className={`text-[10px] font-bold ${d.profit > 0 ? 'text-slate-700' : isLoss ? 'text-rose-500' : 'text-slate-300'}`}>
                      {d.profit !== 0 ? formatVND(d.profit) : '---'}
                    </span>
                  </div>
                  <div className="h-4 w-full bg-slate-50 rounded-full overflow-hidden relative border border-slate-50/50">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ease-out shadow-sm ${isToday ? 'bg-blue-600' : isLoss ? 'bg-rose-500' : 'bg-blue-300/60 group-hover:bg-blue-400'}`}
                      style={{ width: `${Math.max(widthPercent, 0)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const ProviderDetailView = ({ provider }) => (
    <div className="space-y-6 pb-24">
      <button onClick={() => setSelectedProviderId(null)} className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase mb-2"><ChevronLeft size={16} /> Quay lại danh sách</button>
      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-black text-slate-900">{provider.name}</h2>
            <div className="inline-block px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase mt-1">Phí thuê: {provider.rentalFee}%</div>
          </div>
          <button onClick={() => { setEditingProvider(provider); setShowProviderModal(true); }} className="p-2.5 bg-slate-50 rounded-xl text-slate-400"><Settings size={18} /></button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50/50 p-4 rounded-2xl"><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Gốc nạp Ads</p><p className="text-sm font-black text-slate-900">{formatVND(provider.totalSpend)}</p></div>
            <div className="bg-indigo-50/30 p-4 rounded-2xl"><p className="text-[9px] font-black text-indigo-400 uppercase mb-1">Phí thuê</p><p className="text-sm font-black text-indigo-600">+{formatVND(provider.totalRentalFee)}</p></div>
          </div>
          <div className="pt-4 border-t border-slate-50 flex flex-col gap-3">
            <div className="flex justify-between items-center"><p className="text-[10px] font-black text-slate-400 uppercase">Tổng nợ phát sinh</p><p className="text-md font-black text-slate-900">{formatVND(provider.totalPayable)}</p></div>
            <div className="flex justify-between items-center bg-emerald-50/50 px-4 py-3 rounded-2xl"><p className="text-[10px] font-black text-emerald-600 uppercase">Đã thanh toán</p><p className="text-sm font-black text-emerald-600">-{formatVND(provider.paidAmount)}</p></div>
            <div className="flex justify-between items-end bg-rose-50 px-4 py-4 rounded-[24px]">
              <div><p className="text-[10px] font-black text-rose-500 uppercase">Còn lại phải trả</p><p className="text-2xl font-black text-rose-500 tracking-tight">{formatVND(provider.debt)}</p></div>
              <ArrowUpRight size={24} className="text-rose-200 mb-1" />
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-5">
        <div className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm">
           <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2"><Wallet size={16} className="text-emerald-600" /><h3 className="text-[11px] font-black uppercase tracking-wider text-slate-900">Lịch sử thanh toán</h3></div>
              <button onClick={() => { setPaymentAmountInput(''); setShowPaymentModal(true); }} className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 uppercase bg-emerald-50 px-3 py-2 rounded-xl"><PlusCircle size={14}/> Trả tiền</button>
           </div>
           <div className="space-y-3">
              {provider.paymentsHistory.length > 0 ? provider.paymentsHistory.map(pay => (
                 <div key={pay.id} className="bg-slate-50/50 p-3 rounded-2xl flex justify-between items-center">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-emerald-500 shadow-sm"><ArrowDownCircle size={16} /></div>
                       <div><p className="text-[10px] font-black text-slate-800">{formatDate(pay.date)}</p><p className="text-[8px] text-slate-400 font-bold uppercase truncate max-w-[120px]">{pay.note || 'Thanh toán'}</p></div>
                    </div>
                    <p className="text-xs font-black text-emerald-600">-{formatVND(pay.amount)}</p>
                 </div>
              )) : <p className="text-center py-6 text-[9px] font-bold text-slate-300 uppercase italic">Chưa có giao dịch</p>}
           </div>
        </div>
      </div>
    </div>
  );

  const ProviderListView = () => (
    <div className="space-y-4 pb-24">
      <div className="flex justify-between items-center px-1">
         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Danh sách Provider</h3>
         <button onClick={() => { setEditingProvider(null); setShowProviderModal(true); }} className="text-blue-600 font-black text-[10px] uppercase flex items-center gap-1.5"><PlusCircle size={14}/> Thêm mới</button>
      </div>
      {providerSummary.map(p => (
        <div key={p.id} onClick={() => setSelectedProviderId(p.id)} className="bg-white rounded-[32px] border border-slate-100 p-5 shadow-sm space-y-4 active:scale-[0.98] transition-all">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><CreditCard size={24} /></div>
              <div><h4 className="font-black text-slate-900">{p.name}</h4><span className="text-[8px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded font-black uppercase">Phí: {p.rentalFee}%</span></div>
            </div>
            <div className="text-right"><p className="text-[8px] font-black text-rose-500 uppercase tracking-tighter mb-0.5 italic">Dư nợ</p><p className="text-lg font-black text-rose-500">{formatVND(p.debt)}</p></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 select-none">
      <div className="relative mx-auto border-[8px] border-slate-800 rounded-[60px] h-[844px] w-[390px] bg-white shadow-2xl overflow-hidden flex flex-col">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-8 bg-black rounded-b-3xl z-[60] mt-1"></div>
        <div className="h-11 flex justify-between items-center px-8 z-50 text-black font-bold text-[12px] pt-2">
          <span>{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
          <div className="flex items-center gap-1.5"><Signal size={12} /><Wifi size={12} /><Battery size={14} /></div>
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-slate-50 px-6 pt-6 relative no-scrollbar flex flex-col">
          <header className="flex justify-between items-center mb-6 shrink-0">
            <div>
              <h1 className="text-xl font-black tracking-tighter italic uppercase text-slate-900">Ads Finance</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[8px] font-bold text-blue-600 uppercase tracking-widest">Management v1.0</p>
                {!isSupabaseConfigured && (
                  <span className="flex items-center gap-1 bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter shadow-sm border border-amber-200">
                    <DatabaseBackup size={10} /> Local Mode
                  </span>
                )}
              </div>
            </div>
            <button 
              onClick={() => setActiveTab('stats')}
              className={`w-10 h-10 rounded-full border flex items-center justify-center shadow-sm transition-all ${activeTab === 'stats' ? 'bg-blue-600 border-blue-600 text-white shadow-blue-100' : 'bg-white border-slate-100 text-slate-400 hover:text-blue-500'}`}
            >
              <BarChart3 size={18} />
            </button>
          </header>

          <div className="flex-1">
            {activeTab === 'home' && <HomeView />}
            {activeTab === 'shops' && <ShopsView />}
            {activeTab === 'stats' && <StatsView />}
            {activeTab === 'providers' && (selectedProviderId ? <ProviderDetailView provider={providerSummary.find(p => p.id === selectedProviderId)} /> : <ProviderListView />)}
          </div>

          {activeTab === 'home' && (
            <button onClick={() => { setEditingLog(null); setAmountInput(''); setShowAddLogModal(true); }} className="absolute bottom-[100px] right-6 w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-xl flex items-center justify-center active:scale-90 transition-all z-40 border-4 border-white"><Plus size={28} strokeWidth={3}/></button>
          )}
        </div>

        {/* Navigation Bar */}
        <nav className="bg-white border-t border-slate-100 px-6 py-5 pb-8 flex justify-around items-center rounded-t-[32px] shadow-lg shrink-0">
          <button onClick={() => { setActiveTab('home'); setSelectedProviderId(null); }} className={`flex flex-col items-center gap-1.5 ${activeTab === 'home' ? 'text-blue-600' : 'text-slate-300'}`}><LayoutDashboard size={22} /><span className="text-[8px] font-black uppercase tracking-tighter">Thu khách</span></button>
          <button onClick={() => { setActiveTab('shops'); setSelectedProviderId(null); }} className={`flex flex-col items-center gap-1.5 ${activeTab === 'shops' ? 'text-blue-600' : 'text-slate-300'}`}><Store size={22} /><span className="text-[8px] font-black uppercase tracking-tighter">Cửa hàng</span></button>
          <button onClick={() => { setActiveTab('providers'); setSelectedProviderId(null); }} className={`flex flex-col items-center gap-1.5 ${activeTab === 'providers' ? 'text-blue-600' : 'text-slate-300'}`}><Users size={22} /><span className="text-[8px] font-black uppercase tracking-tighter">Công nợ</span></button>
        </nav>

        {/* --- MODALS --- */}
        {showAddLogModal && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] z-[100] flex items-end">
            <div className="bg-white w-full rounded-t-[40px] p-6 pb-10 animate-in slide-in-from-bottom duration-300">
              <div className="w-10 h-1 bg-slate-100 rounded-full mx-auto mb-6"></div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-900 uppercase italic">{editingLog ? 'Sửa chi tiêu' : 'Nhập chi tiêu'}</h3>
                {editingLog && <button type="button" onClick={() => handleDeleteLog(editingLog.id)} className="text-rose-500"><Trash2 size={20}/></button>}
              </div>
              <form onSubmit={handleSaveLog} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Cửa hàng</label>
                    <select name="shopId" required defaultValue={editingLog?.shopId || ""} className="w-full bg-transparent border-none font-bold text-xs p-0 focus:ring-0">
                      <option value="" disabled>Chọn shop...</option>
                      {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Ngày</label>
                    <input type="date" name="date" required defaultValue={editingLog?.date || selectedDate} className="w-full bg-transparent border-none font-bold text-xs p-0 focus:ring-0"/>
                  </div>
                </div>
                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 text-center">
                  <label className="block text-[8px] font-black text-slate-400 uppercase mb-2">Số tiền chạy gốc (Spend)</label>
                  <input name="amount" type="text" inputMode="numeric" required value={amountInput} onChange={(e) => setAmountInput(formatNumberInput(e.target.value))} className="w-full bg-transparent border-none text-center font-black text-3xl text-blue-600 focus:ring-0 p-0" placeholder="0"/>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center border border-slate-100">
                  <div>
                    <label className="block text-[10px] font-black text-slate-700 uppercase mb-0.5">Đã thu tiền khách</label>
                    <p className="text-[8px] text-slate-400 font-bold">Tính vào lợi nhuận ròng</p>
                  </div>
                  <div className="relative flex items-center cursor-pointer">
                    <input type="checkbox" name="isPaid" defaultChecked={editingLog ? editingLog.status !== 'unpaid' : true} className="w-5 h-5 accent-blue-600 rounded cursor-pointer" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowAddLogModal(false)} className="flex-1 bg-slate-100 text-slate-500 font-black py-4 rounded-2xl text-[10px] uppercase">Hủy</button>
                  <button type="submit" className="flex-[2] bg-blue-600 text-white font-black py-4 rounded-2xl text-[10px] uppercase shadow-lg shadow-blue-200">Lưu giao dịch</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showShopModal && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] z-[100] flex items-end">
            <div className="bg-white w-full rounded-t-[40px] p-6 pb-10 animate-in slide-in-from-bottom duration-300">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-900 uppercase italic">{editingShop ? 'Cài đặt Shop' : 'Thêm Shop'}</h3>
                {editingShop && <button type="button" onClick={() => handleDeleteShop(editingShop.id)} className="text-rose-500"><Trash2 size={20}/></button>}
              </div>
              <form onSubmit={handleSaveShop} className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Tên Shop</label>
                  <input name="name" required defaultValue={editingShop?.name || ""} className="w-full bg-transparent border-none font-bold text-sm focus:ring-0 p-0 h-6"/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Phí thu khách (%)</label>
                    <input name="percent" type="number" step="0.1" min="0" required defaultValue={editingShop?.percent || ""} className="w-full bg-transparent border-none font-black text-xl text-blue-600 focus:ring-0 p-0 h-8"/>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Provider</label>
                    <select name="providerId" required defaultValue={editingShop?.providerId || ""} className="w-full bg-transparent border-none font-bold text-xs p-0 focus:ring-0">
                      <option value="" disabled>Chọn...</option>
                      {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                   <button type="button" onClick={() => setShowShopModal(false)} className="flex-1 py-4 font-black text-[10px] uppercase text-slate-400 bg-slate-50 rounded-2xl">Hủy</button>
                   <button type="submit" className="flex-[2] bg-blue-600 text-white font-black py-4 rounded-2xl text-[10px] uppercase shadow-lg">Lưu Shop</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showProviderModal && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] z-[100] flex items-end">
            <div className="bg-white w-full rounded-t-[40px] p-6 pb-10 animate-in slide-in-from-bottom duration-300">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-900 uppercase italic">{editingProvider ? 'Cài đặt Provider' : 'Thêm Provider'}</h3>
                {editingProvider && <button type="button" onClick={() => handleDeleteProvider(editingProvider.id)} className="text-rose-500"><Trash2 size={20}/></button>}
              </div>
              <form onSubmit={handleSaveProvider} className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Tên nhà cung cấp</label>
                  <input name="name" required defaultValue={editingProvider?.name || ""} className="w-full bg-transparent border-none font-bold text-sm focus:ring-0 p-0 h-6"/>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Phí thuê (%)</label>
                  <input name="rentalFee" type="number" step="0.1" min="0" required defaultValue={editingProvider?.rentalFee || ""} className="w-full bg-transparent border-none font-black text-xl text-blue-600 focus:ring-0 p-0 h-8" placeholder="0"/>
                </div>
                <div className="flex gap-3 pt-2">
                   <button type="button" onClick={() => setShowProviderModal(false)} className="flex-1 py-4 font-black text-[10px] uppercase text-slate-400 bg-slate-50 rounded-2xl">Hủy</button>
                   <button type="submit" className="flex-[2] bg-indigo-600 text-white font-black py-4 rounded-2xl text-[10px] uppercase shadow-lg">Lưu Provider</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showPaymentModal && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] z-[120] flex items-center justify-center p-6">
            <div className="bg-white w-full rounded-[32px] p-6 shadow-2xl scale-in-center">
              <h3 className="text-lg font-black text-slate-900 uppercase italic mb-6">Thanh toán nợ</h3>
              <form onSubmit={handleAddPayment} className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                   <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Số tiền (VND)</label>
                   <input name="amount" type="text" inputMode="numeric" required value={paymentAmountInput} onChange={(e) => setPaymentAmountInput(formatNumberInput(e.target.value))} className="w-full bg-transparent border-none font-black text-xl text-emerald-600 focus:ring-0 p-0" placeholder="0"/>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                   <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Ngày chuyển</label>
                   <input name="date" type="date" required defaultValue={getLocalISODate()} className="w-full bg-transparent border-none font-bold text-sm focus:ring-0 p-0"/>
                </div>
                <div className="flex gap-2 pt-2">
                   <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 py-4 font-black text-[10px] uppercase text-slate-400 bg-slate-50 rounded-2xl">Hủy</button>
                   <button type="submit" className="flex-[2] py-4 font-black text-[10px] uppercase text-white bg-emerald-600 rounded-2xl shadow-lg">Ghi nhận</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes slideInFromBottom {
          0% { transform: translateY(100%); }
          100% { transform: translateY(0); }
        }
        .animate-in { animation: slideInFromBottom 0.3s ease-out; }
        @keyframes scaleInCenter {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .scale-in-center { animation: scaleInCenter 0.3s cubic-bezier(0.250, 0.460, 0.450, 0.940) both; }
      `}</style>
    </div>
  );
};

export default App;