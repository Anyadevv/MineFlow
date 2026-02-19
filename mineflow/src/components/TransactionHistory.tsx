import React from 'react';
import { History, Clock, CheckCircle2, XCircle } from 'lucide-react';

interface Transaction {
    id: string;
    type: 'deposit' | 'withdrawal' | 'investment' | 'profit' | 'referral' | 'payout';
    amount: number;
    status: 'pending' | 'completed' | 'approved' | 'rejected' | 'failed';
    currency: string;
    network?: string;
    reference_id?: string;
    created_at: string;
}

interface TransactionHistoryProps {
    transactions: Transaction[];
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions }) => {
    if (transactions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6 animate-in fade-in">
                <div className="p-10 bg-slate-50 rounded-[3rem]">
                    <History size={80} className="text-slate-200" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-800">No Transactions Yet</h3>
                    <p className="text-slate-400 font-bold max-w-sm mx-auto">Track your funding and mining history in this section.</p>
                </div>
            </div>
        );
    }

    const getTypeConfig = (type: string) => {
        switch (type) {
            case 'deposit': return { label: 'Deposit', color: 'text-emerald-600', bg: 'bg-emerald-50' };
            case 'withdrawal': return { label: 'Withdrawal', color: 'text-blue-600', bg: 'bg-blue-50' };
            case 'investment': return { label: 'Miner Activation', color: 'text-indigo-600', bg: 'bg-indigo-50' };
            case 'profit': return { label: 'Mining Profit', color: 'text-amber-600', bg: 'bg-amber-50' };
            case 'referral': return { label: 'Referral Bonus', color: 'text-purple-600', bg: 'bg-purple-50' };
            case 'payout': return { label: 'Principal Return', color: 'text-rose-600', bg: 'bg-rose-50' };
            default: return { label: type, color: 'text-slate-600', bg: 'bg-slate-50' };
        }
    };

    return (
        <div>
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Network</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {transactions.map((tx) => {
                            const config = getTypeConfig(tx.type);

                            return (
                                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${config.color.replace('text-', 'bg-')}`}></div>
                                            <span className={`text-[11px] font-black uppercase tracking-wider ${config.color}`}>
                                                {config.label}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="font-black text-slate-800 text-base">
                                            {tx.type === 'deposit' || tx.type === 'profit' || tx.type === 'referral' || tx.type === 'payout' ? '+' : '-'}
                                            ${tx.amount.toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                        {tx.network || 'MineFlow Internal'}
                                    </td>
                                    <td className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                        {new Date(tx.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[9px] font-black tracking-widest uppercase ${tx.status === 'completed' || tx.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                tx.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                    'bg-red-50 text-red-600 border border-red-100'
                                            }`}>
                                            {(tx.status === 'completed' || tx.status === 'approved') && <CheckCircle2 size={12} />}
                                            {tx.status === 'pending' && <Clock size={12} className="animate-pulse" />}
                                            {(tx.status === 'rejected' || tx.status === 'failed') && <XCircle size={12} />}
                                            {tx.status}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-3">
                {transactions.map((tx) => {
                    const config = getTypeConfig(tx.type);
                    return (
                        <div key={tx.id} className="bg-slate-50 p-4 rounded-2xl flex flex-col gap-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${config.bg}`}>
                                        <div className={`w-2 h-2 rounded-full ${config.color.replace('text-', 'bg-')}`}></div>
                                    </div>
                                    <div>
                                        <p className={`text-[11px] font-black uppercase tracking-wider ${config.color}`}>
                                            {config.label}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-400">
                                            {new Date(tx.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <span className="font-black text-slate-800 text-base">
                                    {tx.type === 'deposit' || tx.type === 'profit' || tx.type === 'referral' || tx.type === 'payout' ? '+' : '-'}
                                    ${tx.amount.toLocaleString()}
                                </span>
                            </div>
                            
                            <div className="flex items-center justify-between border-t border-slate-200/50 pt-3">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {tx.network || 'MineFlow Internal'}
                                </span>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black tracking-widest uppercase ${tx.status === 'completed' || tx.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                        tx.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                            'bg-red-50 text-red-600 border border-red-100'
                                    }`}>
                                    {(tx.status === 'completed' || tx.status === 'approved') && <CheckCircle2 size={10} />}
                                    {tx.status === 'pending' && <Clock size={10} className="animate-pulse" />}
                                    {(tx.status === 'rejected' || tx.status === 'failed') && <XCircle size={10} />}
                                    {tx.status}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
