// ─── TRAVIO — PDV — Réservations (liste, filtres, détail, annulation, retrait, modification) ───

import { apiFetch } from '../api.js';
import { escapeHtml } from '../sanitize.js';
import {
  ICONS, OFFSET_MS_FIN, toBrazzaDate,
  nomType, nomTypeResa, nomTypePassager, peuplerSelectType,
  pdvData, agenceData, trajetList, resaList,
  invalidateStatsPdvCache,
} from './state-pdv.js';
import { showToast } from './auth-init-pdv.js';
import { getDepartsForTrajet, populateFilterBus, updateFiltreHighlightPDV } from './trajets-pdv.js';

// ════════════════════════════════
//  HOOK — notifier dashboard-pdv.js qu'une réservation a changé
//  (annulation, retrait passager, modification) pour rafraîchir
//  finances / stats accueil / badges sans import circulaire
// ════════════════════════════════
const resaChangeHooks = [];
export function onResaChange(fn) {
  resaChangeHooks.push(fn);
}
function triggerResaChange() {
  resaChangeHooks.forEach(fn => fn());
}

// ════════════════════════════════
//  CHARGEMENT
// ════════════════════════════════
export async function loadReservations(pdvId, { setResaList } = {}) {
  try {
    const res  = await apiFetch(`${BACKEND_URL()}/reservations?pdvId=${pdvId}`);
    const data = await res.json();
    if (!res.ok) return;
    setResaList(data.reservations || []);
    renderResaList(resaList);
    populateFilterBus();
    updateBadgesResa();
  } catch (err) {
    console.error('Erreur réservations :', err);
    setResaList([]);
    renderResaList([]);
  }
}

// petit helper local — BACKEND est déjà dans state-pdv.js, on l'importe proprement
import { BACKEND } from './state-pdv.js';
function BACKEND_URL() { return BACKEND; }

