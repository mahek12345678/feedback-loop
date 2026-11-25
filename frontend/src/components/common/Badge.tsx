import React from 'react';

interface BadgeProps {
  variant?: 'primary' | 'success' | 'warning' | 'critical' | 'neutral';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'primary', children, className = '' }) => {
  const variantStyles = {
    primary: 'bg-[#EAF4FC] text-[#1769AA] border border-[#CBD5E1]',
    success: 'bg-emerald-50 text-[#28A879] border border-emerald-200',
    warning: 'bg-amber-50 text-[#E7A33E] border border-amber-200',
    critical: 'bg-red-50 text-[#D95763] border border-red-200',
    neutral: 'bg-slate-50 text-[#718096] border border-slate-200',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};
