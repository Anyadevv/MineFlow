import React from 'react';
import { Hexagon, Send } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

export const Footer = ({ onNavigate }: { onNavigate: (page: string) => void }) => {
  const { t } = useLanguage();
  return (
    <footer className="bg-emerald-600 text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <Hexagon size={24} fill="currentColor" />
              </div>
              <span className="text-2xl font-bold">MineFlow</span>
            </div>
            <p className="text-emerald-100 text-sm leading-relaxed max-w-xs">
              {t('hero.subtitle')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-lg mb-6">{t('footer.quick_links')}</h4>
            <ul className="space-y-3">
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
                    className="text-emerald-100 hover:text-white transition-colors text-sm"
                  >
                    {t(`nav.${item.label}`)}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold text-lg mb-6">{t('footer.legal')}</h4>
            <ul className="space-y-3">
              {['Terms of Service', 'Privacy Policy'].map((item) => (
                <li key={item}>
                  <button className="text-emerald-100 hover:text-white transition-colors text-sm">
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-bold text-lg mb-6">{t('footer.newsletter')}</h4>
            <p className="text-emerald-100 text-sm mb-4">
              {t('footer.subscribe_desc')}
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder={t('auth.email')}
                className="bg-emerald-700/50 border border-emerald-500 rounded-lg px-4 py-2 text-sm text-white placeholder-emerald-300 w-full focus:outline-none focus:ring-2 focus:ring-white/20"
              />
              <button className="bg-white text-emerald-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-50 transition-colors">
                {t('footer.subscribe')}
              </button>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};