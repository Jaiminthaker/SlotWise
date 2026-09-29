import { createAccessToken, loginUser, registerUser, requestPasswordReset, resetPassword as updatePassword } from '../services/authService.js';

const cookieOptions = { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 };
const publicUser = (user) => ({ id: user.id, name: user.name, email: user.email, role: user.role });

export async function register(req, res) {
  const user = await registerUser(req.validated.body);
  res.cookie('slotwise_token', createAccessToken(user), cookieOptions);
  res.status(201).json({ user: publicUser(user) });
}

export async function login(req, res) {
  const user = await loginUser(req.validated.body);
  res.cookie('slotwise_token', createAccessToken(user), cookieOptions);
  res.json({ user: publicUser(user) });
}

export function logout(req, res) {
  res.clearCookie('slotwise_token', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  res.json({ success: true });
}

export function me(req, res) {
  res.json({ user: publicUser(req.user) });
}

export async function forgotPassword(req, res) {
  await requestPasswordReset(req.validated.body.email);
  res.json({ message: 'If an account exists for that email, a reset link will be sent.' });
}

export async function resetPassword(req, res) {
  await updatePassword(req.validated.body);
  res.json({ message: 'Password reset successfully. You can now sign in.' });
}