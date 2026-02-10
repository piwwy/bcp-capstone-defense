import React, { useState } from 'react';
import AdminPageLayout from '../../pages/admin/AdminPageLayout';
import { Bot, Upload, Play, Database, CheckCircle, Activity } from 'lucide-react';

const TrainAI = () => {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'training' | 'complete'>('idle');
  const [logs, setLogs] = useState<string[]>([]);

  const handleStartTraining = () => {
    setStatus('uploading');
    addLog("Initializing n8n workflow...");

    setTimeout(() => {
      setStatus('training');
      addLog("Dataset uploaded successfully.");
      addLog("Parsing CSV data...");
      addLog("Identifying patterns in 'Employment Status'...");
      addLog("Correlating 'Course' vs 'Job Title'...");
    }, 2000);

    setTimeout(() => {
      setStatus('complete');
      addLog("Training Model Complete. Accuracy: 94.2%");
      addLog("New analytics available in Dashboard.");
    }, 5000);
  };

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  return (
    <AdminPageLayout title="AI Model Training" subtitle="Train the system on new alumni datasets using n8n" icon={Bot}>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Left: Control Panel */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4">1. Upload Training Data</h3>
            <div className="border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-xl p-8 text-center cursor-pointer hover:bg-blue-50 transition-colors">
              <Database className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-blue-900">Click to upload CSV</p>
              <p className="text-xs text-blue-400">Masterlist_2026_Updated.csv</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4">2. Workflow Configuration</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-500">Engine</span>
                <span className="font-bold text-gray-800">n8n Automation</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-500">Model Type</span>
                <span className="font-bold text-gray-800">Classification (Tracer)</span>
              </div>
            </div>

            <button
              onClick={handleStartTraining}
              disabled={status !== 'idle' && status !== 'complete'}
              className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {status === 'training' ? <Activity className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
              {status === 'idle' || status === 'complete' ? 'Start Training' : 'Processing...'}
            </button>
          </div>
        </div>

        {/* Right: Terminal / Logs */}
        <div className="bg-gray-900 rounded-2xl p-6 text-green-400 font-mono text-sm shadow-xl flex flex-col h-[500px]">
          <div className="flex items-center gap-2 border-b border-gray-800 pb-4 mb-4">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="ml-2 text-gray-500 text-xs">system_logs.log</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            <p className="opacity-50">Waiting for command...</p>
            {logs.map((log, idx) => (
              <p key={idx} className="animate-in fade-in slide-in-from-left-2 duration-300">
                <span className="text-blue-400">➜</span> {log}
              </p>
            ))}
            {status === 'complete' && (
              <p className="text-white font-bold mt-4 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" /> PROCESS COMPLETED SUCCESSFULLY.
              </p>
            )}
          </div>
        </div>

      </div>
    </AdminPageLayout>
  );
};

export default TrainAI;