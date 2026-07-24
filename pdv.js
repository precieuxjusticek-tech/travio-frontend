// ─── TRAVIO — Points de vente (PDV) ───

import { BACKEND, agenceData, pdvList, setPdvList, trajetList, resaList } from './state.js';
import { loadDeparts } from './trajets.js';
import { getDerniereVentePdv, formatDerniereVente, getStatsMoisPdv, estPdvInactif } from './pdv-utils.js';
import { showToast, togglePdvPassword, toggleDetailPassword, TOAST_ICONS } from './toast-utils.js';

const ICONS = {
  close:   '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  pin:     '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:3px;"><path d="M8 1a5 5 0 00-5 5c0 3.5 5 9 5 9s5-5.5 5-9a5 5 0 00-5-5z" stroke="currentColor" stroke-width="1.4"/><circle cx="8" cy="6" r="1.4" stroke="currentColor" stroke-width="1.4"/></svg>',
  person:  '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:3px;"><circle cx="8" cy="6" r="3" stroke="currentColor" stroke-width="1.3"/><path d="M2 15a6 6 0 0112 0" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
  phone:   '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:3px;"><path d="M3 2h3l1.5 3.5-2 1.2A8.5 8.5 0 009.3 10.5l1.2-2L14 10v3a1 1 0 01-1 1A12 12 0 012 3a1 1 0 011-1z" stroke="currentColor" stroke-width="1.4"/></svg>',
  clock:   '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:3px;"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.4"/><path d="M8 5v3.5l2.5 1.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  map:     '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:3px;"><path d="M1 4l5-1.5 4 1.5 5-1.5v10l-5 1.5-4-1.5-5 1.5V4z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>',
  warning: '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:3px;"><path d="M8 2L1 14h14L8 2z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M8 6.5v3.5M8 12v.1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  edit:    '<svg width="13" height="13" viewBox="0 0 14 14" fill="none" style="vertical-align:-2px;margin-right:4px;"><path d="M9 2l3 3L4 13H1v-3L9 2z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  key:     '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:4px;"><circle cx="5" cy="8" r="3" stroke="currentColor" stroke-width="1.4"/><path d="M8 8h7M12 8v3M14.5 8v2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  stop:    '<svg width="12" height="12" viewBox="0 0 14 14" fill="none" style="vertical-align:-1px;margin-right:3px;"><rect x="3" y="3" width="8" height="8" rx="1" stroke="currentColor" stroke-width="1.4"/></svg>',
  play:    '<svg width="12" height="12" viewBox="0 0 14 14" fill="none" style="vertical-align:-1px;margin-right:3px;"><path d="M4 2.5v9l8-4.5-8-4.5z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>',
  trash:   '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:4px;"><path d="M3 4h10M6 4V2h4v2M4 4l1 10h6l1-10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  check:   '<svg width="26" height="26" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.4"/><path d="M5 8l2 2 4-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  banned:  '<svg width="26" height="26" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.4"/><path d="M4 4l8 8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  bus:     '<svg width="12" height="12" viewBox="0 0 20 20" fill="none" style="vertical-align:-2px;margin-right:4px;"><rect x="3" y="4" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M3 10h14" stroke="currentColor" stroke-width="1.5"/><circle cx="6" cy="16" r="1.5" stroke="currentColor" stroke-width="1.4"/><circle cx="14" cy="16" r="1.5" stroke="currentColor" stroke-width="1.4"/></svg>',
  calendar:'<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:3px;"><rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M5 1v4M11 1v4M2 7h12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
};

// ════════════════════════════════
//  PDV — CHARGEMENT
// ════════════════════════════════
export async function loadPDV(agenceId) {
  try {
    const res  = await fetch(`${BACKEND}/pdv?agenceId=${agenceId}`);
    const data = await res.json();
    if (!res.ok) return;
    setPdvList(data.pdvs || []);
    renderPDVPage();
  } catch (err) {
    console.error('Erreur chargement PDV :', err);
    setPdvList([]);
    renderPDVPage();
  }
}

// ════════════════════════════════
//  PDV — RENDU PAGE
// ════════════════════════════════
export function renderPDVPage() {
  const container = document.getElementById('pdvContainer');
  if (!container) return;

  if (pdvList.length === 0) {
    container.innerHTML = `
      <div class="overview-card">
        <div class="empty-state large">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="18" cy="16" r="7" stroke="currentColor" stroke-width="2"/><path d="M4 42a14 14 0 0128 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="36" cy="16" r="4" stroke="currentColor" stroke-width="2"/><path d="M36 28a10 10 0 018 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          <p>Aucun point de vente créé</p>
          <small>Créez des accès pour vos agents et partenaires</small>
          <button class="btn-action-primary" style="margin-top:12px" onclick="openCreatePDV()">Ajouter un PDV</button>
        </div>
      </div>`;
    return;
  }

  const byVille = {};
  pdvList.forEach(pdv => {
    const v = pdv.ville || 'Autre';
    if (!byVille[v]) byVille[v] = [];
    byVille[v].push(pdv);
  });

  const ORDRE_VILLES = ['Brazzaville','Pointe-Noire','Dolisie','Nkayi','Impfondo','Ouesso','Owando','Madingou','Sibiti','Gamboma'];
  const villesTriees = Object.keys(byVille).sort((a, b) => {
    const ia = ORDRE_VILLES.indexOf(a), ib = ORDRE_VILLES.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1; if (ib === -1) return -1;
    return ia - ib;
  });

  container.innerHTML = villesTriees.map(ville => {
    const pdvs = byVille[ville];
    return `
      <div class="pdv-ville-section">
        <div class="pdv-ville-header">
          <div class="pdv-ville-title">
            <span class="pdv-ville-pin">${ICONS.pin}</span>
            <h3>${ville}</h3>
            <span class="pdv-ville-count">${pdvs.length} PDV</span>
          </div>
          ${pdvs.length > 4 ? `<button class="pdv-voir-tout" onclick="openPDVVille('${ville}')">Voir tout →</button>` : ''}
        </div>
        <div class="pdv-scroll-row">
          ${pdvs.slice(0, 4).map(pdv => renderPDVCard(pdv)).join('')}
        </div>
      </div>`;
  }).join('');

  renderPDVStatsBar();
}

