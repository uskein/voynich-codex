interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && <div className="mb-4" style={{ color: 'var(--text-secondary)' }}>{icon}</div>}
      <h3 className="text-lg font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      {description && <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{description}</p>}
      {action}
    </div>
  );
}
