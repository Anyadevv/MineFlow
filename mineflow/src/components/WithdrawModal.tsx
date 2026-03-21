import React, { useState, useEffect } from 'react';
import { X, Bitcoin, Hexagon, Zap, ArrowUpRight, Loader2, AlertCircle, CheckCircle2, Wallet as WalletIcon, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface WithdrawModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    onNavigateToSettings: () => void;
}

const NETWORKS = [
    { id: 'btc', name: 'BTC Network', icon: <Bitcoin className="w-6 h-6" />, color: 'bg-orange-500' },
    { id: 'eth', name: 'ETH Network', icon: <Hexagon className="w-6 h-6" />, color: 'bg-blue-600' },
    { id: 'tron', name: 'TRON Network', icon: <Hexagon className="w-6 h-6" />, color: 'bg-red-600' },
    { id: 'bnb', name: 'BNB Network', icon: <Hexagon className="w-6 h-6" />, color: 'bg-yellow-500' },
    { id: 'solana', name: 'SOLANA Network', icon: <Zap className="w-6 h-6" />, color: 'bg-purple-600' },
    { id: 'ton', name: 'TON Network', icon: <Hexagon className="w-6 h-6" />, color: 'bg-sky-500' },
    { id: 'base', name: 'BASE Network', icon: <Zap className="w-6 h-6" />, color: 'bg-blue-400' },
];

