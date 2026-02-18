import React, { useState, useRef, useEffect } from 'react';
import { LogOut, ChevronDown, User, Wallet, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const UserMenu = ({ onNavigate }: { onNavigate: (page: string) => void }) => {
    const { profile, signOut } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getInitials = (email: string) => {
        return email?.substring(0, 2).toUpperCase() || 'US';
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 bg-white pl-4 pr-3 py-2 rounded-full border border-slate-100 shadow-sm hover:shadow-md transition-all group"
            >
                <div className="flex flex-col items-end mr-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logged in as</span>
                    <span className="text-xs font-bold text-slate-700 max-w-[150px] truncate">{profile?.email}</span>
                </div>
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold border-2 border-white shadow-sm group-hover:scale-105 transition-transform">
                    {getInitials(profile?.email || '')}
                </div>
                <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                    <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                        <p className="text-xs font-bold text-slate-500">My Account</p>
                        <p className="text-sm font-black text-slate-800 truncate">{profile?.email}</p>
                    </div>
                    <div className="p-2 space-y-1">
                        <button
                            onClick={() => { setIsOpen(false); onNavigate('/dashboard'); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-50 hover:text-emerald-600 transition-colors text-sm"
                        >
                            <LayoutDashboard size={18} /> Dashboard
                        </button>
                        <button
                            onClick={() => { setIsOpen(false); onNavigate('/wallet-settings'); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-50 hover:text-emerald-600 transition-colors text-sm"
                        >
                            <Wallet size={18} /> Wallet Settings
                        </button>
                    </div>
                    <div className="p-2 border-t border-slate-50">
                        <button
                            onClick={() => signOut()}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-red-500 hover:bg-red-50 transition-colors text-sm"
                        >
                            <LogOut size={18} /> Logout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
