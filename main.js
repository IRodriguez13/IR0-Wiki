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
            
            // Scroll instantáneo hacia arriba
            window.scrollTo(0, 0);
        }

        // Función para mostrar/ocultar el menú de idiomas
        function toggleLanguageMenu() {
            const menu = document.getElementById('languageMenu');
            menu.classList.toggle('show');
        }

        // Cerrar el menú cuando se hace clic fuera de él
        document.addEventListener('click', function(event) {
            const dropdown = document.querySelector('.language-dropdown');
            const menu = document.getElementById('languageMenu');
            
            if (!dropdown.contains(event.target)) {
                menu.classList.remove('show');
            }
        });

        // Función para cambiar modo oscuro
        function toggleDarkMode() {
            const body = document.body;
            const darkModeBtn = document.getElementById('darkModeBtn');
            
            if (body.classList.contains('dark-mode')) {
                // Cambiar a modo claro
                body.classList.remove('dark-mode');
                darkModeBtn.textContent = '🌙';
                darkModeBtn.classList.remove('active');
                localStorage.setItem('darkMode', 'false');
            } else {
                // Cambiar a modo oscuro
                body.classList.add('dark-mode');
                darkModeBtn.textContent = '☀️';
                darkModeBtn.classList.add('active');
                localStorage.setItem('darkMode', 'true');
            }
        }

        // Función para cargar preferencia de modo oscuro
        function loadDarkModePreference() {
            const darkMode = localStorage.getItem('darkMode');
            const darkModeBtn = document.getElementById('darkModeBtn');
            
            if (darkMode === 'true') {
                document.body.classList.add('dark-mode');
                darkModeBtn.textContent = '☀️';
                darkModeBtn.classList.add('active');
            }
        }

        // Inicialización cuando se carga la página
        document.addEventListener('DOMContentLoaded', function() {
            // Asegurar que la primera sección esté visible
            showSection('overview');
            
            // Cargar preferencia de modo oscuro
            loadDarkModePreference();
        });