import { statusStyles, statusLabel } from '../../lib/styles'

export function StatusBadge({ status }) {
  const style = statusStyles[status] || { background: '#F5F2EC', color: '#9A948F', border: '1px solid #E8E4DC' }
  const label = statusLabel[status] || status
  return (
    <span style={{
      ...style,
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: '99px',
      fontSize: '11px', fontFamily: 'DM Mono, monospace',
      whiteSpace: 'nowrap', fontWeight: 400
    }}>
      {label}
    </span>
  )
}

export function RoleBadge({ role }) {
  const colors = {
    admin:      { background: '#0D0D0D', color: '#FAFAF7' },
    designer:   { background: '#EBF3FA', color: '#4A7FA5' },
    sales:      { background: '#EBF5EC', color: '#5A8A5E' },
    marketing:  { background: '#FBF6E8', color: '#B8860B' },
    production: { background: '#F3EEFA', color: '#6B5EA8' },
  }
  const s = colors[role] || { background: '#F5F2EC', color: '#9A948F' }
  return (
    <span style={{
      ...s, display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: '99px',
      fontSize: '11px', fontWeight: 500, textTransform: 'capitalize'
    }}>
      {role}
    </span>
  )
}
