import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Input, Textarea, Select } from '../../components/ui/Input'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Plus, Package, Archive, ArrowRight } from 'lucide-react'

const SEASONS = ['SS25','AW25','SS26','AW26','SS27','AW27','SS28']

export default function CollectionsPage() {
  const { profile } = useAuth()
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm()
  const canCreate = ['designer', 'admin'].includes(profile?.role)

  useEffect(() => { fetch() }, [])

  async function fetch() {
    setLoading(true)
    const { data } = await supabase.from('collections').select('*, users(full_name)').order('created_at', { ascending: false })
    setCollections(data || [])
    setLoading(false)
  }

  async function onSubmit(data) {
    setSaving(true)
    const { error } = await supabase.from('collections').insert({ ...data, created_by: profile.id, status: 'active' })
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Collection created')
    reset(); setShowModal(false); fetch()
  }

  async function archive(id) {
    await supabase.from('collections').update({ status: 'archived', archived_at: new Date().toISOString() }).eq('id', id)
    toast.success('Archived')
    fetch()
  }

  const active = collections.filter(c => c.status === 'active')
  const archived = collections.filter(c => c.status === 'archived')

  return (
    <div>
      <div className="flex-header" style={{ marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '36px', fontWeight: 300 }}>Collections</h1>
          <p style={{ fontSize: '13px', color: '#9A948F', marginTop: '6px' }}>{active.length} active</p>
        </div>
        {canCreate && <Button size="sm" onClick={() => setShowModal(true)}><Plus size={13} strokeWidth={1.5} />New Collection</Button>}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#9A948F', fontSize: '13px' }}>Loading…</div>
      ) : collections.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px' }}>
          <Package size={32} color="#E8E4DC" strokeWidth={1} style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', fontWeight: 400, marginBottom: '8px' }}>No collections yet</h3>
          <p style={{ fontSize: '13px', color: '#9A948F', marginBottom: '20px' }}>Create your first collection to start organizing designs.</p>
          {canCreate && <Button size="sm" onClick={() => setShowModal(true)}><Plus size={13} />Create Collection</Button>}
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div className="grid-3" style={{ marginBottom: '32px' }}>
              {active.map(col => (
                <div key={col.id} style={{ background: '#FFFFFF', border: '1px solid #E8E4DC', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 500, color: '#0D0D0D', marginBottom: '4px' }}>{col.name}</div>
                    <div style={{ fontSize: '11px', fontFamily: 'DM Mono, monospace', color: '#9A948F' }}>
                      {col.season && `${col.season} · `}by {col.users?.full_name}
                    </div>
                  </div>
                  {col.description && <p style={{ fontSize: '13px', color: '#9A948F', lineHeight: 1.5 }}>{col.description}</p>}
                  {col.launch_window && (
                    <div style={{ fontSize: '12px', color: '#9A948F' }}>Launch: <span style={{ color: '#0D0D0D' }}>{col.launch_window}</span></div>
                  )}
                  <div style={{ borderTop: '1px solid #F5F2EC', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Link to={`/designs?collection=${col.id}`} style={{ fontSize: '12px', color: '#9A948F', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      View designs <ArrowRight size={11} strokeWidth={1.5} />
                    </Link>
                    {(col.created_by === profile?.id || profile?.role === 'admin') && (
                      <button onClick={() => archive(col.id)} style={{ fontSize: '11px', color: '#9A948F', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Archive size={11} strokeWidth={1.5} /> Archive
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {archived.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9A948F', marginBottom: '12px' }}>Archived</div>
              <div className="grid-3" style={{ gap: '12px' }}>
                {archived.map(col => (
                  <div key={col.id} style={{ background: '#FAFAF7', border: '1px solid #E8E4DC', borderRadius: '10px', padding: '18px', opacity: 0.6 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#0D0D0D' }}>{col.name}</div>
                    <div style={{ fontSize: '11px', fontFamily: 'DM Mono, monospace', color: '#9A948F', marginTop: '4px' }}>{col.season}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Collection">
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Input label="Collection Name *" placeholder="e.g. Tokyo Streets AW27" {...register('name', { required: 'Name is required' })} error={errors.name?.message} />
          <Textarea label="Description" placeholder="Theme or direction for this collection" rows={2} {...register('description')} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Select label="Season" {...register('season')}>
              <option value="">Select season</option>
              {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Input label="Launch Window" placeholder="e.g. Feb 2027" {...register('launch_window')} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '4px' }}>
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create Collection'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