export function renderPDVCard(pdv) {
  const statusClass = pdv.actif ? 'active' : 'inactive';
  const statusLabel = pdv.actif ? 'Actif' : 'Inactif';
  const statusColor = pdv.actif ? 'var(--accent)' : '#FF4D6A';

  const nbTrajets = trajetList.filter(t =>
    (t.pdvDepart || []).some(p => p.id === pdv.id) ||
    (t.pdvArrets || []).some(p => p.id === pdv.id)
  ).length;

  loadPDVCardStats(pdv.id);

  return `
    <div class="pdv-card" id="pdvCard-${pdv.id}" onclick="openPDVDetail('${pdv.id}')">
      <div class="pdv-card-header">
        <div style="display:flex;align-items:center;gap:9px;min-width:0;flex:1;">
          <div class="pdv-card-avatar" style="flex-shrink:0;">${pdv.nom?.[0] || 'P'}</div>
          <div style="min-width:0;">
            <div class="pdv-card-name">${pdv.nom}</div>
            <div style="font-size:11px;color:var(--muted);">${ICONS.pin} ${pdv.ville || '—'}</div>
          </div>
        </div>
        <span class="pdv-status-badge ${statusClass}" style="flex-shrink:0;align-self:flex-start;white-space:nowrap;">
          <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${statusColor};margin-right:3px;vertical-align:middle;"></span>${statusLabel}
        </span>
      </div>
      <div class="pdv-card-body">
        <div style="font-size:12px;color:var(--muted);margin-bottom:2px;">${ICONS.person} ${pdv.responsable || '—'}</div>
        <div style="font-size:11px;color:var(--muted);margin-bottom:8px;display:flex;justify-content:space-between;">
          <span>${ICONS.phone} ${pdv.telephone || '—'}</span>
          <span style="color:var(--white);font-weight:600;">${nbTrajets} trajet${nbTrajets > 1 ? 's' : ''}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11.5px;margin-bottom:8px;padding:6px 8px;background:var(--surface2);border-radius:8px;">
          <span style="color:var(--muted);">${ICONS.clock} Dernière vente</span>
          <span id="pdvLastSale-${pdv.id}" style="color:var(--white);font-weight:600;">—</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:8px;">
          <div style="background:var(--surface2);border-radius:8px;padding:7px;text-align:center;">
            <div id="pdvStatBillets-${pdv.id}" style="font-family:'Syne',sans-serif;font-size:15px;font-weight:800;color:var(--white);">—</div>
            <div style="font-size:10px;color:var(--muted);margin-top:1px;line-height:1.3;">billets<br>ce mois</div>
          </div>
          <div style="background:var(--surface2);border-radius:8px;padding:7px;text-align:center;">
            <div id="pdvStatTaux-${pdv.id}" style="font-family:'Syne',sans-serif;font-size:15px;font-weight:800;color:var(--accent);">—</div>
            <div style="font-size:10px;color:var(--muted);margin-top:1px;line-height:1.3;">taux de<br>vente</div>
          </div>
          <div style="background:var(--surface2);border-radius:8px;padding:7px;text-align:center;">
            <div id="pdvStatRev-${pdv.id}" style="font-family:'Syne',sans-serif;font-size:13px;font-weight:800;color:var(--white);">—</div>
            <div style="font-size:10px;color:var(--muted);margin-top:1px;line-height:1.3;">XAF<br>ce mois</div>
          </div>
        </div>
      </div>
    </div>`;
}

let pdvStatsCache = {};
let pdvStatsPromiseCache = {};
const PDV_STATS_TTL_MS = 60_000; // 60 secondes de fraîcheur avant de refetcher

function loadPDVCardStats(pdvId) {
  // Si une requête pour ce PDV est en cache et encore fraîche, on la réutilise
  const cached = pdvStatsPromiseCache[pdvId];
  if (cached && (Date.now() - cached.time < PDV_STATS_TTL_MS)) {
    return cached.promise;
  }

  const promise = (async () => {
    try {
      const res  = await fetch(`${BACKEND}/pdv/${pdvId}/stats?agenceId=${agenceData.id}`);
      const data = await res.json();
      if (!res.ok) return;

      const { tauxMoyen } = data;
      const { revenu: revMois, billets: nbBillets } = getStatsMoisPdv(pdvId, resaList);
      const derniere      = getDerniereVentePdv(pdvId, resaList);
      const derniereLabel = formatDerniereVente(derniere);

      pdvStatsCache[pdvId] = { tauxMoyen, revMois, nbBillets };

      const couleurTaux = tauxMoyen >= 75 ? 'var(--accent)' : tauxMoyen >= 50 ? '#FFB23F' : '#FF4D6A';
      const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

      setEl(`pdvLastSale-${pdvId}`, derniereLabel);
      setEl(`pdvStatBillets-${pdvId}`, nbBillets.toLocaleString());
      setEl(`pdvStatTaux-${pdvId}`, tauxMoyen > 0 ? tauxMoyen + '%' : '—');
      setEl(`pdvStatRev-${pdvId}`,
        revMois >= 1000 ? Math.round(revMois / 1000) + 'k' : revMois.toLocaleString()
      );

      const tauxEl = document.getElementById(`pdvStatTaux-${pdvId}`);
      if (tauxEl) tauxEl.style.color = couleurTaux;

    } catch (err) {
      console.error('Erreur stats carte PDV :', err);
    }
  })();

  pdvStatsPromiseCache[pdvId] = { promise, time: Date.now() };
  return promise;
}

// Permet à d'autres modules (ex: finances.js) de réutiliser ce cache au lieu de refetcher
export async function getPdvTauxMoyen(pdvId) {
  await loadPDVCardStats(pdvId);
  return pdvStatsCache[pdvId]?.tauxMoyen ?? 0;
}

