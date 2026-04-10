interface DataValueProps {
  value: number | string;
  currency?: boolean;
  className?: string;
  prefix?: string;
  suffix?: string;
  color?: 'default' | 'success' | 'danger' | 'brand';
}

export default function DataValue({ 
  value, 
  currency = false, 
  className = '', 
  prefix = '', 
  suffix = '',
  color = 'default'
}: DataValueProps) {
  const formattedValue = typeof value === 'number' && currency
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
    : value;

  const colorClasses = {
    default: 'text-white',
    success: 'text-emerald-400',
    danger: 'text-rose-400',
    brand: 'text-brand-400'
  };

  return (
    <span className={`font-mono ${colorClasses[color]} ${className}`}>
      {prefix}{formattedValue}{suffix}
    </span>
  );
}
