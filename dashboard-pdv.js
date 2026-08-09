// ─── TRAVIO — Dashboard Point de vente ───

import { auth } from './firebase-client.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { initInstallPrompt } from './install-prompt.js';
import { apiFetch } from './api.js';
import { initBackGuard } from './back-guard.js';
import { escapeHtml, escapeJsAttr } from './sanitize.js';

import * as StatePdv from './pdv-modules/state-pdv.js';
import {
  ICONS, BACKEND, OFFSET_MS_FIN, toBrazzaDate,
  nomType, ageRangeLabel, peuplerSelectType,
  pdvData, agenceData, trajetList, resaList, colisList, colisEnvoyesList, statsPdvCache,
  setPdvData, setAgenceData, setTrajetList, setResaList,
  setColisList, setColisEnvoyesList, setCurrentUser,
  setStatsPdvCache, invalidateStatsPdvCache,
} from './pdv-modules/state-pdv.js';

import {
  PAGE_TITLES, onPageShow, hideLoader, setAgentUI,
  showPage, toggleDrawer, closeDrawer, handleLogout, showToast,
} from './pdv-modules/auth-init-pdv.js';

// TRAJET
import {
  loadTrajets, renderTrajetsPDV,
  renderAccueilTrajets, openTrajetDetailPDV, closeTrajetDetailPDV,
  getDepartsForTrajet, getBusNomsPourPDV, populateFilterBus,
  populateFilterTrajet,
} from './pdv-modules/trajets-pdv.js';

// agence
import { loadAgenceData, isEssaiActifEtValide, showLockedOverlayPDV } from './pdv-modules/agence-pdv.js';

// vente-pdv
import { populateVenteSelect, onVenteComplete } from './pdv-modules/vente-pdv.js';

// reservation 
import {
  loadReservations, filterReservations, onResaChange,
  onFilterTrajetChangePDV, onFilterBusChangePDV,
} from './pdv-modules/reservations-pdv.js';

// finance-pdv
import {
  renderFinancePage, cmpHtmlPDV,
  onFinTrajetFiltreChangePDV, onFinFiltreChange,
} from './pdv-modules/finances-pdv.js';

// monpdv
import { renderMonPDVPage } from './pdv-modules/monpdv-pdv.js';

// guide
import { renderGuidePagePDV, updateGuideBadgePDV, checkGuideWelcomeModalPDV } from './pdv-modules/guide-pdv.js';

// colis
import { loadColisPDV, filterColisPDV } from './pdv-modules/colis-pdv.js';

// ════════════════════════════════
//  INIT
// ════════════════════════════════

onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = 'auth.html'; return; }
  setCurrentUser(user);          // ← était : currentUser = user;

  try {
    const authRes  = await apiFetch(`${BACKEND}/auth/login`, {
      method:  'POST',
      body:    JSON.stringify({ email: user.email }),
    });
    const pdvSession = await authRes.json();

    if (!authRes.ok || pdvSession.role !== 'agent') {
      window.location.href = 'auth.html';
      return;
    }

    const res  = await apiFetch(`${BACKEND}/pdv/${pdvSession.pdvId}`);
    const data = await res.json();

    if (!res.ok || !data) {
      showToast('Impossible de charger votre espace.', ICONS.banned);
      hideLoader();
      return;
    }

    setPdvData(data);            // ← était : pdvData = data;
    setAgentUI(pdvSession, data);

    if (data.agenceId) {
      await loadAgenceData(data.agenceId);

      // ── Vérification essai / abonnement ──
      if (!isEssaiActifEtValide()) {
        showLockedOverlayPDV();
        hideLoader();
        return; // stoppe tout chargement + toute navigation
      }

      updateGuideBadgePDV();
      checkGuideWelcomeModalPDV();
    }

    await Promise.all([
      loadTrajets(data.agenceId, data.id),
      loadReservations(data.id, { setResaList }),
      loadColisPDV(data.id),
    ]);

    populateVenteSelect();
    updateAccueilStats();
    initInstallPrompt();
    initBackGuard();

  } catch (err) {
    console.error('Erreur init PDV :', err);
    showToast('Impossible de contacter le serveur.', ICONS.banned);
  } finally {
    hideLoader();
  }
});

const JOURS_COURTS_ACCUEIL = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];
const MOIS_LONGS_ACCUEIL = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];

function formatDateCourteAccueil(dateObj) {
  if (!dateObj) return '—';
  return `${JOURS_COURTS_ACCUEIL[dateObj.getDay()]}-${dateObj.getDate()}${MOIS_LONGS_ACCUEIL[dateObj.getMonth()]}`;
}