export async function renderPDVStatsBar() {
  const wrap = document.getElementById('pdvStatsBarWrap');
  if (!wrap || pdvList.length === 0) return;

  await Promise.all(pdvList.map(pdv => loadPDVCardStats(pdv.id)));

  const actifs        = pdvList.filter(p => p.actif).length;
  const pdvInactifs    = pdvList.filter(p => p.actif && estPdvInactif(p.id, resaList));
  const revenuTotal    = Object.values(pdvStatsCache).reduce((s, st) => s + (st.revMois || 0), 0);

  wrap.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px;">
      <div style="background:var(--surface2);border-radius:10px;padding:14px 16px;">
        <div style="font-size:11px;color:var(--muted);margin-bottom:6px;">PDV actifs</div>
        <div style="font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:var(--white);">${actifs} <span style="font-size:13px;color:var(--muted);font-weight:600;">/ ${pdvList.length}</span></div>
      </div>
      <div style="background:${pdvInactifs.length > 0 ? 'rgba(255,77,106,0.08)' : 'var(--surface2)'};border:${pdvInactifs.length > 0 ? '1px solid rgba(255,77,106,0.2)' : 'none'};border-radius:10px;padding:14px 16px;${pdvInactifs.length > 0 ? 'cursor:pointer;' : ''}"
        ${pdvInactifs.length > 0 ? `onclick="filtrerParAlertePdv()"` : ''}>
        <div style="font-size:11px;color:var(--muted);margin-bottom:6px;">${ICONS.warning} À surveiller</div>
        <div style="font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:${pdvInactifs.length > 0 ? '#FF4D6A' : 'var(--white)'};">${pdvInactifs.length} PDV</div>
        <div style="font-size:11px;color:var(--muted);margin-top:3px;">${pdvInactifs.length > 0 ? 'aucune vente depuis 5j+ · voir →' : 'tout va bien'}</div>
      </div>
      <div style="background:var(--surface2);border-radius:10px;padding:14px 16px;">
        <div style="font-size:11px;color:var(--muted);margin-bottom:6px;">Revenu réseau (mois)</div>
        <div style="font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:var(--white);">${revenuTotal.toLocaleString()} <span style="font-size:12px;color:var(--muted);font-weight:600;">XAF</span></div>
      </div>
    </div>`;
}

// ════════════════════════════════
//  PDV — OVERLAY VILLE
// ════════════════════════════════
export function openPDVVille(ville) {
  const pdvs = pdvList.filter(p => (p.ville || 'Autre') === ville);

  const overlay = document.createElement('div');
  overlay.id = 'pdvVilleOverlay';
  overlay.className = 'pdv-overlay';
  overlay.innerHTML = `
    <div class="pdv-overlay-backdrop" onclick="closePDVVille()"></div>
    <div class="pdv-overlay-panel" style="max-width:760px;">
      <div class="pdv-overlay-header">
        <div>
          <h2>${ICONS.pin} ${ville}</h2>
          <p>${pdvs.length} point${pdvs.length > 1 ? 's' : ''} de vente</p>
        </div>
        <button class="pdv-overlay-close" onclick="closePDVVille()">${ICONS.close}</button>
      </div>
      <div class="pdv-overlay-grid">
        ${pdvs.map(pdv => renderPDVCard(pdv)).join('')}
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
}

export function closePDVVille() {
  const o = document.getElementById('pdvVilleOverlay');
  if (o) { o.classList.remove('show'); setTimeout(() => o.remove(), 350); }
}

