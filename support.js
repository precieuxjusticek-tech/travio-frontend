import { auth } from './firebase-client.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { showToast, TOAST_ICONS } from './toast-utils.js';
import { apiFetch } from './api.js';

const BACKEND = 'https://travio-backend-pa4q.onrender.com';
let currentUserEmail = null;
let currentAgenceId  = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = 'auth.html'; return; }
  currentUserEmail = user.email;

  try {
    const res  = await  apiFetch(`${BACKEND}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email }),
    });
    const data = await res.json();
    if (data.agenceId) currentAgenceId = data.agenceId;
  } catch (e) { console.error(e); }
});

window.submitSupportMessage = async function() {
  const type    = document.getElementById('supportType')?.value;
  const sujet   = document.getElementById('supportSujet')?.value.trim();
  const message = document.getElementById('supportMessage')?.value.trim();

  if (!type)    { showToast('Sélectionnez un type de demande.', TOAST_ICONS.warning); return; }
  if (!sujet)   { showToast('Entrez un sujet.', TOAST_ICONS.warning); return; }
  if (!message) { showToast('Décrivez votre problème.', TOAST_ICONS.warning); return; }

  const btn = document.getElementById('supportSubmitBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Envoi...'; }

  try {
    const res = await apiFetch(`${BACKEND}/support/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type, sujet, message,
        email:     currentUserEmail,
        agenceId:  currentAgenceId,
        createdAt: new Date().toISOString(),
      }),
    });

    if (res.ok) {
      document.getElementById('supportSuccess').style.display = 'block';
      if (btn) { btn.style.display = 'none'; }
      showToast('Message envoyé avec succès !', TOAST_ICONS.success, true);
    } else {
      showToast('Erreur lors de l\'envoi. Réessayez.', TOAST_ICONS.error);
    }
  } catch (e) {
    showToast('Impossible de contacter le serveur.', TOAST_ICONS.error);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:4px;"><path d="M2 14V2M2 14h12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M6 5l4-3 4 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg> Envoyer au support'; }
  }
};