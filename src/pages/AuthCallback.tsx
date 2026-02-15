import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Loader2 } from 'lucide-react';

/**
 * Auth Callback Handler
 * This component handles the redirect after OAuth login (Google/LinkedIn)
 * It checks if the user has a profile and their status, then redirects accordingly
 */
const AuthCallback: React.FC = () => {
    const navigate = useNavigate();
    const [status, setStatus] = useState('Verifying your account...');

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                // Get the session from URL hash (Supabase puts tokens there after OAuth)
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) throw error;

                if (!session?.user) {
                    setStatus('No session found. Redirecting to login...');
                    setTimeout(() => navigate('/login'), 1500);
                    return;
                }

                const user = session.user;
                setStatus('Checking your profile...');

                // Check if user has a profile
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role, status, first_name')
                    .eq('id', user.id)
                    .single();

                if (profileError || !profile) {
                    // No profile exists — admin hasn't created their account yet
                    setStatus('Account not found. Redirecting...');
                    await supabase.auth.signOut();
                    setTimeout(() => navigate('/login'), 1500);
                    return;
                }

                // Profile exists - check status
                setStatus(`Welcome back, ${profile.first_name || 'User'}!`);

                setTimeout(async () => {
                    // Admin/SuperAdmin go to admin dashboard
                    if (['admin', 'registrar', 'superadmin'].includes(profile.role)) {
                        navigate(profile.role === 'superadmin' ? '/superadmin/dashboard' : '/admin/dashboard', { replace: true });
                        return;
                    }

                    // Staff go to staff dashboard
                    if (profile.role === 'staff') {
                        navigate('/staff/dashboard', { replace: true });
                        return;
                    }

                    // Alumni - check verification status
                    if (profile.role === 'alumni') {
                        switch (profile.status) {
                            case 'verified':
                                navigate('/alumni/dashboard', { replace: true });
                                break;
                            case 'pending_approval':
                                await supabase.auth.signOut();
                                navigate('/login', { replace: true });
                                break;
                            case 'rejected':
                                await supabase.auth.signOut();
                                navigate('/login?error=rejected', { replace: true });
                                break;
                            default:
                                // No status yet — accounts must be admin-provisioned
                                await supabase.auth.signOut();
                                navigate('/login', { replace: true });
                        }
                        return;
                    }

                    // Unknown role - go to login
                    navigate('/login', { replace: true });
                }, 1500);

            } catch (error: any) {
                console.error('Auth callback error:', error);
                setStatus('Something went wrong. Redirecting...');
                setTimeout(() => navigate('/login'), 2000);
            }
        };

        handleAuthCallback();
    }, [navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="bg-white rounded-2xl shadow-xl p-10 text-center max-w-sm w-full">
                <div className="flex justify-center mb-6">
                    <img
                        src="/images/Linker College Of The Philippines.png"
                        alt="Logo"
                        className="h-16 w-16 object-contain"
                    />
                </div>
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">{status}</p>
            </div>
        </div>
    );
};

export default AuthCallback;