export const WithdrawModal: React.FC<WithdrawModalProps> = ({ isOpen, onClose, onSuccess, onNavigateToSettings }) => {
    const { user, profile, refreshProfile } = useAuth();
    const [amount, setAmount] = useState<string>('');
    const [selectedNetwork, setSelectedNetwork] = useState<string>('');
    const [savedWallet, setSavedWallet] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [fetchingWallet, setFetchingWallet] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [selectedToken, setSelectedToken] = useState<string>('USDT');

    useEffect(() => {
        if (isOpen && selectedNetwork && user) {
            fetchWallet();
        } else {
            setSavedWallet(null);
        }
    }, [isOpen, selectedNetwork, user]);

    const fetchWallet = async () => {
        setFetchingWallet(true);
        try {
            // Fetch wallet from profiles table based on network
            const walletField = `wallet_${selectedNetwork}` as keyof typeof profile;
            const walletAddress = profile?.[walletField] as string | null;

            if (walletAddress) {
                setSavedWallet(walletAddress);
            } else {
                setSavedWallet(null);
            }
        } catch (err) {
            console.error('Error fetching wallet:', err);
        } finally {
            setFetchingWallet(false);
        }
    };

    // Referral check state
    const [referralCount, setReferralCount] = useState<number | null>(null);
    const [fetchingReferrals, setFetchingReferrals] = useState(false);
    const [referralBlockParams, setReferralBlockParams] = useState<{ blocked: boolean, count: number }>({ blocked: false, count: 0 });

    useEffect(() => {
        if (isOpen && user) {
            fetchReferralCount();
        }
    }, [isOpen, user]);

    const fetchReferralCount = async () => {
        setFetchingReferrals(true);
        try {
            // Restore a simple, direct query (No RPC needed)
            const { count, error } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('referrer_id', user?.id)
                .gt('total_deposited', 0);

            if (error) throw error;
            setReferralCount(count || 0);
        } catch (err) {
            console.error('Error fetching referrals:', err);
            setReferralCount(0); // Default to 0 on error to be safe
        } finally {
            setFetchingReferrals(false);
        }
    };

    const handleWithdraw = async () => {
        if (!user || !profile || !selectedNetwork || !savedWallet) return;

        // Valid Referral Check
        if (referralCount !== null && referralCount < 3) {
            setReferralBlockParams({ blocked: true, count: referralCount });
            return;
        }

        const withdrawAmount = parseFloat(amount);
        if (isNaN(withdrawAmount) || withdrawAmount < 5) {
            setError('Minimum withdrawal amount is $5.00');
            return;
        }

        // Check balance (must use earnings_balance for withdrawals)
        if (withdrawAmount > (profile.earnings_balance || 0)) {
            setError('Insufficient earnings balance');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Call Secure Withdrawal RPC
            // This function validates balance, deducts it, and creates the request
            const { data: rpcData, error: rpcError } = await supabase.rpc('submit_withdrawal_request', {
                p_user_id: user.id,
                p_amount: withdrawAmount,
                p_network: selectedNetwork.toUpperCase(),
                p_address: savedWallet,
                p_coin: selectedToken
            });

            if (rpcError) throw rpcError;

            const result = rpcData as any;
            if (result && result.success === false) {
                throw new Error(result.message || 'Failed to process withdrawal');
            }

            setSuccess(true);
            await refreshProfile();
            setTimeout(() => {
                onSuccess();
                onClose();
                setSuccess(false);
                setAmount('');
                setSelectedNetwork('');
                setSelectedToken('USDT');
            }, 2500);
        } catch (err: any) {
            console.error('Withdrawal error:', err);
            setError(err.message || 'Failed to process withdrawal');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {success ? (
                    <div className="p-12 text-center space-y-6">
                        <div className="flex justify-center">
                            <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center animate-bounce">
                                <CheckCircle2 size={40} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-slate-800 uppercase">Withdrawal Requested</h3>
                            <p className="text-slate-500 font-bold">Your request will be processed and credited within 24 hours.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Withdraw Funds</h2>
                                <p className="text-slate-400 font-bold text-sm mt-1">
                                    Available: <span className="text-emerald-500 font-black">${(profile?.earnings_balance || 0).toFixed(2)}</span>
                                </p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                <X className="text-slate-400" />
                            </button>
                        </div>

                        {/* Referral Block Popup Overlay */}
                        {referralBlockParams.blocked && (
                            <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-200">
                                <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center animate-bounce mb-6">
                                    <Users size={48} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 uppercase text-center mb-4">Action Required</h3>
                                <p className="text-slate-500 font-bold text-center max-w-sm mb-8">
                                    To unlock withdrawals, you need at least <span className="text-slate-900">3 referrals</span> with active deposits.
                                </p>
                                <div className="bg-slate-50 rounded-2xl p-6 w-full max-w-xs mb-8 border border-slate-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Progress</span>
                                        <span className="text-xs font-black text-slate-800 uppercase tracking-widest">{referralBlockParams.count} / 3</span>
                                    </div>
                                    <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-red-500 transition-all duration-1000"
                                            style={{ width: `${Math.min((referralBlockParams.count / 3) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setReferralBlockParams({ blocked: false, count: 0 })}
                                    className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 active:scale-95"
                                >
                                    Understood
                                </button>
                            </div>
                        )}

                        <div className="p-8 space-y-6">
                            {/* Network Selection */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Select Network</label>
                                <div className="grid grid-cols-4 gap-3">
                                    {NETWORKS.map((network) => (
                                        <button
                                            key={network.id}
                                            onClick={() => {
                                                setSelectedNetwork(network.id);
                                                setError(null);
                                            }}
                                            className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${selectedNetwork === network.id
                                                ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/10'
                                                : 'border-slate-100 hover:border-slate-200 bg-white'
                                                }`}
                                        >
                                            <div className={`${network.color} p-2 rounded-lg text-white`}>
                                                {network.icon}
                                            </div>
                                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">{network.id}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Wallet Display */}
                            <div className="p-5 rounded-2.5xl bg-slate-50 border border-slate-100 min-h-[80px] flex flex-col justify-center">
                                {fetchingWallet ? (
                                    <div className="flex items-center gap-3 text-slate-400 animate-pulse">
                                        <Loader2 className="animate-spin" size={20} />
                                        <span className="text-xs font-bold uppercase tracking-wider">Fetching saved address...</span>
                                    </div>
                                ) : selectedNetwork ? (
                                    savedWallet ? (
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Withdrawal Address</p>
                                            <p className="text-xs font-bold text-slate-800 break-all">{savedWallet}</p>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 text-amber-600">
                                                <AlertCircle size={20} />
                                                <span className="text-xs font-bold uppercase tracking-wider">No address set</span>
                                            </div>
                                            <button
                                                onClick={onNavigateToSettings}
                                                className="px-4 py-2 bg-slate-900 text-white text-[10px] font-black rounded-lg hover:bg-emerald-600 transition-colors"
                                            >
                                                SET ADDRESS
                                            </button>
                                        </div>
                                    )
                                ) : (
                                    <div className="flex items-center gap-3 text-slate-300">
                                        <WalletIcon size={20} />
                                        <span className="text-xs font-bold uppercase tracking-wider">Select a network to continue</span>
                                    </div>
                                )}
                            </div>

                            {/* Amount Input */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Amount to Withdraw</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="5"
                                        step="0.01"
                                        value={amount}
                                        onChange={(e) => {
                                            setAmount(e.target.value);
                                            setError(null);
                                        }}
                                        placeholder="0.00"
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 font-black text-slate-800 text-2xl focus:outline-none focus:border-emerald-500 transition-all placeholder:text-slate-200"
                                    />
                                    <button
                                        onClick={() => setAmount((profile?.earnings_balance || 0).toString())}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 px-4 py-2 bg-emerald-100 text-emerald-600 text-[10px] font-black rounded-lg hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                    >
                                        MAX
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-bold flex items-center gap-3 animate-shake">
                                    <AlertCircle size={18} /> {error}
                                </div>
                            )}

                            <button
                                disabled={loading || !selectedNetwork || !savedWallet || !amount || parseFloat(amount) <= 0}
                                onClick={handleWithdraw}
                                className={`w-full py-5 rounded-[1.5rem] font-black tracking-widest text-sm transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 ${loading || !selectedNetwork || !savedWallet || !amount || parseFloat(amount) <= 0
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                    : 'bg-slate-900 text-white hover:bg-emerald-600 shadow-emerald-500/10'
                                    }`}
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <>
                                        <ArrowUpRight size={20} /> CONFIRM WITHDRAWAL
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="p-6 bg-slate-50 border-t border-slate-100">
                            <p className="text-[10px] text-slate-400 text-center font-bold">
                                Withdrawal processing can take up to 24 hours. Ensure your address is correct.
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
