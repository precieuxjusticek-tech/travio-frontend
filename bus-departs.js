// ─── TRAVIO — Bus & Départs ───

import { BACKEND, agenceData, trajetList, setTrajetList, departSteps, setDepartSteps, vehiculeList } from './state.js';
import { loadDeparts, invalidateDeparts, invalidateAllDepartsCache, renderDepartItem, closeTrajetDetail, openTrajetDetail, renderTrajetsPage, updateOverviewStats } from './trajets.js';
import { loadBusSessions } from './sessions.js';
import { showToast, showToastAction, toggleTousJours, toggleJour, TOAST_ICONS } from './toast-utils.js';
import { apiFetch } from './api.js';
import { escapeHtml, escapeJsAttr } from './sanitize.js';

const ICONS = {
  close:   '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  bus:     '<svg width="15" height="15" viewBox="0 0 20 20" fill="none" style="vertical-align:-2px;margin-right:4px;"><rect x="3" y="4" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M3 10h14" stroke="currentColor" stroke-width="1.5"/><circle cx="6" cy="16" r="1.5" stroke="currentColor" stroke-width="1.4"/><circle cx="14" cy="16" r="1.5" stroke="currentColor" stroke-width="1.4"/></svg>',
  pin:     '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:3px;"><path d="M8 1a5 5 0 00-5 5c0 3.5 5 9 5 9s5-5.5 5-9a5 5 0 00-5-5z" stroke="currentColor" stroke-width="1.4"/><circle cx="8" cy="6" r="1.4" stroke="currentColor" stroke-width="1.4"/></svg>',
  edit:    '<svg width="13" height="13" viewBox="0 0 14 14" fill="none" style="vertical-align:-2px;margin-right:4px;"><path d="M9 2l3 3L4 13H1v-3L9 2z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  refresh: '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:4px;"><path d="M13 8A5 5 0 103 8M13 8V4M13 8H9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  stop:    '<svg width="12" height="12" viewBox="0 0 14 14" fill="none" style="vertical-align:-1px;margin-right:3px;"><rect x="3" y="3" width="8" height="8" rx="1" stroke="currentColor" stroke-width="1.4"/></svg>',
  play:    '<svg width="12" height="12" viewBox="0 0 14 14" fill="none" style="vertical-align:-1px;margin-right:3px;"><path d="M4 2.5v9l8-4.5-8-4.5z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>',
  check:   '<svg width="26" height="26" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.4"/><path d="M5 8l2 2 4-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  trash:   '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:4px;"><path d="M3 4h10M6 4V2h4v2M4 4l1 10h6l1-10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  trashSm: '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:3px;"><path d="M3 4h10M6 4V2h4v2M4 4l1 10h6l1-10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  save:    '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:4px;"><path d="M3 2h8l2.5 2.5V13a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M5 2v4h5V2M4.5 9.5h7v4.5h-7z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>',
  calendar:'<svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:4px;"><rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M5 1v4M11 1v4M2 7h12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
};

