// ─── TRAVIO — Rapport Travio (génération PDF) ───

import { agenceData, resaListFiltree, pdvList, trajetList } from './state.js';
import { showToast } from './toast-utils.js';
import { getResaPeriodeActuelle, calculerStatsResa } from './reservations.js';
import { getFinFiltresActifs, getFinDonneesRapport, getFinColisDonneesRapport } from './finances.js';

// Couleurs officielles Travio (RGB pour jsPDF)
const NAVY       = [10, 14, 39];     // fond bandeau / footer
const TEAL       = [0, 229, 160];    // accent
const TEAL_DARK  = [10, 150, 110];   // pour texte sur fond clair
const WHITE      = [255, 255, 255];
const GRAY       = [110, 118, 140];
const LIGHT_BG   = [244, 246, 250];
const OFFSET_MS  = 1 * 60 * 60 * 1000; // Brazzaville UTC+1

// ── Convertit une image (URL) en base64 pour jsPDF ──
async function urlToBase64(url) {
  try {
    const res  = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror   = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn('Logo non chargé pour le PDF :', e.message);
    return null;
  }
}

// ── Lit les filtres actuellement appliqués sur la page réservations ──
function getFiltresActifs() {
  const villeSel  = document.getElementById('resaFiltreVille');
  const pdvSel    = document.getElementById('resaFiltrePdv');
  const trajetSel = document.getElementById('resaFiltreTrajet');
  const busSel    = document.getElementById('resaFiltreBus');
  const statutSel = document.getElementById('resaFiltreStatut');
  const recherche = clean(document.getElementById('resaRecherche')?.value || '');

  return {
    ville:    clean(villeSel?.value) || 'Toutes les villes',
    pdv:      clean(pdvSel?.selectedOptions[0]?.text)    || 'Tous les PDV',
    trajet:   clean(trajetSel?.selectedOptions[0]?.text) || 'Tous les trajets',
    bus:      clean(busSel?.value) || 'Tous les bus',
    statut:   clean(statutSel?.selectedOptions[0]?.text) || 'Tous statuts',
    periode:  getLabelPeriode(),
    recherche,
  };
}

// ── Calcule les KPIs sur les données déjà filtrées (résa page) ──
function calculerKPIs() {
  return calculerStatsResa(resaListFiltree);
}

function fmtMontant(n) {
  const val = Math.round(Number(n) || 0);
  return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' XAF';
}

function clean(str) {
  return String(str ?? '').replace(/→/g, '-').replace(/[\u00A0\u202F]/g, ' ').trim();
}

