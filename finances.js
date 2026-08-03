// ─── TRAVIO — Finances ───

import { BACKEND, agenceData, resaList, pdvList, trajetList } from './state.js';
import { loadDeparts, loadAllDeparts } from './trajets.js';
import { showToast, TOAST_ICONS } from './toast-utils.js';
import { apiFetch } from './api.js';

const ICONS = {
  close:   '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  pin:     '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:3px;"><path d="M8 1a5 5 0 00-5 5c0 3.5 5 9 5 9s5-5.5 5-9a5 5 0 00-5-5z" stroke="currentColor" stroke-width="1.4"/><circle cx="8" cy="6" r="1.4" stroke="currentColor" stroke-width="1.4"/></svg>',
  chart:   '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:4px;"><path d="M2 12l4-4 3 3 5-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M11 5h3v3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  banned:  '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:3px;"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.4"/><path d="M4 4l8 8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  scissors:'<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:3px;"><circle cx="4" cy="4" r="1.6" stroke="currentColor" stroke-width="1.3"/><circle cx="4" cy="12" r="1.6" stroke="currentColor" stroke-width="1.3"/><path d="M5.3 5.2L13 12M5.3 10.8L13 4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
  person:  '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:3px;"><circle cx="8" cy="6" r="3" stroke="currentColor" stroke-width="1.3"/><path d="M2 15a6 6 0 0112 0" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
  money:   '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:3px;"><rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.4"/><circle cx="8" cy="8" r="2.2" stroke="currentColor" stroke-width="1.4"/></svg>',
  trophy:  '<svg width="20" height="20" viewBox="0 0 16 16" fill="none"><path d="M5 3h6v3a3 3 0 01-6 0V3z" stroke="currentColor" stroke-width="1.3"/><path d="M5 4H3a2 2 0 002 2M11 4h2a2 2 0 01-2 2" stroke="currentColor" stroke-width="1.3"/><path d="M8 9v2M6 13h4M7 11h2v2H7z" stroke="currentColor" stroke-width="1.3"/></svg>',
  bus:     '<svg width="13" height="13" viewBox="0 0 20 20" fill="none" style="vertical-align:-2px;margin-right:4px;"><rect x="3" y="4" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M3 10h14" stroke="currentColor" stroke-width="1.5"/><circle cx="6" cy="16" r="1.5" stroke="currentColor" stroke-width="1.4"/><circle cx="14" cy="16" r="1.5" stroke="currentColor" stroke-width="1.4"/></svg>',
  medal1:  '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="margin-right:6px;"><circle cx="8" cy="10" r="4.5" fill="#FFD700"/><path d="M6 2l2 3 2-3" stroke="#FFD700" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  medal2:  '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="margin-right:6px;"><circle cx="8" cy="10" r="4.5" fill="#C0C0C0"/><path d="M6 2l2 3 2-3" stroke="#C0C0C0" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  medal3:  '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="margin-right:6px;"><circle cx="8" cy="10" r="4.5" fill="#CD7F32"/><path d="M6 2l2 3 2-3" stroke="#CD7F32" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

const OFFSET_MS_BRAZZA = 1 * 60 * 60 * 1000; // Brazzaville = UTC+1
function toBrazzaDate(isoStr) {
  if (!isoStr) return '';
  return new Date(new Date(isoStr).getTime() + OFFSET_MS_BRAZZA).toISOString().split('T')[0];
}

// ════════════════════════════════
//  COLIS — chargé une fois, filtré par la période active de Finance
// ════════════════════════════════
let colisListeFin  = [];
let colisFinLoaded = false;

async function ensureColisFinLoaded() {
  if (colisFinLoaded) return;
  try {
    const res  = await apiFetch(`${BACKEND}/colis/agence?agenceId=${agenceData.id}`, { method: 'GET' });
    const data = await res.json();
    if (res.ok) colisListeFin = data.colis || [];
    colisFinLoaded = true;
  } catch (err) {
    console.error('Erreur chargement colis (finances) :', err);
    colisFinLoaded = true;
  }
}

function calculerColisStats() {
  const filtrerColis = (liste, debut, fin) => liste.filter(c => {
    const d = toBrazzaDate(c.createdAt);
    if (debut && d < debut) return false;
    if (fin   && d > fin)   return false;
    if (finFiltrePdv    && c.pdvId    !== finFiltrePdv)    return false;
    if (finFiltreTrajet && c.trajetId !== finFiltreTrajet) return false;
    if (finFiltreBus    && c.busNom   !== finFiltreBus)    return false;
    if (finFiltreVille) {
      const pdv = pdvList.find(p => p.id === c.pdvId);
      if ((pdv?.ville || '') !== finFiltreVille) return false;
    }
    return true;
  });

  const { debut, fin } = getBornesEffectives();
  const colisPeriode = filtrerColis(colisListeFin, debut, fin);

  const { debut: pDebut, fin: pFin } = getBornesPeriodePrecedente(finPeriode, debut, fin);
  const colisPrecedent = (pDebut && pFin) ? filtrerColis(colisListeFin, pDebut, pFin) : [];

  const revenuColis     = colisPeriode.reduce((s, c) => s + Number(c.prixTransport || 0), 0);
  const revenuColisPrec = colisPrecedent.reduce((s, c) => s + Number(c.prixTransport || 0), 0);
  const total     = colisPeriode.length;
  const enTransit = colisPeriode.filter(c => c.statut === 'en_transit').length;
  const arrive    = colisPeriode.filter(c => c.statut === 'arrive').length;
  const retire    = colisPeriode.filter(c => c.statut === 'retire').length;
  const prixMoyenColis = total > 0 ? Math.round(revenuColis / total) : 0;

  return { revenuColis, revenuColisPrec, total, enTransit, arrive, retire, prixMoyenColis };
}

function _renderFinanceColis() {
  const container = document.getElementById('finColisStats');
  if (!container) return;

  const fmt = n => n >= 1_000_000
    ? (n/1_000_000).toFixed(1).replace(/\.0$/,'') + 'M XAF'
    : n >= 1_000 ? Math.round(n/1_000) + 'k XAF'
    : n.toLocaleString() + ' XAF';

  const { revenuColis, revenuColisPrec, total, enTransit, arrive, retire, prixMoyenColis } = calculerColisStats();

  let deltaHTML = `<span style="color:var(--muted);font-size:11px;">— pas encore de données à comparer</span>`;
  if (revenuColisPrec > 0) {
    const pct     = Math.round((revenuColis - revenuColisPrec) / revenuColisPrec * 100);
    const couleur = pct >= 0 ? 'var(--accent)' : '#FF4D6A';
    const fleche  = pct >= 0 ? '↑' : '↓';
    const signe   = pct >= 0 ? '+' : '';
    deltaHTML = `<span style="color:${couleur};font-size:11px;">${fleche} ${signe}${pct}% vs période précédente</span>`;
  } else if (revenuColis > 0) {
    deltaHTML = `<span style="color:var(--accent);font-size:11px;">Nouveau — rien sur la période précédente</span>`;
  }

  container.innerHTML = `
    <div class="stat-card">
      <div class="stat-card-header">
        <span class="stat-label">Revenu colis</span>
        <div class="stat-icon green">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="11" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M1 7h14" stroke="currentColor" stroke-width="1.5"/><path d="M5 11h2M9 11h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </div>
      </div>
      <div class="stat-value">${fmt(revenuColis)}</div>
      <div class="stat-delta">${deltaHTML}</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-header"><span class="stat-label">Total colis</span></div>
      <div class="stat-value">${total}</div>
      <div class="stat-delta">Prix moyen : ${fmt(prixMoyenColis)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-header"><span class="stat-label">En transit</span></div>
      <div class="stat-value">${enTransit}</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-header"><span class="stat-label">Arrivés</span></div>
      <div class="stat-value">${arrive}</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-header"><span class="stat-label">Retirés</span></div>
      <div class="stat-value">${retire}</div>
    </div>
  `;
}

function _renderFinanceColisDow() {
  const container = document.getElementById('finColisDow');
  if (!container) return;

  const filtrerColis = (liste, debut, fin) => liste.filter(c => {
    const d = toBrazzaDate(c.createdAt);
    if (debut && d < debut) return false;
    if (fin   && d > fin)   return false;
    if (finFiltrePdv    && c.pdvId    !== finFiltrePdv)    return false;
    if (finFiltreTrajet && c.trajetId !== finFiltreTrajet) return false;
    if (finFiltreBus    && c.busNom   !== finFiltreBus)    return false;
    if (finFiltreVille) {
      const pdv = pdvList.find(p => p.id === c.pdvId);
      if ((pdv?.ville || '') !== finFiltreVille) return false;
    }
    return true;
  });

  const { debut, fin } = getBornesEffectives();
  const colisPeriode = filtrerColis(colisListeFin, debut, fin);

  if (colisPeriode.length === 0) {
    container.innerHTML = '';
    return;
  }

  const JOURS_SEMAINE = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
  const ORDRE_JOURS   = [1,2,3,4,5,6,0];
  const dowCA = Array(7).fill(0);
  colisPeriode.forEach(c => {
    if (!c.createdAt) return;
    const dow = new Date(toBrazzaDate(c.createdAt)+'T00:00:00').getDay();
    dowCA[dow] += Number(c.prixTransport || 0);
  });
  const maxDow  = Math.max(...dowCA, 1);
  const bestDow = dowCA.indexOf(Math.max(...dowCA));

  container.innerHTML = `
    <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px;">
      Quel jour expédie-t-on le plus de colis ?
    </div>
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
            <div style="font-size:11px;color:var(--muted);">${JOURS_SEMAINE[pos]}</div>
            <div style="font-size:10px;color:var(--muted);opacity:.7;">${dowCA[i]>0?Math.round(dowCA[i]/1000)+'k':'-'}</div>
          </div>`;
      }).join('')}
    </div>
    ${dowCA[bestDow] > 0 ? `
    <div style="font-size:12px;color:var(--muted);">
      Vos meilleures expéditions de colis ont lieu le <strong style="color:var(--white);">${JOURS_SEMAINE[ORDRE_JOURS.indexOf(bestDow)]}</strong>.
    </div>` : ''}`;
}

function _renderFinanceColisEvolution() {
  const container = document.getElementById('finColisEvolution');
  const titleEl   = document.getElementById('finColisEvolutionTitle');
  if (!container) return;

  const fmt = n => n >= 1_000_000
    ? (n/1_000_000).toFixed(1).replace(/\.0$/,'') + 'M XAF'
    : n >= 1_000 ? Math.round(n/1_000) + 'k XAF'
    : n.toLocaleString() + ' XAF';

  const passeFiltresColis = (c) => {
    if (finFiltrePdv    && c.pdvId    !== finFiltrePdv)    return false;
    if (finFiltreTrajet && c.trajetId !== finFiltreTrajet) return false;
    if (finFiltreBus    && c.busNom   !== finFiltreBus)    return false;
    if (finFiltreVille) {
      const pdv = pdvList.find(p => p.id === c.pdvId);
      if ((pdv?.ville || '') !== finFiltreVille) return false;
    }
    return true;
  };

  const periode = finPeriode;
  let cols = [];

  if (finCustomRange) {
    const dDebut = new Date(finCustomRange.debut + 'T00:00:00Z');
    const dFin   = new Date(finCustomRange.fin + 'T00:00:00Z');
    const nbJoursRange = Math.round((dFin - dDebut) / 86400000) + 1;

    if (nbJoursRange <= 31) {
      for (let i = 0; i < nbJoursRange; i++) {
        const d   = new Date(dDebut.getTime() + i * 86400000);
        const str = d.toISOString().split('T')[0];
        const val = colisListeFin.filter(c =>
          passeFiltresColis(c) && toBrazzaDate(c.createdAt) === str
        ).reduce((s, c) => s + Number(c.prixTransport || 0), 0);
        cols.push({ label: `${d.getUTCDate()}/${d.getUTCMonth()+1}`, val });
      }
    } else {
      const moisNoms = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
      let curseur = new Date(Date.UTC(dDebut.getUTCFullYear(), dDebut.getUTCMonth(), 1));
      while (curseur <= dFin) {
        const moisStr = curseur.toISOString().slice(0, 7);
        const val = colisListeFin.filter(c =>
          passeFiltresColis(c) && toBrazzaDate(c.createdAt).startsWith(moisStr)
        ).reduce((s, c) => s + Number(c.prixTransport || 0), 0);
        cols.push({ label: `${moisNoms[curseur.getUTCMonth()]} ${curseur.getUTCFullYear()}`, val });
        curseur = new Date(Date.UTC(curseur.getUTCFullYear(), curseur.getUTCMonth() + 1, 1));
      }
    }
    if (titleEl) titleEl.textContent = 'Expéditions sur la période sélectionnée';

  } else if (periode === 'today') {
    const today  = new Date(Date.now() + OFFSET_MS_BRAZZA).toISOString().split('T')[0];
    const heures = [6, 8, 10, 12, 14, 16, 18, 20];
    cols = heures.map(h => {
      const val = colisListeFin.filter(c => {
        if (!passeFiltresColis(c)) return false;
        if (!c.createdAt) return false;
        const heureBrazza = new Date(new Date(c.createdAt).getTime() + OFFSET_MS_BRAZZA).getUTCHours();
        return toBrazzaDate(c.createdAt) === today && heureBrazza >= h && heureBrazza < h + 2;
      }).reduce((s, c) => s + Number(c.prixTransport || 0), 0);
      return { label: `${h}h`, val };
    });
    if (titleEl) titleEl.textContent = "Expéditions d'aujourd'hui par heure";

  } else if (periode === 'week') {
    const joursNoms = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
    const { debut: lundiStr, fin: aujourdHui } = getBornesEffectives();
    const lundiDate = new Date(lundiStr + 'T00:00:00Z');
    for (let i = 0; i < 7; i++) {
      const dStr = new Date(lundiDate.getTime() + i * 86400000).toISOString().split('T')[0];
      const val = colisListeFin.filter(c =>
        passeFiltresColis(c) && toBrazzaDate(c.createdAt) === dStr
      ).reduce((s, c) => s + Number(c.prixTransport || 0), 0);
      cols.push({ label: joursNoms[i], val });
      if (dStr === aujourdHui) break;
    }
    if (titleEl) titleEl.textContent = "Expéditions de la semaine (lundi → aujourd'hui)";

  } else if (periode === 'month') {
    const month = new Date(Date.now() + OFFSET_MS_BRAZZA).toISOString().slice(0, 7);
    for (let w = 0; w < 4; w++) {
      const debut = w * 7 + 1;
      const fin   = Math.min((w + 1) * 7, 31);
      const val = colisListeFin.filter(c => {
        if (!passeFiltresColis(c)) return false;
        const dBrazza = toBrazzaDate(c.createdAt);
        if (!dBrazza.startsWith(month)) return false;
        const jour = Number(dBrazza.slice(8, 10));
        return jour >= debut && jour <= fin;
      }).reduce((s, c) => s + Number(c.prixTransport || 0), 0);
      cols.push({ label: `S${w + 1}`, val });
    }
    if (titleEl) titleEl.textContent = 'Expéditions par semaine ce mois';

  } else {
    const moisNoms = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.now() + OFFSET_MS_BRAZZA);
      d.setUTCMonth(d.getUTCMonth() - i);
      const str = d.toISOString().slice(0, 7);
      const val = colisListeFin.filter(c =>
        passeFiltresColis(c) && toBrazzaDate(c.createdAt).startsWith(str)
      ).reduce((s, c) => s + Number(c.prixTransport || 0), 0);
      cols.push({ label: moisNoms[d.getUTCMonth()], val });
    }
    if (titleEl) titleEl.textContent = 'Expéditions des 6 derniers mois';
  }

  const max = Math.max(...cols.map(c => c.val), 1);

  container.innerHTML = `
    <div style="display:flex;align-items:flex-end;gap:6px;height:90px;padding:0 2px;">
        ${cols.map(c => {
        const h = Math.max(4, Math.round((c.val / max) * 90));
        return `
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:4px;min-width:0;height:100%;">
            <div title="${c.label} — ${fmt(c.val)}"
                style="width:100%;background:var(--primary);border-radius:3px 3px 0 0;
                height:${h}%;min-height:4px;opacity:.85;transition:opacity .15s;"
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

export async function getFinColisDonneesRapport() {
  await ensureColisFinLoaded();
  return calculerColisStats();
}

function buildStatsUrl(pdvId) {
  const { debut, fin } = getBornesEffectives();

  let url = `${BACKEND}/pdv/${pdvId}/stats?agenceId=${agenceData.id}`;

  if (debut && fin) {
    url += `&dateDebut=${debut}&dateFin=${fin}`;
  }

  if (finFiltreTrajet) {
    url += `&trajetId=${finFiltreTrajet}`;
  }

  return url;
}

// ════════════════════════════════
//  ÉTAT LOCAL
// ════════════════════════════════
let finPeriode = 'week';
let finFiltrePdv     = '';
let finFiltreTrajet  = '';
let finFiltreStatut  = 'toutes';
let finFiltreRetrait = false;
let finFiltreVille   = '';
let finFiltreBus     = '';
let finCustomRange = null; // null si inactif

// ════════════════════════════════
//  FILTRE PÉRIODE
// ════════════════════════════════
export function setFinPeriode(periode, btn) {
  finPeriode = periode;
  finCustomRange = null;
  const wrap = document.getElementById('finCustomPickerWrap');
  if (wrap) wrap.style.display = 'none';
  document.querySelectorAll('#finPeriodeFilters .rqf-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderFinancePage();
  updateFinPeriodeLabel();
}

export function toggleFinCustomPicker() {
  const wrap = document.getElementById('finCustomPickerWrap');
  if (!wrap) return;
  const isVisible = wrap.style.display === 'block';
  wrap.style.display = isVisible ? 'none' : 'block';
}

export function applyFinCustomRange() {
  const debut = document.getElementById('finCustomDebut')?.value;
  const fin   = document.getElementById('finCustomFin')?.value;
  if (!debut || !fin) { showToast('Sélectionnez les deux dates.', TOAST_ICONS.warning); return; }
  if (debut > fin) { showToast('La date de début doit précéder la date de fin.', TOAST_ICONS.warning); return; }

  finCustomRange = { debut, fin };
  document.querySelectorAll('#finPeriodeFilters .rqf-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('finCustomBtn')?.classList.add('active');
  document.getElementById('finCustomPickerWrap').style.display = 'none';
  renderFinancePage();
  updateFinPeriodeLabel();
}

export function clearFinCustomRange() {
  finCustomRange = null;
  document.getElementById('finCustomPickerWrap').style.display = 'none';
  document.getElementById('finCustomBtn')?.classList.remove('active');
  // Revenir à "Semaine" par défaut
  finPeriode = 'week';
  document.querySelectorAll('#finPeriodeFilters .rqf-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('#finPeriodeFilters .rqf-btn:nth-child(2)')?.classList.add('active');
  renderFinancePage();
  updateFinPeriodeLabel();
}

function updateFinPeriodeLabel() {
  const el = document.getElementById('finPeriodeLabel');
  if (!el) return;

  const iconCal = '<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M5 1v4M11 1v4M2 7h12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

  const fmtLong  = (str) => new Date(str + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const fmtShort = (str) => new Date(str + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

  if (finCustomRange) {
    const d = fmtLong(finCustomRange.debut);
    const f = fmtLong(finCustomRange.fin);
    el.innerHTML = finCustomRange.debut === finCustomRange.fin
      ? `${iconCal} ${d}`
      : `${iconCal} Du ${d} au ${f}`;
    return;
  }

  const { debut, fin } = getBornesEffectives();

  if (finPeriode === 'today') {
    el.innerHTML = `${iconCal} Aujourd'hui · ${fmtLong(debut)}`;
  } else if (finPeriode === 'week') {
    el.innerHTML = `${iconCal} Cette semaine · Du ${fmtShort(debut)} au ${fmtLong(fin)}`;
  } else if (finPeriode === 'month') {
    el.innerHTML = `${iconCal} Ce mois-ci · Du ${fmtShort(debut)} au ${fmtLong(fin)}`;
  } else {
    el.innerHTML = `${iconCal} Toutes les périodes`;
  }
}

// Retourne { debut, fin } (strings YYYY-MM-DD) selon finCustomRange ou finPeriode
function getBornesEffectives() {
  if (finCustomRange) return { debut: finCustomRange.debut, fin: finCustomRange.fin };

  const nowBrazza  = Date.now() + OFFSET_MS_BRAZZA;
  const todayDate  = new Date(nowBrazza);
  const today      = todayDate.toISOString().split('T')[0];

  if (finPeriode === 'today') return { debut: today, fin: today };

  if (finPeriode === 'week') {
    // Lundi de la semaine en cours -> aujourd'hui
    const jourSemaine = (todayDate.getUTCDay() + 6) % 7; // 0 = lundi
    const lundi = new Date(todayDate.getTime() - jourSemaine * 86400000);
    return { debut: lundi.toISOString().split('T')[0], fin: today };
  }

  if (finPeriode === 'month') {
    // 1er jour du mois en cours -> aujourd'hui
    const premierJour = new Date(Date.UTC(todayDate.getUTCFullYear(), todayDate.getUTCMonth(), 1));
    return { debut: premierJour.toISOString().split('T')[0], fin: today };
  }

  return { debut: null, fin: null }; // 'all'
}

function getResasParPeriodeSiege(periode, statutFilter = 'confirmées') {
  const { debut, fin } = getBornesEffectives();

  return resaList.filter(r => {
    if (statutFilter === 'confirmées' && r.statut === 'annulée') return false;
    if (statutFilter === 'annulées'   && r.statut !== 'annulée') return false;
    const d = toBrazzaDate(r.createdAt);
    if (debut && d < debut) return false;
    if (fin   && d > fin)   return false;
    return true;
  });
}

// ════════════════════════════════
//  FILTRES AVANCÉS
// ════════════════════════════════
function finPasseFiltreSansStatut(r) {
  if (finFiltrePdv    && r.pdvId    !== finFiltrePdv)    return false;
  if (finFiltreTrajet && r.trajetId !== finFiltreTrajet) return false;
  if (finFiltreRetrait && !r.passagerRetire) return false;
  if (finFiltreBus     && r.busNom  !== finFiltreBus)    return false;
  if (finFiltreVille) {
    const pdvResa   = pdvList.find(p => p.id === r.pdvId);
    const villeResa = r.pdvEmbarquementVille || pdvResa?.ville || '';
    if (villeResa !== finFiltreVille) return false;
  }
  return true;
}

function finPasseFiltre(r) {
  if (!finPasseFiltreSansStatut(r)) return false;
  if (finFiltreStatut === 'confirmées' && r.statut === 'annulée') return false;
  if (finFiltreStatut === 'annulées'   && r.statut !== 'annulée') return false;
  return true;
}

function applyFinFiltresExtra(list) {
  return list.filter(finPasseFiltre);
}

function getTypeTrajetLabelFin(t) {
  return (t.typeTrajet === 'arrets') ? '· Avec arrêts' : '· Direct';
}

// ════════════════════════════════
//  FILTRES — CASCADE (identique à reservations.js)
// ════════════════════════════════
function updateFinFiltreHighlight(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('filtre-actif', !!el.value);
}

function populateFinPdvSelectCascade(ville) {
  const pdvSelect = document.getElementById('finFiltrePdv');
  if (!pdvSelect) return;
  const pdvsFiltres = ville ? pdvList.filter(p => p.ville === ville) : pdvList;
  pdvSelect.innerHTML = `<option value="">Tous les PDV</option>` +
    pdvsFiltres.map(p => `<option value="${p.id}">${p.nom}</option>`).join('');
}

function populateFinTrajetSelectCascade(pdvId, ville) {
  const trajetSelect = document.getElementById('finFiltreTrajet');
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
    trajetsFiltres.map(t => `<option value="${t.id}">${t.villeDepart} → ${t.villeArrivee} ${getTypeTrajetLabelFin(t)}</option>`).join('');
}

async function populateFinBusSelectCascade(trajetId) {
  const busSelect = document.getElementById('finFiltreBus');
  if (!busSelect) return;
  busSelect.innerHTML = `<option value="">Tous les bus</option>`;

  try {
    const departs = trajetId
      ? await loadDeparts(trajetId)           // utilise le cache par trajet
      : await loadAllDeparts(agenceData.id);  // utilise le cache global agence

    const busNoms = [...new Set(departs.map(d => d.busNom).filter(Boolean))].sort();
    busSelect.innerHTML = `<option value="">Tous les bus</option>` +
      busNoms.map(nom => `<option value="${nom}">${nom}</option>`).join('');
  } catch (err) {
    console.error('Erreur chargement bus filtre finances :', err);
  }
}

function onFinVilleFiltreChange() {
  const ville = document.getElementById('finFiltreVille')?.value || '';
  finFiltreVille = ville;

  document.getElementById('finFiltrePdv').value    = '';
  document.getElementById('finFiltreTrajet').value = '';
  document.getElementById('finFiltreBus').value    = '';
  finFiltrePdv = ''; finFiltreTrajet = ''; finFiltreBus = '';

  populateFinPdvSelectCascade(ville);
  populateFinTrajetSelectCascade('', ville);
  populateFinBusSelectCascade('');

  ['finFiltreVille','finFiltrePdv','finFiltreTrajet','finFiltreBus'].forEach(updateFinFiltreHighlight);
  renderFinancePage();
}

function onFinPdvFiltreChange() {
  const pdvId = document.getElementById('finFiltrePdv')?.value || '';
  const ville = document.getElementById('finFiltreVille')?.value || '';
  finFiltrePdv = pdvId;

  document.getElementById('finFiltreTrajet').value = '';
  document.getElementById('finFiltreBus').value    = '';
  finFiltreTrajet = ''; finFiltreBus = '';

  populateFinTrajetSelectCascade(pdvId, ville);
  populateFinBusSelectCascade('');

  ['finFiltrePdv','finFiltreTrajet','finFiltreBus'].forEach(updateFinFiltreHighlight);
  renderFinancePage();
}

function onFinTrajetFiltreChange() {
  const trajetId = document.getElementById('finFiltreTrajet')?.value || '';
  finFiltreTrajet = trajetId;

  document.getElementById('finFiltreBus').value = '';
  finFiltreBus = '';

  populateFinBusSelectCascade(trajetId);

  ['finFiltreTrajet','finFiltreBus'].forEach(updateFinFiltreHighlight);
  renderFinancePage();
}

function populateFinFiltres() {
  const selPdv    = document.getElementById('finFiltrePdv');
  const selTrajet = document.getElementById('finFiltreTrajet');
  const selVille  = document.getElementById('finFiltreVille');
  const selBus    = document.getElementById('finFiltreBus');
  if (!selPdv || !selTrajet) return;

  if (!selPdv.dataset.bound) {
    if (selVille) {
      const villes = [...new Set(pdvList.map(p => p.ville).filter(Boolean))].sort();
      selVille.innerHTML = `<option value="">Toutes les villes</option>` +
        villes.map(v => `<option value="${v}">${v}</option>`).join('');
    }

    populateFinPdvSelectCascade('');
    populateFinTrajetSelectCascade('', '');
    populateFinBusSelectCascade('');

    selVille?.addEventListener('change', onFinVilleFiltreChange);
    selPdv.addEventListener('change', onFinPdvFiltreChange);
    selTrajet.addEventListener('change', onFinTrajetFiltreChange);
    selBus?.addEventListener('change', () => {
      finFiltreBus = selBus.value;
      updateFinFiltreHighlight('finFiltreBus');
      renderFinancePage();
    });
    document.getElementById('finFiltreStatut')?.addEventListener('change', e => {
      finFiltreStatut = e.target.value;
      e.target.classList.toggle('filtre-actif', e.target.value !== 'toutes');
      renderFinancePage();
    });
    document.getElementById('finFiltreRetrait')?.addEventListener('change', e => {
      finFiltreRetrait = e.target.checked;
      renderFinancePage();
    });

    selPdv.dataset.bound = '1';
  }
}

export function resetFinFiltres() {
  finFiltrePdv = ''; finFiltreTrajet = ''; finFiltreStatut = 'toutes'; finFiltreRetrait = false;
  finFiltreVille = ''; finFiltreBus = '';

  const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
  setVal('finFiltreVille', '');
  setVal('finFiltreStatut', 'toutes');
  const chk = document.getElementById('finFiltreRetrait'); if (chk) chk.checked = false;

  populateFinPdvSelectCascade('');
  populateFinTrajetSelectCascade('', '');
  populateFinBusSelectCascade('');

  ['finFiltreVille','finFiltrePdv','finFiltreTrajet','finFiltreBus'].forEach(updateFinFiltreHighlight);
  document.getElementById('finFiltreStatut')?.classList.remove('filtre-actif');

  renderFinancePage();
}
window.resetFinFiltres = resetFinFiltres;

// ════════════════════════════════
//  DONNÉES POUR LE RAPPORT (réutilisées par reports.js)
// ════════════════════════════════
export function getFinFiltresActifs() {
  const pdv    = pdvList.find(p => p.id === finFiltrePdv);
  const trajet = trajetList.find(t => t.id === finFiltreTrajet);
  return {
    ville:   finFiltreVille || 'Toutes les villes',
    pdv:     pdv?.nom || 'Tous les PDV',
    trajet:  trajet ? `${trajet.villeDepart} → ${trajet.villeArrivee}` : 'Tous les trajets',
    bus:     finFiltreBus || 'Tous les bus',
    statut:  finFiltreStatut === 'confirmées' ? 'Confirmées' : finFiltreStatut === 'annulées' ? 'Annulées' : 'Toutes ventes',
    periode: getFinPeriodeLabelTexte(),
  };
}

export function getFinResasPeriode() {
  const resas = getResasParPeriodeSiege(finPeriode, 'toutes');
  return applyFinFiltresExtra(resas);
}

export function getFinPeriodeLabelTexte() {
  const fmtLong  = (str) => new Date(str + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const fmtShort = (str) => new Date(str + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

  if (finCustomRange) {
    const d = fmtLong(finCustomRange.debut);
    const f = fmtLong(finCustomRange.fin);
    return finCustomRange.debut === finCustomRange.fin ? `la journée du ${d}` : `la période du ${d} au ${f}`;
  }
  const { debut, fin } = getBornesEffectives();
  if (finPeriode === 'today') return `aujourd'hui (${fmtLong(debut)})`;
  if (finPeriode === 'week')  return `cette semaine (du ${fmtShort(debut)} au ${fmtLong(fin)})`;
  if (finPeriode === 'month') return `ce mois-ci (du ${fmtShort(debut)} au ${fmtLong(fin)})`;
  return 'toutes les périodes';
}

// ════════════════════════════════
//  DONNÉES COMPLÈTES POUR LE RAPPORT PDF (KPIs + impact + classements)
// ════════════════════════════════
export function getFinDonneesRapport() {
  const resas    = getFinResasPeriode();
  const conf     = resas.filter(r => r.statut !== 'annulée');
  const annulees = resas.filter(r => r.statut === 'annulée');

  const CA        = conf.reduce((s, r) => s + (r.prixTotal || 0), 0);
  const billets    = conf.reduce((s, r) => s + (r.nbPassagers || 1), 0);
  const prixMoyen = billets > 0 ? Math.round(CA / billets) : 0;
  const tauxAnnul = resas.length > 0 ? Math.round((annulees.length / resas.length) * 100) : 0;

  const maintenant = Date.now();
  const dejaTransportes = conf.filter(r => {
    if (!r.dateDepart) return false;
    const departInstant = new Date(`${r.dateDepart}T${r.heureDepart || '23:59'}:00Z`).getTime() - OFFSET_MS_BRAZZA;
    return departInstant < maintenant;
  });
  const totalDejaTransportes = dejaTransportes.reduce((s, r) => s + (r.nbPassagers || 1), 0);
  const totalRetraits = resas.reduce((s, r) => s + (r.historiqueRetraits?.length || 0), 0);

  // ── Impact sur les revenus (annulations / modifs / retraits) ──
  const { debut: impDebut, fin: impFin } = getBornesEffectives();
  const dansPeriode = (dateStr) => {
    if (!dateStr) return false;
    const d = toBrazzaDate(dateStr);
    if (impDebut && d < impDebut) return false;
    if (impFin   && d > impFin)   return false;
    return true;
  };
  const base = resaList.filter(finPasseFiltreSansStatut);

  const annuleesImpact  = base.filter(r => r.statut === 'annulée' && dansPeriode(r.annuleeAt || r.createdAt));
  const totalAnnule     = annuleesImpact.reduce((s, r) => s + (r.prixTotal || 0), 0);
  const totalFraisAnnul = annuleesImpact.reduce((s, r) => s + (r.fraisRetenus || 0), 0);

  const modifs      = base.filter(r => r.modifiee === true && r.ecartMontant > 0 && dansPeriode(r.dateModification));
  const totalBaisse = modifs.reduce((s, r) => s + (r.ecartMontant || 0), 0);

  let totalRetraitMontant = 0, totalFraisRetrait = 0, nbPassRetires = 0;
  base.filter(r => r.passagerRetire === true).forEach(r => {
    (r.historiqueRetraits || []).forEach(h => {
      if (dansPeriode(h.retireAt)) {
        totalRetraitMontant += (h.montantRembourse || 0);
        totalFraisRetrait   += (h.fraisRetenus || 0);
        nbPassRetires       += 1;
      }
    });
  });

  const totalGarde = totalFraisAnnul + totalFraisRetrait;
  const totalPerdu = annuleesImpact.reduce((s, r) => s + (r.montantRembourse || 0), 0) + totalBaisse + totalRetraitMontant;

  // ── Classement PDV ──
  const pdvMap = {};
  conf.forEach(r => {
    if (!r.pdvId) return;
    const pdv = pdvList.find(p => p.id === r.pdvId);
    if (!pdvMap[r.pdvId]) pdvMap[r.pdvId] = { nom: pdv?.nom || '—', ville: pdv?.ville || '—', ca: 0, billets: 0, resas: 0 };
    pdvMap[r.pdvId].ca      += r.prixTotal || 0;
    pdvMap[r.pdvId].billets += r.nbPassagers || 1;
    pdvMap[r.pdvId].resas   += 1;
  });
  const pdvStats = Object.values(pdvMap).sort((a, b) => b.ca - a.ca);

  // ── Classement Trajets ──
  const trajetMap = {};
  conf.forEach(r => {
    if (!r.trajetId) return;
    const t = trajetList.find(t => t.id === r.trajetId);
    if (!trajetMap[r.trajetId]) trajetMap[r.trajetId] = { nom: t ? `${t.villeDepart} - ${t.villeArrivee}` : '—', ca: 0, billets: 0 };
    trajetMap[r.trajetId].ca      += r.prixTotal || 0;
    trajetMap[r.trajetId].billets += r.nbPassagers || 1;
  });
  const trajetStats = Object.values(trajetMap).sort((a, b) => b.ca - a.ca);

  // ── Meilleur jour de la semaine ──
  const JOURS_SEMAINE_FR = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
  const dowCA = Array(7).fill(0);
  conf.forEach(r => {
    if (!r.createdAt) return;
    const dow = new Date(toBrazzaDate(r.createdAt) + 'T00:00:00').getDay();
    dowCA[dow] += r.prixTotal || 0;
  });
  const bestDowIdx  = dowCA.indexOf(Math.max(...dowCA));
  const meilleurJour = dowCA[bestDowIdx] > 0 ? JOURS_SEMAINE_FR[bestDowIdx] : null;

  return {
    total: resas.length, confirmees: conf.length, annulees: annulees.length, tauxAnnul,
    CA, billets, prixMoyen, totalDejaTransportes, totalRetraits,
    impact: {
      totalAnnule, totalFraisAnnul, nbAnnulees: annuleesImpact.length,
      totalBaisse, nbModifs: modifs.length,
      totalRetraitMontant, totalFraisRetrait, nbPassRetires,
      totalGarde, totalPerdu,
    },
    pdvStats, trajetStats, meilleurJour,
  };
}

// ════════════════════════════════
//  RENDU PRINCIPAL
// ════════════════════════════════
export function renderFinancePage() {
  populateFinFiltres();
  updateFinPeriodeLabel();

  const periode = finPeriode;
  let resas = getResasParPeriodeSiege(periode, 'toutes');
  resas = applyFinFiltresExtra(resas);

  const { debut: bDebut, fin: bFin } = getBornesEffectives();
  const { debut: pDebut, fin: pFin } = getBornesPeriodePrecedente(finPeriode, bDebut, bFin);
  let resasPrev = [];
  if (pDebut && pFin) {
    resasPrev = resaList.filter(r =>
      toBrazzaDate(r.createdAt) >= pDebut &&
      toBrazzaDate(r.createdAt) <= pFin
    );
    resasPrev = applyFinFiltresExtra(resasPrev);
  }

  const conf     = resas.filter(r => r.statut !== 'annulée');
  const confPrev = resasPrev.filter(r => r.statut !== 'annulée');
  const annulees = resas.filter(r => r.statut === 'annulée');

  const CA      = conf.reduce((s,r) => s + (r.prixTotal||0), 0);
  const CAprev  = confPrev.reduce((s,r) => s + (r.prixTotal||0), 0);
  const billetsAnnules     = annulees.reduce((s,r) => s + (r.nbPassagers||1), 0);
  const billetsAnnulesPrev = resasPrev.filter(r => r.statut === 'annulée').reduce((s,r) => s + (r.nbPassagers||1), 0);
  const billets = conf.reduce((s,r) => s + (r.nbPassagers||1), 0) + billetsAnnules;
  const bilPrev = confPrev.reduce((s,r) => s + (r.nbPassagers||1), 0) + billetsAnnulesPrev;

  const nbResa     = resas.length;
  const nbResaPrev = resasPrev.length;
  const moy     = billets > 0 ? Math.round(CA / billets) : 0;
  const moyPrev = bilPrev > 0 ? Math.round(CAprev / bilPrev) : 0;
  const tauxA   = resas.length > 0 ? Math.round(annulees.length / resas.length * 100) : 0;
  const tauxAPrev = resasPrev.length > 0
    ? Math.round(resasPrev.filter(r=>r.statut==='annulée').length / resasPrev.length * 100)
    : 0;

  const fmt = n => n >= 1_000_000
    ? (n/1_000_000).toFixed(1).replace(/\.0$/,'') + 'M XAF'
    : n >= 1_000 ? Math.round(n/1_000) + 'k XAF'
    : n.toLocaleString() + ' XAF';

  const cmpHtml = (val, prev, inverse = false) => {
    if (prev === 0) return `<span style="color:var(--muted);font-size:11px;">— pas encore de données à comparer</span>`;
    const pct     = Math.round((val - prev) / prev * 100);
    const bon     = inverse ? pct <= 0 : pct >= 0;
    const couleur = bon ? 'var(--accent)' : '#FF4D6A';
    const fleche  = pct >= 0 ? '↑' : '↓';
    const signe   = pct >= 0 ? '+' : '';
    return `<span style="color:${couleur};font-size:11px;">${fleche} ${signe}${pct}% vs période précédente</span>`;
  };

  const setEl = (id, v) => { const el = document.getElementById(id); if (el) el.innerHTML = v; };

  setEl('finCA',          fmt(CA));
  setEl('finCAInfo',      cmpHtml(CA, CAprev));
  setEl('finBillets', billets.toLocaleString());
  setEl('finBilletsInfo', cmpHtml(billets, bilPrev) +
    (billetsAnnules > 0 ? ` <span style="color:#FF4D6A;font-weight:600;">· dont ${billetsAnnules} annulé${billetsAnnules > 1 ? 's' : ''}</span>` : ''));
  
  setEl('finMoyBillet',   fmt(moy));
  setEl('finMoyInfo',     cmpHtml(moy, moyPrev));
  setEl('finAnnul',       tauxA + '%');
  setEl('finAnnulInfo',   cmpHtml(tauxA, tauxAPrev, true));

  setEl('finResa', nbResa.toLocaleString());
  setEl('finResaInfo', cmpHtml(nbResa, nbResaPrev) +
    (annulees.length > 0 ? ` <span style="color:#FF4D6A;font-weight:600;">· dont ${annulees.length} annulée${annulees.length > 1 ? 's' : ''}</span>` : ''));

  renderFinanceChartSiege(periode, resas);
  _renderFinanceDow(conf);
  _renderFinanceTrophy(conf, fmt);
  _renderFinanceImpact(fmt);
  _renderFinancePdv(conf, fmt);
  _renderFinanceTrajets(conf, fmt);
  ensureColisFinLoaded().then(() => {
    _renderFinanceColis();
    _renderFinanceColisEvolution();
    _renderFinanceColisDow();
    const { revenuColis } = calculerColisStats();
    setEl('finRevenuColisOverview', fmt(revenuColis));
    setEl('finCATotal', fmt(CA + revenuColis));
  });
}

// ════════════════════════════════
//  GRAPHIQUE ÉVOLUTION
// ════════════════════════════════
function renderFinanceChartSiege(periode, resas) {
  const container = document.getElementById('finEvolution');
  const titleEl   = document.getElementById('finEvolutionTitle');
  if (!container) return;

  const fmt = n => n >= 1_000_000
    ? (n/1_000_000).toFixed(1).replace(/\.0$/,'') + 'M XAF'
    : n >= 1_000 ? Math.round(n/1_000) + 'k XAF'
    : n.toLocaleString() + ' XAF';

  let cols = [];

  if (finCustomRange) {
    const dDebut = new Date(finCustomRange.debut + 'T00:00:00Z');
    const dFin   = new Date(finCustomRange.fin + 'T00:00:00Z');
    const nbJoursRange = Math.round((dFin - dDebut) / 86400000) + 1;

    if (nbJoursRange <= 31) {
      // Vue jour par jour
      for (let i = 0; i < nbJoursRange; i++) {
        const d   = new Date(dDebut.getTime() + i * 86400000);
        const str = d.toISOString().split('T')[0];
        const val = resaList.filter(r =>
          r.statut !== 'annulée' && finPasseFiltreSansStatut(r) &&
          toBrazzaDate(r.createdAt) === str
        ).reduce((s, r) => s + (r.prixTotal || 0), 0);
        cols.push({ label: `${d.getUTCDate()}/${d.getUTCMonth()+1}`, val, date: str });
      }
    } else {
      // Vue mois par mois pour les grandes plages
      const moisNoms = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
      let curseur = new Date(Date.UTC(dDebut.getUTCFullYear(), dDebut.getUTCMonth(), 1));
      while (curseur <= dFin) {
        const moisStr = curseur.toISOString().slice(0, 7);
        const val = resaList.filter(r =>
          r.statut !== 'annulée' && finPasseFiltreSansStatut(r) &&
          toBrazzaDate(r.createdAt).startsWith(moisStr)
        ).reduce((s, r) => s + (r.prixTotal || 0), 0);
        cols.push({ label: `${moisNoms[curseur.getUTCMonth()]} ${curseur.getUTCFullYear()}`, val });
        curseur = new Date(Date.UTC(curseur.getUTCFullYear(), curseur.getUTCMonth() + 1, 1));
      }
    }
    if (titleEl) titleEl.textContent = 'Ventes sur la période sélectionnée';

  } else if (periode === 'today') {

    const today  = new Date(Date.now() + OFFSET_MS_BRAZZA).toISOString().split('T')[0];
    const heures = [6, 8, 10, 12, 14, 16, 18, 20];
    cols = heures.map(h => {
      const val = resaList.filter(r => {
        if (r.statut === 'annulée') return false;
        if (!finPasseFiltreSansStatut(r)) return false;
        if (!r.createdAt) return false;
        const heureBrazza = new Date(new Date(r.createdAt).getTime() + OFFSET_MS_BRAZZA).getUTCHours();
        return toBrazzaDate(r.createdAt) === today && heureBrazza >= h && heureBrazza < h + 2;
      }).reduce((s, r) => s + (r.prixTotal || 0), 0);
      return { label: `${h}h`, val };
    });
    if (titleEl) titleEl.textContent = "Activité d'aujourd'hui par heure";

  } else if (periode === 'week') {
    const joursNoms = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
    const { debut: lundiStr, fin: aujourdHui } = getBornesEffectives();
    const lundiDate = new Date(lundiStr + 'T00:00:00Z');
    for (let i = 0; i < 7; i++) {
      const dStr = new Date(lundiDate.getTime() + i * 86400000).toISOString().split('T')[0];
      const val = resaList.filter(r =>
        r.statut !== 'annulée' && finPasseFiltreSansStatut(r) && toBrazzaDate(r.createdAt) === dStr
      ).reduce((s, r) => s + (r.prixTotal || 0), 0);
      cols.push({ label: joursNoms[i], val, date: dStr });
      if (dStr === aujourdHui) break;
    }
    if (titleEl) titleEl.textContent = "Activité de la semaine (lundi → aujourd'hui)";

  } else if (periode === 'month') {
    const month = new Date(Date.now() + OFFSET_MS_BRAZZA).toISOString().slice(0, 7);
    for (let w = 0; w < 4; w++) {
      const debut = w * 7 + 1;
      const fin   = Math.min((w + 1) * 7, 31);
      const val = resaList.filter(r => {
        if (r.statut === 'annulée') return false;
        if (!finPasseFiltreSansStatut(r)) return false;   // ← ajout
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
      const d = new Date(Date.now() + OFFSET_MS_BRAZZA);
      d.setUTCMonth(d.getUTCMonth() - i);
      const str = d.toISOString().slice(0, 7);
      const val = resaList.filter(r =>
        r.statut !== 'annulée' && finPasseFiltreSansStatut(r) &&   // ← ajout
        toBrazzaDate(r.createdAt).startsWith(str)
      ).reduce((s, r) => s + (r.prixTotal || 0), 0);
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
            <div title="${c.label} — ${fmt(c.val)}"
                style="width:100%;background:var(--primary);border-radius:3px 3px 0 0;
                height:${h}%;min-height:4px;opacity:.85;${c.date ? 'cursor:pointer;' : 'cursor:default;'}transition:opacity .15s;"
                onmouseover="this.style.opacity=1;this.style.background='var(--accent)'"
                onmouseout="this.style.opacity='.85';this.style.background='var(--primary)'"
                ${c.date ? `onclick="openFinanceJourDetail('${c.date}')"` : ''}>
            </div>
            </div>`;
        }).join('')}
    </div>
    <div style="display:flex;justify-content:space-between;padding:5px 2px 0;font-size:10px;color:var(--muted);">
      ${cols.map(c => `<span>${c.label}</span>`).join('')}
    </div>`;
}

// ════════════════════════════════
//  JOUR DE LA SEMAINE
// ════════════════════════════════
function _renderFinanceDow(conf) {
  const JOURS_SEMAINE = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
  const ORDRE_JOURS   = [1,2,3,4,5,6,0]; // remappe getDay() (0=dim) vers un affichage qui commence lundi
  const dowCA = Array(7).fill(0);
  conf.forEach(r => {
    if (!r.createdAt) return;
    const dow = new Date(toBrazzaDate(r.createdAt)+'T00:00:00').getDay();
    dowCA[dow] += r.prixTotal||0;
  });
  const maxDow  = Math.max(...dowCA, 1);
  const bestDow = dowCA.indexOf(Math.max(...dowCA));

  const dowContainer = document.getElementById('finDow');
  if (!dowContainer) return;

  dowContainer.innerHTML = `
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
            <div style="font-size:11px;color:var(--muted);">${JOURS_SEMAINE[pos]}</div>
            <div style="font-size:10px;color:var(--muted);opacity:.7;">${dowCA[i]>0?Math.round(dowCA[i]/1000)+'k':'-'}</div>
          </div>`;
      }).join('')}
    </div>
    ${dowCA[bestDow] > 0 ? `
    <div style="font-size:12px;color:var(--muted);">
      Vos meilleures ventes ont lieu le <strong style="color:var(--white);">${JOURS_SEMAINE[ORDRE_JOURS.indexOf(bestDow)]}</strong>.
      Pensez à prévoir plus de bus ce jour-là pour maximiser vos revenus.
    </div>` : ''}`;
}

// ════════════════════════════════
//  IMPACT SUR LES REVENUS (annulations / modifs / retraits)
// ════════════════════════════════
function _renderFinanceImpact(fmt) {
  const container = document.getElementById('finImpact');
  if (!container) return;

  const { debut: impDebut, fin: impFin } = getBornesEffectives();

  const dansPeriode = (dateStr) => {
    if (!dateStr) return false;
    const d = toBrazzaDate(dateStr);
    if (impDebut && d < impDebut) return false;
    if (impFin   && d > impFin)   return false;
    return true;
  };

  // Base : ignore le filtre Statut (annulations/modifs sont pertinentes quel que soit ce filtre)
  const base = resaList.filter(finPasseFiltreSansStatut);

  // 1. Annulations
  const annulees = base.filter(r => r.statut === 'annulée' && dansPeriode(r.annuleeAt || r.createdAt));
  const totalAnnule      = annulees.reduce((s, r) => s + (r.prixTotal || 0), 0);
  const totalFraisAnnul  = annulees.reduce((s, r) => s + (r.fraisRetenus || 0), 0);
  const nbBilletsAnnules = annulees.reduce((s, r) => s + (r.nbPassagers || 1), 0);

  // 2. Modifications à la baisse
  const modifs = base.filter(r => r.modifiee === true && r.ecartMontant > 0 && dansPeriode(r.dateModification));
  const totalBaisse = modifs.reduce((s, r) => s + (r.ecartMontant || 0), 0);
  const nbModifs     = modifs.length;

  // 3. Retraits de passagers
  let totalRetrait = 0, totalFraisRetrait = 0, nbPassRetires = 0;
  base.filter(r => r.passagerRetire === true).forEach(r => {
    (r.historiqueRetraits || []).forEach(h => {
      if (dansPeriode(h.retireAt)) {
        totalRetrait      += (h.montantRembourse || 0);
        totalFraisRetrait += (h.fraisRetenus || 0);
        nbPassRetires     += 1;
      }
    });
  });

  const totalGarde  = totalFraisAnnul + totalFraisRetrait;
  const totalPerdu  = annulees.reduce((s, r) => s + (r.montantRembourse || 0), 0) + totalBaisse + totalRetrait;
  const totalImpact = totalAnnule + totalBaisse + totalRetrait + totalGarde;

  if (totalImpact === 0) {
    container.innerHTML = `<div style="text-align:center;padding:16px;color:var(--muted);font-size:12px;">Aucune perte de revenu détectée sur cette période.</div>`;
    return;
  }

  const card = (icon, label, montant, sousLabel, couleur = '#FF4D6A', bg = 'rgba(255,77,106,0.06)', border = 'rgba(255,77,106,0.18)') => `
    <div style="flex:1;min-width:150px;background:${bg};border:1px solid ${border};border-radius:12px;padding:14px 16px;">
      <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.6px;margin-bottom:6px;">${icon} ${label}</div>
      <div style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:${couleur};">${fmt(montant)}</div>
      <div style="font-size:11px;color:var(--muted);margin-top:2px;">${sousLabel}</div>
    </div>`;

  container.innerHTML = `
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px;">
      ${card(ICONS.banned, 'Annulations', totalAnnule, `${annulees.length} réservation${annulees.length>1?'s':''} · ${nbBilletsAnnules} passager${nbBilletsAnnules>1?'s':''}`)}
      ${card(ICONS.scissors, 'Modifications', totalBaisse, `${nbModifs} modification${nbModifs>1?'s':''} à la baisse`)}
      ${card(ICONS.person, 'Retraits passagers', totalRetrait, `${nbPassRetires} passager${nbPassRetires>1?'s':''} retiré${nbPassRetires>1?'s':''}`)}
      ${card(ICONS.money, 'Frais retenus', totalGarde, `Gardés sur annulations/retraits`, 'var(--accent)', 'rgba(0,229,160,0.06)', 'rgba(0,229,160,0.2)')}
    </div>
    <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted);border-top:1px solid var(--border);padding-top:10px;flex-wrap:wrap;gap:6px;">
      <span>Revenu net perdu : <strong style="color:#FF4D6A;">${fmt(totalPerdu)}</strong></span>
      <span>Dont récupéré en frais : <strong style="color:var(--accent);">${fmt(totalGarde)}</strong></span>
    </div>`;
}

// ════════════════════════════════
//  TROPHÉE MEILLEUR PDV
// ════════════════════════════════
function _renderFinanceTrophy(conf, fmt) {
  const pdvMapTrophy = {};
  conf.forEach(r => {
    if (!r.pdvId) return;
    const pdv = pdvList.find(p => p.id === r.pdvId);
    if (!pdvMapTrophy[r.pdvId]) pdvMapTrophy[r.pdvId] = { nom: pdv?.nom||'—', ca: 0 };
    pdvMapTrophy[r.pdvId].ca += r.prixTotal||0;
  });
  const bestPDV  = Object.values(pdvMapTrophy).sort((a,b) => b.ca - a.ca)[0];
  const trophyEl = document.getElementById('finTrophy');
  if (!trophyEl) return;

  if (!bestPDV || bestPDV.ca === 0) {
    trophyEl.style.display = 'none';
  } else {
    trophyEl.style.display = 'flex';
    trophyEl.innerHTML = `
      <span>${ICONS.trophy}</span>
      <div style="font-size:13px;color:var(--white);">
        Meilleur point de vente : <strong>${bestPDV.nom}</strong>
        &nbsp;<span style="color:var(--muted);">— ${fmt(bestPDV.ca)} générés sur la période</span>
      </div>`;
  }
}

let _financePdvTrajetsData = {};
let finPdvStatsCache = {};

// ════════════════════════════════
//  PDV PAR VILLE
// ════════════════════════════════

function getFinPdvStatsCacheKey(pdvId) {
  const { debut, fin } = getBornesEffectives();
  return `${pdvId}_${debut || 'all'}_${fin || 'all'}_${finFiltreTrajet}`;
}

async function loadFinPdvStats(pdvId, cacheKey) {
  if (finPdvStatsCache[cacheKey]) return finPdvStatsCache[cacheKey];
  const res = await apiFetch(buildStatsUrl(pdvId));
  const data = await res.json();
  finPdvStatsCache[cacheKey] = data;
  return data;
}

function _renderFinancePdv(conf, fmt) {
  const pdvMap = {};
  conf.forEach(r => {
    if (!r.pdvId) return;
    const pdv = pdvList.find(p => p.id === r.pdvId);
    if (!pdvMap[r.pdvId]) pdvMap[r.pdvId] = { id: r.pdvId, nom: pdv?.nom||'—', ville: pdv?.ville||'Autre', ca: 0, billets: 0, resas: 0 };
    pdvMap[r.pdvId].ca      += r.prixTotal||0;
    pdvMap[r.pdvId].billets += r.nbPassagers||1;
    pdvMap[r.pdvId].resas   += 1;
  });

  const pdvSorted = Object.values(pdvMap).sort((a,b) => b.ca - a.ca);
  const maxPdvCA  = pdvSorted[0]?.ca || 1;
  const ORDRE_VILLES = ['Brazzaville','Pointe-Noire','Dolisie','Nkayi','Impfondo','Ouesso','Owando','Madingou','Sibiti','Gamboma'];

  const pdvParVille = {};
  pdvSorted.forEach(p => {
    const v = p.ville||'Autre';
    if (!pdvParVille[v]) pdvParVille[v] = [];
    pdvParVille[v].push(p);
  });

  const villesTriees = Object.keys(pdvParVille).sort((a,b) => {
    const ia = ORDRE_VILLES.indexOf(a), ib = ORDRE_VILLES.indexOf(b);
    if (ia===-1&&ib===-1) return a.localeCompare(b);
    if (ia===-1) return 1; if (ib===-1) return -1;
    return ia - ib;
  });

  const pdvContainer = document.getElementById('finPdvList');
  if (!pdvContainer) return;

  if (!pdvSorted.length) {
    pdvContainer.innerHTML = `<div style="text-align:center;padding:20px;color:var(--muted);font-size:12px;">Aucune vente sur cette période.</div>`;
    return;
  }

  const labelTriPdv = `<div style="font-size:10.5px;color:var(--muted);font-style:italic;margin-bottom:6px;">Classé du plus rentable au moins rentable</div>`;

  pdvContainer.innerHTML = labelTriPdv + villesTriees.map(ville => `
    <div style="margin-bottom:6px;">
      <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;
        letter-spacing:1px;padding:10px 0 7px;display:flex;align-items:center;gap:5px;">
        ${ICONS.pin} ${ville}
      </div>
      ${pdvParVille[ville].map(p => {
        const rang = pdvSorted.findIndex(x => x.id === p.id);
        const medailles = [ICONS.medal1, ICONS.medal2, ICONS.medal3];
        const medaille = rang < 3 ? medailles[rang] : '';
        return `
        <div onclick="openFinancePdvDetail('${p.id}')"
          style="padding:9px 0;border-bottom:1px solid var(--border);cursor:pointer;transition:background .15s;"
          onmouseover="this.style.background='var(--surface2)'"
          onmouseout="this.style.background='transparent'">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
            <div>
              <div style="font-size:13px;font-weight:600;color:var(--white);">${medaille}${p.nom}</div>
              <div style="font-size:11px;color:var(--muted);">${p.billets} vendu${p.billets>1?'s':''} · ${p.resas} réservation${p.resas>1?'s':''}
                &nbsp;·&nbsp;<span id="finPdvTaux-${p.id}" style="color:var(--muted);">taux —</span>
              </div>
            </div>
            <div style="font-family:'Syne',sans-serif;font-size:14px;font-weight:800;color:var(--white);">${fmt(p.ca)}</div>
          </div>
          <div style="height:5px;background:var(--surface2);border-radius:99px;overflow:hidden;">
            <div style="height:100%;width:${Math.round(p.ca/maxPdvCA*100)}%;background:var(--accent);border-radius:99px;transition:width .5s;"></div>
          </div>
        </div>`;
      }).join('')}
    </div>`).join('');

  pdvSorted.forEach(async (p) => {
    try {
      const cacheKey = getFinPdvStatsCacheKey(p.id);
      const data = await loadFinPdvStats(p.id, cacheKey);
      const taux = data.tauxMoyen || 0;
      const el = document.getElementById(`finPdvTaux-${p.id}`);
      if (el) {
        const couleur = taux >= 75 ? 'var(--accent)' : taux >= 50 ? '#FFB23F' : '#FF4D6A';
        el.textContent = taux > 0 ? `taux ${taux}%` : 'taux —';
        el.style.color = couleur;
      }
    } catch (err) {
      console.error('Erreur taux PDV finance :', err);
    }
  });
}

// ════════════════════════════════
//  TRAJETS
// ════════════════════════════════
function _renderFinanceTrajets(conf, fmt) {
  const trajetMap = {};
  conf.forEach(r => {
    if (!r.trajetId) return;
    const t = trajetList.find(t => t.id === r.trajetId);
    if (!trajetMap[r.trajetId]) trajetMap[r.trajetId] = {
      id:      r.trajetId,
      nom:     t ? `${t.villeDepart} → ${t.villeArrivee}` : '—',
      type:    t?.typeTrajet||'direct',
      ca:      0,
      billets: 0,
      resas:   0,
    };
    trajetMap[r.trajetId].ca      += r.prixTotal||0;
    trajetMap[r.trajetId].billets += r.nbPassagers||1;
    trajetMap[r.trajetId].resas   += 1;
  });

  const trajetSorted = Object.values(trajetMap).sort((a,b) => b.ca - a.ca);
  const maxTrajetCA  = trajetSorted[0]?.ca || 1;
  const trajetContainer = document.getElementById('finTrajetList');
  if (!trajetContainer) return;

  if (!trajetSorted.length) {
    trajetContainer.innerHTML = `<div style="text-align:center;padding:20px;color:var(--muted);font-size:12px;">Aucune vente sur cette période.</div>`;
    return;
  }

  const labelTriTrajet = `<div style="font-size:10.5px;color:var(--muted);font-style:italic;margin-bottom:6px;">Classé du plus rentable au moins rentable</div>`;

  trajetContainer.innerHTML = labelTriTrajet + trajetSorted.map(t => {
    const badge = t.type === 'arrets'
      ? `<span style="font-size:10px;background:rgba(0,87,255,0.12);color:#5B9BFF;padding:1px 7px;border-radius:6px;margin-left:6px;">Avec arrêts</span>`
      : `<span style="font-size:10px;background:var(--surface2);color:var(--muted);padding:1px 7px;border-radius:6px;margin-left:6px;">Direct</span>`;
    return `
      <div onclick="openFinanceTrajetDetail('${t.id}')"
        style="margin-bottom:12px;cursor:pointer;padding:8px;border-radius:8px;
          transition:background .15s;margin-left:-8px;margin-right:-8px;"
        onmouseover="this.style.background='var(--surface2)'"
        onmouseout="this.style.background='transparent'">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px;flex-wrap:wrap;gap:4px;">
          <span style="font-size:13px;font-weight:600;color:var(--white);display:flex;align-items:center;">
            ${t.nom}${badge}
          </span>
          <span style="font-family:'Syne',sans-serif;font-size:13px;font-weight:800;color:var(--white);">${fmt(t.ca)}</span>
        </div>
        <div style="font-size:11px;color:var(--muted);margin-bottom:5px;">${t.billets} vendu${t.billets>1?'s':''} · ${t.resas} réservation${t.resas>1?'s':''}</div>
        <div style="height:5px;background:var(--surface2);border-radius:99px;overflow:hidden;">
          <div style="height:100%;width:${Math.round(t.ca/maxTrajetCA*100)}%;background:var(--primary);border-radius:99px;transition:width .5s;"></div>
        </div>
      </div>`;
  }).join('');
}

// ════════════════════════════════
//  DÉTAIL PDV (overlay)
// ════════════════════════════════
export function openFinancePdvDetail(pdvId) {
  const pdv = pdvList.find(p => p.id === pdvId);
  if (!pdv) return;

  const resasBrutes = resaList.filter(r => r.pdvId === pdvId);   // ← à rajouter

  let resasPeriode = resasBrutes;
  const { debut, fin } = getBornesEffectives();
  if (debut && fin) {
    resasPeriode = resasBrutes.filter(r => {
      const d = toBrazzaDate(r.createdAt);
      return d >= debut && d <= fin;
    });
  }

  // Confirmées uniquement (pour CA / passagers / dernières ventes)
  const resasToutes = resasBrutes.filter(r => r.statut !== 'annulée');
  const resas       = resasPeriode.filter(r => r.statut !== 'annulée');
  const resasAnnuleesPeriode = resasPeriode.filter(r => r.statut === 'annulée');
  const nbAnnulees  = resasAnnuleesPeriode.length;
  const billetsAnnules = resasAnnuleesPeriode.reduce((s, r) => s + (r.nbPassagers || 1), 0);

  const fmt = n => n >= 1_000_000
    ? (n/1_000_000).toFixed(1).replace(/\.0$/,'') + 'M XAF'
    : n >= 1_000 ? Math.round(n/1_000) + 'k XAF'
    : n.toLocaleString() + ' XAF';

  const CA      = resas.reduce((s,r) => s + (r.prixTotal||0), 0);
  const billets = resas.reduce((s,r) => s + (r.nbPassagers||1), 0);

  const trajetMap = {};
  resas.forEach(r => {
    if (!r.trajetId) return;
    const t = trajetList.find(t => t.id === r.trajetId);
    if (!trajetMap[r.trajetId]) trajetMap[r.trajetId] = { nom: t ? `${t.villeDepart} → ${t.villeArrivee}` : '—', ca: 0, billets: 0 };
    trajetMap[r.trajetId].ca      += r.prixTotal||0;
    trajetMap[r.trajetId].billets += r.nbPassagers||1;
  });
  const meilleurTrajet  = Object.values(trajetMap).sort((a,b) => b.ca - a.ca)[0];
  const dernieresVentes = [...resasToutes].sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||'')).slice(0, 5);

  const overlay = document.createElement('div');
  overlay.id = 'financePdvDetailOverlay';
  overlay.className = 'pdv-overlay';
  overlay.innerHTML = `
    <div class="pdv-overlay-backdrop" onclick="closeFinancePdvDetail()"></div>
    <div class="pdv-overlay-panel" style="max-width:480px;">
      <div class="pdv-overlay-header">
        <div>
          <h2>${pdv.nom}</h2>
          <p>${ICONS.pin} ${pdv.ville || '—'}</p>
        </div>
        <button class="pdv-overlay-close" onclick="closeFinancePdvDetail()">${ICONS.close}</button>
      </div>

      <div class="pdv-detail-stats" style="margin-bottom:16px;">
        <div class="pdv-stat-item">
          <span class="pdv-stat-label">Revenus</span>
          <span class="pdv-stat-value">${fmt(CA)}</span>
        </div>
        <div class="pdv-stat-divider"></div>
        <div class="pdv-stat-item">
          <span class="pdv-stat-label">Billets vendus</span>
          <span class="pdv-stat-value accent">${billets}</span>
          ${billetsAnnules > 0 ? `<span style="font-size:10px;color:#FF4D6A;margin-top:2px;">dont ${billetsAnnules} annulé${billetsAnnules>1?'s':''}</span>` : ''}
        </div>
        <div class="pdv-stat-divider"></div>
        <div class="pdv-stat-item">
          <span class="pdv-stat-label">Réservations</span>
          <span class="pdv-stat-value">${resasPeriode.length}</span>
          ${nbAnnulees > 0 ? `<span style="font-size:10px;color:#FF4D6A;margin-top:2px;">dont ${nbAnnulees} annulée${nbAnnulees>1?'s':''}</span>` : ''}
        </div>
      </div>

      ${meilleurTrajet ? `
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:12px 16px;margin-bottom:16px;">
        <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.7px;margin-bottom:4px;">Trajet le plus vendu ici</div>
        <div style="font-size:13px;font-weight:600;color:var(--white);">${meilleurTrajet.nom}</div>
        <div style="font-size:12px;color:var(--muted);margin-top:2px;">${fmt(meilleurTrajet.ca)} · ${meilleurTrajet.billets} passager${meilleurTrajet.billets>1?'s':''}</div>
      </div>` : ''}

      <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px;">Ventes de ce PDV par trajet</div>
      <div id="financePdvTauxTrajets" style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
        <div style="text-align:center;padding:12px;color:var(--muted);font-size:12px;">Chargement...</div>
      </div>

      <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px;">Dernières ventes</div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${dernieresVentes.length === 0
          ? `<div style="text-align:center;padding:16px;color:var(--muted);font-size:12px;">Aucune vente sur cette période.</div>`
          : dernieresVentes.map(r => {
              const nomComplet = `${r.prenomPassager||''} ${r.nomPassager||''}`.trim() || 'Passager';
              const t   = trajetList.find(t => t.id === r.trajetId);
              const dateLabel = r.createdAt
                ? new Date(r.createdAt).toLocaleDateString('fr-FR',{day:'2-digit',month:'short', timeZone:'Africa/Brazzaville'})
                : '—';
              return `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);">
                  <div>
                    <div style="font-size:13px;font-weight:600;color:var(--white);">${nomComplet}</div>
                    <div style="font-size:11px;color:var(--muted);">${t ? t.villeDepart+' → '+t.villeArrivee : '—'} · ${dateLabel}</div>
                  </div>
                  <div style="font-size:13px;font-weight:700;color:var(--white);">${fmt(r.prixTotal||0)}</div>
                </div>`;
            }).join('')}
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));

  (async () => {
    try {
      const cacheKey = getFinPdvStatsCacheKey(pdvId);
      const data = await loadFinPdvStats(pdvId, cacheKey);
      const trajetsTries = [...(data.trajets || [])].sort((a, b) => b.taux - a.taux);

      _financePdvTrajetsData[pdvId] = trajetsTries;

      const container = document.getElementById('financePdvTauxTrajets');
      if (!container) return;

      if (trajetsTries.length === 0) {
        container.innerHTML = `<div style="text-align:center;padding:12px;color:var(--muted);font-size:12px;">Aucun trajet assigné.</div>`;
        return;
      }

      container.innerHTML = trajetsTries.map(t => {
        const couleur = t.taux >= 75 ? 'var(--accent)' : t.taux >= 50 ? '#FFB23F' : '#FF4D6A';
        return `
          <div onclick="openFinanceBusDetail('${pdvId}', '${t.id}')"
            style="border:1px solid var(--border);border-radius:10px;padding:10px 14px;background:var(--surface);cursor:pointer;transition:background .15s;"
            onmouseover="this.style.background='var(--surface2)'"
            onmouseout="this.style.background='var(--surface)'">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
              <span style="font-size:13px;font-weight:600;color:var(--white);">${t.villeDepart} → ${t.villeArrivee}</span>
              <span style="font-size:13px;font-weight:700;color:${couleur};">${t.taux}%</span>
            </div>
            <div style="height:5px;background:var(--surface2);border-radius:99px;overflow:hidden;">
              <div style="height:100%;width:${Math.min(t.taux, 100)}%;background:${couleur};border-radius:99px;"></div>
            </div>
            <div style="font-size:10px;color:var(--muted);margin-top:6px;">${(t.bus || []).length} bus · voir le détail →</div>
          </div>`;
      }).join('');

    } catch (err) {
      console.error('Erreur taux trajets PDV :', err);
      const container = document.getElementById('financePdvTauxTrajets');
      if (container) container.innerHTML = `<div style="text-align:center;padding:12px;color:#FF4D6A;font-size:12px;">Erreur de chargement.</div>`;
    }
  })();
}

