// ─── TRAVIO — Dashboard Point de vente ───

import { auth } from './firebase-client.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { TICKET_CSS, buildTicketHTML, formatFromMode, formatDelaiFormalite } from './billet-template.js';
import { initInstallPrompt } from './install-prompt.js';
import { apiFetch } from './api.js';

const ICONS = {
  close:   '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  wave:    '<svg width="18" height="18" viewBox="0 0 16 16" fill="none" style="vertical-align:-3px;"><path d="M8 1a2 2 0 012 2v4M8 1a2 2 0 00-2 2v5M11 5a1.3 1.3 0 012.6 0v3M6 7a1.3 1.3 0 00-2.6 0v1.5c0 3 2 5.5 5 5.5h1c2.5 0 4.5-2 4.5-4.5V7a1.3 1.3 0 00-2.6 0" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  lock:    '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-1px;"><rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" stroke-width="1.4"/><path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" stroke-width="1.4"/></svg>',
  warning: '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-1px;"><path d="M8 2L1 14h14L8 2z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M8 6.5v3.5M8 12v.1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  check:   '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-1px;"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.4"/><path d="M5 8l2 2 4-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  dotOrange:'<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#FFB23F;"></span>',
  dotGreen: '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#00E5A0;"></span>',
  dotRed:   '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#FF4D6A;"></span>',
  map:     '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:4px;"><path d="M1 4l5-1.5 4 1.5 5-1.5v10l-5 1.5-4-1.5-5 1.5V4z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>',
  arrow:   '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:4px;"><path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  bus:     '<svg width="13" height="13" viewBox="0 0 20 20" fill="none" style="vertical-align:-2px;margin-right:4px;"><rect x="3" y="4" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M3 10h14" stroke="currentColor" stroke-width="1.5"/><circle cx="6" cy="16" r="1.5" stroke="currentColor" stroke-width="1.4"/><circle cx="14" cy="16" r="1.5" stroke="currentColor" stroke-width="1.4"/></svg>',
  clock:   '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:3px;"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.4"/><path d="M8 5v3.5l2.5 1.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  bag:     '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:3px;"><rect x="3" y="5" width="10" height="8" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M6 5V3.5a2 2 0 014 0V5" stroke="currentColor" stroke-width="1.3"/></svg>',
  seat:    '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:3px;"><path d="M4 3v6a2 2 0 002 2h4M4 9H2.5a1 1 0 000 2H4M12 9h1.5a1 1 0 010 2H12v2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  person:  '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:3px;"><circle cx="8" cy="6" r="3" stroke="currentColor" stroke-width="1.3"/><path d="M2 15a6 6 0 0112 0" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
  print:   '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:4px;"><path d="M4 6V2h8v4M3 6h10a1 1 0 011 1v4a1 1 0 01-1 1h-2v2H5v-2H3a1 1 0 01-1-1V7a1 1 0 011-1z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><rect x="5" y="10" width="6" height="4" stroke="currentColor" stroke-width="1.2"/></svg>',
  edit:    '<svg width="13" height="13" viewBox="0 0 14 14" fill="none" style="vertical-align:-2px;margin-right:4px;"><path d="M9 2l3 3L4 13H1v-3L9 2z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  trash:   '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:4px;"><path d="M3 4h10M6 4V2h4v2M4 4l1 10h6l1-10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  banned:  '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:4px;"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.4"/><path d="M4 4l8 8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  eye:     '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:3px;"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.5"/></svg>',
  clipboard:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:4px;"><rect x="3" y="2" width="10" height="12" rx="1.5" stroke="currentColor" stroke-width="1.4"/><rect x="6" y="1" width="4" height="2.5" rx="0.5" stroke="currentColor" stroke-width="1.2"/></svg>',
  scissors:'<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:3px;"><circle cx="4" cy="4" r="1.6" stroke="currentColor" stroke-width="1.3"/><circle cx="4" cy="12" r="1.6" stroke="currentColor" stroke-width="1.3"/><path d="M5.3 5.2L13 12M5.3 10.8L13 4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
  chart:   '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:4px;"><path d="M2 12l4-4 3 3 5-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M11 5h3v3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  calendar:'<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:3px;"><rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M5 1v4M11 1v4M2 7h12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  info: '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-1px;"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.4"/><path d="M8 7v4.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="8" cy="4.8" r="0.9" fill="currentColor"/></svg>',
  coin: '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:4px;"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.4"/><path d="M8 4.5v7M6 6.2c0-.9.9-1.5 2-1.5s2 .6 2 1.4c0 1.8-4 1-4 2.8 0 .8.9 1.4 2 1.4s2-.6 2-1.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>',
  refresh: '<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M13 8A5 5 0 103 8M13 8V4M13 8H9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};
const BACKEND = 'https://travio-backend-pa4q.onrender.com';

const OFFSET_MS_FIN = 1 * 60 * 60 * 1000;
function toBrazzaDate(isoStr) {
  if (!isoStr) return '';
  return new Date(new Date(isoStr).getTime() + OFFSET_MS_FIN).toISOString().split('T')[0];
}

// ════════════════════════════════
//  STATE
// ════════════════════════════════
let pdvData      = null;   // données du PDV connecté
let agenceData   = null;   // données de l'agence parente
let trajetList   = [];     // trajets disponibles
let resaList     = [];     // réservations du PDV
let currentUser  = null;
let selectedTrajetForVente = null;
let finPeriode = 'today';
let finFiltreTrajet = '';
let finFiltreBus    = '';
let finFiltreStatut = '';   
let finCustomRange  = null;

let statsPdvCache = null;

function nomType(typeId) {
  return (agenceData?.typesBillet || []).find(t => t.id === typeId)?.nom || typeId;
}
// AJOUT :
function nomTypeResa(r) {
  return r.typeBilletNom || nomType(r.typeBillet);
}
function nomTypePassager(p) {
  return p.typeNom || nomType(p.type);
}
function ageRangeLabel(typeId) {
  const t = (agenceData?.typesBillet || []).find(t => t.id === typeId);
  if (!t) return '';
  return t.ageMax == null ? `${t.ageMin} ans et +` : `${t.ageMin}-${t.ageMax} ans`;
}

function peuplerSelectType(select) {
  if (!select) return;
  select.innerHTML = (agenceData?.typesBillet || []).map(t =>
    `<option value="${t.id}">${t.nom} — ${ageRangeLabel(t.id)}</option>`
  ).join('');
}

// ════════════════════════════════
//  INIT
// ════════════════════════════════

onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = 'auth.html'; return; }
  currentUser = user;

  try {
    // Récupérer le rôle et le pdvId directement depuis le backend (session toujours à jour)
    const authRes  = await apiFetch(`${BACKEND}/auth/login`, {
      method:  'POST',
      body:    JSON.stringify({ email: user.email }),
    });
    const pdvSession = await authRes.json();

    if (!authRes.ok || pdvSession.role !== 'agent') {
      window.location.href = 'auth.html';
      return;
    }

    // Charger les données du PDV
    const res  = await apiFetch(`${BACKEND}/pdv/${pdvSession.pdvId}`);
    const data = await res.json();

    if (!res.ok || !data) {
      showToast('Impossible de charger votre espace.', ICONS.banned);
      hideLoader();
      return;
    }

    pdvData = data;
    setAgentUI(pdvSession, data);

    // Charger les données de l'agence
    if (data.agenceId) {
      await loadAgenceData(data.agenceId);
      updateGuideBadgePDV();          
      checkGuideWelcomeModalPDV();
    }

    // Charger les trajets et réservations
    await Promise.all([
      loadTrajets(data.agenceId, data.id),
      loadReservations(data.id),
    ]);

    updateAccueilStats();

    initInstallPrompt();

  } catch (err) {
    console.error('Erreur init PDV :', err);
    showToast('Impossible de contacter le serveur.', ICONS.banned);
  } finally {
    hideLoader();
  }
});

// ════════════════════════════════
//  LOADER
// ════════════════════════════════
function hideLoader() {
  const el = document.getElementById('pageLoader');
  if (el) { el.classList.add('hide'); setTimeout(() => el.style.display = 'none', 500); }
}

// ════════════════════════════════
//  UI AGENT
// ════════════════════════════════
function setAgentUI(session, pdv) {
  const prenom   = session.prenom || '';
  const nom      = session.nom    || '';
  const initiale = prenom ? prenom[0].toUpperCase() : '?';

  const pdvName   = document.getElementById('pdvAgentName');
  const drawerAv  = document.getElementById('drawerAvatar');
  const drawerNm  = document.getElementById('drawerName');
  const greeting  = document.getElementById('accueilGreeting');
  const sub       = document.getElementById('accueilSub');

  if (pdvName)  pdvName.textContent  = `${prenom} ${nom}`.trim();
  if (drawerAv) drawerAv.textContent = initiale;
  if (drawerNm) drawerNm.textContent = `${prenom} ${nom}`.trim();
  if (greeting) greeting.innerHTML = `Bonjour ${prenom} ${ICONS.wave}`;
  if (sub && pdv) sub.textContent = `${pdv.nom} — ${pdv.ville || ''}`;
}

function renderPolitiqueAnnulPDV() {
  const el = document.getElementById('accueilPolitiqueAnnul');
  if (!el || !agenceData?.politiqueAnnulation) return;
  const pol = agenceData.politiqueAnnulation;
  let label, cls;
  if (!pol.autorise) {
    label = `${ICONS.lock} Vente définitive — aucune annulation`;
    cls = 'pol-badge-rouge';
  } else if (!pol.remboursement) {
    label = `${ICONS.warning} Annulation sans remboursement${pol.delaiHeures ? ' · délai ' + pol.delaiHeures + 'h' : ''}`;
    cls = 'pol-badge-orange';
  } else {
    label = `${ICONS.check} Annulation avec remboursement · ${pol.precisions || 0}% retenus · délai ${pol.delaiHeures || '?'}h`;
    cls = 'pol-badge-vert';
  }
  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:12px 16px;margin-bottom:4px;">
      <span style="font-size:12px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.8px;">Politique d'annulation</span>
      <span class="pol-badge ${cls}">${label}</span>
    </div>`;
}

// ════════════════════════════════
//  AGENCE
// ════════════════════════════════
async function loadAgenceData(agenceId) {
  try {
    const res  = await apiFetch(`${BACKEND}/agence/${agenceId}`);
    const data = await res.json();
    if (!res.ok) return;
    agenceData = data;
    renderPolitiqueAnnulPDV();
    const infoAgence = document.getElementById('infoAgence');
    if (infoAgence) infoAgence.textContent = data.nom || '—';
  } catch (err) {
    console.error('Erreur agence :', err);
  }
}

// ════════════════════════════════
//  TRAJETS
// ════════════════════════════════
async function loadTrajets(agenceId, pdvId) {
  try {
    const res  = await apiFetch(`${BACKEND}/trajets?agenceId=${agenceId}`);
    const data = await res.json();
    if (!res.ok) return;

    // Filtrer : trajets où ce PDV est autorisé
    const all = data.trajets || [];
    trajetList = all.filter(t => {
      if (t.actif === false) return false;
      const dep    = (t.pdvDepart  || []).map(p => p.id);
      const arrets = (t.pdvArrets  || []).map(p => p.id);
      return dep.includes(pdvId) || arrets.includes(pdvId);
    });

    renderTrajetsPDV();
    renderAccueilTrajets();
    populateVenteSelect();
    populateFilterTrajet();

  } catch (err) {
    console.error('Erreur trajets :', err);
    trajetList = [];
    renderTrajetsPDV();
  }
}

function renderTrajetsPDV() {
  const container = document.getElementById('trajetsPDVContainer');
  if (!container) return;

  if (trajetList.length === 0) {
    container.innerHTML = `
      <div class="empty-state large">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="12" cy="36" r="5" stroke="currentColor" stroke-width="2"/><circle cx="36" cy="36" r="5" stroke="currentColor" stroke-width="2"/><path d="M6 36V16a4 4 0 014-4h14l10 10v10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M24 12v10h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        <p>Aucun trajet disponible</p>
        <small>Contactez votre agence siège pour être assigné à des trajets.</small>
      </div>`;
    return;
  }

  container.innerHTML = trajetList.map(t => renderTrajetCardPDV(t)).join('');

  // Charger le nombre de bus actifs par trajet (cache partagé)
  trajetList.forEach(async t => {
    try {
      const departs = await getDepartsForTrajet(t.id);
      const nbBus   = departs.filter(d => d.actif !== false).length;
      const el      = document.getElementById(`busCountTrajet-${t.id}`);
      if (el) el.textContent = nbBus;
    } catch (_) {}
  });
}

function renderTrajetCardPDV(t) {
  const joursLabel = t.tousLesJours ? 'Tous les jours' : (t.jours || []).join(', ');

  const arretsSection = t.typeTrajet === 'arrets' && t.arrets?.length
    ? `<div style="font-size:12px;color:var(--muted);margin-top:4px;">
        <div style="margin-bottom:4px;font-weight:600;color:var(--white);">Arrêts :</div>
        <div style="display:flex;flex-direction:column;gap:3px;padding-left:8px;border-left:2px solid var(--border2);">
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="font-size:10px;color:var(--accent);">${ICONS.dotGreen}</span>
            <span style="color:var(--white);font-weight:600;">${t.villeDepart}</span>
            ${t.heureDepart ? `<span style="color:var(--muted);font-size:11px;">· ${t.heureDepart}</span>` : ''}
          </div>
          ${(t.arrets || []).map(a => {
            const villeLabel = a.ville || a.nom;
            return `
              <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                  <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--primary);"></span>
                  <span>${villeLabel}</span>
                  ${a.heurePassage ? `<span style="color:var(--accent);font-size:11px;font-weight:600;">· ${a.heurePassage}</span>` : ''}
                </div>
                <span style="color:var(--muted);font-size:11px;">${Object.values(a.prixParType || {}).map(p => Number(p).toLocaleString()).join(' / ')} XAF</span>
              </div>`;
          }).join('')}
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="font-size:10px;color:#FF4D6A;">${ICONS.dotRed}</span>
            <span style="color:var(--white);font-weight:600;">${t.villeArrivee}</span>
          </div>
        </div>
      </div>`
    : '';

  return `
    <div class="trajet-card">
      <div class="trajet-card-top">
        <div>
          <div class="trajet-card-route">${t.villeDepart} → ${t.villeArrivee}</div>
          <div class="trajet-card-meta">
            ${joursLabel}
            ${t.heureDepart ? ` · ${t.heureDepart}` : ''}
            ${t.heureArrivee ? ` → ${t.heureArrivee}` : ''}
            ${t.dureeEstimee ? ` · ${t.dureeEstimee}` : ''}
          </div>
        </div>
        <span class="trajet-status-badge active"><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--accent);margin-right:4px;vertical-align:middle;"></span>Actif</span>
      </div>

      <div class="trajet-card-body">
        ${t.typeTrajet === 'arrets'
          ? `<span>${ICONS.map} Trajet avec arrêts</span>`
          : `<span>${ICONS.arrow} Direct</span>`}
        ${t.limiteBagages ? `<span>Limite bagages : ${t.limiteBagages} kg</span>` : ''}
      </div>

      <div class="trajet-card-body">
        ${Object.entries(t.prixParType || {}).map(([typeId, prix]) => {
          const type = (agenceData.typesBillet || []).find(x => x.id === typeId);
          return `<span>${type?.nom || typeId} <small style="color:var(--muted);">(${ageRangeLabel(typeId)})</small> : <strong>${Number(prix).toLocaleString()} XAF</strong></span>`;
        }).join('')}
      </div>

      ${arretsSection}

      <div class="trajet-card-footer">
        <div class="trajet-quota-info">
          <span style="color:var(--muted);font-size:12px;">${ICONS.bus}</span>
          <span class="trajet-quota-val" id="busCountTrajet-${t.id}">…</span>
          <span style="color:var(--muted);font-size:12px;">bus actif${''}</span>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="trajet-sell-btn" style="background:var(--surface2);border:1px solid var(--border);color:var(--muted);" onclick="openTrajetDetailPDV('${t.id}')">
            Détails
          </button>
          <button class="trajet-sell-btn" onclick="prefillVente('${t.id}')">
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            Vendre
          </button>
        </div>
      </div>
    </div>`;
}

async function openTrajetDetailPDV(trajetId) {
  const t = trajetList.find(tr => tr.id === trajetId);
  if (!t) return;

  const overlay = document.createElement('div');
  overlay.id = 'trajetDetailPDVOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:7000;display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:opacity .3s ease;pointer-events:none;';
  overlay.innerHTML = `
    <div onclick="closeTrajetDetailPDV()" style="position:absolute;inset:0;background:rgba(10,14,26,0.85);backdrop-filter:blur(6px);"></div>
    <div style="position:relative;z-index:1;background:#0F1525;border:1px solid rgba(255,255,255,0.12);border-radius:24px 24px 0 0;width:100%;max-width:480px;max-height:88vh;overflow-y:auto;padding:0 0 32px;box-shadow:0 -24px 80px rgba(0,0,0,0.5);transform:translateY(40px);transition:transform .35s cubic-bezier(0.34,1.1,.64,1);" id="trajetDetailPDVPanel">

      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 20px 16px;border-bottom:1px solid var(--border);position:sticky;top:0;background:#0F1525;z-index:2;">
        <div>
          <div style="font-family:'Syne',sans-serif;font-size:17px;font-weight:800;color:var(--white);">${t.villeDepart} → ${t.villeArrivee}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:3px;">${t.typeTrajet === 'arrets' ? 'Avec arrêts' : 'Direct'}</div>
        </div>
        <button onclick="closeTrajetDetailPDV()" style="background:var(--surface);border:1px solid var(--border);border-radius:8px;color:var(--muted);width:30px;height:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:13px;">
          ${ICONS.close}
        </button>
      </div>

      <div style="padding:16px 20px;display:flex;flex-direction:column;gap:16px;">

        <!-- Prix -->
        <div>
          <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Tarifs</div>
          <div style="display:flex;gap:10px;">
            ${Object.entries(t.prixParType || {}).map(([typeId, prix]) => {
              const type = (agenceData.typesBillet || []).find(x => x.id === typeId);
              return `
            <div style="flex:1;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px;text-align:center;">
              <div style="font-size:11px;color:var(--muted);margin-bottom:4px;">${type?.nom || typeId}</div>
              <div style="font-size:9px;color:var(--muted);margin-bottom:4px;">${ageRangeLabel(typeId)}</div>
              <div style="font-family:'Syne',sans-serif;font-size:15px;font-weight:800;color:var(--white);">${Number(prix).toLocaleString()}</div>
              <div style="font-size:10px;color:var(--muted);">XAF</div>
            </div>`;
            }).join('')}
            ${t.limiteBagages ? `
            <div style="flex:1;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px;text-align:center;">
              <div style="font-size:11px;color:var(--muted);margin-bottom:4px;">Bagages</div>
              <div style="font-family:'Syne',sans-serif;font-size:15px;font-weight:800;color:var(--accent);">${t.limiteBagages}</div>
              <div style="font-size:10px;color:var(--muted);">kg</div>
            </div>` : ''}
          </div>
        </div>

        ${agenceData?.delaiFormalite ? `
        <div>
          <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Présentation avant départ</div>
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:10px 14px;font-size:13px;color:var(--white);font-weight:600;">
            ${ICONS.clock} ${formatDelaiFormalite(agenceData.delaiFormalite)}
          </div>
        </div>` : ''}

        <!-- Arrêts (si trajet avec arrêts) -->
        ${t.typeTrajet === 'arrets' && t.arrets?.length ? `
        <div>
          <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Arrêts intermédiaires</div>
          <div style="display:flex;flex-direction:column;gap:0;">
            <div style="display:flex;align-items:center;gap:10px;padding:8px 0;">
              <div style="width:10px;height:10px;border-radius:50%;background:var(--accent);flex-shrink:0;"></div>
              <span style="font-size:13px;font-weight:700;color:var(--white);">${t.villeDepart}</span>
              ${t.heureDepart ? `<span style="font-size:11px;color:var(--muted);margin-left:auto;">${ICONS.clock} ${t.heureDepart}</span>` : ''}
            </div>
            ${(t.arrets || []).map(a => `
            <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid var(--border);margin-left:4px;">
              <div style="width:6px;height:6px;border-radius:50%;background:var(--primary);flex-shrink:0;"></div>
              <div style="flex:1;">
                <span style="font-size:13px;font-weight:600;color:var(--white);">${a.ville || a.nom}</span>
                <span style="font-size:11px;color:var(--muted);margin-left:8px;">${Object.values(a.prixParType || {}).map(p => Number(p).toLocaleString()).join(' / ')} XAF</span>
              </div>
              ${a.heurePassage ? `<span style="font-size:11px;color:var(--accent);font-weight:600;">${ICONS.clock} ${a.heurePassage}</span>` : ''}
            </div>`).join('')}
            <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid var(--border);">
              <div style="width:10px;height:10px;border-radius:50%;background:#FF4D6A;flex-shrink:0;"></div>
              <span style="font-size:13px;font-weight:700;color:var(--white);">${t.villeArrivee}</span>
            </div>
          </div>
        </div>` : ''}

        <!-- Prix tronçons (si trajet avec arrêts) -->
        ${t.typeTrajet === 'arrets' && t.prixTroncons && Object.keys(t.prixTroncons).length > 0 ? `
        <div>
          <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Prix par tronçon</div>
          <div style="display:flex;flex-direction:column;gap:6px;">
            ${Object.entries(t.prixTroncons).map(([cle, prix]) => {
              const [from, to] = cle.split('|');
              return `
                <div style="display:flex;align-items:center;justify-content:space-between;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:10px 14px;">
                  <span style="font-size:12px;font-weight:600;color:var(--white);">${from} → ${to}</span>
                  <div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px;">
                    ${Object.entries(prix).map(([typeId, val]) => {
                      const type = (agenceData.typesBillet || []).find(x => x.id === typeId);
                      return `<span style="font-size:12px;font-weight:700;color:var(--white);">${type?.nom || typeId} : ${Number(val).toLocaleString()} XAF</span>`;
                    }).join('')}
                  </div>
                </div>`;
            }).join('')}
          </div>
        </div>` : ''}

        <!-- Bus actifs -->
        <div>
          <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Bus actifs</div>
          <div id="trajetDetailBusList" style="display:flex;flex-direction:column;gap:8px;">
            <div style="text-align:center;padding:16px;color:var(--muted);font-size:12px;">Chargement...</div>
          </div>
        </div>

      </div>

      <!-- Action -->
      <div style="padding:0 20px;">
        <button onclick="closeTrajetDetailPDV();prefillVente('${t.id}')" style="width:100%;background:var(--accent);color:var(--dark);border:none;border-radius:12px;padding:14px;font-size:14px;font-weight:700;font-family:'DM Sans',sans-serif;cursor:pointer;">
          Vendre un billet sur ce trajet
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'all';
    const panel = document.getElementById('trajetDetailPDVPanel');
    if (panel) panel.style.transform = 'translateY(0)';
  });

  // Charger les bus (cache partagé)
  try {
    const allDeparts = await getDepartsForTrajet(t.id);
    const departs     = allDeparts.filter(d => d.actif !== false);
    const list        = document.getElementById('trajetDetailBusList');
    if (!list) return;

    if (departs.length === 0) {
      list.innerHTML = `<div style="text-align:center;padding:16px;color:var(--muted);font-size:12px;background:var(--surface);border-radius:10px;">Aucun bus actif sur ce trajet.</div>`;
      return;
    }

    list.innerHTML = departs.map(d => {
      const joursLabel = d.tousLesJours ? 'Tous les jours' : (d.jours || []).join(', ');
      return `
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:11px;padding:12px 14px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
            <div style="font-family:'Syne',sans-serif;font-size:13px;font-weight:800;color:var(--white);">${d.busNom}</div>
            <span style="font-size:10px;font-weight:600;padding:3px 8px;border-radius:20px;background:rgba(0,229,160,0.1);color:var(--accent);"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--accent);margin-right:4px;vertical-align:middle;"></span>Actif</span>
          </div>
          <div style="font-size:11.5px;color:var(--muted);">${d.busType} · ${d.busCapacite} places</div>
          <div style="font-size:11.5px;color:var(--white);margin-top:4px;font-weight:600;">
            ${ICONS.clock} ${d.heureDepart}${d.heureArrivee ? ' → ' + d.heureArrivee : ''}
            ${d.dureeEstimee ? `<span style="color:var(--muted);font-weight:400;"> · ${d.dureeEstimee}</span>` : ''}
          </div>
          <div style="font-size:11px;color:var(--muted);margin-top:2px;">${joursLabel}</div>
        </div>`;
    }).join('');
  } catch (_) {
    const list = document.getElementById('trajetDetailBusList');
    if (list) list.innerHTML = `<div style="color:#FF4D6A;text-align:center;font-size:12px;">Erreur de chargement.</div>`;
  }
}

function closeTrajetDetailPDV() {
  const overlay = document.getElementById('trajetDetailPDVOverlay');
  if (overlay) {
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    setTimeout(() => overlay.remove(), 350);
  }
}

function renderAccueilTrajets() {
  const container = document.getElementById('accueilTrajetsList');
  if (!container) return;

  if (trajetList.length === 0) {
    container.innerHTML = `<div class="empty-state small"><p>Aucun trajet assigné</p></div>`;
    return;
  }

  container.innerHTML = trajetList.slice(0, 4).map(t => {
    const isArrets = t.typeTrajet === 'arrets';
    return `
      <div class="trajet-quick-item" onclick="prefillVente('${t.id}')">
        <div style="flex:1;min-width:0;">
          <div class="trajet-quick-route">${t.villeDepart} → ${t.villeArrivee}</div>
          <div class="trajet-quick-meta" style="display:flex;align-items:center;gap:6px;margin-top:3px;flex-wrap:wrap;">
            <span style="font-size:10px;padding:2px 6px;border-radius:5px;font-weight:600;
              background:${isArrets ? 'rgba(0,87,255,0.12)' : 'rgba(0,229,160,0.1)'};
              color:${isArrets ? '#5B9BFF' : 'var(--accent)'};">
              ${isArrets ? ICONS.map + ' Arrêts' : ICONS.arrow + ' Direct'}
            </span>
            <span>${(() => { const v = Object.values(t.prixParType || {})[0]; return v ? Number(v).toLocaleString() + ' XAF' : '—'; })()}</span>
          </div>
        </div>
        <div class="trajet-quick-right">
          <div class="trajet-quick-heure">${t.heureDepart || '—'}</div>
          <div style="font-size:10px;color:var(--muted);margin-top:2px;">Vendre →</div>
        </div>
      </div>`;
  }).join('');
}

