/**
 * Explore IR0 — shared nav, i18n, theme, back button, GitHub links.
 */
(function () {
    'use strict';

    var LOCALE_KEY = 'ir0-explore-lang';
    var THEME_KEY = 'ir0-explore-theme';

    var NAV = [
        { id: 'explore', href: 'index.html', labelKey: 'nav.explore' },
        { id: 'break', href: 'break.html', labelKey: 'nav.break' },
        { id: 'misc', href: 'misc.html', labelKey: 'nav.misc' }
    ];

    var ui = null;
    var activeNav = 'explore';
    var localeHooks = [];

    function escapeHtml(s) {
        var d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    function getLocale() {
        var stored = localStorage.getItem(LOCALE_KEY);
        if (stored === 'es' || stored === 'en') return stored;
        var htmlLang = (document.documentElement.lang || 'en').slice(0, 2);
        return htmlLang === 'es' ? 'es' : 'en';
    }

    function setLocale(code) {
        localStorage.setItem(LOCALE_KEY, code);
        document.documentElement.lang = code;
    }

    function isDarkTheme() {
        return document.documentElement.classList.contains('theme-dark');
    }

    function setTheme(mode) {
        var dark = mode === 'dark';
        document.documentElement.classList.toggle('theme-dark', dark);
        localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
        updateThemeButton();
    }

    function toggleTheme() {
        setTheme(isDarkTheme() ? 'light' : 'dark');
    }

    function dataBase() {
        return window.IR0Edition ? window.IR0Edition.dataBase() : 'data/';
    }

    function localizedDataPath(path) {
        if (getLocale() === 'en') return path;
        if (/\.json$/.test(path)) return path.replace(/\.json$/, '.es.json');
        if (/\.md$/.test(path)) return path.replace(/\.md$/, '.es.md');
        return path;
    }

    function loadLocalizedJson(path) {
        var primary = dataBase() + localizedDataPath(path);
        var fallback = dataBase() + path;
        return fetch(primary).then(function (r) {
            if (r.ok) return r.json();
            if (primary === fallback) throw new Error(path);
            return fetch(fallback).then(function (r2) {
                if (!r2.ok) throw new Error(path);
                return r2.json();
            });
        });
    }

    function loadLocalizedText(path) {
        var primary = dataBase() + localizedDataPath(path);
        var fallback = dataBase() + path;
        return fetch(primary).then(function (r) {
            if (r.ok) return r.text();
            if (primary === fallback) throw new Error(path);
            return fetch(fallback).then(function (r2) {
                if (!r2.ok) throw new Error(path);
                return r2.text();
            });
        });
    }

    function fill(template, vars) {
        return String(template).replace(/\{(\w+)\}/g, function (_, key) {
            return vars[key] != null ? String(vars[key]) : '';
        });
    }

    function loadUi() {
        var loc = getLocale();
        return fetch(dataBase() + 'i18n/ui.' + loc + '.json')
            .then(function (r) {
                if (!r.ok) throw new Error('ui.' + loc);
                return r.json();
            })
            .catch(function () {
                return fetch(dataBase() + 'i18n/ui.en.json').then(function (r) { return r.json(); });
            })
            .then(function (data) {
                ui = data;
                return data;
            });
    }

    function t(key) {
        if (!ui) return key;
        var parts = key.split('.');
        var cur = ui;
        for (var i = 0; i < parts.length; i += 1) {
            if (!cur || typeof cur !== 'object') return key;
            cur = cur[parts[i]];
        }
        return typeof cur === 'string' ? cur : key;
    }

    function githubFileUrl(edition, relPath) {
        var k = edition && edition.repos && edition.repos.kernel;
        if (!k) return '#';
        if (relPath.indexOf('ISD/') === 0) {
            var i = edition.repos.isd;
            if (!i) return '#';
            return 'https://github.com/IRodriguez13/ISD/blob/' + i.commit + '/' +
                relPath.replace(/^ISD\//, '');
        }
        var sub = relPath.replace(/^IR0\//, '');
        return 'https://github.com/IRodriguez13/IR0/blob/' + k.commit + '/' + sub;
    }

    function githubDocsUrl(edition, relPath) {
        var k = edition && edition.repos && edition.repos.kernel;
        if (!k) return '#';
        var sub = relPath.replace(/^IR0\//, '');
        if (relPath.indexOf('ISD/') === 0) {
            var i = edition.repos.isd;
            sub = relPath.replace(/^ISD\//, '');
            return 'https://github.com/IRodriguez13/ISD/blob/' + i.commit + '/' + sub;
        }
        return 'https://github.com/IRodriguez13/IR0/blob/' + k.commit + '/' + sub;
    }

    function renderNav(active) {
        var ul = document.querySelector('.nav-links');
        if (!ul) return;
        ul.innerHTML = NAV.map(function (item) {
            var cls = item.id === active ? ' class="active"' : '';
            var label = t(item.labelKey);
            return '<li><a href="' + item.href + '"' + cls + '>' + escapeHtml(label) + '</a></li>';
        }).join('');
    }

    function renderBrand() {
        var title = document.querySelector('.journal-title');
        var sub = document.querySelector('.journal-sub');
        var brandTitle = t('brand.title');
        if (title && !title.querySelector('a')) {
            title.innerHTML = '<a href="index.html" style="color:inherit;text-decoration:none">' +
                escapeHtml(brandTitle) + '</a>';
        } else if (title && title.querySelector('a')) {
            title.querySelector('a').textContent = brandTitle;
        }
        if (sub && sub.dataset.i18nBrand !== '0') {
            sub.textContent = t('brand.tagline');
        }
    }

    function updateThemeButton() {
        var btn = document.getElementById('btn-theme');
        if (!btn) return;
        var dark = isDarkTheme();
        btn.textContent = dark ? '☀' : '☾';
        btn.setAttribute('aria-label', dark ? t('toolbar.theme_light') : t('toolbar.theme_dark'));
        btn.title = btn.getAttribute('aria-label');
    }

    function updateLangButton() {
        var btn = document.getElementById('btn-lang');
        if (!btn) return;
        btn.textContent = t('toolbar.lang_switch');
        btn.title = getLocale() === 'es' ? 'Switch to English' : 'Cambiar a español';
    }

    function renderToolbar() {
        var inner = document.querySelector('.masthead-inner');
        if (!inner || document.getElementById('masthead-tools')) return;

        var tools = document.createElement('div');
        tools.id = 'masthead-tools';
        tools.className = 'masthead-tools';
        tools.innerHTML =
            '<button type="button" id="btn-back" class="tool-btn" aria-label="' + escapeHtml(t('toolbar.back')) +
            '" title="' + escapeHtml(t('toolbar.back')) + '">←</button>' +
            '<button type="button" id="btn-theme" class="tool-btn" aria-label="theme">☾</button>' +
            '<button type="button" id="btn-lang" class="tool-btn tool-btn-lang">ES</button>';

        inner.appendChild(tools);

        document.getElementById('btn-back').addEventListener('click', function () {
            if (window.history.length > 1 && document.referrer &&
                document.referrer.indexOf(window.location.origin) === 0) {
                window.history.back();
            } else {
                window.location.href = 'index.html';
            }
        });

        document.getElementById('btn-theme').addEventListener('click', toggleTheme);
        document.getElementById('btn-lang').addEventListener('click', function () {
            switchLocale();
        });

        updateThemeButton();
        updateLangButton();
    }

    function applyIndexChrome() {
        var map = {
            'section-actions': 'index.section_actions',
            'aside-classic': 'index.aside_classic'
        };
        Object.keys(map).forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.textContent = t(map[id]);
        });
        var classic = document.getElementById('aside-classic');
        if (classic) {
            classic.href = getLocale() === 'es' ? '../index_es.html' : '../index.html';
        }
    }

    function renderGuideFooter() {
        var footer = document.querySelector('.footer-note');
        if (!footer) {
            footer = document.createElement('footer');
            footer.className = 'footer-note';
            document.body.appendChild(footer);
        }
        var span = footer.querySelector('.guide-foot');
        if (span) {
            span.textContent = t('banner.guide_not_spec');
            return;
        }
        if (footer.childNodes.length) {
            footer.appendChild(document.createTextNode(' · '));
        }
        span = document.createElement('span');
        span.className = 'guide-foot';
        span.textContent = t('banner.guide_not_spec');
        footer.appendChild(span);
    }

    function applyChrome() {
        renderBrand();
        renderNav(activeNav);
        renderGuideFooter();
        updateThemeButton();
        updateLangButton();
        var back = document.getElementById('btn-back');
        if (back) {
            back.setAttribute('aria-label', t('toolbar.back'));
            back.title = t('toolbar.back');
        }
        applyIndexChrome();
        if (window.IR0Edition && window.IR0Edition.refreshBar) {
            window.IR0Edition.refreshBar();
        }
    }

    function switchLocale() {
        setLocale(getLocale() === 'es' ? 'en' : 'es');
        return loadUi().then(function () {
            applyChrome();
            return Promise.all(localeHooks.map(function (fn) {
                return Promise.resolve(fn());
            }));
        });
    }

    function onLocaleChange(fn) {
        if (typeof fn === 'function') localeHooks.push(fn);
    }

    function initExplorePage(navId) {
        activeNav = navId || 'explore';
        document.documentElement.lang = getLocale();
        return loadUi().then(function () {
            renderToolbar();
            applyChrome();
            return window.IR0Edition ? window.IR0Edition.initBar() : Promise.resolve(null);
        });
    }

    window.IR0Explore = {
        init: initExplorePage,
        dataBase: dataBase,
        localizedDataPath: localizedDataPath,
        loadLocalizedJson: loadLocalizedJson,
        loadLocalizedText: loadLocalizedText,
        fill: fill,
        getLocale: getLocale,
        t: t,
        loadUi: loadUi,
        githubFile: githubFileUrl,
        githubDocs: githubDocsUrl,
        escapeHtml: escapeHtml,
        applyIndexChrome: applyIndexChrome,
        applyChrome: applyChrome,
        onLocaleChange: onLocaleChange
    };
})();
