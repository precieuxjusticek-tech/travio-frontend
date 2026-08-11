// ─── TRAVIO — Trajets ───

import { BACKEND, agenceData, trajetList, setTrajetList, pdvList, resaList, vehiculeList, busSteps, setBusSteps, departsCache, setDepartsCache, allDepartsCache, setAllDepartsCache } from './state.js';
import { getColisListe } from './colis-page.js';
import { showToast, showToastAction, TOAST_ICONS } from './toast-utils.js';
import { openResolutionReservationsModal } from './bus-departs.js';
import { formatDelaiFormalite } from './billet-template.js';
import { apiFetch } from './api.js';
import { escapeHtml, escapeJsAttr } from './sanitize.js';

const ICONS = {
  close:    '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  pin:      '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:3px;"><path d="M8 1a5 5 0 00-5 5c0 3.5 5 9 5 9s5-5.5 5-9a5 5 0 00-5-5z" stroke="currentColor" stroke-width="1.4"/><circle cx="8" cy="6" r="1.4" stroke="currentColor" stroke-width="1.4"/></svg>',
  bus:      '<svg width="13" height="13" viewBox="0 0 20 20" fill="none" style="vertical-align:-2px;margin-right:4px;"><rect x="3" y="4" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M3 10h14" stroke="currentColor" stroke-width="1.5"/><circle cx="6" cy="16" r="1.5" stroke="currentColor" stroke-width="1.4"/><circle cx="14" cy="16" r="1.5" stroke="currentColor" stroke-width="1.4"/></svg>',
  info:     '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:4px;"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.4"/><path d="M8 7v4M8 5v.1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  gear:     '<svg width="13" height="13" viewBox="0 0 20 20" fill="none" style="vertical-align:-2px;margin-right:4px;"><circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5"/><path d="M10 2v2.2M10 15.8V18M18 10h-2.2M4.2 10H2M15.5 4.5l-1.5 1.5M6 12.5l-1.5 1.5M15.5 15.5l-1.5-1.5M6 7.5l-1.5-1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  building: '<svg width="14" height="14" viewBox="0 0 26 26" fill="none" style="vertical-align:-2px;margin-right:5px;"><rect x="5" y="9" width="16" height="14" rx="1.5" stroke="currentColor" stroke-width="1.8"/><path d="M9 3h8v6H9z" stroke="currentColor" stroke-width="1.8"/><path d="M9 13h2M9 17h2M15 13h2M15 17h2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  clock:    '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:3px;"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.4"/><path d="M8 5v3.5l2.5 1.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  money:    '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:4px;"><rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.4"/><circle cx="8" cy="8" r="2.2" stroke="currentColor" stroke-width="1.4"/></svg>',
  edit:     '<svg width="13" height="13" viewBox="0 0 14 14" fill="none" style="vertical-align:-2px;margin-right:4px;"><path d="M9 2l3 3L4 13H1v-3L9 2z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  trash:    '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:4px;"><path d="M3 4h10M6 4V2h4v2M4 4l1 10h6l1-10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  stop:     '<svg width="12" height="12" viewBox="0 0 14 14" fill="none" style="vertical-align:-1px;margin-right:3px;"><rect x="3" y="3" width="8" height="8" rx="1" stroke="currentColor" stroke-width="1.4"/></svg>',
  play:     '<svg width="12" height="12" viewBox="0 0 14 14" fill="none" style="vertical-align:-1px;margin-right:3px;"><path d="M4 2.5v9l8-4.5-8-4.5z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>',
  check:    '<svg width="26" height="26" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.4"/><path d="M5 8l2 2 4-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  save:     '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:4px;"><path d="M3 2h8l2.5 2.5V13a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M5 2v4h5V2M4.5 9.5h7v4.5h-7z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>',
  warning:  '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:4px;"><path d="M8 2L1 14h14L8 2z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M8 6.5v3.5M8 12v.1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  person:   '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:3px;"><circle cx="8" cy="6" r="3" stroke="currentColor" stroke-width="1.3"/><path d="M2 15a6 6 0 0112 0" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
};

const OFFSET_MS_BZV = 1 * 60 * 60 * 1000; // Brazzaville = UTC+1

function getTodayBrazzaville() {
  return new Date(Date.now() + OFFSET_MS_BZV).toISOString().split('T')[0];
}

function toBrazzaDate(isoStr) {
  if (!isoStr) return '';
  return new Date(new Date(isoStr).getTime() + OFFSET_MS_BZV).toISOString().split('T')[0];
}

function ageRangeLabel(type) {
  if (!type) return '';
  return type.ageMax == null ? `${type.ageMin} ans et +` : `de ${type.ageMin} à ${type.ageMax} ans`;
}

// ════════════════════════════════
//  TRAJETS — CHARGEMENT
// ════════════════════════════════
export async function loadTrajets(agenceId) {
  try {
    const res = await apiFetch(`${BACKEND}/trajets?agenceId=${agenceId}`);
    const data = await res.json();
    if (!res.ok) return;
    setTrajetList(data.trajets || []);
    renderTrajetsPage();
    updateOverviewStats();
  } catch (err) {
    console.error('Erreur chargement trajets :', err);
    setTrajetList([]);
    renderTrajetsPage();
  }
}

// ════════════════════════════════
//  OVERVIEW — STATS
// ════════════════════════════════
export function updateOverviewStats() {
  const todayStr = getTodayBrazzaville();

  const colisJour = getColisListe().filter(c => toBrazzaDate(c.createdAt) === todayStr);
  const revenuColisJour = colisJour.reduce((s, c) => s + Number(c.prixTransport || 0), 0);

  const elColis = document.getElementById('statColisJour');
  if (elColis) elColis.textContent = revenuColisJour.toLocaleString() + ' XAF';
  const elColisInfo = document.getElementById('statColisJourInfo');
  if (elColisInfo) elColisInfo.textContent = `${colisJour.length} colis expédié${colisJour.length > 1 ? 's' : ''} aujourd'hui`;

  const resaAujourdhui = resaList.filter(r =>
    r.statut !== 'annulée' && toBrazzaDate(r.createdAt) === todayStr
  );
  const revenuJour = resaAujourdhui.reduce((s, r) => s + (r.prixTotal || 0), 0);

  const elResa = document.getElementById('statResa');
  if (elResa) elResa.textContent = resaAujourdhui.length.toLocaleString();
  const elResaDelta = document.getElementById('statResaDelta');
  if (elResaDelta) elResaDelta.textContent = `${resaAujourdhui.length} aujourd'hui`;

  const elRevenu = document.getElementById('statRevenu');
  if (elRevenu) elRevenu.textContent = revenuJour.toLocaleString() + ' XAF';
  const elRevenuDelta = document.getElementById('statRevenuDelta');
  if (elRevenuDelta) elRevenuDelta.textContent = `${resaAujourdhui.length} réservation${resaAujourdhui.length > 1 ? 's' : ''} aujourd'hui`;

  const billetsAujourdhui = resaAujourdhui.reduce((s, r) => s + (r.nbPassagers || 1), 0);

  const elVoy = document.getElementById('statVoyageurs');
  if (elVoy) elVoy.textContent = billetsAujourdhui.toLocaleString();
  const elVoyInfo = document.getElementById('statVoyageursInfo');
  if (elVoyInfo) elVoyInfo.textContent = `${resaAujourdhui.length} réservation${resaAujourdhui.length > 1 ? 's' : ''} aujourd'hui`;

  const overviewResaList = document.getElementById('overviewResaList');
  if (overviewResaList) {
    const confirmees = resaList
      .filter(r => r.statut === 'confirmée')
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      .slice(0, 5);

    if (confirmees.length === 0) {
      overviewResaList.innerHTML = `
        <div class="empty-state">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <rect x="4" y="7" width="28" height="24" rx="4" stroke="currentColor" stroke-width="1.8"/>
            <path d="M10 3v8M26 3v8M4 15h28" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
          <p>Aucune réservation pour l'instant</p>
        </div>`;
    } else {
      overviewResaList.innerHTML = confirmees.map(r => {
        const trajet    = trajetList.find(t => t.id === r.trajetId);
        const route     = escapeHtml(r.routeLabel || (trajet ? `${trajet.villeDepart} → ${trajet.villeArrivee}` : '—'));
        const nom       = escapeHtml(`${r.prenomPassager || ''} ${r.nomPassager || ''}`.trim() || 'Passager');
        const date      = r.dateDepart
          ? new Date(r.dateDepart + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
          : '—';
        const estAujourdhui = toBrazzaDate(r.createdAt) === todayStr;
        const typeLabel = trajet?.typeTrajet === 'arrets'
          ? `<span style="font-size:10px;background:rgba(255,178,63,0.12);color:#FFB23F;padding:2px 6px;border-radius:5px;margin-left:6px;vertical-align:middle;">Arrêts</span>`
          : `<span style="font-size:10px;background:rgba(0,229,160,0.1);color:var(--accent);padding:2px 6px;border-radius:5px;margin-left:6px;vertical-align:middle;">Direct</span>`;
        return `
        <div class="resa-item" onclick="openResaDetail('${escapeJsAttr(r.id)}')" style="cursor:pointer;${estAujourdhui ? 'border-left:3px solid var(--accent);padding-left:9px;' : ''}">
          <div class="resa-info">
            <div class="resa-route">
              ${estAujourdhui ? `<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--accent);margin-right:6px;vertical-align:middle;"></span>` : ''}
              ${nom}
              ${estAujourdhui ? `<span style="font-size:9px;color:var(--accent);font-weight:700;margin-left:6px;text-transform:uppercase;letter-spacing:.5px;">Aujourd'hui</span>` : ''}
            </div>
            <div class="resa-time">${route}${typeLabel} · ${date} · ${escapeHtml(r.heureDepart) || '—'}</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
            <span class="resa-status confirmed" style="display:inline-flex;align-items:center;gap:5px;">
              <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--accent);flex-shrink:0;"></span>
              Confirmée
            </span>
            ${r.baisseNonVerifiee ? `<span class="pdv-status-badge inactive resa-badge-baisse" style="font-size:10px;">${ICONS.warning} Prix réduit</span>` : ''}
            ${r.passagerRetire ? `<span class="pdv-status-badge inactive resa-badge-retrait" style="font-size:10px;">${ICONS.person} Passager retiré</span>` : ''}
          </div>
        </div>`;
      }).join('');

    }
  }
}

// ════════════════════════════════
//  TRAJETS — RENDU PAGE
// ════════════════════════════════

// ════════════════════════════════
//  TRAJETS & BUS — STATS EN-TÊTE
// ════════════════════════════════
function setStatText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

async function updateTrajetsBusStats() {
  // Trajets actifs
  const trajetsActifs = trajetList.filter(t => t.actif !== false).length;
  const trajetsTotal  = trajetList.length;
  setStatText('statTrajetsActifsPage', `${trajetsActifs}/${trajetsTotal}`);
  setStatText('statTrajetsActifsPageInfo', `trajet${trajetsTotal > 1 ? 's' : ''} actif${trajetsActifs > 1 ? 's' : ''}`);

  // Bus actifs (flotte)
  const busActifs = vehiculeList.filter(v => v.actif !== false).length;
  const busTotal   = vehiculeList.length;
  setStatText('statBusActifsPage', `${busActifs}/${busTotal}`);

  // Trajets actifs sans aucun bus assigné (départ actif)
  if (!agenceData?.id) return;
  try {
    const departs = await loadAllDeparts(agenceData.id);
    const trajetsAvecBusActif = new Set(
      departs.filter(d => d.actif !== false).map(d => d.trajetId)
    );
    const trajetsActifsList = trajetList.filter(t => t.actif !== false);
    const trajetsSansBus = trajetsActifsList.filter(t => !trajetsAvecBusActif.has(t.id));

    setStatText('statBusCirculationPage', trajetsSansBus.length.toLocaleString());
    setStatText('statBusCirculationPageInfo', trajetsSansBus.length > 0
      ? `trajet${trajetsSansBus.length > 1 ? 's' : ''} actif${trajetsSansBus.length > 1 ? 's' : ''} sans bus`
      : 'tous les trajets actifs ont un bus');

    // Bus actifs de la flotte sans aucun départ actif
    const vehiculesAvecDepartActif = new Set(
      departs.filter(d => d.actif !== false).map(d => d.vehiculeId)
    );
    const vehiculesActifsList = vehiculeList.filter(v => v.actif !== false);
    const vehiculesNonAssignes = vehiculesActifsList.filter(v => !vehiculesAvecDepartActif.has(v.id));

    setStatText('statPlacesCumuleesPage', vehiculesNonAssignes.length.toLocaleString());
    setStatText('statPlacesCumuleesPageInfo', vehiculesNonAssignes.length > 0
      ? `bus actif${vehiculesNonAssignes.length > 1 ? 's' : ''} non assigné${vehiculesNonAssignes.length > 1 ? 's' : ''}`
      : 'tous les bus actifs sont assignés');
  } catch (err) {
    console.error('Erreur stats trajets/bus non assignés :', err);
  }
}

export function renderTrajetsPage() {
  const container = document.getElementById('trajetsContainer');
  if (!container) return;

  updateTrajetsBusStats();

  if (trajetList.length === 0) {
    container.innerHTML = `
      <div class="overview-card">
        <div class="empty-state large">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="12" cy="36" r="5" stroke="currentColor" stroke-width="2"/>
            <circle cx="36" cy="36" r="5" stroke="currentColor" stroke-width="2"/>
            <path d="M6 36V16a4 4 0 014-4h14l10 10v10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M24 12v10h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <p>Aucun trajet configuré</p>
          <small>Ajoutez votre première ligne pour commencer à recevoir des réservations</small>
          <button class="btn-action-primary" style="margin-top:12px" onclick="openCreateTrajet()">Ajouter un trajet</button>
        </div>
      </div>`;
    return;
  }

  container.innerHTML = trajetList.map(t => renderTrajetCard(t)).join('');
}

export function switchTrajetsTab(tab) {
  const panelTrajets = document.getElementById('trajetsPanel-trajets');
  const panelBus     = document.getElementById('trajetsPanel-bus');
  const btnTrajets   = document.getElementById('trajetsTab-trajets');
  const btnBus       = document.getElementById('trajetsTab-bus');
  const headerBtn    = document.querySelector('#page-trajets .btn-action-primary');

  if (tab === 'bus') {
    panelTrajets.style.display = 'none';
    panelBus.style.display     = 'block';
    btnTrajets.classList.remove('active');
    btnBus.classList.add('active');
    if (headerBtn) { headerBtn.setAttribute('onclick', 'openCreateVehicule()'); headerBtn.lastChild.textContent = ' Nouveau bus'; }
    if (typeof window.renderBusFlottePage === 'function') window.renderBusFlottePage();
  } else {
    panelBus.style.display     = 'none';
    panelTrajets.style.display = 'block';
    btnBus.classList.remove('active');
    btnTrajets.classList.add('active');
    if (headerBtn) { headerBtn.setAttribute('onclick', 'openCreateTrajet()'); headerBtn.lastChild.textContent = ' Nouveau trajet'; }
  }
}

export function renderTrajetCard(t) {
  const joursLabel = t.tousLesJours ? 'Tous les jours' : escapeHtml((t.jours || []).join(', '));
  return `
    <div class="overview-card" style="display:flex;flex-direction:column;gap:10px;cursor:pointer;" onclick="openTrajetDetail('${escapeJsAttr(t.id)}')">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div style="font-family:'Syne',sans-serif;font-size:14px;font-weight:800;color:var(--white);">${escapeHtml(t.villeDepart)} → ${escapeHtml(t.villeArrivee)}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px;">${joursLabel} · ${escapeHtml(t.heureDepart) || '—'}</div>
        </div>
        <span class="pdv-status-badge ${t.actif !== false ? 'active' : 'inactive'}">
          ${t.actif !== false
          ? '<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--accent);margin-right:5px;vertical-align:middle;"></span>Actif'
          : '<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#FF4D6A;margin-right:5px;vertical-align:middle;"></span>Inactif'}
        </span>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <span onclick="event.stopPropagation();openTrajetDetail('${escapeJsAttr(t.id)}','pdv')"
          style="display:inline-flex;align-items:center;gap:4px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:4px 9px;font-size:11px;color:var(--muted);cursor:pointer;">
          ${ICONS.pin} ${(t.pdvDepart || []).length} PDV départ
        </span>
        <span onclick="event.stopPropagation();openTrajetDetail('${escapeJsAttr(t.id)}','pdv')"
          style="display:inline-flex;align-items:center;gap:4px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:4px 9px;font-size:11px;color:var(--muted);cursor:pointer;">
          ${ICONS.pin} ${(t.pdvArrivee || []).length} PDV arrivée
        </span>
      </div>
      <div style="display:flex;gap:16px;font-size:12px;flex-wrap:wrap;">
        ${Object.entries(t.prixParType || {}).map(([typeId, prix]) => {
          const type = (agenceData.typesBillet || []).find(x => x.id === typeId);
          return `<span>${escapeHtml(type?.nom || typeId)} <small style="color:var(--muted);">(${ageRangeLabel(type)})</small> : <strong style="color:var(--white)">${Number(prix).toLocaleString()} XAF</strong></span>`;
        }).join('')}
      </div>
      ${t.typeTrajet === 'arrets' && t.arrets?.length ? `
        <div style="font-size:12px;color:var(--muted);margin-top:4px;">
          <div style="margin-bottom:4px;font-weight:600;color:var(--white);">Arrêts :</div>
          <div style="display:flex;flex-direction:column;gap:3px;padding-left:8px;border-left:2px solid var(--border2);">
            <div style="display:flex;align-items:center;gap:6px;">
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--accent);"></span>
              <span style="color:var(--white);font-weight:600;">${escapeHtml(t.villeDepart)}</span>
              ${t.heureDepart ? `<span style="color:var(--muted);font-size:11px;">· ${escapeHtml(t.heureDepart)}</span>` : ''}
            </div>
            ${t.arrets.map(a => {
              const villeLabel = a.ville || a.nom;
              const nbPDV = pdvList.filter(p => p.actif && p.ville === villeLabel).length;
              return `
                <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">
                  <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                    <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--primary);"></span>
                    <span>${escapeHtml(villeLabel)}</span>
                    ${nbPDV > 0 ? `<span style="font-size:10px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:1px 6px;color:var(--accent);">${nbPDV} PDV</span>` : ''}
                    ${a.heurePassage ? `<span style="color:var(--accent);font-size:11px;font-weight:600;">· ${escapeHtml(a.heurePassage)}</span>` : ''}
                  </div>
                  <span style="color:var(--muted);font-size:11px;">${Object.values(a.prixParType || {}).map(p => Number(p).toLocaleString()).join(' / ')} XAF</span>
                </div>`;
            }).join('')}
            <div style="display:flex;align-items:center;gap:6px;">
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#FF4D6A;"></span>
              <span style="color:var(--white);font-weight:600;">${escapeHtml(t.villeArrivee)}</span>
            </div>
          </div>
        </div>` : ''}
      <div style="display:flex;gap:8px;margin-top:4px;">
        <button class="pdv-action-btn" style="flex:1;font-size:12px;padding:9px 12px;" onclick="event.stopPropagation();openTrajetDetail('${escapeJsAttr(t.id)}')">
          ${ICONS.bus} Voir les bus
        </button>
      </div>
    </div>`;
}

// ════════════════════════════════
//  TRAJETS — DETAIL
// ════════════════════════════════
export async function openTrajetDetail(trajetId, focusSection = null) {
  const t = trajetList.find(t => t.id === trajetId);
  if (!t) return;

  const overlay = document.createElement('div');
  overlay.id = 'trajetDetailOverlay';
  overlay.className = 'pdv-overlay';
  overlay.innerHTML = `
    <div class="pdv-overlay-backdrop" onclick="closeTrajetDetail()"></div>
    <div class="pdv-overlay-panel" style="max-width:560px;">

      <div class="pdv-overlay-header">
        <div>
          <h2>${escapeHtml(t.villeDepart)} → ${escapeHtml(t.villeArrivee)}</h2>
          <p>${t.typeTrajet === 'arrets' ? 'Avec arrêts' : 'Direct'}</p>
        </div>
        <button class="pdv-overlay-close" onclick="closeTrajetDetail()">${ICONS.close}</button>
      </div>

      <div style="display:flex;gap:4px;background:var(--surface);border-radius:10px;padding:4px;margin-bottom:16px;">
        <button id="trajetTab-info" style="flex:1;padding:8px;border:none;border-radius:8px;background:var(--surface2);color:var(--white);font-family:'Syne',sans-serif;font-size:12px;font-weight:700;cursor:pointer;">${ICONS.info} Infos</button>
        <button id="trajetTab-bus" style="flex:1;padding:8px;border:none;border-radius:8px;background:transparent;color:var(--muted);font-family:'Syne',sans-serif;font-size:12px;font-weight:700;cursor:pointer;">${ICONS.bus} Bus</button>
        <button id="trajetTab-actions" style="flex:1;padding:8px;border:none;border-radius:8px;background:transparent;color:var(--muted);font-family:'Syne',sans-serif;font-size:12px;font-weight:700;cursor:pointer;">${ICONS.gear} Actions</button>
      </div>

      <!-- Panel Infos -->
      <div id="trajetPanel-info">
        <div class="pdv-detail-stats" style="margin-bottom:16px;flex-wrap:wrap;row-gap:10px;">
          ${Object.entries(t.prixParType || {}).map(([typeId, prix], i, arr) => {
            const type = (agenceData.typesBillet || []).find(x => x.id === typeId);
            return `
            <div class="pdv-stat-item">
              <span class="pdv-stat-label">${escapeHtml(type?.nom || typeId)}</span>
              <span class="pdv-stat-value" style="font-size:18px;">${Number(prix).toLocaleString()}</span>
              <span style="font-size:10px;color:var(--muted);">XAF</span>
              <span style="font-size:9px;color:var(--muted);display:block;">${ageRangeLabel(type)}</span>
            </div>
            ${(i < arr.length - 1 || t.limiteBagages) ? '<div class="pdv-stat-divider"></div>' : ''}`;
          }).join('')}
          ${t.limiteBagages ? `
          <div class="pdv-stat-item">
            <span class="pdv-stat-label">Bagages</span>
            <span class="pdv-stat-value accent" style="font-size:18px;">${t.limiteBagages}</span>
            <span style="font-size:10px;color:var(--muted);">kg</span>
            ${t.fraisExcesBagages ? `<span style="font-size:10px;color:#FFB23F;font-weight:700;display:block;margin-top:2px;text-align: center;">+${Number(t.fraisExcesBagages).toLocaleString()} XAF/kg excédent</span>` : ''}
          </div>` : ''}
        </div>

        ${agenceData?.delaiFormalite ? `
        <div style="margin-bottom:16px;">
          <div style="font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;">${ICONS.clock} Présentation avant départ</div>
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:10px 14px;font-size:13px;color:var(--white);font-weight:600;">
            ${ICONS.clock} ${formatDelaiFormalite(agenceData.delaiFormalite)}
          </div>
        </div>` : ''}

        <div id="trajetPdvSection" style="margin-bottom:16px;border-radius:10px;">
          <div style="font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;">${ICONS.pin} Points de vente</div>
          <div style="display:flex;flex-direction:column;gap:10px;max-width:440px;margin:0 auto;width:100%;">
            <div>
              <div style="font-size:11.5px;color:var(--muted);margin-bottom:6px;"><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--accent);margin-right:4px;vertical-align:middle;"></span>Départ — ${escapeHtml(t.villeDepart)}</div>
              <div style="display:flex;flex-direction:column;gap:6px;">
                ${(t.pdvDepart || []).length
                  ? t.pdvDepart.map(p => `<div style="display:flex;align-items:center;gap:8px;background:var(--surface);border:1px solid var(--border);border-radius:9px;padding:8px 12px;"><span>${ICONS.building}</span><span style="font-size:12.5px;color:var(--white);font-weight:600;">${escapeHtml(p.nom)}</span></div>`).join('')
                  : `<div style="font-size:11px;color:var(--muted);">Aucun PDV assigné.</div>`}
              </div>
            </div>
            ${t.typeTrajet === 'arrets' && t.arrets?.length ? t.arrets.map(a => {
              const villeArret = a.ville || a.nom;
              const pdvsArret  = pdvList.filter(p => (t.pdvArrets || []).some(pa => pa.id === p.id) && (p.ville || '').toLowerCase() === villeArret.toLowerCase());
              return `
                <div>
                  <div style="font-size:11.5px;color:var(--muted);margin-bottom:6px;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--primary);margin-right:4px;vertical-align:middle;"></span>Arrêt — ${escapeHtml(villeArret)}</div>
                  <div style="display:flex;flex-direction:column;gap:6px;">
                    ${pdvsArret.length
                      ? pdvsArret.map(p => `<div style="display:flex;align-items:center;gap:8px;background:var(--surface);border:1px solid var(--border);border-radius:9px;padding:8px 12px;"><span>${ICONS.building}</span><span style="font-size:12.5px;color:var(--white);font-weight:600;">${escapeHtml(p.nom)}</span></div>`).join('')
                      : `<div style="font-size:11px;color:var(--muted);">Aucun PDV assigné.</div>`}
                  </div>
                </div>`;
            }).join('') : ''}
            <div>
              <div style="font-size:11.5px;color:var(--muted);margin-bottom:6px;"><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#FF4D6A;margin-right:4px;vertical-align:middle;"></span>Arrivée — ${escapeHtml(t.villeArrivee)}</div>
              <div style="display:flex;flex-direction:column;gap:6px;">
                ${(t.pdvArrivee || []).length
                  ? t.pdvArrivee.map(p => `<div style="display:flex;align-items:center;gap:8px;background:var(--surface);border:1px solid var(--border);border-radius:9px;padding:8px 12px;"><span>${ICONS.building}</span><span style="font-size:12.5px;color:var(--white);font-weight:600;">${escapeHtml(p.nom)}</span></div>`).join('')
                  : `<div style="font-size:11px;color:var(--muted);">Aucun PDV assigné.</div>`}
              </div>
            </div>
          </div>
        </div>

        ${t.typeTrajet === 'arrets' && t.arrets?.length ? `
          <div style="margin-bottom:16px;">
            <div style="font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;">Arrêts intermédiaires</div>
            <div style="display:flex;flex-direction:column;gap:6px;">
              <div style="display:flex;align-items:center;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:10px 14px;">
                <div style="display:flex;align-items:center;gap:8px;">
                  <div style="width:8px;height:8px;border-radius:50%;background:var(--accent);flex-shrink:0;"></div>
                  <span style="font-size:13px;font-weight:700;color:var(--white);">${escapeHtml(t.villeDepart)}</span>
                  <span style="font-size:11px;color:var(--muted);">Départ</span>
                </div>
              </div>
              ${t.arrets.map(a => `
                <div style="display:flex;align-items:center;justify-content:space-between;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:10px 14px;margin-left:12px;">
                  <div style="display:flex;align-items:center;gap:8px;">
                    <div style="width:6px;height:6px;border-radius:50%;background:var(--primary);flex-shrink:0;"></div>
                    <span style="font-size:13px;font-weight:600;color:var(--white);">${escapeHtml(a.ville || a.nom)}</span>
                    <span style="font-size:10px;color:var(--muted);background:var(--surface2);padding:2px 6px;border-radius:4px;">Arrêt</span>
                  </div>
                  <div style="text-align:right;">
                    ${a.heurePassage ? `<div style="font-size:12px;color:var(--accent);font-weight:700;margin-bottom:2px;">${ICONS.clock} ${escapeHtml(a.heurePassage)}</div>` : ''}
                    ${Object.entries(a.prixParType || {}).map(([tid, prix]) => {
                      const type = (agenceData.typesBillet || []).find(x => x.id === tid);
                      return `<div style="font-size:11px;color:var(--white);"><strong>${escapeHtml(type?.nom || tid)}</strong> <span style="color:var(--muted);">(${ageRangeLabel(type)})</span> : ${Number(prix).toLocaleString()} XAF</div>`;
                    }).join('')}
                  </div>
                </div>`).join('')}
              <div style="display:flex;align-items:center;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:10px 14px;">
                <div style="display:flex;align-items:center;gap:8px;">
                  <div style="width:8px;height:8px;border-radius:50%;background:#FF4D6A;flex-shrink:0;"></div>
                  <span style="font-size:13px;font-weight:700;color:var(--white);">${escapeHtml(t.villeArrivee)}</span>
                  <span style="font-size:11px;color:var(--muted);">Arrivée</span>
                </div>
              </div>
            </div>
          </div>` : ''}

        ${t.typeTrajet === 'arrets' && t.prixTroncons && Object.keys(t.prixTroncons).length > 0 ? `
          <div style="margin-bottom:16px;">
            <div style="font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;">${ICONS.money} Prix par tronçon</div>
            <div style="display:flex;flex-direction:column;gap:6px;">
              ${Object.entries(t.prixTroncons).map(([cle, prix]) => {
                const [from, to] = cle.split('|');
                return `
                  <div style="display:flex;justify-content:space-between;align-items:center;background:var(--surface);border:1px solid var(--border);border-radius:9px;padding:10px 14px;">
                    <span style="font-size:12px;color:var(--white);font-weight:600;">${escapeHtml(from)} → ${escapeHtml(to)}</span>
                    <div style="text-align:right;">
                      ${Object.entries(prix).map(([tid, val]) => {
                        const type = (agenceData.typesBillet || []).find(x => x.id === tid);
                        return `<div style="font-size:11px;color:var(--white);"><strong>${escapeHtml(type?.nom || tid)}</strong> <span style="color:var(--muted);">(${ageRangeLabel(type)})</span> : ${Number(val).toLocaleString()} XAF</div>`;
                      }).join('')}
                    </div>
                  </div>`;
              }).join('')}
            </div>
          </div>` : ''}
      </div>

      <!-- Panel Bus -->
      <div id="trajetPanel-bus" style="display:none;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <h3 style="font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:var(--white);">${ICONS.bus} Bus sur ce trajet</h3>
          <button class="btn-action-primary" style="padding:7px 12px;font-size:12px;" onclick="openCreateDepart('${escapeJsAttr(t.id)}')">+ Ajouter un bus</button>
        </div>
        <div id="departsList" style="display:flex;flex-direction:column;gap:8px;">
          <div style="text-align:center;padding:16px;color:var(--muted);font-size:12px;">Chargement...</div>
        </div>
      </div>

      <!-- Panel Actions -->
      <div id="trajetPanel-actions" style="display:none;">
        <div class="pdv-detail-actions">
          <button class="pdv-action-btn" onclick="closeTrajetDetail();openEditTrajet('${escapeJsAttr(t.id)}')">${ICONS.edit} Modifier le trajet</button>
          <button class="pdv-action-btn danger" onclick="toggleTrajetStatut('${escapeJsAttr(t.id)}', ${t.actif !== false})">
            ${t.actif !== false ? ICONS.stop + ' Désactiver le trajet' : ICONS.play + ' Activer le trajet'}
          </button>
          <button class="pdv-action-btn delete" onclick="confirmDeleteTrajet('${escapeJsAttr(t.id)}', '${escapeJsAttr(t.villeDepart)} → ${escapeJsAttr(t.villeArrivee)}')">${ICONS.trash} Supprimer le trajet</button>
        </div>
      </div>

    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));

  if (focusSection === 'pdv') {
    setTimeout(() => {
      const el = document.getElementById('trajetPdvSection');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        el.style.transition = 'background-color 0.4s';
        el.style.backgroundColor = 'var(--surface2)';
        setTimeout(() => { el.style.backgroundColor = ''; }, 1200);
      }
    }, 200);
  }

  if (focusSection === 'bus') {
    setTimeout(() => switchTrajetTab('bus', t.id), 100);
  }

  setTimeout(() => {
    document.getElementById('trajetTab-info')?.addEventListener('click', () => switchTrajetTab('info'));
    document.getElementById('trajetTab-bus')?.addEventListener('click',  () => switchTrajetTab('bus', t.id));
    document.getElementById('trajetTab-actions')?.addEventListener('click', () => switchTrajetTab('actions'));
  }, 50);

  loadDeparts(t.id).then(departs => {
    const list = document.getElementById('departsList');
    if (list) {
      list.innerHTML = departs.length === 0
        ? `<div style="text-align:center;padding:20px;color:var(--muted);font-size:12px;">Aucun bus ajouté — <button onclick="openCreateDepart('${escapeJsAttr(t.id)}')" style="background:none;border:none;color:var(--primary);cursor:pointer;font-size:12px;">Ajouter un bus</button></div>`
        : departs.map(d => renderDepartItem(d, t.id)).join('');
    }
  });
}

