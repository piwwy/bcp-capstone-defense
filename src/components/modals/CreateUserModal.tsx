import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { useToast } from '../../context/ToastContext';
import { logAudit, AUDIT_ACTIONS } from '../../services/auditLogger';
import {
    X, Loader2, UserPlus, Eye, EyeOff, Copy, CheckCircle,
    GraduationCap, Mail, Key, Shield, RefreshCw, User, Hash, Calendar
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
    const [currentUserRole, setCurrentUserRole] = useState<string>('admin');

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

    // Fetch current user's role for permission-based role selection
    useEffect(() => {
        const fetchRole = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
                    if (data?.role) setCurrentUserRole(data.role);
                }
            } catch { /* fallback to admin */ }
        };
        fetchRole();
    }, []);

    // Role-based permissions: Admin can only create Alumni; SuperAdmin can create all
    const allowedRoles: ('alumni' | 'staff' | 'admin')[] =
        currentUserRole === 'superadmin' ? ['alumni', 'staff', 'admin'] : ['alumni'];

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleNameChange = (field: 'first_name' | 'last_name', value: string) => {
        if (/^[a-zA-Z\s.-]*$/.test(value)) {
            setForm({ ...form, [field]: value });
        }
    };

    const handleBatchYearChange = (value: string) => {
        if (/^\d*$/.test(value)) {
            setForm({ ...form, batch_year: value });
        }
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!form.first_name || !form.last_name || !form.email) {
            showToast({ type: 'warning', title: 'Missing Fields', message: 'Please fill in all required fields.' });
            return;
        }

        if (form.batch_year && form.batch_year.length !== 4) {
            showToast({ type: 'warning', title: 'Invalid Batch Year', message: 'Batch year must be a 4-digit number.' });
            return;
        }

        setLoading(true);

        try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            const tempClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });

            const { data: authData, error: signUpError } = await tempClient.auth.signUp({
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
            if (!authData.user) throw new Error('User creation failed — no user returned. Check network or email settings.');

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
                showToast({ type: 'warning', title: 'Profile Warning', message: 'User created but profile details may not be fully saved.' });
            }

            try {
                await logAudit(AUDIT_ACTIONS.USER_CREATED, {
                    module: 'User Management',
                    message: `Created ${form.role} account for ${form.first_name} ${form.last_name} (${form.email})`,
                });
            } catch (err) {
                console.error('Audit log error:', err);
            }

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

    // SUCCESS VIEW — show credentials (professional card)
    if (created) {
        return (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in overflow-y-auto">
                <div className="bg-white p-10 rounded-[3rem] w-full max-w-lg shadow-2xl my-auto">
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h3 className="text-3xl font-black tracking-tighter text-slate-900">Account Created!</h3>
                        <p className="text-sm text-slate-400 mt-1">Share these credentials with the user</p>
                    </div>

                    <div className="space-y-4">
                        {/* Name Card */}
                        <div className="bg-slate-50 rounded-2xl p-5">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Full Name</p>
                            <p className="text-xl font-black text-slate-900">{form.first_name} {form.last_name}</p>
                            <p className="text-xs text-slate-500 mt-1 font-bold">
                                {form.role.toUpperCase()} · {form.course} · Batch {form.batch_year}
                            </p>
                        </div>

                        {/* Email */}
                        <div className="flex items-center justify-between bg-blue-50 rounded-2xl p-5 group">
                            <div>
                                <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-0.5">Email</p>
                                <p className="text-sm font-black text-blue-900">{form.email}</p>
                            </div>
                            <button onClick={() => handleCopy(form.email, 'email')} className="p-3 rounded-xl hover:bg-blue-100 transition-colors">
                                {copiedField === 'email' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-blue-400" />}
                            </button>
                        </div>

                        {/* Password */}
                        <div className="flex items-center justify-between bg-purple-50 rounded-2xl p-5 group">
                            <div>
                                <p className="text-[10px] font-black uppercase text-purple-400 tracking-widest mb-0.5">Password</p>
                                <p className="text-sm font-black text-purple-900 font-mono">{form.password}</p>
                            </div>
                            <button onClick={() => handleCopy(form.password, 'password')} className="p-3 rounded-xl hover:bg-purple-100 transition-colors">
                                {copiedField === 'password' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-purple-400" />}
                            </button>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => handleCopy(`Email: ${form.email}\nPassword: ${form.password}`, 'all')}
                                className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                            >
                                {copiedField === 'all' ? <><CheckCircle className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy All</>}
                            </button>
                            <button
                                onClick={() => { onSuccess(); onClose(); }}
                                className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // FORM VIEW — Professional Event Scheduler style
    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in overflow-y-auto">
            <div className="bg-white p-10 rounded-[3rem] w-full max-w-2xl shadow-2xl relative my-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-3xl font-black tracking-tighter text-slate-900">Create Account</h3>
                        <p className="text-sm text-slate-400 mt-1">Fill in the details to create a new user account.</p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-slate-100 rounded-full hover:rotate-90 transition-transform"><X className="w-5 h-5" /></button>
                </div>

                <div className="space-y-6">
                    {/* Role Selection */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-2 flex items-center gap-1">
                            <Shield className="w-3.5 h-3.5" /> Account Role <span className="text-rose-400">*</span>
                        </label>
                        <div className={`grid gap-3 ${allowedRoles.length === 1 ? 'grid-cols-1' : 'grid-cols-3'}`}>
                            {allowedRoles.map(role => (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => setForm({ ...form, role })}
                                    className={`py-4 rounded-2xl text-sm font-black transition-all ${form.role === role
                                        ? role === 'admin' ? 'bg-red-500 text-white shadow-lg shadow-red-200'
                                            : role === 'staff' ? 'bg-teal-500 text-white shadow-lg shadow-teal-200'
                                                : 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                    }`}
                                >
                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                </button>
                            ))}
                        </div>
                        {allowedRoles.length === 1 && (
                            <p className="text-[10px] text-slate-400 font-bold ml-2">Only SuperAdmin can create Staff and Admin accounts.</p>
                        )}
                    </div>

                    {/* Name Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 flex items-center gap-1">
                                <User className="w-3.5 h-3.5" /> First Name <span className="text-rose-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.first_name}
                                onChange={e => handleNameChange('first_name', e.target.value)}
                                className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                placeholder="Ex. Juan"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 flex items-center gap-1">
                                <User className="w-3.5 h-3.5" /> Last Name <span className="text-rose-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.last_name}
                                onChange={e => handleNameChange('last_name', e.target.value)}
                                className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                placeholder="Ex. Dela Cruz"
                                required
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-2 flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5" /> Email Address <span className="text-rose-400">*</span>
                        </label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                            className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                            placeholder="Ex. user@linker.edu.ph"
                            required
                        />
                    </div>

                    {/* Student ID + Course */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 flex items-center gap-1">
                                <Hash className="w-3.5 h-3.5" /> Student ID
                            </label>
                            <input
                                type="text"
                                value={form.student_id}
                                onChange={e => setForm({ ...form, student_id: e.target.value })}
                                className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                placeholder="Ex. 2024-00001"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 flex items-center gap-1">
                                <GraduationCap className="w-3.5 h-3.5" /> Course
                            </label>
                            <select
                                value={form.course}
                                onChange={e => setForm({ ...form, course: e.target.value })}
                                className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-blue-600 focus:ring-2 focus:ring-blue-200 outline-none transition-all cursor-pointer"
                            >
                                {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Batch Year */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-2 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> Batch Year
                        </label>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={form.batch_year}
                            onChange={e => handleBatchYearChange(e.target.value)}
                            maxLength={4}
                            className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                            placeholder="Ex. 2025"
                        />
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-2 flex items-center gap-1">
                            <Key className="w-3.5 h-3.5" /> Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                                className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold font-mono focus:ring-2 focus:ring-blue-200 outline-none transition-all pr-24"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, password: generatePassword() })}
                                    className="p-2 rounded-xl hover:bg-slate-200 transition-colors"
                                    title="Generate new password"
                                >
                                    <RefreshCw className="w-4 h-4 text-blue-500" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="p-2 rounded-xl hover:bg-slate-200 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                                </button>
                            </div>
                        </div>
                        <p className="text-[10px] text-blue-400 font-bold ml-4">Auto-generated. You can edit or regenerate.</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-100 hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><UserPlus className="w-5 h-5" /> Create Account</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateUserModal;
