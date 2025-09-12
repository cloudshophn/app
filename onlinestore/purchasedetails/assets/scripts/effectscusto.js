document.addEventListener('DOMContentLoaded', function() {
    // Configuración del canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.zIndex = '-1';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    document.body.appendChild(canvas);

    // Ajustar tamaño del canvas
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Configuración de partículas
    const particles = [];
    const particleCount = Math.floor(window.innerWidth * window.innerHeight / 10000);
    const colors = ['rgba(74, 108, 247, 0.5)', 'rgba(74, 108, 247, 0.3)', 'rgba(74, 108, 247, 0.2)'];

    // Crear partículas
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 3 + 1,
            speedX: Math.random() * 1 - 0.5,
            speedY: Math.random() * 1 - 0.5,
            color: colors[Math.floor(Math.random() * colors.length)]
        });
    }

    // Conectar partículas cercanas
    function connectParticles() {
        for (let a = 0; a < particles.length; a++) {
            for (let b = a; b < particles.length; b++) {
                const distance = Math.sqrt(
                    Math.pow(particles[a].x - particles[b].x, 2) + 
                    Math.pow(particles[a].y - particles[b].y, 2)
                );
                if (distance < 100) {
                    ctx.strokeStyle = `rgba(74, 108, 247, ${1 - distance/100})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(particles[a].x, particles[a].y);
                    ctx.lineTo(particles[b].x, particles[b].y);
                    ctx.stroke();
                }
            }
        }
    }

    // Animación
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Actualizar y dibujar partículas
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            
            // Mover partículas
            p.x += p.speedX;
            p.y += p.speedY;
            
            // Rebotar en los bordes
            if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
            if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;
            
            // Dibujar partículas
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Conectar partículas
        connectParticles();
        
        requestAnimationFrame(animate);
    }

    // Iniciar animación
    animate();
});