import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import aurLogo from '../../assets/aur-logo.png'

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()

  async function onSubmit(data) {
    setLoading(true)
    const { error } = await signIn(data.email, data.password)
    setLoading(false)
    if (error) toast.error('Invalid email or password')
    else navigate('/dashboard')
  }

  return (
    <div style={{ minHeight:'100vh', background:'#FFFFFF', display:'flex' }}>
      {/* Left panel */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 24px' }}>
        <div style={{ width:'100%', maxWidth:'360px' }}>
          <img src={aurLogo} alt="AUR" style={{ height:'28px', width:'auto', marginBottom:'40px', display:'block' }} />

          <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'28px', fontWeight:400, color:'#0D0D0D', marginBottom:'6px' }}>
            Sign in
          </h1>
          <p style={{ fontSize:'13px', color:'#9A948F', marginBottom:'28px' }}>
            Access the AUR Product Lifecycle Platform
          </p>

          <form onSubmit={handleSubmit(onSubmit)} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            <div>
              <label style={{ fontSize:'11px', fontFamily:'DM Mono, monospace', textTransform:'uppercase', letterSpacing:'0.1em', color:'#9A948F', display:'block', marginBottom:'6px' }}>Email</label>
              <input type="email" placeholder="you@aur.com"
                {...register('email', { required: true })}
                style={{ width:'100%', padding:'10px 12px', border:`1px solid ${errors.email ? '#C4663A' : '#EBEBEB'}`, borderRadius:'7px', fontSize:'13px', color:'#0D0D0D', outline:'none', background:'#FFFFFF', fontFamily:'Outfit, sans-serif' }}
              />
            </div>
            <div>
              <label style={{ fontSize:'11px', fontFamily:'DM Mono, monospace', textTransform:'uppercase', letterSpacing:'0.1em', color:'#9A948F', display:'block', marginBottom:'6px' }}>Password</label>
              <input type="password" placeholder="••••••••"
                {...register('password', { required: true })}
                style={{ width:'100%', padding:'10px 12px', border:`1px solid ${errors.password ? '#C4663A' : '#EBEBEB'}`, borderRadius:'7px', fontSize:'13px', color:'#0D0D0D', outline:'none', background:'#FFFFFF', fontFamily:'Outfit, sans-serif' }}
              />
            </div>
            <button type="submit" disabled={loading} style={{
              width:'100%', padding:'11px', background: loading ? '#9A948F' : '#0D0D0D',
              color:'#FFFFFF', border:'none', borderRadius:'7px',
              fontSize:'13px', fontWeight:600, cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily:'Outfit, sans-serif', marginTop:'4px'
            }}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p style={{ fontSize:'11px', color:'#C0BCB8', marginTop:'24px', fontFamily:'DM Mono, monospace' }}>
            Contact your administrator to create an account
          </p>
        </div>
      </div>

      {/* Right panel - decorative */}
      <div className="login-panel" style={{
        width:'420px', background:'#F7F7F5', borderLeft:'1px solid #EBEBEB',
        display:'flex', alignItems:'center', justifyContent:'center', padding:'48px',
        flexDirection:'column', gap:'24px'
      }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'13px', fontWeight:400, color:'#9A948F', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:'32px' }}>Product Lifecycle Management</div>
          {['Design', 'Review', 'Approve', 'Produce'].map((step, i) => (
            <div key={step} style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom: i < 3 ? '0' : '0' }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                <div style={{ width:'32px', height:'32px', borderRadius:'50%', border:'1px solid #EBEBEB', background:'#FFFFFF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontFamily:'DM Mono, monospace', color:'#9A948F' }}>{i+1}</div>
                {i < 3 && <div style={{ width:'1px', height:'24px', background:'#EBEBEB' }} />}
              </div>
              <div style={{ fontSize:'14px', fontWeight: 400, color:'#0D0D0D', paddingBottom: i < 3 ? '24px' : '0' }}>{step}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) { .login-panel { display: none !important; } }
      `}</style>
    </div>
  )
}
