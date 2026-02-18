import React from 'react';
import { X, Zap, Calendar, TrendingUp, DollarSign, Clock, CheckCircle2 } from 'lucide-react';
import { UserPlan } from '../types';

interface MinerDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    miner: UserPlan | null;
    planName: string;
}

export const MinerDetailsModal: React.FC<MinerDetailsModalProps> = ({ isOpen, onClose, miner, planName }) => {
    if (!isOpen || !miner) return null;

    const startDate = new Date(miner.start_date);
    const endDate = new Date(miner.end_date);
    const now = new Date();

    const totalDays = miner.duration_days;
    const elapsedDays = Math.max(0, Math.min(totalDays, Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))));
    const progress = (elapsedDays / totalDays) * 100;
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    const dailyProfitAmount = miner.amount * (miner.daily_percent / 100);

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="bg-emerald-500 p-3 rounded-2xl text-white shadow-lg shadow-emerald-500/20">
                            <Zap size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">{planName} Miner</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{miner.status}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors">
                        <X className="text-slate-400" size={24} />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    {/* Key Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <DollarSign size={12} /> Investment
                            </p>
                            <p className="text-2xl font-black text-slate-800">${miner.amount.toLocaleString()}</p>
                        </div>
                        <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-1">
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                                <TrendingUp size={12} /> Total Return
                            </p>
                            <p className="text-2xl font-black text-emerald-600">${(miner.total_return || 0).toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Progress Section */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mining Progress</p>
                            <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{progress.toFixed(1)}% Completed</p>
                        </div>
                        <div className="h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-1000 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            <span>Started: {startDate.toLocaleDateString()}</span>
                            <span>Ends: {endDate.toLocaleDateString()}</span>
                        </div>
                    </div>

                    {/* Detailed Info List */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-4 rounded-2xl bg-slate-50/50 border border-slate-100/50">
                            <div className="flex items-center gap-3">
                                <Clock size={18} className="text-slate-400" />
                                <span className="text-sm font-bold text-slate-600">Contract Duration</span>
                            </div>
                            <span className="text-sm font-black text-slate-800">{miner.duration_days} Days</span>
                        </div>
                        <div className="flex justify-between items-center p-4 rounded-2xl bg-slate-50/50 border border-slate-100/50">
                            <div className="flex items-center gap-3">
                                <TrendingUp size={18} className="text-slate-400" />
                                <span className="text-sm font-bold text-slate-600">Daily Profit Rate</span>
                            </div>
                            <span className="text-sm font-black text-emerald-500">{miner.daily_percent}%</span>
                        </div>
                        <div className="flex justify-between items-center p-4 rounded-2xl bg-slate-50/50 border border-slate-100/50">
                            <div className="flex items-center gap-3">
                                <DollarSign size={18} className="text-slate-400" />
                                <span className="text-sm font-bold text-slate-600">Daily Earnings</span>
                            </div>
                            <span className="text-sm font-black text-emerald-500">${dailyProfitAmount.toFixed(2)} / Day</span>
                        </div>
                        <div className="flex justify-between items-center p-4 rounded-2xl bg-slate-50/50 border border-slate-100/50">
                            <div className="flex items-center gap-3">
                                <Calendar size={18} className="text-slate-400" />
                                <span className="text-sm font-bold text-slate-600">Days Remaining</span>
                            </div>
                            <span className="text-sm font-black text-blue-500">{daysRemaining} Days Left</span>
                        </div>
                    </div>

                    {/* Notice */}
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex gap-3 items-center">
                        <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
                        <p className="text-[11px] font-bold text-emerald-800 leading-tight">
                            Your miner is operating at peak efficiency. Profits are credited to your Earning Balance every 24 hours.
                        </p>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-[0.98] shadow-xl shadow-slate-900/10"
                    >
                        Close Details
                    </button>
                </div>
            </div>
        </div>
    );
};
