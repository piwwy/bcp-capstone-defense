import React, { useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useToast } from '../../context/ToastContext';
import { logAudit, AUDIT_ACTIONS } from '../../services/auditLogger';
import {
    X, Loader2, UserPlus, Eye, EyeOff, Copy, CheckCircle,
    GraduationCap, Mail, Key, Shield
} from 'lucide-react';

interface CreateUserModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

const COURSES = [
    'BSIT', 'BSCS', 'BSCpE', 'BSBA', 'BSA', 'BSED', 'BEED',
    'BSCRIM', 'BSHM', 'BSTM', 'BSN', 'BSME', 'BSEE', 'BSCE',
    'AB-POLSCI', 'AB-COMM', 'BSENTREP'
];

const generatePassword = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const specials = '!@#$%';
    let pass = '';
    for (let i = 0; i < 8; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    pass += specials.charAt(Math.floor(Math.random() * specials.length));
    return pass;
};

const CreateUserModal: React.FC<CreateUserModalProps> = ({ onClose, onSuccess }) => {
    const { showToast } = useToast();

    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        student_id: '',
        course: 'BSIT',
        batch_year: new Date().getFullYear().toString(),
        role: 'alumni' as 'alumni' | 'staff' | 'admin',
        password: generatePassword(),
    });

    const [showPassword, setShowPassword] = useState(true);
    const [loading, setLoading] = useState(false);
    const [created, setCreated] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.first_name || !form.last_name || !form.email) {
            showToast({ type: 'warning', title: 'Missing Fields', message: 'Please fill in all required fields.' });
            return;
        }
        setLoading(true);

        try {
            // Save current session so we can restore it after signUp
            const { data: { session: currentSession } } = await supabase.auth.getSession();

            // Step 1: Create auth user via signUp (no edge function needed)
            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email: form.email,
                password: form.password,
                options: {
                    data: {
                        full_name: `${form.first_name} ${form.last_name}`,
                        first_name: form.first_name,
                        last_name: form.last_name,
                    }
                }
            });

            if (signUpError) throw signUpError;
            if (!authData.user) throw new Error('User creation failed — no user returned.');

            // Step 2: Upsert profile record
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: authData.user.id,
                    email: form.email,
                    first_name: form.first_name,
                    last_name: form.last_name,
                    student_id: form.student_id || null,
                    course: form.course,
                    batch_year: form.batch_year,
                    role: form.role,
                    status: 'verified',
                    auth_provider: 'email',
                    avatar_url: `https://ui-avatars.com/api/?name=${form.first_name}+${form.last_name}&background=random`,
                }, { onConflict: 'id' });

            if (profileError) {
                console.error('Profile upsert error:', profileError);
            }

            // Step 3: Restore admin session (signUp may have switched the active session)
            if (currentSession) {
                await supabase.auth.setSession({
                    access_token: currentSession.access_token,
                    refresh_token: currentSession.refresh_token,
                });
            }

            // Log to audit trail
            await logAudit(AUDIT_ACTIONS.USER_CREATED, {
                module: 'User Management',
                message: `Created ${form.role} account for ${form.first_name} ${form.last_name} (${form.email})`,
            });

            setCreated(true);
            showToast({
                type: 'success',
                title: 'Account Created',
                message: `${form.role.charAt(0).toUpperCase() + form.role.slice(1)} account created for ${form.first_name} ${form.last_name}`
            });
        } catch (err: any) {
            console.error('Create user error:', err);
            showToast({ type: 'error', title: 'Creation Failed', message: err.message || 'Could not create user' });
        } finally {
            setLoading(false);
        }
    };

    // SUCCESS VIEW — show credentials
    if (created) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-center">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <CheckCircle className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white">Account Created!</h3>
                        <p className="text-green-100 text-sm mt-1">Share these credentials with the user</p>
                    </div>
                    <div className="p-6 space-y-4">
                        {/* Name */}
                        <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Full Name</p>
                            <p className="text-lg font-bold text-gray-900">{form.first_name} {form.last_name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {form.role.toUpperCase()} · {form.course} · Batch {form.batch_year}
                            </p>
                        </div>

                        {/* Email */}
                        <div className="flex items-center justify-between bg-blue-50 rounded-xl p-4 group">
                            <div>
                                <p className="text-xs font-bold text-blue-400 uppercase tracking-wide mb-0.5">Email</p>
                                <p className="text-sm font-bold text-blue-900">{form.email}</p>
                            </div>
                            <button
                                onClick={() => handleCopy(form.email, 'email')}
                                className="p-2 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                                {copiedField === 'email' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-blue-400" />}
                            </button>
                        </div>

                        {/* Password */}
                        <div className="flex items-center justify-between bg-purple-50 rounded-xl p-4 group">
                            <div>
                                <p className="text-xs font-bold text-purple-400 uppercase tracking-wide mb-0.5">Password</p>
                                <p className="text-sm font-bold text-purple-900 font-mono">{form.password}</p>
                            </div>
                            <button
                                onClick={() => handleCopy(form.password, 'password')}
                                className="p-2 rounded-lg hover:bg-purple-100 transition-colors"
                            >
                                {copiedField === 'password' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-purple-400" />}
                            </button>
                        </div>

                        {/* Copy All */}
                        <button
                            onClick={() => handleCopy(`Email: ${form.email}\nPassword: ${form.password}`, 'all')}
                            className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                        >
                            {copiedField === 'all' ? <><CheckCircle className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy All Credentials</>}
                        </button>

                        <button
                            onClick={() => { onSuccess(); onClose(); }}
                            className="w-full py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // FORM VIEW
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                            <UserPlus className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Create New Account</h3>
                            <p className="text-indigo-200 text-xs">Admin-provided account creation</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    {/* Role Selection */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                            <Shield className="w-3.5 h-3.5 inline mr-1" />Account Role
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['alumni', 'staff', 'admin'] as const).map(role => (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => setForm({ ...form, role })}
                                    className={`py-2.5 rounded-xl text-sm font-bold transition-all ${form.role === role
                                            ? role === 'admin' ? 'bg-red-500 text-white shadow-lg shadow-red-200'
                                                : role === 'staff' ? 'bg-teal-500 text-white shadow-lg shadow-teal-200'
                                                    : 'bg-blue-500 text-white shadow-lg shadow-blue-200'
                                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                        }`}
                                >
                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Name Row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">First Name *</label>
                            <input
                                type="text"
                                value={form.first_name}
                                onChange={e => setForm({ ...form, first_name: e.target.value })}
                                className="w-full p-3 bg-gray-50 rounded-xl border-none font-semibold outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                                placeholder="Juan"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Last Name *</label>
                            <input
                                type="text"
                                value={form.last_name}
                                onChange={e => setForm({ ...form, last_name: e.target.value })}
                                className="w-full p-3 bg-gray-50 rounded-xl border-none font-semibold outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                                placeholder="Dela Cruz"
                                required
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                            <Mail className="w-3.5 h-3.5 inline mr-1" />Email *
                        </label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                            className="w-full p-3 bg-gray-50 rounded-xl border-none font-semibold outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                            placeholder="user@linker.edu.ph"
                            required
                        />
                    </div>

                    {/* Student ID + Course Row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Student ID</label>
                            <input
                                type="text"
                                value={form.student_id}
                                onChange={e => setForm({ ...form, student_id: e.target.value })}
                                className="w-full p-3 bg-gray-50 rounded-xl border-none font-semibold outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                                placeholder="2024-00001"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                                <GraduationCap className="w-3.5 h-3.5 inline mr-1" />Course
                            </label>
                            <select
                                value={form.course}
                                onChange={e => setForm({ ...form, course: e.target.value })}
                                className="w-full p-3 bg-gray-50 rounded-xl border-none font-semibold outline-none focus:ring-2 focus:ring-indigo-200 transition-all cursor-pointer"
                            >
                                {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Batch Year */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Batch Year</label>
                        <input
                            type="text"
                            value={form.batch_year}
                            onChange={e => setForm({ ...form, batch_year: e.target.value })}
                            className="w-full p-3 bg-gray-50 rounded-xl border-none font-semibold outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                            placeholder="2025"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                            <Key className="w-3.5 h-3.5 inline mr-1" />Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                                className="w-full p-3 bg-gray-50 rounded-xl border-none font-semibold font-mono outline-none focus:ring-2 focus:ring-indigo-200 transition-all pr-20"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, password: generatePassword() })}
                                    className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors text-xs font-bold text-indigo-500"
                                    title="Generate new password"
                                >
                                    ↻
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                                </button>
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">Auto-generated. You can edit or regenerate.</p>
                    </div>
                </form>

                {/* Footer */}
                <div className="p-6 pt-0 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-200"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                        {loading ? 'Creating...' : 'Create Account'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateUserModal;
