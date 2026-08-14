// ─── TRAVIO — Départs (vue d'ensemble des sessions) ───

import { BACKEND, agenceData, trajetList } from './state.js';
import { loadAllDeparts } from './trajets.js';
import { apiFetch } from './api.js';
import { escapeHtml, escapeJsAttr } from './sanitize.js';

const OFFSET_MS_BZV = 1 * 60 * 60 * 1000; // Brazzaville = UTC+1

function getBrazzaDateFromOffset(dayOffset) {
  const d = new Date(Date.now() + OFFSET_MS_BZV + dayOffset * 86400000);
  return d.toISOString().split('T')[0];
}

function formatDateLabel(dateStr) {
  const jours = ['dim','lun','mar','mer','jeu','ven','sam'];
  const mois  = ['jan','fév','mar','avr','mai','juin','juil','août','sept','oct','nov','déc'];
  const d = new Date(dateStr + 'T00:00:00');
  return `${jours[d.getDay()]} ${d.getDate()} ${mois[d.getMonth()]}`;
}

// ════════════════════════════════
//  ÉTAT LOCAL
// ════════════════════════════════
let departsDayOffset    = 0;
let departsFiltreTrajet = '';
let departsFiltreStatut = 'tous';
let sessionsParDepartCache = {}; // { departId: [sessions...] }

// ════════════════════════════════
//  RENDU PRINCIPAL
// ════════════════════════════════
export function renderDepartsPage() {
  const container = document.getElementById('departsContainer');
  if (!container) return;

  const trajetsActifs = trajetList.filter(t => t.actif !== false);

  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:10px 14px;margin-bottom:16px;">
      <div style="display:flex;align-items:center;gap:6px;">
        <button onclick="changeDepartsDay(-1)" style="background:var(--surface2);border:1px solid var(--border);width:28px;height:28px;border-radius:8px;color:var(--white);cursor:pointer;font-size:14px;">‹</button>
        <span id="departsDateLabel" style="font-family:'Syne',sans-serif;font-weight:800;font-size:13.5px;color:var(--white);min-width:150px;text-align:center;"></span>
        <button onclick="changeDepartsDay(1)" style="background:var(--surface2);border:1px solid var(--border);width:28px;height:28px;border-radius:8px;color:var(--white);cursor:pointer;font-size:14px;">›</button>
      </div>
      <div style="width:1px;height:22px;background:var(--border);"></div>
      <select class="pdv-select" id="departsFiltreTrajet" style="flex:1;min-width:180px;">
        <option value="">Tous les trajets</option>
        ${trajetsActifs.map(t => `<option value="${escapeHtml(t.id)}">${escapeHtml(t.villeDepart)} → ${escapeHtml(t.villeArrivee)}</option>`).join('')}
      </select>
      <select class="pdv-select" id="departsFiltreStatut" style="flex:0 0 160px;">
        <option value="tous">Tous les statuts</option>
        <option value="avenir">À venir</option>
        <option value="complet">Complet</option>
        <option value="annule">Annulé</option>
      </select>
    </div>

    <div class="stats-grid" style="margin-bottom:16px;">
      <div class="stat-card">
        <div class="stat-card-header"><span class="stat-label">Départs</span></div>
        <div class="stat-value" id="departsStatTotal">0</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-header"><span class="stat-label">Places vendues</span></div>
        <div class="stat-value" id="departsStatVendues">0</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-header"><span class="stat-label">Places disponibles</span></div>
        <div class="stat-value" id="departsStatPlaces">0</div>
      </div>
    </div>

    <div class="overview-card" style="padding:0;overflow:hidden;">
      <div id="departsTableWrap">
        <div style="text-align:center;padding:30px;color:var(--muted);font-size:12px;">Chargement...</div>
      </div>
    </div>
  `;

  document.getElementById('departsFiltreTrajet').addEventListener('change', (e) => {
    departsFiltreTrajet = e.target.value;
    loadAndRenderDepartsTable();
  });
  document.getElementById('departsFiltreStatut').addEventListener('change', (e) => {
    departsFiltreStatut = e.target.value;
    loadAndRenderDepartsTable();
  });

  loadAndRenderDepartsTable();
}

export function changeDepartsDay(delta) {
  departsDayOffset += delta;
  loadAndRenderDepartsTable();
}

// ════════════════════════════════
//  CHARGEMENT DES SESSIONS DU JOUR
// ════════════════════════════════
async function getSessionsForDepart(departId) {
  if (sessionsParDepartCache[departId]) return sessionsParDepartCache[departId];
  try {
    const res  = await apiFetch(`${BACKEND}/sessions?departId=${departId}`);
    const data = await res.json();
    const sessions = data.sessions || [];
    sessionsParDepartCache[departId] = sessions;
    return sessions;
  } catch (err) {
    console.error('Erreur chargement sessions départ', departId, err);
    return [];
  }
}

async function loadAndRenderDepartsTable() {
  const dateStr = getBrazzaDateFromOffset(departsDayOffset);
  const label   = document.getElementById('departsDateLabel');
  if (label) label.textContent = departsDayOffset === 0 ? `Aujourd'hui — ${formatDateLabel(dateStr)}` : formatDateLabel(dateStr);

  const wrap = document.getElementById('departsTableWrap');
  if (wrap) wrap.innerHTML = `<div style="text-align:center;padding:30px;color:var(--muted);font-size:12px;">Chargement...</div>`;

  if (!agenceData?.id) return;

  let departs = await loadAllDeparts(agenceData.id);
  if (departsFiltreTrajet) departs = departs.filter(d => d.trajetId === departsFiltreTrajet);

  // Charger les sessions de chaque bus en parallèle, puis ne garder que celles de la date sélectionnée
  const results = await Promise.all(departs.map(async d => {
    const sessions = await getSessionsForDepart(d.id);
    const session  = sessions.find(s => s.date === dateStr);
    if (!session) return null;
    return { depart: d, session };
  }));

  let rows = results.filter(Boolean).map(({ depart, session }) => {
    const trajet = trajetList.find(t => t.id === depart.trajetId);
    const vendues = (Number(session.placesTotal) || 0) - (Number(session.placesRestantes) || 0);
    let statut;
    if (session.statut === 'annulée') statut = 'annule';
    else if ((Number(session.placesRestantes) || 0) <= 0) statut = 'complet';
    else statut = 'avenir';

    return {
      heure:      session.heureDepart || depart.heureDepart || '—',
      trajetLabel: trajet ? `${trajet.villeDepart} → ${trajet.villeArrivee}` : '—',
      busNom:     depart.busNom || '—',
      busType:    depart.busType || '',
      vendues,
      total:      Number(session.placesTotal) || 0,
      statut,
      sessionId:  session.id,
      departId:   depart.id,
      trajetId:   depart.trajetId,
    };
  });

  if (departsFiltreStatut !== 'tous') rows = rows.filter(r => r.statut === departsFiltreStatut);
  rows.sort((a, b) => (a.heure || '').localeCompare(b.heure || ''));

  renderDepartsTable(rows);
  renderDepartsSummary(rows);
}

