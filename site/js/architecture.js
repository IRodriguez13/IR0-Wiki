/**
 * Architecture at a glance — vertical stack + contract flow (not a graph).
 */
(function () {
    'use strict';

    function renderStack(layers) {
        return layers.map(function (layer, index) {
            var chips = layer.items.map(function (it) {
                return '<span class="arch-chip">' + window.IR0Explore.escapeHtml(it) + '</span>';
            }).join('');
            var arrow = index < layers.length - 1
                ? '<div class="arch-stack-arrow" aria-hidden="true"><span>' +
                window.IR0Explore.t('architecture.calls_into') +
                '</span><span class="arch-arrow-glyph">↓</span></div>'
                : '';
            var role = layer.role
                ? '<p class="arch-layer-role">' + window.IR0Explore.escapeHtml(layer.role) + '</p>'
                : '';
            return '<section class="arch-stack-band" data-layer="' + window.IR0Explore.escapeHtml(layer.id) + '">' +
                '<header class="arch-stack-head"><h3>' + window.IR0Explore.escapeHtml(layer.label) + '</h3>' +
                role + '</header>' +
                '<div class="arch-stack-items">' + chips + '</div>' +
                arrow +
                '</section>';
        }).join('');
    }

    function renderContractItem(item) {
        if (typeof item === 'string') {
            return '<li>' + window.IR0Explore.escapeHtml(item) + '</li>';
        }
        return '<li><strong>' + window.IR0Explore.escapeHtml(item.name) + '</strong>' +
            ' <span class="arch-contract-role">' + window.IR0Explore.escapeHtml(item.role) + '</span></li>';
    }

    function renderContracts(contracts) {
        var steps = contracts.flow || [];
        return steps.map(function (step, index) {
            var items = (step.items || []).map(renderContractItem).join('');
            var connector = index < steps.length - 1
                ? '<div class="contract-connector"><span>' +
                window.IR0Explore.t('architecture.relies_on') +
                '</span><span class="arch-arrow-glyph">↓</span></div>'
                : '';
            return '<article class="contract-step">' +
                '<h3>' + window.IR0Explore.escapeHtml(step.label) + '</h3>' +
                (step.detail ? '<p class="contract-detail">' + window.IR0Explore.escapeHtml(step.detail) + '</p>' : '') +
                (items ? '<ul class="contract-items">' + items + '</ul>' : '') +
                connector +
                '</article>';
        }).join('');
    }

    document.addEventListener('DOMContentLoaded', function () {
        var edition = null;

        function paintArch(arch) {
            document.getElementById('arch-title').textContent = arch.title;
            document.getElementById('arch-sub').textContent = arch.subtitle;
            document.getElementById('arch-layers').innerHTML = renderStack(arch.layers);

            var stackNote = document.getElementById('arch-stack-note');
            if (stackNote) stackNote.textContent = window.IR0Explore.t('architecture.stack_note');
            var contractsHead = document.getElementById('contracts-head');
            if (contractsHead) contractsHead.textContent = window.IR0Explore.t('architecture.contracts_title');
            var deepHead = document.getElementById('deep-dive-head');
            if (deepHead) deepHead.textContent = window.IR0Explore.t('architecture.deep_dive');
            var mapLink = document.getElementById('arch-map-link');
            if (mapLink) mapLink.textContent = window.IR0Explore.t('architecture.kernel_map_link');

            var contractsEl = document.getElementById('contracts-flow');
            if (contractsEl && arch.contracts && arch.contracts.flow) {
                contractsEl.innerHTML = renderContracts(arch.contracts);
            }
            document.getElementById('contracts-note').textContent = arch.contracts.note;

            var dives = document.getElementById('arch-dives');
            dives.innerHTML = arch.deep_dive.map(function (d) {
                var url = window.IR0Explore.githubDocs(edition, d.file);
                return '<li><a href="' + url + '" target="_blank" rel="noopener noreferrer">' +
                    window.IR0Explore.escapeHtml(d.label) + '</a></li>';
            }).join('');
        }

        function loadArch() {
            return window.IR0Explore.loadLocalizedJson('architecture.json').then(paintArch);
        }

        window.IR0Explore.init('arch').then(function (data) {
            edition = data;
            window.IR0Explore.onLocaleChange(loadArch);
            return loadArch();
        });
    });
})();
