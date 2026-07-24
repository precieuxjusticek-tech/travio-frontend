// ─── TRAVIO — Sessions ───

import { BACKEND, trajetList } from './state.js';
import { showToast, TOAST_ICONS } from './toast-utils.js';

const ICONS = {
  close:    '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  refresh:  '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:3px;"><path d="M13 8A5 5 0 103 8M13 8V4M13 8H9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  banned:   '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:3px;"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.4"/><path d="M4 4l8 8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  wrench:   '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:3px;"><path d="M10 3a3 3 0 00-3.9 3.6L2 10.7v2.3h2.3l4.1-4.1A3 3 0 0013 6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  person:   '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:3px;"><circle cx="8" cy="6" r="3" stroke="currentColor" stroke-width="1.3"/><path d="M2 15a6 6 0 0112 0" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
  warning:  '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:3px;"><path d="M8 2L1 14h14L8 2z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M8 6.5v3.5M8 12v.1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  question: '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:3px;"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.4"/><path d="M6 6a2 2 0 013.5 1.3c0 1.3-1.7 1.5-1.7 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="8" cy="12" r="0.4" fill="currentColor"/></svg>',
  clock:    '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:3px;"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.4"/><path d="M8 5v3.5l2.5 1.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  map:      '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:3px;"><path d="M1 4l5-1.5 4 1.5 5-1.5v10l-5 1.5-4-1.5-5 1.5V4z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>',
  edit:     '<svg width="12" height="12" viewBox="0 0 14 14" fill="none" style="vertical-align:-2px;margin-right:3px;"><path d="M9 2l3 3L4 13H1v-3L9 2z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  save:     '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:4px;"><path d="M3 2h8l2.5 2.5V13a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M5 2v4h5V2M4.5 9.5h7v4.5h-7z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>',
};

