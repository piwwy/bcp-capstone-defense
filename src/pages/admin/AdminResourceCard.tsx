import React from 'react';
import { MoreVertical, Edit, X, ExternalLink, TrendingUp } from 'lucide-react';

interface AdminResourceCardProps {
  title: string;
  subtitle?: string;
  status?: 'active' | 'pending' | 'closed' | 'archived' | string;
  category?: string;
  image?: string;
  children?: React.ReactNode; // Dito ilalagay ang specific content (e.g. Progress Bar)
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
}

const AdminResourceCard: React.FC<AdminResourceCardProps> = ({ 
  title, subtitle, status, category, image, children, onEdit, onDelete, onView 
}) => {
  
  // Status Color Logic
  const getStatusStyle = (s?: string) => {
    switch(s?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-700 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'closed': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-blue-50 text-blue-600 border-blue-100';
    }
  };

  return (
    <div className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden h-full">
      
      {/* 1. Header Section */}
      <div className="p-5 flex justify-between items-start">
        <div className="flex gap-4">
          {/* Optional Image/Icon Placeholder */}
          <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex-shrink-0 overflow-hidden">
            {image ? (
              <img src={image} alt={title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-lg">
                {title.charAt(0)}
              </div>
            )}
          </div>
          
          <div>
            <h3 className="font-bold text-gray-900 line-clamp-1" title={title}>{title}</h3>
            {subtitle && <p className="text-xs text-gray-500 line-clamp-1">{subtitle}</p>}
            
            <div className="flex gap-2 mt-2">
              {category && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  {category}
                </span>
              )}
              {status && (
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getStatusStyle(status)}`}>
                  {status}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Menu (Show on Hover) */}
        <div className="relative group/menu">
          <button className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
            <MoreVertical className="w-5 h-5" />
          </button>
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-xl border border-gray-100 p-1 opacity-0 group-hover/menu:opacity-100 invisible group-hover/menu:visible transition-all z-10">
            {onView && (
              <button onClick={onView} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded-lg text-left">
                <ExternalLink className="w-3 h-3" /> View
              </button>
            )}
            {onEdit && (
              <button onClick={onEdit} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded-lg text-left">
                <Edit className="w-3 h-3" /> Edit
              </button>
            )}
            {onDelete && (
  <button onClick={onDelete} className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg text-left ${status === 'archived' ? 'text-blue-600 hover:bg-blue-50' : 'text-red-600 hover:bg-red-50'}`}>
    {status === 'archived' ? (
      <><TrendingUp className="w-3 h-3" /> Restore</> // Label kapag archived
    ) : (
      <><X className="w-3 h-3" /> Archive</> // Label kapag active
    )}
  </button>
)}
          </div>
        </div>
      </div>

      {/* 2. Body / Custom Content (Progress Bars, Stats, etc.) */}
      <div className="px-5 pb-5 flex-1 flex flex-col justify-end">
        {children}
      </div>

    </div>
  );
};

export default AdminResourceCard;