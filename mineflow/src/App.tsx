import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { PlanCard } from './components/PlanCard';
import { LastPayouts } from './components/LastPayouts';
import { PLANS, BOUNTY_TASKS, FAQS, MOCK_DEPOSITS, MOCK_PARTNERS } from './constants';
import { User, Plan, StatRow } from './types';
import {
  Users, BarChart3,
  ChevronDown, UserPlus, Zap, Coins,
  Wallet, PieChart, ArrowUpRight, ArrowDownLeft, RefreshCcw, Copy, Mail, Hexagon, Crown, ShieldCheck, TrendingUp, Bitcoin, Check, MousePointerClick, Unlock, Eye, MapPin, AlertCircle
} from 'lucide-react';
import { LanguageProvider, useLanguage } from './LanguageContext';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { useAuth } from './context/AuthContext';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { WalletSettingsPage } from './pages/WalletSettingsPage';
import { supabase } from './lib/supabase';
import './miner-animations.css';

// --- Page Components ---

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const FullPageLoader = () => (
  <div className="min-h-screen bg-emerald-50/50 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-emerald-800 font-black text-sm uppercase tracking-widest">Loading MineFlow</p>
    </div>
  </div>
);

const HelpPage = () => {
  const { t } = useLanguage();
  return (
    <div className="py-20 px-4">
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-4xl font-bold text-center mb-12">{t('home.faq_title')}</h1>
        {FAQS.map((faq, i) => (
          <details key={i} className="group bg-white rounded-xl shadow-sm border border-slate-100 open:border-emerald-200">
            <summary className="flex justify-between items-center p-6 cursor-pointer list-none font-medium text-slate-800">
              {faq.q}
              <ChevronDown className="text-emerald-500 transition group-open:rotate-180" />
            </summary>
            <div className="px-6 pb-6 text-slate-500 leading-relaxed">
              {faq.a}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
};

const HomePage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  return (
    <div className="space-y-0 pb-20">
      {/* Hero Section - Conversion Focused */}
      <section className="pt-12 lg:pt-24 pb-16 px-4 bg-gradient-to-b from-emerald-50/80 to-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-8 animate-in slide-in-from-left-4 duration-700 fade-in text-center lg:text-left">

            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-emerald-100 shadow-sm mx-auto lg:mx-0">
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white"></div>
                <div className="w-6 h-6 rounded-full bg-slate-300 border-2 border-white"></div>
                <div className="w-6 h-6 rounded-full bg-slate-400 border-2 border-white"></div>
              </div>
              <span className="text-sm font-medium text-slate-600">Trusted by 5,000+ investors</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-110%">
              {t('hero.title_start')} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-400">
                {t('hero.title_end')}
              </span>
            </h1>
            <p className="text-xl text-slate-500 max-w-xl leading-relaxed mx-auto lg:mx-0">
              {t('hero.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button
                onClick={() => navigate('/register')}
                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-lg shadow-xl shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                {t('hero.cta_start')} <ArrowUpRight size={20} />
              </button>
              <button
                onClick={() => navigate('/plans')}
                className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2"
              >
                {t('hero.cta_plans')}
              </button>
            </div>

            <div className="pt-8 flex items-center justify-center lg:justify-start gap-8 border-t border-slate-100/50 mt-8">
              <div className="text-center lg:text-left">
                <div className="text-2xl font-bold text-slate-900">$250k+</div>
                <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">{t('hero.total_invested')}</div>
              </div>
              <div className="w-px h-10 bg-slate-200"></div>
              <div className="text-center lg:text-left">
                <div className="text-2xl font-bold text-slate-900">5k+</div>
                <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">{t('hero.active_users')}</div>
              </div>
              <div className="w-px h-10 bg-slate-200"></div>
              <div className="text-center lg:text-left">
                <div className="text-2xl font-bold text-emerald-500">99.9%</div>
                <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">{t('hero.uptime')}</div>
              </div>
            </div>
          </div>

          {/* Visual - Simplified & Clean */}
          <div className="relative animate-in slide-in-from-right-4 duration-700 fade-in hidden lg:flex items-center justify-center h-[500px]">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100/40 to-transparent rounded-full blur-3xl opacity-60"></div>

            {/* Floating Cards Graphic */}
            <div className="relative z-10 w-full max-w-md">
              <div className="absolute top-0 right-0 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 animate-float-slow">
                <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600"><Bitcoin size={24} /></div>
                <div>
                  <div className="text-xs text-slate-400 font-bold">Bitcoin Payout</div>
                  <div className="text-sm font-bold text-slate-900">+ 0.0452 BTC</div>
                </div>
              </div>

              <div className="cube-scene mx-auto mt-12">
                <div className="cube">
                  <div className="cube-face front bg-emerald-500/5 border-emerald-500/20"><Hexagon className="text-emerald-500" size={60} strokeWidth={1.5} /></div>
                  <div className="cube-face back bg-emerald-500/5 border-emerald-500/20"><Hexagon className="text-emerald-500" size={60} strokeWidth={1.5} /></div>
                  <div className="cube-face right bg-emerald-500/5 border-emerald-500/20"><Hexagon className="text-emerald-500" size={60} strokeWidth={1.5} /></div>
                  <div className="cube-face left bg-emerald-500/5 border-emerald-500/20"><Hexagon className="text-emerald-500" size={60} strokeWidth={1.5} /></div>
                  <div className="cube-face top bg-emerald-500/5 border-emerald-500/20"><Hexagon className="text-emerald-500" size={60} strokeWidth={1.5} /></div>
                  <div className="cube-face bottom bg-emerald-500/5 border-emerald-500/20"><Hexagon className="text-emerald-500" size={60} strokeWidth={1.5} /></div>
                  <div className="inner-cube">
                    <div className="inner-face front bg-emerald-400/20 border-emerald-400"></div>
                    <div className="inner-face back bg-emerald-400/20 border-emerald-400"></div>
                    <div className="inner-face right bg-emerald-400/20 border-emerald-400"></div>
                    <div className="inner-face left bg-emerald-400/20 border-emerald-400"></div>
                    <div className="inner-face top bg-emerald-400/20 border-emerald-400"></div>
                    <div className="inner-face bottom bg-emerald-400/20 border-emerald-400"></div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-10 left-0 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 animate-float-delayed">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Zap size={24} /></div>
                <div>
                  <div className="text-xs text-slate-400 font-bold">Mining Speed</div>
                  <div className="text-sm font-bold text-slate-900">145 TH/s</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Partners Strip */}
      <section className="border-y border-slate-100 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm font-medium text-slate-400 mb-6 uppercase tracking-widest">{t('home.trust_text')}</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="flex items-center gap-2 font-bold text-xl text-slate-800"><Hexagon size={24} className="text-orange-500" /> Bitcoin</div>
            <div className="flex items-center gap-2 font-bold text-xl text-slate-800"><Hexagon size={24} className="text-blue-500" /> Ethereum</div>
            <div className="flex items-center gap-2 font-bold text-xl text-slate-800"><Hexagon size={24} className="text-green-500" /> Tether</div>
            <div className="flex items-center gap-2 font-bold text-xl text-slate-800"><Hexagon size={24} className="text-indigo-500" /> Litecoin</div>
            <div className="flex items-center gap-2 font-bold text-xl text-slate-800"><Hexagon size={24} className="text-yellow-500" /> Binance</div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">{t('home.why_us')}</h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg">{t('home.why_subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:border-emerald-100 transition-all duration-300 group">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
              <Wallet size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{t('home.feature_1')}</h3>
            <p className="text-slate-500 leading-relaxed">{t('home.feature_1_desc')}</p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:border-emerald-100 transition-all duration-300 group">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{t('home.feature_2')}</h3>
            <p className="text-slate-500 leading-relaxed">{t('home.feature_2_desc')}</p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:border-emerald-100 transition-all duration-300 group">
            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-6 group-hover:scale-110 transition-transform">
              <TrendingUp size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{t('home.feature_3')}</h3>
            <p className="text-slate-500 leading-relaxed">{t('home.feature_3_desc')}</p>
          </div>
        </div>
      </section>

      {/* Simplified How It Works */}
      <section className="bg-slate-900 py-24 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[100px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">{t('home.how_works')}</h2>
              <p className="text-slate-400 text-lg mb-8 max-w-md">{t('home.how_subtitle')}</p>

              <div className="space-y-8">
                {[
                  { title: t('home.step_1'), desc: t('home.step_1_desc') },
                  { title: t('home.step_2'), desc: t('home.step_2_desc') },
                  { title: t('home.step_3'), desc: t('home.step_3_desc') }
                ].map((step, i) => (
                  <div key={i} className="flex gap-6">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-white">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">{step.title}</h4>
                      <p className="text-slate-400">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate('/register')}
                className="mt-10 px-8 py-4 bg-white text-slate-900 rounded-xl font-bold hover:bg-emerald-50 transition-colors"
              >
                {t('hero.cta_start')}
              </button>
            </div>

            <div className="relative">
              <img
                src="/crypto_mining_rigs_v2_dark_1768871482557.png"
                alt="Mining Infrastructure"
                className="rounded-2xl shadow-2xl border border-slate-700 opacity-90 hover:opacity-100 transition-opacity"
              />
              <div className="absolute -bottom-6 -left-6 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="bg-emerald-500/20 p-3 rounded-xl text-emerald-400">
                    <CheckCircle size={24} />
                  </div>
                  <div>
                    <div className="text-slate-400 text-sm">Status</div>
                    <div className="text-white font-bold">Active & Mining</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Plans Preview */}
      <section className="max-w-7xl mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">{t('home.plans_title')}</h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">{t('home.plans_subtitle')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} variant="display" onSelect={() => navigate('/plans')} />
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-emerald-50/50 py-24">
        <div className="max-w-3xl mx-auto px-4 w-full">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">{t('home.faq_title')}</h2>
            <p className="text-slate-500">{t('home.faq_subtitle')}</p>
          </div>
          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <details key={i} className="group bg-white rounded-xl shadow-sm border border-slate-100 open:border-emerald-200">
                <summary className="flex justify-between items-center p-6 cursor-pointer list-none font-medium text-slate-800 hover:text-emerald-600 transition-colors">
                  {faq.q}
                  <span className="transition group-open:rotate-180">
                    <ChevronDown className="text-slate-400 group-hover:text-emerald-500" />
                  </span>
                </summary>
                <div className="px-6 pb-6 text-slate-500 leading-relaxed animate-in fade-in slide-in-from-top-1">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto bg-emerald-600 rounded-[2.5rem] p-12 lg:p-16 text-center text-white relative overflow-hidden shadow-2xl shadow-emerald-500/30">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">Ready to maximize your income?</h2>
            <p className="text-emerald-100 text-xl mb-10 max-w-2xl mx-auto">Join thousands of smart investors who are already earning daily passive income with MineFlow.</p>
            <button
              onClick={() => navigate('/register')}
              className="bg-white text-emerald-600 px-10 py-5 rounded-xl font-bold text-xl hover:bg-emerald-50 transition-colors shadow-lg"
            >
              {t('hero.cta_start')}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

// ... (Rest of the pages remain largely the same, just ensuring correct imports and layout)

const PlansPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  return (
    <div className="py-20 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4">
        <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">{t('plans.title')}</h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto">
          {t('plans.subtitle')}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        {PLANS.map((plan, i) => (
          <div key={plan.id} className={`animate-in fade-in slide-in-from-bottom-8 fill-mode-backwards delay-[${i * 100}ms]`}>
            <PlanCard plan={plan} variant="display" onSelect={() => navigate('/dashboard')} />
          </div>
        ))}
      </div>
    </div>
  );
};

const BountyPage = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [links, setLinks] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [messages, setMessages] = useState<{ [key: string]: { text: string; type: 'success' | 'alert' } | null }>({});

  const handleSubmit = async (taskId: string, platform: string) => {
    const link = links[taskId];
    if (!link || !user) return;

    setLoading(prev => ({ ...prev, [taskId]: true }));
    setMessages(prev => ({ ...prev, [taskId]: null }));

    try {
      const { error } = await supabase.from('bounties').insert({
        user_id: user.id,
        platform: platform,
        link: link,
        status: 'pending'
      });

      if (error) throw error;

      setMessages(prev => ({ ...prev, [taskId]: { text: 'Submitted successfully! An admin will review it.', type: 'success' } }));
      setLinks(prev => ({ ...prev, [taskId]: '' }));
    } catch (err: any) {
      console.error('Bounty Error:', err);
      setMessages(prev => ({ ...prev, [taskId]: { text: err.message || 'Failed to submit.', type: 'alert' } }));
    } finally {
      setLoading(prev => ({ ...prev, [taskId]: false }));
    }
  };

  return (
    <div className="py-20 px-4 max-w-5xl mx-auto">
      <div className="text-center mb-16">
        <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">{t('bounty.title')}</h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto">
          {t('bounty.subtitle')}
        </p>
      </div>

      <div className="space-y-8">
        {BOUNTY_TASKS.map((task) => (
          <div key={task.id} className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100 flex flex-col md:flex-row gap-8 items-start hover:shadow-xl transition-shadow">
            <div className="bg-slate-50 p-6 rounded-2xl flex-shrink-0">
              {task.icon}
            </div>
            <div className="flex-grow space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="text-2xl font-bold text-slate-800">{task.platform}</h3>
                <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-amber-100 text-amber-700 font-bold text-sm">
                  {t('bounty.reward')}: {task.rewardRange}
                </div>
              </div>
              <p className="text-slate-600 text-lg">{task.description}</p>
              <ul className="space-y-2">
                {task.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-slate-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    {req}
                  </li>
                ))}
              </ul>

              <div className="pt-4 mt-4 border-t border-slate-100">
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('bounty.submit')}</label>
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={links[task.id] || ''}
                      onChange={(e) => setLinks(prev => ({ ...prev, [task.id]: e.target.value }))}
                      placeholder={t('bounty.placeholder')}
                      className="flex-grow px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    <button
                      onClick={() => handleSubmit(task.id, task.platform)}
                      disabled={loading[task.id] || !links[task.id]}
                      className="bg-emerald-500 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading[task.id] ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : t('bounty.send')}
                    </button>
                  </div>
                  {messages[task.id] && (
                    <div className={`text-sm font-bold flex items-center gap-2 ${messages[task.id]?.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {messages[task.id]?.type === 'success' ? <ShieldCheck size={16} /> : <AlertCircle size={16} />}
                      {messages[task.id]?.text}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};



const StatsPage = () => {
  const { t } = useLanguage();


  return (
    <div className="py-20 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">{t('stats.title')}</h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto">
          {t('stats.subtitle')}
        </p>
      </div>

      <div className="space-y-12">
        {/* Payouts Table */}
        <LastPayouts />

        {/* Secondary Tables (Deposits / Partners) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-100">
            <div className="px-8 py-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2 h-8 bg-emerald-500 rounded-full block"></span>
                {t('stats.top_deposits')}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">{t('stats.user')}</th>
                    <th className="px-6 py-4 text-right">{t('stats.amount')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {MOCK_DEPOSITS.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-slate-700 font-medium">{row.user}</td>
                      <td className="px-6 py-4 text-emerald-600 font-bold text-right">${row.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-100">
            <div className="px-8 py-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2 h-8 bg-blue-500 rounded-full block"></span>
                {t('stats.top_partners')}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">{t('stats.user')}</th>
                    <th className="px-6 py-4 text-right">{t('stats.referrals')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {MOCK_PARTNERS.map((row, i) => (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-slate-700 font-medium">{row.user}</td>
                      <td className="px-6 py-4 text-blue-600 font-bold text-right">
                        {row.referrals}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simplified CheckCircle component for the hero image
const CheckCircle = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);



const ContactPage = () => {
  const { t } = useLanguage();
  return (
    <div className="py-20 px-4 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">{t('contact.title')}</h1>
            <p className="text-xl text-slate-500 leading-relaxed">
              {t('contact.subtitle')}
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-emerald-100 text-emerald-600 p-4 rounded-xl">
                <Mail size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{t('contact.email')}</h3>
                <p className="text-slate-500">support@mineflow.com</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t('auth.name')}</label>
              <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" placeholder="Your name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t('auth.email')}</label>
              <input type="email" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" placeholder="your@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t('contact.message')}</label>
              <textarea rows={4} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" placeholder="How can we help?"></textarea>
            </div>
            <button className="w-full bg-emerald-500 text-white font-bold py-4 rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">
              {t('contact.send_btn')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};



// --- Main App Component ---

const App = () => {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref');
    if (ref) {
      localStorage.setItem('referral_code', ref);
      console.log('Referral code captured:', ref);
    }
  }, [location.search]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  console.log("[App Debug] User:", user?.email, "Profile exists:", !!profile, "Role:", profile?.role, "Loading:", loading);

  if (loading) {
    return <FullPageLoader />;
  }

  const getRedirectPath = () => {
    if (!profile) return null; // Wait for profile
    const role = profile.role?.toLowerCase();
    if (role === 'admin' || role === 'adm') return "/admin/dashboard";
    return "/dashboard";
  };

  const isAdmin = user && (
    user.email === 'kenagostinhops@gmail.com' || 
    profile?.role?.toLowerCase() === 'admin' || 
    profile?.role?.toLowerCase() === 'adm'
  );

  return (
    <div className="min-h-screen flex flex-col bg-emerald-50 font-sans text-slate-800">
      <ScrollToTop />
      <Header
        isAuthenticated={!!user}
        onLogout={handleLogout}
        user={user}
        profile={profile}
      />

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/plans" element={<PlansPage />} />
          <Route path="/bounty" element={<BountyPage />} />
          <Route path="/live-payouts" element={<StatsPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/support" element={<ContactPage />} />
          
          <Route path="/login" element={
            user ? (
              getRedirectPath() ? <Navigate to={getRedirectPath()!} /> : <FullPageLoader />
            ) : (
              <AuthPage type="login" onLogin={() => {
                // The Navigate inside the Route will handle it once user/profile updates
              }} />
            )
          } />
          
          <Route path="/register" element={
            user ? (
              getRedirectPath() ? <Navigate to={getRedirectPath()!} /> : <FullPageLoader />
            ) : (
              <AuthPage type="register" onLogin={() => {}} />
            )
          } />

          <Route path="/dashboard" element={user ? <DashboardPage onNavigate={navigate} /> : <Navigate to="/login" />} />
          <Route path="/admin/*" element={isAdmin ? <AdminDashboardPage /> : (profile ? <Navigate to="/dashboard" /> : <FullPageLoader />)} />
          <Route path="/wallet-settings" element={user ? <WalletSettingsPage /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      <Footer onNavigate={navigate} />
      <LanguageSwitcher />
    </div>
  );
};

export default App;