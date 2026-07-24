// ─── TRAVIO — Dashboard (point d'entrée) ───

import { auth } from './firebase-client.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { initInstallPrompt } from './install-prompt.js';

// ── State ──
import { setCurrentUser, agenceData } from './state.js';

// ── Utilitaires ──
import { showToast, TOAST_ICONS } from './toast-utils.js';

// ── Auth, navigation, sidebar ──
import { hidePageLoader, setUserUI, showPage, toggleSidebar, handleLogout, initSupportBubble, goToSupport } from './auth-init.js';

// ── Agence & onboarding ──
import { loadAgenceData, showOnboarding, hideOnboarding, goToStep, handleLogoUpload, handlePhotosUpload, removePhoto, submitAgency, showCongrats, closeCongrats, openEditAgence, closeEditChoice, openEditFiche, closeEditFiche, submitEditFiche, openEditImages, closeEditImages, handleEditLogo, handleEditPhotos, markPhotoDelete, removeNewPhoto, submitEditImages, showLockedOverlay, checkAccesDashboard, isEssaiActifEtValide, checkAbonnementRenewal, renderAbonnementPage } from './agence.js';

// ── billet.js ──
import { renderBilletConfigPage, selectBilletMode, selectBilletDesign, submitBilletConfig, updateBilletConfigBadge } from './billet-config.js';
import { imprimerBillet } from './billet-print.js';

// ── PDV ──
import { loadPDV, renderPDVPage, openCreatePDV, closeCreatePDV, createPDVNextStep, createPDVBackStep, submitCreatePDV, openPDVDetail, closePDVDetail, openPDVVille, closePDVVille, switchPDVTab, loadPDVTrajets, openEditPDV, closeEditPDV, submitEditPDV, toggleEditAutreVille, confirmDeletePDV, closeDeletePDV, deletePDV, togglePDVStatut, closeStatutPDV, confirmToggleStatut, openResetPassword, closeResetPassword, submitResetPassword, renderPDVStatsBar } from './pdv.js';

// ── Trajets ──
import { loadTrajets, updateOverviewStats, renderTrajetsPage, openTrajetDetail, closeTrajetDetail, switchTrajetTab, confirmDeleteTrajet, closeDeleteTrajet, deleteTrajet, toggleTrajetStatut, closeStatutTrajet, confirmToggleTrajetStatut, openEditTrajet, closeEditTrajet, submitEditTrajet, addEditArretItem, removeEditArret, onEditArretVilleChange, openCreateTrajet, closeCreateTrajet, trajetNextStep, trajetBackStep, submitCreateTrajet, toggleArrets, onVilleDepartChange, onVilleArriveeChange, addArretItem, removeArretItem, onArretVilleChange, refreshArretsVilleOptions, genererTableauTroncons, renderPDVMultiSelect, loadDeparts, renderDepartItem } from './trajets.js';

import { loadVehicules, openCreateVehicule, closeCreateVehicule, submitCreateVehicule, openEditVehicule, closeEditVehicule, submitEditVehicule, openScopeChoice, closeScopeChoice, confirmScopeChoice } from './vehicules.js';

// ── Bus & Départs ──
import { openCreateDepart, closeCreateDepart, submitCreateDepart, openEditDepart, closeEditDepart, submitEditDepart, confirmDeleteDepart, closeDepartDelete, deleteDepart, toggleDepartStatut, closeStatutDepart, confirmToggleDepartStatut, openBusDetail, closeBusDetail, genererSessions, handleGenererSessions, onVehiculeSelectChange, refreshVehiculeSelectAfterCreate } from './bus-departs.js';

// ── Sessions ──
import { loadBusSessions, openEditSession, closeEditSession, submitEditSession, openEditSessionById, openIncidentSession, closeIncidentSession, submitIncidentSession, deleteSession } from './sessions.js';

