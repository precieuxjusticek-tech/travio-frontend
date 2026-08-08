// ─── TRAVIO — PDV — Guide / mode d'emploi ───

import { agenceData, toBrazzaDate } from './state-pdv.js';
import { showPage } from './auth-init-pdv.js';

const GUIDE_SECTIONS_PDV_AGENT = [
  { id: 'pdv-accueil', title: 'Accueil', subtitle: 'Votre activité du jour', content: `
    <p>La page d'accueil affiche un résumé de <strong>votre activité uniquement</strong> (pas celle des autres PDV de l'agence).</p>
    <p><strong>Les 4 cartes en haut :</strong></p>
    <ul>
        <li><strong>Réservations aujourd'hui</strong> — total créé aujourd'hui.</li>
        <li><strong>Vendus aujourd'hui</strong> — nombre de billets (passagers) vendus aujourd'hui.</li>
        <li><strong>Vendus ce mois</strong> — total depuis le début du mois.</li>
        <li><strong>Revenus du jour</strong> — montant encaissé aujourd'hui.</li>
    </ul>
    <p><strong>Dernières ventes</strong> — vos 5 réservations confirmées les plus récentes, cliquables pour ouvrir le détail.</p>
    <p>Le bouton <strong>"Vendre un billet"</strong> vous amène directement à l'écran de vente.</p>` },

  { id: 'pdv-vente', title: 'Vente de billets', subtitle: 'Vendre un billet en 2 étapes', content: `
    <p><strong>Étape 1 — Choisir le trajet :</strong> basculez entre Direct et Avec arrêts, cherchez ou cliquez une carte de trajet, puis sélectionnez une session de départ disponible.</p>
    <p><strong>Étape 2 — Informations passager(s) :</strong> prénom, nom, téléphone et type sont obligatoires pour le passager principal. Vous pouvez ajouter d'autres passagers sur la même réservation.</p>
    <p>Bagages et siège sont optionnels — un excédent de bagages ajoute des frais automatiquement.</p>
    <p>Un <strong>récapitulatif</strong> s'affiche avant confirmation finale — vérifiez tout avant de valider.</p>
    <div class="guide-warning-box">⚠️ Une fois confirmée, la vente n'est pas annulable immédiatement — la politique d'annulation de l'agence s'applique.</div>` },

  { id: 'pdv-reservations', title: 'Mes réservations', subtitle: 'Historique de vos ventes', content: `
    <p>Cette page liste uniquement <strong>vos réservations</strong>. Filtres par période, recherche, statut et tri disponibles.</p>
    <p><strong>Actions sur une réservation active :</strong> Modifier (une seule fois, raison obligatoire si le prix baisse) ou Annuler (remboursement selon la politique de l'agence).</p>
    <div class="guide-warning-box">⚠️ Modification et annulation sont impossibles une fois le voyage passé.</div>` },

  { id: 'pdv-trajets', title: 'Trajets disponibles', subtitle: 'Les lignes que vous pouvez vendre', content: `
    <p>Liste des trajets sur lesquels vous êtes autorisé à vendre. Bouton <strong>Détails</strong> pour voir tarifs et horaires, bouton <strong>Vendre</strong> pour lancer une vente pré-remplie.</p>
    <p>Si aucun trajet n'apparaît, contactez votre siège pour être assigné.</p>` },

  { id: 'pdv-finance', title: 'Finances', subtitle: 'Vos encaissements', content: `
    <p>Montant encaissé aujourd'hui toujours visible en haut. Filtres par période, trajet, bus et statut.</p>
    <p><strong>Trajet le plus vendu</strong>, indicateurs clés, et graphique d'activité qui s'adapte à la période choisie.</p>` },

  { id: 'pdv-monpdv', title: 'Mon point de vente', subtitle: 'Vos informations et performance', content: `
    <p>Informations de votre PDV en lecture seule — contactez le siège pour les modifier.</p>
    <p><strong>Performance (30 jours)</strong> — ventes, annulations, taux de remplissage moyen.</p>` },
];

