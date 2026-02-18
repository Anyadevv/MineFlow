import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { Loader2, Users, Crown } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

type Payout = Database['public']['Tables']['payouts']['Row'];

export const LastPayouts = () => {
    const { t } = useLanguage();
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPayouts = async () => {
        try {
            const { data, error } = await supabase.rpc('get_payouts');
            if (error) throw error;
            if (data) {
                setPayouts(data);
            }
        } catch (err) {
            console.error('Error fetching payouts:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayouts();

        // Refresh every minute to keep relative times updated and fetch new data
        const interval = setInterval(fetchPayouts, 60000);
        return () => clearInterval(interval);
    }, []);

    // Helper to format time relative to now
    const getRelativeTime = (dateString: string) => {
        const timestamp = new Date(dateString).getTime();
        const now = Date.now();
        const diffInMinutes = Math.floor((now - timestamp) / 60000);

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes === 1) return '1 min ago';
        if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;

        const hours = Math.floor(diffInMinutes / 60);
        if (hours === 1) return '1 hour ago';
        if (hours < 24) return `${hours} hours ago`;

        return '1 day ago';
    };

    return (
        <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-slate-800 mb-12">
            <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-8 bg-amber-500 rounded-full block"></span>
                    {t('stats.last_payouts') || 'Last 20 Payouts'}
                </h3>
                <span className="text-emerald-400 text-sm font-bold flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    {t('stats.live') || 'Live Updates'}
                </span>
            </div>

            {loading ? (
                <div className="p-12 flex justify-center text-slate-400">
                    <Loader2 className="animate-spin w-8 h-8" />
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-950/30 text-slate-400 text-xs font-bold uppercase tracking-wider">
                            <tr>
                                <th className="px-8 py-4">{t('stats.user') || 'User'}</th>
                                <th className="px-8 py-4">{t('stats.amount') || 'Amount'}</th>
                                <th className="px-8 py-4 text-right">{t('stats.time') || 'Time'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {payouts.map((payout) => {
                                const isVIP = Number(payout.amount) >= 300;
                                return (
                                    <tr key={payout.id} className="hover:bg-slate-800/30 transition-colors animate-slide-down">
                                        <td className="px-8 py-4 font-medium flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${isVIP ? 'bg-amber-500/20' : 'bg-slate-800'}`}>
                                                {isVIP ? <Crown size={14} className="text-amber-500" /> : <Users size={14} className="text-slate-400" />}
                                            </div>
                                            <span className={isVIP ? 'text-amber-100 font-semibold' : 'text-slate-300'}>
                                                {payout.user_name}
                                            </span>
                                        </td>
                                        <td className={`px-8 py-4 font-bold ${isVIP ? 'text-amber-400' : 'text-emerald-400'}`}>
                                            ${Number(payout.amount).toFixed(2)}
                                            <span className={`text-xs px-1.5 py-0.5 rounded border ml-2 ${isVIP ? 'text-amber-500 border-amber-500/30' : 'text-emerald-500 border-emerald-500/30'}`}>USD</span>
                                        </td>
                                        <td className="px-8 py-4 text-slate-500 text-sm text-right font-mono">
                                            {getRelativeTime(payout.created_at)}
                                        </td>
                                    </tr>
                                );
                            })}
                            {payouts.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-8 py-8 text-center text-slate-400">
                                        No payouts recorded yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