// ════════════════════════════════
//  PDV — DETAIL
// ════════════════════════════════
export async function openPDVDetail(pdvId) {
  const pdv = pdvList.find(p => p.id === pdvId);
  if (!pdv) return;

  const overlay = document.createElement('div');
  overlay.id = 'pdvDetailOverlay';
  overlay.className = 'pdv-overlay';
  overlay.innerHTML = `
    <div class="pdv-overlay-backdrop" onclick="closePDVDetail()"></div>
    <div class="pdv-overlay-panel pdv-detail-panel">

      <div class="pdv-overlay-header">
        <div>
          <h2>${pdv.nom}</h2>
          <p>${ICONS.pin} ${pdv.ville || '—'}${pdv.adresse ? ' · ' + pdv.adresse : ''}</p>
        </div>
        <button class="pdv-overlay-close" onclick="closePDVDetail()">${ICONS.close}</button>
      </div>

      <div style="display:flex;gap:4px;background:var(--surface);border-radius:10px;padding:4px;margin-bottom:16px;">
        <button id="pdvTab-infos" style="flex:1;padding:8px;border:none;border-radius:8px;background:var(--surface2);color:var(--white);font-family:'Syne',sans-serif;font-size:12px;font-weight:700;cursor:pointer;">${ICONS.person} Infos</button>
        <button id="pdvTab-trajets" style="flex:1;padding:8px;border:none;border-radius:8px;background:transparent;color:var(--muted);font-family:'Syne',sans-serif;font-size:12px;font-weight:700;cursor:pointer;">${ICONS.map} Trajets</button>
      </div>

      <div id="pdvPanel-infos">
        <div style="display:flex;align-items:center;gap:12px;padding:0 0 16px;border-bottom:1px solid var(--border);margin-bottom:16px;">
          <div style="width:44px;height:44px;border-radius:12px;background:rgba(0,87,255,0.12);border:1px solid rgba(0,87,255,0.2);display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:800;font-size:16px;color:#5B9BFF;flex-shrink:0;">${pdv.nom?.[0] || 'P'}</div>
          <div style="flex:1;min-width:0;">
            <div style="font-family:'Syne',sans-serif;font-size:15px;font-weight:800;color:var(--white);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${pdv.nom}</div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:3px;">
              <span style="font-size:12px;color:var(--muted);">${ICONS.pin} ${pdv.ville || '—'}</span>
              <span class="pdv-status-badge ${pdv.actif ? 'active' : 'inactive'}" style="font-size:10px;"><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${pdv.actif ? 'var(--accent)' : '#FF4D6A'};margin-right:5px;flex-shrink:0;"></span>${pdv.actif ? 'Actif' : 'Inactif'}</span>
            </div>
          </div>
        </div>

        <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Coordonnées</div>
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:4px 14px;margin-bottom:14px;">
          <div class="pdv-detail-row"><span class="pdv-detail-label">Responsable</span><span class="pdv-detail-val">${pdv.responsable || '—'}</span></div>
          <div class="pdv-detail-row"><span class="pdv-detail-label">Téléphone</span><span class="pdv-detail-val">${pdv.telephone || '—'}</span></div>
          <div class="pdv-detail-row"><span class="pdv-detail-label">Adresse</span><span class="pdv-detail-val" style="text-align:right;max-width:55%;">${pdv.adresse || '—'}</span></div>
          ${pdv.emailContact ? `<div class="pdv-detail-row" style="border-bottom:none;"><span class="pdv-detail-label">Email contact</span><span class="pdv-detail-val" style="color:#5B9BFF;">${pdv.emailContact}</span></div>` : ''}
        </div>

        <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Accès agent</div>
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:4px 14px;margin-bottom:16px;">
          <div class="pdv-detail-row"><span class="pdv-detail-label">Email connexion</span><span class="pdv-detail-val">${pdv.emailConnexion || '—'}</span></div>
          <div class="pdv-detail-row" style="border-bottom:none;">
            <span class="pdv-detail-label">Mot de passe</span>
            <span class="pdv-detail-val pdv-password-row">
              <span class="pdv-password-dots" id="detailPassword">••••••••</span>
              <button class="pdv-eye-btn-sm" type="button" onclick="toggleDetailPassword('${pdv.password || ''}', this)">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.5"/></svg>
              </button>
            </span>
          </div>
        </div>

        <div class="pdv-detail-actions">
          <button class="pdv-action-btn" onclick="openEditPDV('${pdv.id}')">${ICONS.edit} Modifier les infos</button>
          <button class="pdv-action-btn" onclick="openResetPassword('${pdv.id}', '${pdv.nom}')">${ICONS.key} Réinitialiser le mot de passe</button>
          <button class="pdv-action-btn danger" onclick="togglePDVStatut('${pdv.id}', ${pdv.actif})">
            ${pdv.actif ? ICONS.stop + ' Désactiver le PDV' : ICONS.play + ' Activer le PDV'}
          </button>
          <button class="pdv-action-btn delete" onclick="confirmDeletePDV('${pdv.id}', '${pdv.nom}')">${ICONS.trash} Supprimer le PDV</button>
        </div>
      </div>

      <div id="pdvPanel-trajets" style="display:none;">
        <div id="pdvTrajetsList" style="display:flex;flex-direction:column;gap:8px;align-items:center;">
          <div style="text-align:center;padding:16px;color:var(--muted);font-size:12px;">Chargement...</div>
        </div>
      </div>

    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));

  setTimeout(() => {
    document.getElementById('pdvTab-infos')?.addEventListener('click', () => switchPDVTab('infos'));
    document.getElementById('pdvTab-trajets')?.addEventListener('click', () => switchPDVTab('trajets', pdv.id));
  }, 50);
}

export function closePDVDetail() {
  const o = document.getElementById('pdvDetailOverlay');
  if (o) { o.classList.remove('show'); setTimeout(() => o.remove(), 350); }
}

export function switchPDVTab(tab, pdvId = null) {
  ['infos', 'trajets'].forEach(t => {
    const panel = document.getElementById(`pdvPanel-${t}`);
    const btn   = document.getElementById(`pdvTab-${t}`);
    if (panel) panel.style.display = 'none';
    if (btn) { btn.style.background = 'transparent'; btn.style.color = 'var(--muted)'; }
  });

  const activePanel = document.getElementById(`pdvPanel-${tab}`);
  const activeBtn   = document.getElementById(`pdvTab-${tab}`);
  if (activePanel) activePanel.style.display = 'block';
  if (activeBtn) { activeBtn.style.background = 'var(--surface2)'; activeBtn.style.color = 'var(--white)'; }

  if (tab === 'trajets' && pdvId) loadPDVTrajets(pdvId);
}

// ════════════════════════════════
//  PDV — TRAJETS (onglet)
// ════════════════════════════════
let pdvTrajetsCache = {};

export async function loadPDVTrajets(pdvId, forceRefresh = false) {
  const container = document.getElementById('pdvTrajetsList');
  if (!container) return;

  // Réutilise le cache si déjà chargé et qu'on ne force pas le refresh
  if (!forceRefresh && pdvTrajetsCache[pdvId]) {
    await renderPDVTrajetsDOM(pdvTrajetsCache[pdvId], pdvId, container);
    return;
  }

  try {
    const res     = await fetch(`${BACKEND}/pdv/${pdvId}/trajets?agenceId=${agenceData.id}`);
    const data    = await res.json();
    const trajets = data.trajets || [];
    pdvTrajetsCache[pdvId] = trajets;
    await renderPDVTrajetsDOM(trajets, pdvId, container);
  } catch (err) {
    container.innerHTML = `<div style="color:#FF4D6A;text-align:center;font-size:12px;">Erreur de chargement.</div>`;
  }
}

async function renderPDVTrajetsDOM(trajets, pdvId, container) {
  if (trajets.length === 0) {
    container.innerHTML = `<div style="text-align:center;padding:24px;color:var(--muted);font-size:12px;background:var(--surface);border-radius:12px;">Aucun trajet assigné à ce PDV.</div>`;
    return;
  }

  const departsParTrajet = await Promise.all(
    trajets.map(async t => {
      const departs = await loadDeparts(t.id); // utilise le cache si déjà chargé
      return { trajetId: t.id, departs: departs.filter(dep => dep.actif !== false) };
    })
  );

  const departsMap = {};
  departsParTrajet.forEach(d => { departsMap[d.trajetId] = d.departs; });

  const nbTotal = trajets.length;
  container.innerHTML = `
    <div style="max-width:440px;margin:0 auto;width:100%;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
        <span style="font-size:13px;font-weight:600;color:var(--white);">${nbTotal} trajet${nbTotal > 1 ? 's' : ''} assigné${nbTotal > 1 ? 's' : ''}</span>
        <span style="font-size:12px;color:var(--muted);">${(pdvList.find(p => p.id === pdvId))?.nom || ''}</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${trajets.map(t => {
        const estDepart = (t.pdvDepart || []).some(p => p.id === pdvId);
        const departs   = departsMap[t.id] || [];
        const nbBus     = departs.length;

        let joursLabel = '—';
        if (departs.length > 0) {
          const tousLesJours = departs.every(d => d.tousLesJours);
          joursLabel = tousLesJours
            ? 'Tous les jours'
            : [...new Set(departs.flatMap(d => d.jours || []))].join(' · ') || '—';
        }

        const roleBadge = estDepart
          ? `<span style="font-size:11px;background:rgba(0,87,255,0.12);color:#5B9BFF;padding:2px 7px;border-radius:20px;font-weight:600;">Départ</span>`
          : `<span style="font-size:11px;background:rgba(255,180,0,0.12);color:#FFB23F;padding:2px 7px;border-radius:20px;font-weight:600;">Arrêt intermédiaire</span>`;

        const statutBadge = t.actif === false
          ? `<span style="font-size:11px;background:rgba(255,77,106,0.12);color:#FF4D6A;padding:2px 7px;border-radius:20px;font-weight:600;">Inactif</span>`
          : '';

        const heureLabel = departs[0]?.heureDepart ? `· ${departs[0].heureDepart}` : '';

        return `
          <div style="border:1px solid var(--border);border-radius:12px;overflow:hidden;${t.actif === false ? 'opacity:0.6;' : ''}">
            <div style="padding:12px 14px;display:flex;align-items:center;justify-content:space-between;">
              <div style="flex:1;min-width:0;">
                <div style="font-size:13px;font-weight:700;color:var(--white);margin-bottom:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${t.villeDepart} → ${t.villeArrivee}</div>
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                  ${roleBadge}${statutBadge}
                  <span style="font-size:11px;color:var(--muted);">${t.typeTrajet === 'arrets' ? 'Avec arrêts' : 'Direct'} ${heureLabel}</span>
                </div>
              </div>
              <div style="text-align:right;flex-shrink:0;margin-left:12px;">
                ${Object.entries(t.prixParType || {}).map(([typeId, prix]) => {
                  const type = (agenceData.typesBillet || []).find(x => x.id === typeId);
                  return `<div style="font-size:12px;color:var(--white);"><strong>${Number(prix).toLocaleString()}</strong> <span style="color:var(--muted);font-size:10px;">${type?.nom || typeId}</span></div>`;
                }).join('')}
              </div>
            </div>
            ${nbBus > 0 ? `
            <div style="padding:8px 14px 10px;border-top:1px solid var(--border);background:var(--surface);display:flex;gap:16px;flex-wrap:wrap;">
              <div style="display:flex;align-items:center;gap:5px;font-size:12px;color:var(--muted);">${ICONS.bus} ${nbBus} bus actif${nbBus > 1 ? 's' : ''}</div>
              <div style="display:flex;align-items:center;gap:5px;font-size:12px;color:var(--muted);">${ICONS.calendar} ${joursLabel}</div>
            </div>` : `
            <div style="padding:8px 14px 10px;border-top:1px solid var(--border);background:var(--surface);">
              <span style="font-size:12px;color:var(--muted);">Aucun bus configuré sur ce trajet</span>
            </div>`}
          </div>`;
      }).join('')}
      </div>
    </div>
  `;
}

// ════════════════════════════════
//  PDV — CRÉER
// ════════════════════════════════
export function openCreatePDV() {
  const overlay = document.createElement('div');
  overlay.id = 'createPDVOverlay';
  overlay.className = 'pdv-overlay';
  overlay.innerHTML = `
    <div class="pdv-overlay-backdrop" onclick="closeCreatePDV()"></div>
    <div class="pdv-overlay-panel pdv-create-panel">
      <div class="pdv-overlay-header">
        <div>
          <h2>Ajouter un PDV</h2>
          <p>Étape <span id="createStep">1</span> sur 2</p>
        </div>
        <button class="pdv-overlay-close" onclick="closeCreatePDV()">${ICONS.close}</button>
      </div>
      <div id="createStep1">
        <div class="pdv-create-fields">
          <div class="pdv-field-group">
            <label>Ville <span class="req">*</span></label>
            <select class="pdv-select" id="pdv-ville">
              <option value="Brazzaville">Brazzaville</option>
              <option value="Pointe-Noire">Pointe-Noire</option>
              <option value="Dolisie">Dolisie</option>
              <option value="Nkayi">Nkayi</option>
              <option value="Impfondo">Impfondo</option>
              <option value="Ouesso">Ouesso</option>
              <option value="Owando">Owando</option>
              <option value="Madingou">Madingou</option>
              <option value="Sibiti">Sibiti</option>
              <option value="Gamboma">Gamboma</option>
              <option value="Autre">Autre...</option>
            </select>
          </div>
          <div class="pdv-field-group" id="autreVilleWrap" style="display:none">
            <label>Précisez la ville <span class="req">*</span></label>
            <input type="text" class="pdv-input" id="pdv-ville-autre" placeholder="Ex : Owando">
          </div>
          <div class="pdv-field-group">
            <label>Nom du point de vente <span class="req">*</span></label>
            <p class="pdv-field-hint">Ex : PDV Centre-ville, Agence Bacongo.</p>
            <input type="text" class="pdv-input" id="pdv-nom" placeholder="Ex : PDV Centre-ville">
          </div>
          <div class="pdv-field-group">
            <label>Adresse / Quartier <span class="req">*</span></label>
            <input type="text" class="pdv-input" id="pdv-adresse" placeholder="Ex : Avenue de l'Indépendance, Centre-ville">
          </div>
          <div class="pdv-field-group">
            <label>Téléphone du responsable <span class="req">*</span></label>
            <input type="tel" class="pdv-input" id="pdv-tel" placeholder="+242 06 xxx xx xx">
          </div>
        </div>
        <button class="pdv-btn-next" onclick="createPDVNextStep()">Suivant →</button>
      </div>
      <div id="createStep2" style="display:none">
        <div class="pdv-create-fields">
          <div class="pdv-field-group">
            <label>Nom du responsable <span class="req">*</span></label>
            <input type="text" class="pdv-input" id="pdv-responsable" placeholder="Ex : Jean Moukala">
          </div>
          <div class="pdv-field-group">
            <label>Email personnel du responsable</label>
            <input type="email" class="pdv-input" id="pdv-email-contact" placeholder="Ex : jean.moukala@gmail.com">
          </div>
          <div class="pdv-field-group">
            <label>Email de connexion <span class="req">*</span></label>
            <input type="email" class="pdv-input" id="pdv-email-connexion" placeholder="Ex : pdv.centre@votreagence.com">
          </div>
          <div class="pdv-field-group">
            <label>Mot de passe <span class="req">*</span></label>
            <div class="pdv-password-wrap">
              <input type="password" class="pdv-input" id="pdv-password" placeholder="Min. 6 caractères">
              <button class="pdv-eye-btn" type="button" onclick="togglePdvPassword('pdv-password', this)">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.5"/></svg>
              </button>
            </div>
          </div>
        </div>
        <div class="pdv-btn-row">
          <button class="pdv-btn-back" onclick="createPDVBackStep()">← Retour</button>
          <button class="pdv-btn-next" id="createPDVSubmitBtn" onclick="submitCreatePDV()">Créer le PDV</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));

  setTimeout(() => {
    const select = document.getElementById('pdv-ville');
    if (select) {
      select.addEventListener('change', () => {
        const wrap = document.getElementById('autreVilleWrap');
        if (wrap) wrap.style.display = select.value === 'Autre' ? 'flex' : 'none';
      });
    }
  }, 100);
}

