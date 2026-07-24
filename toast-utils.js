// ─── TRAVIO — Utilitaires Toast & UI partagés ───

export const TOAST_ICONS = {
  warning: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2L1 14h14L8 2z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M8 6.5v3.5M8 12v.1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  error:   '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.4"/><path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  success: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.4"/><path d="M5 8l2 2 4-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  info:    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.4"/><path d="M8 7v4M8 5v.1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  image:   '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="12" rx="2" stroke="currentColor" stroke-width="1.4"/><circle cx="5" cy="6" r="1.3" stroke="currentColor" stroke-width="1.3"/><path d="M2 12l4-4 3 3 3-3 3 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

// ════════════════════════════════
//  TOAST
// ════════════════════════════════
let toastTimer = null;

export function showToast(message, icon = TOAST_ICONS.warning, success = false) {
  const toast = document.getElementById('dashToast');
  const msg   = document.getElementById('dashToastMsg');
  const ico   = document.getElementById('dashToastIcon');
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

export function showToastAction(message, icon = TOAST_ICONS.info, actionLabel = '', actionFn = null) {
  showToast(message, icon, false);
}

// ════════════════════════════════
//  LOADING BOUTON
// ════════════════════════════════
export function setBtnLoading(btn, loading, steps = []) {
  if (!btn) return;
  btn.disabled = loading;
  if (loading) {
    btn.dataset.original = btn.innerHTML;
    btn.innerHTML = `<span class="btn-spinner"></span><span>${steps[0] || 'Chargement...'}</span>`;
    btn._stepInterval = setInterval(() => {
      let cur = btn._stepIndex || 0;
      cur = (cur + 1) % steps.length;
      btn._stepIndex = cur;
      const span = btn.querySelector('span:last-child');
      if (span) span.textContent = steps[cur];
    }, 1800);
  } else {
    clearInterval(btn._stepInterval);
    btn._stepIndex = 0;
    btn.innerHTML = btn.dataset.original || btn.innerHTML;
  }
}

// ════════════════════════════════
//  TOGGLE MOT DE PASSE (champs création/edit)
// ════════════════════════════════
export function togglePdvPassword(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  btn.style.color = isHidden ? 'var(--accent)' : 'var(--muted)';
}

// ════════════════════════════════
//  TOGGLE JOURS (création bus/départ)
// ════════════════════════════════
export function toggleTousJours(btn) {
  const isTous = btn.classList.contains('active');
  if (isTous) return;
  document.querySelectorAll('.jour-toggle-btn[data-jour]').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

export function toggleJour(btn) {
  const tousBtn = document.querySelector('.jour-toggle-btn[data-tous]');
  if (tousBtn) tousBtn.classList.remove('active');
  btn.classList.toggle('active');
}

// ════════════════════════════════
//  TOGGLE MOT DE PASSE DÉTAIL PDV
// ════════════════════════════════
export function toggleDetailPassword(password, btn) {
  const span = document.getElementById('detailPassword');
  if (!span) return;
  const isHidden = span.textContent === '••••••••';
  span.textContent = isHidden ? (password || 'Non disponible') : '••••••••';
  btn.style.color  = isHidden ? 'var(--accent)' : 'var(--muted)';
}
window.toggleDetailPassword = toggleDetailPassword;