// ════════════════════════════════
//  RÉSERVATIONS
// ════════════════════════════════
async function loadReservations(pdvId) {
  try {
    const res  = await apiFetch(`${BACKEND}/reservations?pdvId=${pdvId}`);
    const data = await res.json();
    if (!res.ok) return;
    resaList = data.reservations || [];
    renderResaList(resaList);
    populateFilterBus();
    renderAccueilVentes();
    updateBadges();
  } catch (err) {
    console.error('Erreur réservations :', err);
    resaList = [];
    renderResaList([]);
  }
}

const JOURS_COURTS_ACCUEIL = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];
const MOIS_LONGS_ACCUEIL = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];

function formatDateCourteAccueil(dateObj) {
  if (!dateObj) return '—';
  return `${JOURS_COURTS_ACCUEIL[dateObj.getDay()]}-${dateObj.getDate()}${MOIS_LONGS_ACCUEIL[dateObj.getMonth()]}`;
}

function getTypeTrajetInfoAccueil(trajet) {
  const avecArret = Array.isArray(trajet?.arrets) && trajet.arrets.length > 0;
  return avecArret
    ? { label: 'Avec arrêt', dot: '#FFB23F' }
    : { label: 'Direct', dot: '#00E5A0' };
}

function renderAccueilVentes() {
  const container = document.getElementById('accueilVentesList');
  if (!container) return;

  const today = toBrazzaDate(new Date().toISOString());

  const confirmees = resaList
    .filter(r => r.statut === 'confirmée')
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, 5);

  if (confirmees.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><rect x="6" y="8" width="24" height="22" rx="4" stroke="currentColor" stroke-width="1.8"/><path d="M12 5v6M24 5v6M6 16h24" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        <p>Aucune vente pour l'instant</p>
      </div>`;
    return;
  }

  container.innerHTML = confirmees.map(r => {
    const trajet = trajetList.find(t => t.id === r.trajetId);
    const routeLabel = (r.arretMontee && r.arretDescente)
      ? `${r.arretMontee} → ${r.arretDescente}`
      : (trajet ? `${trajet.villeDepart} → ${trajet.villeArrivee}` : (r.routeLabel || '—'));

    const typeInfo = trajet ? getTypeTrajetInfoAccueil(trajet) : null;
    const dateObj = r.dateDepart ? new Date(r.dateDepart + 'T00:00:00') : null;
    const dateLabel = formatDateCourteAccueil(dateObj);
    const estAujourdhui = toBrazzaDate(r.createdAt) === today;

    return `
      <div class="vente-row" style="cursor:pointer;${estAujourdhui ? 'border-left:3px solid var(--accent);padding-left:9px;' : ''}" onclick="openResaDetail('${r.id}')">
        <div class="vente-row-info">
          <div class="vente-row-name">
            ${estAujourdhui ? `<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--accent);margin-right:6px;vertical-align:middle;"></span>` : ''}
            ${r.prenomPassager || '—'} ${r.nomPassager || ''}
            ${estAujourdhui ? `<span style="font-size:9px;color:var(--accent);font-weight:700;margin-left:6px;text-transform:uppercase;letter-spacing:.5px;">Aujourd'hui</span>` : ''}
          </div>
          <div class="vente-row-route">
            ${routeLabel}
            ${typeInfo ? `<span style="font-size:9px;font-weight:700;padding:1px 6px;border-radius:5px;margin-left:6px;vertical-align:middle;background:${typeInfo.dot === '#00E5A0' ? 'rgba(0,229,160,0.12)' : 'rgba(255,178,63,0.12)'};color:${typeInfo.dot};">${typeInfo.label}</span>` : ''}
          </div>
          <div style="font-size:10.5px;color:var(--muted);margin-top:2px;">${dateLabel} · ${r.heureDepart || '—'}</div>
        </div>
        <div class="vente-row-right">
          <div class="vente-row-prix">${Number(r.prixTotal || 0).toLocaleString()} XAF</div>
          <span style="display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:600;padding:2px 8px;border-radius:20px;background:rgba(0,229,160,0.1);color:var(--accent);">
            <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--accent);"></span>
            Confirmée
          </span>
          ${r.baisseNonVerifiee ? `<span class="resa-meta-badge" style="background:rgba(255,77,106,0.12);color:#FF4D6A;margin-top:3px;display:inline-block;">${ICONS.warning} Prix réduit</span>` : ''}
          ${r.passagerRetire ? `<span class="resa-meta-badge" style="background:rgba(255,178,63,0.12);color:#FFB23F;margin-top:3px;display:inline-block;">${ICONS.person} Retrait</span>` : ''}
        </div>
      </div>`;
  }).join('');
}

// ════════════════════════════════
//  STATS ACCUEIL
// ════════════════════════════════
async function updateAccueilStats() {
  const today = toBrazzaDate(new Date().toISOString());
  const month = today.slice(0, 7);

  const resasJour = resaList.filter(r => toBrazzaDate(r.createdAt) === today);
  const resasMois = resaList.filter(r => toBrazzaDate(r.createdAt).startsWith(month));

  const confJour = resasJour.filter(r => r.statut !== 'annulée');
  const confMois = resasMois.filter(r => r.statut !== 'annulée');

  const vendusJour = confJour.reduce((s, r) => s + (r.nbPassagers || r.passagers?.length || 1), 0);
  const vendusMois = confMois.reduce((s, r) => s + (r.nbPassagers || r.passagers?.length || 1), 0);
  const revMois    = confMois.reduce((s, r) => s + (r.prixTotal || 0), 0);
  const revJour    = confJour.reduce((s, r) => s + (r.prixTotal || 0), 0);

  // NOUVEAU — comparaison vs période précédente
  const yesterday = toBrazzaDate(new Date(Date.now() - 86400000).toISOString());
  const resasHierTotal = resaList.filter(r => toBrazzaDate(r.createdAt) === yesterday);
  const resasHierConf  = resasHierTotal.filter(r => r.statut !== 'annulée');

  const todayDateObj  = new Date(today + 'T00:00:00Z');
  const quantiemeAuj  = todayDateObj.getUTCDate();
  const prevMonthDate = new Date(Date.UTC(todayDateObj.getUTCFullYear(), todayDateObj.getUTCMonth() - 1, 1));
  const prevMonth     = prevMonthDate.toISOString().slice(0, 7);
  const dernierJourPrevMois = new Date(Date.UTC(prevMonthDate.getUTCFullYear(), prevMonthDate.getUTCMonth() + 1, 0)).getUTCDate();
  const quantiemeLimite = Math.min(quantiemeAuj, dernierJourPrevMois);

  const resasMoisPrec = resaList.filter(r => {
    if (r.statut === 'annulée') return false;
    const d = toBrazzaDate(r.createdAt);
    if (!d.startsWith(prevMonth)) return false;
    const jour = Number(d.slice(8, 10));
    return jour <= quantiemeLimite;
  });

  const vendusHier     = resasHierConf.reduce((s, r) => s + (r.nbPassagers || r.passagers?.length || 1), 0);
  const revHier        = resasHierConf.reduce((s, r) => s + (r.prixTotal || 0), 0);
  const vendusMoisPrec = resasMoisPrec.reduce((s, r) => s + (r.nbPassagers || r.passagers?.length || 1), 0);

  const setEl   = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  const setHtml = (id, val) => { const el = document.getElementById(id); if (el) el.innerHTML = val; };

  setEl('statVendusJour',  vendusJour.toLocaleString());
  setEl('statVendusMois',  vendusMois.toLocaleString());
  setEl('statRevenusMois', revJour.toLocaleString() + ' XAF');
  setEl('statPlacesTotal', resasJour.length.toLocaleString());

  // NOUVEAU — compteur réservations du jour sur chaque KPI (sauf "Vendus ce mois")
  const resaTodayLabel = `${resasJour.length} résa. aujourd'hui`;
  setEl('statCardBadgeResa1', resaTodayLabel);
  setEl('statCardBadgeResa2', resaTodayLabel);
  setEl('statCardBadgeResa4', resaTodayLabel);

  setHtml('statPlacesTotalDelta',  cmpHtmlPDV(resasJour.length, resasHierTotal.length));
  setHtml('statVendusJourDelta',   cmpHtmlPDV(vendusJour, vendusHier));
  setHtml('statVendusMoisDelta',   cmpHtmlPDV(vendusMois, vendusMoisPrec));
  setHtml('statRevenusMoisDelta',  cmpHtmlPDV(revJour, revHier));
}

// ════════════════════════════════
//  BADGES
// ════════════════════════════════
function updateBadges() {
  const today = toBrazzaDate(new Date().toISOString());
  const vendusAujourdHui = resaList.filter(r =>
    toBrazzaDate(r.createdAt) === today && r.statut !== 'annulée'
  ).length;

  const badge = document.getElementById('drawerBadgeResa');
  if (badge) {
    badge.textContent = vendusAujourdHui;
    badge.classList.toggle('show', vendusAujourdHui > 0);
  }
}

// ════════════════════════════════
//  VENTE — SELECT TRAJET
// ════════════════════════════════
function populateVenteSelect() {
  // Initialiser avec le type "direct" par défaut
  setTrajetType('direct');

}

function setTrajetType(type) {
  // Mettre à jour les boutons toggle
  document.getElementById('btnTypeDirect')?.classList.toggle('active', type === 'direct');
  document.getElementById('btnTypeArrets')?.classList.toggle('active', type === 'arrets');
 
  // Réinitialiser le select et les récaps
  const select = document.getElementById('vente-trajet');
  if (select) {
    select.innerHTML = '<option value="">Sélectionner un trajet</option>';
    const filtered = trajetList.filter(t => (t.typeTrajet || 'direct') === type);
    filtered.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = `${t.villeDepart} → ${t.villeArrivee} · ${t.heureDepart || '—'}`;
      select.appendChild(opt);
    });
  }
 
  // Masquer les récaps
  const recapD = document.getElementById('trajetRecapDirect');
  const recapA = document.getElementById('trajetRecapArrets');
  const dateBlock = document.getElementById('dateSessionBlock');
  if (recapD) recapD.style.display = 'none';
  if (recapA) recapA.style.display = 'none';
  if (dateBlock) dateBlock.style.display = 'none';

  renderTrajetCardList();
  selectedTrajetForVente = null;
}
window.setTrajetType = setTrajetType;

function renderTrajetCardList() {
  const container = document.getElementById('trajetCardList');
  const select = document.getElementById('vente-trajet');
  if (!container || !select) return;

  const options = Array.from(select.options).filter(o => o.value);

  if (options.length === 0) {
    container.innerHTML = `<div class="empty-state small"><p>Aucun trajet pour ce type.</p></div>`;
    return;
  }

  container.innerHTML = options.map(opt => {
    const t = trajetList.find(tr => tr.id === opt.value);
    const prix = t ? Object.values(t.prixParType || {})[0] : null;
    const searchStr = ((t?.villeDepart || '') + ' ' + (t?.villeArrivee || '')).toLowerCase();
    return `
      <div class="trajet-card-pick" data-search="${searchStr}" data-value="${opt.value}" onclick="pickTrajetCard(this)">
        <div>
          <div class="trajet-card-pick-route">${opt.textContent}</div>
          <div class="trajet-card-pick-meta">${t?.typeTrajet === 'arrets' ? '⊙ Avec arrêts' : '→ Direct'}</div>
        </div>
        ${prix ? `<div class="trajet-card-pick-price">${Number(prix).toLocaleString()} XAF</div>` : ''}
      </div>`;
  }).join('');

  filterTrajetCards();
}

function pickTrajetCard(el) {
  document.querySelectorAll('.trajet-card-pick').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  const select = document.getElementById('vente-trajet');
  select.value = el.dataset.value;
  onSelectTrajet();
}

function filterTrajetCards() {
  const term = (document.getElementById('trajetSearchInput')?.value || '').toLowerCase().trim();
  document.querySelectorAll('.trajet-card-pick').forEach(c => {
    c.style.display = !term || c.dataset.search.includes(term) ? 'flex' : 'none';
  });
}

function toggleMoreOptions(el) {
  const box = el.nextElementSibling;
  const icon = el.querySelector('.more-icon');
  box.classList.toggle('open');
  icon.textContent = box.classList.contains('open') ? '－' : '＋';
}

function populateFilterTrajet() {
  const select = document.getElementById('filterTrajet');
  if (!select) return;

  select.innerHTML = '<option value="">Tous les trajets</option>' +
    trajetList.map(t => {
      const typeLabel = t.typeTrajet === 'arrets' ? '⊙ Arrêts' : '→ Direct';
      return `<option value="${t.id}">${typeLabel} · ${t.villeDepart} → ${t.villeArrivee}</option>`;
    }).join('');
}

// ════════════════════════════════
//  CACHE PARTAGÉ — DÉPARTS PAR TRAJET
//  (route/bus/horaires : quasi statique côté PDV, jamais édité depuis cette interface)
// ════════════════════════════════
const departsParTrajetCache = new Map(); // trajetId -> Promise<departs[]>

function getDepartsForTrajet(trajetId) {
  if (!trajetId) return Promise.resolve([]);
  if (!departsParTrajetCache.has(trajetId)) {
    const p = apiFetch(`${BACKEND}/trajet/${trajetId}/departs`)
      .then(r => r.json())
      .then(d => d.departs || [])
      .catch(err => {
        console.error('Erreur chargement départs trajet :', err);
        departsParTrajetCache.delete(trajetId); // permet un retry au prochain appel
        return [];
      });
    departsParTrajetCache.set(trajetId, p);
  }
  return departsParTrajetCache.get(trajetId);
}

// ════════════════════════════════
//  BUS DISPONIBLES POUR CE PDV (tous les trajets assignés)
// ════════════════════════════════
let busNomsPdvCache = null;
let busNomsPdvPromise = null;

async function getBusNomsPourPDV() {
  if (busNomsPdvCache) return busNomsPdvCache;
  if (busNomsPdvPromise) return busNomsPdvPromise;

  busNomsPdvPromise = (async () => {
    try {
      const results = await Promise.all(
        trajetList.map(t => getDepartsForTrajet(t.id).then(departs => departs.map(dep => dep.busNom)))
      );
      busNomsPdvCache = [...new Set(results.flat().filter(Boolean))].sort();
      return busNomsPdvCache;
    } catch (err) {
      console.error('Erreur chargement bus PDV :', err);
      return [];
    }
  })();

  return busNomsPdvPromise;
}

function populateFilterBus(trajetId = '') {
  const select = document.getElementById('filterBus');
  if (!select) return;
  select.innerHTML = '<option value="">Tous les bus</option>';

  if (trajetId) {
    getDepartsForTrajet(trajetId)
      .then(departs => {
        const busNoms = [...new Set(departs.map(d => d.busNom).filter(Boolean))].sort();
        select.innerHTML = '<option value="">Tous les bus</option>' +
          busNoms.map(nom => `<option value="${nom}">${nom}</option>`).join('');
      })
      .catch(err => console.error('Erreur chargement bus filtre réservations :', err));
  } else {
    getBusNomsPourPDV().then(busNoms => {
      select.innerHTML = '<option value="">Tous les bus</option>' +
        busNoms.map(nom => `<option value="${nom}">${nom}</option>`).join('');
    });
  }
}

function updateFiltreHighlightPDV(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('filtre-actif', !!el.value);
}

function onFilterTrajetChangePDV() {
  const trajetId = document.getElementById('filterTrajet')?.value || '';
  const busSelect = document.getElementById('filterBus');
  if (busSelect) busSelect.value = '';

  populateFilterBus(trajetId);

  ['filterTrajet', 'filterBus'].forEach(updateFiltreHighlightPDV);
  filterReservations();
}
window.onFilterTrajetChangePDV = onFilterTrajetChangePDV;

function onFilterBusChangePDV() {
  updateFiltreHighlightPDV('filterBus');
  filterReservations();
}
window.onFilterBusChangePDV = onFilterBusChangePDV;

function onSelectTrajet() {
  const trajetId   = document.getElementById('vente-trajet')?.value;
  const recapD     = document.getElementById('trajetRecapDirect');
  const recapA     = document.getElementById('trajetRecapArrets');
  const dateBlock  = document.getElementById('dateSessionBlock');
 
  if (!trajetId) {
    if (recapD) recapD.style.display = 'none';
    if (recapA) recapA.style.display = 'none';
    if (dateBlock) dateBlock.style.display = 'none';
    selectedTrajetForVente = null;
    return;
  }
 
  const t = trajetList.find(tr => tr.id === trajetId);
  if (!t) return;
  document.querySelectorAll('.p-type').forEach(peuplerSelectType);
  selectedTrajetForVente = t;
 
  const joursLabel = t.tousLesJours ? 'Tous les jours' : (t.jours || []).join(', ');
 
  // ── Trajet DIRECT ──
  if ((t.typeTrajet || 'direct') === 'direct') {
    if (recapA) recapA.style.display = 'none';

    document.getElementById('recapRoute').textContent =
      `${t.villeDepart} → ${t.villeArrivee}`;

    let metaHtml = '';
    if (t.limiteBagages) metaHtml += `<span>${ICONS.bag} Limite ${t.limiteBagages} kg</span>`;
    if (t.fraisExcesBagages) metaHtml += `<span>${ICONS.coin} ${t.fraisExcesBagages} XAF/kg excédent</span>`;
    document.getElementById('recapMeta').innerHTML = metaHtml || '<span>Trajet direct</span>';

    const recapPrixTypesEl = document.getElementById('recapPrixTypes');
    if (recapPrixTypesEl) {
      recapPrixTypesEl.innerHTML = Object.entries(t.prixParType || {}).map(([typeId, prix]) =>
        `<span>${nomType(typeId)} <small style="color:var(--muted);">(${ageRangeLabel(typeId)})</small> : <strong>${Number(prix).toLocaleString()} XAF</strong></span>`
      ).join('');
    }

    // Remplir villes (lecture seule)
    document.getElementById('vente-ville-depart').value  = t.villeDepart;
    document.getElementById('vente-ville-arrivee').value = t.villeArrivee;

    // PDV d'embarquement : liste t.pdvDepart, pré-sélectionné sur le PDV connecté
    const selEmb = document.getElementById('vente-pdv-embarquement');
    if (selEmb) {
      selEmb.innerHTML = (t.pdvDepart || []).map(p =>
        `<option value="${p.id}" data-nom="${p.nom||''}" data-ville="${p.ville||''}">${p.nom}${p.ville ? ' — '+p.ville : ''}</option>`
      ).join('');
      // Pré-sélection sur le PDV connecté si présent dans la liste
      const match = (t.pdvDepart || []).find(p => p.id === pdvData.id);
      selEmb.value = match ? match.id : (t.pdvDepart?.[0]?.id || '');
    }

    // PDV de débarquement : liste t.pdvArrivee, aucun pré-select
    const selDeb = document.getElementById('vente-pdv-debarquement');
    if (selDeb) {
      selDeb.innerHTML = '<option value="">— Sélectionner —</option>' +
        (t.pdvArrivee || []).map(p =>
          `<option value="${p.id}" data-nom="${p.nom||''}" data-ville="${p.ville||''}">${p.nom}${p.ville ? ' — '+p.ville : ''}</option>`
        ).join('');
    }

    document.getElementById('embarquementDebarquementBlock').style.display = 'flex';

    if (recapD) recapD.style.display = 'flex';
 
  // ── Trajet AVEC ARRÊTS ──
  } else {
    if (recapD) recapD.style.display = 'none';
    const ed = document.getElementById('embarquementDebarquementBlock');
    if (ed) ed.style.display = 'none';
 
    document.getElementById('recapRouteArrets').textContent =
      `${t.villeDepart} → ${t.villeArrivee}`;
 
    // Construire la timeline des arrêts
    const timeline = document.getElementById('arretsTimeline');
    if (timeline) {
      const allPoints = [
        { nom: t.villeDepart, heurePassage: t.heureDepart, isOrigin: true },
        ...(t.arrets || []).map(a => ({ ...a, nom: a.ville || a.nom })),
        { nom: t.villeArrivee, heurePassage: t.heureArrivee, isDestination: true },
      ];

      timeline.innerHTML = allPoints.map((p, i) => {
        let dotClass = 'stop';
        if (p.isOrigin)      dotClass = 'origin';
        if (p.isDestination) dotClass = 'destination';
 
        const prixLabel = (!p.isOrigin && p.prixParType && Object.keys(p.prixParType).length)
          ? `<span class="arret-line-prix">${Object.entries(p.prixParType).map(([tid, v]) => `${Number(v).toLocaleString()} XAF (${ageRangeLabel(tid)})`).join(' · ')}</span>`
          : '';
 
        return `
          <div class="arret-line-item">
            <div class="arret-dot ${dotClass}"></div>
            <div class="arret-line-info">
              <div>
                <div class="arret-line-name">${p.nom}</div>
                ${p.heurePassage ? `<div class="arret-line-heure">${p.heurePassage}</div>` : ''}
              </div>
              ${prixLabel}
            </div>
          </div>`;
      }).join('');
    }
 
    // Peupler les selects montée / descente
    const monteeSelect   = document.getElementById('vente-montee');
    const descenteSelect = document.getElementById('vente-descente');

    if (monteeSelect && descenteSelect) {
      const allPoints = [
        { nom: t.villeDepart },
        ...(t.arrets || []).map(a => ({ ...a, nom: a.ville || a.nom })),
        { nom: t.villeArrivee },
      ];

      // Position du PDV sur la ligne
      let position = -1;
      const estDepart = (t.pdvDepart || []).some(p => p.id === pdvData.id);
      const estArretIntermediaire = (t.pdvArrets || []).some(p => p.id === pdvData.id);

      if (estDepart) {
        position = 0;
      } else if (estArretIntermediaire) {
        // Chercher par ID directement dans allPoints (plus fiable que par nom/ville)
        position = allPoints.findIndex(p => p.id === pdvData.id);
      }

      if (position === -1 || position >= allPoints.length - 1) position = 0;

      const villeMonteePdv = allPoints[position].nom;

      // Ville de montée (lecture seule)
      const inputVilleMontee = document.getElementById('vente-montee-ville');
      if (inputVilleMontee) inputVilleMontee.value = villeMonteePdv;

      // PDV d'embarquement : liste des PDV au point de montée
      // Si c'est le départ → t.pdvDepart, si c'est un arrêt intermédiaire → ce PDV uniquement
      const pdvsEmbarquement = estDepart
        ? (t.pdvDepart || [])
        : (t.pdvArrets || []).filter(p => p.id === pdvData.id);

      monteeSelect.innerHTML = pdvsEmbarquement.length > 0
        ? pdvsEmbarquement.map(p =>
            `<option value="${p.id}" data-nom="${p.nom||''}" data-ville="${p.ville||''}" data-city="${villeMonteePdv}">${p.nom}${p.ville ? ' — '+p.ville : ''}</option>`
          ).join('')
        : `<option value="${pdvData.id}" data-nom="${pdvData.nom||''}" data-ville="${pdvData.ville||''}" data-city="${villeMonteePdv}">${pdvData.nom}</option>`;

      // Pré-sélectionner le PDV connecté si présent
      const matchEmb = pdvsEmbarquement.find(p => p.id === pdvData.id);
      monteeSelect.value = matchEmb ? matchEmb.id : (pdvsEmbarquement[0]?.id || '');
      monteeSelect.disabled = false;

      // Descente = villes APRÈS la position du PDV
      descenteSelect.innerHTML = '<option value="">— Ville de descente</option>' +
        allPoints.slice(position + 1).map(p =>
          `<option value="${p.nom}">${p.nom}</option>`
        ).join('');
      descenteSelect.disabled = false;

      // Vider le PDV de débarquement en attente d'une ville
      const selDebArrets = document.getElementById('vente-pdv-debarquement-arrets');
      if (selDebArrets) selDebArrets.innerHTML = '<option value="">— Sélectionner —</option>';

      onSegmentChange();
    }
 
    if (recapA) recapA.style.display = 'flex';
  }
 
  if (dateBlock) {
    dateBlock.style.display = 'flex';
    // Réinitialiser la sélection
    const dateInput    = document.getElementById('vente-date');
    const sessionInput = document.getElementById('vente-session-id');
    if (dateInput)    dateInput.value    = '';
    if (sessionInput) sessionInput.value = '';
    // Charger les sessions
    loadSessionsDisponibles(trajetId);
  }
  updatePrixPreview();
}

