// ─── TRAVIO — Agence (onboarding, profil, édition) ───

import { BACKEND, agenceData, setAgenceData, currentUser, uploadedLogo, setUploadedLogo, uploadedPhotos, setUploadedPhotos, currentStep, setCurrentStep, editNewLogo, setEditNewLogo, editPhotosToDelete, setEditPhotosToDelete, editPhotosToAdd, setEditPhotosToAdd, pdvList } from './state.js';
import { escapeHtml, escapeJsAttr } from './sanitize.js';
import { showToast, setBtnLoading, TOAST_ICONS } from './toast-utils.js';
import { updateBilletConfigBadge } from './billet-config.js';
import { loadTrajets } from './trajets.js';
import { loadPDV } from './pdv.js';
import { loadReservationsAgence } from './reservations.js';
import { updateOverviewStats } from './trajets.js';
import { apiFetch } from './api.js';

const ICONS = {
  lock:    '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-1px;"><rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" stroke-width="1.4"/><path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" stroke-width="1.4"/></svg>',
  warning: '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-1px;"><path d="M8 2L1 14h14L8 2z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M8 6.5v3.5M8 12v.1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  check:   '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-1px;"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.4"/><path d="M5 8l2 2 4-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  clock:   '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-1px;"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.4"/><path d="M8 5v3.5l2.5 1.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  banned:  '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-1px;"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.4"/><path d="M4 4l8 8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  blocked: '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-1px;"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.4"/><path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  refresh: '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-1px;"><path d="M13 8A5 5 0 103 8M13 8V4M13 8H9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  bolt:    '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-1px;"><path d="M9 1L3 9h4l-1 6 6-8H8l1-6z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>',
  siren:   '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-1px;"><path d="M8 2a4 4 0 014 4v5H4V6a4 4 0 014-4z" stroke="currentColor" stroke-width="1.4"/><path d="M2 13h12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  calendar:'<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-1px;"><rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M5 1v4M11 1v4M2 7h12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
};

// ════════════════════════════════
//  AGENCE — CHARGEMENT
// ════════════════════════════════
export async function loadAgenceData(agenceId) {
  try {
    const res = await apiFetch(`${BACKEND}/agence/${agenceId}`);
    const data = await res.json();
    if (!res.ok) return;
    setAgenceData(data);
    updateAgenceUI(data);
    await loadTrajets(agenceId);
    await loadPDV(agenceId);
    await loadReservationsAgence(agenceId);
    updateOverviewStats();
  } catch (err) {
    console.error('Erreur chargement agence :', err);
  }
}

export function updateAgenceUI(data) {
  const topbarName = document.getElementById('topbarAgenceName');
  if (topbarName) topbarName.textContent = data.nom || '—';

  updateBilletConfigBadge();

  const topbarLogo = document.getElementById('topbarAgenceLogo');
  if (topbarLogo) {
    topbarLogo.innerHTML = data.logoUrl
      ? `<img src="${escapeHtml(data.logoUrl)}" style="width:100%;height:100%;object-fit:cover;">`
      : escapeHtml(data.nom?.[0] || '?');
  }
  const subtitle = document.getElementById('overviewAgence');
  if (subtitle) subtitle.textContent = `${data.nom} — Voici ce qui se passe aujourd'hui.`;
  const politiqueEl = document.getElementById('overviewPolitiqueAnnul');
  if (politiqueEl && data.politiqueAnnulation) {
    const pol = data.politiqueAnnulation;
    let label, cls;
    if (!pol.autorise) {
      label = `${ICONS.lock} Vente définitive — aucune annulation`;
      cls = 'pol-badge-rouge';
    } else if (!pol.remboursement) {
      label = `${ICONS.warning} Annulation sans remboursement${pol.delaiHeures ? ' · délai ' + Number(pol.delaiHeures) + 'h' : ''}`;
      cls = 'pol-badge-orange';
    } else {
      label = `${ICONS.check} Annulation avec remboursement · ${Number(pol.precisions || 0)}% retenus · délai ${pol.delaiHeures ? Number(pol.delaiHeures) : '?'}h`;
      cls = 'pol-badge-vert';
    }
    politiqueEl.innerHTML = `
    <div style="
      display:flex;align-items:center;gap:10px;
      background:var(--surface);border:1px solid var(--border);
      border-radius:12px;padding:12px 16px;margin-bottom:4px;
    ">
      <span style="font-size:12px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.8px;">Politique d'annulation</span>
      <span class="pol-badge ${cls}">${label}</span>
    </div>`;
  }
  renderAgenceProfile(data);
}

