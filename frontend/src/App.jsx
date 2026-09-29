import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { AuthPage } from './pages/AuthPage.jsx';
import { ForgotPasswordPage, ResetPasswordPage } from './pages/PasswordRecoveryPages.jsx';
import { ServicesPage } from './pages/ServicesPage.jsx';
import { BookSlotPage } from './pages/BookSlotPage.jsx';
import { MyBookingsPage } from './pages/MyBookingsPage.jsx';
import { ProviderDashboardPage } from './pages/ProviderDashboardPage.jsx';
import { AvailabilityEditorPage } from './pages/AvailabilityEditorPage.jsx';
import { AdminServicesPage } from './pages/AdminServicesPage.jsx';

export default function App() {
  return <Routes>
    <Route path="/login" element={<AuthPage mode="login" />} />
    <Route path="/register" element={<AuthPage mode="register" />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route element={<ProtectedRoute />}><Route element={<AppShell />}>
      <Route index element={<Navigate to="/services" replace />} />
      <Route element={<ProtectedRoute roles={['customer']} />}>
        <Route path="services" element={<ServicesPage />} />
        <Route path="book" element={<BookSlotPage />} />
        <Route path="bookings" element={<MyBookingsPage />} />
      </Route>
      <Route element={<ProtectedRoute roles={['provider']} />}>
        <Route path="provider" element={<ProviderDashboardPage />} />
        <Route path="provider/availability" element={<AvailabilityEditorPage />} />
      </Route>
      <Route element={<ProtectedRoute roles={['admin']} />}><Route path="admin/services" element={<AdminServicesPage />} /></Route>
    </Route></Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}