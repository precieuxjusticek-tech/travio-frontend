// ─── TRAVIO — Contrôleurs ───
// ⚠️ RIEN N'EST BRANCHÉ AU BACKEND ICI.
// Tous les fetch() sont commentés / remplacés par des console.log()
// en attendant les routes serveur (/controleur/create, /controleurs, etc.)

import { BACKEND, agenceData } from './state.js';
import { apiFetch } from './api.js';
import { loadChauffeursListe } from './vehicules.js';
import { showToast, togglePdvPassword, TOAST_ICONS } from './toast-utils.js';
import { escapeHtml, escapeJsAttr } from './sanitize.js';

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
  const panels = {
    pdv:         document.getElementById('equipePanel-pdv'),
    controleurs: document.getElementById('equipePanel-controleurs'),
    chauffeurs:  document.getElementById('equipePanel-chauffeurs'),
  };
  const btns = {
    pdv:         document.getElementById('equipeTab-pdv'),
    controleurs: document.getElementById('equipeTab-controleurs'),
    chauffeurs:  document.getElementById('equipeTab-chauffeurs'),
  };
  const addBtn = document.getElementById('equipeAddBtn');

  // On cache tout, puis on affiche seulement l'onglet demandé
  Object.entries(panels).forEach(([key, el]) => {
    if (!el) return;
    el.style.display = key === tab ? 'block' : 'none';
  });
  Object.entries(btns).forEach(([key, el]) => {
    if (!el) return;
    el.classList.toggle('active', key === tab);
  });

  if (tab === 'pdv') {
    addBtn.style.display = 'flex';
    addBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Ajouter un PDV`;
    addBtn.onclick = () => openCreatePDVSafe();
  } else if (tab === 'controleurs') {
    addBtn.style.display = 'none';
    renderControleursPage();
  } else if (tab === 'chauffeurs') {
    addBtn.style.display = 'none';
    renderChauffeursPage();
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

  container.innerHTML = `
    <div class="geo-soon-card">
      <div class="geo-soon-icon-wrap">
        <div class="geo-soon-icon-ring"></div>
        <div class="geo-soon-icon-ring delay"></div>
        <div class="geo-soon-icon">
          <svg width="26" height="26" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="6" r="3" stroke="currentColor" stroke-width="1.6"/>
            <path d="M3 16a6 6 0 0112 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            <path d="M6.5 5.5l1 1.2 2-2.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>

      <span class="geo-soon-badge">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.5"/><path d="M8 4.5v4l2.5 1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        Bientôt disponible
      </span>

      <h2>La gestion des contrôleurs arrive</h2>
      <p>Vous pourrez bientôt créer des accès pour vos contrôleurs à bord, les assigner à un bus et suivre leurs scans de billets en temps réel.</p>

      <div class="geo-soon-features">
        <div class="geo-soon-feature">${ICONS.person} Comptes contrôleurs</div>
        <div class="geo-soon-feature">${ICONS.bus} Assignation par bus</div>
        <div class="geo-soon-feature">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:4px;"><path d="M2 8l4-4 8 8M14 8l-4 4-8-8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
          Suivi des scans
        </div>
      </div>
    </div>`;
}

export function renderControleurCard(c) {
  const statusClass = c.actif ? 'active' : 'inactive';
  const statusLabel = c.actif ? 'Actif' : 'Inactif';
  const statusColor = c.actif ? 'var(--accent)' : '#FF4D6A';

  return `
  <div class="controleur-card" onclick="openControleurDetail('${escapeJsAttr(c.id)}')">
  <div class="pdv-card-header">
    <div style="display:flex;align-items:center;gap:9px;min-width:0;flex:1;">
      <div class="pdv-card-avatar" style="flex-shrink:0;background:rgba(166,124,255,0.15);border-color:rgba(166,124,255,0.2);color:#A67CFF;">${escapeHtml(c.nom?.[0] || 'C')}</div>
      <div style="min-width:0;">
        <div class="pdv-card-name">${escapeHtml(c.nom)}</div>
        <div style="font-size:11px;color:var(--muted);">${ICONS.phone} ${escapeHtml(c.telephone) || '—'}</div>
          </div>
        </div>
        <span class="pdv-status-badge ${statusClass}" style="flex-shrink:0;align-self:flex-start;white-space:nowrap;">
          <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${statusColor};margin-right:3px;vertical-align:middle;"></span>${statusLabel}
        </span>
      </div>
      <div class="pdv-card-body">
        <div style="margin-bottom:10px;">
        <div class="controleur-bus-badge">${ICONS.bus} ${escapeHtml(c.busNom) || 'Aucun bus assigné'}</div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11.5px;padding:6px 8px;background:var(--surface2);border-radius:8px;margin-bottom:8px;">
          <span style="color:var(--muted);">${ICONS.person} Email connexion</span>
          <span style="color:var(--white);font-weight:600;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(c.emailConnexion) || '—'}</span>
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
              ${BUS_MOCK.map(b => `<option value="${escapeHtml(b.id)}" data-nom="${escapeHtml(b.nom)}">${escapeHtml(b.nom)}</option>`).join('')}
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
      <h2>${escapeHtml(c.nom)}</h2>
      <p>${ICONS.bus} ${escapeHtml(c.busNom) || 'Aucun bus assigné'}</p>
    </div>
    <button class="pdv-overlay-close" onclick="closeControleurDetail()">${ICONS.close}</button>
  </div>
  <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:4px 14px;margin-bottom:16px;">
    <div class="pdv-detail-row"><span class="pdv-detail-label">Téléphone</span><span class="pdv-detail-val">${escapeHtml(c.telephone) || '—'}</span></div>
    <div class="pdv-detail-row"><span class="pdv-detail-label">Email connexion</span><span class="pdv-detail-val">${escapeHtml(c.emailConnexion) || '—'}</span></div>
    <div class="pdv-detail-row" style="border-bottom:none;"><span class="pdv-detail-label">Bus assigné</span><span class="pdv-detail-val">${escapeHtml(c.busNom) || '—'}</span></div>
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
//  CHAUFFEURS — liste + partage du lien d'accès
// ════════════════════════════════

// ⚠️ Remplace par l'URL réelle où chauffeur.html est hébergée
const CHAUFFEUR_PAGE_URL = 'https://travio-vtk.netlify.app/chauffeur.html';

export async function renderChauffeursPage() {
  const container = document.getElementById('chauffeursContainer');
  if (!container) return;

  container.innerHTML = `<div class="empty-state"><p>Chargement des chauffeurs…</p></div>`;

  const chauffeurs = await loadChauffeursListe();

  const enteteHtml = `
    <div class="overview-card" style="margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
      <div>
        <div style="font-family:'Syne',sans-serif;font-size:13.5px;font-weight:800;color:var(--white);">Accès chauffeur</div>
        <div style="font-size:12px;color:var(--muted);margin-top:2px;">
          Lien unique pour toute l'agence, à envoyer une fois à chaque chauffeur. Il permet de marquer les colis (arrêts sans PDV) comme arrivés ou retirés.
        </div>
      </div>
      <button class="btn-action-primary" onclick="partagerLienChauffeur()">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:5px;"><path d="M13 3L6 10M13 3L9 14l-2-5-5-2 11-4z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Partager le lien d'accès
      </button>
    </div>`;

  if (!chauffeurs || chauffeurs.length === 0) {
    container.innerHTML = enteteHtml + `
      <div class="empty-state large">
        <svg width="48" height="48" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="4" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.6"/>
          <path d="M3 10h14" stroke="currentColor" stroke-width="1.6"/>
          <circle cx="6" cy="16" r="1.5" stroke="currentColor" stroke-width="1.5"/>
          <circle cx="14" cy="16" r="1.5" stroke="currentColor" stroke-width="1.5"/>
        </svg>
        <p>Aucun chauffeur renseigné</p>
        <small>Ajoutez un nom et un téléphone chauffeur depuis Trajets & Bus → Flotte de bus, en créant ou modifiant un bus.</small>
      </div>`;
    return;
  }

  container.innerHTML = enteteHtml + `
    <div class="bus-flotte-list">
      ${chauffeurs.map(c => `
        <div class="bus-flotte-row">
          <div class="bf-row-icon">
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5" r="2.5" stroke="currentColor" stroke-width="1.5"/><path d="M1 14a5 5 0 0110 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </div>
          <div class="bf-row-main">
            <div class="bf-row-name">${escapeHtml(c.nom) || 'Chauffeur sans nom'}</div>
            <div class="bf-row-meta">
              <span class="bf-row-capacite">${ICONS.phone} ${escapeHtml(c.tel)}</span>
              <span class="bf-row-capacite">${ICONS.bus} ${(c.bus || []).map(escapeHtml).join(', ')}</span>
            </div>
          </div>
        </div>`).join('')}
    </div>`;
}

export async function partagerLienChauffeur() {
  try {
    // 1) On regarde si un token existe déjà
    let res  = await apiFetch(`${BACKEND}/agence/${agenceData?.id}/chauffeur-token`);
    let data = await res.json();
    let token = data.token;

    // 2) Sinon on en génère un
    if (!token) {
      res  = await apiFetch(`${BACKEND}/agence/${agenceData?.id}/chauffeur-token/generer`, { method: 'POST' });
      data = await res.json();
      if (!res.ok) { showToast(data.message || 'Erreur lors de la génération du lien.', TOAST_ICONS.error); return; }
      token = data.token;
    }

    const lien = `${CHAUFFEUR_PAGE_URL}?a=${agenceData?.id}&t=${token}`;
    const message = `Bonjour, voici votre lien d'accès Travio pour marquer les colis (arrêts sans PDV) comme arrivés ou retirés :\n${lien}`;

    // Si le navigateur supporte le partage natif (mobile surtout), on l'utilise :
    // ça ouvre le vrai menu système avec toutes les apps installées.
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Accès chauffeur Travio', text: message });
        return; // partagé avec succès, on s'arrête là
      } catch (shareErr) {
        // L'utilisateur a annulé le partage natif → pas grave, pas d'erreur à afficher
        if (shareErr.name === 'AbortError') return;
        // Sinon on continue vers le panel de secours ci-dessous
      }
    }

    // Fallback (desktop, navigateurs non compatibles) : notre panel custom
    openPartageLienPanel(lien);

  } catch (err) {
    console.error('Erreur partage lien chauffeur :', err);
    showToast('Impossible de contacter le serveur.', TOAST_ICONS.error);
  }
}

