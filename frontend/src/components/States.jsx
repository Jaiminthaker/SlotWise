export function LoadingState({ label = 'Loading' }) {
  return <div className="state-line"><span className="spinner" aria-hidden="true" />{label}</div>;
}

export function ErrorMessage({ error }) {
  if (!error) return null;
  const message = error.response?.data?.error?.message || error.message || 'Unable to load this information';
  return <div className="notice notice-error" role="alert">{message}</div>;
}

export function EmptyState({ title, children }) {
  return <div className="empty-state"><span className="empty-mark">—</span><h3>{title}</h3>{children && <p>{children}</p>}</div>;
}