// ── Réservations ──
import { loadReservationsAgence, applyResaFiltres, filtrerParAlerteTrajets, filtrerParAlertePdv, filtrerParAlerteAnnulations, openResaDetail, closeResaDetail, handleAnnulerResa, closeAlerteModal, resetResaFiltres, closeAnnulConfirm, confirmerAnnulation } from './reservations.js';

// ── Finances ──
import { renderFinancePage, setFinPeriode, openFinancePdvDetail, closeFinancePdvDetail, openFinanceTrajetDetail, closeFinanceTrajetDetail, openFinanceJourDetail, closeFinanceJourDetail, openFinanceBusDetail, closeFinanceBusDetail } from './finances.js';

// ── Toast utils ──
import { togglePdvPassword, toggleDetailPassword, toggleTousJours, toggleJour, showToastAction } from './toast-utils.js';

// ── Rapports ──
import { genererRapportReservations, imprimerRapportReservations, genererRapportFinances, imprimerRapportFinances } from './reports.js';

// ── controleurs ──
import { switchEquipeTab, loadControleurs, openCreateControleur, closeCreateControleur, createControleurNextStep, createControleurBackStep, submitCreateControleur, openControleurDetail, closeControleurDetail } from './controle.js';

// ── Géolocalisation ──
import { renderGeoPage } from './geo.js';

// ════════════════════════════════
//  INIT AUTH
// ════════════════════════════════
onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = 'auth.html'; return; }
  setCurrentUser(user);

  try {
    const res  = await fetch('https://travio-backend-pa4q.onrender.com', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email: user.email }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast('Erreur lors du chargement du profil.', TOAST_ICONS.error);
      hidePageLoader();
      return;
    }

    setUserUI(data);

    if (data.agenceId) {
      await loadAgenceData(data.agenceId);
      await loadVehicules(data.agenceId);
      hideOnboarding();

      if (!isEssaiActifEtValide()) {
        showLockedOverlay();
      } else {
        checkAbonnementRenewal();
      }

      initInstallPrompt();   // ← ajouté ici
    } else {
      showOnboarding();
    }
  } catch (err) {
    console.error('Erreur init dashboard :', err);
    showToast('Impossible de contacter le serveur.', TOAST_ICONS.error);
  } finally {
    hidePageLoader();
  }
});

// ════════════════════════════════
//  NAVIGATION — rafraîchir finances au changement de page
// ════════════════════════════════
const _origShowPage = showPage;
window.showPage = function(pageId, navEl) {
  _origShowPage(pageId, navEl);
  const finPage = document.getElementById('page-finances');
  if (finPage?.classList.contains('active')) renderFinancePage();
  const aboPage = document.getElementById('page-abonnement');
  if (aboPage?.classList.contains('active')) renderAbonnementPage();
  const geoPage = document.getElementById('page-geo');
  if (geoPage?.classList.contains('active')) renderGeoPage();
  const billetsPage = document.getElementById('page-billets');
  if (billetsPage?.classList.contains('active')) renderBilletConfigPage();
};

// ════════════════════════════════
//  SUPPORT
// ════════════════════════════════
initSupportBubble();

// Listener annulation radio — onboarding
document.addEventListener('change', (e) => {
  if (e.target.name === 'ob-annul') {
    const val = e.target.value;
    const showDelai = (val === 'remboursement' || val === 'sans_remboursement');

    // Onboarding (IDs statiques)
    const delaiWrap  = document.getElementById('ob-annul-delai-wrap');
    const precisWrap = document.getElementById('ob-annul-precisions-wrap');
    if (delaiWrap)  delaiWrap.style.display  = showDelai ? 'block' : 'none';
    if (precisWrap) precisWrap.style.display = val === 'remboursement' ? 'block' : 'none';

    // Edit fiche (IDs dynamiques)
    const editDelaiWrap  = document.getElementById('edit-annul-delai-wrap');
    const editPrecisWrap = document.getElementById('edit-annul-precisions-wrap');
    if (editDelaiWrap)  editDelaiWrap.style.display  = showDelai ? 'block' : 'none';
    if (editPrecisWrap) editPrecisWrap.style.display = val === 'remboursement' ? 'block' : 'none';
  }
});

