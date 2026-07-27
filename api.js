// api.js
import { auth } from './firebase-client.js';

export async function apiFetch(url, options = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error('Utilisateur non connecté');

  const token = await user.getIdToken();

  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (res.status === 401) {
    window.location.href = 'auth.html';
    throw new Error('Session expirée');
  }

  return res;
}