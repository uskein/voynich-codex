import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'hover' | 'bordered';
}

export function Card({ className = '', variant = 'default', children, ...props }: CardProps) {
  const variants = {
    default: 'bg-midnight-800/50 backdrop-blur-sm',
    hover: 'bg-midnight-800/50 backdrop-blur-sm hover:bg-midnight-700/50 transition-colors cursor-pointer',
    bordered: 'bg-midnight-800/50 backdrop-blur-sm border border-midnight-600'
  };

  return (
    <div className={`rounded-xl ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-4 border-b border-midnight-700 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-4 border-t border-midnight-700 ${className}`} {...props}>
      {children}
    </div>
  );
}
