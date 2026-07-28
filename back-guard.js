// ─── TRAVIO — Garde anti-retour (partagé admin + PDV) ───

let initialized = false;

function ensureModal() {
  if (document.getElementById('quitTravioOverlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'quitTravioOverlay';
  overlay.className = 'congrats-overlay';
  overlay.innerHTML = `
    <div class="congrats-backdrop" onclick="closeQuitTravioModal()"></div>
    <div class="congrats-card">
      <div class="congrats-text">
        <span class="congrats-badge">⚠️ Attention</span>
        <h2>Quitter <em>Travio</em> ?</h2>
        <p>Vous êtes sur le point de quitter votre espace de gestion. Voulez-vous vraiment continuer ?</p>
      </div>
      <div class="congrats-actions">
        <button class="congrats-btn-primary" onclick="confirmQuitTravio()">Oui, quitter</button>
        <button class="congrats-btn-secondary" onclick="closeQuitTravioModal()">Non, rester</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function showQuitTravioModal() {
  document.getElementById('quitTravioOverlay')?.classList.add('show');
}

function closeQuitTravioModal() {
  document.getElementById('quitTravioOverlay')?.classList.remove('show');
}

function showClosableScreen() {
  document.body.innerHTML = `
    <div style="
      position:fixed; inset:0; z-index:99999;
      display:flex; align-items:center; justify-content:center;
      background:#0A0E1A; color:#F4F6FF;
      font-family:'Inter',sans-serif; text-align:center; padding:24px;
    ">
      <div>
        <div style="font-size:40px; margin-bottom:14px;">👋</div>
        <h2 style="font-family:'Manrope',sans-serif; font-size:20px; font-weight:800; margin-bottom:8px;">
          À bientôt sur Travio
        </h2>
        <p style="color:#7A8BA8; font-size:14px;">
          Vous pouvez fermer cet onglet en toute sécurité.
        </p>
      </div>
    </div>
  `;
}

/**
 * initBackGuard()
 * Aucun paramètre requis — ne déconnecte plus l'utilisateur.
 */
export function initBackGuard() {
  if (initialized) return; // évite un double-init si jamais appelé 2x
  initialized = true;

  ensureModal();

  window.closeQuitTravioModal = closeQuitTravioModal;
  window.confirmQuitTravio = () => {
    closeQuitTravioModal();

    window.close(); // tente la fermeture réelle — fonctionne en PWA installée

    // Si on est toujours là après un court délai, la fermeture a été bloquée
    // (cas normal d'un onglet de navigateur classique) → écran de repli
    setTimeout(() => {
      showClosableScreen();
    }, 300);
  };

  history.pushState({ travioTrap: true }, '', location.href);
  window.addEventListener('popstate', () => {
    history.pushState({ travioTrap: true }, '', location.href);
    showQuitTravioModal();
  });
}