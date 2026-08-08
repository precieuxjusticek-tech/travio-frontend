// ─── TRAVIO — PDV — Vente (sélection trajet, passagers, colis, soumission, tickets) ───

import { apiFetch } from '../api.js';
import {
  ICONS, BACKEND, OFFSET_MS_FIN, toBrazzaDate,
  nomType, ageRangeLabel, peuplerSelectType,
  pdvData, agenceData, trajetList, resaList,
  invalidateStatsPdvCache,
} from './state-pdv.js';
import { showToast, showPage } from './auth-init-pdv.js';
import { getDepartsForTrajet, renderTrajetsPDV } from './trajets-pdv.js';
import { showTicket, showManualTicket, showColisTicketShared } from './ticket-pdv.js';

// ════════════════════════════════
//  HOOK — notifier dashboard-pdv.js qu'une vente vient d'être enregistrée
//  (dashboard-pdv.js s'enregistre ici pour rafraîchir l'accueil, sans import circulaire)
// ════════════════════════════════
const venteCompleteHooks = [];
export function onVenteComplete(fn) {
  venteCompleteHooks.push(fn);
}
function triggerVenteComplete() {
  venteCompleteHooks.forEach(fn => fn());
}

// ════════════════════════════════
//  STATE
// ════════════════════════════════
let selectedTrajetForVente = null;
let venteMode = 'billet'; // 'billet' | 'colis'

// ════════════════════════════════
//  VENTE — SELECT TRAJET
// ════════════════════════════════
export function populateVenteSelect() {
  // Initialiser avec le type "direct" par défaut
  setTrajetType('direct');
}