function getLabelPeriode() {
  const { periode, custom } = getResaPeriodeActuelle();
  const fmt = (str) => new Date(str + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  if (custom) {
    return custom.debut === custom.fin
      ? `la journée du ${fmt(custom.debut)}`
      : `la période du ${fmt(custom.debut)} au ${fmt(custom.fin)}`;
  }
  const map = {
    today: "les réservations d'aujourd'hui",
    week:  'les réservations de cette semaine',
    month: 'les réservations de ce mois-ci',
    all:   'toutes les réservations enregistrées',
  };
  return map[periode] || 'toutes les réservations enregistrées';
}

// ════════════════════════════════
//  CONSTRUCTION DU DOCUMENT PDF (réutilisée pour export ET impression)
// ════════════════════════════════
async function buildRapportDoc() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  const logoBase64 = agenceData?.logoUrl ? await urlToBase64(agenceData.logoUrl) : null;
  const filtres    = getFiltresActifs();
  const kpis       = calculerKPIs();
  const dateGen    = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Africa/Brazzaville' });

  const heureGen = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Brazzaville' });
  const refRapport = `TRV-${
    new Intl.DateTimeFormat('en-CA', { 
      timeZone: 'Africa/Brazzaville', year: 'numeric', month: '2-digit', day: '2-digit' 
    }).format(new Date()).replace(/-/g,'')}-${Math.floor(Math.random()*900+100)}`;

  const HEADER_H = 88; // AJUSTÉ — hauteur réduite car contenu tient sur moins de lignes

  function drawHeader() {
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, pageWidth, HEADER_H, 'F');

    const centerX = pageWidth / 2;

    // Logo à gauche
    if (logoBase64) {
      try { doc.addImage(logoBase64, 'PNG', 40, 20, 48, 48); } catch (e) {}
    }

    // TRAVIO à droite
    doc.setFontSize(9);
    doc.setTextColor(...TEAL);
    doc.setFont('helvetica', 'bold');
    doc.text('TRAVIO', pageWidth - 40, 30, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(200, 205, 220);
    doc.text('by VTK', pageWidth - 40, 41, { align: 'right' });

    // Bloc central — nom agence
    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text(agenceData?.nom || 'Agence', centerX, 32, { align: 'center' });

    // Bloc central — titre rapport
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...TEAL);
    doc.text('RAPPORT DE RÉSERVATIONS', centerX, 47, { align: 'center' });

    // Bloc central — ligne unique : date + réf + tél + ville
    const coord = [agenceData?.telephone, agenceData?.ville].filter(Boolean).join(' · ');
    const ligneInfo = [`Généré le ${dateGen} à ${heureGen}`, `Réf. ${refRapport}`, coord].filter(Boolean).join('   •   ');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(180, 186, 205);
    doc.text(ligneInfo, centerX, 61, { align: 'center' });
  }

  function drawFooter(pageNum, pageCount) {
    const h = doc.internal.pageSize.getHeight();
    doc.setFillColor(...NAVY);
    doc.rect(0, h - 34, pageWidth, 34, 'F');
    doc.setTextColor(...TEAL);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Propulsé par Travio by VTK', 40, h - 15);
    doc.setTextColor(180, 186, 205);
    doc.setFont('helvetica', 'normal');
    doc.text(`Page ${pageNum} / ${pageCount}`, pageWidth - 40, h - 15, { align: 'right' });
  }

  drawHeader();

  // ── Phrase de synthèse ──
  let y = HEADER_H + 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(60, 66, 90);
  const synthese = `Ce rapport présente ${kpis.total} réservation${kpis.total > 1 ? 's' : ''} sur ${getLabelPeriode()}, pour un revenu net de ${fmtMontant(kpis.revenuNet)}.`;
  doc.text(synthese, 40, y, { maxWidth: pageWidth - 80 });

  // ── BLOC FILTRES APPLIQUÉS ──
  y += 22;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text('Filtres appliqués', 40, y);

  y += 14;
  const ligneRecherche = filtres.recherche ? `\nRecherche : "${filtres.recherche}"` : '';
  const nbLignesFiltre = filtres.recherche ? 4 : 3;
  const hBoxFiltres = 16 + nbLignesFiltre * 14;

  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(40, y, pageWidth - 80, hBoxFiltres, 4, 4, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 66, 90);
  doc.text(`Période : ${filtres.periode}`, 52, y + 18);
  doc.text(`Ville : ${filtres.ville}    •    PDV : ${filtres.pdv}`, 52, y + 32);
  doc.text(`Trajet : ${filtres.trajet}    •    Bus : ${filtres.bus}    •    Statut : ${filtres.statut}`, 52, y + 46);
  if (filtres.recherche) {
    doc.text(`Recherche : "${filtres.recherche}"`, 52, y + 60);
  }

  // ── CARDS KPI (8 cartes, sur 2 lignes) ──
  y += hBoxFiltres + 20;
  const kpiData = [
    { label: 'Réservations',              value: kpis.total.toString() },
    { label: 'Confirmées',                value: kpis.confirmees.toString() },
    { label: 'Annulées',                  value: kpis.annulees.toString() },
    { label: "Taux d'annulation",         value: `${kpis.tauxAnnul}%` },
    { label: 'Billets vendus',            value: kpis.totalPassagers.toString() },
    { label: 'Déjà transportés',          value: kpis.totalDejaTransportes.toString() },
    { label: 'Passagers retirés',         value: kpis.totalRetraits.toString() },
    { label: 'Réaffectées',               value: kpis.reaffecteesCount.toString() },
  ];
  const nbParLigne = 4;
  const cardW = (pageWidth - 80 - (nbParLigne - 1) * 8) / nbParLigne;
  kpiData.forEach((k, i) => {
    const col = i % nbParLigne;
    const row = Math.floor(i / nbParLigne);
    const x = 40 + col * (cardW + 8);
    const cardY = y + row * 60;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(225, 228, 236);
    doc.roundedRect(x, cardY, cardW, 52, 4, 4, 'FD');
    doc.setDrawColor(...TEAL);
    doc.setLineWidth(2);
    doc.line(x, cardY, x, cardY + 52);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...NAVY);
    doc.text(k.value, x + 8, cardY + 24);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(...GRAY);
    doc.text(k.label, x + 8, cardY + 38, { maxWidth: cardW - 12 });
  });
  y += Math.ceil(kpiData.length / nbParLigne) * 60;

  // ── Bandeau Revenu net ──
  doc.setFillColor(240, 248, 244);
  doc.setDrawColor(...TEAL);
  doc.roundedRect(40, y, pageWidth - 80, 34, 4, 4, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text('Revenu net encaissé', 52, y + 15);
  doc.setFontSize(13);
  doc.setTextColor(...TEAL_DARK);
  doc.text(fmtMontant(kpis.revenuNet), 52, y + 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text(`Prix moyen/billet : ${fmtMontant(kpis.prixMoyen)}`, pageWidth - 52, y + 21, { align: 'right' });
  y += 46;

  if (kpis.annulees > 0) {
    doc.setFillColor(255, 245, 246);
    doc.setDrawColor(255, 200, 210);
    doc.roundedRect(40, y, pageWidth - 80, 40, 4, 4, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(180, 40, 60);
    doc.text('Remboursements sur la période', 52, y + 16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(90, 40, 50);
    doc.text(
      `${kpis.annulees} annulation(s) · ${fmtMontant(kpis.montantRembourseTotal)} remboursés · ${fmtMontant(kpis.fraisRetenusAnnulees)} retenus par l'agence`,
      52, y + 30
    );
    y += 50;
  }

  const sorted = [...resaListFiltree].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  const rows = sorted.map(r => {
    const pdv    = pdvList.find(p => p.id === r.pdvId);
    const trajet = trajetList.find(t => t.id === r.trajetId);
    const route  = clean(r.routeLabel || (trajet ? `${trajet.villeDepart} - ${trajet.villeArrivee}` : '—'));
    const nom    = clean(`${r.prenomPassager || ''} ${r.nomPassager || ''}`.trim() || 'Passager');
    const tel    = r.telephonePassager || '—';
    const date   = r.dateDepart ? new Date(r.dateDepart + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '—';
    const ref    = `TRV-${r.id.slice(-6).toUpperCase()}`;
    const nbPass = r.nbPassagers > 1 ? ` (${r.nbPassagers}p)` : '';

    return [
      ref,
      `${nom}\n${tel}`,
      `${route}${nbPass}\n${r.heureDepart || '—'} · ${r.busNom || '—'}`,
      clean(pdv?.nom) || '—',
      date,
      fmtMontant(r.prixTotal),
      r.statut === 'annulée' ? 'Annulée' : 'Confirmée',
    ];
  });

  doc.autoTable({
    startY: y,
    head: [['Réf.', 'Passager', 'Trajet', 'PDV', 'Date', 'Montant', 'Statut']],
    body: rows,
    theme: 'striped',
    styles: { fontSize: 8, cellPadding: 6, textColor: [40, 44, 60] },
    headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 8.5 },
    alternateRowStyles: { fillColor: [248, 249, 252] },
    columnStyles: { 5: { halign: 'right' }, 6: { halign: 'center' } },
    margin: { top: HEADER_H + 8, bottom: 44, left: 40, right: 40 },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 6) {
        if (data.cell.raw === 'Annulée') data.cell.styles.textColor = [255, 77, 106];
        if (data.cell.raw === 'Confirmée') data.cell.styles.textColor = TEAL_DARK;
      }
    },
    didDrawPage: () => drawHeader(),
  });

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    drawFooter(i, pageCount);
  }

  if (rows.length === 0) {
    doc.setFontSize(11);
    doc.setTextColor(...GRAY);
    doc.text('Aucune réservation pour ces filtres.', 40, y + 20);
  }

  return doc;
}