export function closeCreatePDV() {
  const o = document.getElementById('createPDVOverlay');
  if (o) { o.classList.remove('show'); setTimeout(() => o.remove(), 350); }
}

export function createPDVNextStep() {
  const ville      = document.getElementById('pdv-ville')?.value;
  const villeAutre = document.getElementById('pdv-ville-autre')?.value;
  const nom        = document.getElementById('pdv-nom')?.value.trim();
  const adresse    = document.getElementById('pdv-adresse')?.value.trim();
  const tel        = document.getElementById('pdv-tel')?.value.trim();

  if (!ville)   { showToast('Sélectionnez une ville.', TOAST_ICONS.warning); return; }
  if (ville === 'Autre' && !villeAutre?.trim()) { showToast('Précisez la ville.', TOAST_ICONS.warning); return; }
  if (!nom)     { showToast('Entrez le nom du PDV.', TOAST_ICONS.warning); return; }
  if (!adresse) { showToast('Entrez l\'adresse.', TOAST_ICONS.warning); return; }
  if (!tel)     { showToast('Entrez le téléphone.', TOAST_ICONS.warning); return; }

  document.getElementById('createStep').textContent = '2';
  document.getElementById('createStep1').style.display = 'none';
  document.getElementById('createStep2').style.display = 'block';
}

