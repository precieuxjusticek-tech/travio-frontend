// ─── TRAVIO — Configuration des billets ───

import { BACKEND, agenceData, setAgenceData } from './state.js';
import { ensureCssInjected, buildTicketHTML, formatFromMode } from './billet-template.js';
import { showToast, TOAST_ICONS } from './toast-utils.js';
// À ajouter avec les autres imports
import { apiFetch } from './api.js';
import { escapeHtml } from './sanitize.js';

const MANUAL_PREVIEW_CSS = `
<style id="manualPreviewStyles">
  .mp-phone{width:260px;background:#0B1220;border-radius:20px;overflow:hidden;box-shadow:0 8px 26px rgba(11,18,32,0.35);margin:0 auto;}
  .mp-topbar{padding:12px 14px 8px;display:flex;align-items:center;gap:8px;border-bottom:1px solid rgba(255,255,255,0.08);}
  .mp-brand{color:#fff;font-weight:800;font-size:12px;letter-spacing:0.5px;font-family:'Syne',sans-serif;}
  .mp-brand span{color:#14B8A6;}
  .mp-agence{margin-left:auto;font-size:9.5px;color:#8B94A8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:110px;}
  .mp-banner{margin:10px 12px 0;background:rgba(20,184,166,0.12);border:1px solid rgba(20,184,166,0.35);border-radius:8px;padding:7px 10px;font-size:10px;color:#14B8A6;}
  .mp-content{padding:12px 14px 16px;}
  .mp-title{color:#fff;font-size:13px;font-weight:800;margin:10px 0 3px;font-family:'Syne',sans-serif;}
  .mp-subtitle{color:#8B94A8;font-size:9.5px;margin-bottom:12px;line-height:1.4;}
  .mp-field{background:#131C31;border-radius:9px;padding:9px 11px;margin-bottom:7px;}
  .mp-field .mp-label{font-size:8px;color:#8B94A8;text-transform:uppercase;letter-spacing:0.4px;}
  .mp-field .mp-value{font-size:11.5px;font-weight:700;color:#fff;margin-top:2px;}
  .mp-field.mp-big{background:linear-gradient(120deg,#14B8A6 0%,#0B7A9E 100%);padding:12px;}
  .mp-field.mp-big .mp-label{color:rgba(255,255,255,0.85);}
  .mp-field.mp-big .mp-value{font-size:13px;color:#fff;text-align:center;margin-top:4px;}
  .mp-row2{display:flex;gap:7px;}
  .mp-row2 .mp-field{flex:1;}
  .mp-btn{width:100%;margin-top:9px;background:#fff;color:#0B1220;border:none;border-radius:9px;padding:9px;font-size:10.5px;font-weight:800;text-align:center;}
</style>`;

let manualCssInjected = false;
function ensureManualCssInjected() {
  if (manualCssInjected) return;
  if (!document.getElementById('manualPreviewStyles')) {
    document.head.insertAdjacentHTML('beforeend', MANUAL_PREVIEW_CSS);
  }
  manualCssInjected = true;
}

function buildManualPreviewHTML() {
  const nomAgence   = escapeHtml(agenceData?.nom   || 'Votre agence');
  const villeAgence = escapeHtml(agenceData?.ville || '');
  return `
    <div class="mp-phone">
      <div class="mp-topbar">
        <div class="mp-brand">TRA<span>VIO</span></div>
        <div class="mp-agence">${nomAgence}${villeAgence ? ' — ' + villeAgence : ''}</div>
      </div>
      <div class="mp-banner">⚠️ Pas d'imprimante configurée</div>
      <div class="mp-content">
        <div class="mp-title">Billet à recopier</div>
        <div class="mp-subtitle">Reportez ces informations sur le carnet papier, puis apposez le cachet.</div>
        <div class="mp-field mp-big">
          <div class="mp-label">Trajet</div>
          <div class="mp-value">Brazzaville → Pointe-Noire</div>
        </div>
        <div class="mp-row2">
          <div class="mp-field"><div class="mp-label">Date</div><div class="mp-value">14/07/26</div></div>
          <div class="mp-field"><div class="mp-label">Départ</div><div class="mp-value">07h30</div></div>
        </div>
        <div class="mp-row2">
          <div class="mp-field"><div class="mp-label">Bus / Siège</div><div class="mp-value">04 — S12</div></div>
          <div class="mp-field"><div class="mp-label">Passagers</div><div class="mp-value">1</div></div>
        </div>
        <div class="mp-field"><div class="mp-label">Prix</div><div class="mp-value">15 000 XAF</div></div>
        <div class="mp-btn">📋 Copier les informations</div>
      </div>
    </div>`;
}

// ── État local du formulaire (pas encore sauvegardé) ──
let selectedMode   = null; // 'machine_a4a5' | 'machine_thermique' | 'manuel'
let selectedDesign = null; // 'sobre' | 'colore' | null
let initialized     = false; // pour ne charger la config sauvegardée qu'une fois

