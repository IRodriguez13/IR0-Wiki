/**
 * Story playback — cumulative panel state per step (terminal, CPU, kernel, code).
 * Testable in Node (module.exports) and browser (IR0StoryPlayback).
 */
(function (root, factory) {
    var api = factory();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    root.IR0StoryPlayback = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function defaultPlayback(story, step, stepIndex) {
        var pb = step.playback;
        if (pb) return pb;

        /* Legacy fallback — minimal; scenarios should ship explicit playback. */
        var terminal = { history: [], prompt: '# ', cursor: stepIndex === story.steps.length - 1 };
        var cpu = { ring: null, lines: [] };
        var kernel = { lines: [] };
        var code = { highlight: null };

        if (story.command && stepIndex === 0) {
            terminal.history = ['$ ' + story.command];
        }
        if (step.detail && step.detail.address) {
            cpu.lines = [
                'CR2: ' + (step.detail.address || '—'),
                'access: ' + (step.detail.access || '—'),
                'ring: ' + (step.detail.ring != null ? step.detail.ring : '—')
            ];
        }
        if (step.event === 'shell-message') {
            terminal.history = ['$ ' + (story.command || './program'), 'Segmentation fault'];
            terminal.cursor = true;
        }
        if (story.code_sample && story.code_sample.highlight_step === stepIndex) {
            code.highlight = story.code_sample.highlight_step;
        }
        return { terminal: terminal, cpu: cpu, kernel: kernel, code: code };
    }

    function findTraceEvent(trace, step, stepIndex) {
        if (!trace || !trace.events) return null;
        var byNode = trace.events.filter(function (e) { return e.node === step.node; });
        if (byNode.length === 1) return byNode[0];
        if (byNode.length > 1) return byNode[Math.min(stepIndex, byNode.length - 1)];
        return trace.events[Math.min(stepIndex, trace.events.length - 1)] || null;
    }

    function renderTerminal(pb) {
        var t = pb.terminal || {};
        var lines = t.history || [];
        var out = lines.map(function (line) { return escapeHtml(line); }).join('\n');
        if (t.cursor !== false) {
            var prompt = t.prompt != null ? t.prompt : '# ';
            out += (out ? '\n' : '') + escapeHtml(prompt) + '<span class="term-cursor">█</span>';
        }
        return out;
    }

    function mergeCpuState(story, stepIndex) {
        var merged = { lines: [] };
        for (var i = 0; i <= stepIndex; i += 1) {
            var step = story.steps[i];
            var pb = defaultPlayback(story, step, i);
            var c = pb.cpu || {};
            Object.keys(c).forEach(function (key) {
                if (key === 'lines') {
                    (c.lines || []).forEach(function (line) {
                        if (merged.lines.indexOf(line) < 0) merged.lines.push(line);
                    });
                } else if (c[key] != null && c[key] !== '') {
                    merged[key] = c[key];
                }
            });
        }
        return merged;
    }

    function renderCpu(cpu) {
        var c = cpu || {};
        var rows = [];
        if (c.mode) rows.push('mode: ' + c.mode);
        if (c.ring != null) rows.push('CPL / ring: ' + c.ring);
        if (c.rip) rows.push('RIP: ' + c.rip);
        if (c.cr2) rows.push('CR2: ' + c.cr2);
        if (c.cr3) rows.push('CR3: ' + c.cr3);
        if (c.vector != null) {
            rows.push('vector: #' + c.vector + (c.vector_name ? ' (' + c.vector_name + ')' : ''));
        }
        if (c.error_code) rows.push('error: ' + c.error_code);
        if (c.pte || c.vma) {
            rows.push('— memory —');
            if (c.pte) rows.push('PTE: ' + c.pte);
            if (c.vma) rows.push('VMA: ' + c.vma);
        }
        if (c.rax) rows.push('RAX: ' + c.rax);
        if (c.note) rows.push('', '// ' + c.note);
        (c.lines || []).forEach(function (l) { rows.push(l); });
        if (!rows.length) rows.push('(no CPU state at this step)');
        return rows.map(escapeHtml).join('\n');
    }

    function renderKernel(pb, step) {
        var k = pb.kernel || {};
        var lines = (k.lines || []).slice();
        if (k.active) lines.push('→ ' + k.active + '()');
        if (!lines.length && step.concept) {
            lines.push(step.concept);
        }
        var body = lines.map(function (line, i) {
            var cls = k.highlight === i ? ' class="kernel-highlight"' : '';
            return '<div' + cls + '>' + escapeHtml(line) + '</div>';
        }).join('');
        return body || '<div class="kernel-dim">(kernel idle)</div>';
    }

    function renderCode(story, pb) {
        if (!story.code_sample || !story.code_sample.lines) return '';
        var hl = pb.code && pb.code.highlight != null ? pb.code.highlight : -1;
        var marker = pb.code && pb.code.marker ? pb.code.marker : null;
        return story.code_sample.lines.map(function (line, i) {
            var num = String(i + 1).padStart(2, ' ');
            var content = escapeHtml(line);
            if (i === hl) {
                content = '<span class="highlight-line">' + content +
                    (marker ? '  <span class="code-marker">' + escapeHtml(marker) + '</span>' : '') +
                    '</span>';
            }
            return num + ' │ ' + content;
        }).join('\n');
    }

    function buildPanelState(story, stepIndex, trace) {
        if (!story || !story.steps || !story.steps.length) {
            throw new Error('story missing steps');
        }
        var idx = Math.max(0, Math.min(stepIndex, story.steps.length - 1));
        var step = story.steps[idx];
        var pb = defaultPlayback(story, step, idx);
        var traceEv = findTraceEvent(trace, step, idx);

        if (traceEv && pb.kernel && (!pb.kernel.lines || !pb.kernel.lines.length)) {
            pb.kernel.lines = ['TRACE|' + traceEv.seq + '|' + traceEv.kind + '|' + traceEv.detail];
        }

        var cpuMerged = mergeCpuState(story, idx);

        return {
            step: step,
            stepIndex: idx,
            terminal: renderTerminal(pb),
            cpu: renderCpu(cpuMerged),
            kernel: renderKernel(pb, step),
            code: renderCode(story, pb),
            traceEvent: traceEv,
            playback: pb,
            cpuMerged: cpuMerged
        };
    }

    function validateStoryPlayback(story) {
        var errors = [];
        var warnings = [];
        if (!story.steps || !story.steps.length) {
            errors.push(story.id + ': no steps');
            return { errors: errors, warnings: warnings };
        }
        var wantsTerminal = (story.panels || []).indexOf('terminal') >= 0;
        var wantsCpu = (story.panels || []).indexOf('cpu') >= 0;

        story.steps.forEach(function (step, i) {
            if (!step.playback) {
                warnings.push(story.id + ' step ' + step.id + ': missing playback block');
                return;
            }
            var pb = step.playback;
            if (wantsTerminal) {
                if (!pb.terminal || !pb.terminal.history || !pb.terminal.history.length) {
                    errors.push(story.id + ' step ' + step.id + ': terminal.history empty');
                }
            }
            if (wantsCpu) {
                var c = pb.cpu || {};
                var hasCpu = c.mode || c.ring != null || c.cr2 || c.rip || (c.lines && c.lines.length);
                if (!hasCpu) {
                    errors.push(story.id + ' step ' + step.id + ': cpu state empty');
                }
            }
            if (!pb.kernel || !pb.kernel.lines || !pb.kernel.lines.length) {
                warnings.push(story.id + ' step ' + step.id + ': kernel.lines empty');
            }
        });

        /* Cumulative terminal must not shrink */
        if (wantsTerminal) {
            var prevLen = 0;
            story.steps.forEach(function (step) {
                var len = (step.playback && step.playback.terminal && step.playback.terminal.history)
                    ? step.playback.terminal.history.length : 0;
                if (len < prevLen) {
                    errors.push(story.id + ' step ' + step.id + ': terminal history shrinks');
                }
                prevLen = len;
            });
        }

        return { errors: errors, warnings: warnings };
    }

    return {
        buildPanelState: buildPanelState,
        validateStoryPlayback: validateStoryPlayback,
        mergeCpuState: mergeCpuState,
        renderCpu: renderCpu,
        escapeHtml: escapeHtml
    };
});
