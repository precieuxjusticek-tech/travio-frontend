// ─── TRAVIO — Moteur de génération des billets (partagé) ───
// Ne fait ni sauvegarde ni impression : juste "donne-moi le HTML d'un billet".

export const TICKET_CSS = `
<style id="ticketPreviewStyles">
  .tp-navy{color:#0B1220;}
  .tp-a5{
    width:260px;background:#fff;border-radius:10px;overflow:hidden;
    box-shadow:0 4px 14px rgba(11,18,32,0.12);border:1px solid #E4E1D8;
    font-family:'Segoe UI',system-ui,-apple-system,sans-serif;color:#1A1F2B;
  }
  .tp-a5.tp-colore{border-radius:14px;border:none;}
  .tp-a5 .tp-head{background:#0B1220;color:#fff;padding:14px 16px;}
  .tp-a5.tp-colore .tp-head{
    background:linear-gradient(120deg,#14B8A6 0%,#0B7A9E 100%);
    padding:16px;position:relative;overflow:hidden;
  }
  .tp-a5.tp-colore .tp-head::after{
    content:"";position:absolute;right:-24px;top:-24px;width:80px;height:80px;
    background:rgba(255,255,255,0.12);border-radius:50%;
  }
  .tp-head-top{display:flex;align-items:center;gap:10px;position:relative;z-index:1;}
  .tp-logo{width:36px;height:36px;border-radius:9px;object-fit:cover;flex-shrink:0;background:#fff;}
  .tp-logo-fallback{
    width:36px;height:36px;border-radius:9px;flex-shrink:0;display:flex;align-items:center;justify-content:center;
    font-weight:800;font-size:13px;background:rgba(255,255,255,0.16);color:#fff;letter-spacing:0.3px;
  }
  .tp-agence-block{min-width:0;}
  .tp-agence-nom{font-weight:800;font-size:15px;line-height:1.25;font-family:'Syne',sans-serif;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .tp-slogan{font-size:9.5px;font-style:italic;opacity:.88;margin-top:1px;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .tp-agence-tag{font-size:9px;color:#9AA5B8;text-transform:uppercase;letter-spacing:0.4px;margin-top:8px;position:relative;z-index:1;}
  .tp-a5.tp-colore .tp-agence-tag{color:rgba(255,255,255,0.85);}
  .tp-body{padding:16px;}
  .tp-route{display:flex;align-items:center;gap:8px;margin-bottom:14px;}
  .tp-route .tp-city{font-size:14px;font-weight:700;}
  .tp-a5.tp-colore .tp-route .tp-city{font-size:15px;font-weight:800;color:#0B1220;}
  .tp-route .tp-arrow{color:#0E9488;font-size:13px;}
  .tp-a5.tp-colore .tp-route .tp-arrow{color:#0B7A9E;}
  .tp-info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 8px;}
  .tp-info-grid .tp-k{font-size:8.5px;color:#7C8494;text-transform:uppercase;letter-spacing:0.3px;}
  .tp-info-grid .tp-v{font-size:12px;font-weight:600;margin-top:2px;}
  .tp-foot{padding:10px 16px;border-top:1px dashed #E4E1D8;font-size:8px;color:#7C8494;display:flex;justify-content:space-between;}
  .tp-stamp{margin-top:12px;border:2px dashed #cfd3da;border-radius:8px;padding:8px;font-size:8px;color:#7C8494;text-align:center;}
  .tp-politique{font-size:8px;color:#7C8494;margin-top:10px;padding-top:8px;border-top:1px dashed #E4E1D8;line-height:1.45;}

  .tp-thermal{
    width:170px;background:#fff;box-shadow:0 4px 14px rgba(11,18,32,0.12);
    padding:12px 10px;font-family:'Courier New',monospace;font-size:9.5px;line-height:1.5;color:#1A1F2B;
  }
  .tp-thermal.tp-sobre{border-top:4px solid #0B1220;}
  .tp-thermal.tp-colore{border-top:4px solid #14B8A6;}
  .tp-thermal .tp-t-logo-row{display:flex;justify-content:center;margin-bottom:4px;}
  .tp-thermal .tp-t-logo{width:26px;height:26px;border-radius:6px;object-fit:cover;}
  .tp-thermal .tp-t-logo-fallback{
    width:26px;height:26px;border-radius:6px;display:flex;align-items:center;justify-content:center;
    font-weight:800;font-size:10px;background:#0B1220;color:#fff;
  }
  .tp-thermal.tp-colore .tp-t-logo-fallback{background:#14B8A6;}
  .tp-thermal .tp-t-brand{text-align:center;font-weight:800;font-size:11px;letter-spacing:0.4px;margin-bottom:1px;}
  .tp-thermal .tp-t-slogan{text-align:center;font-style:italic;font-size:8px;color:#7C8494;margin-bottom:3px;}
  .tp-thermal .tp-t-agence{text-align:center;font-size:8px;color:#7C8494;margin-bottom:8px;}
  .tp-thermal hr{border:none;border-top:1px dashed #ccc;margin:6px 0;}
  .tp-thermal .tp-t-row{display:flex;justify-content:space-between;margin-bottom:2px;}
  .tp-thermal .tp-t-route{text-align:center;font-weight:700;font-size:10px;margin:6px 0;}
  .tp-thermal .tp-t-foot{text-align:center;font-size:7px;color:#7C8494;margin-top:6px;}
  .tp-thermal .tp-t-politique{font-size:7px;color:#7C8494;text-align:center;margin-top:6px;line-height:1.4;}

  .tp-thumb-wrap{transform:scale(0.62);transform-origin:top left;width:161px;height:auto;pointer-events:none;}
  .tp-thumb-wrap-thermal{transform:scale(0.62);transform-origin:top left;width:106px;pointer-events:none;}
</style>
`;

