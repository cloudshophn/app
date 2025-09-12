document.addEventListener('DOMContentLoaded', function() {
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const mobileMenuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const menuItems = document.querySelectorAll('.menu-item');

    // Alternar sidebar en desktop
    function toggleSidebar() {
        if (window.innerWidth > 768) {
            sidebar.classList.toggle('collapsed');
        }
    }

    // Alternar menú en móviles
    function toggleMobileMenu() {
        sidebar.classList.toggle('active');
    }

    // Función para actualizar la opción activa
    function updateActiveMenuItem() {
        const sections = document.querySelectorAll('.section');
        let currentSection = '';

        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
                currentSection = section.getAttribute('id');
            }
        });

        menuItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === `#${currentSection}`) {
                item.classList.add('active');
            }
        });
    }

    // Evento para el botón del sidebar en desktop
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleSidebar();
        });
    }

    // Evento para el botón del header en móviles
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleMobileMenu();
        });
    }

    // Desplazamiento suave y cerrar menú en móviles
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = item.getAttribute('href').substring(1);
            document.getElementById(targetId).scrollIntoView({ behavior: 'smooth' });
            if (window.innerWidth <= 768) {
                toggleMobileMenu();
            }
            // Actualizar opción activa al hacer clic
            menuItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Cerrar menú al hacer clic fuera en móviles
    document.addEventListener('click', function(event) {
        if (window.innerWidth <= 768 && sidebar.classList.contains('active')) {
            if (!sidebar.contains(event.target) && event.target !== mobileMenuToggle) {
                toggleMobileMenu();
            }
        }
    });

    // Manejo de redimensionamiento
    function handleResize() {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('active');
        } else {
            sidebar.classList.remove('collapsed');
        }
    }

    // Actualizar opción activa al desplazarse
    window.addEventListener('scroll', updateActiveMenuItem);
    window.addEventListener('resize', handleResize);
    handleResize();
    updateActiveMenuItem(); // Inicializar la opción activa
});



//welcome hero aqui, funcion