function onSegmentChange() {
  
  if (!selectedTrajetForVente) {
    return;
  }
  
  const monteeVal   = document.getElementById('vente-montee-ville')?.value;
  const descenteVal = document.getElementById('vente-descente')?.value;
  
  if (!monteeVal || !descenteVal) {
    return;
  }
  
  const t = selectedTrajetForVente;
  const segmentPrixTypesEl = document.getElementById('segmentPrixTypes');
  
  const allPoints = [
    { nom: t.villeDepart, prixParType: {}, isOrigin: true },
    ...(t.arrets || []).map(a => ({ ...a, nom: a.ville || a.nom })),
    { nom: t.villeArrivee, prixParType: t.prixParType, isDestination: true },
  ];
 
  const indexMontee   = allPoints.findIndex(p => p.nom === monteeVal);
  const indexDescente = allPoints.findIndex(p => p.nom === descenteVal);
 
  // Valider que la descente est après la montée
  if (indexDescente <= indexMontee) {
    if (segmentPrixTypesEl) segmentPrixTypesEl.style.display = 'none';
    return;
  }
 
  // Chercher le prix exact dans prixTroncons
  const cle = `${monteeVal}|${descenteVal}`;
  let prixSegmentParType = t.prixTroncons?.[cle] || null;

  // Fallback : si pas de prixTroncons, calcul par soustraction pour chaque type
  if (!prixSegmentParType || Object.keys(prixSegmentParType).length === 0) {
    const pointDescente = allPoints[indexDescente];
    const pointMontee   = allPoints[indexMontee];
    prixSegmentParType = {};
    Object.keys(t.prixParType || {}).forEach(typeId => {
      const prixDest    = pointDescente.prixParType?.[typeId] ?? t.prixParType[typeId] ?? 0;
      const prixMontee  = pointMontee.prixParType?.[typeId] ?? 0;
      prixSegmentParType[typeId] = Math.max(0, prixDest - prixMontee);
    });
  }

  // Stocker sur le trajet pour submitVente
  selectedTrajetForVente._segmentPrixParType = prixSegmentParType;
  selectedTrajetForVente._arretMontee        = monteeVal;
  selectedTrajetForVente._arretDescente      = descenteVal;

  // Peupler les PDV de débarquement selon la ville de descente choisie
  // Dans onSegmentChange(), remplace le bloc selDebArrets par :
  const selDebArrets = document.getElementById('vente-pdv-debarquement-arrets');
  if (selDebArrets) {
    const allPointsObj = [
      { nom: t.villeDepart, pdvs: t.pdvDepart || [] },
      ...(t.arrets || []).map(a => {
        const villeArret = a.ville || a.nom;
        const pdvsVille = (t.pdvArrets || []).filter(p =>
          (p.ville || '').toLowerCase().trim() === (villeArret || '').toLowerCase().trim()
        );
        
        return { nom: villeArret, pdvs: pdvsVille };
      }),
      { nom: t.villeArrivee, pdvs: t.pdvArrivee || [] },
    ];
    
    const pointDescObj = allPointsObj.find(p =>
      p.nom.toLowerCase().trim() === descenteVal.toLowerCase().trim()
    );
    
    const pdvsDesc = pointDescObj?.pdvs || [];

    // Vérifier si c'est un lieu libre (pas de PDV)
    const estLieuLibre = (t.arrets || []).some(a =>
      (a.ville || a.nom) === descenteVal && a.type === 'libre'
    );

    if (estLieuLibre) {
      // Lieu libre → pas de PDV, on met une option symbolique non bloquante
      selDebArrets.innerHTML = `<option value="__lieu_libre__" data-nom="${descenteVal}" data-ville="${descenteVal}">${descenteVal} (lieu libre)</option>`;
    } else {
      selDebArrets.innerHTML = pdvsDesc.length > 0
        ? '<option value="">— Sélectionner —</option>' + pdvsDesc.map(p =>
            `<option value="${p.id}" data-nom="${p.nom||''}" data-ville="${p.ville||''}">${p.nom}${p.ville ? ' — '+p.ville : ''}</option>`
          ).join('')
        : '<option value="">Aucun PDV disponible</option>';
    }
  }
 
  if (segmentPrixTypesEl) {
    segmentPrixTypesEl.innerHTML = Object.entries(prixSegmentParType).map(([typeId, prix]) =>
      `<span>${nomType(typeId)} <small style="color:var(--muted);">(${ageRangeLabel(typeId)})</small> : <strong>${Number(prix).toLocaleString()} XAF</strong></span>`
    ).join('');
    segmentPrixTypesEl.style.display = 'flex';
  }
 
  updatePrixPreview();
}
window.onSegmentChange = onSegmentChange;

async function loadSessionsDisponibles(trajetId) {
  const container = document.getElementById('sessionsDisponibles');
  if (!container) return;

  container.innerHTML = `<div class="empty-state small"><p>Chargement...</p></div>`;

  try {
    // Récupérer les départs du trajet (cache partagé)
    const allDeparts = await getDepartsForTrajet(trajetId);
    const departs     = allDeparts.filter(d => d.actif !== false);

    if (departs.length === 0) {
      container.innerHTML = `<div class="empty-state small"><p>Aucun bus actif sur ce trajet.</p></div>`;
      return;
    }

    // Récupérer les sessions de chaque départ
    const allSessions = [];
    for (const depart of departs) {
      const sRes  = await apiFetch(`${BACKEND}/sessions?departId=${depart.id}`);
      const sData = await sRes.json();
      (sData.sessions || []).forEach(s => {
        if (s.statut !== 'annulée') {
          allSessions.push({ ...s, busNom: depart.busNom, busType: depart.busType });
        }
      });
    }

    // Trier par date puis heure
    allSessions.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return (a.heureDepart || '').localeCompare(b.heureDepart || '');
    });

    if (allSessions.length === 0) {
      container.innerHTML = `<div class="empty-state small"><p>Aucune session disponible.</p><small>Contactez l'agence pour générer des sessions.</small></div>`;
      return;
    }

    const joursNoms = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];

    container.innerHTML = allSessions.map(s => {
      const dateObj   = new Date(s.date + 'T00:00:00');
      const jourLabel = joursNoms[dateObj.getDay()];
      let restantes;
      const t = selectedTrajetForVente;
      if (t && (t.typeTrajet || 'direct') === 'arrets' && s.placesVenduesSegments) {
        const allPoints = [
          t.villeDepart,
          ...(t.arrets || []).map(a => a.nom),
          t.villeArrivee,
        ];
        const estDepart = (t.pdvDepart || []).some(p => p.id === pdvData.id);
        let pdvPos;
        if (estDepart) {
          pdvPos = 0;
        } else {
          // Reconstruire allPoints comme objets pour pouvoir chercher par ID
          const allPointsObj = [
            { nom: t.villeDepart, id: null },
            ...(t.arrets || []).map(a => ({ nom: a.nom, id: a.id || null })),
            { nom: t.villeArrivee, id: null },
          ];
          pdvPos = allPointsObj.findIndex(p => p.id === pdvData.id);
        }
        if (pdvPos === -1) pdvPos = 0;

        const segmentsDepuisPDV = s.placesVenduesSegments.slice(pdvPos);
        const maxOccupe = segmentsDepuisPDV.length > 0 ? Math.max(...segmentsDepuisPDV) : 0;
        restantes = Math.max(0, s.placesTotal - maxOccupe);
      } else {
        restantes = s.placesRestantes ?? (s.placesTotal - (s.placesVendues || 0));
      }
      // Vérifier si l'heure de départ est déjà passée
      let heurePasse = false;
      const today = toBrazzaDate(new Date().toISOString());
      if (s.date === today && s.heureDepart) {
        const departInstant = new Date(`${s.date}T${s.heureDepart}:00Z`).getTime() - OFFSET_MS_FIN;
        heurePasse = Date.now() >= departInstant;
      }

      const complet = restantes <= 0 || heurePasse;

      // Formater la date en français
      const dateFormatee = dateObj.toLocaleDateString('fr-FR', {
        weekday: 'short', day: '2-digit', month: 'short'
      });

      return `
        <div class="session-item ${complet ? 'complet' : ''}"
          data-date="${s.date}"
          data-session-id="${s.id}"
          data-heure="${s.heureDepart || ''}"
          data-bus="${s.busNom || ''}"
          onclick="selectSession(this, '${s.date}', '${s.id}')">
          <div class="session-item-left">
            <div class="session-item-date">${dateFormatee}</div>
            <div class="session-item-bus">${ICONS.bus} ${s.busNom} · ${s.busType || ''}</div>
          </div>
          <div class="session-item-right">
            <div class="session-item-heure">${s.heureDepart || '—'}</div>
            <div class="session-item-places ${complet ? 'zero' : ''}">
              ${restantes <= 0 ? 'Complet' : heurePasse ? 'Départ passé' : `${restantes} place${restantes > 1 ? 's' : ''}`}
            </div>
          </div>
        </div>`;
    }).join('');

  } catch (err) {
    container.innerHTML = `<div class="empty-state small"><p>Erreur de chargement.</p></div>`;
  }
}

function selectSession(el, date, sessionId) {
  // Désélectionner l'ancien
  document.querySelectorAll('.session-item.selected').forEach(i => i.classList.remove('selected'));
  el.classList.add('selected');

  // Mettre à jour les champs cachés
  const dateInput     = document.getElementById('vente-date');
  const sessionInput  = document.getElementById('vente-session-id');
  if (dateInput)    dateInput.value    = date;
  if (sessionInput) sessionInput.value = sessionId;

  updatePrixPreview();
}
window.selectSession = selectSession;

function updatePrixPreview() {
  if (!selectedTrajetForVente) return;

  const t = selectedTrajetForVente;
  const isArrets = (t.typeTrajet || 'direct') === 'arrets';
  const blocks = document.querySelectorAll('.passager-block');

  let totalGeneral = 0;
  let linesHtml = '';

  blocks.forEach((block, i) => {
    const type    = block.querySelector('.p-type')?.value || 'adulte';
    const bagages = parseFloat(block.querySelector('.p-bagages')?.value || 0);

    const prixBase = isArrets
      ? (t._segmentPrixParType?.[type] || 0)
      : (t.prixParType?.[type] || 0);

    const excesBag  = bagages > (t.limiteBagages || 0) ? Math.max(0, bagages - (t.limiteBagages || 0)) : 0;
    const prixBag   = excesBag * (t.fraisExcesBagages || 0);
    const sousTotal = prixBase + prixBag;
    totalGeneral   += sousTotal;

    linesHtml += `
      <div class="prix-preview-row">
        <span>Passager ${i + 1} — ${nomType(type)} (${ageRangeLabel(type)})</span>
        <strong>${Number(sousTotal).toLocaleString()} XAF</strong>
      </div>`;
  });

  const linesEl = document.getElementById('prixPreviewLines');
  if (linesEl) linesEl.innerHTML = linesHtml;

  const totalEl = document.getElementById('previewTotal');
  if (totalEl) totalEl.textContent = `${Number(totalGeneral).toLocaleString()} XAF`;
}

function addPassager() {
  const list  = document.getElementById('passagersList');
  const index = list.querySelectorAll('.passager-block').length;

  const div = document.createElement('div');
  div.className = 'passager-block';
  div.dataset.index = index;
  div.innerHTML = `
    <div class="passager-block-header">
      <span class="passager-block-num">Passager ${index + 1}</span>
      <button class="passager-block-remove" onclick="removePassager(this)">${ICONS.close} Retirer</button>
    </div>
    <div class="vente-field-row">
      <div class="vente-field-group">
        <label>Prénom <span class="req">*</span></label>
        <input type="text" class="vente-input p-prenom" placeholder="Ex : Marie">
      </div>
      <div class="vente-field-group">
        <label>Nom <span class="req">*</span></label>
        <input type="text" class="vente-input p-nom" placeholder="Ex : Moukala">
      </div>
    </div>
    <div class="vente-field-row">
      <div class="vente-field-group">
        <label>Téléphone</label>
        <input type="tel" class="vente-input p-tel" placeholder="Optionnel">
      </div>
      <div class="vente-field-group">
        <label>Type de billet <span class="req">*</span></label>
        <select class="vente-select p-type" onchange="updatePrixPreview()"></select>
      </div>
    </div>
    <div class="more-options-toggle" onclick="toggleMoreOptions(this)">
      <span class="more-icon">＋</span> Bagages, siège (facultatif)
    </div>
    <div class="more-options">
      <div class="vente-field-row">
        <div class="vente-field-group">
          <label>Bagages (kg)</label>
          <input type="number" class="vente-input p-bagages" placeholder="0" min="0" oninput="updatePrixPreview()">
        </div>
        <div class="vente-field-group">
          <label>Siège (optionnel)</label>
          <input type="text" class="vente-input p-siege" placeholder="Ex : 13A">
        </div>
      </div>
    </div>
  `;
  list.appendChild(div);
  peuplerSelectType(div.querySelector('.p-type'));
  renumberPassagers();
  updatePrixPreview();
}

function removePassager(btn) {
  const block = btn.closest('.passager-block');
  if (block) block.remove();
  renumberPassagers();
  updatePrixPreview();
}

function renumberPassagers() {
  document.querySelectorAll('.passager-block').forEach((b, i) => {
    const label = b.querySelector('.passager-block-num');
    if (label) label.textContent = `Passager ${i + 1}`;
    b.dataset.index = i;
  });
}

// ════════════════════════════════
//  VENTE — ÉTAPES
// ════════════════════════════════
function venteGoStep(step) {
  if (step === 2) {
    const trajetId = document.getElementById('vente-trajet')?.value;
    const date     = document.getElementById('vente-date')?.value;

    if (!trajetId) { showToast('Sélectionnez un trajet.', ICONS.warning); return; }
    if (!date) { showToast('Sélectionnez une session de départ.', ICONS.warning); return; }

    if (selectedTrajetForVente && (selectedTrajetForVente.typeTrajet || 'direct') === 'arrets') {
      const montee   = document.getElementById('vente-montee')?.value;
      const descente = document.getElementById('vente-descente')?.value;
      if (!montee)   { showToast('Sélectionnez le PDV d\'embarquement.', ICONS.warning); return; }
      if (!descente) { showToast('Sélectionnez la ville de descente.', ICONS.warning); return; }
      const pdvDebArrets = document.getElementById('vente-pdv-debarquement-arrets')?.value;
      if (!pdvDebArrets) { showToast('Sélectionnez le PDV de débarquement.', ICONS.warning); return; }
    }

    const step1 = document.getElementById('venteStep1');
    const step2 = document.getElementById('venteStep2');

    if (step1) step1.style.display = 'none';
    if (step2) {
      step2.style.display = 'block';   // ← était 'flex'
      step2.classList.remove('locked');
      void step2.offsetWidth;
      step2.classList.add('slide-in');
    }

    updatePrixPreview();
    window.scrollTo({ top: 0, behavior: 'smooth' });

  } else if (step === 1) {
    const step1 = document.getElementById('venteStep1');
    const step2 = document.getElementById('venteStep2');

    if (step2) {
      step2.classList.remove('slide-in');
      setTimeout(() => {
        step2.style.display = 'none';
        step2.classList.add('locked');
      }, 350);
    }
    if (step1) step1.style.display = 'block';
  }
}

function showVenteRecap() {
  // Valider les champs
  const blocks = document.querySelectorAll('.passager-block');
  for (let i = 0; i < blocks.length; i++) {
    const prenom = blocks[i].querySelector('.p-prenom')?.value.trim();
    const nom    = blocks[i].querySelector('.p-nom')?.value.trim();
    const tel    = i === 0 ? blocks[i].querySelector('.p-tel')?.value.trim() : null;
    if (!prenom) { showToast(`Prénom manquant (Passager ${i + 1}).`, ICONS.warning); return; }
    if (!nom)    { showToast(`Nom manquant (Passager ${i + 1}).`, ICONS.warning); return; }
    if (i === 0 && !tel) { showToast('Téléphone du passager principal manquant.', ICONS.warning); return; }
  }

  // Après la boucle for des blocks, avant le `if (!selectedTrajetForVente)`
  const isArretsCheck = (selectedTrajetForVente?.typeTrajet || 'direct') === 'arrets';
  if (isArretsCheck) {
    const montee   = document.getElementById('vente-montee')?.value;
    const descente = document.getElementById('vente-descente')?.value;
    const debArrets = document.getElementById('vente-pdv-debarquement-arrets')?.value;
    if (!montee)    { showToast('Sélectionnez le PDV d\'embarquement.', ICONS.warning); return; }
    if (!descente)  { showToast('Sélectionnez la ville de descente.', ICONS.warning); return; }
    if (!debArrets) { showToast('Sélectionnez le PDV de débarquement.', ICONS.warning); return; }
    if (!selectedTrajetForVente._segmentPrixParType || Object.keys(selectedTrajetForVente._segmentPrixParType).length === 0) {
      showToast('Segment invalide : descente avant montée.', ICONS.warning); return;
    }
  }

  const isDirectCheck = (selectedTrajetForVente?.typeTrajet || 'direct') === 'direct';
  if (isDirectCheck) {
    const selEmb = document.getElementById('vente-pdv-embarquement');
    const selDeb = document.getElementById('vente-pdv-debarquement');
    if (!selEmb?.value) { showToast('Sélectionnez le PDV d\'embarquement.', ICONS.warning); return; }
    if (!selDeb?.value) { showToast('Sélectionnez le PDV de débarquement.', ICONS.warning); return; }
  }

  if (!selectedTrajetForVente) { showToast('Sélectionnez un trajet.', ICONS.warning); return; }

  const t       = selectedTrajetForVente;
  const date    = document.getElementById('vente-date')?.value;
  const sessionHeure = document.querySelector('.session-item.selected')?.dataset.heure || t.heureDepart || '—';
  const isArrets = (t.typeTrajet || 'direct') === 'arrets';

  // Construire les cartes passagers
  let passagersHtml = '';
  let totalGeneral  = 0;

  blocks.forEach((block, i) => {
    const prenom  = block.querySelector('.p-prenom')?.value.trim() || '—';
    const nom     = block.querySelector('.p-nom')?.value.trim()    || '—';
    const tel     = block.querySelector('.p-tel')?.value.trim()    || '—';
    const type    = block.querySelector('.p-type')?.value || 'adulte';
    const bagages = parseFloat(block.querySelector('.p-bagages')?.value || 0);
    const siege   = block.querySelector('.p-siege')?.value.trim() || '—';

    let prixBase = isArrets
      ? (t._segmentPrixParType?.[type] || 0)
      : (t.prixParType?.[type] || 0);

    const excesBag  = bagages > (t.limiteBagages || 0) ? Math.max(0, bagages - (t.limiteBagages || 0)) : 0;
    const prixBag   = excesBag * (t.fraisExcesBagages || 0);
    const sousTotal = prixBase + prixBag;
    totalGeneral   += sousTotal;

    passagersHtml += `
      <div class="recap-passager-card">
        <div class="recap-passager-title">Passager ${i + 1}</div>
        <div class="recap-row"><span>Nom complet</span><strong>${prenom} ${nom}</strong></div>
        ${i === 0 || tel !== '—' ? `<div class="recap-row"><span>Téléphone</span><strong>${tel}</strong></div>` : ''}
        <div class="recap-row"><span>Type</span><strong>${nomType(type)} <small style="color:var(--muted);">(${ageRangeLabel(type)})</small></strong></div>
        ${siege !== '—' ? `<div class="recap-row"><span>Siège</span><strong>${siege}</strong></div>` : ''}
        ${bagages > 0 ? `<div class="recap-row"><span>Bagages</span><strong>${bagages} kg${prixBag > 0 ? ` (+${Number(prixBag).toLocaleString()} XAF)` : ''}</strong></div>` : ''}
        <div class="recap-row"><span>Sous-total</span><strong style="color:var(--accent)">${Number(sousTotal).toLocaleString()} XAF</strong></div>
      </div>`;
  });

  // Date formatée
  const dateFormatee = date
    ? new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
    : '—';

  const routeLabel = isArrets && t._arretMontee
    ? `${t._arretMontee} → ${t._arretDescente}`
    : `${t.villeDepart} → ${t.villeArrivee}`;

  const remarquesVal = document.getElementById('vente-remarques')?.value.trim() || null;

  let embDebHtml = '';
  if (!isArrets) {
    const selEmb = document.getElementById('vente-pdv-embarquement');
    const selDeb = document.getElementById('vente-pdv-debarquement');
    const embOption = selEmb?.selectedOptions[0];
    const debOption = selDeb?.selectedOptions[0];

    embDebHtml = `
      <div class="recap-row"><span>Embarquement</span><strong>${embOption?.dataset.nom || '—'}${embOption?.dataset.ville ? ' — ' + embOption.dataset.ville : ''}</strong></div>
      <div class="recap-row"><span>Débarquement</span><strong>${debOption?.dataset.nom || '—'}${debOption?.dataset.ville ? ' — ' + debOption.dataset.ville : ''}</strong></div>`;
  } else {
    const selEmb = document.getElementById('vente-montee');
    const selDeb = document.getElementById('vente-pdv-debarquement-arrets');
    const embOption = selEmb?.selectedOptions[0];
    const debOption = selDeb?.selectedOptions[0];
    const villeMontee  = document.getElementById('vente-montee-ville')?.value || '';
    const villeDescente = document.getElementById('vente-descente')?.value || '';

    embDebHtml = `
      <div class="recap-row"><span>Montée</span><strong>${villeMontee}</strong></div>
      <div class="recap-row"><span>PDV embarquement</span><strong>${embOption?.dataset.nom || '—'}${embOption?.dataset.ville ? ' — ' + embOption.dataset.ville : ''}</strong></div>
      <div class="recap-row"><span>Descente</span><strong>${villeDescente}</strong></div>
      <div class="recap-row"><span>PDV débarquement</span><strong>${debOption?.dataset.nom || '—'}${debOption?.dataset.ville ? ' — ' + debOption.dataset.ville : ''}</strong></div>`;
  }

  // Créer la modale
  let overlay = document.getElementById('recapVenteOverlay');
  if (overlay) overlay.remove();

  overlay = document.createElement('div');
  overlay.id = 'recapVenteOverlay';
  overlay.className = 'recap-overlay';
  overlay.innerHTML = `
    <div class="recap-backdrop" onclick="closeVenteRecap()"></div>
    <div class="recap-modal">
      <div class="recap-modal-header">
        <div>
          <h3>${ICONS.clipboard} Récapitulatif</h3>
          <small>Vérifiez avant de confirmer</small>
        </div>
        <button class="recap-close-btn" onclick="closeVenteRecap()">${ICONS.close}</button>
      </div>
      <div class="recap-body">

        <div>
          <div class="recap-section-title">Trajet</div>
          <div class="recap-card">
            <div class="recap-row"><span>Ligne</span><strong>${routeLabel}</strong></div>
            <div class="recap-row"><span>Date</span><strong>${dateFormatee}</strong></div>
            <div class="recap-row"><span>Départ</span><strong>${sessionHeure}</strong></div>
            ${embDebHtml}
            ${blocks.length > 1 ? `<div class="recap-row"><span>Passagers</span><strong>${blocks.length} personnes</strong></div>` : ''}
          </div>
        </div>

        <div>
          <div class="recap-section-title">Passager${blocks.length > 1 ? 's' : ''}</div>
          ${passagersHtml}
        </div>

        ${remarquesVal ? `
          <div>
            <div class="recap-section-title">Remarques</div>
            <div class="recap-card"><div class="recap-row" style="display:block;"><span>${remarquesVal}</span></div></div>
          </div>` : ''}

        <div class="recap-total-row">
          <span>Total à encaisser</span>
          <strong>${Number(totalGeneral).toLocaleString()} XAF</strong>
        </div>

      </div>
      <div class="recap-actions">
        <button class="vente-btn-next vente-btn-confirm" id="recapBtnConfirm" onclick="submitVente()">
          ${ICONS.check} Confirmer et enregistrer
        </button>
        <button class="vente-btn-back" onclick="closeVenteRecap()">← Modifier</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
}

function closeVenteRecap() {
  const overlay = document.getElementById('recapVenteOverlay');
  if (overlay) {
    overlay.classList.remove('show');
    setTimeout(() => overlay.remove(), 350);
  }
}

// ════════════════════════════════
//  VENTE — SOUMETTRE
// ════════════════════════════════
async function submitVente() {
  closeVenteRecap();

  const blocks  = document.querySelectorAll('.passager-block');
  const date    = document.getElementById('vente-date')?.value;
  const remarques = document.getElementById('vente-remarques')?.value.trim() || null;
  const sessionId = document.getElementById('vente-session-id')?.value || null;
  const sessionHeure = document.querySelector('.session-item.selected')?.dataset.heure
    || selectedTrajetForVente?.heureDepart || null;
  const sessionBusNom = document.querySelector('.session-item.selected')?.dataset.bus || null;

  if (!selectedTrajetForVente) { showToast('Sélectionnez un trajet.', ICONS.warning); return; }

  const t = selectedTrajetForVente;        // ← t défini ICI
  const isArrets = (t.typeTrajet || 'direct') === 'arrets';

  // ── Calcul embarquement/débarquement ──
  const isDirect = (t.typeTrajet || 'direct') === 'direct';   // ← utilise t, donc OK ici

  let pdvEmbarquementId    = pdvData.id;
  let pdvEmbarquementNom   = pdvData.nom;
  let pdvEmbarquementVille = pdvData.ville;
  let pdvDebarquementId    = null;
  let pdvDebarquementNom   = null;
  let pdvDebarquementVille = null;

  if (isDirect) {
    const selEmb = document.getElementById('vente-pdv-embarquement');
    const selDeb = document.getElementById('vente-pdv-debarquement');

    if (!selEmb?.value || !selDeb?.value) {
      showToast('Sélectionnez les PDV d\'embarquement et de débarquement.', ICONS.warning);
      return;
    }

    const embOption = selEmb.selectedOptions[0];
    const debOption = selDeb.selectedOptions[0];

    pdvEmbarquementId    = selEmb.value;
    pdvEmbarquementNom   = embOption?.dataset.nom   || '';
    pdvEmbarquementVille = embOption?.dataset.ville || '';

    pdvDebarquementId    = selDeb.value;
    pdvDebarquementNom   = debOption?.dataset.nom   || '';
    pdvDebarquementVille = debOption?.dataset.ville || '';
  } else {
    // Trajet avec arrêts : récupérer les PDV sélectionnés
    const selEmb = document.getElementById('vente-montee'); // maintenant un select de PDV
    const selDeb = document.getElementById('vente-pdv-debarquement-arrets');

    if (selEmb?.value) {
      const embOpt = selEmb.selectedOptions[0];
      pdvEmbarquementId    = selEmb.value;
      pdvEmbarquementNom   = embOpt?.dataset.nom   || '';
      pdvEmbarquementVille = embOpt?.dataset.ville || '';
    }

    if (selDeb?.value) {
      const debOpt = selDeb.selectedOptions[0];
      pdvDebarquementId    = selDeb.value;
      pdvDebarquementNom   = debOpt?.dataset.nom   || '';
      pdvDebarquementVille = debOpt?.dataset.ville || '';
    }
  }
  const passagers = [];
  let totalGeneral = 0;

  blocks.forEach(block => {
    const type    = block.querySelector('.p-type')?.value || 'adulte';
    const bagages = parseFloat(block.querySelector('.p-bagages')?.value || 0);

    const prixBase = isArrets
      ? (t._segmentPrixParType?.[type] || 0)
      : (t.prixParType?.[type] || 0);

    const excesBag  = bagages > (t.limiteBagages || 0) ? Math.max(0, bagages - (t.limiteBagages || 0)) : 0;
    const prixBag   = excesBag * (t.fraisExcesBagages || 0);
    const sousTotal = prixBase + prixBag;
    totalGeneral   += sousTotal;

    passagers.push({
      prenom:    block.querySelector('.p-prenom')?.value.trim(),
      nom:       block.querySelector('.p-nom')?.value.trim(),
      telephone: block.querySelector('.p-tel')?.value.trim() || null,
      type,
      typeNom:      nomType(type),
      typeAgeLabel: ageRangeLabel(type),
      bagages,
      siege:     block.querySelector('.p-siege')?.value.trim() || null,
      prixBillet: prixBase,
      prixBagages: prixBag,
      sousTotal,
    });
  });

  // Passager principal (rétrocompatibilité)
  const p0 = passagers[0];

  const payload = {
    agenceId:          pdvData.agenceId,
    pdvId:             pdvData.id,
    trajetId:          t.id,
    typeTrajet:        t.typeTrajet || 'direct',
    routeLabel:        `${t.villeDepart} → ${t.villeArrivee}`,
    heureDepart:       sessionHeure,
    busNom:            sessionBusNom,
    sessionId,
    dateDepart:        date,
    arretMontee:       isArrets ? (t._arretMontee   || null) : null,
    arretDescente:     isArrets ? (t._arretDescente || null) : null,
    // Passager principal (champ legacy)
    prenomPassager:    p0.prenom,
    nomPassager:       p0.nom,
    telephonePassager: p0.telephone,
    typeBillet:        p0.type,
    typeBilletNom:     p0.typeNom,
    bagages:           p0.bagages,
    siege:             p0.siege,
    prixBillet:        p0.prixBillet,
    prixBagages:       p0.prixBagages,
    // Multi-passagers
    passagers,
    nbPassagers:       passagers.length,
    prixTotal:         totalGeneral,
    remarques,
    pdvEmbarquementId,
    pdvEmbarquementNom,
    pdvEmbarquementVille,
    pdvDebarquementId,
    pdvDebarquementNom,
    pdvDebarquementVille,
    createdAt:         new Date().toISOString(),
  };

  const btn = document.getElementById('venteBtnConfirm');

  if (btn) {
    btn.disabled  = true;
    btn.innerHTML = '<span class="btn-spinner"></span> Enregistrement...';
  }

  try {
    const res  = await apiFetch(`${BACKEND}/reservations/create`, {
      method:  'POST',
      body:    JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) { showToast(data.message || 'Erreur lors de la vente.', ICONS.banned); return; }

    // Mettre à jour le compteur vendus local
    if (pdvData) pdvData.vendus = (pdvData.vendus || 0) + 1;

    // Ajouter à la liste locale
    const newResa = { ...payload, id: data.id || data.reservationId };
    resaList.push(newResa);
    statsPdvCache = null; // invalider les stats — une vente vient d'avoir lieu

    // Rafraîchir les UI
    updateAccueilStats();
    renderAccueilVentes();
    renderTrajetsPDV();
    updateBadges();

    // Réinitialiser le formulaire
    resetVenteForm();

    // Afficher le ticket adapté au mode d'impression de l'agence
    const modeBillet = agenceData?.billetConfig?.mode;
    if (!modeBillet || modeBillet === 'manuel') {
      showManualTicket(newResa, t);
    } else {
      showTicket(newResa, t);
    }

  } catch (err) {
    console.error('Erreur vente :', err);
    showToast('Impossible de contacter le serveur.', ICONS.banned);
  } finally {
    if (btn) {
      btn.disabled  = false;
      btn.innerHTML = `${ICONS.check} Confirmer la vente`;
    }
  }
}

function resetVenteForm() {
  // Supprimer les passagers supplémentaires et vider le passager 1
  const list = document.getElementById('passagersList');
  if (list) {
    list.querySelectorAll('.passager-block').forEach((b, i) => { if (i > 0) b.remove(); });
    list.querySelectorAll('.vente-input').forEach(el => el.value = '');
    list.querySelectorAll('.p-type').forEach(el => el.value = 'adulte');
  }

  const remarques = document.getElementById('vente-remarques');
  if (remarques) remarques.value = '';

  const step1 = document.getElementById('venteStep1');
  if (step1) step1.style.display = 'block';

  const step2 = document.getElementById('venteStep2');
  if (step2) {
    step2.classList.remove('slide-in');
    step2.classList.add('locked');
    step2.style.display = 'none';
  }

  // Réinitialiser les champs arrêts
  const inputVilleMontee = document.getElementById('vente-montee-ville');
  if (inputVilleMontee) inputVilleMontee.value = '';

  const selMontee = document.getElementById('vente-montee');
  if (selMontee) { selMontee.innerHTML = ''; selMontee.disabled = false; }

  const selDescente = document.getElementById('vente-descente');
  if (selDescente) selDescente.innerHTML = '<option value="">— Ville de descente</option>';

  const selDebArrets = document.getElementById('vente-pdv-debarquement-arrets');
  if (selDebArrets) selDebArrets.innerHTML = '<option value="">— Sélectionner —</option>';

  const segmentPrixTypesEl = document.getElementById('segmentPrixTypes');
  if (segmentPrixTypesEl) segmentPrixTypesEl.style.display = 'none';

  setTrajetType('direct');
  selectedTrajetForVente = null;
  updatePrixPreview();
}

// ════════════════════════════════
//  TICKET MODAL
// ════════════════════════════════

function buildDataPourReservationPDV(r, trajet) {
  const nomComplet = `${r.prenomPassager || ''} ${r.nomPassager || ''}`.trim() || 'Passager';
  const nbVoyageurs = r.nbPassagers || (Array.isArray(r.passagers) ? r.passagers.length : 1) || 1;

  let siege = r.siege || null;
  if (Array.isArray(r.passagers) && r.passagers.length > 0) {
    const sieges = r.passagers.map(p => p.siege).filter(Boolean);
    if (sieges.length > 0) siege = sieges.join(', ');
  }

  const dateLabel = r.dateDepart
    ? new Date(r.dateDepart + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return {
    nomAgence:    agenceData?.nom   || 'Votre agence',
    villeAgence:  agenceData?.ville || '',
    logoUrl:      agenceData?.logo || agenceData?.logoUrl || null,
    slogan:       agenceData?.slogan || '',
    villeDepart:  r.arretMontee   || trajet?.villeDepart  || '—',
    villeArrivee: r.arretDescente || trajet?.villeArrivee || '—',
    dateLabel,
    heureDepart:  r.heureDepart || '—',
    busNom:       r.busNom || '—',
    siege,
    prix:         `${Number(r.prixTotal || 0).toLocaleString()} XAF`,
    agentNom:     pdvData?.responsable || '—',
    passagerNom:  nomComplet,
    nbVoyageurs,
    pdvEmbarquementNom:   r.pdvEmbarquementNom   || pdvData?.nom   || null,
    pdvEmbarquementVille: r.pdvEmbarquementVille || pdvData?.ville || null,
    pdvDebarquementNom:   r.pdvDebarquementNom   || null,
    pdvDebarquementVille: r.pdvDebarquementVille || null,
    codeControle: r.codeControle || null,
    politiqueAnnulation: agenceData?.politiqueAnnulation || null,
    delaiFormalite: agenceData?.delaiFormalite || null,
  };
}

function imprimerBilletPDV(resaId) {
  const r = resaList.find(r => r.id === resaId);
  if (!r) { showToast('Réservation introuvable.', ICONS.banned); return; }

  const config = agenceData?.billetConfig;
  if (!config || !config.mode) {
    showToast('Configuration de billet non définie par votre agence.', ICONS.warning);
    return;
  }
  if (config.mode === 'manuel') {
    showManualTicket(r, trajetList.find(t => t.id === r.trajetId));
    return;
  }

  const trajet = trajetList.find(t => t.id === r.trajetId);
  const format = formatFromMode(config.mode);
  const design = config.design || 'sobre';

  const ticketHTML = buildTicketHTML(format, design, buildDataPourReservationPDV(r, trajet));

  const printWindow = window.open('', '_blank', 'width=480,height=720');
  if (!printWindow) {
    showToast("Le navigateur a bloqué l'ouverture de la fenêtre d'impression.", ICONS.warning);
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Billet — Travio</title>
        ${TICKET_CSS}
        <style>
          body { margin:0; padding:24px; background:#F7F5F0; display:flex; flex-direction:column; align-items:center; gap:24px; }
          .no-print-bar {
            position: sticky; top: 0; width: 100%; max-width:320px;
            background: #0B1220; border-radius: 12px; padding: 10px 14px;
            display: flex; align-items: center; justify-content: center; gap: 8px; z-index: 10;
          }
          .no-print-bar button {
            background: #00E5A0; color: #0A0E1A; border: none; border-radius: 8px;
            padding: 8px 16px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: system-ui, sans-serif;
          }
          @media print { body { padding:0; background:#fff; } .no-print-bar { display: none !important; } }
        </style>
      </head>
      <body>
        <div class="no-print-bar"><button onclick="window.print()">${ICONS.print} Imprimer</button></div>
        ${ticketHTML}
        <script>window.onload = function () { window.print(); };</script>
      </body>
    </html>
  `);
}
window.imprimerBilletPDV = imprimerBilletPDV;