let cssInjected = false;
export function ensureCssInjected() {
  if (cssInjected) return;
  if (!document.getElementById('ticketPreviewStyles')) {
    document.head.insertAdjacentHTML('beforeend', TICKET_CSS);
  }
  cssInjected = true;
}

export function formatFromMode(mode) {
  return mode === 'machine_thermique' ? 'thermique' : 'a4a5';
}

export function formatDelaiFormalite(delai) {
  if (!delai || !delai.valeur) return null;
  const unite = delai.unite === 'heures'
    ? (delai.valeur > 1 ? 'heures' : 'heure')
    : 'min';
  return `${delai.valeur} ${unite} avant le départ`;
}

/**
 * Construit le HTML d'un billet.
 * @param {'a4a5'|'thermique'} format
 * @param {'sobre'|'colore'} design
 * @param {object} data — voir les valeurs par défaut ci-dessous (utilisées pour l'aperçu admin)
 */

// Initiales de secours si l'agence n'a pas encore de logo (ex: "Trans Congo" -> "TC")
function getInitiales(nom) {
  if (!nom) return 'AG';
  const mots = nom.trim().split(/\s+/).filter(Boolean);
  if (mots.length === 1) return mots[0].slice(0, 2).toUpperCase();
  return (mots[0][0] + mots[1][0]).toUpperCase();
}

