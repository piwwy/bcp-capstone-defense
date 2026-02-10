import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
// Dagdag natin ang 'Image' as ImageIcon dito para hindi mag-error
import { Plus, TrendingUp, X, Loader2, Image as ImageIcon, ExternalLink, CheckCircle, UploadCloud, Eye, EyeOff } from 'lucide-react';
import AdminPageLayout from './AdminPageLayout';
import AdminResourceCard from './AdminResourceCard';
import { useToast } from '../../context/ToastContext';

const DonationManager = () => {
  const { showToast } = useToast();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [donations, setDonations] = useState<any[]>([]);
  const quickAmounts = [10000, 50000, 100000]; // NEW: Quick select options


  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verifyTarget, setVerifyTarget] = useState<{ id: string, campId: string, amt: number } | null>(null);


  // 1. Magdagdag ng state para sa view mode
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
  const [showAmounts, setShowAmounts] = useState(false);
  const maskAmount = (amount: number) => showAmounts ? `₱${amount.toLocaleString()}` : '₱ •••••••';

  // 2. I-implement ang Restore function para mabalik ang archived campaign
  const handleRestore = async (id: string) => {
    const { error } = await supabase
      .from('donation_campaigns')
      .update({ status: 'active' })
      .eq('id', id);

    if (!error) {
      fetchData();
      showToast({ title: 'Restored', message: 'Campaign is now active again.', type: 'success' });
    }
  };


  // 1. Rename states para mas malinaw ang purpose
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<string | null>(null);

  // 2. Palitan ang handleDelete ng handleArchive
  const handleArchive = async (id: string) => {
    const { error } = await supabase
      .from('donation_campaigns')
      .update({ status: 'archived' }) // Binabago lang ang status, hindi binubura
      .eq('id', id);

    if (!error) {
      fetchData();
      showToast({ title: 'Archived', message: 'Campaign moved to archives.', type: 'info' });
    } else {
      showToast({ title: 'Archive Failed', message: error.message, type: 'error' });
    }
  };

  // NEW: State para sa Image Preview Modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [activeDonationId, setActiveDonationId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    target_amount: '',
    category: 'Scholarship',
    description: '',
    image_url: '' // <--- IDAGDAG MO ITONG LINE NA ITO PARA MAWALA ANG RED LINE
  });

  // NEW: State para sa in-upload na file ng campaign cover
  const [campaignFile, setCampaignFile] = useState<File | null>(null);
  // NEW: Local preview URL bago i-upload
  const [filePreview, setFilePreview] = useState<string | null>(null);

  // Clean up preview URL when component unmounts or file changes
  useEffect(() => {
    if (campaignFile) {
      const objectUrl = URL.createObjectURL(campaignFile);
      setFilePreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setFilePreview(null);
    }
  }, [campaignFile]);

  useEffect(() => {
    fetchData();
  }, []);



  const fetchData = async () => {
    const { data: campData } = await supabase.from('donation_campaigns').select('*').order('created_at', { ascending: false });
    const { data: donData } = await supabase.from('donations').select('*, profiles(first_name, last_name)').order('created_at', { ascending: false });
    if (campData) setCampaigns(campData);
    if (donData) setDonations(donData);
  };

  const openCreateModal = () => {
    setFormData({
      title: '',
      target_amount: '',
      category: 'Scholarship',
      description: '',
      image_url: '' // Ginamit ang existing setFormData, hindi nag-declare ng bago
    });
    setCampaignFile(null);
    setIsEditing(false);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (campaign: any) => {
    setFormData({
      title: campaign.title,
      target_amount: campaign.target_amount,
      category: campaign.category,
      description: campaign.description || '',
      image_url: campaign.image_url || ''
    });
    setCampaignFile(null);
    setIsEditing(true);
    setEditingId(campaign.id);
    setIsModalOpen(true);
  };



  // NEW: Handler para sa pagpili ng file
  const handleCampaignFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit example
        showToast({ title: 'File too large', message: 'Please select an image under 5MB.', type: 'warning' });
        return;
      }
      setCampaignFile(file);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      showToast({ title: 'Required', message: 'Please provide a reason for rejection.', type: 'warning' });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // 1. Update Donation Status and Reason
      await supabase.from('donations').update({
        status: 'rejected',
        rejection_reason: rejectionReason
      }).eq('id', activeDonationId);

      // 2. Insert into Audit Trail
      await supabase.from('audit_logs').insert([{
        admin_id: user?.id,
        action: 'REJECTED_DONATION',
        module: 'Donations',
        details: `Reason: ${rejectionReason} | ID: ${activeDonationId}`
      }]);

      showToast({ title: 'Rejected', message: 'Donor will see the reason in their records.', type: 'info' });
      setIsRejectModalOpen(false);
      setRejectionReason('');
      fetchData();
    } catch (err) {
      showToast({ title: 'Error', message: 'Failed to record rejection.', type: 'error' });
    }
  };

  // --- CORRECTED SUBMIT LOGIC ---
  const handleSubmit = async () => {
    if (!formData.title || !formData.target_amount) {
      showToast({ title: 'Validation Error', message: 'Please fill in required fields.', type: 'warning' });
      return;
    }

    setLoading(true);
    const amount = parseFloat(formData.target_amount.toString());
    let finalImageUrl = formData.image_url;

    try {
      // 1. Upload Cover Image if a new file is selected
      if (campaignFile) {
        const fileExt = campaignFile.name.split('.').pop();
        const fileName = `campaign_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `covers/${fileName}`;

        const { error: uploadError } = await supabase.storage.from('campaigns').upload(filePath, campaignFile);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('campaigns').getPublicUrl(filePath);
        finalImageUrl = publicUrl;
      }

      const campaignData = {
        title: formData.title,
        target_amount: amount,
        category: formData.category,
        description: formData.description,
        image_url: finalImageUrl
      };

      // 2. Insert or Update Database
      if (isEditing && editingId) {
        const { error: updateError } = await supabase.from('donation_campaigns').update(campaignData).eq('id', editingId);
        if (updateError) throw updateError;
      } else {
        const { error: createError } = await supabase.from('donation_campaigns').insert([{ ...campaignData, current_amount: 0, status: 'active' }]);
        if (createError) throw createError;
      }

      // 3. Success Cleanup
      setIsModalOpen(false);
      setCampaignFile(null);
      fetchData();
      showToast({
        title: isEditing ? 'Updated' : 'Launched',
        message: isEditing ? 'Campaign details updated.' : 'New campaign is now live.',
        type: 'success'
      });

    } catch (err: any) {
      showToast({ title: 'Error', message: err.message || 'Operation failed.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // --- OTHER UTILITY FUNCTIONS ---
  const verifyDonation = async (donationId: string, campaignId: string, amount: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Step 1: Update status and audit trail
      const { error: updateErr } = await supabase.from('donations').update({
        status: 'verified',
        verified_by: user?.id,
        verified_at: new Date().toISOString()
      }).eq('id', donationId);

      if (updateErr) throw updateErr;

      // Step 2: Update Campaign Progress
      const { data: campaign } = await supabase.from('donation_campaigns').select('current_amount').eq('id', campaignId).single();
      const newTotal = (campaign?.current_amount || 0) + amount;
      await supabase.from('donation_campaigns').update({ current_amount: newTotal }).eq('id', campaignId);

      fetchData();
      showToast({ title: 'Verified', message: 'Funds successfully added to campaign.', type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Error', message: err.message || 'Verification failed.', type: 'error' });
    }
  };

  const rejectDonation = (donationId: string) => {
    setActiveDonationId(donationId);
    setIsRejectModalOpen(true);
  };

  return (
    <AdminPageLayout title="Donation & Campaigns" subtitle="Verify transactions and track fundraising impact" icon={TrendingUp}>

      {/* 1. Statistics Row */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex gap-3 w-full md:w-auto items-center">
          <div className="bg-white px-5 py-4 rounded-2xl border border-gray-100 shadow-sm flex-1 md:flex-none">
            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Active</p>
            <p className="text-2xl font-black text-gray-800">{campaigns.filter(c => c.status === 'active').length}</p>
          </div>
          <div className="bg-white px-5 py-4 rounded-2xl border border-gray-100 shadow-sm flex-1 md:flex-none">
            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Total Raised</p>
            <p className="text-2xl font-black text-blue-600">{maskAmount(campaigns.reduce((acc, curr) => acc + (curr.current_amount || 0), 0))}</p>
          </div>
          <button
            onClick={() => setShowAmounts(!showAmounts)}
            className="p-3 bg-white border border-gray-200 rounded-2xl text-gray-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm"
            title={showAmounts ? 'Hide amounts' : 'Show amounts'}
          >
            {showAmounts ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 text-white px-6 py-3.5 rounded-2xl flex items-center gap-2 text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all hover:-translate-y-0.5 w-full md:w-auto justify-center"
        >
          <Plus className="w-4 h-4" /> New Campaign
        </button>
      </div>

      {/* 2. Pending Verifications Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-12">
        <div className="p-6 border-b border-gray-50 flex items-center gap-2">
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
          <h3 className="font-bold text-gray-800">Pending Proof of Payments</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 text-gray-400 font-bold uppercase text-[10px] tracking-widest">
              <tr>
                <th className="p-5">Donor Name</th>
                <th className="p-5">Amount</th>
                <th className="p-5">Method & Proof</th>
                <th className="p-5">Status</th>
                <th className="p-5 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {donations.filter(d => d.status === 'pending').map(don => (
                <tr key={don.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs uppercase">
                        {don.guest_name ? don.guest_name.charAt(0) : 'A'}
                      </div>
                      <span className="font-bold text-gray-700">{don.guest_name || 'Alumni Member'}</span>
                    </div>
                  </td>
                  <td className="p-5 text-emerald-600 font-black">{maskAmount(don.amount)}</td>
                  <td className="p-5">
                    <span className="text-gray-600 block text-xs font-medium mb-1">{don.payment_method}</span>
                    {don.proof_image_url ? (
                      <button
                        onClick={() => setPreviewImage(don.proof_image_url)}
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 group/link"
                      >
                        <ImageIcon className="w-3 h-3" /> View Proof <ExternalLink className="w-2 h-2 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                      </button>
                    ) : (
                      <span className="text-[10px] text-gray-400 italic">No attachment</span>
                    )}
                  </td>
                  <td className="p-5">
                    <span className="px-2.5 py-1 bg-yellow-50 text-yellow-600 rounded-lg text-[10px] font-black uppercase tracking-tighter border border-yellow-100">
                      Pending Review
                    </span>
                  </td>

                  <td className="p-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => rejectDonation(don.id)} // <--- Tinatawag na ang function kaya mawawala ang yellow line
                        className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-rose-100 transition-all border border-rose-100"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => {
                          // GAMITIN ANG VERIFY TARGET STATE
                          setVerifyTarget({ id: don.id, campId: don.campaign_id, amt: don.amount });
                          setIsVerifyModalOpen(true);
                        }}
                        className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-600 shadow-md shadow-emerald-100 transition-all hover:scale-105"
                      >
                        Verify Funds
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex items-center justify-between mb-6 px-2">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          {viewMode === 'active' ? 'Active Campaigns' : 'Archived Campaigns'}
        </h3>

        {/* TABS PARA SA SWITCHING */}
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('active')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'active' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Active
          </button>
          <button
            onClick={() => setViewMode('archived')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'archived' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Archived
          </button>
        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns
          .filter(camp => camp.status === viewMode) // <--- PALITAN ANG 'active' NG viewMode
          .map(camp => {
            const progress = Math.min((camp.current_amount / camp.target_amount) * 100, 100);
            return (
              <AdminResourceCard
                key={camp.id}
                title={camp.title}
                image={camp.image_url}
                subtitle={`Target: ${showAmounts ? `₱${Number(camp.target_amount).toLocaleString()}` : '₱ •••••••'}`}
                status={camp.status}
                category={camp.category}
                onEdit={() => openEditModal(camp)}
                onDelete={() => {
                  if (viewMode === 'active') {
                    setArchiveTarget(camp.id);
                    setIsArchiveModalOpen(true);
                  } else {
                    handleRestore(camp.id); // Agarang restore kapag nasa Archived view
                  }
                }}
              >
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-gray-500">Collected: <span className="text-gray-800 font-bold">{maskAmount(camp.current_amount)}</span></span>
                    <span className="text-blue-600 font-black">{progress.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-1000 ease-out"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              </AdminResourceCard>
            );
          })}
      </div>

      {/* --- MODAL: IMAGE PROOF PREVIEW (The "Wow" Factor) --- */}
      {previewImage && (
        <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
          <div className="relative max-w-5xl w-full flex flex-col max-h-[95vh]">
            {/* Header */}
            <div className="p-4 bg-white rounded-t-3xl border-b border-gray-100 flex justify-between items-center">
              <h4 className="font-bold text-gray-800 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-blue-600" /> Proof of Payment Review
              </h4>
              <button onClick={() => setPreviewImage(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Image Container: Auto-adjusts without distortion */}
            <div className="flex-1 bg-black/5 p-4 overflow-auto flex items-center justify-center rounded-b-3xl bg-slate-50">
              <img
                src={previewImage}
                alt="Payment Proof"
                className="max-w-full max-h-[75vh] w-auto h-auto object-contain shadow-2xl rounded-lg border border-gray-200"
              />
            </div>

            {/* Close Button at the bottom for convenience */}
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setPreviewImage(null)}
                className="px-10 py-4 bg-white text-gray-900 rounded-2xl font-bold hover:bg-gray-100 shadow-xl transition-all"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- UPDATED MODAL: CREATE / EDIT CAMPAIGN (With File Upload & Quick Select) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white p-8 rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 relative my-8">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
            <div className="mb-8">
              <h3 className="text-2xl font-black text-gray-900">{isEditing ? 'Update Campaign' : 'Launch New Campaign'}</h3>
              <p className="text-gray-500 text-sm">Define your fundraising goals below.</p>
            </div>

            <div className="space-y-5">
              {/* 1. NEW: FILE UPLOAD AREA (Replace URL Input) */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Campaign Cover Image</label>
                <div className="flex items-start gap-4">
                  <div className="relative group w-24 h-24 flex-shrink-0 bg-gray-100 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 hover:border-blue-400 transition-colors flex items-center justify-center">
                    {filePreview || formData.image_url ? (
                      <img src={filePreview || formData.image_url} alt="Cover preview" className="w-full h-full object-cover" />
                    ) : (
                      <UploadCloud className="w-8 h-8 text-gray-300 group-hover:text-blue-400" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCampaignFileSelect}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-700 mb-1">Upload Photo</p>
                    <p className="text-xs text-gray-500 mb-2">PNG, JPG up to 5MB.</p>
                    {campaignFile && <p className="text-[10px] text-blue-500 font-bold truncate">{campaignFile.name}</p>}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Campaign Title</label>
                <input
                  className="w-full border border-gray-100 bg-gray-50 p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-gray-800"
                  placeholder="e.g., LCP Scholarship Fund 2026"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Target Amount (₱)</label>
                  <input
                    type="number"
                    className="w-full border border-gray-100 bg-gray-50 p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-gray-800"
                    value={formData.target_amount}
                    onChange={e => setFormData({ ...formData, target_amount: e.target.value })}
                  />

                  {/* 2. NEW: QUICK SELECT BUTTONS */}
                  <div className="flex gap-2 mt-2">
                    {quickAmounts.map(amt => (
                      <button
                        key={amt}
                        onClick={() => setFormData({ ...formData, target_amount: amt.toString() })}
                        className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold hover:bg-blue-100 transition-colors"
                      >
                        {amt / 1000}k
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Category</label>
                  <select
                    className="w-full border border-gray-100 bg-gray-50 p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-gray-800"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option>Scholarship</option>
                    <option>Infrastructure</option>
                    <option>Events</option>
                    <option>Calamity Aid</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Description</label>
                <textarea
                  rows={3}
                  className="w-full border border-gray-100 bg-gray-50 p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium text-gray-600"
                  placeholder="Briefly explain the purpose of this campaign..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-10 pt-6 border-t border-gray-50">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 bg-white border border-gray-200 text-gray-500 font-bold rounded-2xl hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleSubmit} disabled={loading} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 flex items-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEditing ? 'Save Changes' : 'Start Campaign')}
              </button>
            </div>
          </div>
        </div>
      )}

      {isRejectModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[110] animate-in fade-in">
          <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-black text-gray-900 mb-2">Reject Transaction</h3>
            <p className="text-sm text-gray-500 mb-6">Please provide a reason. This will be shown to the donor and recorded in logs.</p>

            <textarea
              className="w-full border border-gray-100 bg-gray-50 p-4 rounded-2xl focus:ring-2 focus:ring-rose-500 outline-none text-sm font-medium mb-6"
              placeholder="e.g., Receipt is blurry or reference number is invalid."
              rows={4}
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
            />

            <div className="flex gap-3">
              <button onClick={() => setIsRejectModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={handleRejectSubmit} className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all">Confirm Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* --- CUSTOM ARCHIVE CONFIRMATION --- */}
      {isArchiveModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[120] animate-in fade-in">
          <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl text-center">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ExternalLink className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Archive Campaign?</h3>
            <p className="text-sm text-gray-500 mb-6">This will hide the campaign from the public but keep all donation records safe for auditing.</p>
            <div className="flex gap-3">
              <button onClick={() => setIsArchiveModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200">Cancel</button>
              <button
                onClick={() => {
                  if (archiveTarget) handleArchive(archiveTarget);
                  setIsArchiveModalOpen(false);
                }}
                className="flex-1 py-3 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 shadow-lg shadow-amber-200"
              >
                Confirm Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CUSTOM VERIFY CONFIRMATION --- */}
      {isVerifyModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[120] animate-in fade-in">
          <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Verify Funds?</h3>
            <p className="text-sm text-gray-500 mb-6">Confirming this will add ₱{verifyTarget?.amt.toLocaleString()} to the campaign progress.</p>
            <div className="flex gap-3">
              <button onClick={() => setIsVerifyModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200">Cancel</button>
              <button
                onClick={() => {
                  if (verifyTarget) verifyDonation(verifyTarget.id, verifyTarget.campId, verifyTarget.amt);
                  setIsVerifyModalOpen(false);
                }}
                className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700"
              >
                Confirm Verify
              </button>
            </div>
          </div>
        </div>
      )}

    </AdminPageLayout>
  );
};

export default DonationManager;