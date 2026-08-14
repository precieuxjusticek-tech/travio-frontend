// ─── TRAVIO — Impression des billets (réservations réelles) ───

import { agenceData, resaList, pdvList, trajetList } from './state.js';
import { showToast, TOAST_ICONS } from './toast-utils.js';
import { TICKET_CSS, buildTicketHTML, formatFromMode, formatDelaiFormalite } from './billet-template.js';
import { escapeHtml, escapeJsAttr } from './sanitize.js';
const ICONS = {
  close:     '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  clipboard: '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:4px;"><rect x="3" y="2" width="10" height="12" rx="1.5" stroke="currentColor" stroke-width="1.4"/><rect x="6" y="1" width="4" height="2.5" rx="0.5" stroke="currentColor" stroke-width="1.2"/></svg>',
};

function formatDateLabelFr(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function buildDataPourReservation(r, pdv, trajet) {
  const nomComplet = `${r.prenomPassager || ''} ${r.nomPassager || ''}`.trim() || 'Passager';
  const nbVoyageurs = r.nbPassagers || (Array.isArray(r.passagers) ? r.passagers.length : 1) || 1;

  // Sièges : si plusieurs passagers ont des sièges différents, on les liste ; sinon un seul siège
  let siege = r.siege || null;
  if (Array.isArray(r.passagers) && r.passagers.length > 0) {
    const sieges = r.passagers.map(p => p.siege).filter(Boolean);
    if (sieges.length > 0) siege = sieges.join(', ');
  }

  // Bagages : agrège tous les passagers si multi, sinon le passager principal
  let nbBagages = r.nombreBagages || 0;
  if (Array.isArray(r.passagers) && r.passagers.length > 0) {
    nbBagages = r.passagers.reduce((s, p) => s + (p.nombreBagages || 0), 0);
  }

  const pdvDebarquement = r.pdvDebarquementId ? pdvList.find(p => p.id === r.pdvDebarquementId) : null;

  return {
    nomAgence:    agenceData?.nom   || 'Votre agence',
    codeControle: r.codeControle || null,
    nbBagages,
    politiqueAnnulation: agenceData?.politiqueAnnulation || null,
    delaiFormalite: agenceData?.delaiFormalite || null,
    villeAgence:  agenceData?.ville || '',
    logoUrl:      agenceData?.logo || agenceData?.logoUrl || null,   
    slogan:       agenceData?.slogan || '',
    villeDepart:  r.arretMontee   || trajet?.villeDepart  || '—',
    villeArrivee: r.arretDescente || trajet?.villeArrivee || '—',
    dateLabel:    formatDateLabelFr(r.dateDepart),
    heureDepart:  r.heureDepart || '—',
    busNom:       r.busNom || '—',
    siege,
    prix:         `${Number(r.prixTotal || 0).toLocaleString()} XAF`,
    agentNom:     pdv?.responsable || '—',
    passagerNom:  nomComplet,
    nbVoyageurs,
    pdvEmbarquementAdresse: pdv?.adresse || null,
    pdvDebarquementAdresse: pdvDebarquement?.adresse || null,
    codeControle: r.codeControle || null,
    politiqueAnnulation: agenceData?.politiqueAnnulation || null,
    delaiFormalite: agenceData?.delaiFormalite || null,
  };
}

export function imprimerBillet(resaId) {
  const r = resaList.find(r => r.id === resaId);
  if (!r) { showToast('Réservation introuvable.', TOAST_ICONS.error); return; }

  const config = agenceData?.billetConfig;
  if (!config || !config.mode) {
    showToast('Aucune configuration de billet définie — allez dans Réglages > Billets.', TOAST_ICONS.warning);
    return;
  }
  if (config.mode === 'manuel') {
    showManualTicket(resaId);
    return;
  }

  const pdv    = pdvList.find(p => p.id === r.pdvId);
  const trajet = trajetList.find(t => t.id === r.trajetId);
  const format = formatFromMode(config.mode);
  const design = config.design || 'sobre';

  const ticketHTML = buildTicketHTML(format, design, buildDataPourReservation(r, pdv, trajet));

  const printWindow = window.open('', '_blank', 'width=480,height=720');
  if (!printWindow) {
    showToast("Le navigateur a bloqué l'ouverture de la fenêtre d'impression.", TOAST_ICONS.warning);
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <title>Billet — Travio</title>
            ${TICKET_CSS}
            <style>
            body { margin:0; padding:24px; background:#F7F5F0; display:flex; flex-direction:column; align-items:center; gap:24px; }
            .no-print-bar {
                position: sticky; top: 0; width: 100%; max-width:320px;
                background: #0B1220; border-radius: 12px; padding: 10px 14px;
                display: flex; align-items: center; justify-content: center; gap: 8px;
                z-index: 10;
            }
            .no-print-bar button {
                background: #00E5A0; color: #0A0E1A; border: none; border-radius: 8px;
                padding: 8px 16px; font-size: 13px; font-weight: 700; cursor: pointer;
                font-family: system-ui, sans-serif;
            }
            @media print {
                body { padding:0; background:#fff; }
                .no-print-bar { display: none !important; }
            }
            </style>
        </head>
        <body>
            <div class="no-print-bar">
            <button onclick="window.print()">🖨 Imprimer</button>
            </div>
            ${ticketHTML}
            <script>
            window.onload = function () { window.print(); };
            </script>
        </body>
    </html>
    `);
}

// ════════════════════════════════
//  ÉCRAN MANUEL — vue détail réservation (admin)
// ════════════════════════════════
export function showManualTicket(resaId) {
  const r = resaList.find(r => r.id === resaId);
  if (!r) { showToast('Réservation introuvable.', TOAST_ICONS.error); return; }

  const pdv    = pdvList.find(p => p.id === r.pdvId);
  const trajet = trajetList.find(t => t.id === r.trajetId);
  const routeAffichee = (r.arretMontee && r.arretDescente)
    ? `${r.arretMontee} → ${r.arretDescente}`
    : `${trajet?.villeDepart || '—'} → ${trajet?.villeArrivee || '—'}`;

  let siege = r.siege || '—';
  if (Array.isArray(r.passagers) && r.passagers.length > 0) {
    const sieges = r.passagers.map(p => p.siege).filter(Boolean);
    if (sieges.length > 0) siege = sieges.join(', ');
  }
  const busSiege = `${r.busNom || '—'}${siege !== '—' ? ' — ' + siege : ''}`;
  const nbPass   = r.passagers?.length || r.nbPassagers || 1;
  let nbBagages = r.nombreBagages || 0;
  if (Array.isArray(r.passagers) && r.passagers.length > 0) {
    nbBagages = r.passagers.reduce((s, p) => s + (p.nombreBagages || 0), 0);
  }

  const existing = document.getElementById('manualTicketAdminOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'manualTicketAdminOverlay';
  overlay.className = 'pdv-overlay';
  overlay.innerHTML = `
    <div class="pdv-overlay-backdrop" onclick="closeManualTicketAdmin()"></div>
    <div class="pdv-overlay-panel" style="max-width:420px;">
      <div class="pdv-overlay-header">
        <div>
          <h2>Billet à recopier</h2>
          <p>Aucune impression configurée pour cette agence — informations à recopier manuellement.</p>
        </div>
        <button class="pdv-overlay-close" onclick="closeManualTicketAdmin()">${ICONS.close}</button>
      </div>
      <div style="padding:0 0 8px;">
        <div style="background:linear-gradient(120deg,#14B8A6 0%,#0B7A9E 100%);border-radius:14px;padding:18px;text-align:center;margin-bottom:14px;">
          <div style="font-size:10px;color:rgba(255,255,255,0.85);text-transform:uppercase;letter-spacing:0.6px;margin-bottom:6px;">Code billet</div>
          <div style="font-size:26px;font-weight:800;letter-spacing:5px;font-family:'Courier New',monospace;color:#fff;">${escapeHtml(r.codeControle || '—')}</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.85);margin-top:6px;">Recopiez ce code exactement, en majuscules</div>
        </div>
        <div class="recap-card">
          <div class="recap-row"><span>Trajet</span><strong>${escapeHtml(routeAffichee)}</strong></div>
          <div class="recap-row"><span>Agence</span><strong>${escapeHtml(agenceData?.nom || '—')}</strong></div>
          <div class="recap-row"><span>Date</span><strong>${escapeHtml(formatDateLabelFr(r.dateDepart))}</strong></div>
          <div class="recap-row"><span>Départ</span><strong>${escapeHtml(r.heureDepart || '—')}</strong></div>
          <div class="recap-row"><span>Bus / Siège</span><strong>${escapeHtml(busSiege)}</strong></div>
          ${agenceData?.delaiFormalite ? `<div class="recap-row"><span>Formalité</span><strong>${escapeHtml(formatDelaiFormalite(agenceData.delaiFormalite))}</strong></div>` : ''}
          <div class="recap-row"><span>PDV vendeur</span><strong>${escapeHtml(pdv?.nom || '—')}</strong></div>
          <div class="recap-row"><span>Passagers</span><strong>${Number(nbPass) || 1}</strong></div>
          ${nbBagages > 0 ? `<div class="recap-row"><span>Bagages</span><strong>${nbBagages}</strong></div>` : ''}
          <div class="recap-row"><span>Prix</span><strong style="color:var(--accent)">${Number(r.prixTotal || 0).toLocaleString()} XAF</strong></div>
        </div>
        <button class="pdv-action-btn" style="width:100%;margin-top:12px;" onclick="copierInfosBilletManuelAdmin('${escapeJsAttr(resaId)}')">
          ${ICONS.clipboard} Copier les informations
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
}

export function closeManualTicketAdmin() {
  const o = document.getElementById('manualTicketAdminOverlay');
  if (o) { o.classList.remove('show'); setTimeout(() => o.remove(), 300); }
}

export function copierInfosBilletManuelAdmin(resaId) {
  const r = resaList.find(r => r.id === resaId);
  if (!r) return;
  const trajet = trajetList.find(t => t.id === r.trajetId);
  const routeAffichee = (r.arretMontee && r.arretDescente)
    ? `${r.arretMontee} → ${r.arretDescente}`
    : `${trajet?.villeDepart || '—'} → ${trajet?.villeArrivee || '—'}`;

  let nbBagages = r.nombreBagages || 0;
  if (Array.isArray(r.passagers) && r.passagers.length > 0) {
    nbBagages = r.passagers.reduce((s, p) => s + (p.nombreBagages || 0), 0);
  }

  const texte = [
    `Agence : ${agenceData?.nom || '—'}`,
    `Trajet : ${routeAffichee}`,
    `Date : ${formatDateLabelFr(r.dateDepart)}`,
    `Départ : ${r.heureDepart || '—'}`,
    `Bus/Siège : ${r.busNom || '—'}${r.siege ? ' — ' + r.siege : ''}`,
    `Passagers : ${r.passagers?.length || r.nbPassagers || 1}`,
    ...(nbBagages > 0 ? [`Bagages : ${nbBagages}`] : []),
    `Prix : ${Number(r.prixTotal || 0).toLocaleString()} XAF`,
    `Code : ${r.codeControle || '—'}`,
  ].join('\n');

  navigator.clipboard?.writeText(texte)
    .then(() => showToast('Informations copiées.', TOAST_ICONS.success, true))
    .catch(() => showToast('Impossible de copier.', TOAST_ICONS.warning));
}

window.closeManualTicketAdmin          = closeManualTicketAdmin;
window.copierInfosBilletManuelAdmin    = copierInfosBilletManuelAdmin;
window.imprimerBillet                  = imprimerBillet;