export function setTrajetType(type) {
  document.getElementById('btnTypeDirect')?.classList.toggle('active', type === 'direct');
  document.getElementById('btnTypeArrets')?.classList.toggle('active', type === 'arrets');

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

export function setVenteMode(mode) {
  venteMode = mode;
  document.getElementById('btnModeBillet')?.classList.toggle('active', mode === 'billet');
  document.getElementById('btnModeColis')?.classList.toggle('active', mode === 'colis');

  const titre = document.getElementById('ventePageTitle');
  if (titre) titre.textContent = mode === 'billet' ? 'Vente de billets' : 'Expédier un colis';

  // ── Texte de l'étape 2 selon le mode ──
  const step2Title = document.getElementById('venteStep2Title');
  const step2Sub    = document.getElementById('venteStep2Subtitle');
  if (step2Title && step2Sub) {
    if (mode === 'billet') {
      step2Title.textContent = 'Informations passager(s)';
      step2Sub.textContent   = 'Ajoutez autant de passagers que nécessaire';
    } else {
      step2Title.textContent = 'Expéditeur, destinataire & colis';
      step2Sub.textContent   = 'Renseignez les coordonnées et les détails du colis';
    }
  }

  const secB = document.getElementById('secteurBillet');
  const secC = document.getElementById('secteurColis');
  if (secB) secB.style.display = mode === 'billet' ? 'flex' : 'none';
  if (secC) secC.style.display = mode === 'colis'  ? 'flex' : 'none';

  if (mode === 'billet') updatePrixPreview();
  else updateColisPrixPreview();
}
window.setVenteMode = setVenteMode;

export function renderTrajetCardList() {
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
window.renderTrajetCardList = renderTrajetCardList;

export function pickTrajetCard(el) {
  document.querySelectorAll('.trajet-card-pick').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  const select = document.getElementById('vente-trajet');
  select.value = el.dataset.value;
  onSelectTrajet();
}
window.pickTrajetCard = pickTrajetCard;

export function filterTrajetCards() {
  const term = (document.getElementById('trajetSearchInput')?.value || '').toLowerCase().trim();
  document.querySelectorAll('.trajet-card-pick').forEach(c => {
    c.style.display = !term || c.dataset.search.includes(term) ? 'flex' : 'none';
  });
}
window.filterTrajetCards = filterTrajetCards;

export function toggleMoreOptions(el) {
  const box = el.nextElementSibling;
  const icon = el.querySelector('.more-icon');
  box.classList.toggle('open');
  icon.textContent = box.classList.contains('open') ? '－' : '＋';
}
window.toggleMoreOptions = toggleMoreOptions;

export function onSelectTrajet() {
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

    document.getElementById('vente-ville-depart').value  = t.villeDepart;
    document.getElementById('vente-ville-arrivee').value = t.villeArrivee;

    const selEmb = document.getElementById('vente-pdv-embarquement');
    if (selEmb) {
      selEmb.innerHTML = (t.pdvDepart || []).map(p =>
        `<option value="${p.id}" data-nom="${p.nom||''}" data-ville="${p.ville||''}">${p.nom}${p.ville ? ' — '+p.ville : ''}</option>`
      ).join('');
      const match = (t.pdvDepart || []).find(p => p.id === pdvData.id);
      selEmb.value = match ? match.id : (t.pdvDepart?.[0]?.id || '');
    }

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
        // FIX BUG : on cherchait par id (celui de l'arrêt, pas celui du PDV) — jamais de match.
        // On retrouve d'abord la ville où notre PDV est positionné, puis on matche par ville.
        const monPdvArret = (t.pdvArrets || []).find(p => p.id === pdvData.id);
        const villeMonPdv = (monPdvArret?.ville || '').toLowerCase().trim();
        position = allPoints.findIndex(p =>
          (p.ville || p.nom || '').toLowerCase().trim() === villeMonPdv
        );
      }

      if (position === -1 || position >= allPoints.length - 1) position = 0;

      const villeMonteePdv = allPoints[position].nom;

      const inputVilleMontee = document.getElementById('vente-montee-ville');
      if (inputVilleMontee) inputVilleMontee.value = villeMonteePdv;

      const pdvsEmbarquement = estDepart
        ? (t.pdvDepart || [])
        : (t.pdvArrets || []).filter(p => p.id === pdvData.id);

      monteeSelect.innerHTML = pdvsEmbarquement.length > 0
        ? pdvsEmbarquement.map(p =>
            `<option value="${p.id}" data-nom="${p.nom||''}" data-ville="${p.ville||''}" data-city="${villeMonteePdv}">${p.nom}${p.ville ? ' — '+p.ville : ''}</option>`
          ).join('')
        : `<option value="${pdvData.id}" data-nom="${pdvData.nom||''}" data-ville="${pdvData.ville||''}" data-city="${villeMonteePdv}">${pdvData.nom}</option>`;

      const matchEmb = pdvsEmbarquement.find(p => p.id === pdvData.id);
      monteeSelect.value = matchEmb ? matchEmb.id : (pdvsEmbarquement[0]?.id || '');
      monteeSelect.disabled = false;

      descenteSelect.innerHTML = '<option value="">— Ville de descente</option>' +
        allPoints.slice(position + 1).map(p =>
          `<option value="${p.nom}">${p.nom}</option>`
        ).join('');
      descenteSelect.disabled = false;

      const selDebArrets = document.getElementById('vente-pdv-debarquement-arrets');
      if (selDebArrets) selDebArrets.innerHTML = '<option value="">— Sélectionner —</option>';

      onSegmentChange();
    }

    if (recapA) recapA.style.display = 'flex';
  }

  if (dateBlock) {
    dateBlock.style.display = 'flex';
    const dateInput    = document.getElementById('vente-date');
    const sessionInput = document.getElementById('vente-session-id');
    if (dateInput)    dateInput.value    = '';
    if (sessionInput) sessionInput.value = '';
    loadSessionsDisponibles(trajetId);
  }
  updatePrixPreview();
}
window.onSelectTrajet = onSelectTrajet;

