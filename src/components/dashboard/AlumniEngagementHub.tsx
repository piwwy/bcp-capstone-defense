import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Rocket, ChevronRight, Check } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import DocumentRequestModal from '../modals/DocumentRequestModal';
import AlumniMentorshipModal from '../modals/AlumniMentorshipModal';

const AlumniEngagementHub: React.FC = () => {
  const { showToast } = useToast();
  const [showDocModal, setShowDocModal] = useState(false);
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/register?ref=batch_share`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    showToast({
      title: 'Invite Link Copied!',
      message: 'Batch invitation link copied to clipboard. Share it with your classmates and batchmates!',
      type: 'success',
    });
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <>
      <section className="dashboard-card rounded-3xl p-6 border border-slate-200/80 dark:border-white/10 shadow-sm transition-colors space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Rocket className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Alumni Engagement Hub
          </h3>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* 1. Request Digital Documents */}
          <div className="relative overflow-hidden rounded-2xl aspect-[4/3] group shadow-md border border-white/20 hover:shadow-xl hover:-translate-y-0.5 transition-all flex flex-col justify-end p-6">
            <div
              className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
              style={{
                backgroundImage: `url(https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80)`,
                backgroundRepeat: 'no-repeat',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/30 to-transparent z-10" />
            <div className="relative z-20 text-left w-full">
              <h4 className="text-base font-black text-white leading-tight mb-4 tracking-wide">
                Document Request Center
              </h4>
              <button
                type="button"
                onClick={() => setShowDocModal(true)}
                className="text-xs font-black text-white bg-blue-600/85 hover:bg-blue-600 backdrop-blur-sm px-4 py-2 rounded-xl inline-flex items-center gap-1 transition-all shadow-md active:scale-95"
              >
                Request Documents <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 2. Batch Invitation Tool */}
          <div className="relative overflow-hidden rounded-2xl aspect-[4/3] group shadow-md border border-white/20 hover:shadow-xl hover:-translate-y-0.5 transition-all flex flex-col justify-end p-6">
            <div
              className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
              style={{
                backgroundImage: `url(https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80)`,
                backgroundRepeat: 'no-repeat',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/30 to-transparent z-10" />
            <div className="relative z-20 text-left w-full">
              <h4 className="text-base font-black text-white leading-tight mb-4 tracking-wide">
                Batch Invitation Tool
              </h4>
              <button
                type="button"
                onClick={handleCopyInviteLink}
                className={`text-xs font-black text-white backdrop-blur-sm px-4 py-2 rounded-xl inline-flex items-center gap-1 transition-all shadow-md active:scale-95 ${
                  copiedLink ? 'bg-emerald-500 text-white' : 'bg-emerald-600/85 hover:bg-emerald-600'
                }`}
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Link Copied!
                  </>
                ) : (
                  <>
                    Copy Invite Link <ChevronRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 3. Career Matching Engine */}
          <div className="relative overflow-hidden rounded-2xl aspect-[4/3] group shadow-md border border-white/20 hover:shadow-xl hover:-translate-y-0.5 transition-all flex flex-col justify-end p-6">
            <div
              className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
              style={{
                backgroundImage: `url(https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80)`,
                backgroundRepeat: 'no-repeat',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/30 to-transparent z-10" />
            <div className="relative z-20 text-left w-full">
              <h4 className="text-base font-black text-white leading-tight mb-4 tracking-wide">
                Alumni Job Placement
              </h4>
              <Link
                to="/alumni/jobs"
                className="text-xs font-black text-white bg-purple-600/85 hover:bg-purple-600 backdrop-blur-sm px-4 py-2 rounded-xl inline-flex items-center gap-1 transition-all shadow-md active:scale-95"
              >
                Explore Jobs <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* 4. Mentorship Network */}
          <div className="relative overflow-hidden rounded-2xl aspect-[4/3] group shadow-md border border-white/20 hover:shadow-xl hover:-translate-y-0.5 transition-all flex flex-col justify-end p-6">
            <div
              className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
              style={{
                backgroundImage: `url(https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=600&q=80)`,
                backgroundRepeat: 'no-repeat',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/30 to-transparent z-10" />
            <div className="relative z-20 text-left w-full">
              <h4 className="text-base font-black text-white leading-tight mb-4 tracking-wide">
                Alumni Mentorship
              </h4>
              <button
                type="button"
                onClick={() => setShowMentorModal(true)}
                className="text-xs font-black text-white bg-amber-600/85 hover:bg-amber-600 backdrop-blur-sm px-4 py-2 rounded-xl inline-flex items-center gap-1 transition-all shadow-md active:scale-95"
              >
                Find Mentors <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Modals */}
      <DocumentRequestModal isOpen={showDocModal} onClose={() => setShowDocModal(false)} />
      <AlumniMentorshipModal isOpen={showMentorModal} onClose={() => setShowMentorModal(false)} />
    </>
  );
};

export default AlumniEngagementHub;