export function renderAgenceProfile(data) {
  const container = document.getElementById('agenceProfile');
  if (!container) return;

  const pointsList = [data.point1, data.point2, data.point3]
    .filter(Boolean)
    .map(p => `<div class="agence-point-item"><div class="agence-point-bullet"></div>${escapeHtml(p)}</div>`)
    .join('');

  const photosStrip = (data.photos && data.photos.length)
  ? data.photos.map(url => `<div class="agence-photo-item"><img src="${escapeHtml(url)}" alt="Photo agence"></div>`).join('')
    : `<div class="agence-photo-item" style="display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:12px;width:100%">Aucune photo ajoutée</div>`;

  container.innerHTML = `
    <div class="agence-hero">
      <div class="agence-photos-strip">${photosStrip}</div>
      <div class="agence-hero-info">
        <div class="agence-logo-wrap">
        ${data.logoUrl ? `<img src="${escapeHtml(data.logoUrl)}" alt="${escapeHtml(data.nom)}">` : escapeHtml(data.nom?.[0] || '?')}
        </div>
        <div class="agence-hero-text">
          <div class="agence-hero-name">${escapeHtml(data.nom || '—')}</div>
          ${data.slogan ? `<div class="agence-hero-slogan">"${escapeHtml(data.slogan)}"</div>` : ''}
          <div class="agence-hero-meta">
            <span class="agence-meta-tag">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 1a5 5 0 00-5 5c0 3.5 5 9 5 9s5-5.5 5-9a5 5 0 00-5-5z" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="6" r="1.5" stroke="currentColor" stroke-width="1.5"/></svg>
              ${escapeHtml(data.ville || '—')}, ${escapeHtml(data.pays || 'Congo Brazzaville')}
            </span>
            ${data.telephone ? `<span class="agence-meta-tag">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 2h3l1.5 3.5-2 1.2A8.5 8.5 0 009.3 10.5l1.2-2L14 10v3a1 1 0 01-1 1A12 12 0 012 3a1 1 0 011-1z" stroke="currentColor" stroke-width="1.5"/></svg>
              ${escapeHtml(data.telephone)}
            </span>` : ''}
            ${data.anneeCreation ? `<span class="agence-meta-tag">Depuis ${escapeHtml(String(data.anneeCreation))}</span>` : ''}
          </div>
        </div>
      </div>
    </div>
    <div class="agence-info-grid">
    ${data.description ? `<div class="agence-info-card"><h4>Description</h4><p>${escapeHtml(data.description)}</p></div>` : ''}
      ${data.histoire    ? `<div class="agence-info-card"><h4>Notre histoire</h4><p>${escapeHtml(data.histoire)}</p></div>` : ''}
      ${pointsList       ? `<div class="agence-info-card"><h4>Pourquoi nous choisir</h4><div class="agence-points-list">${pointsList}</div></div>` : ''}
      ${data.engagements ? `<div class="agence-info-card"><h4>Nos engagements</h4><p>${escapeHtml(data.engagements)}</p></div>` : ''}
      ${data.regles      ? `<div class="agence-info-card"><h4>Règles de l'agence</h4><p>${escapeHtml(data.regles)}</p></div>` : ''}
      ${data.politiqueAnnulation ? `<div class="agence-info-card"><h4>Politique d'annulation</h4><p>${
        !data.politiqueAnnulation.autorise
          ? 'Vente définitive — aucune annulation possible.'
          : data.politiqueAnnulation.remboursement
            ? `Annulation avec remboursement, jusqu'à ${data.politiqueAnnulation.delaiHeures ? Number(data.politiqueAnnulation.delaiHeures) : '?'}h avant le départ.${data.politiqueAnnulation.precisions ? '<br><small style="color:var(--muted)">Frais retenus : ' + Number(data.politiqueAnnulation.precisions) + '%</small>' : ''}`
            : `Annulation autorisée sans remboursement.${data.politiqueAnnulation.precisions ? '<br><small style="color:var(--muted)">Frais retenus : ' + Number(data.politiqueAnnulation.precisions) + '%</small>' : ''}`
      }</p></div>` : ''}
      <div class="agence-info-card"><h4>Contact</h4><p>${escapeHtml(data.adresse || '—')}<br>${escapeHtml(data.telephone || '—')}</p></div>
    </div>
  `;
}

// ════════════════════════════════
//  ONBOARDING
// ════════════════════════════════
export function showOnboarding() {
  const overlay = document.getElementById('onboardingOverlay');
  if (overlay) overlay.classList.remove('hidden');
  goToStep(1);
}

export function hideOnboarding() {
  const overlay = document.getElementById('onboardingOverlay');
  if (overlay) overlay.classList.add('hidden');
}

function goToStepBase(step) {
  setCurrentStep(step);
  [1, 2, 3].forEach(i => {
    const el = document.getElementById(`step${i}`);
    if (el) el.classList.toggle('hidden', i !== step);
  });
  const fill = document.getElementById('obProgressFill');
  if (fill) fill.style.width = `${(step / 3) * 100}%`;
  const label = document.getElementById('obStepLabel');
  if (label) label.textContent = `Étape ${step} sur 3`;
  [0, 1, 2].forEach(i => {
    const dot = document.getElementById(`sdot${i}`);
    if (dot) dot.classList.toggle('active', i === step - 1);
  });
  const modal = document.getElementById('obModal');
  if (modal) modal.scrollTop = 0;
}

export function goToStep(step) {
  if (step > currentStep) {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
  }
  goToStepBase(step);
}

function validateStep1() {
  const nom   = document.getElementById('agence-nom');
  const ville = document.getElementById('agence-ville');
  let ok = true;
  [nom, ville].forEach(el => {
    if (!el.value.trim()) {
      el.classList.add('error');
      el.addEventListener('input', () => el.classList.remove('error'), { once: true });
      ok = false;
    }
  });
  if (!ok) { showToast('Remplissez les champs obligatoires.', TOAST_ICONS.warning); return false; }
  if (!uploadedLogo) { showToast('Veuillez uploader le logo de votre agence.', TOAST_ICONS.image); return false; }
  return true;
}

function validateStep2() {
  const adresse = document.getElementById('agence-adresse');
  const tel     = document.getElementById('agence-tel');
  let ok = true;
  [adresse, tel].forEach(el => {
    if (!el.value.trim()) {
      el.classList.add('error');
      el.addEventListener('input', () => el.classList.remove('error'), { once: true });
      ok = false;
    }
  });

  // Vérification spécifique : le téléphone doit faire exactement 9 chiffres
  if (tel.value.trim() && tel.value.trim().length !== 9) {
    tel.classList.add('error');
    tel.addEventListener('input', () => tel.classList.remove('error'), { once: true });
    ok = false;
    showToast('Le numéro de téléphone doit contenir exactement 9 chiffres.', TOAST_ICONS.warning);
    return false;
  }

  if (!ok) { showToast('Remplissez les champs obligatoires.', TOAST_ICONS.warning); return false; }
  return true;
}

function validateStep3() {
  const slogan = document.getElementById('agence-slogan');
  const desc   = document.getElementById('agence-description');
  let ok = true;
  [slogan, desc].forEach(el => {
    if (!el.value.trim()) {
      el.classList.add('error');
      el.addEventListener('input', () => el.classList.remove('error'), { once: true });
      ok = false;
    }
  });
  if (!ok) { showToast('Le slogan et la description sont obligatoires.', TOAST_ICONS.warning); return false; }
  return true;
}

