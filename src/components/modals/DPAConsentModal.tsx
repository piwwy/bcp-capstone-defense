import React, { useState } from 'react';
import { Shield, CheckCircle, ScrollText, AlertTriangle } from 'lucide-react';
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
                message: 'User accepted DPA 2012 consent',
            });
            onAccept();
        } catch (err) {
            console.error('DPA consent save error:', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-5 flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Data Privacy Consent</h2>
                        <p className="text-blue-100 text-xs">Republic Act No. 10173 — Data Privacy Act of 2012</p>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-sm text-gray-700 leading-relaxed">
                    <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-amber-700 text-xs font-medium">
                            Please read the following agreement carefully before proceeding. You must give your consent to continue using the system.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <p>
                            By using this system, you consent to the collection, generation, use, processing, storage, and retention of your personal data by <strong>Bestlink College of the Philippines</strong> for the purpose of:
                        </p>

                        <ul className="list-disc list-inside space-y-2 pl-2 text-gray-600">
                            <li>Alumni records management and graduate verification</li>
                            <li>Career path tracking and employment status monitoring</li>
                            <li>Communication of relevant opportunities, events, and news</li>
                            <li>Automated job posting recommendations based on your course and profile</li>
                            <li>Statistical analysis and tracer study reports for CHED compliance</li>
                            <li>Donation and scholarship program administration</li>
                            <li>Batch reunion and community engagement coordination</li>
                        </ul>

                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                            <h4 className="font-bold text-blue-900 flex items-center gap-2">
                                <ScrollText className="w-4 h-4" /> Your Rights Under RA 10173
                            </h4>
                            <ul className="list-disc list-inside space-y-1 text-blue-700 text-xs">
                                <li><strong>Right to be Informed</strong> — You are informed of the nature, purpose, and extent of data processing.</li>
                                <li><strong>Right to Access</strong> — You may request access to your personal data at any time.</li>
                                <li><strong>Right to Rectification</strong> — You may correct inaccurate or incomplete data.</li>
                                <li><strong>Right to Erasure</strong> — You may request the deletion of your personal data.</li>
                                <li><strong>Right to Object</strong> — You may object to data processing activities.</li>
                                <li><strong>Right to Data Portability</strong> — You may obtain your data in a structured, commonly used format.</li>
                                <li><strong>Right to File a Complaint</strong> — You may file a complaint with the National Privacy Commission.</li>
                            </ul>
                        </div>

                        <p className="text-gray-500 text-xs">
                            Your personal data will be stored securely using industry-standard encryption and access controls.
                            Data will be retained as long as necessary for the purposes stated above, or as required by law.
                            For concerns, contact the Data Protection Officer at <strong>dpo@bcp.edu.ph</strong>.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 px-6 py-4 bg-gray-50">
                    <label className="flex items-start gap-3 cursor-pointer group mb-4">
                        <input
                            type="checkbox"
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                            className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                            I have read and understood the Data Privacy Act of 2012. I hereby give my consent to the collection, processing, and storage of my personal data as described above.
                        </span>
                    </label>

                    <button
                        onClick={handleAccept}
                        disabled={!agreed || saving}
                        className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${agreed
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-blue-500/25'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        {saving ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <CheckCircle className="w-4 h-4" />
                        )}
                        {saving ? 'Saving...' : 'I Accept — Continue to Dashboard'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DPAConsentModal;
