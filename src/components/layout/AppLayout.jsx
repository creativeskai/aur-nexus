import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#FFFFFF' }}>
      <Sidebar />
      <main className="app-main" style={{ flex:1, minHeight:'100vh', overflowX:'hidden' }}>
        <div className="app-content" style={{ maxWidth:'1200px', margin:'0 auto', padding:'28px 32px' }}>
          <Outlet />
        </div>
      </main>
      <style>{`
        .app-main { margin-left: 216px; }
        @media (max-width: 768px) {
          .app-main { margin-left: 0 !important; padding-top: 52px; padding-bottom: 72px; }
          .app-content { padding: 16px !important; }
        }
      `}</style>
    </div>
  )
}
