import React from 'react';
import { LucideIcon } from 'lucide-react';

interface AdminPageProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  children?: React.ReactNode;
  action?: React.ReactNode; 
}

const AdminPageLayout: React.FC<AdminPageProps> = ({ 
  title, subtitle, icon: Icon, children, action 
}) => {
  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
              <Icon className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          </div>
          <p className="text-gray-500 text-sm ml-1">{subtitle}</p>
        </div>
        {action && <div>{action}</div>}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm min-h-[400px] p-6 relative">
        {children ? children : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Icon className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-400">Module Ready</h3>
            <p className="text-sm text-gray-400 max-w-xs mt-2">
              This module is linked and ready for development.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPageLayout;