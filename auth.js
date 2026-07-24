// ─── TRAVIO — Auth (connecté Firebase + Backend) ───

import { auth } from './firebase-client.js';
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const BACKEND = 'http://localhost:3000';

// ════════════════════════════════
//  ICÔNES TOAST
// ════════════════════════════════
const TOAST_ICONS = {
  warning: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5L14.5 13a1 1 0 01-.87 1.5H2.37a1 1 0 01-.87-1.5L8 1.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M8 6v3.5M8 12v.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  success: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M5 8l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  error: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  lock: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="7" width="10" height="7" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  mail: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M1 5l7 5 7-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  wave: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 9c1 2 3 3 6 3s5-1 6-3M2 6c1-2 3-3 6-3s5 1 6 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  blocked: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M3.5 3.5l9 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  clock: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M8 4.5V8l2.5 1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

// ════════════════════════════════
//  NAVIGATION
// ════════════════════════════════
let currentScreen = 'screen-home';

function goTo(targetId) {
  const current = document.getElementById(currentScreen);
  const target  = document.getElementById(targetId);
  if (!target || targetId === currentScreen) return;

  current.classList.remove('active');
  current.classList.add('slide-out');
  target.classList.add('active');

  setTimeout(() => current.classList.remove('slide-out'), 450);
  currentScreen = targetId;
}

// ════════════════════════════════
//  TOAST
// ════════════════════════════════
let toastTimer = null;

function showToast(message, iconKey = 'warning') {
  let toast = document.getElementById('travio-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'travio-toast';
    toast.className = 'toast';
    toast.innerHTML = `<span class="toast-icon"></span><span class="toast-msg"></span>`;
    document.body.appendChild(toast);
  }

  toast.querySelector('.toast-icon').innerHTML = TOAST_ICONS[iconKey] || TOAST_ICONS.warning;
  toast.querySelector('.toast-msg').textContent  = message;

  toast.classList.remove('show');
  void toast.offsetWidth;
  toast.classList.add('show');

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

// ════════════════════════════════
//  UTILITAIRES
// ════════════════════════════════

// Highlight les champs vides
function highlightEmpty(ids) {
  let hasEmpty = false;
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (!el.value.trim()) {
      el.classList.add('error');
      hasEmpty = true;
      el.addEventListener('input', () => el.classList.remove('error'), { once: true });
    }
  });
  return hasEmpty;
}

// Mettre un bouton en état de chargement
function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled    = loading;
  btn.textContent = loading ? 'Chargement...' : btn.dataset.label;
}

// Toggle mot de passe
function togglePassword(inputId, btn) {
  const input    = document.getElementById(inputId);
  const isHidden = input.type === 'password';
  input.type     = isHidden ? 'text' : 'password';

  btn.innerHTML = isHidden
    ? `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 2l12 12M6.5 6.6A2 2 0 0110 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M4.5 4.6C2.8 5.7 1 8 1 8s2.5 5 7 5c1.4 0 2.6-.4 3.6-1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M8 3c4.5 0 7 5 7 5s-.7 1.4-2 2.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>`
    : `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" stroke-width="1.5"/>
        <circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.5"/>
      </svg>`;
}

// ════════════════════════════════
//  INSCRIPTION
// ════════════════════════════════
async function handleRegister() {
  const hasEmpty = highlightEmpty(['reg-prenom', 'reg-nom', 'reg-email', 'reg-password', 'reg-confirm']);
  if (hasEmpty) { showToast('Veuillez remplir tous les champs.'); return; }

  const prenom   = document.getElementById('reg-prenom').value.trim();
  const nom      = document.getElementById('reg-nom').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirm  = document.getElementById('reg-confirm').value;

  if (password !== confirm) {
    document.getElementById('reg-confirm').classList.add('error');
    showToast('Les mots de passe ne correspondent pas.', 'lock');
    return;
  }

  if (password.length < 6) {
    document.getElementById('reg-password').classList.add('error');
    showToast('Le mot de passe doit faire au moins 6 caractères.', 'lock');
    return;
  }

  // ── LOADING ON ──
  const btn = document.querySelector('#screen-register .btn-submit');
  const originalText = btn.innerHTML;
  btn.disabled   = true;
  btn.innerHTML  = '<span class="spinner"></span> Création du compte...';

  try {
    const res  = await fetch(`${BACKEND}/auth/register`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ prenom, nom, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || 'Erreur lors de l\'inscription.', 'error');
      btn.disabled    = false;
      btn.innerHTML = originalText;
      return;
    }

    await signInWithEmailAndPassword(auth, email, password);

    // Attendre que Firebase confirme l'état auth avant de rediriger
    await new Promise((resolve) => {
      const unsub = auth.onAuthStateChanged((user) => {
        if (user) { unsub(); resolve(); }
      });
    });

    btn.innerHTML = `${TOAST_ICONS.success} Compte créé !`;
    showToast('Compte créé avec succès !', 'success');
    setTimeout(() => window.location.href = 'dashboard.html', 1500);

  } catch (err) {
    console.error(err);
    showToast('Impossible de contacter le serveur.', 'error');
    btn.disabled    = false;
    btn.innerHTML = originalText;
  }
}