// ════════════════════════════════
//  UPLOAD LOGO
// ════════════════════════════════
export function handleLogoUpload(input) {
  const file = input.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) { showToast('Veuillez sélectionner une image.', TOAST_ICONS.error); return; }
  const reader = new FileReader();
  reader.onload = (e) => {
    setUploadedLogo(e.target.result);
    const preview = document.getElementById('logoPreview');
    if (preview) preview.innerHTML = `<img src="${e.target.result}" alt="Logo" class="ob-logo-preview-img">`;
    const zone = document.getElementById('logoUploadZone');
    if (zone) zone.style.borderStyle = 'solid';
  };
  reader.readAsDataURL(file);
}

// ════════════════════════════════
//  UPLOAD PHOTOS
// ════════════════════════════════
export function handlePhotosUpload(input) {
  const files = Array.from(input.files);
  if (files.length === 0) return;

  const remaining = 5 - uploadedPhotos.length;
  if (remaining <= 0) { showToast('Maximum 5 photos atteint.', TOAST_ICONS.info); return; }

  const toAdd = files.slice(0, remaining);
  const promises = toAdd.map(file => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  }));

  Promise.all(promises).then(results => {
    setUploadedPhotos([...uploadedPhotos, ...results]);
    renderPhotosPreview();
    input.value = '';
    if (uploadedPhotos.length >= 5) showToast('Maximum 5 photos atteint.', TOAST_ICONS.info);
  });
}

export function renderPhotosPreview() {
  const preview = document.getElementById('photosPreview');
  if (!preview) return;

  const thumbs = uploadedPhotos.map((src, i) => `
    <div class="ob-photo-thumb-wrap">
      <img src="${src}" class="ob-photo-thumb" alt="Photo ${i+1}">
      <button class="ob-photo-remove" onclick="removePhoto(${i})">×</button>
    </div>
  `).join('');

  const addMore = uploadedPhotos.length < 5
    ? `<div class="ob-photo-add" onclick="document.getElementById('photosFileInput').click()">+</div>`
    : '';

  preview.innerHTML = `<div class="ob-photos-grid">${thumbs}${addMore}</div>`;
}

export function removePhoto(index) {
  const newPhotos = [...uploadedPhotos];
  newPhotos.splice(index, 1);
  setUploadedPhotos(newPhotos);
  renderPhotosPreview();
}

function buildPolitiqueAnnulation() {
  const autorise = document.querySelector('input[name="ob-annul"]:checked')?.value;
  if (!autorise || autorise === 'non') return { autorise: false, remboursement: false, delaiHeures: null, precisions: null };
  
  // Cherche dans l'onboarding ET dans l'edit
  const delaiEl  = document.getElementById('edit-annul-delai')     || document.getElementById('ob-annul-delai');
  const precisEl = document.getElementById('edit-annul-precisions') || document.getElementById('ob-annul-precisions');

  return {
    autorise:      true,
    remboursement: autorise === 'remboursement',
    delaiHeures:   parseInt(delaiEl?.value) || null,
    precisions:    parseFloat(precisEl?.value) || null,
  };
}

function buildDelaiFormalite() {
  const valeurEl = document.getElementById('edit-delai-formalite-valeur') || document.getElementById('ob-delai-formalite-valeur');
  const uniteEl  = document.getElementById('edit-delai-formalite-unite')  || document.getElementById('ob-delai-formalite-unite');
  const valeur = parseInt(valeurEl?.value) || null;
  if (!valeur) return null;
  return { valeur, unite: uniteEl?.value || 'minutes' };
}

