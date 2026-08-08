// ─── TRAVIO — PDV — Trajets (données, cache départs/bus, page & détail) ───

import { apiFetch } from '../api.js';
import { formatDelaiFormalite } from '../billet-template.js';
import {
  ICONS, BACKEND,
  agenceData, trajetList, pdvData,
  setTrajetList,
} from './state-pdv.js';

// ════════════════════════════════
//  TRAJETS
// ════════════════════════════════
export async function loadTrajets(agenceId, pdvId) {
  try {
    const res  = await apiFetch(`${BACKEND}/trajets?agenceId=${agenceId}`);
    const data = await res.json();
    if (!res.ok) return;

    const all = data.trajets || [];
    setTrajetList(all.filter(t => {
      if (t.actif === false) return false;
      const dep    = (t.pdvDepart  || []).map(p => p.id);
      const arrets = (t.pdvArrets  || []).map(p => p.id);
      return dep.includes(pdvId) || arrets.includes(pdvId);
    }));

    renderTrajetsPDV();
    renderAccueilTrajets();
    populateFilterTrajet();

  } catch (err) {
    console.error('Erreur trajets :', err);
    setTrajetList([]);
    renderTrajetsPDV();
  }
}

export function renderTrajetsPDV() {
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
          return `<span>${type?.nom || typeId} <small style="color:var(--muted);">(${ageRangeLabelLocal(typeId)})</small> : <strong>${Number(prix).toLocaleString()} XAF</strong></span>`;
        }).join('')}
      </div>

      ${arretsSection}

      <div class="trajet-card-footer">
        <div class="trajet-quota-info">
          <span style="color:var(--muted);font-size:12px;">${ICONS.bus}</span>
          <span class="trajet-quota-val" id="busCountTrajet-${t.id}">…</span>
          <span style="color:var(--muted);font-size:12px;">bus actif</span>
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

export async function openTrajetDetailPDV(trajetId) {
  const t = trajetList.find(tr => tr.id === trajetId);
  if (!t) return;

  const overlay = document.createElement('div');
  overlay.id = 'trajetDetailPDVOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:7000;display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:opacity .3s ease;pointer-events:none;';
  overlay.innerHTML = `
    <div onclick="closeTrajetDetailPDV()" style="position:absolute;inset:0;background:rgba(10,14,26,0.85);backdrop-filter:blur(6px);"></div>
    <div style="position:relative;z-index:1;background:#0F1525;border:1px solid rgba(255,255,255,0.12);border-radius:24px 24px 0 0;width:100%;max-width:480px;max-height:88vh;overflow-y:auto;padding:0 0 32px;box-shadow:0 -24px 80px rgba(0,0,0,0.5);transform:translateY(40px);transition:transform .35s cubic-bezier(0.34,1.1,.64,1);" id="trajetDetailPDVPanel">

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

        <div>
          <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Tarifs</div>
          <div style="display:flex;gap:10px;">
            ${Object.entries(t.prixParType || {}).map(([typeId, prix]) => {
              const type = (agenceData.typesBillet || []).find(x => x.id === typeId);
              return `
            <div style="flex:1;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px;text-align:center;">
              <div style="font-size:11px;color:var(--muted);margin-bottom:4px;">${type?.nom || typeId}</div>
              <div style="font-size:9px;color:var(--muted);margin-bottom:4px;">${ageRangeLabelLocal(typeId)}</div>
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

        <div>
          <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Bus actifs</div>
          <div id="trajetDetailBusList" style="display:flex;flex-direction:column;gap:8px;">
            <div style="text-align:center;padding:16px;color:var(--muted);font-size:12px;">Chargement...</div>
          </div>
        </div>

      </div>

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

export function closeTrajetDetailPDV() {
  const overlay = document.getElementById('trajetDetailPDVOverlay');
  if (overlay) {
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    setTimeout(() => overlay.remove(), 350);
  }
}

export function renderAccueilTrajets() {
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
//  CACHE PARTAGÉ — DÉPARTS PAR TRAJET
//  (route/bus/horaires : quasi statique côté PDV, jamais édité depuis cette interface)
// ════════════════════════════════
const departsParTrajetCache = new Map(); // trajetId -> Promise<departs[]>

export function getDepartsForTrajet(trajetId) {
  if (!trajetId) return Promise.resolve([]);
  if (!departsParTrajetCache.has(trajetId)) {
    const p = apiFetch(`${BACKEND}/trajet/${trajetId}/departs`)
      .then(r => r.json())
      .then(d => d.departs || [])
      .catch(err => {
        console.error('Erreur chargement départs trajet :', err);
        departsParTrajetCache.delete(trajetId);
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

export async function getBusNomsPourPDV() {
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

export function populateFilterBus(trajetId = '') {
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

export function populateFilterTrajet() {
  const select = document.getElementById('filterTrajet');
  if (!select) return;

  select.innerHTML = '<option value="">Tous les trajets</option>' +
    trajetList.map(t => {
      const typeLabel = t.typeTrajet === 'arrets' ? '⊙ Arrêts' : '→ Direct';
      return `<option value="${t.id}">${typeLabel} · ${t.villeDepart} → ${t.villeArrivee}</option>`;
    }).join('');
}

export function updateFiltreHighlightPDV(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('filtre-actif', !!el.value);
}

// ════════════════════════════════
//  Helper local — évite de dépendre du module vente pour l'affichage des tranches d'âge
// ════════════════════════════════
function ageRangeLabelLocal(typeId) {
  const t = (agenceData?.typesBillet || []).find(x => x.id === typeId);
  if (!t) return '';
  return t.ageMax == null ? `${t.ageMin} ans et +` : `${t.ageMin}-${t.ageMax} ans`;
}

// ════════════════════════════════
//  EXPOSER AU HTML (appelés en onclick inline)
// ════════════════════════════════
window.openTrajetDetailPDV = openTrajetDetailPDV;
window.closeTrajetDetailPDV = closeTrajetDetailPDV;