import { useEffect, useState } from 'react';
import AdminPageLayout from '../../pages/admin/AdminPageLayout';
import {
  Bot, Play, Database, CheckCircle, Activity, BarChart3, TrendingUp,
  Users, Cpu, Server, Globe, Briefcase, Heart, CalendarDays
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { logAudit, AUDIT_ACTIONS } from '../../services/auditLogger';

type Status = 'idle' | 'fetching' | 'training' | 'complete' | 'error';
type HeartbeatStatus = 'checking' | 'connected' | 'fallback';

interface AlumniProfileRow {
  id: string;
  course?: string | null;
  employment_status?: string | null;
  status?: string | null;
}

interface CareerRow {
  id: string;
  employment_status?: string | null;
  current_company?: string | null;
}

interface DonationRow {
  amount?: number | null;
  created_at?: string | null;
}

interface EventRow {
  id: string;
  status?: string | null;
  date?: string | null;
}

interface EventAttendeeRow {
  id: string;
}

interface JobApplicationRow {
  status?: string | null;
}

interface Insights {
  totalRecords: number;
  topCourse: string;
  employmentRate: string;
  predictedEmploymentRate: string;
  topCompany: string;
  projectedDonations: string;
  projectedEventAttendance: string;
  forecastWindow: string;
  sourceEngine: 'Local Forecast' | 'n8n Forecast';
  lastSyncedAt: string;
}

const EMPLOYED_SET = new Set(['employed', 'full-time', 'part-time', 'self-employed', 'self_employed', 'freelance']);

const toNumber = (value: unknown) => Number(value) || 0;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const normalize = (value?: string | null) => (value || '').trim().toLowerCase();

const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(Math.max(0, value));

const round1 = (value: number) => Number(value.toFixed(1));

const TrainAI = () => {
  const [status, setStatus] = useState<Status>('idle');
  const [heartbeatStatus, setHeartbeatStatus] = useState<HeartbeatStatus>('checking');
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [insights, setInsights] = useState<Insights | null>(null);

  const addLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 59)]);
  };

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/alumni-ai-train';

  const checkHeartbeat = async () => {
    setHeartbeatStatus('checking');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      setHeartbeatStatus(response.ok ? 'connected' : 'fallback');
    } catch {
      setHeartbeatStatus('fallback');
    }
  };

  useEffect(() => {
    void checkHeartbeat();
    const intervalId = setInterval(() => { void checkHeartbeat(); }, 60_000);
    return () => clearInterval(intervalId);
  }, []);

  const handleStartTraining = async () => {
    setStatus('fetching');
    setProgress(4);
    setLogs([]);
    setInsights(null);
    addLog('Bootstrapping AI forecast pipeline...');

    try {
      addLog('Reading live datasets from Supabase...');
      const [
        profilesRes,
        careersRes,
        donationsRes,
        eventsRes,
        attendeesRes,
        jobAppsRes
      ] = await Promise.all([
        supabase.from('profiles').select('id, course, employment_status, status').eq('role', 'alumni'),
        supabase.from('alumni_profiles').select('id, employment_status, current_company'),
        supabase.from('donations').select('amount, created_at').eq('status', 'verified'),
        supabase.from('alumni_events').select('id, status, date'),
        supabase.from('event_attendees').select('id'),
        supabase.from('job_applications').select('status')
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (careersRes.error) throw careersRes.error;
      if (donationsRes.error) throw donationsRes.error;
      if (eventsRes.error) throw eventsRes.error;
      if (attendeesRes.error) throw attendeesRes.error;
      if (jobAppsRes.error) throw jobAppsRes.error;

      setProgress(28);
      addLog('Datasets loaded. Starting local modeling...');
      setStatus('training');

      const profiles = (profilesRes.data || []) as AlumniProfileRow[];
      const careers = (careersRes.data || []) as CareerRow[];
      const donations = (donationsRes.data || []) as DonationRow[];
      const events = (eventsRes.data || []) as EventRow[];
      const attendees = (attendeesRes.data || []) as EventAttendeeRow[];
      const jobApps = (jobAppsRes.data || []) as JobApplicationRow[];

      const careerMap = new Map(careers.map((c) => [c.id, c]));
      const activeProfiles = profiles.filter((p) => p.status !== 'archived' && p.status !== 'rejected');
      const mergedProfiles = activeProfiles.map((p) => {
        const career = careerMap.get(p.id);
        return {
          ...p,
          employment_status: career?.employment_status || p.employment_status || '',
          current_company: (career?.current_company || '').trim()
        };
      });

      const totalAlumni = mergedProfiles.length;
      const employed = mergedProfiles.filter((p) => EMPLOYED_SET.has(normalize(p.employment_status)));
      const employmentRateValue = totalAlumni > 0 ? round1((employed.length / totalAlumni) * 100) : 0;

      const courseCount: Record<string, number> = {};
      employed.forEach((p) => {
        const course = (p.course || '').trim();
        if (!course) return;
        courseCount[course] = (courseCount[course] || 0) + 1;
      });
      const topCourse = Object.entries(courseCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

      const companyCount: Record<string, number> = {};
      mergedProfiles.forEach((p) => {
        const company = (p.current_company || '').trim();
        if (!company) return;
        companyCount[company] = (companyCount[company] || 0) + 1;
      });
      const topCompany = Object.entries(companyCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

      const hiredCount = jobApps.filter((a) => normalize(a.status) === 'hired').length;
      const hireRate = jobApps.length > 0 ? (hiredCount / jobApps.length) * 100 : 0;
      const predictedEmploymentRateValue = round1(clamp((employmentRateValue * 0.8) + (hireRate * 0.2), 0, 100));

      const now = new Date();
      const monthBuckets: Record<string, number> = {};
      for (let i = 0; i < 3; i += 1) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthBuckets[d.toISOString().slice(0, 7)] = 0;
      }
      donations.forEach((d) => {
        if (!d.created_at) return;
        const key = d.created_at.slice(0, 7);
        if (monthBuckets[key] !== undefined) {
          monthBuckets[key] += toNumber(d.amount);
        }
      });
      const last3MonthsTotal = Object.values(monthBuckets).reduce((acc, curr) => acc + curr, 0);
      const monthlyDonationAvg = last3MonthsTotal / 3;
      const projectedDonations = monthlyDonationAvg * 3;

      const activeEvents = events.filter((e) => normalize(e.status) === 'active').length;
      const attendeePerEvent = activeEvents > 0 ? attendees.length / activeEvents : 0;
      const projectedEventAttendance = Math.round(attendeePerEvent * Math.max(1, Math.round(activeEvents * 0.4)));

      await wait(450);
      setProgress(56);
      addLog(`Profiles modeled: ${totalAlumni} alumni records`);
      await wait(350);
      addLog(`Employment status tracker baseline: ${employmentRateValue.toFixed(1)}%`);
      await wait(350);
      setProgress(76);
      addLog('Running optional n8n forecast hook...');

      const generatedAt = new Date();
      let finalInsights: Insights = {
        totalRecords: totalAlumni,
        topCourse,
        employmentRate: `${employmentRateValue.toFixed(1)}%`,
        predictedEmploymentRate: `${predictedEmploymentRateValue.toFixed(1)}%`,
        topCompany,
        projectedDonations: formatMoney(projectedDonations),
        projectedEventAttendance: `${projectedEventAttendance}`,
        forecastWindow: 'Next 3 months',
        sourceEngine: 'Local Forecast',
        lastSyncedAt: generatedAt.toLocaleString()
      };

      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            generated_at: generatedAt.toISOString(),
            summary: {
              total_alumni: totalAlumni,
              employment_rate: employmentRateValue,
              predicted_employment_rate: predictedEmploymentRateValue,
              top_course: topCourse,
              top_company: topCompany,
              projected_donations: projectedDonations,
              projected_event_attendance: projectedEventAttendance
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          finalInsights = {
            ...finalInsights,
            predictedEmploymentRate: `${round1(toNumber(data?.predictedEmploymentRate ?? data?.predicted_employment_rate ?? predictedEmploymentRateValue)).toFixed(1)}%`,
            projectedDonations: formatMoney(toNumber(data?.projectedDonations ?? data?.projected_donations ?? projectedDonations)),
            projectedEventAttendance: `${Math.round(toNumber(data?.projectedEventAttendance ?? data?.projected_event_attendance ?? projectedEventAttendance))}`,
            sourceEngine: 'n8n Forecast'
          };
          setHeartbeatStatus('connected');
          addLog('n8n response received. Using workflow-enhanced forecast.');
        } else {
          setHeartbeatStatus('fallback');
          addLog('n8n not reachable or returned non-OK. Kept local forecast output.');
        }
      } catch {
        setHeartbeatStatus('fallback');
        addLog('n8n webhook unavailable. Kept local forecast output.');
      }

      setProgress(100);
      setStatus('complete');
      setInsights(finalInsights);
      addLog('Training and forecasting complete.');

      await logAudit(AUDIT_ACTIONS.SETTINGS_UPDATED, {
        module: 'AI Forecasting',
        message: `Generated ${finalInsights.sourceEngine} using ${totalAlumni} alumni records.`,
        insights: finalInsights
      });

      // Notify admin and superadmin users so the dashboard bell shows an AI update.
      const { data: adminReceivers, error: receiverError } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['admin', 'superadmin']);

      if (receiverError) {
        addLog(`Notification recipient lookup failed: ${receiverError.message}`);
      } else if (adminReceivers && adminReceivers.length > 0) {
        const notifRows = adminReceivers.map((u: { id: string }) => ({
          user_id: u.id,
          title: 'AI Forecast Completed',
          message: `${finalInsights.sourceEngine} updated: ${finalInsights.predictedEmploymentRate} projected employment rate (${finalInsights.forecastWindow}).`,
          type: 'ai_forecast',
          event_id: null,
          is_read: false
        }));
        const { error: notifError } = await supabase.from('notifications').insert(notifRows);
        if (notifError) {
          addLog(`Admin notification dispatch failed: ${notifError.message}`);
        } else {
          addLog(`Broadcasted AI forecast notification to ${adminReceivers.length} admin users.`);
        }
      }
    } catch (err: any) {
      setStatus('error');
      setProgress(0);
      addLog(`ERROR: ${err?.message || 'Unknown training error'}`);
    }
  };

  return (
    <AdminPageLayout title="AI Forecast Training" subtitle="Analytics-Driven Forecasts from Live Alumni Data" icon={Bot}>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="flex items-center gap-2 font-black text-slate-800 mb-6 uppercase text-xs tracking-widest">
              <Database className="w-4 h-4 text-blue-500" /> Data Source
            </h3>
            <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 mb-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">Source</span>
                <span className="text-xs font-black text-emerald-600 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Live (Supabase)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">Scope</span>
                <span className="text-xs font-black text-slate-700 uppercase">Profiles, Career, Donations, Events</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">Engine</span>
                <span className="text-xs font-black text-blue-700 uppercase">
                  {insights?.sourceEngine || 'Local Forecast'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">n8n Heartbeat</span>
                <span className={`text-xs font-black uppercase ${
                  heartbeatStatus === 'connected'
                    ? 'text-emerald-600'
                    : heartbeatStatus === 'checking'
                      ? 'text-amber-600'
                      : 'text-rose-600'
                }`}>
                  {heartbeatStatus === 'connected' ? 'Connected' : heartbeatStatus === 'checking' ? 'Checking' : 'Fallback (Local)'}
                </span>
              </div>
            </div>
            <div className="border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-3xl p-6 text-center">
              <Cpu className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">
                Forecasting Mode
              </p>
              <p className="text-[11px] font-bold text-slate-500 mt-1">
                {insights?.lastSyncedAt ? `Last Synced: ${insights.lastSyncedAt}` : 'Awaiting run'}
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="flex items-center gap-2 font-black text-slate-800 mb-6 uppercase text-xs tracking-widest">
              <Play className="w-4 h-4 text-purple-500" /> Process Control
            </h3>
            <div className="mb-6">
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-black text-slate-500 uppercase">Progress</span>
                <span className="text-lg font-black text-blue-600">{progress}%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <button
              onClick={handleStartTraining}
              disabled={status === 'fetching' || status === 'training'}
              className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50 uppercase text-xs tracking-widest"
            >
              {(status === 'training' || status === 'fetching') ? <Activity className="w-5 h-5 animate-spin" /> : <Play className="w-4 h-4" />}
              {(status === 'idle' || status === 'complete' || status === 'error') ? 'Start Training' : 'Processing...'}
            </button>

            {status === 'complete' && (
              <p className="mt-4 text-center text-[10px] font-bold text-emerald-600 flex items-center justify-center gap-1">
                <CheckCircle className="w-3 h-3" /> Forecast ready
              </p>
            )}
          </div>
        </div>

        <div className="xl:col-span-2 space-y-6">
          {insights && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-5 rounded-[2rem] text-white shadow-lg">
                <TrendingUp className="w-5 h-5 mb-2 opacity-60" />
                <p className="text-[10px] font-black uppercase opacity-70 tracking-widest">Top Employed Course</p>
                <p className="text-xl font-black truncate">{insights.topCourse}</p>
              </div>
              <div className="bg-white border border-slate-100 p-5 rounded-[2rem] shadow-sm">
                <Users className="w-5 h-5 mb-2 text-emerald-500" />
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Employment Rate</p>
                <p className="text-xl font-black text-slate-800">{insights.employmentRate}</p>
              </div>
              <div className="bg-white border border-slate-100 p-5 rounded-[2rem] shadow-sm">
                <BarChart3 className="w-5 h-5 mb-2 text-purple-500" />
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Forecast Rate</p>
                <p className="text-xl font-black text-slate-800">{insights.predictedEmploymentRate}</p>
              </div>
              <div className="bg-white border border-slate-100 p-5 rounded-[2rem] shadow-sm">
                <Server className="w-5 h-5 mb-2 text-blue-500" />
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Alumni</p>
                <p className="text-xl font-black text-slate-800">{insights.totalRecords}</p>
              </div>
              <div className="bg-white border border-slate-100 p-5 rounded-[2rem] shadow-sm">
                <Briefcase className="w-5 h-5 mb-2 text-indigo-500" />
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Top Company</p>
                <p className="text-base font-black text-slate-800 truncate">{insights.topCompany}</p>
              </div>
              <div className="bg-white border border-slate-100 p-5 rounded-[2rem] shadow-sm">
                <Heart className="w-5 h-5 mb-2 text-rose-500" />
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Projected Donations</p>
                <p className="text-base font-black text-slate-800">{insights.projectedDonations}</p>
              </div>
              <div className="bg-white border border-slate-100 p-5 rounded-[2rem] shadow-sm">
                <CalendarDays className="w-5 h-5 mb-2 text-amber-500" />
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Projected Attendees</p>
                <p className="text-base font-black text-slate-800">{insights.projectedEventAttendance}</p>
              </div>
              <div className="bg-white border border-slate-100 p-5 rounded-[2rem] shadow-sm">
                <Globe className="w-5 h-5 mb-2 text-cyan-600" />
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Forecast Window</p>
                <p className="text-base font-black text-slate-800">{insights.forecastWindow}</p>
              </div>
            </div>
          )}

          <div className="bg-[#0f172a] rounded-[2.5rem] p-8 text-slate-300 font-mono text-xs shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Bot className="w-32 h-32" />
            </div>

            <div className="flex items-center gap-2 border-b border-slate-800/50 pb-4 mb-6 relative z-10">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 bg-rose-500/80 rounded-full"></div>
                <div className="w-3 h-3 bg-amber-500/80 rounded-full"></div>
                <div className="w-3 h-3 bg-emerald-500/80 rounded-full"></div>
              </div>
              <span className="ml-4 text-slate-500 font-bold tracking-widest flex items-center gap-2">
                <Server className="w-3 h-3" /> AI_FORECAST_LOGS
              </span>
            </div>

            <div className="h-[320px] overflow-y-auto space-y-2 custom-scrollbar relative z-10">
              {logs.length === 0 && <p className="opacity-40 italic">Ready for forecasting run...</p>}
              {logs.map((log, idx) => (
                <p key={idx} className="flex gap-3 animate-in fade-in slide-in-from-left-4 duration-300">
                  <span className="text-blue-500 font-black">{'>'}</span>
                  <span className={log.includes('ERROR:') ? 'text-rose-400' : 'text-slate-200'}>{log}</span>
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminPageLayout>
  );
};

export default TrainAI;
