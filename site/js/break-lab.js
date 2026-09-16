/**
 * Break IR0 — guess first, then reveal the sequence one step at a time.
 */
(function () {
    'use strict';

    var lab = null;
    var current = null;
    var stepIndex = 0;
    var revealed = 0;
    var hookSolved = false;

    function tr(key, fallback) {
        return window.IR0Explore && window.IR0Explore.t ? window.IR0Explore.t(key) : fallback;
    }

    function renderThemes() {
        var wrap = document.getElementById('break-themes');
        wrap.innerHTML = '';
        lab.scenarios.forEach(function (s) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'break-theme' + (current && current.id === s.id ? ' active' : '');
            btn.textContent = s.title;
            btn.addEventListener('click', function () { selectScenario(s.id); });
            wrap.appendChild(btn);
        });
    }

    function renderHook() {
        var el = document.getElementById('break-hook');
        var stage = document.getElementById('break-play');
        if (!current || !current.hook || hookSolved) {
            el.hidden = true;
            el.innerHTML = '';
            if (stage) stage.hidden = false;
            return;
        }
        if (stage) stage.hidden = true;
        el.hidden = false;
        var opts = current.hook.options.map(function (opt, i) {
            return '<button type="button" class="break-choice" data-i="' + i + '">' +
                window.IR0Explore.escapeHtml(opt.text) + '</button>';
        }).join('');
        el.innerHTML =
            '<p class="break-hook-prompt">' + window.IR0Explore.escapeHtml(current.hook.prompt) + '</p>' +
            '<div class="break-choices">' + opts + '</div>' +
            '<p class="section-note" id="break-hook-msg" hidden></p>';
        el.querySelectorAll('.break-choice').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var opt = current.hook.options[Number(btn.getAttribute('data-i'))];
                var msg = document.getElementById('break-hook-msg');
                if (opt.correct) {
                    hookSolved = true;
                    msg.hidden = false;
                    msg.textContent = tr('break.correct', 'Yes — now walk the rest.');
                    el.querySelectorAll('.break-choice').forEach(function (b) { b.disabled = true; });
                    window.setTimeout(function () {
                        renderHook();
                        renderSequence();
                        renderDetail();
                    }, 450);
                } else {
                    btn.disabled = true;
                    msg.hidden = false;
                    msg.textContent = tr('break.wrong', 'Not that. Try another.');
                }
            });
        });
    }

    function renderSequence() {
        var seq = document.getElementById('break-sequence');
        if (!seq) return;
        seq.innerHTML = '';
        if (!current || !current.sequence || !hookSolved) return;
        current.sequence.forEach(function (step, i) {
            if (i > 0) {
                var arrow = document.createElement('div');
                arrow.className = 'flow-arrow';
                arrow.textContent = '▼';
                seq.appendChild(arrow);
            }
            var locked = i > revealed;
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'break-step' + (i === stepIndex ? ' active' : '') + (locked ? ' is-locked' : '');
            btn.disabled = locked;
            btn.innerHTML = '<span class="break-step-kicker">' +
                window.IR0Explore.escapeHtml(String(i + 1)) + ' / ' +
                window.IR0Explore.escapeHtml(String(current.sequence.length)) +
                '</span>' +
                window.IR0Explore.escapeHtml(locked ? tr('break.locked', 'Not yet') : step.label);
            if (!locked) {
                btn.addEventListener('click', function () {
                    stepIndex = i;
                    renderSequence();
                    renderDetail();
                });
            }
            seq.appendChild(btn);
        });
        document.getElementById('break-counter').textContent =
            (stepIndex + 1) + ' / ' + current.sequence.length;
    }

    function renderDetail() {
        var el = document.getElementById('break-detail');
        if (!el) return;
        if (!current || !hookSolved || !current.sequence || !current.sequence[stepIndex]) {
            el.innerHTML = '';
            return;
        }
        var step = current.sequence[stepIndex];
        var photo = '';
        if (step.image) {
            photo = '<img class="step-photo" src="' + window.IR0Explore.dataBase() + step.image +
                '" alt="' + window.IR0Explore.escapeHtml(step.image_alt || step.label) +
                '" loading="lazy">';
        }
        el.innerHTML =
            '<h2 style="margin-top:0">' + window.IR0Explore.escapeHtml(step.label) + '</h2>' +
            photo +
            '<h3 class="detail-kicker">' + window.IR0Explore.escapeHtml(tr('break.step_user', 'You see')) + '</h3>' +
            '<p>' + window.IR0Explore.escapeHtml(step.user) + '</p>' +
            '<h3 class="detail-kicker">' + window.IR0Explore.escapeHtml(tr('break.step_kernel', 'IR0 does')) + '</h3>' +
            '<p>' + window.IR0Explore.escapeHtml(step.kernel) + '</p>';
    }

    function selectScenario(id) {
        current = lab.scenarios.find(function (s) { return s.id === id; });
        stepIndex = 0;
        revealed = 0;
        hookSolved = !current.hook;
        document.getElementById('break-cmd').textContent = current.command || '';
        var story = document.getElementById('break-story');
        if (current.story_id) {
            story.href = 'story.html?id=' + encodeURIComponent(current.story_id);
            story.textContent = tr('break.replay', 'Replay a real trace →');
            story.hidden = false;
        } else {
            story.hidden = true;
        }
        renderThemes();
        renderHook();
        renderSequence();
        renderDetail();
    }

    document.addEventListener('DOMContentLoaded', function () {
        function paintBreakChrome() {
            if (!lab) return;
            document.getElementById('break-heading').textContent = lab.title;
            document.getElementById('break-sub').textContent = lab.subtitle;
            document.getElementById('break-pick-label').textContent = tr('break.pick', 'Cause a failure');
            document.getElementById('break-seq-label').textContent = tr('break.sequence', 'What the machine does');
            var prev = document.getElementById('break-prev');
            var next = document.getElementById('break-next');
            if (prev) prev.textContent = tr('journey.prev', '◀ prev');
            if (next) next.textContent = tr('journey.next', 'next ▶');
            var foot = document.querySelector('.footer-note a[href="index.html"]');
            if (foot) foot.textContent = tr('index.home_link', '← Explore');
        }

        function loadLab() {
            return window.IR0Explore.loadLocalizedJson('failure-lab.json').then(function (data) {
                var keepId = current ? current.id : data.scenarios[0].id;
                var keep = { hookSolved: hookSolved, stepIndex: stepIndex, revealed: revealed };
                lab = data;
                paintBreakChrome();
                current = lab.scenarios.find(function (s) { return s.id === keepId; }) || lab.scenarios[0];
                hookSolved = keep.hookSolved || !current.hook;
                stepIndex = keep.stepIndex;
                revealed = keep.revealed;
                document.getElementById('break-cmd').textContent = current.command || '';
                var story = document.getElementById('break-story');
                if (current.story_id) {
                    story.href = 'story.html?id=' + encodeURIComponent(current.story_id);
                    story.textContent = tr('break.replay', 'Replay a real trace →');
                    story.hidden = false;
                } else {
                    story.hidden = true;
                }
                renderThemes();
                renderHook();
                renderSequence();
                renderDetail();
            });
        }

        window.IR0Explore.init('break').then(function () {
            window.IR0Explore.onLocaleChange(loadLab);
            return loadLab();
        }).then(function () {
            document.getElementById('break-prev').addEventListener('click', function () {
                if (!current || !hookSolved) return;
                stepIndex = Math.max(0, stepIndex - 1);
                renderSequence();
                renderDetail();
            });
            document.getElementById('break-next').addEventListener('click', function () {
                if (!current || !hookSolved) return;
                var next = Math.min(current.sequence.length - 1, stepIndex + 1);
                if (next > revealed) revealed = next;
                stepIndex = next;
                renderSequence();
                renderDetail();
            });
        });
    });
})();
