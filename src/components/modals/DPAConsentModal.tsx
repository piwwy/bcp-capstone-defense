import React, { useState } from 'react';
import { Shield, CheckCircle, ScrollText, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { logAudit, AUDIT_ACTIONS } from '../../services/auditLogger';

interface DPAConsentModalProps {
    onAccept: () => void;
}

const DPAConsentModal: React.FC<DPAConsentModalProps> = ({ onAccept }) => {
    const { user } = useAuth();
    const [agreed, setAgreed] = useState(false);
    const [saving, setSaving] = useState(false);

    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'staff';

    const handleAccept = async () => {
        if (!agreed || !user) return;
        setSaving(true);
        try {
            await supabase
                .from('profiles')
                .update({ dpa_consented_at: new Date().toISOString() })
                .eq('id', user.id);
            await logAudit(AUDIT_ACTIONS.DPA_CONSENT_ACCEPTED, {
                module: 'DPA',
                message: `User (${user.role}) accepted DPA 2012 consent`,
            });
            onAccept();
        } catch (err) {
            console.error('DPA consent save error:', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4 overflow-y-auto">
            <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full my-auto flex flex-col overflow-hidden animate-in fade-in zoom-in duration-500">
                {/* Header */}
                <div className={`px-8 py-6 flex items-center gap-4 ${isAdmin ? 'bg-slate-800' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`}>
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white tracking-tight">Data Privacy Consent</h2>
                        <p className={`${isAdmin ? 'text-slate-400' : 'text-blue-100'} text-[10px] font-bold uppercase tracking-widest`}>Republic Act No. 10173 — DPA 2012</p>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 px-8 py-6 space-y-5 text-sm text-slate-600 leading-relaxed max-h-[60vh] overflow-y-auto">
                    <div className={`flex items-start gap-3 p-4 rounded-2xl border ${isAdmin ? 'bg-slate-50 border-slate-200' : 'bg-blue-50 border-blue-100'}`}>
                        <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isAdmin ? 'text-slate-400' : 'text-blue-500'}`} />
                        <p className={`text-xs font-bold ${isAdmin ? 'text-slate-600' : 'text-blue-700'}`}>
                            {isAdmin
                                ? "Kailangan ang iyong pahintulot bilang Administrator/Staff upang ma-access ang system features at alumni data."
                                : "Para sa iyong seguridad at maayos na serbisyo, kailangan naming makuha ang iyong pahintulot sa paggamit ng iyong data."
                            }
                        </p>
                    </div>

                    <div className="space-y-4">
                        <p className="font-medium text-slate-800">
                            {isAdmin
                                ? "Sa pag-log in, ikaw ay sumasang-ayon na ang iyong system activities at access sa alumni records ay mapapailalim sa sumusunod:"
                                : "By using this system, you consent to the storage and processing of your data by Bestlink College of the Philippines for:"
                            }
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            {[
                                { alumni: "Alumni records & verification", admin: "System Monitoring & Auditing" },
                                { alumni: "Job & career recommendations", admin: "Alumni Data Management" },
                                { alumni: "Event & news notifications", admin: "Report Generation (CHED/School)" },
                                { alumni: "Donation & giving programs", admin: "Staff Action Tracking" }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                    <span className="font-bold text-slate-700 uppercase tracking-tighter">{isAdmin ? item.admin : item.alumni}</span>
                                </div>
                            ))}
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
                            <h4 className="font-black text-slate-900 flex items-center gap-2 text-xs uppercase tracking-widest">
                                <ScrollText className="w-4 h-4 text-blue-500" /> Karapatan sa Ilalim ng RA 10173
                            </h4>
                            <ul className="grid grid-cols-1 gap-1 text-[11px] font-bold text-slate-500">
                                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-blue-400 rounded-full" /> Right to be Informed & Access</li>
                                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-blue-400 rounded-full" /> Right to Rectification (Pagbabago)</li>
                                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-blue-400 rounded-full" /> Right to Erasure & Object</li>
                                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-blue-400 rounded-full" /> Right to Data Portability</li>
                            </ul>
                        </div>

                        <p className="text-[10px] text-slate-400 leading-tight italic">
                            Your data is encrypted and handled with strict confidentiality.
                            For concerns, email <strong>dpo@bcp.edu.ph</strong>.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 px-8 py-6 border-t border-slate-100">
                    <label className="flex items-start gap-4 cursor-pointer group mb-6">
                        <div className="relative flex items-center">
                            <input
                                type="checkbox"
                                checked={agreed}
                                onChange={(e) => setAgreed(e.target.checked)}
                                className="w-6 h-6 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shadow-sm"
                            />
                        </div>
                        <span className="text-xs font-bold text-slate-600 leading-normal group-hover:text-slate-900 transition-colors">
                            {isAdmin
                                ? "I understand and accept my responsibilities as a system handler under the Data Privacy Act. I will handle all data with utmost integrity."
                                : "Nababasa ko at naintindihan ang Data Privacy Act of 2012. Pinapahintulutan ko ang BCP na i-process ang aking data para sa mga nabanggit na layunin."
                            }
                        </span>
                    </label>

                    <button
                        onClick={handleAccept}
                        disabled={!agreed || saving}
                        className={`w-full flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-xl ${agreed
                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                            }`}
                    >
                        {saving ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <CheckCircle className="w-4 h-4" />
                        )}
                        {saving ? 'Processing...' : 'I Accept — Enter Dashboard'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DPAConsentModal;
