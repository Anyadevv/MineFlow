import React, { useState } from 'react';
import { Crown, Check, Zap, ShieldCheck, DollarSign, TrendingUp } from 'lucide-react';
import { Plan } from '../types';

interface PlanCardProps {
  plan: Plan;
  onSelect: (plan: Plan, amount: number) => void;
  variant?: 'display' | 'interactive';
  compact?: boolean;
}

export const PlanCard: React.FC<PlanCardProps> = ({ plan, onSelect, variant = 'interactive', compact = false }) => {
  const [amount, setAmount] = useState<string>(plan.minDeposit.toString());
  const [error, setError] = useState<string>('');
  const isDisplay = variant === 'display';

  // Determine glow color based on plan
  const getGlowColor = () => {
    if (plan.id === 'starter') return 'rgba(16, 185, 129, 0.4)'; // Green tint
    if (plan.id === 'enterprise') return 'rgba(6, 182, 212, 0.4)'; // Cyan/Blue tint
    if (plan.id === 'professional') return 'rgba(255, 255, 255, 0.3)'; // White for green card
    return 'rgba(16, 185, 129, 0.2)';
  };


  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setAmount(value);
    if (error) setError('');
  };

  const handleStart = () => {
    const numAmount = Number(amount);
    const max = plan.maxDeposit === 'Unlimited' ? Infinity : Number(plan.maxDeposit);

    if (!isDisplay) {
      if (numAmount < plan.minDeposit) {
        setError(`Min deposit: $${plan.minDeposit}`);
        return;
      }

      if (numAmount > max) {
        setError(`Max deposit: $${plan.maxDeposit}`);
        return;
      }
    }

    onSelect(plan, numAmount);
  };

  return (
    <div className={`group p-8 rounded-[3rem] border transition-all relative flex flex-col h-full 
      ${isDisplay && plan.isPopular
        ? 'bg-emerald-600 border-emerald-500 shadow-2xl shadow-emerald-600/30'
        : 'bg-white border-slate-100 hover:border-emerald-200 hover:shadow-xl'
      } ${!isDisplay && plan.isPopular ? 'border-emerald-500 shadow-xl shadow-emerald-500/10 ring-4 ring-emerald-500/5 z-10' : ''}
      ${plan.isPopular ? '' : 'hover:scale-[1.01]'}`}>

      {/* Miner Visual Container */}
      <div className={`${compact ? 'mb-4 h-36 pt-2' : 'mb-12 h-64 pt-4'} relative flex flex-col items-center justify-start pb-0 miner-3d-container transition-all duration-300`}>
        {plan.minerImage && (
          <div className="relative w-full flex-1 flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
            {/* Decorative background glow */}
            <div
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none transition-all duration-300
                ${compact ? 'w-24 h-24 blur-xl opacity-25' : 'w-48 h-48 blur-3xl opacity-30'}`}
              style={{
                background: `radial-gradient(circle, ${getGlowColor()}, transparent 70%)`
              }}
            />

            {/* Light gradient overlay at top */}
            <div className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none z-10 rounded-t-3xl transition-all duration-300
              ${compact ? 'h-12' : 'h-24'}`}
              style={{
                background: isDisplay && plan.isPopular
                  ? 'linear-gradient(to bottom, rgba(255,255,255,0.15), transparent)'
                  : 'linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)'
              }}
            />

            {/* Floor shadow */}
            <div
              className={`miner-floor-shadow absolute left-1/2 rounded-full transition-all duration-300
                ${compact ? 'w-16 h-3 blur-md bottom-2' : 'w-32 h-6 blur-xl bottom-4'}`}
              style={{
                background: isDisplay && plan.isPopular
                  ? 'radial-gradient(ellipse, rgba(0,0,0,0.3), transparent)'
                  : 'radial-gradient(ellipse, rgba(16, 185, 129, 0.2), transparent)'
              }}
            />

            {/* Miner image */}
            <img
              src={plan.minerImage}
              alt={plan.minerModel}
              className={`${compact ? 'h-32' : 'h-56'} w-auto object-contain relative z-20 miner-static-3d`}
            />
          </div>
        )}
      </div>

      {/* Miner Model Label */}
      <div className={`text-center px-4 transition-all duration-300 ${compact ? 'mb-6' : 'mb-8'}`}>
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Hardware Model</div>
        <div className={`font-bold text-slate-700 ${compact ? 'text-xs' : 'text-sm'}`}>{plan.minerModel}</div>
      </div>

      {plan.isPopular && (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center w-max">
          {/* Main Badge */}
          <div className={`
               relative px-6 py-2.5 rounded-full flex items-center gap-2.5
               bg-gradient-to-r from-emerald-600 to-emerald-400
               border border-yellow-300/60 shadow-lg shadow-emerald-500/40
               animate-badge-pulse animate-badge-float overflow-hidden
               backdrop-blur-sm
           `}>
            {/* Glassmorphism Highlight */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />

            {/* Shimmer Overlay */}
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-badge-shimmer pointer-events-none" />

            {/* Icon */}
            <div className="relative">
              <TrendingUp size={14} className="text-white drop-shadow-sm filter" strokeWidth={3} />
              <div className="absolute -top-1.5 -right-1.5 bg-white rounded-full p-[1.5px] shadow-sm">
                <Check size={6} className="text-emerald-600" strokeWidth={4} />
              </div>
            </div>

            {/* Text */}
            <span className="text-xs font-black uppercase tracking-widest text-white drop-shadow-md font-sans">
              Most Popular
            </span>
          </div>

          {/* Microcopy - "Chosen by 72% of Active Miners" */}
          <div className="mt-2.5 px-3 py-1 bg-white/95 backdrop-blur-md rounded-full border border-emerald-100 shadow-md animate-badge-float" style={{ animationDelay: '0.2s' }}>
            <span className="text-[9px] font-bold text-emerald-700 tracking-wide uppercase whitespace-nowrap flex items-center gap-1">
              Chosen by 72% of Active Miners
            </span>
          </div>
        </div>
      )}

      <div className="text-center space-y-6 flex-1">
        <div className="space-y-1">
          <h4 className={`text-xl font-bold uppercase tracking-widest ${isDisplay && plan.isPopular ? 'text-emerald-100' : 'text-slate-400'}`}>
            {plan.name}
          </h4>
          <div className={`text-7xl font-black tracking-tighter ${isDisplay && plan.isPopular ? 'text-white' : 'text-slate-900'}`}>
            {plan.percent}%
          </div>
          <p className={`font-bold text-sm tracking-wide ${isDisplay && plan.isPopular ? 'text-emerald-200' : 'text-emerald-500'}`}>
            TOTAL RETURN
          </p>
        </div>

        <div className={`space-y-4 py-8 border-y ${isDisplay && plan.isPopular ? 'border-emerald-500/50' : 'border-slate-50'}`}>
          {[
            { label: 'Daily Profit', value: `${plan.dailyProfit}%`, icon: <Zap size={16} className="text-amber-500" /> },
            { label: 'Duration', value: `${plan.durationDays} Days`, icon: <ShieldCheck size={16} className="text-blue-500" /> },
            { label: 'Min Deposit', value: `$${plan.minDeposit}`, icon: <DollarSign size={16} className="text-emerald-500" /> },
            { label: 'Max Deposit', value: plan.maxDeposit === 'Unlimited' ? 'Unlimited' : `$${plan.maxDeposit}`, icon: <DollarSign size={16} className="text-slate-400" /> },
            { label: 'Withdrawal', value: 'Instant', icon: <Check size={16} className="text-emerald-500" /> },
          ].map((item, i) => (
            <div key={i} className="flex justify-between items-center text-sm font-bold">
              <span className={`flex items-center gap-2 ${isDisplay && plan.isPopular ? 'text-emerald-100' : 'text-slate-400'}`}>
                {!isDisplay && item.icon} {item.label}
              </span>
              <span className={isDisplay && plan.isPopular ? 'text-white' : 'text-slate-800'}>
                {item.value}
              </span>
            </div>
          ))}
        </div>

        <div className={`space-y-4 ${isDisplay ? 'pt-6' : 'pt-4'}`}>
          {!isDisplay && (
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block px-1">
                Enter Deposit Amount ($):
              </label>
              <div className="relative group/input">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</div>
                <input
                  type="text"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder={plan.minDeposit.toString()}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-10 pr-6 font-black text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-xl"
                />
              </div>
            </div>
          )}

          <button
            onClick={handleStart}
            className={`w-full py-5 rounded-2xl font-black text-xl transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-3 overflow-hidden relative group
              ${isDisplay && plan.isPopular
                ? 'bg-white text-emerald-600 hover:bg-emerald-50 shadow-white/10'
                : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20'
              } ${plan.isPopular ? 'animate-pulse-button' : ''}`}
          >
            <span className="relative z-10">Start Earning</span>
            {!isDisplay && <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>}
          </button>

          {error && (
            <p className="text-red-500 text-xs font-bold text-center animate-in fade-in slide-in-from-top-1 bg-red-50 p-2 rounded-lg border border-red-100">
              ⚠️ {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};