// ════════════════════════════════
//  BADGE DRAWER (réservations du jour)
// ════════════════════════════════
export function updateBadgesResa() {
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
//  FILTRES — TRAJET / BUS
// ════════════════════════════════
export function onFilterTrajetChangePDV() {
  const trajetId = document.getElementById('filterTrajet')?.value || '';
  const busSelect = document.getElementById('filterBus');
  if (busSelect) busSelect.value = '';

  populateFilterBus(trajetId);

  ['filterTrajet', 'filterBus'].forEach(updateFiltreHighlightPDV);
  filterReservations();
}
window.onFilterTrajetChangePDV = onFilterTrajetChangePDV;

export function onFilterBusChangePDV() {
  updateFiltreHighlightPDV('filterBus');
  filterReservations();
}
window.onFilterBusChangePDV = onFilterBusChangePDV;

// ════════════════════════════════
//  RÉSERVATIONS — FILTRES / PÉRIODE / TRI
// ════════════════════════════════
let resaPeriode = 'today';
let resaCustomRange = null;
let resaSortBy  = 'date_desc';

export function setResaSort(value) {
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

export function setResaPeriode(periode, btn) {
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

export function toggleResaCustomPickerPDV() {
  const wrap = document.getElementById('resaCustomPickerWrapPDV');
  if (!wrap) return;
  wrap.style.display = wrap.style.display === 'block' ? 'none' : 'block';
}
window.toggleResaCustomPickerPDV = toggleResaCustomPickerPDV;

export function applyResaCustomRangePDV() {
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

export function clearResaCustomRangePDV() {
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
    const jourSemaine = (todayDate.getUTCDay() + 6) % 7;
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

export function filterReservations() {
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

  filtered = sortResas(filtered, resaSortBy);

  const countEl = document.getElementById('resaCountNum');
  if (countEl) countEl.textContent = filtered.length;

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
window.filterReservations = filterReservations;

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
  const jourSemaine = (d.getDay() + 6) % 7;
  lundi.setDate(d.getDate() - jourSemaine);
  const dimanche = new Date(lundi);
  dimanche.setDate(lundi.getDate() + 6);

  const moisNoms = ['jan.','fév.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
  const sameMonth = lundi.getMonth() === dimanche.getMonth();

  const debut = `${lundi.getDate()}`;
  const fin   = `${dimanche.getDate()} ${moisNoms[dimanche.getMonth()]}`;

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
    const key = dateRef.slice(0, 7);
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

export function renderResaList(list, groupMode = null) {
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
    const isAnnulee = r.statut === 'annulée';
    const initiale = isMulti
      ? nbPass.toString()
      : (r.prenomPassager?.[0]?.toUpperCase() || '?');

    const nomAffiche = isMulti
      ? `${escapeHtml(r.prenomPassager)} + ${nbPass - 1}`
      : `${escapeHtml(r.prenomPassager || '—')} ${escapeHtml(r.nomPassager || '')}`;


    const routeComplete = (r.arretMontee && r.arretDescente)
      ? `${escapeHtml(r.arretMontee)} → ${escapeHtml(r.arretDescente)}`
      : escapeHtml(routeStr);

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
    if (r.siege)       extras.push(`${ICONS.seat} ${escapeHtml(r.siege)}`);

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

  if (!groupMode) {
    container.innerHTML = list.map(renderCard).join('');
    return;
  }

  const groups = {};
  list.forEach(r => {
    const { key, label } = getGroupKeyAndLabel(r, groupMode);
    if (!groups[key]) groups[key] = { label, items: [] };
    groups[key].items.push(r);
  });

  const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

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
//  RÉSA DÉTAIL
// ════════════════════════════════
export function openResaDetail(resaId) {
  const resa = resaList.find(r => r.id === resaId);
  if (!resa) return;

  const trajet = trajetList.find(t => t.id === resa.trajetId);
  const dateStr = resa.dateDepart
    ? new Date(resa.dateDepart).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
    : '—';

  const routeBase = trajet ? `${trajet.villeDepart} → ${trajet.villeArrivee}` : (resa.routeLabel || '—');
  const routeAffichee = (resa.arretMontee && resa.arretDescente)
    ? `${escapeHtml(resa.arretMontee)} → ${escapeHtml(resa.arretDescente)}`
    : escapeHtml(routeBase);

  const nbPass  = resa.passagers?.length || 1;
  const isMulti = nbPass > 1;
  const peutModifier = peutModifierResaPDV(resa);

  const passagersHtml = isMulti ? resa.passagers.map((p, i) => `
    <div class="recap-passager-card">
      <div class="recap-passager-title">Passager ${i + 1}</div>
      <div class="recap-row"><span>Nom complet</span><strong>${escapeHtml(p.prenom || '—')} ${escapeHtml(p.nom || '')}</strong></div>
      ${p.telephone ? `<div class="recap-row"><span>Téléphone</span><strong>${escapeHtml(p.telephone)}</strong></div>` : ''}
      <div class="recap-row"><span>Type</span><strong>${nomTypePassager(p)}</strong></div>
      ${p.siege ? `<div class="recap-row"><span>Siège</span><strong>${escapeHtml(p.siege)}</strong></div>` : ''}
      ${p.bagages > 0 ? `<div class="recap-row"><span>Bagages</span><strong>${p.bagages} kg${p.nombreBagages > 0 ? ` · ${p.nombreBagages} colis` : ''}${p.prixBagages > 0 ? ` (+${Number(p.prixBagages).toLocaleString()} XAF)` : ''}</strong></div>` : ''}
      ${p.colisSoute ? `
        <div class="recap-row"><span>Colis en soute</span><strong>${escapeHtml(p.colisSoute.nature || '—')} (${Number(p.colisSoute.prix || 0).toLocaleString()} XAF)</strong></div>
        ${p.colisSoute.poids ? `<div class="recap-row"><span>Poids du colis</span><strong>${p.colisSoute.poids} kg</strong></div>` : ''}
        ${p.colisSoute.valeurDeclaree ? `<div class="recap-row"><span>Valeur déclarée</span><strong>${Number(p.colisSoute.valeurDeclaree).toLocaleString()} XAF</strong></div>` : ''}
      ` : ''}
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
            ${isMulti ? `${escapeHtml(resa.prenomPassager)} + ${nbPass - 1} passager${nbPass > 2 ? 's' : ''}` : `${escapeHtml(resa.prenomPassager)} ${escapeHtml(resa.nomPassager || '')}`}
          </div>
          <div style="font-size:12px;color:var(--muted);margin-top:3px;">${routeAffichee}</div>
        </div>
        <button onclick="closeResaDetail()" style="background:var(--surface);border:1px solid var(--border);border-radius:8px;color:var(--muted);width:30px;height:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:13px;flex-shrink:0;">${ICONS.close}</button>
      </div>

      <div class="recap-total-row">
        <span>Total encaissé</span>
        <strong>${Number(resa.prixTotal || 0).toLocaleString()} XAF</strong>
      </div>

      ${resa.passagerRetire ? `
      <div style="background:rgba(255,178,63,0.06);border:1px solid rgba(255,178,63,0.2);border-radius:12px;padding:14px 16px;margin-top:14px;">
        <div style="font-size:12px;font-weight:700;color:#FFB23F;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:6px;">${ICONS.person} Retrait de passager</div>
        ${(resa.historiqueRetraits || []).map(h => `
          <p style="font-size:12.5px;color:var(--white);line-height:1.5;margin-top:4px;">
            <strong>${escapeHtml(h.nom)}</strong> retiré le ${new Date(h.retireAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Africa/Brazzaville' })}
            — ${Number(h.montantRembourse).toLocaleString()} XAF remboursés
          </p>
        `).join('')}
      </div>` : ''}

      ${resa.reaffectee ? `
      <div style="background:rgba(77,159,255,0.06);border:1px solid rgba(77,159,255,0.2);border-radius:12px;padding:14px 16px;margin-top:14px;">
        <div style="font-size:12px;font-weight:700;color:#4D9FFF;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:6px;">${ICONS.refresh} Réservation réaffectée</div>
        <p style="font-size:12.5px;color:var(--white);line-height:1.5;">
          Déplacée de <strong>${escapeHtml(resa.ancienBusNom || '—')}</strong> vers <strong>${escapeHtml(resa.nouveauBusNom || '—')}</strong>
          le ${resa.dateReaffectation ? new Date(resa.dateReaffectation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Africa/Brazzaville' }) : '—'}.
        </p>
      </div>` : ''}

      <div style="display:flex;gap:6px;margin-top:14px;margin-bottom:14px;">
        <button class="rqf-btn active" id="resaDetailTabBtn-trajet" onclick="switchResaDetailTabPDV('trajet')">Trajet</button>
        <button class="rqf-btn" id="resaDetailTabBtn-passager" onclick="switchResaDetailTabPDV('passager')">Passager${isMulti ? 's' : ''}</button>
        <button class="rqf-btn" id="resaDetailTabBtn-billet" onclick="switchResaDetailTabPDV('billet')">Billet</button>
      </div>

      <div id="resaDetailTab-trajet">
        <div class="recap-card">
          <div class="recap-row"><span>Ligne</span><strong>${routeAffichee}</strong></div>
          <div class="recap-row"><span>Date</span><strong>${dateStr}</strong></div>
          <div class="recap-row"><span>Départ</span><strong>${resa.heureDepart || '—'}</strong></div>
          <div class="recap-row"><span>Bus</span><strong>${escapeHtml(resa.busNom || '—')}</strong></div>
          <div class="recap-row"><span>Vendu le</span><strong>${resa.createdAt ? new Date(resa.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Africa/Brazzaville' }) + ' à ' + new Date(resa.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Brazzaville' }) : '—'}</strong></div>
          <div class="recap-row"><span>Embarquement</span><strong>${escapeHtml(resa.pdvEmbarquementNom || '—')}${(resa.arretMontee || trajet?.villeDepart) ? ' (' + escapeHtml(resa.arretMontee || trajet?.villeDepart) + ')' : ''}</strong></div>
          <div class="recap-row"><span>Débarquement</span><strong>${escapeHtml(resa.pdvDebarquementNom || '—')}${(resa.arretDescente || trajet?.villeArrivee) ? ' (' + escapeHtml(resa.arretDescente || trajet?.villeArrivee) + ')' : ''}</strong></div>
          ${isMulti ? `<div class="recap-row"><span>Passagers</span><strong>${nbPass} personnes</strong></div>` : ''}
        </div>
        ${resa.remarques ? `
        <div class="recap-section-title" style="margin-top:14px;">Remarques</div>
        <div class="recap-card"><div class="recap-row" style="display:block;"><span>${escapeHtml(resa.remarques)}</span></div></div>` : ''}
      </div>

      <div id="resaDetailTab-passager" style="display:none;">
        ${isMulti ? passagersHtml : `
        <div class="recap-card">
          <div class="recap-row"><span>Nom complet</span><strong>${escapeHtml(resa.prenomPassager || '—')} ${escapeHtml(resa.nomPassager || '')}</strong></div>
          <div class="recap-row"><span>Téléphone</span><strong>${escapeHtml(resa.telephonePassager || '—')}</strong></div>
          <div class="recap-row"><span>Type</span><strong>${nomTypeResa(resa)}</strong></div>
          ${resa.siege ? `<div class="recap-row"><span>Siège</span><strong>${escapeHtml(resa.siege)}</strong></div>` : ''}
          ${resa.bagages > 0 ? `<div class="recap-row"><span>Bagages</span><strong>${resa.bagages} kg${resa.nombreBagages > 0 ? ` · ${resa.nombreBagages} colis` : ''}${resa.prixBagages > 0 ? ` (+${Number(resa.prixBagages).toLocaleString()} XAF)` : ''}</strong></div>` : ''}
          ${resa.passagers?.[0]?.colisSoute ? `
            <div class="recap-row"><span>Colis en soute</span><strong>${escapeHtml(resa.passagers[0].colisSoute.nature || '—')} (${Number(resa.passagers[0].colisSoute.prix || 0).toLocaleString()} XAF)</strong></div>
            ${resa.passagers[0].colisSoute.poids ? `<div class="recap-row"><span>Poids du colis</span><strong>${resa.passagers[0].colisSoute.poids} kg</strong></div>` : ''}
            ${resa.passagers[0].colisSoute.valeurDeclaree ? `<div class="recap-row"><span>Valeur déclarée</span><strong>${Number(resa.passagers[0].colisSoute.valeurDeclaree).toLocaleString()} XAF</strong></div>` : ''}
          ` : ''}
          </div>`}
      </div>

      <div id="resaDetailTab-billet" style="display:none;">
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
      </div>

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
window.openResaDetail = openResaDetail;

function switchResaDetailTabPDV(tab) {
  ['trajet', 'passager', 'billet'].forEach(t => {
    const panel = document.getElementById(`resaDetailTab-${t}`);
    const btn   = document.getElementById(`resaDetailTabBtn-${t}`);
    if (panel) panel.style.display = t === tab ? '' : 'none';
    if (btn)   btn.classList.toggle('active', t === tab);
  });
}
window.switchResaDetailTabPDV = switchResaDetailTabPDV;

export function closeResaDetail() {
  const overlay = document.getElementById('resaDetailOverlay');
  if (overlay) {
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    setTimeout(() => overlay.remove(), 350);
  }
}
window.closeResaDetail = closeResaDetail;

// ════════════════════════════════
//  ANNULATION
// ════════════════════════════════
export function cancelReservation(resaId) {
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
window.cancelReservation = cancelReservation;

export function ouvrirAnnulationCompletePDV(resaId) {
  const r = resaList.find(r => r.id === resaId);
  if (!r) return;

  const politique = agenceData?.politiqueAnnulation;
  const OFFSET_MS = 1 * 60 * 60 * 1000;

  if (r.dateDepart && r.heureDepart) {
    const departInstant = new Date(`${r.dateDepart}T${r.heureDepart}:00Z`).getTime() - OFFSET_MS;
    if (departInstant < Date.now()) {
      showToast('Ce voyage a déjà eu lieu — annulation impossible.', ICONS.banned);
      return;
    }
  }

  if (!politique || !politique.autorise) {
    showToast('Vente définitive — annulation impossible.', ICONS.banned);
    return;
  }

  let horsDelai = false;
  if (politique.delaiHeures && r.dateDepart && r.heureDepart) {
    const departInstant = new Date(`${r.dateDepart}T${r.heureDepart}:00Z`).getTime() - OFFSET_MS;
    const diffHeures    = (departInstant - Date.now()) / (1000 * 60 * 60);
    if (diffHeures < politique.delaiHeures) horsDelai = true;
  }

  const prixTotal = Number(r.prixTotal || 0);
  let fraisPct = 0, frais = prixTotal, rembourse = 0;

  if (politique.remboursement && !horsDelai) {
    fraisPct = politique.precisions || 0;
    frais    = Math.round(prixTotal * fraisPct / 100);
    rembourse = prixTotal - frais;
  }

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
        <div style="font-size:13px;font-weight:600;color:var(--white);">${escapeHtml(r.prenomPassager || '')} ${escapeHtml(r.nomPassager || '')}</div>
        <div style="font-size:12px;color:var(--muted);margin-top:3px;">${escapeHtml(r.routeLabel || '—')} · ${r.dateDepart || '—'} à ${r.heureDepart || '—'}</div>  
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
window.ouvrirAnnulationCompletePDV = ouvrirAnnulationCompletePDV;

export function closePdvAnnulConfirm() {
  const o = document.getElementById('pdvAnnulConfirmOverlay');
  if (o) {
    o.style.opacity      = '0';
    o.style.pointerEvents = 'none';
    setTimeout(() => o.remove(), 350);
  }
}
window.closePdvAnnulConfirm = closePdvAnnulConfirm;

// ════════════════════════════════
//  RETRAIT D'UN PASSAGER
// ════════════════════════════════
export function ouvrirListePassagersAnnulationPDV(resaId) {
  const r = resaList.find(r => r.id === resaId);
  if (!r) return;

  const existing = document.getElementById('pdvListePassagersOverlay');
  if (existing) existing.remove();

  const nbPass = r.passagers?.length || 0;

  const rowsHTML = (r.passagers || []).map((p, i) => `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;background:var(--surface);border:1px solid var(--border);border-radius:11px;padding:12px 14px;margin-bottom:8px;">
      <div>
        <div style="font-size:13px;font-weight:600;color:var(--white);">${escapeHtml(p.prenom || '')} ${escapeHtml(p.nom || '')}</div>
        <div style="font-size:11.5px;color:var(--muted);margin-top:2px;">
          ${nomType(p.type)}${p.siege ? ' · Siège ' + escapeHtml(p.siege) : ''} · ${Number(p.sousTotal || 0).toLocaleString()} XAF
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
          <div style="font-size:12px;color:var(--muted);margin-top:3px;">${escapeHtml(r.routeLabel || '—')} · ${r.dateDepart || '—'} à ${r.heureDepart || '—'}</div>
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
window.ouvrirListePassagersAnnulationPDV = ouvrirListePassagersAnnulationPDV;

export function closePdvListePassagers() {
  const o = document.getElementById('pdvListePassagersOverlay');
  if (o) { o.style.opacity = '0'; o.style.pointerEvents = 'none'; setTimeout(() => o.remove(), 350); }
}
window.closePdvListePassagers = closePdvListePassagers;

export function ouvrirConfirmationRetraitPassagerPDV(resaId, passagerIndex) {
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
        <div style="font-size:13px;font-weight:600;color:var(--white);">Vous voulez retirer ${escapeHtml(p.prenom || '')} ${escapeHtml(p.nom || '')} du trajet ${escapeHtml(r.routeLabel || '—')}.</div>
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
window.ouvrirConfirmationRetraitPassagerPDV = ouvrirConfirmationRetraitPassagerPDV;

export function closePdvRetraitConfirm() {
  const o = document.getElementById('pdvRetraitConfirmOverlay');
  if (o) { o.style.opacity = '0'; o.style.pointerEvents = 'none'; setTimeout(() => o.remove(), 350); }
}
window.closePdvRetraitConfirm = closePdvRetraitConfirm;

export async function confirmerRetraitPassagerPDV(resaId, passagerIndex) {
  const btn = document.querySelector('#pdvRetraitConfirmOverlay button[onclick^="confirmerRetraitPassagerPDV"]');
  if (btn) { btn.disabled = true; btn.textContent = 'Retrait en cours...'; }

  try {
    const res = await apiFetch(`${BACKEND}/reservations/${resaId}/retirer-passager`, {
      method: 'PATCH',
      body: JSON.stringify({ passagerIndex }),
    });
    const data = await res.json();
    if (!res.ok) { showToast('Erreur retrait passager.', ICONS.banned); return; }

    const idx = resaList.findIndex(r => r.id === resaId);
    if (idx !== -1) resaList[idx] = { ...resaList[idx], ...data.reservation };
    invalidateStatsPdvCache();

    closePdvRetraitConfirm();

    const r = resaList[idx];
    if (r && (r.passagers?.length || 0) >= 1) {
      ouvrirListePassagersAnnulationPDV(resaId);
    } else {
      closePdvListePassagers();
      closeResaDetail();
    }

    filterReservations();
    triggerResaChange();
    showToast('Passager retiré avec succès.', ICONS.check, true);

  } catch (err) {
    console.error('Erreur retrait passager :', err);
    showToast('Impossible de contacter le serveur.', ICONS.banned);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = `${ICONS.banned} Confirmer le retrait`; }
  }
}
window.confirmerRetraitPassagerPDV = confirmerRetraitPassagerPDV;

export async function confirmerAnnulationPdv(resaId) {
  const btn = document.getElementById('pdvAnnulBtnConfirm');
  if (btn) { btn.disabled = true; btn.textContent = 'Annulation en cours...'; }

  try {
    const res = await apiFetch(`${BACKEND}/reservations/${resaId}/annuler`, {
      method:  'PATCH',
      body:    JSON.stringify({ pdvId: pdvData.id }),
    });
    const data = await res.json();

    if (!res.ok) {
      showToast('Erreur annulation.', ICONS.banned);
      return;
    }

    const idx = resaList.findIndex(r => r.id === resaId);
    if (idx !== -1) resaList[idx].statut = 'annulée';
    invalidateStatsPdvCache();

    closePdvAnnulConfirm();
    closeResaDetail();
    filterReservations();
    triggerResaChange();
    showToast('Réservation annulée avec succès.', ICONS.check, true);

  } catch (err) {
    console.error('Erreur annulation :', err);
    showToast('Impossible de contacter le serveur.', ICONS.banned);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = `${ICONS.banned} Confirmer l'annulation`; }
  }
}
window.confirmerAnnulationPdv = confirmerAnnulationPdv;

// ════════════════════════════════
//  MODIFICATION
// ════════════════════════════════
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

export function handleModifierResa(resaId) {
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
          <div class="vente-field-group"><label>Prénom</label><input type="text" class="vente-input" id="modifPrenom_${i}" value="${escapeHtml(p.prenom || '')}"></div>
          <div class="vente-field-group"><label>Nom</label><input type="text" class="vente-input" id="modifNom_${i}" value="${escapeHtml(p.nom || '')}"></div>
          <div class="vente-field-group"><label>Téléphone</label><input type="text" class="vente-input" id="modifTel_${i}" value="${escapeHtml(p.telephone || '')}"></div>
          <div class="vente-field-group"><label>Type de billet</label><select class="vente-select modif-passager-type" id="modifType_${i}" onchange="recalculerTotalModif()"></select></div>
        </div>`).join('')
    : `
        <div class="vente-field-group"><label>Prénom</label><input type="text" class="vente-input" id="modifPrenom" value="${escapeHtml(r.prenomPassager || '')}"></div>
        <div class="vente-field-group"><label>Nom</label><input type="text" class="vente-input" id="modifNom" value="${escapeHtml(r.nomPassager || '')}"></div>
        <div class="vente-field-group"><label>Téléphone</label><input type="text" class="vente-input" id="modifTel" value="${escapeHtml(r.telephonePassager || '')}"></div>
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
        <div class="recap-row"><span>Ville de montée</span><strong>${escapeHtml(r.arretMontee || trajet?.villeDepart || '—')}</strong></div>
        <div class="vente-field-group" style="margin-top:10px;"><label>Lieu d'embarquement</label><select class="vente-select" id="modifPdvEmbarquement"></select></div>
        <div class="vente-field-group"><label>Ville de descente</label><select class="vente-select" id="modifDescente" onchange="onDescenteModifChange();recalculerTotalModif()"></select></div>
        <div class="vente-field-group"><label>Lieu de débarquement</label><select class="vente-select" id="modifPdvDebarquement"></select></div>
      </div>
      <div class="vente-field-group"><label>Bagages (kg)</label><input type="number" class="vente-input" id="modifBagages" value="${r.bagages || 0}" min="0" oninput="recalculerTotalModif()"></div>
      <div class="vente-field-group"><label>Remarques</label><input type="text" class="vente-input" id="modifRemarques" value="${escapeHtml(r.remarques || '')}"></div>
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
window.handleModifierResa = handleModifierResa;

export function closeModifierResa() {
  const o = document.getElementById('modifierResaOverlay');
  if (o) { o.style.opacity = '0'; o.style.pointerEvents = 'none'; setTimeout(() => o.remove(), 300); }
}
window.closeModifierResa = closeModifierResa;

export function onDescenteModifChange() {
  const trajet = window._modifTrajetCourant;
  const descenteVal = document.getElementById('modifDescente')?.value;
  const selDeb = document.getElementById('modifPdvDebarquement');
  if (!selDeb || !trajet) return;
  const pdvs = getPdvsAtPointPDV(trajet, descenteVal);
  selDeb.innerHTML = pdvs.length > 0
    ? pdvs.map(p => `<option value="${p.id}" data-nom="${p.nom||''}" data-ville="${p.ville||''}">${p.nom}${p.ville ? ' — '+p.ville : ''}</option>`).join('')
    : `<option value="">Aucun point de vente à ce lieu</option>`;
}
window.onDescenteModifChange = onDescenteModifChange;

export function recalculerTotalModif() {
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
window.recalculerTotalModif = recalculerTotalModif;

export async function confirmerModificationResa(resaId) {
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
    if (!res.ok) { showToast('Erreur modification.', ICONS.banned); return; }

    const idx = resaList.findIndex(r => r.id === resaId);
    if (idx !== -1) resaList[idx] = { ...resaList[idx], ...data.reservation };
    invalidateStatsPdvCache();

    closeModifierResa();
    closeResaDetail();
    filterReservations();
    triggerResaChange();
    showToast('Réservation modifiée avec succès.', ICONS.check, true);
  } catch (err) {
    console.error('Erreur modification réservation :', err);
    showToast('Impossible de contacter le serveur.', ICONS.banned);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Enregistrer les modifications'; }
  }
}
window.confirmerModificationResa = confirmerModificationResa;