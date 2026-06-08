export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-[var(--surface-alt)] flex items-center justify-center mb-4">
          <Icon size={22} className="text-[var(--muted)]" />
        </div>
      )}
      <h3 className="font-display text-lg font-medium text-[var(--ink)] mb-1">{title}</h3>
      {description && <p className="text-sm text-[var(--muted)] max-w-xs mb-4">{description}</p>}
      {action}
    </div>
  )
}
