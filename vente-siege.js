// ─── TRAVIO — SIÈGE — Vente (sélection trajet, passagers, colis, soumission, tickets) ───

import { apiFetch } from './api.js';
import { escapeHtml } from './sanitize.js';
import { BACKEND, agenceData, trajetList, pdvList, resaList } from './state.js';
import { showToast, showToastAction, TOAST_ICONS } from './toast-utils.js';
import { updateOverviewStats } from './trajets.js';

// ════════════════════════════════
//  ICONES LOCALES (léger, pas de dépendance à state-pdv.js)
// ════════════════════════════════
const ICONS = {
  close:     '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  check:     '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 8l3 3 6-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  bag:       '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:3px;"><rect x="3" y="6" width="10" height="8" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M6 6V4a2 2 0 014 0v2" stroke="currentColor" stroke-width="1.3"/></svg>',
  coin:      '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:3px;"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.3"/></svg>',
  clipboard: '<svg width="18" height="18" viewBox="0 0 16 16" fill="none"><rect x="3" y="2" width="10" height="12" rx="1.5" stroke="currentColor" stroke-width="1.4"/><rect x="6" y="1" width="4" height="2.5" rx="0.5" stroke="currentColor" stroke-width="1.2"/></svg>',
};

const OFFSET_MS_FIN = 1 * 60 * 60 * 1000; // Brazzaville = UTC+1

function toBrazzaDate(isoStr) {
  if (!isoStr) return '';
  return new Date(new Date(isoStr).getTime() + OFFSET_MS_FIN).toISOString().split('T')[0];
}

function nomType(typeId) {
  const t = (agenceData?.typesBillet || []).find(x => x.id === typeId);
  return t?.nom || typeId;
}

function ageRangeLabel(typeId) {
  const t = (agenceData?.typesBillet || []).find(x => x.id === typeId);
  if (!t) return '';
  return t.ageMax == null ? `${t.ageMin} ans et +` : `de ${t.ageMin} à ${t.ageMax} ans`;
}

function peuplerSelectType(selectEl) {
  if (!selectEl) return;
  selectEl.innerHTML = (agenceData?.typesBillet || []).map(t =>
    `<option value="${t.id}">${escapeHtml(t.nom)} (${ageRangeLabel(t.id)})</option>`
  ).join('');
}

// ════════════════════════════════
//  STATE
// ════════════════════════════════
let selectedTrajetForVente = null;
let venteMode = 'billet'; // 'billet' | 'colis'
let selectedPdvVendeur = null; // objet PDV choisi, ou null = vente directe siège

// ════════════════════════════════
//  PDV VENDEUR — SÉLECTEUR (spécifique siège)
// ════════════════════════════════
export function populerSelectPdvVendeur() {
  const select = document.getElementById('siege-pdv-vendeur');
  if (!select) return;
  const pdvsActifs = pdvList.filter(p => p.actif);
  select.innerHTML = `<option value="">Vente directe — Siège</option>` +
    pdvsActifs.map(p => `<option value="${p.id}">${escapeHtml(p.nom)}${p.ville ? ' — ' + escapeHtml(p.ville) : ''}</option>`).join('');
  select.value = '';
  selectedPdvVendeur = null;
}
window.populerSelectPdvVendeur = populerSelectPdvVendeur;

export function onPdvVendeurChange() {
  const val = document.getElementById('siege-pdv-vendeur')?.value;
  selectedPdvVendeur = val ? pdvList.find(p => p.id === val) || null : null;
}
window.onPdvVendeurChange = onPdvVendeurChange;

// ════════════════════════════════
//  VENTE — SELECT TRAJET
// ════════════════════════════════
export function populateVenteSiegeSelect() {
  populerSelectPdvVendeur();
  setTrajetType('direct');
}

export function setTrajetType(type) {
  document.getElementById('btnTypeDirectSiege')?.classList.toggle('active', type === 'direct');
  document.getElementById('btnTypeArretsSiege')?.classList.toggle('active', type === 'arrets');

  const select = document.getElementById('vente-siege-trajet');
  if (select) {
    select.innerHTML = '<option value="">Sélectionner un trajet</option>';
    const filtered = trajetList.filter(t => t.actif !== false && (t.typeTrajet || 'direct') === type);
    filtered.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = `${t.villeDepart} → ${t.villeArrivee} · ${t.heureDepart || '—'}`;
      select.appendChild(opt);
    });
  }

  ['trajetRecapDirectSiege', 'trajetRecapArretsSiege', 'dateSessionBlockSiege'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  renderTrajetCardListSiege();
  selectedTrajetForVente = null;
}
window.setTrajetType = setTrajetType;

export function setVenteMode(mode) {
  venteMode = mode;
  document.getElementById('btnModeBilletSiege')?.classList.toggle('active', mode === 'billet');
  document.getElementById('btnModeColisSiege')?.classList.toggle('active', mode === 'colis');

  const titre = document.getElementById('venteSiegePageTitle');
  if (titre) titre.textContent = mode === 'billet' ? 'Vente de billets' : 'Expédier un colis';

  const step2Title = document.getElementById('venteSiegeStep2Title');
  const step2Sub    = document.getElementById('venteSiegeStep2Subtitle');
  if (step2Title && step2Sub) {
    if (mode === 'billet') {
      step2Title.textContent = 'Informations passager(s)';
      step2Sub.textContent   = 'Ajoutez autant de passagers que nécessaire';
    } else {
      step2Title.textContent = 'Expéditeur, destinataire & colis';
      step2Sub.textContent   = 'Renseignez les coordonnées et les détails du colis';
    }
  }

  const secB = document.getElementById('secteurBilletSiege');
  const secC = document.getElementById('secteurColisSiege');
  if (secB) secB.style.display = mode === 'billet' ? 'flex' : 'none';
  if (secC) secC.style.display = mode === 'colis'  ? 'flex' : 'none';

  if (mode === 'billet') updatePrixPreview();
  else updateColisPrixPreview();
}
window.setVenteMode = setVenteMode;

