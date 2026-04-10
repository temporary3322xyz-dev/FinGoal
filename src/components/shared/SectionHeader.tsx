import { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  label?: string;
  className?: string;
  rightElement?: ReactNode;
}

export default function SectionHeader({ title, label, className = '', rightElement }: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between mb-6 ${className}`}>
      <div>
        {label && (
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-500 mb-1 block">
            {label}
          </span>
        )}
        <h2 className="text-2xl font-bold text-white tracking-tight">
          {title}
        </h2>
      </div>
      {rightElement && (
        <div>{rightElement}</div>
      )}
    </div>
  );
}