function showTicket(resa, trajet) {
  const body = document.getElementById('ticketBody');
  if (!body) return;

  window._lastTicketResaId    = resa.id;
  window._lastTicketTrajetRef = trajet;

  const dateStr = resa.dateDepart
    ? new Date(resa.dateDepart + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
    : '—';

  // afficher le segment si trajet avec arrêts
  const routeAffichee = (resa.arretMontee && resa.arretDescente)
    ? `${resa.arretMontee} → ${resa.arretDescente}`
    : `${trajet.villeDepart} → ${trajet.villeArrivee}`;

  // résumé multi-passagers
  const nbPass = resa.passagers?.length || 1;
  const passagersLabel = nbPass > 1
    ? resa.passagers.map(p => `${p.prenom} ${p.nom}`).join(', ')
    : `${resa.prenomPassager} ${resa.nomPassager}`;

  body.innerHTML = `
    <div class="ticket-row">
      <span>Passager${nbPass > 1 ? 's' : ''}</span>
      <strong style="text-align:right;max-width:60%;">${passagersLabel}</strong>
    </div>
    <div class="ticket-row">
      <span>Téléphone</span>
      <strong>${resa.telephonePassager || '—'}</strong>
    </div>
    <div class="ticket-row">
      <span>Trajet</span>
      <strong>${routeAffichee}</strong>
    </div>
    ${nbPass > 1 ? `
    <div class="ticket-row">
      <span>Nb. passagers</span>
      <strong>${nbPass} personnes</strong>
    </div>` : `
    <div class="ticket-row">
      <span>Type</span>
      <strong>${nomTypeResa(resa)}</strong>
    </div>`}
    <div class="ticket-row">
      <span>Date</span>
      <strong>${dateStr}</strong>
    </div>
    <div class="ticket-row">
      <span>Départ</span>
      <strong>${resa.heureDepart || '—'}</strong>
    </div>
    ${resa.siege ? `<div class="ticket-row"><span>Siège</span><strong>${resa.siege}</strong></div>` : ''}
    <div class="ticket-row">
      <span>Total encaissé</span>
      <strong class="accent">${Number(resa.prixTotal).toLocaleString()} XAF</strong>
    </div>

    <div class="ticket-row">
      <span>Embarquement</span>
      <strong>${resa.pdvEmbarquementNom || pdvData?.nom || '—'} · ${resa.pdvEmbarquementVille || pdvData?.ville || '—'}</strong>
    </div>

    <div class="ticket-row">
      <span>Débarquement</span>
      <strong>${resa.pdvDebarquementNom || '—'}${resa.pdvDebarquementVille ? ' · ' + resa.pdvDebarquementVille : ''}</strong>
    </div>

    ${agenceData?.delaiFormalite ? `
    <div class="ticket-row">
      <span>Présentation</span>
      <strong>${formatDelaiFormalite(agenceData.delaiFormalite)}</strong>
    </div>` : ''}

    ${resa.remarques ? `
    <div class="ticket-row">
      <span>Remarques</span>
      <strong style="text-align:right;max-width:60%;">${resa.remarques}</strong>
    </div>` : ''}
  `;

  const overlay = document.getElementById('ticketOverlay');
  if (overlay) {
    overlay.classList.add('show');
    overlay.style.pointerEvents = 'all';
  }
}

function closeTicket() {
  const overlay = document.getElementById('ticketOverlay');
  if (overlay) {
    overlay.classList.remove('show');
    overlay.style.pointerEvents = 'none';
  }
}

// ════════════════════════════════
//  TICKET MANUEL (pas d'impression configurée)
// ════════════════════════════════
function showManualTicket(resa, trajet) {
  window._lastTicketResaId = resa.id;

  const dateStr = resa.dateDepart
    ? new Date(resa.dateDepart + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
    : '—';

  const routeAffichee = (resa.arretMontee && resa.arretDescente)
    ? `${resa.arretMontee} → ${resa.arretDescente}`
    : `${trajet?.villeDepart || '—'} → ${trajet?.villeArrivee || '—'}`;

  const nbPass = resa.passagers?.length || resa.nbPassagers || 1;

  let siege = resa.siege || '—';
  if (Array.isArray(resa.passagers) && resa.passagers.length > 0) {
    const sieges = resa.passagers.map(p => p.siege).filter(Boolean);
    if (sieges.length > 0) siege = sieges.join(', ');
  }
  const busSiege = `${resa.busNom || '—'}${siege !== '—' ? ' — ' + siege : ''}`;

  let overlay = document.getElementById('manualTicketOverlay');
  const isNew = !overlay;
  if (isNew) {
    overlay = document.createElement('div');
    overlay.id = 'manualTicketOverlay';
  }
  overlay.className = 'ticket-overlay';
  overlay.innerHTML = `
    <div class="ticket-backdrop" onclick="closeManualTicket()"></div>
    <div class="ticket-modal">
      <div class="ticket-header">
        <div style="width:44px;height:44px;border-radius:50%;background:rgba(255,178,63,0.15);border:1px solid rgba(255,178,63,0.3);display:flex;align-items:center;justify-content:center;margin-bottom:4px;">
          ${ICONS.warning}
        </div>
        <h2>Billet à recopier</h2>
        <p>Aucune impression configurée — reportez ces informations sur le carnet papier, puis apposez le cachet de l'agence.</p>
      </div>
      <div style="padding:16px 24px 4px;">
        <div style="background:linear-gradient(120deg,#14B8A6 0%,#0B7A9E 100%);border-radius:14px;padding:16px 18px;text-align:center;">
          <div style="font-size:10px;color:rgba(255,255,255,0.85);text-transform:uppercase;letter-spacing:0.6px;margin-bottom:6px;">Trajet</div>
          <div style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:#fff;">${routeAffichee}</div>
        </div>
      </div>
      <div class="ticket-body">
        <div class="ticket-row"><span>Agence</span><strong>${agenceData?.nom || '—'}</strong></div>
        <div class="ticket-row"><span>Date</span><strong>${dateStr}</strong></div>
        <div class="ticket-row"><span>Départ</span><strong>${resa.heureDepart || '—'}</strong></div>
        <div class="ticket-row"><span>Bus / Siège</span><strong>${busSiege}</strong></div>
        ${agenceData?.delaiFormalite ? `<div class="ticket-row"><span>Présentation</span><strong>${formatDelaiFormalite(agenceData.delaiFormalite)}</strong></div>` : ''}
        <div class="ticket-row"><span>Passagers</span><strong>${nbPass}</strong></div>
        <div class="ticket-row"><span>Prix</span><strong class="accent">${Number(resa.prixTotal || 0).toLocaleString()} XAF</strong></div>
      </div>
      <div class="ticket-actions">
        <button class="ticket-btn-primary" onclick="copierInfosBilletManuel('${resa.id}')">
          ${ICONS.clipboard} Copier les informations
        </button>
        <button class="ticket-btn-secondary" onclick="closeManualTicket();showPage('vente', document.querySelector('[data-page=vente]'))">Nouvelle vente</button>
        <button class="ticket-btn-secondary" onclick="showPage('reservations', document.querySelector('[data-page=reservations]'));closeManualTicket()">Voir les réservations</button>
      </div>
      <div style="padding:14px 24px 0;font-size:11px;color:var(--muted);text-align:center;line-height:1.5;">
        Le code alphanumérique sera ajouté ici dès que la fonctionnalité sera disponible. Cet écran reste accessible depuis l'historique des réservations.
      </div>
    </div>
  `;

  if (isNew) document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    overlay.classList.add('show');
    overlay.style.pointerEvents = 'all';
  });
}

function closeManualTicket() {
  const overlay = document.getElementById('manualTicketOverlay');
  if (overlay) {
    overlay.classList.remove('show');
    overlay.style.pointerEvents = 'none';
  }
}