export function switchTrajetTab(tab, trajetId = null) {
  ['info', 'bus', 'actions'].forEach(name => {
    const panel = document.getElementById(`trajetPanel-${name}`);
    const btn   = document.getElementById(`trajetTab-${name}`);
    if (panel) panel.style.display = 'none';
    if (btn)   { btn.style.background = 'transparent'; btn.style.color = 'var(--muted)'; }
  });

  const activePanel = document.getElementById(`trajetPanel-${tab}`);
  const activeBtn   = document.getElementById(`trajetTab-${tab}`);
  if (activePanel) activePanel.style.display = 'block';
  if (activeBtn)   { activeBtn.style.background = 'var(--surface2)'; activeBtn.style.color = 'var(--white)'; }

  if (tab === 'bus' && trajetId) {
    loadDeparts(trajetId).then(departs => {
      const list = document.getElementById('departsList');
      if (list) {
        list.innerHTML = departs.length === 0
          ? `<div style="text-align:center;padding:20px;color:var(--muted);font-size:12px;">Aucun bus — <button onclick="openCreateDepart('${escapeJsAttr(trajetId)}')" style="background:none;border:none;color:var(--primary);cursor:pointer;font-size:12px;">Ajouter un bus</button></div>`
          : departs.map(d => renderDepartItem(d, trajetId)).join('');
      }
    });
  }
}

export function closeTrajetDetail() {
  const o = document.getElementById('trajetDetailOverlay');
  if (o) { o.classList.remove('show'); setTimeout(() => o.remove(), 350); }
}

// ════════════════════════════════
//  TRAJETS — SUPPRIMER
// ════════════════════════════════
export function confirmDeleteTrajet(trajetId, trajetLabel) {
  closeTrajetDetail();
  const overlay = document.createElement('div');
  overlay.id = 'deleteTrajetOverlay';
  overlay.className = 'pdv-overlay';
  overlay.innerHTML = `
    <div class="pdv-overlay-backdrop" onclick="closeDeleteTrajet()"></div>
    <div class="pdv-overlay-panel pdv-confirm-panel">
      <div class="pdv-confirm-icon">${ICONS.trash}</div>
      <h2>Supprimer ce trajet ?</h2>
      <p>Tu es sur le point de supprimer <strong>${escapeHtml(trajetLabel)}</strong> et tous ses bus.</p>
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin:10px 0;display:flex;flex-direction:column;gap:8px;font-size:12px;">
        <div style="display:flex;align-items:flex-start;gap:8px;">
          <span style="background:#3D0F0F;color:#FF6B6B;font-size:11px;padding:2px 8px;border-radius:6px;white-space:nowrap;">PDV impactés</span>
          <span style="color:var(--muted);line-height:1.6;">Les PDV assignés à ce trajet <strong style="color:var(--white);">perdront immédiatement</strong> l'accès à la vente de billets dessus.</span>
        </div>
        <div style="height:1px;background:var(--border);"></div>
        <div style="display:flex;align-items:flex-start;gap:8px;">
          <span style="background:#3D2A00;color:#FFA940;font-size:11px;padding:2px 8px;border-radius:6px;white-space:nowrap;">Sessions futures</span>
          <span style="color:var(--muted);">Supprimées définitivement.</span>
        </div>
        <div style="display:flex;align-items:flex-start;gap:8px;">
          <span style="background:#0D2340;color:#4DA6FF;font-size:11px;padding:2px 8px;border-radius:6px;white-space:nowrap;">Historique</span>
          <span style="color:var(--muted);">Trajet, bus et sessions passées conservés 1 an.</span>
        </div>
      </div>
      <div class="pdv-confirm-actions">
        <button class="pdv-btn-next delete-confirm" onclick="deleteTrajet('${escapeJsAttr(trajetId)}')">Oui, supprimer</button>
        <button class="pdv-btn-back" onclick="closeDeleteTrajet()">Annuler</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
}

export async function deleteTrajet(trajetId) {
  closeDeleteTrajet();
  try {
    const res = await apiFetch(`${BACKEND}/trajet/${trajetId}`, { method: 'DELETE' });
    const data = await res.json();

    if (res.status === 409 && data.code === 'RESA_BLOQUANTES') {
      openResolutionReservationsModal(data.sessions, data.message, { trajetId, actionType: 'delete-trajet' });
      return;
    }
    if (!res.ok) { showToast('Erreur lors de la suppression du trajet.', TOAST_ICONS.error); return; }
    setTrajetList(trajetList.filter(t => t.id !== trajetId));
    renderTrajetsPage();
    updateOverviewStats();
    showToast('Trajet supprimé avec succès.', TOAST_ICONS.success, true);
  } catch (err) {
    console.error('Erreur suppression trajet :', err);
    showToast('Impossible de contacter le serveur.', TOAST_ICONS.error);
  }
}

export function closeDeleteTrajet() {
  const o = document.getElementById('deleteTrajetOverlay');
  if (o) { o.classList.remove('show'); setTimeout(() => o.remove(), 350); }
}

// ════════════════════════════════
//  TRAJETS — ACTIVER / DÉSACTIVER
// ════════════════════════════════
export async function toggleTrajetStatut(trajetId, actifActuel) {
  const nouvelEtat = !actifActuel;
  const overlay = document.createElement('div');
  overlay.id = 'statutTrajetOverlay';
  overlay.className = 'pdv-overlay';
  overlay.innerHTML = `
    <div class="pdv-overlay-backdrop" onclick="closeStatutTrajet()"></div>
    <div class="pdv-overlay-panel pdv-confirm-panel">
      <div class="pdv-confirm-icon">${nouvelEtat ? ICONS.check : ICONS.stop}</div>
      <h2>${nouvelEtat ? 'Activer' : 'Désactiver'} ce trajet ?</h2>
      <p>Le trajet <strong>${escapeHtml(trajetList.find(t=>t.id===trajetId)?.villeDepart)} → ${escapeHtml(trajetList.find(t=>t.id===trajetId)?.villeArrivee)}</strong> ne sera plus disponible à la réservation.</p>
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin:10px 0;display:flex;flex-direction:column;gap:8px;font-size:12px;">
        <div style="display:flex;align-items:flex-start;gap:8px;">
          <span style="background:#3D0F0F;color:#FF6B6B;font-size:11px;padding:2px 8px;border-radius:6px;white-space:nowrap;">PDV impactés</span>
          <span style="color:var(--muted);line-height:1.6;">Les PDV assignés ne verront plus ce trajet dans leur interface de vente.</span>
        </div>
        <div style="height:1px;background:var(--border);"></div>
        <div style="display:flex;align-items:flex-start;gap:8px;">
          <span style="background:#3D2A00;color:#FFA940;font-size:11px;padding:2px 8px;border-radius:6px;white-space:nowrap;">Sessions futures</span>
          <span style="color:var(--muted);">Supprimées. À régénérer si tu réactives le trajet.</span>
        </div>
        <div style="display:flex;align-items:flex-start;gap:8px;">
          <span style="background:#0D2340;color:#4DA6FF;font-size:11px;padding:2px 8px;border-radius:6px;white-space:nowrap;">Réservations existantes</span>
          <span style="color:var(--muted);">Non affectées.</span>
        </div>
      </div>
      <div class="pdv-confirm-actions">
        <button class="pdv-btn-next ${nouvelEtat ? '' : 'delete-confirm'}"
          style="${nouvelEtat ? 'background:var(--accent);color:var(--dark);' : ''}"
          onclick="confirmToggleTrajetStatut('${escapeJsAttr(trajetId)}', ${nouvelEtat})">
          ${nouvelEtat ? 'Oui, activer' : 'Oui, désactiver'}
        </button>
        <button class="pdv-btn-back" onclick="closeStatutTrajet()">Annuler</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
}

export function closeStatutTrajet() {
  const o = document.getElementById('statutTrajetOverlay');
  if (o) { o.classList.remove('show'); setTimeout(() => o.remove(), 350); }
}