export function renderGuidePagePDV() {
  const container = document.getElementById('guideContainerPDV');
  if (!container) return;
  markGuidePDVSeen();

  container.innerHTML = `
    <div class="guide-accordion">
      ${GUIDE_SECTIONS_PDV_AGENT.map(s => `
        <div class="guide-item" id="guideItemPDV-${s.id}">
          <button class="guide-item-head" onclick="toggleGuideSectionPDV('${s.id}')">
            <div class="guide-item-text">
              <span class="guide-item-title">${s.title}</span>
              <span class="guide-item-subtitle">${s.subtitle}</span>
            </div>
          </button>
          <div class="guide-item-body" id="guideBodyPDV-${s.id}">
            <div class="guide-item-body-inner">${s.content}</div>
          </div>
        </div>
      `).join('')}
    </div>`;
}
window.renderGuidePagePDV = renderGuidePagePDV;

function toggleGuideSectionPDV(id) {
  const item = document.getElementById(`guideItemPDV-${id}`);
  const body = document.getElementById(`guideBodyPDV-${id}`);
  if (!item || !body) return;
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('#guideContainerPDV .guide-item.open').forEach(el => {
    el.classList.remove('open');
    const b = el.querySelector('.guide-item-body');
    if (b) b.style.maxHeight = null;
  });
  if (!isOpen) {
    item.classList.add('open');
    body.style.maxHeight = body.scrollHeight + 'px';
  }
}
window.toggleGuideSectionPDV = toggleGuideSectionPDV;

// ── Badge "!" ──
const GUIDE_PDV_SEEN_KEY = 'travio_pdv_guide_seen';

function guidePdvStorageKey(base) {
  const agenceId = agenceData?.id || 'default';
  return `${base}_${agenceId}`;
}

export function updateGuideBadgePDV() {
  const badge = document.getElementById('drawerBadgeGuide');
  if (!badge) return;
  const seen = localStorage.getItem(guidePdvStorageKey(GUIDE_PDV_SEEN_KEY));
  badge.classList.toggle('show', !seen);
}
window.updateGuideBadgePDV = updateGuideBadgePDV;

function markGuidePDVSeen() {
  localStorage.setItem(guidePdvStorageKey(GUIDE_PDV_SEEN_KEY), '1');
  updateGuideBadgePDV();
}

// ── Modale de bienvenue — 1x/jour pendant les 3 premiers jours d'essai ──
const DUREE_ESSAI_JOURS_PDV = 12;

function getJoursRestantsEssaiPDV() {
  const essai = agenceData?.essai;
  if (!essai || !essai.actif || !essai.dateFin) return null;
  const finJour = new Date(toBrazzaDate(essai.dateFin) + 'T00:00:00Z');
  const ajdJour = new Date(toBrazzaDate(new Date().toISOString()) + 'T00:00:00Z');
  return Math.round((finJour - ajdJour) / 86400000);
}

export function checkGuideWelcomeModalPDV() {
  const joursRestants = getJoursRestantsEssaiPDV();
  if (joursRestants === null) return;

  const joursEcoules = DUREE_ESSAI_JOURS_PDV - joursRestants;
  if (joursEcoules < 0 || joursEcoules > 2) return; // pas dans les 3 premiers jours

  const today = toBrazzaDate(new Date().toISOString());
  const key = guidePdvStorageKey('travio_pdv_guide_welcome_shown') + '_' + today;
  if (localStorage.getItem(key)) return; // déjà montrée aujourd'hui

  showGuideWelcomeModalPDV();
  localStorage.setItem(key, '1');
}
window.checkGuideWelcomeModalPDV = checkGuideWelcomeModalPDV;

function showGuideWelcomeModalPDV() {
  document.getElementById('guideWelcomeOverlayPDV')?.classList.add('show');
}
window.showGuideWelcomeModalPDV = showGuideWelcomeModalPDV;

function closeGuideWelcomeModalPDV() {
  document.getElementById('guideWelcomeOverlayPDV')?.classList.remove('show');
}
window.closeGuideWelcomeModalPDV = closeGuideWelcomeModalPDV;

function goToGuideFromWelcomePDV() {
  closeGuideWelcomeModalPDV();
  showPage('guide', document.querySelector('[data-page=guide]'));
}
window.goToGuideFromWelcomePDV = goToGuideFromWelcomePDV;