// ════════════════════════════════
//  BUS — CRÉER
// ════════════════════════════════
export async function openCreateDepart(trajetId) {
  setDepartSteps({ trajetId });
  const trajet = trajetList.find(t => t.id === trajetId);
  const arretsDisponibles = trajet?.arrets || [];

  // ── Récupérer les véhicules déjà utilisés sur ce trajet ──
  let vehiculesDejaPris = [];
  try {
    const departsExistants = await loadDeparts(trajetId); // utilise le cache si déjà chargé
    vehiculesDejaPris = departsExistants.map(d => d.vehiculeId).filter(Boolean);
  } catch (err) {
    console.error('Erreur récupération départs pour filtre véhicule :', err);
  }

  const arretsSection = arretsDisponibles.length > 0 ? (() => {
    const parVille = {};
    arretsDisponibles.forEach((a, i) => {
      const ville = a.ville || a.nom;
      if (!parVille[ville]) parVille[ville] = [];
      parVille[ville].push({ ...a, _index: i });
    });

    const html = Object.entries(parVille).map(([ville, arrets]) => `
      <div style="margin-bottom:10px;">
        <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.7px;margin-bottom:6px;">${ICONS.pin} ${escapeHtml(ville)}</div>
        <div style="display:flex;flex-direction:column;gap:6px;padding-left:8px;border-left:2px solid var(--border2);">
          ${arrets.map(a => `
            <label class="pdv-multi-item">
              <input type="checkbox" value="${a._index}" data-nom="${escapeHtml(a.nom)}" data-id="${escapeHtml(a.id || '')}" data-type="${escapeHtml(a.type)}" class="arret-actif-check" checked>
              <span class="pdv-multi-label">
                <strong>${escapeHtml(a.nom)}</strong>
                <small>${a.type === 'pdv' ? 'PDV' : 'Lieu'}</small>
              </span>
            </label>`).join('')}
        </div>
      </div>`).join('');

    return `
      <div class="pdv-field-group">
        <label>Arrêts desservis par ce bus</label>
        <p class="pdv-field-hint">Cochez les arrêts que ce bus dessert parmi les arrêts du trajet.</p>
        <div style="margin-top:8px;" id="cdArretsActifs">${html}</div>
      </div>`;
  })() : '';

  const overlay = document.createElement('div');
  overlay.id = 'createDepartOverlay';
  overlay.className = 'pdv-overlay';
  overlay.innerHTML = `
    <div class="pdv-overlay-backdrop" onclick="closeCreateDepart()"></div>
    <div class="pdv-overlay-panel" style="max-width:560px;">
      <div class="pdv-overlay-header">
        <div>
          <h2>${ICONS.bus} Ajouter un bus</h2>
          <p>${trajet ? escapeHtml(trajet.villeDepart) + ' → ' + escapeHtml(trajet.villeArrivee) : ''}</p>
        </div>
        <button class="pdv-overlay-close" onclick="closeCreateDepart()">${ICONS.close}</button>
      </div>
      <div class="pdv-create-fields">
        <div class="pdv-field-group">
          <label>Véhicule de la flotte <span class="req">*</span></label>
          <select class="pdv-select" id="cd-vehicule-select" onchange="onVehiculeSelectChange()">
            <option value="">Sélectionner un véhicule</option>
            ${vehiculeList.map(v => {
              const dejaPris = vehiculesDejaPris.includes(v.id);
              return `<option value="${v.id}" data-nom="${escapeHtml(v.nom)}" data-type="${escapeHtml(v.type)}" data-capacite="${Number(v.capacite) || 0}" ${dejaPris ? 'disabled' : ''}>${escapeHtml(v.nom)} · ${escapeHtml(v.type)} · ${Number(v.capacite) || 0} places${dejaPris ? ' (déjà sur ce trajet)' : ''}</option>`;
            }).join('')}
          </select>
          <p class="pdv-field-hint" id="cd-no-vehicule-hint" style="${vehiculeList.filter(v => !vehiculesDejaPris.includes(v.id)).length === 0 ? '' : 'display:none;'}">
            Aucun véhicule disponible dans la flotte.
            <a href="#" onclick="event.preventDefault();openCreateVehicule(refreshVehiculeSelectAfterCreate);" style="color:var(--accent);text-decoration:underline;">Créer un bus dans la flotte</a>
            pour pouvoir l'ajouter à ce trajet.
          </p>
        </div>
        <input type="hidden" id="cd-vehicule-id" value="">
        <input type="hidden" id="cd-bus-nom">
        <input type="hidden" id="cd-bus-type">
        <input type="hidden" id="cd-capacite">
        <div class="pdv-field-group" id="cd-vehicule-summary" style="display:none;">
          <label>Bus sélectionné</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;font-size:12.5px;color:var(--muted);background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px 12px;">
            <span id="cd-bus-nom-display" style="color:var(--white);font-weight:600;"></span>
            <span id="cd-bus-type-display"></span>
            <span id="cd-bus-capacite-display"></span>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="pdv-field-group">
            <label>Heure de départ <span class="req">*</span></label>
            <input type="time" class="pdv-input" id="cd-heure">
          </div>
          <div class="pdv-field-group">
            <label>Heure d'arrivée</label>
            <input type="time" class="pdv-input" id="cd-heure-arrivee">
          </div>
        </div>
        <div class="pdv-field-group">
          <label>Durée estimée</label>
          <input type="text" class="pdv-input" id="cd-duree" readonly
            placeholder="Calculée automatiquement depuis les heures"
            style="opacity:0.6;cursor:default;">
        </div>
        <div class="pdv-field-group">
          <label>Jours de circulation <span class="req">*</span></label>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px;" id="cdJoursWrap">
            <button type="button" class="jour-toggle-btn active" data-tous="1" onclick="toggleTousJours(this)">Tous les jours</button>
            ${['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(j =>
              `<button type="button" class="jour-toggle-btn" data-jour="${j}" onclick="toggleJour(this)">${j}</button>`
            ).join('')}
          </div>
        </div>
        ${arretsSection}
      </div>
      <button class="pdv-btn-next" id="createDepartBtn" onclick="submitCreateDepart('${trajetId}')">
        Ajouter ce bus
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  const calcDureeCreate = () => {
    const dep = document.getElementById('cd-heure')?.value;
    const arr = document.getElementById('cd-heure-arrivee')?.value;
    if (!dep || !arr) return;
    const [dH, dM] = dep.split(':').map(Number);
    const [aH, aM] = arr.split(':').map(Number);
    let diff = (aH * 60 + aM) - (dH * 60 + dM);
    if (diff < 0) diff += 24 * 60;
    document.getElementById('cd-duree').value =
      `${Math.floor(diff / 60)}h${String(diff % 60).padStart(2, '0')}`;
  };
  document.getElementById('cd-heure').addEventListener('change', calcDureeCreate);
  document.getElementById('cd-heure-arrivee').addEventListener('change', calcDureeCreate);

  requestAnimationFrame(() => overlay.classList.add('show'));
}

export function onVehiculeSelectChange() {
  const sel      = document.getElementById('cd-vehicule-select');
  const val      = sel?.value;
  const hiddenId = document.getElementById('cd-vehicule-id');
  const summary  = document.getElementById('cd-vehicule-summary');

  if (!val) {
    document.getElementById('cd-bus-nom').value  = '';
    document.getElementById('cd-bus-type').value = '';
    document.getElementById('cd-capacite').value = '';
    if (hiddenId) hiddenId.value = '';
    if (summary)  summary.style.display = 'none';
    return;
  }

  const opt = sel.options[sel.selectedIndex];
  document.getElementById('cd-bus-nom').value  = opt.dataset.nom;
  document.getElementById('cd-bus-type').value = opt.dataset.type;
  document.getElementById('cd-capacite').value = opt.dataset.capacite;
  if (hiddenId) hiddenId.value = val;

  if (summary) {
    summary.style.display = 'flex';
    document.getElementById('cd-bus-nom-display').textContent      = opt.dataset.nom;
    document.getElementById('cd-bus-type-display').textContent     = '· ' + opt.dataset.type;
    document.getElementById('cd-bus-capacite-display').textContent = '· ' + opt.dataset.capacite + ' places';
  }
}

export function refreshVehiculeSelectAfterCreate(vehicule) {
  const sel = document.getElementById('cd-vehicule-select');
  if (!sel || !vehicule) return;

  const hint = document.getElementById('cd-no-vehicule-hint');
  if (hint) hint.style.display = 'none';

  const opt = document.createElement('option');
  opt.value = vehicule.id;
  opt.dataset.nom = vehicule.nom;
  opt.dataset.type = vehicule.type;
  opt.dataset.capacite = vehicule.capacite;
  opt.textContent = `${vehicule.nom} · ${vehicule.type} · ${vehicule.capacite} places`;
  sel.appendChild(opt);
  sel.value = vehicule.id;

  onVehiculeSelectChange();
}

export function closeCreateDepart() {
  const o = document.getElementById('createDepartOverlay');
  if (o) { o.classList.remove('show'); setTimeout(() => o.remove(), 350); }
}

export async function submitCreateDepart(trajetId) {
  const vehiculeId  = document.getElementById('cd-vehicule-id')?.value;
  const busNom      = document.getElementById('cd-bus-nom')?.value.trim();
  const busType     = document.getElementById('cd-bus-type')?.value;
  const busCapacite = document.getElementById('cd-capacite')?.value;
  const heureDepart = document.getElementById('cd-heure')?.value;

  if (!vehiculeId)  { showToast('Sélectionnez un véhicule de la flotte.', TOAST_ICONS.warning); return; }
  if (!heureDepart) { showToast('Entrez l\'heure de départ.', TOAST_ICONS.warning); return; }

  const tousBtn = document.querySelector('#cdJoursWrap .jour-toggle-btn[data-tous].active');
  let tousLesJours, jours;
  if (tousBtn) {
    tousLesJours = true; jours = [];
  } else {
    jours = [...document.querySelectorAll('#cdJoursWrap .jour-toggle-btn[data-jour].active')].map(b => b.dataset.jour);
    if (jours.length === 0) { showToast('Sélectionnez au moins un jour.', TOAST_ICONS.warning); return; }
    tousLesJours = false;
  }

  const trajet = trajetList.find(t => t.id === trajetId);
  const arretsDisponibles = trajet?.arrets || [];
  const arretsChecks  = [...document.querySelectorAll('#cdArretsActifs .arret-actif-check:checked')];
  const arretsActifs  = arretsChecks.map(c => arretsDisponibles[parseInt(c.value)]).filter(Boolean);

  const payload = {
    trajetId,
    agenceId: agenceData?.id,
    busNom, busType,
    busCapacite:  parseInt(busCapacite),
    vehiculeId,
    heureDepart,
    heureArrivee: document.getElementById('cd-heure-arrivee')?.value  || null,
    dureeEstimee: document.getElementById('cd-duree')?.value.trim()   || null,
    tousLesJours, jours,
    arretsActifs,
  };

  const btn = document.getElementById('createDepartBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Création...'; }

  try {
    const res = await apiFetch(`${BACKEND}/trajet/${trajetId}/depart/create`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) { showToast('Erreur lors de la création du bus.', TOAST_ICONS.error); return; }

    invalidateDeparts(trajetId);
    invalidateAllDepartsCache();

    closeCreateDepart();
    showToast(`Bus "${busNom}" ajouté ! Sessions générées automatiquement.`, TOAST_ICONS.success, true);

    const detailOverlay = document.getElementById('trajetDetailOverlay');
    if (detailOverlay) { closeTrajetDetail(); openTrajetDetail(trajetId); }
    setTimeout(() => genererSessions(data.depart.id), 400);

  } catch (err) {
    showToast('Impossible de contacter le serveur.', TOAST_ICONS.error);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Ajouter ce bus'; }
  }
}

// ════════════════════════════════
//  BUS — MODIFIER
// ════════════════════════════════
export function openEditDepart(departId, trajetId) {
  loadDeparts(trajetId).then(departsListe => {
      const d = departsListe.find(dep => dep.id === departId);
      if (!d) return;
      const joursActifs       = d.tousLesJours ? [] : (d.jours || []);
      const trajet            = trajetList.find(t => t.id === trajetId);
      const arretsDisponibles = trajet?.arrets || [];

      const parVille = {};
      arretsDisponibles.forEach((a, i) => {
        const ville = a.ville || a.nom;
        if (!parVille[ville]) parVille[ville] = [];
        parVille[ville].push({ ...a, _index: i });
      });

      const arretsHtml = Object.entries(parVille).map(([ville, arrets]) => `
        <div style="margin-bottom:10px;">
          <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.7px;margin-bottom:6px;">${ICONS.pin} ${escapeHtml(ville)}</div>
          <div style="display:flex;flex-direction:column;gap:6px;padding-left:8px;border-left:2px solid var(--border2);">
            ${arrets.map(a => {
              const actif = (d.arretsActifs || []).some(aa => aa.nom === a.nom);
              return `
                <label class="pdv-multi-item">
                  <input type="checkbox" value="${a._index}" data-nom="${escapeHtml(a.nom)}" class="arret-actif-check" ${actif ? 'checked' : ''}>
                  <span class="pdv-multi-label">
                    <strong>${escapeHtml(a.nom)}</strong>
                    <small>${a.type === 'pdv' ? 'PDV' : 'Lieu'}</small>
                  </span>
                </label>`;
            }).join('')}
          </div>
        </div>`).join('');

      const arretsSection = arretsDisponibles.length > 0 ? `
        <div class="pdv-field-group">
          <label>Arrêts desservis par ce bus</label>
          <p class="pdv-field-hint">Cochez les arrêts que ce bus dessert.</p>
          <div style="margin-top:8px;" id="edArretsActifs">${arretsHtml}</div>
        </div>` : '';

      const overlay = document.createElement('div');
      overlay.id = 'editDepartOverlay';
      overlay.className = 'pdv-overlay';
      overlay.innerHTML = `
        <div class="pdv-overlay-backdrop" onclick="closeEditDepart()"></div>
        <div class="pdv-overlay-panel" style="max-width:560px;">
          <div class="pdv-overlay-header">
          <div><h2>${ICONS.edit} Modifier le bus</h2><p>${escapeHtml(d.busNom)}</p></div>
            <button class="pdv-overlay-close" onclick="closeEditDepart()">${ICONS.close}</button>
          </div>
          <div class="pdv-create-fields">
            <div class="pdv-field-group">
              <label>Nom du bus <span class="req">*</span></label>
              <input type="text" class="pdv-input" id="ed-bus-nom" value="${escapeHtml(d.busNom || '')}">
            </div>
            <div class="pdv-field-group">
              <label>Type <span class="req">*</span></label>
              <select class="pdv-select" id="ed-bus-type">
                ${['Standard','VIP','Climatisé','VIP Climatisé'].map(v =>
                  `<option ${d.busType === v ? 'selected' : ''}>${v}</option>`).join('')}
              </select>
            </div>
            <div class="pdv-field-group">
              <label>Capacité <span class="req">*</span></label>
              <input type="number" class="pdv-input" id="ed-capacite" value="${d.busCapacite ? Number(d.busCapacite) : ''}">
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="pdv-field-group">
                <label>Heure départ <span class="req">*</span></label>
                <input type="time" class="pdv-input" id="ed-heure" value="${d.heureDepart || ''}">
              </div>
              <div class="pdv-field-group">
                <label>Heure arrivée</label>
                <input type="time" class="pdv-input" id="ed-heure-arrivee" value="${d.heureArrivee || ''}">
              </div>
            </div>
            <div class="pdv-field-group">
              <label>Durée estimée</label>
              <input type="text" class="pdv-input" id="ed-duree" readonly
                value="${d.dureeEstimee || ''}"
                placeholder="Calculée automatiquement" style="opacity:0.6;cursor:default;">
            </div>
            <div class="pdv-field-group">
              <label>Jours <span class="req">*</span></label>
              <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px;" id="edJoursWrap">
                <button type="button" class="jour-toggle-btn ${d.tousLesJours ? 'active' : ''}" data-tous="1" onclick="toggleTousJours(this)">Tous les jours</button>
                ${['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(j =>
                  `<button type="button" class="jour-toggle-btn ${joursActifs.includes(j) ? 'active' : ''}" data-jour="${j}" onclick="toggleJour(this)">${j}</button>`
                ).join('')}
              </div>
            </div>
            ${arretsSection}
          </div>
          <button class="pdv-btn-next" id="editDepartBtn" onclick="submitEditDepart('${departId}', '${trajetId}')">
            ${ICONS.save} Sauvegarder
          </button>
        </div>
      `;
      document.body.appendChild(overlay);

      const calcDuree = () => {
        const dep = document.getElementById('ed-heure')?.value;
        const arr = document.getElementById('ed-heure-arrivee')?.value;
        if (!dep || !arr) return;
        const [dH, dM] = dep.split(':').map(Number);
        const [aH, aM] = arr.split(':').map(Number);
        let diff = (aH * 60 + aM) - (dH * 60 + dM);
        if (diff < 0) diff += 24 * 60;
        document.getElementById('ed-duree').value =
          `${Math.floor(diff / 60)}h${String(diff % 60).padStart(2, '0')}`;
      };
      document.getElementById('ed-heure').addEventListener('change', calcDuree);
      document.getElementById('ed-heure-arrivee').addEventListener('change', calcDuree);

      requestAnimationFrame(() => overlay.classList.add('show'));
    });
}

export function closeEditDepart() {
  const o = document.getElementById('editDepartOverlay');
  if (o) { o.classList.remove('show'); setTimeout(() => o.remove(), 350); }
}

export async function submitEditDepart(departId, trajetId) {
  const busNom      = document.getElementById('ed-bus-nom')?.value.trim();
  const busType     = document.getElementById('ed-bus-type')?.value;
  const busCapacite = document.getElementById('ed-capacite')?.value;
  const heureDepart = document.getElementById('ed-heure')?.value;

  if (!busNom || !busType || !busCapacite || !heureDepart) {
    showToast('Remplissez les champs obligatoires.', TOAST_ICONS.warning); return;
  }

  const tousBtn      = document.querySelector('#edJoursWrap .jour-toggle-btn[data-tous].active');
  const tousLesJours = !!tousBtn;
  const jours        = tousLesJours
    ? []
    : [...document.querySelectorAll('#edJoursWrap .jour-toggle-btn[data-jour].active')].map(b => b.dataset.jour);
  if (!tousLesJours && jours.length === 0) {
    showToast('Sélectionnez au moins un jour.', TOAST_ICONS.warning); return;
  }

  const trajet = trajetList.find(t => t.id === trajetId);
  let arretsActifs;
  if (trajet?.typeTrajet === 'arrets') {
    const checks = [...document.querySelectorAll('#edArretsActifs .arret-actif-check:checked')];
    arretsActifs = checks.map(c => (trajet.arrets || [])[parseInt(c.value)]).filter(Boolean);
  }

  const heureArrivee = document.getElementById('ed-heure-arrivee')?.value || null;
  let dureeEstimee   = document.getElementById('ed-duree')?.value.trim() || null;
  if (heureDepart && heureArrivee) {
    const [dH, dM] = heureDepart.split(':').map(Number);
    const [aH, aM] = heureArrivee.split(':').map(Number);
    let diff = (aH * 60 + aM) - (dH * 60 + dM);
    if (diff < 0) diff += 24 * 60;
    dureeEstimee = `${Math.floor(diff / 60)}h${String(diff % 60).padStart(2, '0')}`;
  }

  const btn = document.getElementById('editDepartBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Sauvegarde...'; }

  try {
    const payload = {
      busNom, busType,
      busCapacite: parseInt(busCapacite),
      heureDepart, heureArrivee, dureeEstimee,
      tousLesJours, jours,
    };
    if (arretsActifs !== undefined) payload.arretsActifs = arretsActifs;

    const res = await apiFetch(`${BACKEND}/depart/${departId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) { showToast('Erreur lors de la sauvegarde du bus.', TOAST_ICONS.error); return; }

    invalidateDeparts(trajetId);
    invalidateAllDepartsCache();

    closeEditDepart();
    closeTrajetDetail();
    openTrajetDetail(trajetId, 'bus');
    showToast('Bus mis à jour !', TOAST_ICONS.success, true);

    if (data.joursChanges) {
      setTimeout(() => {
        showToastAction(
          'Les jours de circulation ont changé — pensez à régénérer les sessions.',
          TOAST_ICONS.info,
          'Régénérer',
          () => handleGenererSessions(departId)
        );
      }, 800);
    }

  } catch (err) {
    showToast('Impossible de contacter le serveur.', TOAST_ICONS.error);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = `${ICONS.save} Sauvegarder`; }
  }
}

