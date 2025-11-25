document.addEventListener('DOMContentLoaded', () => {
    const contributorsGrid = document.getElementById('contributors-grid');
    if (!contributorsGrid) return;

    fetch('https://ir0-loc.onrender.com/api/contributors')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            // The API returns { contributors: [...] }
            const contributors = data.contributors || [];

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
        })
        .catch(error => {
            console.error('Error loading contributors:', error);
            contributorsGrid.innerHTML = '<p>Error loading contributors.</p>';
        });
});