function copierInfosBilletManuel(resaId) {
  const r = resaList.find(r => r.id === resaId);
  if (!r) return;
  const trajet = trajetList.find(t => t.id === r.trajetId);
  const routeAffichee = (r.arretMontee && r.arretDescente)
    ? `${r.arretMontee} → ${r.arretDescente}`
    : `${trajet?.villeDepart || '—'} → ${trajet?.villeArrivee || '—'}`;
  const dateStr = r.dateDepart
    ? new Date(r.dateDepart + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
    : '—';
  const texte = [
    `Agence : ${agenceData?.nom || '—'}`,
    `Trajet : ${routeAffichee}`,
    `Date : ${dateStr}`,
    `Départ : ${r.heureDepart || '—'}`,
    `Bus/Siège : ${r.busNom || '—'}${r.siege ? ' — ' + r.siege : ''}`,
    `Passagers : ${r.passagers?.length || r.nbPassagers || 1}`,
    `Prix : ${Number(r.prixTotal || 0).toLocaleString()} XAF`,
  ].join('\n');

  navigator.clipboard?.writeText(texte)
    .then(() => showToast('Informations copiées.', ICONS.check, true))
    .catch(() => showToast('Impossible de copier.', ICONS.warning));
}

// ════════════════════════════════
//  PRÉFILL VENTE DEPUIS TRAJETS
// ════════════════════════════════
function prefillVente(trajetId) {
  showPage('vente', document.querySelector('[data-page=vente]'));
 
  setTimeout(() => {
    const t = trajetList.find(tr => tr.id === trajetId);
    if (!t) return;
 
    // Activer le bon type
    setTrajetType(t.typeTrajet || 'direct');
 
    // Sélectionner le trajet
    const select = document.getElementById('vente-trajet');
    if (select) {
      select.value = trajetId;
      onSelectTrajet();
      document.querySelectorAll('.trajet-card-pick').forEach(c => {
        c.classList.toggle('selected', c.dataset.value === trajetId);
      });
    }
  }, 100);
}

// ════════════════════════════════
//  RÉSERVATIONS — FILTRES
// ════════════════════════════════
// ── Période active ──
let resaPeriode = 'today';
let resaCustomRange = null; // { debut, fin } ou null
let resaSortBy  = 'date_desc';

function setResaSort(value) {
  resaSortBy = value;
  filterReservations();
}
window.setResaSort = setResaSort;

function sortResas(list, mode) {
  const arr = [...list];
  switch (mode) {
    case 'date_asc':
      arr.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
      break;
    case 'prix_desc':
      arr.sort((a, b) => (b.prixTotal || 0) - (a.prixTotal || 0));
      break;
    case 'prix_asc':
      arr.sort((a, b) => (a.prixTotal || 0) - (b.prixTotal || 0));
      break;
    case 'date_desc':
    default:
      arr.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      break;
  }
  return arr;
}

function setResaPeriode(periode, btn) {
  resaPeriode = periode;
  resaCustomRange = null;
  const wrap = document.getElementById('resaCustomPickerWrapPDV');
  if (wrap) wrap.style.display = 'none';
  document.getElementById('resaCustomBtnPDV')?.classList.remove('active');
  document.querySelectorAll('#resaQuickFilters .rqf-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  filterReservations();
}
window.setResaPeriode = setResaPeriode;

function toggleResaCustomPickerPDV() {
  const wrap = document.getElementById('resaCustomPickerWrapPDV');
  if (!wrap) return;
  wrap.style.display = wrap.style.display === 'block' ? 'none' : 'block';
}
window.toggleResaCustomPickerPDV = toggleResaCustomPickerPDV;

function applyResaCustomRangePDV() {
  const debut = document.getElementById('resaCustomDebutPDV')?.value;
  const fin   = document.getElementById('resaCustomFinPDV')?.value;
  if (!debut || !fin) { showToast('Sélectionnez les deux dates.', ICONS.warning); return; }
  if (debut > fin) { showToast('La date de début doit précéder la date de fin.', ICONS.warning); return; }

  resaCustomRange = { debut, fin };
  document.querySelectorAll('#resaQuickFilters .rqf-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('resaCustomBtnPDV')?.classList.add('active');
  document.getElementById('resaCustomPickerWrapPDV').style.display = 'none';
  filterReservations();
}
window.applyResaCustomRangePDV = applyResaCustomRangePDV;

function clearResaCustomRangePDV() {
  resaCustomRange = null;
  document.getElementById('resaCustomPickerWrapPDV').style.display = 'none';
  document.getElementById('resaCustomBtnPDV')?.classList.remove('active');
  resaPeriode = 'today';
  document.querySelectorAll('#resaQuickFilters .rqf-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('#resaQuickFilters .rqf-btn:nth-child(1)')?.classList.add('active');
  filterReservations();
}
window.clearResaCustomRangePDV = clearResaCustomRangePDV;

function getResaBornesEffectivesPDV() {
  if (resaCustomRange) return { debut: resaCustomRange.debut, fin: resaCustomRange.fin };
  const nowBrazza  = Date.now() + OFFSET_MS_FIN;
  const todayDate  = new Date(nowBrazza);
  const today      = todayDate.toISOString().split('T')[0];

  if (resaPeriode === 'today') return { debut: today, fin: today };

  if (resaPeriode === 'week') {
    const jourSemaine = (todayDate.getUTCDay() + 6) % 7; // 0 = lundi
    const lundi = new Date(todayDate.getTime() - jourSemaine * 86400000);
    return { debut: lundi.toISOString().split('T')[0], fin: today };
  }

  if (resaPeriode === 'month') {
    const premierJour = new Date(Date.UTC(todayDate.getUTCFullYear(), todayDate.getUTCMonth(), 1));
    return { debut: premierJour.toISOString().split('T')[0], fin: today };
  }

  return { debut: null, fin: null };
}

function updateResaPeriodeLabelPDV() {
  const el = document.getElementById('resaPeriodeLabelPDV');
  if (!el) return;
  const fmtLong  = (str) => new Date(str + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const fmtShort = (str) => new Date(str + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

  if (resaCustomRange) {
    const d = fmtLong(resaCustomRange.debut);
    const f = fmtLong(resaCustomRange.fin);
    el.innerHTML = resaCustomRange.debut === resaCustomRange.fin ? `${ICONS.calendar} ${d}` : `${ICONS.calendar} Du ${d} au ${f}`;
    return;
  }
  const { debut, fin } = getResaBornesEffectivesPDV();
  if (resaPeriode === 'today') el.innerHTML = `${ICONS.calendar} Aujourd'hui · ${fmtLong(debut)}`;
  else if (resaPeriode === 'week')  el.innerHTML = `${ICONS.calendar} Cette semaine · Du ${fmtShort(debut)} au ${fmtLong(fin)}`;
  else if (resaPeriode === 'month') el.innerHTML = `${ICONS.calendar} Ce mois-ci · Du ${fmtShort(debut)} au ${fmtLong(fin)}`;
  else el.innerHTML = `${ICONS.calendar} Toutes les périodes`;
}

function filterReservations() {
  updateResaPeriodeLabelPDV();
  ['filterTrajet', 'filterBus', 'filterStatut'].forEach(updateFiltreHighlightPDV);
  const search       = (document.getElementById('filterSearch')?.value || '').toLowerCase().trim();
  const trajetFilter = document.getElementById('filterTrajet')?.value;
  const busFilter    = document.getElementById('filterBus')?.value;
  const statutFilter = document.getElementById('filterStatut')?.value;

  const { debut, fin } = getResaBornesEffectivesPDV();

  let filtered = resaList.filter(r => {
      const d = toBrazzaDate(r.createdAt);

      if (debut && d < debut) return false;
      if (fin   && d > fin)   return false;

    if (trajetFilter && r.trajetId !== trajetFilter) return false;
    if (busFilter    && r.busNom   !== busFilter)    return false;
    if (statutFilter === 'retrait'    && !r.passagerRetire) return false;
    if (statutFilter === 'reaffectee' && !r.reaffectee)     return false;
    if (statutFilter && statutFilter !== 'retrait' && statutFilter !== 'reaffectee' && r.statut !== statutFilter) return false;

    if (search) {
      const hay = `${r.prenomPassager || ''} ${r.nomPassager || ''} ${r.telephonePassager || ''}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });

  // ── Tri ──
  filtered = sortResas(filtered, resaSortBy);

  // Compteur
  const countEl = document.getElementById('resaCountNum');
  if (countEl) countEl.textContent = filtered.length;

  // Le regroupement par mois/semaine ne s'applique que pour un tri par date
  const isDateSort = resaSortBy === 'date_desc' || resaSortBy === 'date_asc';
  let groupMode = null;
  if (isDateSort) {
    if (resaCustomRange) {
      const jours = Math.round((new Date(resaCustomRange.fin) - new Date(resaCustomRange.debut)) / 86400000) + 1;
      groupMode = jours <= 31 ? 'jour' : (jours <= 120 ? 'semaine' : 'mois');
    } else {
      groupMode = resaPeriode === 'all' ? 'mois' : (resaPeriode === 'month' ? 'semaine' : 'jour');
    }
  }

  // NOUVEAU — mini stats sur la sélection filtrée
  const confirmeesF     = filtered.filter(r => r.statut !== 'annulée');
  const annuleesF       = filtered.filter(r => r.statut === 'annulée');
  const billetsAnnulesF = annuleesF.reduce((s, r) => s + (r.nbPassagers || 1), 0);
  const billetsF        = confirmeesF.reduce((s, r) => s + (r.nbPassagers || 1), 0) + billetsAnnulesF;
  const encaisseF       = confirmeesF.reduce((s, r) => s + (r.prixTotal || 0), 0);

  const reaffecteesF = filtered.filter(r => r.reaffectee === true).length;

  const setElHtmlMini = (id, v) => { const el = document.getElementById(id); if (el) el.innerHTML = v; };
  const setMini = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  const filtreEstAnnuleePDV = statutFilter === 'annulée';

  setMini('resaMiniBillets',  billetsF.toLocaleString());
  setElHtmlMini('resaMiniBilletsInfo', (billetsAnnulesF > 0 && !filtreEstAnnuleePDV)
    ? `<span style="color:#FF4D6A;font-weight:600;">dont ${billetsAnnulesF} annulé${billetsAnnulesF > 1 ? 's' : ''}</span>`
    : '');
  setMini('resaMiniEncaisse', encaisseF.toLocaleString() + ' XAF');
  setMini('resaMiniResa', filtered.length.toLocaleString());
  setElHtmlMini('resaMiniResaInfo', (annuleesF.length > 0 && !filtreEstAnnuleePDV)
    ? `<span style="color:#FF4D6A;font-weight:600;">dont ${annuleesF.length} annulée${annuleesF.length > 1 ? 's' : ''}</span>`
    : '');
  setMini('resaMiniReaffectees', reaffecteesF.toLocaleString());

  renderResaList(filtered, groupMode);
}

function getDateRefResa(r) {
  return r.createdAt ? toBrazzaDate(r.createdAt) : (r.dateDepart || '');
}

function getMoisLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const moisNoms = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  return `${moisNoms[d.getMonth()]} ${d.getFullYear()}`;
}

function getSemaineLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const lundi = new Date(d);
  const jourSemaine = (d.getDay() + 6) % 7; // 0 = lundi
  lundi.setDate(d.getDate() - jourSemaine);
  const dimanche = new Date(lundi);
  dimanche.setDate(lundi.getDate() + 6);

  const moisNoms = ['jan.','fév.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
  const sameMonth = lundi.getMonth() === dimanche.getMonth();

  const debut = `${lundi.getDate()}`;
  const fin   = sameMonth
    ? `${dimanche.getDate()} ${moisNoms[dimanche.getMonth()]}`
    : `${dimanche.getDate()} ${moisNoms[dimanche.getMonth()]}`;

  return sameMonth
    ? `Semaine du ${debut} au ${fin} ${dimanche.getFullYear()}`
    : `Semaine du ${debut} ${moisNoms[lundi.getMonth()]} au ${fin} ${dimanche.getFullYear()}`;
}

function getGroupKeyAndLabel(r, mode) {
  const dateRef = getDateRefResa(r);
  if (!dateRef) return { key: 'inconnu', label: 'Date inconnue' };

  if (mode === 'jour') {
    const key = dateRef;
    const d = new Date(dateRef + 'T00:00:00');
    let label = d.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' });
    label = label.charAt(0).toUpperCase() + label.slice(1);
    return { key, label };
  }
  if (mode === 'mois') {
    const key = dateRef.slice(0, 7); // "2026-06"
    return { key, label: getMoisLabel(dateRef) };
  }
  if (mode === 'semaine') {
    const d = new Date(dateRef + 'T00:00:00');
    const jourSemaine = (d.getDay() + 6) % 7;
    const lundi = new Date(d);
    lundi.setDate(d.getDate() - jourSemaine);
    const key = lundi.toISOString().split('T')[0];
    return { key, label: getSemaineLabel(dateRef) };
  }
  return { key: 'all', label: '' };
}

function renderResaList(list, groupMode = null) {
  const container = document.getElementById('resaListPanel');
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-state large">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><rect x="6" y="10" width="36" height="32" rx="5" stroke="currentColor" stroke-width="2"/><path d="M14 6v10M34 6v10M6 20h36" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M15 30h7M15 35h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        <p>Aucune réservation trouvée</p>
        <small>Les billets vendus apparaîtront ici</small>
      </div>`;
    return;
  }

  const renderCard = (r) => {
    const trajet   = trajetList.find(t => t.id === r.trajetId);
    const routeStr = trajet
      ? `${trajet.villeDepart} → ${trajet.villeArrivee}`
      : (r.routeLabel || '—');

    const nbPass   = r.passagers?.length || 1;
    const isMulti  = nbPass > 1;
    const isAnnulee = r.statut === 'annulée';   // ← ajout
    const initiale = isMulti
      ? nbPass.toString()
      : (r.prenomPassager?.[0]?.toUpperCase() || '?');

    const nomAffiche = isMulti
      ? `${r.prenomPassager} + ${nbPass - 1}`
      : `${r.prenomPassager || '—'} ${r.nomPassager || ''}`;

    const routeComplete = (r.arretMontee && r.arretDescente)
      ? `${r.arretMontee} → ${r.arretDescente}`
      : routeStr;

    const dateObj  = r.dateDepart ? new Date(r.dateDepart + 'T00:00:00') : null;
    const today    = new Date().toISOString().split('T')[0];
    const hier     = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    let dateLabel  = '—';
    if (dateObj) {
      if (r.dateDepart === today) dateLabel = "Aujourd'hui";
      else if (r.dateDepart === hier) dateLabel = 'Hier';
      else dateLabel = dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    }

    const extras = [];
    if (r.bagages > 0) extras.push(`${ICONS.bag} ${r.bagages} kg`);
    if (r.siege)       extras.push(`${ICONS.seat} ${r.siege}`);

    return `
      <div class="resa-card" onclick="openResaDetail('${r.id}')" style="${isAnnulee ? 'opacity:0.6;' : ''}">
        <div class="resa-card-avatar ${isMulti ? 'multi' : ''}">${initiale}</div>
        <div class="resa-card-info">
          <div class="resa-card-name">${nomAffiche}</div>
          <div class="resa-card-route">${routeComplete}</div>
          <div class="resa-card-meta">
            ${isMulti
              ? `<span class="resa-meta-badge multi">${nbPass} passagers</span>`
              : `<span class="resa-meta-badge">${nomTypeResa(r)}</span>`
            }
            <span class="resa-meta-badge ${isAnnulee ? '' : 'ok'}" style="${isAnnulee ? 'background:rgba(255,77,106,0.12);color:#FF4D6A;' : ''}">
              ${isAnnulee ? ICONS.dotRed + ' Annulée' : ICONS.check + ' Confirmé'}
            </span>
            ${r.passagerRetire ? `<span class="resa-meta-badge" style="background:rgba(255,178,63,0.12);color:#FFB23F;">${ICONS.person} Retrait</span>` : ''}
            ${r.reaffectee ? `<span class="resa-meta-badge" style="background:rgba(77,159,255,0.12);color:#4D9FFF;">${ICONS.refresh} Réaffecté</span>` : ''}
            ${extras.length > 0 ? `<span class="resa-meta-sep"></span>` : ''}
            ${extras.map(e => `<span class="resa-meta-extra">${e}</span>`).join('')}
          </div>
        </div>
        <div class="resa-card-right">
          <div class="resa-card-prix">${Number(r.prixTotal || 0).toLocaleString()} XAF</div>
          <div class="resa-card-heure">${ICONS.clock} ${r.heureDepart || '—'}</div>
          <div class="resa-card-date">${dateLabel}</div>
        </div>
      </div>`;
  };

  // ── Pas de regroupement : rendu simple (comportement actuel) ──
  if (!groupMode) {
    container.innerHTML = list.map(renderCard).join('');
    return;
  }

  // ── Regroupement par mois ou semaine ──
  const groups = {};
  list.forEach(r => {
    const { key, label } = getGroupKeyAndLabel(r, groupMode);
    if (!groups[key]) groups[key] = { label, items: [] };
    groups[key].items.push(r);
  });

  const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a)); // plus récent en premier

  container.innerHTML = sortedKeys.map(key => {
    const group = groups[key];
    return `
      <div class="resa-group-header">
        <span class="resa-group-label">${group.label}</span>
        <span class="resa-group-line"></span>
        <span class="resa-group-count">${group.items.length} résa</span>
      </div>
      ${group.items.map(renderCard).join('')}
    `;
  }).join('');
}

function peutModifierResaPDV(r) {
  if (r.statut === 'annulée') return false;
  if (r.dateDepart) {
    const OFFSET_MS = 1 * 60 * 60 * 1000;
    const departInstant = new Date(`${r.dateDepart}T${r.heureDepart || '23:59'}:00Z`).getTime() - OFFSET_MS;
    if (departInstant < Date.now()) return false;
  }
  return true;
}

// ════════════════════════════════
//  RÉSA DÉTAIL (simple overlay)
// ════════════════════════════════
function toggleBilletViewPDV(resaId, mode) {
  const codeBtn  = document.getElementById(`billetToggleCode-${resaId}`);
  const qrBtn    = document.getElementById(`billetToggleQr-${resaId}`);
  const codeView = document.getElementById(`billetViewCode-${resaId}`);
  const qrView   = document.getElementById(`billetViewQr-${resaId}`);
  if (!codeBtn || !qrBtn || !codeView || !qrView) return;
  codeBtn.classList.toggle('active', mode === 'code');
  qrBtn.classList.toggle('active', mode === 'qr');
  codeView.style.display = mode === 'code' ? 'block' : 'none';
  qrView.style.display   = mode === 'qr'   ? 'block' : 'none';
}
window.toggleBilletViewPDV = toggleBilletViewPDV;

function openResaDetail(resaId) {
  const resa = resaList.find(r => r.id === resaId);
  if (!resa) return;

  const trajet = trajetList.find(t => t.id === resa.trajetId);
  const dateStr = resa.dateDepart
    ? new Date(resa.dateDepart).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
    : '—';

  const routeBase = trajet ? `${trajet.villeDepart} → ${trajet.villeArrivee}` : (resa.routeLabel || '—');
  const routeAffichee = (resa.arretMontee && resa.arretDescente)
    ? `${resa.arretMontee} → ${resa.arretDescente}`
    : routeBase;

  const nbPass  = resa.passagers?.length || 1;
  const isMulti = nbPass > 1;
  const peutModifier = peutModifierResaPDV(resa);

  const passagersHtml = isMulti ? resa.passagers.map((p, i) => `
    <div class="recap-passager-card">
      <div class="recap-passager-title">Passager ${i + 1}</div>
      <div class="recap-row"><span>Nom complet</span><strong>${p.prenom || '—'} ${p.nom || ''}</strong></div>
      ${p.telephone ? `<div class="recap-row"><span>Téléphone</span><strong>${p.telephone}</strong></div>` : ''}
      <div class="recap-row"><span>Type</span><strong>${nomTypePassager(p)}</strong></div>
      ${p.siege ? `<div class="recap-row"><span>Siège</span><strong>${p.siege}</strong></div>` : ''}
      ${p.bagages > 0 ? `<div class="recap-row"><span>Bagages</span><strong>${p.bagages} kg${p.prixBagages > 0 ? ` (+${Number(p.prixBagages).toLocaleString()} XAF)` : ''}</strong></div>` : ''}
      <div class="recap-row"><span>Sous-total</span><strong style="color:var(--accent)">${Number(p.sousTotal || 0).toLocaleString()} XAF</strong></div>
    </div>`).join('') : '';

  const overlay = document.createElement('div');
  overlay.id = 'resaDetailOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:7000;display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:opacity .3s ease;pointer-events:none;';
  overlay.innerHTML = `
    <div onclick="closeResaDetail()" style="position:absolute;inset:0;background:rgba(10,14,26,0.85);backdrop-filter:blur(6px);"></div>
    <div style="position:relative;z-index:1;background:#0F1525;border:1px solid rgba(255,255,255,0.12);border-radius:24px 24px 0 0;width:100%;max-width:480px;max-height:88vh;overflow-y:auto;padding:24px 24px 36px;box-shadow:0 -24px 80px rgba(0,0,0,0.5);transform:translateY(40px);transition:transform .35s cubic-bezier(0.34,1.1,.64,1);" id="resaDetailPanel">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px;">
        <div>
          <div style="font-family:'Syne',sans-serif;font-size:17px;font-weight:800;color:var(--white);">
            ${isMulti ? `${resa.prenomPassager} + ${nbPass - 1} passager${nbPass > 2 ? 's' : ''}` : `${resa.prenomPassager} ${resa.nomPassager || ''}`}
          </div>
          <div style="font-size:12px;color:var(--muted);margin-top:3px;">${routeAffichee}</div>
        </div>
        <button onclick="closeResaDetail()" style="background:var(--surface);border:1px solid var(--border);border-radius:8px;color:var(--muted);width:30px;height:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:13px;flex-shrink:0;">${ICONS.close}</button>
      </div>

      <div class="recap-section-title">Trajet</div>
      <div class="recap-card" style="margin-bottom:14px;">
        <div class="recap-row"><span>Ligne</span><strong>${routeAffichee}</strong></div>
        <div class="recap-row"><span>Date</span><strong>${dateStr}</strong></div>
        <div class="recap-row"><span>Départ</span><strong>${resa.heureDepart || '—'}</strong></div>
        <div class="recap-row"><span>Bus</span><strong>${resa.busNom || '—'}</strong></div>
        <div class="recap-row"><span>Vendu le</span><strong>${resa.createdAt ? new Date(resa.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Africa/Brazzaville' }) + ' à ' + new Date(resa.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Brazzaville' }) : '—'}</strong></div>
        <div class="recap-row"><span>Embarquement</span><strong>${resa.pdvEmbarquementNom || '—'}${resa.pdvEmbarquementVille ? ' — ' + resa.pdvEmbarquementVille : ''}</strong></div>
        <div class="recap-row"><span>Débarquement</span><strong>${resa.pdvDebarquementNom || '—'}${resa.pdvDebarquementVille ? ' — ' + resa.pdvDebarquementVille : ''}</strong></div>
        <div class="recap-row"><span>Ville de montée</span><strong>${resa.arretMontee || trajet?.villeDepart || '—'}</strong></div>
        <div class="recap-row"><span>Ville de descente</span><strong>${resa.arretDescente || trajet?.villeArrivee || '—'}</strong></div>
        ${isMulti ? `<div class="recap-row"><span>Passagers</span><strong>${nbPass} personnes</strong></div>` : ''}
      </div>

      <div class="recap-section-title">Passager${isMulti ? 's' : ''}</div>
      ${isMulti ? passagersHtml : `
      <div class="recap-card" style="margin-bottom:14px;">
        <div class="recap-row"><span>Nom complet</span><strong>${resa.prenomPassager || '—'} ${resa.nomPassager || ''}</strong></div>
        <div class="recap-row"><span>Téléphone</span><strong>${resa.telephonePassager || '—'}</strong></div>
        <div class="recap-row"><span>Type</span><strong>${nomTypeResa(resa)}</strong></div>
        ${resa.siege ? `<div class="recap-row"><span>Siège</span><strong>${resa.siege}</strong></div>` : ''}
        ${resa.bagages > 0 ? `<div class="recap-row"><span>Bagages</span><strong>${resa.bagages} kg${resa.prixBagages > 0 ? ` (+${Number(resa.prixBagages).toLocaleString()} XAF)` : ''}</strong></div>` : ''}
      </div>`}

      ${resa.remarques ? `
      <div class="recap-section-title">Remarques</div>
      <div class="recap-card" style="margin-bottom:14px;"><div class="recap-row" style="display:block;"><span>${resa.remarques}</span></div></div>` : ''}

      <div class="recap-total-row">
        <span>Total encaissé</span>
        <strong>${Number(resa.prixTotal || 0).toLocaleString()} XAF</strong>
      </div>

      <div class="recap-section-title" style="margin-top:14px;">Billet de contrôle</div>
      <div class="recap-card" style="padding:14px 16px;">
        <div style="display:flex;gap:6px;margin-bottom:12px;">
          <button class="rqf-btn active" id="billetToggleCode-${resa.id}" onclick="toggleBilletViewPDV('${resa.id}','code')">Code</button>
          <button class="rqf-btn" id="billetToggleQr-${resa.id}" onclick="toggleBilletViewPDV('${resa.id}','qr')">QR Code</button>
        </div>
        <div id="billetViewCode-${resa.id}" style="text-align:center;padding:18px 0;">
          <div style="font-family:'Syne',sans-serif;font-size:26px;font-weight:800;letter-spacing:5px;color:var(--white);background:var(--surface2);border:1.5px dashed var(--border2);border-radius:12px;padding:14px;">
            ${resa.codeControle || '------'}
          </div>
          <div style="font-size:11px;color:var(--muted);margin-top:8px;">Code de vérification à 6 caractères</div>
        </div>
        <div id="billetViewQr-${resa.id}" style="display:none;text-align:center;padding:18px 0;">
          <div style="width:130px;height:130px;margin:0 auto;background:var(--surface2);border:1.5px dashed var(--border2);border-radius:12px;display:flex;align-items:center;justify-content:center;">
            <svg width="32" height="32" viewBox="0 0 16 16" fill="none" style="opacity:.35;"><rect x="1" y="1" width="5" height="5" stroke="currentColor" stroke-width="1.3"/><rect x="10" y="1" width="5" height="5" stroke="currentColor" stroke-width="1.3"/><rect x="1" y="10" width="5" height="5" stroke="currentColor" stroke-width="1.3"/><path d="M10 10h2v2h-2zM13 10h2v2h-2zM10 13h2v2h-2zM13 13h2v2h-2z" fill="currentColor"/></svg>
          </div>
          <div style="font-size:11px;color:var(--muted);margin-top:8px;">QR code — bientôt disponible</div>
        </div>
        <button onclick="imprimerBilletPDV('${resa.id}')"
          style="width:100%;margin-top:10px;background:var(--accent);color:var(--dark);border:none;border-radius:11px;padding:11px;font-size:13px;font-weight:700;font-family:'DM Sans',sans-serif;cursor:pointer;">
          ${ICONS.print} Imprimer le billet
        </button>
      </div>

      ${resa.passagerRetire ? `
      <div style="background:rgba(255,178,63,0.06);border:1px solid rgba(255,178,63,0.2);border-radius:12px;padding:14px 16px;margin-top:14px;">
        <div style="font-size:12px;font-weight:700;color:#FFB23F;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:6px;">${ICONS.person} Retrait de passager</div>
        ${(resa.historiqueRetraits || []).map(h => `
          <p style="font-size:12.5px;color:var(--white);line-height:1.5;margin-top:4px;">
            <strong>${h.nom}</strong> retiré le ${new Date(h.retireAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Africa/Brazzaville' })}
            — ${Number(h.montantRembourse).toLocaleString()} XAF remboursés
          </p>
        `).join('')}
      </div>` : ''}

      ${resa.reaffectee ? `
      <div style="background:rgba(77,159,255,0.06);border:1px solid rgba(77,159,255,0.2);border-radius:12px;padding:14px 16px;margin-top:14px;">
        <div style="font-size:12px;font-weight:700;color:#4D9FFF;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:6px;">${ICONS.refresh} Réservation réaffectée</div>
        <p style="font-size:12.5px;color:var(--white);line-height:1.5;">
          Déplacée de <strong>${resa.ancienBusNom || '—'}</strong> vers <strong>${resa.nouveauBusNom || '—'}</strong>
          le ${resa.dateReaffectation ? new Date(resa.dateReaffectation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Africa/Brazzaville' }) : '—'}.
        </p>
      </div>` : ''}

      ${resa.statut !== 'annulée' ? `
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:14px;">
        <button ${peutModifier ? `onclick="handleModifierResa('${resa.id}')"` : 'disabled title="Voyage déjà passé — modification impossible"'}
          style="width:100%;background:var(--surface);color:var(--white);border:1px solid var(--border);border-radius:12px;padding:13px;font-size:13.5px;font-weight:700;font-family:'DM Sans',sans-serif;cursor:pointer;${peutModifier ? '' : 'opacity:0.4;cursor:not-allowed;'}">
          ${ICONS.edit} Modifier la réservation
        </button>
        <button ${peutModifier ? `onclick="cancelReservation('${resa.id}')"` : 'disabled title="Voyage déjà passé — annulation impossible"'}
          style="width:100%;background:rgba(255,77,106,0.08);color:#FF4D6A;border:1px solid rgba(255,77,106,0.25);border-radius:12px;padding:13px;font-size:13.5px;font-weight:700;font-family:'DM Sans',sans-serif;cursor:pointer;${peutModifier ? '' : 'opacity:0.4;cursor:not-allowed;'}">
          ${ICONS.trash} Annuler la réservation
        </button>
      </div>` : ''}
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'all';
    const panel = document.getElementById('resaDetailPanel');
    if (panel) panel.style.transform = 'translateY(0)';
  });
}

function closeResaDetail() {
  const overlay = document.getElementById('resaDetailOverlay');
  if (overlay) {
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    setTimeout(() => overlay.remove(), 350);
  }
}

function cancelReservation(resaId) {
  const r = resaList.find(r => r.id === resaId);
  if (!r) return;
  if (!peutModifierResaPDV(r)) { showToast('Action impossible — réservation annulée ou voyage déjà passé.', ICONS.banned); return; }

  const nbPass = r.passagers?.length || 1;
  if (nbPass > 1) {
    ouvrirListePassagersAnnulationPDV(resaId);
    return;
  }

  ouvrirAnnulationCompletePDV(resaId);
}

function ouvrirAnnulationCompletePDV(resaId) {
  const r = resaList.find(r => r.id === resaId);
  if (!r) return;

  const politique = agenceData?.politiqueAnnulation;
  const OFFSET_MS = 1 * 60 * 60 * 1000;

  // ── 1. Voyage déjà effectué ? ──
  if (r.dateDepart && r.heureDepart) {
    const departInstant = new Date(`${r.dateDepart}T${r.heureDepart}:00Z`).getTime() - OFFSET_MS;
    if (departInstant < Date.now()) {
      showToast('Ce voyage a déjà eu lieu — annulation impossible.', ICONS.banned);
      return;
    }
  }

  // ── 2. Politique : vente définitive ──
  if (!politique || !politique.autorise) {
    showToast('Vente définitive — annulation impossible.', ICONS.banned);
    return;
  }

  // ── 3. Délai ──
  let horsDelai = false;
  if (politique.delaiHeures && r.dateDepart && r.heureDepart) {
    const departInstant = new Date(`${r.dateDepart}T${r.heureDepart}:00Z`).getTime() - OFFSET_MS;
    const diffHeures    = (departInstant - Date.now()) / (1000 * 60 * 60);
    if (diffHeures < politique.delaiHeures) horsDelai = true;
  }

  // ── 4. Calcul remboursement ──
  const prixTotal = Number(r.prixTotal || 0);
  let fraisPct = 0, frais = prixTotal, rembourse = 0;

  if (politique.remboursement && !horsDelai) {
    fraisPct = politique.precisions || 0;
    frais    = Math.round(prixTotal * fraisPct / 100);
    rembourse = prixTotal - frais;
  }

  // ── 5. Résumé financier ──
  let resumeHTML = '';

  if (!politique.remboursement || horsDelai) {
    const couleur  = horsDelai ? 'rgba(255,178,63,0.08)' : 'rgba(255,77,106,0.08)';
    const border   = horsDelai ? 'rgba(255,178,63,0.2)'  : 'rgba(255,77,106,0.2)';
    const avertissement = horsDelai
      ? `<div style="font-size:11px;color:#FFB23F;font-weight:600;margin-bottom:8px;">${ICONS.warning} Délai dépassé — remboursement non applicable</div>`
      : '';

    resumeHTML = `
      <div style="background:${couleur};border:1px solid ${border};border-radius:12px;padding:14px 16px;margin:16px 0;">
        ${avertissement}
        <div style="font-size:12px;color:var(--muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:.8px;font-weight:600;">Résumé financier</div>
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;">
          <span style="color:var(--muted);">Montant payé</span>
          <span style="color:var(--white);font-weight:600;">${prixTotal.toLocaleString()} XAF</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px;">
          <span style="color:var(--muted);">Remboursement</span>
          <span style="color:#FF4D6A;font-weight:700;">Aucun</span>
        </div>
      </div>`;
  } else {
    resumeHTML = `
      <div style="background:rgba(0,229,160,0.06);border:1px solid rgba(0,229,160,0.2);border-radius:12px;padding:14px 16px;margin:16px 0;">
        <div style="font-size:12px;color:var(--muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:.8px;font-weight:600;">Résumé financier</div>
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;">
          <span style="color:var(--muted);">Montant payé</span>
          <span style="color:var(--white);font-weight:600;">${prixTotal.toLocaleString()} XAF</span>
        </div>
        ${frais > 0 ? `
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;">
          <span style="color:var(--muted);">Frais retenus (${fraisPct}%)</span>
          <span style="color:#FF4D6A;font-weight:600;">− ${frais.toLocaleString()} XAF</span>
        </div>` : ''}
        <div style="border-top:1px solid rgba(255,255,255,0.08);margin-top:8px;padding-top:8px;display:flex;justify-content:space-between;font-size:14px;">
          <span style="color:var(--white);font-weight:600;">À rembourser</span>
          <span style="color:var(--accent);font-weight:800;">${rembourse.toLocaleString()} XAF</span>
        </div>
      </div>`;
  }

  // ── 6. Modal de confirmation ──
  const existing = document.getElementById('pdvAnnulConfirmOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id    = 'pdvAnnulConfirmOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:8000;display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:opacity .3s ease;pointer-events:none;';
  overlay.innerHTML = `
    <div onclick="closePdvAnnulConfirm()" style="position:absolute;inset:0;background:rgba(10,14,26,0.88);backdrop-filter:blur(6px);"></div>
    <div style="position:relative;z-index:1;background:#0F1525;border:1px solid rgba(255,255,255,0.12);border-radius:24px 24px 0 0;width:100%;max-width:480px;max-height:88vh;overflow-y:auto;padding:20px 20px 32px;box-shadow:0 -24px 80px rgba(0,0,0,0.5);transform:translateY(40px);transition:transform .35s cubic-bezier(0.34,1.1,.64,1);" id="pdvAnnulPanel">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px;">
        <div>
          <div style="font-family:'Syne',sans-serif;font-size:16px;font-weight:800;color:var(--white);">Confirmer l'annulation</div>
          <div style="font-size:12px;color:var(--muted);margin-top:3px;">Cette action est irréversible.</div>
        </div>
        <button onclick="closePdvAnnulConfirm()" style="background:var(--surface);border:1px solid var(--border);border-radius:8px;color:var(--muted);width:30px;height:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:13px;flex-shrink:0;">${ICONS.close}</button>
      </div>

      <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:12px 16px;margin-bottom:4px;">
        <div style="font-size:13px;font-weight:600;color:var(--white);">${r.prenomPassager || ''} ${r.nomPassager || ''}</div>
        <div style="font-size:12px;color:var(--muted);margin-top:3px;">${r.routeLabel || '—'} · ${r.dateDepart || '—'} à ${r.heureDepart || '—'}</div>
      </div>

      ${resumeHTML}

      <div style="display:flex;flex-direction:column;gap:8px;margin-top:4px;">
        <button id="pdvAnnulBtnConfirm"
          style="width:100%;background:#FF4D6A;color:white;border:none;border-radius:12px;padding:14px;font-size:14px;font-weight:700;font-family:'DM Sans',sans-serif;cursor:pointer;"
          onclick="confirmerAnnulationPdv('${resaId}')">
          ${ICONS.banned} Confirmer l'annulation
        </button>
        <button onclick="closePdvAnnulConfirm()"
          style="width:100%;background:var(--surface);color:var(--muted);border:1px solid var(--border);border-radius:12px;padding:12px;font-size:13px;font-weight:600;font-family:'DM Sans',sans-serif;cursor:pointer;">
          Retour
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => {
    overlay.style.opacity      = '1';
    overlay.style.pointerEvents = 'all';
    const panel = document.getElementById('pdvAnnulPanel');
    if (panel) panel.style.transform = 'translateY(0)';
  });
}

function closePdvAnnulConfirm() {
  const o = document.getElementById('pdvAnnulConfirmOverlay');
  if (o) {
    o.style.opacity      = '0';
    o.style.pointerEvents = 'none';
    setTimeout(() => o.remove(), 350);
  }
}

// ════════════════════════════════
//  RETRAIT D'UN PASSAGER (PDV)
// ════════════════════════════════
function ouvrirListePassagersAnnulationPDV(resaId) {
  const r = resaList.find(r => r.id === resaId);
  if (!r) return;

  const existing = document.getElementById('pdvListePassagersOverlay');
  if (existing) existing.remove();

  const nbPass = r.passagers?.length || 0;

  const rowsHTML = (r.passagers || []).map((p, i) => `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;background:var(--surface);border:1px solid var(--border);border-radius:11px;padding:12px 14px;margin-bottom:8px;">
      <div>
        <div style="font-size:13px;font-weight:600;color:var(--white);">${p.prenom || ''} ${p.nom || ''}</div>
        <div style="font-size:11.5px;color:var(--muted);margin-top:2px;">
          ${nomType(p.type)}${p.siege ? ' · Siège ' + p.siege : ''} · ${Number(p.sousTotal || 0).toLocaleString()} XAF
        </div>
      </div>
      ${nbPass > 1 ? `
      <button onclick="ouvrirConfirmationRetraitPassagerPDV('${resaId}', ${i})"
        style="background:rgba(255,77,106,0.08);color:#FF4D6A;border:1px solid rgba(255,77,106,0.25);border-radius:9px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;flex-shrink:0;">
        Retirer
      </button>` : ''}
    </div>`).join('');

  const overlay = document.createElement('div');
  overlay.id = 'pdvListePassagersOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:8000;display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:opacity .3s ease;pointer-events:none;';
  overlay.innerHTML = `
    <div onclick="closePdvListePassagers()" style="position:absolute;inset:0;background:rgba(10,14,26,0.88);backdrop-filter:blur(6px);"></div>
    <div style="position:relative;z-index:1;background:#0F1525;border:1px solid rgba(255,255,255,0.12);border-radius:24px 24px 0 0;width:100%;max-width:480px;max-height:88vh;overflow-y:auto;padding:20px 20px 32px;box-shadow:0 -24px 80px rgba(0,0,0,0.5);transform:translateY(40px);transition:transform .35s cubic-bezier(0.34,1.1,.64,1);" id="pdvListePassagersPanel">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px;">
        <div>
          <div style="font-family:'Syne',sans-serif;font-size:16px;font-weight:800;color:var(--white);">Annuler / Retirer un passager</div>
          <div style="font-size:12px;color:var(--muted);margin-top:3px;">${r.routeLabel || '—'} · ${r.dateDepart || '—'} à ${r.heureDepart || '—'}</div>
        </div>
        <button onclick="closePdvListePassagers()" style="background:var(--surface);border:1px solid var(--border);border-radius:8px;color:var(--muted);width:30px;height:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:13px;flex-shrink:0;">${ICONS.close}</button>
      </div>
      <div>${rowsHTML}</div>
      <button onclick="closePdvListePassagers();ouvrirAnnulationCompletePDV('${resaId}')"
        style="width:100%;background:#FF4D6A;color:white;border:none;border-radius:12px;padding:14px;font-size:14px;font-weight:700;font-family:'DM Sans',sans-serif;cursor:pointer;margin-top:8px;">
        ${ICONS.banned} Annuler tout le billet
      </button>
    </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'all';
    const panel = document.getElementById('pdvListePassagersPanel');
    if (panel) panel.style.transform = 'translateY(0)';
  });
}

function closePdvListePassagers() {
  const o = document.getElementById('pdvListePassagersOverlay');
  if (o) { o.style.opacity = '0'; o.style.pointerEvents = 'none'; setTimeout(() => o.remove(), 350); }
}

function ouvrirConfirmationRetraitPassagerPDV(resaId, passagerIndex) {
  const r = resaList.find(r => r.id === resaId);
  if (!r || !r.passagers || !r.passagers[passagerIndex]) return;

  const p = r.passagers[passagerIndex];
  const politique = agenceData?.politiqueAnnulation;
  const OFFSET_MS = 1 * 60 * 60 * 1000;

  let horsDelai = false;
  if (politique?.delaiHeures && r.dateDepart && r.heureDepart) {
    const departInstant = new Date(`${r.dateDepart}T${r.heureDepart}:00Z`).getTime() - OFFSET_MS;
    const diffHeures = (departInstant - Date.now()) / (1000 * 60 * 60);
    if (diffHeures < politique.delaiHeures) horsDelai = true;
  }

  const sousTotal = Number(p.sousTotal || 0);
  let fraisPct = 0, frais = sousTotal, rembourse = 0;
  if (politique?.remboursement && !horsDelai) {
    fraisPct = politique.precisions || 0;
    frais = Math.round(sousTotal * fraisPct / 100);
    rembourse = sousTotal - frais;
  }

  let resumeHTML = '';
  if (!politique?.remboursement || horsDelai) {
    resumeHTML = `
      <div style="background:${horsDelai ? 'rgba(255,178,63,0.08)' : 'rgba(255,77,106,0.08)'};border:1px solid ${horsDelai ? 'rgba(255,178,63,0.2)' : 'rgba(255,77,106,0.2)'};border-radius:12px;padding:14px 16px;margin:14px 0;">
        ${horsDelai ? `<div style="font-size:11px;color:#FFB23F;font-weight:600;margin-bottom:8px;">${ICONS.warning} Délai dépassé — remboursement non applicable</div>` : ''}
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;">
          <span style="color:var(--muted);">Sous-total passager</span>
          <span style="color:var(--white);font-weight:600;">${sousTotal.toLocaleString()} XAF</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px;">
          <span style="color:var(--muted);">Remboursement</span>
          <span style="color:#FF4D6A;font-weight:700;">Aucun</span>
        </div>
      </div>`;
  } else {
    resumeHTML = `
      <div style="background:rgba(0,229,160,0.06);border:1px solid rgba(0,229,160,0.2);border-radius:12px;padding:14px 16px;margin:14px 0;">
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;">
          <span style="color:var(--muted);">Sous-total passager</span>
          <span style="color:var(--white);font-weight:600;">${sousTotal.toLocaleString()} XAF</span>
        </div>
        ${frais > 0 ? `
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;">
          <span style="color:var(--muted);">Frais retenus (${fraisPct}%)</span>
          <span style="color:#FF4D6A;font-weight:600;">− ${frais.toLocaleString()} XAF</span>
        </div>` : ''}
        <div style="border-top:1px solid rgba(255,255,255,0.08);margin-top:8px;padding-top:8px;display:flex;justify-content:space-between;font-size:14px;">
          <span style="color:var(--white);font-weight:600;">À rembourser</span>
          <span style="color:var(--accent);font-weight:800;">${rembourse.toLocaleString()} XAF</span>
        </div>
      </div>`;
  }

  const existing = document.getElementById('pdvRetraitConfirmOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'pdvRetraitConfirmOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:8500;display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:opacity .3s ease;pointer-events:none;';
  overlay.innerHTML = `
    <div onclick="closePdvRetraitConfirm()" style="position:absolute;inset:0;background:rgba(10,14,26,0.9);backdrop-filter:blur(6px);"></div>
    <div style="position:relative;z-index:1;background:#0F1525;border:1px solid rgba(255,255,255,0.12);border-radius:24px 24px 0 0;width:100%;max-width:420px;padding:20px 20px 32px;box-shadow:0 -24px 80px rgba(0,0,0,0.5);transform:translateY(40px);transition:transform .35s cubic-bezier(0.34,1.1,.64,1);" id="pdvRetraitPanel">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px;">
        <div>
          <div style="font-family:'Syne',sans-serif;font-size:16px;font-weight:800;color:var(--white);">Retirer ce passager</div>
          <div style="font-size:12px;color:var(--muted);margin-top:3px;">Cette action est irréversible.</div>
        </div>
        <button onclick="closePdvRetraitConfirm()" style="background:var(--surface);border:1px solid var(--border);border-radius:8px;color:var(--muted);width:30px;height:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:13px;flex-shrink:0;">${ICONS.close}</button>
      </div>
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:12px 16px;">
        <div style="font-size:13px;font-weight:600;color:var(--white);">Vous voulez retirer ${p.prenom || ''} ${p.nom || ''} du trajet ${r.routeLabel || '—'}.</div>
        <div style="font-size:12px;color:var(--muted);margin-top:3px;">Sa place ne sera plus comptée.</div>
      </div>
      ${resumeHTML}
      <div style="display:flex;flex-direction:column;gap:8px;">
        <button onclick="confirmerRetraitPassagerPDV('${resaId}', ${passagerIndex})"
          style="width:100%;background:#FF4D6A;color:white;border:none;border-radius:12px;padding:14px;font-size:14px;font-weight:700;font-family:'DM Sans',sans-serif;cursor:pointer;">
          ${ICONS.banned} Confirmer le retrait
        </button>
        <button onclick="closePdvRetraitConfirm()"
          style="width:100%;background:var(--surface);color:var(--muted);border:1px solid var(--border);border-radius:12px;padding:12px;font-size:13px;font-weight:600;font-family:'DM Sans',sans-serif;cursor:pointer;">
          Retour
        </button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'all';
    const panel = document.getElementById('pdvRetraitPanel');
    if (panel) panel.style.transform = 'translateY(0)';
  });
}

function closePdvRetraitConfirm() {
  const o = document.getElementById('pdvRetraitConfirmOverlay');
  if (o) { o.style.opacity = '0'; o.style.pointerEvents = 'none'; setTimeout(() => o.remove(), 350); }
}

async function confirmerRetraitPassagerPDV(resaId, passagerIndex) {
  const btn = document.querySelector('#pdvRetraitConfirmOverlay button[onclick^="confirmerRetraitPassagerPDV"]');
  if (btn) { btn.disabled = true; btn.textContent = 'Retrait en cours...'; }

  try {
    const res = await apiFetch(`${BACKEND}/reservations/${resaId}/retirer-passager`, {
      method: 'PATCH',
      body: JSON.stringify({ passagerIndex }),
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.message || 'Erreur retrait passager.', ICONS.banned); return; }

    const idx = resaList.findIndex(r => r.id === resaId);
    if (idx !== -1) resaList[idx] = { ...resaList[idx], ...data.reservation };
    statsPdvCache = null; // invalider les stats — un retrait vient d'avoir lieu

    closePdvRetraitConfirm();

    const r = resaList[idx];
    if (r && (r.passagers?.length || 0) >= 1) {
      ouvrirListePassagersAnnulationPDV(resaId);
    } else {
      closePdvListePassagers();
      closeResaDetail();
    }

    filterReservations();
    renderFinancePage();
    updateAccueilStats();
    showToast('Passager retiré avec succès.', ICONS.check, true);

  } catch (err) {
    console.error('Erreur retrait passager :', err);
    showToast('Impossible de contacter le serveur.', ICONS.banned);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = `${ICONS.banned} Confirmer le retrait`; }
  }
}

async function confirmerAnnulationPdv(resaId) {
  const btn = document.getElementById('pdvAnnulBtnConfirm');
  if (btn) { btn.disabled = true; btn.textContent = 'Annulation en cours...'; }

  try {
    const res = await apiFetch(`${BACKEND}/reservations/${resaId}/annuler`, {
      method:  'PATCH',
      body:    JSON.stringify({ pdvId: pdvData.id }),
    });
    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || 'Erreur annulation.', ICONS.banned);
      return;
    }

    // Mettre à jour localement
    const idx = resaList.findIndex(r => r.id === resaId);
    if (idx !== -1) resaList[idx].statut = 'annulée';
    statsPdvCache = null; // invalider les stats — une annulation vient d'avoir lieu

    closePdvAnnulConfirm();
    closeResaDetail();
    filterReservations();
    renderFinancePage();
    updateAccueilStats();
    showToast('Réservation annulée avec succès.', ICONS.check, true);

  } catch (err) {
    console.error('Erreur annulation :', err);
    showToast('Impossible de contacter le serveur.', ICONS.banned);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = `${ICONS.banned} Confirmer l'annulation`; }
  }
}
window.cancelReservation = cancelReservation;

function getPointsTrajetPDV(trajet) {
  if (!trajet) return [];
  return [trajet.villeDepart, ...(trajet.arrets || []).map(a => a.ville || a.nom), trajet.villeArrivee];
}

function getPdvsAtPointPDV(trajet, pointNom) {
  if (!trajet || !pointNom) return [];
  if (pointNom === trajet.villeDepart)  return trajet.pdvDepart  || [];
  if (pointNom === trajet.villeArrivee) return trajet.pdvArrivee || [];
  return (trajet.pdvArrets || []).filter(p =>
    (p.ville || p.nom || '').toLowerCase().trim() === pointNom.toLowerCase().trim());
}

function calculerPrixSegmentModifPDV(trajet, villeMontee, villeDescente, typeId) {
  if (!trajet) return 0;
  if ((trajet.typeTrajet || 'direct') === 'direct') return Number(trajet.prixParType?.[typeId] || 0);
  const cle = `${villeMontee}|${villeDescente}`;
  const troncon = trajet.prixTroncons?.[cle];
  if (troncon && troncon[typeId] != null) return Number(troncon[typeId]);
  const prixAuPoint = (nom) => {
    if (nom === trajet.villeArrivee) return Number(trajet.prixParType?.[typeId] || 0);
    if (nom === trajet.villeDepart)  return 0;
    const arret = (trajet.arrets || []).find(a => (a.ville || a.nom) === nom);
    return Number(arret?.prixParType?.[typeId] || 0);
  };
  return Math.max(0, prixAuPoint(villeDescente) - prixAuPoint(villeMontee));
}

function handleModifierResa(resaId) {
  const r = resaList.find(r => r.id === resaId);
  if (!r) return;
  if (!peutModifierResaPDV(r)) { showToast('Modification impossible — voyage déjà passé.', ICONS.banned); return; }
  if (r.modifiee === true) {
    const existingLock = document.getElementById('modifierResaOverlay');
    if (existingLock) existingLock.remove();

    const lockOverlay = document.createElement('div');
    lockOverlay.id = 'modifierResaOverlay';
    lockOverlay.style.cssText = 'position:fixed;inset:0;z-index:8000;display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:opacity .3s ease;pointer-events:none;';
    lockOverlay.innerHTML = `
      <div onclick="closeModifierResa()" style="position:absolute;inset:0;background:rgba(10,14,26,0.88);backdrop-filter:blur(6px);"></div>
      <div style="position:relative;z-index:1;background:#0F1525;border:1px solid rgba(255,255,255,0.12);border-radius:24px 24px 0 0;width:100%;max-width:420px;padding:24px 20px 32px;box-shadow:0 -24px 80px rgba(0,0,0,0.5);transform:translateY(40px);transition:transform .35s cubic-bezier(0.34,1.1,.64,1);" id="modifierResaPanel">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px;">
          <div style="font-family:'Syne',sans-serif;font-size:16px;font-weight:800;color:var(--white);">Modification impossible</div>
          <button onclick="closeModifierResa()" style="background:var(--surface);border:1px solid var(--border);border-radius:8px;color:var(--muted);width:30px;height:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:13px;flex-shrink:0;">${ICONS.close}</button>
        </div>
        <div style="background:rgba(255,77,106,0.08);border:1px solid rgba(255,77,106,0.2);border-radius:12px;padding:14px 16px;font-size:13px;color:var(--white);line-height:1.5;">
          Cette réservation a déjà été modifiée une fois. Une seconde modification n'est pas autorisée.
        </div>
      </div>`;
    document.body.appendChild(lockOverlay);
    requestAnimationFrame(() => {
      lockOverlay.style.opacity = '1';
      lockOverlay.style.pointerEvents = 'all';
      const panel = document.getElementById('modifierResaPanel');
      if (panel) panel.style.transform = 'translateY(0)';
    });
    return;
  }

  const trajet = trajetList.find(t => t.id === r.trajetId);
  const points = getPointsTrajetPDV(trajet);
  const pointsDescente = points.filter(p => p !== trajet?.villeDepart);
  window._modifVilleMontee = r.arretMontee || trajet?.villeDepart;
  window._modifAncienPrixTotal = Number(r.prixTotal || 0);
  const nbPass  = r.passagers?.length || 1;
  const isMulti = nbPass > 1;

  const existing = document.getElementById('modifierResaOverlay');
  if (existing) existing.remove();

  const passagersFieldsHTML = isMulti
    ? r.passagers.map((p, i) => `
        <div class="recap-passager-card">
          <div class="recap-passager-title">Passager ${i + 1}</div>
          <div class="vente-field-group"><label>Prénom</label><input type="text" class="vente-input" id="modifPrenom_${i}" value="${p.prenom || ''}"></div>
          <div class="vente-field-group"><label>Nom</label><input type="text" class="vente-input" id="modifNom_${i}" value="${p.nom || ''}"></div>
          <div class="vente-field-group"><label>Téléphone</label><input type="text" class="vente-input" id="modifTel_${i}" value="${p.telephone || ''}"></div>
          <div class="vente-field-group"><label>Type de billet</label><select class="vente-select modif-passager-type" id="modifType_${i}" onchange="recalculerTotalModif()"></select></div>
        </div>`).join('')
    : `
        <div class="vente-field-group"><label>Prénom</label><input type="text" class="vente-input" id="modifPrenom" value="${r.prenomPassager || ''}"></div>
        <div class="vente-field-group"><label>Nom</label><input type="text" class="vente-input" id="modifNom" value="${r.nomPassager || ''}"></div>
        <div class="vente-field-group"><label>Téléphone</label><input type="text" class="vente-input" id="modifTel" value="${r.telephonePassager || ''}"></div>
        <div class="vente-field-group"><label>Type de billet</label><select class="vente-select modif-passager-type" id="modifType_0" onchange="recalculerTotalModif()"></select></div>`;

  const overlay = document.createElement('div');
  overlay.id = 'modifierResaOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:8000;display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:opacity .3s ease;pointer-events:none;';
  overlay.innerHTML = `
    <div onclick="closeModifierResa()" style="position:absolute;inset:0;background:rgba(10,14,26,0.88);backdrop-filter:blur(6px);"></div>
    <div style="position:relative;z-index:1;background:#0F1525;border:1px solid rgba(255,255,255,0.12);border-radius:24px 24px 0 0;width:100%;max-width:480px;max-height:88vh;overflow-y:auto;padding:20px 20px 32px;box-shadow:0 -24px 80px rgba(0,0,0,0.5);transform:translateY(40px);transition:transform .35s cubic-bezier(0.34,1.1,.64,1);" id="modifierResaPanel">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px;">
        <div>
          <div style="font-family:'Syne',sans-serif;font-size:16px;font-weight:800;color:var(--white);">Modifier la réservation</div>
          <div style="font-size:12px;color:var(--muted);margin-top:3px;">Le bus et la date ne sont pas modifiables ici.</div>
        </div>
        <button onclick="closeModifierResa()" style="background:var(--surface);border:1px solid var(--border);border-radius:8px;color:var(--muted);width:30px;height:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:13px;flex-shrink:0;">${ICONS.close}</button>
      </div>

      <div style="background:rgba(255,178,63,0.08);border:1px solid rgba(255,178,63,0.25);border-radius:10px;padding:10px 13px;font-size:12px;color:#FFB23F;line-height:1.5;margin-bottom:4px;">
        ${ICONS.warning} Cette modification n'est possible qu'une seule fois. Vérifiez bien les informations avant de valider.
      </div>

      ${passagersFieldsHTML}
      <div class="recap-section-title" style="margin-top:6px;">Trajet</div>
      <div class="recap-card">
        <div class="recap-row"><span>Ville de montée</span><strong>${r.arretMontee || trajet?.villeDepart || '—'}</strong></div>
        <div class="vente-field-group" style="margin-top:10px;"><label>Lieu d'embarquement</label><select class="vente-select" id="modifPdvEmbarquement"></select></div>
        <div class="vente-field-group"><label>Ville de descente</label><select class="vente-select" id="modifDescente" onchange="onDescenteModifChange();recalculerTotalModif()"></select></div>
        <div class="vente-field-group"><label>Lieu de débarquement</label><select class="vente-select" id="modifPdvDebarquement"></select></div>
      </div>
      <div class="vente-field-group"><label>Bagages (kg)</label><input type="number" class="vente-input" id="modifBagages" value="${r.bagages || 0}" min="0" oninput="recalculerTotalModif()"></div>
      <div class="vente-field-group"><label>Remarques</label><input type="text" class="vente-input" id="modifRemarques" value="${r.remarques || ''}"></div>
      <div class="vente-field-group"><label>Raison de la modification (optionnel)</label><input type="text" class="vente-input" id="modifRaison" placeholder="Ex : erreur ville descente, demande client..."></div>
      <div class="recap-total-row" style="margin-top:6px;"><span>Total encaissé (calcul automatique)</span><strong id="modifTotalDisplay">${Number(r.prixTotal || 0).toLocaleString()} XAF</strong></div>
      <input type="hidden" id="modifPrixTotal" value="${r.prixTotal || 0}">
      <button style="width:100%;background:var(--accent);color:var(--dark);border:none;border-radius:12px;padding:14px;font-size:14px;font-weight:700;font-family:'DM Sans',sans-serif;cursor:pointer;margin-top:16px;" onclick="confirmerModificationResa('${resaId}')">
        Enregistrer les modifications
      </button>
    </div>`;

  window._modifTrajetCourant = trajet;
  document.body.appendChild(overlay);

  document.querySelectorAll('.modif-passager-type').forEach(peuplerSelectType);
  if (isMulti) r.passagers.forEach((p, i) => { const s = document.getElementById(`modifType_${i}`); if (s) s.value = p.type; });
  else { const s = document.getElementById('modifType_0'); if (s) s.value = r.typeBillet; }

  const selDescente = document.getElementById('modifDescente');
  if (selDescente) selDescente.innerHTML = pointsDescente.map(p =>
    `<option value="${p}" ${p === (r.arretDescente || trajet?.villeArrivee) ? 'selected' : ''}>${p}</option>`).join('');

  const selEmb = document.getElementById('modifPdvEmbarquement');
  if (selEmb) {
    const pdvsEmb = getPdvsAtPointPDV(trajet, r.arretMontee || trajet?.villeDepart);
    selEmb.innerHTML = pdvsEmb.length > 0
      ? pdvsEmb.map(p => `<option value="${p.id}" data-nom="${p.nom||''}" data-ville="${p.ville||''}" ${p.id === r.pdvEmbarquementId ? 'selected' : ''}>${p.nom}${p.ville ? ' — '+p.ville : ''}</option>`).join('')
      : '<option value="">Aucun point de vente</option>';
  }

  const selDeb = document.getElementById('modifPdvDebarquement');
  if (selDeb) {
    const pdvsDeb = getPdvsAtPointPDV(trajet, r.arretDescente || trajet?.villeArrivee);
    selDeb.innerHTML = pdvsDeb.length > 0
      ? pdvsDeb.map(p => `<option value="${p.id}" data-nom="${p.nom||''}" data-ville="${p.ville||''}" ${p.id === r.pdvDebarquementId ? 'selected' : ''}>${p.nom}${p.ville ? ' — '+p.ville : ''}</option>`).join('')
      : '<option value="">Aucun point de vente</option>';
  }

  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'all';
    const panel = document.getElementById('modifierResaPanel');
    if (panel) panel.style.transform = 'translateY(0)';
  });
  recalculerTotalModif();
}

