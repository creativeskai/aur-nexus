export const S = {
  card: { background: '#FFFFFF', border: '1px solid #EBEBEB', borderRadius: '10px', overflow: 'hidden' },
  cardHeader: { padding: '14px 20px', borderBottom: '1px solid #EBEBEB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  cardBody: { padding: '20px' },
  label: { fontSize: '10px', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9A948F', display: 'block', marginBottom: '5px' },
  input: { width: '100%', padding: '9px 12px', background: '#FFFFFF', border: '1px solid #EBEBEB', borderRadius: '7px', fontSize: '13px', color: '#0D0D0D', outline: 'none', transition: 'border-color 0.15s', fontFamily: 'Outfit, sans-serif' },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#0D0D0D', color: '#FFFFFF', border: '1px solid #0D0D0D', borderRadius: '7px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'Outfit, sans-serif', whiteSpace: 'nowrap' },
  btnSecondary: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'transparent', color: '#0D0D0D', border: '1px solid #EBEBEB', borderRadius: '7px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'Outfit, sans-serif', whiteSpace: 'nowrap' },
  btnAccent: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#5A8A5E', color: '#FFFFFF', border: '1px solid #5A8A5E', borderRadius: '7px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'Outfit, sans-serif', whiteSpace: 'nowrap' },
  btnDanger: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'transparent', color: '#C4663A', border: '1px solid #C4663A', borderRadius: '7px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'Outfit, sans-serif', whiteSpace: 'nowrap' },
  btnSm: { padding: '6px 12px', fontSize: '12px' },
  pageTitle: { fontFamily: 'Cormorant Garamond, serif', fontSize: '30px', fontWeight: 400, letterSpacing: '-0.01em', lineHeight: 1.2 },
  sectionLabel: { fontSize: '10px', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9A948F' },
}

export const statusStyles = {
  draft:                { background: '#F5F5F5', color: '#888', border: '1px solid #E8E8E8' },
  submitted:            { background: '#EBF3FA', color: '#3A6F9A', border: '1px solid #C0D9EE' },
  under_review:         { background: '#FBF6E8', color: '#9A6B00', border: '1px solid #E8D5A0' },
  revision_requested:   { background: '#FAF0EB', color: '#C4663A', border: '1px solid #E8BBA8' },
  resubmitted:          { background: '#EBF3FA', color: '#3A6F9A', border: '1px solid #C0D9EE' },
  approved:             { background: '#EBFAEE', color: '#2E7D4F', border: '1px solid #A8DDB8' },
  specification_pending:{ background: '#F3EEFA', color: '#5E4EA0', border: '1px solid #C9C3E0' },
  production_ready:     { background: '#EBFAEE', color: '#2E7D4F', border: '1px solid #A8DDB8' },
  sampling:             { background: '#F3EEFA', color: '#5E4EA0', border: '1px solid #C9C3E0' },
  sample_approved:      { background: '#EBFAEE', color: '#2E7D4F', border: '1px solid #A8DDB8' },
  production:           { background: '#F3EEFA', color: '#5E4EA0', border: '1px solid #C9C3E0' },
  launch_ready:         { background: '#FBF6E8', color: '#9A6B00', border: '1px solid #E8D5A0' },
  archived:             { background: '#F5F5F5', color: '#888', border: '1px solid #E8E8E8' },
}

export const statusLabel = {
  draft:'Draft', submitted:'Submitted', under_review:'Under Review',
  revision_requested:'Revision Requested', resubmitted:'Resubmitted',
  approved:'Approved', specification_pending:'Spec Pending',
  production_ready:'Production Ready', sampling:'Sampling',
  sample_approved:'Sample Approved', production:'In Production',
  launch_ready:'Launch Ready', archived:'Archived',
}
