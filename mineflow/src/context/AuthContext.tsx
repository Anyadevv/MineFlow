import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { Database } from '../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshProfile = async (currentUser?: User) => {
        const targetUser = currentUser || user;
        if (!targetUser) {
            setProfile(null);
            return;
        }

        // --- SAFETY TIMEOUT ---
        // If the Supabase request hangs (due to network drops, corrupted local tokens, or backend stalls),
        // we force an abort to prevent infinite loading screens.
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => {
            console.error('refreshProfile timed out! Forcing reset.');
            abortController.abort();
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/login';
        }, 3000);

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', targetUser.id)
                .abortSignal(abortController.signal)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    console.log('Profile not found, auto-repairing...');
                    
                    // --- NEW: Referral Support in Auto-Repair ---
                    const refCode = targetUser.raw_user_meta_data?.referrer_code;
                    let referrerId = null;

                    if (refCode) {
                        try {
                            const { data: refData } = await supabase
                                .from('profiles')
                                .select('id')
                                .eq('referral_code', refCode)
                                .single();
                            if (refData) referrerId = refData.id;
                        } catch (e) {
                            console.warn("Could not find referrer for code:", refCode);
                        }
                    }

                    // Attempt to auto-create missing profile
                    const { data: newProfile, error: insertError } = await supabase
                        .from('profiles')
                        .insert({
                            id: targetUser.id,
                            email: targetUser.email,
                            full_name: targetUser.user_metadata?.full_name || 'User',
                            referral_code: Math.random().toString(36).substring(2, 10).toUpperCase(),
                            referrer_id: referrerId // Keep the link in profile if found, but skip the 'referrals' table
                        })
                        .select()
                        .single();
                        
                    if (!insertError && newProfile) {
                        setProfile(newProfile);
                        clearTimeout(timeoutId);
                        return;
                    } else {
                        throw insertError || new Error("Failed to create profile");
                    }
                }
                throw error;
            }
            setProfile(data);
            clearTimeout(timeoutId);
        } catch (err: any) {
            clearTimeout(timeoutId);
            if (err.name === 'AbortError') return; // We already redirected in the timeout

            console.error('Error refreshing profile:', err);
            setProfile(null);
            setUser(null);
            
            // EMERGENCY FALLBACK: The session is corrupted. 
            // We MUST clear and redirect instantly. Do NOT wait for signOut() to finish 
            // because a corrupted session makes the Supabase network request hang forever.
            localStorage.clear();
            sessionStorage.clear();
            
            // Fire and forget signout
            supabase.auth.signOut().catch(console.error);
            
            window.location.href = '/login';
        }
    };

    useEffect(() => {
        let isInitialLoad = true;

        const initializeAuth = async () => {
            // Safety timeout to prevent infinite loading screens if Supabase client hangs
            const timeoutId = setTimeout(() => {
                console.error("Auth initialization timed out! Forcing reset.");
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = '/login';
            }, 3000); // 3 seconds max wait

            try {
                // Get initial session
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) {
                    console.error("Auth session error:", error);
                }
                const currentUser = session?.user ?? null;
                setUser(currentUser);

                if (currentUser) {
                    await refreshProfile(currentUser);
                }
            } catch (error) {
                console.error("Failed to initialize auth:", error);
            } finally {
                clearTimeout(timeoutId);
                setLoading(false);
                isInitialLoad = false;
            }
        };

        initializeAuth();

        // Auth State Change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("Auth Event:", event);
            const currentUser = session?.user ?? null;
            setUser(currentUser);

            if (event === 'SIGNED_IN') {
                // If it's a fresh sign in after the app has already loaded, 
                // refresh profile in background or show a localized loader if needed.
                // We avoid setting the global 'loading' to true to prevent screen flickering/stuck loaders.
                await refreshProfile(currentUser);
            } else if (event === 'SIGNED_OUT') {
                setProfile(null);
            } else if (currentUser && !profile && !isInitialLoad) {
                // Background refresh if profile is missing
                await refreshProfile(currentUser);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // 3. Realtime Balance Updates
    useEffect(() => {
        if (!user) return;

        console.log('Setting up realtime deposit listener for user:', user.id);

        const channel = supabase
            .channel(`deposits-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen for INSERT and UPDATE
                    schema: 'public',
                    table: 'deposits',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    console.log('Realtime Deposit Update:', payload);
                    const newRecord = payload.new as any;

                    // If a deposit is approved (either new insert as approved or update to approved)
                    // We refresh the profile to get the new balance.
                    if (newRecord && newRecord.status === 'approved') {
                        console.log('Deposit approved! Refreshing profile...');
                        refreshProfile();
                    }
                }
            )
            .subscribe((status) => {
                console.log('Realtime subscription status:', status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile: () => refreshProfile() }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
