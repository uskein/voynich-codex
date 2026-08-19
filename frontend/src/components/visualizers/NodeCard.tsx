import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface NodeCardProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  colorClass?: string;
  badge?: string | number;
  selected?: boolean;
  onClick?: () => void;
}

export function NodeCard({
  title,
  subtitle,
  icon: Icon,
  colorClass = 'text-midnight-300',
  badge,
  selected,
  onClick
}: NodeCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.04 }}
      onClick={onClick}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer select-none min-w-[120px] max-w-[200px] border transition-colors ${
        selected ? 'border-burnt-500 bg-midnight-700' : 'border-midnight-600 bg-midnight-800'
      }`}
      style={{ boxShadow: selected ? '0 0 12px rgba(217, 114, 22, 0.4)' : undefined }}
    >
      {Icon && (
        <span className="shrink-0">
          <Icon className={`w-4 h-4 ${colorClass}`} />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-parchment-100 truncate">{title}</p>
        {subtitle && <p className="text-xs text-parchment-400 truncate">{subtitle}</p>}
      </div>
      {badge !== undefined && (
        <span className="ml-auto shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-midnight-600 text-parchment-300">
          {badge}
        </span>
      )}
    </motion.div>
  );
}
