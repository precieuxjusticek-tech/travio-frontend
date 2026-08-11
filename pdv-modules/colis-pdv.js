// ─── TRAVIO — PDV — Colis (liste, filtres, détail, arrivée/retrait, vérif code) ───

import { apiFetch } from '../api.js';
import { escapeHtml } from '../sanitize.js';
import {
  ICONS, BACKEND, OFFSET_MS_FIN, toBrazzaDate,
  pdvData, trajetList, colisList, colisEnvoyesList,
  setColisList, setColisEnvoyesList,
} from './state-pdv.js';
import { showToast } from './auth-init-pdv.js';
import { getDepartsForTrajet, getBusNomsPourPDV } from './trajets-pdv.js';

// ════════════════════════════════
//  STATE
// ════════════════════════════════
let colisModePDV = 'receptionner'; // 'receptionner' | 'envoyes'
let colisPeriode = 'all';
let colisCustomRange = null;
let colisFiltreTrajet = '';
let colisFiltreBus    = '';
let colisSortBy = 'date_desc';

// ════════════════════════════════
//  CHARGEMENT
// ════════════════════════════════
export async function loadColisPDV(pdvId) {
  try {
    const [resRecep, resEnvoi] = await Promise.all([
      apiFetch(`${BACKEND}/colis/a-receptionner?pdvId=${pdvId}`),
      apiFetch(`${BACKEND}/colis?pdvId=${pdvId}`),
    ]);
    const dataRecep = await resRecep.json();
    const dataEnvoi = await resEnvoi.json();

    if (resRecep.ok) setColisList(dataRecep.colis || []);
    setColisEnvoyesList(dataEnvoi.colis || []);

    filterColisPDV();
    updateColisBadgePDV();
  } catch (err) {
    console.error('Erreur chargement colis PDV :', err);
    setColisList([]);
    setColisEnvoyesList([]);
    renderColisPDV([]);
  }
}