function closeModifierResa() {
  const o = document.getElementById('modifierResaOverlay');
  if (o) { o.style.opacity = '0'; o.style.pointerEvents = 'none'; setTimeout(() => o.remove(), 300); }
}

function onDescenteModifChange() {
  const trajet = window._modifTrajetCourant;
  const descenteVal = document.getElementById('modifDescente')?.value;
  const selDeb = document.getElementById('modifPdvDebarquement');
  if (!selDeb || !trajet) return;
  const pdvs = getPdvsAtPointPDV(trajet, descenteVal);
  selDeb.innerHTML = pdvs.length > 0
    ? pdvs.map(p => `<option value="${p.id}" data-nom="${p.nom||''}" data-ville="${p.ville||''}">${p.nom}${p.ville ? ' — '+p.ville : ''}</option>`).join('')
    : `<option value="">Aucun point de vente à ce lieu</option>`;
}

function recalculerTotalModif() {
  const trajet = window._modifTrajetCourant;
  if (!trajet) return;
  const villeMontee   = window._modifVilleMontee || trajet.villeDepart;
  const villeDescente = document.getElementById('modifDescente')?.value || trajet.villeArrivee;
  const bagages       = parseFloat(document.getElementById('modifBagages')?.value) || 0;
  let total = 0;
  document.querySelectorAll('.modif-passager-type').forEach(sel => {
    total += calculerPrixSegmentModifPDV(trajet, villeMontee, villeDescente, sel.value);
  });
  const exces = bagages > (trajet.limiteBagages || 0) ? bagages - (trajet.limiteBagages || 0) : 0;
  total += exces * (trajet.fraisExcesBagages || 0);
  const display = document.getElementById('modifTotalDisplay');
  const hidden  = document.getElementById('modifPrixTotal');
  if (display) display.textContent = `${Number(total).toLocaleString()} XAF`;
  if (hidden)  hidden.value = total;
}

