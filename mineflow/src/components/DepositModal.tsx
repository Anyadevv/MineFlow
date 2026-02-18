import React, { useState } from 'react';
import { X, Bitcoin, Hexagon, Zap, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface DepositMethod {
    id: string;
    name: string;
    currency: string;
    network: string;
    address: string;
    icon: React.ReactNode;
    color: string;
}

const METHODS: DepositMethod[] = [
    {
        id: 'btc',
        name: 'BTC Network',
        currency: 'USDT/USDC',
        network: 'Bitcoin',
        address: 'bc1p6pewqv3g0626myhclf7mn8eg83kc6qk75d8urlpgmdzmzqxcjllq6rha97',
        icon: <Bitcoin className="w-6 h-6" />,
        color: 'bg-orange-500'
    },
    {
        id: 'eth',
        name: 'ETH Network',
        currency: 'USDT/USDC',
        network: 'Ethereum',
        address: '0x627b2f7221c6bb62e4a00bafcf0da5b0ec08eaa3',
        icon: <Hexagon className="w-6 h-6" />,
        color: 'bg-blue-600'
    },
    {
        id: 'base',
        name: 'BASE Network',
        currency: 'USDT/USDC',
        network: 'BASE',
        address: '0x627b2f7221c6bb62e4a00bafcf0da5b0ec08eaa3',
        icon: <Zap className="w-6 h-6" />,
        color: 'bg-blue-400'
    },
    {
        id: 'solana',
        name: 'SOLANA Network',
        currency: 'USDT/USDC',
        network: 'SOL',
        address: 'FGCcQmLtwk4SQbie12Upr1KRn817HsqMMwBR2MmNsLWW',
        icon: <Zap className="w-6 h-6" />,
        color: 'bg-purple-600'
    },
    {
        id: 'tron',
        name: 'TRON Network',
        currency: 'USDT/USDC',
        network: 'TRON',
        address: 'TTuLniMtkyDYj4tq3zb4JLMkBXswsQZkso',
        icon: <Hexagon className="w-6 h-6" />,
        color: 'bg-red-600'
    },
    {
        id: 'bnb',
        name: 'BNB Network',
        currency: 'USDT/USDC',
        network: 'BNB',
        address: '0x627b2f7221c6bb62e4a00bafcf0da5b0ec08eaa3',
        icon: <Hexagon className="w-6 h-6" />,
        color: 'bg-yellow-500'
    },
    {
        id: 'ton',
        name: 'TON Network',
        currency: 'USDT/USDC',
        network: 'TON',
        address: 'UQBGUQTXqw1cHe7yO6beatxgKPV6oh0zrIFr8FExrNg54O-H',
        icon: <Hexagon className="w-6 h-6" />,
        color: 'bg-sky-500'
    }
];

interface DepositModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (method: DepositMethod, coin: string) => void;
    amount: number;
}

export const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose, onSelect, amount }) => {
    const [selectedCoin, setSelectedCoin] = useState<string | null>(null);

    React.useEffect(() => {
        if (isOpen) {
            setSelectedCoin(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleBack = () => {
        setSelectedCoin(null);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">
                            {!selectedCoin ? 'Select Coin' : 'Select Network'}
                        </h2>
                        <p className="text-slate-400 font-bold text-sm mt-1">Amount to deposit: <span className="text-emerald-500">${amount}</span></p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                        <X className="text-slate-400" />
                    </button>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {!selectedCoin ? (
                        <div className="grid grid-cols-2 gap-4">
                            {['USDT', 'USDC'].map((coin) => (
                                <button
                                    key={coin}
                                    onClick={() => setSelectedCoin(coin)}
                                    className="group flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all gap-4"
                                >
                                    <div className={`p-4 rounded-2xl ${coin === 'USDT' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'} group-hover:scale-110 transition-transform`}>
                                        <ShieldCheck size={32} />
                                    </div>
                                    <span className="font-black text-slate-800 text-lg">{coin}</span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <button
                                onClick={handleBack}
                                className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-500 transition-colors"
                            >
                                ← Back to coin selection
                            </button>
                            <div className="grid grid-cols-1 gap-3">
                                {METHODS.map((method) => (
                                    <button
                                        key={method.id}
                                        onClick={() => onSelect(method, selectedCoin)}
                                        className="group flex items-center justify-between p-5 rounded-2xl border border-slate-100 hover:border-emerald-500/30 hover:bg-emerald-50/50 transition-all text-left"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`${method.color} p-3 rounded-xl text-white shadow-lg shadow-${method.color.split('-')[1]}-500/20 group-hover:scale-110 transition-transform`}>
                                                {method.icon}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800">{method.name}</h3>
                                                <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">{selectedCoin} on {method.network}</p>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 p-2 rounded-lg group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                            <CheckCircle2 size={20} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 italic text-[11px] text-slate-400 text-center font-bold">
                    Only send <span className="text-slate-600 font-black">USDT</span> or <span className="text-slate-600 font-black">USDC</span> on the selected network. Other assets will be lost.
                </div>
            </div>
        </div>
    );
};