// ════════════════════════════════
//  BUS — SUPPRIMER
// ════════════════════════════════
export function confirmDeleteDepart(departId, trajetId, busNom) {
  const overlay = document.createElement('div');
  overlay.id = 'deleteDepartOverlay';
  overlay.className = 'pdv-overlay';
  overlay.innerHTML = `
    <div class="pdv-overlay-backdrop" onclick="closeDepartDelete()"></div>
    <div class="pdv-overlay-panel pdv-confirm-panel">
      <div class="pdv-confirm-icon">${ICONS.trash}</div>
      <h2>Supprimer ce bus ?</h2>
      <p>
      Vous allez supprimer <strong>${escapeHtml(busNom)}</strong> de ce trajet.<br><br>
        <span style="color:var(--accent);">Sessions passées :</span> conservées dans l'historique (1 an).<br>
        <span style="color:#FF4D6A;">Sessions futures :</span> supprimées définitivement.
      </p>
      <div class="pdv-confirm-actions">
        <button class="pdv-btn-next delete-confirm" onclick="deleteDepart('${departId}', '${trajetId}')">Oui, supprimer</button>
        <button class="pdv-btn-back" onclick="closeDepartDelete()">Annuler</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
}

export function closeDepartDelete() {
  const o = document.getElementById('deleteDepartOverlay');
  if (o) { o.classList.remove('show'); setTimeout(() => o.remove(), 350); }
}

export async function deleteDepart(departId, trajetId) {
  closeDepartDelete();
  try {
    const res = await apiFetch(`${BACKEND}/depart/${departId}`, { method: 'DELETE' });
    const data = await res.json();

    if (res.status === 409 && data.code === 'RESA_BLOQUANTES') {
      openResolutionReservationsModal(data.sessions, data.message, { departId, trajetId, actionType: 'delete' });
      return;
    }
    if (!res.ok) { showToast('Erreur lors de la suppression du bus.', TOAST_ICONS.error); return; }
    invalidateDeparts(trajetId);
    invalidateAllDepartsCache();
    showToast('Bus supprimé.', TOAST_ICONS.success, true);
    closeTrajetDetail();
    openTrajetDetail(trajetId, 'bus');
  } catch (err) {
    showToast('Impossible de contacter le serveur.', TOAST_ICONS.error);
  }
}

// ════════════════════════════════
//  BUS — ACTIVER / DÉSACTIVER
// ════════════════════════════════
export async function toggleDepartStatut(departId, trajetId, actifActuel) {
  const nouvelEtat = !actifActuel;
  const overlay = document.createElement('div');
  overlay.id = 'statutDepartOverlay';
  overlay.className = 'pdv-overlay';
  overlay.innerHTML = `
    <div class="pdv-overlay-backdrop" onclick="closeStatutDepart()"></div>
    <div class="pdv-overlay-panel pdv-confirm-panel">
      <div class="pdv-confirm-icon">${nouvelEtat ? ICONS.check : ICONS.stop}</div>
      <h2>${nouvelEtat ? 'Activer' : 'Désactiver'} ce bus ?</h2>
      <p>${nouvelEtat
        ? 'Le bus sera à nouveau disponible. Vous pourrez régénérer ses sessions.'
        : 'Le bus ne sera plus proposé à la réservation.<br><br><span style="color:#FF4D6A;">Sessions futures :</span> supprimées définitivement.<br><span style="color:var(--accent);">Sessions passées :</span> conservées dans l\'historique.'
      }</p>
      <div class="pdv-confirm-actions">
        <button class="pdv-btn-next ${nouvelEtat ? '' : 'delete-confirm'}"
          style="${nouvelEtat ? 'background:var(--accent);color:var(--dark);' : ''}"
          onclick="confirmToggleDepartStatut('${departId}', '${trajetId}', ${nouvelEtat})">
          ${nouvelEtat ? 'Oui, activer' : 'Oui, désactiver'}
        </button>
        <button class="pdv-btn-back" onclick="closeStatutDepart()">Annuler</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
}