export async function confirmToggleTrajetStatut(trajetId, nouvelEtat) {
  closeStatutTrajet();
  try {
    const res = await apiFetch(`${BACKEND}/trajet/${trajetId}/statut`, {
      method: 'PATCH',
      body: JSON.stringify({ actif: nouvelEtat }),
    });
    const data = await res.json();

    if (res.status === 409 && data.code === 'RESA_BLOQUANTES') {
      openResolutionReservationsModal(data.sessions, data.message, { trajetId, actionType: 'statut-trajet', nouvelEtat });
      return;
    }
    if (!res.ok) { showToast('Erreur lors du changement de statut.', TOAST_ICONS.error); return; }

    const trajet = trajetList.find(t => t.id === trajetId);
    if (trajet) trajet.actif = nouvelEtat;

    renderTrajetsPage();
    updateOverviewStats();
    showToast(nouvelEtat ? 'Trajet activé avec succès.' : 'Trajet désactivé avec succès.', nouvelEtat ? TOAST_ICONS.success : TOAST_ICONS.error, nouvelEtat);

    if (nouvelEtat && data.busDesactives > 0) {
      setTimeout(() => {
        showToastAction(
          `${data.busDesactives} bus réactivé(s) — pensez à régénérer leurs sessions.`,
          TOAST_ICONS.info,
          'Voir les bus',
          () => { closeTrajetDetail(); setTimeout(() => openTrajetDetail(trajetId, 'bus'), 400); }
        );
      }, 800);
    }

    closeTrajetDetail();
    setTimeout(() => openTrajetDetail(trajetId), 400);

  } catch (err) {
    console.error('Erreur statut trajet :', err);
    showToast('Impossible de contacter le serveur.', TOAST_ICONS.error);
  }
}

// ════════════════════════════════
//  TRAJETS — MODIFIER
// ════════════════════════════════
export function openEditTrajet(trajetId) {
  const t = trajetList.find(t => t.id === trajetId);
  if (!t) return;

  // Regrouper les arrêts existants par ville (les PDV d'une même ville partagent prix/heure)
  const arretsGroupes = [];
  (t.arrets || []).forEach(a => {
    let groupe = arretsGroupes.find(g => g.ville === a.ville && g.type === a.type);
    if (!groupe) {
      groupe = { ville: a.ville, type: a.type, heurePassage: a.heurePassage, prixParType: a.prixParType, pdvs: [] };
      arretsGroupes.push(groupe);
    }
    if (a.type === 'pdv') groupe.pdvs.push({ id: a.id, nom: a.nom });
  });

  const arretsSection = t.typeTrajet === 'arrets' ? `
    <div style="height:1px;background:var(--border);margin:8px 0;"></div>
    <div class="pdv-field-group">
      <label style="font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;">Arrêts intermédiaires</label>
      <div id="editArretsList" style="display:flex;flex-direction:column;gap:8px;margin-top:8px;">
        ${arretsGroupes.map((g, i) => g.type === 'libre' ? `
          <div class="arret-item" id="editArretItem-${i}" style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:12px 14px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
              <div style="display:flex;align-items:center;gap:8px;">
                <div style="width:7px;height:7px;border-radius:50%;background:var(--primary);flex-shrink:0;"></div>
                <span style="font-size:13px;font-weight:700;color:var(--white);">${escapeHtml(g.ville)}</span>
                <span style="font-size:10px;color:var(--muted);background:var(--surface2);padding:2px 7px;border-radius:5px;">Lieu</span>
              </div>
              <button type="button" onclick="removeEditArret(${i})" style="background:none;border:none;color:#FF4D6A;font-size:18px;cursor:pointer;padding:2px 6px;line-height:1;">×</button>
            </div>
            <div class="edit-arret-grid" style="grid-template-columns:1fr 1fr;">
              <input type="hidden" class="edit-arret-marker" data-index="${i}" data-nom="${escapeHtml(g.ville)}" data-type="libre" data-id="">
              <div>
                <label style="font-size:11px;color:var(--muted);display:block;margin-bottom:5px;">Heure passage</label>
                <input type="time" class="pdv-input edit-arret-heure-passage" value="${escapeHtml(g.heurePassage) || ''}" data-index="${i}">
              </div>
              ${agenceData.typesBillet.map(type => `
              <div>
                <label style="font-size:11px;color:var(--muted);display:block;margin-bottom:5px;">Prix ${escapeHtml(type.nom)} (XAF)</label>
                <p style="font-size:9px;color:var(--muted);margin:-2px 0 4px;">${ageRangeLabel(type)}</p>
                <input type="number" class="pdv-input edit-arret-prix-type" value="${g.prixParType?.[type.id] ?? ''}" data-index="${i}" data-type-id="${type.id}" placeholder="0" min="0">
              </div>`).join('')}
            </div>
          </div>` : `
          <div class="arret-city-group" id="editArretCity-${i}" data-ville="${escapeHtml(g.ville)}" style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:12px 14px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
              <div style="width:7px;height:7px;border-radius:50%;background:var(--primary);flex-shrink:0;"></div>
              <span style="font-size:13px;font-weight:700;color:var(--white);">${escapeHtml(g.ville)}</span>
              <span style="font-size:10px;color:var(--muted);background:var(--surface2);padding:2px 7px;border-radius:5px;">PDV</span>
            </div>
            <div class="pdv-multi-select" id="editArretCityPdv-${i}" style="margin-bottom:10px;"></div>
            <div class="edit-arret-grid" style="grid-template-columns:1fr 1fr;">
              <div>
                <label style="font-size:11px;color:var(--muted);display:block;margin-bottom:5px;">Heure passage</label>
                <input type="time" class="pdv-input edit-arret-city-heure" data-index="${i}" value="${escapeHtml(g.heurePassage) || ''}">
              </div>
              ${agenceData.typesBillet.map(type => `
              <div>
                <label style="font-size:11px;color:var(--muted);display:block;margin-bottom:5px;">Prix ${escapeHtml(type.nom)} (XAF)</label>
                <p style="font-size:9px;color:var(--muted);margin:-2px 0 4px;">${ageRangeLabel(type)}</p>
                <input type="number" class="pdv-input edit-arret-city-prix" data-index="${i}" data-type-id="${type.id}" value="${g.prixParType?.[type.id] ?? ''}" placeholder="0" min="0">
              </div>`).join('')}
            </div>
          </div>`).join('')}
      </div>
      <button type="button" class="pdv-action-btn" style="margin-top:8px;font-size:12px;" onclick="addEditArretItem('${escapeJsAttr(t.id)}')">+ Ajouter un arrêt (nouvelle ville)</button>
    </div>` : '';

  const overlay = document.createElement('div');
  overlay.id = 'editTrajetOverlay';
  overlay.className = 'pdv-overlay';
  overlay.innerHTML = `
    <div class="pdv-overlay-backdrop" onclick="closeEditTrajet()"></div>
    <div class="pdv-overlay-panel" style="max-width:560px;">
      <div class="pdv-overlay-header">
        <div>
          <h2>Modifier le trajet</h2>
          <p>${escapeHtml(t.villeDepart)} → ${escapeHtml(t.villeArrivee)} · ${t.typeTrajet === 'arrets' ? 'Avec arrêts' : 'Direct'}</p>
        </div>
        <button class="pdv-overlay-close" onclick="closeEditTrajet()">${ICONS.close}</button>
      </div>
      <div class="pdv-create-fields">
        <div class="edit-trajet-grid">
          ${agenceData.typesBillet.map(type => `
            <div class="pdv-field-group">
              <label>Prix ${escapeHtml(type.nom)} (XAF) <span class="req">*</span></label>
              <p class="pdv-field-hint" style="margin:-2px 0 4px;">${type.ageMax == null ? `${type.ageMin} ans et +` : `de ${type.ageMin} à ${type.ageMax} ans`}</p>
              <input type="number" class="pdv-input et-prix-type" data-type-id="${type.id}" value="${t.prixParType?.[type.id] ?? ''}">
            </div>`).join('')
          }
        </div>
        <div class="edit-trajet-grid">
          <div class="pdv-field-group"><label>Limite bagages (kg)</label><input type="number" class="pdv-input" id="et-limite-bagages" value="${t.limiteBagages || ''}"></div>
          <div class="pdv-field-group"><label>Frais excédent (XAF/kg)</label><input type="number" class="pdv-input" id="et-frais-exces" value="${t.fraisExcesBagages || ''}"></div>
        </div>
        <div class="pdv-field-group">
          <label>PDV de départ <span class="req">*</span></label>
          <p class="pdv-field-hint" style="margin:-2px 0 4px;">Ville : ${escapeHtml(t.villeDepart)}</p>
          <div class="pdv-multi-select" id="edit-pdvDepartList"></div>
        </div>
        <div class="pdv-field-group">
          <label>PDV d'arrivée</label>
          <p class="pdv-field-hint" style="margin:-2px 0 4px;">Ville : ${escapeHtml(t.villeArrivee)}</p>
          <div class="pdv-multi-select" id="edit-pdvArriveeList"></div>
        </div>
        ${arretsSection}
      </div>

      ${t.typeTrajet === 'arrets' && (t.arrets||[]).length > 0 ? (() => {
        const villesArrets = (t.arrets||[]).map(a => a.ville || a.nom);
        const pointsApresDepart = [...villesArrets, t.villeArrivee];
        let html = `<div class="pdv-field-group">
          <label>${ICONS.money} Prix par tronçon</label>
          <div style="font-size:11px;color:var(--muted);margin:6px 0 10px;padding:8px 12px;background:var(--surface);border-radius:8px;border:1px solid var(--border);">
            ${ICONS.info} Les prix depuis <strong style="color:var(--white);">${escapeHtml(t.villeDepart)}</strong> sont dans les champs d'arrêts ci-dessus.
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;margin-top:4px;">`;
        for (let i = 0; i < pointsApresDepart.length - 1; i++) {
          for (let j = i + 1; j < pointsApresDepart.length; j++) {
            const from = pointsApresDepart[i], to = pointsApresDepart[j];
            const cle  = `${from}|${to}`;
            const prixExistant = t.prixTroncons?.[cle];
            html += `
              <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:10px 14px;">
                <div style="font-size:12px;font-weight:700;color:var(--white);margin-bottom:8px;">${escapeHtml(from)} → ${escapeHtml(to)}</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                  ${agenceData.typesBillet.map(type => `
                  <div><label style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px;">Prix ${escapeHtml(type.nom)} (XAF)</label>
                    <p style="font-size:9px;color:var(--muted);margin:-2px 0 4px;">${ageRangeLabel(type)}</p>
                    <input type="number" class="pdv-input troncon-prix-type" data-cle="${escapeHtml(cle)}" data-type-id="${type.id}" value="${prixExistant?.[type.id] ?? ''}" placeholder="Ex : 5000" min="0"></div>`).join('')}
                </div>
              </div>`;
          }
        }
        html += `</div></div>`;
        return html;
      })() : ''}

      <button class="pdv-btn-next" id="editTrajetSubmitBtn" onclick="submitEditTrajet('${escapeJsAttr(t.id)}')">${ICONS.save} Sauvegarder les modifications</button>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
  renderPDVMultiSelectEdit('edit-pdvDepartList',  t.villeDepart,  t.pdvDepart  || []);
  renderPDVMultiSelectEdit('edit-pdvArriveeList', t.villeArrivee, t.pdvArrivee || []);

  arretsGroupes.forEach((g, i) => {
    if (g.type === 'pdv') renderArretPDVMultiSelectEdit(`editArretCityPdv-${i}`, g.ville, g.pdvs);
  });
}

export function addEditArretItem(trajetId) {
  const list = document.getElementById('editArretsList');
  if (!list) return;
  const index = Date.now();
  const div   = document.createElement('div');
  div.className = 'arret-item';
  div.id = `editArretItem-new-${index}`;
  div.style.cssText = 'background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:0;';

  const trajet = trajetList.find(t => t.id === trajetId);
  const villesArretsExistantes = [...new Set((trajet?.arrets || []).map(a => a.ville))];
  const villesOptions = [...new Set(pdvList.filter(p => p.actif).map(p => p.ville))]
    .filter(v => v && v !== trajet?.villeDepart && v !== trajet?.villeArrivee && !villesArretsExistantes.includes(v))
    .sort()
    .map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`)
    .join('') + `<option value="__libre__">Autre lieu...</option>`;

  div.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
      <select class="pdv-select arret-ville-select" id="arret-ville-${index}" onchange="onEditArretVilleChange(${index});genererTableauTronconsEdit()">
        <option value="">Sélectionner une ville</option>
        ${villesOptions}
      </select>
      <button type="button" onclick="removeArretItem(this)" style="background:none;border:none;color:#FF4D6A;font-size:20px;cursor:pointer;padding:2px 6px;line-height:1;">×</button>
    </div>
    <div id="editArretLibreWrap-${index}" style="display:none;margin-bottom:10px;">
      <input type="text" class="pdv-input" id="editArretLibreNom-${index}" placeholder="Ex : Carrefour Total, Poste de Gare...">
    </div>
    <div class="pdv-multi-select arret-pdv-container" id="arret-pdv-${index}" style="margin-bottom:10px;display:none;"></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(110px, 1fr));gap:10px;">
      <div><label style="font-size:11px;color:var(--muted);display:block;margin-bottom:5px;font-weight:600;">Heure passage</label><input type="time" class="pdv-input edit-arret-heure-passage-new"></div>
      ${agenceData.typesBillet.map(t => `
      <div><label style="font-size:11px;color:var(--muted);display:block;margin-bottom:5px;font-weight:600;">Prix ${escapeHtml(t.nom)} (XAF)</label><p style="font-size:9px;color:var(--muted);margin:-2px 0 4px;">${ageRangeLabel(t)}</p><input type="number" class="pdv-input edit-arret-prix-type-new" data-type-id="${t.id}" placeholder="Ex : 5000" min="0"></div>`).join('')}
    </div>
  `;
 list.appendChild(div);
 genererTableauTronconsEdit();
 div.querySelector(`#editArretLibreNom-${index}`)?.addEventListener('input', genererTableauTronconsEdit);
}

