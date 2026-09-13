/**
 * Explore IR0 — homepage action grid.
 */
(function () {
    'use strict';

    var edition = null;

    function paintCoverLine() {
        var line = document.getElementById('cover-edition-line');
        if (!line || !edition) return;
        var fill = window.IR0Explore.fill;
        line.textContent = fill(window.IR0Explore.t('edition.cover'), {
            edition: edition.edition,
            kernel: edition.repos.kernel.commit
        });
    }

    function paintHome(actions) {
        document.querySelector('.cover-hero h1').textContent = actions.title;
        document.querySelector('.cover-hero .tagline').textContent = actions.tagline;
        paintCoverLine();

        var grid = document.getElementById('action-grid');
        grid.innerHTML = actions.actions.map(function (a) {
            var href = a.page || ('journey.html?id=' + encodeURIComponent(a.journey));
            return '<article class="action-card">' +
                '<h3><a href="' + href + '">' + window.IR0Explore.escapeHtml(a.label) + '</a></h3>' +
                '<p>' + window.IR0Explore.escapeHtml(a.summary) + '</p>' +
                '<a class="btn" href="' + href + '">' + window.IR0Explore.escapeHtml(a.verb) + ' →</a>' +
                '</article>';
        }).join('');
    }

    function loadHome() {
        return window.IR0Explore.loadLocalizedJson('explore/actions.json').then(paintHome);
    }

    document.addEventListener('DOMContentLoaded', function () {
        window.IR0Explore.init('explore').then(function (data) {
            edition = data;
            window.IR0Explore.onLocaleChange(loadHome);
            return loadHome();
        });
    });
})();