export function createPDVBackStep() {
  document.getElementById('createStep').textContent = '1';
  document.getElementById('createStep1').style.display = 'block';
  document.getElementById('createStep2').style.display = 'none';
}

export async function submitCreatePDV() {
  const responsable    = document.getElementById('pdv-responsable')?.value.trim();
  const emailConnexion = document.getElementById('pdv-email-connexion')?.value.trim();
  const password       = document.getElementById('pdv-password')?.value;
  const emailContact   = document.getElementById('pdv-email-contact')?.value.trim();

  if (!responsable)    { showToast('Entrez le nom du responsable.', TOAST_ICONS.warning); return; }
  if (!emailConnexion) { showToast('Entrez l\'email de connexion.', TOAST_ICONS.warning); return; }
  if (!password || password.length < 6) { showToast('Mot de passe trop court (min. 6 caractères).', TOAST_ICONS.warning); return; }

  const villeSelect = document.getElementById('pdv-ville')?.value;
  const ville = villeSelect === 'Autre'
    ? document.getElementById('pdv-ville-autre')?.value.trim()
    : villeSelect;

  const payload = {
    agenceId:      agenceData?.id,
    ville,
    nom:           document.getElementById('pdv-nom')?.value.trim(),
    adresse:       document.getElementById('pdv-adresse')?.value.trim(),
    telephone:     document.getElementById('pdv-tel')?.value.trim(),
    responsable, emailContact, emailConnexion, password,
    quota: 0, actif: true,
  };

  const btn = document.getElementById('createPDVSubmitBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Création...'; }

  try {
    const res  = await fetch(`${BACKEND}/pdv/create`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.message || 'Erreur création PDV.', TOAST_ICONS.error); return; }

    setPdvList([...pdvList, data.pdv]);
    renderPDVPage();
    closeCreatePDV();
    showToast(`PDV "${payload.nom}" créé avec succès !`, TOAST_ICONS.success, true);

  } catch (err) {
    console.error('Erreur création PDV :', err);
    showToast('Impossible de contacter le serveur.', TOAST_ICONS.error);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Créer le PDV'; }
  }
}