export function onSegmentChange() {
  if (!selectedTrajetForVente) return;

  const monteeVal   = document.getElementById('vente-montee-ville')?.value;
  const descenteVal = document.getElementById('vente-descente')?.value;

  if (!monteeVal || !descenteVal) return;

  const t = selectedTrajetForVente;
  const segmentPrixTypesEl = document.getElementById('segmentPrixTypes');

  const allPoints = [
    { nom: t.villeDepart, prixParType: {}, isOrigin: true },
    ...(t.arrets || []).map(a => ({ ...a, nom: a.ville || a.nom })),
    { nom: t.villeArrivee, prixParType: t.prixParType, isDestination: true },
  ];

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
      const prixDest    = pointDescente.prixParType?.[typeId] ?? t.prixParType[typeId] ?? 0;
      const prixMontee  = pointMontee.prixParType?.[typeId] ?? 0;
      prixSegmentParType[typeId] = Math.max(0, prixDest - prixMontee);
    });
  }

  selectedTrajetForVente._segmentPrixParType = prixSegmentParType;
  selectedTrajetForVente._arretMontee        = monteeVal;
  selectedTrajetForVente._arretDescente      = descenteVal;

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

    const estLieuLibre = (t.arrets || []).some(a =>
      (a.ville || a.nom) === descenteVal && a.type === 'libre'
    );

    if (estLieuLibre) {
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
    const allDeparts = await getDepartsForTrajet(trajetId);
    const departs     = allDeparts.filter(d => d.actif !== false);

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
      container.innerHTML = `<div class="empty-state small"><p>Aucune session disponible.</p><small>Contactez l'agence pour générer des sessions.</small></div>`;
      return;
    }

    const joursNoms = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];

    container.innerHTML = allSessions.map(s => {
      const dateObj   = new Date(s.date + 'T00:00:00');
      let restantes;
      const t = selectedTrajetForVente;
      if (t && (t.typeTrajet || 'direct') === 'arrets' && s.placesVenduesSegments) {
        const estDepart = (t.pdvDepart || []).some(p => p.id === pdvData.id);
        let pdvPos;
        if (estDepart) {
          pdvPos = 0;
        } else {
          // FIX BUG : même correction que dans onSelectTrajet — on matche par ville, pas par id d'arrêt.
          const monPdvArret = (t.pdvArrets || []).find(p => p.id === pdvData.id);
          const villeMonPdv = (monPdvArret?.ville || '').toLowerCase().trim();
          const allPointsObj = [
            { nom: t.villeDepart },
            ...(t.arrets || []).map(a => ({ nom: a.ville || a.nom })),
            { nom: t.villeArrivee },
          ];
          pdvPos = allPointsObj.findIndex(p => (p.nom || '').toLowerCase().trim() === villeMonPdv);
        }
        if (pdvPos === -1) pdvPos = 0;

        const segmentsDepuisPDV = s.placesVenduesSegments.slice(pdvPos);
        const maxOccupe = segmentsDepuisPDV.length > 0 ? Math.max(...segmentsDepuisPDV) : 0;
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

export function selectSession(el, date, sessionId) {
  document.querySelectorAll('.session-item.selected').forEach(i => i.classList.remove('selected'));
  el.classList.add('selected');

  const dateInput     = document.getElementById('vente-date');
  const sessionInput  = document.getElementById('vente-session-id');
  if (dateInput)    dateInput.value    = date;
  if (sessionInput) sessionInput.value = sessionId;

  updatePrixPreview();
}
window.selectSession = selectSession;

export function updatePrixPreview() {
  if (venteMode !== 'billet') return;
  if (!selectedTrajetForVente) return;

  const t = selectedTrajetForVente;
  const isArrets = (t.typeTrajet || 'direct') === 'arrets';
  const blocks = document.querySelectorAll('.passager-block');

  let totalGeneral = 0;
  let linesHtml = '';

  blocks.forEach((block, i) => {
    const type    = block.querySelector('.p-type')?.value || 'adulte';
    const bagages = parseFloat(block.querySelector('.p-bagages')?.value || 0);
    const prixColisSoute = block.querySelector('.p-colis-soute-toggle')?.checked
      ? Number(block.querySelector('.p-colis-soute-prix')?.value || 0)
      : 0;

    const prixBase = isArrets
      ? (t._segmentPrixParType?.[type] || 0)
      : (t.prixParType?.[type] || 0);

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

  const linesEl = document.getElementById('prixPreviewLines');
  if (linesEl) linesEl.innerHTML = linesHtml;

  const totalEl = document.getElementById('previewTotal');
  if (totalEl) totalEl.textContent = `${Number(totalGeneral).toLocaleString()} XAF`;
}
window.updatePrixPreview = updatePrixPreview;

export function updateColisPrixPreview() {
  const prix = Number(document.getElementById('colis-prix')?.value || 0);
  const linesEl = document.getElementById('prixPreviewLines');
  if (linesEl) linesEl.innerHTML = '';
  const totalEl = document.getElementById('previewTotal');
  if (totalEl) totalEl.textContent = `${prix.toLocaleString()} XAF`;
}
window.updateColisPrixPreview = updateColisPrixPreview;

export function addPassager() {
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
        <input type="checkbox" class="p-colis-soute-toggle" onchange="toggleColisSoute(this)">
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
  renumberPassagers();
  updatePrixPreview();
}
window.addPassager = addPassager;

export function toggleColisSoute(checkbox) {
  const fields = checkbox.closest('.more-options').querySelector('.p-colis-soute-fields');
  fields.style.display = checkbox.checked ? 'block' : 'none';
  updatePrixPreview();
}
window.toggleColisSoute = toggleColisSoute;

export function removePassager(btn) {
  const block = btn.closest('.passager-block');
  if (block) block.remove();
  renumberPassagers();
  updatePrixPreview();
}
window.removePassager = removePassager;

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
export function venteGoStep(step) {
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
      step2.style.display = 'block';
      step2.classList.remove('locked');
      void step2.offsetWidth;
      step2.classList.add('slide-in');
    }

    if (venteMode === 'billet') updatePrixPreview();
    else updateColisPrixPreview();
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
window.venteGoStep = venteGoStep;

export function showVenteRecap() {
  if (venteMode === 'colis') { showColisRecapShared(); return; }

  const blocks = document.querySelectorAll('.passager-block');
  for (let i = 0; i < blocks.length; i++) {
    const prenom = blocks[i].querySelector('.p-prenom')?.value.trim();
    const nom    = blocks[i].querySelector('.p-nom')?.value.trim();
    const tel    = i === 0 ? blocks[i].querySelector('.p-tel')?.value.trim() : null;
    if (!prenom) { showToast(`Prénom manquant (Passager ${i + 1}).`, ICONS.warning); return; }
    if (!nom)    { showToast(`Nom manquant (Passager ${i + 1}).`, ICONS.warning); return; }
    if (i === 0 && !tel) { showToast('Téléphone du passager principal manquant.', ICONS.warning); return; }
  }

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

  let passagersHtml = '';
  let totalGeneral  = 0;

  blocks.forEach((block, i) => {
    const prenom  = block.querySelector('.p-prenom')?.value.trim() || '—';
    const nom     = block.querySelector('.p-nom')?.value.trim()    || '—';
    const tel     = block.querySelector('.p-tel')?.value.trim()    || '—';
    const type    = block.querySelector('.p-type')?.value || 'adulte';
    const bagages = parseFloat(block.querySelector('.p-bagages')?.value || 0);
    const nombreBagages = parseInt(block.querySelector('.p-bagages-nombre')?.value || 0, 10);
    const siege   = block.querySelector('.p-siege')?.value.trim() || '—';

    let prixBase = isArrets
      ? (t._segmentPrixParType?.[type] || 0)
      : (t.prixParType?.[type] || 0);

    const prixColisSoute = block.querySelector('.p-colis-soute-toggle')?.checked
      ? Number(block.querySelector('.p-colis-soute-prix')?.value || 0)
      : 0;
    const colisSouteNature = block.querySelector('.p-colis-soute-nature')?.value.trim() || null;
    const colisSoutePoids = parseFloat(block.querySelector('.p-colis-soute-poids')?.value) || null;
    const colisSouteValeur = parseFloat(block.querySelector('.p-colis-soute-valeur')?.value) || null;

    const excesBag  = bagages > (t.limiteBagages || 0) ? Math.max(0, bagages - (t.limiteBagages || 0)) : 0;
    const prixBag   = excesBag * (t.fraisExcesBagages || 0);
    const sousTotal = prixBase + prixBag + prixColisSoute;
    totalGeneral   += sousTotal;

    passagersHtml += `
      <div class="recap-passager-card">
        <div class="recap-passager-title">Passager ${i + 1}</div>
        <div class="recap-row"><span>Nom complet</span><strong>${prenom} ${nom}</strong></div>
        ${i === 0 || tel !== '—' ? `<div class="recap-row"><span>Téléphone</span><strong>${tel}</strong></div>` : ''}
        <div class="recap-row"><span>Type</span><strong>${nomType(type)} <small style="color:var(--muted);">(${ageRangeLabel(type)})</small></strong></div>
        ${siege !== '—' ? `<div class="recap-row"><span>Siège</span><strong>${siege}</strong></div>` : ''}
        ${bagages > 0 ? `<div class="recap-row"><span>Bagages</span><strong>${bagages} kg${nombreBagages > 0 ? ` · ${nombreBagages} colis` : ''}${prixBag > 0 ? ` (+${Number(prixBag).toLocaleString()} XAF)` : ''}</strong></div>` : ''}
        ${prixColisSoute > 0 ? `
          <div class="recap-row"><span>Colis en soute</span><strong>${colisSouteNature || '—'} (${Number(prixColisSoute).toLocaleString()} XAF)</strong></div>
          ${colisSoutePoids ? `<div class="recap-row"><span>Poids du colis</span><strong>${colisSoutePoids} kg</strong></div>` : ''}
          ${colisSouteValeur ? `<div class="recap-row"><span>Valeur déclarée</span><strong>${Number(colisSouteValeur).toLocaleString()} XAF</strong></div>` : ''}
        ` : ''}
        <div class="recap-row"><span>Sous-total</span><strong style="color:var(--accent)">${Number(sousTotal).toLocaleString()} XAF</strong></div>
      </div>`;
  });

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
window.showVenteRecap = showVenteRecap;

export function closeVenteRecap() {
  const overlay = document.getElementById('recapVenteOverlay');
  if (overlay) {
    overlay.classList.remove('show');
    setTimeout(() => overlay.remove(), 350);
  }
}
window.closeVenteRecap = closeVenteRecap;

export function showColisRecapShared() {
  const expNom  = document.getElementById('colis-exp-nom')?.value.trim();
  const expTel  = document.getElementById('colis-exp-tel')?.value.trim();
  const destNom = document.getElementById('colis-dest-nom')?.value.trim();
  const destTel = document.getElementById('colis-dest-tel')?.value.trim();
  const nature  = document.getElementById('colis-nature')?.value.trim();
  const prix    = Number(document.getElementById('colis-prix')?.value || 0);

  if (!expNom || !expTel)   { showToast('Informations expéditeur manquantes.', ICONS.warning); return; }
  if (!destNom || !destTel) { showToast('Informations destinataire manquantes.', ICONS.warning); return; }
  if (!nature)              { showToast('Précisez la nature du colis.', ICONS.warning); return; }
  if (!prix)                { showToast('Indiquez le prix du transport.', ICONS.warning); return; }
  if (!selectedTrajetForVente) { showToast('Sélectionnez un trajet.', ICONS.warning); return; }

  const t = selectedTrajetForVente;
  const isArretsColisCheck = (t.typeTrajet || 'direct') === 'arrets';

  if (isArretsColisCheck) {
    if (!t._arretMontee || !t._arretDescente) {
      showToast('Sélectionnez la montée et la descente du colis.', ICONS.warning); return;
    }
    const debArretsVal = document.getElementById('vente-pdv-debarquement-arrets')?.value;
    if (!debArretsVal) { showToast('Sélectionnez le PDV de débarquement.', ICONS.warning); return; }
  } else {
    const selEmb = document.getElementById('vente-pdv-embarquement');
    const selDeb = document.getElementById('vente-pdv-debarquement');
    if (!selEmb?.value) { showToast('Sélectionnez le PDV d\'embarquement.', ICONS.warning); return; }
    if (!selDeb?.value) { showToast('Sélectionnez le PDV de débarquement.', ICONS.warning); return; }
  }

  let embDebHtmlColis = '';
  if (isArretsColisCheck) {
    const selEmb = document.getElementById('vente-montee');
    const selDeb = document.getElementById('vente-pdv-debarquement-arrets');
    const embOption = selEmb?.selectedOptions[0];
    const debOption = selDeb?.selectedOptions[0];
    embDebHtmlColis = `
      <div class="recap-row"><span>Embarquement</span><strong>${embOption?.dataset.nom || '—'}${embOption?.dataset.ville ? ' — ' + embOption.dataset.ville : (t._arretMontee ? ' — ' + t._arretMontee : '')}</strong></div>
      <div class="recap-row"><span>Débarquement</span><strong>${debOption?.dataset.nom || '—'}${debOption?.dataset.ville ? ' — ' + debOption.dataset.ville : (t._arretDescente ? ' — ' + t._arretDescente : '')}</strong></div>`;
  } else {
    const selEmb = document.getElementById('vente-pdv-embarquement');
    const selDeb = document.getElementById('vente-pdv-debarquement');
    const embOption = selEmb?.selectedOptions[0];
    const debOption = selDeb?.selectedOptions[0];
    embDebHtmlColis = `
      <div class="recap-row"><span>Embarquement</span><strong>${embOption?.dataset.nom || '—'}${embOption?.dataset.ville ? ' — ' + embOption.dataset.ville : ''}</strong></div>
      <div class="recap-row"><span>Débarquement</span><strong>${debOption?.dataset.nom || '—'}${debOption?.dataset.ville ? ' — ' + debOption.dataset.ville : ''}</strong></div>`;
  }
  const sessionHeure = document.querySelector('.session-item.selected')?.dataset.heure || t.heureDepart || '—';
  const date = document.getElementById('vente-date')?.value;
  const dateFormatee = date ? new Date(date).toLocaleDateString('fr-FR', { weekday:'long', day:'2-digit', month:'long', year:'numeric' }) : '—';
  const poids = document.getElementById('colis-poids')?.value || '—';
  const valeur = document.getElementById('colis-valeur')?.value;
  const remarques = document.getElementById('colis-remarques')?.value.trim();

  let overlay = document.getElementById('recapVenteOverlay');
  if (overlay) overlay.remove();
  overlay = document.createElement('div');
  overlay.id = 'recapVenteOverlay';
  overlay.className = 'recap-overlay';
  overlay.innerHTML = `
    <div class="recap-backdrop" onclick="closeVenteRecap()"></div>
    <div class="recap-modal">
      <div class="recap-modal-header">
        <div><h3>${ICONS.clipboard} Récapitulatif</h3><small>Vérifiez avant de confirmer</small></div>
        <button class="recap-close-btn" onclick="closeVenteRecap()">${ICONS.close}</button>
      </div>
      <div class="recap-body">
        <div>
          <div class="recap-section-title">Trajet</div>
          <div class="recap-card">
            <div class="recap-row"><span>Ligne</span><strong>${isArretsColisCheck && t._arretMontee ? `${t._arretMontee} → ${t._arretDescente}` : `${t.villeDepart} → ${t.villeArrivee}`}</strong></div>
            <div class="recap-row"><span>Date</span><strong>${dateFormatee}</strong></div>
            <div class="recap-row"><span>Départ</span><strong>${sessionHeure}</strong></div>
            <div class="recap-row"><span>Bus</span><strong>${document.querySelector('.session-item.selected')?.dataset.bus || '—'}</strong></div>
            ${embDebHtmlColis}
          </div>
        </div>
        <div>
          <div class="recap-section-title">Expéditeur</div>
          <div class="recap-card">
            <div class="recap-row"><span>Nom</span><strong>${expNom}</strong></div>
            <div class="recap-row"><span>Téléphone</span><strong>${expTel}</strong></div>
          </div>
        </div>
        <div>
          <div class="recap-section-title">Destinataire</div>
          <div class="recap-card">
            <div class="recap-row"><span>Nom</span><strong>${destNom}</strong></div>
            <div class="recap-row"><span>Téléphone</span><strong>${destTel}</strong></div>
          </div>
        </div>
        <div>
          <div class="recap-section-title">Colis</div>
          <div class="recap-card">
            <div class="recap-row"><span>Nature</span><strong>${nature}</strong></div>
            <div class="recap-row"><span>Poids</span><strong>${poids} kg</strong></div>
            ${valeur ? `<div class="recap-row"><span>Valeur déclarée</span><strong>${Number(valeur).toLocaleString()} XAF</strong></div>` : ''}
          </div>
        </div>
        ${remarques ? `<div><div class="recap-section-title">Remarques</div><div class="recap-card"><div class="recap-row" style="display:block;"><span>${remarques}</span></div></div></div>` : ''}
        <div class="recap-total-row"><span>Total à encaisser</span><strong>${prix.toLocaleString()} XAF</strong></div>
      </div>
      <div class="recap-actions">
        <button class="vente-btn-next vente-btn-confirm" onclick="submitVente()">${ICONS.check} Confirmer et enregistrer</button>
        <button class="vente-btn-back" onclick="closeVenteRecap()">← Modifier</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
}
window.showColisRecapShared = showColisRecapShared;

// ════════════════════════════════
//  VENTE — SOUMETTRE
// ════════════════════════════════
export async function submitVente() {
  closeVenteRecap();
  if (venteMode === 'colis') { await submitColisShared(); return; }

  const blocks  = document.querySelectorAll('.passager-block');
  const date    = document.getElementById('vente-date')?.value;
  const remarques = document.getElementById('vente-remarques')?.value.trim() || null;
  const sessionId = document.getElementById('vente-session-id')?.value || null;
  const sessionHeure = document.querySelector('.session-item.selected')?.dataset.heure
    || selectedTrajetForVente?.heureDepart || null;
  const sessionBusNom = document.querySelector('.session-item.selected')?.dataset.bus || null;

  if (!selectedTrajetForVente) { showToast('Sélectionnez un trajet.', ICONS.warning); return; }

  const t = selectedTrajetForVente;
  const isArrets = (t.typeTrajet || 'direct') === 'arrets';
  const isDirect = (t.typeTrajet || 'direct') === 'direct';

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
    const selEmb = document.getElementById('vente-montee');
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
    const nombreBagages = parseInt(block.querySelector('.p-bagages-nombre')?.value || 0, 10);
    const colisSouteCheck = block.querySelector('.p-colis-soute-toggle')?.checked;
    const prixColisSoute  = colisSouteCheck ? Number(block.querySelector('.p-colis-soute-prix')?.value || 0) : 0;

    const prixBase = isArrets
      ? (t._segmentPrixParType?.[type] || 0)
      : (t.prixParType?.[type] || 0);

    const excesBag  = bagages > (t.limiteBagages || 0) ? Math.max(0, bagages - (t.limiteBagages || 0)) : 0;
    const prixBag   = excesBag * (t.fraisExcesBagages || 0);
    const sousTotal = prixBase + prixBag + prixColisSoute;
    totalGeneral   += sousTotal;

    passagers.push({
      prenom:    block.querySelector('.p-prenom')?.value.trim(),
      nom:       block.querySelector('.p-nom')?.value.trim(),
      telephone: block.querySelector('.p-tel')?.value.trim() || null,
      type,
      typeNom:      nomType(type),
      typeAgeLabel: ageRangeLabel(type),
      bagages,
      nombreBagages,
      siege: block.querySelector('.p-siege')?.value.trim() || null,
      prixBillet: prixBase,
      prixBagages: prixBag,
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

    if (pdvData) pdvData.vendus = (pdvData.vendus || 0) + 1;

    const newResa = { ...payload, id: data.id || data.reservationId };
    resaList.push(newResa);
    invalidateStatsPdvCache();

    triggerVenteComplete();
    renderTrajetsPDV();

    resetVenteForm();

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
window.submitVente = submitVente;

async function submitColisShared() {
  const t = selectedTrajetForVente;
  if (!t) { showToast('Sélectionnez un trajet.', ICONS.warning); return; }

  const sessionHeure = document.querySelector('.session-item.selected')?.dataset.heure || t.heureDepart || null;
  const sessionBusNom = document.querySelector('.session-item.selected')?.dataset.bus || null;
  const isArretsColis = (t.typeTrajet || 'direct') === 'arrets';

  let pdvEmbarquementId    = pdvData.id;
  let pdvEmbarquementNom   = pdvData.nom;
  let pdvEmbarquementVille = pdvData.ville;
  let pdvDebarquementId    = null;
  let pdvDebarquementNom   = null;
  let pdvDebarquementVille = null;
  let arretMontee   = null;
  let arretDescente = null;
  let routeLabelColis = `${t.villeDepart} → ${t.villeArrivee}`;

  if (isArretsColis) {
    arretMontee   = t._arretMontee   || null;
    arretDescente = t._arretDescente || null;
    routeLabelColis = (arretMontee && arretDescente) ? `${arretMontee} → ${arretDescente}` : routeLabelColis;

    const selEmb = document.getElementById('vente-montee');
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
  } else {
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
  }

  const payload = {
    agenceId: pdvData.agenceId,
    pdvId: pdvData.id,
    trajetId: t.id,
    typeTrajet: t.typeTrajet || 'direct',
    routeLabel: routeLabelColis,
    arretMontee,
    arretDescente,
    pdvEmbarquementId,
    pdvEmbarquementNom,
    pdvEmbarquementVille,
    pdvDebarquementId,
    pdvDebarquementNom,
    pdvDebarquementVille,
    sessionId: document.getElementById('vente-session-id')?.value || null,
    dateDepart: document.getElementById('vente-date')?.value,
    heureDepart: sessionHeure,
    busNom: sessionBusNom,
    expediteurNom: document.getElementById('colis-exp-nom')?.value.trim(),
    expediteurTel: document.getElementById('colis-exp-tel')?.value.trim(),
    destinataireNom: document.getElementById('colis-dest-nom')?.value.trim(),
    destinataireTel: document.getElementById('colis-dest-tel')?.value.trim(),
    nature: document.getElementById('colis-nature')?.value.trim(),
    poids: parseFloat(document.getElementById('colis-poids')?.value) || null,
    valeurDeclaree: parseFloat(document.getElementById('colis-valeur')?.value) || null,
    remarques: document.getElementById('colis-remarques')?.value.trim() || null,
    prixTransport: Number(document.getElementById('colis-prix')?.value || 0),
    statut: 'en_transit',
    createdAt: new Date().toISOString(),
  };

  const btn = document.getElementById('venteBtnConfirm');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="btn-spinner"></span> Enregistrement...'; }

  try {
    const res  = await apiFetch(`${BACKEND}/colis/create`, { method: 'POST', body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) { showToast(data.message || "Erreur lors de l'enregistrement.", ICONS.banned); return; }

    if (!data.codeRetrait) {
      console.error('Le serveur n\'a pas renvoyé de code de retrait.');
      showToast('Colis enregistré mais code de retrait manquant — contactez le support.', ICONS.warning);
    }

    window._lastColisId = data.id || data.colisId;
    showColisTicketShared(payload, data.codeRetrait);
    resetVenteForm();

  } catch (err) {
    console.error('Erreur colis :', err);
    showToast('Impossible de contacter le serveur.', ICONS.banned);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = `${ICONS.check} Vérifier et confirmer`; }
  }
}
window.submitColisShared = submitColisShared;

function resetVenteForm() {
  const list = document.getElementById('passagersList');
  if (list) {
    list.querySelectorAll('.passager-block').forEach((b, i) => { if (i > 0) b.remove(); });
    list.querySelectorAll('.vente-input').forEach(el => el.value = '');
    list.querySelectorAll('.p-type').forEach(el => el.value = 'adulte');
    list.querySelectorAll('.p-colis-soute-toggle').forEach(cb => cb.checked = false);
    list.querySelectorAll('.p-colis-soute-fields').forEach(f => f.style.display = 'none');
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

  ['colis-exp-nom','colis-exp-tel','colis-dest-nom','colis-dest-tel','colis-nature','colis-poids','colis-valeur','colis-prix','colis-remarques']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });

  setTrajetType('direct');
  selectedTrajetForVente = null;
  updatePrixPreview();
}

// ════════════════════════════════
//  PRÉFILL VENTE DEPUIS TRAJETS
// ════════════════════════════════
export function prefillVente(trajetId) {
  setVenteMode('billet');
  showPage('vente', document.querySelector('[data-page=vente]'));

  setTimeout(() => {
    const t = trajetList.find(tr => tr.id === trajetId);
    if (!t) return;

    setTrajetType(t.typeTrajet || 'direct');

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
window.prefillVente = prefillVente;