export function closeStatutDepart() {
  const o = document.getElementById('statutDepartOverlay');
  if (o) { o.classList.remove('show'); setTimeout(() => o.remove(), 350); }
}

export async function confirmToggleDepartStatut(departId, trajetId, nouvelEtat) {
  closeStatutDepart();
  closeBusDetail();
  try {
    const res = await apiFetch(`${BACKEND}/depart/${departId}/statut`, {
      method: 'PATCH',
      body: JSON.stringify({ actif: nouvelEtat }),
    });
    const data = await res.json();

    if (res.status === 409 && data.code === 'RESA_BLOQUANTES') {
      openResolutionReservationsModal(data.sessions, data.message, { departId, trajetId, actionType: 'statut', nouvelEtat });
      return;
    }
    if (!res.ok) { showToast('Erreur lors du changement de statut du bus.', TOAST_ICONS.error); return; }

    invalidateDeparts(trajetId);
    invalidateAllDepartsCache();

    showToast(
      nouvelEtat ? 'Bus activé avec succès.' : 'Bus désactivé avec succès.',
      nouvelEtat ? TOAST_ICONS.success : TOAST_ICONS.error,
      nouvelEtat
    );

    if (nouvelEtat) {
      setTimeout(() => {
        showToastAction(
          'Bus réactivé — pensez à régénérer ses sessions.',
          TOAST_ICONS.info,
          'Régénérer',
          () => handleGenererSessions(departId)
        );
      }, 800);
    }

    closeTrajetDetail();
    openTrajetDetail(trajetId, 'bus');
  } catch (err) {
    showToast('Impossible de contacter le serveur.', TOAST_ICONS.error);
  }
}