// ════════════════════════════════
//  PDV — MODIFIER
// ════════════════════════════════
export function openEditPDV(pdvId) {
  const pdv = pdvList.find(p => p.id === pdvId);
  if (!pdv) return;
  closePDVDetail();

  const overlay = document.createElement('div');
  overlay.id = 'editPDVOverlay';
  overlay.className = 'pdv-overlay';
  overlay.innerHTML = `
    <div class="pdv-overlay-backdrop" onclick="closeEditPDV()"></div>
    <div class="pdv-overlay-panel" style="max-width:560px;">
      <div class="pdv-overlay-header">
        <div><h2>${ICONS.edit} Modifier le PDV</h2><p>${pdv.nom}</p></div>
        <button class="pdv-overlay-close" onclick="closeEditPDV()">${ICONS.close}</button>
      </div>
      <div class="pdv-create-fields">
        <div class="pdv-field-group"><label>Nom du point de vente <span class="req">*</span></label><input type="text" class="pdv-input" id="editpdv-nom" value="${pdv.nom || ''}"></div>
        <div class="pdv-field-group">
          <label>Ville <span class="req">*</span></label>
          <select class="pdv-select" id="editpdv-ville" onchange="toggleEditAutreVille()">
            <option value="">Sélectionner</option>
            <option value="Brazzaville">Brazzaville</option>
            <option value="Pointe-Noire">Pointe-Noire</option>
            <option value="Dolisie">Dolisie</option>
            <option value="Nkayi">Nkayi</option>
            <option value="Impfondo">Impfondo</option>
            <option value="Ouesso">Ouesso</option>
            <option value="Owando">Owando</option>
            <option value="Madingou">Madingou</option>
            <option value="Sibiti">Sibiti</option>
            <option value="Gamboma">Gamboma</option>
            <option value="Autre">Autre...</option>
          </select>
        </div>
        <div class="pdv-field-group" id="editAutreVilleWrap" style="display:none;">
          <label>Précisez la ville <span class="req">*</span></label>
          <input type="text" class="pdv-input" id="editpdv-ville-autre" placeholder="Ex : Kinkala">
        </div>
        <div class="pdv-field-group"><label>Adresse / Quartier <span class="req">*</span></label><input type="text" class="pdv-input" id="editpdv-adresse" value="${pdv.adresse || ''}"></div>
        <div class="pdv-field-group"><label>Nom du responsable <span class="req">*</span></label><input type="text" class="pdv-input" id="editpdv-responsable" value="${pdv.responsable || ''}"></div>
        <div class="pdv-field-group"><label>Téléphone du responsable <span class="req">*</span></label><input type="tel" class="pdv-input" id="editpdv-telephone" value="${pdv.telephone || ''}"></div>
        <div class="pdv-field-group"><label>Email personnel</label><input type="email" class="pdv-input" id="editpdv-emailContact" value="${pdv.emailContact || ''}"></div>
        <div class="pdv-field-group"><label>Email de connexion <span class="req">*</span></label><input type="email" class="pdv-input" id="editpdv-emailConnexion" value="${pdv.emailConnexion || ''}"></div>
      </div>
      <button class="pdv-btn-next" id="editPDVSubmitBtn" onclick="submitEditPDV('${pdv.id}')">Sauvegarder</button>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));

  setTimeout(() => {
    const selectVille = document.getElementById('editpdv-ville');
    if (selectVille) {
      const VILLES = ['Brazzaville','Pointe-Noire','Dolisie','Nkayi','Impfondo','Ouesso','Owando','Madingou','Sibiti','Gamboma'];
      if (VILLES.includes(pdv.ville)) {
        selectVille.value = pdv.ville;
      } else if (pdv.ville) {
        selectVille.value = 'Autre';
        const autreWrap  = document.getElementById('editAutreVilleWrap');
        const autreInput = document.getElementById('editpdv-ville-autre');
        if (autreWrap)  autreWrap.style.display  = 'flex';
        if (autreInput) autreInput.value = pdv.ville;
      }
    }
  }, 50);
}

export function toggleEditAutreVille() {
  const val  = document.getElementById('editpdv-ville')?.value;
  const wrap = document.getElementById('editAutreVilleWrap');
  if (wrap) wrap.style.display = val === 'Autre' ? 'flex' : 'none';
}

export function closeEditPDV() {
  const o = document.getElementById('editPDVOverlay');
  if (o) { o.classList.remove('show'); setTimeout(() => o.remove(), 350); }
}

export async function submitEditPDV(pdvId) {
  const nom         = document.getElementById('editpdv-nom')?.value.trim();
  const villeSelect = document.getElementById('editpdv-ville')?.value;
  const ville = villeSelect === 'Autre'
    ? document.getElementById('editpdv-ville-autre')?.value.trim()
    : villeSelect;
  const adresse        = document.getElementById('editpdv-adresse')?.value.trim();
  const responsable    = document.getElementById('editpdv-responsable')?.value.trim();
  const telephone      = document.getElementById('editpdv-telephone')?.value.trim();
  const emailContact   = document.getElementById('editpdv-emailContact')?.value.trim();
  const emailConnexion = document.getElementById('editpdv-emailConnexion')?.value.trim();

  if (!nom || !ville || !adresse || !responsable || !telephone || !emailConnexion) {
    showToast('Remplissez tous les champs obligatoires.', TOAST_ICONS.warning); return;
  }

  const payload = { nom, ville, adresse, responsable, telephone, emailContact: emailContact || null, emailConnexion };
  const btn = document.getElementById('editPDVSubmitBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Sauvegarde...'; }

  try {
    const res  = await fetch(`${BACKEND}/pdv/${pdvId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.message || 'Erreur sauvegarde.', TOAST_ICONS.error); return; }

    const pdv = pdvList.find(p => p.id === pdvId);
    if (pdv) Object.assign(pdv, payload);

    renderPDVPage();
    closeEditPDV();
    showToast('PDV mis à jour avec succès !', TOAST_ICONS.success, true);

  } catch (err) {
    console.error('Erreur update PDV :', err);
    showToast('Impossible de contacter le serveur.', TOAST_ICONS.error);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Sauvegarder'; }
  }
}

// ════════════════════════════════
//  PDV — SUPPRIMER
// ════════════════════════════════
export function confirmDeletePDV(pdvId, pdvNom) {
  closePDVDetail();
  const overlay = document.createElement('div');
  overlay.id = 'deletePDVOverlay';
  overlay.className = 'pdv-overlay';
  overlay.innerHTML = `
    <div class="pdv-overlay-backdrop" onclick="closeDeletePDV()"></div>
    <div class="pdv-overlay-panel pdv-confirm-panel">
      <div class="pdv-confirm-icon">${ICONS.trash}</div>
      <h2>Supprimer ce PDV ?</h2>
      <p>Vous êtes sur le point de supprimer <strong>${pdvNom}</strong>. Cette action est <strong>irréversible</strong> — le compte de l'agent sera également supprimé.</p>
      <div class="pdv-confirm-actions">
        <button class="pdv-btn-next delete-confirm" onclick="deletePDV('${pdvId}')">Oui, supprimer</button>
        <button class="pdv-btn-back" onclick="closeDeletePDV()">Annuler</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
}

export function closeDeletePDV() {
  const o = document.getElementById('deletePDVOverlay');
  if (o) { o.classList.remove('show'); setTimeout(() => o.remove(), 350); }
}

export async function deletePDV(pdvId) {
  closeDeletePDV();
  try {
    const res  = await fetch(`${BACKEND}/pdv/${pdvId}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { showToast(data.message || 'Erreur suppression.', TOAST_ICONS.error); return; }

    setPdvList(pdvList.filter(p => p.id !== pdvId));
    renderPDVPage();
    showToast('PDV supprimé avec succès.', TOAST_ICONS.success, true);

  } catch (err) {
    console.error('Erreur suppression PDV :', err);
    showToast('Impossible de contacter le serveur.', TOAST_ICONS.error);
  }
}