// ════════════════════════════════
//  RENDU TABLEAU
// ════════════════════════════════
const STATUT_LABEL = { avenir: 'À venir', complet: 'Complet', annule: 'Annulé' };
const STATUT_COLOR = {
  avenir:  { bg: 'rgba(0,229,160,0.12)',  color: 'var(--accent)' },
  complet: { bg: 'rgba(255,178,63,0.12)', color: '#FFB23F' },
  annule:  { bg: 'rgba(255,77,106,0.12)', color: '#FF4D6A' },
};

function renderDepartsTable(rows) {
  const wrap = document.getElementById('departsTableWrap');
  if (!wrap) return;

  if (rows.length === 0) {
    wrap.innerHTML = `
      <div class="empty-state large">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <rect x="4" y="10" width="32" height="22" rx="3" stroke="currentColor" stroke-width="1.8"/>
          <path d="M11 10V6a3 3 0 013-3h12a3 3 0 013 3v4" stroke="currentColor" stroke-width="1.8"/>
          <path d="M4 18h32" stroke="currentColor" stroke-width="1.8"/>
        </svg>
        <p>Aucun départ ne correspond à ces filtres</p>
      </div>`;
    return;
  }

  wrap.innerHTML = `
    <table class="resa-table">
      <thead>
        <tr>
          <th>Heure</th>
          <th>Trajet</th>
          <th>Bus</th>
          <th>Places</th>
          <th>Statut</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(r => {
          const pct = r.total > 0 ? Math.round((r.vendues / r.total) * 100) : 0;
          const sc  = STATUT_COLOR[r.statut];
          return `
          <tr onclick="openBusDetail('${escapeJsAttr(r.departId)}', '${escapeJsAttr(r.trajetId)}')" style="cursor:pointer;">
            <td style="font-weight:700;font-variant-numeric:tabular-nums;color:var(--white);">${escapeHtml(r.heure)}</td>
            <td style="color:var(--white);">${escapeHtml(r.trajetLabel)}</td>
            <td style="color:var(--muted);">${escapeHtml(r.busNom)}${r.busType ? ` <span style="color:var(--muted);opacity:.7;">· ${escapeHtml(r.busType)}</span>` : ''}</td>
            <td>
              ${r.statut === 'annule' ? '<span style="color:var(--muted);">—</span>' : `
              <div style="display:flex;flex-direction:column;gap:4px;">
                <span style="font-variant-numeric:tabular-nums;color:var(--white);font-size:12.5px;">${r.vendues}/${r.total}</span>
                <div style="height:5px;width:70px;background:var(--surface2);border-radius:4px;overflow:hidden;">
                  <div style="height:100%;width:${pct}%;background:${pct >= 90 ? '#FFB23F' : 'var(--accent)'};"></div>
                </div>
              </div>`}
            </td>
            <td>
              <span style="display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:700;padding:4px 10px;border-radius:20px;background:${sc.bg};color:${sc.color};">
                <span style="width:6px;height:6px;border-radius:50%;background:${sc.color};"></span>
                ${STATUT_LABEL[r.statut]}
              </span>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

function renderDepartsSummary(rows) {
  const actifs   = rows.filter(r => r.statut !== 'annule');
  const total    = actifs.length;
  const vendues  = actifs.reduce((s, r) => s + r.vendues, 0);
  const places   = actifs.reduce((s, r) => s + r.total, 0);

  const setEl = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  setEl('departsStatTotal',   total.toLocaleString());
  setEl('departsStatVendues', vendues.toLocaleString());
  setEl('departsStatPlaces',  places.toLocaleString());
}

// ════════════════════════════════
//  EXPOSER AU HTML
// ════════════════════════════════
window.renderDepartsPage = renderDepartsPage;
window.changeDepartsDay  = changeDepartsDay;