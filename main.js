 function showSection(sectionId) {
            // Ocultar todas las secciones
            var sections = document.querySelectorAll('.section');
            for (var i = 0; i < sections.length; i++) {
                sections[i].classList.remove('active');
            }
            
            // Mostrar la sección seleccionada
            document.getElementById(sectionId).classList.add('active');
            
            // Actualizar navegación
            var navLinks = document.querySelectorAll('.nav-link');
            for (var i = 0; i < navLinks.length; i++) {
                navLinks[i].classList.remove('active');
            }
            
            // Encontrar y activar el link correspondiente
            var currentLink = document.querySelector('a[href="#' + sectionId + '"]');
            if (currentLink) {
                currentLink.classList.add('active');
            }
            
            // Scroll suave hacia arriba
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }

        // Inicialización cuando se carga la página
        document.addEventListener('DOMContentLoaded', function() {
            // Asegurar que la primera sección esté visible
            showSection('overview');
        });