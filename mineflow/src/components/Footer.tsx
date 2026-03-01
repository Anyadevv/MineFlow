import React from 'react';
import { Hexagon, Send, Globe } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

export const Footer = ({ onNavigate }: { onNavigate: (page: string) => void }) => {
  const { t } = useLanguage();
  return (
    <footer className="bg-emerald-600 text-white pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="space-y-6 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                <Hexagon size={28} fill="currentColor" />
              </div>
              <span className="text-3xl font-black tracking-tight">MineFlow</span>
            </div>
            <p className="text-emerald-100 text-base leading-relaxed max-w-sm mx-auto md:mx-0">
              {t('hero.subtitle')}
            </p>
            <div className="flex justify-center md:justify-start gap-4 pt-2">
              <a
                href="https://mineflow-mine.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 hover:bg-white/20 p-3 rounded-xl backdrop-blur-sm transition-all group border border-white/5"
                title="Google"
              >
                <Globe size={20} className="text-emerald-100 group-hover:text-white" />
              </a>
              <a
                href="https://t.me/mineflow_appbot"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 hover:bg-white/20 p-3 rounded-xl backdrop-blur-sm transition-all group border border-white/5"
                title="Telegram"
              >
                <Send size={20} className="text-emerald-100 group-hover:text-white" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="text-center md:text-left">
            <h4 className="font-black text-lg mb-8 uppercase tracking-widest text-emerald-200">{t('footer.quick_links')}</h4>
            <ul className="space-y-4">
              {[
                { path: '/', label: 'home' },
                { path: '/plans', label: 'plans' },
                { path: '/live-payouts', label: 'stats' },
                { path: '/help', label: 'faq' },
                { path: '/support', label: 'contact' }
              ].map((item) => (
                <li key={item.path}>
                  <button
                    onClick={() => onNavigate(item.path)}
                    className="text-emerald-100 hover:text-white transition-colors text-base font-medium"
                  >
                    {t(`nav.${item.label}`)}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="text-center md:text-left">
            <h4 className="font-black text-lg mb-8 uppercase tracking-widest text-emerald-200">{t('footer.legal')}</h4>
            <ul className="space-y-4">
              {['Terms of Service', 'Privacy Policy'].map((item) => (
                <li key={item}>
                  <button className="text-emerald-100 hover:text-white transition-colors text-base font-medium">
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="text-center md:text-left">
            <h4 className="font-black text-lg mb-8 uppercase tracking-widest text-emerald-200">{t('footer.newsletter')}</h4>
            <p className="text-emerald-100 text-sm mb-6 max-w-sm mx-auto md:mx-0">
              {t('footer.subscribe_desc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder={t('auth.email')}
                className="bg-emerald-700/50 border border-emerald-500 rounded-xl px-5 py-3.5 text-base text-white placeholder-emerald-300 w-full focus:outline-none focus:ring-2 focus:ring-white/20 transition-all font-medium"
              />
              <button className="bg-white text-emerald-600 px-8 py-3.5 rounded-xl text-base font-black hover:bg-emerald-50 transition-all shadow-lg active:scale-95 whitespace-nowrap">
                {t('footer.subscribe')}
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-emerald-500/30 pt-8 text-center text-emerald-200/60 text-xs font-bold uppercase tracking-widest">
          &copy; {new Date().getFullYear()} MineFlow. All rights reserved.
        </div>
      </div>
    </footer>
  );
};