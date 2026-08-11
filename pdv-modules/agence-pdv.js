// ─── TRAVIO — PDV — Agence (chargement des données agence, politique d'annulation) ───

import { apiFetch } from '../api.js';
import { ICONS, BACKEND, agenceData, setAgenceData } from './state-pdv.js';

export async function loadAgenceData(agenceId) {
  try {
    const res  = await apiFetch(`${BACKEND}/agence/${agenceId}`);
    const data = await res.json();
    if (!res.ok) return;
    setAgenceData(data);
    renderPolitiqueAnnulPDV();
    const infoAgence = document.getElementById('infoAgence');
    if (infoAgence) infoAgence.textContent = data.nom || '—';
  } catch (err) {
    console.error('Erreur agence :', err);
  }
}

export function renderPolitiqueAnnulPDV() {
  const el = document.getElementById('accueilPolitiqueAnnul');
  if (!el || !agenceData?.politiqueAnnulation) return;
  const pol = agenceData.politiqueAnnulation;
  let label, cls;
  if (!pol.autorise) {
    label = `${ICONS.lock} Vente définitive — aucune annulation`;
    cls = 'pol-badge-rouge';
  } else if (!pol.remboursement) {
    label = `${ICONS.warning} Annulation sans remboursement${pol.delaiHeures ? ' · délai ' + escapeHtml(String(pol.delaiHeures)) + 'h' : ''}`;
    cls = 'pol-badge-orange';
  } else {
    label = `${ICONS.check} Annulation avec remboursement · ${escapeHtml(String(pol.precisions || 0))}% retenus · délai ${escapeHtml(String(pol.delaiHeures || '?'))}h`;
    cls = 'pol-badge-vert';
  }
  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:12px 16px;margin-bottom:4px;">
      <span style="font-size:12px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.8px;">Politique d'annulation</span>
      <span class="pol-badge ${cls}">${label}</span>
    </div>`;
}

// ════════════════════════════════
//  VALIDITÉ RÉELLE DE L'ESSAI (PDV)
// ════════════════════════════════
export function isEssaiActifEtValide() {
  if (agenceData?.exempte) return true;
  const essai = agenceData?.essai;
  if (!essai || !essai.actif) return false;
  if (essai.dateFin && new Date(essai.dateFin) < new Date()) return false;
  return true;
}

export function showLockedOverlayPDV() {
  const existing = document.getElementById('lockedOverlayPDV');
  if (existing) return; // évite les doublons

  const overlay = document.createElement('div');
  overlay.id = 'lockedOverlayPDV';
  overlay.className = 'congrats-overlay';
  overlay.innerHTML = `
    <div class="congrats-backdrop"></div>
    <div class="congrats-card" style="max-width:420px;">
      <div class="congrats-text">
        <div class="congrats-badge" style="background:rgba(255,77,106,0.1);border-color:rgba(255,77,106,0.2);color:#FF4D6A;">${ICONS.lock} Accès suspendu</div>
        <h2 style="font-size:18px;">L'accès de votre agence est suspendu</h2>
        <p>La période d'essai de votre agence est terminée. Contactez l'agence ou notre équipe pour réactiver l'accès.</p>
        <p style="margin-top:10px;font-weight:600;">📞 064 98 85 61 / 044 58 17 11</p>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
}