document.addEventListener('DOMContentLoaded', () => {
    const contributorsGrid = document.getElementById('contributors-grid');
    if (!contributorsGrid) return;

    const STORAGE_KEY = 'ir0_contributors';

    // Función para guardar contribuidores en localStorage
    function saveContributorsToStorage(contributors) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(contributors));
        } catch (error) {
            console.error('Error saving contributors to localStorage:', error);
        }
    }

    // Función para cargar contribuidores desde localStorage
    function loadContributorsFromStorage() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading contributors from localStorage:', error);
        }
        return null;
    }

    // Función para renderizar los contribuidores en el DOM
    function renderContributors(contributors) {
        // Limpiar el grid primero
        contributorsGrid.innerHTML = '';

        if (contributors.length === 0) {
            contributorsGrid.innerHTML = '<p>No contributors found (yet).</p>';
            return;
        }

        // ordeno de mayor a menor
        contributors.sort((a, b) => b.contributions - a.contributions);

        contributors.forEach(contributor => {
            const card = document.createElement('a'); // ahora es un enlace
            card.href = contributor.html_url;
            card.target = "_blank";
            card.rel = "noopener noreferrer";

            // Me fijo si soy yo
            const isCreator = contributor.login === 'IRodriguez13';
            const creatorBadge = isCreator ? '<span class="creator-badge">Creator</span>' : '';
            const cardClass = isCreator ? 'contributor-card creator' : 'contributor-card';

            card.className = cardClass;

            card.innerHTML = `
                <div class="contributor-avatar-container">
                    <img src="${contributor.avatar_url}" alt="${contributor.login}" class="contributor-avatar">
                    ${creatorBadge}
                </div>
                <div class="contributor-info">
                    <span class="contributor-name">
                        ${contributor.login}
                    </span>
                    <div class="contributor-commits">
                        <span class="commit-count">${contributor.contributions}</span> commits
                    </div>
                </div>
            `;
            contributorsGrid.appendChild(card);
        });
    }

    // Cargar contribuidores desde localStorage primero (para mostrar algo rápido)
    const cachedContributors = loadContributorsFromStorage();
    if (cachedContributors && cachedContributors.length > 0) {
        renderContributors(cachedContributors);
    }

    // Intentar obtener contribuidores desde la API
    fetch('https://ir0-loc.onrender.com/api/contributors')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            // The API returns { contributors: [...] }
            const contributors = data.contributors || [];

            // Guardar en localStorage para futuras sesiones
            if (contributors.length > 0) {
                saveContributorsToStorage(contributors);
            }

            // Renderizar los nuevos datos de la API
            renderContributors(contributors);
        })
        .catch(error => {
            console.error('Error loading contributors from API:', error);
            
            // Si falla la API, usar los datos de localStorage si existen
            const cachedContributors = loadContributorsFromStorage();
            if (cachedContributors && cachedContributors.length > 0) {
                // Ya se renderizaron arriba, pero podemos asegurarnos aquí también
                renderContributors(cachedContributors);
            } else {
                // Solo mostrar error si no hay datos en cache
                contributorsGrid.innerHTML = '<p>Error loading contributors.</p>';
            }
        });
});
