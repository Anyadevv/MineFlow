import React from 'react';
import { Zap, Wallet, TrendingUp, History, Users } from 'lucide-react';

interface StatsPanelProps {
    activeMiners: number;
    totalInvested: number;
    totalTransactions: number;
    totalProfit: number;
    referralCount: number;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({
    activeMiners,
    totalInvested,
    totalTransactions,
    totalProfit,
    referralCount
}) => {
    const stats = [
        { label: 'ACTIVE MINERS', value: activeMiners, icon: <Zap size={24} className="text-amber-500" />, bg: 'bg-amber-50' },
        { label: 'TOTAL DEPOSITED', value: `$${totalInvested.toLocaleString()}`, icon: <Wallet size={24} className="text-blue-500" />, bg: 'bg-blue-50' },
        { label: 'TOTAL REFERRALS', value: referralCount, icon: <Users size={24} className="text-emerald-500" />, bg: 'bg-emerald-50' },
        { label: 'TOTAL TRANSACTIONS', value: totalTransactions, icon: <History size={24} className="text-purple-500" />, bg: 'bg-purple-50' },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((stat, i) => (
                <div key={i} className="bg-white p-5 sm:p-7 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-4 sm:gap-5 transition-all hover:shadow-md group">
                    <div className={`${stat.bg} w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-[1.25rem] flex items-center justify-center group-hover:scale-110 transition-transform shrink-0`}>
                        {stat.icon}
                    </div>
                    <div>
                        <p className="text-slate-400 font-bold text-[9px] sm:text-[11px] tracking-widest uppercase">{stat.label}</p>
                        <p className="text-xl sm:text-2xl font-black text-slate-800">{stat.value}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};
