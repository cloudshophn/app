document.addEventListener('DOMContentLoaded', function() {
    // Animación de texto en welcome-hero
    function animateWelcomeText() {
        const elements = document.querySelectorAll('.welcome-hero-txt h2, .welcome-hero-txt p, .welcome-hero-txt h3');
        elements.forEach(element => {
            const text = element.innerHTML;
            element.innerHTML = '';
            let charIndex = 0;
            text.split(/(\s+|<br>)/).forEach(segment => {
                if (segment === '<br>') {
                    const br = document.createElement('br');
                    element.appendChild(br);
                } else if (segment.match(/\s+/)) {
                    const span = document.createElement('span');
                    span.className = 'letter';
                    span.setAttribute('aria-hidden', 'true');
                    span.style.animationDelay = `${charIndex * 50}ms`;
                    span.innerHTML = ' ';
                    element.appendChild(span);
                    charIndex++;
                } else {
                    segment.split('').forEach(char => {
                        const span = document.createElement('span');
                        span.className = 'letter';
                        span.setAttribute('aria-hidden', 'true');
                        span.style.animationDelay = `${charIndex * 50}ms`;
                        span.innerHTML = char;
                        element.appendChild(span);
                        charIndex++;
                    });
                }
            });
        });
    }

    animateWelcomeText();
});


