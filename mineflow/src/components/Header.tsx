import React, { useState } from 'react';
import { Menu, X, Hexagon, User as UserIcon } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { Database } from '../lib/database.types';
import { User } from '@supabase/supabase-js';
import { useNavigate, useLocation } from 'react-router-dom';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface HeaderProps {
  isAuthenticated: boolean;
  onLogout: () => void;
  user?: User | null;
  profile?: Profile | null;
}

export const Header: React.FC<HeaderProps> = ({ isAuthenticated, onLogout, user, profile }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: '/', label: 'Home' },
    { id: '/plans', label: 'Plans' },
    { id: '/bounty', label: 'Bounty' },
    { id: '/live-payouts', label: 'Live Payouts' },
    { id: '/help', label: 'Help' },
    { id: '/support', label: 'Support' },
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => handleNavClick('/')}
          >
            <div className="bg-[#10b981] p-2 rounded-lg text-white">
              <Hexagon size={24} fill="white" />
            </div>
            <span className="text-2xl font-black text-slate-800 tracking-tight">
              MineFlow
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`text-sm font-bold transition-colors hover:text-[#10b981] ${location.pathname === item.id ? 'text-[#10b981]' : 'text-slate-500'
                  }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-6">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => handleNavClick('/dashboard')}
                  className="bg-[#f0fdf4] text-[#10b981] px-6 py-2.5 rounded-full font-black text-sm border border-[#10b981]/20 hover:bg-[#10b981] hover:text-white transition-all shadow-sm shadow-emerald-500/5"
                >
                  My Earnings
                </button>
                <button
                  onClick={onLogout}
                  className="text-xs font-bold text-slate-400 hover:text-slate-800 transition-colors uppercase tracking-wider"
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleNavClick('/login')}
                  className="text-slate-500 font-bold hover:text-[#10b981] transition-colors text-sm"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleNavClick('/register')}
                  className="bg-[#10b981] text-white px-8 py-3 rounded-full font-black shadow-lg shadow-emerald-500/20 hover:bg-[#059669] transition-all hover:scale-105"
                >
                  Get Started
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-slate-600"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-100 animate-in slide-in-from-top-2">
          <div className="px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`block w-full text-left px-4 py-3 rounded-lg text-base font-medium ${location.pathname === item.id ? 'bg-emerald-50 text-emerald-600' : 'text-slate-600 hover:bg-slate-50'
                  }`}
              >
                {item.label}
              </button>
            ))}
            <div className="border-t border-slate-100 my-2 pt-2 space-y-2">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => handleNavClick('/dashboard')}
                    className="block w-full text-center px-4 py-3 rounded-lg text-base font-black bg-[#f0fdf4] text-[#10b981] border border-[#10b981]/20"
                  >
                    My Earnings
                  </button>
                  <button
                    onClick={onLogout}
                    className="block w-full text-center px-4 py-3 rounded-lg text-base font-bold text-slate-400 uppercase tracking-widest"
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleNavClick('/login')}
                    className="block w-full text-center px-4 py-3 rounded-lg text-base font-bold text-slate-500 border border-slate-100"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => handleNavClick('/register')}
                    className="block w-full text-center px-4 py-3 rounded-lg text-base font-black bg-[#10b981] text-white shadow-md"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};