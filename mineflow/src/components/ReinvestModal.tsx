import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Loader2, AlertCircle, CheckCircle2, TrendingUp, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { PLANS } from '../constants';

interface ReinvestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const ReinvestModal: React.FC<ReinvestModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { user, profile, refreshProfile } = useAuth();
    const [selectedPlanId, setSelectedPlanId] = useState(PLANS[0].id);
    const [amount, setAmount] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [estimatedRoi, setEstimatedRoi] = useState<any>(null);
    const [calculatingRoi, setCalculatingRoi] = useState(false);

    const activePlan = PLANS.find(p => p.id === selectedPlanId) || PLANS[0];

    useEffect(() => {
        if (isOpen) {
            setAmount(activePlan.minDeposit.toString());
        }
    }, [isOpen, selectedPlanId]);

    useEffect(() => {
        const calc = async () => {
            const val = parseFloat(amount);
            if (isNaN(val) || val < activePlan.minDeposit) {
                setEstimatedRoi(null);
                return;
            }
            setCalculatingRoi(true);
            try {
                const { data, error } = await supabase.rpc('calculate_plan_roi', {
                    p_amount: val,
                    p_daily_percent: activePlan.dailyProfit,
                    p_duration_days: activePlan.durationDays
                });
                if (!error) setEstimatedRoi(data);
            } finally {
                setCalculatingRoi(false);
            }
        };
        const timer = setTimeout(calc, 500);
        return () => clearTimeout(timer);
    }, [amount, selectedPlanId]);

    const handleReinvest = async () => {
        if (!user || !profile) return;

        const revAmount = parseFloat(amount);
        if (isNaN(revAmount) || revAmount < activePlan.minDeposit) {
            setError(`Mínimo para este plano é $${activePlan.minDeposit}`);
            return;
        }

        if (revAmount > (profile.earnings_balance || 0)) {
            setError('Saldo de ganhos insuficiente.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data, error: rpcError } = await supabase.rpc('reinvest_plan', {
                p_user_id: user.id,
                p_plan_id: selectedPlanId,
                p_amount: revAmount,
                p_daily_percent: activePlan.dailyProfit,
                p_duration_days: activePlan.durationDays
            });

            if (rpcError) throw rpcError;
            if (data && !(data as any).success) throw new Error((data as any).error);

            setSuccess(true);
            await refreshProfile();
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 2000);
        } catch (err: any) {
            console.error('Reinvest error:', err);
            setError(err.message || 'Falha ao processar reinvestimento');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {success ? (
                    <div className="p-12 text-center space-y-6">
                        <div className="flex justify-center">
                            <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center animate-bounce">
                                <CheckCircle2 size={40} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-slate-800 uppercase">Miner Ativado!</h3>
                            <p className="text-slate-500 font-bold">Seu lucro foi reinvestido com sucesso em um novo plano.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Reinvestir Lucros</h2>
                                <p className="text-slate-400 font-bold text-sm mt-1">
                                    Saldo Disponível: <span className="text-emerald-500 font-black">${(profile?.earnings_balance || 0).toFixed(2)}</span>
                                </p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                <X className="text-slate-400" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Escolha o Plano</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {PLANS.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => setSelectedPlanId(p.id)}
                                            className={`p-4 rounded-2xl border-2 transition-all text-center space-y-1 ${selectedPlanId === p.id
                                                ? 'border-emerald-500 bg-emerald-50'
                                                : 'border-slate-100 hover:border-slate-200'}`}
                                        >
                                            <p className={`text-[10px] font-black uppercase tracking-wider ${selectedPlanId === p.id ? 'text-emerald-600' : 'text-slate-400'}`}>{p.name}</p>
                                            <p className="text-sm font-black text-slate-800">{p.dailyProfit}% <span className="text-[10px] text-slate-400">/dia</span></p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Valor do Reinvestimento</label>
                                <div className="relative">
                                    <input
                                        type="number"
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
                                <p className="text-[10px] font-bold text-slate-400 pl-1 uppercase tracking-wider">
                                    Min: ${activePlan.minDeposit} • Max: ${activePlan.maxDeposit}
                                </p>
                            </div>

                            {estimatedRoi && (
                                <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-4 shadow-xl">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Retorno Estimado</span>
                                        <TrendingUp size={16} className="text-emerald-500" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-center">
                                            <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Pagamento Diário</p>
                                            <p className="text-xl font-black text-emerald-400">${(parseFloat(amount) * activePlan.dailyProfit / 100).toFixed(2)}</p>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-center">
                                            <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Retorno Total</p>
                                            <p className="text-xl font-black">${estimatedRoi.total_return?.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-bold flex items-center gap-3">
                                    <AlertCircle size={18} /> {error}
                                </div>
                            )}

                            <button
                                disabled={loading || calculatingRoi || !amount || parseFloat(amount) < activePlan.minDeposit}
                                onClick={handleReinvest}
                                className={`w-full py-5 rounded-[1.5rem] font-black tracking-widest text-sm transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 ${loading || calculatingRoi || !amount || parseFloat(amount) < activePlan.minDeposit
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                    : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/10'
                                    }`}
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <>
                                        <Zap size={20} /> ATIVAR MINER AGORA
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="p-6 bg-slate-50 border-t border-slate-100 italic text-[10px] text-slate-400 text-center font-bold">
                            Reinvestimentos são recompensados com ativação imediata.
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