// ════════════════════════════════
//  BUS — DETAIL (modal)
// ════════════════════════════════
export async function openBusDetail(departId, trajetId) {
  const trajet   = trajetList.find(t => t.id === trajetId);
  const hasArrets = trajet?.typeTrajet === 'arrets';

  const departsListe = await loadDeparts(trajetId); // utilise le cache, pas de fetch si déjà chargé
  const depart = departsListe.find(d => d.id === departId);
  if (!depart) return;
  const joursLabel = depart.tousLesJours ? 'Tous les jours' : (depart.jours || []).join(', ');

  const overlay = document.createElement('div');
  overlay.id = 'busDetailOverlay';
  overlay.dataset.departId = departId;
  overlay.dataset.trajetId = trajetId;
  overlay.className = 'pdv-overlay';
  overlay.innerHTML = `
    <div class="pdv-overlay-backdrop" onclick="closeBusDetail()"></div>
    <div class="pdv-overlay-panel" style="max-width:560px;">
      <div class="pdv-overlay-header">
        <div>
        <h2>${ICONS.bus} ${escapeHtml(depart.busNom)}</h2>
          <p>${escapeHtml(depart.busType || '')} · ${Number(depart.busCapacite) || 0} places</p>
        </div>
        <button class="pdv-overlay-close" onclick="closeBusDetail()">${ICONS.close}</button>
      </div>

      <div class="pdv-detail-info" style="margin-bottom:16px;">
      <div class="pdv-detail-row"><span class="pdv-detail-label">Départ</span><span class="pdv-detail-val">${escapeHtml(depart.heureDepart || '')}</span></div>
      ${depart.heureArrivee ? `<div class="pdv-detail-row"><span class="pdv-detail-label">Arrivée</span><span class="pdv-detail-val">${escapeHtml(depart.heureArrivee)}</span></div>` : ''}
      ${depart.dureeEstimee ? `<div class="pdv-detail-row"><span class="pdv-detail-label">Durée</span><span class="pdv-detail-val">${escapeHtml(depart.dureeEstimee)}</span></div>` : ''}
      <div class="pdv-detail-row"><span class="pdv-detail-label">Jours</span><span class="pdv-detail-val">${escapeHtml(joursLabel)}</span></div>
      </div>

      <div class="pdv-detail-actions" style="margin-bottom:20px;">
        <button class="pdv-action-btn" onclick="closeBusDetail();openEditDepart('${departId}', '${trajetId}')">${ICONS.edit} Modifier le bus</button>
        <button class="pdv-action-btn" id="genererBtn"
          disabled style="opacity:0.4;cursor:not-allowed;"
          onclick="handleGenererSessions('${departId}')">
          ${ICONS.refresh} Générer les sessions
        </button>
        <button class="pdv-action-btn ${depart.actif !== false ? 'danger' : ''}"
          onclick="${depart.vehiculeId
            ? `openScopeChoice({action:'statut', departId:'${departId}', trajetId:'${trajetId}', vehiculeId:'${depart.vehiculeId}', busNom:'${escapeJsAttr(depart.busNom)}', nouvelEtat:${depart.actif === false}})`
            : `toggleDepartStatut('${departId}', '${trajetId}', ${depart.actif !== false})`}">
          ${depart.actif !== false ? ICONS.stop + ' Désactiver le bus' : ICONS.play + ' Activer le bus'}
        </button>
        <button class="pdv-action-btn delete" onclick="${depart.vehiculeId
          ? `closeBusDetail();openScopeChoice({action:'delete', departId:'${departId}', trajetId:'${trajetId}', vehiculeId:'${depart.vehiculeId}', busNom:'${escapeJsAttr(depart.busNom)}'})`
          : `closeBusDetail();confirmDeleteDepart('${departId}', '${trajetId}', '${escapeJsAttr(depart.busNom)}')`}">${ICONS.trash} Supprimer le bus</button>
      </div>

      <h3 style="font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:var(--white);margin-bottom:10px;">${ICONS.calendar} Sessions</h3>
      <div id="busSessionsList">
        <div style="text-align:center;padding:16px;color:var(--muted);font-size:12px;">Chargement...</div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
  await loadBusSessions(departId, hasArrets, trajet);
}

export function closeBusDetail() {
  const o = document.getElementById('busDetailOverlay');
  if (o) { o.classList.remove('show'); setTimeout(() => o.remove(), 350); }
}

// ════════════════════════════════
//  RÉSOLUTION RÉSERVATIONS BLOQUANTES
// ════════════════════════════════
let _resolutionContext   = null;
let _resolutionSessions  = [];

export function openResolutionReservationsModal(sessions, message, context) {
  _resolutionContext  = context;
  _resolutionSessions = sessions.map(s => ({ ...s, resolue: false }));

  const nbSessions = sessions.length;
  const nbResas    = sessions.reduce((sum, s) => sum + (s.nbReservations || 0), 0);
  const multiTrajet = new Set(sessions.map(s => s.trajetId).filter(Boolean)).size > 1;

  const existing = document.getElementById('resolutionResaOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'resolutionResaOverlay';
  overlay.className = 'pdv-overlay';
  overlay.innerHTML = `
    <div class="pdv-overlay-backdrop" onclick="closeResolutionModal()"></div>
    <div class="pdv-overlay-panel" style="max-width:600px;">
      <div class="pdv-overlay-header">
        <div>
          <h2>${ICONS.warning} ${nbResas} réservation${nbResas > 1 ? 's' : ''} à traiter</h2>
          <p>${nbSessions} session${nbSessions > 1 ? 's' : ''} concernée${nbSessions > 1 ? 's' : ''}${multiTrajet ? ', sur plusieurs trajets' : ''} : réaffectez ces voyageurs vers un autre bus ou annulez leurs réservations avant de continuer.</p>
        </div>
        <button class="pdv-overlay-close" onclick="closeResolutionModal()">${ICONS.close}</button>
      </div>
      <div id="resolutionShortcutWrap"></div>
      <div id="resolutionSessionsList" style="display:flex;flex-direction:column;gap:10px;"></div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
  renderResolutionSessions();
}