export function openPartageLienPanel(lien) {
  const overlay = document.createElement('div');
  overlay.id = 'partageLienOverlay';
  overlay.className = 'pdv-overlay';
  overlay.innerHTML = `
    <div class="pdv-overlay-backdrop" onclick="closePartageLienPanel()"></div>
    <div class="pdv-overlay-panel" style="max-width:380px;">
      <div class="pdv-overlay-header">
        <div>
          <h2>Partager l'accès chauffeur</h2>
          <p>Choisissez comment envoyer le lien</p>
        </div>
        <button class="pdv-overlay-close" onclick="closePartageLienPanel()">${ICONS.close}</button>
      </div>

      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:10px 12px;margin-bottom:16px;font-size:12px;color:var(--muted);word-break:break-all;">
        ${escapeHtml(lien)}
      </div>

      <div style="display:flex;flex-direction:column;gap:8px;">
      <button class="pdv-action-btn" onclick="copierLienChauffeur('${escapeJsAttr(lien)}')">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:6px;"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.4"/><path d="M3 11V3a1 1 0 011-1h8" stroke="currentColor" stroke-width="1.4"/></svg>
          Copier le lien
        </button>
        <button class="pdv-action-btn" onclick="envoyerLienChauffeurWhatsapp('${escapeJsAttr(lien)}')">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:6px;"><path d="M8 1a7 7 0 00-6 10.6L1 15l3.5-1A7 7 0 108 1z" stroke="currentColor" stroke-width="1.4"/></svg>
          Envoyer via WhatsApp
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
}

export function closePartageLienPanel() {
  const o = document.getElementById('partageLienOverlay');
  if (o) { o.classList.remove('show'); setTimeout(() => o.remove(), 350); }
}

export function copierLienChauffeur(lien) {
  navigator.clipboard.writeText(lien)
    .then(() => showToast('Lien copié dans le presse-papier !', TOAST_ICONS.success))
    .catch(() => showToast('Impossible de copier le lien.', TOAST_ICONS.error));
}

export function envoyerLienChauffeurWhatsapp(lien) {
  const message = `Bonjour, voici votre lien d'accès Travio pour marquer les colis (arrêts sans PDV) comme arrivés ou retirés :\n${lien}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  closePartageLienPanel();
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
window.renderChauffeursPage  = renderChauffeursPage;
window.partagerLienChauffeur = partagerLienChauffeur;
window.openPartageLienPanel        = openPartageLienPanel;
window.closePartageLienPanel       = closePartageLienPanel;
window.copierLienChauffeur         = copierLienChauffeur;
window.envoyerLienChauffeurWhatsapp = envoyerLienChauffeurWhatsapp;