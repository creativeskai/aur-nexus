import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LayoutDashboard, Upload, FolderOpen, CheckSquare, Package, LogOut, Users, Menu, X } from 'lucide-react'
import { useState } from 'react'
import aurLogo from '../../assets/aur-logo.png'

const navByRole = {
  designer:   [{ to:'/dashboard',icon:LayoutDashboard,label:'Dashboard'},{to:'/designs',icon:FolderOpen,label:'My Designs'},{to:'/designs/new',icon:Upload,label:'Upload'},{to:'/collections',icon:Package,label:'Collections'}],
  sales:      [{ to:'/dashboard',icon:LayoutDashboard,label:'Dashboard'},{to:'/designs',icon:FolderOpen,label:'Designs'}],
  marketing:  [{ to:'/dashboard',icon:LayoutDashboard,label:'Dashboard'},{to:'/designs',icon:FolderOpen,label:'Designs'}],
  production: [{ to:'/dashboard',icon:LayoutDashboard,label:'Dashboard'},{to:'/production',icon:Package,label:'Production'}],
  admin:      [{ to:'/dashboard',icon:LayoutDashboard,label:'Dashboard'},{to:'/designs',icon:FolderOpen,label:'All Designs'},{to:'/designs/new',icon:Upload,label:'Upload'},{to:'/collections',icon:Package,label:'Collections'},{to:'/admin/approvals',icon:CheckSquare,label:'Approvals'},{to:'/admin/users',icon:Users,label:'Users'},{to:'/production',icon:Package,label:'Production'}],
}

const link = (active) => ({
  display:'flex', alignItems:'center', gap:'9px', padding:'8px 10px',
  borderRadius:'7px', fontSize:'13px', textDecoration:'none', marginBottom:'1px',
  background: active ? '#F2F2EF' : 'transparent',
  color: active ? '#0D0D0D' : '#9A948F',
  fontWeight: active ? 500 : 400,
  transition: 'all 0.12s',
})

export function Sidebar() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const nav = navByRole[profile?.role] || []

  const NavItems = ({ onClick }) => nav.map(({ to, icon: Icon, label }) => (
    <NavLink key={to} to={to} onClick={onClick} style={({ isActive }) => link(isActive)}>
      <Icon size={15} strokeWidth={1.5} />{label}
    </NavLink>
  ))

  return (
    <>
      {/* ── DESKTOP ── */}
      <aside className="desktop-sidebar" style={{
        width:'216px', minWidth:'216px', height:'100vh', display:'flex', flexDirection:'column',
        background:'#FFFFFF', position:'fixed', left:0, top:0, zIndex:40,
        borderRight:'1px solid #EBEBEB'
      }}>
        <div style={{ padding:'20px 16px 16px', borderBottom:'1px solid #EBEBEB' }}>
          <img src={aurLogo} alt="AUR" style={{ height:'22px', width:'auto', display:'block' }} />
          <div style={{ fontSize:'9px', fontFamily:'DM Mono, monospace', color:'#C0BCB8', letterSpacing:'0.2em', textTransform:'uppercase', marginTop:'5px' }}>PLM Platform</div>
        </div>
        <nav style={{ flex:1, padding:'10px 8px', overflowY:'auto' }}>
          <NavItems />
        </nav>
        <div style={{ padding:'10px 8px 14px', borderTop:'1px solid #EBEBEB' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'9px', padding:'8px 10px', marginBottom:'2px' }}>
            <div style={{ width:'26px', height:'26px', borderRadius:'50%', background:'#F2F2EF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:600, color:'#9A948F', flexShrink:0 }}>
              {profile?.full_name?.charAt(0)}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:'12px', fontWeight:500, color:'#0D0D0D', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{profile?.full_name}</div>
              <div style={{ fontSize:'10px', color:'#C0BCB8', textTransform:'capitalize', fontFamily:'DM Mono, monospace' }}>{profile?.role}</div>
            </div>
          </div>
          <button onClick={async () => { await signOut(); navigate('/login') }} style={{ display:'flex', alignItems:'center', gap:'9px', padding:'7px 10px', width:'100%', borderRadius:'7px', fontSize:'12px', color:'#C0BCB8', background:'transparent', border:'none', cursor:'pointer' }}>
            <LogOut size={13} strokeWidth={1.5} /> Sign out
          </button>
        </div>
      </aside>

      {/* ── MOBILE TOPBAR ── */}
      <div className="mobile-topbar" style={{
        display:'none', position:'fixed', top:0, left:0, right:0, zIndex:50,
        background:'#FFFFFF', height:'52px', alignItems:'center', justifyContent:'space-between',
        padding:'0 16px', borderBottom:'1px solid #EBEBEB'
      }}>
        <img src={aurLogo} alt="AUR" style={{ height:'18px', width:'auto' }} />
        <button onClick={() => setOpen(true)} style={{ background:'none', border:'none', cursor:'pointer', color:'#0D0D0D', display:'flex', padding:'8px' }}>
          <Menu size={20} strokeWidth={1.5} />
        </button>
      </div>

      {/* ── MOBILE DRAWER ── */}
      {open && (
        <div style={{ position:'fixed', inset:0, zIndex:60 }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.3)' }} onClick={() => setOpen(false)} />
          <div style={{ position:'absolute', top:0, left:0, bottom:0, width:'260px', background:'#FFFFFF', display:'flex', flexDirection:'column', boxShadow:'4px 0 20px rgba(0,0,0,0.08)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', borderBottom:'1px solid #EBEBEB' }}>
              <img src={aurLogo} alt="AUR" style={{ height:'18px', width:'auto' }} />
              <button onClick={() => setOpen(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9A948F' }}>
                <X size={18} />
              </button>
            </div>
            <nav style={{ flex:1, padding:'12px 10px', overflowY:'auto' }}>
              <NavItems onClick={() => setOpen(false)} />
            </nav>
            <div style={{ padding:'10px', borderTop:'1px solid #EBEBEB' }}>
              <button onClick={async () => { await signOut(); navigate('/login') }} style={{ display:'flex', alignItems:'center', gap:'9px', padding:'10px', width:'100%', borderRadius:'7px', fontSize:'13px', color:'#9A948F', background:'transparent', border:'none', cursor:'pointer' }}>
                <LogOut size={14} strokeWidth={1.5} /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE BOTTOM NAV ── */}
      <div className="mobile-bottomnav" style={{
        display:'none', position:'fixed', bottom:0, left:0, right:0, zIndex:50,
        background:'#FFFFFF', borderTop:'1px solid #EBEBEB',
        paddingBottom:'env(safe-area-inset-bottom, 0px)'
      }}>
        {nav.slice(0,4).map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({
            flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'3px',
            padding:'8px 0 6px', textDecoration:'none',
            color: isActive ? '#0D0D0D' : '#C0BCB8',
            fontSize:'9px', fontFamily:'DM Mono, monospace', textTransform:'uppercase', letterSpacing:'0.05em'
          })}>
            <Icon size={19} strokeWidth={1.5} />{label}
          </NavLink>
        ))}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-topbar { display: flex !important; }
          .mobile-bottomnav { display: flex !important; }
        }
      `}</style>
    </>
  )
}
