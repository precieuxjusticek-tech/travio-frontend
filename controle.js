// ─── TRAVIO — Contrôleurs ───
// ⚠️ RIEN N'EST BRANCHÉ AU BACKEND ICI.
// Tous les fetch() sont commentés / remplacés par des console.log()
// en attendant les routes serveur (/controleur/create, /controleurs, etc.)

import { BACKEND, agenceData } from './state.js';
import { showToast, togglePdvPassword, TOAST_ICONS } from './toast-utils.js';

// ════════════════════════════════
//  STATE LOCAL (temporaire, en attendant state.js)
// ════════════════════════════════
export let controleurList = [];
export function setControleurList(list) { controleurList = list; }

// Liste de bus factice pour peupler le select tant que l'API n'existe pas.
// À remplacer par un vrai fetch des "departs" de l'agence.
const BUS_MOCK = [
  { id: 'bus_mock_1', nom: 'Bus 01 — Brazzaville → Pointe-Noire', trajetLabel: 'Brazzaville → Pointe-Noire' },
  { id: 'bus_mock_2', nom: 'Bus 02 — Brazzaville → Dolisie',      trajetLabel: 'Brazzaville → Dolisie' },
];

const ICONS = {
  close:   '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  person:  '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:3px;"><circle cx="8" cy="6" r="3" stroke="currentColor" stroke-width="1.3"/><path d="M2 15a6 6 0 0112 0" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
  phone:   '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:3px;"><path d="M3 2h3l1.5 3.5-2 1.2A8.5 8.5 0 009.3 10.5l1.2-2L14 10v3a1 1 0 01-1 1A12 12 0 012 3a1 1 0 011-1z" stroke="currentColor" stroke-width="1.4"/></svg>',
  bus:     '<svg width="12" height="12" viewBox="0 0 20 20" fill="none" style="vertical-align:-2px;margin-right:4px;"><rect x="3" y="4" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M3 10h14" stroke="currentColor" stroke-width="1.5"/><circle cx="6" cy="16" r="1.5" stroke="currentColor" stroke-width="1.4"/><circle cx="14" cy="16" r="1.5" stroke="currentColor" stroke-width="1.4"/></svg>',
  edit:    '<svg width="13" height="13" viewBox="0 0 14 14" fill="none" style="vertical-align:-2px;margin-right:4px;"><path d="M9 2l3 3L4 13H1v-3L9 2z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  key:     '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:4px;"><circle cx="5" cy="8" r="3" stroke="currentColor" stroke-width="1.4"/><path d="M8 8h7M12 8v3M14.5 8v2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  trash:   '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:4px;"><path d="M3 4h10M6 4V2h4v2M4 4l1 10h6l1-10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

// ════════════════════════════════
//  ONGLET — bascule PDV / Contrôleurs
// ════════════════════════════════
export function switchEquipeTab(tab) {
  const panelPdv  = document.getElementById('equipePanel-pdv');
  const panelCtrl = document.getElementById('equipePanel-controleurs');
  const btnPdv    = document.getElementById('equipeTab-pdv');
  const btnCtrl   = document.getElementById('equipeTab-controleurs');
  const addBtn    = document.getElementById('equipeAddBtn');

  if (tab === 'pdv') {
    panelPdv.style.display  = 'block';
    panelCtrl.style.display = 'none';
    btnPdv.classList.add('active');
    btnCtrl.classList.remove('active');
    addBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Ajouter un PDV`;
    addBtn.onclick = () => openCreatePDVSafe();
  } else {
    panelPdv.style.display  = 'none';
    panelCtrl.style.display = 'block';
    btnPdv.classList.remove('active');
    btnCtrl.classList.add('active');
    addBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Ajouter un contrôleur`;
    addBtn.onclick = () => openCreateControleur();
    renderControleursPage();
  }
}

// Petit fallback pour ne pas casser si pdv.js n'est pas encore chargé au même moment
function openCreatePDVSafe() {
  if (typeof window.openCreatePDV === 'function') window.openCreatePDV();
}

// ════════════════════════════════
//  CHARGEMENT (stub, pas de backend pour l'instant)
// ════════════════════════════════
export async function loadControleurs(agenceId) {
  // TODO plus tard :
  // const res = await fetch(`${BACKEND}/controleurs?agenceId=${agenceId}`);
  // const data = await res.json();
  // setControleurList(data.controleurs || []);

  console.log('[controle.js] loadControleurs() — pas encore branché, agenceId =', agenceId);
  setControleurList([]); // vide pour l'instant
  renderControleursPage();
}

// ════════════════════════════════
//  RENDU — LISTE
// ════════════════════════════════
export function renderControleursPage() {
  const container = document.getElementById('controleursContainer');
  if (!container) return;

  if (controleurList.length === 0) {
    container.innerHTML = `
      <div class="overview-card">
        <div class="empty-state large">
          <svg width="48" height="48" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="6" r="3" stroke="currentColor" stroke-width="1.6"/>
            <path d="M3 16a6 6 0 0112 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
          <p>Aucun contrôleur créé</p>
          <small>Créez des accès pour vos agents de contrôle à bord</small>
          <button class="btn-action-primary" style="margin-top:12px" onclick="openCreateControleur()">Ajouter un contrôleur</button>
        </div>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="pdv-scroll-row">
      ${controleurList.map(c => renderControleurCard(c)).join('')}
    </div>`;
}

export function renderControleurCard(c) {
  const statusClass = c.actif ? 'active' : 'inactive';
  const statusLabel = c.actif ? 'Actif' : 'Inactif';
  const statusColor = c.actif ? 'var(--accent)' : '#FF4D6A';

  return `
    <div class="controleur-card" onclick="openControleurDetail('${c.id}')">
      <div class="pdv-card-header">
        <div style="display:flex;align-items:center;gap:9px;min-width:0;flex:1;">
          <div class="pdv-card-avatar" style="flex-shrink:0;background:rgba(166,124,255,0.15);border-color:rgba(166,124,255,0.2);color:#A67CFF;">${c.nom?.[0] || 'C'}</div>
          <div style="min-width:0;">
            <div class="pdv-card-name">${c.nom}</div>
            <div style="font-size:11px;color:var(--muted);">${ICONS.phone} ${c.telephone || '—'}</div>
          </div>
        </div>
        <span class="pdv-status-badge ${statusClass}" style="flex-shrink:0;align-self:flex-start;white-space:nowrap;">
          <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${statusColor};margin-right:3px;vertical-align:middle;"></span>${statusLabel}
        </span>
      </div>
      <div class="pdv-card-body">
        <div style="margin-bottom:10px;">
          <div class="controleur-bus-badge">${ICONS.bus} ${c.busNom || 'Aucun bus assigné'}</div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11.5px;padding:6px 8px;background:var(--surface2);border-radius:8px;margin-bottom:8px;">
          <span style="color:var(--muted);">${ICONS.person} Email connexion</span>
          <span style="color:var(--white);font-weight:600;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${c.emailConnexion || '—'}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
          <div style="background:var(--surface2);border-radius:8px;padding:7px;text-align:center;">
            <div style="font-family:'Syne',sans-serif;font-size:14px;font-weight:800;color:var(--white);">—</div>
            <div style="font-size:10px;color:var(--muted);margin-top:1px;line-height:1.3;">contrôles<br>ce mois</div>
          </div>
          <div style="background:var(--surface2);border-radius:8px;padding:7px;text-align:center;">
            <div style="font-family:'Syne',sans-serif;font-size:14px;font-weight:800;color:var(--accent);">—</div>
            <div style="font-size:10px;color:var(--muted);margin-top:1px;line-height:1.3;">taux de<br>scan</div>
          </div>
        </div>
      </div>
    </div>`;
}

// ════════════════════════════════
//  CRÉATION — Étape 1 : infos + bus assigné
// ════════════════════════════════
export function openCreateControleur() {
  const overlay = document.createElement('div');
  overlay.id = 'createControleurOverlay';
  overlay.className = 'pdv-overlay';
  overlay.innerHTML = `
    <div class="pdv-overlay-backdrop" onclick="closeCreateControleur()"></div>
    <div class="pdv-overlay-panel pdv-create-panel">
      <div class="pdv-overlay-header">
        <div>
          <h2>Ajouter un contrôleur</h2>
          <p>Étape <span id="createControleurStep">1</span> sur 2</p>
        </div>
        <button class="pdv-overlay-close" onclick="closeCreateControleur()">${ICONS.close}</button>
      </div>

      <div id="createControleurStep1">
        <div class="pdv-create-fields">
          <div class="pdv-field-group">
            <label>Nom complet du contrôleur <span class="req">*</span></label>
            <input type="text" class="pdv-input" id="ctrl-nom" placeholder="Ex : Fabrice Mabiala">
          </div>
          <div class="pdv-field-group">
            <label>Téléphone <span class="req">*</span></label>
            <input type="tel" class="pdv-input" id="ctrl-tel" placeholder="+242 06 xxx xx xx">
          </div>
          <div class="pdv-field-group">
            <label>Bus assigné <span class="req">*</span></label>
            <p class="pdv-field-hint">Un contrôleur ne peut être assigné qu'à un seul bus à la fois. Un bus peut avoir plusieurs contrôleurs.</p>
            <select class="pdv-select" id="ctrl-bus">
              <option value="">Sélectionner un bus</option>
              ${BUS_MOCK.map(b => `<option value="${b.id}" data-nom="${b.nom}">${b.nom}</option>`).join('')}
            </select>
          </div>
        </div>
        <button class="pdv-btn-next" onclick="createControleurNextStep()">Suivant →</button>
      </div>

      <div id="createControleurStep2" style="display:none">
        <div class="pdv-create-fields">
          <div class="pdv-field-group">
            <label>Email personnel</label>
            <input type="email" class="pdv-input" id="ctrl-email-contact" placeholder="Ex : fabrice.mabiala@gmail.com">
          </div>
          <div class="pdv-field-group">
            <label>Email de connexion <span class="req">*</span></label>
            <input type="email" class="pdv-input" id="ctrl-email-connexion" placeholder="Ex : controleur.bus01@votreagence.com">
          </div>
          <div class="pdv-field-group">
            <label>Mot de passe <span class="req">*</span></label>
            <div class="pdv-password-wrap">
              <input type="password" class="pdv-input" id="ctrl-password" placeholder="Min. 6 caractères">
              <button class="pdv-eye-btn" type="button" onclick="togglePdvPassword('ctrl-password', this)">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.5"/></svg>
              </button>
            </div>
          </div>
        </div>
        <div class="pdv-btn-row">
          <button class="pdv-btn-back" onclick="createControleurBackStep()">← Retour</button>
          <button class="pdv-btn-next" id="createControleurSubmitBtn" onclick="submitCreateControleur()">Créer le contrôleur</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
}

export function closeCreateControleur() {
  const o = document.getElementById('createControleurOverlay');
  if (o) { o.classList.remove('show'); setTimeout(() => o.remove(), 350); }
}

export function createControleurNextStep() {
  const nom = document.getElementById('ctrl-nom')?.value.trim();
  const tel = document.getElementById('ctrl-tel')?.value.trim();
  const bus = document.getElementById('ctrl-bus')?.value;

  if (!nom) { showToast('Entrez le nom du contrôleur.', TOAST_ICONS.warning); return; }
  if (!tel) { showToast('Entrez le téléphone.', TOAST_ICONS.warning); return; }
  if (!bus) { showToast('Sélectionnez un bus.', TOAST_ICONS.warning); return; }

  document.getElementById('createControleurStep').textContent = '2';
  document.getElementById('createControleurStep1').style.display = 'none';
  document.getElementById('createControleurStep2').style.display = 'block';
}

export function createControleurBackStep() {
  document.getElementById('createControleurStep').textContent = '1';
  document.getElementById('createControleurStep1').style.display = 'block';
  document.getElementById('createControleurStep2').style.display = 'none';
}

// ════════════════════════════════
//  SOUMISSION — STUB (rien envoyé au serveur)
// ════════════════════════════════
export async function submitCreateControleur() {
  const emailConnexion = document.getElementById('ctrl-email-connexion')?.value.trim();
  const password       = document.getElementById('ctrl-password')?.value;
  const emailContact    = document.getElementById('ctrl-email-contact')?.value.trim();

  if (!emailConnexion) { showToast('Entrez l\'email de connexion.', TOAST_ICONS.warning); return; }
  if (!password || password.length < 6) { showToast('Mot de passe trop court (min. 6 caractères).', TOAST_ICONS.warning); return; }

  const busSelect = document.getElementById('ctrl-bus');
  const busId  = busSelect?.value;
  const busNom = busSelect?.selectedOptions[0]?.dataset.nom || '';

  const payload = {
    agenceId:       agenceData?.id,
    nom:            document.getElementById('ctrl-nom')?.value.trim(),
    telephone:      document.getElementById('ctrl-tel')?.value.trim(),
    busId,
    busNom,
    emailContact:   emailContact || null,
    emailConnexion,
    password,
    actif: true,
  };

  // ── Pas encore branché : on log juste le payload ──
  console.log('[controle.js] submitCreateControleur() — payload prêt (non envoyé) :', payload);

  // TODO plus tard, remplacer par :
  // const res = await fetch(`${BACKEND}/controleur/create`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(payload),
  // });

  // Pour visualiser le rendu tout de suite, on ajoute localement à la liste :
  const fakeControleur = { id: 'local_' + Date.now(), ...payload };
  setControleurList([...controleurList, fakeControleur]);
  renderControleursPage();

  closeCreateControleur();
  showToast(`Contrôleur "${payload.nom}" créé (localement, pas encore sauvegardé) !`, TOAST_ICONS.success, true);
}

// ════════════════════════════════
//  DÉTAIL (stub minimal pour l'instant)
// ════════════════════════════════
export function openControleurDetail(controleurId) {
  const c = controleurList.find(x => x.id === controleurId);
  if (!c) return;

  const overlay = document.createElement('div');
  overlay.id = 'controleurDetailOverlay';
  overlay.className = 'pdv-overlay';
  overlay.innerHTML = `
    <div class="pdv-overlay-backdrop" onclick="closeControleurDetail()"></div>
    <div class="pdv-overlay-panel pdv-detail-panel">
      <div class="pdv-overlay-header">
        <div>
          <h2>${c.nom}</h2>
          <p>${ICONS.bus} ${c.busNom || 'Aucun bus assigné'}</p>
        </div>
        <button class="pdv-overlay-close" onclick="closeControleurDetail()">${ICONS.close}</button>
      </div>
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:4px 14px;margin-bottom:16px;">
        <div class="pdv-detail-row"><span class="pdv-detail-label">Téléphone</span><span class="pdv-detail-val">${c.telephone || '—'}</span></div>
        <div class="pdv-detail-row"><span class="pdv-detail-label">Email connexion</span><span class="pdv-detail-val">${c.emailConnexion || '—'}</span></div>
        <div class="pdv-detail-row" style="border-bottom:none;"><span class="pdv-detail-label">Bus assigné</span><span class="pdv-detail-val">${c.busNom || '—'}</span></div>
      </div>
      <div class="pdv-detail-actions">
        <button class="pdv-action-btn">${ICONS.edit} Modifier les infos</button>
        <button class="pdv-action-btn">${ICONS.key} Réinitialiser le mot de passe</button>
        <button class="pdv-action-btn delete">${ICONS.trash} Supprimer le contrôleur</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
}

export function closeControleurDetail() {
  const o = document.getElementById('controleurDetailOverlay');
  if (o) { o.classList.remove('show'); setTimeout(() => o.remove(), 350); }
}

// ════════════════════════════════
//  EXPOSER AU HTML
// ════════════════════════════════
window.switchEquipeTab           = switchEquipeTab;
window.openCreateControleur      = openCreateControleur;
window.closeCreateControleur     = closeCreateControleur;
window.createControleurNextStep  = createControleurNextStep;
window.createControleurBackStep  = createControleurBackStep;
window.submitCreateControleur    = submitCreateControleur;
window.openControleurDetail      = openControleurDetail;
window.closeControleurDetail     = closeControleurDetail;