export function onEditArretVilleChange(index) {
  const ville     = document.getElementById(`arret-ville-${index}`)?.value;
  const container = document.getElementById(`arret-pdv-${index}`);
  const libreWrap = document.getElementById(`editArretLibreWrap-${index}`);
  if (!container) return;

  if (!ville) {
    container.style.display = 'none'; container.innerHTML = '';
    if (libreWrap) libreWrap.style.display = 'none';
    return;
  }

  if (ville === '__libre__') {
    if (libreWrap) libreWrap.style.display = 'block';
    container.style.display = 'none';
    container.innerHTML = '';
    return;
  }
  if (libreWrap) libreWrap.style.display = 'none';

  const pdvsVille = pdvList.filter(p => p.actif && p.ville === ville);
  if (pdvsVille.length === 0) {
    container.style.display = 'flex';
    container.innerHTML = `<span style="font-size:12px;color:var(--muted);">Aucun PDV disponible dans cette ville</span>`;
    return;
  }
  container.style.display = 'flex';
  container.innerHTML = pdvsVille.map(p => `
    <label class="pdv-multi-item">
      <input type="checkbox" value="${p.id}" data-nom="${escapeHtml(p.nom)}" data-ville="${escapeHtml(p.ville)}" class="arret-pdv-check" checked>
      <span class="pdv-multi-label"><strong>${escapeHtml(p.nom)}</strong><small>${escapeHtml(p.adresse || p.ville || '')}</small></span>
    </label>`).join('');
}

export function removeEditArret(index) {
  const el = document.getElementById(`editArretItem-${index}`);
  if (el) {
    el.remove();
    genererTableauTronconsEdit();
  }
}

export function closeEditTrajet() {
  const o = document.getElementById('editTrajetOverlay');
  if (o) { o.classList.remove('show'); setTimeout(() => o.remove(), 350); }
}

export function genererTableauTronconsEdit() {
  // Récupérer le trajet en cours d'édition
  const overlay = document.getElementById('editTrajetOverlay');
  if (!overlay) return;

  // Récupérer toutes les villes des arrêts encore présents dans le formulaire
  const villesArrets = [];
  const elementsOrdonnes = [...document.querySelectorAll('#editArretsList > .arret-item, #editArretsList > .arret-city-group')];

  elementsOrdonnes.forEach(el => {
    if (el.classList.contains('arret-city-group')) {
      const ville = el.dataset.ville;
      const aUnPdvCoche = el.querySelector('.edit-arret-pdv-check:checked');
      if (ville && aUnPdvCoche) villesArrets.push(ville);
      return;
    }
    const marker = el.querySelector('.edit-arret-marker');
    if (marker) {
      const nom = marker.dataset.nom;
      if (nom) villesArrets.push(nom);
      return;
    }
    const sel = el.querySelector('.arret-ville-select');
    if (!sel || !sel.value) return;
    if (sel.value === '__libre__') {
      const index    = sel.id.replace('arret-ville-', '');
      const nomLibre = document.getElementById(`editArretLibreNom-${index}`)?.value.trim();
      if (nomLibre) villesArrets.push(nomLibre);
    } else {
      villesArrets.push(sel.value);
    }
  });

  if (villesArrets.length === 0) {
    // Supprimer la section tronçons si plus d'arrêts
    const existing = document.getElementById('editTronconsPrixWrap');
    if (existing) existing.remove();
    return;
  }

  // Trouver villeArrivee depuis le titre du panel
  const trajetId = overlay.querySelector('[id^="editTrajetSubmitBtn"]')
    ?.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
  const trajet = trajetId ? trajetList.find(t => t.id === trajetId) : null;
  if (!trajet) return;

  const pointsApresDepart = [...villesArrets, trajet.villeArrivee];

  let html = `
    <div class="pdv-field-group" id="editTronconsPrixWrap">
      <label>${ICONS.money} Prix par tronçon</label>
      <div style="font-size:11px;color:var(--muted);margin:6px 0 10px;padding:8px 12px;background:var(--surface);border-radius:8px;border:1px solid var(--border);">
        ${ICONS.info} Les prix depuis <strong style="color:var(--white);">${escapeHtml(trajet.villeDepart)}</strong> sont dans les champs d'arrêts ci-dessus.
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:4px;">`;

  for (let i = 0; i < pointsApresDepart.length - 1; i++) {
    for (let j = i + 1; j < pointsApresDepart.length; j++) {
      const from = pointsApresDepart[i], to = pointsApresDepart[j];
      const cle  = `${from}|${to}`;
      const prixExistant = trajet.prixTroncons?.[cle];
      html += `
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:10px 14px;">
          <div style="font-size:12px;font-weight:700;color:var(--white);margin-bottom:8px;">${escapeHtml(from)} → ${escapeHtml(to)}</div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${agenceData.typesBillet.map(t => `
            <div><label style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px;">Prix ${escapeHtml(t.nom)} (XAF)</label>
              <p style="font-size:9px;color:var(--muted);margin:-2px 0 4px;">${ageRangeLabel(t)}</p>
              <input type="number" class="pdv-input troncon-prix-type" data-cle="${escapeHtml(cle)}" data-type-id="${t.id}" value="${prixExistant?.[t.id] ?? ''}" placeholder="Ex : 5000" min="0"></div>`).join('')}
          </div>
        </div>`;
    }
  }
  html += `</div></div>`;

  // Remplacer ou insérer la section tronçons
  const existing = document.getElementById('editTronconsPrixWrap');
  if (existing) {
    existing.outerHTML = html;
  } else {
    // L'insérer avant le bouton submit
    const submitBtn = document.getElementById('editTrajetSubmitBtn');
    if (submitBtn) submitBtn.insertAdjacentHTML('beforebegin', html);
  }
}

function pdvARealiseVentesSurTrajet(pdvId, trajetId) {
  return resaList.some(r =>
    r.trajetId === trajetId &&
    r.pdvId === pdvId &&
    r.statut !== 'annulée'
  );
}

export async function submitEditTrajet(trajetId) {
  const t = trajetList.find(t => t.id === trajetId);

  const prixParType = {};
  let erreurPrix = false;
  document.querySelectorAll('.et-prix-type').forEach(input => {
    if (input.value === '') { erreurPrix = true; return; }
    prixParType[input.dataset.typeId] = parseInt(input.value);
  });
  if (erreurPrix) { showToast('Entrez tous les prix par type de billet.', TOAST_ICONS.warning); return; }

  const payload = {
    prixParType,
    limiteBagages:     document.getElementById('et-limite-bagages')?.value ? parseInt(document.getElementById('et-limite-bagages').value) : null,
    fraisExcesBagages: document.getElementById('et-frais-exces')?.value    ? parseInt(document.getElementById('et-frais-exces').value)    : null,
  };

  const pdvDepartChecks = [...document.querySelectorAll('#edit-pdvDepartList .edit-pdv-multi-check:checked')];
  if (pdvDepartChecks.length === 0) {
    showToast('Sélectionnez au moins un PDV de départ.', TOAST_ICONS.warning);
    return;
  }
  payload.pdvDepart = pdvDepartChecks.map(c => ({ id: c.value, nom: c.dataset.nom }));

  const pdvArriveeChecks = [...document.querySelectorAll('#edit-pdvArriveeList .edit-pdv-multi-check:checked')];
  payload.pdvArrivee = pdvArriveeChecks.map(c => ({ id: c.value, nom: c.dataset.nom }));

  const pdvDepartRetires  = (t?.pdvDepart  || []).filter(p => !payload.pdvDepart.some(np => np.id === p.id));
  const pdvArriveeRetires = (t?.pdvArrivee || []).filter(p => !payload.pdvArrivee.some(np => np.id === p.id));
  const pdvDepartArriveeRetiresAvecVentes = [...pdvDepartRetires, ...pdvArriveeRetires]
    .filter(p => pdvARealiseVentesSurTrajet(p.id, trajetId));

  if (t?.typeTrajet === 'arrets') {
    const arrets = [];
    let erreurArret = false;

    const elementsOrdonnes = [...document.querySelectorAll('#editArretsList > .arret-item, #editArretsList > .arret-city-group')];

    elementsOrdonnes.forEach(el => {
      if (erreurArret) return;

      // Arrêt PDV existant (groupé par ville)
      if (el.classList.contains('arret-city-group')) {
        const ville = el.dataset.ville;
        const i = el.id.replace('editArretCity-', '');
        const prixParType = {};
        let manque = false;
        document.querySelectorAll(`.edit-arret-city-prix[data-index="${i}"]`).forEach(inp => {
          if (inp.value === '') { manque = true; return; }
          prixParType[inp.dataset.typeId] = parseInt(inp.value);
        });
        const heurePassage = document.querySelector(`.edit-arret-city-heure[data-index="${i}"]`)?.value || null;
        const pdvsCochés = [...el.querySelectorAll('.edit-arret-pdv-check:checked')];
        if (pdvsCochés.length === 0) return;
        if (manque) { showToast(`Entrez les prix pour l'arrêt à ${ville}.`, TOAST_ICONS.warning); erreurArret = true; return; }
        pdvsCochés.forEach(c => {
          arrets.push({ type: 'pdv', id: c.value, nom: c.dataset.nom, ville, prixParType, heurePassage });
        });
        return;
      }

      // Arrêt "lieu libre" existant
      const marker = el.querySelector('.edit-arret-marker');
      if (marker) {
        const i = marker.dataset.index;
        const prixParType = {};
        document.querySelectorAll(`.edit-arret-prix-type[data-index="${i}"]`).forEach(inp => {
          prixParType[inp.dataset.typeId] = parseInt(inp.value) || 0;
        });
        const heurePassage = document.querySelector(`.edit-arret-heure-passage[data-index="${i}"]`)?.value || null;
        const nom = marker.dataset.nom;
        if (nom) arrets.push({ nom, type: 'libre', prixParType, heurePassage, ville: nom });
        return;
      }

      // Nouvel arrêt ajouté via "+ Ajouter un arrêt"
      let ville = el.querySelector('.arret-ville-select')?.value;
      if (!ville) { showToast('Sélectionnez une ville pour chaque arrêt ajouté.', TOAST_ICONS.warning); erreurArret = true; return; }

      let estLibre = false;
      if (ville === '__libre__') {
        const index    = el.querySelector('.arret-ville-select')?.id.replace('arret-ville-', '');
        const nomLibre = document.getElementById(`editArretLibreNom-${index}`)?.value.trim();
        if (!nomLibre) { showToast('Entrez le nom du lieu libre.', TOAST_ICONS.warning); erreurArret = true; return; }
        ville = nomLibre;
        estLibre = true;
      }

      const prixParType = {};
      let manque = false;
      el.querySelectorAll('.edit-arret-prix-type-new').forEach(inp => {
        if (inp.value === '') { manque = true; return; }
        prixParType[inp.dataset.typeId] = parseInt(inp.value);
      });
      const heurePassage = el.querySelector('.edit-arret-heure-passage-new')?.value || null;
      if (manque || Object.keys(prixParType).length === 0) { showToast(`Entrez les prix pour l'arrêt à ${ville}.`, TOAST_ICONS.warning); erreurArret = true; return; }

      if (estLibre) {
        arrets.push({ type: 'libre', nom: ville, ville, prixParType, heurePassage });
        return;
      }

      const pdvsCochés = [...el.querySelectorAll('.arret-pdv-check:checked')];
      if (pdvsCochés.length > 0) {
        pdvsCochés.forEach(c => {
          const pdvObj = pdvList.find(p => p.id === c.value);
          arrets.push({ type: 'pdv', id: c.value, nom: c.dataset.nom, ville: c.dataset.ville || pdvObj?.ville || '', prixParType, heurePassage });
        });
      } else {
        arrets.push({ type: 'libre', nom: ville, ville, prixParType, heurePassage });
      }
    });

    if (erreurArret) return;
    if (arrets.length === 0) { showToast('Ajoutez au moins un arrêt.', TOAST_ICONS.warning); return; }
    payload.arrets    = arrets;
    payload.pdvArrets = arrets.filter(a => a.type === 'pdv').map(a => ({ id: a.id, nom: a.nom, ville: a.ville || '' }));

    const prixTroncons  = {};
    let tronconInvalide = false;
    document.querySelectorAll('.troncon-prix-type').forEach(input => {
      const cle = input.dataset.cle;
      if (input.value === '') { showToast(`Prix manquant pour ${cle.replace('|', ' → ')}.`, TOAST_ICONS.warning); tronconInvalide = true; return; }
      if (!prixTroncons[cle]) prixTroncons[cle] = {};
      prixTroncons[cle][input.dataset.typeId] = parseInt(input.value);
    });
    if (tronconInvalide) return;
    payload.prixTroncons = prixTroncons;
  }

  // ── Détecter les PDV retirés et afficher une modal de confirmation ──
  const arretsAvant   = t?.arrets || [];
  const nomsApres     = (payload.arrets || []).map(a => a.nom);
  const arretsRetires = arretsAvant.filter(a => !nomsApres.includes(a.nom));
  const pdvsRetires   = arretsRetires.filter(a => a.type === 'pdv');
  const villesRestantes = new Set((payload.arrets || []).map(a => a.ville));
  const arretsDisparus  = pdvsRetires.filter(a => !villesRestantes.has(a.ville));
  const arretsPartiels  = pdvsRetires.filter(a => villesRestantes.has(a.ville));
  const lieuxLibresRetires = arretsRetires.filter(a => a.type === 'libre');

  if (pdvsRetires.length > 0 || pdvDepartArriveeRetiresAvecVentes.length > 0 || lieuxLibresRetires.length > 0) {
    window._pendingTrajetPayload = { trajetId, payload };
    const overlay = document.createElement('div');
    overlay.id = 'confirmArretOverlay';
    overlay.className = 'pdv-overlay';
    overlay.innerHTML = `
      <div class="pdv-overlay-backdrop" onclick="closeConfirmArret()"></div>
      <div class="pdv-overlay-panel pdv-confirm-panel">
        <div class="pdv-confirm-icon">${ICONS.pin}</div>
        <h2>Confirmer les modifications ?</h2>
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin:10px 0;display:flex;flex-direction:column;gap:8px;font-size:12px;">
          ${arretsPartiels.length > 0 ? `
          <div style="display:flex;align-items:flex-start;gap:8px;">
            <span style="background:#3D2A00;color:#FFA940;font-size:11px;padding:2px 8px;border-radius:6px;white-space:nowrap;">PDV retiré(s)</span>
            <span style="color:var(--muted);line-height:1.6;">${arretsPartiels.map(a => `<strong style="color:var(--white);">${escapeHtml(a.nom)}</strong>`).join(', ')} ne pourra plus vendre sur cet arrêt. L'arrêt reste actif, d'autres PDV continuent d'y vendre.</span>
          </div>` : ''}
          ${arretsDisparus.length > 0 ? `
          <div style="display:flex;align-items:flex-start;gap:8px;">
            <span style="background:#3D0F0F;color:#FF6B6B;font-size:11px;padding:2px 8px;border-radius:6px;white-space:nowrap;">Arrêt(s) supprimé(s)</span>
            <span style="color:var(--muted);line-height:1.6;">L'arrêt à <strong style="color:var(--white);">${[...new Set(arretsDisparus.map(a => a.ville))].map(v => escapeHtml(v)).join(', ')}</strong> ne sera plus disponible sur ce trajet — ${arretsDisparus.map(a => escapeHtml(a.nom)).join(', ')} était le dernier PDV à y vendre.</span>
          </div>` : ''}
          ${lieuxLibresRetires.length > 0 ? `
          <div style="display:flex;align-items:flex-start;gap:8px;">
            <span style="background:#0D2340;color:#4DA6FF;font-size:11px;padding:2px 8px;border-radius:6px;white-space:nowrap;">Lieu(x) retiré(s)</span>
            <span style="color:var(--muted);line-height:1.6;">Le bus ne s'arrêtera plus à <strong style="color:var(--white);">${lieuxLibresRetires.map(a => escapeHtml(a.nom)).join(', ')}</strong>.</span>
          </div>` : ''}
          ${pdvDepartArriveeRetiresAvecVentes.length > 0 ? `
          <div style="display:flex;align-items:flex-start;gap:8px;">
            <span style="background:#3D0F0F;color:#FF6B6B;font-size:11px;padding:2px 8px;border-radius:6px;white-space:nowrap;">PDV avec ventes</span>
            <span style="color:var(--muted);line-height:1.6;">${pdvDepartArriveeRetiresAvecVentes.map(p => `<strong style="color:var(--white);">${escapeHtml(p.nom)}</strong>`).join(', ')} a déjà vendu des billets sur ce trajet et perdra immédiatement l'accès à la vente.</span>
          </div>` : ''}
          <div style="height:1px;background:var(--border);"></div>
          <div style="display:flex;align-items:flex-start;gap:8px;">
            <span style="background:#0D2340;color:#4DA6FF;font-size:11px;padding:2px 8px;border-radius:6px;white-space:nowrap;">Réservations existantes</span>
            <span style="color:var(--muted);">Non affectées.</span>
          </div>
        </div>
        <div class="pdv-confirm-actions">
          <button class="pdv-btn-next" onclick="closeConfirmArret();doSubmitEditTrajet()">Oui, appliquer les changements</button>
          <button class="pdv-btn-back" onclick="closeConfirmArret()">Annuler</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));
    return;
  }

  // Pas de PDV retiré → soumettre directement
  window._pendingTrajetPayload = { trajetId, payload };
  doSubmitEditTrajet();
}

export async function doSubmitEditTrajet() {
  const { trajetId, payload } = window._pendingTrajetPayload || {};
  if (!trajetId || !payload) return;

  const btn = document.getElementById('editTrajetSubmitBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Sauvegarde...'; }

  try {
    const res = await apiFetch(`${BACKEND}/trajet/${trajetId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) { showToast('Erreur lors de la sauvegarde du trajet.', TOAST_ICONS.error); return; }

    const trajet = trajetList.find(t => t.id === trajetId);
    if (trajet) Object.assign(trajet, payload);
    renderTrajetsPage();
    closeEditTrajet();
    showToast('Trajet mis à jour avec succès !', TOAST_ICONS.success, true);

  } catch (err) {
    console.error('Erreur update trajet :', err);
    showToast('Impossible de contacter le serveur.', TOAST_ICONS.error);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = `${ICONS.save} Sauvegarder les modifications`; }
    window._pendingTrajetPayload = null;
  }
}

