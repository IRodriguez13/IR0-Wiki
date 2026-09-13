/**
 * Journal reading room — article index + Markdown render.
 */
(function () {
    'use strict';

    function base() {
        return window.IR0Edition ? window.IR0Edition.dataBase() : 'data/';
    }

    function qs(name) {
        var m = new RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
        return m ? decodeURIComponent(m[1]) : null;
    }

    function simpleMarkdown(md) {
        var rows = md.split('\n');
        var out = [];
        var tableMode = false;

        rows.forEach(function (line) {
            if (/^### /.test(line)) {
                out.push('<h3>' + line.slice(4) + '</h3>');
                return;
            }
            if (/^## /.test(line)) {
                out.push('<h2>' + line.slice(3) + '</h2>');
                return;
            }
            if (/^# /.test(line)) {
                out.push('<h1>' + line.slice(2) + '</h1>');
                return;
            }
            if (/^> /.test(line)) {
                out.push('<blockquote>' + line.slice(2) + '</blockquote>');
                return;
            }
            if (/^\|/.test(line)) {
                if (!tableMode) {
                    out.push('<table>');
                    tableMode = true;
                }
                if (!/^\|[\s\-:|]+\|$/.test(line)) {
                    var cells = line.split('|').filter(function (c, i, a) {
                        return i > 0 && i < a.length - 1;
                    });
                    out.push('<tr>' + cells.map(function (c) {
                        return '<td>' + inline(c.trim()) + '</td>';
                    }).join('') + '</tr>');
                }
                return;
            }
            if (tableMode) {
                out.push('</table>');
                tableMode = false;
            }
            if (/^> /.test(line)) {
                out.push('<blockquote>' + inline(line.slice(2)) + '</blockquote>');
                return;
            }
            if (/^```/.test(line)) return;
            if (line.trim()) {
                out.push('<p>' + inline(line) + '</p>');
            }
        });
        if (tableMode) out.push('</table>');
        return out.join('\n');
    }

    function inline(s) {
        return s
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
    }

    function renderIndex(articles) {
        var nav = document.getElementById('article-nav');
        if (!nav) return;
        var heading = window.IR0Explore && window.IR0Explore.t
            ? window.IR0Explore.t('read.articles') : 'Articles';
        nav.innerHTML = '<h4>' + heading + '</h4><ul style="list-style:none;padding:0"></ul>';
        var ul = nav.querySelector('ul');
        articles.forEach(function (a) {
            var li = document.createElement('li');
            li.style.marginBottom = '0.35rem';
            var link = document.createElement('a');
            link.href = 'read.html?article=' + encodeURIComponent(a.id);
            link.textContent = a.title;
            if (qs('article') === a.id || (!qs('article') && a.id === 'why-not-a-wiki')) {
                link.style.fontWeight = 'bold';
            }
            li.appendChild(link);
            ul.appendChild(li);
        });
    }

    function loadArticle(id) {
        return fetch(base() + 'journal/index.json')
            .then(function (r) { return r.json(); })
            .then(function (idx) {
                renderIndex(idx.articles);
                var meta = idx.articles.filter(function (a) { return a.id === id; })[0];
                if (!meta) throw new Error('unknown article: ' + id);
                document.getElementById('article-title').textContent = meta.title;
                var sub = document.getElementById('article-meta');
                if (sub) {
                    sub.textContent = (meta.repo || '') +
                        (meta.source ? ' · ' + meta.source : '');
                }
                return fetch(base() + 'journal/' + meta.file);
            })
            .then(function (r) {
                if (!r.ok) throw new Error('article file');
                return r.text();
            })
            .then(function (md) {
                document.getElementById('article-root').innerHTML = simpleMarkdown(md);
            });
    }

    document.addEventListener('DOMContentLoaded', function () {
        if (!document.getElementById('article-root')) return;
        var id = qs('article') || 'why-not-a-wiki';
        var boot = window.IR0Explore
            ? window.IR0Explore.init('misc')
            : (window.IR0Edition ? window.IR0Edition.initBar() : Promise.resolve());
        boot.then(function () {
            if (window.IR0Explore && window.IR0Explore.onLocaleChange) {
                window.IR0Explore.onLocaleChange(function () { return loadArticle(id); });
            }
            return loadArticle(id);
        })
            .catch(function (err) {
                document.getElementById('article-root').innerHTML =
                    '<p>Failed to load: ' + err + '</p>';
            });
    });

    window.IR0Read = { simpleMarkdown: simpleMarkdown };
})();