export function buildTicketHTML(format, design, data = {}) {
  const {
    nomAgence    = 'Votre agence',
    villeAgence  = '',
    logoUrl      = null,
    slogan       = '',
    villeDepart  = 'Brazzaville',
    villeArrivee = 'Pointe-Noire',
    dateLabel    = '14 Juil. 2026',
    heureDepart  = '07h30',
    busNom       = 'Bus 04',
    siege        = 'S12',
    prix         = '15 000 FCFA',
    agentNom     = 'Précieux K.',
    codeControle = null,
    passagerNom  = 'Jean Dupont',
    nbVoyageurs  = 1,
    pdvEmbarquementNom   = null,
    pdvEmbarquementVille = null,
    pdvDebarquementNom   = null,
    pdvDebarquementVille = null,
    politiqueAnnulation = null,
    delaiFormalite = null,
  } = data;

  const initiales = getInitiales(nomAgence);

  if (format === 'a4a5') {
    return `
      <div class="tp-a5 tp-${design}">
        <div class="tp-head">
          <div class="tp-head-top">
            ${logoUrl
              ? `<img class="tp-logo" src="${logoUrl}" alt="${nomAgence}">`
              : `<div class="tp-logo-fallback">${initiales}</div>`}
            <div class="tp-agence-block">
              <div class="tp-agence-nom">${nomAgence}</div>
              ${slogan ? `<div class="tp-slogan">${slogan}</div>` : ''}
            </div>
          </div>
          ${villeAgence ? `<div class="tp-agence-tag">${villeAgence}</div>` : ''}
        </div>
        <div class="tp-body">
          <div class="tp-route">
            <span class="tp-city">${villeDepart}</span>
            <span class="tp-arrow">→</span>
            <span class="tp-city">${villeArrivee}</span>
          </div>
          <div class="tp-info-grid">
            <div style="grid-column:1/-1;"><div class="tp-k">Passager</div><div class="tp-v">${passagerNom}</div></div>
            <div><div class="tp-k">Date</div><div class="tp-v">${dateLabel}</div></div>
            <div><div class="tp-k">Départ</div><div class="tp-v">${heureDepart}</div></div>
            <div><div class="tp-k">Bus / Siège</div><div class="tp-v">${busNom}${siege ? ' — ' + siege : ''}</div></div>
            <div><div class="tp-k">Voyageurs</div><div class="tp-v">${nbVoyageurs}</div></div>
            <div><div class="tp-k">Embarquement</div><div class="tp-v">${pdvEmbarquementNom || '—'}</div></div>
            <div><div class="tp-k">Débarquement</div><div class="tp-v">${pdvDebarquementNom || '—'}</div></div>
            ${delaiFormalite ? `<div style="grid-column:1/-1;"><div class="tp-k">Présentation</div><div class="tp-v">${formatDelaiFormalite(delaiFormalite)}</div></div>` : ''}
            <div style="grid-column:1/-1;"><div class="tp-k">Prix total</div><div class="tp-v">${prix}</div></div>
          </div>
          ${codeControle
            ? `<div class="tp-stamp" style="letter-spacing:2px;font-weight:700;">${codeControle}</div>`
            : (design === 'colore' ? `<div class="tp-stamp">Cachet de l'agence</div>` : '')}
          ${politiqueAnnulation ? `<div class="tp-politique">${formatPolitiqueCourte(politiqueAnnulation)}</div>` : ''}
        </div>
        <div class="tp-foot">
          <span>Agent : ${agentNom}</span>
          <span class="tp-foot-brand">Propulsé par Travio</span>
        </div>
      </div>`;
  }

  // format thermique
  return `
    <div class="tp-thermal tp-${design}">
      <div class="tp-t-logo-row">
        ${logoUrl
          ? `<img class="tp-t-logo" src="${logoUrl}" alt="${nomAgence}">`
          : `<div class="tp-t-logo-fallback">${initiales}</div>`}
      </div>
      <div class="tp-t-brand">${nomAgence}</div>
      ${slogan ? `<div class="tp-t-slogan">${slogan}</div>` : ''}
      ${villeAgence ? `<div class="tp-t-agence">${villeAgence}</div>` : ''}
      <hr>
      <div class="tp-t-row"><span>Passager</span><span>${passagerNom}</span></div>
      <div class="tp-t-route">${villeDepart.toUpperCase()} → ${villeArrivee.toUpperCase()}</div>
      <div class="tp-t-row"><span>Date</span><span>${dateLabel}</span></div>
      <div class="tp-t-row"><span>Départ</span><span>${heureDepart}</span></div>
      <div class="tp-t-row"><span>Bus/Siège</span><span>${busNom}${siege ? ' / ' + siege : ''}</span></div>
      <div class="tp-t-row"><span>Voyageurs</span><span>${nbVoyageurs}</span></div>
      <div class="tp-t-row"><span>Embarq.</span><span>${pdvEmbarquementNom || '—'}</span></div>
      <div class="tp-t-row"><span>Débarq.</span><span>${pdvDebarquementNom || '—'}</span></div>
      ${delaiFormalite ? `<div class="tp-t-row"><span>Présentation</span><span>${formatDelaiFormalite(delaiFormalite)}</span></div>` : ''}
      <div class="tp-t-row"><span>Prix total</span><span>${prix}</span></div>
      ${codeControle ? `<div class="tp-t-row"><span>Code</span><span>${codeControle}</span></div>` : ''}
      ${politiqueAnnulation ? `<div class="tp-t-politique">${formatPolitiqueCourte(politiqueAnnulation)}</div>` : ''}
      <div class="tp-t-foot">Agent : ${agentNom}<br>Propulsé par Travio</div>
    </div>`;
}

function formatPolitiqueCourte(pol) {
  if (!pol || !pol.autorise) {
    return "Vente définitive — aucune annulation possible.";
  }
  if (pol.remboursement) {
    return `Annulation possible jusqu'à ${pol.delaiHeures || '?'}h avant le départ (${pol.precisions || 0}% de frais retenus).`;
  }
  return `Annulation possible jusqu'à ${pol.delaiHeures || '?'}h avant le départ — sans remboursement.`;
}