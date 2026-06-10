import { S } from '../../lib/styles'

export function Card({ children, style: extra, ...props }) {
  return <div style={{ ...S.card, ...extra }} {...props}>{children}</div>
}

export function CardHeader({ children, style: extra }) {
  return <div style={{ ...S.cardHeader, ...extra }}>{children}</div>
}

export function CardBody({ children, style: extra }) {
  return <div style={{ ...S.cardBody, ...extra }}>{children}</div>
}
