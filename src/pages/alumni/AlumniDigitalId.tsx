import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import {
  CreditCard, Download, ShieldCheck, QrCode, RefreshCw,
  CheckCircle, Sparkles, Copy, RotateCw,
  School, GraduationCap
} from 'lucide-react';

const AlumniDigitalId: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isFlipped, setIsFlipped] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Derived user details
  const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.email?.split('@')[0] || 'Alumni Member';
  const course = (user as any)?.course || 'Bachelor of Science in Information Technology';
  const batchYear = (user as any)?.batch_year || (user as any)?.year_graduated || '2024';
  const studentNumber = (user as any)?.student_id || (user as any)?.student_number || '2020-00123';
  const rawId = user?.id || 'ALUMNI';
  const alumniIdNumber = `BCP-ALM-${batchYear}-${rawId.slice(0, 5).toUpperCase()}`;

  // Verification Payload for QR
  const verificationPayload = JSON.stringify({
    system: 'Bestlink College Alumni Portal',
    alumni_id: alumniIdNumber,
    name: fullName,
    course: course,
    batch: batchYear,
    verified: true,
    issued_at: new Date().getFullYear(),
  });

  useEffect(() => {
    // Generate QR Code Data URL
    QRCode.toDataURL(verificationPayload, {
      width: 256,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then(url => setQrCodeDataUrl(url))
      .catch(err => console.error('Failed to generate QR code:', err));
  }, [verificationPayload]);

  const handleCopyId = () => {
    navigator.clipboard.writeText(alumniIdNumber);
    setCopied(true);
    showToast({ title: 'Copied!', message: 'Alumni ID number copied to clipboard.', type: 'success' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [85.6, 54], // Standard CR80 credit card size in mm
      });

      // Front Face
      // Background gradient simulation
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 85.6, 54, 'F');

      // Top Header Ribbon
      doc.setFillColor(30, 58, 138); // blue-900
      doc.rect(0, 0, 85.6, 12, 'F');

      // School Name
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text('BESTLINK COLLEGE OF THE PHILIPPINES', 42.8, 5.5, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(4.5);
      doc.setTextColor(191, 219, 254); // blue-200
      doc.text('OFFICIAL DIGITAL ALUMNI IDENTIFICATION CARD', 42.8, 9, { align: 'center' });

      // Photo frame placeholder / text
      doc.setFillColor(30, 41, 59); // slate-800
      doc.roundedRect(6, 16, 20, 24, 2, 2, 'F');
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(0.5);
      doc.roundedRect(6, 16, 20, 24, 2, 2, 'D');

      // Name & Details
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(fullName.toUpperCase(), 29, 20);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5);
      doc.setTextColor(96, 165, 250); // blue-400
      doc.text(`ID NO: ${alumniIdNumber}`, 29, 24);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5);
      doc.setTextColor(203, 213, 225); // slate-300
      doc.text(`Course: ${course}`, 29, 28);
      doc.text(`Batch Year: ${batchYear}   |   Student No: ${studentNumber}`, 29, 32);

      // Verified Pill
      doc.setFillColor(16, 185, 129); // emerald-500
      doc.roundedRect(29, 35, 24, 4, 1, 1, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(4);
      doc.text('VERIFIED ALUMNI', 41, 37.8, { align: 'center' });

      // QR Code
      if (qrCodeDataUrl) {
        doc.addImage(qrCodeDataUrl, 'PNG', 65, 16, 16, 16);
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(3.5);
        doc.text('SCAN TO VERIFY', 73, 34, { align: 'center' });
      }

      // Bottom Bar
      doc.setFillColor(14, 165, 233); // sky-500
      doc.rect(0, 52, 85.6, 2, 'F');

      // --- PAGE 2: Back Face ---
      doc.addPage([85.6, 54], 'landscape');
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(0, 0, 85.6, 54, 'F');

      // Magnetic stripe simulation
      doc.setFillColor(30, 41, 59);
      doc.rect(0, 5, 85.6, 8, 'F');

      // Disclaimer Terms
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(4);
      doc.text('TERMS & CONDITIONS:', 6, 18);
      doc.text('1. This card is non-transferable and remains property of Bestlink College of the Philippines.', 6, 22);
      doc.text('2. Grants holder alumni campus entry, library access privileges, and authorized alumni discounts.', 6, 25);
      doc.text('3. If found, please return to: BCP Alumni Affairs Office, Quirino Highway, Novaliches, QC.', 6, 28);
      doc.text('4. Valid for official alumni transactions and verification checks.', 6, 31);

      // Signature line
      doc.setDrawColor(148, 163, 184);
      doc.line(12, 44, 42, 44);
      doc.line(48, 44, 78, 44);

      doc.setFontSize(3.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Cardholder Signature', 27, 47, { align: 'center' });
      doc.text('VP for Academic & Alumni Affairs', 63, 47, { align: 'center' });

      doc.save(`BCP_Alumni_ID_${fullName.replace(/\s+/g, '_')}.pdf`);
      showToast({ title: 'Card Downloaded!', message: 'Printable Digital ID has been saved as PDF.', type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Download Failed', message: err.message || 'Unable to generate PDF.', type: 'error' });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <CreditCard className="w-3.5 h-3.5" /> Official Credentials
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Digital Alumni ID Card
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Your verified institutional pass for campus entry, library access, and official alumni privileges.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyId}
            className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2"
            title="Copy Alumni ID Number"
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-600" /> Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" /> Copy ID
              </>
            )}
          </button>
          <button
            onClick={() => setIsFlipped(!isFlipped)}
            className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2"
          >
            <RotateCw className="w-4 h-4 text-slate-500" /> Flip Card ({isFlipped ? 'Back' : 'Front'})
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {downloading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Generating PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Download Wallet PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3D Interactive Card Showcase Container */}
      <div className="flex flex-col items-center justify-center py-6">
        <div
          className="w-full max-w-[500px] h-[300px] [perspective:1000px] cursor-pointer group"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div
            className={`relative w-full h-full rounded-[2rem] transition-all duration-700 [transform-style:preserve-3d] shadow-2xl ${
              isFlipped ? '[transform:rotateY(180deg)]' : ''
            }`}
          >
            {/* ─── FRONT FACE ────────────────────────────────────── */}
            <div className="absolute inset-0 w-full h-full rounded-[2rem] [backface-visibility:hidden] overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-7 flex flex-col justify-between border border-white/20 shadow-2xl">
              {/* Hologram ambient light */}
              <div className="absolute -top-20 -right-20 w-56 h-56 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

              {/* Top Banner */}
              <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
                    <School className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xs font-black tracking-wider text-white">
                      BESTLINK COLLEGE OF THE PHILIPPINES
                    </h2>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-blue-300">
                      Official Alumni Identification
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" /> VERIFIED
                </span>
              </div>

              {/* Middle Section: Photo, Info, and QR */}
              <div className="relative z-10 flex items-center gap-5 my-auto">
                {/* Photo with frame */}
                <div className="relative flex-shrink-0">
                  <div className="w-24 h-28 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-lg">
                    <div className="w-full h-full rounded-[14px] bg-slate-800 overflow-hidden flex items-center justify-center">
                      {user?.avatar_url ? (
                        <img src={user.avatar_url} alt={fullName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl font-black text-blue-300">
                          {fullName.charAt(0)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-black text-white tracking-tight truncate leading-tight">
                    {fullName}
                  </h3>
                  <p className="text-xs font-black text-blue-400 mt-0.5 tracking-wider font-mono">
                    {alumniIdNumber}
                  </p>
                  <p className="text-[11px] text-slate-300 mt-1.5 font-medium line-clamp-1">
                    {course}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 font-semibold">
                    <span>Batch {batchYear}</span>
                    <span>•</span>
                    <span>SN: {studentNumber}</span>
                  </div>
                </div>

                {/* QR Code */}
                <div className="flex-shrink-0 bg-white p-2 rounded-xl shadow-md text-center">
                  {qrCodeDataUrl ? (
                    <img src={qrCodeDataUrl} alt="Alumni QR Code" className="w-16 h-16 object-contain" />
                  ) : (
                    <QrCode className="w-16 h-16 text-slate-800" />
                  )}
                  <p className="text-[7px] font-black text-slate-700 uppercase tracking-tight mt-0.5">
                    Scan to Verify
                  </p>
                </div>
              </div>

              {/* Bottom Card Footer */}
              <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-2 text-[9px] text-slate-400 font-medium">
                <span>Alumni Relations Office</span>
                <span className="text-blue-300 font-bold flex items-center gap-1">
                  Click to view back <RotateCw className="w-3 h-3" />
                </span>
              </div>
            </div>

            {/* ─── BACK FACE ─────────────────────────────────────── */}
            <div className="absolute inset-0 w-full h-full rounded-[2rem] [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-hidden bg-white text-slate-800 p-6 flex flex-col justify-between border border-slate-200 shadow-2xl">
              {/* Magnetic Strip Header */}
              <div className="-mx-6 -mt-6 bg-slate-900 h-10 mb-3" />

              {/* Card Guidelines */}
              <div className="space-y-2 text-[10px] text-slate-600 leading-relaxed font-medium">
                <p className="font-bold text-slate-800 text-[11px]">TERMS AND CONDITIONS OF ISSUANCE:</p>
                <p>• This identification card is issued to duly verified graduates of Bestlink College of the Philippines.</p>
                <p>• Grants access to alumni homecoming events, university library facilities, and campus visiting privileges.</p>
                <p>• If lost or found, please return to the Alumni Affairs Office, Main Campus, Quirino Highway, Novaliches, Quezon City.</p>
              </div>

              {/* Signatures Row */}
              <div className="grid grid-cols-2 gap-6 pt-3 border-t border-slate-100 text-center">
                <div>
                  <div className="h-6 border-b border-slate-300 mx-auto w-3/4" />
                  <p className="text-[9px] font-bold text-slate-700 mt-1">Alumni Signature</p>
                </div>
                <div>
                  <div className="h-6 border-b border-slate-300 mx-auto w-3/4" />
                  <p className="text-[9px] font-bold text-slate-700 mt-1">Registrar / Alumni Director</p>
                </div>
              </div>

              <div className="text-[8px] text-slate-400 text-center pt-1 border-t border-slate-100 flex items-center justify-between">
                <span>Validation Hash: {rawId.slice(0, 16)}</span>
                <span>Bestlink Alumni System 2026</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-4 font-medium flex items-center gap-1.5">
          <RotateCw className="w-3.5 h-3.5" /> Tap or click the card to flip between front and back
        </p>
      </div>

      {/* Info & Privileges Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
            <School className="w-5 h-5" />
          </div>
          <h4 className="text-base font-black text-slate-800">Campus Pass</h4>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            Present this digital card or scan the dynamic QR code at campus security gates for visitor entry without leaving physical IDs.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-3">
            <GraduationCap className="w-5 h-5" />
          </div>
          <h4 className="text-base font-black text-slate-800">Library & Research Access</h4>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            Alumni are entitled to lifetime reading privileges and academic journal access at the Main Campus Learning Resource Center.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
            <Sparkles className="w-5 h-5" />
          </div>
          <h4 className="text-base font-black text-slate-800">Alumni Privileges</h4>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            Enjoy discounted rates on graduate studies, short courses, continuing professional development (CPD), and partner merchant perks.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AlumniDigitalId;
