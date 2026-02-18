import React from 'react';
import { X, CheckCircle2, Zap, Calendar, DollarSign, Wallet, ShieldCheck, TrendingUp, Loader2, AlertTriangle } from 'lucide-react';
import { Plan } from '../types';

interface PlanConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    plan: Plan | null;
    amount: number;
    currentBalance: number;
    status: 'idle' | 'loading' | 'success' | 'error';
    errorMessage?: string;
    estimatedRoi?: {
        daily_profit: number;
        total_profit: number;
        total_return: number;
    } | null;
}

export const PlanConfirmationModal: React.FC<PlanConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    plan,
    amount,
    currentBalance,
    status,
    errorMessage,
    estimatedRoi
}) => {
    if (!isOpen || !plan) return null;

    const isLoading = status === 'loading';
    const isSuccess = status === 'success';

    // Balance calculations
    const balanceAfter = currentBalance - amount;
    const hasSufficientBalance = balanceAfter >= 0;

    // Use Backend ROI or local fallback if not yet loaded (though it should be loaded)
    const totalReturn = estimatedRoi?.total_return ?? 0;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={isLoading ? undefined : onClose}></div>

            <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                {isSuccess ? (
                    <div className="p-12 text-center space-y-6">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in spin-in-180 duration-500">
                            <CheckCircle2 className="text-emerald-600" size={40} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 mb-2">Activation Successful!</h2>
                            <p className="text-slate-500 font-medium">
                                Your <span className="font-bold text-slate-800">{plan.name}</span> plan is now active.
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                        >
                            Start Earning
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="p-8 pb-6 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
                            <div className="flex justify-between items-start mb-6">
                                <div className="bg-emerald-100/50 p-3 rounded-2xl">
                                    <TrendingUp className="text-emerald-600" size={28} />
                                </div>
                                <button
                                    onClick={onClose}
                                    disabled={isLoading}
                                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 disabled:opacity-50"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">
                                Confirm Activation
                            </h2>
                            <p className="text-slate-500 font-medium text-sm mt-2">
                                You are about to start the <span className="text-slate-800 font-bold">{plan.name}</span> plan.
                            </p>
                        </div>

                        {/* Content */}
                        <div className="p-8 pt-6 space-y-6 overflow-y-auto">

                            {/* Investment Summary Card */}
                            <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 space-y-4">
                                <div className="flex justify-between items-end">
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Investment Amount</span>
                                    <span className="text-3xl font-black text-slate-800">${amount.toLocaleString()}</span>
                                </div>
                                <div className="h-px bg-slate-200"></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Daily Payout</p>
                                        <p className="text-emerald-600 font-bold flex items-center gap-1">
                                            <Zap size={14} className="fill-current" /> {plan.dailyProfit}%
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Duration</p>
                                        <p className="text-blue-600 font-bold flex items-center justify-end gap-1">
                                            <Calendar size={14} /> {plan.durationDays} Days
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Projections */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                                            <DollarSign size={18} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-emerald-900">Estimated Total Return</p>
                                            <p className="text-[10px] text-emerald-700 font-bold">Total earnings over {plan.durationDays} days</p>
                                        </div>
                                    </div>
                                    <span className="text-xl font-black text-emerald-600">${totalReturn.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <span>Daily Accumulation</span>
                                    <span className="text-emerald-500">${(amount * plan.dailyProfit / 100).toFixed(2)}/day</span>
                                </div>
                            </div>

                            {/* Balance Context */}
                            <div className="space-y-3 pt-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-bold flex items-center gap-2">
                                        <Wallet size={16} /> Current Balance
                                    </span>
                                    <span className="font-bold text-slate-800">${currentBalance.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-bold">Balance After</span>
                                    <span className={`font-bold ${hasSufficientBalance ? 'text-slate-800' : 'text-red-500'}`}>
                                        ${balanceAfter.toLocaleString()}
                                    </span>
                                </div>
                                {!hasSufficientBalance && (
                                    <div className="flex items-center gap-2 text-red-500 text-xs font-bold bg-red-50 p-3 rounded-xl">
                                        <AlertTriangle size={16} />
                                        Insufficient funds. Please deposit more.
                                    </div>
                                )}
                            </div>

                            {/* Error Message */}
                            {status === 'error' && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                    <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                                    <p className="text-sm text-red-700 font-medium">{errorMessage || 'An error occurred.'}</p>
                                </div>
                            )}

                        </div>

                        {/* Actions */}
                        <div className="p-8 pt-0 mt-auto">
                            <button
                                onClick={onConfirm}
                                disabled={isLoading || !hasSufficientBalance}
                                className={`w-full py-5 rounded-2xl font-black text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95
                             ${isLoading || !hasSufficientBalance
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                        : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-emerald-500/25'
                                    }`}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} /> Processing...
                                    </>
                                ) : hasSufficientBalance ? (
                                    <>
                                        <ShieldCheck size={20} /> Confirm & Activate
                                    </>
                                ) : (
                                    'Insufficient Balance'
                                )}
                            </button>
                            {!isLoading && (
                                <button
                                    onClick={onClose}
                                    className="w-full py-4 mt-3 text-slate-400 font-bold text-xs hover:text-slate-600 transition-colors"
                                >
                                    Cancel Transaction
                                </button>
                            )}
                        </div>
                    </>
                )}

            </div>
        </div>
    );
};
