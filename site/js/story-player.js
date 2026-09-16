/**
 * Story player — replays scenario steps with cumulative terminal / CPU / kernel panels.
 */
(function () {
    'use strict';

    var state = {
        story: null,
        trace: null,
        map: null,
        stepIndex: 0,
        playing: false,
        timer: null
    };

    var PANEL_FOR_NODE = {
        'userspace.program': 'code',
        'userspace.shell': 'terminal',
        'userspace.tcc': 'terminal',
        'arch.page_fault': 'cpu',
        'kernel.mm.page_fault': 'cpu',
        'kernel.process.fork': 'kernel',
        'kernel.process.exec': 'kernel',
        'kernel.process.exit': 'kernel',
        'kernel.process.wait': 'kernel',
        'kernel.signals': 'kernel',
        'kernel.vfs.lookup': 'kernel',
        'kernel.vfs.readdir': 'kernel',
        'kernel.fs.minix': 'kernel',
        'kernel.tty.write': 'terminal',
        'boundary.syscall_enter': 'cpu',
        'boundary.syscall_exit': 'kernel'
    };

    function qs(name) {
        var m = new RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
        return m ? decodeURIComponent(m[1]) : 'null-dereference';
    }

    function loadJson(path) {
        return fetch(path).then(function (r) {
            if (!r.ok) throw new Error(path);
            return r.json();
        });
    }

    function escapeHtml(s) {
        var d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    function renderTimeline(story, activeNode) {
        var el = document.getElementById('story-timeline');
        if (!el) return;
        el.innerHTML = '';
        (story.timeline || []).forEach(function (nodeId, i) {
            if (i > 0) {
                var arr = document.createElement('span');
                arr.className = 'arrow';
                arr.textContent = '→';
                el.appendChild(arr);
            }
            var span = document.createElement('span');
            span.className = 'step-node' + (nodeId === activeNode ? ' active' : '');
            span.textContent = nodeId.split('.').pop();
            span.title = nodeId;
            el.appendChild(span);
        });
    }

    function renderPanels(panelState, story, step) {
        var hot = PANEL_FOR_NODE[step.node] || 'kernel';
        var panels = ['code', 'cpu', 'kernel', 'terminal'];

        panels.forEach(function (name) {
            var panel = document.getElementById('panel-' + name);
            if (!panel) return;

            var body = panel.querySelector('.panel-body');
            var inStory = !story.panels || story.panels.indexOf(name) >= 0;
            var content = panelState[name] || '';

            if (name === 'kernel') {
                body.innerHTML = content;
            } else {
                body.innerHTML = content;
            }

            var alwaysBright = name === 'terminal' || name === 'cpu';
            panel.classList.toggle('active-panel', inStory && (alwaysBright || name === hot));
            panel.classList.toggle('panel-dim', inStory && !alwaysBright && name !== hot);
            panel.classList.toggle('panel-hidden', !inStory);

            if (body && (name === 'terminal' || name === 'kernel' || name === 'cpu')) {
                requestAnimationFrame(function () {
                    body.scrollTop = body.scrollHeight;
                });
            }
        });
    }

    function renderStep(step) {
        var story = state.story;
        if (!story || !step) return;

        var panelState = window.IR0StoryPlayback.buildPanelState(
            story, state.stepIndex, state.trace
        );

        renderTimeline(story, step.node);
        renderPanels({
            code: panelState.code,
            cpu: panelState.cpu,
            kernel: panelState.kernel,
            terminal: panelState.terminal
        }, story, step);

        var detail = document.getElementById('step-detail');
        if (detail) {
            detail.innerHTML =
                '<h3>Step ' + step.id + ': ' + escapeHtml(step.event) + '</h3>' +
                '<p class="concept">' + escapeHtml(step.concept) + '</p>' +
                '<dl>' +
                '<dt>Node</dt><dd><code>' + escapeHtml(step.node) + '</code></dd>' +
                '<dt>Function</dt><dd><code>' + escapeHtml(step.function || '—') + '</code></dd>' +
                '<dt>File</dt><dd><code>' + escapeHtml(step.file || '—') + '</code></dd>' +
                '</dl>';
        }

        var traceEl = document.getElementById('trace-line');
        if (traceEl) {
            var ev = panelState.traceEvent;
            traceEl.textContent = ev ?
                'TRACE|' + ev.seq + '|' + ev.kind + '|' + ev.detail :
                '(curated playback — see kernel panel for serial tags)';
        }

        var slider = document.getElementById('step-slider');
        if (slider) slider.value = state.stepIndex;

        var counter = document.getElementById('step-counter');
        if (counter) {
            counter.textContent = (state.stepIndex + 1) + ' / ' + story.steps.length;
        }

        if (window.IR0Atlas && window.IR0Atlas.highlightNode) {
            window.IR0Atlas.highlightNode(step.node);
        }
    }

    function goStep(index) {
        if (!state.story) return;
        state.stepIndex = Math.max(0, Math.min(index, state.story.steps.length - 1));
        renderStep(state.story.steps[state.stepIndex]);
    }

    function play() {
        if (state.playing) return;
        state.playing = true;
        var btn = document.getElementById('btn-play');
        if (btn) btn.textContent = window.IR0Explore ? window.IR0Explore.t('story.pause') : '⏸ pause';
        state.timer = setInterval(function () {
            if (state.stepIndex >= state.story.steps.length - 1) {
                pause();
                return;
            }
            goStep(state.stepIndex + 1);
        }, 1600);
    }

    function pause() {
        state.playing = false;
        if (state.timer) clearInterval(state.timer);
        var btn = document.getElementById('btn-play');
        if (btn) btn.textContent = window.IR0Explore ? window.IR0Explore.t('story.play') : '▶ play';
    }

    function renderCompare(story) {
        var box = document.getElementById('compare-box');
        if (!box || !story.compare) return;
        box.innerHTML =
            '<h4>' + escapeHtml(story.compare.title) + '</h4>' +
            '<div><strong>Userspace</strong><p>' + escapeHtml(story.compare.userspace) + '</p></div>' +
            '<div><strong>Kernel</strong><p>' + escapeHtml(story.compare.kernel) + '</p></div>';
    }

    function paintTraceNote() {
        var captured = (state.trace && state.trace.edition) ||
            (state.story && state.story.edition) || '';
        var guide = (window.IR0Edition && window.IR0Edition.get &&
            window.IR0Edition.get() && window.IR0Edition.get().edition) || '';
        var note = document.getElementById('story-trace-edition');
        if (!note) return;
        if (!captured || !window.IR0Explore) {
            note.hidden = true;
            return;
        }
        note.hidden = false;
        var line = window.IR0Explore.fill(window.IR0Explore.t('story.trace_edition'), {
            captured: captured,
            guide: guide || '?'
        });
        if (guide && captured !== guide) {
            line += ' — ' + window.IR0Explore.t('story.trace_stale');
        }
        note.textContent = line;
    }

    function applyStoryChrome() {
        if (!window.IR0Explore) return;
        var prev = document.getElementById('btn-prev');
        var next = document.getElementById('btn-next');
        var play = document.getElementById('btn-play');
        if (prev) prev.textContent = window.IR0Explore.t('story.prev');
        if (next) next.textContent = window.IR0Explore.t('story.next');
        if (play && !state.playing) play.textContent = window.IR0Explore.t('story.play');
        var pathHead = document.getElementById('story-path-head');
        if (pathHead) pathHead.textContent = window.IR0Explore.t('story.path_map');
        var other = document.getElementById('story-other-label');
        if (other) other.textContent = window.IR0Explore.t('story.other_stories');
        var jLink = document.getElementById('story-journey-link');
        if (jLink && state.story && state.story.journey_id) {
            jLink.textContent = window.IR0Explore.t('story.back_to_journey');
        }
        var foot = document.querySelector('.footer-note a[href="index.html"]');
        if (foot) foot.textContent = window.IR0Explore.t('index.home_link');
        paintTraceNote();
    }

    function initControls() {
        document.getElementById('btn-prev').addEventListener('click', function () {
            pause();
            goStep(state.stepIndex - 1);
        });
        document.getElementById('btn-next').addEventListener('click', function () {
            pause();
            goStep(state.stepIndex + 1);
        });
        document.getElementById('btn-play').addEventListener('click', function () {
            if (state.playing) pause(); else play();
        });
        document.getElementById('step-slider').addEventListener('input', function (e) {
            pause();
            goStep(parseInt(e.target.value, 10));
        });
    }

    function init() {
        var id = qs('id');
        var base = window.IR0Edition ? window.IR0Edition.dataBase() : 'data/';

        Promise.all([
            loadJson(base + 'scenarios/' + id + '.json'),
            loadJson(base + 'scenarios/' + id + '.trace.json').catch(function () { return null; }),
            loadJson(base + 'atlas/map.json').catch(function () { return null; })
        ]).then(function (results) {
            state.story = results[0];
            state.trace = results[1];
            state.map = results[2];

            document.getElementById('story-title').textContent = state.story.title;
            document.getElementById('story-subtitle').textContent = state.story.subtitle;
            document.getElementById('story-cmd').textContent = state.story.command;
            paintTraceNote();
            var jWrap = document.getElementById('story-journey-wrap');
            var jLink = document.getElementById('story-journey-link');
            if (jWrap && jLink && state.story.journey_id) {
                jLink.href = 'journey.html?id=' + encodeURIComponent(state.story.journey_id);
                jLink.textContent = window.IR0Explore
                    ? window.IR0Explore.t('story.back_to_journey')
                    : '← Back to the journey';
                jWrap.hidden = false;
            } else if (jWrap) {
                jWrap.hidden = true;
            }

            var slider = document.getElementById('step-slider');
            slider.max = state.story.steps.length - 1;
            slider.value = 0;

            applyStoryChrome();
            renderCompare(state.story);
            initControls();
            goStep(0);

            if (window.IR0Atlas && state.map) {
                window.IR0Atlas.initMini('atlas-mini', state.map, state.story.timeline);
            }
        }).catch(function (err) {
            document.body.insertAdjacentHTML('beforeend',
                '<p style="padding:2rem;color:red">Failed to load story: ' + escapeHtml(String(err)) + '</p>');
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        if (document.getElementById('story-player')) {
            var boot = window.IR0Explore
                ? window.IR0Explore.init('explore').then(function () {
                    window.IR0Explore.onLocaleChange(applyStoryChrome);
                    init();
                })
                : (window.IR0Edition ? window.IR0Edition.initBar() : Promise.resolve()).then(init);
            boot.catch(function (err) { console.error(err); });
        }
    });

    window.IR0Story = { goStep: goStep, getState: function () { return state; } };
})();