// ════════════════════════════════
//  PDV — ACTIVER / DÉSACTIVER
// ════════════════════════════════
export async function togglePDVStatut(pdvId, actifActuel) {
  const nouvelEtat = !actifActuel;
  const overlay = document.createElement('div');
  overlay.id = 'statutPDVOverlay';
  overlay.className = 'pdv-overlay';
  overlay.innerHTML = `
    <div class="pdv-overlay-backdrop" onclick="closeStatutPDV()"></div>
    <div class="pdv-overlay-panel pdv-confirm-panel">
      <div class="pdv-confirm-icon">${nouvelEtat ? ICONS.check : ICONS.stop}</div>
      <h2>${nouvelEtat ? 'Activer' : 'Désactiver'} ce PDV ?</h2>
      <p>${nouvelEtat ? 'L\'agent pourra à nouveau se connecter et effectuer des réservations.' : 'L\'agent ne pourra plus se connecter à l\'application. Les réservations existantes ne sont pas affectées.'}</p>
      <div class="pdv-confirm-actions">
        <button class="pdv-btn-next ${nouvelEtat ? '' : 'delete-confirm'}"
          style="${nouvelEtat ? 'background: var(--accent); color: var(--dark);' : ''}"
          onclick="confirmToggleStatut('${pdvId}', ${nouvelEtat})">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${nouvelEtat ? 'var(--accent)' : 'white'};margin-right:6px;vertical-align:middle;"></span>${nouvelEtat ? 'Oui, activer' : 'Oui, désactiver'}
        </button>
        <button class="pdv-btn-back" onclick="closeStatutPDV()">Annuler</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
}

export function closeStatutPDV() {
  const o = document.getElementById('statutPDVOverlay');
  if (o) { o.classList.remove('show'); setTimeout(() => o.remove(), 350); }
}

export async function confirmToggleStatut(pdvId, nouvelEtat) {
  closeStatutPDV();
  closePDVDetail();
  try {
    const res  = await fetch(`${BACKEND}/pdv/${pdvId}/statut`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ actif: nouvelEtat }),
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.message || 'Erreur.', TOAST_ICONS.error); return; }

    const pdv = pdvList.find(p => p.id === pdvId);
    if (pdv) pdv.actif = nouvelEtat;

    renderPDVPage();
    showToast(nouvelEtat ? 'PDV activé avec succès.' : 'PDV désactivé avec succès.', nouvelEtat ? TOAST_ICONS.success : ICONS.banned, nouvelEtat);

  } catch (err) {
    console.error('Erreur statut PDV :', err);
    showToast('Impossible de contacter le serveur.', TOAST_ICONS.error);
  }
}

// ════════════════════════════════
//  PDV — RESET MOT DE PASSE
// ════════════════════════════════
export function openResetPassword(pdvId, pdvNom) {
  closePDVDetail();
  const overlay = document.createElement('div');
  overlay.id = 'resetPasswordOverlay';
  overlay.className = 'pdv-overlay';
  overlay.innerHTML = `
    <div class="pdv-overlay-backdrop" onclick="closeResetPassword()"></div>
    <div class="pdv-overlay-panel pdv-reset-panel">
      <div class="pdv-overlay-header">
        <div><h2>${ICONS.key} Nouveau mot de passe</h2><p>${pdvNom}</p></div>
        <button class="pdv-overlay-close" onclick="closeResetPassword()">${ICONS.close}</button>
      </div>
      <div class="pdv-create-fields">
        <div class="pdv-field-group">
          <label>Nouveau mot de passe <span class="req">*</span></label>
          <p class="pdv-field-hint">Minimum 6 caractères. Le nouveau mot de passe sera actif immédiatement.</p>
          <div class="pdv-password-wrap">
            <input type="password" class="pdv-input" id="newPasswordInput" placeholder="Min. 6 caractères">
            <button class="pdv-eye-btn" type="button" onclick="togglePdvPassword('newPasswordInput', this)">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.5"/></svg>
            </button>
          </div>
        </div>
        <div class="pdv-field-group">
          <label>Confirmer le mot de passe <span class="req">*</span></label>
          <div class="pdv-password-wrap">
            <input type="password" class="pdv-input" id="confirmPasswordInput" placeholder="Répétez le mot de passe">
            <button class="pdv-eye-btn" type="button" onclick="togglePdvPassword('confirmPasswordInput', this)">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.5"/></svg>
            </button>
          </div>
        </div>
      </div>
      <button class="pdv-btn-next" id="resetPasswordBtn" onclick="submitResetPassword('${pdvId}')">${ICONS.key} Réinitialiser le mot de passe</button>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
}

export function closeResetPassword() {
  const o = document.getElementById('resetPasswordOverlay');
  if (o) { o.classList.remove('show'); setTimeout(() => o.remove(), 350); }
}

export async function submitResetPassword(pdvId) {
  const newPassword     = document.getElementById('newPasswordInput')?.value;
  const confirmPassword = document.getElementById('confirmPasswordInput')?.value;

  if (!newPassword || newPassword.length < 6) { showToast('Mot de passe trop court (min. 6 caractères).', TOAST_ICONS.warning); return; }
  if (newPassword !== confirmPassword) { showToast('Les mots de passe ne correspondent pas.', TOAST_ICONS.warning); return; }

  const btn = document.getElementById('resetPasswordBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Réinitialisation...'; }

  try {
    const res  = await fetch(`${BACKEND}/pdv/${pdvId}/reset-password`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ newPassword }),
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.message || 'Erreur.', TOAST_ICONS.error); return; }

    const pdv = pdvList.find(p => p.id === pdvId);
    if (pdv) pdv.password = newPassword;

    closeResetPassword();
    showToast('Mot de passe réinitialisé avec succès.', ICONS.key, true);

  } catch (err) {
    console.error('Erreur reset password :', err);
    showToast('Impossible de contacter le serveur.', TOAST_ICONS.error);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = `${ICONS.key} Réinitialiser le mot de passe`; }
  }
}

// ════════════════════════════════
//  EXPOSER AU HTML
// ════════════════════════════════
window.openCreatePDV        = openCreatePDV;
window.closeCreatePDV       = closeCreatePDV;
window.createPDVNextStep    = createPDVNextStep;
window.createPDVBackStep    = createPDVBackStep;
window.submitCreatePDV      = submitCreatePDV;
window.openPDVDetail        = openPDVDetail;
window.closePDVDetail       = closePDVDetail;
window.openPDVVille         = openPDVVille;
window.closePDVVille        = closePDVVille;
window.switchPDVTab         = switchPDVTab;
window.loadPDVTrajets       = loadPDVTrajets;
window.openEditPDV          = openEditPDV;
window.closeEditPDV         = closeEditPDV;
window.submitEditPDV        = submitEditPDV;
window.toggleEditAutreVille = toggleEditAutreVille;
window.confirmDeletePDV     = confirmDeletePDV;
window.closeDeletePDV       = closeDeletePDV;
window.deletePDV            = deletePDV;
window.togglePDVStatut      = togglePDVStatut;
window.closeStatutPDV       = closeStatutPDV;
window.confirmToggleStatut  = confirmToggleStatut;
window.openResetPassword    = openResetPassword;
window.closeResetPassword   = closeResetPassword;
window.submitResetPassword  = submitResetPassword;
window.togglePdvPassword    = togglePdvPassword;
window.toggleDetailPassword = toggleDetailPassword;