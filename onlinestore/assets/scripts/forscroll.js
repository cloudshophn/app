// Mostrar/ocultar botón "Volver arriba"
window.addEventListener('scroll', function() {
  const backToTop = document.getElementById('backToTop');
  if (window.pageYOffset > 300) {
    backToTop.style.display = 'flex';
  } else {
    backToTop.style.display = 'none';
  }
});

// Scroll suave
document.getElementById('backToTop').addEventListener('click', function() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
});

// Año actual para el copyright
document.getElementById('current-year').textContent = new Date().getFullYear();