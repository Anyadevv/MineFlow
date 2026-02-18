import React, { useState, useRef, useEffect } from 'react';
import { useLanguage, LANGUAGES } from '../LanguageContext';
import { ChevronUp, Check } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, dir } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="fixed bottom-6 left-6 z-50" ref={dropdownRef}>
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-3 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden min-w-[180px] animate-in slide-in-from-bottom-2 fade-in duration-200">
          <div className="py-2 max-h-[300px] overflow-y-auto">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2.5 flex items-center justify-between hover:bg-emerald-50 transition-colors text-left ${
                  language === lang.code ? 'bg-emerald-50 text-emerald-600' : 'text-slate-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{lang.flag}</span>
                  <span className="font-medium text-sm">{lang.name}</span>
                </div>
                {language === lang.code && <Check size={16} className="text-emerald-500" />}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white hover:bg-slate-50 border border-slate-200 shadow-lg text-slate-700 px-4 py-3 rounded-full flex items-center gap-3 transition-all hover:scale-105 active:scale-95 group"
      >
        <span className="text-xl">{currentLang.flag}</span>
        <span className="font-bold text-sm uppercase tracking-wider">{currentLang.code}</span>
        <ChevronUp 
          size={16} 
          className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
    </div>
  );
};