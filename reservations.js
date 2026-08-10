// ─── TRAVIO — Réservations ───

import { BACKEND, resaList, setResaList, resaListFiltree, setResaListFiltree, pdvList, trajetList } from './state.js';
import { estPdvInactif, getDerniereVentePdv, formatDerniereVente } from './pdv-utils.js';
import { showToast, TOAST_ICONS } from './toast-utils.js';
import { updateOverviewStats, loadDeparts, loadAllDeparts } from './trajets.js';
import { agenceData } from './state.js';
import { apiFetch } from './api.js';
import { escapeHtml, escapeJsAttr } from './sanitize.js';

const ICONS = {
  close:   '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  down:    '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:4px;"><path d="M8 2v9M4 8l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  building:'<svg width="14" height="14" viewBox="0 0 26 26" fill="none" style="vertical-align:-2px;margin-right:4px;"><rect x="5" y="9" width="16" height="14" rx="1.5" stroke="currentColor" stroke-width="1.8"/><path d="M9 3h8v6H9z" stroke="currentColor" stroke-width="1.8"/><path d="M9 13h2M9 17h2M15 13h2M15 17h2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  warning: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:4px;"><path d="M8 2L1 14h14L8 2z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M8 6.5v3.5M8 12v.1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  dot:     '<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#FF4D6A;margin-right:5px;vertical-align:middle;"></span>',
  person:  '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:4px;"><circle cx="8" cy="6" r="3" stroke="currentColor" stroke-width="1.4"/><path d="M2 15a6 6 0 0112 0" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  banned:  '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:4px;"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.5"/><path d="M4 4l8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  impression: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:4px;"><path d="M4 6V2h8v4M3 6h10a1 1 0 011 1v4a1 1 0 01-1 1h-2v2H5v-2H3a1 1 0 01-1-1V7a1 1 0 011-1z" stroke="currentColor"stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><rect x="5" y="10" width="6" height="4" stroke="currentColor" stroke-width="1.2"/></svg>',
  refresh: '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:3px;"><path d="M13 8A5 5 0 103 8M13 8V4M13 8H9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

let resaPeriode = 'all';
let resaCustomRange = null; // { debut, fin } ou null

export function getResaPeriodeActuelle() {
  return { periode: resaPeriode, custom: resaCustomRange };
}

export function setResaPeriode(periode, btn) {
  resaPeriode = periode;
  resaCustomRange = null;
  const wrap = document.getElementById('resaCustomPickerWrap');
  if (wrap) wrap.style.display = 'none';
  document.querySelectorAll('#resaPeriodeFilters .rqf-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  applyResaFiltres();
  updateResaPeriodeLabel();
}

export function toggleResaCustomPicker() {
  const wrap = document.getElementById('resaCustomPickerWrap');
  if (!wrap) return;
  wrap.style.display = wrap.style.display === 'block' ? 'none' : 'block';
}

export function applyResaCustomRange() {
  const debut = document.getElementById('resaCustomDebut')?.value;
  const fin   = document.getElementById('resaCustomFin')?.value;
  if (!debut || !fin) { showToast('Sélectionnez les deux dates.', TOAST_ICONS.warning); return; }
  if (debut > fin) { showToast('La date de début doit précéder la date de fin.', TOAST_ICONS.warning); return; }

  resaCustomRange = { debut, fin };
  document.querySelectorAll('#resaPeriodeFilters .rqf-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('resaCustomBtn')?.classList.add('active');
  document.getElementById('resaCustomPickerWrap').style.display = 'none';
  applyResaFiltres();
  updateResaPeriodeLabel();
}

export function clearResaCustomRange() {
  resaCustomRange = null;
  document.getElementById('resaCustomPickerWrap').style.display = 'none';
  document.getElementById('resaCustomBtn')?.classList.remove('active');
  resaPeriode = 'all';
  document.querySelectorAll('#resaPeriodeFilters .rqf-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('#resaPeriodeFilters .rqf-btn:nth-child(4)')?.classList.add('active');
  applyResaFiltres();
  updateResaPeriodeLabel();
}

function updateResaPeriodeLabel() {
  const el = document.getElementById('resaPeriodeLabel');
  if (!el) return;

  const iconCal = '<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M5 1v4M11 1v4M2 7h12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

  const fmtLong  = (str) => new Date(str + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const fmtShort = (str) => new Date(str + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

  if (resaCustomRange) {
    const d = fmtLong(resaCustomRange.debut);
    const f = fmtLong(resaCustomRange.fin);
    el.innerHTML = resaCustomRange.debut === resaCustomRange.fin
      ? `${iconCal} ${d}`
      : `${iconCal} Du ${d} au ${f}`;
    return;
  }

  const { debut, fin } = getResaBornesEffectives();

  if (resaPeriode === 'today') {
    el.innerHTML = `${iconCal} Aujourd'hui · ${fmtLong(debut)}`;
  } else if (resaPeriode === 'week') {
    el.innerHTML = `${iconCal} Cette semaine · Du ${fmtShort(debut)} au ${fmtLong(fin)}`;
  } else if (resaPeriode === 'month') {
    el.innerHTML = `${iconCal} Ce mois-ci · Du ${fmtShort(debut)} au ${fmtLong(fin)}`;
  } else {
    el.innerHTML = `${iconCal} Toutes les périodes`;
  }
}

function getResaBornesEffectives() {
  if (resaCustomRange) return { debut: resaCustomRange.debut, fin: resaCustomRange.fin };
  const nowBrazza  = Date.now() + OFFSET_MS; // ajuste UTC -> heure Brazzaville
  const todayDate  = new Date(nowBrazza);
  const today      = todayDate.toISOString().split('T')[0];

  if (resaPeriode === 'today') return { debut: today, fin: today };

  if (resaPeriode === 'week') {
    // Lundi de la semaine en cours -> aujourd'hui
    const jourSemaine = (todayDate.getUTCDay() + 6) % 7; // 0 = lundi
    const lundi = new Date(todayDate.getTime() - jourSemaine * 86400000);
    return { debut: lundi.toISOString().split('T')[0], fin: today };
  }

  if (resaPeriode === 'month') {
    // 1er jour du mois en cours -> aujourd'hui
    const premierJour = new Date(Date.UTC(todayDate.getUTCFullYear(), todayDate.getUTCMonth(), 1));
    return { debut: premierJour.toISOString().split('T')[0], fin: today };
  }

  return { debut: null, fin: null }; // 'all'
}

function getResaGroupMode() {
  if (resaCustomRange) {
    const jours = Math.round((new Date(resaCustomRange.fin) - new Date(resaCustomRange.debut)) / 86400000) + 1;
    if (jours <= 31)  return 'jour';
    if (jours <= 120) return 'semaine';
    return 'mois';
  }
  if (resaPeriode === 'today' || resaPeriode === 'week') return 'jour';
  if (resaPeriode === 'month') return 'semaine';
  return 'mois'; // all
}

function nomTypeResa(r) {
  return r.typeBilletNom || (r.typeBillet === 'enfant' ? 'Enfant' : 'Adulte');
}
function nomTypePassager(p) {
  return p.typeNom || (p.type === 'enfant' ? 'Enfant' : 'Adulte');
}

const OFFSET_MS = 1 * 60 * 60 * 1000;

function toBrazzaDate(isoStr) {
  if (!isoStr) return '';
  return new Date(new Date(isoStr).getTime() + OFFSET_MS).toISOString().split('T')[0];
}

function peutModifierResa(r) {
  if (r.statut === 'annulée') return false;
  if (r.dateDepart) {
    const departInstant = new Date(`${r.dateDepart}T${r.heureDepart || '23:59'}:00Z`).getTime() - OFFSET_MS;
    if (departInstant < Date.now()) return false;
  }
  return true;
}

function getTypeTrajetInfo(trajet) {
  const avecArret = Array.isArray(trajet?.arrets) && trajet.arrets.length > 0;
  return avecArret
    ? { label: 'Avec arrêt', icon: '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#FFB23F;margin-right:4px;vertical-align:middle;"></span>', cls: 'trajet-type-arret' }
    : { label: 'Direct',     icon: '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#00E5A0;margin-right:4px;vertical-align:middle;"></span>', cls: 'trajet-type-direct' }
}

// ════════════════════════════════
//  RÉSERVATIONS — CHARGEMENT
// ════════════════════════════════
export async function loadReservationsAgence(agenceId) {
  try {
    const res  = await apiFetch(`${BACKEND}/reservations/agence?agenceId=${agenceId}`)
    const data = await res.json();
    if (!res.ok) { setResaList([]); return; }
    setResaList(data.reservations || []);
    initResaFiltres();
    applyResaFiltres();
    updateOverviewStats();
  } catch (err) {
    console.error('Erreur chargement réservations agence :', err);
    setResaList([]);
  }
}

// ════════════════════════════════
//  RÉSERVATIONS — INIT FILTRES
// ════════════════════════════════
function initResaFiltres() {
  const pdvSelect    = document.getElementById('resaFiltrePdv');
  const trajetSelect = document.getElementById('resaFiltreTrajet');
  if (!pdvSelect || !trajetSelect) return;

  // Liste des villes, extraite des PDV de l'agence
  const villeSelect = document.getElementById('resaFiltreVille');
  if (villeSelect) {
    const villes = [...new Set(pdvList.map(p => p.ville).filter(Boolean))].sort();
    villeSelect.innerHTML = `<option value="">Toutes les villes</option>` +
      villes.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('');
  }

  // CASCADE — PDV / Trajet / Bus démarrent non filtrés
  populatePdvSelectCascade('');
  populateTrajetSelectCascade('', '');
  populateBusSelectCascade('');

  document.getElementById('resaFiltreVille')?.addEventListener('change', onVilleFiltreChange);
  document.getElementById('resaFiltrePdv')?.addEventListener('change', onPdvFiltreChange);
  document.getElementById('resaFiltreTrajet')?.addEventListener('change', onTrajetFiltreChange);
  document.getElementById('resaFiltreBus')?.addEventListener('change', () => { updateFiltreHighlight('resaFiltreBus'); applyResaFiltres(); });
  document.getElementById('resaFiltreStatut')?.addEventListener('change', () => { updateFiltreHighlight('resaFiltreStatut'); applyResaFiltres(); });
  document.getElementById('resaRecherche')?.addEventListener('input', applyResaFiltres);
}

// ════════════════════════════════
//  RÉSERVATIONS — FILTRES EN CASCADE
// ════════════════════════════════
function updateFiltreHighlight(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('filtre-actif', !!el.value);
}

function populatePdvSelectCascade(ville) {
  const pdvSelect = document.getElementById('resaFiltrePdv');
  if (!pdvSelect) return;
  const pdvsFiltres = ville ? pdvList.filter(p => p.ville === ville) : pdvList;
  pdvSelect.innerHTML = `<option value="">Tous les PDV</option>` +
    pdvsFiltres.map(p => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.nom)}</option>`).join('');
}

function populateTrajetSelectCascade(pdvId, ville) {
  const trajetSelect = document.getElementById('resaFiltreTrajet');
  if (!trajetSelect) return;
  let trajetsFiltres = trajetList;
  if (pdvId) {
    trajetsFiltres = trajetsFiltres.filter(t => {
      const ids = [
        ...(t.pdvDepart  || []).map(p => p.id),
        ...(t.pdvArrets  || []).map(p => p.id),
        ...(t.pdvArrivee || []).map(p => p.id),
      ];
      return ids.includes(pdvId);
    });
  } else if (ville) {
    trajetsFiltres = trajetsFiltres.filter(t => {
      const pdvs = [
        ...(t.pdvDepart  || []),
        ...(t.pdvArrets  || []),
        ...(t.pdvArrivee || []),
      ];
      return pdvs.some(p => p.ville === ville);
    });
  }
  trajetSelect.innerHTML = `<option value="">Tous les trajets</option>` +
    trajetsFiltres.map(t => {
      const info = getTypeTrajetInfo(t);
      return `<option value="${escapeHtml(t.id)}">${escapeHtml(t.villeDepart)} → ${escapeHtml(t.villeArrivee)} · ${info.label}</option>`;
    }).join('');
}

async function populateBusSelectCascade(trajetId) {
  const busSelect = document.getElementById('resaFiltreBus');
  if (!busSelect) return;
  busSelect.innerHTML = `<option value="">Tous les bus</option>`;

  try {
    const departs = trajetId
      ? await loadDeparts(trajetId)           // utilise le cache par trajet
      : await loadAllDeparts(agenceData.id);  // utilise le cache global agence

    const busNoms = [...new Set(departs.map(d => d.busNom).filter(Boolean))].sort();
    busSelect.innerHTML = `<option value="">Tous les bus</option>` +
      busNoms.map(nom => `<option value="${escapeHtml(nom)}">${escapeHtml(nom)}</option>`).join('') +
      `<option value="__supprimes__">— Bus supprimés —</option>`;
  } catch (err) {
    console.error('Erreur chargement bus filtre réservations :', err);
  }
}

function onVilleFiltreChange() {
  const ville = document.getElementById('resaFiltreVille')?.value || '';

  document.getElementById('resaFiltrePdv').value    = '';
  document.getElementById('resaFiltreTrajet').value = '';
  document.getElementById('resaFiltreBus').value     = '';

  populatePdvSelectCascade(ville);
  populateTrajetSelectCascade('', ville);
  populateBusSelectCascade('');

  ['resaFiltreVille','resaFiltrePdv','resaFiltreTrajet','resaFiltreBus'].forEach(updateFiltreHighlight);
  applyResaFiltres();
}

function onPdvFiltreChange() {
  const pdvId = document.getElementById('resaFiltrePdv')?.value || '';
  const ville = document.getElementById('resaFiltreVille')?.value || '';

  document.getElementById('resaFiltreTrajet').value = '';
  document.getElementById('resaFiltreBus').value     = '';

  populateTrajetSelectCascade(pdvId, ville);
  populateBusSelectCascade('');

  ['resaFiltrePdv','resaFiltreTrajet','resaFiltreBus'].forEach(updateFiltreHighlight);
  applyResaFiltres();
}

function onTrajetFiltreChange() {
  const trajetId = document.getElementById('resaFiltreTrajet')?.value || '';

  document.getElementById('resaFiltreBus').value = '';

  populateBusSelectCascade(trajetId);

  ['resaFiltreTrajet','resaFiltreBus'].forEach(updateFiltreHighlight);
  applyResaFiltres();
}

// ════════════════════════════════
//  RÉSERVATIONS — FILTRES
// ════════════════════════════════
export function applyResaFiltres() {
  updateResaPeriodeLabel();
  const pdvId     = document.getElementById('resaFiltrePdv')?.value    || '';
  const trajetId  = document.getElementById('resaFiltreTrajet')?.value || '';
  const statut    = document.getElementById('resaFiltreStatut')?.value || '';
  const busNom    = document.getElementById('resaFiltreBus')?.value    || '';
  const ville     = document.getElementById('resaFiltreVille')?.value  || '';
  const recherche = (document.getElementById('resaRecherche')?.value || '').toLowerCase().trim();

  const { debut, fin } = getResaBornesEffectives();

  setResaListFiltree(resaList.filter(r => {
    if (pdvId    && r.pdvId    !== pdvId)    return false;
    if (trajetId && r.trajetId !== trajetId) return false;
    if (statut === 'retrait' && !r.passagerRetire) return false;
    if (statut === 'reaffectee' && !r.reaffectee) return false;
    if (statut && statut !== 'retrait' && statut !== 'reaffectee' && r.statut !== statut) return false;
    if (busNom === '__supprimes__' && !r.busSupprime) return false;
    if (busNom && busNom !== '__supprimes__' && r.busNom !== busNom) return false;

    if (ville) {
      const pdvResa   = pdvList.find(p => p.id === r.pdvId);
      const villeResa = r.pdvEmbarquementVille || pdvResa?.ville || '';
      if (villeResa !== ville) return false;
    }

    const d = toBrazzaDate(r.createdAt);
    if (debut && d < debut) return false;
    if (fin   && d > fin)   return false;

    if (recherche) {
      const nomComplet = `${r.prenomPassager || ''} ${r.nomPassager || ''}`.toLowerCase();
      const tel        = (r.telephonePassager || '').toLowerCase();
      if (!nomComplet.includes(recherche) && !tel.includes(recherche)) return false;
    }
    return true;
  }));

  renderResaStats();
  renderResaAlertes();
  renderResaList(getResaGroupMode());
}

// ════════════════════════════════
//  RÉSERVATIONS — STATS (calcul centralisé, réutilisé par page ET rapports)
// ════════════════════════════════
export function calculerStatsResa(liste) {
  const total      = liste.length;
  const confirmees = liste.filter(r => r.statut !== 'annulée');
  const annulees   = liste.filter(r => r.statut === 'annulée');
  const tauxAnnul  = total > 0 ? Math.round((annulees.length / total) * 100) : 0;

  const pdvVendeursIds = new Set(confirmees.map(r => r.pdvId));

  const nbPassagersAnnules = annulees.reduce((s, r) => s + (r.nbPassagers || 1), 0);
  const totalPassagers     = liste.reduce((s, r) => s + (r.nbPassagers || 1), 0); 
  const baisseCount        = liste.filter(r => r.baisseNonVerifiee === true).length;
  const totalRetraits      = liste.reduce((s, r) => s + (r.historiqueRetraits?.length || 0), 0);
  const reaffecteesCount   = liste.filter(r => r.reaffectee === true).length;

  const maintenant = Date.now();
  const dejaTransportes = confirmees.filter(r => {
    if (!r.dateDepart) return false;
    const departInstant = new Date(`${r.dateDepart}T${r.heureDepart || '23:59'}:00Z`).getTime() - OFFSET_MS;
    return departInstant < maintenant;
  });
  const totalDejaTransportes = dejaTransportes.reduce((s, r) => s + (r.nbPassagers || 1), 0);

  const revenuBrut            = confirmees.reduce((s, r) => s + Number(r.prixTotal || 0), 0);
  const fraisRetenusAnnulees  = annulees.reduce((s, r) => s + Number(r.fraisRetenus || 0), 0);
  const montantRembourseTotal = annulees.reduce((s, r) => s + Number(r.montantRembourse || 0), 0);
  const revenuNet             = revenuBrut + fraisRetenusAnnulees;
  const prixMoyen             = confirmees.length > 0 ? Math.round(revenuBrut / confirmees.length) : 0;

  return {
    total, confirmees: confirmees.length, annulees: annulees.length, tauxAnnul,
    pdvActifs: pdvVendeursIds.size,
    nbPassagersAnnules, totalPassagers, baisseCount, totalRetraits, reaffecteesCount,
    totalDejaTransportes,
    revenuBrut, fraisRetenusAnnulees, montantRembourseTotal, revenuNet, prixMoyen,
  };
}

function renderResaStats() {
  const s = calculerStatsResa(resaListFiltree);
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.innerHTML = val; };

  const filtreStatut = document.getElementById('resaFiltreStatut')?.value || '';
  const filtreEstAnnulee = filtreStatut === 'annulée';

  setEl('resaStatTotal',      s.total.toLocaleString());
  setEl('resaStatTotalInfo', (s.annulees > 0 && !filtreEstAnnulee)
  ? `sur la période · <span style="color:#FF4D6A;font-weight:600;">dont ${s.annulees} annulée${s.annulees > 1 ? 's' : ''}</span>`
  : 'sur la période');

  setEl('resaStatAnnulTaux',  s.tauxAnnul + '%');
  setEl('resaStatAnnulInfo', `${s.annulees} réservation${s.annulees > 1 ? 's' : ''} · ${s.nbPassagersAnnules} passager${s.nbPassagersAnnules > 1 ? 's' : ''}`);
  setEl('resaStatPdvActifs',  `${s.pdvActifs} / ${pdvList.length}`);
  setEl('resaStatBaisse', s.baisseCount.toLocaleString());
  setEl('resaStatPassagers', s.totalPassagers.toLocaleString());
  setEl('resaStatPassagersInfo', (s.nbPassagersAnnules > 0 && !filtreEstAnnulee)
  ? `sur la période · <span style="color:#FF4D6A;font-weight:600;">dont ${s.nbPassagersAnnules} annulé${s.nbPassagersAnnules > 1 ? 's' : ''}</span>`
  : 'sur la période');
  setEl('resaStatDejaTransportes', s.totalDejaTransportes.toLocaleString());
  setEl('resaStatRetraits', s.totalRetraits.toLocaleString());
  setEl('resaStatReaffectees', s.reaffecteesCount.toLocaleString());

  const tauxEl = document.getElementById('resaStatAnnulTaux');
  if (tauxEl) tauxEl.style.color = s.tauxAnnul >= 10 ? '#FF4D6A' : s.tauxAnnul >= 5 ? '#FFB23F' : 'var(--white)';
}

// ════════════════════════════════
//  RÉSERVATIONS — ALERTES
// ════════════════════════════════
function renderResaAlertes() {
  const wrap = document.getElementById('resaAlertesWrap');
  if (!wrap) return;

  // 1. PDV inactifs depuis 5 jours
  const pdvInactifs = pdvList.filter(p => p.actif && estPdvInactif(p.id, resaList));

  // 2. Trajets sous 5 billets sur 7 jours
  const todayBzv = new Date(Date.now() + OFFSET_MS).toISOString().split('T')[0];
  const seuil7j  = new Date(new Date(todayBzv + 'T00:00:00Z').getTime() - 6 * 86400000 - OFFSET_MS).toISOString();
  const resa7j   = resaList.filter(r => r.statut !== 'annulée' && (r.createdAt || '') >= seuil7j);
  const trajetsSousPerf = trajetList.filter(t => {
    if (t.actif === false) return false;
    const ventesTraj = resa7j.filter(r => r.trajetId === t.id);
    const nbVendus   = ventesTraj.reduce((s, r) => s + (r.nbPassagers || 1), 0);
    return nbVendus < 5;
  });

  // 3. Annulations sur 7 jours
  const annulations7j = resaList.filter(r => r.statut === 'annulée' && (r.createdAt || '') >= seuil7j);

  // 4. Modifications à la baisse non vérifiées
  const baisseNonVerifiee = resaList.filter(r => r.baisseNonVerifiee === true);

  if (pdvInactifs.length === 0 && trajetsSousPerf.length === 0 && annulations7j.length === 0 && baisseNonVerifiee.length === 0) {
    wrap.innerHTML = `<div class="resa-alerte-empty">Aucune alerte — tout fonctionne normalement.</div>`;
    return;
  }

  const cards = [];

  cards.push(`
    <div class="resa-alerte-card ${trajetsSousPerf.length > 0 ? 'warn' : 'neutral'}" onclick="filtrerParAlerteTrajets()">
      <div class="resa-alerte-head">${ICONS.down} Trajets sous-performants</div>
      <div class="resa-alerte-value">${trajetsSousPerf.length}</div>
      <div class="resa-alerte-sub">moins de 5 billets vendus en 7 jours</div>
    </div>`);

  cards.push(`
    <div class="resa-alerte-card ${pdvInactifs.length > 0 ? 'danger' : 'neutral'}" onclick="filtrerParAlertePdv()">
      <div class="resa-alerte-head">${ICONS.building} PDV inactifs</div>
      <div class="resa-alerte-value">${pdvInactifs.length}</div>
      <div class="resa-alerte-sub">aucune vente depuis 5 jours ou plus</div>
    </div>`);

  cards.push(`
    <div class="resa-alerte-card neutral" onclick="filtrerParAlerteAnnulations()">
      <div class="resa-alerte-head">${ICONS.warning} Annulations</div>
      <div class="resa-alerte-value">${annulations7j.length}</div>
      <div class="resa-alerte-sub">sur les 7 derniers jours</div>
    </div>`);

  cards.push(`
    <div class="resa-alerte-card ${baisseNonVerifiee.length > 0 ? 'danger' : 'neutral'}" onclick="filtrerParAlerteBaisses()">
      <div class="resa-alerte-head">${ICONS.warning} Modifications à la baisse</div>
      <div class="resa-alerte-value">${baisseNonVerifiee.length}</div>
      <div class="resa-alerte-sub">prix réduit après modification, à vérifier</div>
    </div>`);

  window._alerteBaisseIds = baisseNonVerifiee.map(r => r.id);
  window._resa7j = resa7j;
  window._alerteData = { trajetList };
  wrap.innerHTML = `<div class="resa-alertes-grid">${cards.join('')}</div>`;

  window._alertePdvInactifsIds      = pdvInactifs.map(p => p.id);
  window._alerteTrajetsSousPerfIds  = trajetsSousPerf.map(t => t.id);
}

// ════════════════════════════════
//  ALERTES — MODALS DÉTAIL
// ════════════════════════════════
function openAlerteModal(titre, contenuHTML) {
  const existing = document.getElementById('alerteModalOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'alerteModalOverlay';
  overlay.className = 'pdv-overlay';
  overlay.innerHTML = `
    <div class="pdv-overlay-backdrop" onclick="closeAlerteModal()"></div>
    <div class="pdv-overlay-panel">
      <div class="pdv-overlay-header">
        <div><h2>${titre}</h2></div>
        <button class="pdv-overlay-close" onclick="closeAlerteModal()">${ICONS.close}</button>
      </div>
      ${contenuHTML}
    </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
}

export function closeAlerteModal() {
  const o = document.getElementById('alerteModalOverlay');
  if (o) { o.classList.remove('show'); setTimeout(() => o.remove(), 300); }
}

export function filtrerParAlerteTrajets() {
  const ids = window._alerteTrajetsSousPerfIds || [];
  if (ids.length === 0) { showToast('Aucun trajet sous-performant.', TOAST_ICONS.info); return; }

  const { trajetList } = window._alerteData || {};
  const trajets = (trajetList || []).filter(t => ids.includes(t.id));

  const rows = trajets.map(t => {
    const ventes = (window._resa7j || []).filter(r => r.trajetId === t.id);
    const nb = ventes.reduce((s, r) => s + (r.nbPassagers || 1), 0);
    const typeInfo = getTypeTrajetInfo(t);
    return `
      <div class="pdv-detail-row">
        <span class="pdv-detail-label">
          ${escapeHtml(t.villeDepart)} → ${escapeHtml(t.villeArrivee)}
          <span class="trajet-type-badge ${typeInfo.cls}">${typeInfo.icon} ${typeInfo.label}</span>
        </span>
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:12px;color:#FFB23F;">${nb} billet${nb > 1 ? 's' : ''} / 7j</span>
          <button class="pdv-action-btn" style="padding:6px 12px;font-size:12px;"
            onclick="closeAlerteModal();showPage('trajets',document.querySelector('[data-page=trajets]'))">
            Voir →
          </button>
        </div>
      </div>`;
  }).join('');

  openAlerteModal(
    `${ICONS.down} Trajets sous-performants (${trajets.length})`,
    `<div class="pdv-detail-info" style="margin-top:0">${rows}</div>
     <p style="font-size:12px;color:var(--muted);margin-top:12px;">Moins de 5 billets vendus sur les 7 derniers jours.</p>`
  );
}

export function filtrerParAlertePdv() {
  const ids = window._alertePdvInactifsIds || [];
  if (ids.length === 0) { showToast('Aucun PDV inactif.', TOAST_ICONS.info); return; }

  const pdvs = pdvList.filter(p => ids.includes(p.id));

  const rows = pdvs.map(p => {
    const derniereVente = getDerniereVentePdv(p.id, resaList);
    const dateLabel = formatDerniereVente(derniereVente);
    return `
      <div class="pdv-detail-row">
        <div>
          <div style="font-size:13px;font-weight:600;color:var(--white)">${escapeHtml(p.nom)}</div>
          <div style="font-size:11px;color:var(--muted)">Dernière vente : ${dateLabel}</div>
        </div>
        <button class="pdv-action-btn" style="padding:6px 12px;font-size:12px;"
          onclick="closeAlerteModal();openPDVDetail('${escapeJsAttr(p.id)}')">
          Voir →
        </button>
      </div>`;
  }).join('');

  openAlerteModal(
    `${ICONS.building} PDV inactifs (${pdvs.length})`,
    `<div class="pdv-detail-info" style="margin-top:0">${rows}</div>
     <p style="font-size:12px;color:var(--muted);margin-top:12px;">Aucune vente depuis 5 jours ou plus.</p>`
  );
}

export function filtrerParAlerteAnnulations() {
  const todayBzv = new Date(Date.now() + OFFSET_MS).toISOString().split('T')[0];
  const seuil7j  = new Date(new Date(todayBzv + 'T00:00:00Z').getTime() - 6 * 86400000 - OFFSET_MS).toISOString();
  const annulations = resaList.filter(r => r.statut === 'annulée' && (r.createdAt || '') >= seuil7j);

  if (annulations.length === 0) { showToast('Aucune annulation sur 7 jours.', TOAST_ICONS.info); return; }

  const rows = annulations.map(r => {
    const trajet = trajetList.find(t => t.id === r.trajetId);
    const route = escapeHtml(r.routeLabel || (trajet ? `${trajet.villeDepart} → ${trajet.villeArrivee}` : '—'));
    const nom = escapeHtml(`${r.prenomPassager || ''} ${r.nomPassager || ''}`.trim() || 'Passager');
    const date = r.createdAt ? new Date(r.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', timeZone: 'Africa/Brazzaville' }) : '—';
    return `
      <div class="pdv-detail-row">
        <div>
          <div style="font-size:13px;font-weight:600;color:var(--white)">${nom}</div>
          <div style="font-size:11px;color:var(--muted)">${route} · ${date}</div>
        </div>
        <span class="pdv-status-badge inactive">${ICONS.dot} Annulée</span>
      </div>`;
  }).join('');

  openAlerteModal(
    `${ICONS.warning} Annulations (${annulations.length})`,
    `<div class="pdv-detail-info" style="margin-top:0;max-height:400px;overflow-y:auto">${rows}</div>`
  );
}

export function filtrerParAlerteBaisses() {
  const ids = window._alerteBaisseIds || [];
  if (ids.length === 0) { showToast('Aucune modification à la baisse en attente.', TOAST_ICONS.info); return; }

  const resas = resaList.filter(r => ids.includes(r.id));

  const rows = resas.map(r => {
    const nom = escapeHtml(`${r.prenomPassager || ''} ${r.nomPassager || ''}`.trim() || 'Passager');
    return `
      <div class="pdv-detail-row">
        <div>
          <div style="font-size:13px;font-weight:600;color:var(--white)">${nom}</div>
          <div style="font-size:11px;color:var(--muted)">${escapeHtml(r.routeLabel) || '—'} · −${Number(r.ecartMontant || 0).toLocaleString()} XAF</div>
        </div>
        <button class="pdv-action-btn" style="padding:6px 12px;font-size:12px;"
          onclick="closeAlerteModal();openResaDetail('${escapeJsAttr(r.id)}')">
          Voir →
        </button>
      </div>`;
  }).join('');

  openAlerteModal(
    `${ICONS.warning} Modifications à la baisse (${resas.length})`,
    `<div class="pdv-detail-info" style="margin-top:0">${rows}</div>`
  );
}

const JOURS_COURTS = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];
const MOIS_LONGS = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];

function formatDateCourte(dateObj) {
  if (!dateObj) return '—';
  return `${JOURS_COURTS[dateObj.getDay()]}-${dateObj.getDate()}${MOIS_LONGS[dateObj.getMonth()]}`;
}

// ════════════════════════════════
//  RÉSERVATIONS — LISTE
// ════════════════════════════════
function renderResaList(groupMode = null) {
  const container = document.getElementById('resaListContainer');
  if (!container) return;

  if (resaListFiltree.length === 0) {
    container.innerHTML = `
      <div class="empty-state large">
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
          <rect x="4" y="9" width="36" height="30" rx="4" stroke="currentColor" stroke-width="2"/>
          <path d="M12 5v8M32 5v8M4 18h36" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <p>Aucune réservation pour ces filtres</p>
        <small>Essayez d'élargir la période ou de réinitialiser les filtres</small>
      </div>`;
    return;
  }

  const compteur = document.getElementById('resaCompteur');
  if (compteur) compteur.textContent = `${resaListFiltree.length} réservation${resaListFiltree.length > 1 ? 's' : ''}`;

  const renderRow = (r) => {
    const pdv    = pdvList.find(p => p.id === r.pdvId);
    const trajet = trajetList.find(t => t.id === r.trajetId);
    const routeLabel = r.routeLabel ||
      (trajet ? `${r.arretMontee || trajet.villeDepart} → ${r.arretDescente || trajet.villeArrivee}` : '—');
    const dateObj   = r.dateDepart ? new Date(r.dateDepart + 'T00:00:00') : null;
    const dateLabel = formatDateCourte(dateObj);
    const nomComplet = escapeHtml(`${r.prenomPassager || ''} ${r.nomPassager || ''}`.trim() || 'Passager');
    const isAnnulee  = r.statut === 'annulée';
    const typeInfo = trajet ? getTypeTrajetInfo(trajet) : null;

    return `
      <tr onclick="openResaDetail('${escapeJsAttr(r.id)}')" style="cursor:pointer">
        <td data-label="Passager">
          <div class="resa-row-name">${nomComplet}</div>
          <div class="resa-row-tel">${escapeHtml(r.telephonePassager) || '—'}</div>
          ${r.nbPassagers > 1 ? `<div class="resa-row-meta" style="margin-top:2px;">${r.nbPassagers} passagers</div>` : ''}
        </td>
        <td data-label="Trajet">
          <div class="resa-row-route">
            ${escapeHtml(routeLabel)}
            ${typeInfo ? `<span class="trajet-type-badge ${typeInfo.cls}">${typeInfo.icon} ${typeInfo.label}</span>` : ''}
          </div>
          <div class="resa-row-meta">${dateLabel} · ${escapeHtml(r.heureDepart) || '—'} · ${escapeHtml(r.busNom) || '—'}</div>
          ${r.pdvEmbarquementNom ? `<div class="resa-row-meta" style="margin-top:2px;">&#8593; ${escapeHtml(r.pdvEmbarquementNom)}${r.pdvDebarquementNom ? ' &#8594; ' + escapeHtml(r.pdvDebarquementNom) : ''}</div>` : ''}
        </td>
        <td data-label="PDV" class="resa-row-pdv-cell">${escapeHtml(pdv?.nom) || '—'}</td>
        <td data-label="Montant" class="resa-row-prix">${Number(r.prixTotal || 0).toLocaleString()} XAF</td>
        <td data-label="Statut">
          <span class="pdv-status-badge ${isAnnulee ? 'inactive' : 'active'}">
            <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${isAnnulee ? '#FF4D6A' : '#00E5A0'};margin-right:5px;vertical-align:middle;"></span>
            ${isAnnulee ? 'Annulée' : 'Confirmée'}
          </span>
          ${r.baisseNonVerifiee ? `<span class="pdv-status-badge inactive resa-badge-baisse" style="margin-top:4px;display:block;width:fit-content;">${ICONS.warning} Prix réduit</span>` : ''}
          ${r.passagerRetire ? `<span class="pdv-status-badge inactive resa-badge-retrait" style="margin-top:4px;display:block;width:fit-content;">${ICONS.person} Passager retiré</span>` : ''}
          ${r.reaffectee ? `<span class="pdv-status-badge resa-badge-reaffectee" style="margin-top:4px;display:block;width:fit-content;background:rgba(77,159,255,0.12);border:1px solid rgba(77,159,255,0.35);color:#4D9FFF;">${ICONS.refresh} Réaffecté</span>` : ''}
          ${r.busSupprime ? `<span class="pdv-status-badge inactive" style="margin-top:4px;display:block;width:fit-content;background:rgba(255,178,63,0.1);border:1px solid rgba(255,178,63,0.3);color:#FFB23F;">${ICONS.warning} Bus supprimé</span>` : ''}
        </td>
        <td class="resa-row-chevron">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 4l5 4-5 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </td>
      </tr>`;
  };

  const renderGroupHeader = (label, count, total) => `
    <tr class="resa-group-row">
      <td colspan="6">
        <div class="resa-group-header-table">
          <span class="resa-group-label">${label}</span>
          <span class="resa-group-line"></span>
          <span class="resa-group-count">${count} résa · ${Number(total).toLocaleString()} XAF</span>
        </div>
      </td>
    </tr>`;

  // Trier par date décroissante
  const sorted = [...resaListFiltree].sort((a, b) =>
    (b.createdAt || '').localeCompare(a.createdAt || '')
  );

  let tbodyContent = '';

  if (!groupMode) {
    tbodyContent = sorted.map(renderRow).join('');
  } else {
    // Grouper
    const MOIS_NOMS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
    const MOIS_COURTS = ['jan.','fév.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];

    const groups = {};
    sorted.forEach(r => {
      const dateStr = toBrazzaDate(r.createdAt).slice(0, 10);
      if (!dateStr) return;

            let key, label;
      if (groupMode === 'mois') {
        key = dateStr.slice(0, 7);
        const d = new Date(dateStr + 'T00:00:00');
        label = `${MOIS_NOMS[d.getMonth()]} ${d.getFullYear()}`;
      } else if (groupMode === 'jour') {                    // ← AJOUT
        key = dateStr;
        const d = new Date(dateStr + 'T00:00:00');
        label = d.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' });
        label = label.charAt(0).toUpperCase() + label.slice(1);
      } else {
        // semaine
        const d = new Date(dateStr + 'T00:00:00');
        const jourSemaine = (d.getDay() + 6) % 7;
        const lundi = new Date(d);
        lundi.setDate(d.getDate() - jourSemaine);
        const dimanche = new Date(lundi);
        dimanche.setDate(lundi.getDate() + 6);
        key = lundi.toISOString().split('T')[0];
        const sameMonth = lundi.getMonth() === dimanche.getMonth();
        label = sameMonth
          ? `Semaine du ${lundi.getDate()} au ${dimanche.getDate()} ${MOIS_COURTS[dimanche.getMonth()]}`
          : `Semaine du ${lundi.getDate()} ${MOIS_COURTS[lundi.getMonth()]} au ${dimanche.getDate()} ${MOIS_COURTS[dimanche.getMonth()]}`;
      }

      if (!groups[key]) groups[key] = { label, items: [], total: 0 };
      groups[key].items.push(r);
      groups[key].total += (r.prixTotal || 0);
    });

    const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    tbodyContent = sortedKeys.map(key => {
      const g = groups[key];
      return renderGroupHeader(g.label, g.items.length, g.total) + g.items.map(renderRow).join('');
    }).join('');
  }

  container.innerHTML = `
    <table class="resa-table">
      <thead>
        <tr>
          <th>Passager</th>
          <th>Trajet</th>
          <th>PDV vendeur</th>
          <th>Montant</th>
          <th>Statut</th>
          <th></th>
        </tr>
      </thead>
      <tbody>${tbodyContent}</tbody>
    </table>`;
}

function toggleBilletView(resaId, mode) {
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
window.toggleBilletView = toggleBilletView;

// ════════════════════════════════
//  RÉSERVATIONS — DETAIL
// ════════════════════════════════
export function openResaDetail(resaId) {
  const r = resaList.find(r => r.id === resaId);
  if (!r) return;

  const pdv        = pdvList.find(p => p.id === r.pdvId);
  const trajet     = trajetList.find(t => t.id === r.trajetId);
  const nomComplet = escapeHtml(`${r.prenomPassager || ''} ${r.nomPassager || ''}`.trim() || 'Passager');
  const routeLabel = escapeHtml(r.routeLabel ||
    (trajet ? `${r.arretMontee || trajet.villeDepart} → ${r.arretDescente || trajet.villeArrivee}` : '—'));
  const isAnnulee  = r.statut === 'annulée';
  const peutModifier = peutModifierResa(r);

  const overlay = document.createElement('div');
  overlay.id = 'resaDetailOverlay';
  overlay.className = 'resa-side-overlay';
  const nbPass  = r.passagers?.length || 1;
  const isMulti = nbPass > 1;
  const dateStr = r.dateDepart
    ? new Date(r.dateDepart + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
    : '—';
  overlay.innerHTML = `
    <div class="resa-side-backdrop" onclick="closeResaDetail()"></div>
    <div class="resa-side-panel">
      <div class="resa-side-header">
        <div>
          <h2>${isMulti ? `${nomComplet} + ${nbPass - 1} passager${nbPass > 2 ? 's' : ''}` : nomComplet}</h2>
          <p>${routeLabel}</p>
        </div>
        <button class="pdv-overlay-close" onclick="closeResaDetail()">${ICONS.close}</button>
      </div>

      <div style="padding:0 24px;display:flex;flex-direction:column;gap:14px;padding-bottom:24px;">

        <div class="recap-total-row">
          <span>Total encaissé</span>
          <strong>${Number(r.prixTotal || 0).toLocaleString()} XAF</strong>
        </div>

        ${r.passagerRetire ? `
        <div class="resa-retrait-info-box">
          <div class="resa-retrait-info-title">${ICONS.person} Retrait de passager</div>
          ${(r.historiqueRetraits || []).map(h => `
            <p>
              <strong>${escapeHtml(h.nom)}</strong> retiré le ${new Date(h.retireAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Africa/Brazzaville' })}
              — ${Number(h.montantRembourse).toLocaleString()} XAF remboursés
            </p>
          `).join('')}
        </div>` : ''}

        ${r.reaffectee ? `
        <div class="resa-retrait-info-box">
          <div class="resa-retrait-info-title">${ICONS.refresh} Réservation réaffectée</div>
          <p>
            Déplacée de <strong>${escapeHtml(r.ancienBusNom) || '—'}</strong> vers <strong>${escapeHtml(r.nouveauBusNom) || '—'}</strong>
            le ${r.dateReaffectation ? new Date(r.dateReaffectation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Africa/Brazzaville' }) + ' à ' + new Date(r.dateReaffectation).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Brazzaville' }) : '—'}.
          </p>
        </div>` : ''}

        ${r.busSupprime ? `
        <div class="resa-retrait-info-box">
          <div class="resa-retrait-info-title">${ICONS.warning} Bus supprimé</div>
          <p>Le bus <strong>${escapeHtml(r.busNomSupprime) || escapeHtml(r.busNom) || '—'}</strong> utilisé pour ce trajet a été retiré de la flotte depuis. Cette réservation reste conservée pour l'historique.</p>
        </div>` : ''}

        ${r.baisseNonVerifiee ? `
        <div class="resa-baisse-alert-box" id="baisseAlertBox">
          <div class="resa-baisse-alert-title">${ICONS.warning} Vérification requise</div>
          <p>Pense à vérifier ce billet au plus vite — une modification a fait baisser le prix de <strong>${Number(r.ecartMontant || 0).toLocaleString()} XAF</strong>.</p>
          <p>Raison indiquée par le vendeur : <strong>${escapeHtml(r.raisonModification) || '—'}</strong></p>
          <button class="pdv-action-btn" style="width:100%;margin-top:8px;" onclick="marquerBaisseVerifiee('${escapeJsAttr(r.id)}')">
            Marquer comme vérifié
          </button>
        </div>` : ''}

        <div style="display:flex;gap:6px;">
          <button class="rqf-btn active" id="resaDetailTabBtn-trajet" onclick="switchResaDetailTab('trajet')">Trajet</button>
          <button class="rqf-btn" id="resaDetailTabBtn-passager" onclick="switchResaDetailTab('passager')">Passager${isMulti ? 's' : ''}</button>
          <button class="rqf-btn" id="resaDetailTabBtn-billet" onclick="switchResaDetailTab('billet')">Billet</button>
        </div>

        <div id="resaDetailTab-trajet">
          <div class="recap-card">
            <div class="recap-row"><span>Ligne</span><strong>${routeLabel}</strong></div>
            <div class="recap-row"><span>Date</span><strong>${dateStr}</strong></div>
            <div class="recap-row"><span>Heure de départ</span><strong>${escapeHtml(r.heureDepart) || '—'}</strong></div>
            <div class="recap-row"><span>Bus</span><strong>${escapeHtml(r.busNom) || '—'}</strong></div>
            <div class="recap-row"><span>Vendu par</span><strong>${escapeHtml(pdv?.nom) || '—'}</strong></div>
            <div class="recap-row">
              <span>Vendu le</span>
              <strong>
                ${r.createdAt ? new Date(r.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Africa/Brazzaville' }) + ' à ' + new Date(r.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Brazzaville' }) : '—'}
              </strong>
            </div>
            <div class="recap-row"><span>Embarquement</span><strong>${escapeHtml(r.pdvEmbarquementNom) || '—'}${(r.arretMontee || trajet?.villeDepart) ? ' (' + escapeHtml(r.arretMontee || trajet?.villeDepart) + ')' : ''}</strong></div>
            <div class="recap-row"><span>Débarquement</span><strong>${escapeHtml(r.pdvDebarquementNom) || '—'}${(r.arretDescente || trajet?.villeArrivee) ? ' (' + escapeHtml(r.arretDescente || trajet?.villeArrivee) + ')' : ''}</strong></div>
            ${isMulti ? `<div class="recap-row"><span>Nb. passagers</span><strong>${nbPass} personnes</strong></div>` : ''}
            <div class="recap-row"><span>Statut</span>
              <span class="pdv-status-badge ${isAnnulee ? 'inactive' : 'active'}">
                <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${isAnnulee ? '#FF4D6A' : '#00E5A0'};margin-right:5px;vertical-align:middle;"></span>
                ${isAnnulee ? 'Annulée' : 'Confirmée'}
              </span>
            </div>
          </div>
          ${r.remarques ? `
          <div style="margin-top:14px;">
            <div class="recap-section-title">Remarques</div>
            <div class="recap-card"><div class="recap-row" style="display:block;"><span>${escapeHtml(r.remarques)}</span></div></div>
          </div>` : ''}
        </div>

        <div id="resaDetailTab-passager" style="display:none;">
          ${isMulti ? r.passagers.map((p, i) => `
            <div class="recap-passager-card">
              <div class="recap-passager-title">Passager ${i + 1}</div>
              <div class="recap-row"><span>Nom complet</span><strong>${escapeHtml(p.prenom) || '—'} ${escapeHtml(p.nom) || ''}</strong></div>
              ${p.telephone ? `<div class="recap-row"><span>Téléphone</span><strong>${escapeHtml(p.telephone)}</strong></div>` : ''}
              <div class="recap-row"><span>Type</span><strong>${escapeHtml(nomTypePassager(p))}</strong></div>
              ${p.siege ? `<div class="recap-row"><span>Siège</span><strong>${escapeHtml(p.siege)}</strong></div>` : ''}
              ${p.bagages > 0 ? `<div class="recap-row"><span>Bagages</span><strong>${p.bagages} kg${p.nombreBagages > 0 ? ' · ' + p.nombreBagages + ' colis' : ''}${p.prixBagages > 0 ? ' (+' + Number(p.prixBagages).toLocaleString() + ' XAF)' : ''}</strong></div>` : ''}
              ${p.colisSoute ? `
                <div class="recap-row"><span>Colis en soute</span><strong>${escapeHtml(p.colisSoute.nature) || '—'} (${Number(p.colisSoute.prix || 0).toLocaleString()} XAF)</strong></div>
                ${p.colisSoute.poids ? `<div class="recap-row"><span>Poids du colis</span><strong>${p.colisSoute.poids} kg</strong></div>` : ''}
                ${p.colisSoute.valeurDeclaree ? `<div class="recap-row"><span>Valeur déclarée</span><strong>${Number(p.colisSoute.valeurDeclaree).toLocaleString()} XAF</strong></div>` : ''}
              ` : ''}
              <div class="recap-row"><span>Sous-total</span><strong style="color:var(--accent)">${Number(p.sousTotal || 0).toLocaleString()} XAF</strong></div>
            </div>`).join('') : `
            <div class="recap-card">
              <div class="recap-row"><span>Nom complet</span><strong>${escapeHtml(r.prenomPassager) || '—'} ${escapeHtml(r.nomPassager) || ''}</strong></div>
              <div class="recap-row"><span>Téléphone</span><strong>${escapeHtml(r.telephonePassager) || '—'}</strong></div>
              <div class="recap-row"><span>Type</span><strong>${escapeHtml(nomTypeResa(r))}</strong></div>
              ${r.siege ? `<div class="recap-row"><span>Siège</span><strong>${escapeHtml(r.siege)}</strong></div>` : ''}
              ${r.bagages > 0 ? `<div class="recap-row"><span>Bagages</span><strong>${r.bagages} kg${r.nombreBagages > 0 ? ' · ' + r.nombreBagages + ' colis' : ''}${r.prixBagages > 0 ? ' (+' + Number(r.prixBagages).toLocaleString() + ' XAF)' : ''}</strong></div>` : ''}
              ${r.passagers?.[0]?.colisSoute ? `
                <div class="recap-row"><span>Colis en soute</span><strong>${escapeHtml(r.passagers[0].colisSoute.nature) || '—'} (${Number(r.passagers[0].colisSoute.prix || 0).toLocaleString()} XAF)</strong></div>
                ${r.passagers[0].colisSoute.poids ? `<div class="recap-row"><span>Poids du colis</span><strong>${r.passagers[0].colisSoute.poids} kg</strong></div>` : ''}
                ${r.passagers[0].colisSoute.valeurDeclaree ? `<div class="recap-row"><span>Valeur déclarée</span><strong>${Number(r.passagers[0].colisSoute.valeurDeclaree).toLocaleString()} XAF</strong></div>` : ''}
              ` : ''}
            </div>`}
        </div>

        <div id="resaDetailTab-billet" style="display:none;">
          <div class="recap-card" style="padding:14px 16px;">
            <div style="display:flex;gap:6px;margin-bottom:12px;">
              <button class="rqf-btn active" id="billetToggleCode-${escapeHtml(r.id)}" onclick="toggleBilletView('${escapeJsAttr(r.id)}','code')">Code</button>
              <button class="rqf-btn" id="billetToggleQr-${escapeHtml(r.id)}" onclick="toggleBilletView('${escapeJsAttr(r.id)}','qr')">QR Code</button>
            </div>
            <div id="billetViewCode-${escapeHtml(r.id)}" style="text-align:center;padding:18px 0;">
              <div style="font-family:'Syne',sans-serif;font-size:28px;font-weight:800;letter-spacing:6px;color:${r.codeControle ? 'var(--white)' : 'var(--muted)'};background:var(--surface2);border:1.5px dashed var(--border2);border-radius:12px;padding:16px;">
                ${escapeHtml(r.codeControle) || '------'}
              </div>
              <div style="font-size:11px;color:var(--muted);margin-top:8px;">
                ${r.codeControle ? 'Code de vérification à 6 caractères' : 'Code de vérification — bientôt disponible'}
              </div>
            </div>
            <div id="billetViewQr-${escapeHtml(r.id)}" style="display:none;text-align:center;padding:18px 0;">
              <div style="width:140px;height:140px;margin:0 auto;background:var(--surface2);border:1.5px dashed var(--border2);border-radius:12px;display:flex;align-items:center;justify-content:center;">
                <svg width="36" height="36" viewBox="0 0 16 16" fill="none" style="opacity:.35;"><rect x="1" y="1" width="5" height="5" stroke="currentColor" stroke-width="1.3"/><rect x="10" y="1" width="5" height="5" stroke="currentColor" stroke-width="1.3"/><rect x="1" y="10" width="5" height="5" stroke="currentColor" stroke-width="1.3"/><path d="M10 10h2v2h-2zM13 10h2v2h-2zM10 13h2v2h-2zM13 13h2v2h-2z" fill="currentColor"/></svg>
              </div>
              <div style="font-size:11px;color:var(--muted);margin-top:8px;">QR code — bientôt disponible</div>
            </div>
            <button class="pdv-action-btn" style="width:100%;margin-top:10px;" onclick="imprimerBillet('${escapeJsAttr(r.id)}')">
              ${ICONS.impression} Imprimer le billet
            </button>
          </div>
        </div>

        <div class="resa-side-actions">
          ${!isAnnulee ? `
          ${!peutModifier ? `
          <div style="background:rgba(255,178,63,0.08);border:1px solid rgba(255,178,63,0.2);border-radius:10px;padding:9px 13px;font-size:12px;color:#FFB23F;text-align:center;">
            ${ICONS.warning} Ce voyage est déjà passé — modification et annulation impossibles
          </div>` : ''}
          <button class="pdv-action-btn" style="width:100%;${peutModifier ? '' : 'opacity:0.4;cursor:not-allowed;'}" ${peutModifier ? `onclick="handleModifierResa('${escapeJsAttr(r.id)}')"` : 'disabled title="Voyage déjà passé — modification impossible"'}>
            Modifier cette réservation
          </button>
          <button class="pdv-action-btn delete" style="width:100%;${peutModifier ? '' : 'opacity:0.4;cursor:not-allowed;'}" ${peutModifier ? `onclick="handleAnnulerResa('${escapeJsAttr(r.id)}')"` : 'disabled title="Voyage déjà passé — annulation impossible"'}>
            Annuler cette réservation
          </button>` : ''}
        </div>

      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
}

function switchResaDetailTab(tab) {
  ['trajet', 'passager', 'billet'].forEach(t => {
    const panel = document.getElementById(`resaDetailTab-${t}`);
    const btn   = document.getElementById(`resaDetailTabBtn-${t}`);
    if (panel) panel.style.display = t === tab ? '' : 'none';
    if (btn)   btn.classList.toggle('active', t === tab);
  });
}
window.switchResaDetailTab = switchResaDetailTab;

export function closeResaDetail() {
  const o = document.getElementById('resaDetailOverlay');
  if (o) { o.classList.remove('show'); setTimeout(() => o.remove(), 350); }
}

// ════════════════════════════════
//  RÉSERVATIONS — MODIFICATION
// ════════════════════════════════
function getPointsTrajet(trajet) {
  if (!trajet) return [];
  return [
    trajet.villeDepart,
    ...(trajet.arrets || []).map(a => a.ville || a.nom),
    trajet.villeArrivee,
  ];
}

function getPdvsAtPoint(trajet, pointNom) {
  if (!trajet || !pointNom) return [];
  if (pointNom === trajet.villeDepart)  return trajet.pdvDepart  || [];
  if (pointNom === trajet.villeArrivee) return trajet.pdvArrivee || [];
  return (trajet.pdvArrets || []).filter(p =>
    (p.ville || p.nom || '').toLowerCase().trim() === pointNom.toLowerCase().trim()
  );
}

function calculerPrixSegmentModif(trajet, villeMontee, villeDescente, typeId) {
  if (!trajet) return 0;
  if ((trajet.typeTrajet || 'direct') === 'direct') {
    return Number(trajet.prixParType?.[typeId] || 0);
  }
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

function ageRangeLabel(type) {
  if (type.ageMax != null) return `${type.ageMin}-${type.ageMax} ans`;
  return `${type.ageMin}+ ans`;
}

export function handleModifierResa(resaId) {
  const r = resaList.find(r => r.id === resaId);
  if (!r) return;

  if (!peutModifierResa(r)) {
    showToast('Modification impossible — voyage déjà passé.', ICONS.banned);
    return;
  }

  if (r.modifiee === true) {
    const existing = document.getElementById('modifierResaOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'modifierResaOverlay';
    overlay.className = 'pdv-overlay';
    overlay.innerHTML = `
      <div class="pdv-overlay-backdrop" onclick="closeModifierResa()"></div>
      <div class="pdv-overlay-panel" style="max-width:420px;">
        <div class="pdv-overlay-header">
          <div><h2>Modification impossible</h2></div>
          <button class="pdv-overlay-close" onclick="closeModifierResa()">${ICONS.close}</button>
        </div>
        <div class="resa-modif-lock-msg">
          Cette réservation a déjà été modifiée une fois. Une seconde modification n'est pas autorisée.
        </div>
      </div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));
    return;
  }

  const trajet    = trajetList.find(t => t.id === r.trajetId);
  const points    = getPointsTrajet(trajet);
  const pointsDescente = points.filter(p => p !== trajet?.villeDepart);
  window._modifVilleMontee = r.arretMontee || trajet?.villeDepart;
  window._modifAncienPrixTotal = Number(r.prixTotal || 0);
  const nbPass    = r.passagers?.length || 1;
  const isMulti   = nbPass > 1;

  const existing = document.getElementById('modifierResaOverlay');
  if (existing) existing.remove();

  const passagersFieldsHTML = isMulti
    ? r.passagers.map((p, i) => `
        <div class="recap-passager-card">
          <div class="recap-passager-title">Passager ${i + 1}</div>
          <div class="pdv-field-group">
            <label>Prénom</label>
            <input type="text" class="pdv-input" id="modifPrenom_${i}" value="${escapeHtml(p.prenom) || ''}">
          </div>
          <div class="pdv-field-group">
            <label>Nom</label>
            <input type="text" class="pdv-input" id="modifNom_${i}" value="${escapeHtml(p.nom) || ''}">
          </div>
          <div class="pdv-field-group">
            <label>Téléphone</label>
            <input type="text" class="pdv-input" id="modifTel_${i}" value="${escapeHtml(p.telephone) || ''}">
          </div>
          <div class="pdv-field-group">
            <label>Type de billet</label>
            <select class="pdv-select modif-passager-type" id="modifType_${i}" onchange="recalculerTotalModif()">
              ${(agenceData?.typesBillet || []).map(t => `<option value="${escapeHtml(t.id)}" ${t.id === p.type ? 'selected' : ''}>${escapeHtml(t.nom)} (${escapeHtml(ageRangeLabel(t))})</option>`).join('')}
            </select>
          </div>
        </div>`).join('')
    : `
        <div class="pdv-field-group">
          <label>Prénom</label>
          <input type="text" class="pdv-input" id="modifPrenom" value="${escapeHtml(r.prenomPassager) || ''}">
        </div>
        <div class="pdv-field-group">
          <label>Nom</label>
          <input type="text" class="pdv-input" id="modifNom" value="${escapeHtml(r.nomPassager) || ''}">
        </div>
        <div class="pdv-field-group">
          <label>Téléphone</label>
          <input type="text" class="pdv-input" id="modifTel" value="${escapeHtml(r.telephonePassager) || ''}">
        </div>
        <div class="pdv-field-group">
          <label>Type de billet</label>
          <select class="pdv-select modif-passager-type" id="modifType_0" onchange="recalculerTotalModif()">
            ${(agenceData?.typesBillet || []).map(t => `<option value="${escapeHtml(t.id)}" ${t.id === r.typeBillet ? 'selected' : ''}>${escapeHtml(t.nom)} (${escapeHtml(ageRangeLabel(t))})</option>`).join('')}
          </select>
        </div>`;

  const overlay = document.createElement('div');
  overlay.id = 'modifierResaOverlay';
  overlay.className = 'pdv-overlay';
  overlay.innerHTML = `
    <div class="pdv-overlay-backdrop" onclick="closeModifierResa()"></div>
    <div class="pdv-overlay-panel" style="max-width:480px;">
      <div class="pdv-overlay-header">
        <div>
          <h2>Modifier la réservation</h2>
          <p>Le siège et le bus/date ne sont pas modifiables ici.</p>
        </div>
        <button class="pdv-overlay-close" onclick="closeModifierResa()">${ICONS.close}</button>
      </div>
      <div class="pdv-create-fields">

        <div class="resa-modif-warning">
          ${ICONS.warning} Cette modification n'est possible qu'une seule fois. Merci de bien vérifier les informations avant de valider.
        </div>

        ${passagersFieldsHTML}

        <div class="recap-section-title" style="margin-top:6px;">Trajet</div>
        <div class="recap-card">
          <div class="recap-row"><span>Ville de montée</span><strong>${escapeHtml(r.arretMontee) || escapeHtml(trajet?.villeDepart) || '—'}</strong></div>

          <div class="pdv-field-group" style="margin-top:10px;">
            <label>Lieu d'embarquement</label>
            <select class="pdv-select" id="modifPdvEmbarquement">
              ${getPdvsAtPoint(trajet, r.arretMontee || trajet?.villeDepart).map(p => `<option value="${escapeHtml(p.id)}" data-nom="${escapeHtml(p.nom||'')}" data-ville="${escapeHtml(p.ville||'')}" ${p.id === r.pdvEmbarquementId ? 'selected' : ''}>${escapeHtml(p.nom)}${p.ville ? ' — '+escapeHtml(p.ville) : ''}</option>`).join('') || '<option value="">Aucun point de vente</option>'}
            </select>
          </div>

          <div class="pdv-field-group">
            <label>Ville de descente</label>
            <select class="pdv-select" id="modifDescente" onchange="onDescenteModifChange();recalculerTotalModif()">
              ${pointsDescente.map(p => `<option value="${escapeHtml(p)}" ${p === (r.arretDescente || trajet?.villeArrivee) ? 'selected' : ''}>${escapeHtml(p)}</option>`).join('')}
            </select>
          </div>

          <div class="pdv-field-group">
            <label>Lieu de débarquement</label>
            <select class="pdv-select" id="modifPdvDebarquement">
              ${getPdvsAtPoint(trajet, r.arretDescente || trajet?.villeArrivee).map(p => `<option value="${escapeHtml(p.id)}" data-nom="${escapeHtml(p.nom||'')}" data-ville="${escapeHtml(p.ville||'')}" ${p.id === r.pdvDebarquementId ? 'selected' : ''}>${escapeHtml(p.nom)}${p.ville ? ' — '+escapeHtml(p.ville) : ''}</option>`).join('') || '<option value="">Aucun point de vente</option>'}
            </select>
          </div>
        </div>

        <div class="pdv-field-group">
          <label>Bagages (kg)</label>
          <input type="number" class="pdv-input" id="modifBagages" value="${r.bagages || 0}" min="0" oninput="recalculerTotalModif()">
        </div>

        <div class="pdv-field-group">
          <label>Remarques</label>
          <input type="text" class="pdv-input" id="modifRemarques" value="${escapeHtml(r.remarques) || ''}">
        </div>

        <div class="pdv-field-group" id="modifRaisonGroup" data-required="false">
          <label id="modifRaisonLabel">Raison de la modification (optionnel)</label>
          <input type="text" class="pdv-input" id="modifRaison" placeholder="Ex : erreur ville descente, demande client...">
        </div>

        <div class="recap-total-row" style="margin-top:6px;">
          <span>Total encaissé (calcul automatique)</span>
          <strong id="modifTotalDisplay">${Number(r.prixTotal || 0).toLocaleString()} XAF</strong>
        </div>
        <input type="hidden" id="modifPrixTotal" value="${r.prixTotal || 0}">

      </div>
      <button class="pdv-btn-next" onclick="confirmerModificationResa('${escapeJsAttr(resaId)}')">
        Enregistrer les modifications
      </button>
    </div>
  `;
  window._modifTrajetCourant = trajet;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
  recalculerTotalModif();
}

export function closeModifierResa() {
  const o = document.getElementById('modifierResaOverlay');
  if (o) { o.classList.remove('show'); setTimeout(() => o.remove(), 300); }
}

function onDescenteModifChange() {
  const trajet = window._modifTrajetCourant;
  const descenteVal = document.getElementById('modifDescente')?.value;
  const selDeb = document.getElementById('modifPdvDebarquement');
  if (!selDeb || !trajet) return;
  const pdvs = getPdvsAtPoint(trajet, descenteVal);
  selDeb.innerHTML = pdvs.length > 0
    ? pdvs.map(p => `<option value="${escapeHtml(p.id)}" data-nom="${escapeHtml(p.nom||'')}" data-ville="${escapeHtml(p.ville||'')}">${escapeHtml(p.nom)}${p.ville ? ' — '+escapeHtml(p.ville) : ''}</option>`).join('')
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
    total += calculerPrixSegmentModif(trajet, villeMontee, villeDescente, sel.value);
  });

  const exces = bagages > (trajet.limiteBagages || 0) ? bagages - (trajet.limiteBagages || 0) : 0;
  total += exces * (trajet.fraisExcesBagages || 0);

  const display = document.getElementById('modifTotalDisplay');
  const hidden  = document.getElementById('modifPrixTotal');
  if (display) display.textContent = `${Number(total).toLocaleString()} XAF`;
  if (hidden)  hidden.value = total;

  const ancienPrix   = window._modifAncienPrixTotal || 0;
  const raisonGroup  = document.getElementById('modifRaisonGroup');
  const raisonLabel  = document.getElementById('modifRaisonLabel');
  if (raisonGroup && raisonLabel) {
    if (total < ancienPrix) {
      raisonLabel.innerHTML = 'Raison de la modification <span class="req">*</span>';
      raisonGroup.dataset.required = 'true';
    } else {
      raisonLabel.textContent = 'Raison de la modification (optionnel)';
      raisonGroup.dataset.required = 'false';
    }
  }
}

export async function confirmerModificationResa(resaId) {
  const r = resaList.find(r => r.id === resaId);
  if (!r) return;

  const isMulti = (r.passagers?.length || 1) > 1;
  const btn = document.querySelector('#modifierResaOverlay .pdv-btn-next');
  if (btn) { btn.disabled = true; btn.textContent = 'Enregistrement...'; }

  const trajet        = window._modifTrajetCourant;
  const villeMontee    = r.arretMontee || trajet?.villeDepart;
  const villeDescente  = document.getElementById('modifDescente')?.value;

  const selEmb = document.getElementById('modifPdvEmbarquement');
  const selDeb = document.getElementById('modifPdvDebarquement');
  const embOpt = selEmb?.selectedOptions[0];
  const debOpt = selDeb?.selectedOptions[0];

  const payload = {
    arretMontee:   villeMontee,
    arretDescente: villeDescente,
    bagages:       parseFloat(document.getElementById('modifBagages')?.value) || 0,
    remarques:     document.getElementById('modifRemarques')?.value || '',
    prixTotal:     parseFloat(document.getElementById('modifPrixTotal')?.value) || 0,
    routeLabel:    `${villeMontee} → ${villeDescente}`,
    pdvEmbarquementId:    selEmb?.value || null,
    pdvEmbarquementNom:   embOpt?.dataset.nom   || null,
    pdvEmbarquementVille: embOpt?.dataset.ville || null,
    pdvDebarquementId:    selDeb?.value || null,
    pdvDebarquementNom:   debOpt?.dataset.nom   || null,
    pdvDebarquementVille: debOpt?.dataset.ville || null,
  };

  if (isMulti) {
    payload.passagers = r.passagers.map((p, i) => ({
      ...p,
      prenom:    document.getElementById(`modifPrenom_${i}`)?.value || p.prenom,
      nom:       document.getElementById(`modifNom_${i}`)?.value    || p.nom,
      telephone: document.getElementById(`modifTel_${i}`)?.value    || p.telephone,
      type:      document.getElementById(`modifType_${i}`)?.value   || p.type,
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
    showToast('Le prénom est obligatoire.', TOAST_ICONS.warning);
    if (btn) { btn.disabled = false; btn.textContent = 'Enregistrer les modifications'; }
    return;
  }

  const ancienPrix = window._modifAncienPrixTotal || 0;
  const raisonVal  = document.getElementById('modifRaison')?.value.trim() || '';

  if (payload.prixTotal < ancienPrix && !raisonVal) {
    showToast('Merci d\'indiquer la raison de la baisse de prix avant de valider.', TOAST_ICONS.warning);
    if (btn) { btn.disabled = false; btn.textContent = 'Enregistrer les modifications'; }
    return;
  }
  payload.raisonModification = raisonVal || null;

  try {
    const res = await apiFetch(`${BACKEND}/reservations/${resaId}`, {
      method: 'PATCH', body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.message || 'Erreur modification.', TOAST_ICONS.error); return; }

    const idx = resaList.findIndex(r => r.id === resaId);
    if (idx !== -1) resaList[idx] = { ...resaList[idx], ...data.reservation };

    closeModifierResa();
    closeResaDetail();
    applyResaFiltres();
    showToast('Réservation modifiée avec succès.', TOAST_ICONS.success, true);

  } catch (err) {
    console.error('Erreur modification réservation :', err);
    showToast('Impossible de contacter le serveur.', TOAST_ICONS.error);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Enregistrer les modifications'; }
  }
}

export async function marquerBaisseVerifiee(resaId) {
  try {
    const res  = await apiFetch(`${BACKEND}/reservations/${resaId}/verifier-baisse`, { method: 'PATCH' });
    const data = await res.json();
    if (!res.ok) { showToast(data.message || 'Erreur.', TOAST_ICONS.error); return; }

    const idx = resaList.findIndex(r => r.id === resaId);
    if (idx !== -1) resaList[idx].baisseNonVerifiee = false;

    const box = document.getElementById('baisseAlertBox');
    if (box) box.remove();

    applyResaFiltres();
    showToast('Réservation marquée comme vérifiée.', TOAST_ICONS.success, true);
  } catch (err) {
    console.error('Erreur vérification baisse :', err);
    showToast('Impossible de contacter le serveur.', TOAST_ICONS.error);
  }
}

export function handleAnnulerResa(resaId) {
  const r = resaList.find(r => r.id === resaId);
  if (!r) return;
  if (!peutModifierResa(r)) { showToast('Action impossible — réservation annulée ou voyage déjà passé.', TOAST_ICONS.error); return; }

  const nbPass = r.passagers?.length || 1;
  if (nbPass > 1) {
    ouvrirListePassagersAnnulation(resaId);
  } else {
    ouvrirAnnulationComplete(resaId);
  }
}

function ouvrirAnnulationComplete(resaId) {
  const r = resaList.find(r => r.id === resaId);
  if (!r) return;

  const politique = agenceData?.politiqueAnnulation;


  // 1. Voyage déjà effectué ?
  if (r.dateDepart) {
    const departInstant = new Date(`${r.dateDepart}T${r.heureDepart || '23:59'}:00Z`).getTime() - OFFSET_MS;
    if (departInstant < Date.now()) {
      showToast('Ce voyage a déjà eu lieu — annulation impossible.', ICONS.banned);
      return;
    }
  }

  // 2. Politique : vente définitive
  if (!politique || !politique.autorise) {
    showToast('Vente définitive — annulation impossible.', ICONS.banned);
    return;
  }

  // 3. Vérification du délai
  let horsDelai = false;
  if (politique.delaiHeures && r.dateDepart && r.heureDepart) {
    const departInstant = new Date(`${r.dateDepart}T${r.heureDepart}:00Z`).getTime() - OFFSET_MS;
    const diffHeures = (departInstant - Date.now()) / (1000 * 60 * 60);
    if (diffHeures < politique.delaiHeures) horsDelai = true;
  }

  // 4. Calcul du remboursement — si délai dépassé OU pas de remboursement → 0 remboursé
  const prixTotal = Number(r.prixTotal || 0);
  let fraisPct = 0, frais = prixTotal, rembourse = 0;

  if (politique.remboursement && !horsDelai) {
    fraisPct = politique.precisions || 0;
    frais = Math.round(prixTotal * fraisPct / 100);
    rembourse = prixTotal - frais;
  }

  // Construire le résumé financier
  let resumeHTML = '';
  if (!politique.remboursement) {
    resumeHTML = `
      <div style="background:rgba(255,77,106,0.08);border:1px solid rgba(255,77,106,0.2);border-radius:12px;padding:14px 16px;margin:16px 0;">
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
  } else if (horsDelai) {
    resumeHTML = `
      <div style="background:rgba(255,178,63,0.08);border:1px solid rgba(255,178,63,0.2);border-radius:12px;padding:14px 16px;margin:16px 0;">
        <div style="font-size:11px;color:#FFB23F;font-weight:600;margin-bottom:8px;">${ICONS.warning} Délai dépassé — remboursement non applicable</div>
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

  // Ouvrir le modal de confirmation
  const existing = document.getElementById('annulConfirmOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'annulConfirmOverlay';
  overlay.className = 'pdv-overlay';
  overlay.innerHTML = `
    <div class="pdv-overlay-backdrop" onclick="closeAnnulConfirm()"></div>
    <div class="pdv-overlay-panel" style="max-width:420px;">
      <div class="pdv-overlay-header">
        <div>
          <h2>Confirmer l'annulation</h2>
          <p>Cette action est irréversible.</p>
        </div>
        <button class="pdv-overlay-close" onclick="closeAnnulConfirm()">${ICONS.close}</button>
      </div>
      <div style="padding:0 0 8px;">
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:12px 16px;margin-bottom:4px;">
          <div style="font-size:13px;font-weight:600;color:var(--white);">
            ${escapeHtml(r.prenomPassager) || ''} ${escapeHtml(r.nomPassager) || ''}
          </div>
          <div style="font-size:12px;color:var(--muted);margin-top:3px;">
            ${escapeHtml(r.routeLabel) || '—'} · ${escapeHtml(r.dateDepart) || '—'} à ${escapeHtml(r.heureDepart) || '—'}
          </div>
        </div>
        ${resumeHTML}
        <div style="display:flex;flex-direction:column;gap:8px;margin-top:4px;">
          <button class="pdv-btn-next" style="background:#FF4D6A;" onclick="confirmerAnnulation('${escapeJsAttr(resaId)}')">
            ${ICONS.banned} Confirmer l'annulation
          </button>
          <button class="pdv-btn-back" style="width:100%;text-align:center;" onclick="closeAnnulConfirm()">
            Retour
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
}

export function closeAnnulConfirm() {
  const o = document.getElementById('annulConfirmOverlay');
  if (o) { o.classList.remove('show'); setTimeout(() => o.remove(), 350); }
}

// ════════════════════════════════
//  RETRAIT D'UN PASSAGER (billet multi-passagers)
// ════════════════════════════════
function ouvrirListePassagersAnnulation(resaId) {
  const r = resaList.find(r => r.id === resaId);
  if (!r) return;

  const existing = document.getElementById('annulListePassagersOverlay');
  if (existing) existing.remove();

  const nbPass = r.passagers?.length || 0;

  const rowsHTML = (r.passagers || []).map((p, i) => `
    <div class="pdv-detail-row">
      <div>
        <div style="font-size:13px;font-weight:600;color:var(--white);">${escapeHtml(p.prenom) || ''} ${escapeHtml(p.nom) || ''}</div>
        <div style="font-size:11.5px;color:var(--muted);margin-top:2px;">
          ${p.type === 'enfant' ? 'Enfant' : 'Adulte'}${p.siege ? ' · Siège ' + escapeHtml(p.siege) : ''} · ${Number(p.sousTotal || 0).toLocaleString()} XAF
        </div>
      </div>
      ${nbPass > 1 ? `
      <button class="pdv-action-btn delete" style="padding:8px 14px;font-size:12px;flex-shrink:0;"
        onclick="ouvrirConfirmationRetraitPassager('${escapeJsAttr(resaId)}', ${i})">
        Retirer
      </button>` : ''}
    </div>`).join('');

  const overlay = document.createElement('div');
  overlay.id = 'annulListePassagersOverlay';
  overlay.className = 'pdv-overlay';
  overlay.innerHTML = `
    <div class="pdv-overlay-backdrop" onclick="closeAnnulListePassagers()"></div>
    <div class="pdv-overlay-panel" style="max-width:460px;">
      <div class="pdv-overlay-header">
        <div>
          <h2>Annuler / Retirer un passager</h2>
          <p>${escapeHtml(r.routeLabel) || '—'} · ${escapeHtml(r.dateDepart) || '—'} à ${escapeHtml(r.heureDepart) || '—'}</p>
        </div>
        <button class="pdv-overlay-close" onclick="closeAnnulListePassagers()">${ICONS.close}</button>
      </div>
      <div class="pdv-detail-info" style="margin-top:0">
        ${rowsHTML}
      </div>
      <button class="pdv-btn-next" style="background:#FF4D6A;" onclick="closeAnnulListePassagers();ouvrirAnnulationComplete('${escapeJsAttr(resaId)}')">
        ${ICONS.banned} Annuler tout le billet
      </button>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
}

function closeAnnulListePassagers() {
  const o = document.getElementById('annulListePassagersOverlay');
  if (o) { o.classList.remove('show'); setTimeout(() => o.remove(), 300); }
}

function ouvrirConfirmationRetraitPassager(resaId, passagerIndex) {
  const r = resaList.find(r => r.id === resaId);
  if (!r || !r.passagers || !r.passagers[passagerIndex]) return;

  const p = r.passagers[passagerIndex];
  const politique = agenceData?.politiqueAnnulation;

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
  if (!politique?.remboursement) {
    resumeHTML = `
      <div style="background:rgba(255,77,106,0.08);border:1px solid rgba(255,77,106,0.2);border-radius:12px;padding:14px 16px;margin:16px 0;">
        <div style="font-size:12px;color:var(--muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:.8px;font-weight:600;">Résumé financier</div>
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;">
          <span style="color:var(--muted);">Sous-total passager</span>
          <span style="color:var(--white);font-weight:600;">${sousTotal.toLocaleString()} XAF</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px;">
          <span style="color:var(--muted);">Remboursement</span>
          <span style="color:#FF4D6A;font-weight:700;">Aucun</span>
        </div>
      </div>`;
  } else if (horsDelai) {
    resumeHTML = `
      <div style="background:rgba(255,178,63,0.08);border:1px solid rgba(255,178,63,0.2);border-radius:12px;padding:14px 16px;margin:16px 0;">
        <div style="font-size:11px;color:#FFB23F;font-weight:600;margin-bottom:8px;">${ICONS.warning} Délai dépassé — remboursement non applicable</div>
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
      <div style="background:rgba(0,229,160,0.06);border:1px solid rgba(0,229,160,0.2);border-radius:12px;padding:14px 16px;margin:16px 0;">
        <div style="font-size:12px;color:var(--muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:.8px;font-weight:600;">Résumé financier</div>
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

  const existing = document.getElementById('retraitPassagerConfirmOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'retraitPassagerConfirmOverlay';
  overlay.className = 'pdv-overlay';
  overlay.innerHTML = `
    <div class="pdv-overlay-backdrop" onclick="closeRetraitPassagerConfirm()"></div>
    <div class="pdv-overlay-panel" style="max-width:420px;">
      <div class="pdv-overlay-header">
        <div>
          <h2>Retirer ce passager</h2>
          <p>Cette action est irréversible.</p>
        </div>
        <button class="pdv-overlay-close" onclick="closeRetraitPassagerConfirm()">${ICONS.close}</button>
      </div>
      <div style="padding:0 0 8px;">
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:12px 16px;margin-bottom:4px;">
          <div style="font-size:13px;font-weight:600;color:var(--white);">
            Vous voulez retirer ${escapeHtml(p.prenom) || ''} ${escapeHtml(p.nom) || ''} du trajet ${escapeHtml(r.routeLabel) || '—'}.
          </div>
          <div style="font-size:12px;color:var(--muted);margin-top:3px;">
            Sa place ne sera plus comptée.
          </div>
        </div>
        ${resumeHTML}
        <div style="display:flex;flex-direction:column;gap:8px;margin-top:4px;">
          <button class="pdv-btn-next" style="background:#FF4D6A;" onclick="confirmerRetraitPassager('${escapeJsAttr(resaId)}', ${passagerIndex})">
            ${ICONS.banned} Confirmer le retrait
          </button>
          <button class="pdv-btn-back" style="width:100%;text-align:center;" onclick="closeRetraitPassagerConfirm()">
            Retour
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
}

function closeRetraitPassagerConfirm() {
  const o = document.getElementById('retraitPassagerConfirmOverlay');
  if (o) { o.classList.remove('show'); setTimeout(() => o.remove(), 350); }
}

async function confirmerRetraitPassager(resaId, passagerIndex) {
  const btn = document.querySelector('#retraitPassagerConfirmOverlay .pdv-btn-next');
  if (btn) { btn.disabled = true; btn.textContent = 'Retrait en cours...'; }

  try {
    const res = await apiFetch(`${BACKEND}/reservations/${resaId}/retirer-passager`, {
      method: 'PATCH', body: JSON.stringify({ passagerIndex }),
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.message || 'Erreur retrait passager.', TOAST_ICONS.error); return; }

    const idx = resaList.findIndex(r => r.id === resaId);
    if (idx !== -1) resaList[idx] = { ...resaList[idx], ...data.reservation };

    closeRetraitPassagerConfirm();

    const r = resaList[idx];
    if (r && (r.passagers?.length || 0) >= 1) {
      ouvrirListePassagersAnnulation(resaId);
    } else {
      closeAnnulListePassagers();
      closeResaDetail();
    }

    applyResaFiltres();
    showToast('Passager retiré avec succès.', TOAST_ICONS.success, true);

  } catch (err) {
    console.error('Erreur retrait passager :', err);
    showToast('Impossible de contacter le serveur.', TOAST_ICONS.error);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = `${ICONS.banned} Confirmer le retrait`; }
  }
}

export async function confirmerAnnulation(resaId) {
  const btn = document.querySelector('#annulConfirmOverlay .pdv-btn-next');
  if (btn) { btn.disabled = true; btn.textContent = 'Annulation en cours...'; }

  try {
    const res = await apiFetch(`${BACKEND}/reservations/${resaId}/annuler`, { method: 'PATCH' });
    const data = await res.json();
    if (!res.ok) { showToast(data.message || 'Erreur annulation.', TOAST_ICONS.error); return; }

    // Mettre à jour localement
    const idx = resaList.findIndex(r => r.id === resaId);
    if (idx !== -1) resaList[idx].statut = 'annulée';

    closeAnnulConfirm();
    closeResaDetail();
    applyResaFiltres();
    if (typeof window.renderFinancePage === 'function') window.renderFinancePage();
    showToast('Réservation annulée avec succès.', TOAST_ICONS.success, true);

  } catch (err) {
    console.error('Erreur annulation :', err);
    showToast('Impossible de contacter le serveur.', TOAST_ICONS.error);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = `${ICONS.banned} Confirmer l'annulation`; }
  }
}

// ════════════════════════════════
//  RÉSERVATIONS — ONGLETS
// ════════════════════════════════
function switchResaTab(tab) {
  document.getElementById('resaTab-overview')?.classList.toggle('active', tab === 'overview');
  document.getElementById('resaTab-detail')?.classList.toggle('active', tab === 'detail');
  document.getElementById('resaPanel-overview').style.display = tab === 'overview' ? '' : 'none';
  document.getElementById('resaPanel-detail').style.display   = tab === 'detail'   ? '' : 'none';
}

export function resetResaFiltres() {
  document.getElementById('resaFiltrePdv').value    = '';
  document.getElementById('resaFiltreTrajet').value = '';
  document.getElementById('resaFiltreStatut').value = '';
  document.getElementById('resaFiltreBus').value     = '';
  document.getElementById('resaFiltreVille').value   = '';
  document.getElementById('resaRecherche').value     = '';

  populatePdvSelectCascade('');
  populateTrajetSelectCascade('', '');
  populateBusSelectCascade('');

  ['resaFiltreVille','resaFiltrePdv','resaFiltreTrajet','resaFiltreBus','resaFiltreStatut'].forEach(updateFiltreHighlight);

  clearResaCustomRange();
}

// ════════════════════════════════
//  EXPOSER AU HTML
// ════════════════════════════════
window.applyResaFiltres          = applyResaFiltres;
window.filtrerParAlerteTrajets   = filtrerParAlerteTrajets;
window.filtrerParAlertePdv       = filtrerParAlertePdv;
window.filtrerParAlerteAnnulations = filtrerParAlerteAnnulations;
window.filtrerParAlerteBaisses  = filtrerParAlerteBaisses;
window.marquerBaisseVerifiee    = marquerBaisseVerifiee;
window.openResaDetail            = openResaDetail;
window.closeResaDetail           = closeResaDetail;
window.handleAnnulerResa         = handleAnnulerResa;
window.closeAlerteModal = closeAlerteModal;
window.resetResaFiltres = resetResaFiltres;
window.closeAnnulConfirm  = closeAnnulConfirm;
window.confirmerAnnulation = confirmerAnnulation;
window.handleModifierResa       = handleModifierResa;
window.closeModifierResa        = closeModifierResa;
window.confirmerModificationResa = confirmerModificationResa;
window.recalculerTotalModif  = recalculerTotalModif;
window.onDescenteModifChange = onDescenteModifChange;
window.ouvrirAnnulationComplete           = ouvrirAnnulationComplete;
window.closeAnnulListePassagers           = closeAnnulListePassagers;
window.ouvrirConfirmationRetraitPassager  = ouvrirConfirmationRetraitPassager;
window.closeRetraitPassagerConfirm        = closeRetraitPassagerConfirm;
window.confirmerRetraitPassager           = confirmerRetraitPassager;
window.setResaPeriode         = setResaPeriode;
window.toggleBilletView       = toggleBilletView;
window.toggleResaCustomPicker = toggleResaCustomPicker;
window.applyResaCustomRange   = applyResaCustomRange;
window.clearResaCustomRange   = clearResaCustomRange;
window.switchResaTab          = switchResaTab;