export function closeConfirmArret() {
  const o = document.getElementById('confirmArretOverlay');
  if (o) { o.classList.remove('show'); setTimeout(() => o.remove(), 350); }
}

// ════════════════════════════════
//  TYPES DE BILLETS — AGENCE
// ════════════════════════════════
export function openTypesBilletModal() {
  const types = agenceData?.typesBillet?.length
    ? agenceData.typesBillet
    : [
        { id: 'adulte', nom: 'Adulte', ageMin: 12, ageMax: null },
        { id: 'enfant', nom: 'Enfant', ageMin: 0,  ageMax: 11   },
      ];

  const overlay = document.createElement('div');
  overlay.id = 'typesBilletOverlay';
  overlay.className = 'pdv-overlay';
  overlay.innerHTML = `
    <div class="pdv-overlay-backdrop" onclick="closeTypesBilletModal()"></div>
    <div class="pdv-overlay-panel" style="max-width:520px;">
      <div class="pdv-overlay-header">
        <div>
          <h2>Types de billets</h2>
          <p>Définissez les tranches d'âge utilisées sur tous vos trajets.</p>
        </div>
        <button class="pdv-overlay-close" onclick="closeTypesBilletModal()">${ICONS.close}</button>
      </div>
      <div id="typesBilletList" style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px;"></div>
      <button type="button" class="pdv-action-btn" style="margin-bottom:16px;font-size:12px;" onclick="addTypeBilletRow()">+ Ajouter une tranche</button>
      <button class="pdv-btn-next" id="typesBilletSubmitBtn" onclick="submitTypesBillet()">${ICONS.save} Sauvegarder</button>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));

  types.forEach(t => addTypeBilletRow(t));
}

export function addTypeBilletRow(type = null) {
  const list  = document.getElementById('typesBilletList');
  if (!list) return;
  if (!type && list.children.length >= 3) {
    showToast('Maximum 3 types de billets autorisés.', TOAST_ICONS.warning);
    return;
  }
  const uid   = type?.id || `type_${Date.now()}_${Math.floor(Math.random()*1000)}`;
  const row   = document.createElement('div');
  row.className = 'tb-row';
  row.dataset.id = uid;
  row.style.cssText = 'background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:12px 14px;display:flex;flex-direction:column;gap:8px;';
  row.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
      <input type="text" class="pdv-input tb-nom" placeholder="Ex : Adulte, Enfant 5-10 ans" value="${escapeHtml(type?.nom) || ''}" style="flex:1;">
      <button type="button" onclick="this.closest('.tb-row').remove()" style="background:none;border:none;color:#FF4D6A;font-size:18px;cursor:pointer;padding:2px 6px;">×</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
      <div>
        <label style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px;">Âge min</label>
        <input type="number" class="pdv-input tb-age-min" min="0" placeholder="Ex : 0" value="${type?.ageMin ?? ''}">
      </div>
      <div>
        <label style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px;">Âge max (vide = illimité)</label>
        <input type="number" class="pdv-input tb-age-max" min="0" placeholder="Ex : 11" value="${type?.ageMax ?? ''}">
      </div>
    </div>
  `;
  list.appendChild(row);
}

export function closeTypesBilletModal() {
  const o = document.getElementById('typesBilletOverlay');
  if (o) { o.classList.remove('show'); setTimeout(() => o.remove(), 350); }
}

export async function submitTypesBillet() {
  const rows = [...document.querySelectorAll('#typesBilletList .tb-row')];
  if (rows.length === 0) { showToast('Ajoutez au moins un type de billet.', TOAST_ICONS.warning); return; }
  if (rows.length > 3) { showToast('Maximum 3 types de billets autorisés.', TOAST_ICONS.warning); return; }

  const typesBillet = [];
  for (const row of rows) {
    const nom    = row.querySelector('.tb-nom')?.value.trim();
    const ageMin = row.querySelector('.tb-age-min')?.value;
    const ageMaxRaw = row.querySelector('.tb-age-max')?.value;
    if (!nom) { showToast('Chaque type doit avoir un nom.', TOAST_ICONS.warning); return; }
    if (ageMin === '') { showToast(`Entrez l'âge min pour "${nom}".`, TOAST_ICONS.warning); return; }
    typesBillet.push({
      id: row.dataset.id,
      nom,
      ageMin: parseInt(ageMin),
      ageMax: ageMaxRaw === '' ? null : parseInt(ageMaxRaw),
    });
  }

  const btn = document.getElementById('typesBilletSubmitBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Sauvegarde...'; }

  try {
    const res = await apiFetch(`${BACKEND}/agence/${agenceData.id}/types-billet`, {
      method: 'PATCH',
      body: JSON.stringify({ typesBillet }),
    });
    const data = await res.json();
    if (!res.ok) { showToast('Erreur lors de la sauvegarde des types de billets.', TOAST_ICONS.error); return; }

    agenceData.typesBillet = typesBillet;
    closeTypesBilletModal();

    if (data.typesAjoutes?.length > 0 && data.trajetsImpactes > 0) {
      showToast(`${data.trajetsImpactes} trajet(s) mis à jour — pensez à définir les prix du nouveau type.`, TOAST_ICONS.warning);
    } else {
      showToast('Types de billets mis à jour.', TOAST_ICONS.success, true);
    }

    // Recharger les trajets pour refléter les prixParType corrigés
    if (typeof loadTrajets === 'function' && agenceData?.id) {
      loadTrajets(agenceData.id);
    }

  } catch (err) {
    console.error('Erreur update types billet :', err);
    showToast('Impossible de contacter le serveur.', TOAST_ICONS.error);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = `${ICONS.save} Sauvegarder`; }
  }
}

