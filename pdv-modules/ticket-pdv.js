// ─── TRAVIO — PDV — Ticket (billet imprimé, ticket manuel, ticket colis) ───

import { TICKET_CSS, buildTicketHTML, formatFromMode, formatDelaiFormalite } from '../billet-template.js';
import { escapeHtml } from '../sanitize.js';
import {
  ICONS, agenceData, pdvData, resaList, trajetList, nomTypeResa,
} from './state-pdv.js';
import { showToast } from './auth-init-pdv.js';

function buildDataPourReservationPDV(r, trajet) {
  const nomComplet = `${r.prenomPassager || ''} ${r.nomPassager || ''}`.trim() || 'Passager';
  const nbVoyageurs = r.nbPassagers || (Array.isArray(r.passagers) ? r.passagers.length : 1) || 1;

  let siege = r.siege || null;
  if (Array.isArray(r.passagers) && r.passagers.length > 0) {
    const sieges = r.passagers.map(p => p.siege).filter(Boolean);
    if (sieges.length > 0) siege = sieges.join(', ');
  }

  const dateLabel = r.dateDepart
    ? new Date(r.dateDepart + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  let totalKg = r.bagages || 0;
  let totalNombre = r.nombreBagages || 0;
  if (Array.isArray(r.passagers) && r.passagers.length > 0) {
    totalKg = r.passagers.reduce((s, p) => s + (p.bagages || 0), 0);
    totalNombre = r.passagers.reduce((s, p) => s + (p.nombreBagages || 0), 0);
  }
  const bagagesLabel = totalKg > 0
    ? `${totalKg} kg${totalNombre > 0 ? ` (${totalNombre} bagage${totalNombre > 1 ? 's' : ''})` : ''}`
    : null;

  return {
    nomAgence:    agenceData?.nom   || 'Votre agence',
    codeControle: r.codeControle || null,
    bagagesLabel,
    politiqueAnnulation: agenceData?.politiqueAnnulation || null,
    delaiFormalite: agenceData?.delaiFormalite || null,
    villeAgence:  agenceData?.ville || '',
    logoUrl:      agenceData?.logo || agenceData?.logoUrl || null,
    slogan:       agenceData?.slogan || '',
    villeDepart:  r.arretMontee   || trajet?.villeDepart  || '—',
    villeArrivee: r.arretDescente || trajet?.villeArrivee || '—',
    dateLabel,
    heureDepart:  r.heureDepart || '—',
    busNom:       r.busNom || '—',
    siege,
    prix:         `${Number(r.prixTotal || 0).toLocaleString()} XAF`,
    agentNom:     pdvData?.responsable || '—',
    passagerNom:  nomComplet,
    nbVoyageurs,
    pdvEmbarquementNom:   r.pdvEmbarquementNom   || pdvData?.nom   || null,
    pdvEmbarquementVille: r.pdvEmbarquementVille || pdvData?.ville || null,
    pdvDebarquementNom:   r.pdvDebarquementNom   || null,
    pdvDebarquementVille: r.pdvDebarquementVille || null,
    politiqueAnnulation: agenceData?.politiqueAnnulation || null,
    delaiFormalite: agenceData?.delaiFormalite || null,
  };
}

export function imprimerBilletPDV(resaId) {
  const r = resaList.find(r => r.id === resaId);
  if (!r) { showToast('Réservation introuvable.', ICONS.banned); return; }

  const config = agenceData?.billetConfig;
  if (!config || !config.mode) {
    showToast('Configuration de billet non définie par votre agence.', ICONS.warning);
    return;
  }
  if (config.mode === 'manuel') {
    showManualTicket(r, trajetList.find(t => t.id === r.trajetId));
    return;
  }

  const trajet = trajetList.find(t => t.id === r.trajetId);
  const format = formatFromMode(config.mode);
  const design = config.design || 'sobre';

  const ticketHTML = buildTicketHTML(format, design, buildDataPourReservationPDV(r, trajet));

  const printWindow = window.open('', '_blank', 'width=480,height=720');
  if (!printWindow) {
    showToast("Le navigateur a bloqué l'ouverture de la fenêtre d'impression.", ICONS.warning);
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
            display: flex; align-items: center; justify-content: center; gap: 8px; z-index: 10;
          }
          .no-print-bar button {
            background: #00E5A0; color: #0A0E1A; border: none; border-radius: 8px;
            padding: 8px 16px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: system-ui, sans-serif;
          }
          @media print { body { padding:0; background:#fff; } .no-print-bar { display: none !important; } }
        </style>
      </head>
      <body>
        <div class="no-print-bar"><button onclick="window.print()">${ICONS.print} Imprimer</button></div>
        ${ticketHTML}
        <script>window.onload = function () { window.print(); };</script>
      </body>
    </html>
  `);
}
window.imprimerBilletPDV = imprimerBilletPDV;

export function showTicket(resa, trajet) {
  const body = document.getElementById('ticketBody');
  if (!body) return;

  const btnImprimer = document.querySelector('#ticketModal .ticket-btn-primary');
  if (btnImprimer) btnImprimer.style.display = '';

  window._lastTicketResaId    = resa.id;
  window._lastTicketTrajetRef = trajet;

  const dateStr = resa.dateDepart
    ? new Date(resa.dateDepart + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
    : '—';

  const routeAffichee = (resa.arretMontee && resa.arretDescente)
    ? `${escapeHtml(resa.arretMontee)} → ${escapeHtml(resa.arretDescente)}`
    : `${escapeHtml(trajet.villeDepart)} → ${escapeHtml(trajet.villeArrivee)}`;

  const nbPass = resa.passagers?.length || 1;
  const passagersLabel = nbPass > 1
    ? resa.passagers.map(p => `${escapeHtml(p.prenom)} ${escapeHtml(p.nom)}`).join(', ')
    : `${escapeHtml(resa.prenomPassager)} ${escapeHtml(resa.nomPassager)}`;

  body.innerHTML = `
    <div class="ticket-row">
      <span>Passager${nbPass > 1 ? 's' : ''}</span>
      <strong style="text-align:right;max-width:60%;">${passagersLabel}</strong>
    </div>
    <div class="ticket-row">
      <span>Téléphone</span>
      <strong>${escapeHtml(resa.telephonePassager || '—')}</strong>
    </div>
    <div class="ticket-row">
      <span>Trajet</span>
      <strong>${routeAffichee}</strong>
    </div>
    ${nbPass > 1 ? `
    <div class="ticket-row">
      <span>Nb. passagers</span>
      <strong>${nbPass} personnes</strong>
    </div>` : `
    <div class="ticket-row">
      <span>Type</span>
      <strong>${nomTypeResa(resa)}</strong>
    </div>`}
    <div class="ticket-row">
      <span>Date</span>
      <strong>${dateStr}</strong>
    </div>
    <div class="ticket-row">
      <span>Départ</span>
      <strong>${escapeHtml(resa.heureDepart || '—')}</strong>
    </div>
    ${resa.siege ? `<div class="ticket-row"><span>Siège</span><strong>${escapeHtml(resa.siege)}</strong></div>` : ''}
    <div class="ticket-row">
      <span>Total encaissé</span>
      <strong class="accent">${Number(resa.prixTotal).toLocaleString()} XAF</strong>
    </div>

    <div class="ticket-row">
      <span>Embarquement</span>
      <strong>${escapeHtml(resa.pdvEmbarquementNom || pdvData?.nom || '—')} · ${escapeHtml(resa.pdvEmbarquementVille || pdvData?.ville || '—')}</strong>
    </div>

    <div class="ticket-row">
      <span>Débarquement</span>
      <strong>${escapeHtml(resa.pdvDebarquementNom || '—')}${resa.pdvDebarquementVille ? ' · ' + escapeHtml(resa.pdvDebarquementVille) : ''}</strong>
    </div>

    ${agenceData?.delaiFormalite ? `
    <div class="ticket-row">
      <span>Présentation</span>
      <strong>${formatDelaiFormalite(agenceData.delaiFormalite)}</strong>
    </div>` : ''}

    ${resa.remarques ? `
    <div class="ticket-row">
      <span>Remarques</span>
      <strong style="text-align:right;max-width:60%;">${escapeHtml(resa.remarques)}</strong>
    </div>` : ''}
  `;

  const overlay = document.getElementById('ticketOverlay');
  if (overlay) {
    overlay.classList.add('show');
    overlay.style.pointerEvents = 'all';
  }
}

export function closeTicket() {
  const overlay = document.getElementById('ticketOverlay');
  if (overlay) {
    overlay.classList.remove('show');
    overlay.style.pointerEvents = 'none';
  }
}
window.closeTicket = closeTicket;

export function showManualTicket(resa, trajet) {
  window._lastTicketResaId = resa.id;

  const dateStr = resa.dateDepart
    ? new Date(resa.dateDepart + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
    : '—';

  const routeAffichee = (resa.arretMontee && resa.arretDescente)
    ? `${escapeHtml(resa.arretMontee)} → ${escapeHtml(resa.arretDescente)}`
    : `${escapeHtml(trajet?.villeDepart || '—')} → ${escapeHtml(trajet?.villeArrivee || '—')}`;

  const nbPass = resa.passagers?.length || resa.nbPassagers || 1;

  let siege = resa.siege || '—';
  if (Array.isArray(resa.passagers) && resa.passagers.length > 0) {
    const sieges = resa.passagers.map(p => p.siege).filter(Boolean);
    if (sieges.length > 0) siege = sieges.join(', ');
  }
  const busSiege = `${escapeHtml(resa.busNom || '—')}${siege !== '—' ? ' — ' + escapeHtml(siege) : ''}`;

  let overlay = document.getElementById('manualTicketOverlay');
  const isNew = !overlay;
  if (isNew) {
    overlay = document.createElement('div');
    overlay.id = 'manualTicketOverlay';
  }
  overlay.className = 'ticket-overlay';
  overlay.innerHTML = `
    <div class="ticket-backdrop" onclick="closeManualTicket()"></div>
    <div class="ticket-modal">
      <div class="ticket-header">
        <div style="width:44px;height:44px;border-radius:50%;background:rgba(255,178,63,0.15);border:1px solid rgba(255,178,63,0.3);display:flex;align-items:center;justify-content:center;margin-bottom:4px;">
          ${ICONS.warning}
        </div>
        <h2>Billet à recopier</h2>
        <p>Aucune impression configurée — reportez ces informations sur le carnet papier, puis apposez le cachet de l'agence.</p>
      </div>
      <div style="padding:16px 24px 4px;">
        <div style="background:linear-gradient(120deg,#14B8A6 0%,#0B7A9E 100%);border-radius:14px;padding:16px 18px;text-align:center;">
          <div style="font-size:10px;color:rgba(255,255,255,0.85);text-transform:uppercase;letter-spacing:0.6px;margin-bottom:6px;">Trajet</div>
          <div style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:#fff;">${routeAffichee}</div>
        </div>
      </div>
      <div class="ticket-body">
        <div class="ticket-row"><span>Agence</span><strong>${escapeHtml(agenceData?.nom || '—')}</strong></div>
        <div class="ticket-row"><span>Date</span><strong>${dateStr}</strong></div>
        <div class="ticket-row"><span>Départ</span><strong>${escapeHtml(resa.heureDepart || '—')}</strong></div>
        <div class="ticket-row"><span>Bus / Siège</span><strong>${busSiege}</strong></div>
        ${agenceData?.delaiFormalite ? `<div class="ticket-row"><span>Présentation</span><strong>${formatDelaiFormalite(agenceData.delaiFormalite)}</strong></div>` : ''}
        <div class="ticket-row"><span>Passagers</span><strong>${nbPass}</strong></div>
        <div class="ticket-row"><span>Prix</span><strong class="accent">${Number(resa.prixTotal || 0).toLocaleString()} XAF</strong></div>
      </div>
      <div class="ticket-actions">
        <button class="ticket-btn-primary" onclick="copierInfosBilletManuel('${resa.id}')">
          ${ICONS.clipboard} Copier les informations
        </button>
        <button class="ticket-btn-secondary" onclick="closeManualTicket();showPage('vente', document.querySelector('[data-page=vente]'))">Nouvelle vente</button>
        <button class="ticket-btn-secondary" onclick="showPage('reservations', document.querySelector('[data-page=reservations]'));closeManualTicket()">Voir les réservations</button>
      </div>
      <div style="padding:14px 24px 0;font-size:11px;color:var(--muted);text-align:center;line-height:1.5;">
        Le code alphanumérique sera ajouté ici dès que la fonctionnalité sera disponible. Cet écran reste accessible depuis l'historique des réservations.
      </div>
    </div>
  `;

  if (isNew) document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    overlay.classList.add('show');
    overlay.style.pointerEvents = 'all';
  });
}

export function closeManualTicket() {
  const overlay = document.getElementById('manualTicketOverlay');
  if (overlay) {
    overlay.classList.remove('show');
    overlay.style.pointerEvents = 'none';
  }
}
window.closeManualTicket = closeManualTicket;

export function copierInfosBilletManuel(resaId) {
  const r = resaList.find(r => r.id === resaId);
  if (!r) return;
  const trajet = trajetList.find(t => t.id === r.trajetId);
  const routeAffichee = (r.arretMontee && r.arretDescente)
    ? `${r.arretMontee} → ${r.arretDescente}`
    : `${trajet?.villeDepart || '—'} → ${trajet?.villeArrivee || '—'}`;
  const dateStr = r.dateDepart
    ? new Date(r.dateDepart + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
    : '—';
  const texte = [
    `Agence : ${agenceData?.nom || '—'}`,
    `Trajet : ${routeAffichee}`,
    `Date : ${dateStr}`,
    `Départ : ${r.heureDepart || '—'}`,
    `Bus/Siège : ${r.busNom || '—'}${r.siege ? ' — ' + r.siege : ''}`,
    `Passagers : ${r.passagers?.length || r.nbPassagers || 1}`,
    `Prix : ${Number(r.prixTotal || 0).toLocaleString()} XAF`,
  ].join('\n');

  navigator.clipboard?.writeText(texte)
    .then(() => showToast('Informations copiées.', ICONS.check, true))
    .catch(() => showToast('Impossible de copier.', ICONS.warning));
}
window.copierInfosBilletManuel = copierInfosBilletManuel;

export function toggleBilletViewPDV(resaId, mode) {
  const codeBtn  = document.getElementById(`billetToggleCode-${resaId}`);
  const qrBtn    = document.getElementById(`billetToggleQr-${resaId}`);
  const codeView = document.getElementById(`billetViewCode-${resaId}`);
  const qrView   = document.getElementById(`billetViewQr-${resaId}`);
  if (!codeBtn || !qrBtn || !codeView || !qrView) return;
  codeBtn.classList.toggle('active', mode === 'code');
  qrBtn.classList.toggle('active', mode === 'qr');
  codeView.style.display = mode === 'code' ? 'block' : 'none';
  qrView.style.display   = mode === 'qr'   ? 'block' : 'none';
}
window.toggleBilletViewPDV = toggleBilletViewPDV;

export function showColisTicketShared(colis, code) {
  const body = document.getElementById('ticketBody');
  if (!body) return;

  window._lastTicketResaId = null;

  const btnImprimer = document.querySelector('#ticketModal .ticket-btn-primary');
  if (btnImprimer) btnImprimer.style.display = 'none';

  body.innerHTML = `
    <div class="ticket-row"><span>Code de retrait</span><strong class="accent" style="font-size:16px;letter-spacing:3px;">${escapeHtml(code)}</strong></div>
    <div class="ticket-row"><span>Trajet</span><strong>${escapeHtml(colis.routeLabel)}</strong></div>
    <div class="ticket-row"><span>Bus</span><strong>${escapeHtml(colis.busNom || '—')}</strong></div>
    <div class="ticket-row"><span>Expéditeur</span><strong>${escapeHtml(colis.expediteurNom)}</strong></div>
    <div class="ticket-row"><span>Destinataire</span><strong>${escapeHtml(colis.destinataireNom)} · ${escapeHtml(colis.destinataireTel)}</strong></div>
    <div class="ticket-row"><span>Embarquement</span><strong>${escapeHtml(colis.pdvEmbarquementNom || '—')}${colis.pdvEmbarquementVille ? ' — ' + escapeHtml(colis.pdvEmbarquementVille) : (colis.arretMontee ? ' — ' + escapeHtml(colis.arretMontee) : '')}</strong></div>
    <div class="ticket-row"><span>À retirer à</span><strong>${escapeHtml(colis.pdvDebarquementNom || '—')}${colis.pdvDebarquementVille ? ' — ' + escapeHtml(colis.pdvDebarquementVille) : (colis.arretDescente ? ' — ' + escapeHtml(colis.arretDescente) : '')}</strong></div>
    <div class="ticket-row"><span>Nature</span><strong>${escapeHtml(colis.nature)}</strong></div>
    ${colis.valeurDeclaree != null ? `<div class="ticket-row"><span>Valeur déclarée</span><strong>${Number(colis.valeurDeclaree).toLocaleString()} XAF</strong></div>` : ''}
    <div class="ticket-row"><span>Total encaissé</span><strong class="accent">${Number(colis.prixTransport).toLocaleString()} XAF</strong></div>
  `;

  const headerTitle = document.querySelector('#ticketModal .ticket-header h2');
  const headerSub   = document.querySelector('#ticketModal .ticket-header p');
  if (headerTitle) headerTitle.textContent = 'Colis enregistré !';
  if (headerSub)   headerSub.textContent   = 'Communiquez le code au destinataire.';

  const overlay = document.getElementById('ticketOverlay');
  if (overlay) { overlay.classList.add('show'); overlay.style.pointerEvents = 'all'; }
}
window.showColisTicketShared = showColisTicketShared;