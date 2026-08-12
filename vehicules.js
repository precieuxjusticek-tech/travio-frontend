// ─── TRAVIO — Véhicules (Flotte) ───

import { BACKEND, agenceData, vehiculeList, setVehiculeList, trajetList } from './state.js';
import { showToast, showToastAction } from './toast-utils.js';
import { closeTrajetDetail, openTrajetDetail, invalidateAllDepartsCache, loadAllDeparts } from './trajets.js';
import { apiFetch } from './api.js';
import { escapeHtml, escapeJsAttr } from './sanitize.js';

function isValidPhone(tel) {
  const digits = (tel || '').replace(/[^\d]/g, '');
  return digits.length >= 8 && digits.length <= 15;
}

// ════════════════════════════════
//  VÉHICULES — CHARGEMENT
// ════════════════════════════════
export async function loadVehicules(agenceId) {
  try {
    const res = await apiFetch(`${BACKEND}/vehicule/all?agenceId=${agenceId}`);
    const data = await res.json();
    if (!res.ok) return;
    setVehiculeList(data.vehicules || []);
  } catch (err) {
    console.error('Erreur chargement véhicules :', err);
    setVehiculeList([]);
  }
}

// ════════════════════════════════
//  VÉHICULES — CRÉER
// ════════════════════════════════
export function openCreateVehicule(onCreated) {
  window._vehiculeOnCreated = onCreated || null;
  const overlay = document.createElement('div');
  overlay.id = 'createVehiculeOverlay';
  overlay.className = 'pdv-overlay';
  overlay.innerHTML = `
    <div class="pdv-overlay-backdrop" onclick="closeCreateVehicule()"></div>
    <div class="pdv-overlay-panel" style="max-width:480px;">
      <div class="pdv-overlay-header">
        <div><h2>🚐 Nouveau véhicule</h2><p>Ajouter un bus à la flotte</p></div>
        <button class="pdv-overlay-close" onclick="closeCreateVehicule()">✕</button>
      </div>
      <div class="pdv-create-fields">
        <div class="pdv-field-group">
          <label>Nom / Immatriculation <span class="req">*</span></label>
          <input type="text" class="pdv-input" id="cv-nom" placeholder="Ex : Bus 01, VIP Express">
        </div>
        <div class="pdv-field-group">
          <label>Type <span class="req">*</span></label>
          <select class="pdv-select" id="cv-type">
            <option value="">Sélectionner</option>
            <option value="Standard">Standard</option>
            <option value="VIP">VIP</option>
            <option value="Climatisé">Climatisé</option>
            <option value="VIP Climatisé">VIP Climatisé</option>
          </select>
        </div>
        <div class="pdv-field-group">
          <label>Capacité (places) <span class="req">*</span></label>
          <input type="number" class="pdv-input" id="cv-capacite" placeholder="Ex : 50" min="1">
        </div>
        <div class="pdv-field-group">
          <label>Nom du chauffeur</label>
          <input type="text" class="pdv-input" id="cv-chauffeur-nom" placeholder="Ex : Jean Mbemba">
        </div>
        <div class="pdv-field-group">
          <label>Téléphone du chauffeur</label>
          <input type="tel" class="pdv-input" id="cv-chauffeur-tel" placeholder="Ex : 06 xxx xx xx">
        </div>
      </div>
      <button class="pdv-btn-next" id="createVehiculeBtn" onclick="submitCreateVehicule()">🚀 Créer le véhicule</button>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
}

export function closeCreateVehicule() {
  const o = document.getElementById('createVehiculeOverlay');
  if (o) { o.classList.remove('show'); setTimeout(() => o.remove(), 350); }
}

export async function submitCreateVehicule() {
  const nom      = document.getElementById('cv-nom')?.value.trim();
  const type     = document.getElementById('cv-type')?.value;
  const capacite = document.getElementById('cv-capacite')?.value;
  const chauffeurNom = document.getElementById('cv-chauffeur-nom')?.value.trim() || null;
  const chauffeurTel = document.getElementById('cv-chauffeur-tel')?.value.trim() || null;

  if (!nom)      { showToast('Entrez le nom du véhicule.', '⚠️'); return; }
  if (!type)     { showToast('Sélectionnez le type.', '⚠️'); return; }
  if (!capacite || parseInt(capacite) <= 0) { showToast('La capacité doit être un nombre de places supérieur à 0.', '⚠️'); return; }
  if (chauffeurTel && !isValidPhone(chauffeurTel)) { showToast('Le numéro de téléphone du chauffeur doit contenir au moins 8 chiffres.', '⚠️'); return; }

  const btn = document.getElementById('createVehiculeBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Création...'; }

  try {
    const res = await apiFetch(`${BACKEND}/vehicule/create`, {
      method: 'POST',
      body: JSON.stringify({ agenceId: agenceData?.id, nom, type, capacite: parseInt(capacite), chauffeurNom, chauffeurTel }),
    });
    const data = await res.json();
    if (!res.ok) { showToast('Erreur lors de la création du véhicule.', '❌'); return; }

    setVehiculeList([...vehiculeList, data.vehicule]);
    closeCreateVehicule();
    showToast('Véhicule créé avec succès.', '✅', true);

    if (typeof window._vehiculeOnCreated === 'function') {
      window._vehiculeOnCreated(data.vehicule);
      window._vehiculeOnCreated = null;
    }
  } catch (err) {
    showToast('Impossible de contacter le serveur.', '❌');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '🚀 Créer le véhicule'; }
  }
}

// ════════════════════════════════
//  VÉHICULES — MODIFIER
// ════════════════════════════════
export function openEditVehicule(vehiculeId) {
  const v = vehiculeList.find(v => v.id === vehiculeId);
  if (!v) return;

  const overlay = document.createElement('div');
  overlay.id = 'editVehiculeOverlay';
  overlay.className = 'pdv-overlay';
  overlay.innerHTML = `
    <div class="pdv-overlay-backdrop" onclick="closeEditVehicule()"></div>
    <div class="pdv-overlay-panel" style="max-width:480px;">
      <div class="pdv-overlay-header">
        <div><h2>✏️ Modifier le véhicule</h2><p>${escapeHtml(v.nom)}</p></div>
        <button class="pdv-overlay-close" onclick="closeEditVehicule()">✕</button>
      </div>
      <div class="pdv-create-fields">
        <div class="pdv-field-group">
          <label>Nom / Immatriculation <span class="req">*</span></label>
          <input type="text" class="pdv-input" id="ev-nom" value="${escapeHtml(v.nom) || ''}">
        </div>
        <div class="pdv-field-group">
          <label>Type <span class="req">*</span></label>
          <select class="pdv-select" id="ev-type">
            ${['Standard','VIP','Climatisé','VIP Climatisé'].map(t =>
              `<option ${v.type === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="pdv-field-group">
          <label>Capacité <span class="req">*</span></label>
          <input type="number" class="pdv-input" id="ev-capacite" value="${escapeHtml(String(v.capacite)) || ''}">
        </div>
        <div class="pdv-field-group">
          <label>Nom du chauffeur</label>
          <input type="text" class="pdv-input" id="ev-chauffeur-nom" value="${escapeHtml(v.chauffeurNom) || ''}" placeholder="Ex : Jean Mbemba">
        </div>
        <div class="pdv-field-group">
          <label>Téléphone du chauffeur</label>
          <input type="tel" class="pdv-input" id="ev-chauffeur-tel" value="${escapeHtml(v.chauffeurTel) || ''}" placeholder="Ex : 06 xxx xx xx">
        </div>
      </div>
      <div style="font-size:11px;color:var(--muted);margin-bottom:14px;padding:8px 12px;background:var(--surface);border-radius:8px;border:1px solid var(--border);">
        ℹ️ Ce changement s'appliquera automatiquement sur tous les trajets où ce véhicule est utilisé.
      </div>
      <button class="pdv-btn-next" id="editVehiculeBtn" onclick="submitEditVehicule('${escapeJsAttr(v.id)}')">💾 Sauvegarder</button>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
}

export function closeEditVehicule() {
  const o = document.getElementById('editVehiculeOverlay');
  if (o) { o.classList.remove('show'); setTimeout(() => o.remove(), 350); }
}

export async function submitEditVehicule(vehiculeId) {
  const nom      = document.getElementById('ev-nom')?.value.trim();
  const type     = document.getElementById('ev-type')?.value;
  const capacite = document.getElementById('ev-capacite')?.value;
  const chauffeurNom = document.getElementById('ev-chauffeur-nom')?.value.trim() || null;
  const chauffeurTel = document.getElementById('ev-chauffeur-tel')?.value.trim() || null;

  if (!nom || !type || !capacite) { showToast('Remplissez tous les champs.', '⚠️'); return; }
  if (parseInt(capacite) <= 0) { showToast('La capacité doit être un nombre de places supérieur à 0.', '⚠️'); return; }
  if (chauffeurTel && !isValidPhone(chauffeurTel)) { showToast('Le numéro de téléphone du chauffeur doit contenir au moins 8 chiffres.', '⚠️'); return; }

  const btn = document.getElementById('editVehiculeBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Sauvegarde...'; }

  try {
    const res = await apiFetch(`${BACKEND}/vehicule/${vehiculeId}`, {
      method: 'PATCH',
      body: JSON.stringify({ nom, type, capacite: parseInt(capacite), chauffeurNom, chauffeurTel }),
    });
    const data = await res.json();
    if (!res.ok) { showToast('Erreur lors de la sauvegarde du véhicule.', '❌'); return; }

    const v = vehiculeList.find(v => v.id === vehiculeId);
    if (v) { v.nom = nom; v.type = type; v.capacite = parseInt(capacite); v.chauffeurNom = chauffeurNom; v.chauffeurTel = chauffeurTel; }

    closeEditVehicule();
    showToast('Véhicule mis à jour.', '✅', true);
  } catch (err) {
    showToast('Impossible de contacter le serveur.', '❌');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '💾 Sauvegarder'; }
  }
}

// ════════════════════════════════
//  CHOIX DE PORTÉE — DÉSACTIVER / SUPPRIMER
//  (uniquement si le bus a un vehiculeId)
// ════════════════════════════════
export function openScopeChoice({ action, departId, trajetId, vehiculeId, busNom, nouvelEtat }) {
  const titre = action === 'delete' ? 'Supprimer ce bus ?' : (nouvelEtat ? 'Activer ce bus ?' : 'Désactiver ce bus ?');
  const icone = action === 'delete' ? '🗑️' : (nouvelEtat ? '🟢' : '🔴');

  const overlay = document.createElement('div');
  overlay.id = 'scopeChoiceOverlay';
  overlay.className = 'pdv-overlay';
  overlay.innerHTML = `
    <div class="pdv-overlay-backdrop" onclick="closeScopeChoice()"></div>
    <div class="pdv-overlay-panel pdv-confirm-panel">
      <div class="pdv-confirm-icon">${icone}</div>
      <h2>${titre}</h2>
      <p><strong>${escapeHtml(busNom)}</strong> est peut-être utilisé sur d'autres trajets. Que veux-tu faire ?</p>
      <div style="display:flex;flex-direction:column;gap:8px;margin:14px 0;">
        <button class="pdv-action-btn" onclick="confirmScopeChoice('one', '${escapeJsAttr(action)}', '${escapeJsAttr(departId)}', '${escapeJsAttr(trajetId)}', '${escapeJsAttr(vehiculeId)}', ${nouvelEtat})">
          📍 Seulement sur ce trajet
        </button>
        <button class="pdv-action-btn danger" onclick="confirmScopeChoice('all', '${escapeJsAttr(action)}', '${escapeJsAttr(departId)}', '${escapeJsAttr(trajetId)}', '${escapeJsAttr(vehiculeId)}', ${nouvelEtat})">
          🌍 Sur tous les trajets où ce bus circule
        </button>
      </div>
      <button class="pdv-btn-back" onclick="closeScopeChoice()">Annuler</button>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
}

export function closeScopeChoice() {
  const o = document.getElementById('scopeChoiceOverlay');
  if (o) { o.classList.remove('show'); setTimeout(() => o.remove(), 350); }
}

export async function confirmScopeChoice(scope, action, departId, trajetId, vehiculeId, nouvelEtat) {
  closeScopeChoice();
  if (typeof window.closeBusDetail === 'function') window.closeBusDetail();

  try {
    let res;

    if (scope === 'one') {
      if (action === 'delete') {
        res = await apiFetch(`${BACKEND}/depart/${departId}`, { method: 'DELETE' });
      } else {
        res = await apiFetch(`${BACKEND}/depart/${departId}/statut`, {
          method: 'PATCH',
          body: JSON.stringify({ actif: nouvelEtat }),
        });
      }
    } else {
      if (action === 'delete') {
        res = await apiFetch(`${BACKEND}/vehicule/${vehiculeId}`, { method: 'DELETE' });
      } else {
        res = await apiFetch(`${BACKEND}/vehicule/${vehiculeId}/statut`, {
          method: 'PATCH',
          body: JSON.stringify({ actif: nouvelEtat }),
        });
      }
    }

    const data = await res.json();

    if (res.status === 409 && data.code === 'RESA_BLOQUANTES') {
      window.openResolutionReservationsModal(data.sessions, data.message, {
        vehiculeId,
        trajetId,
        actionType: action === 'delete' ? 'vehicule-delete' : 'vehicule-statut',
        nouvelEtat,
      });
      return;
    }

    if (!res.ok) { showToast('Erreur lors de l\'opération.', '❌'); return; }

    invalidateAllDepartsCache(); // supprime/désactive potentiellement des bus sur plusieurs trajets

    const messageSucces = action === 'delete'
      ? 'Bus supprimé avec succès.'
      : (nouvelEtat ? 'Bus activé avec succès.' : 'Bus désactivé avec succès.');
    showToast(messageSucces, action === 'delete' ? '🗑️' : (nouvelEtat ? '🟢' : '🔴'), nouvelEtat !== false);

    closeTrajetDetail();
    setTimeout(() => openTrajetDetail(trajetId, 'bus'), 400);

  } catch (err) {
    showToast('Impossible de contacter le serveur.', '❌');
  }
}

// ════════════════════════════════
//  VÉHICULES — SUPPRIMER
// ════════════════════════════════
export function confirmDeleteVehicule(vehiculeId, nom) {
  const overlay = document.createElement('div');
  overlay.id = 'deleteVehiculeOverlay';
  overlay.className = 'pdv-overlay';
  overlay.innerHTML = `
    <div class="pdv-overlay-backdrop" onclick="closeDeleteVehicule()"></div>
    <div class="pdv-overlay-panel pdv-confirm-panel">
      <div class="pdv-confirm-icon">🗑️</div>
      <h2>Supprimer ce véhicule ?</h2>
      <p>Tu es sur le point de supprimer <strong>${escapeHtml(nom)}</strong> de la flotte. S'il est utilisé sur des trajets, ces bus seront aussi supprimés.</p>
      <div class="pdv-confirm-actions">
        <button class="pdv-btn-next delete-confirm" onclick="deleteVehicule('${escapeJsAttr(vehiculeId)}')">Oui, supprimer</button>
        <button class="pdv-btn-back" onclick="closeDeleteVehicule()">Annuler</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
}

export function closeDeleteVehicule() {
  const o = document.getElementById('deleteVehiculeOverlay');
  if (o) { o.classList.remove('show'); setTimeout(() => o.remove(), 350); }
}

export async function deleteVehicule(vehiculeId) {
  closeDeleteVehicule();
  try {
    const res = await apiFetch(`${BACKEND}/vehicule/${vehiculeId}`, { method: 'DELETE' });
    const data = await res.json();

    if (res.status === 409 && data.code === 'RESA_BLOQUANTES') {
      window.openResolutionReservationsModal(data.sessions, data.message, {
        vehiculeId, actionType: 'vehicule-delete',
      });
      return;
    }
    if (!res.ok) { showToast('Erreur lors de la suppression du véhicule.', '❌'); return; }

    invalidateAllDepartsCache(); // les bus liés à ce véhicule ont disparu

    setVehiculeList(vehiculeList.filter(v => v.id !== vehiculeId));
    renderBusFlottePage();
    showToast('Véhicule supprimé.', '✅', true);
  } catch (err) {
    showToast('Impossible de contacter le serveur.', '❌');
  }
}

// ════════════════════════════════
//  VÉHICULES — PAGE FLOTTE (onglet "Flotte de bus")
// ════════════════════════════════
const BUS_TYPE_COLOR = {
  'Standard':        { bg: 'rgba(122,139,168,0.12)', color: 'var(--muted)' },
  'VIP':              { bg: 'rgba(130,80,255,0.15)',  color: '#A67CFF' },
  'Climatisé':        { bg: 'rgba(0,87,255,0.15)',    color: '#5B9BFF' },
  'VIP Climatisé':    { bg: 'rgba(0,229,160,0.12)',   color: 'var(--accent)' },
};

function busTypeBadge(type) {
  const c = BUS_TYPE_COLOR[type] || BUS_TYPE_COLOR['Standard'];
  return `<span style="display:inline-flex;align-items:center;font-size:10.5px;font-weight:700;padding:3px 9px;border-radius:20px;background:${c.bg};color:${c.color};white-space:nowrap;">${escapeHtml(type)}</span>`;
}

export async function renderBusFlottePage() {
  const container = document.getElementById('busFlotteContainer');
  if (!container) return;

  const total     = vehiculeList.length;
  const actifs    = vehiculeList.filter(v => v.actif !== false).length;
  const inactifs  = total - actifs;
  const capaciteTotale = vehiculeList.reduce((s, v) => s + (parseInt(v.capacite) || 0), 0);

  if (total === 0) {
    container.innerHTML = `
      <div class="overview-card">
        <div class="empty-state large">
          <svg width="48" height="48" viewBox="0 0 20 20" fill="none">
            <rect x="3" y="4" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.6"/>
            <path d="M3 10h14" stroke="currentColor" stroke-width="1.6"/>
            <circle cx="6" cy="16" r="1.5" stroke="currentColor" stroke-width="1.5"/>
            <circle cx="14" cy="16" r="1.5" stroke="currentColor" stroke-width="1.5"/>
          </svg>
          <p>Aucun bus dans la flotte</p>
          <small>Créez votre premier véhicule pour pouvoir l'assigner à vos trajets</small>
          <button class="btn-action-primary" style="margin-top:12px" onclick="openCreateVehicule()">+ Créer un bus</button>
        </div>
      </div>`;
    return;
  }

  // Véhicules actifs sans aucun départ actif (non assignés à un trajet)
  let vehiculesAvecDepartActif = new Set();
  if (agenceData?.id) {
    const departs = await loadAllDeparts(agenceData.id);
    vehiculesAvecDepartActif = new Set(departs.filter(d => d.actif !== false).map(d => d.vehiculeId));
  }

  // Tri : actifs d'abord, puis alphabétique
  const sorted = [...vehiculeList].sort((a, b) => {
    if ((a.actif !== false) !== (b.actif !== false)) return a.actif !== false ? -1 : 1;
    return (a.nom || '').localeCompare(b.nom || '');
  });

  container.innerHTML = `
    <div style="display:flex;justify-content:flex-end;margin-bottom:14px;">
      <button class="btn-action-primary" onclick="openCreateVehicule()">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        Créer un bus
      </button>
    </div>

    <div class="bus-flotte-list">
      ${sorted.map(v => `
        <div class="bus-flotte-row ${v.actif === false ? 'inactive' : ''}">
          <div class="bf-row-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="4" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.6"/>
              <path d="M3 10h14" stroke="currentColor" stroke-width="1.6"/>
              <circle cx="6" cy="16" r="1.5" stroke="currentColor" stroke-width="1.5"/>
              <circle cx="14" cy="16" r="1.5" stroke="currentColor" stroke-width="1.5"/>
            </svg>
          </div>

          <div class="bf-row-main">
            <div class="bf-row-name">${escapeHtml(v.nom)}</div>
            <div class="bf-row-meta">
              ${busTypeBadge(v.type)}
              <span class="bf-row-capacite">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:3px;"><circle cx="6" cy="5" r="2.5" stroke="currentColor" stroke-width="1.5"/><path d="M1 14a5 5 0 0110 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="12.5" cy="5" r="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M12.5 10.5a4 4 0 013 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                ${escapeHtml(String(v.capacite))} places
              </span>
            </div>
          </div>

          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
            <span class="pdv-status-badge ${v.actif !== false ? 'active' : 'inactive'}">
              <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${v.actif !== false ? 'var(--accent)' : '#FF4D6A'};margin-right:5px;vertical-align:middle;"></span>
              ${v.actif !== false ? 'Actif' : 'Inactif'}
            </span>
            ${v.actif !== false && !vehiculesAvecDepartActif.has(v.id) ? `
            <span class="pdv-status-badge inactive" style="background:rgba(255,178,63,0.12);color:#FFB23F;border-color:rgba(255,178,63,0.3);font-size:10px;" title="Ce bus n'est assigné à aucun trajet actif">
              ⚠️ Non assigné
            </span>` : ''}
          </div>

          <div class="bf-row-actions">
            <button class="bf-icon-btn" title="Modifier" onclick="openEditVehicule('${escapeJsAttr(v.id)}')">
              <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><path d="M9 2l3 3L4 13H1v-3L9 2z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <button class="bf-icon-btn danger" title="Supprimer" onclick="confirmDeleteVehicule('${escapeJsAttr(v.id)}', '${escapeJsAttr(v.nom)}')">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3 4h10M6 4V2h4v2M4 4l1 10h6l1-10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
        </div>`).join('')}
    </div>`;
}

// ════════════════════════════════
//  EXPOSER AU HTML
// ════════════════════════════════
window.openCreateVehicule    = openCreateVehicule;
window.closeCreateVehicule   = closeCreateVehicule;
window.submitCreateVehicule  = submitCreateVehicule;
window.openEditVehicule      = openEditVehicule;
window.closeEditVehicule     = closeEditVehicule;
window.submitEditVehicule    = submitEditVehicule;
window.openScopeChoice       = openScopeChoice;
window.closeScopeChoice      = closeScopeChoice;
window.confirmScopeChoice    = confirmScopeChoice;
window.confirmDeleteVehicule = confirmDeleteVehicule;
window.closeDeleteVehicule   = closeDeleteVehicule;
window.deleteVehicule        = deleteVehicule;
export async function loadChauffeursListe() {
  try {
    const res = await apiFetch(`${BACKEND}/vehicule/chauffeurs/liste?agenceId=${agenceData?.id}`);
    const data = await res.json();
    if (!res.ok) return [];
    return data.chauffeurs || [];
  } catch (err) {
    console.error('Erreur chargement chauffeurs :', err);
    return [];
  }
}

window.renderBusFlottePage   = renderBusFlottePage;
window.loadChauffeursListe   = loadChauffeursListe;