// ════════════════════════════════
//  TÉLÉCHARGER LE RAPPORT (PDF)
// ════════════════════════════════
export async function genererRapportReservations() {
  if (typeof window.jspdf === 'undefined') {
    showToast('Erreur : librairie PDF non chargée.', '❌');
    return;
  }
  showToast('Génération du rapport en cours...', '⏳');
  const doc = await buildRapportDoc();
  const nomFichier = `Rapport_Travio_${
    (agenceData?.nom || 'Agence').replace(/\s+/g, '_')
  }_${
    new Intl.DateTimeFormat('en-CA', { 
      timeZone: 'Africa/Brazzaville', year: 'numeric', month: '2-digit', day: '2-digit' 
    }).format(new Date())}.pdf`;
  doc.save(nomFichier);
  showToast('Rapport généré avec succès.', '✅', true);
}

// ════════════════════════════════
//  IMPRIMER LE RAPPORT
// ════════════════════════════════
export async function imprimerRapportReservations() {
  if (typeof window.jspdf === 'undefined') {
    showToast('Erreur : librairie PDF non chargée.', '❌');
    return;
  }
  showToast('Préparation de l\'impression...', '⏳');
  const doc = await buildRapportDoc();
  doc.autoPrint();
  const blobUrl = doc.output('bloburl');
  window.open(blobUrl, '_blank');
}


