document.addEventListener('DOMContentLoaded', function() {
    // ===== [1. OPTIMIZACIÓN DE VIDEOS RESPONSIVE] =====
    const videoContainer = document.querySelector('.video-background');
    const desktopVideo = videoContainer.querySelector('.desktop-video');
    const mobileVideo = videoContainer.querySelector('.mobile-video');
    
    // Precargar ambos videos
    desktopVideo.load();
    mobileVideo.load();
    
    // Función para manejar el cambio de video según el dispositivo
    function handleVideoSwitch() {
        if (window.innerWidth >= 768) {
            desktopVideo.style.display = 'block';
            mobileVideo.style.display = 'none';
            desktopVideo.play().catch(e => console.log('Autoplay prevented:', e));
            mobileVideo.pause();
        } else {
            desktopVideo.style.display = 'none';
            mobileVideo.style.display = 'block';
            mobileVideo.play().catch(e => console.log('Autoplay prevented:', e));
            desktopVideo.pause();
        }
    }
    
    // Manejadores para asegurar la reproducción
    desktopVideo.addEventListener('loadedmetadata', () => {
        desktopVideo.muted = true;
        if (window.innerWidth >= 768) {
            desktopVideo.play().catch(e => console.log('Autoplay prevented:', e));
        }
    });
    
    mobileVideo.addEventListener('loadedmetadata', () => {
        mobileVideo.muted = true;
        if (window.innerWidth < 768) {
            mobileVideo.play().catch(e => console.log('Autoplay prevented:', e));
        }
    });
    
    // Inicializar y manejar redimensionamiento
    handleVideoSwitch();
    window.addEventListener('resize', handleVideoSwitch);

    // ===== [2. LÓGICA DE LAS PARTÍCULAS] =====
    const particleConfig = {
        particleCount: 25,
        maxSize: 3,
        speed: 1.2,
        colors: {
            investor: ['#3498db', '#2ecc71'],
            commerce: ['#9b59b6', '#e74c3c'],
            gold: ['#FFD700', '#FFC125', '#DAA520'] // Colores dorados añadidos
        }
    };

    // Inicializar partículas originales
    initParticles('particles-inversionistas', particleConfig.colors.investor);
    initParticles('particles-comerciantes', particleConfig.colors.commerce);
    
    // Inicializar partículas doradas adicionales
    initGoldParticles('particles-inversionistas', particleConfig.colors.gold);
    initGoldParticles('particles-comerciantes', particleConfig.colors.gold);

    function initParticles(canvasId, colors) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        const card = canvas.parentElement;
        const ctx = canvas.getContext('2d');
        
        function resizeCanvas() {
            canvas.width = card.offsetWidth;
            canvas.height = card.offsetHeight;
        }
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        const particles = [];
        for (let i = 0; i < particleConfig.particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * particleConfig.maxSize + 1,
                color: colors[Math.floor(Math.random() * colors.length)],
                speedX: (Math.random() - 0.5) * particleConfig.speed,
                speedY: (Math.random() - 0.5) * particleConfig.speed
            });
        }
        
        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            particles.forEach(particle => {
                particle.x += particle.speedX;
                particle.y += particle.speedY;
                
                if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
                if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;
                
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = particle.color;
                ctx.fill();
            });
            
            requestAnimationFrame(animate);
        }
        
        animate();
    }
    
    function initGoldParticles(canvasId, colors) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const goldParticles = [];
        const goldParticleCount = 10; // Menos partículas para mejor rendimiento
        
        for (let i = 0; i < goldParticleCount; i++) {
            goldParticles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 4 + 2, // Tamaño mayor
                color: colors[Math.floor(Math.random() * colors.length)],
                speedX: (Math.random() - 0.5) * 0.8, // Movimiento más lento
                speedY: (Math.random() - 0.5) * 0.8,
                alpha: Math.random() * 0.5 + 0.5
            });
        }
        
        function animateGold() {
            goldParticles.forEach(particle => {
                particle.x += particle.speedX;
                particle.y += particle.speedY;
                
                if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -0.8;
                if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -0.8;
                
                // Efecto de brillo dorado
                const gradient = ctx.createRadialGradient(
                    particle.x, particle.y, 0,
                    particle.x, particle.y, particle.size
                );
                gradient.addColorStop(0, particle.color);
                gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
                
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.globalAlpha = particle.alpha;
                ctx.fill();
                ctx.globalAlpha = 1;
            });
            
            requestAnimationFrame(animateGold);
        }
        
        animateGold();
    }

    // ===== [3. LÓGICA DEL FORMULARIO] =====
    document.getElementById('interes').addEventListener('change', function() {
        const rubroContainer = document.getElementById('rubroContainer');
        const empresaContainer = document.getElementById('empresaContainer');
        
        if (this.value === 'comercio') {
            rubroContainer.style.display = 'block';
            empresaContainer.style.display = 'block';
        } else {
            rubroContainer.style.display = 'none';
            empresaContainer.style.display = 'none';
        }
    });
});

// Función para enviar por WhatsApp
function enviarWhatsApp() {
    const nombre = document.getElementById('nombre').value;
    const telefono = document.getElementById('telefono').value;
    const email = document.getElementById('email').value;
    const interes = document.getElementById('interes').value;
    const rubro = document.getElementById('rubro')?.value;
    const empresa = document.getElementById('empresa')?.value;
    
    let mensaje = `Hola, estoy interesado en unirme a Find it, Ask it S.A.%0A%0A`;
    mensaje += `*Nombre:* ${nombre}%0A`;
    mensaje += `*Teléfono:* ${telefono}%0A`;
    mensaje += `*Email:* ${email}%0A`;
    mensaje += `*Interés:* ${interes === 'inversion' ? 'Inversión' : 'Comercio'}%0A`;
    
    if (interes === 'comercio') {
        mensaje += `*Rubro:* ${rubro.charAt(0).toUpperCase() + rubro.slice(1)}%0A`;
        mensaje += `*Empresa/Negocio:* ${empresa}%0A`;
    }
    
    window.open(`https://wa.me/?text=${mensaje}`, '_blank');
}