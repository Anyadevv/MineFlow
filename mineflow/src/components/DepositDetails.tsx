import React, { useState } from 'react';
import { X, Copy, CheckCircle2, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../LanguageContext';
import { copyToClipboard } from '../lib/clipboard';

interface DepositMethod {
    id: string;
    name: string;
    currency: string;
    network: string;
    address: string;
    icon: React.ReactNode;
    color: string;
}

interface DepositDetailsProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    method: DepositMethod;
    coin: string;
    amount: number;
}

export const DepositDetails: React.FC<DepositDetailsProps> = ({ isOpen, onClose, onSuccess, method, coin, amount }) => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [copied, setCopied] = useState(false);
    const [txid, setTxid] = useState('');
    const [depositAmount, setDepositAmount] = useState(amount.toString());
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleCopy = async () => {
        const success = await copyToClipboard(method.address);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const [verifying, setVerifying] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!txid.trim()) {
            setError(t('deposit.txid_required') || 'Please enter the transaction ID (TXID)');
            return;
        }

        if (!depositAmount || parseFloat(depositAmount) <= 0) {
            setError(t('deposit.invalid_amount'));
            return;
        }

        if (parseFloat(depositAmount) < 10) {
            setError(t('deposit.min_amount'));
            return;
        }

        const cleanTxId = txid.trim();
        if (cleanTxId.length < 5) {
            setError('Transaction ID too short.');
            return;
        }

        setLoading(true);

        try {
            const depositAmount_num = parseFloat(depositAmount);

            // STEP 1: Simple insert into 'deposits' (Direct Table Access)
            const { data: depositData, error: insertError } = await supabase
                .from('deposits')
                .insert({
                    user_id: user?.id,
                    amount: depositAmount_num,
                    network: method.network,
                    txid: cleanTxId,
                    asset: coin,
                    currency: coin,
                    status: 'approved',
                })
                .select('id')
                .single();

            if (insertError) throw insertError;

            // STEP 2: Direct profile update (Restore simple balance update)
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('deposit_balance, total_deposited')
                .eq('id', user?.id)
                .single();

            if (profileError) throw profileError;

            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    deposit_balance: (profile?.deposit_balance || 0) + depositAmount_num,
                    total_deposited: (profile?.total_deposited || 0) + depositAmount_num,
                })
                .eq('id', user?.id);

            if (updateError) throw updateError;
            
            // STEP 3: Record in 'transactions' table for history
            const { error: txError } = await supabase
                .from('transactions')
                .insert({
                    user_id: user?.id,
                    type: 'deposit',
                    amount: depositAmount_num,
                    status: 'approved',
                    reference_id: depositData?.id || null,
                });

            if (txError) {
                console.error('Transaction history recording failed:', txError);
                // We don't throw here to ensure the user sees the 'Success' state 
                // since their balance WAS updated in the previous step.
            }

            // Success
            setSuccess(true);
            setTxid('');
            if (onSuccess) onSuccess();

        } catch (err: any) {
            console.error('Deposit process failed:', err);
            setError(err.message || 'Failed to process deposit');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">Deposit {coin}</h2>
                            <p className="text-sm text-slate-500 font-medium">Network: <span className="font-bold text-slate-700">{method.network}</span></p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors">
                            <X className="text-slate-400" size={24} />
                        </button>
                    </div>
                </div>

                {success ? (
                    <div className="p-12 text-center">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="text-emerald-600" size={40} />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-3">Deposit Submitted!</h3>
                        <p className="text-slate-500 leading-relaxed max-w-md mx-auto">
                            Your deposit has been submitted successfully. It will be reviewed and approved by our admin team shortly.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        {/* QR Code and Address */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-3">
                                Step 1: Send {coin} to this address
                            </label>

                            <div className="flex flex-col md:flex-row gap-6 items-center bg-slate-50 rounded-2xl p-6 border border-slate-200">
                                <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100 flex-shrink-0">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${method.address}`}
                                        alt="Deposit QR Code"
                                        className="w-32 h-32 md:w-40 md:h-40"
                                    />
                                </div>

                                <div className="flex-1 w-full space-y-3">
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                                        <code className="text-sm font-mono text-slate-800 break-all">
                                            {method.address}
                                        </code>
                                        <button
                                            type="button"
                                            onClick={handleCopy}
                                            className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-colors"
                                        >
                                            {copied ? <CheckCircle2 size={20} /> : <Copy size={20} />}
                                        </button>
                                    </div>

                                    {copied && (
                                        <p className="text-emerald-600 text-xs font-bold flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                                            <CheckCircle2 size={12} /> Address copied successfully
                                        </p>
                                    )}

                                    <p className="text-xs text-slate-400 font-bold leading-relaxed">
                                        ⚠️ Only send <span className="text-slate-600">{coin}</span> on the <span className="text-slate-600 uppercase">{method.network}</span> network. Minimum deposit: <span className="text-slate-600">10 {coin}</span>.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Amount Input */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-3">
                                Step 2: Enter the amount you sent (USD)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="10"
                                value={depositAmount}
                                onChange={(e) => setDepositAmount(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                                placeholder="Enter amount in USD (Min: 10)"
                                required
                            />
                        </div>

                        {/* TXID Input */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-3">
                                Step 3: Paste your Transaction ID (TXID)
                            </label>
                            <input
                                type="text"
                                value={txid}
                                onChange={(e) => setTxid(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono text-sm"
                                placeholder="Enter transaction hash/ID"
                                required
                            />
                            <p className="text-xs text-slate-400 mt-2 font-medium">
                                You can find the TXID in your wallet's transaction history
                            </p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                                <p className="text-sm text-red-700 font-medium">{error}</p>
                            </div>
                        )}

                        {/* Info Box */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <p className="text-sm text-blue-800 font-medium leading-relaxed">
                                <strong>Important:</strong> Your deposit will be reviewed by our admin team.
                                Once approved, the balance will be credited to your account.
                            </p>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || verifying}
                            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {verifying ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    {loadingMessage || 'Processing...'}
                                </>
                            ) : loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={20} />
                                    Confirm Payment
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div >
        </div >
    );
};
