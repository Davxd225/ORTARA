import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AdminCatalog from './pages/AdminCatalog.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import AdminLogin from './pages/AdminLogin.jsx'
import AdminPromotions from './pages/AdminPromotions.jsx'
import AdminSettings from './pages/AdminSettings.jsx'
import Boutique from './pages/Boutique.jsx'
import Catalogue from './pages/Catalogue.jsx'
import ClientProfile from './pages/ClientProfile.jsx'
import StoreSettingsProvider from './StoreSettingsProvider.jsx'

function ProtectedAdmin({ page = 'dashboard' }) {
  return sessionStorage.getItem('adminToken') ? (
    page === 'catalog' ? (
      <AdminCatalog />
    ) : page === 'promotions' ? (
      <AdminPromotions />
    ) : page === 'settings' ? (
      <AdminSettings />
    ) : (
      <AdminDashboard />
    )
  ) : (
    <Navigate to="/admin/login" replace />
  )
}

function App() {
  return (
    <BrowserRouter>
      <StoreSettingsProvider>
        <Routes>
          <Route path="/" element={<Catalogue />} />
          <Route path="/boutique" element={<Boutique />} />
          <Route path="/profil" element={<ClientProfile />} />
          <Route path="/categorie/:slug" element={<Catalogue />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/catalog" element={<ProtectedAdmin page="catalog" />} />
          <Route path="/admin/promotions" element={<ProtectedAdmin page="promotions" />} />
          <Route path="/admin/settings" element={<ProtectedAdmin page="settings" />} />
          <Route path="/admin" element={<ProtectedAdmin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </StoreSettingsProvider>
    </BrowserRouter>
  )
}

export default App
