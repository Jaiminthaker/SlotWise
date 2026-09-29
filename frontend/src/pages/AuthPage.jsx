import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../context/AuthContext.jsx';
import { getApiError } from '../api/client.js';

const loginSchema = z.object({ email: z.string().email('Enter a valid email'), password: z.string().min(1, 'Enter your password') });
const registerSchema = loginSchema.extend({ name: z.string().trim().min(1, 'Enter your name'), password: z.string().min(8, 'Use at least 8 characters') });

export function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitError, setSubmitError] = useState('');
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(isRegister ? registerSchema : loginSchema) });
  if (auth.loading) return <div className="center-page">Loading session...</div>;
  if (auth.user) return <Navigate to={location.state?.from?.pathname || '/services'} replace />;

  async function submit(data) {
    setSubmitError('');
    try {
      const user = isRegister ? await auth.register(data) : await auth.login(data);
      navigate(user.role === 'provider' ? '/provider' : user.role === 'admin' ? '/admin/services' : '/services', { replace: true });
    } catch (error) {
      setSubmitError(getApiError(error));
    }
  }

  return (
    <div className="auth-layout">
      <section className="auth-story">
        <div className="eyebrow">A little room in your day</div>
        <h1>Time well<br /><em>arranged.</em></h1>
        <p>Find a good fit, choose a time, and leave the calendar juggling to us.</p>
        <div className="story-note"><span className="story-line" />Appointments that work around real life.</div>
      </section>
      <section className="auth-panel">
        <p className="eyebrow">{isRegister ? 'Create your account' : 'Welcome back'}</p>
        <h2>{isRegister ? 'Start with a name.' : 'Your next hour awaits.'}</h2>
        <form className="form-stack" onSubmit={handleSubmit(submit)}>
          {isRegister && <label>Name<input autoComplete="name" {...register('name')} />{errors.name && <small>{errors.name.message}</small>}</label>}
          <label>Email<input type="email" autoComplete="email" {...register('email')} />{errors.email && <small>{errors.email.message}</small>}</label>
          <label>Password<input type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} {...register('password')} />{errors.password && <small>{errors.password.message}</small>}</label>
          {submitError && <div className="notice notice-error">{submitError}</div>}
          <button className="button button-primary" disabled={auth.isSubmitting}>{auth.isSubmitting ? 'Working...' : isRegister ? 'Create account' : 'Sign in'}<span aria-hidden="true">↗</span></button>
        </form>
        <p className="form-foot">{isRegister ? 'Already have an account?' : 'New to SlotWise?'} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create an account'}</Link></p>
        {!isRegister && <p className="form-foot"><Link to="/forgot-password">Forgot your password?</Link></p>}
      </section>
    </div>
  );
}