/**
 * Edition metadata loader and version selector (Phase 5).
 */
(function () {
    'use strict';

    var editionData = null;

    function dataBase() {
        return 'data/';
    }

    function loadEdition() {
        return fetch(dataBase() + 'edition.json')
            .then(function (r) {
                if (!r.ok) throw new Error('edition.json');
                return r.json();
            })
            .then(function (data) {
                editionData = data;
                return data;
            });
    }

    function formatEditionBar(data) {
        var k = data.repos.kernel;
        var i = data.repos.isd;
        var t = window.IR0Explore && window.IR0Explore.t;
        var fill = window.IR0Explore && window.IR0Explore.fill;
        if (t && fill) {
            return fill(t('edition.bar'), {
                edition: data.edition,
                kernel: k.commit,
                isd: i.commit,
                generated: data.generated
            });
        }
        return 'Edition ' + data.edition + ' · kernel ' + k.commit + ' · ISD ' + i.commit + ' · generated ' + data.generated;
    }

    function refreshBar() {
        if (!editionData) return;
        var text = document.getElementById('edition-text');
        if (text) text.textContent = formatEditionBar(editionData);
    }

    function initEditionBar() {
        var bar = document.getElementById('edition-bar');
        var select = document.getElementById('edition-select');
        if (!bar) return loadEdition();

        return loadEdition().then(function (data) {
            var text = document.getElementById('edition-text');
            if (text) text.textContent = formatEditionBar(data);
            if (select) {
                select.hidden = true;
                if (select.parentElement && select.parentElement.tagName === 'LABEL') {
                    select.parentElement.hidden = true;
                }
            }
            return data;
        });
    }

    function renderTodayList(data) {
        var ul = document.getElementById('today-list');
        if (!ul || !data.today) return;
        ul.innerHTML = '';
        data.today.items.forEach(function (item) {
            var li = document.createElement('li');
            li.textContent = item;
            ul.appendChild(li);
        });
    }

    function renderFeaturedStories(data) {
        var grid = document.getElementById('featured-stories');
        if (!grid) return;

        var titles = {
            'null-dereference': 'NULL dereference → SIGSEGV',
            'ls-root': 'Running ls /',
            'hello-tcc': 'Compile hello.c with TCC'
        };

        grid.innerHTML = '';
        (data.featured_stories || []).forEach(function (id) {
            fetch(dataBase() + 'scenarios/' + id + '.json')
                .then(function (r) { return r.json(); })
                .then(function (story) {
                    var card = document.createElement('article');
                    card.className = 'story-card';
                    card.innerHTML =
                        '<h3>' + escapeHtml(story.title) + '</h3>' +
                        '<p>' + escapeHtml(story.subtitle) + '</p>' +
                        '<code>' + escapeHtml(story.command) + '</code><br><br>' +
                        '<a class="btn" href="story.html?id=' + encodeURIComponent(id) + '">Play story →</a>';
                    grid.appendChild(card);
                })
                .catch(function () {
                    var card = document.createElement('article');
                    card.className = 'story-card';
                    card.innerHTML = '<h3>' + escapeHtml(titles[id] || id) + '</h3>' +
                        '<a class="btn" href="story.html?id=' + encodeURIComponent(id) + '">Play story →</a>';
                    grid.appendChild(card);
                });
        });
    }

    function escapeHtml(s) {
        var d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    window.IR0Edition = {
        load: loadEdition,
        initBar: initEditionBar,
        refreshBar: refreshBar,
        formatBar: formatEditionBar,
        renderToday: renderTodayList,
        renderFeatured: renderFeaturedStories,
        get: function () { return editionData; },
        dataBase: dataBase
    };
})();
