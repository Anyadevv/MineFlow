import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import {
    Wallet,
    Shield,
    CheckCircle2,
    AlertCircle,
    Copy,
    Edit3,
    Save,
    Loader2,
    Bitcoin,
    Hexagon,
    Zap,
    LayoutDashboard
} from 'lucide-react';

const NETWORKS = [
    {
        id: 'btc',
        name: 'BTC Network',
        label: 'Bitcoin (BTC Network)',
        icon: <Bitcoin className="text-orange-500" size={24} />,
    },
    {
        id: 'eth',
        name: 'ETH Network',
        label: 'Ethereum (ERC20)',
        icon: <Hexagon className="text-blue-500" size={24} />,
    },
    {
        id: 'bnb',
        name: 'BNB Network',
        label: 'BNB Smart Chain (BEP20)',
        icon: <Zap className="text-yellow-500" size={24} />,
    },
    {
        id: 'tron',
        name: 'TRON Network',
        label: 'TRON (TRC20)',
        icon: <Hexagon className="text-red-500" size={24} />,
    },
    {
        id: 'solana',
        name: 'SOLANA Network',
        label: 'Solana',
        icon: <Hexagon className="text-purple-500" size={24} />,
    },
    {
        id: 'ton',
        name: 'TON Network',
        label: 'TON Network',
        icon: <Hexagon className="text-blue-400" size={24} />,
    },
    {
        id: 'base',
        name: 'BASE Network',
        label: 'Base Network',
        icon: <Hexagon className="text-blue-600" size={24} />,
    }
];

export const WalletSettingsPage = () => {
    const { profile, refreshProfile, user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [wallets, setWallets] = useState<Record<string, string>>({});

    useEffect(() => {
        if (profile) {
            const walletMap: Record<string, string> = {};
            NETWORKS.forEach(network => {
                const column = `wallet_${network.id}` as keyof typeof profile;
                if (profile[column]) {
                    walletMap[network.id] = profile[column] as string;
                }
            });
            setWallets(walletMap);
            setLoading(false);
        }
    }, [profile]);

    const handleSave = async (networkId: string) => {
        if (!user) return;
        const address = wallets[networkId];

        if (!address || address.trim().length < 10) {
            setError(`Please enter a valid address for ${networkId.toUpperCase()}`);
            return;
        }

        setSaving(networkId);
        setError(null);
        setSuccess(null);

        try {
            const columnName = `wallet_${networkId}`;
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ [columnName]: address.trim() })
                .eq('id', user.id);

            if (updateError) throw updateError;

            await refreshProfile();

            setSuccess(networkId);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            console.error('Error saving wallet:', err);
            setError(`Failed to save: ${err.message}`);
        } finally {
            setSaving(null);
        }
    };

    const handleCopy = (address: string) => {
        if (!address) return;
        navigator.clipboard.writeText(address);
        // Silent copy or small toast could go here
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 animate-pulse">
                <div className="h-10 bg-emerald-100 rounded-xl w-1/3"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-48 bg-white rounded-[2rem] border border-slate-100 shadow-sm"></div>)}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-12 space-y-10 animate-in fade-in duration-500">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Withdrawal Wallet Settings</h1>
                <p className="text-slate-400 font-bold text-sm">Configure your withdrawal addresses for each network.</p>
            </div>

            {/* Info Banner */}
            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] flex items-start gap-4 shadow-sm">
                <div className="bg-emerald-500 text-white p-3 rounded-2xl shadow-lg shadow-emerald-500/20">
                    <Wallet size={24} />
                </div>
                <div>
                    <p className="text-emerald-800 font-bold">Important Notice</p>
                    <p className="text-emerald-600/80 text-sm font-medium">Your withdrawal addresses will be used to process payouts automatically. Please double-check all addresses to avoid loss of funds.</p>
                </div>
            </div>

            {/* Wallet Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {NETWORKS.map((network) => (
                    <div key={network.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-emerald-100 group relative overflow-hidden">
                        {success === network.id && (
                            <div className="absolute inset-0 bg-emerald-500/5 backdrop-blur-[1px] flex items-center justify-center z-10 animate-in fade-in duration-300">
                                <div className="bg-white px-4 py-2 rounded-full shadow-lg border border-emerald-100 flex items-center gap-2 scale-110">
                                    <CheckCircle2 className="text-emerald-500" size={16} />
                                    <span className="text-emerald-500 font-black text-[10px] tracking-widest uppercase">Saved Successfully</span>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-slate-50 rounded-[1.25rem] group-hover:bg-emerald-50 transition-colors duration-500">
                                    {network.icon}
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-800 uppercase tracking-tight">{network.name}</h3>
                                    <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">{network.label}</p>
                                </div>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase ${wallets[network.id] ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                {wallets[network.id] ? 'Configured' : 'Not Set'}
                            </div>
                        </div>

                        <div className="space-y-4">
                            {error && saving === network.id && (
                                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold flex items-center gap-2">
                                    <AlertCircle size={14} /> {error}
                                </div>
                            )}
                            <div className="relative group/input">
                                <input
                                    type="text"
                                    value={wallets[network.id] || ''}
                                    onChange={(e) => setWallets({ ...wallets, [network.id]: e.target.value })}
                                    placeholder="Enter your wallet address"
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-6 pr-12 font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm truncate"
                                />
                                {wallets[network.id] && (
                                    <button
                                        onClick={() => handleCopy(wallets[network.id])}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-emerald-500 transition-colors"
                                    >
                                        <Copy size={16} />
                                    </button>
                                )}
                            </div>

                            <button
                                disabled={!wallets[network.id] || saving === network.id}
                                onClick={() => handleSave(network.id)}
                                className={`w-full py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg ${wallets[network.id]
                                    ? 'bg-slate-900 text-white hover:bg-emerald-600 shadow-slate-900/10'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                    }`}
                            >
                                {saving === network.id ? (
                                    <Loader2 className="animate-spin" size={18} />
                                ) : (
                                    <>
                                        <Save size={18} /> SAVE ADDRESS
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Security Notice */}
            <div className="bg-amber-50 border border-amber-100 p-8 rounded-[2.5rem] flex items-center gap-6 group">
                <div className="p-4 bg-amber-100 text-amber-600 rounded-[1.5rem] group-hover:scale-110 transition-transform">
                    <Shield size={32} />
                </div>
                <div>
                    <h4 className="font-black text-slate-800 uppercase tracking-tight">Security Guarantee</h4>
                    <p className="text-amber-700/70 text-sm font-bold">MineFlow will never change your withdrawal address without your explicit email confirmation and 2FA. Your funds are protected by multi-layer security.</p>
                </div>
            </div>
        </div>
    );
};
