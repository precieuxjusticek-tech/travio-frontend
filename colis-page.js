// ─── TRAVIO — Colis (vue siège, lecture seule + suivi statut) ───

import { apiFetch } from './api.js';
import { agenceData, pdvList, trajetList } from './state.js';
import { showToast, TOAST_ICONS } from './toast-utils.js';
import { escapeHtml, escapeJsAttr } from './sanitize.js';
import { loadDeparts, loadAllDeparts } from './trajets.js';

const OFFSET_MS = 1 * 60 * 60 * 1000; // ajuste UTC -> heure Brazzaville

function toBrazzaDate(isoStr) {
  if (!isoStr) return '';
  return new Date(new Date(isoStr).getTime() + OFFSET_MS).toISOString().split('T')[0];
}

let colisPeriode = 'all';
let colisCustomRange = null;

export function setColisPeriode(periode, btn) {
  colisPeriode = periode;
  colisCustomRange = null;
  const wrap = document.getElementById('colisCustomPickerWrap');
  if (wrap) wrap.style.display = 'none';
  document.querySelectorAll('#colisPeriodeFilters .rqf-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  applyColisFiltres();
  updateColisPeriodeLabel();
}

export function toggleColisCustomPicker() {
  const wrap = document.getElementById('colisCustomPickerWrap');
  if (!wrap) return;
  wrap.style.display = wrap.style.display === 'block' ? 'none' : 'block';
}

export function applyColisCustomRange() {
  const debut = document.getElementById('colisCustomDebut')?.value;
  const fin   = document.getElementById('colisCustomFin')?.value;
  if (!debut || !fin) { showToast('Sélectionnez les deux dates.', TOAST_ICONS.warning); return; }
  if (debut > fin) { showToast('La date de début doit précéder la date de fin.', TOAST_ICONS.warning); return; }

  colisCustomRange = { debut, fin };
  document.querySelectorAll('#colisPeriodeFilters .rqf-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('colisCustomBtn')?.classList.add('active');
  document.getElementById('colisCustomPickerWrap').style.display = 'none';
  applyColisFiltres();
  updateColisPeriodeLabel();
}

export function clearColisCustomRange() {
  colisCustomRange = null;
  document.getElementById('colisCustomPickerWrap').style.display = 'none';
  document.getElementById('colisCustomBtn')?.classList.remove('active');
  colisPeriode = 'all';
  document.querySelectorAll('#colisPeriodeFilters .rqf-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('#colisPeriodeFilters .rqf-btn:nth-child(4)')?.classList.add('active');
  applyColisFiltres();
  updateColisPeriodeLabel();
}

function updateColisPeriodeLabel() {
  const el = document.getElementById('colisPeriodeLabel');
  if (!el) return;

  const iconCal = '<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M5 1v4M11 1v4M2 7h12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
  const fmtLong  = (str) => new Date(str + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const fmtShort = (str) => new Date(str + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

  if (colisCustomRange) {
    const d = fmtLong(colisCustomRange.debut);
    const f = fmtLong(colisCustomRange.fin);
    el.innerHTML = colisCustomRange.debut === colisCustomRange.fin ? `${iconCal} ${d}` : `${iconCal} Du ${d} au ${f}`;
    return;
  }

  const { debut, fin } = getColisBornesEffectives();

  if (colisPeriode === 'today') el.innerHTML = `${iconCal} Aujourd'hui · ${fmtLong(debut)}`;
  else if (colisPeriode === 'week') el.innerHTML = `${iconCal} Cette semaine · Du ${fmtShort(debut)} au ${fmtLong(fin)}`;
  else if (colisPeriode === 'month') el.innerHTML = `${iconCal} Ce mois-ci · Du ${fmtShort(debut)} au ${fmtLong(fin)}`;
  else el.innerHTML = `${iconCal} Toutes les périodes`;
}

function getColisBornesEffectives() {
  if (colisCustomRange) return { debut: colisCustomRange.debut, fin: colisCustomRange.fin };
  const nowBrazza = Date.now() + OFFSET_MS;
  const todayDate = new Date(nowBrazza);
  const today = todayDate.toISOString().split('T')[0];

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

const API_BASE = 'https://travio-backend-pa4q.onrender.com';

let colisListe   = [];
let colisFiltres = [];
let colisActuel  = null;

export function getColisListe() {
  return colisListe;
}

// ════════════════════════════════
//  CHARGEMENT + STRUCTURE (une seule fois par entrée sur la page)
// ════════════════════════════════
export async function renderColisPage() {
  const container = document.getElementById('colisContainer');

  const dejaCharge = colisListe.length > 0;

  // Si le container existe et qu'on n'a encore rien chargé, on affiche le loader
  if (container && !dejaCharge) {
    container.innerHTML = `<div class="empty-state large"><p>Chargement des colis…</p></div>`;
  }

  try {
    const agenceId = agenceData.id;
    const res = await apiFetch(`${API_BASE}/colis/agence?agenceId=${agenceId}`, { method: 'GET' });
    const data = await res.json();

    if (!res.ok) {
      if (container && !dejaCharge) {
        container.innerHTML = `<div class="empty-state large"><p>${escapeHtml(data.message) || 'Erreur de chargement.'}</p></div>`;
      }
      return;
    }

    colisListe = data.colis || [];
    updateColisBadge();

    // Si le container est visible (page Colis ouverte), on (re)construit le shell si besoin
    if (container) {
      if (!document.getElementById('colisStatsWrap')) {
        renderColisShell(container);
      }
      applyColisFiltres();
    }

  } catch (err) {
    console.error('Erreur chargement colis :', err);
    if (container && !dejaCharge) {
      container.innerHTML = `<div class="empty-state large"><p>Impossible de contacter le serveur.</p></div>`;
    }
  }
}

// Squelette rendu une seule fois : filtres statiques + zones à rafraîchir
function renderColisShell(container) {
  const villes = [...new Set(pdvList.map(p => p.ville).filter(Boolean))].sort();

  container.innerHTML = `
    <div id="colisAlertesWrap" style="margin-bottom:16px;"></div>
    <div id="colisStatsWrap" style="margin-bottom:16px;"></div>

    <div class="overview-card" style="padding:14px 16px;">
      <div class="resa-filters-row" style="align-items:flex-end;">
        <div class="pdv-field-group" style="margin:0;flex:0 0 140px;">
          <label>Ville</label>
          <select class="pdv-select" id="colisFiltreVille">
            <option value="">Toutes les villes</option>
            ${villes.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('')}
          </select>
        </div>
        <div class="pdv-field-group" style="margin:0;flex:1;min-width:150px;">
          <label>PDV</label>
          <select class="pdv-select" id="colisFiltrePdv">
            <option value="">Tous les PDV</option>
            ${pdvList.map(p => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.nom)}</option>`).join('')}
          </select>
        </div>
        <div class="pdv-field-group" style="margin:0;flex:1;min-width:150px;">
          <label>Trajet</label>
          <select class="pdv-select" id="colisFiltreTrajet">
            <option value="">Tous les trajets</option>
            ${trajetList.map(t => `<option value="${escapeHtml(t.id)}">${escapeHtml(t.villeDepart)} → ${escapeHtml(t.villeArrivee)}</option>`).join('')}
          </select>
        </div>
        <div class="pdv-field-group" style="margin:0;flex:0 0 140px;">
          <label>Bus</label>
          <select class="pdv-select" id="colisFiltreBus">
            <option value="">Tous les bus</option>
          </select>
        </div>
        <div class="pdv-field-group" style="margin:0;flex:0 0 160px;">
          <label>Statut</label>
          <select class="pdv-select" id="colisFiltreStatut">
            <option value="">Tous statuts</option>
            <option value="en_transit">En transit</option>
            <option value="arrive">Arrivé</option>
            <option value="retire">Retiré</option>
          </select>
        </div>
        <div class="pdv-field-group" style="margin:0;flex:1.4;min-width:180px;">
          <label>Recherche</label>
          <input type="text" class="pdv-input" id="colisRecherche" placeholder="Nom, téléphone, code de retrait…">
        </div>
      </div>
      <div style="display:flex;justify-content:flex-end;margin-top:10px;">
        <button class="btn-action-secondary" onclick="resetColisFiltres()" style="font-size:12px;padding:7px 14px;">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:4px;">
            <path d="M13 8A5 5 0 103 8M13 8V4M13 8H9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Réinitialiser les filtres
        </button>
      </div>
    </div>

    <div class="overview-card" id="colisListWrap" style="padding:0;overflow:hidden;min-height:300px;"></div>
  `;

  // Écouteurs attachés une seule fois, sur des éléments qui ne sont plus jamais détruits
  document.getElementById('colisFiltreVille')?.addEventListener('change', applyColisFiltres);
  document.getElementById('colisFiltrePdv')?.addEventListener('change', applyColisFiltres);
  document.getElementById('colisFiltreTrajet')?.addEventListener('change', onColisTrajetChange);
  document.getElementById('colisFiltreBus')?.addEventListener('change', applyColisFiltres);
  document.getElementById('colisFiltreStatut')?.addEventListener('change', applyColisFiltres);
  document.getElementById('colisRecherche')?.addEventListener('input', applyColisFiltres);

  populateColisBusSelectCascade('');
  updateColisPeriodeLabel();
}

async function populateColisBusSelectCascade(trajetId) {
  const busSelect = document.getElementById('colisFiltreBus');
  if (!busSelect) return;
  busSelect.innerHTML = `<option value="">Tous les bus</option>`;

  try {
    const departs = trajetId
      ? await loadDeparts(trajetId)
      : await loadAllDeparts(agenceData.id);

    const busNoms = [...new Set(departs.map(d => d.busNom).filter(Boolean))].sort();
    busSelect.innerHTML = `<option value="">Tous les bus</option>` +
      busNoms.map(nom => `<option value="${escapeHtml(nom)}">${escapeHtml(nom)}</option>`).join('');
  } catch (err) {
    console.error('Erreur chargement bus filtre colis :', err);
  }
}

function onColisTrajetChange() {
  const trajetId = document.getElementById('colisFiltreTrajet')?.value || '';
  document.getElementById('colisFiltreBus').value = '';
  populateColisBusSelectCascade(trajetId);
  applyColisFiltres();
}

// ════════════════════════════════
//  FILTRES — ne touchent QUE les zones dynamiques
// ════════════════════════════════
export function applyColisFiltres() {
  updateColisPeriodeLabel();

  const ville     = document.getElementById('colisFiltreVille')?.value    || '';
  const pdvId     = document.getElementById('colisFiltrePdv')?.value      || '';
  const trajetId  = document.getElementById('colisFiltreTrajet')?.value   || '';
  const busNom    = document.getElementById('colisFiltreBus')?.value      || '';
  const statut    = document.getElementById('colisFiltreStatut')?.value   || '';
  const recherche = (document.getElementById('colisRecherche')?.value || '').trim().toLowerCase();

  const { debut, fin } = getColisBornesEffectives();

  colisFiltres = colisListe.filter(c => {
    if (statut  && c.statut  !== statut)  return false;
    if (pdvId   && c.pdvId   !== pdvId)   return false;
    if (trajetId && c.trajetId !== trajetId) return false;
    if (busNom  && c.busNom  !== busNom)  return false;

    if (ville) {
      const pdv = pdvList.find(p => p.id === c.pdvId);
      if ((pdv?.ville || '') !== ville) return false;
    }

    const d = toBrazzaDate(c.createdAt);
    if (debut && d < debut) return false;
    if (fin   && d > fin)   return false;

    if (recherche) {
      const champ = `${c.expediteurNom} ${c.expediteurTel} ${c.destinataireNom} ${c.destinataireTel} ${c.codeRetrait} ${c.routeLabel || ''}`.toLowerCase();
      if (!champ.includes(recherche)) return false;
    }
    return true;
  });

  renderColisStats();
  renderColisAlertes();
  renderColisTable();
  updateColisBadge();
}

export function resetColisFiltres() {
  ['colisFiltreVille','colisFiltrePdv','colisFiltreTrajet','colisFiltreBus','colisFiltreStatut','colisRecherche'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  populateColisBusSelectCascade('');
  clearColisCustomRange(); // remet la période à "Tout" + relance applyColisFiltres()
}

// ════════════════════════════════
//  STATS (zone dynamique)
// ════════════════════════════════

// ════════════════════════════════
//  ALERTES
// ════════════════════════════════
const ICONS_COLIS = {
  warning: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:4px;"><path d="M8 2L1 14h14L8 2z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M8 6.5v3.5M8 12v.1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
};

function getColisEnAttenteLongue() {
  const maintenant = Date.now();
  return colisListe.filter(c => {
    if (c.statut !== 'arrive') return false;
    const dateRef = c.updatedAt || c.createdAt;
    if (!dateRef) return false;
    const joursEcoules = (maintenant - new Date(dateRef).getTime()) / 86400000;
    return joursEcoules >= 3;
  });
}

function renderColisAlertes() {
  const wrap = document.getElementById('colisAlertesWrap');
  if (!wrap) return;

  const enAttenteLongue = getColisEnAttenteLongue();

  if (enAttenteLongue.length === 0) {
    wrap.innerHTML = `<div class="resa-alerte-empty">Aucune alerte — tout fonctionne normalement.</div>`;
    return;
  }

  wrap.innerHTML = `
    <div class="resa-alertes-grid">
      <div class="resa-alerte-card danger" onclick="filtrerParAlerteColisAttente()">
        <div class="resa-alerte-head">${ICONS_COLIS.warning} Colis en attente de retrait</div>
        <div class="resa-alerte-value">${enAttenteLongue.length}</div>
        <div class="resa-alerte-sub">arrivés depuis 3 jours ou plus, non retirés</div>
      </div>
    </div>`;

  window._alerteColisAttenteIds = enAttenteLongue.map(c => c.id);
}

export function filtrerParAlerteColisAttente() {
  const ids = window._alerteColisAttenteIds || [];
  if (ids.length === 0) { showToast('Aucun colis en attente longue.', TOAST_ICONS.info); return; }

  // Réinitialise les filtres puis force le statut "Arrivé" pour isoler ces colis
  resetColisFiltres();
  const statutSelect = document.getElementById('colisFiltreStatut');
  if (statutSelect) statutSelect.value = 'arrive';

  colisFiltres = colisListe.filter(c => ids.includes(c.id));
  renderColisStats();
  renderColisTable();
  updateColisBadge();

  showToast(`${ids.length} colis en attente de retrait affiché${ids.length > 1 ? 's' : ''}.`, TOAST_ICONS.warning);
}

function getColisPeriodePrecedente() {
  const { debut, fin } = getColisBornesEffectives();
  if (!debut || !fin) return null; // "Tout" n'a pas de période précédente logique

  const dureeMs = new Date(fin + 'T00:00:00Z').getTime() - new Date(debut + 'T00:00:00Z').getTime();
  const finPrec = new Date(new Date(debut + 'T00:00:00Z').getTime() - 86400000).toISOString().split('T')[0];
  const debutPrec = new Date(new Date(finPrec + 'T00:00:00Z').getTime() - dureeMs).toISOString().split('T')[0];

  return { debut: debutPrec, fin: finPrec };
}

function getColisFiltresActifsSansPeriode() {
  return {
    ville:     document.getElementById('colisFiltreVille')?.value    || '',
    pdvId:     document.getElementById('colisFiltrePdv')?.value      || '',
    trajetId:  document.getElementById('colisFiltreTrajet')?.value   || '',
    busNom:    document.getElementById('colisFiltreBus')?.value      || '',
    statut:    document.getElementById('colisFiltreStatut')?.value   || '',
    recherche: (document.getElementById('colisRecherche')?.value || '').trim().toLowerCase(),
  };
}

function filtrerColisSansPeriode(liste, f) {
  return liste.filter(c => {
    if (f.statut   && c.statut   !== f.statut)   return false;
    if (f.pdvId     && c.pdvId     !== f.pdvId)     return false;
    if (f.trajetId  && c.trajetId  !== f.trajetId)  return false;
    if (f.busNom    && c.busNom    !== f.busNom)    return false;
    if (f.ville) {
      const pdv = pdvList.find(p => p.id === c.pdvId);
      if ((pdv?.ville || '') !== f.ville) return false;
    }
    if (f.recherche) {
      const champ = `${c.expediteurNom} ${c.expediteurTel} ${c.destinataireNom} ${c.destinataireTel} ${c.codeRetrait} ${c.routeLabel || ''}`.toLowerCase();
      if (!champ.includes(f.recherche)) return false;
    }
    return true;
  });
}

function getRevenuColisPeriodePrecedente() {
  const periodePrec = getColisPeriodePrecedente();
  if (!periodePrec) return null;

  const f = getColisFiltresActifsSansPeriode();
  const baseListe = filtrerColisSansPeriode(colisListe, f);

  const revenuPrec = baseListe
    .filter(c => {
      const d = toBrazzaDate(c.createdAt);
      return d >= periodePrec.debut && d <= periodePrec.fin;
    })
    .reduce((s, c) => s + Number(c.prixTransport || 0), 0);

  return revenuPrec;
}

function renderColisStats() {
  const wrap = document.getElementById('colisStatsWrap');
  if (!wrap) return;

  const total     = colisFiltres.length;
  const enTransit = colisFiltres.filter(c => c.statut === 'en_transit').length;
  const arrive    = colisFiltres.filter(c => c.statut === 'arrive').length;
  const retire    = colisFiltres.filter(c => c.statut === 'retire').length;

  const revenuTotal = colisFiltres.reduce((s, c) => s + Number(c.prixTransport || 0), 0);
  const prixMoyen    = total > 0 ? Math.round(revenuTotal / total) : 0;

  // ⬅️ NOUVEAU : comparaison vs période précédente
  const revenuPrec = getRevenuColisPeriodePrecedente();
  let deltaRevenuHTML = `<div class="stat-delta">sur la période</div>`;
  if (revenuPrec !== null) {
    if (revenuPrec > 0) {
      const variation = Math.round(((revenuTotal - revenuPrec) / revenuPrec) * 100);
      const positif = variation >= 0;
      deltaRevenuHTML = `<div class="stat-delta" style="color:${positif ? '#00E5A0' : '#FF4D6A'};">${positif ? '+' : ''}${variation}% vs période précédente</div>`;
    } else if (revenuTotal > 0) {
      deltaRevenuHTML = `<div class="stat-delta" style="color:#00E5A0;">Nouveau — rien sur la période précédente</div>`;
    } else {
      deltaRevenuHTML = `<div class="stat-delta">sur la période</div>`;
    }
  }

  wrap.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-label">Revenu colis</span>
          <div class="stat-icon green">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="11" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M1 7h14" stroke="currentColor" stroke-width="1.5"/><path d="M5 11h2M9 11h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </div>
        </div>
        <div class="stat-value">${revenuTotal.toLocaleString('fr-FR')} XAF</div>
        ${deltaRevenuHTML}
      </div>
      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-label">Total colis</span>
        </div>
        <div class="stat-value">${total}</div>
        <div class="stat-delta">Prix moyen : ${prixMoyen.toLocaleString('fr-FR')} XAF</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-header"><span class="stat-label">En transit</span></div>
        <div class="stat-value">${enTransit}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-header"><span class="stat-label">Arrivés (à retirer)</span></div>
        <div class="stat-value">${arrive}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-header"><span class="stat-label">Retirés</span></div>
        <div class="stat-value">${retire}</div>
      </div>
    </div>
  `;
}

// ════════════════════════════════
//  TABLEAU (zone dynamique)
// ════════════════════════════════
function renderColisTable() {
  const wrap = document.getElementById('colisListWrap');
  if (!wrap) return;

  if (colisFiltres.length === 0) {
    wrap.innerHTML = `
      <div class="empty-state large">
        <p>Aucun colis pour ces filtres</p>
        <small>Les colis apparaissent ici dès qu'un PDV les enregistre</small>
      </div>`;
    return;
  }

  const sorted = [...colisFiltres].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  wrap.innerHTML = `
    <table class="resa-table">
      <thead>
        <tr>
          <th>Expéditeur → Destinataire</th>
          <th>Trajet</th>
          <th>Code retrait</th>
          <th>Prix</th>
          <th>Statut</th>
        </tr>
      </thead>
      <tbody>
        ${sorted.map(c => `
          <tr onclick="openColisDetail('${escapeJsAttr(c.id)}')" style="cursor:pointer;">
            <td>
              <div class="resa-row-name">${escapeHtml(c.expediteurNom)} → ${escapeHtml(c.destinataireNom)}</div>
              <div class="resa-row-tel">${escapeHtml(c.expediteurTel)} → ${escapeHtml(c.destinataireTel)}</div>
            </td>
            <td>
              <div class="resa-row-route">${escapeHtml(c.routeLabel) || '—'}</div>
              <div class="resa-row-meta">${escapeHtml(c.dateDepart) || ''} ${escapeHtml(c.heureDepart) || ''}</div>
            </td>
            <td><span style="font-family:monospace;font-weight:700;">${escapeHtml(c.codeRetrait)}</span></td>
            <td>${Number(c.prixTransport || 0).toLocaleString('fr-FR')} XAF</td>
            <td>${badgeStatutColis(c.statut)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function badgeStatutColis(statut) {
  if (statut === 'en_transit') return `<span class="pol-badge pol-badge-orange">En transit</span>`;
  if (statut === 'arrive')     return `<span class="pol-badge pol-badge-vert">Arrivé</span>`;
  if (statut === 'retire')     return `<span class="pol-badge" style="background:rgba(77,159,255,0.15);color:#4D9FFF;">Retiré</span>`;
  return `<span class="pol-badge pol-badge-rouge">${escapeHtml(statut)}</span>`;
}

// ════════════════════════════════
//  BADGE NAV (colis arrivés = à surveiller)
// ════════════════════════════════
export function updateColisBadge() {
  const badge = document.getElementById('navBadgeColis');
  if (!badge) return;
  const arrive = colisListe.filter(c => c.statut === 'arrive').length;
  badge.textContent = arrive;
  badge.classList.toggle('show', arrive > 0);
}

// ════════════════════════════════
//  DÉTAIL COLIS (panneau latéral)
// ════════════════════════════════
export function openColisDetail(id) {
  colisActuel = colisListe.find(c => c.id === id);
  if (!colisActuel) return;

  ensureColisOverlay();
  const overlay = document.getElementById('colisSideOverlay');
  const body = document.getElementById('colisSideBody');

  const c = colisActuel;
  body.innerHTML = `
    <div class="resa-side-header">
      <div>
        <h2>Colis ${escapeHtml(c.codeRetrait)}</h2>
        <p>${badgeStatutColis(c.statut)}</p>
      </div>
      <button class="pdv-overlay-close" onclick="closeColisDetail()">✕</button>
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
      <div class="recap-row"><span>Trajet</span><strong>${escapeHtml(c.routeLabel) || '—'}</strong></div>
      <div class="recap-row"><span>Départ</span><strong>${escapeHtml(c.dateDepart) || '—'} ${escapeHtml(c.heureDepart) || ''}</strong></div>
      <div class="recap-row"><span>Bus</span><strong>${escapeHtml(c.busNom) || '—'}</strong></div>
      <div class="recap-row"><span>Embarquement</span><strong>${escapeHtml(c.pdvEmbarquementNom) || '—'}${c.pdvEmbarquementVille ? ' — ' + escapeHtml(c.pdvEmbarquementVille) : (c.arretMontee ? ' — ' + escapeHtml(c.arretMontee) : '')}</strong></div>
<div class="recap-row"><span>Débarquement</span><strong>${escapeHtml(c.pdvDebarquementNom) || '—'}${c.pdvDebarquementVille ? ' — ' + escapeHtml(c.pdvDebarquementVille) : (c.arretDescente ? ' — ' + escapeHtml(c.arretDescente) : '')}</strong></div>
      <div class="recap-row"><span>Nature</span><strong>${escapeHtml(c.nature)}</strong></div>
      <div class="recap-row"><span>Poids</span><strong>${c.poids != null ? c.poids + ' kg' : '—'}</strong></div>
      <div class="recap-row"><span>Valeur déclarée</span><strong>${c.valeurDeclaree != null ? Number(c.valeurDeclaree).toLocaleString('fr-FR') + ' XAF' : '—'}</strong></div>
      ${c.remarques ? `<div class="recap-row"><span>Remarques</span><strong>${escapeHtml(c.remarques)}</strong></div>` : ''}
    </div>

    <div class="recap-total-row">
      <span>Prix du transport</span>
      <strong>${Number(c.prixTransport).toLocaleString('fr-FR')} XAF</strong>
    </div>

    ${c.statut !== 'retire' ? `
      <div class="resa-side-actions">
        ${c.statut === 'en_transit' ? `<button class="btn-action-primary" onclick="marquerColisArrive('${escapeJsAttr(c.id)}')">Marquer comme arrivé</button>` : ''}
        ${c.statut === 'arrive' ? `<button class="btn-action-primary" onclick="ouvrirConfirmationRetraitColis('${escapeJsAttr(c.id)}')">Marquer comme retiré</button>` : ''}
      </div>
    ` : `
      <div class="recap-card" style="margin-top:14px;">
        <div class="recap-passager-title">Retrait</div>
        ${c.retirePar ? `<div class="recap-row"><span>Retiré par</span><strong>${escapeHtml(c.retirePar)}</strong></div>` : ''}
        ${c.typePieceIdentite ? (
          c.typePieceIdentite === 'aucune'
            ? `<div class="recap-row"><span>Pièce d'identité</span><strong>Aucune pièce${c.infoSansPiece ? ' — ' + escapeHtml(c.infoSansPiece) : ''}</strong></div>`
            : `<div class="recap-row"><span>Pièce d'identité</span><strong>${escapeHtml({ cni: 'CNI', passeport: 'Passeport', permis: 'Permis de conduire' }[c.typePieceIdentite] || c.typePieceIdentite)} n° ${escapeHtml(c.numeroPieceIdentite) || '—'}</strong></div>`
        ) : ''}
        <div class="recap-row"><span>Date de retrait</span><strong>${c.dateRetrait ? new Date(c.dateRetrait).toLocaleString('fr-FR') : '—'}</strong></div>
      </div>
    `}
  `;

  overlay.classList.add('show');
}

export function closeColisDetail() {
  const overlay = document.getElementById('colisSideOverlay');
  if (overlay) overlay.classList.remove('show');
  colisActuel = null;
}

function ensureColisOverlay() {
  if (document.getElementById('colisSideOverlay')) return;
  const div = document.createElement('div');
  div.className = 'resa-side-overlay';
  div.id = 'colisSideOverlay';
  div.innerHTML = `
    <div class="resa-side-backdrop" onclick="closeColisDetail()"></div>
    <div class="resa-side-panel" id="colisSideBody"></div>
  `;
  document.body.appendChild(div);
}

// ════════════════════════════════
//  CONFIRMATION RETRAIT (siège)
// ════════════════════════════════
export function ouvrirConfirmationRetraitColis(id) {
  const c = colisListe.find(x => x.id === id);
  if (!c) return;

  const existing = document.getElementById('colisRetraitConfirmOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'colisRetraitConfirmOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .25s ease;pointer-events:none;';
  overlay.innerHTML = `
    <div onclick="closeColisRetraitConfirmSiege()" style="position:absolute;inset:0;background:rgba(10,14,26,0.75);backdrop-filter:blur(4px);"></div>
    <div style="position:relative;z-index:1;background:var(--surface);border:1px solid var(--border);border-radius:16px;width:100%;max-width:420px;padding:20px;margin:16px;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px;">
        <div>
          <div style="font-family:'Syne',sans-serif;font-size:16px;font-weight:800;color:var(--white);">Confirmer le retrait</div>
          <div style="font-size:12px;color:var(--muted);margin-top:3px;">Vérifiez l'identité avant de confirmer.</div>
        </div>
        <button onclick="closeColisRetraitConfirmSiege()" style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;color:var(--muted);width:28px;height:28px;cursor:pointer;">✕</button>
      </div>
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:12px 16px;margin-bottom:14px;">
        <div style="font-size:13px;font-weight:600;color:var(--white);">Destinataire attendu</div>
        <div style="font-size:13px;color:var(--white);margin-top:4px;">${escapeHtml(c.destinataireNom)} · ${escapeHtml(c.destinataireTel)}</div>
      </div>
      <div class="pdv-field-group">
        <label>Nom de la personne qui retire le colis *</label>
        <input type="text" class="pdv-input" id="colisRetraitParSiege" placeholder="Ex : ${escapeHtml(c.destinataireNom)}">
      </div>
      <div class="pdv-field-group">
        <label>Type de pièce d'identité *</label>
        <select class="pdv-select" id="colisRetraitTypePieceSiege" onchange="onColisRetraitTypePieceChangeSiege()">
          <option value="">— Sélectionner —</option>
          <option value="cni">Carte nationale d'identité</option>
          <option value="passeport">Passeport</option>
          <option value="permis">Permis de conduire</option>
          <option value="aucune">Aucune pièce disponible</option>
        </select>
      </div>
      <div class="pdv-field-group" id="colisRetraitNumPieceGroupSiege">
        <label>Numéro de la pièce *</label>
        <input type="text" class="pdv-input" id="colisRetraitNumPieceSiege" placeholder="Ex : CG0012345">
      </div>
      <div class="pdv-field-group" id="colisRetraitSansPieceGroupSiege" style="display:none;">
        <label>Précision (témoin, motif...) *</label>
        <input type="text" class="pdv-input" id="colisRetraitSansPieceInfoSiege" placeholder="Ex : retrait en présence de M. Nzila, agent">
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:12px;">
        <button id="colisRetraitBtnConfirmSiege" class="btn-action-primary" onclick="confirmerRetraitColisSiege('${escapeJsAttr(id)}')">
          Confirmer le retrait
        </button>
        <button class="btn-action-secondary" onclick="closeColisRetraitConfirmSiege()">Retour</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => { overlay.style.opacity = '1'; overlay.style.pointerEvents = 'all'; });
}

export function closeColisRetraitConfirmSiege() {
  const o = document.getElementById('colisRetraitConfirmOverlay');
  if (o) { o.style.opacity = '0'; o.style.pointerEvents = 'none'; setTimeout(() => o.remove(), 250); }
}

export function onColisRetraitTypePieceChangeSiege() {
  const type = document.getElementById('colisRetraitTypePieceSiege')?.value;
  const numGroup  = document.getElementById('colisRetraitNumPieceGroupSiege');
  const sansGroup = document.getElementById('colisRetraitSansPieceGroupSiege');
  const estSansPiece = type === 'aucune';
  if (numGroup)  numGroup.style.display  = estSansPiece ? 'none' : 'block';
  if (sansGroup) sansGroup.style.display = estSansPiece ? 'block' : 'none';
}

export async function confirmerRetraitColisSiege(id) {
  const retirePar           = document.getElementById('colisRetraitParSiege')?.value.trim();
  const typePieceIdentite   = document.getElementById('colisRetraitTypePieceSiege')?.value;
  const estSansPiece        = typePieceIdentite === 'aucune';
  const numeroPieceIdentite = document.getElementById('colisRetraitNumPieceSiege')?.value.trim();
  const infoSansPiece       = document.getElementById('colisRetraitSansPieceInfoSiege')?.value.trim();

  if (!retirePar)         { showToast('Indiquez le nom de la personne qui retire le colis.', TOAST_ICONS.warning); return; }
  if (!typePieceIdentite) { showToast("Sélectionnez le type de pièce d'identité.", TOAST_ICONS.warning); return; }
  if (estSansPiece) {
    if (!infoSansPiece) { showToast("Indiquez une précision en l'absence de pièce d'identité.", TOAST_ICONS.warning); return; }
  } else {
    if (!numeroPieceIdentite) { showToast("Indiquez le numéro de la pièce d'identité.", TOAST_ICONS.warning); return; }
  }

  const btn = document.getElementById('colisRetraitBtnConfirmSiege');
  if (btn) { btn.disabled = true; btn.textContent = 'Retrait en cours...'; }

  await changerStatutColis(id, 'retire', {
    retirePar,
    typePieceIdentite,
    numeroPieceIdentite: estSansPiece ? null : numeroPieceIdentite,
    infoSansPiece: estSansPiece ? infoSansPiece : null,
  });

  closeColisRetraitConfirmSiege();
}

// ════════════════════════════════
//  CHANGEMENT DE STATUT (admin/siège)
// ════════════════════════════════
export async function marquerColisArrive(id) {
  await changerStatutColis(id, 'arrive');
}

export async function marquerColisRetire(id) {
  await changerStatutColis(id, 'retire');
}

async function changerStatutColis(id, statut, extra = {}) {
  try {
    const res = await apiFetch(`${API_BASE}/colis/${id}/statut`, {
      method: 'PATCH',
      body: JSON.stringify({ statut, ...extra }),
    });
    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || 'Erreur lors de la mise à jour.', TOAST_ICONS.error);
      return;
    }

    showToast('Statut du colis mis à jour.', TOAST_ICONS.success);
    closeColisDetail();
    await renderColisPage();

  } catch (err) {
    console.error('Erreur changement statut colis :', err);
    showToast('Impossible de contacter le serveur.', TOAST_ICONS.error);
  }
}

// ════════════════════════════════
//  EXPOSER AU HTML
// ════════════════════════════════
window.resetColisFiltres       = resetColisFiltres;
window.openColisDetail         = openColisDetail;
window.closeColisDetail        = closeColisDetail;
window.marquerColisArrive      = marquerColisArrive;
window.marquerColisRetire      = marquerColisRetire;
window.setColisPeriode         = setColisPeriode;
window.toggleColisCustomPicker = toggleColisCustomPicker;
window.applyColisCustomRange   = applyColisCustomRange;
window.clearColisCustomRange   = clearColisCustomRange;
window.filtrerParAlerteColisAttente = filtrerParAlerteColisAttente;
window.ouvrirConfirmationRetraitColis   = ouvrirConfirmationRetraitColis;
window.closeColisRetraitConfirmSiege    = closeColisRetraitConfirmSiege;
window.confirmerRetraitColisSiege       = confirmerRetraitColisSiege;
window.onColisRetraitTypePieceChangeSiege = onColisRetraitTypePieceChangeSiege;