async function confirmerModificationResa(resaId) {
  const r = resaList.find(r => r.id === resaId);
  if (!r) return;
  const isMulti = (r.passagers?.length || 1) > 1;
  const btn = document.querySelector('#modifierResaOverlay button[onclick^="confirmerModificationResa"]');
  if (btn) { btn.disabled = true; btn.textContent = 'Enregistrement...'; }

  const trajet = window._modifTrajetCourant;
  const villeMontee   = r.arretMontee || trajet?.villeDepart;
  const villeDescente = document.getElementById('modifDescente')?.value;
  const selEmb = document.getElementById('modifPdvEmbarquement');
  const selDeb = document.getElementById('modifPdvDebarquement');
  const embOpt = selEmb?.selectedOptions[0];
  const debOpt = selDeb?.selectedOptions[0];

  const payload = {
    arretMontee: villeMontee, arretDescente: villeDescente,
    bagages: parseFloat(document.getElementById('modifBagages')?.value) || 0,
    remarques: document.getElementById('modifRemarques')?.value || '',
    prixTotal: parseFloat(document.getElementById('modifPrixTotal')?.value) || 0,
    routeLabel: `${villeMontee} → ${villeDescente}`,
    pdvEmbarquementId: selEmb?.value || null, pdvEmbarquementNom: embOpt?.dataset.nom || null, pdvEmbarquementVille: embOpt?.dataset.ville || null,
    pdvDebarquementId: selDeb?.value || null, pdvDebarquementNom: debOpt?.dataset.nom || null, pdvDebarquementVille: debOpt?.dataset.ville || null,
  };

  if (isMulti) {
    payload.passagers = r.passagers.map((p, i) => ({
      ...p,
      prenom: document.getElementById(`modifPrenom_${i}`)?.value || p.prenom,
      nom: document.getElementById(`modifNom_${i}`)?.value || p.nom,
      telephone: document.getElementById(`modifTel_${i}`)?.value || p.telephone,
      type: document.getElementById(`modifType_${i}`)?.value || p.type,
    }));
    payload.prenomPassager = payload.passagers[0].prenom;
    payload.nomPassager    = payload.passagers[0].nom;
    payload.typeBillet     = payload.passagers[0].type;
  } else {
    payload.prenomPassager    = document.getElementById('modifPrenom')?.value;
    payload.nomPassager       = document.getElementById('modifNom')?.value;
    payload.telephonePassager = document.getElementById('modifTel')?.value;
    payload.typeBillet        = document.getElementById('modifType_0')?.value;
  }

  if (!payload.prenomPassager) {
    showToast('Le prénom est obligatoire.', ICONS.warning);
    if (btn) { btn.disabled = false; btn.textContent = 'Enregistrer les modifications'; }
    return;
  }

  const ancienPrix = window._modifAncienPrixTotal || 0;
  const raisonVal  = (document.getElementById('modifRaison')?.value || '').trim();

  if (payload.prixTotal < ancienPrix && !raisonVal) {
    showToast('Merci d\'indiquer la raison de la baisse de prix avant de valider.', ICONS.warning);
    if (btn) { btn.disabled = false; btn.textContent = 'Enregistrer les modifications'; }
    return;
  }
  payload.raisonModification = raisonVal || null;

  try {
    const res = await apiFetch(`${BACKEND}/reservations/${resaId}`, {
      method: 'PATCH', body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.message || 'Erreur modification.', ICONS.banned); return; }

    const idx = resaList.findIndex(r => r.id === resaId);
    if (idx !== -1) resaList[idx] = { ...resaList[idx], ...data.reservation };
    statsPdvCache = null; // invalider les stats — une modification vient d'avoir lieu

    closeModifierResa();
    closeResaDetail();
    filterReservations();
    renderFinancePage();
    updateAccueilStats();
    showToast('Réservation modifiée avec succès.', ICONS.check, true);
  } catch (err) {
    console.error('Erreur modification réservation :', err);
    showToast('Impossible de contacter le serveur.', ICONS.banned);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Enregistrer les modifications'; }
  }
}

window.handleModifierResa = handleModifierResa;
window.closeModifierResa = closeModifierResa;
window.onDescenteModifChange = onDescenteModifChange;
window.recalculerTotalModif = recalculerTotalModif;
window.confirmerModificationResa = confirmerModificationResa;

// ════════════════════════════════
//  PROFIL — DÉTAIL PDV
// ════════════════════════════════
async function renderMonPDVPage() {
  if (!pdvData) return;

  // Hero
  const initiale = pdvData.responsable ? pdvData.responsable[0].toUpperCase() : '?';
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  setEl('monpdvAvatar',     initiale);
  setEl('monpdvNom',        pdvData.nom       || '—');
  setEl('monpdvVille',      pdvData.ville     || '—');
  setEl('monpdvAgence',     agenceData?.nom   || '—');
  setEl('monpdvInfoNom',    pdvData.nom       || '—');
  setEl('monpdvInfoVille',  pdvData.ville     || '—');
  setEl('monpdvInfoAdresse',pdvData.adresse   || '—');
  setEl('monpdvInfoTel',    pdvData.telephone || '—');
  setEl('monpdvInfoResp',   pdvData.responsable || '—');
  setEl('monpdvInfoAgence', agenceData?.nom   || '—');

  // Stats locales (depuis resaList)
  const monthStr = toBrazzaDate(new Date().toISOString()).slice(0, 7);
  const vendusMois = resaList.filter(r => toBrazzaDate(r.createdAt).startsWith(monthStr)).length;
  const revMois    = resaList.filter(r => toBrazzaDate(r.createdAt).startsWith(monthStr))
                              .reduce((s, r) => s + (r.prixTotal || 0), 0);

  setEl('monpdvStatVendus',  vendusMois.toLocaleString() + ' billets');
  setEl('monpdvStatRevenus', revMois.toLocaleString() + ' XAF');
  setEl('monpdvStatTrajets', trajetList.length.toString());

  // Taux moyen via API stats (avec cache)
  try {
    if (!statsPdvCache) {
      const res  = await apiFetch(`${BACKEND}/pdv/${pdvData.id}/stats?agenceId=${pdvData.agenceId}`);
      statsPdvCache = await res.json();
    }
    const data = statsPdvCache;
    setEl('monpdvStatTaux',        (data.tauxMoyen      || 0) + ' %');
    setEl('monpdvStatAnnulations', (data.annulations    || 0).toLocaleString() + ' billets');
    setEl('monpdvStatNettes',      (data.ventesNettes   || 0).toLocaleString() + ' billets');
    setEl('monpdvStatTauxAnnul',   (data.tauxAnnulation || 0) + ' %');

    // Sessions récentes
    const sessEl = document.getElementById('monpdvSessionsList');
    if (sessEl) {
      const sess = data.sessionsRecentes || [];
      if (sess.length === 0) {
        sessEl.innerHTML = `<div class="empty-state small"><p>Aucune session récente.</p></div>`;
      } else {
        sessEl.innerHTML = sess.map(s => {
          const barW = Math.min(100, s.taux);
          const barColor = barW > 80 ? '#FF4D6A' : barW > 50 ? '#FFB23F' : 'var(--accent)';
          return `
            <div class="monpdv-session-row">
              <div class="monpdv-session-left">
                <div class="monpdv-session-date">${new Date(s.date).toLocaleDateString('fr-FR', {weekday:'short',day:'2-digit',month:'short'})}</div>
                <div class="monpdv-session-route">${s.villeDepart} → ${s.villeArrivee} · ${s.heureDepart}</div>
                <div class="monpdv-session-bus">${ICONS.bus} ${s.busNom}</div>
              </div>
              <div class="monpdv-session-right">
                <div class="monpdv-session-count">${s.placesVendues}/${s.placesTotal}</div>
                <div class="monpdv-session-bar-wrap">
                  <div class="monpdv-session-bar" style="width:${barW}%;background:${barColor};"></div>
                </div>
                <div style="font-size:10px;color:var(--muted);text-align:right;">${s.taux}%</div>
              </div>
            </div>`;
        }).join('');
      }
    }
  } catch (_) {
    setEl('monpdvStatTaux', '—');
  }

  // Trajets assignés
  const trajEl = document.getElementById('monpdvTrajetsList');
  if (trajEl) {
    if (trajetList.length === 0) {
      trajEl.innerHTML = `<div class="empty-state small"><p>Aucun trajet assigné.</p></div>`;
    } else {
      trajEl.innerHTML = trajetList.map(t => `
        <div class="monpdv-trajet-row">
          <div>
            <div style="font-size:13px;font-weight:600;color:var(--white);">${t.villeDepart} → ${t.villeArrivee}</div>
            <div style="font-size:11px;color:var(--muted);margin-top:2px;">
              ${t.typeTrajet === 'arrets' ? '⊙ Avec arrêts' : '→ Direct'} · ${t.heureDepart || '—'}
              ${t.heureArrivee ? ' → ' + t.heureArrivee : ''}
            </div>
          </div>
          <div style="text-align:right;">
            ${Object.entries(t.prixParType || {}).map(([id, p]) => `<div style="font-family:'Syne',sans-serif;font-size:13px;font-weight:800;color:var(--white);">${Number(p).toLocaleString()} <span style="font-size:9px;color:var(--muted);font-weight:400;">${nomType(id)}</span></div>`).join('')}
          </div>
        </div>`).join('');
    }
  }
}
window.renderMonPDVPage = renderMonPDVPage;

// ════════════════════════════════
//  FINANCES PDV — VERSION AGENT
//  Logique simple : encaissé, billets, annulations
// ════════════════════════════════

function setFinPeriode(periode, btn) {
  finPeriode = periode;
  finCustomRange = null;
  const wrap = document.getElementById('finCustomPickerWrapPDV');
  if (wrap) wrap.style.display = 'none';
  document.getElementById('finCustomBtnPDV')?.classList.remove('active');
  document.querySelectorAll('#finPeriodeFilters .rqf-btn')
    .forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderFinancePage();
}
window.setFinPeriode = setFinPeriode;

function toggleFinCustomPickerPDV() {
  const wrap = document.getElementById('finCustomPickerWrapPDV');
  if (!wrap) return;
  wrap.style.display = wrap.style.display === 'block' ? 'none' : 'block';
}
window.toggleFinCustomPickerPDV = toggleFinCustomPickerPDV;

function applyFinCustomRangePDV() {
  const debut = document.getElementById('finCustomDebutPDV')?.value;
  const fin   = document.getElementById('finCustomFinPDV')?.value;
  if (!debut || !fin) { showToast('Sélectionnez les deux dates.', ICONS.warning); return; }
  if (debut > fin) { showToast('La date de début doit précéder la date de fin.', ICONS.warning); return; }

  finCustomRange = { debut, fin };
  document.querySelectorAll('#finPeriodeFilters .rqf-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('finCustomBtnPDV')?.classList.add('active');
  document.getElementById('finCustomPickerWrapPDV').style.display = 'none';
  renderFinancePage();
}
window.applyFinCustomRangePDV = applyFinCustomRangePDV;

function clearFinCustomRangePDV() {
  finCustomRange = null;
  document.getElementById('finCustomPickerWrapPDV').style.display = 'none';
  document.getElementById('finCustomBtnPDV')?.classList.remove('active');
  finPeriode = 'today';
  document.querySelectorAll('#finPeriodeFilters .rqf-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('#finPeriodeFilters .rqf-btn:nth-child(1)')?.classList.add('active');
  renderFinancePage();
}
window.clearFinCustomRangePDV = clearFinCustomRangePDV;

function getFinBornesEffectivesPDV() {
  if (finCustomRange) return { debut: finCustomRange.debut, fin: finCustomRange.fin };
  const nowBrazza  = Date.now() + OFFSET_MS_FIN;
  const todayDate  = new Date(nowBrazza);
  const today      = todayDate.toISOString().split('T')[0];

  if (finPeriode === 'today') return { debut: today, fin: today };

  if (finPeriode === 'week') {
    const jourSemaine = (todayDate.getUTCDay() + 6) % 7;
    const lundi = new Date(todayDate.getTime() - jourSemaine * 86400000);
    return { debut: lundi.toISOString().split('T')[0], fin: today };
  }

  if (finPeriode === 'month') {
    const premierJour = new Date(Date.UTC(todayDate.getUTCFullYear(), todayDate.getUTCMonth(), 1));
    return { debut: premierJour.toISOString().split('T')[0], fin: today };
  }

  return { debut: null, fin: null };
}

function updateFinPeriodeLabelPDV() {
  const el = document.getElementById('finPeriodeLabelPDV');
  if (!el) return;
  const fmtLong  = (str) => new Date(str + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const fmtShort = (str) => new Date(str + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

  if (finCustomRange) {
    const d = fmtLong(finCustomRange.debut);
    const f = fmtLong(finCustomRange.fin);
    el.innerHTML = finCustomRange.debut === finCustomRange.fin ? `${ICONS.calendar} ${d}` : `${ICONS.calendar} Du ${d} au ${f}`;
    return;
  }
  const { debut, fin } = getFinBornesEffectivesPDV();
  if (finPeriode === 'today') el.innerHTML = `${ICONS.calendar}${ICONS.calendar} Aujourd'hui · ${fmtLong(debut)}`;
  else if (finPeriode === 'week')  el.innerHTML = `${ICONS.calendar} Cette semaine · Du ${fmtShort(debut)} au ${fmtLong(fin)}`;
  else if (finPeriode === 'month') el.innerHTML = `${ICONS.calendar} Ce mois-ci · Du ${fmtShort(debut)} au ${fmtLong(fin)}`;
  else el.innerHTML = `${ICONS.calendar} Toutes les périodes`;
}

// ── Filtre les réservations confirmées selon la période ──
function getResasParPeriode(periode) {
  const { debut, fin } = getFinBornesEffectivesPDV();
  return resaList.filter(r => {
    if (r.statut === 'annulée') return false;
    if (!finPasseFiltrePDV(r)) return false;
    const d = toBrazzaDate(r.createdAt);
    if (debut && d < debut) return false;
    if (fin   && d > fin)   return false;
    return true;
  });
}

// ── Filtre les annulations selon la période ──
function getAnnulParPeriode(periode) {
  const { debut, fin } = getFinBornesEffectivesPDV();
  return resaList.filter(r => {
    if (r.statut !== 'annulée') return false;
    if (!finPasseFiltrePDV(r)) return false;
    const d = toBrazzaDate(r.createdAt);
    if (debut && d < debut) return false;
    if (fin   && d > fin)   return false;
    return true;
  });
}

function finPasseFiltrePDV(r) {
  if (finFiltreTrajet && r.trajetId !== finFiltreTrajet) return false;
  if (finFiltreBus    && r.busNom   !== finFiltreBus)    return false;
  if (finFiltreStatut === 'retrait' && !r.passagerRetire) return false;
  if (finFiltreStatut && finFiltreStatut !== 'retrait' && r.statut !== finFiltreStatut) return false;
  return true;
}

function populateFinFiltresPDV() {
  const selT = document.getElementById('finFiltreTrajet');
  const selB = document.getElementById('finFiltreBus');
  if (!selT || !selB) return;

  if (!selT.dataset.bound) {
    selT.innerHTML = '<option value="">Tous les trajets</option>' +
      trajetList.map(t => `<option value="${t.id}">${t.villeDepart} → ${t.villeArrivee}</option>`).join('');

    populateFinBusSelectCascadePDV('');

    selT.dataset.bound = '1';
  }
}

function populateFinBusSelectCascadePDV(trajetId) {
  const selB = document.getElementById('finFiltreBus');
  if (!selB) return;
  selB.innerHTML = '<option value="">Tous les bus</option>';

  if (trajetId) {
    getDepartsForTrajet(trajetId)
      .then(departs => {
        const busNoms = [...new Set(departs.map(d => d.busNom).filter(Boolean))].sort();
        selB.innerHTML = '<option value="">Tous les bus</option>' +
          busNoms.map(nom => `<option value="${nom}">${nom}</option>`).join('');
      })
      .catch(err => console.error('Erreur chargement bus filtre finances PDV :', err));
  } else {
    getBusNomsPourPDV().then(busNoms => {
      selB.innerHTML = '<option value="">Tous les bus</option>' +
        busNoms.map(nom => `<option value="${nom}">${nom}</option>`).join('');
    });
  }
}

function updateFinFiltreHighlightPDV(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('filtre-actif', !!el.value);
}

function onFinTrajetFiltreChangePDV() {
  const trajetId = document.getElementById('finFiltreTrajet')?.value || '';
  finFiltreTrajet = trajetId;

  const selB = document.getElementById('finFiltreBus');
  if (selB) selB.value = '';
  finFiltreBus = '';

  populateFinBusSelectCascadePDV(trajetId);

  ['finFiltreTrajet', 'finFiltreBus'].forEach(updateFinFiltreHighlightPDV);
  renderFinancePage();
}
window.onFinTrajetFiltreChangePDV = onFinTrajetFiltreChangePDV;

function onFinFiltreChange() {
  finFiltreBus    = document.getElementById('finFiltreBus')?.value   || '';
  finFiltreStatut = document.getElementById('finFiltreStatut')?.value || '';
  ['finFiltreBus', 'finFiltreStatut'].forEach(updateFinFiltreHighlightPDV);
  renderFinancePage();
}
window.onFinFiltreChange = onFinFiltreChange;

function getBornesPeriodePrecedentePDV(periode, bDebut, bFin) {
  if (!bDebut || !bFin) return { debut: null, fin: null };

  if (periode === 'today') {
    const prev = new Date(new Date(bDebut + 'T00:00:00Z').getTime() - 86400000).toISOString().split('T')[0];
    return { debut: prev, fin: prev };
  }

  if (periode === 'week') {
    const d = new Date(bDebut + 'T00:00:00Z');
    const f = new Date(bFin   + 'T00:00:00Z');
    return {
      debut: new Date(d.getTime() - 7 * 86400000).toISOString().split('T')[0],
      fin:   new Date(f.getTime() - 7 * 86400000).toISOString().split('T')[0],
    };
  }

  if (periode === 'month') {
    const d = new Date(bDebut + 'T00:00:00Z');
    const f = new Date(bFin   + 'T00:00:00Z');
    const prevDebut = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1));
    const dernierJourPrevMois = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 0)).getUTCDate();
    const quantieme = Math.min(f.getUTCDate(), dernierJourPrevMois);
    const prevFin = new Date(Date.UTC(prevDebut.getUTCFullYear(), prevDebut.getUTCMonth(), quantieme));
    return { debut: prevDebut.toISOString().split('T')[0], fin: prevFin.toISOString().split('T')[0] };
  }

  const dureeJours = Math.max(1, Math.round((new Date(bFin) - new Date(bDebut)) / 86400000) + 1);
  return {
    debut: new Date(new Date(bDebut).getTime() - dureeJours * 86400000).toISOString().split('T')[0],
    fin:   new Date(new Date(bDebut).getTime() - 1 * 86400000).toISOString().split('T')[0],
  };
}

function getResasPrecedentesPDV(periode) {
  const { debut, fin } = getFinBornesEffectivesPDV();
  const { debut: pDebut, fin: pFin } = getBornesPeriodePrecedentePDV(periode, debut, fin);
  if (!pDebut || !pFin) return [];
  return resaList.filter(r => {
    if (r.statut === 'annulée') return false;
    if (!finPasseFiltrePDV(r)) return false;
    const d = toBrazzaDate(r.createdAt);
    return d >= pDebut && d <= pFin;
  });
}

function cmpHtmlPDV(val, prev) {
  if (prev === 0) return `<span style="color:var(--muted);">— pas de comparaison</span>`;
  const pct     = Math.round((val - prev) / prev * 100);
  const couleur = pct >= 0 ? 'var(--accent)' : '#FF4D6A';
  const fleche  = pct >= 0 ? '↑' : '↓';
  const signe   = pct >= 0 ? '+' : '';
  return `<span style="color:${couleur};">${fleche} ${signe}${pct}% vs période précédente</span>`;
}

function renderFinanceChartPDV(periode) {
  const container = document.getElementById('finEvolutionPDV');
  const titleEl   = document.getElementById('finEvolutionTitlePDV');
  if (!container) return;

  const fmtChart = n => n >= 1_000_000
    ? (n/1_000_000).toFixed(1).replace(/\.0$/,'') + 'M XAF'
    : n >= 1_000 ? Math.round(n/1_000) + 'k XAF'
    : n.toLocaleString() + ' XAF';

  const passe = r => r.statut !== 'annulée' && finPasseFiltrePDV(r);
  let cols = [];

  if (periode === 'today') {
    const today  = toBrazzaDate(new Date().toISOString());
    const heures = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
    cols = heures.map(h => {
      const val = resaList.filter(r => {
        if (!passe(r)) return false;
        if (!r.createdAt) return false;
        const heureBrazza = new Date(new Date(r.createdAt).getTime() + OFFSET_MS_FIN).getUTCHours();
        return toBrazzaDate(r.createdAt) === today && heureBrazza >= h && heureBrazza < h + 2;
      }).reduce((s, r) => s + (r.prixTotal || 0), 0);
      return { label: `${h}h`, val };
    });
    if (titleEl) titleEl.textContent = "Activité d'aujourd'hui par heure";

  } else if (periode === 'week') {
    const joursNoms = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
    const { debut: lundiStr, fin: aujourdHui } = getFinBornesEffectivesPDV();
    const lundiDate = new Date(lundiStr + 'T00:00:00Z');
    for (let i = 0; i < 7; i++) {
      const dStr = new Date(lundiDate.getTime() + i * 86400000).toISOString().split('T')[0];
      const val = resaList.filter(r => passe(r) && toBrazzaDate(r.createdAt) === dStr)
        .reduce((s, r) => s + (r.prixTotal || 0), 0);
      cols.push({ label: joursNoms[i], val });
      if (dStr === aujourdHui) break; // ne pas afficher les jours futurs
    }
    if (titleEl) titleEl.textContent = "Activité de la semaine (lundi → aujourd'hui)";

  } else if (periode === 'month') {
    const month = toBrazzaDate(new Date().toISOString()).slice(0, 7);
    for (let w = 0; w < 4; w++) {
      const debut = w * 7 + 1;
      const fin   = Math.min((w + 1) * 7, 31);
      const val = resaList.filter(r => {
        if (!passe(r)) return false;
        const dBrazza = toBrazzaDate(r.createdAt);
        if (!dBrazza.startsWith(month)) return false;
        const jour = Number(dBrazza.slice(8, 10));
        return jour >= debut && jour <= fin;
      }).reduce((s, r) => s + (r.prixTotal || 0), 0);
      cols.push({ label: `S${w + 1}`, val });
    }
    if (titleEl) titleEl.textContent = 'Activité par semaine ce mois';

  } else {
    const moisNoms = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.now() + OFFSET_MS_FIN);
      d.setUTCMonth(d.getUTCMonth() - i);
      const str = d.toISOString().slice(0, 7);
      const val = resaList.filter(r => passe(r) && toBrazzaDate(r.createdAt).startsWith(str))
        .reduce((s, r) => s + (r.prixTotal || 0), 0);
      cols.push({ label: moisNoms[d.getUTCMonth()], val });
    }
    if (titleEl) titleEl.textContent = 'Activité des 6 derniers mois';
  }

  const max = Math.max(...cols.map(c => c.val), 1);

  container.innerHTML = `
    <div style="display:flex;align-items:flex-end;gap:6px;height:90px;padding:0 2px;">
        ${cols.map(c => {
        const h = Math.max(4, Math.round((c.val / max) * 90));
        return `
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:4px;min-width:0;height:100%;">
            <div title="${c.label} — ${fmtChart(c.val)}"
                style="width:100%;background:var(--primary);border-radius:3px 3px 0 0;
                height:${h}%;min-height:4px;opacity:.85;cursor:pointer;transition:opacity .15s;"
                onmouseover="this.style.opacity=1;this.style.background='var(--accent)'"
                onmouseout="this.style.opacity='.85';this.style.background='var(--primary)'">
            </div>
            </div>`;
        }).join('')}
    </div>
    <div style="display:flex;justify-content:space-between;padding:5px 2px 0;font-size:10px;color:var(--muted);">
      ${cols.map(c => `<span>${c.label}</span>`).join('')}
    </div>`;
}

