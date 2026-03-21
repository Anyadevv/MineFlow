import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../LanguageContext';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import {
    Plus,
    ArrowUpRight,
    Wallet,
    TrendingUp,
    RefreshCw,
    Send,
    LayoutDashboard,
    History,
    Users,
    ChevronRight,
    LogOut,
    Zap,
    Menu,
    X,
} from 'lucide-react';
import { PLANS } from '../constants';
import { PlanCard } from '../components/PlanCard';
import { DepositModal } from '../components/DepositModal';
import { DepositDetails } from '../components/DepositDetails';
import { StatsPanel } from '../components/StatsPanel';
import { TransactionHistory } from '../components/TransactionHistory';
import { WithdrawModal } from '../components/WithdrawModal';
import { ReinvestModal } from '../components/ReinvestModal';
import { InsufficientBalanceModal } from '../components/InsufficientBalanceModal';
import { PlanConfirmationModal } from '../components/PlanConfirmationModal';
import { MinerDetailsModal } from '../components/MinerDetailsModal';
import { UserPlan } from '../types';
import { copyToClipboard } from '../lib/clipboard';

export const DashboardPage = ({ onNavigate }: { onNavigate: (page: string) => void }) => {
    const { user, profile, refreshProfile, signOut } = useAuth();
    const { t } = useLanguage();
    const [userPlans, setUserPlans] = useState<UserPlan[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [referralCount, setReferralCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('plans');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // Modal States
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [isReinvestModalOpen, setIsReinvestModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [selectedMethod, setSelectedMethod] = useState<any>(null);
    const [selectedCoin, setSelectedCoin] = useState<string>('');
    const [depositAmount, setDepositAmount] = useState<number>(0);

    // Plan Confirmation
    const [isPlanConfirmOpen, setIsPlanConfirmOpen] = useState(false);
    const [planConfirmStatus, setPlanConfirmStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [planConfirmError, setPlanConfirmError] = useState('');
    const [activePlanAmount, setActivePlanAmount] = useState<number>(0);
    const [estimatedRoi, setEstimatedRoi] = useState<any>(null);

    // Miner Details
    const [isMinerDetailsOpen, setIsMinerDetailsOpen] = useState(false);
    const [selectedMiner, setSelectedMiner] = useState<UserPlan | null>(null);

    const [insufficientModalOpen, setInsufficientModalOpen] = useState(false);
    const [insufficientData, setInsufficientData] = useState({ required: 0, available: 0 });
    const [refCopied, setRefCopied] = useState(false);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch User Plans (My Miners) - READING EXCLUSIVELY FROM user_plans
            const { data: plansData, error: plansError } = await supabase
                .from('user_plans')
                .select('*')
                .eq('user_id', user!.id)
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (plansError) throw plansError;
            console.log("[Dashboard Debug] User Plans found:", plansData?.length, plansData);
            setUserPlans(plansData as UserPlan[]);

            // ... (rest of unified history)
            const { data: txData, error: txError } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user!.id)
                .order('created_at', { ascending: false });

            if (txError) throw txError;
            console.log("[Dashboard Debug] Transactions found:", txData?.length);

            // Map transactions
            const mappedTxs = txData.map(t => ({
                id: t.id,
                type: t.type,
                amount: t.amount,
                status: t.status,
                created_at: t.created_at,
                currency: 'USD',
                network: '-'
            }));

            setTransactions(mappedTxs);

            // Referral Count
            // ... (rest of fetch data)
            const { count: refCount, error: refError } = await supabase
                .from('referrals')
                .select('*', { count: 'exact', head: true })
                .eq('referrer_id', user!.id);

            if (refError) throw refError;
            setReferralCount(refCount || 0);

            await refreshProfile();
        } catch (err: any) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePlanSelect = async (plan: any, amount: number) => {
        const currentBalance = profile?.deposit_balance || 0;

        if (currentBalance < amount) {
            setInsufficientData({ required: amount, available: currentBalance });
            setInsufficientModalOpen(true);
            return;
        }

        setSelectedPlan(plan);
        setActivePlanAmount(amount);
        setPlanConfirmStatus('loading'); // Show loading while fetching ROI
        setIsPlanConfirmOpen(true);

        try {
            const { data, error } = await supabase.rpc('calculate_plan_roi', {
                p_amount: amount,
                p_daily_percent: plan.dailyProfit,
                p_duration_days: plan.durationDays
            });

            if (error) throw error;
            setEstimatedRoi(data);
            setPlanConfirmStatus('idle');
        } catch (err: any) {
            console.error("ROI Calculation Error", err);
            setPlanConfirmError("Failed to calculate ROI. Please try again.");
            setPlanConfirmStatus('error');
        }
    };

    const executePlanActivation = async () => {
        if (!user || !selectedPlan) return;

        setPlanConfirmStatus('loading');
        setPlanConfirmError('');

        try {
            const { data, error } = await supabase.rpc('activate_plan', {
                p_user_id: user.id,
                p_plan_id: selectedPlan.id,
                p_amount: activePlanAmount,
                p_daily_percent: selectedPlan.dailyProfit,
                p_duration_days: selectedPlan.durationDays
            });

            if (error) throw error;
            const res = data as any;
            if (res && res.success === false) throw new Error(res.error || 'Unknown error');

            setPlanConfirmStatus('success');
            await fetchData();
        } catch (err: any) {
            console.error("Plan Activation Failed", err);
            setPlanConfirmStatus('error');
            setPlanConfirmError(err.message || 'Failed to activate plan.');
        }
    };

    const handleMethodSelect = (method: any, coin: string) => {
        setSelectedMethod(method);
        setSelectedCoin(coin);
        setIsDepositModalOpen(false);
        setIsDetailsModalOpen(true);
    };

    const handleDepositSuccess = () => {
        setIsDetailsModalOpen(false);
        setSelectedMethod(null);
        fetchData();
        setActiveTab('transactions');
    };

    // Helper to get Plan Name
    const getPlanName = (planId: string) => {
        const plan = PLANS.find(p => p.id === planId);
        return plan ? plan.name : planId;
    };

    const handleViewDetails = (miner: UserPlan) => {
        setSelectedMiner(miner);
        setIsMinerDetailsOpen(true);
    };

    const sidebarItems = [
        { id: 'plans', label: 'Add Funds', icon: <Plus size={20} /> },
        { id: 'withdraw', label: 'Withdraw', icon: <ArrowUpRight size={20} /> },
        { id: 'reinvest', label: 'Reinvest', icon: <RefreshCw size={20} /> },
    ];

    return (
        <div className="flex bg-slate-50 min-h-screen">
            {/* Sidebar */}
            <aside className="w-72 bg-white border-r border-slate-100 hidden lg:flex flex-col sticky top-20 h-[calc(100vh-5rem)]">
                <div className="p-8 space-y-8">
                    <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Navigation</p>
                        <nav className="space-y-1">
                            {[
                                { id: 'plans', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
                                { id: 'investments', label: 'My Miners', icon: <TrendingUp size={20} /> },
                                { id: 'transactions', label: 'History', icon: <History size={20} /> },
                                { id: 'referrals', label: 'Referrals', icon: <Users size={20} /> },
                                { id: 'wallet-settings', label: 'Wallet Settings', icon: <Wallet size={20} /> },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => item.id === 'wallet-settings' ? onNavigate('/wallet-settings') : setActiveTab(item.id)}
                                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl font-bold transition-all ${activeTab === item.id
                                        ? 'bg-emerald-50 text-emerald-600 shadow-sm shadow-emerald-500/5'
                                        : 'text-slate-500 hover:bg-slate-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {item.icon}
                                        <span className="text-sm">{item.label}</span>
                                    </div>
                                    {activeTab === item.id && <ChevronRight size={16} />}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Actions</p>
                        <div className="space-y-1">
                            {sidebarItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        if (item.id === 'plans') setIsDepositModalOpen(true);
                                        if (item.id === 'withdraw') setIsWithdrawModalOpen(true);
                                        if (item.id === 'reinvest') setIsReinvestModalOpen(true);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all text-sm group"
                                >
                                    <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-white transition-colors">{item.icon}</div>
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-auto p-8 border-t border-slate-100 space-y-4">
                    <div className="px-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Signed in as</p>
                        <p className="text-sm font-bold text-slate-700 truncate">{profile?.email}</p>
                    </div>
                    <button
                        onClick={() => signOut()}
                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-red-500 hover:bg-red-50 transition-all text-sm"
                    >
                        <LogOut size={20} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 lg:p-12 space-y-10">
                {/* Drawer Overlay */}
                {isMobileSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] lg:hidden animate-in fade-in duration-300"
                        onClick={() => setIsMobileSidebarOpen(false)}
                    />
                )}

                {/* Mobile Drawer */}
                <aside className={`fixed top-0 left-0 bottom-0 w-full xs:w-80 bg-white z-[100] lg:hidden shadow-2xl transition-all duration-300 transform ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="flex flex-col h-full">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="bg-emerald-500 p-2 rounded-lg">
                                    <TrendingUp size={20} className="text-white" />
                                </div>
                                <span className="font-bold text-slate-800">MineFlow</span>
                            </div>
                            <button
                                onClick={() => setIsMobileSidebarOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-grow overflow-y-auto p-8 space-y-8">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Navigation</p>
                                <nav className="space-y-1">
                                    {[
                                        { id: 'plans', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
                                        { id: 'investments', label: 'My Miners', icon: <TrendingUp size={20} /> },
                                        { id: 'transactions', label: 'History', icon: <History size={20} /> },
                                        { id: 'referrals', label: 'Referrals', icon: <Users size={20} /> },
                                        { id: 'wallet-settings', label: 'Wallet Settings', icon: <Wallet size={20} /> },
                                    ].map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                if (item.id === 'wallet-settings') {
                                                    onNavigate('/wallet-settings');
                                                } else {
                                                    setActiveTab(item.id);
                                                }
                                                setIsMobileSidebarOpen(false);
                                            }}
                                            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl font-bold transition-all ${activeTab === item.id
                                                ? 'bg-emerald-50 text-emerald-600 shadow-sm shadow-emerald-500/5'
                                                : 'text-slate-500 hover:bg-slate-50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                {item.icon}
                                                <span className="text-sm">{item.label}</span>
                                            </div>
                                            {activeTab === item.id && <ChevronRight size={16} />}
                                        </button>
                                    ))}
                                </nav>
                            </div>

                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Actions</p>
                                <div className="space-y-1">
                                    {sidebarItems.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                if (item.id === 'plans') setIsDepositModalOpen(true);
                                                if (item.id === 'withdraw') setIsWithdrawModalOpen(true);
                                                if (item.id === 'reinvest') setIsReinvestModalOpen(true);
                                                setIsMobileSidebarOpen(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all text-sm group"
                                        >
                                            <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-white transition-colors">{item.icon}</div>
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-8 border-t border-slate-100 space-y-4">
                            <div className="px-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Signed in as</p>
                                <p className="text-sm font-bold text-slate-700 truncate">{profile?.email}</p>
                            </div>
                            <button
                                onClick={() => {
                                    signOut();
                                    setIsMobileSidebarOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-red-500 hover:bg-red-50 transition-all text-sm"
                            >
                                <LogOut size={20} />
                                Logout
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Mobile/Desktop Header for User Info */}
                <div className="flex justify-between items-center lg:hidden">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsMobileSidebarOpen(true)}
                            className="p-2 -ml-2 text-slate-600 hover:bg-emerald-50 rounded-xl transition-colors"
                        >
                            <Menu size={28} />
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="bg-emerald-500 p-2 rounded-lg">
                                <TrendingUp size={20} className="text-white" />
                            </div>
                            <span className="font-bold text-slate-800">MineFlow</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-500 truncate max-w-[120px]">{profile?.email}</span>
                        <button onClick={() => signOut()} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><LogOut size={20} /></button>
                    </div>
                </div>



                {/* Balance & Stats Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Deposit Card */}
                    <div className="relative overflow-hidden p-10 rounded-[2.5rem] bg-slate-900 text-white shadow-2xl shadow-slate-900/20 transition-all hover:scale-[1.01] hover:shadow-slate-900/30 group">
                        <div className="absolute right-[-5%] top-[-5%] opacity-10 group-hover:opacity-15 transition-opacity"><Wallet size={160} /></div>
                        <div className="relative z-10 space-y-8">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                                    <p className="text-slate-400 font-black text-[10px] sm:text-[11px] tracking-[0.2em] uppercase">Deposit Balance</p>
                                </div>
                                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white">
                                    {loading || !profile ? (
                                        <span className="animate-pulse">...</span>
                                    ) : (
                                        `$${(profile.deposit_balance || 0).toFixed(2)}`
                                    )}
                                </h2>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setIsDepositModalOpen(true)} className="flex-1 bg-emerald-500 hover:bg-emerald-400 px-6 py-4 rounded-2xl font-black text-xs transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] tracking-wide">ADD FUNDS</button>
                            </div>
                        </div>
                    </div>
                    {/* Earning Card */}
                    <div className="relative overflow-hidden p-10 rounded-[2.5rem] bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-2xl shadow-emerald-500/20 transition-all hover:scale-[1.01] hover:shadow-emerald-500/30 group">
                        <div className="absolute right-[-5%] top-[-5%] opacity-10 group-hover:opacity-15 transition-opacity"><TrendingUp size={160} /></div>
                        <div className="relative z-10 space-y-8">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                                    <p className="text-emerald-100/80 font-black text-[10px] sm:text-[11px] tracking-[0.2em] uppercase">Earning Balance</p>
                                </div>
                                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white">
                                    {loading || !profile ? (
                                        <span className="animate-pulse">...</span>
                                    ) : (
                                        `$${(profile.earnings_balance || 0).toFixed(2)}`
                                    )}
                                </h2>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setIsReinvestModalOpen(true)} className="flex-1 bg-white text-emerald-600 hover:bg-emerald-50 px-6 py-4 rounded-2xl font-black text-xs transition-all shadow-lg active:scale-[0.98] tracking-wide">REINVEST</button>
                                <button onClick={() => setIsWithdrawModalOpen(true)} className="flex-1 bg-emerald-800/20 hover:bg-emerald-800/30 border border-white/10 px-6 py-4 rounded-2xl font-black text-xs transition-all backdrop-blur-sm active:scale-[0.98] text-white tracking-wide">WITHDRAW</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Grid Stats */}
                <StatsPanel
                    activeMiners={userPlans.length}
                    totalInvested={Number(profile?.total_deposited || 0)}
                    totalTransactions={transactions.length}
                    totalProfit={Number(profile?.earnings_balance || 0)}
                    referralCount={referralCount}
                />

                {/* Tab Content Container */}
                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
                    {activeTab === 'plans' && (
                        <div className="p-6 sm:p-10 space-y-8 sm:space-y-10 animate-in fade-in duration-300">
                            <div>
                                <h3 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">INVESTMENT PLANS</h3>
                                <p className="text-slate-400 font-bold text-xs sm:text-sm mt-1">Choose a plan and start your mining operation instantly.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {PLANS.map((plan) => (
                                    <PlanCard key={plan.id} plan={plan} onSelect={handlePlanSelect} compact={true} />
                                ))}
                            </div>
                        </div>
                    )}

                    {
                        activeTab === 'investments' && (
                            <div className="animate-in fade-in duration-300">
                                <div className="p-6 sm:p-10 border-b border-slate-50">
                                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">MY MINERS</h3>
                                </div>

                                {userPlans.length > 0 ? (
                                    <div className="p-6 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {userPlans.map((plan) => {
                                            const totalDays = plan.duration_days;
                                            const startDate = new Date(plan.start_date || '');
                                            const endDate = new Date(plan.end_date || '');
                                            const now = new Date();
                                            const elapsedDays = Math.max(0, Math.min(totalDays, Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))));
                                            const progress = (elapsedDays / totalDays) * 100;
                                            const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

                                            return (
                                                <div key={plan.id} className="relative overflow-hidden bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all hover:scale-[1.01] group">
                                                    <div className="absolute top-0 left-0 w-full h-1 bg-slate-50">
                                                        <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                                                    </div>

                                                    <div className="flex justify-between items-start mb-6">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase ${plan.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                                                    {plan.status}
                                                                </span>
                                                            </div>
                                                            <h4 className="text-xl font-black text-slate-800 tracking-tight">{getPlanName(plan.plan_id)} Miner</h4>
                                                        </div>
                                                        <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                                            <Zap size={24} />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Investment</p>
                                                            <p className="text-lg font-black text-slate-800 pl-1">${plan.amount.toLocaleString()}</p>
                                                        </div>
                                                        <div className="space-y-1 text-right">
                                                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest pr-1">Estimated Return</p>
                                                            <p className="text-lg font-black text-emerald-500 pr-1">${(plan.total_return || 0).toLocaleString()}</p>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mining Progress</span>
                                                            <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{daysRemaining} Days Left</span>
                                                        </div>
                                                        <div className="h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100/50">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                                                style={{ width: `${progress}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-8 flex gap-3">
                                                        <button
                                                            onClick={() => handleViewDetails(plan)}
                                                            className="flex-1 py-4 rounded-2xl bg-slate-50 text-slate-700 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95"
                                                        >
                                                            Details
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveTab('reinvest');
                                                                setIsReinvestModalOpen(true);
                                                            }}
                                                            className="px-6 py-4 rounded-2xl bg-emerald-50 text-emerald-600 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all active:scale-95"
                                                        >
                                                            Reinvest
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (<div className="p-10 flex flex-col items-center justify-center min-h-[400px] text-center space-y-6">
                                    <div className="p-10 bg-slate-50 rounded-[3rem] text-slate-200"><TrendingUp size={64} /></div>
                                    <h4 className="text-xl font-black text-slate-800">No Active Miners</h4>
                                    <button onClick={() => setActiveTab('plans')} className="bg-emerald-500 text-white px-10 py-4 rounded-2xl font-black shadow-lg hover:shadow-emerald-500/25 transition-all active:scale-95">Start Earning Now</button>
                                </div>
                                )}
                            </div>
                        )
                    }

                    {
                        activeTab === 'transactions' && (
                            <div className="animate-in fade-in duration-300">
                                <div className="p-6 sm:p-10 border-b border-slate-50">
                                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">TRANSACTION HISTORY</h3>
                                </div>
                                <div className="p-4 sm:p-10">
                                    <TransactionHistory transactions={transactions} />
                                </div>
                            </div>
                        )
                    }

                    {
                        activeTab === 'referrals' && (
                            <div className="p-10 space-y-10 animate-in fade-in duration-300">
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">REFERRAL PROGRAM</h3>
                                <div className="bg-emerald-50 border border-emerald-100 p-6 md:p-10 rounded-[2.5rem] space-y-6">
                                    <p className="text-emerald-800 font-bold">Earn a 5% commission from your referral's first investment.</p>
                                    <div className="space-y-4">
                                        <p className="text-sm font-black text-emerald-600 uppercase tracking-widest">Your Referral Link</p>
                                        <div className="flex flex-col md:flex-row gap-3">
                                            <div className="flex-1 bg-white px-6 py-4 rounded-2xl border border-emerald-100 font-bold text-emerald-900 truncate">
                                                {`${window.location.origin}/?ref=${profile?.referral_code || ''}`}
                                            </div>
                                            <button onClick={async () => {
                                                const success = await copyToClipboard(`${window.location.origin}/?ref=${profile?.referral_code || ''}`);
                                                if (success) {
                                                    setRefCopied(true);
                                                    setTimeout(() => setRefCopied(false), 2000);
                                                }
                                            }} className={`${refCopied ? 'bg-emerald-600' : 'bg-emerald-500'} text-white px-8 py-4 rounded-2xl font-black shadow-lg transition-all w-full md:w-auto`}>
                                                {refCopied ? 'COPIED!' : 'COPY'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    }
                </div >
            </main >

            {/* Modals */}
            < DepositModal
                isOpen={isDepositModalOpen}
                onClose={() => setIsDepositModalOpen(false)}
                onSelect={handleMethodSelect}
                amount={depositAmount}
            />

            {selectedMethod && (
                <DepositDetails
                    isOpen={isDetailsModalOpen}
                    onClose={() => {
                        setIsDetailsModalOpen(false);
                        setSelectedMethod(null);
                    }}
                    onSuccess={handleDepositSuccess}
                    method={selectedMethod}
                    coin={selectedCoin}
                    amount={depositAmount}
                />
            )}

            <WithdrawModal
                isOpen={isWithdrawModalOpen}
                onClose={() => setIsWithdrawModalOpen(false)}
                onSuccess={() => {
                    fetchData();
                    setActiveTab('transactions');
                }}
                onNavigateToSettings={() => onNavigate('/wallet-settings')}
            />

            <ReinvestModal
                isOpen={isReinvestModalOpen}
                onClose={() => setIsReinvestModalOpen(false)}
                onSuccess={() => {
                    fetchData();
                    setActiveTab('transactions');
                }}
            />

            <PlanConfirmationModal
                isOpen={isPlanConfirmOpen}
                onClose={() => {
                    setIsPlanConfirmOpen(false);
                    if (planConfirmStatus === 'success') {
                        setActiveTab('investments');
                    }
                }}
                onConfirm={executePlanActivation}
                plan={selectedPlan}
                amount={activePlanAmount}
                currentBalance={profile?.deposit_balance || 0}
                status={planConfirmStatus}
                errorMessage={planConfirmError}
                estimatedRoi={estimatedRoi}
            />

            <InsufficientBalanceModal
                isOpen={insufficientModalOpen}
                onClose={() => setInsufficientModalOpen(false)}
                onAddFunds={() => {
                    setInsufficientModalOpen(false);
                    setIsDepositModalOpen(true);
                }}
                required={insufficientData.required}
                available={insufficientData.available}
            />

            <MinerDetailsModal
                isOpen={isMinerDetailsOpen}
                onClose={() => setIsMinerDetailsOpen(false)}
                miner={selectedMiner}
                planName={selectedMiner ? getPlanName(selectedMiner.plan_id) : ''}
            />
        </div >
    );
};
