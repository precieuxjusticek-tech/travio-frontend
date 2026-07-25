// ─── TRAVIO — Splash Screen ───
import { auth } from './firebase-client.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const BACKEND = 'https://travio-backend-pa4q.onrender.com';

window.addEventListener('DOMContentLoaded', () => {

  let splashAnimDone = false; // true quand l'animation visuelle est finie
  let authDecision   = null;  // { type: 'guest' } ou { type: 'redirect', url }

  // ─── On ne conclut que quand LES DEUX sont prêts ───
  function tryConclude() {
    if (!splashAnimDone || !authDecision) return;

    const splash = document.getElementById('splash');
    const app    = document.getElementById('app');

    splash.classList.add('hide');
    setTimeout(() => {
      splash.style.display = 'none';

      if (authDecision.type === 'redirect') {
        window.location.href = authDecision.url;
      } else {
        app.classList.add('visible');
        initOnboarding();
      }
    }, 650);
  }

  // ─── L'ANIMATION DÉMARRE TOUJOURS, IMMÉDIATEMENT ───
  playSplashAnimation(() => {
    splashAnimDone = true;
    tryConclude();
  });

  // ─── Filet de sécurité : si Firebase/backend ne répond jamais,
  // on ne reste pas bloqué indéfiniment (on traite comme "invité") ───
  const safetyTimer = setTimeout(() => {
    if (!authDecision) {
      authDecision = { type: 'guest' };
      tryConclude();
    }
  }, 10000);

  // ─── La logique d'auth tourne EN PARALLÈLE, en arrière-plan ───
  onAuthStateChanged(auth, async (user) => {
    if (authDecision) return; // déjà tranché (ex: par le filet de sécurité)

    if (!user) {
      clearTimeout(safetyTimer);
      authDecision = { type: 'guest' };
      tryConclude();
      return;
    }

    try {
      const res  = await fetch(`${BACKEND}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: user.email }),
      });
      const data = await res.json();

      clearTimeout(safetyTimer);

      if (!res.ok) {
        authDecision = { type: 'redirect', url: 'auth.html' };
      } else {
        authDecision = { type: 'redirect', url: (data.role === 'agent') ? 'dashboard-pdv.html' : 'dashboard.html' };
      }
      tryConclude();

    } catch (err) {
      console.error('Erreur vérification session :', err);
      clearTimeout(safetyTimer);
      authDecision = { type: 'redirect', url: 'auth.html' };
      tryConclude();
    }
  });

});

// ─── Animation du splash (indépendante, joue toujours en entier) ───

function playSplashAnimation(onComplete) {
  const logoIcon = document.getElementById('logoIcon');
  const logoName = document.getElementById('logoName');
  const slogan   = document.getElementById('slogan');
  const loader   = document.getElementById('loader');
  const brandBy  = document.getElementById('brandBy');

  setTimeout(() => logoIcon.classList.add('visible'), 100);
  setTimeout(() => logoName.classList.add('visible'), 300);
  setTimeout(() => slogan.classList.add('visible'),   500);
  setTimeout(() => brandBy.classList.add('visible'),  600);
  setTimeout(() => loader.classList.add('visible'),   700);

  // Durée totale d'affichage du splash avant de trancher
  setTimeout(onComplete, 6800);
}

// ─── TRAVIO — Onboarding ─── (inchangé)

let currentSlide = 0;
const totalSlides = 5;

function initOnboarding() {
  const slides = document.querySelectorAll('.ob-slide');
  slides.forEach((slide, i) => {
    slide.style.transform = `translateX(${i * 100}%)`;
  });
  updateSlider();
}

function updateSlider() {
  const slides = document.querySelectorAll('.ob-slide');
  const dots   = document.querySelectorAll('.ob-dot');
  const btn    = document.getElementById('obBtn');

  slides.forEach((slide, i) => {
    slide.style.transform = `translateX(${(i - currentSlide) * 100}%)`;
  });

  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === currentSlide);
  });

  if (currentSlide === totalSlides - 1) {
    btn.innerHTML = 'Créer mon agence →';
    btn.classList.add('final');

    const footer = document.querySelector('.ob-footer');
    if (!document.getElementById('loginLink')) {
      const link = document.createElement('a');
      link.id = 'loginLink';
      link.textContent = "J'ai déjà un compte";
      link.style.cssText = 'display:block;text-align:center;font-size:13px;color:#8892a4;margin-top:10px;cursor:pointer;text-decoration:underline;';
      link.onclick = goToLogin;
      footer.appendChild(link);
    }
  } else {
    btn.innerHTML = 'Suivant →';
    btn.classList.remove('final');
    const link = document.getElementById('loginLink');
    if (link) link.remove();
  }
}

function nextSlide() {
  if (currentSlide < totalSlides - 1) {
    currentSlide++;
    updateSlider();
  } else {
    window.location.href = 'auth.html';
  }
}

function goToLogin() {
  window.location.href = 'auth.html';
}

// Swipe tactile
let touchStartX = 0;
document.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
}, { passive: true });

document.addEventListener('touchend', (e) => {
  const diff = touchStartX - e.changedTouches[0].clientX;
  if (Math.abs(diff) > 50) {
    if (diff > 0) nextSlide();
  }
}, { passive: true });

// ─── Exposer au HTML (obligatoire maintenant qu'on est en module) ───
window.goToLogin = goToLogin;
window.nextSlide = nextSlide;