export function closeResolutionModal() {
  const o = document.getElementById('resolutionResaOverlay');
  if (o) { o.classList.remove('show'); setTimeout(() => o.remove(), 300); }
  _resolutionContext  = null;
  _resolutionSessions = [];
}

function renderResolutionSessions() {
  const list = document.getElementById('resolutionSessionsList');
  const shortcutWrap = document.getElementById('resolutionShortcutWrap');
  if (!list) return;

  const restantes = _resolutionSessions.filter(s => !s.resolue);

  // ── Cas trajet : tous les bus vont disparaître, pas de réaffectation possible ──
  const suppressionTotale = _resolutionContext?.actionType === 'delete-trajet' ||
                             _resolutionContext?.actionType === 'statut-trajet';

  if (shortcutWrap) {
    if (suppressionTotale) {
      shortcutWrap.innerHTML = `
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin-bottom:14px;">
          <p style="font-size:12px;color:var(--muted);margin:0;">
            Tous les bus de ce trajet vont être ${_resolutionContext.actionType === 'delete-trajet' ? 'supprimés' : 'désactivés'}.
            La réaffectation n'est pas possible ici : annulez chaque réservation restante pour continuer.
          </p>
        </div>`;
    } else {
      let busCommun = null;
      if (restantes.length > 1) {
        const premiereListe = restantes[0].busesDisponibles.map(b => b.departId);
        const communs = premiereListe.filter(id =>
          restantes.every(s => s.busesDisponibles.some(b => b.departId === id))
        );
        if (communs.length > 0) {
          const bus = restantes[0].busesDisponibles.find(b => b.departId === communs[0]);
          busCommun = bus;
        }
      }

      const sessionsSansBus = restantes.filter(s => s.busesDisponibles.length === 0);

      shortcutWrap.innerHTML = `
        ${busCommun ? `
        <button class="pdv-action-btn" style="width:100%;margin-bottom:14px;" onclick="toutReaffecterVersResolution('${busCommun.departId}','${escapeJsAttr(busCommun.busNom)}')">
        ${ICONS.refresh} Tout réaffecter vers ${escapeHtml(busCommun.busNom)}
        </button>` : ''}
        ${sessionsSansBus.length > 0 ? `
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin-bottom:14px;">
          <p style="font-size:12px;color:var(--muted);margin:0 0 8px;">
            ${sessionsSansBus.length} session${sessionsSansBus.length > 1 ? 's n\'ont' : ' n\'a'} aucun bus de remplacement disponible sur ce trajet à la même date.
            Créez un nouveau bus (mêmes jours/heure que le bus désactivé) pour pouvoir réaffecter ces réservations.
          </p>
          <button class="pdv-action-btn" onclick="document.getElementById('resolutionResaOverlay')?.remove();closeTrajetDetail();openCreateDepart('${_resolutionContext?.trajetId}')">
            + Créer un bus de remplacement
          </button>
        </div>` : ''}
      `;
    }
  }

  if (restantes.length === 0) {
    list.innerHTML = `<div style="text-align:center;padding:16px;color:var(--accent);font-size:13px;">Toutes les sessions sont résolues, poursuite de l'action...</div>`;
    setTimeout(() => finaliserResolution(), 600);
    return;
  }

  const groupes = {};
  const ordreGroupes = [];
  restantes.forEach(s => {
    const key = s.trajetId || 'sans-trajet';
    if (!groupes[key]) { groupes[key] = []; ordreGroupes.push(key); }
    groupes[key].push(s);
  });

  const renderCarte = (s) => `
    <div class="resolution-session-card" style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:14px 16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <div>
        <div style="font-size:13px;font-weight:700;color:var(--white);">${escapeHtml(s.busNom || '')} · ${escapeHtml(s.date)} · ${escapeHtml(s.heureDepart)}</div>
        <div style="font-size:11.5px;color:var(--muted);margin-top:2px;">${Number(s.nbReservations) || 0} réservation${s.nbReservations > 1 ? 's' : ''}</div>
        </div>
        ${!suppressionTotale ? `
        <span class="pdv-status-badge ${s.busesDisponibles.length > 0 ? 'active' : 'inactive'}">
          ${s.busesDisponibles.length > 0 ? 'Bus de remplacement disponible' : 'Aucun bus dispo'}
        </span>` : ''}
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        ${(!suppressionTotale && s.busesDisponibles.length > 0) ? `
        <select class="pdv-select resolution-bus-select" id="resolutionSelect-${s.sessionId}" style="flex:1;min-width:180px;">
        ${s.busesDisponibles.map(b => `<option value="${escapeHtml(b.departId)}">${escapeHtml(b.busNom)} · ${escapeHtml(b.heureDepart || '')} · ${Number(b.placesLibres) || 0} place${b.placesLibres > 1 ? 's' : ''} libre${b.placesLibres > 1 ? 's' : ''}</option>`).join('')}
        </select>
        <button class="pdv-action-btn" style="flex-shrink:0;" onclick="reaffecterSessionResolution('${s.sessionId}')">
          ${ICONS.refresh} Réaffecter
        </button>` : ''}
        <button class="pdv-action-btn delete" style="flex-shrink:0;" onclick="annulerSessionResolution('${s.sessionId}')">
          Annuler ces réservations
        </button>
      </div>
    </div>`;

  list.innerHTML = ordreGroupes.map((key, idx) => {
    const items = groupes[key];
    const trajet = key !== 'sans-trajet' ? trajetList.find(t => t.id === key) : null;
    const titreGroupe = trajet ? `${escapeHtml(trajet.villeDepart)} → ${escapeHtml(trajet.villeArrivee)}` : 'Trajet inconnu';

    return `
      <div>
        <div style="display:flex;align-items:center;gap:8px;margin:${idx === 0 ? '0' : '18px'} 0 10px;">
          <span style="font-size:12px;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:.5px;">${titreGroupe}</span>
          <span style="flex:1;height:1px;background:var(--border);"></span>
          <span style="font-size:11px;color:var(--muted);">${items.length} session${items.length > 1 ? 's' : ''}</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${items.map(renderCarte).join('')}
        </div>
      </div>`;
  }).join('');
}