export function setColisModePDV(mode, btn) {
  colisModePDV = mode;
  document.querySelectorAll('#colisModeFilters .rqf-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  filterColisPDV();
}
window.setColisModePDV = setColisModePDV;

export function updateColisBadgePDV() {
  const badge = document.getElementById('drawerBadgeColis');
  if (!badge) return;
  const enTransit = colisList.filter(c => c.statut === 'en_transit').length;
  badge.textContent = enTransit;
  badge.classList.toggle('show', enTransit > 0);
}

// ════════════════════════════════
//  ALERTE EN ATTENTE LONGUE
// ════════════════════════════════
function getColisEnAttenteLonguePDV() {
  const maintenant = Date.now();
  return colisList.filter(c => {
    if (c.statut !== 'arrive') return false;
    const dateRef = c.updatedAt || c.dateArrivee || c.createdAt;
    if (!dateRef) return false;
    const joursEcoules = (maintenant - new Date(dateRef).getTime()) / 86400000;
    return joursEcoules >= 3;
  });
}

export function renderColisAlertesPDV() {
  const wrap = document.getElementById('colisAlertesWrapPDV');
  if (!wrap) return;

  const enAttenteLongue = getColisEnAttenteLonguePDV();

  if (enAttenteLongue.length === 0) {
    wrap.innerHTML = `<div class="resa-alerte-empty">Aucune alerte — tout fonctionne normalement.</div>`;
    return;
  }

  wrap.innerHTML = `
    <div class="resa-alertes-grid">
      <div class="resa-alerte-card danger" onclick="filtrerParAlerteColisAttentePDV()">
        <div class="resa-alerte-head">${ICONS.warning} Colis en attente de retrait</div>
        <div class="resa-alerte-value">${enAttenteLongue.length}</div>
        <div class="resa-alerte-sub">arrivés depuis 3 jours ou plus, non retirés</div>
      </div>
    </div>`;

  window._alerteColisAttentePDVIds = enAttenteLongue.map(c => c.id);
}
window.renderColisAlertesPDV = renderColisAlertesPDV;

export function filtrerParAlerteColisAttentePDV() {
  const ids = window._alerteColisAttentePDVIds || [];
  if (ids.length === 0) { showToast('Aucun colis en attente longue.', ICONS.warning); return; }

  setColisModePDV('receptionner', document.querySelector('#colisModeFilters .rqf-btn'));
  const statutSelect = document.getElementById('colisFiltreStatutPDV');
  if (statutSelect) statutSelect.value = 'arrive';

  const filtered = colisList.filter(c => ids.includes(c.id));
  const countEl = document.getElementById('colisCountNumPDV');
  if (countEl) countEl.textContent = filtered.length;
  renderColisPDV(filtered);

  showToast(`${ids.length} colis en attente de retrait affiché${ids.length > 1 ? 's' : ''}.`, ICONS.warning);
}
window.filtrerParAlerteColisAttentePDV = filtrerParAlerteColisAttentePDV;

// ════════════════════════════════
//  FILTRES / TRI
// ════════════════════════════════
export function filterColisPDV() {
  populateColisFiltresPDV();
  updateColisPeriodeLabelPDV();
  renderColisAlertesPDV();
  ['colisFiltreTrajet', 'colisFiltreBus', 'colisFiltreStatutPDV'].forEach(updateColisFiltreHighlightPDV);

  const search = (document.getElementById('colisSearchPDV')?.value || '').toLowerCase().trim();
  const statut = document.getElementById('colisFiltreStatutPDV')?.value || '';
  const { debut, fin } = getColisBornesEffectivesPDV();

  const source = colisModePDV === 'envoyes' ? colisEnvoyesList : colisList;

  let filtered = source.filter(c => {
    const d = toBrazzaDate(c.createdAt);
    if (debut && d < debut) return false;
    if (fin   && d > fin)   return false;
    if (colisFiltreTrajet && c.trajetId !== colisFiltreTrajet) return false;
    if (colisFiltreBus    && c.busNom   !== colisFiltreBus)    return false;
    if (statut && c.statut !== statut) return false;
    if (search) {
      const champ = `${c.expediteurNom} ${c.expediteurTel} ${c.destinataireNom} ${c.destinataireTel} ${c.codeRetrait}`.toLowerCase();
      if (!champ.includes(search)) return false;
    }
    return true;
  });

  filtered = sortColisPDV(filtered, colisSortBy);

  const countEl = document.getElementById('colisCountNumPDV');
  if (countEl) countEl.textContent = filtered.length;

  renderColisPDV(filtered);
}
window.filterColisPDV = filterColisPDV;

function updateColisFiltreHighlightPDV(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('filtre-actif', !!el.value);
}

function getColisBornesEffectivesPDV() {
  if (colisCustomRange) return { debut: colisCustomRange.debut, fin: colisCustomRange.fin };
  const nowBrazza  = Date.now() + OFFSET_MS_FIN;
  const todayDate  = new Date(nowBrazza);
  const today      = todayDate.toISOString().split('T')[0];

  if (colisPeriode === 'today') return { debut: today, fin: today };
  if (colisPeriode === 'week') {
    const jourSemaine = (todayDate.getUTCDay() + 6) % 7;
    const lundi = new Date(todayDate.getTime() - jourSemaine * 86400000);
    return { debut: lundi.toISOString().split('T')[0], fin: today };
  }
  if (colisPeriode === 'month') {
    const premierJour = new Date(Date.UTC(todayDate.getUTCFullYear(), todayDate.getUTCMonth(), 1));
    return { debut: premierJour.toISOString().split('T')[0], fin: today };
  }
  return { debut: null, fin: null };
}

function updateColisPeriodeLabelPDV() {
  const el = document.getElementById('colisPeriodeLabelPDV');
  if (!el) return;
  const fmtLong  = (str) => new Date(str + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const fmtShort = (str) => new Date(str + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

  if (colisCustomRange) {
    const d = fmtLong(colisCustomRange.debut);
    const f = fmtLong(colisCustomRange.fin);
    el.innerHTML = colisCustomRange.debut === colisCustomRange.fin ? `${ICONS.calendar} ${d}` : `${ICONS.calendar} Du ${d} au ${f}`;
    return;
  }
  const { debut, fin } = getColisBornesEffectivesPDV();
  if (colisPeriode === 'today') el.innerHTML = `${ICONS.calendar} Aujourd'hui · ${fmtLong(debut)}`;
  else if (colisPeriode === 'week')  el.innerHTML = `${ICONS.calendar} Cette semaine · Du ${fmtShort(debut)} au ${fmtLong(fin)}`;
  else if (colisPeriode === 'month') el.innerHTML = `${ICONS.calendar} Ce mois-ci · Du ${fmtShort(debut)} au ${fmtLong(fin)}`;
  else el.innerHTML = `${ICONS.calendar} Toutes les périodes`;
}

export function setColisPeriode(periode, btn) {
  colisPeriode = periode;
  colisCustomRange = null;
  const wrap = document.getElementById('colisCustomPickerWrapPDV');
  if (wrap) wrap.style.display = 'none';
  document.getElementById('colisCustomBtnPDV')?.classList.remove('active');
  document.querySelectorAll('#colisQuickFilters .rqf-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  filterColisPDV();
}
window.setColisPeriode = setColisPeriode;

export function toggleColisCustomPickerPDV() {
  const wrap = document.getElementById('colisCustomPickerWrapPDV');
  if (!wrap) return;
  wrap.style.display = wrap.style.display === 'block' ? 'none' : 'block';
}
window.toggleColisCustomPickerPDV = toggleColisCustomPickerPDV;

export function applyColisCustomRangePDV() {
  const debut = document.getElementById('colisCustomDebutPDV')?.value;
  const fin   = document.getElementById('colisCustomFinPDV')?.value;
  if (!debut || !fin) { showToast('Sélectionnez les deux dates.', ICONS.warning); return; }
  if (debut > fin) { showToast('La date de début doit précéder la date de fin.', ICONS.warning); return; }
  colisCustomRange = { debut, fin };
  document.querySelectorAll('#colisQuickFilters .rqf-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('colisCustomBtnPDV')?.classList.add('active');
  document.getElementById('colisCustomPickerWrapPDV').style.display = 'none';
  filterColisPDV();
}
window.applyColisCustomRangePDV = applyColisCustomRangePDV;

export function clearColisCustomRangePDV() {
  colisCustomRange = null;
  document.getElementById('colisCustomPickerWrapPDV').style.display = 'none';
  document.getElementById('colisCustomBtnPDV')?.classList.remove('active');
  colisPeriode = 'all';
  document.querySelectorAll('#colisQuickFilters .rqf-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('#colisQuickFilters .rqf-btn:nth-child(1)')?.classList.add('active');
  filterColisPDV();
}
window.clearColisCustomRangePDV = clearColisCustomRangePDV;

function populateColisFiltresPDV() {
  const selT = document.getElementById('colisFiltreTrajet');
  const selB = document.getElementById('colisFiltreBus');
  if (!selT || !selB) return;
  if (!selT.dataset.bound) {
    selT.innerHTML = '<option value="">Tous les trajets</option>' +
      trajetList.map(t => `<option value="${escapeHtml(t.id)}">${escapeHtml(t.villeDepart)} → ${escapeHtml(t.villeArrivee)}</option>`).join('');
    populateColisBusSelectCascadePDV('');
    selT.dataset.bound = '1';
  }
}

function populateColisBusSelectCascadePDV(trajetId) {
  const selB = document.getElementById('colisFiltreBus');
  if (!selB) return;
  selB.innerHTML = '<option value="">Tous les bus</option>';
  if (trajetId) {
    getDepartsForTrajet(trajetId)
      .then(departs => {
        const busNoms = [...new Set(departs.map(d => d.busNom).filter(Boolean))].sort();
        selB.innerHTML = '<option value="">Tous les bus</option>' +
        busNoms.map(nom => `<option value="${escapeHtml(nom)}">${escapeHtml(nom)}</option>`).join('');
      })
      .catch(err => console.error('Erreur chargement bus filtre colis :', err));
  } else {
    getBusNomsPourPDV().then(busNoms => {
      selB.innerHTML = '<option value="">Tous les bus</option>' +
        busNoms.map(nom => `<option value="${escapeHtml(nom)}">${escapeHtml(nom)}</option>`).join('');
    });
  }
}

export function onColisTrajetFiltreChangePDV() {
  const trajetId = document.getElementById('colisFiltreTrajet')?.value || '';
  colisFiltreTrajet = trajetId;
  const selB = document.getElementById('colisFiltreBus');
  if (selB) selB.value = '';
  colisFiltreBus = '';
  populateColisBusSelectCascadePDV(trajetId);
  filterColisPDV();
}
window.onColisTrajetFiltreChangePDV = onColisTrajetFiltreChangePDV;

export function onColisBusFiltreChangePDV() {
  colisFiltreBus = document.getElementById('colisFiltreBus')?.value || '';
  filterColisPDV();
}
window.onColisBusFiltreChangePDV = onColisBusFiltreChangePDV;

export function setColisSort(value) {
  colisSortBy = value;
  filterColisPDV();
}
window.setColisSort = setColisSort;

function sortColisPDV(list, mode) {
  const arr = [...list];
  switch (mode) {
    case 'date_asc':  arr.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || '')); break;
    case 'prix_desc': arr.sort((a, b) => (b.prixTransport || 0) - (a.prixTransport || 0)); break;
    case 'prix_asc':  arr.sort((a, b) => (a.prixTransport || 0) - (b.prixTransport || 0)); break;
    case 'date_desc':
    default: arr.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')); break;
  }
  return arr;
}

// ════════════════════════════════
//  RENDU LISTE
// ════════════════════════════════
function badgeStatutColisPDV(statut) {
  if (statut === 'en_transit') return `<span class="resa-meta-badge" style="background:rgba(255,178,63,0.12);color:#FFB23F;">En transit</span>`;
  if (statut === 'arrive')     return `<span class="resa-meta-badge ok">Arrivé</span>`;
  if (statut === 'retire')     return `<span class="resa-meta-badge" style="background:rgba(77,159,255,0.12);color:#4D9FFF;">Retiré</span>`;
  return `<span class="resa-meta-badge">${escapeHtml(statut)}</span>`;
}

export function renderColisPDV(list = colisList) {
  const container = document.getElementById('colisPDVContainer');
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-state large">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><rect x="6" y="16" width="36" height="26" rx="4" stroke="currentColor" stroke-width="2"/><path d="M6 16l18-10 18 10M24 6v36" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <p>${colisModePDV === 'envoyes' ? 'Aucun colis envoyé' : 'Aucun colis pour l\'instant'}</p>
        <small>${colisModePDV === 'envoyes' ? 'Les colis que vous expédiez apparaissent ici' : 'Les colis à réceptionner apparaissent ici'}</small>
      </div>`;
    return;
  }

  const sorted = [...list].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  container.innerHTML = sorted.map(c => `
    <div class="resa-card" onclick="openColisDetailPDV('${c.id}')">
      <div class="resa-card-avatar">${ICONS.bag}</div>
      <div class="resa-card-info">
        <div class="resa-card-name">${colisModePDV === 'envoyes' ? `Vers ${escapeHtml(c.destinataireNom)}` : `${escapeHtml(c.expediteurNom)} → ${escapeHtml(c.destinataireNom)}`}</div>
        <div class="resa-card-route">${escapeHtml(c.routeLabel || '—')}</div>
        <div class="resa-card-meta">
          <span class="resa-meta-badge" style="font-family:monospace;">${escapeHtml(c.codeRetrait)}</span>
          ${badgeStatutColisPDV(c.statut)}
        </div>
      </div>
      <div class="resa-card-right">
        <div class="resa-card-prix">${Number(c.prixTransport || 0).toLocaleString()} XAF</div>
        <div class="resa-card-date">${escapeHtml(c.dateDepart || '')} ${escapeHtml(c.heureDepart || '')}</div>
      </div>
    </div>`).join('');
}

// ════════════════════════════════
//  DÉTAIL COLIS
// ════════════════════════════════
export function openColisDetailPDV(id) {
  const c = colisList.find(x => x.id === id) || colisEnvoyesList.find(x => x.id === id);
  if (!c) return;

  const overlay = document.createElement('div');
  overlay.id = 'colisDetailPDVOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:7000;display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:opacity .3s ease;pointer-events:none;';
  overlay.innerHTML = `
    <div onclick="closeColisDetailPDV()" style="position:absolute;inset:0;background:rgba(10,14,26,0.85);backdrop-filter:blur(6px);"></div>
    <div style="position:relative;z-index:1;background:#0F1525;border:1px solid rgba(255,255,255,0.12);border-radius:24px 24px 0 0;width:100%;max-width:480px;max-height:88vh;overflow-y:auto;padding:20px 20px 32px;" id="colisDetailPDVPanel">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px;">
        <div>
          <div style="font-family:'Syne',sans-serif;font-size:17px;font-weight:800;color:var(--white);">Colis ${escapeHtml(c.codeRetrait)}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:3px;">${badgeStatutColisPDV(c.statut)}</div>
        </div>
        <button onclick="closeColisDetailPDV()" style="background:var(--surface);border:1px solid var(--border);border-radius:8px;color:var(--muted);width:30px;height:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;">${ICONS.close}</button>
      </div>

      <div class="recap-passager-card">
        <div class="recap-passager-title">Expéditeur</div>
        <div class="recap-row"><span>Nom</span><strong>${escapeHtml(c.expediteurNom)}</strong></div>
        <div class="recap-row"><span>Téléphone</span><strong>${escapeHtml(c.expediteurTel)}</strong></div>
      </div>

      <div class="recap-passager-card">
        <div class="recap-passager-title">Destinataire</div>
        <div class="recap-row"><span>Nom</span><strong>${escapeHtml(c.destinataireNom)}</strong></div>
        <div class="recap-row"><span>Téléphone</span><strong>${escapeHtml(c.destinataireTel)}</strong></div>
      </div>

      <div class="recap-card">
        <div class="recap-row"><span>Trajet</span><strong>${escapeHtml(c.routeLabel || '—')}</strong></div>
        <div class="recap-row"><span>Bus</span><strong>${escapeHtml(c.busNom || '—')}</strong></div>
        <div class="recap-row"><span>Départ</span><strong>${escapeHtml(c.dateDepart || '—')} ${escapeHtml(c.heureDepart || '')}</strong></div>
        <div class="recap-row"><span>Embarquement</span><strong>${escapeHtml(c.pdvEmbarquementNom || '—')}${c.pdvEmbarquementVille ? ' — ' + escapeHtml(c.pdvEmbarquementVille) : (c.arretMontee ? ' — ' + escapeHtml(c.arretMontee) : '')}</strong></div>
        <div class="recap-row"><span>Débarquement</span><strong>${escapeHtml(c.pdvDebarquementNom || '—')}${c.pdvDebarquementVille ? ' — ' + escapeHtml(c.pdvDebarquementVille) : (c.arretDescente ? ' — ' + escapeHtml(c.arretDescente) : '')}</strong></div>
        <div class="recap-row"><span>Nature</span><strong>${escapeHtml(c.nature)}</strong></div>
        ${c.poids != null ? `<div class="recap-row"><span>Poids</span><strong>${Number(c.poids)} kg</strong></div>` : ''}
        ${c.valeurDeclaree != null ? `<div class="recap-row"><span>Valeur déclarée</span><strong>${Number(c.valeurDeclaree).toLocaleString()} XAF</strong></div>` : ''}
        ${c.remarques ? `<div class="recap-row"><span>Remarques</span><strong>${escapeHtml(c.remarques)}</strong></div>` : ''}
      </div>

      <div class="recap-total-row">
        <span>Prix du transport</span>
        <strong>${Number(c.prixTransport).toLocaleString()} XAF</strong>
      </div>

      ${(() => {
        const estPdvDebarquement = pdvData?.id === c.pdvDebarquementId;
        if (!estPdvDebarquement) {
          return `
          <div style="background:rgba(255,178,63,0.06);border:1px solid rgba(255,178,63,0.2);border-radius:12px;padding:12px 14px;margin-top:14px;font-size:12px;color:#FFB23F;">
            ${ICONS.info} Ce colis est à retirer au PDV de débarquement, pas ici.
          </div>`;
        }
        if (c.statut === 'en_transit') {
          return `
          <button onclick="marquerColisArrivePDV('${c.id}')"
            style="width:100%;background:var(--accent);color:var(--dark);border:none;border-radius:12px;padding:14px;font-size:14px;font-weight:700;font-family:'DM Sans',sans-serif;cursor:pointer;margin-top:14px;">
            Marquer comme arrivé
          </button>`;
        }
        if (c.statut === 'arrive') {
          const infoArrivee = c.marqueArrivePar && c.dateArrivee
            ? `<div style="font-size:11.5px;color:var(--muted);margin-bottom:10px;">Arrivé le ${new Date(c.dateArrivee).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', timeZone:'Africa/Brazzaville' })} — marqué par ${escapeHtml(c.marqueArrivePar)}</div>`
            : '';
          return `
          ${infoArrivee}
          <button onclick="ouvrirConfirmationRetraitColisPDV('${c.id}')"
            style="width:100%;background:var(--accent);color:var(--dark);border:none;border-radius:12px;padding:14px;font-size:14px;font-weight:700;font-family:'DM Sans',sans-serif;cursor:pointer;margin-top:14px;">
            ${ICONS.check} Confirmer le retrait
          </button>`;
        }

        if (c.statut === 'retire') {
          const labelPiece = escapeHtml({ cni: 'CNI', passeport: 'Passeport', permis: 'Permis de conduire', aucune: 'Aucune pièce' }[c.typePieceIdentite] || c.typePieceIdentite);
          const lignePiece = c.typePieceIdentite === 'aucune'
            ? `<div style="font-size:12.5px;color:var(--white);margin-top:2px;">Pièce : ${labelPiece}${c.infoSansPiece ? ' — ' + escapeHtml(c.infoSansPiece) : ''}</div>`
            : `<div style="font-size:12.5px;color:var(--white);margin-top:2px;">Pièce : ${labelPiece} n° ${escapeHtml(c.numeroPieceIdentite || '—')}</div>`;
          return `
          <div style="background:rgba(0,229,160,0.06);border:1px solid rgba(0,229,160,0.2);border-radius:12px;padding:12px 14px;margin-top:14px;">
            <div style="font-size:12px;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:0.6px;margin-bottom:4px;">${ICONS.check} Colis retiré</div>
            ${c.retirePar ? `<div style="font-size:12.5px;color:var(--white);">Par : ${escapeHtml(c.retirePar)}</div>` : ''}
            ${c.typePieceIdentite ? lignePiece : ''}
            ${c.dateRetrait ? `<div style="font-size:11.5px;color:var(--muted);margin-top:2px;">${new Date(c.dateRetrait).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Africa/Brazzaville' })} à ${new Date(c.dateRetrait).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Brazzaville' })}</div>` : ''}
          </div>`;
        }
        return '';
      })()}
    </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'all';
    document.getElementById('colisDetailPDVPanel').style.transform = 'translateY(0)';
  });
}
window.openColisDetailPDV = openColisDetailPDV;

