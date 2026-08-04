// ─── TRAVIO — Accès chauffeur (page autonome, sans authentification) ───
// Accès via lien du type : chauffeur.html?a=AGENCE_ID&t=TOKEN_AGENCE

const API_BASE = 'https://travio-backend-pa4q.onrender.com';

const params    = new URLSearchParams(window.location.search);
const AGENCE_ID = params.get('a') || '';
const ACCES_TOKEN = params.get('t') || '';

let colisActuel = null;

// ════════════════════════════════
//  UTILS
// ════════════════════════════════
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function escapeJsAttr(str) {
  return String(str ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function showScreen(name) {
  document.getElementById('chScreenSearch').style.display  = name === 'search'  ? 'flex' : 'none';
  document.getElementById('chScreenResult').style.display  = name === 'result'  ? 'flex' : 'none';
  document.getElementById('chScreenConfirm').style.display = name === 'confirm' ? 'flex' : 'none';
}

function setSearchError(msg) {
  const el = document.getElementById('chSearchError');
  if (!msg) { el.style.display = 'none'; el.textContent = ''; return; }
  el.textContent = msg;
  el.style.display = 'block';
}

async function apiCall(path, options = {}) {
  const sep = path.includes('?') ? '&' : '?';
  const url = `${API_BASE}${path}${sep}agenceId=${encodeURIComponent(AGENCE_ID)}&token=${encodeURIComponent(ACCES_TOKEN)}`;
  const res  = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

// ════════════════════════════════
//  VÉRIFICATION D'ACCÈS AU CHARGEMENT
// ════════════════════════════════
window.addEventListener('DOMContentLoaded', () => {
  if (!AGENCE_ID || !ACCES_TOKEN) {
    document.querySelector('.ch-main').innerHTML = `
      <div class="ch-search-card" style="margin:auto;">
        <div class="ch-search-icon" style="background:rgba(255,77,106,0.14);border-color:rgba(255,77,106,0.25);color:var(--danger);">!</div>
        <h1>Lien invalide</h1>
        <p>Ce lien d'accès est incomplet ou incorrect. Demandez à votre agence de vous renvoyer le lien.</p>
      </div>`;
    return;
  }
  document.getElementById('chCodeInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') verifierCode();
  });
  document.getElementById('chCodeInput').focus();
});

// ════════════════════════════════
//  ÉCRAN 1 — VÉRIFIER LE CODE
// ════════════════════════════════
async function verifierCode() {
  const input = document.getElementById('chCodeInput');
  let code = (input.value || '').trim().toUpperCase();
  if (!code) { setSearchError('Entrez un code de colis.'); return; }
  if (!code.startsWith('TRV-')) code = `TRV-${code}`;

  setSearchError('');
  const btn = document.getElementById('chBtnVerifier');
  btn.disabled = true;
  btn.innerHTML = `<span class="ch-spinner"></span><span class="ch-btn-label">Vérification…</span>`;

  try {
    const { ok, status, data } = await apiCall(`/colis/chauffeur/verifier/${encodeURIComponent(code)}`, { method: 'GET' });

    if (status === 404) {
      setSearchError('Code invalide ou colis introuvable. Vérifiez le code inscrit sur le colis.');
      return;
    }
    if (status === 403) {
      setSearchError("Ce colis n'est pas rattaché à votre agence.");
      return;
    }
    if (!ok && !data.colis) {
      setSearchError(data.message || 'Erreur lors de la vérification.');
      return;
    }

    colisActuel = data.colis;
    afficherColis(colisActuel, data.message || null);
    showScreen('result');
    input.value = '';

  } catch (err) {
    console.error('Erreur vérification code :', err);
    setSearchError('Impossible de contacter le serveur. Vérifiez votre connexion.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<span class="ch-btn-label">Vérifier</span>`;
  }
}

function retourRecherche() {
  colisActuel = null;
  document.getElementById('chCodeInput').value = '';
  setSearchError('');
  showScreen('search');
  setTimeout(() => document.getElementById('chCodeInput')?.focus(), 100);
}

// ════════════════════════════════
//  ÉCRAN 2 — AFFICHAGE DU COLIS
// ════════════════════════════════
function badgeStatut(statut) {
  if (statut === 'en_transit') return `<span class="ch-status-badge transit">En transit</span>`;
  if (statut === 'arrive')     return `<span class="ch-status-badge arrive">Arrivé</span>`;
  if (statut === 'retire')     return `<span class="ch-status-badge retire">Retiré</span>`;
  return `<span class="ch-status-badge transit">${escapeHtml(statut)}</span>`;
}

function afficherColis(c, messageInfo) {
  const card = document.getElementById('chColisCard');
  const zone = document.getElementById('chActionZone');

  const depart = c.pdvEmbarquementNom || c.arretMontee || '—';
  const arrivee = c.pdvDebarquementNom || c.arretDescente || '—';

  card.innerHTML = `
    <div class="ch-colis-head">
      <span class="ch-colis-code">${escapeHtml(c.codeRetrait)}</span>
      ${badgeStatut(c.statut)}
    </div>

    <div class="ch-route-block">
      <div class="ch-route-line">
        <div class="ch-route-stop"><span class="ch-route-dot start"></span><strong>${escapeHtml(depart)}</strong></div>
        <div class="ch-route-stop"><span class="ch-route-dot end"></span><strong>${escapeHtml(arrivee)}</strong></div>
      </div>
    </div>

    <div class="ch-people-grid">
      <div class="ch-person-block">
        <span class="ch-person-label">Expéditeur</span>
        <span class="ch-person-name">${escapeHtml(c.expediteurNom)}</span>
        <span class="ch-person-tel">${escapeHtml(c.expediteurTel)}</span>
      </div>
      <div class="ch-person-block">
        <span class="ch-person-label">Destinataire</span>
        <span class="ch-person-name">${escapeHtml(c.destinataireNom)}</span>
        <span class="ch-person-tel">${escapeHtml(c.destinataireTel)}</span>
      </div>
    </div>

    <div class="ch-meta-row"><span>Trajet</span><strong>${escapeHtml(c.routeLabel) || '—'}</strong></div>
    <div class="ch-meta-row"><span>Départ</span><strong>${escapeHtml(c.dateDepart) || '—'} ${escapeHtml(c.heureDepart) || ''}</strong></div>
    <div class="ch-meta-row"><span>Bus</span><strong>${escapeHtml(c.busNom) || '—'}</strong></div>
    <div class="ch-meta-row"><span>Nature</span><strong>${escapeHtml(c.nature) || '—'}</strong></div>
  `;

  // ── Zone d'action selon le statut ──
  if (c.statut === 'retire') {
    zone.innerHTML = `
      <div class="ch-info-box" style="background:rgba(77,159,255,0.08);border-color:rgba(77,159,255,0.25);color:#4D9FFF;">
        Ce colis a déjà été retiré${c.dateRetrait ? ' le ' + new Date(c.dateRetrait).toLocaleString('fr-FR') : ''}.
      </div>
      <button class="ch-btn-secondary" onclick="retourRecherche()">Nouveau code</button>
    `;
    return;
  }

  if (c.statut === 'en_transit') {
    zone.innerHTML = `
      <div class="ch-info-box">${escapeHtml(messageInfo) || "Ce colis est encore en transit."}</div>
      <button class="ch-btn-primary accent" onclick="marquerArrive('${escapeJsAttr(c.id)}')">
        <span class="ch-btn-label">Marquer comme arrivé</span>
      </button>
      <button class="ch-btn-secondary" onclick="retourRecherche()">Nouveau code</button>
    `;
    return;
  }

  if (c.statut === 'arrive') {
    zone.innerHTML = `
      <button class="ch-btn-primary accent" onclick="afficherFormulaireRetrait('${escapeJsAttr(c.id)}')">
        <span class="ch-btn-label">Marquer comme retiré</span>
      </button>
      <button class="ch-btn-secondary" onclick="retourRecherche()">Nouveau code</button>
      <div id="chRetraitFormZone"></div>
    `;
    return;
  }

  zone.innerHTML = `<button class="ch-btn-secondary" onclick="retourRecherche()">Nouveau code</button>`;
}

// ════════════════════════════════
//  ACTION — MARQUER ARRIVÉ
// ════════════════════════════════
async function marquerArrive(id) {
  const btn = event?.target?.closest('button');
  if (btn) { btn.disabled = true; btn.innerHTML = `<span class="ch-spinner"></span><span class="ch-btn-label">Enregistrement…</span>`; }

  try {
    const { ok, data } = await apiCall(`/colis/chauffeur/${id}/statut`, {
      method: 'PATCH',
      body: JSON.stringify({ statut: 'arrive' }),
    });

    if (!ok) {
      alert(data.message || "Erreur lors de la mise à jour.");
      if (btn) { btn.disabled = false; btn.innerHTML = `<span class="ch-btn-label">Marquer comme arrivé</span>`; }
      return;
    }

    colisActuel = data.colis;
    afficherColis(colisActuel, null);
    showScreen('result');
  } catch (err) {
    console.error('Erreur marquerArrive :', err);
    alert("Impossible de contacter le serveur.");
    if (btn) { btn.disabled = false; btn.innerHTML = `<span class="ch-btn-label">Marquer comme arrivé</span>`; }
  }
}

// ════════════════════════════════
//  ACTION — FORMULAIRE DE RETRAIT
// ════════════════════════════════
function afficherFormulaireRetrait(id) {
  const zone = document.getElementById('chRetraitFormZone');
  if (!zone) return;

  zone.innerHTML = `
    <div class="ch-retrait-form">
      <h3>Confirmer le retrait</h3>

      <div class="ch-field-group">
        <label>Nom de la personne qui retire le colis *</label>
        <input type="text" class="ch-form-input" id="chRetraitPar" placeholder="Ex : ${escapeHtml(colisActuel?.destinataireNom || '')}">
      </div>

      <div class="ch-field-group">
        <label>Type de pièce d'identité *</label>
        <select class="ch-form-select" id="chTypePiece" onchange="onTypePieceChange()">
          <option value="">— Sélectionner —</option>
          <option value="cni">Carte nationale d'identité</option>
          <option value="passeport">Passeport</option>
          <option value="permis">Permis de conduire</option>
          <option value="aucune">Aucune pièce disponible</option>
        </select>
      </div>

      <div class="ch-field-group" id="chNumPieceGroup">
        <label>Numéro de la pièce *</label>
        <input type="text" class="ch-form-input" id="chNumPiece" placeholder="Ex : CG0012345">
      </div>

      <div class="ch-field-group" id="chSansPieceGroup" style="display:none;">
        <label>Précision (témoin, motif...) *</label>
        <input type="text" class="ch-form-input" id="chSansPieceInfo" placeholder="Ex : retrait en présence de M. Nzila">
      </div>

      <button class="ch-btn-primary accent" id="chBtnConfirmRetrait" onclick="confirmerRetrait('${escapeJsAttr(id)}')">
        <span class="ch-btn-label">Confirmer le retrait</span>
      </button>
    </div>
  `;
  zone.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function onTypePieceChange() {
  const type = document.getElementById('chTypePiece')?.value;
  const estSansPiece = type === 'aucune';
  document.getElementById('chNumPieceGroup').style.display  = estSansPiece ? 'none'  : 'block';
  document.getElementById('chSansPieceGroup').style.display = estSansPiece ? 'block' : 'none';
}

async function confirmerRetrait(id) {
  const retirePar           = document.getElementById('chRetraitPar')?.value.trim();
  const typePieceIdentite   = document.getElementById('chTypePiece')?.value;
  const estSansPiece        = typePieceIdentite === 'aucune';
  const numeroPieceIdentite = document.getElementById('chNumPiece')?.value.trim();
  const infoSansPiece       = document.getElementById('chSansPieceInfo')?.value.trim();

  if (!retirePar)         { alert('Indiquez le nom de la personne qui retire le colis.'); return; }
  if (!typePieceIdentite) { alert("Sélectionnez le type de pièce d'identité."); return; }
  if (estSansPiece && !infoSansPiece)          { alert("Indiquez une précision en l'absence de pièce d'identité."); return; }
  if (!estSansPiece && !numeroPieceIdentite)   { alert("Indiquez le numéro de la pièce d'identité."); return; }

  const btn = document.getElementById('chBtnConfirmRetrait');
  btn.disabled = true;
  btn.innerHTML = `<span class="ch-spinner"></span><span class="ch-btn-label">Enregistrement…</span>`;

  try {
    const { ok, data } = await apiCall(`/colis/chauffeur/${id}/statut`, {
      method: 'PATCH',
      body: JSON.stringify({
        statut: 'retire',
        retirePar,
        typePieceIdentite,
        numeroPieceIdentite: estSansPiece ? null : numeroPieceIdentite,
        infoSansPiece: estSansPiece ? infoSansPiece : null,
      }),
    });

    if (!ok) {
      alert(data.message || "Erreur lors de la mise à jour.");
      btn.disabled = false;
      btn.innerHTML = `<span class="ch-btn-label">Confirmer le retrait</span>`;
      return;
    }

    afficherConfirmation('Colis marqué retiré', `Retrait confirmé pour ${retirePar}.`);
  } catch (err) {
    console.error('Erreur confirmerRetrait :', err);
    alert("Impossible de contacter le serveur.");
    btn.disabled = false;
    btn.innerHTML = `<span class="ch-btn-label">Confirmer le retrait</span>`;
  }
}

// ════════════════════════════════
//  ÉCRAN 3 — CONFIRMATION
// ════════════════════════════════
function afficherConfirmation(titre, sousTitre) {
  document.getElementById('chConfirmTitle').textContent = titre;
  document.getElementById('chConfirmSub').textContent = sousTitre;
  showScreen('confirm');
}

// ════════════════════════════════
//  EXPOSER AU HTML (onclick inline)
// ════════════════════════════════
window.verifierCode           = verifierCode;
window.retourRecherche        = retourRecherche;
window.marquerArrive          = marquerArrive;
window.afficherFormulaireRetrait = afficherFormulaireRetrait;
window.onTypePieceChange      = onTypePieceChange;
window.confirmerRetrait       = confirmerRetrait;