export async function reaffecterSessionResolution(sessionId) {
  const sel = document.getElementById(`resolutionSelect-${sessionId}`);
  const nouveauDepartId = sel?.value;
  if (!nouveauDepartId) return;

  try {
    const res = await apiFetch(`${BACKEND}/session/${sessionId}/reaffecter`, {
      method: 'POST',
      body: JSON.stringify({ nouveauDepartId }),
    });
    const data = await res.json();
    if (!res.ok) { showToast('Erreur lors de la réaffectation.', TOAST_ICONS.error); return; }

    const s = _resolutionSessions.find(x => x.sessionId === sessionId);
    if (s) s.resolue = true;
    showToast('Réservation réaffectée avec succès.', TOAST_ICONS.success, true);
    renderResolutionSessions();
  } catch (err) {
    showToast('Impossible de contacter le serveur.', TOAST_ICONS.error);
  }
}

export async function toutReaffecterVersResolution(nouveauDepartId, busNom) {
  const restantes = _resolutionSessions.filter(s => !s.resolue && s.busesDisponibles.some(b => b.departId === nouveauDepartId));
  let succes = 0;
  const echecs = [];

  for (const s of restantes) {
    try {
      const res = await apiFetch(`${BACKEND}/session/${s.sessionId}/reaffecter`, {
        method: 'POST',
        body: JSON.stringify({ nouveauDepartId }),
      });
      const data = await res.json();
      if (res.ok) { s.resolue = true; succes++; }
      else { echecs.push(s.date); }
    } catch (err) { echecs.push(s.date); }
  }

  if (echecs.length === 0) {
    showToast(`${succes} session(s) réaffectée(s) vers ${busNom}.`, TOAST_ICONS.success, true);
  } else if (succes === 0) {
    showToast(`Échec : capacité insuffisante sur ${busNom} pour ${echecs.length} session(s) (${echecs.join(', ')}).`, TOAST_ICONS.error, true);
  } else {
    showToast(`${succes} réaffectée(s), ${echecs.length} en échec (capacité insuffisante) : ${echecs.join(', ')}.`, TOAST_ICONS.warning, true);
  }

  renderResolutionSessions();
}