export function closeFinancePdvDetail() {
  const o = document.getElementById('financePdvDetailOverlay');
  if (o) { o.classList.remove('show'); setTimeout(() => o.remove(), 350); }
}

// ════════════════════════════════
//  DÉTAIL BUS PAR TRAJET (overlay)
// ════════════════════════════════
export function openFinanceBusDetail(pdvId, trajetId) {
  const trajets = _financePdvTrajetsData[pdvId] || [];
  const trajet  = trajets.find(t => t.id === trajetId);
  if (!trajet) return;

  const busTries = [...(trajet.bus || [])].sort((a, b) => b.taux - a.taux);

  const overlay = document.createElement('div');
  overlay.id = 'financeBusDetailOverlay';
  overlay.className = 'pdv-overlay';
  overlay.innerHTML = `
    <div class="pdv-overlay-backdrop" onclick="closeFinanceBusDetail()"></div>
    <div class="pdv-overlay-panel" style="max-width:480px;">
      <div class="pdv-overlay-header">
        <div>
          <h2>${trajet.villeDepart} → ${trajet.villeArrivee}</h2>
          <p>Part des ventes de ce PDV par bus</p>
        </div>
        <button class="pdv-overlay-close" onclick="closeFinanceBusDetail()">${ICONS.close}</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${busTries.length === 0
          ? `<div style="text-align:center;padding:20px;color:var(--muted);font-size:12px;">Aucun bus configuré sur ce trajet.</div>`
          : busTries.map(b => {
              const couleur = b.taux >= 75 ? 'var(--accent)' : b.taux >= 50 ? '#FFB23F' : '#FF4D6A';
              const statutBadge = b.actif === false
                ? `<span style="font-size:10px;background:rgba(255,77,106,0.12);color:#FF4D6A;padding:2px 7px;border-radius:20px;font-weight:600;margin-left:6px;">Inactif</span>`
                : '';
              return `
                <div style="border:1px solid var(--border);border-radius:10px;padding:10px 14px;background:var(--surface);">
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
                    <span style="font-size:13px;font-weight:600;color:var(--white);">${ICONS.bus} ${b.nom}${statutBadge}</span>
                    <span style="font-size:13px;font-weight:700;color:${couleur};">${b.taux}%</span>
                  </div>
                  <div style="font-size:11px;color:var(--muted);margin-bottom:6px;">${b.heureDepart || '—'} · ${b.vendus}/${b.capaciteTotale} places vendues · ${b.nbSessions} départ${b.nbSessions>1?'s':''}</div>
                  <div style="height:5px;background:var(--surface2);border-radius:99px;overflow:hidden;">
                    <div style="height:100%;width:${Math.min(b.taux, 100)}%;background:${couleur};border-radius:99px;"></div>
                  </div>
                </div>`;
            }).join('')}
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
}

export function closeFinanceBusDetail() {
  const o = document.getElementById('financeBusDetailOverlay');
  if (o) { o.classList.remove('show'); setTimeout(() => o.remove(), 350); }
}

// ════════════════════════════════
//  DÉTAIL TRAJET (overlay)
// ════════════════════════════════
export function openFinanceTrajetDetail(trajetId) {
  const t = trajetList.find(t => t.id === trajetId);
  if (!t) return;

  let resas = resaList.filter(r => r.trajetId === trajetId && r.statut !== 'annulée');
  const { debut, fin } = getBornesEffectives();
  if (debut && fin) {
    resas = resas.filter(r => {
      const d = toBrazzaDate(r.createdAt);
      return d >= debut && d <= fin;
    });
  }

  const fmt = n => n >= 1_000_000
    ? (n/1_000_000).toFixed(1).replace(/\.0$/,'') + 'M XAF'
    : n >= 1_000 ? Math.round(n/1_000) + 'k XAF'
    : n.toLocaleString() + ' XAF';

  const CA      = resas.reduce((s,r) => s + (r.prixTotal||0), 0);
  const billets = resas.reduce((s,r) => s + (r.nbPassagers||1), 0);

  const JOURS_SEMAINE = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
  const dowCA = Array(7).fill(0);
  resas.forEach(r => {
    if (!r.createdAt) return;
    const dow = new Date(toBrazzaDate(r.createdAt)+'T00:00:00').getDay();
    dowCA[dow] += r.prixTotal||0;
  });
  const bestDow = dowCA.indexOf(Math.max(...dowCA));

  const pdvMap = {};
  resas.forEach(r => {
    if (!r.pdvId) return;
    const pdv = pdvList.find(p => p.id === r.pdvId);
    if (!pdvMap[r.pdvId]) pdvMap[r.pdvId] = { nom: pdv?.nom||'—', ca: 0, billets: 0 };
    pdvMap[r.pdvId].ca      += r.prixTotal||0;
    pdvMap[r.pdvId].billets += r.nbPassagers||1;
  });
  const pdvSorted = Object.values(pdvMap).sort((a,b) => b.ca - a.ca);
  const maxPdvCA  = pdvSorted[0]?.ca || 1;

  const overlay = document.createElement('div');
  overlay.id = 'financeTrajetDetailOverlay';
  overlay.className = 'pdv-overlay';
  overlay.innerHTML = `
    <div class="pdv-overlay-backdrop" onclick="closeFinanceTrajetDetail()"></div>
    <div class="pdv-overlay-panel" style="max-width:480px;">
      <div class="pdv-overlay-header">
        <div>
          <h2>${t.villeDepart} → ${t.villeArrivee}</h2>
          <p>${t.typeTrajet === 'arrets' ? 'Avec arrêts' : 'Direct'}</p>
        </div>
        <button class="pdv-overlay-close" onclick="closeFinanceTrajetDetail()">${ICONS.close}</button>
      </div>

      <div class="pdv-detail-stats" style="margin-bottom:16px;">
        <div class="pdv-stat-item">
          <span class="pdv-stat-label">Revenus</span>
          <span class="pdv-stat-value">${fmt(CA)}</span>
        </div>
        <div class="pdv-stat-divider"></div>
        <div class="pdv-stat-item">
          <span class="pdv-stat-label">Billets vendus</span>
          <span class="pdv-stat-value accent">${billets}</span>
        </div>
        <div class="pdv-stat-divider"></div>
        <div class="pdv-stat-item">
          <span class="pdv-stat-label">Réservations</span>
          <span class="pdv-stat-value">${resas.length}</span>
        </div>
      </div>

      ${dowCA[bestDow] > 0 ? `
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:12px 16px;margin-bottom:16px;">
        <div style="font-size:12px;color:var(--muted);">
          Ce trajet se vend le mieux le <strong style="color:var(--white);">${JOURS_SEMAINE[bestDow]}</strong>.
        </div>
      </div>` : ''}

      <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px;">Remplissage réel par bus (tous PDV confondus)</div>
      <div id="financeTrajetTauxReel" style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
        <div style="text-align:center;padding:12px;color:var(--muted);font-size:12px;">Chargement...</div>
      </div>

      <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px;">Points de vente sur ce trajet</div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${pdvSorted.length === 0
          ? `<div style="text-align:center;padding:16px;color:var(--muted);font-size:12px;">Aucune vente sur cette période.</div>`
          : pdvSorted.map(p => `
              <div style="padding:9px 0;border-bottom:1px solid var(--border);">
                <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
                  <span style="font-size:13px;font-weight:600;color:var(--white);">${p.nom}</span>
                  <span style="font-size:13px;font-weight:700;color:var(--white);">${fmt(p.ca)}</span>
                </div>
                <div style="height:5px;background:var(--surface2);border-radius:99px;overflow:hidden;">
                  <div style="height:100%;width:${Math.round(p.ca/maxPdvCA*100)}%;background:var(--primary);border-radius:99px;"></div>
                </div>
              </div>`).join('')}
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));

  (async () => {
    try {
      let url = `${BACKEND}/trajet/${trajetId}/stats`;
      const { debut: debut2, fin: fin2 } = getBornesEffectives();
      if (debut2 && fin2) {
        url += `?dateDebut=${debut2}&dateFin=${fin2}`;
      }
      const res = await apiFetch(url);
      const data = await res.json();
      const container = document.getElementById('financeTrajetTauxReel');
      if (!container) return;

      if (!data.bus || data.bus.length === 0) {
        container.innerHTML = `<div style="text-align:center;padding:12px;color:var(--muted);font-size:12px;">Aucun bus sur ce trajet.</div>`;
        return;
      }

      container.innerHTML = data.bus.map(b => {
        const couleur = b.taux >= 75 ? 'var(--accent)' : b.taux >= 50 ? '#FFB23F' : '#FF4D6A';
        return `
          <div style="border:1px solid var(--border);border-radius:10px;padding:10px 14px;background:var(--surface);">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
              <span style="font-size:13px;font-weight:600;color:var(--white);">${ICONS.bus} ${b.nom}</span>
              <span style="font-size:13px;font-weight:700;color:${couleur};">${b.taux}%</span>
            </div>
            <div style="font-size:11px;color:var(--muted);margin-bottom:6px;">${b.vendus}/${b.capaciteTotale} places vendues · ${b.nbSessions} départ${b.nbSessions>1?'s':''}</div>
            <div style="height:5px;background:var(--surface2);border-radius:99px;overflow:hidden;">
              <div style="height:100%;width:${Math.min(b.taux,100)}%;background:${couleur};border-radius:99px;"></div>
            </div>
          </div>`;
      }).join('');
    } catch (err) {
      console.error('Erreur remplissage réel trajet :', err);
    }
  })();
}