// ════════════════════════════════
//  TRAJETS — CRÉER
// ════════════════════════════════
export function openCreateTrajet() {
  if (!agenceData?.typesBillet?.length) {
    showToast('Configurez d\'abord vos types de billets.', TOAST_ICONS.warning);
    openTypesBilletModal();
    return;
  }
  setBusSteps({});

  const overlay = document.createElement('div');
  overlay.id = 'createTrajetOverlay';
  overlay.className = 'pdv-overlay';
  overlay.innerHTML = `
    <div class="pdv-overlay-backdrop" onclick="closeCreateTrajet()"></div>
    <div class="pdv-overlay-panel" style="max-width:560px;">
      <div class="pdv-overlay-header">
        <div><h2>Nouveau trajet</h2><p>Étape <span id="trajetStepLabel">1</span> sur 2</p></div>
        <button class="pdv-overlay-close" onclick="closeCreateTrajet()">${ICONS.close}</button>
      </div>
      <div style="display:flex;gap:6px;margin-bottom:20px;">
        <div id="tprog1" style="flex:1;height:3px;border-radius:2px;background:var(--accent);transition:background .3s;"></div>
        <div id="tprog2" style="flex:1;height:3px;border-radius:2px;background:var(--border2);transition:background .3s;"></div>
      </div>

      <!-- ÉTAPE 1 -->
      <div id="trajetStep1">
        <div class="pdv-create-fields">
          <div class="pdv-field-group">
            <label>Ville de départ <span class="req">*</span></label>
            <select class="pdv-select" id="t-depart" onchange="onVilleDepartChange()">
              <option value="">Sélectionner une ville</option>
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
          <div class="pdv-field-group" id="autreDepartWrap" style="display:none;">
            <label>Précisez la ville de départ <span class="req">*</span></label>
            <input type="text" class="pdv-input" id="t-depart-autre" placeholder="Ex : Owando">
          </div>
          <div class="pdv-field-group">
            <label>Ville d'arrivée <span class="req">*</span></label>
            <select class="pdv-select" id="t-arrivee" onchange="onVilleArriveeChange()">
              <option value="">Sélectionner une ville</option>
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
          <div class="pdv-field-group" id="autreArriveeWrap" style="display:none;">
            <label>Précisez la ville d'arrivée <span class="req">*</span></label>
            <input type="text" class="pdv-input" id="t-arrivee-autre" placeholder="Ex : Kinkala">
          </div>
          <div class="pdv-field-group">
            <label>Type de trajet <span class="req">*</span></label>
            <select class="pdv-select" id="t-type-trajet" onchange="toggleArrets()">
              <option value="">Sélectionner</option>
              <option value="direct">Direct</option>
              <option value="arrets">Avec arrêts</option>
            </select>
          </div>
          <div class="pdv-field-group" id="pdvDepartWrap" style="display:none;">
            <label>PDV de départ <span class="req">*</span></label>
            <div class="pdv-multi-select" id="pdvDepartList"><span style="font-size:12px;color:var(--muted);">Entrez d'abord la ville de départ.</span></div>
          </div>
          <div class="pdv-field-group" id="pdvArriveeWrap" style="display:none;">
            <label>PDV d'arrivée <span class="req">*</span></label>
            <div class="pdv-multi-select" id="pdvArriveeList"><span style="font-size:12px;color:var(--muted);">Entrez d'abord la ville d'arrivée.</span></div>
          </div>
          <div id="arretsWrap" style="display:none;" class="pdv-field-group">
            <label>Arrêts intermédiaires <span class="req">*</span></label>
            <div id="arretsList" style="display:flex;flex-direction:column;gap:8px;"></div>
            <button type="button" class="pdv-action-btn" style="margin-top:8px;font-size:12px;" onclick="addArretItem();genererTableauTroncons()">+ Ajouter une étape</button>
          </div>
        </div>
        <div class="pdv-field-group" id="tronconsPrixWrapOuter" style="display:none;">
          <div id="tronconsPrixWrap" style="display:none;"></div>
        </div>
        <button class="pdv-btn-next" onclick="trajetNextStep(1)">Suivant →</button>
      </div>

      <!-- ÉTAPE 2 -->
      <div id="trajetStep2" style="display:none;">
        <div class="pdv-create-fields">
          ${agenceData.typesBillet.map(t => `
            <div class="pdv-field-group">
              <label>Prix ${escapeHtml(t.nom)} (XAF) <span class="req">*</span></label>
              <p class="pdv-field-hint" style="margin:-2px 0 4px;">${t.ageMax == null ? `${t.ageMin} ans et +` : `de ${t.ageMin} à ${t.ageMax} ans`}</p>
              <input type="number" class="pdv-input t-prix-type" data-type-id="${t.id}" placeholder="Ex : 15000" min="0">
            </div>`).join('')
          }
          <div style="height:1px;background:var(--border);margin:4px 0;"></div>
          <div class="pdv-field-group"><label>Limite bagages (kg)</label><input type="number" class="pdv-input" id="t-limite-bagages" placeholder="Ex : 30" min="0"></div>
          <div class="pdv-field-group"><label>Frais excédent (XAF/kg)</label><input type="number" class="pdv-input" id="t-frais-exces" placeholder="Ex : 500" min="0"></div>
        </div>
        <div class="pdv-btn-row">
          <button class="pdv-btn-back" onclick="trajetBackStep(2)">← Retour</button>
          <button class="pdv-btn-next" id="createTrajetSubmitBtn" onclick="trajetNextStep(2)">Créer le trajet</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
}

export function closeCreateTrajet() {
  const o = document.getElementById('createTrajetOverlay');
  if (o) { o.classList.remove('show'); setTimeout(() => o.remove(), 350); }
}

export function onVilleDepartChange() {
  const val  = document.getElementById('t-depart')?.value;
  const wrap = document.getElementById('autreDepartWrap');
  if (wrap) wrap.style.display = val === 'Autre' ? 'flex' : 'none';
  const arrivee = document.getElementById('t-arrivee');
  if (arrivee) {
    [...arrivee.options].forEach(opt => { opt.disabled = opt.value !== '' && opt.value !== 'Autre' && opt.value === val; });
    if (arrivee.value === val && val !== 'Autre') arrivee.value = '';
  }
  renderPDVMultiSelect('pdvDepartList', 'depart');
  if (document.getElementById('arretsWrap')?.style.display !== 'none') refreshArretsVilleOptions();
}

export function onVilleArriveeChange() {
  const val  = document.getElementById('t-arrivee')?.value;
  const wrap = document.getElementById('autreArriveeWrap');
  if (wrap) wrap.style.display = val === 'Autre' ? 'flex' : 'none';
  const depart = document.getElementById('t-depart');
  if (depart) {
    [...depart.options].forEach(opt => { opt.disabled = opt.value !== '' && opt.value !== 'Autre' && opt.value === val; });
    if (depart.value === val && val !== 'Autre') depart.value = '';
  }
  renderPDVMultiSelect('pdvArriveeList', 'arrivee');
  if (document.getElementById('arretsWrap')?.style.display !== 'none') refreshArretsVilleOptions();
}

export function toggleArrets() {
  const val        = document.getElementById('t-type-trajet')?.value;
  const arretsWrap = document.getElementById('arretsWrap');
  const pdvDepWrap = document.getElementById('pdvDepartWrap');
  const pdvArrWrap = document.getElementById('pdvArriveeWrap');
  const isDirect   = val === 'direct';
  const isArrets   = val === 'arrets';

  if (pdvDepWrap) pdvDepWrap.style.display = (isDirect || isArrets) ? 'flex' : 'none';
  if (pdvArrWrap) pdvArrWrap.style.display = (isDirect || isArrets) ? 'flex' : 'none';
  if (arretsWrap) arretsWrap.style.display  = isArrets ? 'flex' : 'none';

  if (isDirect || isArrets) {
    renderPDVMultiSelect('pdvDepartList',  'depart');
    renderPDVMultiSelect('pdvArriveeList', 'arrivee');
  }
  if (isArrets && document.getElementById('arretsList')?.children.length === 0) addArretItem();
  const outer = document.getElementById('tronconsPrixWrapOuter');
  if (outer) outer.style.display = isArrets ? 'flex' : 'none';
}

export function renderPDVMultiSelectEdit(containerId, ville, dejaCoches = []) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const idsCoches = new Set(dejaCoches.map(p => p.id));
  const filtered  = pdvList.filter(p => (p.ville || '').toLowerCase() === (ville || '').toLowerCase() && p.actif);

  if (filtered.length === 0) {
    container.innerHTML = `<span style="font-size:12px;color:var(--muted);">Aucun PDV actif dans cette ville.</span>`;
    return;
  }

  container.innerHTML = filtered.map(pdv => `
    <label class="pdv-multi-item">
      <input type="checkbox" value="${pdv.id}" data-nom="${escapeHtml(pdv.nom)}" class="edit-pdv-multi-check" ${idsCoches.has(pdv.id) ? 'checked' : ''}>
      <span class="pdv-multi-label"><strong>${escapeHtml(pdv.nom)}</strong><small>${escapeHtml(pdv.adresse || pdv.ville || '')}</small></span>
    </label>`).join('');
}

export function renderArretPDVMultiSelectEdit(containerId, ville, dejaCoches = []) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const idsCoches = new Set(dejaCoches.map(p => p.id));
  const filtered  = pdvList.filter(p => (p.ville || '').toLowerCase() === (ville || '').toLowerCase() && p.actif);

  if (filtered.length === 0) {
    container.innerHTML = `<span style="font-size:12px;color:var(--muted);">Aucun PDV actif dans cette ville.</span>`;
    return;
  }

  container.innerHTML = filtered.map(pdv => `
    <label class="pdv-multi-item">
      <input type="checkbox" value="${pdv.id}" data-nom="${escapeHtml(pdv.nom)}" class="edit-arret-pdv-check" onchange="genererTableauTronconsEdit()" ${idsCoches.has(pdv.id) ? 'checked' : ''}>
      <span class="pdv-multi-label"><strong>${escapeHtml(pdv.nom)}</strong><small>${escapeHtml(pdv.adresse || pdv.ville || '')}</small></span>
    </label>`).join('');
}

export function renderPDVMultiSelect(containerId, sens) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const villeInput = sens === 'depart'
    ? document.getElementById('t-depart')?.value.trim()
    : document.getElementById('t-arrivee')?.value.trim();
  const filtered = pdvList.filter(p => (p.ville || '').toLowerCase() === (villeInput || '').toLowerCase() && p.actif);
  if (!villeInput) { container.innerHTML = `<span style="font-size:12px;color:var(--muted);">Entrez d'abord la ville de ${sens === 'depart' ? 'départ' : 'arrivée'}.</span>`; return; }
  if (filtered.length === 0) { container.innerHTML = `<span style="font-size:12px;color:var(--muted);">Aucun PDV trouvé pour cette ville.</span>`; return; }
  container.innerHTML = filtered.map(pdv => `
    <label class="pdv-multi-item">
      <input type="checkbox" value="${pdv.id}" data-nom="${escapeHtml(pdv.nom)}" class="pdv-multi-check">
      <span class="pdv-multi-label"><strong>${escapeHtml(pdv.nom)}</strong><small>${escapeHtml(pdv.adresse || pdv.ville || '')}</small></span>
    </label>`).join('');
}

export function getVillesDisponiblesPourArret() {
  const villeDepart  = document.getElementById('t-depart')?.value;
  const villeArrivee = document.getElementById('t-arrivee')?.value;
  return [...new Set(pdvList.filter(p => p.actif).map(p => p.ville))]
    .filter(v => v && v !== villeDepart && v !== villeArrivee)
    .sort();
}

export function onArretVilleChange(index) {
  const ville     = document.getElementById(`arret-ville-${index}`)?.value;
  const container = document.getElementById(`arret-pdv-${index}`);
  const libreWrap = document.getElementById(`arret-libre-wrap-${index}`);
  if (!container) return;
  if (!ville) { container.style.display = 'none'; container.innerHTML = ''; if (libreWrap) libreWrap.style.display = 'none'; return; }
  if (ville === '__libre__') { if (libreWrap) libreWrap.style.display = 'block'; container.style.display = 'none'; container.innerHTML = ''; genererTableauTroncons(); return; }
  if (libreWrap) libreWrap.style.display = 'none';

  const pdvsVille = pdvList.filter(p => p.actif && p.ville === ville);
  if (pdvsVille.length === 0) { container.style.display = 'flex'; container.innerHTML = `<span style="font-size:12px;color:var(--muted);">Aucun PDV disponible dans cette ville</span>`; return; }
  container.style.display = 'flex';
  container.innerHTML = pdvsVille.map(p => `
    <label class="pdv-multi-item">
      <input type="checkbox" value="${p.id}" data-nom="${escapeHtml(p.nom)}" data-ville="${escapeHtml(p.ville)}" class="arret-pdv-check" checked>
      <span class="pdv-multi-label"><strong>${escapeHtml(p.nom)}</strong><small>${escapeHtml(p.adresse || p.ville || '')}</small></span>
    </label>`).join('');
  genererTableauTroncons();
}

export function addArretItem() {
  const list = document.getElementById('arretsList');
  if (!list) return;
  const index = list.children.length;
  const div   = document.createElement('div');
  div.className = 'arret-item';
  div.style.cssText = 'background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:0;';

  const villesOptions = getVillesDisponiblesPourArret()
    .map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`)
    .join('') + `<option value="__libre__">Autre lieu...</option>`;

  div.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
      <select class="pdv-select arret-ville-select" id="arret-ville-${index}" onchange="onArretVilleChange(${index})">
        <option value="">Sélectionner une ville</option>
        ${villesOptions}
      </select>
      <button type="button" onclick="removeArretItem(this)" style="background:none;border:none;color:#FF4D6A;font-size:18px;cursor:pointer;flex-shrink:0;padding:4px;">×</button>
    </div>
    <div id="arret-libre-wrap-${index}" style="display:none;margin-bottom:10px;">
      <input type="text" class="pdv-input" id="arret-libre-nom-${index}" placeholder="Ex : Carrefour Total, Poste de Gare...">
    </div>
    <div class="pdv-multi-select arret-pdv-container" id="arret-pdv-${index}" style="margin-bottom:10px;display:none;"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:4px;">
      <div><label style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px;">Heure passage</label><input type="time" class="pdv-input arret-heure-passage" placeholder="—"></div>
      ${agenceData.typesBillet.map(t => `
      <div><label style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px;">Prix ${escapeHtml(t.nom)} (XAF)</label><p style="font-size:9px;color:var(--muted);margin:-2px 0 4px;">${ageRangeLabel(t)}</p><input type="number" class="pdv-input arret-prix-type" data-type-id="${t.id}" placeholder="Ex : 5000" min="0"></div>`).join('')}
    </div>
  `;
  list.appendChild(div);
  div.querySelector(`#arret-libre-nom-${index}`)?.addEventListener('input', genererTableauTroncons);
}

export function refreshArretsVilleOptions() {
  const villes = getVillesDisponiblesPourArret();
  document.querySelectorAll('.arret-ville-select').forEach(sel => {
    const current    = sel.value;
    const stillValid = villes.includes(current);
    sel.innerHTML = `<option value="">Sélectionner une ville</option>` +
      villes.map(v => `<option value="${escapeHtml(v)}" ${v === current ? 'selected' : ''}>${escapeHtml(v)}</option>`).join('');
    const index = sel.id.replace('arret-ville-', '');
    if (!stillValid) sel.value = '';
    onArretVilleChange(index);
  });
}

export function removeArretItem(btn) {
  btn.closest('.arret-item')?.remove();
}

