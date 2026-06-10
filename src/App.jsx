import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'

import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/DashboardPage'
import DesignsListPage from './pages/designs/DesignsListPage'
import DesignUploadPage from './pages/designs/DesignUploadPage'
import DesignDetailPage from './pages/designs/DesignDetailPage'
import DesignEditPage from './pages/designs/DesignEditPage'
import CollectionsPage from './pages/collections/CollectionsPage'
import AdminApprovalsPage from './pages/admin/AdminApprovalsPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import ProductionPage from './pages/production/ProductionPage'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/designs" element={<DesignsListPage />} />
              <Route path="/designs/new" element={
                <ProtectedRoute allowedRoles={['designer', 'admin']}>
                  <DesignUploadPage />
                </ProtectedRoute>
              } />
              <Route path="/designs/:id" element={<DesignDetailPage />} />
              <Route path="/designs/:id/edit" element={<DesignEditPage />} />
              <Route path="/collections" element={<CollectionsPage />} />
              <Route path="/admin/approvals" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminApprovalsPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminUsersPage />
                </ProtectedRoute>
              } />
              <Route path="/production" element={
                <ProtectedRoute allowedRoles={['admin', 'production']}>
                  <ProductionPage />
                </ProtectedRoute>
              } />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="bottom-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  )
}