// ════════════════════════════════
//  SOUMETTRE L'AGENCE
// ════════════════════════════════
export async function submitAgency() {
  if (!validateStep3()) return;
  const btn = document.getElementById('obFinalBtn');
  setBtnLoading(btn, true, ['Préparation des données...', 'Upload des images...', 'Création de l\'agence...', 'Finalisation...']);

  const agencePayload = {
    uid:           currentUser.uid,
    nom:           document.getElementById('agence-nom').value.trim(),
    ville:         document.getElementById('agence-ville').value.trim(),
    pays:          document.getElementById('agence-pays').value.trim(),
    adresse:       document.getElementById('agence-adresse').value.trim(),
    telephone:     document.getElementById('agence-tel').value.trim(),
    slogan:        document.getElementById('agence-slogan').value.trim(),
    description:   document.getElementById('agence-description').value.trim(),
    histoire:      document.getElementById('agence-histoire').value.trim(),
    anneeCreation: document.getElementById('agence-annee').value.trim(),
    point1:        document.getElementById('point1').value.trim(),
    point2:        document.getElementById('point2').value.trim(),
    point3:        document.getElementById('point3').value.trim(),
    engagements:   document.getElementById('agence-engagements').value.trim(),
    regles:        document.getElementById('agence-regles').value.trim(),
    politiqueAnnulation: buildPolitiqueAnnulation(),
    delaiFormalite: buildDelaiFormalite(),
    logoBase64:    uploadedLogo,
    photosBase64:  uploadedPhotos,
  };

  try {
    const res = await apiFetch(`${BACKEND}/agence/create`, {
      method: 'POST',
      body: JSON.stringify(agencePayload),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast('Erreur lors de la création. Veuillez réessayer.', TOAST_ICONS.error);
      setBtnLoading(btn, false);
      return;
    }

    setAgenceData(data.agence);
    const modal = document.getElementById('obModal');
    if (modal) {
      modal.style.transition = 'transform 0.4s ease, opacity 0.4s ease';
      modal.style.transform  = 'translateY(100%)';
      modal.style.opacity    = '0';
    }
    setTimeout(() => {
      hideOnboarding();
      updateAgenceUI(data.agence);
      showCongrats(data.agence);
    }, 420);

  } catch (err) {
    console.error('Erreur création agence :', err);
    showToast('Impossible de contacter le serveur.', TOAST_ICONS.error);
    setBtnLoading(btn, false);
  }
}

// ════════════════════════════════
//  FÉLICITATIONS
// ════════════════════════════════
export function showCongrats(data) {
  const existing = document.getElementById('congratsOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'congratsOverlay';
  overlay.className = 'congrats-overlay';
  overlay.innerHTML = `
    <div class="congrats-backdrop"></div>
    <div class="congrats-card" id="congratsCard">
      <div class="congrats-particles">
        <span class="cp cp1">✦</span><span class="cp cp2">★</span>
        <span class="cp cp3">✦</span><span class="cp cp4">●</span>
        <span class="cp cp5">✦</span><span class="cp cp6">★</span>
      </div>
      <div class="congrats-logo-wrap">
        ${data.logoUrl
          ? `<img src="${escapeHtml(data.logoUrl)}" alt="${escapeHtml(data.nom)}" class="congrats-logo-img">`
          : `<div class="congrats-logo-placeholder">${escapeHtml(data.nom?.[0] || '?')}</div>`}
        <div class="congrats-check">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7L5.5 10L11.5 4" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
      </div>
      <div class="congrats-text">
        <div class="congrats-badge">Agence créée avec succès</div>
        <h2>Bienvenue sur Travio,<br><em>${escapeHtml(data.nom)}</em></h2>
        <p>Votre agence est créée. Votre période d'essai gratuit de 12 jours commence maintenant — accédez à votre dashboard et configurez vos trajets.</p>
      </div>
      <div class="congrats-summary">
        <div class="congrats-summary-item"><span class="cs-label">Agence</span><span class="cs-value">${escapeHtml(data.nom)}</span></div>
        <div class="congrats-summary-divider"></div>
        <div class="congrats-summary-item"><span class="cs-label">Ville</span><span class="cs-value">${escapeHtml(data.ville)}</span></div>
        <div class="congrats-summary-divider"></div>
        <div class="congrats-summary-item"><span class="cs-label">Statut</span><span class="cs-value" style="color:var(--accent);">${ICONS.check} Essai actif</span></div>
      </div>
      <div class="congrats-actions">
        <button class="congrats-btn-primary" onclick="closeCongrats('overview')">Accéder à mon dashboard →</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
}

export function closeCongrats(page) {
  const overlay = document.getElementById('congratsOverlay');
  if (overlay) { overlay.classList.remove('show'); setTimeout(() => overlay.remove(), 350); }
  if (page) {
    const navEl = document.querySelector(`[data-page="${page}"]`);
    window.showPage(page, navEl);
  }
}

// ════════════════════════════════
//  MODIFIER AGENCE — CHOIX
// ════════════════════════════════
export function openEditAgence() {
  const overlay = document.createElement('div');
  overlay.id = 'editChoiceOverlay';
  overlay.className = 'pdv-overlay';
  overlay.innerHTML = `
    <div class="pdv-overlay-backdrop" onclick="closeEditChoice()"></div>
    <div class="pdv-overlay-panel" style="max-width:420px; padding:28px 24px 36px;">
      <div class="pdv-overlay-header">
        <div>
          <h2>Modifier l'agence</h2>
          <p>Que souhaitez-vous modifier ?</p>
        </div>
        <button class="pdv-overlay-close" onclick="closeEditChoice()">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:8px;">
        <button class="pdv-action-btn" onclick="closeEditChoice();openEditFiche()">
          <svg width="16" height="16" viewBox="0 0 14 14" fill="none"><path d="M9 2l3 3L4 13H1v-3L9 2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg> <div><strong style="display:block;font-size:13px;">Modifier la fiche</strong><small style="color:var(--muted);font-size:11.5px;">Nom, slogan, description, contact…</small></div>
        </button>
        <button class="pdv-action-btn" onclick="closeEditChoice();openEditImages()">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/><circle cx="5" cy="6" r="1.3" stroke="currentColor" stroke-width="1.3"/><path d="M2 12l4-4 3 3 3-3 3 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg> <div><strong style="display:block;font-size:13px;">Gérer les images</strong><small style="color:var(--muted);font-size:11.5px;">Logo et photos de l'agence</small></div>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
  restrictPhoneInput('edit-telephone');
}

export function closeEditChoice() {
  const o = document.getElementById('editChoiceOverlay');
  if (o) { o.classList.remove('show'); setTimeout(() => o.remove(), 350); }
}

// ════════════════════════════════
//  MODIFIER FICHE AGENCE
// ════════════════════════════════
export function openEditFiche() {
  if (!agenceData) return;
  const d = agenceData;

  const overlay = document.createElement('div');
  overlay.id = 'editFicheOverlay';
  overlay.className = 'pdv-overlay';
  overlay.innerHTML = `
    <div class="pdv-overlay-backdrop" onclick="closeEditFiche()"></div>
    <div class="pdv-overlay-panel" style="max-width:560px;">
      <div class="pdv-overlay-header">
        <div>
          <h2>Modifier la fiche agence</h2>
          <p>Les modifications seront sauvegardées immédiatement.</p>
        </div>
        <button class="pdv-overlay-close" onclick="closeEditChoice()">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <div class="pdv-create-fields">
        <div class="pdv-field-group"><label>Nom de l'agence <span class="req">*</span></label><input type="text" class="pdv-input" id="edit-nom" value="${escapeHtml(d.nom || '')}"></div>
        <div class="pdv-field-group"><label>Slogan / Devise <span class="req">*</span></label><input type="text" class="pdv-input" id="edit-slogan" value="${escapeHtml(d.slogan || '')}"></div>
        <div class="pdv-field-group"><label>Description <span class="req">*</span></label><textarea class="ob-textarea" id="edit-description" rows="3">${escapeHtml(d.description || '')}</textarea></div>
        <div class="pdv-field-group"><label>Notre histoire</label><textarea class="ob-textarea" id="edit-histoire" rows="3">${escapeHtml(d.histoire || '')}</textarea></div>
        <div class="pdv-field-group"><label>Ville <span class="req">*</span></label><input type="text" class="pdv-input" id="edit-ville" value="${escapeHtml(d.ville || '')}"></div>
        <div class="pdv-field-group"><label>Adresse <span class="req">*</span></label><input type="text" class="pdv-input" id="edit-adresse" value="${escapeHtml(d.adresse || '')}"></div>
        <div class="pdv-field-group"><label>Téléphone <span class="req">*</span></label><input type="tel" class="pdv-input" id="edit-telephone" value="${escapeHtml(d.telephone || '')}"></div>
        <div class="pdv-field-group"><label>Année de création</label><input type="number" class="pdv-input" id="edit-annee" value="${escapeHtml(String(d.anneeCreation || ''))}" min="1950" max="2025"></div>
        <div class="pdv-field-group"><label>Pourquoi nous choisir — Point 1</label><input type="text" class="pdv-input" id="edit-point1" value="${escapeHtml(d.point1 || '')}"></div>
        <div class="pdv-field-group"><label>Pourquoi nous choisir — Point 2</label><input type="text" class="pdv-input" id="edit-point2" value="${escapeHtml(d.point2 || '')}"></div>
        <div class="pdv-field-group"><label>Pourquoi nous choisir — Point 3</label><input type="text" class="pdv-input" id="edit-point3" value="${escapeHtml(d.point3 || '')}"></div>
        <div class="pdv-field-group"><label>Nos engagements</label><textarea class="ob-textarea" id="edit-engagements" rows="3">${escapeHtml(d.engagements || '')}</textarea></div>
        <div class="pdv-field-group"><label>Règles de l'agence</label><textarea class="ob-textarea" id="edit-regles" rows="3">${escapeHtml(d.regles || '')}</textarea></div>
        <div class="pdv-field-group">
          <label style="font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;">Politique d'annulation</label>
          <div style="display:flex;flex-direction:column;gap:8px;margin-top:6px;margin-bottom:10px;">
            <label class="ob-radio-item">
              <input type="radio" name="ob-annul" value="remboursement" ${d.politiqueAnnulation?.remboursement ? 'checked' : ''}>
              <span>Annulation autorisée avec remboursement</span>
            </label>
            <label class="ob-radio-item">
              <input type="radio" name="ob-annul" value="sans_remboursement" ${d.politiqueAnnulation?.autorise && !d.politiqueAnnulation?.remboursement ? 'checked' : ''}>
              <span>Annulation autorisée sans remboursement</span>
            </label>
            <label class="ob-radio-item">
              <input type="radio" name="ob-annul" value="non" ${!d.politiqueAnnulation?.autorise ? 'checked' : ''}>
              <span>Vente définitive — aucune annulation</span>
            </label>
          </div>

          <div class="pdv-field-group">
            <label>Délai de présentation avant le départ</label>
            <div style="display:flex;gap:8px;">
              <input type="number" min="1" class="pdv-input" id="edit-delai-formalite-valeur"
                value="${d.delaiFormalite?.valeur ? Number(d.delaiFormalite.valeur) : ''}" placeholder="Ex : 30" style="flex:1;">
              <select class="pdv-input" id="edit-delai-formalite-unite" style="flex:1;background:#0F1525;color:var(--white);">
                <option value="minutes" ${(!d.delaiFormalite || d.delaiFormalite.unite === 'minutes') ? 'selected' : ''}>Minutes</option>
                <option value="heures" ${d.delaiFormalite?.unite === 'heures' ? 'selected' : ''}>Heures</option>
              </select>
            </div>
          </div>

          <div id="edit-annul-delai-wrap" style="display:${d.politiqueAnnulation?.autorise ? 'block' : 'none'};margin-bottom:10px;">
            <label style="font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;display:block;margin-bottom:6px;">Délai limite avant le départ</label>
            <select class="pdv-input" id="edit-annul-delai" style="background:#0F1525;color:var(--white);">
              ${[1,2,6,12,24,48].map(h => `<option value="${h}" ${d.politiqueAnnulation?.delaiHeures == h ? 'selected' : ''}>Au moins ${h}h avant</option>`).join('')}
            </select>
          </div>
          <div id="edit-annul-precisions-wrap" style="display:${d.politiqueAnnulation?.remboursement ? 'block' : 'none'};">
            <label style="font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;display:block;margin-bottom:6px;">Frais d'annulation retenus par l'agence</label>
            <div style="position:relative;display:flex;align-items:center;">
            <input type="number" class="pdv-input" id="edit-annul-precisions"
            min="0" max="100" step="1" placeholder="Ex : 20"
            value="${d.politiqueAnnulation?.precisions ? Number(d.politiqueAnnulation.precisions) : ''}"
            style="padding-right:40px;">
              <span style="position:absolute;right:14px;color:var(--muted);font-size:14px;font-weight:600;pointer-events:none;">%</span>
            </div>
          </div>
        </div>
      </div>
      <button class="pdv-btn-next" id="editFicheSubmitBtn" onclick="submitEditFiche()">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:4px;">
          <path d="M3 2h8l2.5 2.5V13a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
          <path d="M5 2v4h5V2M4.5 9.5h7v4.5h-7z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
        </svg>
        Sauvegarder
      </button>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
}

export function closeEditFiche() {
  const o = document.getElementById('editFicheOverlay');
  if (o) { o.classList.remove('show'); setTimeout(() => o.remove(), 350); }
}

export async function submitEditFiche() {
  const nom       = document.getElementById('edit-nom')?.value.trim();
  const slogan    = document.getElementById('edit-slogan')?.value.trim();
  const desc      = document.getElementById('edit-description')?.value.trim();
  const ville     = document.getElementById('edit-ville')?.value.trim();
  const adresse   = document.getElementById('edit-adresse')?.value.trim();
  const telephone = document.getElementById('edit-telephone')?.value.trim();

  if (!nom || !slogan || !desc || !ville || !adresse || !telephone) {
    showToast('Remplissez tous les champs obligatoires.', TOAST_ICONS.warning); return;
  }

  const payload = {
    nom, slogan,
    description:   desc,
    histoire:      document.getElementById('edit-histoire')?.value.trim()    || null,
    ville, adresse, telephone,
    anneeCreation: document.getElementById('edit-annee')?.value.trim()       || null,
    point1:        document.getElementById('edit-point1')?.value.trim()      || null,
    point2:        document.getElementById('edit-point2')?.value.trim()      || null,
    point3:        document.getElementById('edit-point3')?.value.trim()      || null,
    engagements:   document.getElementById('edit-engagements')?.value.trim() || null,
    regles:        document.getElementById('edit-regles')?.value.trim()      || null,
    politiqueAnnulation: buildPolitiqueAnnulation(),
    delaiFormalite: buildDelaiFormalite(),
  };

  const btn = document.getElementById('editFicheSubmitBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Sauvegarde...'; }

  try {
    const res = await apiFetch(`${BACKEND}/agence/${agenceData.id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) { showToast('Erreur lors de la sauvegarde. Veuillez réessayer.', TOAST_ICONS.error); return; }

    const updated = { ...agenceData, ...payload };
    setAgenceData(updated);
    updateAgenceUI(updated);
    closeEditFiche();
    showToast('Agence mise à jour avec succès !', TOAST_ICONS.success, true);

  } catch (err) {
    console.error('Erreur update agence :', err);
    showToast('Impossible de contacter le serveur.', TOAST_ICONS.error);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:4px;"><path d="M3 2h8l2.5 2.5V13a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M5 2v4h5V2M4.5 9.5h7v4.5h-7z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg> Sauvegarder'; }
  }
}

// ════════════════════════════════
//  GESTION DES IMAGES
// ════════════════════════════════
export function openEditImages() {
  if (!agenceData) return;
  setEditNewLogo(null);
  setEditPhotosToDelete([]);
  setEditPhotosToAdd([]);

  const overlay = document.createElement('div');
  overlay.id = 'editImagesOverlay';
  overlay.className = 'pdv-overlay';
  overlay.innerHTML = `
    <div class="pdv-overlay-backdrop" onclick="closeEditImages()"></div>
    <div class="pdv-overlay-panel" style="max-width:560px;">
      <div class="pdv-overlay-header">
        <div><h2>Gérer les images</h2><p>Logo et photos de l'agence</p></div>
        <button class="pdv-overlay-close" onclick="closeEditChoice()">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <div class="pdv-field-group" style="margin-bottom:20px;">
        <label style="font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;display:block;margin-bottom:8px;">Logo actuel</label>
        <div style="display:flex;align-items:center;gap:14px;">
          <div id="editLogoPreview" style="width:72px;height:72px;border-radius:14px;background:var(--surface2);border:2px solid var(--border2);overflow:hidden;display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-size:24px;font-weight:800;color:var(--primary);flex-shrink:0;">
            ${agenceData.logoUrl ? `<img src="${escapeHtml(agenceData.logoUrl)}" style="width:100%;height:100%;object-fit:cover;">` : escapeHtml(agenceData.nom?.[0] || '?')}
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <button class="pdv-action-btn" style="padding:8px 14px;font-size:12px;" onclick="document.getElementById('editLogoInput').click()">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:3px;">
                <rect x="1" y="4" width="14" height="9" rx="2" stroke="currentColor" stroke-width="1.4"/>
                <circle cx="8" cy="8.5" r="2.5" stroke="currentColor" stroke-width="1.4"/>
                <path d="M5.5 4l1-1.5h3l1 1.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Changer le logo
            </button>
            <input type="file" id="editLogoInput" accept="image/*" style="display:none" onchange="handleEditLogo(this)">
            <small style="color:var(--muted);font-size:11px;">PNG, JPG — 400×400px recommandé</small>
          </div>
        </div>
      </div>
      <div class="pdv-field-group">
        <label style="font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;display:block;margin-bottom:8px;">Photos de l'agence <span style="color:var(--muted);font-weight:400;">(max 5)</span></label>
        <div id="editPhotosGrid" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;"></div>
        <input type="file" id="editPhotosInput" accept="image/*" multiple style="display:none" onchange="handleEditPhotos(this)">
      </div>
      <button class="pdv-btn-next" id="editImagesSubmitBtn" onclick="submitEditImages()" style="margin-top:20px;">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:4px;">
          <path d="M3 2h8l2.5 2.5V13a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
          <path d="M5 2v4h5V2M4.5 9.5h7v4.5h-7z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
        </svg>
      Sauvegarder les images
      </button>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
  renderEditPhotos();
}

export function closeEditImages() {
  const o = document.getElementById('editImagesOverlay');
  if (o) { o.classList.remove('show'); setTimeout(() => o.remove(), 350); }
}

export function renderEditPhotos() {
  const grid = document.getElementById('editPhotosGrid');
  if (!grid) return;

  const current      = (agenceData.photos || []).filter(url => !editPhotosToDelete.includes(url));
  const totalAfterAdd = current.length + editPhotosToAdd.length;
  let html = '';

  current.forEach(url => {
    html += `
     <div style="position:relative;width:72px;height:72px;flex-shrink:0;">
       <img src="${escapeHtml(url)}" style="width:72px;height:72px;border-radius:10px;object-fit:cover;border:1px solid var(--border);">
        <button onclick="markPhotoDelete('${escapeJsAttr(url)}')" style="position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;background:#FF4D6A;border:none;color:white;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;">×</button>
      </div>`;
  });

  editPhotosToAdd.forEach((src, i) => {
    html += `
      <div style="position:relative;width:72px;height:72px;flex-shrink:0;">
        <img src="${src}" style="width:72px;height:72px;border-radius:10px;object-fit:cover;border:2px solid var(--accent);opacity:.85;">
        <button onclick="removeNewPhoto(${i})" style="position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;background:#FF4D6A;border:none;color:white;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;">×</button>
      </div>`;
  });

  if (totalAfterAdd < 5) {
    html += `<div onclick="document.getElementById('editPhotosInput').click()" style="width:72px;height:72px;border-radius:10px;border:1.5px dashed var(--border2);display:flex;align-items:center;justify-content:center;font-size:22px;color:var(--muted);cursor:pointer;flex-shrink:0;">+</div>`;
  }

  grid.innerHTML = html;
}

export function handleEditLogo(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    setEditNewLogo(e.target.result);
    const preview = document.getElementById('editLogoPreview');
    if (preview) preview.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;">`;
  };
  reader.readAsDataURL(file);
}

