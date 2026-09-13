/**
 * Atlas map — layer catalog + story path strip (no force-directed graph).
 */
(function () {
    'use strict';

    var activeNodeId = null;

    function escapeHtml(s) {
        if (window.IR0Explore && window.IR0Explore.escapeHtml) {
            return window.IR0Explore.escapeHtml(s);
        }
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function tr(key) {
        return window.IR0Explore && window.IR0Explore.t ? window.IR0Explore.t(key) : key;
    }

    function nodeById(map, id) {
        return map.nodes.filter(function (n) { return n.id === id; })[0];
    }

    function sortedLayers(map) {
        return map.layers.slice().sort(function (a, b) {
            return (a.order || 0) - (b.order || 0);
        });
    }

    function layerNodes(map, layerId) {
        return map.nodes.filter(function (n) { return n.layer === layerId; });
    }

    function bindNodeClicks(container, map, rerender) {
        container.querySelectorAll('[data-node]').forEach(function (el) {
            el.addEventListener('click', function () {
                var id = el.getAttribute('data-node');
                activeNodeId = id;
                showNodeDetail(id, map);
                rerender();
            });
        });
    }

    function renderCatalog(containerId, map, options) {
        options = options || {};
        var el = document.getElementById(containerId);
        if (!el || !map) return;

        var filterLayer = options.layerFilter || null;
        var highlightPath = options.highlightPath || [];
        var html = '<div class="atlas-catalog">';

        sortedLayers(map).forEach(function (layer) {
            if (filterLayer && layer.id !== filterLayer) return;
            var nodes = layerNodes(map, layer.id);
            if (!nodes.length) return;

            html += '<section class="atlas-layer-band" data-layer="' + escapeHtml(layer.id) + '">';
            html += '<header class="atlas-layer-head"><h3>' + escapeHtml(layer.label) + '</h3>';
            html += '<span class="atlas-layer-count">' + nodes.length + ' ' +
                escapeHtml(tr('atlas.nodes')) + '</span></header>';
            html += '<div class="atlas-node-grid">';

            nodes.forEach(function (n) {
                var active = n.id === activeNodeId || highlightPath.indexOf(n.id) >= 0;
                html += '<button type="button" class="atlas-node-card' + (active ? ' active' : '') +
                    '" data-node="' + escapeHtml(n.id) + '">';
                html += '<span class="atlas-node-label">' + escapeHtml(n.label) + '</span>';
                html += '<span class="atlas-node-id">' + escapeHtml(n.id) + '</span>';
                html += '</button>';
            });

            html += '</div></section>';
        });

        html += '</div>';
        el.innerHTML = html;

        bindNodeClicks(el, map, function () {
            renderCatalog(containerId, map, options);
        });
    }

    function renderPathStrip(containerId, map, path) {
        var el = document.getElementById(containerId);
        if (!el || !map || !path || !path.length) {
            if (el) el.innerHTML = '<p class="atlas-path-empty">' +
                escapeHtml(tr('atlas.no_path')) + '</p>';
            return;
        }

        var html = '<div class="atlas-path-strip" aria-label="Story path through kernel map">';
        path.forEach(function (nodeId, index) {
            var n = nodeById(map, nodeId);
            if (!n) return;
            if (index > 0) {
                html += '<span class="atlas-path-arrow" aria-hidden="true">→</span>';
            }
            var active = nodeId === activeNodeId;
            html += '<button type="button" class="atlas-path-node' + (active ? ' active' : '') +
                '" data-node="' + escapeHtml(nodeId) + '" title="' + escapeHtml(n.id) + '">' +
                escapeHtml(n.label) + '</button>';
        });
        html += '</div>';
        el.innerHTML = html;

        bindNodeClicks(el, map, function () {
            renderPathStrip(containerId, map, path);
        });
    }

    function edgeLabels(map, ids) {
        return ids.map(function (id) {
            var n = nodeById(map, id);
            return n ? n.label : id;
        });
    }

    function showNodeDetail(nodeId, map) {
        var sidebar = document.getElementById('atlas-detail');
        if (!sidebar) return;
        var n = nodeById(map, nodeId);
        if (!n) return;

        var stories = (n.stories || []).map(function (s) {
            return '<a href="story.html?id=' + encodeURIComponent(s) + '">' + escapeHtml(s) + '</a>';
        }).join(', ');

        var syms = (n.symbols || []).map(function (s) {
            return '<code>' + escapeHtml(s.name) + '</code> (' + escapeHtml(s.path) + ')';
        }).join('<br>');

        var incoming = map.edges.filter(function (e) { return e.to === nodeId; }).map(function (e) {
            return e.from;
        });
        var outgoing = map.edges.filter(function (e) { return e.from === nodeId; }).map(function (e) {
            return e.to;
        });

        var relHtml = '';
        if (incoming.length || outgoing.length) {
            relHtml = '<div class="atlas-relations">';
            if (incoming.length) {
                relHtml += '<p><strong>' + escapeHtml(tr('atlas.from')) + '</strong> ' +
                    edgeLabels(map, incoming).map(escapeHtml).join(' · ') + '</p>';
            }
            if (outgoing.length) {
                relHtml += '<p><strong>' + escapeHtml(tr('atlas.to')) + '</strong> ' +
                    edgeLabels(map, outgoing).map(escapeHtml).join(' · ') + '</p>';
            }
            relHtml += '</div>';
        }

        sidebar.innerHTML =
            '<h3>' + escapeHtml(n.label) + '</h3>' +
            '<p class="atlas-node-meta"><code>' + escapeHtml(n.id) + '</code></p>' +
            '<p style="margin:0.75rem 0">' + escapeHtml(n.summary) + '</p>' +
            relHtml +
            (stories ? '<p><strong>' + escapeHtml(tr('atlas.stories')) + '</strong> ' + stories + '</p>' : '') +
            (syms ? '<p><strong>' + escapeHtml(tr('atlas.symbols')) + '</strong><br>' + syms + '</p>' : '');
    }

    function highlightNode(nodeId) {
        activeNodeId = nodeId;
    }

    function initFull(containerId) {
        var base = window.IR0Edition ? window.IR0Edition.dataBase() : 'data/';
        fetch(base + 'atlas/map.json')
            .then(function (r) { return r.json(); })
            .then(function (map) {
                var tabs = document.getElementById('layer-tabs');
                var currentFilter = null;

                function rerender() {
                    renderCatalog(containerId, map, { layerFilter: currentFilter });
                }

                if (tabs) {
                    tabs.innerHTML = '<button type="button" class="active" data-layer="">' +
                        escapeHtml(tr('atlas.all_layers')) + '</button>';
                    sortedLayers(map).forEach(function (layer) {
                        var btn = document.createElement('button');
                        btn.type = 'button';
                        btn.textContent = layer.label;
                        btn.setAttribute('data-layer', layer.id);
                        tabs.appendChild(btn);
                    });
                    tabs.addEventListener('click', function (e) {
                        if (e.target.tagName !== 'BUTTON') return;
                        tabs.querySelectorAll('button').forEach(function (b) {
                            b.classList.toggle('active', b === e.target);
                        });
                        currentFilter = e.target.getAttribute('data-layer') || null;
                        rerender();
                    });
                }

                rerender();
                window._atlasMap = map;
                window._atlasContainer = containerId;
                window._atlasRenderMode = 'catalog';

                var q = /[?&]node=([^&]*)/.exec(window.location.search);
                if (q) {
                    var want = decodeURIComponent(q[1]);
                    if (nodeById(map, want)) {
                        activeNodeId = want;
                        showNodeDetail(want, map);
                        rerender();
                    }
                }
            });
    }

    function initMini(containerId, map, path) {
        renderPathStrip(containerId, map, path || []);
    }

    window.IR0Atlas = {
        initFull: initFull,
        initMini: initMini,
        highlightNode: function (nodeId) {
            activeNodeId = nodeId;
            if (window._atlasMap && window._atlasContainer) {
                if (window._atlasRenderMode === 'catalog') {
                    renderCatalog(window._atlasContainer, window._atlasMap, {});
                }
            }
            var mini = document.getElementById('atlas-mini');
            if (mini && window.IR0Story) {
                var st = window.IR0Story.getState();
                if (st && st.story && st.map) {
                    renderPathStrip('atlas-mini', st.map, st.story.timeline);
                }
            }
        }
    };

    function applyAtlasChrome() {
        var title = document.getElementById('atlas-title');
        var sub = document.getElementById('atlas-subtitle');
        var intro = document.getElementById('atlas-intro');
        var detail = document.getElementById('atlas-detail-placeholder');
        if (title) title.textContent = tr('atlas.title');
        if (sub) sub.textContent = tr('atlas.subtitle');
        if (intro) {
            intro.innerHTML = escapeHtml(tr('atlas.intro_prefix')) + ' ' +
                '<a href="index.html">' + escapeHtml(tr('atlas.intro_link')) + '</a> ' +
                escapeHtml(tr('atlas.intro_suffix'));
        }
        if (detail) detail.textContent = tr('atlas.select_node');
    }

    document.addEventListener('DOMContentLoaded', function () {
        if (!document.getElementById('atlas-canvas')) return;
        var boot = window.IR0Explore
            ? window.IR0Explore.init('map').then(function () {
                applyAtlasChrome();
                initFull('atlas-canvas');
                window.IR0Explore.onLocaleChange(function () {
                    applyAtlasChrome();
                    if (window._atlasMap && window._atlasContainer) {
                        renderCatalog(window._atlasContainer, window._atlasMap, {});
                    }
                    var foot = document.querySelector('.footer-note a[href="index.html"]');
                    if (foot) foot.textContent = tr('index.home_link');
                });
            })
            : (window.IR0Edition ? window.IR0Edition.initBar() : Promise.resolve())
                .then(function () { initFull('atlas-canvas'); });
        boot.catch(function (err) { console.error(err); });
    });
})();
