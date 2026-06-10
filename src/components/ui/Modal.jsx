import { useEffect } from 'react'
import { X } from 'lucide-react'

export function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const widths = { sm: '440px', md: '560px', lg: '720px', xl: '960px' }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
    }}>
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(13,13,13,0.5)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      <div style={{
        position: 'relative', width: '100%', maxWidth: widths[size],
        background: '#FFFFFF', borderRadius: '16px',
        border: '1px solid #E8E4DC',
        boxShadow: '0 24px 64px rgba(0,0,0,0.12)',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid #E8E4DC', flexShrink: 0
        }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', fontWeight: 400 }}>
            {title}
          </h2>
          <button onClick={onClose} style={{
            width: '32px', height: '32px', borderRadius: '8px',
            border: '1px solid #E8E4DC', background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#9A948F'
          }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: '24px', overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
