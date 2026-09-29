import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authApi } from '../api/resources.js';
import { getApiError } from '../api/client.js';

const requestSchema = z.object({ email: z.string().email('Enter a valid email') });
const resetSchema = z.object({
  password: z.string().min(8, 'Use at least 8 characters'),
  confirmPassword: z.string()
}).refine((values) => values.password === values.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match'
});

function RecoveryLayout({ eyebrow, title, children }) {
  return <div className="auth-layout">
    <section className="auth-story">
      <div className="eyebrow">A little room in your day</div>
      <h1>Time well<br /><em>arranged.</em></h1>
      <p>Find a good fit, choose a time, and leave the calendar juggling to us.</p>
      <div className="story-note"><span className="story-line" />Appointments that work around real life.</div>
    </section>
    <section className="auth-panel">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {children}
    </section>
  </div>;
}

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [requestError, setRequestError] = useState('');
  const mutation = useMutation({ mutationFn: authApi.requestPasswordReset });
  const form = useForm({ resolver: zodResolver(requestSchema) });

  async function submit({ email }) {
    setRequestError('');
    try {
      await mutation.mutateAsync(email);
      setSent(true);
    } catch (error) {
      setRequestError(getApiError(error));
    }
  }

  return <RecoveryLayout eyebrow="Account recovery" title={sent ? 'Check your inbox.' : 'Reset your password.'}>
    {sent ? <>
      <p className="recovery-copy">If an account exists for that email, a reset link will be sent.</p>
      <Link className="button button-primary recovery-button" to="/login">Back to sign in <span aria-hidden="true">↗</span></Link>
    </> : <form className="form-stack" onSubmit={form.handleSubmit(submit)}>
      <p className="recovery-copy">Enter the email address on your account.</p>
      <label>Email<input type="email" autoComplete="email" {...form.register('email')} />{form.formState.errors.email && <small>{form.formState.errors.email.message}</small>}</label>
      {requestError && <div className="notice notice-error">{requestError}</div>}
      <button className="button button-primary" disabled={mutation.isPending}>{mutation.isPending ? 'Sending...' : 'Send reset link'}<span aria-hidden="true">↗</span></button>
      <p className="form-foot"><Link to="/login">Back to sign in</Link></p>
    </form>}
  </RecoveryLayout>;
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [complete, setComplete] = useState(false);
  const mutation = useMutation({ mutationFn: authApi.resetPassword });
  const form = useForm({ resolver: zodResolver(resetSchema) });

  async function submit({ password }) {
    await mutation.mutateAsync({ token, password });
    setComplete(true);
  }

  if (complete) return <RecoveryLayout eyebrow="Password updated" title="You’re all set.">
    <p className="recovery-copy">Your password has been changed. Sign in with your new password.</p>
    <Link className="button button-primary recovery-button" to="/login">Back to sign in <span aria-hidden="true">↗</span></Link>
  </RecoveryLayout>;

  return <RecoveryLayout eyebrow="Account recovery" title="Choose a new password.">
    {!token ? <div className="notice notice-error">This reset link is invalid or incomplete. Request a new one.</div> : <form className="form-stack" onSubmit={form.handleSubmit(submit)}>
      <label>New password<input type="password" autoComplete="new-password" {...form.register('password')} />{form.formState.errors.password && <small>{form.formState.errors.password.message}</small>}</label>
      <label>Confirm new password<input type="password" autoComplete="new-password" {...form.register('confirmPassword')} />{form.formState.errors.confirmPassword && <small>{form.formState.errors.confirmPassword.message}</small>}</label>
      {mutation.error && <div className="notice notice-error">{getApiError(mutation.error)}</div>}
      <button className="button button-primary" disabled={mutation.isPending}>{mutation.isPending ? 'Updating...' : 'Update password'}<span aria-hidden="true">↗</span></button>
    </form>}
    <p className="form-foot"><Link to="/forgot-password">Request another reset link</Link></p>
  </RecoveryLayout>;
}