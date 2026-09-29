import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function AppShell() {
  const { user, logout } = useAuth();
  return (
    <div className="app-frame">
      <header className="topbar">
        <NavLink className="brand" to="/services" aria-label="SlotWise home">
          <span className="brand-mark">s.</span><span>slotwise</span>
        </NavLink>
        <nav className="main-nav" aria-label="Main navigation">
          {user?.role === 'customer' && <><NavLink to="/services">Services</NavLink><NavLink to="/bookings">My bookings</NavLink></>}
          {user?.role === 'provider' && <><NavLink to="/provider">Calendar</NavLink><NavLink to="/provider/availability">Availability</NavLink></>}
          {user?.role === 'admin' && <NavLink to="/admin/services">Manage services</NavLink>}
        </nav>
        <div className="account-actions">
          <span className="account-name">{user?.name}</span>
          <button className="button button-quiet button-small" onClick={() => logout()}>Sign out</button>
        </div>
      </header>
      <main className="page-wrap"><Outlet /></main>
      <footer className="footer"><span>SlotWise</span><span>Good time, well kept.</span></footer>
    </div>
  );
}