function renderFinanceDowPDV(resas) {
  const panel = document.getElementById('finDowPanelPDV');
  const container = document.getElementById('finDowPDV');
  if (!container || !panel) return;

  if (finPeriode === 'today') { panel.style.display = 'none'; return; }

  const JOURS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
  const ORDRE_JOURS = [1,2,3,4,5,6,0];
  const dowCA = Array(7).fill(0);
  resas.forEach(r => {
    if (!r.createdAt) return;
    const dow = new Date(toBrazzaDate(r.createdAt)+'T00:00:00').getDay();
    dowCA[dow] += r.prixTotal||0;
  });
  const maxDow  = Math.max(...dowCA, 1);
  const bestDow = dowCA.indexOf(Math.max(...dowCA));

  if (dowCA[bestDow] === 0) { panel.style.display = 'none'; return; }
  panel.style.display = 'block';

  container.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:8px;">
      ${ORDRE_JOURS.map((i, pos) => {
        const pct    = Math.max(Math.round(dowCA[i] / maxDow * 100), 2);
        const isBest = i === bestDow && dowCA[i] > 0;
        const couleur = isBest ? 'var(--accent)' : 'var(--primary)';
        return `
          <div style="display:flex;flex-direction:column;align-items:center;gap:3px;">
            <div style="height:40px;width:100%;display:flex;align-items:flex-end;">
              <div style="width:100%;height:${pct}%;background:${couleur};border-radius:2px 2px 0 0;opacity:.85;min-height:3px;"></div>
            </div>
            <div style="font-size:11px;color:var(--muted);">${JOURS[pos]}</div>
            <div style="font-size:10px;color:var(--muted);opacity:.7;">${dowCA[i]>0?Math.round(dowCA[i]/1000)+'k':'-'}</div>
          </div>`;
      }).join('')}
    </div>
    <div style="font-size:12px;color:var(--muted);">
      Vous vendez le mieux le <strong style="color:var(--white);">${JOURS[ORDRE_JOURS.indexOf(bestDow)]}</strong>.
    </div>`;
}

function renderFinanceTrajetsPDV(resas, fmt) {
  const container = document.getElementById('finTrajetListPDV');
  if (!container) return;

  const parTrajet = {};
  resas.forEach(r => {
    const key = r.trajetId || 'inconnu';
    const trajetRef = trajetList.find(t => t.id === r.trajetId);
    const label = (r.arretMontee && r.arretDescente)
      ? `${r.arretMontee} → ${r.arretDescente}`
      : (trajetRef ? `${trajetRef.villeDepart} → ${trajetRef.villeArrivee}` : (r.routeLabel || '—'));
    if (!parTrajet[key]) parTrajet[key] = { label, billets: 0, montant: 0 };
    parTrajet[key].billets += (r.nbPassagers || 1);
    parTrajet[key].montant += (r.prixTotal || 0);
  });

  const sorted = Object.values(parTrajet).sort((a, b) => b.montant - a.montant);
  const max = sorted[0]?.montant || 1;

  if (sorted.length === 0) {
    container.innerHTML = `<div class="empty-state small"><p>Aucune donnée pour cette période.</p></div>`;
    return;
  }

  container.innerHTML = sorted.map(t => `
    <div class="finance-trajet-row">
      <div class="finance-trajet-info">
        <div class="finance-trajet-route">${t.label}</div>
        <div class="finance-trajet-bar-wrap">
          <div class="finance-trajet-bar" style="width:${Math.round(t.montant/max*100)}%;"></div>
        </div>
      </div>
      <div class="finance-trajet-right">
        <div class="finance-trajet-montant">${fmt(t.montant)}</div>
        <div class="finance-trajet-pct">${t.billets} billet${t.billets>1?'s':''}</div>
      </div>
    </div>`).join('');
}

function renderImpactPDV(periode) {
  const panel = document.getElementById('finImpactPanelPDV');
  const el    = document.getElementById('finImpactPDV');
  if (!el || !panel) return;

  const today   = toBrazzaDate(new Date().toISOString());
  const weekStr = toBrazzaDate(new Date(Date.now() - 7 * 86400000).toISOString());
  const month   = today.slice(0, 7);

  const dansPeriode = (dateStr) => {
    if (!dateStr) return false;
    const d = toBrazzaDate(dateStr);
    if (periode === 'today') return d === today;
    if (periode === 'week')  return d >= weekStr;
    if (periode === 'month') return d.startsWith(month);
    return true;
  };

  const modifs = resaList.filter(r => r.modifiee === true && r.ecartMontant > 0 && dansPeriode(r.dateModification));
  const totalBaisse = modifs.reduce((s, r) => s + (r.ecartMontant || 0), 0);

  let totalRetrait = 0, nbRetraits = 0;
  resaList.filter(r => r.passagerRetire === true).forEach(r => {
    (r.historiqueRetraits || []).forEach(h => {
      if (dansPeriode(h.retireAt)) { totalRetrait += (h.montantRembourse || 0); nbRetraits++; }
    });
  });

  if (modifs.length === 0 && nbRetraits === 0) {
    panel.style.display = 'none';
    return;
  }

  panel.style.display = 'block';
  el.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:8px;">
      ${modifs.length > 0 ? `
      <div style="display:flex;justify-content:space-between;font-size:12.5px;">
        <span style="color:var(--muted);">${ICONS.scissors} ${modifs.length} modification${modifs.length>1?'s':''} à la baisse</span>
        <strong style="color:#FF4D6A;">-${totalBaisse.toLocaleString()} XAF</strong>
      </div>` : ''}
      ${nbRetraits > 0 ? `
      <div style="display:flex;justify-content:space-between;font-size:12.5px;">
        <span style="color:var(--muted);">${ICONS.person} ${nbRetraits} passager${nbRetraits>1?'s':''} retiré${nbRetraits>1?'s':''}</span>
        <strong style="color:#FF4D6A;">-${totalRetrait.toLocaleString()} XAF</strong>
      </div>` : ''}
    </div>`;
}

function getToutesResasParPeriode(periode) {
  const { debut, fin } = getFinBornesEffectivesPDV();
  return resaList.filter(r => {
    if (!finPasseFiltrePDV(r)) return false;
    const d = toBrazzaDate(r.createdAt);
    if (debut && d < debut) return false;
    if (fin   && d > fin)   return false;
    return true;
  });
}

// ════════════════════════════════
//  RENDER PRINCIPAL
// ════════════════════════════════
function renderFinancePage() {
  populateFinFiltresPDV();
  updateFinPeriodeLabelPDV();

  const setEl     = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  const setElHtml = (id, val) => { const el = document.getElementById(id); if (el) el.innerHTML = val; };

  const fmt = n => n >= 1_000_000
    ? (n/1_000_000).toFixed(1).replace(/\.0$/,'') + 'M XAF'
    : n >= 1_000 ? Math.round(n/1_000) + 'k XAF'
    : n.toLocaleString() + ' XAF';

  const today      = toBrazzaDate(new Date().toISOString());
  const resasAuj   = resaList.filter(r => r.statut !== 'annulée' && toBrazzaDate(r.createdAt) === today);
  const totalAuj   = resasAuj.reduce((s, r) => s + (r.prixTotal || 0), 0);
  const billetsAuj = resasAuj.reduce((s, r) => s + (r.nbPassagers || 1), 0);

  setEl('finHeroTotal',   `${totalAuj.toLocaleString()} XAF`);
  setEl('finHeroBillets', `${billetsAuj} billet${billetsAuj > 1 ? 's' : ''} vendu${billetsAuj > 1 ? 's' : ''} aujourd'hui`);

  const resas  = getResasParPeriode(finPeriode);
  const annuls = getAnnulParPeriode(finPeriode);
  const toutesResas = getToutesResasParPeriode(finPeriode);

  const totalEncaisse    = resas.reduce((s, r) => s + (r.prixTotal || 0), 0);
  const billetsConfirmes = resas.reduce((s, r) => s + (r.nbPassagers || 1), 0);
  const billetsAnnules   = annuls.reduce((s, r) => s + (r.nbPassagers || 1), 0);
  const nbBillets        = billetsConfirmes + billetsAnnules; // total billets, annulés inclus
  const montantAnnule    = annuls.reduce((s, r) => s + (r.prixTotal || 0), 0);

  setEl('finKpiEncaisse',   totalEncaisse.toLocaleString());
  setEl('finKpiBillets',    nbBillets.toLocaleString());
  setEl('finKpiAnnule',     montantAnnule.toLocaleString());
  setEl('finKpiAnnulCount', `${annuls.length} annulation${annuls.length > 1 ? 's' : ''}`);
  setEl('finKpiResa', toutesResas.length.toLocaleString());
  setEl('finKpiResa', toutesResas.length.toLocaleString());
  setElHtml('finKpiResaInfo', annuls.length > 0
    ? `sur la période · <span style="color:#FF4D6A;font-weight:600;">dont ${annuls.length} annulée${annuls.length > 1 ? 's' : ''}</span>`
    : 'sur la période');

  const noteAnnulesBillets = billetsAnnules > 0
    ? ` <span style="color:#FF4D6A;font-weight:600;">· dont ${billetsAnnules} annulé${billetsAnnules > 1 ? 's' : ''}</span>`
    : '';

  if (finPeriode === 'all') {
    setElHtml('finKpiEncaisseInfo', '');
    setElHtml('finKpiBilletsInfo', noteAnnulesBillets ? noteAnnulesBillets.trim() : 'sur la période');
  } else {
    const resasPrec = getResasPrecedentesPDV(finPeriode);
    const CAprec  = resasPrec.reduce((s, r) => s + (r.prixTotal || 0), 0);
    const bilPrec = resasPrec.reduce((s, r) => s + (r.nbPassagers || 1), 0);
    setElHtml('finKpiEncaisseInfo', cmpHtmlPDV(totalEncaisse, CAprec));
    setElHtml('finKpiBilletsInfo',  cmpHtmlPDV(nbBillets, bilPrec) + noteAnnulesBillets);
  }

  renderMeilleurTrajet(resas);
  renderImpactPDV(finPeriode);
  renderFinanceChartPDV(finPeriode);
  renderFinanceDowPDV(resas);
  renderFinanceTrajetsPDV(resas, fmt);
}

// ════════════════════════════════
//  MEILLEUR TRAJET DE LA PÉRIODE
// ════════════════════════════════
function renderMeilleurTrajet(resas) {
  const el = document.getElementById('finMeilleurTrajet');
  if (!el) return;

  if (resas.length === 0) {
    el.innerHTML = `<span style="color:var(--muted);font-size:13px;">Aucune vente sur cette période.</span>`;
    return;
  }

  const parTrajet = {};
  resas.forEach(r => {
    const key   = r.trajetId || 'inconnu';
    const label = (r.arretMontee && r.arretDescente)
      ? `${r.arretMontee} → ${r.arretDescente}`
      : (r.routeLabel || '—');
    if (!parTrajet[key]) parTrajet[key] = { label, billets: 0, montant: 0 };
    parTrajet[key].billets += (r.nbPassagers || 1);
    parTrajet[key].montant += (r.prixTotal   || 0);
  });

  const meilleur = Object.values(parTrajet).sort((a, b) => b.montant - a.montant)[0];

  el.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:36px;height:36px;border-radius:10px;background:rgba(0,229,160,0.12);border:1px solid rgba(0,229,160,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><circle cx="4" cy="13" r="2.5" stroke="var(--accent)" stroke-width="1.6"/><circle cx="14" cy="13" r="2.5" stroke="var(--accent)" stroke-width="1.6"/><path d="M2 13V6a2 2 0 012-2h6l4 4v3" stroke="var(--accent)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 2v4h4" stroke="var(--accent)" stroke-width="1.6" stroke-linecap="round"/></svg>
        </div>
        <div>
          <div style="font-size:13px;font-weight:700;color:var(--white);">${meilleur.label}</div>
          <div style="font-size:11px;color:var(--muted);margin-top:2px;">${meilleur.billets} billet${meilleur.billets > 1 ? 's' : ''} vendu${meilleur.billets > 1 ? 's' : ''}</div>
        </div>
      </div>
      <div style="text-align:right;">
        <div style="font-family:'Syne',sans-serif;font-size:15px;font-weight:800;color:var(--accent);">${meilleur.montant.toLocaleString()} XAF</div>
        <div style="font-size:10px;color:var(--muted);">sur la période</div>
      </div>
    </div>`;
}

// ════════════════════════════════
//  MODE D'EMPLOI — PDV
// ════════════════════════════════
const GUIDE_SECTIONS_PDV_AGENT = [
  { id: 'pdv-accueil', title: 'Accueil', subtitle: 'Votre activité du jour', content: `
    <p>La page d'accueil affiche un résumé de <strong>votre activité uniquement</strong> (pas celle des autres PDV de l'agence).</p>
    <p><strong>Les 4 cartes en haut :</strong></p>
    <ul>
        <li><strong>Réservations aujourd'hui</strong> — total créé aujourd'hui.</li>
        <li><strong>Vendus aujourd'hui</strong> — nombre de billets (passagers) vendus aujourd'hui.</li>
        <li><strong>Vendus ce mois</strong> — total depuis le début du mois.</li>
        <li><strong>Revenus du jour</strong> — montant encaissé aujourd'hui.</li>
    </ul>
    <p><strong>Dernières ventes</strong> — vos 5 réservations confirmées les plus récentes, cliquables pour ouvrir le détail.</p>
    <p>Le bouton <strong>"Vendre un billet"</strong> vous amène directement à l'écran de vente.</p>` },

  { id: 'pdv-vente', title: 'Vente de billets', subtitle: 'Vendre un billet en 2 étapes', content: `
    <p><strong>Étape 1 — Choisir le trajet :</strong> basculez entre Direct et Avec arrêts, cherchez ou cliquez une carte de trajet, puis sélectionnez une session de départ disponible.</p>
    <p><strong>Étape 2 — Informations passager(s) :</strong> prénom, nom, téléphone et type sont obligatoires pour le passager principal. Vous pouvez ajouter d'autres passagers sur la même réservation.</p>
    <p>Bagages et siège sont optionnels — un excédent de bagages ajoute des frais automatiquement.</p>
    <p>Un <strong>récapitulatif</strong> s'affiche avant confirmation finale — vérifiez tout avant de valider.</p>
    <div class="guide-warning-box">⚠️ Une fois confirmée, la vente n'est pas annulable immédiatement — la politique d'annulation de l'agence s'applique.</div>` },

  { id: 'pdv-reservations', title: 'Mes réservations', subtitle: 'Historique de vos ventes', content: `
    <p>Cette page liste uniquement <strong>vos réservations</strong>. Filtres par période, recherche, statut et tri disponibles.</p>
    <p><strong>Actions sur une réservation active :</strong> Modifier (une seule fois, raison obligatoire si le prix baisse) ou Annuler (remboursement selon la politique de l'agence).</p>
    <div class="guide-warning-box">⚠️ Modification et annulation sont impossibles une fois le voyage passé.</div>` },

  { id: 'pdv-trajets', title: 'Trajets disponibles', subtitle: 'Les lignes que vous pouvez vendre', content: `
    <p>Liste des trajets sur lesquels vous êtes autorisé à vendre. Bouton <strong>Détails</strong> pour voir tarifs et horaires, bouton <strong>Vendre</strong> pour lancer une vente pré-remplie.</p>
    <p>Si aucun trajet n'apparaît, contactez votre siège pour être assigné.</p>` },

  { id: 'pdv-finance', title: 'Finances', subtitle: 'Vos encaissements', content: `
    <p>Montant encaissé aujourd'hui toujours visible en haut. Filtres par période, trajet, bus et statut.</p>
    <p><strong>Trajet le plus vendu</strong>, indicateurs clés, et graphique d'activité qui s'adapte à la période choisie.</p>` },

  { id: 'pdv-monpdv', title: 'Mon point de vente', subtitle: 'Vos informations et performance', content: `
    <p>Informations de votre PDV en lecture seule — contactez le siège pour les modifier.</p>
    <p><strong>Performance (30 jours)</strong> — ventes, annulations, taux de remplissage moyen.</p>` },
];

function renderGuidePagePDV() {
  const container = document.getElementById('guideContainerPDV');
  if (!container) return;
  markGuidePDVSeen();

  container.innerHTML = `
    <div class="guide-accordion">
      ${GUIDE_SECTIONS_PDV_AGENT.map(s => `
        <div class="guide-item" id="guideItemPDV-${s.id}">
          <button class="guide-item-head" onclick="toggleGuideSectionPDV('${s.id}')">
            <div class="guide-item-text">
              <span class="guide-item-title">${s.title}</span>
              <span class="guide-item-subtitle">${s.subtitle}</span>
            </div>
          </button>
          <div class="guide-item-body" id="guideBodyPDV-${s.id}">
            <div class="guide-item-body-inner">${s.content}</div>
          </div>
        </div>
      `).join('')}
    </div>`;
}
window.renderGuidePagePDV = renderGuidePagePDV;

function toggleGuideSectionPDV(id) {
  const item = document.getElementById(`guideItemPDV-${id}`);
  const body = document.getElementById(`guideBodyPDV-${id}`);
  if (!item || !body) return;
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('#guideContainerPDV .guide-item.open').forEach(el => {
    el.classList.remove('open');
    const b = el.querySelector('.guide-item-body');
    if (b) b.style.maxHeight = null;
  });
  if (!isOpen) {
    item.classList.add('open');
    body.style.maxHeight = body.scrollHeight + 'px';
  }
}
window.toggleGuideSectionPDV = toggleGuideSectionPDV;

// ── Badge "!" ──
const GUIDE_PDV_SEEN_KEY = 'travio_pdv_guide_seen';

function guidePdvStorageKey(base) {
  const agenceId = agenceData?.id || 'default';
  return `${base}_${agenceId}`;
}

function updateGuideBadgePDV() {
  const badge = document.getElementById('drawerBadgeGuide');
  if (!badge) return;
  const seen = localStorage.getItem(guidePdvStorageKey(GUIDE_PDV_SEEN_KEY));
  badge.classList.toggle('show', !seen);
}
window.updateGuideBadgePDV = updateGuideBadgePDV;

function markGuidePDVSeen() {
  localStorage.setItem(guidePdvStorageKey(GUIDE_PDV_SEEN_KEY), '1');
  updateGuideBadgePDV();
}

// ── Modale de bienvenue — 1x/jour pendant les 3 premiers jours d'essai ──
const DUREE_ESSAI_JOURS_PDV = 12;

function getJoursRestantsEssaiPDV() {
  const essai = agenceData?.essai;
  if (!essai || !essai.actif || !essai.dateFin) return null;
  const finJour = new Date(toBrazzaDate(essai.dateFin) + 'T00:00:00Z');
  const ajdJour = new Date(toBrazzaDate(new Date().toISOString()) + 'T00:00:00Z');
  return Math.round((finJour - ajdJour) / 86400000);
}

function checkGuideWelcomeModalPDV() {
  const joursRestants = getJoursRestantsEssaiPDV();
  if (joursRestants === null) return;

  const joursEcoules = DUREE_ESSAI_JOURS_PDV - joursRestants;
  if (joursEcoules < 0 || joursEcoules > 2) return; // pas dans les 3 premiers jours

  const today = toBrazzaDate(new Date().toISOString());
  const key = guidePdvStorageKey('travio_pdv_guide_welcome_shown') + '_' + today;
  if (localStorage.getItem(key)) return; // déjà montrée aujourd'hui

  showGuideWelcomeModalPDV();
  localStorage.setItem(key, '1');
}
window.checkGuideWelcomeModalPDV = checkGuideWelcomeModalPDV;

function showGuideWelcomeModalPDV() {
  document.getElementById('guideWelcomeOverlayPDV')?.classList.add('show');
}
window.showGuideWelcomeModalPDV = showGuideWelcomeModalPDV;

function closeGuideWelcomeModalPDV() {
  document.getElementById('guideWelcomeOverlayPDV')?.classList.remove('show');
}
window.closeGuideWelcomeModalPDV = closeGuideWelcomeModalPDV;

function goToGuideFromWelcomePDV() {
  closeGuideWelcomeModalPDV();
  showPage('guide', document.querySelector('[data-page=guide]'));
}
window.goToGuideFromWelcomePDV = goToGuideFromWelcomePDV;

// ════════════════════════════════
//  NAVIGATION
// ════════════════════════════════
const PAGE_TITLES = {
  accueil:      'Accueil',
  vente:        'Vente de billets',
  reservations: 'Mes réservations',
  trajets:      'Trajets disponibles',
  monpdv:       'Mon point de vente',
  finance:      'Finances',
  guide:        'Mode d\'emploi',   // ← AJOUTER
};

function showPage(pageId, navEl) {
  document.querySelectorAll('.pdv-page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(`page-${pageId}`);
  if (page) page.classList.add('active');

  document.querySelectorAll('.drawer-nav-item').forEach(n => n.classList.remove('active'));
  if (navEl) navEl.classList.add('active');

  const title = document.getElementById('topbarPageTitle');
  if (title) title.textContent = PAGE_TITLES[pageId] || pageId;

  closeDrawer();

  // Rafraîchir la liste réservations à chaque ouverture
  if (pageId === 'reservations') filterReservations();
  if (pageId === 'monpdv') renderMonPDVPage();
  if (pageId === 'finance') renderFinancePage();
  if (pageId === 'guide') renderGuidePagePDV();
}

// ════════════════════════════════
//  DRAWER
// ════════════════════════════════
function toggleDrawer() {
  const drawer   = document.getElementById('pdvDrawer');
  const backdrop = document.getElementById('drawerBackdrop');
  if (!drawer) return;
  const isOpen = drawer.classList.contains('open');
  drawer.classList.toggle('open');
  if (backdrop) backdrop.classList.toggle('show', !isOpen);
}

function closeDrawer() {
  const drawer   = document.getElementById('pdvDrawer');
  const backdrop = document.getElementById('drawerBackdrop');
  if (drawer)   drawer.classList.remove('open');
  if (backdrop) backdrop.classList.remove('show');
}

// ════════════════════════════════
//  DÉCONNEXION
// ════════════════════════════════
async function handleLogout() {
  try {
    await signOut(auth);
    window.location.href = 'auth.html';
  } catch (err) {
    console.error(err);
    showToast('Erreur lors de la déconnexion.', ICONS.banned);
  }
}

// ════════════════════════════════
//  TOAST
// ════════════════════════════════
let toastTimer = null;

function showToast(message, icon = ICONS.warning, success = false) {
  const toast = document.getElementById('pdvToast');
  const msg   = document.getElementById('pdvToastMsg');
  const ico   = document.getElementById('pdvToastIcon');
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

// ════════════════════════════════
//  EXPOSER AU HTML
// ════════════════════════════════
window.showPage          = showPage;
window.toggleDrawer      = toggleDrawer;
window.closeDrawer       = closeDrawer;
window.handleLogout      = handleLogout;
window.showToast         = showToast;
window.onSelectTrajet    = onSelectTrajet;
window.updatePrixPreview = updatePrixPreview;
window.venteGoStep       = venteGoStep;
window.submitVente       = submitVente;
window.closeTicket       = closeTicket;
window.prefillVente      = prefillVente;
window.filterReservations = filterReservations;
window.openResaDetail    = openResaDetail;
window.closeResaDetail   = closeResaDetail;
window.setTrajetType   = setTrajetType;
window.onSegmentChange = onSegmentChange;
window.addPassager      = addPassager;
window.removePassager   = removePassager;
window.renderTrajetCardList = renderTrajetCardList;
window.pickTrajetCard       = pickTrajetCard;
window.filterTrajetCards    = filterTrajetCards;
window.toggleMoreOptions     = toggleMoreOptions;
window.showVenteRecap   = showVenteRecap;
window.closeVenteRecap  = closeVenteRecap;
window.openTrajetDetailPDV  = openTrajetDetailPDV;
window.closeTrajetDetailPDV = closeTrajetDetailPDV;
window.cancelReservation = cancelReservation;
window.closePdvAnnulConfirm   = closePdvAnnulConfirm;
window.confirmerAnnulationPdv = confirmerAnnulationPdv;
window.ouvrirListePassagersAnnulationPDV   = ouvrirListePassagersAnnulationPDV;
window.closePdvListePassagers              = closePdvListePassagers;
window.ouvrirAnnulationCompletePDV         = ouvrirAnnulationCompletePDV;
window.ouvrirConfirmationRetraitPassagerPDV = ouvrirConfirmationRetraitPassagerPDV;
window.closePdvRetraitConfirm              = closePdvRetraitConfirm;
window.confirmerRetraitPassagerPDV         = confirmerRetraitPassagerPDV;
window.toggleBilletViewPDV = toggleBilletViewPDV;
window.showManualTicket        = showManualTicket;
window.closeManualTicket       = closeManualTicket;
window.copierInfosBilletManuel = copierInfosBilletManuel;