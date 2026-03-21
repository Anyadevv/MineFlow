import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, Users, ArrowDownLeft, ArrowUpRight,
    Search, Check, X, Shield, LogOut,
    ExternalLink, Filter, MoreHorizontal,
    Settings, AlertCircle, TrendingUp, Wallet,
    Clock, Smartphone, Globe, Gift, ChevronRight, Menu,
    Bell, Mail
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom';

// --- Types ---
interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error';
}

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
}

// --- Sub-Components ---

const ToastContainer = ({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) => (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {toasts.map((toast) => (
            <div
                key={toast.id}
                className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-md border animate-in slide-in-from-right-full duration-300 ${toast.type === 'success'
                    ? 'bg-emerald-900/90 text-white border-emerald-500/50'
                    : 'bg-red-900/90 text-white border-red-500/50'
                    }`}
                onClick={() => removeToast(toast.id)}
            >
                {toast.type === 'success' ? <Check size={20} className="text-emerald-400" /> : <AlertCircle size={20} className="text-red-400" />}
                <span className="font-medium text-sm">{toast.message}</span>
            </div>
        ))}
    </div>
);

const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, loading }: ConfirmModalProps) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={loading ? undefined : onCancel}></div>
            <div className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 mb-6 mx-auto">
                    <AlertCircle size={28} />
                </div>
                <h3 className="text-xl font-bold text-center text-slate-800 mb-2">{title}</h3>
                <p className="text-center text-slate-500 mb-8 leading-relaxed">{message}</p>
                <div className="flex gap-4">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-1 py-3 px-4 rounded-xl font-bold bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 flex justify-center items-center"
                    >
                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Confirm'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon, gradientClass, delay }: any) => (
    <div className={`relative overflow-hidden bg-white rounded-[2rem] p-8 shadow-lg shadow-emerald-900/5 border border-slate-100 group hover:translate-y-[-4px] transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards delay-[${delay}ms]`}>
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradientClass} rounded-full blur-2xl opacity-20 -mr-10 -mt-10 group-hover:opacity-30 transition-opacity`}></div>
        <div className="relative z-10">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br ${gradientClass} text-white shadow-lg`}>
                {icon}
            </div>
            <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{title}</p>
                <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h3>
            </div>
        </div>
    </div>
);

const SectionHeader = ({ title, subtitle, icon: Icon }: any) => (
    <div className="flex items-center justify-between mb-8 animate-in fade-in slide-in-from-left-4">
        <div className="flex items-center gap-4">
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 text-emerald-600">
                <Icon size={24} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{title}</h2>
                <p className="text-sm font-medium text-slate-400 mt-0.5">{subtitle}</p>
            </div>
        </div>
    </div>
);

// --- Main Page Component ---

export const AdminDashboardPage = () => {
    const { user, profile, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Data State
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalDeposited: 0,
        totalWithdrawals: 0,
        pendingWithdrawals: 0
    });
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [deposits, setDeposits] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [bounties, setBounties] = useState<any[]>([]);
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // UX State
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [modalConfig, setModalConfig] = useState<Partial<ConfirmModalProps>>({ isOpen: false });
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Helpers
    const addToast = (message: string, type: 'success' | 'error') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
    };

    const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));


    useEffect(() => {
        // Strict Admin Check
        if (!user) {
            navigate('/login');
            return;
        }

        const isAdminEmail = user.email === 'kenagostinhops@gmail.com';
        const role = profile?.role?.toLowerCase();
        const isAdminRole = role === 'admin' || role === 'adm';

        if (!isAdminEmail && !isAdminRole) {
            navigate('/dashboard');
            return;
        }

        fetchAdminData();
    }, [user]); // Only depend on user, not profile to avoid infinite loop

    const fetchAdminData = async () => {
        setLoading(true);
        try {
            // Stats Queries
            const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
            const { data: depositsData } = await supabase.from('deposits').select('amount, status');
            const { data: withdrawalsData } = await supabase.from('withdrawals').select('amount, status');

            const totalDep = depositsData?.reduce((sum, d) => sum + (Number(d.amount) || 0), 0) || 0;
            const totalWith = withdrawalsData?.filter(w => w.status === 'completed').reduce((sum, w) => sum + (Number(w.amount) || 0), 0) || 0;
            const pendingWith = withdrawalsData?.filter(w => w.status === 'pending').length || 0;

            setStats({
                totalUsers: userCount || 0,
                totalDeposited: totalDep,
                totalWithdrawals: totalWith,
                pendingWithdrawals: pendingWith
            });

            // Table Data Queries
            const { data: withRes } = await supabase
                .from('withdrawals')
                .select('*, profiles:user_id (email)')
                .order('created_at', { ascending: false });
            setWithdrawals(withRes || []);

            const { data: depRes } = await supabase
                .from('deposits')
                .select('*, profiles:user_id (email)')
                .order('created_at', { ascending: false });

            // For deposits, we might not have all fields in older schemas, but we'll try to use what we have
            setDeposits(depRes || []);

            // Users - Simplified query without heavy joins
            const { data: userRes } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100); // Limit to 100 most recent users

            setUsers(userRes || []);

            const { data: bountyRes } = await supabase
                .from('bounties')
                .select('*, profiles:user_id (email)')
                .order('created_at', { ascending: false });
            setBounties(bountyRes || []);

            // Contacts
            const { data: contactRes } = await supabase
                .from('contacts' as any)
                .select('*')
                .order('created_at', { ascending: false });

            setContacts(contactRes || []);

        } catch (err: any) {
            console.error('Fetch Error:', err);
            addToast('Failed to load dashboard data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action: () => Promise<void>, confirmTitle: string, confirmMsg: string) => {
        setModalConfig({
            isOpen: true,
            title: confirmTitle,
            message: confirmMsg,
            loading: false,
            onCancel: () => setModalConfig({ isOpen: false }),
            onConfirm: async () => {
                setModalConfig(prev => ({ ...prev, loading: true }));
                try {
                    await action();
                    setModalConfig({ isOpen: false });
                    addToast('Action completed successfully', 'success');
                    fetchAdminData();
                } catch (err: any) {
                    setModalConfig(prev => ({ ...prev, loading: false }));
                    addToast(err.message || 'Action failed', 'error');
                }
            }
        });
    };

    const markWithdrawalPaid = (id: string) => handleAction(
        async () => {
            const { error } = await supabase.from('withdrawals').update({ status: 'completed' }).eq('id', id);
            if (error) throw error;
        },
        'Confirm Payout',
        'Are you sure you want to mark this withdrawal as PAID? This action cannot be undone.'
    );

    const markBountyPaid = (id: string, amount: string | number) => handleAction(
        async () => {
            // 1. Update Bounty Status
            const { error: bountyError } = await supabase.from('bounties').update({ status: 'paid' }).eq('id', id);
            if (bountyError) throw bountyError;

            // Note: In a real system, we might also want to credit the user's balance here if not done manually.
            // For now, we assume this action just marks the request as resolved/paid externally or via balance.
        },
        'Approve & Pay Bounty',
        `Are you sure you want to approve this bounty?`
    );

    const triggerDailyROI = () => handleAction(
        async () => {
            const { data, error } = await supabase.rpc('process_daily_roi');
            if (error) throw error;
            const res = data as any;
            if (res && res.success === false) throw new Error(res.error || 'Failed to process');
            addToast(`Successfully processed profits for ${res.processed_count} plans.`, 'success');
        },
        'Process Daily Profits',
        'Are you sure you want to trigger the daily profit distribution for all active users? This will credit their earnings balance and log transactions.'
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-emerald-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 animate-pulse">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl text-emerald-500">
                        <Shield size={32} />
                    </div>
                    <p className="text-emerald-800 font-bold tracking-widest text-xs uppercase">Loading Admin Panel...</p>
                </div>
            </div>
        );
    }

    const menuItems = [
        { icon: LayoutDashboard, label: 'Overview', path: '/admin/dashboard' },
        { icon: ArrowDownLeft, label: 'Deposits', path: '/admin/deposits' },
        { icon: ArrowUpRight, label: 'Withdrawals', path: '/admin/withdrawals' },
        { icon: Users, label: 'Users', path: '/admin/users' },
        { icon: Gift, label: 'Bounties', path: '/admin/bounties' },
        { icon: Mail, label: 'Contact Messages', path: '/admin/contacts' },
    ];

    return (
        <div className="min-h-screen bg-[#f0fdf4] flex font-sans text-slate-800">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}></div>
            )}

            {/* Sidebar */}
            <aside className={`fixed h-screen w-full sm:w-72 bg-white/80 backdrop-blur-xl border-r border-slate-200 flex flex-col z-[60] transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:sticky lg:top-0'}`}>
                <div className="p-8 flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center text-white shadow-emerald-500/20 shadow-lg">
                        <Shield size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">MineFlow</h1>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Admin Panel</p>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2 py-4">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) => `
                                flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold text-base sm:text-sm group
                                ${isActive
                                    ? 'bg-emerald-50 text-emerald-600 shadow-sm'
                                    : 'text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-lg hover:shadow-slate-100'}
                            `}
                        >
                            <item.icon size={20} className="transition-colors group-hover:text-emerald-500" />
                            {item.label}
                            {item.label === 'Withdrawals' && stats.pendingWithdrawals > 0 && (
                                <span className="ml-auto bg-amber-400 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                                    {stats.pendingWithdrawals}
                                </span>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-4">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Signed in as</p>
                        <p className="text-sm font-bold text-slate-800 truncate" title={user?.email}>{user?.email}</p>
                    </div>
                    <button
                        onClick={() => signOut()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 active:scale-95"
                    >
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
                {/* Header */}
                <header className="h-20 flex items-center justify-between px-8 bg-white/50 backdrop-blur-sm border-b border-slate-200/50 sticky top-0 z-30">
                    <div className="flex items-center gap-4 lg:hidden">
                        <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-slate-500 hover:text-slate-800">
                            <Menu size={24} />
                        </button>
                    </div>

                    <div className="flex-1 flex justify-end items-center gap-6">
                        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-100 shadow-sm">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">System Online</span>
                        </div>
                        <div className="w-px h-8 bg-slate-200"></div>
                        <button className="relative p-2 text-slate-400 hover:text-emerald-500 transition-colors">
                            <Bell size={20} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-12 scroll-smooth">
                    <div className="max-w-7xl mx-auto space-y-12 pb-20">
                        <Routes>
                            <Route path="/" element={<Navigate to="dashboard" replace />} />

                            {/* OVERVIEW */}
                            <Route path="dashboard" element={
                                <div className="space-y-12">
                                    <SectionHeader title="Dashboard Overview" subtitle="Real-time platform metrics" icon={LayoutDashboard} />
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <StatCard
                                            title="Total Users"
                                            value={stats.totalUsers}
                                            icon={<Users size={24} />}
                                            gradientClass="from-blue-500 to-indigo-600"
                                            delay={0}
                                        />
                                        <StatCard
                                            title="Total Deposited"
                                            value={`$${stats.totalDeposited.toLocaleString()}`}
                                            icon={<ArrowDownLeft size={24} />}
                                            gradientClass="from-emerald-500 to-teal-600"
                                            delay={100}
                                        />
                                        <StatCard
                                            title="Total Withdrawals"
                                            value={`$${stats.totalWithdrawals.toLocaleString()}`}
                                            icon={<ArrowUpRight size={24} />}
                                            gradientClass="from-purple-500 to-fuchsia-600"
                                            delay={200}
                                        />
                                        <StatCard
                                            title="Pending Actions"
                                            value={stats.pendingWithdrawals}
                                            icon={<Clock size={24} />}
                                            gradientClass="from-amber-400 to-orange-500"
                                            delay={300}
                                        />
                                    </div>

                                    {/* Quick Actions / Recent Activity Placeholder */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 min-h-[300px]">
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="font-bold text-slate-800 text-lg">Platform Activity</h3>
                                                <TrendingUp className="text-emerald-500" />
                                            </div>
                                            <div className="flex flex-col items-center justify-center h-[200px] text-slate-400 gap-4">
                                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                                                    <TrendingUp size={24} />
                                                </div>
                                                <p className="text-sm font-medium">Activity chart integration needed</p>
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] p-8 shadow-xl text-white relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                                            <h3 className="font-bold text-lg mb-6 relative z-10">System Status</h3>
                                            <div className="space-y-4 relative z-10">
                                                <div className="flex justify-between items-center py-3 border-b border-white/10">
                                                    <span className="text-slate-400 text-sm font-medium">Active Plans</span>
                                                    <span className="font-bold text-emerald-400 text-lg">Running</span>
                                                </div>
                                                <div className="flex justify-between items-center py-3 border-b border-white/10">
                                                    <span className="text-slate-400 text-sm font-medium">Last Sync</span>
                                                    <span className="font-bold">{new Date().toLocaleTimeString()}</span>
                                                </div>
                                                <div className="flex justify-between items-center py-3">
                                                    <span className="text-slate-400 text-sm font-medium">Server Load</span>
                                                    <span className="font-bold text-blue-400">Optimal (12%)</span>
                                                </div>
                                                <div className="pt-4">
                                                    <button
                                                        onClick={triggerDailyROI}
                                                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] text-xs uppercase tracking-widest"
                                                    >
                                                        Run Daily Profit Distribution
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            } />

                            {/* WITHDRAWALS */}
                            <Route path="withdrawals" element={
                                <div className="space-y-6">
                                    <SectionHeader title="Withdrawal Management" subtitle="Process and manage payouts" icon={ArrowUpRight} />
                                    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                                                    <tr>
                                                        <th className="px-8 py-6">User</th>
                                                        <th className="px-8 py-6">Network / Token</th>
                                                        <th className="px-8 py-6">Amount</th>
                                                        <th className="px-8 py-6">Wallet Address</th>
                                                        <th className="px-8 py-6">Status</th>
                                                        <th className="px-8 py-6">Date</th>
                                                        <th className="px-8 py-6 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {withdrawals.map((w: any) => (
                                                        <tr key={w.id} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-8 py-6 text-sm font-bold text-slate-800">
                                                                {w.profiles?.email}
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs font-bold uppercase w-fit">
                                                                        {w.network || 'N/A'}
                                                                    </span>
                                                                    <span className="text-xs text-slate-400 font-medium">
                                                                        {w.token || w.currency || 'USDT'}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-6 font-bold text-red-600">
                                                                ${Number(w.amount).toFixed(2)}
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                {w.address ? (
                                                                    <code className="text-xs font-mono text-slate-600 bg-slate-50 px-2 py-1 rounded">
                                                                        {w.address.substring(0, 12)}...
                                                                    </code>
                                                                ) : (
                                                                    <span className="text-xs text-slate-400">N/A</span>
                                                                )}
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${w.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                                    w.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                                                        'bg-red-100 text-red-700'
                                                                    }`}>
                                                                    {w.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-8 py-6 text-xs text-slate-500 font-medium">
                                                                {new Date(w.created_at).toLocaleDateString()}
                                                            </td>
                                                            <td className="px-8 py-6 text-right">
                                                                {w.status === 'pending' && (
                                                                    <div className="flex gap-2 justify-end">
                                                                        <button
                                                                            onClick={() => handleAction(
                                                                                async () => {
                                                                                    const { error: withdrawalError } = await supabase
                                                                                        .from('withdrawals')
                                                                                        .update({ status: 'approved' })
                                                                                        .eq('id', w.id);
                                                                                    if (withdrawalError) throw withdrawalError;

                                                                                    const { error: balanceError } = await (supabase.rpc as any)('decrement_balance', {
                                                                                        p_user_id: w.user_id,
                                                                                        p_amount: Number(w.amount)
                                                                                    });
                                                                                    if (balanceError) throw balanceError;
                                                                                },
                                                                                'Approve Withdrawal',
                                                                                `Approve withdrawal of $${Number(w.amount).toFixed(2)} for ${w.profiles?.email}? Balance will be deducted.`
                                                                            )}
                                                                            className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                                                                        >
                                                                            Approve
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleAction(
                                                                                async () => {
                                                                                    const { error } = await supabase
                                                                                        .from('withdrawals')
                                                                                        .update({ status: 'rejected' })
                                                                                        .eq('id', w.id);
                                                                                    if (error) throw error;
                                                                                },
                                                                                'Reject Withdrawal',
                                                                                'Reject this withdrawal? This cannot be undone.'
                                                                            )}
                                                                            className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-lg shadow-red-500/20 transition-all active:scale-95"
                                                                        >
                                                                            Reject
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {withdrawals.length === 0 && (
                                                        <tr>
                                                            <td colSpan={7} className="px-8 py-12 text-center text-slate-400">
                                                                No withdrawal requests found.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            } />

                            {/* DEPOSITS */}
                            <Route path="deposits" element={
                                <div className="space-y-6">
                                    <SectionHeader title="Deposit Management" subtitle="Review and approve pending deposits" icon={ArrowDownLeft} />

                                    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                                                    <tr>
                                                        <th className="px-8 py-6">User</th>
                                                        <th className="px-8 py-6">Network / Token</th>
                                                        <th className="px-8 py-6">Amount</th>
                                                        <th className="px-8 py-6">TXID</th>
                                                        <th className="px-8 py-6">Status</th>
                                                        <th className="px-8 py-6">Date</th>
                                                        <th className="px-8 py-6 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {deposits.map((d: any) => (
                                                        <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-8 py-6 text-sm font-bold text-slate-800">
                                                                {d.profiles?.email}
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs font-bold uppercase w-fit">
                                                                        {d.network || 'N/A'}
                                                                    </span>
                                                                    <span className="text-xs text-slate-400 font-medium">
                                                                        {d.token || d.currency || 'USDT'}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-6 font-bold text-emerald-600">
                                                                ${Number(d.amount).toFixed(2)}
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                {d.txid ? (
                                                                    <code className="text-xs font-mono text-slate-600 bg-slate-50 px-2 py-1 rounded">
                                                                        {d.txid.substring(0, 12)}...
                                                                    </code>
                                                                ) : (
                                                                    <span className="text-xs text-slate-400">N/A</span>
                                                                )}
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${d.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                                    d.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                                                        'bg-red-100 text-red-700'
                                                                    }`}>
                                                                    {d.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-8 py-6 text-xs text-slate-500 font-medium">
                                                                {new Date(d.created_at).toLocaleDateString()}
                                                            </td>
                                                            <td className="px-8 py-6 text-right">
                                                                {d.status === 'pending' && (
                                                                    <div className="flex gap-2 justify-end">
                                                                        <button
                                                                            onClick={() => handleAction(
                                                                                async () => {
                                                                                    const { error: depositError } = await supabase
                                                                                        .from('deposits')
                                                                                        .update({ status: 'approved' })
                                                                                        .eq('id', d.id);
                                                                                    if (depositError) throw depositError;

                                                                                    const { error: balanceError } = await (supabase.rpc as any)('increment_balance', {
                                                                                        p_user_id: d.user_id,
                                                                                        p_amount: Number(d.amount)
                                                                                    });
                                                                                    if (balanceError) throw balanceError;
                                                                                },
                                                                                'Approve Deposit',
                                                                                `Approve $${Number(d.amount).toFixed(2)} for ${d.profiles?.email}? Balance will be credited.`
                                                                            )}
                                                                            className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                                                                        >
                                                                            Approve
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleAction(
                                                                                async () => {
                                                                                    const { error } = await supabase
                                                                                        .from('deposits')
                                                                                        .update({ status: 'rejected' })
                                                                                        .eq('id', d.id);
                                                                                    if (error) throw error;
                                                                                },
                                                                                'Reject Deposit',
                                                                                'Reject this deposit? This cannot be undone.'
                                                                            )}
                                                                            className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-lg shadow-red-500/20 transition-all active:scale-95"
                                                                        >
                                                                            Reject
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {deposits.length === 0 && (
                                                        <tr>
                                                            <td colSpan={7} className="px-8 py-12 text-center text-slate-400">
                                                                No deposit records found.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            } />

                            {/* USERS */}
                            <Route path="users" element={
                                <div className="space-y-6">
                                    <SectionHeader title="User Management" subtitle="View user details and balances" icon={Users} />
                                    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                                                    <tr>
                                                        <th className="px-8 py-6">User Info</th>
                                                        <th className="px-8 py-6 text-center">Referrals</th>
                                                        <th className="px-8 py-6 text-center">Deposit Bal.</th>
                                                        <th className="px-8 py-6 text-center">Earnings Bal.</th>
                                                        <th className="px-8 py-6 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {users.map((u: any) => (
                                                        <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-8 py-6">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs ring-2 ring-white shadow-sm">
                                                                        {u.email?.[0].toUpperCase()}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold text-slate-800 text-sm">{u.email}</p>
                                                                        <p className="text-[10px] text-slate-400 font-mono">UID: {u.id.substring(0, 6)}...</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-6 text-center">
                                                                <span className="inline-flex items-center justify-center bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold">
                                                                    {u.referral_count || 0}
                                                                </span>
                                                            </td>
                                                            <td className="px-8 py-6 text-center font-bold text-slate-700">
                                                                ${Number(u.balance || 0).toLocaleString()}
                                                            </td>
                                                            <td className="px-8 py-6 text-center font-bold text-emerald-600">
                                                                ${Number(u.earnings_balance || 0).toLocaleString()}
                                                            </td>
                                                            <td className="px-8 py-6 text-right">
                                                                <button className="p-2 text-slate-400 hover:text-emerald-500 transition-colors">
                                                                    <ExternalLink size={18} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            } />

                            {/* BOUNTIES */}
                            <Route path="bounties" element={
                                <div className="space-y-6">
                                    <SectionHeader title="Bounty Submissions" subtitle="Review marketing tasks" icon={Gift} />
                                    <div className="grid grid-cols-1 gap-6">
                                        {bounties.map((b: any) => (
                                            <div key={b.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-6 w-full md:w-auto">
                                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${b.platform === 'YouTube' ? 'bg-red-500 shadow-red-500/20' :
                                                        b.platform === 'Twitter' ? 'bg-sky-500 shadow-sky-500/20' :
                                                            'bg-indigo-500 shadow-indigo-500/20'
                                                        }`}>
                                                        {b.platform === 'YouTube' ? <Smartphone size={24} /> : <Globe size={24} />}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs font-black uppercase tracking-widest text-slate-400">{b.platform}</span>
                                                            <span className={`w-2 h-2 rounded-full ${b.status === 'paid' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                                        </div>
                                                        <p className="font-bold text-slate-800">{b.profiles?.email}</p>
                                                        <a href={b.link} target="_blank" rel="noreferrer" className="text-sm text-blue-500 hover:text-blue-600 hover:underline flex items-center gap-1 mt-1">
                                                            View Submission <ExternalLink size={12} />
                                                        </a>
                                                    </div>
                                                </div>

                                                <div className="w-full md:w-auto flex justify-end">
                                                    {b.status === 'pending' ? (
                                                        <button
                                                            onClick={() => markBountyPaid(b.id, 0)}
                                                            className="w-full md:w-auto bg-slate-900 text-white font-bold text-xs px-6 py-3 rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-slate-900/10 active:scale-95 flex items-center justify-center gap-2"
                                                        >
                                                            <Check size={16} /> Approve Reward
                                                        </button>
                                                    ) : (
                                                        <div className="bg-emerald-50 text-emerald-600 px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-2">
                                                            <Check size={16} /> Mark as Paid
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {bounties.length === 0 && (
                                            <div className="text-center py-12 bg-white rounded-[2rem] border border-dashed border-slate-200">
                                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4">
                                                    <Gift size={32} />
                                                </div>
                                                <p className="text-slate-400 font-medium">No active bounty submissions.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            } />

                            {/* CONTACTS */}
                            <Route path="contacts" element={
                                <div className="space-y-6">
                                    <SectionHeader title="Contact Messages" subtitle="View user inquiries" icon={Mail} />
                                    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                                                    <tr>
                                                        <th className="px-8 py-6">Name</th>
                                                        <th className="px-8 py-6">Email</th>
                                                        <th className="px-8 py-6">Message</th>
                                                        <th className="px-8 py-6">Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {(contacts as any[]).map((c: any) => (
                                                        <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-8 py-6 font-bold text-slate-800">
                                                                {c.name}
                                                            </td>
                                                            <td className="px-8 py-6 text-sm text-slate-600">
                                                                {c.email}
                                                            </td>
                                                            <td className="px-8 py-6 text-sm text-slate-600 max-w-md">
                                                                <p className="line-clamp-2">{c.message}</p>
                                                            </td>
                                                            <td className="px-8 py-6 text-xs text-slate-500 font-medium">
                                                                {new Date(c.created_at).toLocaleString()}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {contacts.length === 0 && (
                                                        <tr>
                                                            <td colSpan={4} className="px-8 py-12 text-center text-slate-400">
                                                                No contact messages yet.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            } />
                        </Routes>

                        {/* Footer System Info */}
                        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center text-slate-400 text-xs font-medium gap-4">
                            <p>© 2026 MineFlow Systems. All rights reserved.</p>
                            <div className="flex items-center gap-6">
                                <span className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                    System Online
                                </span>
                                <span>v2.4.0-stable</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <ConfirmationModal {...modalConfig as ConfirmModalProps} />
        </div>
    );
};
