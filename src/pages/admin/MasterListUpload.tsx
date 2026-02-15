import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { supabase } from '../../services/supabaseClient';
import AdminPageLayout from './AdminPageLayout';
import { useToast } from '../../context/ToastContext';
import { logMasterListUpload } from '../../services/auditLogger';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Search, Download, Users, GraduationCap, Key, Mail, Shield, Eye, EyeOff, CloudUpload, Table2, X } from 'lucide-react';

interface MasterRecord {
  id?: string;
  student_id: string;
  first_name: string;
  last_name: string;
  course: string;
  batch_year: string;
  status: string;
  email?: string;
}

interface CreatedCredential {
  student_id: string;
  name: string;
  email: string;
  password: string;
  status: 'created' | 'exists' | 'error';
  error?: string;
}

const COURSES = [
  'BSIT', 'BSCS', 'BSBA', 'BSHM', 'BSTM', 'BSOA',
  'BSCrim', 'BSEd', 'BSPsych', 'BSA', 'BSEntrep', 'BSRealEstate', 'BSCustoms'
];

const generateTempPassword = (): string => {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const special = '!@#$%';
  let pwd = '';
  for (let i = 0; i < 3; i++) pwd += upper[Math.floor(Math.random() * upper.length)];
  for (let i = 0; i < 2; i++) pwd += lower[Math.floor(Math.random() * lower.length)];
  for (let i = 0; i < 2; i++) pwd += digits[Math.floor(Math.random() * digits.length)];
  pwd += special[Math.floor(Math.random() * special.length)];
  return pwd.split('').sort(() => Math.random() - 0.5).join('');
};

