document.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelectorAll('.slide');
    const indicators = document.querySelectorAll('.indicator');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    let currentSlide = 0;
    let autoSlideInterval;
    let isTransitioning = false;

    function showSlide(index, direction = 'next') {
        if (isTransitioning || index === currentSlide) return;
        isTransitioning = true;

        // Preparar el nuevo slide
        const nextSlide = slides[index];
        nextSlide.classList.add('active');
        nextSlide.style.transform = direction === 'next' ? 'translateX(100%)' : 'translateX(-100%)';

        // Animar el slide actual para que salga
        const currentSlideEl = slides[currentSlide];
        currentSlideEl.classList.add('exiting');
        currentSlideEl.style.transform = direction === 'next' ? 'translateX(-100%)' : 'translateX(100%)';

        // Animar el nuevo slide para que entre
        setTimeout(() => {
            nextSlide.style.transform = 'translateX(0)';
        }, 10);

        // Actualizar indicadores
        indicators.forEach(ind => ind.classList.remove('active'));
        indicators[index].classList.add('active');

        // Limpiar clases después de la transición
        setTimeout(() => {
            currentSlideEl.classList.remove('active', 'exiting');
            currentSlideEl.style.transform = 'translateX(100%)';
            isTransitioning = false;
        }, 500);

        currentSlide = index;
    }

    function nextSlide() {
        const newIndex = (currentSlide + 1) % slides.length;
        showSlide(newIndex, 'next');
    }

    function prevSlide() {
        const newIndex = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(newIndex, 'prev');
    }

    function startAutoSlide() {
        autoSlideInterval = setInterval(nextSlide, 5000);
    }

    function stopAutoSlide() {
        clearInterval(autoSlideInterval);
    }

    nextBtn.addEventListener('click', () => {
        stopAutoSlide();
        nextSlide();
        startAutoSlide();
    });

    prevBtn.addEventListener('click', () => {
        stopAutoSlide();
        prevSlide();
        startAutoSlide();
    });

    indicators.forEach(indicator => {
        indicator.addEventListener('click', () => {
            stopAutoSlide();
            const index = parseInt(indicator.getAttribute('data-slide'));
            const direction = index > currentSlide ? 'next' : 'prev';
            showSlide(index, direction);
            startAutoSlide();
        });
    });

    // Inicializar el primer slide
    slides[currentSlide].classList.add('active');
    slides[currentSlide].style.transform = 'translateX(0)';
    indicators[currentSlide].classList.add('active');

    startAutoSlide();
});