import { forwardRef, useState } from 'react'
import { S } from '../../lib/styles'

export const Input = forwardRef(({ label, error, style: extra, ...props }, ref) => {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && <label style={S.label}>{label}</label>}
      <input
        ref={ref}
        style={{
          ...S.input,
          borderColor: error ? '#C4663A' : focused ? '#0D0D0D' : '#E8E4DC',
          ...extra
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      {error && <span style={{ fontSize: '11px', color: '#C4663A' }}>{error}</span>}
    </div>
  )
})
Input.displayName = 'Input'

export const Textarea = forwardRef(({ label, error, rows = 3, style: extra, ...props }, ref) => {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && <label style={S.label}>{label}</label>}
      <textarea
        ref={ref}
        rows={rows}
        style={{
          ...S.input,
          resize: 'none',
          lineHeight: 1.6,
          borderColor: error ? '#C4663A' : focused ? '#0D0D0D' : '#E8E4DC',
          ...extra
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      {error && <span style={{ fontSize: '11px', color: '#C4663A' }}>{error}</span>}
    </div>
  )
})
Textarea.displayName = 'Textarea'

export const Select = forwardRef(({ label, error, children, style: extra, ...props }, ref) => {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && <label style={S.label}>{label}</label>}
      <select
        ref={ref}
        style={{
          ...S.input,
          cursor: 'pointer',
          borderColor: error ? '#C4663A' : focused ? '#0D0D0D' : '#E8E4DC',
          ...extra
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      >
        {children}
      </select>
      {error && <span style={{ fontSize: '11px', color: '#C4663A' }}>{error}</span>}
    </div>
  )
})
Select.displayName = 'Select'
