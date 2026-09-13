/**
 * Misc — chips jump to in-page lore (not a card picker).
 */
(function () {
    'use strict';

    function jump(id) {
        var el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function bindChips() {
        document.querySelectorAll('.misc-chip').forEach(function (btn) {
            btn.addEventListener('click', function () {
                jump(btn.getAttribute('data-jump'));
            });
        });
    }

    function renderLinux(md) {
        var host = document.getElementById('misc-linux-body');
        if (!host) return;
        if (window.IR0Read && window.IR0Read.simpleMarkdown) {
            host.innerHTML = window.IR0Read.simpleMarkdown(md);
        } else {
            host.textContent = md;
        }
    }

    function renderJournal(index) {
        var host = document.getElementById('misc-journal-body');
        if (!host || !index || !index.articles) return;
        var items = index.articles.map(function (a) {
            return '<li><a href="read.html?article=' + encodeURIComponent(a.id) + '">' +
                window.IR0Explore.escapeHtml(a.title) + '</a>' +
                (a.repo ? ' <span class="arch-contract-role">' +
                    window.IR0Explore.escapeHtml(a.repo) + '</span>' : '') +
                '</li>';
        }).join('');
        host.innerHTML = '<ul class="misc-journal-list">' + items + '</ul>';
    }

    document.addEventListener('DOMContentLoaded', function () {
        var chipsBound = false;

        function paintMiscChrome() {
            document.getElementById('misc-title').textContent = window.IR0Explore.t('misc.title');
            document.getElementById('misc-sub').textContent = window.IR0Explore.t('misc.subtitle');
            document.getElementById('chip-linux').textContent = window.IR0Explore.t('misc.linux');
            document.getElementById('chip-journal').textContent = window.IR0Explore.t('misc.journal');
            document.getElementById('chip-arch').textContent = window.IR0Explore.t('misc.arch');
            document.getElementById('chip-map').textContent = window.IR0Explore.t('misc.map');
            var classic = document.getElementById('chip-classic');
            classic.textContent = window.IR0Explore.t('misc.archive');
            classic.href = window.IR0Explore.getLocale() === 'es' ? '../index_es.html' : '../index.html';
            document.getElementById('misc-linux-head').textContent = window.IR0Explore.t('misc.linux');
            document.getElementById('misc-journal-head').textContent = window.IR0Explore.t('misc.journal');
            var foot = document.querySelector('.footer-note a[href="index.html"]');
            if (foot) foot.textContent = window.IR0Explore.t('index.home_link');
        }

        function loadMisc() {
            paintMiscChrome();
            return Promise.all([
                window.IR0Explore.loadLocalizedText('guides/is-it-linux.md'),
                fetch(window.IR0Explore.dataBase() + 'journal/index.json').then(function (r) { return r.json(); })
            ]).then(function (pair) {
                renderLinux(pair[0]);
                renderJournal(pair[1]);
            });
        }

        window.IR0Explore.init('misc').then(function () {
            if (!chipsBound) {
                bindChips();
                chipsBound = true;
            }
            var hash = (window.location.hash || '').replace('#', '');
            if (hash) jump(hash);
            window.IR0Explore.onLocaleChange(loadMisc);
            return loadMisc();
        });
    });
})();
