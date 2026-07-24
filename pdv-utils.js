// ─── TRAVIO — Utilitaires partagés PDV (calculs dérivés des réservations) ───
// Centralise tout calcul réutilisé entre pdv.js et reservations.js

const OFFSET_MS_BRAZZA = 1 * 60 * 60 * 1000; // Brazzaville = UTC+1

function toBrazzaDate(isoStr) {
  if (!isoStr) return '';
  return new Date(new Date(isoStr).getTime() + OFFSET_MS_BRAZZA).toISOString().split('T')[0];
}

export function getVentesConfirmees(reservations) {
  return reservations.filter(r => r.statut !== 'annulée');
}

export function getDerniereVentePdv(pdvId, reservations) {
  const ventes = getVentesConfirmees(reservations).filter(r => r.pdvId === pdvId);
  if (ventes.length === 0) return null;
  return ventes.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))[0];
}

export function formatDerniereVente(reservation) {
  if (!reservation?.createdAt) return '—';
  const d          = new Date(reservation.createdAt);
  const todayBrazza = new Date(Date.now() + OFFSET_MS_BRAZZA).toISOString().split('T')[0];
  const hierBrazza  = new Date(Date.now() + OFFSET_MS_BRAZZA - 86400000).toISOString().split('T')[0];
  const dateStr     = toBrazzaDate(reservation.createdAt);

  if (dateStr === todayBrazza) return `Auj. ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Brazzaville' })}`;
  if (dateStr === hierBrazza)  return `Hier ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Brazzaville' })}`;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', timeZone: 'Africa/Brazzaville' });
}

export function estPdvInactif(pdvId, reservations, seuilJours = 5) {
  const derniere = getDerniereVentePdv(pdvId, reservations);
  if (!derniere) return true;

  const dateVente = toBrazzaDate(derniere.createdAt);
  const todayBrazza = new Date(Date.now() + OFFSET_MS_BRAZZA).toISOString().split('T')[0];

  const diffJours = Math.floor(
    (new Date(todayBrazza + 'T00:00:00Z') - new Date(dateVente + 'T00:00:00Z')) / 86400000
  );

  return diffJours >= seuilJours;
}

export function getStatsMoisPdv(pdvId, reservations) {
  const month = new Date(Date.now() + OFFSET_MS_BRAZZA).toISOString().slice(0, 7);
  const ventesMois = getVentesConfirmees(reservations)
    .filter(r => r.pdvId === pdvId && toBrazzaDate(r.createdAt).startsWith(month));

  const revenu  = ventesMois.reduce((s, r) => s + (r.prixTotal || 0), 0);
  const billets = ventesMois.reduce((s, r) => s + (r.nbPassagers || 1), 0);

  return { revenu, billets };
}