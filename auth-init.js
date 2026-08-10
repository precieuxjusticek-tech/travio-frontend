// ─── TRAVIO — Auth, Navigation, Sidebar ───

import { auth } from './firebase-client.js';
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { showToast, TOAST_ICONS } from './toast-utils.js';
import { escapeHtml } from './sanitize.js';

// ════════════════════════════════
//  PAGE LOADER
// ════════════════════════════════
export function hidePageLoader() {
  const loader = document.getElementById('pageLoader');
  if (loader) {
    loader.classList.add('hide');
    setTimeout(() => loader.style.display = 'none', 500);
  }
}

// ════════════════════════════════
//  UTILISATEUR UI
// ════════════════════════════════
export function setUserUI(data) {
  const prenom   = data.prenom || '';
  const nom      = data.nom    || '';
  const initiale = prenom ? prenom[0].toUpperCase() : '?';

  const sidebarName   = document.getElementById('sidebarName');
  const sidebarAvatar = document.getElementById('sidebarAvatar');
  const greeting      = document.getElementById('overviewGreeting');

  if (sidebarName)   sidebarName.textContent  = `${prenom} ${nom}`.trim();
  if (sidebarAvatar) sidebarAvatar.textContent = initiale;
  if (greeting)      greeting.innerHTML        = `Bonjour ${escapeHtml(prenom)} <svg width="20" height="20" viewBox="0 0 16 16" fill="none" style="vertical-align:-3px;"><path d="M8 1a2 2 0 012 2v4M8 1a2 2 0 00-2 2v5M11 5a1.3 1.3 0 012.6 0v3M6 7a1.3 1.3 0 00-2.6 0v1.5c0 3 2 5.5 5 5.5h1c2.5 0 4.5-2 4.5-4.5V7a1.3 1.3 0 00-2.6 0" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

// ════════════════════════════════
//  NAVIGATION
// ════════════════════════════════
const PAGE_TITLES = {
  overview:     'Vue d\'ensemble',
  reservations: 'Réservations',
  trajets:      'Trajets & Bus',
  finances:     'Finances',
  geo:          'Géolocalisation',
  equipe:       'Équipe & PDV',
  agence:       'Mon agence',
};

export function showPage(pageId, navEl) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(`page-${pageId}`);
  if (page) page.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (navEl) navEl.classList.add('active');
  const title = document.getElementById('topbarTitle');
  if (title) title.textContent = PAGE_TITLES[pageId] || pageId;
  if (window.innerWidth <= 700) closeSidebar();
}

// ════════════════════════════════
//  SIDEBAR MOBILE
// ════════════════════════════════
export function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.toggle('open');
}

export function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.remove('open');
}

document.addEventListener('click', (e) => {
  const sidebar = document.getElementById('sidebar');
  const toggle  = document.getElementById('menuToggle');
  if (
    sidebar &&
    sidebar.classList.contains('open') &&
    !sidebar.contains(e.target) &&
    !toggle?.contains(e.target)
  ) {
    closeSidebar();
  }
});

// ════════════════════════════════
//  DÉCONNEXION
// ════════════════════════════════
export async function handleLogout() {
  try {
    await signOut(auth);
    window.location.href = 'auth.html';
  } catch (err) {
    console.error(err);
    showToast('Erreur lors de la déconnexion.', TOAST_ICONS.error);
  }
}

// ════════════════════════════════
//  SUPPORT — BULLE PÉRIODIQUE
// ════════════════════════════════
export function initSupportBubble() {
  const INTERVAL_MS = 6 * 60 * 1000;

  function showBubble() {
    const bubble = document.getElementById('supportBubble');
    if (!bubble) return;
    bubble.style.display = 'block';
    setTimeout(() => { bubble.style.display = 'none'; }, 8000);
  }

  setTimeout(() => {
    showBubble();
    setInterval(showBubble, INTERVAL_MS);
  }, 2 * 60 * 1000);
}

export function goToSupport() {
  const loader = document.getElementById('pageLoader');
  if (loader) {
    loader.style.display = 'flex';
    loader.classList.remove('hide');
  }
  setTimeout(() => { window.location.href = 'support.html'; }, 600);
}

// ════════════════════════════════
//  EXPOSER AU HTML
// ════════════════════════════════
window.showPage      = showPage;
window.toggleSidebar = toggleSidebar;
window.handleLogout  = handleLogout;
window.goToSupport   = goToSupport;