export function genererTableauTroncons() {
  const departSelect  = document.getElementById('t-depart')?.value;
  const arriveeSelect = document.getElementById('t-arrivee')?.value;
  const depart  = departSelect  === 'Autre' ? document.getElementById('t-depart-autre')?.value.trim()  : departSelect;
  const arrivee = arriveeSelect === 'Autre' ? document.getElementById('t-arrivee-autre')?.value.trim() : arriveeSelect;
  if (!depart || !arrivee) return;

  const arretItems  = [...document.querySelectorAll('.arret-item')];
  const villesArrets = [];
  arretItems.forEach(item => {
    const ville = item.querySelector('.arret-ville-select')?.value;
    if (!ville) return;
    if (ville === '__libre__') {
      const nomLibre = item.querySelector('[id^="arret-libre-nom-"]')?.value.trim();
      villesArrets.push(nomLibre || '(lieu libre)');
    } else {
      villesArrets.push(ville);
    }
  });

  const container = document.getElementById('tronconsPrixWrap');
  if (!container) return;
  if (villesArrets.length === 0) { container.innerHTML = ''; container.style.display = 'none'; return; }

  const pointsApresDepart = [...villesArrets, arrivee];
  const lieuxLibres = new Set(
    [...document.querySelectorAll('[id^="arret-libre-nom-"]')]
      .map(input => input.value.trim())
      .filter(Boolean)
  );

  let html = `
    <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px;">${ICONS.money} Prix par tronçon</div>
    <div style="font-size:11px;color:var(--muted);margin-bottom:10px;padding:8px 12px;background:var(--surface);border-radius:8px;border:1px solid var(--border);">
      ${ICONS.info} Les prix depuis <strong style="color:var(--white);">${escapeHtml(depart)}</strong> sont gérés dans les champs d'arrêts et à l'étape suivante.
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;">`;

  for (let i = 0; i < pointsApresDepart.length - 1; i++) {
    for (let j = i + 1; j < pointsApresDepart.length; j++) {
      const from = pointsApresDepart[i], to = pointsApresDepart[j];
      if (lieuxLibres.has(from)) continue;
      const cle = `${from}|${to}`;
      html += `
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:10px 14px;">
          <div style="font-size:12px;font-weight:700;color:var(--white);margin-bottom:8px;">${escapeHtml(from)} → ${escapeHtml(to)}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            ${agenceData.typesBillet.map(t => `
            <div><label style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px;">Prix ${escapeHtml(t.nom)} (XAF) *</label><p style="font-size:9px;color:var(--muted);margin:-2px 0 4px;">${ageRangeLabel(t)}</p><input type="number" class="pdv-input troncon-prix-type" data-cle="${escapeHtml(cle)}" data-type-id="${t.id}" placeholder="Ex : 5000" min="0"></div>`).join('')}
          </div>
        </div>`;
    }
  }
  html += `</div>`;
  container.innerHTML = html;
  container.style.display = 'block';
}

export function trajetNextStep(from) {
  if (from === 1) {
    const departSelect  = document.getElementById('t-depart')?.value;
    const arriveeSelect = document.getElementById('t-arrivee')?.value;
    const depart  = departSelect  === 'Autre' ? document.getElementById('t-depart-autre')?.value.trim()  : departSelect;
    const arrivee = arriveeSelect === 'Autre' ? document.getElementById('t-arrivee-autre')?.value.trim() : arriveeSelect;
    const type    = document.getElementById('t-type-trajet')?.value;

    if (!depart)  { showToast('Entrez la ville de départ.', TOAST_ICONS.warning); return; }
    if (!arrivee) { showToast('Entrez la ville d\'arrivée.', TOAST_ICONS.warning); return; }
    if (!type)    { showToast('Sélectionnez le type de trajet.', TOAST_ICONS.warning); return; }

    const pdvDepartChecks = [...document.querySelectorAll('#pdvDepartList .pdv-multi-check:checked')];
    if (pdvDepartChecks.length === 0) { showToast('Sélectionnez au moins un PDV de départ.', TOAST_ICONS.warning); return; }
    busSteps.pdvDepart = pdvDepartChecks.map(c => ({ id: c.value, nom: c.dataset.nom }));

    const pdvArriveeChecks = [...document.querySelectorAll('#pdvArriveeList .pdv-multi-check:checked')];
    if (pdvArriveeChecks.length === 0) { showToast('Sélectionnez au moins un PDV d\'arrivée.', TOAST_ICONS.warning); return; }
    busSteps.pdvArrivee = pdvArriveeChecks.map(c => ({ id: c.value, nom: c.dataset.nom }));

    if (type === 'arrets') {
      const items = [...document.querySelectorAll('.arret-item')];
      if (items.length === 0) { showToast('Ajoutez au moins un arrêt.', TOAST_ICONS.warning); return; }
      busSteps.arrets    = [];
      busSteps.pdvArrets = [];
      let erreurArret    = false;

      items.forEach(item => {
        if (erreurArret) return;
        const ville        = item.querySelector('.arret-ville-select')?.value;
        if (!ville) { showToast('Sélectionnez une ville pour chaque arrêt.', TOAST_ICONS.warning); erreurArret = true; return; }
        const prixParType = {};
        let manque = false;
        item.querySelectorAll('.arret-prix-type').forEach(inp => {
          if (inp.value === '') { manque = true; return; }
          prixParType[inp.dataset.typeId] = parseInt(inp.value);
        });
        const heurePassage = item.querySelector('.arret-heure-passage')?.value || null;
        if (manque || Object.keys(prixParType).length === 0) { showToast(`Entrez les prix pour l'arrêt à ${ville}.`, TOAST_ICONS.warning); erreurArret = true; return; }

        if (ville === '__libre__') {
          const nomLibre = item.querySelector(`[id^="arret-libre-nom-"]`)?.value.trim();
          if (!nomLibre) { showToast('Entrez le nom du lieu libre.', TOAST_ICONS.warning); erreurArret = true; return; }
          busSteps.arrets.push({ type: 'libre', nom: nomLibre, ville: nomLibre, prixParType, heurePassage });
          return;
        }
        const pdvsCochés = [...item.querySelectorAll('.arret-pdv-check:checked')];
        if (pdvsCochés.length > 0) {
          pdvsCochés.forEach(c => {
            busSteps.arrets.push({ type: 'pdv', id: c.value, nom: c.dataset.nom, ville, prixParType, heurePassage });
            busSteps.pdvArrets.push({ id: c.value, nom: c.dataset.nom, ville });
          });
        } else {
          busSteps.arrets.push({ type: 'libre', nom: ville, ville, prixParType, heurePassage });
        }
      });

      if (erreurArret) return;
      if (busSteps.arrets.length === 0) { showToast('Remplissez les arrêts.', TOAST_ICONS.warning); return; }

      const prixTroncons  = {};
      let tronconInvalide = false;
      document.querySelectorAll('.troncon-prix-type').forEach(input => {
        const cle = input.dataset.cle;
        if (input.value === '') { showToast(`Prix manquant pour le tronçon ${cle.replace('|', ' → ')}.`, TOAST_ICONS.warning); tronconInvalide = true; return; }
        if (!prixTroncons[cle]) prixTroncons[cle] = {};
        prixTroncons[cle][input.dataset.typeId] = parseInt(input.value);
      });
      if (tronconInvalide) return;
      busSteps.prixTroncons = prixTroncons;
    } else {
      busSteps.arrets = [];
    }

    busSteps.villeDepart  = depart;
    busSteps.villeArrivee = arrivee;
    busSteps.typeTrajet   = type;

    document.getElementById('trajetStep1').style.display = 'none';
    document.getElementById('trajetStep2').style.display = 'block';
    document.getElementById('trajetStepLabel').textContent = '2';
    updateTrajetProgress(2);

  } else if (from === 2) {
    const prixParType = {};
    let erreurPrix = false;
    document.querySelectorAll('.t-prix-type').forEach(input => {
      const val = input.value;
      if (val === '') { erreurPrix = true; return; }
      prixParType[input.dataset.typeId] = parseInt(val);
    });
    if (erreurPrix) { showToast('Entrez tous les prix par type de billet.', TOAST_ICONS.warning); return; }
    busSteps.prixParType = prixParType;
    busSteps.limiteBagages     = document.getElementById('t-limite-bagages')?.value ? parseInt(document.getElementById('t-limite-bagages').value) : null;
    busSteps.fraisExcesBagages = document.getElementById('t-frais-exces')?.value    ? parseInt(document.getElementById('t-frais-exces').value)    : null;
    submitCreateTrajet();
  }
}

export function trajetBackStep(from) {
  if (from === 2) {
    document.getElementById('trajetStep2').style.display = 'none';
    document.getElementById('trajetStep1').style.display = 'block';
    document.getElementById('trajetStepLabel').textContent = '1';
    updateTrajetProgress(1);
  }
}

function updateTrajetProgress(step) {
  [1, 2].forEach(i => {
    const bar = document.getElementById(`tprog${i}`);
    if (bar) bar.style.background = i <= step ? 'var(--accent)' : 'var(--border2)';
  });
}

export async function submitCreateTrajet() {
  const limiteBagages = document.getElementById('t-limite-bagages')?.value;
  const fraisExces    = document.getElementById('t-frais-exces')?.value;

  const payload = {
    agenceId: agenceData?.id,
    ...busSteps,
    prixParType: busSteps.prixParType,
    limiteBagages:     limiteBagages ? parseInt(limiteBagages) : null,
    fraisExcesBagages: fraisExces    ? parseInt(fraisExces)    : null,
    pdvArrets:         busSteps.pdvArrets || [],
    actif:             true,
  };

  const btn = document.getElementById('createTrajetSubmitBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Création...'; }

  try {
    const res = await apiFetch(`${BACKEND}/trajet/create`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) { showToast('Erreur lors de la création du trajet.', TOAST_ICONS.error); return; }

    setTrajetList([...trajetList, data.trajet]);
    renderTrajetsPage();
    updateOverviewStats();
    closeCreateTrajet();
    showToast('Trajet créé ! Ajoutez maintenant un bus.', TOAST_ICONS.success, true);
    window.openCreateDepart(data.trajet.id);

  } catch (err) {
    console.error('Erreur création trajet :', err);
    showToast('Impossible de contacter le serveur.', TOAST_ICONS.error);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Créer le trajet'; }
  }
}

// ════════════════════════════════
//  DÉPARTS — RENDU ITEM (partagé avec bus-departs.js)
// ════════════════════════════════
export function renderDepartItem(d, trajetId) {
  const joursLabel = d.tousLesJours ? 'Tous les jours' : escapeHtml((d.jours || []).join(', '));
  return `
    <div class="depart-item" id="departItem-${escapeHtml(d.id)}" onclick="openBusDetail('${escapeJsAttr(d.id)}', '${escapeJsAttr(trajetId)}')" style="cursor:pointer;">
      <div class="depart-item-left">
        <div class="depart-item-bus">${escapeHtml(d.busNom)}</div>
        <div class="depart-item-info">${escapeHtml(d.busType)} · ${escapeHtml(d.busCapacite)} places · ${escapeHtml(d.heureDepart)}${d.heureArrivee ? ' → ' + escapeHtml(d.heureArrivee) : ''}</div>
        <div class="depart-item-jours">${joursLabel}</div>
      </div>
      <div class="depart-item-right">
        <span class="pdv-status-badge ${d.actif !== false ? 'active' : 'inactive'}">
          <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${d.actif !== false ? 'var(--accent)' : '#FF4D6A'};vertical-align:middle;margin-right:4px;"></span>${d.actif !== false ? 'Actif' : 'Inactif'}
        </span>
        <span style="color:var(--muted);font-size:16px;">→</span>
      </div>
    </div>`;
}

let departsPromiseCache = {};

export async function loadDeparts(trajetId, forceRefresh = false) {
  // Si déjà en cache et qu'on ne force pas le refresh, on réutilise directement
  if (!forceRefresh && departsCache[trajetId]) {
    return departsCache[trajetId];
  }
  // Si une requête pour ce trajet est déjà en cours, on la réutilise au lieu d'en relancer une
  if (!forceRefresh && departsPromiseCache[trajetId]) {
    return departsPromiseCache[trajetId];
  }
  const promise = (async () => {
    try {
      const res  = await apiFetch(`${BACKEND}/trajet/${trajetId}/departs`);
      const data = await res.json();
      const departs = data.departs || [];
      setDepartsCache({ ...departsCache, [trajetId]: departs });
      return departs;
    } catch (err) {
      return [];
    } finally {
      delete departsPromiseCache[trajetId];
    }
  })();
  departsPromiseCache[trajetId] = promise;
  return promise;
}

export function invalidateDeparts(trajetId) {
  const updated = { ...departsCache };
  delete updated[trajetId];
  setDepartsCache(updated);
}

export async function loadAllDeparts(agenceId, forceRefresh = false) {
  if (!forceRefresh && allDepartsCache) {
    return allDepartsCache;
  }
  try {
    const res  = await apiFetch(`${BACKEND}/departs?agenceId=${agenceId}`);
    const data = await res.json();
    const departs = data.departs || [];
    setAllDepartsCache(departs);
    return departs;
  } catch (err) {
    return [];
  }
}

// Invalide le cache global — à appeler après toute écriture sur un départ
export function invalidateAllDepartsCache() {
  setAllDepartsCache(null);
}

// ════════════════════════════════
//  EXPOSER AU HTML
// ════════════════════════════════
window.openCreateTrajet          = openCreateTrajet;
window.closeCreateTrajet         = closeCreateTrajet;
window.openTrajetDetail          = openTrajetDetail;
window.closeTrajetDetail         = closeTrajetDetail;
window.switchTrajetTab           = switchTrajetTab;
window.confirmDeleteTrajet       = confirmDeleteTrajet;
window.closeDeleteTrajet         = closeDeleteTrajet;
window.deleteTrajet              = deleteTrajet;
window.toggleTrajetStatut        = toggleTrajetStatut;
window.closeStatutTrajet         = closeStatutTrajet;
window.confirmToggleTrajetStatut = confirmToggleTrajetStatut;
window.openEditTrajet            = openEditTrajet;
window.closeEditTrajet           = closeEditTrajet;
window.submitEditTrajet          = submitEditTrajet;
window.addEditArretItem          = addEditArretItem;
window.removeEditArret           = removeEditArret;
window.onEditArretVilleChange    = onEditArretVilleChange;
window.trajetNextStep            = trajetNextStep;
window.trajetBackStep            = trajetBackStep;
window.submitCreateTrajet        = submitCreateTrajet;
window.toggleArrets              = toggleArrets;
window.onVilleDepartChange       = onVilleDepartChange;
window.onVilleArriveeChange      = onVilleArriveeChange;
window.addArretItem              = addArretItem;
window.removeArretItem           = removeArretItem;
window.onArretVilleChange        = onArretVilleChange;
window.refreshArretsVilleOptions = refreshArretsVilleOptions;
window.genererTableauTroncons    = genererTableauTroncons;
window.renderPDVMultiSelect      = renderPDVMultiSelect;
window.renderPDVMultiSelectEdit  = renderPDVMultiSelectEdit;
window.renderArretPDVMultiSelectEdit = renderArretPDVMultiSelectEdit;
window.loadDeparts               = loadDeparts;
window.renderDepartItem          = renderDepartItem;
window.doSubmitEditTrajet = doSubmitEditTrajet;
window.closeConfirmArret  = closeConfirmArret;
window.genererTableauTronconsEdit = genererTableauTronconsEdit;
window.openTypesBilletModal = openTypesBilletModal;
window.addTypeBilletRow     = addTypeBilletRow;
window.closeTypesBilletModal = closeTypesBilletModal;
window.submitTypesBillet    = submitTypesBillet;
window.switchTrajetsTab = switchTrajetsTab;
window.invalidateDeparts = invalidateDeparts;
window.loadAllDeparts = loadAllDeparts;
window.invalidateAllDepartsCache = invalidateAllDepartsCache;