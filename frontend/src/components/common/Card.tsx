import React from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ title, subtitle, action, children, className = '' }) => {
  return (
    <div className={`bg-white rounded-xl border border-[#E1E8F0] shadow-card ${className}`}>
      {(title || action) && (
        <div className="p-4 px-5 border-b border-[#E1E8F0] flex items-center justify-between">
          <div>
            {title && <h3 className="text-sm font-bold text-[#203247]">{title}</h3>}
            {subtitle && <p className="text-xs text-[#718096] mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
};