// ════════════════════════════════
//  CONSTRUCTION DU DOCUMENT PDF — FINANCES
// ════════════════════════════════
async function buildRapportFinancesDoc() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  const logoBase64 = agenceData?.logoUrl ? await urlToBase64(agenceData.logoUrl) : null;
  const filtres    = getFinFiltresActifs();
  const data       = getFinDonneesRapport();
  const colisData  = await getFinColisDonneesRapport();
  const dateGen    = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Africa/Brazzaville' });
  const heureGen   = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Brazzaville' });
  const refRapport = `TRV-FIN-${
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Brazzaville', year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date()).replace(/-/g,'')}-${Math.floor(Math.random()*900+100)}`;

  const HEADER_H = 88;

  function drawHeader() {
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, pageWidth, HEADER_H, 'F');
    const centerX = pageWidth / 2;

    if (logoBase64) {
      try { doc.addImage(logoBase64, 'PNG', 40, 20, 48, 48); } catch (e) {}
    }

    doc.setFontSize(9);
    doc.setTextColor(...TEAL);
    doc.setFont('helvetica', 'bold');
    doc.text('TRAVIO', pageWidth - 40, 30, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(200, 205, 220);
    doc.text('by VTK', pageWidth - 40, 41, { align: 'right' });

    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text(agenceData?.nom || 'Agence', centerX, 32, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...TEAL);
    doc.text('RAPPORT FINANCIER', centerX, 47, { align: 'center' });

    const coord = [agenceData?.telephone, agenceData?.ville].filter(Boolean).join(' · ');
    const ligneInfo = [`Généré le ${dateGen} à ${heureGen}`, `Réf. ${refRapport}`, coord].filter(Boolean).join('   •   ');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(180, 186, 205);
    doc.text(ligneInfo, centerX, 61, { align: 'center' });
  }

  function drawFooter(pageNum, pageCount) {
    const h = doc.internal.pageSize.getHeight();
    doc.setFillColor(...NAVY);
    doc.rect(0, h - 34, pageWidth, 34, 'F');
    doc.setTextColor(...TEAL);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Propulsé par Travio by VTK', 40, h - 15);
    doc.setTextColor(180, 186, 205);
    doc.setFont('helvetica', 'normal');
    doc.text(`Page ${pageNum} / ${pageCount}`, pageWidth - 40, h - 15, { align: 'right' });
  }

  drawHeader();

  // ── Phrase de synthèse ──
  let y = HEADER_H + 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(60, 66, 90);
  const synthese = colisData.total > 0
    ? `Ce rapport présente ${data.total} vente${data.total > 1 ? 's' : ''} sur ${filtres.periode}, pour un chiffre d'affaires de ${fmtMontant(data.CA)} (billets) et ${fmtMontant(colisData.revenuColis)} (colis).`
    : `Ce rapport présente ${data.total} vente${data.total > 1 ? 's' : ''} sur ${filtres.periode}, pour un chiffre d'affaires de ${fmtMontant(data.CA)}.`;
  doc.text(synthese, 40, y, { maxWidth: pageWidth - 80 });

  // ── Filtres appliqués ──
  y += 22;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text('Filtres appliqués', 40, y);

  y += 14;
  const hBoxFiltres = 16 + 3 * 14;
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(40, y, pageWidth - 80, hBoxFiltres, 4, 4, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 66, 90);
  doc.text(`Période : ${filtres.periode}`, 52, y + 18);
  doc.text(`Ville : ${filtres.ville}    •    PDV : ${filtres.pdv}`, 52, y + 32);
  doc.text(`Trajet : ${filtres.trajet}    •    Bus : ${filtres.bus}    •    Statut : ${filtres.statut}`, 52, y + 46);

  // ── Cards KPI ──
  y += hBoxFiltres + 20;
  const kpiData = [
    { label: 'Ventes',                    value: data.total.toString() },
    { label: 'Confirmées',                value: data.confirmees.toString() },
    { label: 'Annulées',                  value: data.annulees.toString() },
    { label: "Taux d'annulation",         value: `${data.tauxAnnul}%` },
    { label: 'Billets vendus',            value: data.billets.toString() },
    { label: 'Déjà transportés',          value: data.totalDejaTransportes.toString() },
    { label: 'Passagers retirés',         value: data.totalRetraits.toString() },
    { label: 'Prix moyen/billet',         value: fmtMontant(data.prixMoyen) },
  ];
  const nbParLigne = 4;
  const cardW = (pageWidth - 80 - (nbParLigne - 1) * 8) / nbParLigne;
  kpiData.forEach((k, i) => {
    const col = i % nbParLigne;
    const row = Math.floor(i / nbParLigne);
    const x = 40 + col * (cardW + 8);
    const cardY = y + row * 60;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(225, 228, 236);
    doc.roundedRect(x, cardY, cardW, 52, 4, 4, 'FD');
    doc.setDrawColor(...TEAL);
    doc.setLineWidth(2);
    doc.line(x, cardY, x, cardY + 52);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...NAVY);
    doc.text(k.value, x + 8, cardY + 24);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(...GRAY);
    doc.text(k.label, x + 8, cardY + 38, { maxWidth: cardW - 12 });
  });
  y += Math.ceil(kpiData.length / nbParLigne) * 60;

  // ── Bandeau CA ──
  doc.setFillColor(240, 248, 244);
  doc.setDrawColor(...TEAL);
  doc.roundedRect(40, y, pageWidth - 80, 34, 4, 4, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text("Chiffre d'affaires encaissé", 52, y + 15);
  doc.setFontSize(13);
  doc.setTextColor(...TEAL_DARK);
  doc.text(fmtMontant(data.CA), 52, y + 28);
  if (data.meilleurJour) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(`Meilleur jour de vente : ${data.meilleurJour}`, pageWidth - 52, y + 21, { align: 'right' });
  }
  y += 46;

  // ── Bandeau Revenu colis ──
  if (colisData.total > 0) {
    doc.setFillColor(240, 248, 244);
    doc.setDrawColor(...TEAL);
    doc.roundedRect(40, y, pageWidth - 80, 34, 4, 4, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...NAVY);
    doc.text('Colis expédié', 52, y + 15);
    doc.setFontSize(13);
    doc.setTextColor(...TEAL_DARK);
    doc.text(fmtMontant(colisData.revenuColis), 52, y + 28);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(
      `${colisData.total} colis · ${colisData.enTransit} en transit · ${colisData.arrive} arrivés · ${colisData.retire} retirés`,
      pageWidth - 52, y + 21, { align: 'right' }
    );
    y += 46;

    // ── Bandeau CA total combiné (billets + colis) ──
    doc.setFillColor(...NAVY);
    doc.roundedRect(40, y, pageWidth - 80, 34, 4, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...TEAL);
    doc.text('CA total combiné (billets + colis)', 52, y + 15);
    doc.setFontSize(13);
    doc.setTextColor(...WHITE);
    doc.text(fmtMontant(data.CA + colisData.revenuColis), 52, y + 28);
    y += 46;
  }

  // ── Impact sur les revenus ──
  if (data.impact.totalPerdu > 0 || data.impact.totalGarde > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...NAVY);
    doc.text('Impact sur les revenus', 40, y);
    y += 12;

    doc.setFillColor(255, 245, 246);
    doc.setDrawColor(255, 200, 210);
    const hImpact = 62;
    doc.roundedRect(40, y, pageWidth - 80, hImpact, 4, 4, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(90, 40, 50);
    doc.text(
      `Annulations : ${data.impact.nbAnnulees} · ${fmtMontant(data.impact.totalAnnule)} concernés · ${fmtMontant(data.impact.totalFraisAnnul)} de frais retenus`,
      52, y + 16
    );
    doc.text(
      `Modifications à la baisse : ${data.impact.nbModifs} · ${fmtMontant(data.impact.totalBaisse)} de manque à gagner`,
      52, y + 32
    );
    doc.text(
      `Passagers retirés : ${data.impact.nbPassRetires} · ${fmtMontant(data.impact.totalRetraitMontant)} remboursés · ${fmtMontant(data.impact.totalFraisRetrait)} de frais retenus`,
      52, y + 48
    );
    y += hImpact + 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(180, 40, 60);
    doc.text(`Revenu net perdu : ${fmtMontant(data.impact.totalPerdu)}`, 40, y);
    doc.setTextColor(...TEAL_DARK);
    doc.text(`Récupéré en frais : ${fmtMontant(data.impact.totalGarde)}`, pageWidth - 40, y, { align: 'right' });
    y += 22;
  }

  // ── Classement des points de vente ──
  const pdvRows = data.pdvStats.map(p => [p.nom, p.ville, p.resas.toString(), p.billets.toString(), fmtMontant(p.ca)]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text('Ventes par point de vente', 40, y);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text('Classé du plus rentable au moins rentable', 40, y + 11);
  y += 16;

  doc.autoTable({
    startY: y,
    head: [['Point de vente', 'Ville', 'Ventes', 'Billets', "Chiffre d'affaires"]],
    body: pdvRows.length > 0 ? pdvRows : [['Aucune vente sur cette période.', '', '', '', '']],
    theme: 'striped',
    styles: { fontSize: 8, cellPadding: 6, textColor: [40, 44, 60] },
    headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 8.5 },
    alternateRowStyles: { fillColor: [248, 249, 252] },
    columnStyles: { 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'right' } },
    margin: { top: HEADER_H + 8, bottom: 44, left: 40, right: 40 },
    didDrawPage: () => drawHeader(),
  });
  y = doc.lastAutoTable.finalY + 24;

  // ── Classement des trajets ──
  const trajetRows = data.trajetStats.map(t => [t.nom, t.billets.toString(), fmtMontant(t.ca)]);

  // Vérifie s'il faut sauter de page pour garder le titre avec son tableau
  if (y > doc.internal.pageSize.getHeight() - 150) {
    doc.addPage();
    y = HEADER_H + 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text('Ventes par trajet', 40, y);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text('Classé du plus rentable au moins rentable', 40, y + 11);
  y += 16;

  doc.autoTable({
    startY: y,
    head: [['Trajet', 'Billets vendus', "Chiffre d'affaires"]],
    body: trajetRows.length > 0 ? trajetRows : [['Aucune vente sur cette période.', '', '']],
    theme: 'striped',
    styles: { fontSize: 8, cellPadding: 6, textColor: [40, 44, 60] },
    headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 8.5 },
    alternateRowStyles: { fillColor: [248, 249, 252] },
    columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' } },
    margin: { top: HEADER_H + 8, bottom: 44, left: 40, right: 40 },
    didDrawPage: () => drawHeader(),
  });

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    drawFooter(i, pageCount);
  }

  return doc;
}

// ════════════════════════════════
//  TÉLÉCHARGER / IMPRIMER LE RAPPORT FINANCES
// ════════════════════════════════
export async function genererRapportFinances() {
  if (typeof window.jspdf === 'undefined') {
    showToast('Erreur : librairie PDF non chargée.', '❌');
    return;
  }
  showToast('Génération du rapport en cours...', '⏳');
  const doc = await buildRapportFinancesDoc();
  const nomFichier = `Rapport_Finances_Travio_${
    (agenceData?.nom || 'Agence').replace(/\s+/g, '_')
  }_${
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Brazzaville', year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date())}.pdf`;
  doc.save(nomFichier);
  showToast('Rapport généré avec succès.', '✅', true);
}

export async function imprimerRapportFinances() {
  if (typeof window.jspdf === 'undefined') {
    showToast('Erreur : librairie PDF non chargée.', '❌');
    return;
  }
  showToast('Préparation de l\'impression...', '⏳');
  const doc = await buildRapportFinancesDoc();
  doc.autoPrint();
  const blobUrl = doc.output('bloburl');
  window.open(blobUrl, '_blank');
}