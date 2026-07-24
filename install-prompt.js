// ─── TRAVIO — Prompt d'installation PWA (PC / Android / iPhone) ───
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.error('Erreur enregistrement service worker :', err);
    });
  });
}

const ICONS = {
  close: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  check: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.5"/><path d="M5 8l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  download: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2v9M4 7l4 4 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 13h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  share: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1v9M4.5 4.5L8 1l3.5 3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 8v5a1 1 0 001 1h8a1 1 0 001-1V8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

const STORAGE_KEY = 'travio_install_prompt_dismissed';
const RAPPEL_HEURES = 8;
const DELAI_MIN_MS = 2 * 60 * 1000; // 2 minutes
const DELAI_MAX_MS = 5 * 60 * 1000; // 5 minutes

function delaiAleatoire() {
  return Math.floor(Math.random() * (DELAI_MAX_MS - DELAI_MIN_MS + 1)) + DELAI_MIN_MS;
}

let deferredPrompt = null;
let promptCaptured = false;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  promptCaptured = true;
});

// ════════════════════════════════
//  DÉTECTION PLATEFORME / ÉTAT
// ════════════════════════════════
function estDejaInstalle() {
  const standalonePWA = window.matchMedia('(display-mode: standalone)').matches;
  const standaloneIOS = window.navigator.standalone === true;
  return standalonePWA || standaloneIOS;
}

function estIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function doitReafficher() {
  const dismissedAt = localStorage.getItem(STORAGE_KEY);
  if (!dismissedAt) return true;
  const heuresEcoulees = (Date.now() - Number(dismissedAt)) / 3600000;
  return heuresEcoulees >= RAPPEL_HEURES;
}

function marquerReporte() {
  localStorage.setItem(STORAGE_KEY, Date.now().toString());
}

// ════════════════════════════════
//  CSS
// ════════════════════════════════
const INSTALL_CSS = `
<style id="installPromptStyles">
  .install-overlay { position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity .3s ease; }
  .install-overlay.show { opacity: 1; pointer-events: all; }
  .install-backdrop { position: absolute; inset: 0; background: rgba(10,14,26,0.85); backdrop-filter: blur(6px); }
  .install-card { position: relative; z-index: 1; background: #0F1525; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 26px 22px 22px; width: 100%; max-width: 340px; margin: 16px; text-align: center; transform: translateY(20px); opacity: 0; transition: transform .35s cubic-bezier(0.34,1.1,.64,1), opacity .3s ease; }
  .install-overlay.show .install-card { transform: translateY(0); opacity: 1; }
  .install-close { position: absolute; top: 14px; right: 14px; background: #1A2236; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; color: #7A8BA8; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
  .install-icon-wrap { width: 64px; height: 64px; margin: 0 auto 14px; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,229,160,0.15); }
  .install-icon-img { width: 100%; height: 100%; object-fit: cover; }
  .install-title { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 800; color: #fff; margin: 0 0 6px; }
  .install-subtitle { font-size: 12.5px; color: #7A8BA8; line-height: 1.5; margin: 0 0 16px; }
  .install-steps { text-align: left; display: flex; flex-direction: column; gap: 10px; padding: 12px 14px; background: #131C31; border: 1px solid rgba(255,255,255,0.06); border-radius: 11px; margin-bottom: 16px; }
  .install-step-item { display: flex; align-items: center; gap: 10px; font-size: 12px; color: #fff; }
  .install-step-num { background: #1A2236; color: #5DCAA5; width: 20px; height: 20px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 11px; flex-shrink: 0; }
  .install-btn-primary { width: 100%; background: #00E5A0; color: #0A0E1A; border: none; border-radius: 11px; padding: 12px; font-size: 13.5px; font-weight: 700; font-family: 'DM Sans', sans-serif; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; margin-bottom: 8px; }
  .install-btn-secondary { width: 100%; background: transparent; color: #7A8BA8; border: none; padding: 8px; font-size: 12.5px; font-weight: 600; cursor: pointer; }
</style>`;

function ensureCssInjected() {
  if (!document.getElementById('installPromptStyles')) {
    document.head.insertAdjacentHTML('beforeend', INSTALL_CSS);
  }
}

// ════════════════════════════════
//  CONSTRUCTION DU MODAL
// ════════════════════════════════
function buildModalPC() {
  return `
    <div class="install-icon-wrap">
      <img src="images/travio-logs.png" alt="Travio" class="install-icon-img">
    </div>
    <h2 class="install-title">Installer Travio</h2>
    <p class="install-subtitle">Un accès direct depuis votre bureau, sans passer par le navigateur.</p>
    <button class="install-btn-primary" onclick="window.triggerInstallTravio()">
      ${ICONS.download} Installer
    </button>
    <button class="install-btn-secondary" onclick="window.closeInstallModalTravio()">Plus tard</button>`;
}

function buildModalIOS() {
  return `
    <div class="install-icon-wrap">
      <img src="images/travio-logs.png" alt="Travio" class="install-icon-img">
    </div>
    <h2 class="install-title">Installer Travio</h2>
    <p class="install-subtitle">Ajoutez l'application à votre écran d'accueil en 2 étapes.</p>
    <div class="install-steps">
      <div class="install-step-item">
        <span class="install-step-num">1</span>
        Touchez ${ICONS.share} en bas de l'écran
      </div>
      <div class="install-step-item">
        <span class="install-step-num">2</span>
        Choisissez "Sur l'écran d'accueil"
      </div>
    </div>
    <button class="install-btn-secondary" onclick="window.closeInstallModalTravio()">J'ai compris</button>`;
}

function afficherModal(contenuHTML) {
  ensureCssInjected();

  const existing = document.getElementById('installPromptOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'installPromptOverlay';
  overlay.className = 'install-overlay';
  overlay.innerHTML = `
    <div class="install-backdrop" onclick="window.closeInstallModalTravio()"></div>
    <div class="install-card">
      <button class="install-close" onclick="window.closeInstallModalTravio()">${ICONS.close}</button>
      ${contenuHTML}
    </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
}

function closeInstallModalTravio() {
  const overlay = document.getElementById('installPromptOverlay');
  if (overlay) {
    overlay.classList.remove('show');
    setTimeout(() => overlay.remove(), 300);
  }
  marquerReporte();
}
window.closeInstallModalTravio = closeInstallModalTravio;

async function triggerInstallTravio() {
  closeInstallModalTravio();
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
}
window.triggerInstallTravio = triggerInstallTravio;

// ════════════════════════════════
//  INIT — à appeler depuis dashboard.js / dashboard-pdv.js
// ════════════════════════════════
export function initInstallPrompt() {
  if (estDejaInstalle()) return;
  if (!doitReafficher()) return;

  if (estIOS()) {
    setTimeout(() => afficherModal(buildModalIOS()), delaiAleatoire());
    return;
  }

  if (promptCaptured) {
    setTimeout(() => afficherModal(buildModalPC()), delaiAleatoire());
  } else {
    window.addEventListener('beforeinstallprompt', () => {
      setTimeout(() => afficherModal(buildModalPC()), delaiAleatoire());
    }, { once: true });
  }
}