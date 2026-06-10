import { S } from '../../lib/styles'

export function Button({ variant = 'primary', size = 'md', children, style: extraStyle, disabled, ...props }) {
  const base = variant === 'primary' ? S.btnPrimary
    : variant === 'accent' ? S.btnAccent
    : variant === 'danger' ? S.btnDanger
    : S.btnSecondary

  const sizeStyle = size === 'sm' ? S.btnSm : {}

  return (
    <button
      style={{
        ...base, ...sizeStyle, ...extraStyle,
        opacity: disabled ? 0.45 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer'
      }}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