export function renderTrajetCardListSiege() {
  const container = document.getElementById('trajetCardListSiege');
  const select = document.getElementById('vente-siege-trajet');
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
      <div class="trajet-card-pick" data-search="${searchStr}" data-value="${opt.value}" onclick="pickTrajetCardSiege(this)">
        <div>
          <div class="trajet-card-pick-route">${opt.textContent}</div>
          <div class="trajet-card-pick-meta">${t?.typeTrajet === 'arrets' ? '⊙ Avec arrêts' : '→ Direct'}</div>
        </div>
        ${prix ? `<div class="trajet-card-pick-price">${Number(prix).toLocaleString()} XAF</div>` : ''}
      </div>`;
  }).join('');

  filterTrajetCardsSiege();
}
window.renderTrajetCardListSiege = renderTrajetCardListSiege;

export function pickTrajetCardSiege(el) {
  document.querySelectorAll('#trajetCardListSiege .trajet-card-pick').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  const select = document.getElementById('vente-siege-trajet');
  select.value = el.dataset.value;
  onSelectTrajet();
}
window.pickTrajetCardSiege = pickTrajetCardSiege;

export function filterTrajetCardsSiege() {
  const term = (document.getElementById('trajetSearchInputSiege')?.value || '').toLowerCase().trim();
  document.querySelectorAll('#trajetCardListSiege .trajet-card-pick').forEach(c => {
    c.style.display = !term || c.dataset.search.includes(term) ? 'flex' : 'none';
  });
}
window.filterTrajetCardsSiege = filterTrajetCardsSiege;

export function toggleMoreOptionsSiege(el) {
  const box = el.nextElementSibling;
  const icon = el.querySelector('.more-icon');
  box.classList.toggle('open');
  icon.textContent = box.classList.contains('open') ? '－' : '＋';
}
window.toggleMoreOptionsSiege = toggleMoreOptionsSiege;

// ════════════════════════════════
//  HELPER — tous les points d'un trajet (départ, arrêts, arrivée)
// ════════════════════════════════
function getAllPointsTrajet(t) {
  return [
    { nom: t.villeDepart, heurePassage: t.heureDepart, isOrigin: true, pdvs: t.pdvDepart || [], prixParType: {} },
    ...(t.arrets || []).map(a => ({
      nom: a.ville || a.nom,
      heurePassage: a.heurePassage,
      prixParType: a.prixParType || {},
      pdvs: (t.pdvArrets || []).filter(p => (p.ville || '').toLowerCase().trim() === (a.ville || a.nom || '').toLowerCase().trim()),
    })),
    { nom: t.villeArrivee, heurePassage: t.heureArrivee, isDestination: true, pdvs: t.pdvArrivee || [], prixParType: t.prixParType || {} },
  ];
}

// ════════════════════════════════
//  VENTE — SÉLECTION TRAJET
// ════════════════════════════════
export function onSelectTrajet() {
  const trajetId   = document.getElementById('vente-siege-trajet')?.value;
  const recapD     = document.getElementById('trajetRecapDirectSiege');
  const recapA     = document.getElementById('trajetRecapArretsSiege');
  const dateBlock  = document.getElementById('dateSessionBlockSiege');

  if (!trajetId) {
    if (recapD) recapD.style.display = 'none';
    if (recapA) recapA.style.display = 'none';
    if (dateBlock) dateBlock.style.display = 'none';
    selectedTrajetForVente = null;
    return;
  }

  const t = trajetList.find(tr => tr.id === trajetId);
  if (!t) return;
  document.querySelectorAll('#page-vente-siege .p-type').forEach(peuplerSelectType);
  selectedTrajetForVente = t;

  // ── Trajet DIRECT ──
  if ((t.typeTrajet || 'direct') === 'direct') {
    if (recapA) recapA.style.display = 'none';

    document.getElementById('recapRouteSiege').textContent = `${t.villeDepart} → ${t.villeArrivee}`;

    let metaHtml = '';
    if (t.limiteBagages) metaHtml += `<span>${ICONS.bag} Limite ${t.limiteBagages} kg</span>`;
    if (t.fraisExcesBagages) metaHtml += `<span>${ICONS.coin} ${t.fraisExcesBagages} XAF/kg excédent</span>`;
    document.getElementById('recapMetaSiege').innerHTML = metaHtml || '<span>Trajet direct</span>';

    const recapPrixTypesEl = document.getElementById('recapPrixTypesSiege');
    if (recapPrixTypesEl) {
      recapPrixTypesEl.innerHTML = Object.entries(t.prixParType || {}).map(([typeId, prix]) =>
        `<span>${nomType(typeId)} <small style="color:var(--muted);">(${ageRangeLabel(typeId)})</small> : <strong>${Number(prix).toLocaleString()} XAF</strong></span>`
      ).join('');
    }

    document.getElementById('vente-siege-ville-depart').value  = t.villeDepart;
    document.getElementById('vente-siege-ville-arrivee').value = t.villeArrivee;

    const selEmb = document.getElementById('vente-siege-pdv-embarquement');
    if (selEmb) {
      selEmb.innerHTML = '<option value="">— Sélectionner —</option>' + (t.pdvDepart || []).map(p =>
        `<option value="${p.id}" data-nom="${p.nom||''}" data-ville="${p.ville||''}">${p.nom}${p.ville ? ' — '+p.ville : ''}</option>`
      ).join('');
    }

    const selDeb = document.getElementById('vente-siege-pdv-debarquement');
    if (selDeb) {
      selDeb.innerHTML = '<option value="">— Sélectionner —</option>' +
        (t.pdvArrivee || []).map(p =>
          `<option value="${p.id}" data-nom="${p.nom||''}" data-ville="${p.ville||''}">${p.nom}${p.ville ? ' — '+p.ville : ''}</option>`
        ).join('');
    }

    document.getElementById('embarquementDebarquementBlockSiege').style.display = 'flex';
    if (recapD) recapD.style.display = 'flex';

  // ── Trajet AVEC ARRÊTS — libre, sans position figée ──
  } else {
    if (recapD) recapD.style.display = 'none';
    const ed = document.getElementById('embarquementDebarquementBlockSiege');
    if (ed) ed.style.display = 'none';

    document.getElementById('recapRouteArretsSiege').textContent = `${t.villeDepart} → ${t.villeArrivee}`;

    const allPoints = getAllPointsTrajet(t);

    // Timeline visuelle
    const timeline = document.getElementById('arretsTimelineSiege');
    if (timeline) {
      timeline.innerHTML = allPoints.map(p => {
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

    // Montée LIBRE — tous les points sauf le dernier (arrivée)
    const monteeSelect = document.getElementById('vente-siege-montee-ville');
    if (monteeSelect) {
      monteeSelect.innerHTML = '<option value="">— Ville de montée —</option>' +
        allPoints.slice(0, -1).map(p => `<option value="${p.nom}">${p.nom}</option>`).join('');
      monteeSelect.disabled = false;
    }

    const descenteSelect = document.getElementById('vente-siege-descente');
    if (descenteSelect) descenteSelect.innerHTML = '<option value="">— Sélectionnez d\'abord la montée —</option>';

    const selPdvMontee = document.getElementById('vente-siege-pdv-montee');
    if (selPdvMontee) selPdvMontee.innerHTML = '<option value="">— Sélectionnez d\'abord la montée —</option>';

    const selDebArrets = document.getElementById('vente-siege-pdv-debarquement-arrets');
    if (selDebArrets) selDebArrets.innerHTML = '<option value="">— Sélectionner —</option>';

    const segmentPrixTypesEl = document.getElementById('segmentPrixTypesSiege');
    if (segmentPrixTypesEl) segmentPrixTypesEl.style.display = 'none';

    if (recapA) recapA.style.display = 'flex';
  }

  if (dateBlock) {
    dateBlock.style.display = 'flex';
    const dateInput    = document.getElementById('vente-siege-date');
    const sessionInput = document.getElementById('vente-siege-session-id');
    if (dateInput)    dateInput.value    = '';
    if (sessionInput) sessionInput.value = '';
    loadSessionsDisponibles(trajetId);
  }
  updatePrixPreview();
}
window.onSelectTrajet = onSelectTrajet;

// ── Choix de la ville de montée → peuple PDV de montée + villes de descente possibles ──
export function onMonteeVilleChangeSiege() {
  const t = selectedTrajetForVente;
  if (!t) return;
  const monteeVal = document.getElementById('vente-siege-montee-ville')?.value;

  const selPdvMontee   = document.getElementById('vente-siege-pdv-montee');
  const descenteSelect = document.getElementById('vente-siege-descente');
  const segmentPrixTypesEl = document.getElementById('segmentPrixTypesSiege');

  if (!monteeVal) {
    if (selPdvMontee) selPdvMontee.innerHTML = '<option value="">— Sélectionnez d\'abord la montée —</option>';
    if (descenteSelect) descenteSelect.innerHTML = '<option value="">— Sélectionnez d\'abord la montée —</option>';
    if (segmentPrixTypesEl) segmentPrixTypesEl.style.display = 'none';
    return;
  }

  const allPoints = getAllPointsTrajet(t);
  const indexMontee = allPoints.findIndex(p => p.nom === monteeVal);
  const pointMontee = allPoints[indexMontee];

  if (selPdvMontee) {
    selPdvMontee.innerHTML = (pointMontee.pdvs || []).length > 0
      ? '<option value="">— Sélectionner —</option>' + pointMontee.pdvs.map(p =>
          `<option value="${p.id}" data-nom="${p.nom||''}" data-ville="${p.ville||monteeVal}">${p.nom}${p.ville ? ' — '+p.ville : ''}</option>`
        ).join('')
      : '<option value="">Aucun PDV à ce point — libre</option>';
  }

  if (descenteSelect) {
    descenteSelect.innerHTML = '<option value="">— Ville de descente —</option>' +
      allPoints.slice(indexMontee + 1).map(p => `<option value="${p.nom}">${p.nom}</option>`).join('');
  }

  const selDebArrets = document.getElementById('vente-siege-pdv-debarquement-arrets');
  if (selDebArrets) selDebArrets.innerHTML = '<option value="">— Sélectionnez d\'abord la descente —</option>';
  if (segmentPrixTypesEl) segmentPrixTypesEl.style.display = 'none';

  updatePrixPreview();
}
window.onMonteeVilleChangeSiege = onMonteeVilleChangeSiege;

// ── Choix de la ville de descente → calcule le prix du segment + peuple PDV de débarquement ──
export function onSegmentChangeSiege() {
  const t = selectedTrajetForVente;
  if (!t) return;

  const monteeVal   = document.getElementById('vente-siege-montee-ville')?.value;
  const descenteVal = document.getElementById('vente-siege-descente')?.value;
  const segmentPrixTypesEl = document.getElementById('segmentPrixTypesSiege');

  if (!monteeVal || !descenteVal) {
    if (segmentPrixTypesEl) segmentPrixTypesEl.style.display = 'none';
    return;
  }

  const allPoints = getAllPointsTrajet(t);
  const indexMontee   = allPoints.findIndex(p => p.nom === monteeVal);
  const indexDescente = allPoints.findIndex(p => p.nom === descenteVal);

  if (indexDescente <= indexMontee) {
    if (segmentPrixTypesEl) segmentPrixTypesEl.style.display = 'none';
    return;
  }

  const cle = `${monteeVal}|${descenteVal}`;
  let prixSegmentParType = t.prixTroncons?.[cle] || null;

  if (!prixSegmentParType || Object.keys(prixSegmentParType).length === 0) {
    const pointDescente = allPoints[indexDescente];
    const pointMontee   = allPoints[indexMontee];
    prixSegmentParType = {};
    Object.keys(t.prixParType || {}).forEach(typeId => {
      const prixDest   = pointDescente.prixParType?.[typeId] ?? t.prixParType[typeId] ?? 0;
      const prixMontee = pointMontee.prixParType?.[typeId] ?? 0;
      prixSegmentParType[typeId] = Math.max(0, prixDest - prixMontee);
    });
  }

  t._segmentPrixParType = prixSegmentParType;
  t._arretMontee        = monteeVal;
  t._arretDescente      = descenteVal;

  const pointDescente = allPoints[indexDescente];
  const selDebArrets = document.getElementById('vente-siege-pdv-debarquement-arrets');
  if (selDebArrets) {
    const estLieuLibre = (t.arrets || []).some(a => (a.ville || a.nom) === descenteVal && a.type === 'libre');
    if (estLieuLibre) {
      selDebArrets.innerHTML = `<option value="__lieu_libre__" data-nom="${descenteVal}" data-ville="${descenteVal}">${descenteVal} (lieu libre)</option>`;
    } else {
      selDebArrets.innerHTML = (pointDescente.pdvs || []).length > 0
        ? '<option value="">— Sélectionner —</option>' + pointDescente.pdvs.map(p =>
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
window.onSegmentChangeSiege = onSegmentChangeSiege;

// ════════════════════════════════
//  SESSIONS DISPONIBLES — SIÈGE (aucune restriction de PDV : total places, pas de sous-quota)
// ════════════════════════════════
async function loadSessionsDisponibles(trajetId) {
  const container = document.getElementById('sessionsDisponiblesSiege');
  if (!container) return;

  container.innerHTML = `<div class="empty-state small"><p>Chargement...</p></div>`;

  try {
    const res  = await apiFetch(`${BACKEND}/trajet/${trajetId}/departs`);
    const data = await res.json();
    const departs = (data.departs || []).filter(d => d.actif !== false);

    if (departs.length === 0) {
      container.innerHTML = `<div class="empty-state small"><p>Aucun bus actif sur ce trajet.</p></div>`;
      return;
    }

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

    allSessions.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return (a.heureDepart || '').localeCompare(b.heureDepart || '');
    });

    if (allSessions.length === 0) {
      container.innerHTML = `<div class="empty-state small"><p>Aucune session disponible.</p></div>`;
      return;
    }

    container.innerHTML = allSessions.map(s => {
      const dateObj = new Date(s.date + 'T00:00:00');
      // Le siège voit la place globalement restante (max occupation tous segments confondus)
      const t = selectedTrajetForVente;
      let restantes;
      if (t && (t.typeTrajet || 'direct') === 'arrets' && s.placesVenduesSegments?.length) {
        const maxOccupe = Math.max(...s.placesVenduesSegments);
        restantes = Math.max(0, s.placesTotal - maxOccupe);
      } else {
        restantes = s.placesRestantes ?? (s.placesTotal - (s.placesVendues || 0));
      }

      let heurePasse = false;
      const today = toBrazzaDate(new Date().toISOString());
      if (s.date === today && s.heureDepart) {
        const departInstant = new Date(`${s.date}T${s.heureDepart}:00Z`).getTime() - OFFSET_MS_FIN;
        heurePasse = Date.now() >= departInstant;
      }

      const complet = restantes <= 0 || heurePasse;
      const dateFormatee = dateObj.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });

      return `
        <div class="session-item ${complet ? 'complet' : ''}"
          data-date="${s.date}" data-session-id="${s.id}" data-heure="${s.heureDepart || ''}" data-bus="${s.busNom || ''}"
          onclick="selectSessionSiege(this, '${s.date}', '${s.id}')">
          <div class="session-item-left">
            <div class="session-item-date">${dateFormatee}</div>
            <div class="session-item-bus">🚌 ${s.busNom} · ${s.busType || ''}</div>
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

export function selectSessionSiege(el, date, sessionId) {
  document.querySelectorAll('#sessionsDisponiblesSiege .session-item.selected').forEach(i => i.classList.remove('selected'));
  el.classList.add('selected');
  const dateInput    = document.getElementById('vente-siege-date');
  const sessionInput = document.getElementById('vente-siege-session-id');
  if (dateInput)    dateInput.value    = date;
  if (sessionInput) sessionInput.value = sessionId;
  updatePrixPreview();
}
window.selectSessionSiege = selectSessionSiege;

// ════════════════════════════════
//  PRIX
// ════════════════════════════════
export function updatePrixPreview() {
  if (venteMode !== 'billet') return;
  if (!selectedTrajetForVente) return;

  const t = selectedTrajetForVente;
  const isArrets = (t.typeTrajet || 'direct') === 'arrets';
  const blocks = document.querySelectorAll('#page-vente-siege .passager-block');

  let totalGeneral = 0;
  let linesHtml = '';

  blocks.forEach((block, i) => {
    const type    = block.querySelector('.p-type')?.value || 'adulte';
    const bagages = parseFloat(block.querySelector('.p-bagages')?.value || 0);
    const prixColisSoute = block.querySelector('.p-colis-soute-toggle')?.checked
      ? Number(block.querySelector('.p-colis-soute-prix')?.value || 0)
      : 0;

    const prixBase = isArrets ? (t._segmentPrixParType?.[type] || 0) : (t.prixParType?.[type] || 0);
    const excesBag  = bagages > (t.limiteBagages || 0) ? Math.max(0, bagages - (t.limiteBagages || 0)) : 0;
    const prixBag   = excesBag * (t.fraisExcesBagages || 0);
    const sousTotal = prixBase + prixBag + prixColisSoute;
    totalGeneral   += sousTotal;

    linesHtml += `
      <div class="prix-preview-row">
        <span>Passager ${i + 1} — ${nomType(type)} (${ageRangeLabel(type)})</span>
        <strong>${Number(sousTotal).toLocaleString()} XAF</strong>
      </div>`;
  });

  const linesEl = document.getElementById('prixPreviewLinesSiege');
  if (linesEl) linesEl.innerHTML = linesHtml;
  const totalEl = document.getElementById('previewTotalSiege');
  if (totalEl) totalEl.textContent = `${Number(totalGeneral).toLocaleString()} XAF`;
}
window.updatePrixPreview = updatePrixPreview;

export function updateColisPrixPreview() {
  const prix = Number(document.getElementById('colis-siege-prix')?.value || 0);
  const linesEl = document.getElementById('prixPreviewLinesSiege');
  if (linesEl) linesEl.innerHTML = '';
  const totalEl = document.getElementById('previewTotalSiege');
  if (totalEl) totalEl.textContent = `${prix.toLocaleString()} XAF`;
}
window.updateColisPrixPreview = updateColisPrixPreview;

// ════════════════════════════════
//  PASSAGERS
// ════════════════════════════════
export function addPassagerSiege() {
  const list  = document.getElementById('passagersListSiege');
  const index = list.querySelectorAll('.passager-block').length;

  const div = document.createElement('div');
  div.className = 'passager-block';
  div.dataset.index = index;
  div.innerHTML = `
    <div class="passager-block-header">
      <span class="passager-block-num">Passager ${index + 1}</span>
      <button class="passager-block-remove" onclick="removePassagerSiege(this)">${ICONS.close} Retirer</button>
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
    <div class="more-options-toggle" onclick="toggleMoreOptionsSiege(this)">
      <span class="more-icon">＋</span> Bagages, siège (facultatif)
    </div>
    <div class="more-options">
      <div class="vente-field-row">
        <div class="vente-field-group">
          <label>Bagages (kg)</label>
          <input type="number" class="vente-input p-bagages" placeholder="0" min="0" oninput="updatePrixPreview()">
        </div>
        <div class="vente-field-group">
          <label>Nombre de bagages</label>
          <input type="number" class="vente-input p-bagages-nombre" placeholder="0" min="0">
        </div>
      </div>
      <div class="vente-field-row">
        <div class="vente-field-group">
          <label>Siège (optionnel)</label>
          <input type="text" class="vente-input p-siege" placeholder="Ex : 13A">
        </div>
      </div>
      <label style="display:flex;align-items:center;gap:8px;margin-top:10px;font-size:12.5px;color:var(--white);">
        <input type="checkbox" class="p-colis-soute-toggle" onchange="toggleColisSouteSiege(this)">
        Colis en soute avec ce passager
      </label>
      <div class="p-colis-soute-fields" style="display:none;margin-top:8px;">
        <div class="vente-field-row">
          <div class="vente-field-group">
            <label>Nature du colis</label>
            <input type="text" class="vente-input p-colis-soute-nature" placeholder="Ex : Bagage personnel">
          </div>
          <div class="vente-field-group">
            <label>Poids (kg)</label>
            <input type="number" class="vente-input p-colis-soute-poids" min="0">
          </div>
        </div>
        <div class="vente-field-row">
          <div class="vente-field-group">
            <label>Valeur déclarée (optionnel)</label>
            <input type="number" class="vente-input p-colis-soute-valeur" min="0">
          </div>
          <div class="vente-field-group">
            <label>Prix du colis (XAF)</label>
            <input type="number" class="vente-input p-colis-soute-prix" min="0" oninput="updatePrixPreview()">
          </div>
        </div>
      </div>
    </div>
  `;
  list.appendChild(div);
  peuplerSelectType(div.querySelector('.p-type'));
  renumberPassagersSiege();
  updatePrixPreview();
}
window.addPassagerSiege = addPassagerSiege;

export function toggleColisSouteSiege(checkbox) {
  const fields = checkbox.closest('.more-options').querySelector('.p-colis-soute-fields');
  fields.style.display = checkbox.checked ? 'block' : 'none';
  updatePrixPreview();
}
window.toggleColisSouteSiege = toggleColisSouteSiege;

export function removePassagerSiege(btn) {
  const block = btn.closest('.passager-block');
  if (block) block.remove();
  renumberPassagersSiege();
  updatePrixPreview();
}
window.removePassagerSiege = removePassagerSiege;

function renumberPassagersSiege() {
  document.querySelectorAll('#passagersListSiege .passager-block').forEach((b, i) => {
    const label = b.querySelector('.passager-block-num');
    if (label) label.textContent = `Passager ${i + 1}`;
    b.dataset.index = i;
  });
}

// ════════════════════════════════
//  ÉTAPES
// ════════════════════════════════
export function venteGoStepSiege(step) {
  if (step === 2) {
    const trajetId = document.getElementById('vente-siege-trajet')?.value;
    const date     = document.getElementById('vente-siege-date')?.value;

    if (!trajetId) { showToast('Sélectionnez un trajet.', TOAST_ICONS.warning); return; }
    if (!date) { showToast('Sélectionnez une session de départ.', TOAST_ICONS.warning); return; }

    if (selectedTrajetForVente && (selectedTrajetForVente.typeTrajet || 'direct') === 'arrets') {
      const montee   = document.getElementById('vente-siege-montee-ville')?.value;
      const descente = document.getElementById('vente-siege-descente')?.value;
      if (!montee)   { showToast('Sélectionnez la ville de montée.', TOAST_ICONS.warning); return; }
      if (!descente) { showToast('Sélectionnez la ville de descente.', TOAST_ICONS.warning); return; }
    }

    const step1 = document.getElementById('venteSiegeStep1');
    const step2 = document.getElementById('venteSiegeStep2');
    if (step1) step1.style.display = 'none';
    if (step2) {
      step2.style.display = 'block';
      step2.classList.remove('locked');
      void step2.offsetWidth;
      step2.classList.add('slide-in');
    }

    if (venteMode === 'billet') updatePrixPreview();
    else updateColisPrixPreview();
    window.scrollTo({ top: 0, behavior: 'smooth' });

  } else if (step === 1) {
    const step1 = document.getElementById('venteSiegeStep1');
    const step2 = document.getElementById('venteSiegeStep2');
    if (step2) {
      step2.classList.remove('slide-in');
      setTimeout(() => { step2.style.display = 'none'; step2.classList.add('locked'); }, 350);
    }
    if (step1) step1.style.display = 'block';
  }
}
window.venteGoStepSiege = venteGoStepSiege;

// ════════════════════════════════
//  SOUMETTRE
// ════════════════════════════════
export async function submitVenteSiege() {
  if (venteMode === 'colis') { await submitColisSiege(); return; }

  const blocks  = document.querySelectorAll('#passagersListSiege .passager-block');
  const date    = document.getElementById('vente-siege-date')?.value;
  const remarques = document.getElementById('vente-siege-remarques')?.value.trim() || null;
  const sessionId = document.getElementById('vente-siege-session-id')?.value || null;
  const sessionHeure = document.querySelector('#sessionsDisponiblesSiege .session-item.selected')?.dataset.heure
    || selectedTrajetForVente?.heureDepart || null;
  const sessionBusNom = document.querySelector('#sessionsDisponiblesSiege .session-item.selected')?.dataset.bus || null;

  if (!selectedTrajetForVente) { showToast('Sélectionnez un trajet.', TOAST_ICONS.warning); return; }

  for (let i = 0; i < blocks.length; i++) {
    const prenom = blocks[i].querySelector('.p-prenom')?.value.trim();
    const nom    = blocks[i].querySelector('.p-nom')?.value.trim();
    const tel    = i === 0 ? blocks[i].querySelector('.p-tel')?.value.trim() : null;
    if (!prenom) { showToast(`Prénom manquant (Passager ${i + 1}).`, TOAST_ICONS.warning); return; }
    if (!nom)    { showToast(`Nom manquant (Passager ${i + 1}).`, TOAST_ICONS.warning); return; }
    if (i === 0 && !tel) { showToast('Téléphone du passager principal manquant.', TOAST_ICONS.warning); return; }
  }

  const t = selectedTrajetForVente;
  const isArrets = (t.typeTrajet || 'direct') === 'arrets';
  const isDirect = (t.typeTrajet || 'direct') === 'direct';

  let pdvEmbarquementId = null, pdvEmbarquementNom = null, pdvEmbarquementVille = null;
  let pdvDebarquementId = null, pdvDebarquementNom = null, pdvDebarquementVille = null;

  if (isDirect) {
    const selEmb = document.getElementById('vente-siege-pdv-embarquement');
    const selDeb = document.getElementById('vente-siege-pdv-debarquement');
    if (!selEmb?.value) { showToast('Sélectionnez le PDV d\'embarquement.', TOAST_ICONS.warning); return; }
    if (!selDeb?.value) { showToast('Sélectionnez le PDV de débarquement.', TOAST_ICONS.warning); return; }
    const embOption = selEmb.selectedOptions[0];
    const debOption = selDeb.selectedOptions[0];
    pdvEmbarquementId = selEmb.value; pdvEmbarquementNom = embOption?.dataset.nom || ''; pdvEmbarquementVille = embOption?.dataset.ville || '';
    pdvDebarquementId = selDeb.value; pdvDebarquementNom = debOption?.dataset.nom || ''; pdvDebarquementVille = debOption?.dataset.ville || '';
  } else {
    const montee   = document.getElementById('vente-siege-montee-ville')?.value;
    const descente = document.getElementById('vente-siege-descente')?.value;
    if (!montee)   { showToast('Sélectionnez la ville de montée.', TOAST_ICONS.warning); return; }
    if (!descente) { showToast('Sélectionnez la ville de descente.', TOAST_ICONS.warning); return; }
    if (!t._segmentPrixParType) { showToast('Segment invalide.', TOAST_ICONS.warning); return; }

    const selPdvMontee = document.getElementById('vente-siege-pdv-montee');
    const selDebArrets = document.getElementById('vente-siege-pdv-debarquement-arrets');
    if (selPdvMontee?.value) {
      const o = selPdvMontee.selectedOptions[0];
      pdvEmbarquementId = selPdvMontee.value; pdvEmbarquementNom = o?.dataset.nom || ''; pdvEmbarquementVille = o?.dataset.ville || montee;
    } else {
      pdvEmbarquementVille = montee;
    }
    if (selDebArrets?.value) {
      const o = selDebArrets.selectedOptions[0];
      pdvDebarquementId = selDebArrets.value; pdvDebarquementNom = o?.dataset.nom || ''; pdvDebarquementVille = o?.dataset.ville || descente;
    } else {
      pdvDebarquementVille = descente;
    }
  }

  const passagers = [];
  let totalGeneral = 0;

  blocks.forEach(block => {
    const type    = block.querySelector('.p-type')?.value || 'adulte';
    const bagages = parseFloat(block.querySelector('.p-bagages')?.value || 0);
    const nombreBagages = parseInt(block.querySelector('.p-bagages-nombre')?.value || 0, 10);
    const colisSouteCheck = block.querySelector('.p-colis-soute-toggle')?.checked;
    const prixColisSoute  = colisSouteCheck ? Number(block.querySelector('.p-colis-soute-prix')?.value || 0) : 0;

    const prixBase = isArrets ? (t._segmentPrixParType?.[type] || 0) : (t.prixParType?.[type] || 0);
    const excesBag  = bagages > (t.limiteBagages || 0) ? Math.max(0, bagages - (t.limiteBagages || 0)) : 0;
    const prixBag   = excesBag * (t.fraisExcesBagages || 0);
    const sousTotal = prixBase + prixBag + prixColisSoute;
    totalGeneral   += sousTotal;

    passagers.push({
      prenom: block.querySelector('.p-prenom')?.value.trim(),
      nom:    block.querySelector('.p-nom')?.value.trim(),
      telephone: block.querySelector('.p-tel')?.value.trim() || null,
      type, typeNom: nomType(type), typeAgeLabel: ageRangeLabel(type),
      bagages, nombreBagages,
      siege: block.querySelector('.p-siege')?.value.trim() || null,
      prixBillet: prixBase, prixBagages: prixBag,
      colisSoute: colisSouteCheck ? {
        nature: block.querySelector('.p-colis-soute-nature')?.value.trim() || null,
        poids: parseFloat(block.querySelector('.p-colis-soute-poids')?.value) || null,
        valeurDeclaree: parseFloat(block.querySelector('.p-colis-soute-valeur')?.value) || null,
        prix: prixColisSoute,
      } : null,
      sousTotal,
    });
  });

  const p0 = passagers[0];

  const payload = {
    agenceId:          agenceData.id,
    pdvId:             selectedPdvVendeur ? selectedPdvVendeur.id : null,
    trajetId:          t.id,
    typeTrajet:        t.typeTrajet || 'direct',
    routeLabel:        `${t.villeDepart} → ${t.villeArrivee}`,
    heureDepart:       sessionHeure,
    busNom:            sessionBusNom,
    sessionId,
    dateDepart:        date,
    arretMontee:       isArrets ? (t._arretMontee   || null) : null,
    arretDescente:     isArrets ? (t._arretDescente || null) : null,
    prenomPassager:    p0.prenom,
    nomPassager:       p0.nom,
    telephonePassager: p0.telephone,
    typeBillet:        p0.type,
    typeBilletNom:     p0.typeNom,
    bagages:           p0.bagages,
    nombreBagages:     p0.nombreBagages,
    siege:             p0.siege,
    prixBillet:        p0.prixBillet,
    prixBagages:       p0.prixBagages,
    passagers,
    nbPassagers:       passagers.length,
    prixTotal:         totalGeneral,
    remarques,
    pdvEmbarquementId, pdvEmbarquementNom, pdvEmbarquementVille,
    pdvDebarquementId, pdvDebarquementNom, pdvDebarquementVille,
    createdAt:         new Date().toISOString(),
  };

  const btn = document.getElementById('venteSiegeBtnConfirm');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="btn-spinner"></span> Enregistrement...'; }

  try {
    const res  = await apiFetch(`${BACKEND}/reservations/create`, { method: 'POST', body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) { showToast(data.message || 'Erreur lors de la vente.', TOAST_ICONS.error); return; }

    resaList.push({ ...payload, id: data.id || data.reservationId });
    if (typeof updateOverviewStats === 'function') updateOverviewStats();

    showToast('Billet vendu avec succès !', TOAST_ICONS.success, true);
    resetVenteFormSiege();

  } catch (err) {
    console.error('Erreur vente siège :', err);
    showToast('Impossible de contacter le serveur.', TOAST_ICONS.error);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = `${ICONS.check} Confirmer la vente`; }
  }
}
window.submitVenteSiege = submitVenteSiege;

async function submitColisSiege() {
  const t = selectedTrajetForVente;
  if (!t) { showToast('Sélectionnez un trajet.', TOAST_ICONS.warning); return; }

  const expNom  = document.getElementById('colis-siege-exp-nom')?.value.trim();
  const expTel  = document.getElementById('colis-siege-exp-tel')?.value.trim();
  const destNom = document.getElementById('colis-siege-dest-nom')?.value.trim();
  const destTel = document.getElementById('colis-siege-dest-tel')?.value.trim();
  const nature  = document.getElementById('colis-siege-nature')?.value.trim();
  const prix    = Number(document.getElementById('colis-siege-prix')?.value || 0);

  if (!expNom || !expTel)   { showToast('Informations expéditeur manquantes.', TOAST_ICONS.warning); return; }
  if (!destNom || !destTel) { showToast('Informations destinataire manquantes.', TOAST_ICONS.warning); return; }
  if (!nature)              { showToast('Précisez la nature du colis.', TOAST_ICONS.warning); return; }
  if (!prix)                { showToast('Indiquez le prix du transport.', TOAST_ICONS.warning); return; }

  const isArretsColis = (t.typeTrajet || 'direct') === 'arrets';
  let pdvEmbarquementId = null, pdvEmbarquementNom = null, pdvEmbarquementVille = null;
  let pdvDebarquementId = null, pdvDebarquementNom = null, pdvDebarquementVille = null;
  let arretMontee = null, arretDescente = null;
  let routeLabelColis = `${t.villeDepart} → ${t.villeArrivee}`;

  if (isArretsColis) {
    arretMontee   = t._arretMontee   || null;
    arretDescente = t._arretDescente || null;
    if (!arretMontee || !arretDescente) { showToast('Sélectionnez la montée et la descente du colis.', TOAST_ICONS.warning); return; }
    routeLabelColis = `${arretMontee} → ${arretDescente}`;
    const selPdvMontee = document.getElementById('vente-siege-pdv-montee');
    const selDebArrets = document.getElementById('vente-siege-pdv-debarquement-arrets');
    if (selPdvMontee?.value) { const o = selPdvMontee.selectedOptions[0]; pdvEmbarquementId = selPdvMontee.value; pdvEmbarquementNom = o?.dataset.nom || ''; pdvEmbarquementVille = o?.dataset.ville || arretMontee; }
    else pdvEmbarquementVille = arretMontee;
    if (selDebArrets?.value) { const o = selDebArrets.selectedOptions[0]; pdvDebarquementId = selDebArrets.value; pdvDebarquementNom = o?.dataset.nom || ''; pdvDebarquementVille = o?.dataset.ville || arretDescente; }
    else pdvDebarquementVille = arretDescente;
  } else {
    const selEmb = document.getElementById('vente-siege-pdv-embarquement');
    const selDeb = document.getElementById('vente-siege-pdv-debarquement');
    if (!selEmb?.value || !selDeb?.value) { showToast('Sélectionnez les PDV d\'embarquement et de débarquement.', TOAST_ICONS.warning); return; }
    const embOption = selEmb.selectedOptions[0]; const debOption = selDeb.selectedOptions[0];
    pdvEmbarquementId = selEmb.value; pdvEmbarquementNom = embOption?.dataset.nom || ''; pdvEmbarquementVille = embOption?.dataset.ville || '';
    pdvDebarquementId = selDeb.value; pdvDebarquementNom = debOption?.dataset.nom || ''; pdvDebarquementVille = debOption?.dataset.ville || '';
  }

  const sessionHeure = document.querySelector('#sessionsDisponiblesSiege .session-item.selected')?.dataset.heure || t.heureDepart || null;
  const sessionBusNom = document.querySelector('#sessionsDisponiblesSiege .session-item.selected')?.dataset.bus || null;

  const payload = {
    agenceId: agenceData.id,
    pdvId: selectedPdvVendeur ? selectedPdvVendeur.id : null,
    trajetId: t.id,
    typeTrajet: t.typeTrajet || 'direct',
    routeLabel: routeLabelColis,
    arretMontee, arretDescente,
    pdvEmbarquementId, pdvEmbarquementNom, pdvEmbarquementVille,
    pdvDebarquementId, pdvDebarquementNom, pdvDebarquementVille,
    sessionId: document.getElementById('vente-siege-session-id')?.value || null,
    dateDepart: document.getElementById('vente-siege-date')?.value,
    heureDepart: sessionHeure,
    busNom: sessionBusNom,
    expediteurNom: expNom, expediteurTel: expTel,
    destinataireNom: destNom, destinataireTel: destTel,
    nature,
    poids: parseFloat(document.getElementById('colis-siege-poids')?.value) || null,
    valeurDeclaree: parseFloat(document.getElementById('colis-siege-valeur')?.value) || null,
    remarques: document.getElementById('colis-siege-remarques')?.value.trim() || null,
    prixTransport: prix,
    statut: 'en_transit',
    createdAt: new Date().toISOString(),
  };

  const btn = document.getElementById('venteSiegeBtnConfirm');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="btn-spinner"></span> Enregistrement...'; }

  try {
    const res  = await apiFetch(`${BACKEND}/colis/create`, { method: 'POST', body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) { showToast(data.message || "Erreur lors de l'enregistrement.", TOAST_ICONS.error); return; }

    showToast(`Colis enregistré — code de retrait : ${data.codeRetrait || '—'}`, TOAST_ICONS.success, true);
    resetVenteFormSiege();

  } catch (err) {
    console.error('Erreur colis siège :', err);
    showToast('Impossible de contacter le serveur.', TOAST_ICONS.error);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = `${ICONS.check} Vérifier et confirmer`; }
  }
}
window.submitColisSiege = submitColisSiege;

function resetVenteFormSiege() {
  const list = document.getElementById('passagersListSiege');
  if (list) {
    list.querySelectorAll('.passager-block').forEach((b, i) => { if (i > 0) b.remove(); });
    list.querySelectorAll('.vente-input').forEach(el => el.value = '');
    list.querySelectorAll('.p-type').forEach(el => el.value = 'adulte');
    list.querySelectorAll('.p-colis-soute-toggle').forEach(cb => cb.checked = false);
    list.querySelectorAll('.p-colis-soute-fields').forEach(f => f.style.display = 'none');
  }

  const remarques = document.getElementById('vente-siege-remarques');
  if (remarques) remarques.value = '';

  const step1 = document.getElementById('venteSiegeStep1');
  if (step1) step1.style.display = 'block';
  const step2 = document.getElementById('venteSiegeStep2');
  if (step2) { step2.classList.remove('slide-in'); step2.classList.add('locked'); step2.style.display = 'none'; }

  ['colis-siege-exp-nom','colis-siege-exp-tel','colis-siege-dest-nom','colis-siege-dest-tel','colis-siege-nature','colis-siege-poids','colis-siege-valeur','colis-siege-prix','colis-siege-remarques']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });

  setTrajetType('direct');
  selectedTrajetForVente = null;
  updatePrixPreview();
}