// ─── TRAVIO — Géolocalisation des bus (à venir) ───

export function renderGeoPage() {
  const container = document.getElementById('geoContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="geo-soon-card">
      <div class="geo-soon-icon-wrap">
        <div class="geo-soon-icon-ring"></div>
        <div class="geo-soon-icon-ring delay"></div>
        <div class="geo-soon-icon">
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
            <rect x="6" y="11" width="18" height="12" rx="2.5" stroke="currentColor" stroke-width="1.8"/>
            <path d="M9 11V8a2 2 0 012-2h8a2 2 0 012 2v3" stroke="currentColor" stroke-width="1.8"/>
            <circle cx="10.5" cy="23" r="1.8" stroke="currentColor" stroke-width="1.6"/>
            <circle cx="19.5" cy="23" r="1.8" stroke="currentColor" stroke-width="1.6"/>
            <path d="M22 4a3 3 0 013 3c0 2.2-3 5-3 5s-3-2.8-3-5a3 3 0 013-3z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
            <circle cx="22" cy="7" r="0.9" fill="currentColor"/>
          </svg>
        </div>
      </div>

      <span class="geo-soon-badge">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.5"/><path d="M8 4.5V8l2.5 1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        Fonctionnalité à venir
      </span>

      <h2>Suivi des bus en temps réel</h2>
      <p>Bientôt, vous pourrez voir la position exacte de chaque bus de votre flotte sur une carte, en direct — utile pour informer vos voyageurs et suivre vos trajets à tout moment.</p>

      <div class="geo-soon-features">
        <span class="geo-soon-feature">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 1a5 5 0 00-5 5c0 3.5 5 9 5 9s5-5.5 5-9a5 5 0 00-5-5z" stroke="currentColor" stroke-width="1.5"/></svg>
          Position en direct
        </span>
        <span class="geo-soon-feature">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.5"/><path d="M8 4.5V8l2.5 1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          Heure d'arrivée estimée
        </span>
        <span class="geo-soon-feature">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 8h12M8 2v12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          Vitesse et trajet parcouru
        </span>
      </div>
    </div>
  `;
}

window.renderGeoPage = renderGeoPage;