function getTypeTrajetInfoAccueil(trajet) {
  const avecArret = Array.isArray(trajet?.arrets) && trajet.arrets.length > 0;
  return avecArret
    ? { label: 'Avec arrêt', dot: '#FFB23F' }
    : { label: 'Direct', dot: '#00E5A0' };
}

function renderAccueilVentes() {
  const container = document.getElementById('accueilVentesList');
  if (!container) return;

  const today = toBrazzaDate(new Date().toISOString());

  const confirmees = resaList
    .filter(r => r.statut === 'confirmée')
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, 5);

  if (confirmees.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><rect x="6" y="8" width="24" height="22" rx="4" stroke="currentColor" stroke-width="1.8"/><path d="M12 5v6M24 5v6M6 16h24" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        <p>Aucune vente pour l'instant</p>
      </div>`;
    return;
  }

  container.innerHTML = confirmees.map(r => {
    const trajet = trajetList.find(t => t.id === r.trajetId);
    const routeLabel = (r.arretMontee && r.arretDescente)
      ? `${escapeHtml(r.arretMontee)} → ${escapeHtml(r.arretDescente)}`
      : (trajet ? `${escapeHtml(trajet.villeDepart)} → ${escapeHtml(trajet.villeArrivee)}` : escapeHtml(r.routeLabel || '—'));

    const typeInfo = trajet ? getTypeTrajetInfoAccueil(trajet) : null;
    const dateObj = r.dateDepart ? new Date(r.dateDepart + 'T00:00:00') : null;
    const dateLabel = formatDateCourteAccueil(dateObj);
    const estAujourdhui = toBrazzaDate(r.createdAt) === today;

    return `
    <div class="vente-row" style="cursor:pointer;${estAujourdhui ? 'border-left:3px solid var(--accent);padding-left:9px;' : ''}" onclick="openResaDetail('${escapeJsAttr(r.id)}')">
        <div class="vente-row-info">
          <div class="vente-row-name">
            ${estAujourdhui ? `<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--accent);margin-right:6px;vertical-align:middle;"></span>` : ''}
            ${escapeHtml(r.prenomPassager || '—')} ${escapeHtml(r.nomPassager || '')}
            ${estAujourdhui ? `<span style="font-size:9px;color:var(--accent);font-weight:700;margin-left:6px;text-transform:uppercase;letter-spacing:.5px;">Aujourd'hui</span>` : ''}
          </div>
          <div class="vente-row-route">
            ${routeLabel}
            ${typeInfo ? `<span style="font-size:9px;font-weight:700;padding:1px 6px;border-radius:5px;margin-left:6px;vertical-align:middle;background:${typeInfo.dot === '#00E5A0' ? 'rgba(0,229,160,0.12)' : 'rgba(255,178,63,0.12)'};color:${typeInfo.dot};">${typeInfo.label}</span>` : ''}
          </div>
          <div style="font-size:10.5px;color:var(--muted);margin-top:2px;">${dateLabel} · ${escapeHtml(r.heureDepart || '—')}</div>
        </div>
        <div class="vente-row-right">
          <div class="vente-row-prix">${Number(r.prixTotal || 0).toLocaleString()} XAF</div>
          <span style="display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:600;padding:2px 8px;border-radius:20px;background:rgba(0,229,160,0.1);color:var(--accent);">
            <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--accent);"></span>
            Confirmée
          </span>
          ${r.baisseNonVerifiee ? `<span class="resa-meta-badge" style="background:rgba(255,77,106,0.12);color:#FF4D6A;margin-top:3px;display:inline-block;">${ICONS.warning} Prix réduit</span>` : ''}
          ${r.passagerRetire ? `<span class="resa-meta-badge" style="background:rgba(255,178,63,0.12);color:#FFB23F;margin-top:3px;display:inline-block;">${ICONS.person} Retrait</span>` : ''}
        </div>
      </div>`;
  }).join('');
}

// ════════════════════════════════
//  STATS ACCUEIL
// ════════════════════════════════
async function updateAccueilStats() {
  const today = toBrazzaDate(new Date().toISOString());
  const month = today.slice(0, 7);

  const resasJour = resaList.filter(r => toBrazzaDate(r.createdAt) === today);
  const resasMois = resaList.filter(r => toBrazzaDate(r.createdAt).startsWith(month));

  const confJour = resasJour.filter(r => r.statut !== 'annulée');
  const confMois = resasMois.filter(r => r.statut !== 'annulée');

  const vendusJour = confJour.reduce((s, r) => s + (r.nbPassagers || r.passagers?.length || 1), 0);
  const vendusMois = confMois.reduce((s, r) => s + (r.nbPassagers || r.passagers?.length || 1), 0);
  const revMois    = confMois.reduce((s, r) => s + (r.prixTotal || 0), 0);
  const revJour    = confJour.reduce((s, r) => s + (r.prixTotal || 0), 0);

  // NOUVEAU — comparaison vs période précédente
  const yesterday = toBrazzaDate(new Date(Date.now() - 86400000).toISOString());
  const resasHierTotal = resaList.filter(r => toBrazzaDate(r.createdAt) === yesterday);
  const resasHierConf  = resasHierTotal.filter(r => r.statut !== 'annulée');

  const todayDateObj  = new Date(today + 'T00:00:00Z');
  const quantiemeAuj  = todayDateObj.getUTCDate();
  const prevMonthDate = new Date(Date.UTC(todayDateObj.getUTCFullYear(), todayDateObj.getUTCMonth() - 1, 1));
  const prevMonth     = prevMonthDate.toISOString().slice(0, 7);
  const dernierJourPrevMois = new Date(Date.UTC(prevMonthDate.getUTCFullYear(), prevMonthDate.getUTCMonth() + 1, 0)).getUTCDate();
  const quantiemeLimite = Math.min(quantiemeAuj, dernierJourPrevMois);

  const resasMoisPrec = resaList.filter(r => {
    if (r.statut === 'annulée') return false;
    const d = toBrazzaDate(r.createdAt);
    if (!d.startsWith(prevMonth)) return false;
    const jour = Number(d.slice(8, 10));
    return jour <= quantiemeLimite;
  });

  const vendusHier     = resasHierConf.reduce((s, r) => s + (r.nbPassagers || r.passagers?.length || 1), 0);
  const revHier        = resasHierConf.reduce((s, r) => s + (r.prixTotal || 0), 0);
  const vendusMoisPrec = resasMoisPrec.reduce((s, r) => s + (r.nbPassagers || r.passagers?.length || 1), 0);

  const setEl   = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  const setHtml = (id, val) => { const el = document.getElementById(id); if (el) el.innerHTML = val; };

  setEl('statVendusJour',  vendusJour.toLocaleString());
  setEl('statVendusMois',  vendusMois.toLocaleString());
  setEl('statRevenusMois', revJour.toLocaleString() + ' XAF');
  setEl('statPlacesTotal', resasJour.length.toLocaleString());

  // NOUVEAU — compteur réservations du jour sur chaque KPI (sauf "Vendus ce mois")
  const resaTodayLabel = `${resasJour.length} résa. aujourd'hui`;
  setEl('statCardBadgeResa1', resaTodayLabel);
  setEl('statCardBadgeResa2', resaTodayLabel);
  setEl('statCardBadgeResa4', resaTodayLabel);

  setHtml('statPlacesTotalDelta',  cmpHtmlPDV(resasJour.length, resasHierTotal.length));
  setHtml('statVendusJourDelta',   cmpHtmlPDV(vendusJour, vendusHier));
  setHtml('statVendusMoisDelta',   cmpHtmlPDV(vendusMois, vendusMoisPrec));
  setHtml('statRevenusMoisDelta',  cmpHtmlPDV(revJour, revHier));
}

