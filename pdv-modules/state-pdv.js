// ─── TRAVIO — PDV — State partagé ───

import { escapeHtml } from '../sanitize.js';

// ════════════════════════════════
//  CONSTANTES
// ════════════════════════════════
export const BACKEND = 'https://travio-backend-pa4q.onrender.com';
export const OFFSET_MS_FIN = 1 * 60 * 60 * 1000;

export const ICONS = {
  close:   '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  wave:    '<svg width="18" height="18" viewBox="0 0 16 16" fill="none" style="vertical-align:-3px;"><path d="M8 1a2 2 0 012 2v4M8 1a2 2 0 00-2 2v5M11 5a1.3 1.3 0 012.6 0v3M6 7a1.3 1.3 0 00-2.6 0v1.5c0 3 2 5.5 5 5.5h1c2.5 0 4.5-2 4.5-4.5V7a1.3 1.3 0 00-2.6 0" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  lock:    '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-1px;"><rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" stroke-width="1.4"/><path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" stroke-width="1.4"/></svg>',
  warning: '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-1px;"><path d="M8 2L1 14h14L8 2z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M8 6.5v3.5M8 12v.1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  check:   '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-1px;"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.4"/><path d="M5 8l2 2 4-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  dotOrange:'<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#FFB23F;"></span>',
  dotGreen: '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#00E5A0;"></span>',
  dotRed:   '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#FF4D6A;"></span>',
  map:     '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:4px;"><path d="M1 4l5-1.5 4 1.5 5-1.5v10l-5 1.5-4-1.5-5 1.5V4z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>',
  arrow:   '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:4px;"><path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  bus:     '<svg width="13" height="13" viewBox="0 0 20 20" fill="none" style="vertical-align:-2px;margin-right:4px;"><rect x="3" y="4" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M3 10h14" stroke="currentColor" stroke-width="1.5"/><circle cx="6" cy="16" r="1.5" stroke="currentColor" stroke-width="1.4"/><circle cx="14" cy="16" r="1.5" stroke="currentColor" stroke-width="1.4"/></svg>',
  clock:   '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:3px;"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.4"/><path d="M8 5v3.5l2.5 1.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  bag:     '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:3px;"><rect x="3" y="5" width="10" height="8" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M6 5V3.5a2 2 0 014 0V5" stroke="currentColor" stroke-width="1.3"/></svg>',
  seat:    '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:3px;"><path d="M4 3v6a2 2 0 002 2h4M4 9H2.5a1 1 0 000 2H4M12 9h1.5a1 1 0 010 2H12v2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  person:  '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:3px;"><circle cx="8" cy="6" r="3" stroke="currentColor" stroke-width="1.3"/><path d="M2 15a6 6 0 0112 0" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
  print:   '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:4px;"><path d="M4 6V2h8v4M3 6h10a1 1 0 011 1v4a1 1 0 01-1 1h-2v2H5v-2H3a1 1 0 01-1-1V7a1 1 0 011-1z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><rect x="5" y="10" width="6" height="4" stroke="currentColor" stroke-width="1.2"/></svg>',
  edit:    '<svg width="13" height="13" viewBox="0 0 14 14" fill="none" style="vertical-align:-2px;margin-right:4px;"><path d="M9 2l3 3L4 13H1v-3L9 2z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  trash:   '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:4px;"><path d="M3 4h10M6 4V2h4v2M4 4l1 10h6l1-10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  banned:  '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:4px;"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.4"/><path d="M4 4l8 8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  eye:     '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:3px;"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.5"/></svg>',
  clipboard:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:4px;"><rect x="3" y="2" width="10" height="12" rx="1.5" stroke="currentColor" stroke-width="1.4"/><rect x="6" y="1" width="4" height="2.5" rx="0.5" stroke="currentColor" stroke-width="1.2"/></svg>',
  scissors:'<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:3px;"><circle cx="4" cy="4" r="1.6" stroke="currentColor" stroke-width="1.3"/><circle cx="4" cy="12" r="1.6" stroke="currentColor" stroke-width="1.3"/><path d="M5.3 5.2L13 12M5.3 10.8L13 4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
  chart:   '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:4px;"><path d="M2 12l4-4 3 3 5-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M11 5h3v3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  calendar:'<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:3px;"><rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M5 1v4M11 1v4M2 7h12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  info: '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-1px;"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.4"/><path d="M8 7v4.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="8" cy="4.8" r="0.9" fill="currentColor"/></svg>',
  coin: '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="vertical-align:-2px;margin-right:4px;"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.4"/><path d="M8 4.5v7M6 6.2c0-.9.9-1.5 2-1.5s2 .6 2 1.4c0 1.8-4 1-4 2.8 0 .8.9 1.4 2 1.4s2-.6 2-1.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>',
  refresh: '<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M13 8A5 5 0 103 8M13 8V4M13 8H9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

export function toBrazzaDate(isoStr) {
  if (!isoStr) return '';
  return new Date(new Date(isoStr).getTime() + OFFSET_MS_FIN).toISOString().split('T')[0];
}

// ════════════════════════════════
//  STATE PARTAGÉ (utilisé par plusieurs modules)
// ════════════════════════════════
export let pdvData    = null;
export let agenceData = null;
export let trajetList = [];
export let resaList   = [];
export let colisList  = [];
export let colisEnvoyesList = [];
export let currentUser = null;
export let statsPdvCache = null;

export function setPdvData(v)          { pdvData = v; }
export function setAgenceData(v)       { agenceData = v; }
export function setTrajetList(v)       { trajetList = v; }
export function setResaList(v)         { resaList = v; }
export function setColisList(v)        { colisList = v; }
export function setColisEnvoyesList(v) { colisEnvoyesList = v; }
export function setCurrentUser(v)      { currentUser = v; }
export function setStatsPdvCache(v)    { statsPdvCache = v; }
export function invalidateStatsPdvCache() { statsPdvCache = null; }

// ════════════════════════════════
//  HELPERS TYPES DE BILLET
// ════════════════════════════════
export function nomType(typeId) {
  return escapeHtml((agenceData?.typesBillet || []).find(t => t.id === typeId)?.nom || typeId);
}
export function nomTypeResa(r) {
  return r.typeBilletNom ? escapeHtml(r.typeBilletNom) : nomType(r.typeBillet);
}
export function nomTypePassager(p) {
  return p.typeNom ? escapeHtml(p.typeNom) : nomType(p.type);
}
export function ageRangeLabel(typeId) {
  const t = (agenceData?.typesBillet || []).find(t => t.id === typeId);
  if (!t) return '';
  return t.ageMax == null ? `${t.ageMin} ans et +` : `${t.ageMin}-${t.ageMax} ans`;
}
export function peuplerSelectType(select) {
  if (!select) return;
  select.innerHTML = (agenceData?.typesBillet || []).map(t =>
    `<option value="${escapeHtml(t.id)}">${escapeHtml(t.nom)} — ${ageRangeLabel(t.id)}</option>`
  ).join('');
}