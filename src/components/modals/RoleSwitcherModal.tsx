import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useToast } from '../../context/ToastContext';
import { Shield, Key, Loader2, X, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface RoleSwitcherModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [targetRole, setTargetRole] = useState<'admin' | 'staff' | 'superadmin'>('admin');
    const [password, setPassword] = useState('');

    const roles = [
        { id: 'admin', label: 'Admin', email: 'admin@gmail.com', color: 'bg-blue-600' },
        { id: 'staff', label: 'Staff', email: 'staff@gmail.com', color: 'bg-teal-600' },
        { id: 'superadmin', label: 'Super Admin', email: 'super@gmail.com', color: 'bg-purple-600' },
    ];

    useEffect(() => {
        // Default target role based on what's NOT the current role
        if (user?.role === 'superadmin') {
            setTargetRole('admin');
        } else {
            setTargetRole('superadmin');
        }
    }, [user?.role]);

    const handleSwitch = async () => {
        if (!password) {
            showToast({ title: 'Error', message: 'Password is required', type: 'error' });
            return;
        }

        setLoading(true);
        const selected = roles.find(r => r.id === targetRole);

        try {
            // Re-authenticate with target role credentials
            const { error } = await supabase.auth.signInWithPassword({
                email: selected!.email,
                password: password
            });

            if (error) throw error;

            // Track switching state for bi-directional logic
            localStorage.setItem('is_switched', 'true');
            localStorage.setItem('original_role', user?.role || 'admin');

            showToast({ title: 'Success', message: `Switched to ${selected!.label} account`, type: 'success' });
            onClose();

            // Redirect based on target role
            window.location.href = `/${targetRole}/dashboard`;
        } catch (err: any) {
            showToast({ title: 'Switch Failed', message: err.message || 'Verification failed', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="px-8 py-6 bg-slate-900 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                            <RefreshCw className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold tracking-tight">Switch Account</h3>
                            <p className="text-slate-400 text-[10px] uppercase font-black tracking-widest leading-none mt-1">Role Fast-Switcher</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 space-y-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Select Target Role</label>
                        <div className="grid grid-cols-3 gap-2">
                            {roles.map(r => (
                                <button
                                    key={r.id}
                                    onClick={() => setTargetRole(r.id as any)}
                                    className={`py-3 px-2 rounded-2xl text-[10px] font-black uppercase tracking-tight border-2 transition-all ${targetRole === r.id
                                        ? `border-slate-900 ${r.color} text-white shadow-lg`
                                        : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                                        }`}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Verify Password</label>
                        <div className="relative">
                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter role password"
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-300 focus:border-slate-900 outline-none transition-all font-medium"
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 flex items-start gap-1.5 px-1 leading-relaxed">
                            <Shield className="absolute left-1 mt-0.5 " />
                            <span className="pl-5 inline-block">This will re-authenticate you as the selected role. Previous session data will be cleared and replaced.</span>
                        </p>
                    </div>

                    <button
                        onClick={handleSwitch}
                        disabled={loading || !password}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm & Switch'}
                    </button>

                    <button
                        onClick={onClose}
                        className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
                    >
                        Back to Workspace
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RoleSwitcherModal;
