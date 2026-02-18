import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface InsufficientBalanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddFunds: () => void;
    required: number;
    available: number;
}

export const InsufficientBalanceModal: React.FC<InsufficientBalanceModalProps> = ({
    isOpen,
    onClose,
    onAddFunds,
    required,
    available
}) => {
    if (!isOpen) return null;

    const missing = required - available;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 text-center space-y-6">
                    <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto">
                        <AlertTriangle size={32} />
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-2xl font-black text-slate-800">Insufficient Balance</h3>
                        <p className="text-slate-500 font-medium leading-relaxed">
                            You don't have enough funds in your Deposit Balance to activate this plan.
                        </p>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500 font-bold">Required</span>
                            <span className="text-slate-900 font-black">${required.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500 font-bold">Available</span>
                            <span className="text-slate-900 font-black">${available.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-slate-200 pt-3 flex justify-between text-sm">
                            <span className="text-red-500 font-bold">Missing</span>
                            <span className="text-red-600 font-black">${missing.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={onClose}
                            className="w-full py-3.5 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                onClose();
                                onAddFunds();
                            }}
                            className="w-full py-3.5 rounded-xl font-bold bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                        >
                            Add Funds
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