// ════════════════════════════════
//  SESSIONS — CHARGEMENT & RENDU
// ════════════════════════════════
export async function loadBusSessions(departId, hasArrets, trajet) {
  const container = document.getElementById('busSessionsList');
  if (!container) return;

  try {
    const res      = await fetch(`${BACKEND}/sessions?departId=${departId}`);
    const data     = await res.json();
    const sessions = data.sessions || [];

    if (sessions.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:20px;color:var(--muted);font-size:12px;background:var(--surface);border-radius:10px;">
          Aucune session — cliquez sur "Générer les sessions"
        </div>`;
      const genBtn = document.getElementById('genererBtn');
      if (genBtn) {
        genBtn.disabled = false;
        genBtn.style.opacity = '1';
        genBtn.title = '';
      }
      return;
    }

    const jours = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];

    // Stocker les données de sessions pour openEditSessionById
    window._sessionsData = {};
    sessions.forEach(s => {
      window._sessionsData[s.id] = {
        arretsDisponibles: trajet?.arrets || [],
        arretsActifs:      s.arretsActifs || [],
        heureDepart:       s.heureDepart,
        heureArrivee:      s.heureArrivee || null,
        dureeEstimee:      s.dureeEstimee || null,
      };
    });

    // ── Calcul nb jours non couverts pour activer le bouton Générer ──
    const OFFSET_MS       = 1 * 60 * 60 * 1000;
    const datesExistantes = new Set(sessions.map(s => s.date));
    let joursNonCouverts  = 0;
    for (let i = 0; i < 14; i++) {
      const ms      = Date.now() + OFFSET_MS + i * 24 * 60 * 60 * 1000;
      const dateStr = new Date(ms).toISOString().split('T')[0];
      if (!datesExistantes.has(dateStr)) joursNonCouverts++;
    }

    const genBtn = document.getElementById('genererBtn');
    if (genBtn) {
      if (joursNonCouverts <= 5) {
        genBtn.disabled      = false;
        genBtn.style.opacity = '1';
        genBtn.title         = '';
      } else {
        genBtn.disabled      = true;
        genBtn.style.opacity = '0.4';
        genBtn.title         = `${joursNonCouverts} jours restants — disponible quand il en reste 5 ou moins`;
      }
    }

    const causeLabels = {
      panne:            `${ICONS.wrench} Panne mécanique`,
      chauffeur_absent: `${ICONS.person} Chauffeur absent`,
      accident:         `${ICONS.warning} Accident`,
      autre:            `${ICONS.question} Autre problème`,
    };

    container.innerHTML = sessions.map(s => {
      const dateObj   = new Date(s.date + 'T00:00:00');
      const jourLabel = jours[dateObj.getDay()];
      const arretsLabel = (s.arretsActifs || []).map(a => a.ville || a.nom).join(' → ') || '—';

      let horaire = s.heureDepart || '—';
      if (s.heureArrivee)  horaire += ` → ${s.heureArrivee}`;
      if (s.dureeEstimee)  horaire += ` · ${s.dureeEstimee}`;

      return `
        <div style="
          background:var(--surface);
          border:1px solid ${s.statut === 'annulée' ? '#FF4D6A44' : 'var(--border)'};
          border-radius:11px;
          padding:12px 14px;
          margin-bottom:8px;
          ${s.statut === 'annulée' ? 'opacity:0.75;' : ''}
        ">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
            <div>
              <span style="font-size:10px;color:var(--accent);font-weight:700;text-transform:uppercase;">${jourLabel}</span>
              <span style="font-size:13px;font-weight:700;color:var(--white);margin-left:8px;">${s.date}</span>
            </div>
            <div style="display:flex;align-items:center;gap:6px;">
              ${s.statut === 'annulée'
                ? `<span style="font-size:11px;color:#FF4D6A;font-weight:700;background:#FF4D6A22;padding:3px 8px;border-radius:6px;">${ICONS.banned} Annulée</span>`
                : `<span style="color:${s.placesRestantes > 0 ? 'var(--accent)' : '#FF4D6A'};font-size:12px;font-weight:700;">${s.placesRestantes}/${s.placesTotal} places</span>`
              }
            </div>
          </div>

          <div style="font-size:12px;color:var(--muted);margin-bottom:6px;">${ICONS.clock} ${horaire}</div>

          ${s.statut === 'annulée' && s.causeAnnulation ? `
          <div style="font-size:11px;color:#FF4D6A;margin-bottom:8px;background:#FF4D6A11;padding:6px 10px;border-radius:6px;">
            ${causeLabels[s.causeAnnulation] || s.causeAnnulation}
            ${s.detailsIncident ? `<br><span style="color:var(--muted);font-size:10px;">${s.detailsIncident}</span>` : ''}
          </div>` : ''}

          ${hasArrets && s.statut !== 'annulée' ? `
          <div style="font-size:11px;color:var(--muted);margin-bottom:8px;">
            ${ICONS.map} Arrêts : ${arretsLabel}
          </div>` : ''}

          ${s.statut !== 'annulée' ? `
          <button onclick="openEditSessionById('${s.id}')"
            class="pdv-action-btn" style="font-size:11px;padding:7px 12px;width:100%;margin-bottom:6px;">
            ${ICONS.edit} Modifier cette session
          </button>
          <button onclick="openIncidentSession('${s.id}', '${s.date}')"
            class="pdv-action-btn danger" style="font-size:11px;padding:7px 12px;width:100%;">
            ${ICONS.banned} Signaler un incident
          </button>` : ''}
        </div>`;
    }).join('');

  } catch (err) {
    container.innerHTML = `<div style="color:#FF4D6A;text-align:center;font-size:12px;">Erreur de chargement.</div>`;
  }
}

// ════════════════════════════════
//  SESSION — SUPPRIMER
// ════════════════════════════════
export async function deleteSession(sessionId, departId) {
  if (!confirm('Supprimer cette session ?')) return;
  try {
    const res  = await fetch(`${BACKEND}/session/${sessionId}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { showToast(data.message || 'Erreur suppression.', TOAST_ICONS.error); return; }
    showToast('Session supprimée.', TOAST_ICONS.success, true);
    // Recharger via le busDetailOverlay si ouvert
    const busOverlay = document.getElementById('busDetailOverlay');
    if (busOverlay) {
      const tId    = busOverlay.dataset.trajetId;
      const trajet = trajetList.find(t => t.id === tId);
      await loadBusSessions(departId, trajet?.typeTrajet === 'arrets', trajet);
    }
  } catch (err) {
    showToast('Impossible de contacter le serveur.', TOAST_ICONS.error);
  }
}

// ════════════════════════════════
//  SESSION — MODIFIER
// ════════════════════════════════
export function openEditSession(sessionId, arretsDisponibles, heureActuelle, arretsActifs, heureArriveeActuelle) {
  arretsDisponibles    = arretsDisponibles    || [];
  arretsActifs         = arretsActifs         || [];
  heureArriveeActuelle = heureArriveeActuelle || '';

  const arretsActifsNoms = arretsActifs.map(a => a.nom);

  const overlay = document.createElement('div');
  overlay.id = 'editSessionOverlay';
  overlay.className = 'pdv-overlay';
  overlay.innerHTML = `
    <div class="pdv-overlay-backdrop" onclick="closeEditSession()"></div>
    <div class="pdv-overlay-panel" style="max-width:480px;">
      <div class="pdv-overlay-header">
        <div>
          <h2>${ICONS.edit} Modifier la session</h2>
          <p>Les modifications s'appliquent à ce jour uniquement</p>
        </div>
        <button class="pdv-overlay-close" onclick="closeEditSession()">${ICONS.close}</button>
      </div>
      <div class="pdv-create-fields">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="pdv-field-group">
            <label>Heure de départ</label>
            <input type="time" class="pdv-input" id="editSession-heure" value="${heureActuelle || ''}">
          </div>
          <div class="pdv-field-group">
            <label>Heure d'arrivée</label>
            <input type="time" class="pdv-input" id="editSession-heure-arrivee" value="${heureArriveeActuelle}">
          </div>
        </div>
        <div class="pdv-field-group">
          <label>Durée estimée</label>
          <input type="text" class="pdv-input" id="editSession-duree" readonly
            placeholder="Calculée automatiquement" style="opacity:0.6;cursor:default;">
        </div>
        ${arretsDisponibles.length > 0 ? `
        <div class="pdv-field-group">
          <label>Arrêts actifs pour ce jour</label>
          <p class="pdv-field-hint">Décochez les arrêts que le bus ne dessert pas ce jour.</p>
          <div style="display:flex;flex-direction:column;gap:8px;margin-top:4px;">
            ${arretsDisponibles.map(a => `
              <label class="pdv-multi-item">
                <input type="checkbox" value="${a.nom}" class="session-arret-check"
                  ${arretsActifsNoms.includes(a.nom) ? 'checked' : ''}>
                <span class="pdv-multi-label">
                  <strong>${a.nom}</strong>
                  <small>${a.type === 'pdv' ? 'PDV' : 'Lieu'}</small>
                </span>
              </label>`).join('')}
          </div>
        </div>` : ''}
      </div>
      <button class="pdv-btn-next" id="editSessionBtn" onclick="submitEditSession('${sessionId}')">
        ${ICONS.save} Sauvegarder
      </button>
    </div>
  `;

  overlay.dataset.arretsJson = JSON.stringify(arretsDisponibles);
  document.body.appendChild(overlay);

  const calcDuree = () => {
    const dep = document.getElementById('editSession-heure')?.value;
    const arr = document.getElementById('editSession-heure-arrivee')?.value;
    if (!dep || !arr) return;
    const [dH, dM] = dep.split(':').map(Number);
    const [aH, aM] = arr.split(':').map(Number);
    let diff = (aH * 60 + aM) - (dH * 60 + dM);
    if (diff < 0) diff += 24 * 60;
    document.getElementById('editSession-duree').value =
      `${Math.floor(diff / 60)}h${String(diff % 60).padStart(2, '0')}`;
  };
  document.getElementById('editSession-heure').addEventListener('change', calcDuree);
  document.getElementById('editSession-heure-arrivee').addEventListener('change', calcDuree);

  requestAnimationFrame(() => overlay.classList.add('show'));
}

export function closeEditSession() {
  const o = document.getElementById('editSessionOverlay');
  if (o) { o.classList.remove('show'); setTimeout(() => o.remove(), 350); }
}

export async function submitEditSession(sessionId) {
  const heureDepart  = document.getElementById('editSession-heure')?.value;
  const overlay = document.getElementById('editSessionOverlay');
  const arretsDisponibles = JSON.parse(overlay?.dataset.arretsJson || '[]');
  const checks = [...document.querySelectorAll('.session-arret-check:checked')];
  const arretsActifs = checks.map(c => {
    const found = arretsDisponibles.find(a => a.nom === c.value);
    return found ? { nom: found.nom, type: found.type, id: found.id || null, ville: found.ville || '' } : { nom: c.value };
  });

  const btn = document.getElementById('editSessionBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Sauvegarde...'; }

  try {
    const res  = await fetch(`${BACKEND}/session/${sessionId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        arretsActifs,
        heureDepart,
        heureArrivee: document.getElementById('editSession-heure-arrivee')?.value || null,
        dureeEstimee: document.getElementById('editSession-duree')?.value          || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.message || 'Erreur.', TOAST_ICONS.error); return; }

    closeEditSession();
    showToast('Session modifiée avec succès !', TOAST_ICONS.success, true);

    const busOverlay = document.getElementById('busDetailOverlay');
    if (busOverlay) {
      const dId    = busOverlay.dataset.departId;
      const tId    = busOverlay.dataset.trajetId;
      const trajet = trajetList.find(t => t.id === tId);
      await loadBusSessions(dId, trajet?.typeTrajet === 'arrets', trajet);
    }

  } catch (err) {
    showToast('Impossible de contacter le serveur.', TOAST_ICONS.error);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = `${ICONS.save} Sauvegarder`; }
  }
}

export function openEditSessionById(sessionId) {
  const d = window._sessionsData?.[sessionId];
  if (!d) return;
  openEditSession(sessionId, d.arretsDisponibles, d.heureDepart, d.arretsActifs, d.heureArrivee);
}

// ════════════════════════════════
//  SESSION — INCIDENT
// ════════════════════════════════
export function openIncidentSession(sessionId, dateSession) {
  const overlay = document.createElement('div');
  overlay.id = 'incidentSessionOverlay';
  overlay.className = 'pdv-overlay';
  overlay.innerHTML = `
    <div class="pdv-overlay-backdrop" onclick="closeIncidentSession()"></div>
    <div class="pdv-overlay-panel" style="max-width:460px;">
      <div class="pdv-overlay-header">
        <div>
          <h2>${ICONS.banned} Signaler un incident</h2>
          <p>Session du ${dateSession}</p>
        </div>
        <button class="pdv-overlay-close" onclick="closeIncidentSession()">${ICONS.close}</button>
      </div>
      <div class="pdv-create-fields">
        <div class="pdv-field-group">
          <label>Cause de l'annulation <span class="req">*</span></label>
          <select class="pdv-select" id="incidentCause" onchange="
            const btn = document.getElementById('incidentSubmitBtn');
            if (this.value) { btn.disabled = false; btn.style.opacity = '1'; btn.style.cursor = 'pointer'; }
            else { btn.disabled = true; btn.style.opacity = '0.4'; btn.style.cursor = 'not-allowed'; }
          ">
            <option value="">Sélectionner une cause</option>
            <option value="panne">Panne mécanique</option>
            <option value="chauffeur_absent">Chauffeur absent</option>
            <option value="accident">Accident</option>
            <option value="autre">Autre problème</option>
          </select>
        </div>
        <div class="pdv-field-group">
          <label>Détails supplémentaires</label>
          <textarea class="ob-textarea" id="incidentDetails" rows="3"
            placeholder="Ex : Le moteur a lâché au départ, réparation prévue demain..."></textarea>
        </div>
      </div>
      <div style="background:#FF4D6A11;border:1px solid #FF4D6A33;border-radius:10px;padding:12px 14px;margin-bottom:16px;">
        <p style="font-size:12px;color:#FF4D6A;margin:0;">
          ${ICONS.warning} Cette session sera marquée comme annulée. Cette action ne peut pas être annulée.
        </p>
      </div>
      <button class="pdv-btn-next delete-confirm" id="incidentSubmitBtn"
        onclick="submitIncidentSession('${sessionId}')"
        style="opacity:0.4;cursor:not-allowed;" disabled>
        ${ICONS.banned} Confirmer l'annulation
      </button>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
}

export function closeIncidentSession() {
  const o = document.getElementById('incidentSessionOverlay');
  if (o) { o.classList.remove('show'); setTimeout(() => o.remove(), 350); }
}

export async function submitIncidentSession(sessionId) {
  const cause   = document.getElementById('incidentCause')?.value;
  const details = document.getElementById('incidentDetails')?.value.trim();

  if (!cause) { showToast('Sélectionnez une cause.', TOAST_ICONS.warning); return; }

  const btn = document.getElementById('incidentSubmitBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Enregistrement...'; }

  try {
    const res  = await fetch(`${BACKEND}/session/${sessionId}/incident`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ cause, details }),
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.message || 'Erreur.', TOAST_ICONS.error); return; }

    closeIncidentSession();
    showToast('Incident enregistré. Session annulée.', TOAST_ICONS.banned || ICONS.banned, false);

    const busOverlay = document.getElementById('busDetailOverlay');
    if (busOverlay) {
      const dId    = busOverlay.dataset.departId;
      const tId    = busOverlay.dataset.trajetId;
      const trajet = trajetList.find(t => t.id === tId);
      await loadBusSessions(dId, trajet?.typeTrajet === 'arrets', trajet);
    }

  } catch (err) {
    showToast('Impossible de contacter le serveur.', TOAST_ICONS.error);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = `${ICONS.banned} Confirmer l'annulation`; }
  }
}

// ════════════════════════════════
//  EXPOSER AU HTML
// ════════════════════════════════
window.openEditSession      = openEditSession;
window.closeEditSession     = closeEditSession;
window.submitEditSession    = submitEditSession;
window.openEditSessionById  = openEditSessionById;
window.openIncidentSession  = openIncidentSession;
window.closeIncidentSession = closeIncidentSession;
window.submitIncidentSession = submitIncidentSession;
window.deleteSession        = deleteSession;