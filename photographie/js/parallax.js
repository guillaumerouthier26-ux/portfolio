var _scrollEv = window._smoothScrollActive ? 'virtualscroll' : 'scroll';

document.querySelectorAll('.hero-bg, .parallax-img').forEach(img => {
  img.style.height = '120%';
  img.style.top = '-10%';
  img.style.position = 'absolute';
  img.style.width = '100%';
  img.style.objectFit = 'cover';

  function update() {
    const rect = img.parentElement.getBoundingClientRect();
    const progress = -rect.top / (window.innerHeight + rect.height);
    img.style.transform = `translateY(${progress * 35}%)`;
  }

  window.addEventListener(_scrollEv, update, { passive: true });
  update();
});

document.querySelectorAll('.service-img').forEach(img => {
  function update() {
    const rect = img.parentElement.getBoundingClientRect();
    const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
    img.style.transform = `translateY(${(progress - 0.5) * 20}%)`;
  }
  window.addEventListener(_scrollEv, update, { passive: true });
  update();
});

document.querySelectorAll('.projet-img').forEach(img => {
  function update() {
    const rect = img.parentElement.getBoundingClientRect();
    const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
    img.style.transform = `translateY(${(progress - 0.5) * 20}%)`;
  }
  window.addEventListener(_scrollEv, update, { passive: true });
  update();
});

const clientsArea = document.querySelector('.hero-clients-area');
if (clientsArea) {
  const hero = clientsArea.closest('.hero');

  function updateTicker() {
    const rect = hero.getBoundingClientRect();
    const progress = -rect.top / (window.innerHeight + rect.height);
    clientsArea.style.transform = `translateY(${progress * -25}vh)`;
  }

  window.addEventListener(_scrollEv, updateTicker, { passive: true });
  updateTicker();
}
