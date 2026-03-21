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

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', targetUser.id)
                .single();

            if (error) throw error;
            setProfile(data);
        } catch (err) {
            console.error('Error refreshing profile:', err);
            setProfile(null);
        }
    };

    useEffect(() => {
        let isInitialLoad = true;

        const initializeAuth = async () => {
            // Get initial session
            const { data: { session } } = await supabase.auth.getSession();
            const currentUser = session?.user ?? null;
            setUser(currentUser);

            if (currentUser) {
                await refreshProfile(currentUser);
            }
            setLoading(false);
            isInitialLoad = false;
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