// ════════════════════════════════
//  EXPOSER TOUT AU HTML
// ════════════════════════════════

// Auth & nav
window.toggleSidebar      = toggleSidebar;
window.handleLogout       = handleLogout;
window.goToSupport        = goToSupport;

// Agence
window.goToStep           = goToStep;
window.handleLogoUpload   = handleLogoUpload;
window.handlePhotosUpload = handlePhotosUpload;
window.removePhoto        = removePhoto;
window.submitAgency       = submitAgency;
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

// billet-config.jq
window.renderBilletConfigPage  = renderBilletConfigPage;
window.selectBilletMode        = selectBilletMode;
window.selectBilletDesign      = selectBilletDesign;
window.submitBilletConfig      = submitBilletConfig;
window.updateBilletConfigBadge = updateBilletConfigBadge;


// PDV
window.openCreatePDV        = openCreatePDV;
window.closeCreatePDV       = closeCreatePDV;
window.createPDVNextStep    = createPDVNextStep;
window.createPDVBackStep    = createPDVBackStep;
window.submitCreatePDV      = submitCreatePDV;
window.openPDVDetail        = openPDVDetail;
window.closePDVDetail       = closePDVDetail;
window.openPDVVille         = openPDVVille;
window.closePDVVille        = closePDVVille;
window.switchPDVTab         = switchPDVTab;
window.loadPDVTrajets       = loadPDVTrajets;
window.openEditPDV          = openEditPDV;
window.closeEditPDV         = closeEditPDV;
window.submitEditPDV        = submitEditPDV;
window.toggleEditAutreVille = toggleEditAutreVille;
window.confirmDeletePDV     = confirmDeletePDV;
window.closeDeletePDV       = closeDeletePDV;
window.deletePDV            = deletePDV;
window.togglePDVStatut      = togglePDVStatut;
window.closeStatutPDV       = closeStatutPDV;
window.confirmToggleStatut  = confirmToggleStatut;
window.openResetPassword    = openResetPassword;
window.closeResetPassword   = closeResetPassword;
window.submitResetPassword  = submitResetPassword;
window.renderPDVStatsBar = renderPDVStatsBar;

// Trajets
window.openCreateTrajet          = openCreateTrajet;
window.closeCreateTrajet         = closeCreateTrajet;
window.openTrajetDetail          = openTrajetDetail;
window.closeTrajetDetail         = closeTrajetDetail;
window.switchTrajetTab           = switchTrajetTab;
window.confirmDeleteTrajet       = confirmDeleteTrajet;
window.closeDeleteTrajet         = closeDeleteTrajet;
window.deleteTrajet              = deleteTrajet;
window.toggleTrajetStatut        = toggleTrajetStatut;
window.closeStatutTrajet         = closeStatutTrajet;
window.confirmToggleTrajetStatut = confirmToggleTrajetStatut;
window.openEditTrajet            = openEditTrajet;
window.closeEditTrajet           = closeEditTrajet;
window.submitEditTrajet          = submitEditTrajet;
window.addEditArretItem          = addEditArretItem;
window.removeEditArret           = removeEditArret;
window.onEditArretVilleChange    = onEditArretVilleChange;
window.trajetNextStep            = trajetNextStep;
window.trajetBackStep            = trajetBackStep;
window.submitCreateTrajet        = submitCreateTrajet;
window.toggleArrets              = toggleArrets;
window.onVilleDepartChange       = onVilleDepartChange;
window.onVilleArriveeChange      = onVilleArriveeChange;
window.addArretItem              = addArretItem;
window.removeArretItem           = removeArretItem;
window.onArretVilleChange        = onArretVilleChange;
window.refreshArretsVilleOptions = refreshArretsVilleOptions;
window.genererTableauTroncons    = genererTableauTroncons;
window.renderPDVMultiSelect      = renderPDVMultiSelect;
window.loadDeparts               = loadDeparts;
window.renderDepartItem          = renderDepartItem;

