import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Hexagon, Loader2, CheckCircle } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

export const AuthPage = ({ type, onLogin }: { type: 'login' | 'register', onLogin: () => void }) => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resetMessage, setResetMessage] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResetMessage(null);

        try {
            if (type === 'register') {
                const referrerCode = localStorage.getItem('referral_code');

                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: name,
                            referrer_code: referrerCode,
                        },
                    },
                });
                if (error) throw error;

                if (referrerCode) {
                    localStorage.removeItem('referral_code');
                }

                if (data.user && !data.session) {
                    // Check if email confirmation is disabled in Supabase, but strictly speaking this might still return a user without session if confirmation is required.
                    // Given our requirements say "User can log in immediately", effectively auto-confirm or disable confirmation.
                    // If supabase is configured to disable confirmation, session should be present.
                    // If not, we fall back to telling them.
                    setError(t('auth.check_email') || "Please check your email.");
                    return;
                }

                onLogin();
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                onLogin();
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    const handleResetPassword = async () => {
        if (!email) {
            setError("Please enter your email address first.");
            return;
        }
        setLoading(true);
        setError(null);
        setResetMessage(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error) throw error;
            setResetMessage("Password reset email sent! Check your inbox.");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-20 bg-slate-50/50">
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl w-full max-w-md border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 to-teal-500"></div>

                <div className="text-center mb-8">
                    <div className="bg-emerald-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-600 shadow-sm border border-emerald-100">
                        <Hexagon size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                        {type === 'login' ? t('auth.welcome') : t('auth.create')}
                    </h2>
                    <p className="text-slate-500 text-sm">
                        {type === 'login'
                            ? t('auth.signin_desc')
                            : t('auth.signup_desc')}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 border border-red-100 flex items-start gap-2 animate-in slide-in-from-top-2">
                        <span>•</span> {error}
                    </div>
                )}

                {resetMessage && (
                    <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl text-sm mb-6 border border-emerald-100 flex items-center gap-2 animate-in slide-in-from-top-2">
                        <CheckCircle size={16} /> {resetMessage}
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-5">
                    {type === 'register' && (
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">{t('auth.name')}</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">{t('auth.email')}</label>
                        <input
                            type="email"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <div className="flex justify-between mb-1.5">
                            <label className="block text-sm font-bold text-slate-700">{t('auth.password')}</label>
                            {type === 'login' && (
                                <button type="button" onClick={handleResetPassword} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium hover:underline">
                                    {t('auth.forgot')}
                                </button>
                            )}
                        </div>
                        <input
                            type="password"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] text-lg flex items-center justify-center">
                        {loading ? <Loader2 className="animate-spin" /> : (type === 'login' ? t('auth.signin_btn') : t('auth.create_btn'))}
                    </button>
                </form>
            </div>
        </div>
    );
};