export function closeColisDetailPDV() {
  const overlay = document.getElementById('colisDetailPDVOverlay');
  if (overlay) { overlay.style.opacity = '0'; overlay.style.pointerEvents = 'none'; setTimeout(() => overlay.remove(), 300); }
}
window.closeColisDetailPDV = closeColisDetailPDV;

// ════════════════════════════════
//  MARQUER ARRIVÉ / RETRAIT
// ════════════════════════════════
export async function marquerColisArrivePDV(id) {
  const btn = document.querySelector(`#colisDetailPDVOverlay button[onclick="marquerColisArrivePDV('${id}')"]`);
  if (btn) { btn.disabled = true; btn.textContent = 'Mise à jour...'; }

  try {
    const res = await apiFetch(`${BACKEND}/colis/${id}/statut`, {
      method: 'PATCH',
      body: JSON.stringify({ statut: 'arrive', marquePar: pdvData?.responsable || pdvData?.nom || null }),
    });
    const data = await res.json();
    if (!res.ok) { showToast('Erreur de mise à jour.', ICONS.banned); return; }

    const idx = colisList.findIndex(c => c.id === id);
    if (idx !== -1) colisList[idx] = data.colis;

    closeColisDetailPDV();
    filterColisPDV();
    updateColisBadgePDV();
    showToast('Colis marqué comme arrivé.', ICONS.check, true);
    openColisDetailPDV(id);

  } catch (err) {
    console.error('Erreur marquage arrivé colis :', err);
    showToast('Impossible de contacter le serveur.', ICONS.banned);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Marquer comme arrivé'; }
  }
}
window.marquerColisArrivePDV = marquerColisArrivePDV;

