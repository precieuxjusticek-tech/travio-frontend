// ─── TRAVIO — Splash Screen ───

window.addEventListener('DOMContentLoaded', () => {

  const logoIcon = document.getElementById('logoIcon');
  const logoName = document.getElementById('logoName');
  const slogan   = document.getElementById('slogan');
  const loader   = document.getElementById('loader');
  const splash   = document.getElementById('splash');
  const app      = document.getElementById('app');
  const brandBy = document.getElementById('brandBy');

  // Étape 1 — Apparition progressive
  setTimeout(() => logoIcon.classList.add('visible'), 100);
  setTimeout(() => logoName.classList.add('visible'), 300);
  setTimeout(() => slogan.classList.add('visible'),   500);
  setTimeout(() => loader.classList.add('visible'),   700);
  setTimeout(() => brandBy.classList.add('visible'), 600);

  // Étape 2 — Fin du splash → onboarding
  setTimeout(() => {
    splash.classList.add('hide');
    setTimeout(() => {
      splash.style.display = 'none';
      app.classList.add('visible');
      initOnboarding();
    }, 650);
  }, 6800);

});

// ─── TRAVIO — Onboarding ───

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
    window.location.href = 'auth.html'
  }
}

function goToLogin() {
    window.location.href = 'auth.html'
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