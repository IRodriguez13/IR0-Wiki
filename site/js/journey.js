/**
 * Explore IR0 — interactive journey player.
 */
(function () {
    'use strict';

    var journey = null;
    var edition = null;
    var stepIndex = 0;
    var viewMode = 'user';
    var navBound = false;

    function qs(name) {
        var m = new RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
        return m ? decodeURIComponent(m[1]) : 'press-a-key';
    }

    function loadJourney() {
        return window.IR0Explore.loadLocalizedJson('journeys/' + qs('id') + '.json')
            .then(function (j) {
                journey = j;
                applyJourneyChrome();
                renderHeader();
                renderFlow();
                renderStep();
            });
    }

    function renderFlow() {
        var flow = document.getElementById('journey-flow');
        if (!flow || !journey.steps) return;
        flow.innerHTML = '';
        journey.steps.forEach(function (step, i) {
            if (i > 0) {
                var arrow = document.createElement('div');
                arrow.className = 'flow-arrow';
                arrow.textContent = '▼';
                flow.appendChild(arrow);
            }
            var node = document.createElement('button');
            node.type = 'button';
            node.className = 'flow-node' + (i === stepIndex ? ' active' : '');
            node.dataset.index = String(i);
            node.innerHTML = '<span class="flow-label">' + window.IR0Explore.escapeHtml(step.label) + '</span>';
            node.addEventListener('click', function () {
                stepIndex = i;
                renderStep();
                renderFlow();
            });
            flow.appendChild(node);
        });
    }

    function implLink(step) {
        var impl = step.implementation;
        if (!impl || !impl.file) return '';
        var url = window.IR0Explore.githubFile(edition, impl.file);
        var label = impl.label || impl.file.split('/').pop();
        return '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' +
            window.IR0Explore.escapeHtml(window.IR0Explore.fill(
                window.IR0Explore.t('journey.see_impl'), { label: label })) + '</a>';
    }

    function diveLink(step) {
        var dd = step.deep_dive;
        if (!dd || !dd.file) return '';
        var url = window.IR0Explore.githubDocs(edition, dd.file);
        return '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' +
            window.IR0Explore.escapeHtml(window.IR0Explore.fill(
                window.IR0Explore.t('journey.deep_dive_link'), {
                    label: dd.label || 'documentation'
                })) + '</a>';
    }

    function renderStep() {
        var step = journey.steps[stepIndex];
        var detail = document.getElementById('journey-detail');
        if (!detail || !step) return;

        detail.innerHTML =
            '<h2>' + window.IR0Explore.escapeHtml(step.label) + '</h2>' +
            '<h3 class="detail-kicker">' + window.IR0Explore.t('journey.what_ir0_does') + '</h3>' +
            '<p>' + window.IR0Explore.escapeHtml(step.what_ir0_does) + '</p>' +
            '<h3 class="detail-kicker">' + window.IR0Explore.t('journey.why_matters') + '</h3>' +
            '<p>' + window.IR0Explore.escapeHtml(step.why_it_matters) + '</p>' +
            '<div class="journey-links">' + implLink(step) + ' · ' + diveLink(step) +
            (step.node ? ' · <a href="atlas.html?node=' + encodeURIComponent(step.node) + '">' +
                window.IR0Explore.escapeHtml(window.IR0Explore.t('journey.on_map')) + '</a>' : '') +
            '</div>';
        renderDiagram();
        updateMapLink(step);

        var counter = document.getElementById('step-counter');
        if (counter) counter.textContent = (stepIndex + 1) + ' / ' + journey.steps.length;

        var dual = document.getElementById('dual-view-panel');
        if (dual && journey.has_dual_view && journey.dual_view) {
            dual.hidden = false;
            var text = viewMode === 'user' ? journey.dual_view.user : journey.dual_view.kernel;
            var pre = dual.querySelector('pre');
            if (pre) pre.textContent = text;
            else dual.textContent = text;
        } else if (dual) {
            dual.hidden = true;
        }
    }

    function updateMapLink(step) {
        var mapLink = document.getElementById('journey-map-link');
        if (!mapLink) return;
        if (step && step.node) {
            mapLink.href = 'atlas.html?node=' + encodeURIComponent(step.node);
            mapLink.textContent = window.IR0Explore.t('journey.on_map');
            mapLink.hidden = false;
        } else {
            mapLink.hidden = true;
        }
    }

    function renderDiagram() {
        var host = document.getElementById('journey-diagram');
        if (!host) return;
        if (journey.diagram !== 'fork') {
            host.hidden = true;
            host.innerHTML = '';
            return;
        }
        var step = journey.steps[stepIndex] || {};
        var phase = step.diagram_phase || 'parent';
        host.hidden = false;
        host.setAttribute('data-phase', phase);
        host.innerHTML =
            '<div class="fork-row">' +
            '<div class="fork-proc fork-parent">' +
            window.IR0Explore.escapeHtml(window.IR0Explore.t('journey.fork_parent')) + '</div>' +
            '<div class="fork-arrow" aria-hidden="true">' +
            window.IR0Explore.escapeHtml(window.IR0Explore.t('journey.fork_arrow')) + '</div>' +
            '<div class="fork-proc fork-child">' +
            window.IR0Explore.escapeHtml(window.IR0Explore.t('journey.fork_child')) + '</div>' +
            '</div>' +
            '<p class="fork-caption">' + window.IR0Explore.escapeHtml(step.label || '') + '</p>';
    }

    var dualBound = false;

    function setupDualToggle() {
        var toggle = document.getElementById('dual-toggle');
        if (!toggle || !journey.has_dual_view) return;
        if (dualBound) {
            toggle.hidden = false;
            return;
        }
        dualBound = true;
        toggle.hidden = false;
        toggle.querySelectorAll('button').forEach(function (btn) {
            btn.addEventListener('click', function () {
                viewMode = btn.dataset.view;
                toggle.querySelectorAll('button').forEach(function (b) {
                    b.classList.toggle('active', b === btn);
                });
                renderStep();
            });
        });
    }

    function setupNav() {
        if (navBound) return;
        navBound = true;
        var prev = document.getElementById('btn-prev');
        var next = document.getElementById('btn-next');
        if (prev) prev.addEventListener('click', function () {
            if (stepIndex > 0) { stepIndex--; renderStep(); renderFlow(); }
        });
        if (next) next.addEventListener('click', function () {
            if (stepIndex < journey.steps.length - 1) { stepIndex++; renderStep(); renderFlow(); }
        });
    }

    function renderHeader() {
        document.title = 'Explore IR0 — ' + journey.title;
        var h1 = document.getElementById('journey-title');
        var sub = document.getElementById('journey-subtitle');
        var see = document.getElementById('journey-see');
        var why = document.getElementById('journey-why');
        if (h1) h1.textContent = journey.title;
        if (sub) sub.textContent = journey.subtitle;
        if (see) see.textContent = journey.what_you_see;
        if (why) why.textContent = journey.why_it_matters;

        var storyLink = document.getElementById('journey-story-link');
        var replayWrap = document.getElementById('journey-replay');
        if (storyLink && journey.story_id) {
            storyLink.href = 'story.html?id=' + encodeURIComponent(journey.story_id);
            storyLink.textContent = window.IR0Explore.t('journey.replay_trace');
            storyLink.hidden = false;
            if (replayWrap) replayWrap.hidden = false;
        } else {
            if (storyLink) storyLink.hidden = true;
            if (replayWrap) replayWrap.hidden = true;
        }

        var archLink = document.getElementById('journey-arch-link');
        if (archLink) {
            archLink.textContent = window.IR0Explore.t('journey.architecture');
            archLink.hidden = false;
        }
    }

    function applyJourneyChrome() {
        var kickers = document.querySelectorAll('[data-i18n-journey]');
        kickers.forEach(function (el) {
            el.textContent = window.IR0Explore.t(el.getAttribute('data-i18n-journey'));
        });
        var prev = document.getElementById('btn-prev');
        var next = document.getElementById('btn-next');
        if (prev) prev.textContent = window.IR0Explore.t('journey.prev');
        if (next) next.textContent = window.IR0Explore.t('journey.next');
        var footer = document.querySelector('.footer-note a');
        if (footer) footer.textContent = window.IR0Explore.t('journey.all_journeys');
    }

    document.addEventListener('DOMContentLoaded', function () {
        window.IR0Explore.init('explore').then(function (data) {
            edition = data;
            window.IR0Explore.onLocaleChange(loadJourney);
            return loadJourney();
        }).then(function () {
            setupDualToggle();
            setupNav();
        }).catch(function (err) {
            var main = document.querySelector('main');
            if (main) {
                main.innerHTML = '<p>' + window.IR0Explore.escapeHtml(
                    window.IR0Explore.fill(window.IR0Explore.t('journey.not_found'), { id: qs('id') })
                ) + '</p>';
            }
            console.error(err);
        });
    });
})();