export async function annulerSessionResolution(sessionId) {
  const s = _resolutionSessions.find(x => x.sessionId === sessionId);
  const existing = document.getElementById('confirmAnnulerSessionOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'confirmAnnulerSessionOverlay';
  overlay.className = 'pdv-overlay';
  overlay.innerHTML = `
    <div class="pdv-overlay-backdrop" onclick="closeConfirmAnnulerSession()"></div>
    <div class="pdv-overlay-panel" style="max-width:480px;">
      <div class="pdv-overlay-header">
        <div>
          <h2>${ICONS.stop} Annuler ces réservations ?</h2>
          <p>${s ? `${escapeHtml(s.date)} ${s.heureDepart ? 'à ' + escapeHtml(s.heureDepart) : ''}` : ''}</p>
        </div>
        <button class="pdv-overlay-close" onclick="closeConfirmAnnulerSession()">${ICONS.close}</button>
      </div>
      <div id="annulResaListWrap" style="padding:0 0 8px;">
        <div style="text-align:center;padding:16px;color:var(--muted);font-size:12px;">Chargement des réservations...</div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));

  const wrap = document.getElementById('annulResaListWrap');
  try {
    const res = await apiFetch(`${BACKEND}/session/${sessionId}/reservations`);
    const data = await res.json();
    const reservations = data.reservations || [];
    const totalRembourse = reservations.reduce((sum, r) => sum + (r.montantRembourse || 0), 0);

    const rowsHTML = reservations.map(r => `
      <div class="pdv-detail-row">
        <div>
        <div style="font-size:13px;font-weight:600;color:var(--white);">${escapeHtml(r.prenomPassager || '')} ${escapeHtml(r.nomPassager || '')}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:2px;">${escapeHtml(r.telephonePassager || '—')} · ${Number(r.nbPassagers) || 0} place${r.nbPassagers > 1 ? 's' : ''}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:12px;color:var(--white);">${Number(r.prixTotal || 0).toLocaleString()} XAF</div>
          <div style="font-size:11px;color:${r.montantRembourse > 0 ? 'var(--accent)' : '#FF4D6A'};">${r.montantRembourse > 0 ? '− ' + Number(r.montantRembourse).toLocaleString() + ' XAF' : 'Aucun remboursement'}</div>
        </div>
      </div>`).join('');

    wrap.innerHTML = `
      <div class="pdv-detail-info" style="margin-top:0;max-height:280px;overflow-y:auto;">
        ${rowsHTML || '<div style="text-align:center;padding:12px;color:var(--muted);font-size:12px;">Aucune réservation trouvée.</div>'}
      </div>
      <div class="recap-total-row" style="margin-top:10px;">
        <span>${reservations.length} réservation${reservations.length > 1 ? 's' : ''} · Total à rembourser</span>
        <strong>${totalRembourse.toLocaleString()} XAF</strong>
      </div>
      <p style="font-size:11.5px;color:var(--muted);margin:10px 0 14px;">
        Le remboursement est calculé selon la politique d'annulation de l'agence.
        <span style="color:#FF4D6A;">Cette action ne peut pas être annulée.</span>
      </p>
      <div class="pdv-confirm-actions" style="margin-top:0;">
        <button class="pdv-btn-next delete-confirm" onclick="confirmAnnulerSessionResolution('${sessionId}')">Oui, annuler les réservations</button>
        <button class="pdv-btn-back" onclick="closeConfirmAnnulerSession()">Retour</button>
      </div>
    `;
  } catch (err) {
    wrap.innerHTML = `<div style="text-align:center;padding:16px;color:#FF4D6A;font-size:12px;">Impossible de charger les réservations.</div>`;
  }
}

export function closeConfirmAnnulerSession() {
  const o = document.getElementById('confirmAnnulerSessionOverlay');
  if (o) { o.classList.remove('show'); setTimeout(() => o.remove(), 300); }
}

export async function confirmAnnulerSessionResolution(sessionId) {
  closeConfirmAnnulerSession();
  try {
    const res = await apiFetch(`${BACKEND}/session/${sessionId}/annuler-toutes`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) { showToast('Erreur lors de l\'annulation.', TOAST_ICONS.error); return; }

    const s = _resolutionSessions.find(x => x.sessionId === sessionId);
    if (s) s.resolue = true;
    showToast('Réservations annulées avec succès.', TOAST_ICONS.success, true);
    renderResolutionSessions();
  } catch (err) {
    showToast('Impossible de contacter le serveur.', TOAST_ICONS.error);
  }
}

async function finaliserResolution() {
  const o = document.getElementById('resolutionResaOverlay');
  if (o) { o.classList.remove('show'); setTimeout(() => o.remove(), 300); }

  const ctx = _resolutionContext;
  if (!ctx) return;

  if (ctx.actionType === 'delete') {
    await deleteDepart(ctx.departId, ctx.trajetId);
  } else if (ctx.actionType === 'statut') {
    await confirmToggleDepartStatut(ctx.departId, ctx.trajetId, ctx.nouvelEtat);
  } else if (ctx.actionType === 'vehicule-delete') {
    try {
      const res = await apiFetch(`${BACKEND}/vehicule/${ctx.vehiculeId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { showToast('Erreur lors de la suppression du véhicule.', TOAST_ICONS.error); return; }
      showToast('Véhicule supprimé avec succès.', TOAST_ICONS.success, true);
      closeTrajetDetail();
      setTimeout(() => openTrajetDetail(ctx.trajetId, 'bus'), 400);
    } catch (err) {
      showToast('Impossible de contacter le serveur.', TOAST_ICONS.error);
    }
  } else if (ctx.actionType === 'vehicule-statut') {
    try {
      const res = await apiFetch(`${BACKEND}/vehicule/${ctx.vehiculeId}/statut`, {
        method: 'PATCH',
        body: JSON.stringify({ actif: ctx.nouvelEtat }),
      });
      const data = await res.json();
      if (!res.ok) { showToast('Erreur lors du changement de statut du véhicule.', TOAST_ICONS.error); return; }
      showToast(ctx.nouvelEtat ? 'Véhicule activé avec succès.' : 'Véhicule désactivé avec succès.', TOAST_ICONS.success, true);
      closeTrajetDetail();
      setTimeout(() => openTrajetDetail(ctx.trajetId, 'bus'), 400);
    } catch (err) {
      showToast('Impossible de contacter le serveur.', TOAST_ICONS.error);
    }
  } else if (ctx.actionType === 'delete-trajet') {
    try {
      const res = await apiFetch(`${BACKEND}/trajet/${ctx.trajetId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { showToast('Erreur lors de la suppression du trajet.', TOAST_ICONS.error); return; }
      invalidateDeparts(ctx.trajetId);
      invalidateAllDepartsCache();
      setTrajetList(trajetList.filter(t => t.id !== ctx.trajetId));
      renderTrajetsPage();
      updateOverviewStats();
      showToast('Trajet supprimé avec succès.', TOAST_ICONS.success, true);
    } catch (err) {
      showToast('Impossible de contacter le serveur.', TOAST_ICONS.error);
    }
  } else if (ctx.actionType === 'statut-trajet') {
    try {
      const res = await apiFetch(`${BACKEND}/trajet/${ctx.trajetId}/statut`, {
        method: 'PATCH',
        body: JSON.stringify({ actif: ctx.nouvelEtat }),
      });
      const data = await res.json();
      if (!res.ok) { showToast('Erreur lors du changement de statut du trajet.', TOAST_ICONS.error); return; }

      invalidateDeparts(ctx.trajetId);
      invalidateAllDepartsCache();
      const trajet = trajetList.find(t => t.id === ctx.trajetId);
      if (trajet) trajet.actif = ctx.nouvelEtat;
      renderTrajetsPage();
      updateOverviewStats();
      showToast(ctx.nouvelEtat ? 'Trajet activé avec succès.' : 'Trajet désactivé avec succès.', ctx.nouvelEtat ? TOAST_ICONS.success : TOAST_ICONS.error, ctx.nouvelEtat);
      closeTrajetDetail();
      setTimeout(() => openTrajetDetail(ctx.trajetId), 400);
    } catch (err) {
      showToast('Impossible de contacter le serveur.', TOAST_ICONS.error);
    }
  }
  _resolutionContext = null;
  _resolutionSessions = [];
}

// ════════════════════════════════
//  SESSIONS — GÉNÉRER
// ════════════════════════════════
export async function genererSessions(departId) {
  try {
    const res = await apiFetch(`${BACKEND}/depart/${departId}/generer-sessions`, {
      method: 'POST',
      body: JSON.stringify({ nbJours: 14 }),
    });
    const data = await res.json();
    if (!res.ok) { showToast('Erreur lors de la génération des sessions.', TOAST_ICONS.error); return; }
    showToast('Sessions générées avec succès.', TOAST_ICONS.success, true);
  } catch (err) {
    showToast('Impossible de contacter le serveur.', TOAST_ICONS.error);
  }
}

export async function handleGenererSessions(departId) {
  const btn = document.getElementById('genererBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Génération...'; }

  try {
    const res = await apiFetch(`${BACKEND}/depart/${departId}/generer-sessions`, {
      method: 'POST',
      body: JSON.stringify({ nbJours: 14 }),
    });
    const data = await res.json();
    if (!res.ok) { showToast('Erreur lors de la génération des sessions.', TOAST_ICONS.error); return; }
    showToast('Sessions générées avec succès.', TOAST_ICONS.success, true);

    const busOverlay = document.getElementById('busDetailOverlay');
    if (busOverlay) {
      const tId    = busOverlay.dataset.trajetId;
      const trajet = trajetList.find(t => t.id === tId);
      await loadBusSessions(departId, trajet?.typeTrajet === 'arrets', trajet);
    }
  } catch (err) {
    showToast('Impossible de contacter le serveur.', TOAST_ICONS.error);
  } finally {
    if (btn) { btn.innerHTML = `${ICONS.refresh} Générer les sessions`; }
  }
}

// ════════════════════════════════
//  EXPOSER AU HTML
// ════════════════════════════════
window.openCreateDepart          = openCreateDepart;
window.onVehiculeSelectChange    = onVehiculeSelectChange;
window.refreshVehiculeSelectAfterCreate = refreshVehiculeSelectAfterCreate;
window.closeCreateDepart         = closeCreateDepart;
window.submitCreateDepart        = submitCreateDepart;
window.openEditDepart            = openEditDepart;
window.closeEditDepart           = closeEditDepart;
window.submitEditDepart          = submitEditDepart;
window.confirmDeleteDepart       = confirmDeleteDepart;
window.closeDepartDelete         = closeDepartDelete;
window.deleteDepart              = deleteDepart;
window.toggleDepartStatut        = toggleDepartStatut;
window.closeStatutDepart         = closeStatutDepart;
window.confirmToggleDepartStatut = confirmToggleDepartStatut;
window.openBusDetail             = openBusDetail;
window.closeBusDetail            = closeBusDetail;
window.genererSessions           = genererSessions;
window.handleGenererSessions     = handleGenererSessions;
window.toggleTousJours           = toggleTousJours;
window.toggleJour                = toggleJour;
window.openResolutionReservationsModal = openResolutionReservationsModal;
window.reaffecterSessionResolution     = reaffecterSessionResolution;
window.toutReaffecterVersResolution    = toutReaffecterVersResolution;
window.annulerSessionResolution        = annulerSessionResolution;
window.closeResolutionModal = closeResolutionModal;
window.closeConfirmAnnulerSession    = closeConfirmAnnulerSession;
window.confirmAnnulerSessionResolution = confirmAnnulerSessionResolution;