export function handleEditPhotos(input) {
  const files = Array.from(input.files);
  if (!files.length) return;

  const current   = (agenceData.photos || []).filter(url => !editPhotosToDelete.includes(url));
  const remaining = 5 - current.length - editPhotosToAdd.length;
  if (remaining <= 0) { showToast('Maximum 5 photos atteint.', TOAST_ICONS.info); return; }

  const toAdd = files.slice(0, remaining);
  const promises = toAdd.map(f => new Promise(resolve => {
    const r = new FileReader();
    r.onload = e => resolve(e.target.result);
    r.readAsDataURL(f);
  }));

  Promise.all(promises).then(results => {
    setEditPhotosToAdd([...editPhotosToAdd, ...results]);
    input.value = '';
    renderEditPhotos();
  });
}

export function markPhotoDelete(url) {
  setEditPhotosToDelete([...editPhotosToDelete, url]);
  renderEditPhotos();
}

export function removeNewPhoto(index) {
  const newList = [...editPhotosToAdd];
  newList.splice(index, 1);
  setEditPhotosToAdd(newList);
  renderEditPhotos();
}

export async function submitEditImages() {
  if (!editNewLogo && editPhotosToDelete.length === 0 && editPhotosToAdd.length === 0) {
    showToast('Aucune modification détectée.', TOAST_ICONS.info); return;
  }

  const btn = document.getElementById('editImagesSubmitBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Sauvegarde...'; }

  try {
    const res = await apiFetch(`${BACKEND}/agence/${agenceData.id}/images`, {
      method: 'PATCH',
      body: JSON.stringify({
        logoBase64:     editNewLogo,
        photosToAdd:    editPhotosToAdd,
        photosToDelete: editPhotosToDelete,
      }),
    });
    const data = await res.json();
    if (!res.ok) { showToast('Erreur lors de la sauvegarde. Veuillez réessayer.', TOAST_ICONS.error); return; }

    if (data.logoUrl) agenceData.logoUrl = data.logoUrl;
    setAgenceData({ ...agenceData, photos: data.photos });
    updateAgenceUI(agenceData);
    closeEditImages();
    showToast('Images mises à jour avec succès !', TOAST_ICONS.success, true);

  } catch (err) {
    console.error('Erreur update images :', err);
    showToast('Impossible de contacter le serveur.', TOAST_ICONS.error);
  } finally {
    if (btn) { 
      btn.disabled = false; 
      btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:4px;"><path d="M3 2h8l2.5 2.5V13a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M5 2v4h5V2M4.5 9.5h7v4.5h-7z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg> Sauvegarder les images';

    }
  }
}