export function ouvrirConfirmationRetraitColisPDV(id) {
  const c = colisList.find(x => x.id === id);
  if (!c) return;

  const existing = document.getElementById('colisRetraitConfirmOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'colisRetraitConfirmOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:8500;display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:opacity .3s ease;pointer-events:none;';
  overlay.innerHTML = `
    <div onclick="closeColisRetraitConfirm()" style="position:absolute;inset:0;background:rgba(10,14,26,0.9);backdrop-filter:blur(6px);"></div>
    <div style="position:relative;z-index:1;background:#0F1525;border:1px solid rgba(255,255,255,0.12);border-radius:24px 24px 0 0;width:100%;max-width:420px;padding:20px 20px 32px;box-shadow:0 -24px 80px rgba(0,0,0,0.5);transform:translateY(40px);transition:transform .35s cubic-bezier(0.34,1.1,.64,1);" id="colisRetraitPanel">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px;">
        <div>
          <div style="font-family:'Syne',sans-serif;font-size:16px;font-weight:800;color:var(--white);">Confirmer le retrait</div>
          <div style="font-size:12px;color:var(--muted);margin-top:3px;">Vérifiez l'identité avant de confirmer.</div>
        </div>
        <button onclick="closeColisRetraitConfirm()" style="background:var(--surface);border:1px solid var(--border);border-radius:8px;color:var(--muted);width:30px;height:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:13px;flex-shrink:0;">${ICONS.close}</button>
      </div>
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:12px 16px;margin-bottom:14px;">
        <div style="font-size:13px;font-weight:600;color:var(--white);">Destinataire attendu</div>
        <div style="font-size:13px;color:var(--white);margin-top:4px;">${escapeHtml(c.destinataireNom)} · ${escapeHtml(c.destinataireTel)}</div>
      </div>
      <div class="vente-field-group">
        <label>Nom de la personne qui retire le colis <span class="req">*</span></label>
        <input type="text" class="vente-input" id="colisRetraitPar" placeholder="Ex : ${escapeHtml(c.destinataireNom)}">
      </div>

      <div class="vente-field-group">
        <label>Type de pièce d'identité <span class="req">*</span></label>
        <select class="vente-select" id="colisRetraitTypePiece" onchange="onColisRetraitTypePieceChange()">
          <option value="">— Sélectionner —</option>
          <option value="cni">Carte nationale d'identité</option>
          <option value="passeport">Passeport</option>
          <option value="permis">Permis de conduire</option>
          <option value="aucune">Aucune pièce disponible</option>
        </select>
      </div>
      <div class="vente-field-group" id="colisRetraitNumPieceGroup">
        <label>Numéro de la pièce <span class="req">*</span></label>
        <input type="text" class="vente-input" id="colisRetraitNumPiece" placeholder="Ex : CG0012345">
      </div>
      <div class="vente-field-group" id="colisRetraitSansPieceGroup" style="display:none;">
        <label>Précision (témoin, motif...) <span class="req">*</span></label>
        <input type="text" class="vente-input" id="colisRetraitSansPieceInfo" placeholder="Ex : retrait en présence de M. Nzila, agent PDV">
      </div>

      <div style="display:flex;flex-direction:column;gap:8px;margin-top:12px;">
        <button id="colisRetraitBtnConfirm"
          style="width:100%;background:var(--accent);color:var(--dark);border:none;border-radius:12px;padding:14px;font-size:14px;font-weight:700;font-family:'DM Sans',sans-serif;cursor:pointer;"
          onclick="confirmerRetraitColisPDV('${id}')">
          ${ICONS.check} Confirmer le retrait
        </button>
        <button onclick="closeColisRetraitConfirm()"
          style="width:100%;background:var(--surface);color:var(--muted);border:1px solid var(--border);border-radius:12px;padding:12px;font-size:13px;font-weight:600;font-family:'DM Sans',sans-serif;cursor:pointer;">
          Retour
        </button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'all';
    const panel = document.getElementById('colisRetraitPanel');
    if (panel) panel.style.transform = 'translateY(0)';
  });
}
window.ouvrirConfirmationRetraitColisPDV = ouvrirConfirmationRetraitColisPDV;

export function closeColisRetraitConfirm() {
  const o = document.getElementById('colisRetraitConfirmOverlay');
  if (o) { o.style.opacity = '0'; o.style.pointerEvents = 'none'; setTimeout(() => o.remove(), 300); }
}
window.closeColisRetraitConfirm = closeColisRetraitConfirm;

export function onColisRetraitTypePieceChange() {
  const type = document.getElementById('colisRetraitTypePiece')?.value;
  const numGroup  = document.getElementById('colisRetraitNumPieceGroup');
  const sansGroup = document.getElementById('colisRetraitSansPieceGroup');
  const estSansPiece = type === 'aucune';
  if (numGroup)  numGroup.style.display  = estSansPiece ? 'none' : 'block';
  if (sansGroup) sansGroup.style.display = estSansPiece ? 'block' : 'none';
}
window.onColisRetraitTypePieceChange = onColisRetraitTypePieceChange;

export async function confirmerRetraitColisPDV(id) {
  const retirePar           = document.getElementById('colisRetraitPar')?.value.trim();
  const typePieceIdentite   = document.getElementById('colisRetraitTypePiece')?.value;
  const estSansPiece        = typePieceIdentite === 'aucune';
  const numeroPieceIdentite = document.getElementById('colisRetraitNumPiece')?.value.trim();
  const infoSansPiece       = document.getElementById('colisRetraitSansPieceInfo')?.value.trim();

  if (!retirePar) { showToast('Indiquez le nom de la personne qui retire le colis.', ICONS.warning); return; }
  if (!typePieceIdentite) { showToast("Sélectionnez le type de pièce d'identité.", ICONS.warning); return; }
  if (estSansPiece) {
    if (!infoSansPiece) { showToast("Indiquez une précision en l'absence de pièce d'identité.", ICONS.warning); return; }
  } else {
    if (!numeroPieceIdentite) { showToast("Indiquez le numéro de la pièce d'identité.", ICONS.warning); return; }
  }

  const btn = document.getElementById('colisRetraitBtnConfirm');
  if (btn) { btn.disabled = true; btn.textContent = 'Retrait en cours...'; }

  try {
    const res = await apiFetch(`${BACKEND}/colis/${id}/statut`, {
      method: 'PATCH',
      body: JSON.stringify({
        statut: 'retire',
        retirePar,
        typePieceIdentite,
        numeroPieceIdentite: estSansPiece ? null : numeroPieceIdentite,
        infoSansPiece: estSansPiece ? infoSansPiece : null,
      }),
    });
    const data = await res.json();
    if (!res.ok) { showToast('Erreur lors du retrait.', ICONS.banned); return; }

    const idx = colisList.findIndex(c => c.id === id);
    if (idx !== -1) colisList[idx] = data.colis;

    closeColisRetraitConfirm();
    closeColisDetailPDV();
    filterColisPDV();
    updateColisBadgePDV();
    showToast('Colis retiré avec succès.', ICONS.check, true);

  } catch (err) {
    console.error('Erreur retrait colis :', err);
    showToast('Impossible de contacter le serveur.', ICONS.banned);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = `${ICONS.check} Confirmer le retrait`; }
  }
}
window.confirmerRetraitColisPDV = confirmerRetraitColisPDV;

// ════════════════════════════════
//  VÉRIFICATION PAR CODE
// ════════════════════════════════
export function ouvrirVerificationCodeColisPDV() {
  const existing = document.getElementById('colisVerifOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'colisVerifOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:8000;display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:opacity .3s ease;pointer-events:none;';
  overlay.innerHTML = `
    <div onclick="closeVerificationCodeColisPDV()" style="position:absolute;inset:0;background:rgba(10,14,26,0.88);backdrop-filter:blur(6px);"></div>
    <div style="position:relative;z-index:1;background:#0F1525;border:1px solid rgba(255,255,255,0.12);border-radius:24px 24px 0 0;width:100%;max-width:420px;padding:20px 20px 32px;box-shadow:0 -24px 80px rgba(0,0,0,0.5);transform:translateY(40px);transition:transform .35s cubic-bezier(0.34,1.1,.64,1);" id="colisVerifPanel">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px;">
        <div>
          <div style="font-family:'Syne',sans-serif;font-size:16px;font-weight:800;color:var(--white);">Vérifier un code de retrait</div>
          <div style="font-size:12px;color:var(--muted);margin-top:3px;">Demandez le code au destinataire.</div>
        </div>
        <button onclick="closeVerificationCodeColisPDV()" style="background:var(--surface);border:1px solid var(--border);border-radius:8px;color:var(--muted);width:30px;height:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:13px;flex-shrink:0;">${ICONS.close}</button>
      </div>
      <div class="vente-field-group">
        <label>Code de retrait</label>
        <input type="text" class="vente-input" id="colisVerifCode" placeholder="Ex : TRV-A7K9M2" style="text-transform:uppercase;">
      </div>
      <div id="colisVerifResult" style="margin-top:12px;"></div>
      <button style="width:100%;background:var(--accent);color:var(--dark);border:none;border-radius:12px;padding:14px;font-size:14px;font-weight:700;font-family:'DM Sans',sans-serif;cursor:pointer;margin-top:12px;" onclick="verifierCodeColisPDV()">
        ${ICONS.eye} Vérifier
      </button>
    </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'all';
    const panel = document.getElementById('colisVerifPanel');
    if (panel) panel.style.transform = 'translateY(0)';
    document.getElementById('colisVerifCode')?.focus();
  });
}
window.ouvrirVerificationCodeColisPDV = ouvrirVerificationCodeColisPDV;

