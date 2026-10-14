import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary' | 'outline';
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
  compact?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className = '',
  compact = false,
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-sm text-center transition-all ${
        compact ? 'p-8' : 'py-16 px-6 sm:px-12'
      } ${className}`}
    >
      {/* Ambient gradient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-500/5 dark:bg-blue-400/5 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 max-w-md mx-auto flex flex-col items-center">
        {/* Animated icon container */}
        <div className="mb-4 relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 border border-blue-100 dark:border-slate-700/60 flex items-center justify-center shadow-inner text-blue-600 dark:text-blue-400 transition-transform duration-300 hover:scale-105">
            <Icon className="w-8 h-8" strokeWidth={1.75} />
          </div>
          <div className="absolute -inset-1 bg-blue-500/10 rounded-2xl blur-sm -z-10" />
        </div>

        {/* Text details */}
        <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight mb-1.5 font-display">
          {title}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6 font-normal">
          {description}
        </p>

        {/* Action Buttons */}
        {(action || secondaryAction) && (
          <div className="flex flex-wrap items-center justify-center gap-3 w-full">
            {action && (
              <button
                type="button"
                onClick={action.onClick}
                className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 shadow-sm active:scale-95 ${
                  action.variant === 'secondary'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                    : action.variant === 'outline'
                    ? 'border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                }`}
              >
                {action.icon && <action.icon className="w-4 h-4" />}
                <span>{action.label}</span>
              </button>
            )}

            {secondaryAction && (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {secondaryAction.icon && <secondaryAction.icon className="w-4 h-4" />}
                <span>{secondaryAction.label}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