const MODES = [
  {
    id: 'machine_a4a5',
    titre: 'Imprimante A4 / A5',
    desc: "Billet complet imprimé sur feuille, avec toutes les informations du voyage.",
    besoinDesign: true,
    icon: `<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="3" y="2" width="16" height="18" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M6 6h10M6 10h10M6 14h6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'machine_thermique',
    titre: 'Imprimante thermique 80mm',
    desc: "Reçu compact façon ticket de caisse, imprimé sur rouleau thermique.",
    besoinDesign: true,
    icon: `<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M5 2h12v16l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5-2 1.5V2z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M7.5 6h7M7.5 9h7M7.5 12h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'manuel',
    titre: 'Aucune impression (manuel)',
    desc: "Pas de billet imprimé — l'agent communique les informations directement au passager.",
    besoinDesign: false,
    icon: `<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M4 18l3-1 9-9-2-2-9 9-1 3z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>`,
  },
];

const DESIGNS = [
  { id: 'sobre',  titre: 'Sobre',  desc: 'Look professionnel, noir & blanc, discret.' },
  { id: 'colore', titre: 'Coloré', desc: 'Dégradé teal/bleu, plus visuel et moderne.' },
];

// ════════════════════════════════
//  RENDU DE LA PAGE
// ════════════════════════════════
export function renderBilletConfigPage() {
  const container = document.getElementById('billetConfigContainer');
  if (!container) return;

  ensureCssInjected();

  // Ne charge la config sauvegardée qu'une seule fois (pour ne pas écraser une sélection en cours)
  if (!initialized) {
    const saved = agenceData?.billetConfig;
    selectedMode   = saved?.mode   || null;
    selectedDesign = saved?.design || null;
    initialized = true;
  }

  const dejaConfigure = !!agenceData?.billetConfig?.configuredAt;
  const modeObj = MODES.find(m => m.id === selectedMode);

  const modesHtml = MODES.map(m => {
    const actif = m.id === selectedMode;
    return `
      <div onclick="selectBilletMode('${m.id}')" style="
        cursor:pointer;background:${actif ? 'rgba(0,229,160,0.06)' : 'var(--surface)'};
        border:1.5px solid ${actif ? 'rgba(0,229,160,0.4)' : 'var(--border)'};
        border-radius:14px;padding:16px;display:flex;gap:12px;align-items:flex-start;
        transition:border-color .18s,background .18s;">
        <div style="width:40px;height:40px;border-radius:10px;flex-shrink:0;display:flex;align-items:center;justify-content:center;
          background:${actif ? 'rgba(0,229,160,0.14)' : 'var(--surface2)'};color:${actif ? 'var(--accent)' : 'var(--muted)'};">
          ${m.icon}
        </div>
        <div style="min-width:0;">
          <strong style="display:block;font-size:13.5px;color:var(--white);font-family:'Syne',sans-serif;">${m.titre}</strong>
          <small style="display:block;font-size:11.5px;color:var(--muted);margin-top:3px;line-height:1.5;">${m.desc}</small>
        </div>
      </div>`;
  }).join('');

  let designStepHtml = '';
  let previewHtml = '';

  if (modeObj && !modeObj.besoinDesign) {
    ensureManualCssInjected();
    previewHtml = `
      <div class="overview-card" style="margin-top:16px;">
        <div class="overview-card-header"><h3>Aperçu de l'écran affiché à l'agent</h3></div>
        <div style="background:#F7F5F0;border-radius:16px;padding:24px;display:flex;justify-content:center;">
          ${buildManualPreviewHTML()}
        </div>
        <p style="font-size:11px;color:var(--muted);margin-top:10px;line-height:1.5;">
          Aucun billet imprimé n'est généré dans ce mode — après chaque vente, l'agent voit cet écran et recopie les informations sur son carnet papier.
        </p>
      </div>`;
  }

  if (modeObj?.besoinDesign) {
    const format = formatFromMode(selectedMode);

    const previewData = {
      nomAgence:   agenceData?.nom   || 'Votre agence',
      villeAgence: agenceData?.ville || '',
      logoUrl:     agenceData?.logo || agenceData?.logoUrl || null,
      slogan:      agenceData?.slogan || '',
      politiqueAnnulation: agenceData?.politiqueAnnulation || null,
      delaiFormalite: agenceData?.delaiFormalite || null,
    };

    const designCardsHtml = DESIGNS.map(d => {
      const actif = d.id === selectedDesign;
      return `
        <div onclick="selectBilletDesign('${d.id}')" style="
          cursor:pointer;background:${actif ? 'rgba(0,229,160,0.06)' : 'var(--surface)'};
          border:1.5px solid ${actif ? 'rgba(0,229,160,0.4)' : 'var(--border)'};
          border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:10px;align-items:center;
          transition:border-color .18s,background .18s;">
          <div style="width:100%;height:${format === 'a4a5' ? '100px' : '100px'};overflow:hidden;border-radius:8px;background:#F7F5F0;display:flex;align-items:flex-start;justify-content:center;padding-top:6px;">
            <div class="${format === 'a4a5' ? 'tp-thumb-wrap' : 'tp-thumb-wrap-thermal'}">
              ${buildTicketHTML(format, d.id, previewData)}
            </div>
          </div>
          <div style="text-align:center;">
            <strong style="display:block;font-size:12.5px;color:var(--white);font-family:'Syne',sans-serif;">${d.titre}</strong>
            <small style="display:block;font-size:10.5px;color:var(--muted);margin-top:2px;">${d.desc}</small>
          </div>
        </div>`;
    }).join('');

    designStepHtml = `
      <div class="overview-card" style="margin-top:16px;">
        <div class="overview-card-header"><h3>2. Choisissez le design</h3></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">${designCardsHtml}</div>
      </div>`;

    if (selectedDesign) {
      previewHtml = `
        <div class="overview-card" style="margin-top:16px;">
          <div class="overview-card-header"><h3>Aperçu du billet</h3></div>
          <div style="background:#F7F5F0;border-radius:12px;padding:24px;display:flex;justify-content:center;">
            ${buildTicketHTML(format, selectedDesign, previewData)}
          </div>
          <p style="font-size:11px;color:var(--muted);margin-top:10px;line-height:1.5;">
            Aperçu sans code alphanumérique — cette fonctionnalité sera ajoutée automatiquement à ce design dès qu'elle sera prête, sans action de votre part.
          </p>
        </div>`;
    }
  }

  const peutEnregistrer = selectedMode && (!modeObj?.besoinDesign || selectedDesign);

  container.innerHTML = `
    <div class="overview-card">
      <div class="overview-card-header">
        <h3>1. Comment imprimez-vous vos billets ?</h3>
        ${dejaConfigure ? `<span style="font-size:11px;font-weight:700;color:var(--accent);">Configuré</span>` : ''}
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;">${modesHtml}</div>
    </div>

    ${designStepHtml}
    ${previewHtml}

    <div style="margin-top:16px;">
      <button class="btn-action-primary" id="billetConfigSubmitBtn" onclick="submitBilletConfig()"
        ${peutEnregistrer ? '' : 'disabled style="opacity:0.5;cursor:not-allowed;"'}>
        Enregistrer la configuration
      </button>
    </div>
  `;
}

