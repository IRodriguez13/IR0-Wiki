/**
 * IR0 through time — milestone timeline.
 */
(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', function () {
        window.IR0Explore.init('timeline').then(function () {
            return fetch(window.IR0Explore.dataBase() + 'timeline.json').then(function (r) { return r.json(); });
        }).then(function (data) {
            document.getElementById('timeline-title').textContent = data.title;
            document.getElementById('timeline-sub').textContent = data.subtitle;
            var track = document.getElementById('timeline-track');
            track.innerHTML = '';
            data.milestones.forEach(function (m, i) {
                if (i > 0) {
                    var conn = document.createElement('div');
                    conn.className = 'timeline-connector';
                    conn.textContent = '↓';
                    track.appendChild(conn);
                }
                var card = document.createElement('article');
                card.className = 'timeline-milestone';
                var imgHtml = '';
                if (m.image) {
                    imgHtml = '<img src="' + window.IR0Explore.dataBase() + m.image + '" alt="' +
                        window.IR0Explore.escapeHtml(m.label) + '" loading="lazy">';
                } else if (m.image_note) {
                    imgHtml = '<div class="timeline-placeholder">' + window.IR0Explore.escapeHtml(m.image_note) + '</div>';
                }
                var req = (m.required || []).map(function (r) {
                    return '<li>' + window.IR0Explore.escapeHtml(r) + '</li>';
                }).join('');
                card.innerHTML =
                    '<h3>' + window.IR0Explore.escapeHtml(m.label) + '</h3>' +
                    imgHtml +
                    '<p>' + window.IR0Explore.escapeHtml(m.summary) + '</p>' +
                    (req ? '<ul class="milestone-req">' + req + '</ul>' : '');
                track.appendChild(card);
            });
        });
    });
})();
