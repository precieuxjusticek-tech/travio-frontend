// ─── TRAVIO — PDV — Auth, navigation, drawer ───

import { auth } from '../firebase-client.js';
import { escapeHtml } from '../sanitize.js';
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { ICONS } from './state-pdv.js';

// ════════════════════════════════
//  TITRES DE PAGE
// ════════════════════════════════
export const PAGE_TITLES = {
  accueil:      'Accueil',
  vente:        'Vente de billets',
  reservations: 'Mes réservations',
  trajets:      'Trajets disponibles',
  monpdv:       'Mon point de vente',
  finance:      'Finances',
  colis:        'Colis',
};

// ════════════════════════════════
//  HOOKS PAR PAGE
//  (chaque module s'enregistre lui-même au lieu que showPage
//   ait besoin de connaître tous les autres modules)
// ════════════════════════════════
const pageHooks = {};
export function onPageShow(pageId, fn) {
  pageHooks[pageId] = fn;
}

// ════════════════════════════════
//  LOADER
// ════════════════════════════════
export function hideLoader() {
  const el = document.getElementById('pageLoader');
  if (el) { el.classList.add('hide'); setTimeout(() => el.style.display = 'none', 500); }
}

// ════════════════════════════════
//  UI AGENT
// ════════════════════════════════
export function setAgentUI(session, pdv) {
  const prenom   = session.prenom || '';
  const nom      = session.nom    || '';
  const initiale = prenom ? prenom[0].toUpperCase() : '?';

  const pdvName   = document.getElementById('pdvAgentName');
  const drawerAv  = document.getElementById('drawerAvatar');
  const drawerNm  = document.getElementById('drawerName');
  const greeting  = document.getElementById('accueilGreeting');
  const sub       = document.getElementById('accueilSub');

  if (pdvName)  pdvName.textContent  = `${prenom} ${nom}`.trim();
  if (drawerAv) drawerAv.textContent = initiale;
  if (drawerNm) drawerNm.textContent = `${prenom} ${nom}`.trim();
  if (greeting) greeting.innerHTML = `Bonjour ${escapeHtml(prenom)} ${ICONS.wave}`;
  if (sub && pdv) sub.textContent = `${pdv.nom} — ${pdv.ville || ''}`;
}

// ════════════════════════════════
//  NAVIGATION
// ════════════════════════════════
export function showPage(pageId, navEl) {
  document.querySelectorAll('.pdv-page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(`page-${pageId}`);
  if (page) page.classList.add('active');

  document.querySelectorAll('.drawer-nav-item').forEach(n => n.classList.remove('active'));
  if (navEl) navEl.classList.add('active');

  const title = document.getElementById('topbarPageTitle');
  if (title) title.textContent = PAGE_TITLES[pageId] || pageId;

  closeDrawer();

  pageHooks[pageId]?.();
}

// ════════════════════════════════
//  DRAWER
// ════════════════════════════════
export function toggleDrawer() {
  const drawer   = document.getElementById('pdvDrawer');
  const backdrop = document.getElementById('drawerBackdrop');
  if (!drawer) return;
  const isOpen = drawer.classList.contains('open');
  drawer.classList.toggle('open');
  if (backdrop) backdrop.classList.toggle('show', !isOpen);
}

export function closeDrawer() {
  const drawer   = document.getElementById('pdvDrawer');
  const backdrop = document.getElementById('drawerBackdrop');
  if (drawer)   drawer.classList.remove('open');
  if (backdrop) backdrop.classList.remove('show');
}

// ════════════════════════════════
//  DÉCONNEXION
// ════════════════════════════════
export async function handleLogout() {
  try {
    await signOut(auth);
    window.location.href = 'auth.html';
  } catch (err) {
    console.error(err);
    showToast('Erreur lors de la déconnexion.', ICONS.banned);
  }
}

// ════════════════════════════════
//  TOAST
// ════════════════════════════════
let toastTimer = null;

export function showToast(message, icon = ICONS.warning, success = false) {
  const toast = document.getElementById('pdvToast');
  const msg   = document.getElementById('pdvToastMsg');
  const ico   = document.getElementById('pdvToastIcon');
  if (!toast) return;
  ico.innerHTML = icon;
  msg.textContent = message;
  toast.classList.toggle('success', success);
  toast.classList.remove('show');
  void toast.offsetWidth;
  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}