// ════════════════════════════════
//  SÉLECTIONS
// ════════════════════════════════
export function selectBilletMode(modeId) {
  selectedMode = modeId;
  const modeObj = MODES.find(m => m.id === modeId);
  if (!modeObj?.besoinDesign) {
    selectedDesign = null;
  } else if (!selectedDesign) {
    selectedDesign = 'sobre'; // valeur par défaut sensée
  }
  renderBilletConfigPage();
}

export function selectBilletDesign(designId) {
  selectedDesign = designId;
  renderBilletConfigPage();
}

// ════════════════════════════════
//  SAUVEGARDE
// ════════════════════════════════
export async function submitBilletConfig() {
  if (!selectedMode) {
    showToast('Choisissez un mode d\'impression.', TOAST_ICONS.warning);
    return;
  }
  const modeObj = MODES.find(m => m.id === selectedMode);
  if (modeObj?.besoinDesign && !selectedDesign) {
    showToast('Choisissez un design de billet.', TOAST_ICONS.warning);
    return;
  }

  const btn = document.getElementById('billetConfigSubmitBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Enregistrement...'; }

  try {
    const res = await apiFetch(`${BACKEND}/agence/${agenceData.id}/billet-config`, {
      method:  'PATCH',
      body:    JSON.stringify({ billetMode: selectedMode, billetDesign: selectedDesign }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast('Erreur lors de l\'enregistrement.', TOAST_ICONS.error);
      return;
    }

    setAgenceData({ ...agenceData, billetConfig: data.billetConfig });
    updateBilletConfigBadge();
    renderBilletConfigPage();
    showToast('Configuration des billets enregistrée !', TOAST_ICONS.success, true);

  } catch (err) {
    console.error('Erreur billet-config :', err);
    showToast('Impossible de contacter le serveur.', TOAST_ICONS.error);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Enregistrer la configuration'; }
  }
}

// ════════════════════════════════
//  BADGE SIDEBAR
// ════════════════════════════════
export function updateBilletConfigBadge() {
  const badge = document.getElementById('navBadgeBilletConfig');
  if (!badge) return;

  const configure = !!agenceData?.billetConfig?.configuredAt;

  if (configure) {
    badge.classList.remove('show');
    badge.style.display = 'none';
  } else {
    badge.classList.add('show');
    badge.style.display = 'flex';
    badge.style.background = '#FFB23F';
    badge.textContent = '?';
  }
}