export function closeFinanceTrajetDetail() {
  const o = document.getElementById('financeTrajetDetailOverlay');
  if (o) { o.classList.remove('show'); setTimeout(() => o.remove(), 350); }
}

// ════════════════════════════════
//  DÉTAIL JOUR (overlay)
// ════════════════════════════════
export function openFinanceJourDetail(dateStr) {
  const resas = resaList.filter(r =>
    r.statut !== 'annulée' && toBrazzaDate(r.createdAt) === dateStr
  );

  const fmt = n => n >= 1_000_000
    ? (n/1_000_000).toFixed(1).replace(/\.0$/,'') + 'M XAF'
    : n >= 1_000 ? Math.round(n/1_000) + 'k XAF'
    : n.toLocaleString() + ' XAF';

  const CA      = resas.reduce((s,r) => s + (r.prixTotal||0), 0);
  const billets = resas.reduce((s,r) => s + (r.nbPassagers||1), 0);
  const dateLabel = new Date(dateStr+'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: '2-digit', month: 'long'
  });

  const overlay = document.createElement('div');
  overlay.id = 'financeJourDetailOverlay';
  overlay.className = 'pdv-overlay';
  overlay.innerHTML = `
    <div class="pdv-overlay-backdrop" onclick="closeFinanceJourDetail()"></div>
    <div class="pdv-overlay-panel" style="max-width:520px;">
      <div class="pdv-overlay-header">
        <div>
          <h2 style="text-transform:capitalize;">${dateLabel}</h2>
          <p>${fmt(CA)} · ${billets} passager${billets>1?'s':''} transporté${billets>1?'s':''}</p>
        </div>
        <button class="pdv-overlay-close" onclick="closeFinanceJourDetail()">${ICONS.close}</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${resas.length === 0
          ? `<div style="text-align:center;padding:20px;color:var(--muted);font-size:12px;">Aucune vente ce jour-là.</div>`
          : resas.sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||'')).map(r => {
              const nomComplet = `${r.prenomPassager||''} ${r.nomPassager||''}`.trim() || 'Passager';
              const t   = trajetList.find(t => t.id === r.trajetId);
              const pdv = pdvList.find(p => p.id === r.pdvId);
              const heure = r.createdAt
                ? new Date(r.createdAt).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit', timeZone:'Africa/Brazzaville'})
                : '—';
              return `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);">
                  <div>
                    <div style="font-size:13px;font-weight:600;color:var(--white);">${nomComplet}</div>
                    <div style="font-size:11px;color:var(--muted);">${t ? t.villeDepart+' → '+t.villeArrivee : '—'} · ${pdv?.nom||'—'} · ${heure}</div>
                  </div>
                  <div style="font-size:13px;font-weight:700;color:var(--white);">${fmt(r.prixTotal||0)}</div>
                </div>`;
            }).join('')}
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
}

export function closeFinanceJourDetail() {
  const o = document.getElementById('financeJourDetailOverlay');
  if (o) { o.classList.remove('show'); setTimeout(() => o.remove(), 350); }
}

function getBornesPeriodePrecedente(periode, bDebut, bFin) {
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

// ════════════════════════════════
//  ONGLETS AFFICHAGE (Vue d'ensemble / Billets / Colis)
//  N'affecte QUE l'affichage écran — aucune donnée n'est recalculée ici,
//  et le rapport imprimé (reports.js) ne dépend pas du DOM.
// ════════════════════════════════
export function switchFinanceTab(tab) {
  ['overview', 'billets', 'colis'].forEach(t => {
    const panel = document.getElementById(`finPanel-${t}`);
    const btn   = document.getElementById(`finTab-${t}`);
    if (panel) panel.style.display = (t === tab) ? '' : 'none';
    if (btn)   btn.classList.toggle('active', t === tab);
  });
}

// ════════════════════════════════
//  EXPOSER AU HTML
// ════════════════════════════════
window.renderFinancePage       = renderFinancePage;
window.setFinPeriode           = setFinPeriode;
window.openFinancePdvDetail    = openFinancePdvDetail;
window.closeFinancePdvDetail   = closeFinancePdvDetail;
window.openFinanceBusDetail    = openFinanceBusDetail;
window.closeFinanceBusDetail   = closeFinanceBusDetail;
window.openFinanceTrajetDetail  = openFinanceTrajetDetail;
window.closeFinanceTrajetDetail = closeFinanceTrajetDetail;
window.openFinanceJourDetail    = openFinanceJourDetail;
window.closeFinanceJourDetail   = closeFinanceJourDetail;
window.toggleFinCustomPicker = toggleFinCustomPicker;
window.applyFinCustomRange   = applyFinCustomRange;
window.clearFinCustomRange   = clearFinCustomRange;
window.switchFinanceTab      = switchFinanceTab;