// ════════════════════════════════
//  VALIDITÉ RÉELLE DE L'ESSAI
// ════════════════════════════════
export function isEssaiActifEtValide() {
  if (agenceData?.exempte) return true;
  const essai = agenceData?.essai;
  if (!essai || !essai.actif) return false;
  if (essai.dateFin && new Date(essai.dateFin) < new Date()) return false;
  return true;
}

// ════════════════════════════════
//  securiter
// ════════════════════════════════
export function checkAccesDashboard() {
  if (isEssaiActifEtValide()) {
    const navEl = document.querySelector('[data-page="overview"]');
    window.showPage('overview', navEl);
    return;
  }
  showLockedOverlay();
}

export function showLockedOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'lockedOverlay';
  overlay.className = 'congrats-overlay';
  overlay.innerHTML = `
    <div class="congrats-backdrop"></div>
    <div class="congrats-card" style="max-width:420px;">
      <div class="congrats-text">
        <div class="congrats-badge" style="background:rgba(255,77,106,0.1);border-color:rgba(255,77,106,0.2);color:#FF4D6A;">${ICONS.blocked} Essai terminé</div>
        <h2 style="font-size:18px;">Votre période d'essai gratuit est terminée</h2>
        <p>Contactez notre équipe pour continuer à utiliser Travio et garder l'accès à votre dashboard.</p>
        <p style="margin-top:10px;font-weight:600;">📞 064 98 85 61 / 044 58 17 11</p>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
}

window.checkAccesDashboard = checkAccesDashboard;

// ════════════════════════════════
//  BULLE DE RAPPEL — FIN D'ESSAI
// ════════════════════════════════
let essaiBubbleInterval = null;

export function checkAbonnementRenewal() {
  const badge = document.getElementById('navBadgeAbonnement');
  const essai = agenceData?.essai;

  if (!badge || !essai || !essai.actif || !essai.dateFin) {
    if (badge) badge.style.display = 'none';
    return;
  }

  const fmtBZV = d => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Brazzaville', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  const joursRestants = Math.round((new Date(fmtBZV(new Date(essai.dateFin)) + 'T00:00:00Z') - new Date(fmtBZV(new Date()) + 'T00:00:00Z')) / 86400000);

  if (joursRestants > 5) {
    badge.style.display = 'none';
    return;
  }

  let couleur, icone, texte;
  if (joursRestants <= 1) {
    couleur = { bg: 'rgba(255,77,106,0.12)', border: 'rgba(255,77,106,0.35)', text: '#FF4D6A', dot: '#FF4D6A' };
    icone = ICONS.siren;
    texte = joursRestants <= 0
      ? "Votre période d'essai se termine aujourd'hui. Contactez-nous au 064 98 85 61 / 044 58 17 11 pour continuer à utiliser Travio."
      : `Il ne reste que ${joursRestants} jour avant la fin de votre essai gratuit. Contactez-nous au 064 98 85 61 / 044 58 17 11.`;
  } else if (joursRestants <= 3) {
    couleur = { bg: 'rgba(255,178,63,0.12)', border: 'rgba(255,178,63,0.35)', text: '#FFB23F', dot: '#FFB23F' };
    icone = ICONS.warning;
    texte = `Il ne reste que ${joursRestants} jours avant la fin de votre essai gratuit. Contactez-nous au 064 98 85 61 / 044 58 17 11.`;
  } else {
    couleur = { bg: 'rgba(0,87,255,0.12)', border: 'rgba(0,87,255,0.3)', text: '#5B9BFF', dot: '#0057FF' };
    icone = ICONS.calendar;
    texte = `Votre essai gratuit se termine dans ${joursRestants} jours. Contactez-nous au 064 98 85 61 / 044 58 17 11.`;
  }

  badge.style.display = 'flex';
  badge.style.background = couleur.dot;
  badge.textContent = joursRestants > 0 ? joursRestants : '!';

  showAbonnementBubble(texte, couleur, icone);
}

function showAbonnementBubble(texte, couleur, icone) {
  const existing = document.getElementById('abonnementBubble');
  if (existing) existing.remove();

  const bubble = document.createElement('div');
  bubble.id = 'abonnementBubble';
  bubble.style.cssText = `
    position:fixed; bottom:24px; right:24px; z-index:9500;
    max-width:300px; background:#1E2535; border:1px solid ${couleur.border};
    border-radius:14px; padding:14px 16px; box-shadow:0 12px 32px rgba(0,0,0,0.4);
    display:flex; gap:10px; align-items:flex-start; animation: bubble-in 0.3s ease;
  `;
  bubble.innerHTML = `
    <div style="font-size:18px;flex-shrink:0;">${icone}</div>
    <div style="flex:1;min-width:0;">
      <p style="font-size:12.5px;color:var(--white);line-height:1.5;margin-bottom:8px;">${escapeHtml(texte)}</p>
    </div>
    <button onclick="document.getElementById('abonnementBubble')?.remove();"
    style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:14px;flex-shrink:0;padding:0;">
      <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
        <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      </svg>
      </button>
  `;
  document.body.appendChild(bubble);

  setTimeout(() => document.getElementById('abonnementBubble')?.remove(), 10000);

  if (!essaiBubbleInterval) {
    essaiBubbleInterval = setInterval(() => checkAbonnementRenewal(), 5 * 60 * 1000);
  }
}

// ════════════════════════════════
//  RESTRICTION SAISIE TÉLÉPHONE (9 chiffres max, chiffres uniquement)
// ════════════════════════════════
function restrictPhoneInput(id) {
  const el = document.getElementById(id);
  if (!el || el.dataset.phoneRestricted) return; // évite les doublons de listener
  el.dataset.phoneRestricted = '1';
  el.addEventListener('input', () => {
    let value = el.value.replace(/\D/g, ''); // ne garde que les chiffres
    if (value.length > 9) value = value.slice(0, 9);
    el.value = value;
  });
}

restrictPhoneInput('agence-tel');

// ════════════════════════════════
//  PAGE MON ESSAI GRATUIT
// ════════════════════════════════
export function renderAbonnementPage() {
  const container = document.getElementById('abonnementContainer');
  if (!container || !agenceData) return;

  const essai = agenceData.essai || {};
  const actif = essai.actif === true;
  const fin = essai.dateFin;
  const fmtBZV2 = d => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Brazzaville', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  const joursRestants = fin ? Math.round((new Date(fmtBZV2(new Date(fin)) + 'T00:00:00Z') - new Date(fmtBZV2(new Date()) + 'T00:00:00Z')) / 86400000) : null;

  const statutInfo = actif && joursRestants !== null && joursRestants >= 0
    ? { label: `${ICONS.check} Essai actif`, color: 'var(--accent)' }
    : { label: `${ICONS.blocked} Essai terminé`, color: '#FF4D6A' };

  let alerteHtml = '';
  if (actif && joursRestants !== null && joursRestants <= 3) {
    const c = joursRestants <= 1
      ? { bg: 'rgba(255,77,106,0.08)', border: 'rgba(255,77,106,0.25)', text: '#FF4D6A', icon: ICONS.siren }
      : { bg: 'rgba(255,178,63,0.08)', border: 'rgba(255,178,63,0.25)', text: '#FFB23F', icon: ICONS.warning };
    alerteHtml = `
      <div style="display:flex;align-items:center;gap:12px;background:${c.bg};border:1px solid ${c.border};border-radius:12px;padding:14px 18px;">
        <span style="font-size:20px;">${c.icon}</span>
        <p style="font-size:13px;color:${c.text};font-weight:500;">
          ${joursRestants <= 0 ? "Votre essai gratuit se termine aujourd'hui." : `Votre essai gratuit se termine dans ${joursRestants} jour${joursRestants > 1 ? 's' : ''}.`}
          Contactez-nous au <strong>064 98 85 61 / 044 58 17 11</strong> pour continuer à utiliser Travio sans interruption.
        </p>
      </div>`;
  }

  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:16px;">
      ${alerteHtml}
      <div class="overview-card">
        <div class="overview-card-header">
          <h3>Période d'essai</h3>
          <span style="font-size:12px;font-weight:700;color:${statutInfo.color};">${statutInfo.label}</span>
        </div>
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">
          <div>
            <p style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:var(--white);">Essai gratuit 12 jours</p>
            <p style="font-size:12px;color:var(--muted);margin-top:4px;">Accès complet à toutes les fonctionnalités</p>
            ${fin ? `<p style="font-size:12px;color:var(--muted);margin-top:8px;">Fin de l'essai : <strong style="color:var(--white);">${new Date(fin).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Africa/Brazzaville' })}</strong></p>` : ''}
          </div>
          <div style="text-align:right;">
            <p style="font-family:'Syne',sans-serif;font-size:26px;font-weight:800;color:var(--white);">${joursRestants !== null && joursRestants >= 0 ? joursRestants : 0}<span style="font-size:12px;color:var(--muted);font-weight:500;"> jour${joursRestants === 1 ? '' : 's'} restant${joursRestants === 1 ? '' : 's'}</span></p>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ════════════════════════════════
//  EXPOSER AU HTML
// ════════════════════════════════
window.goToStep           = goToStep;
window.submitAgency       = submitAgency;
window.handleLogoUpload   = handleLogoUpload;
window.handlePhotosUpload = handlePhotosUpload;
window.removePhoto        = removePhoto;
window.closeCongrats      = closeCongrats;
window.openEditAgence     = openEditAgence;
window.closeEditChoice    = closeEditChoice;
window.openEditFiche      = openEditFiche;
window.closeEditFiche     = closeEditFiche;
window.submitEditFiche    = submitEditFiche;
window.openEditImages     = openEditImages;
window.closeEditImages    = closeEditImages;
window.handleEditLogo     = handleEditLogo;
window.handleEditPhotos   = handleEditPhotos;
window.markPhotoDelete    = markPhotoDelete;
window.removeNewPhoto     = removeNewPhoto;
window.submitEditImages   = submitEditImages;
window.checkAccesDashboard    = checkAccesDashboard;
window.checkAbonnementRenewal = checkAbonnementRenewal;
window.renderAbonnementPage   = renderAbonnementPage;
window.isEssaiActifEtValide = isEssaiActifEtValide;