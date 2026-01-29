import React, { useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const MasterListUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage({ type: 'info', text: 'Processing CSV file...' });

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const rows = text.split('\n').slice(1); // Remove header
      
      const records = rows.map(row => {
        const [student_id, last_name, first_name, course, batch_year] = row.split(',');
        if (!student_id) return null;
        return {
          student_id: student_id.trim(),
          last_name: last_name?.trim(),
          first_name: first_name?.trim(),
          course: course?.trim(),
          batch_year: batch_year?.trim()
        };
      }).filter(r => r !== null);

      try {
        const { error } = await supabase
          .from('alumni_master_list')
          .upsert(records, { onConflict: 'student_id' });

        if (error) throw error;
        setMessage({ type: 'success', text: `Successfully uploaded ${records.length} student records!` });
      } catch (err: any) {
        setMessage({ type: 'error', text: err.message });
      } finally {
        setUploading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-8 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto mt-10">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Upload className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Upload Master List</h2>
        <p className="text-gray-500 mt-2">Upload the Registrar's CSV file to enable Auto-Verification.</p>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:bg-gray-50 transition-colors relative">
        <input 
          type="file" 
          accept=".csv" 
          onChange={handleFileUpload} 
          disabled={uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        {uploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-3" />
            <p className="font-semibold text-blue-700">Uploading Records...</p>
          </div>
        ) : (
          <>
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="font-medium text-gray-700">Click to upload CSV</p>
            <p className="text-xs text-gray-400 mt-1">Format: StudentID, LastName, FirstName, Course, Year</p>
          </>
        )}
      </div>

      {message.text && (
        <div className={`mt-6 p-4 rounded-xl flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 
          message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5"/> : <AlertCircle className="w-5 h-5"/>}
          <p className="font-medium">{message.text}</p>
        </div>
      )}
    </div>
  );
};

export default MasterListUpload;