export function closeVerificationCodeColisPDV() {
  const o = document.getElementById('colisVerifOverlay');
  if (o) { o.style.opacity = '0'; o.style.pointerEvents = 'none'; setTimeout(() => o.remove(), 300); }
}
window.closeVerificationCodeColisPDV = closeVerificationCodeColisPDV;

export async function verifierCodeColisPDV() {
  const code = document.getElementById('colisVerifCode')?.value.trim();
  const resultEl = document.getElementById('colisVerifResult');
  if (!code) { showToast('Saisissez un code.', ICONS.warning); return; }
  if (resultEl) resultEl.innerHTML = `<div style="text-align:center;padding:12px;color:var(--muted);font-size:12px;">Vérification...</div>`;

  try {
    const res = await apiFetch(`${BACKEND}/colis/verifier/${encodeURIComponent(code)}`);
    const data = await res.json();

    if (!res.ok) {
      if (resultEl) {
        resultEl.innerHTML = `
          <div style="background:rgba(255,77,106,0.08);border:1px solid rgba(255,77,106,0.25);border-radius:12px;padding:12px 14px;font-size:13px;color:#FF4D6A;">
            Colis introuvable.
          </div>`;
      }
      return;
    }

    const c = data.colis;
    const idx = colisList.findIndex(x => x.id === c.id);
    if (idx !== -1) colisList[idx] = c; else colisList.push(c);

    if (resultEl) {
      resultEl.innerHTML = `
        <div style="background:rgba(0,229,160,0.06);border:1px solid rgba(0,229,160,0.2);border-radius:12px;padding:12px 14px;">
          <div style="font-size:13px;font-weight:700;color:var(--white);">${escapeHtml(c.destinataireNom)}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px;">${escapeHtml(c.destinataireTel)} · ${escapeHtml(c.nature)}</div>
          <button style="width:100%;margin-top:10px;background:var(--accent);color:var(--dark);border:none;border-radius:10px;padding:11px;font-size:13px;font-weight:700;cursor:pointer;" onclick="closeVerificationCodeColisPDV();openColisDetailPDV('${c.id}')">
            Voir le détail
          </button>
        </div>`;
    }

  } catch (err) {
    console.error('Erreur vérification code colis :', err);
    if (resultEl) resultEl.innerHTML = `<div style="color:#FF4D6A;font-size:12px;text-align:center;">Impossible de contacter le serveur.</div>`;
  }
}
window.verifierCodeColisPDV = verifierCodeColisPDV;