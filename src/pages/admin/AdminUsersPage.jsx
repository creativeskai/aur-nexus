import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Input, Select } from '../../components/ui/Input'
import { RoleBadge } from '../../components/ui/Badge'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

const ROLES = ['designer', 'sales', 'marketing', 'production', 'admin']

export default function AdminUsersPage() {
  const { profile: currentProfile } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => { fetchUsers() }, [])

  async function fetchUsers() {
    setLoading(true)
    const { data } = await supabase.from('users').select('*').order('created_at')
    setUsers(data || [])
    setLoading(false)
  }

  async function onSubmit(data) {
    setSaving(true)
    try {
      // Step 1: Create auth user via Supabase Admin API
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: { full_name: data.full_name, role: data.role }
      })

      if (authError) {
        // Fallback: signUp (works without service role but sends confirmation email)
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: { data: { full_name: data.full_name, role: data.role } }
        })
        if (signUpError) throw signUpError

        // Manually insert user row if trigger didn't fire
        if (signUpData.user) {
          const { error: insertError } = await supabase.from('users').upsert({
            id: signUpData.user.id,
            full_name: data.full_name,
            email: data.email,
            role: data.role,
            is_active: true
          }, { onConflict: 'id' })
          if (insertError) throw insertError
        }
        toast.success(`User created. A confirmation email has been sent to ${data.email}.`)
      } else {
        // Insert/update user profile
        const { error: insertError } = await supabase.from('users').upsert({
          id: authData.user.id,
          full_name: data.full_name,
          email: data.email,
          role: data.role,
          is_active: true
        }, { onConflict: 'id' })
        if (insertError) throw insertError
        toast.success(`User ${data.full_name} created successfully.`)
      }

      reset()
      setShowModal(false)
      fetchUsers()
    } catch (e) {
      toast.error(e.message || 'Failed to create user')
    }
    setSaving(false)
  }

  async function toggleActive(userId, current) {
    const { error } = await supabase.from('users').update({ is_active: !current }).eq('id', userId)
    if (error) { toast.error(error.message); return }
    toast.success(current ? 'User deactivated' : 'User reactivated')
    fetchUsers()
  }

  async function changeRole(userId, role) {
    const { error } = await supabase.from('users').update({ role }).eq('id', userId)
    if (error) { toast.error(error.message); return }
    toast.success('Role updated')
    fetchUsers()
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '32px', fontWeight: 300, marginBottom: '4px' }}>Users</h1>
          <p style={{ fontSize: '13px', color: 'var(--muted)' }}>{users.filter(u => u.is_active).length} active users</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={14} /> Add User
        </Button>
      </div>

      {loading ? (
        <div style={{ fontSize: '13px', color: 'var(--muted)' }}>Loading…</div>
      ) : (
        <Card>
          <div>
            {/* Header row */}
            <div style={{
              display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr',
              gap: '16px', padding: '10px 24px',
              background: 'var(--surface-alt)',
              fontSize: '10px', fontFamily: 'DM Mono, monospace',
              color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em',
              borderBottom: '1px solid var(--border)'
            }}>
              <div>Name</div>
              <div>Email</div>
              <div>Role</div>
              <div>Status</div>
            </div>

            {users.map((user, i) => (
              <div key={user.id} style={{
                display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr',
                gap: '16px', padding: '14px 24px', alignItems: 'center',
                borderBottom: i < users.length - 1 ? '1px solid var(--border)' : 'none',
                opacity: user.is_active ? 1 : 0.5
              }}>
                <div style={{ fontWeight: 500, fontSize: '13px' }}>
                  {user.full_name}
                  {user.id === currentProfile?.id && (
                    <span style={{ marginLeft: '8px', fontSize: '10px', color: 'var(--muted)', fontFamily: 'DM Mono, monospace' }}>(you)</span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'DM Mono, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email}
                </div>
                <div>
                  {user.id === currentProfile?.id ? (
                    <RoleBadge role={user.role} />
                  ) : (
                    <select
                      value={user.role}
                      onChange={e => changeRole(user.id, e.target.value)}
                      style={{
                        fontSize: '12px', background: 'transparent',
                        border: '1px solid var(--border)', borderRadius: '4px',
                        padding: '3px 6px', cursor: 'pointer', color: 'var(--ink)'
                      }}
                    >
                      {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                    </select>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '12px', fontFamily: 'DM Mono, monospace', color: user.is_active ? '#5A8A5E' : 'var(--muted)' }}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                  {user.id !== currentProfile?.id && (
                    <button
                      onClick={() => toggleActive(user.id, user.is_active)}
                      style={{ fontSize: '11px', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      {user.is_active ? 'Deactivate' : 'Reactivate'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add User">
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Full Name *"
            placeholder="e.g. Rahul Sharma"
            {...register('full_name', { required: 'Name is required' })}
            error={errors.full_name?.message}
          />
          <Input
            label="Email *"
            type="email"
            placeholder="rahul@aur.com"
            {...register('email', { required: 'Email is required' })}
            error={errors.email?.message}
          />
          <Input
            label="Temporary Password *"
            type="password"
            placeholder="They can change this later"
            {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
            error={errors.password?.message}
          />
          <Select label="Role *" {...register('role', { required: true })}>
            {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
          </Select>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px' }}>
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Add User'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
