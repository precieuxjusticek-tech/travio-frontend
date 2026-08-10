// ─── TRAVIO — PDV — Mon point de vente (profil, stats, sessions récentes) ───

import { apiFetch } from '../api.js';
import { escapeHtml } from '../sanitize.js';
import {
  ICONS, BACKEND, nomType, toBrazzaDate,
  pdvData, agenceData, trajetList, resaList,
  statsPdvCache, setStatsPdvCache,
} from './state-pdv.js';

export async function renderMonPDVPage() {
  if (!pdvData) return;

  // Hero
  const initiale = pdvData.responsable ? pdvData.responsable[0].toUpperCase() : '?';
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  setEl('monpdvAvatar',     initiale);
  setEl('monpdvNom',        pdvData.nom       || '—');
  setEl('monpdvVille',      pdvData.ville     || '—');
  setEl('monpdvAgence',     agenceData?.nom   || '—');
  setEl('monpdvInfoNom',    pdvData.nom       || '—');
  setEl('monpdvInfoVille',  pdvData.ville     || '—');
  setEl('monpdvInfoAdresse',pdvData.adresse   || '—');
  setEl('monpdvInfoTel',    pdvData.telephone || '—');
  setEl('monpdvInfoResp',   pdvData.responsable || '—');
  setEl('monpdvInfoAgence', agenceData?.nom   || '—');

  // Stats locales (depuis resaList)
  const monthStr = toBrazzaDate(new Date().toISOString()).slice(0, 7);
  const vendusMois = resaList.filter(r => toBrazzaDate(r.createdAt).startsWith(monthStr)).length;
  const revMois    = resaList.filter(r => toBrazzaDate(r.createdAt).startsWith(monthStr))
                              .reduce((s, r) => s + (r.prixTotal || 0), 0);

  setEl('monpdvStatVendus',  vendusMois.toLocaleString() + ' billets');
  setEl('monpdvStatRevenus', revMois.toLocaleString() + ' XAF');
  setEl('monpdvStatTrajets', trajetList.length.toString());

  // Taux moyen via API stats (avec cache)
  try {
    if (!statsPdvCache) {
      const res  = await apiFetch(`${BACKEND}/pdv/${pdvData.id}/stats?agenceId=${pdvData.agenceId}`);
      setStatsPdvCache(await res.json());
    }
    const data = statsPdvCache;
    setEl('monpdvStatTaux',        (data.tauxMoyen      || 0) + ' %');
    setEl('monpdvStatAnnulations', (data.annulations    || 0).toLocaleString() + ' billets');
    setEl('monpdvStatNettes',      (data.ventesNettes   || 0).toLocaleString() + ' billets');
    setEl('monpdvStatTauxAnnul',   (data.tauxAnnulation || 0) + ' %');

    // Sessions récentes
    const sessEl = document.getElementById('monpdvSessionsList');
    if (sessEl) {
      const sess = data.sessionsRecentes || [];
      if (sess.length === 0) {
        sessEl.innerHTML = `<div class="empty-state small"><p>Aucune session récente.</p></div>`;
      } else {
        sessEl.innerHTML = sess.map(s => {
          const barW = Math.min(100, s.taux);
          const barColor = barW > 80 ? '#FF4D6A' : barW > 50 ? '#FFB23F' : 'var(--accent)';
          return `
            <div class="monpdv-session-row">
              <div class="monpdv-session-left">
                <div class="monpdv-session-date">${new Date(s.date).toLocaleDateString('fr-FR', {weekday:'short',day:'2-digit',month:'short'})}</div>
                <div class="monpdv-session-route">${escapeHtml(s.villeDepart)} → ${escapeHtml(s.villeArrivee)} · ${escapeHtml(s.heureDepart)}</div>
                <div class="monpdv-session-bus">${ICONS.bus} ${escapeHtml(s.busNom)}</div>
              </div>
              <div class="monpdv-session-right">
              <div class="monpdv-session-count">${Number(s.placesVendues)}/${Number(s.placesTotal)}</div>
                <div class="monpdv-session-bar-wrap">
                  <div class="monpdv-session-bar" style="width:${barW}%;background:${barColor};"></div>
                </div>
                <div style="font-size:10px;color:var(--muted);text-align:right;">${Number(s.taux)}%</div>
              </div>
            </div>`;
        }).join('');
      }
    }
  } catch (_) {
    setEl('monpdvStatTaux', '—');
  }

  // Trajets assignés
  const trajEl = document.getElementById('monpdvTrajetsList');
  if (trajEl) {
    if (trajetList.length === 0) {
      trajEl.innerHTML = `<div class="empty-state small"><p>Aucun trajet assigné.</p></div>`;
    } else {
      trajEl.innerHTML = trajetList.map(t => `
        <div class="monpdv-trajet-row">
          <div>
            <div style="font-size:13px;font-weight:600;color:var(--white);">${escapeHtml(t.villeDepart)} → ${escapeHtml(t.villeArrivee)}</div>
            <div style="font-size:11px;color:var(--muted);margin-top:2px;">
              ${t.typeTrajet === 'arrets' ? '⊙ Avec arrêts' : '→ Direct'} · ${escapeHtml(t.heureDepart || '—')}
              ${t.heureArrivee ? ' → ' + escapeHtml(t.heureArrivee) : ''}
            </div>
          </div>
          <div style="text-align:right;">
            ${Object.entries(t.prixParType || {}).map(([id, p]) => `<div style="font-family:'Syne',sans-serif;font-size:13px;font-weight:800;color:var(--white);">${Number(p).toLocaleString()} <span style="font-size:9px;color:var(--muted);font-weight:400;">${escapeHtml(nomType(id))}</span></div>`).join('')}
          </div>
        </div>`).join('');
    }
  }
}
window.renderMonPDVPage = renderMonPDVPage;