// ════════════════════════════════
//  BADGES
// ════════════════════════════════
function updateBadges() {
  const today = toBrazzaDate(new Date().toISOString());
  const vendusAujourdHui = resaList.filter(r =>
    toBrazzaDate(r.createdAt) === today && r.statut !== 'annulée'
  ).length;

  const badge = document.getElementById('drawerBadgeResa');
  if (badge) {
    badge.textContent = vendusAujourdHui;
    badge.classList.toggle('show', vendusAujourdHui > 0);
  }
}

onVenteComplete(() => {
  updateAccueilStats();
  renderAccueilVentes();
  updateBadges();
});

onResaChange(() => {
  renderFinancePage();
  updateAccueilStats();
});

// ════════════════════════════════
// NAVIGUATION
// ════════════════════════════════
onPageShow('reservations', () => filterReservations());
onPageShow('monpdv',       () => renderMonPDVPage());
onPageShow('finance',      () => renderFinancePage());
onPageShow('colis',        () => filterColisPDV());
onPageShow('guide',        () => renderGuidePagePDV());

// ════════════════════════════════
//  EXPOSER AU HTML
// ════════════════════════════════
window.showPage          = showPage;
window.toggleDrawer      = toggleDrawer;
window.closeDrawer       = closeDrawer;
window.handleLogout      = handleLogout;
window.showToast         = showToast;