// ════════════════════════════════
//  CONNEXION
// ════════════════════════════════
async function handleLogin() {
  const hasEmpty = highlightEmpty(['login-email', 'login-password']);
  if (hasEmpty) { showToast('Veuillez remplir tous les champs.'); return; }

  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  // ── LOADING ON ──
  const btn = document.querySelector('#screen-login .btn-submit');
  const originalText = btn.innerHTML;
  btn.disabled  = true;
  btn.innerHTML = '<span class="spinner"></span> Connexion en cours...';

  try {
    await signInWithEmailAndPassword(auth, email, password);

    const res  = await fetch(`${BACKEND}/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email }),
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || 'Erreur lors de la connexion.', 'error');
      btn.disabled    = false;
      btn.innerHTML = originalText;
      return;
    }

    sessionStorage.setItem('travio_user', JSON.stringify({
      uid:      data.uid,
      prenom:   data.prenom,
      nom:      data.nom,
      role:     data.role,
      agenceId: data.agenceId,
    }));

    if (data.role === 'agent') {
      showToast('Utilisez l\'accès Point de vente pour vous connecter.', 'blocked');
      btn.disabled  = false;
      btn.innerHTML = originalText;
      return;
    }

    btn.innerHTML = `${TOAST_ICONS.wave} Bienvenue ${data.prenom} !`;
    showToast(`Bienvenue ${data.prenom} !`, 'wave');
    setTimeout(() => window.location.href = 'dashboard.html', 1500);

  } catch (err) {
    btn.disabled    = false;
    btn.innerHTML = originalText;

    if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
      showToast('Email ou mot de passe incorrect.', 'error');
    } else if (err.code === 'auth/too-many-requests') {
      showToast('Trop de tentatives. Réessayez plus tard.', 'clock');
    } else {
      console.error(err);
      showToast('Impossible de contacter le serveur.', 'error');
    }
  }
}

// ════════════════════════════════
//  CONNEXION POINT DE VENTE
// ════════════════════════════════
async function handlePdvLogin() {
  const hasEmpty = highlightEmpty(['pdv-email', 'pdv-password']);
  if (hasEmpty) { showToast('Veuillez remplir tous les champs.'); return; }

  const email    = document.getElementById('pdv-email').value.trim();
  const password = document.getElementById('pdv-password').value;

  // ── LOADING ON ──
  const btn = document.querySelector('#screen-pdv .btn-submit');
  const originalText = btn.innerHTML;
  btn.disabled  = true;
  btn.innerHTML = '<span class="spinner"></span> Connexion en cours...';

  try {
    await signInWithEmailAndPassword(auth, email, password);

    const res  = await fetch(`${BACKEND}/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email }),
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || 'Erreur de connexion.', 'error');
      btn.disabled  = false;
      btn.innerHTML = originalText;
      return;
    }

    if (data.role !== 'agent') {
      showToast('Accès non autorisé pour ce compte.', 'blocked');
      btn.disabled  = false;
      btn.innerHTML = originalText;
      return;
    }

    sessionStorage.setItem('travio_pdv', JSON.stringify({
      uid:      data.uid,
      prenom:   data.prenom,
      nom:      data.nom,
      role:     data.role,
      agenceId: data.agenceId,
      pdvId:    data.pdvId || null,
    }));

    btn.innerHTML = `${TOAST_ICONS.wave} Bienvenue ${data.prenom} !`;
    showToast(`Bienvenue ${data.prenom} !`, 'wave');
    setTimeout(() => window.location.href = 'dashboard-pdv.html', 1500);

  } catch (err) {
    btn.disabled  = false;
    btn.innerHTML = originalText;

    if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
      showToast('Email ou mot de passe incorrect.', 'error');
    } else if (err.code === 'auth/too-many-requests') {
      showToast('Trop de tentatives. Réessayez plus tard.', 'clock');
    } else {
      console.error(err);
      showToast('Impossible de contacter le serveur.', 'error');
    }
  }
}

// ════════════════════════════════
//  MOT DE PASSE OUBLIÉ
// ════════════════════════════════
async function handleForgot() {
  const hasEmpty = highlightEmpty(['forgot-email']);
  if (hasEmpty) { showToast('Entrez votre adresse email.', 'mail'); return; }

  const email = document.getElementById('forgot-email').value.trim();

  try {
    // 1. Vérifier que l'email existe via notre backend
    const res = await fetch(`${BACKEND}/auth/forgot-password`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email }),
    });

    // 2. Firebase envoie l'email de reset directement
    await sendPasswordResetEmail(auth, email);

    showToast('Lien envoyé ! Vérifiez votre boîte mail.', 'mail');

    setTimeout(() => goTo('screen-login'), 2000);

  } catch (err) {
    if (err.code === 'auth/invalid-email') {
      showToast('Adresse email invalide.', 'error');
    } else {
      console.error(err);
      // On ne révèle pas si l'email existe ou non
      showToast('Si cet email existe, un lien vous sera envoyé.', 'mail');
    }
  }
}

// ════════════════════════════════
//  EXPOSER LES FONCTIONS AU HTML
// ════════════════════════════════
window.goTo            = goTo;
window.togglePassword  = togglePassword;
window.handleRegister  = handleRegister;
window.handleLogin     = handleLogin;
window.handlePdvLogin  = handlePdvLogin;
window.handleForgot    = handleForgot;