const MasterListUpload = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'upload' | 'records'>('upload');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [records, setRecords] = useState<MasterRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('All');
  const fileRef = useRef<HTMLInputElement>(null);

  // Drag and drop
  const [isDragging, setIsDragging] = useState(false);
  const [droppedFile, setDroppedFile] = useState<File | null>(null);

  // Credential generation state
  const [credentials, setCredentials] = useState<CreatedCredential[]>([]);
  const [showCredentials, setShowCredentials] = useState(false);
  const [generatingAccounts, setGeneratingAccounts] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [showPasswords, setShowPasswords] = useState(false);

  useEffect(() => { fetchMasterList(); }, []);

  const fetchMasterList = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, student_id, first_name, last_name, course, batch_year, status, email')
        .eq('status', 'master_list')
        .order('course', { ascending: true });
      if (error) throw error;
      setRecords(data || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally { setLoading(false); }
  };

  const processFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      showToast({ type: 'warning', title: 'Invalid File', message: 'Please upload a .csv file.' });
      return;
    }

    setUploading(true);
    setMessage({ type: 'info', text: 'Processing records...' });
    setCredentials([]);
    setShowCredentials(false);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const rows = text.split('\n').slice(1);

      const parsed: { student_id: string; last_name: string; first_name: string; course: string; batch_year: string; email: string }[] = [];
      for (const row of rows) {
        const cols = row.split(',');
        if (cols.length < 5 || !cols[0]?.trim() || !cols[1]?.trim()) continue;

        const student_id = cols[0].trim();
        const last_name = cols[1].trim();
        const first_name = cols[2]?.trim() || '';
        const course = cols[3]?.trim() || '';
        const batch_year = cols[4]?.trim() || '';
        const email = cols[5]?.trim() || `${student_id.toLowerCase()}@bcp.edu.ph`;

        parsed.push({ student_id, last_name, first_name, course, batch_year, email });
      }

      if (parsed.length === 0) {
        setMessage({ type: 'error', text: 'No valid records found in CSV. Check format.' });
        setUploading(false);
        return;
      }

      // Step 1: Upsert profiles
      const profileRecords = parsed.map(p => ({
        student_id: p.student_id,
        last_name: p.last_name,
        first_name: p.first_name,
        middle_name: null,
        course: p.course,
        batch_year: p.batch_year,
        role: 'alumni',
        status: 'master_list',
        email: p.email,
        auth_provider: 'email',
      }));

      try {
        // Check-then-insert approach: check which student_ids already exist
        const studentIds = profileRecords.map(r => r.student_id);
        const { data: existing } = await supabase
          .from('profiles')
          .select('student_id')
          .in('student_id', studentIds);

        const existingIds = new Set((existing || []).map(e => e.student_id));
        const newRecords = profileRecords.filter(r => !existingIds.has(r.student_id));
        const skippedCount = profileRecords.length - newRecords.length;

        let insertedCount = 0;
        if (newRecords.length > 0) {
          // Try bulk insert first
          const { error: bulkErr } = await supabase.from('profiles').insert(newRecords);
          if (bulkErr) {
            console.warn('Bulk insert failed, falling back to one-by-one:', bulkErr.message);
            // Fallback: insert one by one
            for (const rec of newRecords) {
              const { error: singleErr } = await supabase.from('profiles').insert(rec);
              if (!singleErr) insertedCount++;
            }
          } else {
            insertedCount = newRecords.length;
          }
        }

        const totalProcessed = insertedCount + skippedCount;
        if (insertedCount === 0 && skippedCount > 0) {
          setMessage({ type: 'info', text: `All ${skippedCount} records already exist in the database.` });
        } else {
          setMessage({ type: 'success', text: `Imported ${insertedCount} new records. ${skippedCount > 0 ? `${skippedCount} already existed.` : ''}` });
        }

        showToast({ type: 'success', title: 'Master List Imported', message: `${parsed.length} records were processed.` });
        fetchMasterList();

        // Step 2: Generate credentials
        const newCreds: CreatedCredential[] = parsed.map(p => ({
          student_id: p.student_id,
          name: `${p.first_name} ${p.last_name}`,
          email: p.email,
          password: generateTempPassword(),
          status: 'created' as const,
        }));
        setCredentials(newCreds);
        setShowCredentials(true);

        // Step 3: Create auth accounts
        setGeneratingAccounts(true);
        setProgress({ current: 0, total: newCreds.length });

        try {
          const { data: { session: adminSession } } = await supabase.auth.getSession();
          const updatedCreds = [...newCreds];

          for (let i = 0; i < newCreds.length; i++) {
            const cred = newCreds[i];
            const p = parsed.find(x => x.email === cred.email);
            try {
              const { data: authData, error: signUpErr } = await supabase.auth.signUp({
                email: cred.email,
                password: cred.password,
                options: { data: { full_name: cred.name, first_name: p?.first_name || '', last_name: p?.last_name || '' } }
              });

              if (signUpErr) {
                if (signUpErr.message?.includes('already') || signUpErr.message?.includes('registered')) {
                  updatedCreds[i].status = 'exists';
                  updatedCreds[i].error = 'Already registered';
                } else {
                  updatedCreds[i].status = 'error';
                  updatedCreds[i].error = signUpErr.message;
                }
              } else if (authData.user) {
                await supabase.from('profiles').upsert({
                  id: authData.user.id, student_id: p?.student_id, first_name: p?.first_name,
                  last_name: p?.last_name, course: p?.course, batch_year: p?.batch_year,
                  email: cred.email, role: 'alumni', status: 'master_list', auth_provider: 'email',
                }, { onConflict: 'id' });
                updatedCreds[i].status = 'created';
              }
            } catch (err: any) {
              updatedCreds[i].status = 'error';
              updatedCreds[i].error = err.message || 'Unknown error';
            }
            setProgress({ current: i + 1, total: newCreds.length });
            setCredentials([...updatedCreds]);
          }

          if (adminSession) {
            await supabase.auth.setSession({ access_token: adminSession.access_token, refresh_token: adminSession.refresh_token });
          }

          const created = updatedCreds.filter(c => c.status === 'created').length;
          const exists = updatedCreds.filter(c => c.status === 'exists').length;
          showToast({ type: 'success', title: 'Accounts Generated', message: `${created} created, ${exists} already existed` });
          logMasterListUpload(newCreds.length, created);
        } catch (fnErr: any) {
          console.error('Account creation error:', fnErr);
          showToast({ type: 'warning', title: 'Account Creation Error', message: 'Some accounts may not have been created. Profile records were saved.' });
        } finally {
          setGeneratingAccounts(false);
        }

        // Switch to records tab after upload
        setActiveTab('records');

      } catch (err: any) {
        setMessage({ type: 'error', text: 'Database error: ' + err.message });
        showToast({ type: 'error', title: 'Import Failed', message: err.message || 'Unable to import CSV.' });
      } finally {
        setUploading(false);
        setDroppedFile(null);
        if (fileRef.current) fileRef.current.value = '';
      }
    };
    reader.readAsText(file);
  }, [showToast]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) { setDroppedFile(file); processFile(file); }
  };

  const downloadCredentials = () => {
    const header = 'Student ID,Name,Email,Temporary Password,Status\n';
    const body = credentials.map(c => `${c.student_id},"${c.name}",${c.email},${c.password},${c.status}`).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `alumni_credentials_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchSearch = !searchTerm || `${r.first_name} ${r.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) || r.student_id?.includes(searchTerm) || r.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCourse = filterCourse === 'All' || r.course === filterCourse;
      return matchSearch && matchCourse;
    });
  }, [records, searchTerm, filterCourse]);

  const courseStats = useMemo(() => {
    const map: Record<string, number> = {};
    records.forEach(r => { map[r.course] = (map[r.course] || 0) + 1; });
    return map;
  }, [records]);

  return (
    <AdminPageLayout title="Master List" subtitle="Official list of graduates — Upload CSV to auto-generate alumni accounts" icon={Upload}>

      {/* Hero Banner */}
      <div className="relative h-[180px] rounded-[2.5rem] bg-gradient-to-r from-violet-700 via-purple-600 to-indigo-600 overflow-hidden shadow-2xl flex items-center px-10 mb-8">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full -mb-24" />
        <div className="absolute top-1/2 right-20 w-32 h-32 bg-white/5 rounded-full -mt-16" />
        <div className="relative z-10 flex items-center justify-between w-full">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-white/10 border border-white/20 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Database</span>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tighter">Master List</h2>
            <p className="text-violet-100 text-sm font-medium mt-1">Upload CSV to auto-generate alumni accounts</p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3 text-center">
              <p className="text-2xl font-black text-white">{records.length}</p>
              <p className="text-[10px] font-bold text-violet-200 uppercase tracking-widest">Records</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3 text-center">
              <p className="text-2xl font-black text-white">{Object.keys(courseStats).length}</p>
              <p className="text-[10px] font-bold text-violet-200 uppercase tracking-widest">Courses</p>
            </div>
          </div>
        </div>
        <Upload className="absolute right-12 bottom-6 w-28 h-28 text-white/5" strokeWidth={1} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-blue-100 rounded-xl"><Users className="w-5 h-5 text-blue-600" /></div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Records</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{records.length}</p>
        </div>
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-purple-100 rounded-xl"><GraduationCap className="w-5 h-5 text-purple-600" /></div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Courses</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{Object.keys(courseStats).length}</p>
        </div>
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-emerald-100 rounded-xl"><Key className="w-5 h-5 text-emerald-600" /></div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">With Accounts</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{credentials.filter(c => c.status === 'created').length || '—'}</p>
        </div>
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-amber-100 rounded-xl"><Mail className="w-5 h-5 text-amber-600" /></div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Pending</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{records.filter(r => !r.email || r.email.startsWith('unregistered_')).length}</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl mb-6 w-fit">
        <button onClick={() => setActiveTab('upload')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'upload' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          <CloudUpload className="w-4 h-4" /> Upload CSV
        </button>
        <button onClick={() => setActiveTab('records')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'records' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          <Table2 className="w-4 h-4" /> Records ({records.length})
        </button>
      </div>

      {/* ===== UPLOAD TAB ===== */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !uploading && !generatingAccounts && fileRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${isDragging ? 'border-blue-500 bg-blue-50/80 scale-[1.01]' :
                uploading || generatingAccounts ? 'border-slate-200 bg-slate-50 cursor-wait' :
                  'border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/30'
              }`}
          >
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />

            {uploading || generatingAccounts ? (
              <div className="space-y-4">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
                <div>
                  <p className="font-bold text-slate-700">{generatingAccounts ? 'Creating login accounts...' : 'Processing CSV...'}</p>
                  {generatingAccounts && (
                    <div className="mt-3 max-w-xs mx-auto">
                      <div className="flex justify-between text-xs font-bold text-blue-600 mb-1">
                        <span>Progress</span>
                        <span>{progress.current}/{progress.total}</span>
                      </div>
                      <div className="w-full bg-blue-100 rounded-full h-2.5">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-all ${isDragging ? 'bg-blue-500 scale-110' : 'bg-gradient-to-br from-blue-100 to-purple-100'}`}>
                  <CloudUpload className={`w-10 h-10 transition-all ${isDragging ? 'text-white' : 'text-blue-500'}`} />
                </div>
                <p className="text-lg font-bold text-slate-700 mb-1">
                  {isDragging ? 'Drop your CSV file here!' : 'Drag & drop your CSV file here'}
                </p>
                <p className="text-sm text-slate-400 mb-4">or click to browse files</p>
                <div className="inline-flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-lg">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-500 font-mono">StudentID, LastName, FirstName, Course, BatchYear, Email (optional)</span>
                </div>
              </>
            )}
          </div>

          {/* Download Sample */}
          <div className="flex items-center gap-3">
            <a href="/sample_master_list.csv" download className="flex items-center gap-2 bg-slate-100 text-slate-700 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all">
              <Download className="w-4 h-4" /> Download Sample CSV
            </a>
            <p className="text-xs text-slate-400">Use this template to format your master list correctly.</p>
          </div>

          {/* Message */}
          {message.text && (
            <div className={`p-4 rounded-xl flex items-center gap-3 border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : message.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
              {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="font-medium text-sm">{message.text}</span>
              <button onClick={() => setMessage({ type: '', text: '' })} className="ml-auto p-1 hover:bg-black/5 rounded"><X className="w-4 h-4" /></button>
            </div>
          )}

          {/* Credentials Card */}
          {showCredentials && credentials.length > 0 && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center"><Key className="w-5 h-5 text-white" /></div>
                  <div>
                    <h3 className="font-bold text-green-900">Generated Credentials</h3>
                    <p className="text-xs text-green-600">
                      {credentials.filter(c => c.status === 'created').length} created · {credentials.filter(c => c.status === 'exists').length} existed · {credentials.filter(c => c.status === 'error').length} errors
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowPasswords(!showPasswords)} className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-3 py-1.5 rounded-lg hover:bg-green-200 transition-all">
                    {showPasswords ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />} {showPasswords ? 'Hide' : 'Show'}
                  </button>
                  <button onClick={downloadCredentials} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-green-700 transition-all shadow-md">
                    <Download className="w-3.5 h-3.5" /> Download Credentials CSV
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-green-100 overflow-hidden max-h-[240px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead><tr className="bg-green-50 border-b border-green-100">
                    <th className="text-left px-3 py-2 text-[10px] font-black text-green-500 uppercase">Name</th>
                    <th className="text-left px-3 py-2 text-[10px] font-black text-green-500 uppercase">Email</th>
                    <th className="text-left px-3 py-2 text-[10px] font-black text-green-500 uppercase">Temp Password</th>
                    <th className="text-left px-3 py-2 text-[10px] font-black text-green-500 uppercase">Status</th>
                  </tr></thead>
                  <tbody>
                    {credentials.slice(0, 20).map((c, i) => (
                      <tr key={i} className="border-b border-green-50 hover:bg-green-50/50">
                        <td className="px-3 py-2 font-semibold text-slate-700">{c.name}</td>
                        <td className="px-3 py-2 text-slate-500 font-mono">{c.email}</td>
                        <td className="px-3 py-2 font-mono text-slate-600">{showPasswords ? c.password : '••••••••'}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.status === 'created' ? 'bg-green-100 text-green-700' : c.status === 'exists' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                            {c.status === 'created' ? 'Created' : c.status === 'exists' ? 'Exists' : 'Error'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {credentials.length > 20 && <p className="text-center text-xs text-green-500 py-2 bg-green-50">+ {credentials.length - 20} more — Download CSV for full list</p>}
              </div>
              <div className="mt-3 flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                <Shield className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-700"><strong>Security reminder:</strong> Download the credentials CSV and distribute it securely. They should change their password after first login.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== RECORDS TAB ===== */}
      {activeTab === 'records' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search name, ID, or email..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
            <select value={filterCourse} onChange={e => setFilterCourse(e.target.value)} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none">
              <option value="All">All Courses</option>
              {COURSES.map(c => <option key={c} value={c}>{c} ({courseStats[c] || 0})</option>)}
            </select>
            <div className="flex-1" />
            <span className="text-xs font-bold text-slate-400">{filteredRecords.length} of {records.length} records</span>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase">#</th>
                      <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase">Student ID</th>
                      <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase">Last Name</th>
                      <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase">First Name</th>
                      <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase">Email</th>
                      <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase">Course</th>
                      <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase">Batch Year</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-12 text-center">
                        <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                        <p className="font-bold text-slate-400">No master list records found</p>
                        <p className="text-sm text-slate-300 mt-1">Upload a CSV to populate this table.</p>
                      </td></tr>
                    ) : (
                      filteredRecords.map((rec, i) => (
                        <tr key={rec.id || i} className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors">
                          <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                          <td className="px-4 py-3 font-mono text-xs text-blue-600 font-bold">{rec.student_id}</td>
                          <td className="px-4 py-3 font-bold text-slate-800">{rec.last_name}</td>
                          <td className="px-4 py-3 text-slate-600">{rec.first_name}</td>
                          <td className="px-4 py-3 text-slate-500 text-xs font-mono">
                            {rec.email && !rec.email.startsWith('unregistered_') ? rec.email : <span className="text-amber-500 italic">No email</span>}
                          </td>
                          <td className="px-4 py-3"><span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold">{rec.course}</span></td>
                          <td className="px-4 py-3 text-slate-500">{rec.batch_year}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </AdminPageLayout>
  );
};

export default MasterListUpload;