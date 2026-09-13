/**
 * Laboratory — step through trace events (Phase 2 / 6 prep).
 */
(function () {
    'use strict';

    var traces = {};
    var currentId = null;
    var eventIndex = 0;

    function base() {
        return window.IR0Edition ? window.IR0Edition.dataBase() : 'data/';
    }

    function loadScenario(id) {
        currentId = id;
        eventIndex = 0;
        return fetch(base() + 'scenarios/' + id + '.trace.json')
            .then(function (r) { return r.json(); })
            .then(function (data) {
                traces[id] = data;
                renderEvent();
            });
    }

    function renderEvent() {
        var pre = document.getElementById('lab-events');
        var data = traces[currentId];
        if (!pre || !data) return;

        var lines = data.events.map(function (ev, i) {
            var prefix = i === eventIndex ? '▶ ' : '  ';
            return prefix + 'TRACE|' + ev.seq + '|' + ev.node + '|' + ev.kind + '|' + ev.detail;
        });
        pre.textContent = lines.join('\n');
    }

    function initList() {
        var ul = document.getElementById('lab-scenarios');
        if (!ul) return;

        ['null-dereference', 'ls-root', 'hello-tcc'].forEach(function (id) {
            var li = document.createElement('li');
            li.textContent = id;
            li.addEventListener('click', function () {
                loadScenario(id);
            });
            ul.appendChild(li);
        });

        loadScenario('null-dereference');
    }

    document.addEventListener('DOMContentLoaded', function () {
        (window.IR0Edition ? window.IR0Edition.initBar() : Promise.resolve()).then(initList);

        document.getElementById('lab-prev').addEventListener('click', function () {
            if (eventIndex > 0) {
                eventIndex--;
                renderEvent();
            }
        });
        document.getElementById('lab-next').addEventListener('click', function () {
            var data = traces[currentId];
            if (data && eventIndex < data.events.length - 1) {
                eventIndex++;
                renderEvent();
            }
        });
    });
})();
