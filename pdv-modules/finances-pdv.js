// ─── TRAVIO — PDV — Finances (KPIs, graphique, stats colis) ───

import { apiFetch } from '../api.js';
import { escapeHtml } from '../sanitize.js';
import {
  ICONS, BACKEND, OFFSET_MS_FIN, toBrazzaDate,
  resaList, colisEnvoyesList, trajetList,
} from './state-pdv.js';
import { showToast } from './auth-init-pdv.js';
import { getDepartsForTrajet, getBusNomsPourPDV } from './trajets-pdv.js';

// ════════════════════════════════
//  STATE
// ════════════════════════════════
let finPeriode = 'today';
let finFiltreTrajet = '';
let finFiltreBus    = '';
let finFiltreStatut = '';
let finCustomRange  = null;

// ════════════════════════════════
//  PÉRIODE
// ════════════════════════════════
export function setFinPeriode(periode, btn) {
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

export function toggleFinCustomPickerPDV() {
  const wrap = document.getElementById('finCustomPickerWrapPDV');
  if (!wrap) return;
  wrap.style.display = wrap.style.display === 'block' ? 'none' : 'block';
}
window.toggleFinCustomPickerPDV = toggleFinCustomPickerPDV;

export function applyFinCustomRangePDV() {
  const debut = document.getElementById('finCustomDebutPDV')?.value;
  const fin   = document.getElementById('finCustomFinPDV')?.value;
  if (!debut || !fin) { showToast('Sélectionnez les deux dates.', ICONS.warning); return; }
  if (debut > fin) { showToast('La date de début doit précéder la date de fin.', ICONS.warning); return; }

  finCustomRange = { debut, fin };
  finPeriode = 'custom';   // ← LIGNE AJOUTÉE
  document.querySelectorAll('#finPeriodeFilters .rqf-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('finCustomBtnPDV')?.classList.add('active');
  document.getElementById('finCustomPickerWrapPDV').style.display = 'none';
  renderFinancePage();
}
window.applyFinCustomRangePDV = applyFinCustomRangePDV;

export function clearFinCustomRangePDV() {
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

// ════════════════════════════════
//  FILTRES
// ════════════════════════════════
function getResasParPeriode() {
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

function getAnnulParPeriode() {
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

export function calculerRevenuColisAccompagnePDV(resas) {
  let total = 0, count = 0;
  resas.forEach(r => {
    (r.passagers || []).forEach(p => {
      if (p.colisSoute && p.colisSoute.prix) {
        total += Number(p.colisSoute.prix) || 0;
        count++;
      }
    });
  });
  return { total, count };
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
     trajetList.map(t => `<option value="${escapeHtml(t.id)}">${escapeHtml(t.villeDepart)} → ${escapeHtml(t.villeArrivee)}</option>`).join('');

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
          busNoms.map(nom => `<option value="${escapeHtml(nom)}">${escapeHtml(nom)}</option>`).join('');
      })
      .catch(err => console.error('Erreur chargement bus filtre finances PDV :', err));
  } else {
    getBusNomsPourPDV().then(busNoms => {
      selB.innerHTML = '<option value="">Tous les bus</option>' +
        busNoms.map(nom => `<option value="${escapeHtml(nom)}">${escapeHtml(nom)}</option>`).join('');
    });
  }
}

function updateFinFiltreHighlightPDV(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('filtre-actif', !!el.value);
}

export function onFinTrajetFiltreChangePDV() {
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

export function onFinFiltreChange() {
  finFiltreBus    = document.getElementById('finFiltreBus')?.value   || '';
  finFiltreStatut = document.getElementById('finFiltreStatut')?.value || '';
  ['finFiltreBus', 'finFiltreStatut'].forEach(updateFinFiltreHighlightPDV);
  renderFinancePage();
}
window.onFinFiltreChange = onFinFiltreChange;

// ════════════════════════════════
//  PÉRIODE PRÉCÉDENTE (comparaison)
// ════════════════════════════════
function getBornesPeriodePrecedentePDV(periode, bDebut, bFin) {
  if (!bDebut || !bFin) return { debut: null, fin: null };

  if (periode === 'today') {
    const prev = new Date(new Date(bDebut + 'T00:00:00Z').getTime() - 86400000).toISOString().split('T')[0];
    return { debut: prev, fin: prev };
  }

  if (periode === 'week') {
    const d = new Date(bDebut + 'T00:00:00Z');       // lundi de cette semaine
    const prevDebut = new Date(d.getTime() - 7 * 86400000); // lundi de la semaine précédente
    const prevFin   = new Date(d.getTime() - 1 * 86400000); // dimanche de la semaine précédente
    return {
      debut: prevDebut.toISOString().split('T')[0],
      fin:   prevFin.toISOString().split('T')[0],
    };
  }

  if (periode === 'month') {
    const d = new Date(bDebut + 'T00:00:00Z');
    const prevDebut = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1));   // 1er du mois précédent
    const prevFin   = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 0));       // dernier jour du mois précédent
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

function getAnnulPrecedentesPDV(periode) {
  const { debut, fin } = getFinBornesEffectivesPDV();
  const { debut: pDebut, fin: pFin } = getBornesPeriodePrecedentePDV(periode, debut, fin);
  if (!pDebut || !pFin) return [];
  return resaList.filter(r => {
    if (r.statut !== 'annulée') return false;
    if (!finPasseFiltrePDV(r)) return false;
    const d = toBrazzaDate(r.createdAt);
    return d >= pDebut && d <= pFin;
  });
}

function getToutesResasPrecedentesPDV(periode) {
  const { debut, fin } = getFinBornesEffectivesPDV();
  const { debut: pDebut, fin: pFin } = getBornesPeriodePrecedentePDV(periode, debut, fin);
  if (!pDebut || !pFin) return [];
  return resaList.filter(r => {
    if (!finPasseFiltrePDV(r)) return false;
    const d = toBrazzaDate(r.createdAt);
    return d >= pDebut && d <= pFin;
  });
}

export function cmpHtmlPDV(val, prev) {
  if (prev === 0 && val === 0) {
    return `<span style="color:var(--muted);">— pas de comparaison</span>`;
  }
  if (prev === 0 && val > 0) {
    return `<span style="color:var(--accent);">↑ Nouveau — rien sur la période précédente</span>`;
  }
  const pct     = Math.round((val - prev) / prev * 100);
  const couleur = pct >= 0 ? 'var(--accent)' : '#FF4D6A';
  const fleche  = pct >= 0 ? '↑' : '↓';
  const signe   = pct >= 0 ? '+' : '';
  return `<span style="color:${couleur};">${fleche} ${signe}${pct}% vs période précédente</span>`;
}

// ════════════════════════════════
//  COLIS — STATS POUR FINANCES PDV
// ════════════════════════════════
function colisPasseFiltrePDV(c) {
  if (finFiltreTrajet && c.trajetId !== finFiltreTrajet) return false;
  if (finFiltreBus    && c.busNom   !== finFiltreBus)    return false;
  return true;
}

function calculerColisStatsPDV() {
  const { debut, fin } = getFinBornesEffectivesPDV();

  const colisPeriode = colisEnvoyesList.filter(c => {
    const d = toBrazzaDate(c.createdAt);
    if (debut && d < debut) return false;
    if (fin   && d > fin)   return false;
    return colisPasseFiltrePDV(c);
  });

  const { debut: pDebut, fin: pFin } = getBornesPeriodePrecedentePDV(finPeriode, debut, fin);
  const colisPrecedent = (pDebut && pFin)
    ? colisEnvoyesList.filter(c => {
        const d = toBrazzaDate(c.createdAt);
        return d >= pDebut && d <= pFin && colisPasseFiltrePDV(c);
      })
    : [];

  const revenuColis     = colisPeriode.reduce((s, c) => s + Number(c.prixTransport || 0), 0);
  const revenuColisPrec = colisPrecedent.reduce((s, c) => s + Number(c.prixTransport || 0), 0);

  return {
    revenuColis,
    revenuColisPrec,
    total:     colisPeriode.length,
    enTransit: colisPeriode.filter(c => c.statut === 'en_transit').length,
    arrive:    colisPeriode.filter(c => c.statut === 'arrive').length,
    retire:    colisPeriode.filter(c => c.statut === 'retire').length,
  };
}

function _renderFinanceColisPDV(totalEncaisse = 0, CAprec = 0) {
  const container = document.getElementById('finColisStatsPDV');

  const { revenuColis, revenuColisPrec, total, enTransit, retire } = calculerColisStatsPDV();

  const totalCombine     = totalEncaisse + revenuColis;
  const totalCombinePrec = CAprec + revenuColisPrec;

  const elTotal = document.getElementById('finKpiEncaisseTotal');
  if (elTotal) elTotal.textContent = totalCombine.toLocaleString() + ' XAF';

  const elTotalInfo = document.getElementById('finKpiEncaisseTotalInfo');
  if (elTotalInfo) {
    elTotalInfo.innerHTML = finPeriode === 'all' ? '' : cmpHtmlPDV(totalCombine, totalCombinePrec);
  }

  if (!container) return;

  const fmt = n => n >= 1_000_000
    ? (n/1_000_000).toFixed(1).replace(/\.0$/,'') + 'M XAF'
    : n >= 1_000 ? Math.round(n/1_000) + 'k XAF'
    : n.toLocaleString() + ' XAF';

  if (total === 0) {
    container.style.display = 'none';
    return;
  }
  container.style.display = 'block';

  let deltaHTML = `<span style="color:var(--muted);">— pas de comparaison</span>`;
  if (revenuColisPrec > 0) {
    deltaHTML = cmpHtmlPDV(revenuColis, revenuColisPrec);
  } else if (revenuColis > 0) {
    deltaHTML = `<span style="color:var(--accent);">Nouveau — rien sur la période précédente</span>`;
  }

  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:14px 16px;">
      <div>
        <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.6px;margin-bottom:4px;">${ICONS.bag} Revenu colis</div>
        <div style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:var(--white);">${fmt(revenuColis)}</div>
        <div style="font-size:11px;margin-top:2px;">${deltaHTML}</div>
      </div>
      <div style="display:flex;gap:14px;font-size:11.5px;color:var(--muted);">
        <span>${total} colis</span>
        <span style="color:#FFB23F;">${enTransit} en transit</span>
        <span style="color:var(--accent);">${retire} retirés</span>
      </div>
    </div>`;
}

// ════════════════════════════════
//  GRAPHIQUE D'ACTIVITÉ
// ════════════════════════════════
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
      if (dStr === aujourdHui) break;
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
      ? `${escapeHtml(r.arretMontee)} → ${escapeHtml(r.arretDescente)}`
      : (trajetRef ? `${escapeHtml(trajetRef.villeDepart)} → ${escapeHtml(trajetRef.villeArrivee)}` : escapeHtml(r.routeLabel || '—'))
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

function getToutesResasParPeriode() {
  const { debut, fin } = getFinBornesEffectivesPDV();
  return resaList.filter(r => {
    if (!finPasseFiltrePDV(r)) return false;
    const d = toBrazzaDate(r.createdAt);
    if (debut && d < debut) return false;
    if (fin   && d > fin)   return false;
    return true;
  });
}

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
      ? `${escapeHtml(r.arretMontee)} → ${escapeHtml(r.arretDescente)}`
      : escapeHtml(r.routeLabel || '—');
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
//  RENDER PRINCIPAL
// ════════════════════════════════
export function renderFinancePage() {
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

  const resas  = getResasParPeriode();
  const annuls = getAnnulParPeriode();
  const toutesResas = getToutesResasParPeriode();

  const totalEncaisse    = resas.reduce((s, r) => s + (r.prixTotal || 0), 0);
  const { total: revenuColisAccompagne, count: nbColisAccompagne } = calculerRevenuColisAccompagnePDV(resas);
  const totalBilletsSeuls = totalEncaisse - revenuColisAccompagne;

  setEl('finKpiEncaisse',   totalBilletsSeuls.toLocaleString() + ' XAF');
  setEl('finKpiColisAccompagne', revenuColisAccompagne.toLocaleString() + ' XAF');
  setEl('finKpiColisAccompagneCount', `${nbColisAccompagne} colis`);

  const billetsConfirmes = resas.reduce((s, r) => s + (r.nbPassagers || 1), 0);
  const billetsAnnules   = annuls.reduce((s, r) => s + (r.nbPassagers || 1), 0);
  const nbBillets        = billetsConfirmes + billetsAnnules;
  const montantAnnule    = annuls.reduce((s, r) => s + (r.prixTotal || 0), 0);

  setEl('finKpiBillets',    nbBillets.toLocaleString());
  setEl('finKpiAnnule',     montantAnnule.toLocaleString());
  setEl('finKpiAnnulCount', `${annuls.length} annulation${annuls.length > 1 ? 's' : ''}`);
  setEl('finKpiResa', toutesResas.length.toLocaleString());

  const noteAnnulesBillets = billetsAnnules > 0
    ? ` <span style="color:#FF4D6A;font-weight:600;">· dont ${billetsAnnules} annulé${billetsAnnules > 1 ? 's' : ''}</span>`
    : '';

  let CAprec = 0; // nécessaire pour le total combiné, calculé même en 'all' (restera 0)

  if (finPeriode === 'all') {
    setElHtml('finKpiEncaisseInfo', '');
    setElHtml('finKpiBilletsInfo', noteAnnulesBillets ? noteAnnulesBillets.trim() : 'sur la période');
    setElHtml('finKpiAnnulInfo', '');
    setElHtml('finKpiColisAccompagneInfo', '');
    setElHtml('finKpiResaInfo', annuls.length > 0
      ? `sur la période · <span style="color:#FF4D6A;font-weight:600;">dont ${annuls.length} annulée${annuls.length > 1 ? 's' : ''}</span>`
      : 'sur la période');
  } else {
    const resasPrec       = getResasPrecedentesPDV(finPeriode);
    const annulPrec       = getAnnulPrecedentesPDV(finPeriode);
    const toutesResasPrec = getToutesResasPrecedentesPDV(finPeriode);

    CAprec = resasPrec.reduce((s, r) => s + (r.prixTotal || 0), 0);
    const bilPrec = resasPrec.reduce((s, r) => s + (r.nbPassagers || 1), 0);
    const { total: colisAccompagnePrec } = calculerRevenuColisAccompagnePDV(resasPrec);
    const billetsSeulsPrec = CAprec - colisAccompagnePrec;
    const montantAnnulePrec = annulPrec.reduce((s, r) => s + (r.prixTotal || 0), 0);

    setElHtml('finKpiEncaisseInfo', cmpHtmlPDV(totalBilletsSeuls, billetsSeulsPrec));
    setElHtml('finKpiBilletsInfo',  cmpHtmlPDV(nbBillets, bilPrec) + noteAnnulesBillets);
    setElHtml('finKpiAnnulInfo',    cmpHtmlPDV(montantAnnule, montantAnnulePrec));
    setElHtml('finKpiColisAccompagneInfo', cmpHtmlPDV(revenuColisAccompagne, colisAccompagnePrec));
    setElHtml('finKpiResaInfo', cmpHtmlPDV(toutesResas.length, toutesResasPrec.length) +
      (annuls.length > 0
        ? ` <span style="color:#FF4D6A;font-weight:600;">· dont ${annuls.length} annulée${annuls.length > 1 ? 's' : ''}</span>`
        : ''));
  }

  renderMeilleurTrajet(resas);
  renderImpactPDV(finPeriode);
  renderFinanceChartPDV(finPeriode);
  renderFinanceDowPDV(resas);
  renderFinanceTrajetsPDV(resas, fmt);
  _renderFinanceColisPDV(totalEncaisse, CAprec);
}