// Véhicules (Flotte)
window.openCreateVehicule   = openCreateVehicule;
window.closeCreateVehicule  = closeCreateVehicule;
window.submitCreateVehicule = submitCreateVehicule;
window.openEditVehicule     = openEditVehicule;
window.closeEditVehicule    = closeEditVehicule;
window.submitEditVehicule   = submitEditVehicule;
window.openScopeChoice      = openScopeChoice;
window.closeScopeChoice     = closeScopeChoice;
window.confirmScopeChoice   = confirmScopeChoice;

// Bus & Départs
window.openCreateDepart          = openCreateDepart;
window.closeCreateDepart         = closeCreateDepart;
window.submitCreateDepart        = submitCreateDepart;
window.openEditDepart            = openEditDepart;
window.closeEditDepart           = closeEditDepart;
window.submitEditDepart          = submitEditDepart;
window.confirmDeleteDepart       = confirmDeleteDepart;
window.closeDepartDelete         = closeDepartDelete;
window.deleteDepart              = deleteDepart;
window.toggleDepartStatut        = toggleDepartStatut;
window.closeStatutDepart         = closeStatutDepart;
window.confirmToggleDepartStatut = confirmToggleDepartStatut;
window.openBusDetail             = openBusDetail;
window.closeBusDetail            = closeBusDetail;
window.genererSessions           = genererSessions;
window.handleGenererSessions     = handleGenererSessions;
window.onVehiculeSelectChange           = onVehiculeSelectChange;
window.refreshVehiculeSelectAfterCreate = refreshVehiculeSelectAfterCreate;

// Sessions
window.openEditSession       = openEditSession;
window.closeEditSession      = closeEditSession;
window.submitEditSession     = submitEditSession;
window.openEditSessionById   = openEditSessionById;
window.openIncidentSession   = openIncidentSession;
window.closeIncidentSession  = closeIncidentSession;
window.submitIncidentSession = submitIncidentSession;
window.deleteSession         = deleteSession;

// Réservations
window.applyResaFiltres            = applyResaFiltres;
window.filtrerParAlerteTrajets     = filtrerParAlerteTrajets;
window.filtrerParAlertePdv         = filtrerParAlertePdv;
window.filtrerParAlerteAnnulations = filtrerParAlerteAnnulations;
window.openResaDetail              = openResaDetail;
window.closeResaDetail             = closeResaDetail;
window.handleAnnulerResa           = handleAnnulerResa;
window.closeAlerteModal = closeAlerteModal;
window.resetResaFiltres = resetResaFiltres;
window.closeAnnulConfirm   = closeAnnulConfirm;
window.confirmerAnnulation = confirmerAnnulation;
window.imprimerBillet = imprimerBillet;

// Finances
window.renderFinancePage        = renderFinancePage;
window.setFinPeriode            = setFinPeriode;
window.openFinancePdvDetail     = openFinancePdvDetail;
window.closeFinancePdvDetail    = closeFinancePdvDetail;
window.openFinanceTrajetDetail  = openFinanceTrajetDetail;
window.closeFinanceTrajetDetail = closeFinanceTrajetDetail;
window.openFinanceJourDetail    = openFinanceJourDetail;
window.closeFinanceJourDetail   = closeFinanceJourDetail;
window.openFinanceBusDetail     = openFinanceBusDetail;
window.closeFinanceBusDetail    = closeFinanceBusDetail;

// Utils
window.showToast          = showToast;
window.showToastAction    = showToastAction;
window.togglePdvPassword  = togglePdvPassword;
window.toggleDetailPassword = toggleDetailPassword;
window.toggleTousJours    = toggleTousJours;
window.toggleJour         = toggleJour;

// Rapports
window.genererRapportReservations  = genererRapportReservations;
window.imprimerRapportReservations = imprimerRapportReservations;
window.genererRapportFinances      = genererRapportFinances;
window.imprimerRapportFinances     = imprimerRapportFinances;

// Géolocalisation
window.renderGeoPage = renderGeoPage;