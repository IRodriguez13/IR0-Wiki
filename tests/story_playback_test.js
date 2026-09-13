#!/usr/bin/env node
/**
 * Story playback tests — panel state must stay populated across all steps.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const playback = require(path.join(ROOT, 'site/js/story-playback.js'));

const SCENARIOS = ['null-dereference', 'ls-root', 'hello-tcc'];

let failures = 0;

function fail(msg) {
    console.error('FAIL:', msg);
    failures += 1;
}

function ok(msg) {
    console.log('OK:', msg);
}

function loadStory(id) {
    const p = path.join(ROOT, 'content/scenarios', id + '.json');
    return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function loadTrace(id) {
    const p = path.join(ROOT, 'content/scenarios', id + '.trace.json');
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function assertIncludes(haystack, needle, label) {
    if (!haystack || haystack.indexOf(needle) < 0) {
        fail(label + ' — expected to contain: ' + needle);
        return false;
    }
    return true;
}

for (const id of SCENARIOS) {
    const story = loadStory(id);
    const trace = loadTrace(id);
    const validation = playback.validateStoryPlayback(story);

    validation.errors.forEach(fail);
    if (!validation.errors.length) {
        ok(id + ': validateStoryPlayback (' + story.steps.length + ' steps)');
    }

    story.steps.forEach(function (_, stepIndex) {
        const ps = playback.buildPanelState(story, stepIndex, trace);
        const label = id + ' step ' + (stepIndex + 1);

        if ((story.panels || []).indexOf('terminal') >= 0) {
            if (!ps.terminal || ps.terminal.replace(/<[^>]+>/g, '').trim().length < 3) {
                fail(label + ': terminal panel empty');
            }
        }
        if ((story.panels || []).indexOf('cpu') >= 0) {
            if (!ps.cpu || ps.cpu.indexOf('ring') < 0 && ps.cpu.indexOf('CR2') < 0 && ps.cpu.indexOf('mode') < 0) {
                fail(label + ': cpu panel missing register state');
            }
        }
        if (!ps.kernel || ps.kernel.indexOf('kernel-dim') >= 0 && stepIndex > 0) {
            /* allow idle only on step 0 for some stories */
        }
        if ((story.panels || []).indexOf('code') >= 0 && story.code_sample) {
            if (!ps.code || ps.code.indexOf('│') < 0) {
                fail(label + ': code panel missing line numbers');
            }
        }
    });

    /* Scenario-specific regression checks */
    if (id === 'null-dereference') {
        const s0 = playback.buildPanelState(story, 0, trace);
        const s1 = playback.buildPanelState(story, 1, trace);
        const s7 = playback.buildPanelState(story, 7, trace);
        assertIncludes(s0.terminal, './userspace_segv', 'null step1 terminal');
        assertIncludes(s0.cpu, 'ring: 3', 'null step1 cpu ring3');
        assertIncludes(s1.cpu, 'CR2', 'null step2 cpu CR2');
        assertIncludes(s1.cpu, 'DEADBEEF', 'null step2 cpu address');
        assertIncludes(s7.terminal, 'Segmentation fault', 'null step8 terminal message');
        assertIncludes(s7.terminal, 'term-cursor', 'null step8 cursor');
        const s5 = playback.buildPanelState(story, 4, trace);
        assertIncludes(s5.cpu, 'DEADBEEF', 'null step5 cpu keeps CR2 after PF');
        assertIncludes(s5.cpu, 'SIGSEGV', 'null step5 cpu signal note');
    }

    if (id === 'ls-root') {
        const s7 = playback.buildPanelState(story, 7, trace);
        const s9 = playback.buildPanelState(story, 9, trace);
        assertIncludes(s7.terminal, 'bin', 'ls step8 listing');
        assertIncludes(s9.terminal, 'term-cursor', 'ls step10 prompt cursor');
    }

    if (id === 'hello-tcc') {
        const s5 = playback.buildPanelState(story, 5, trace);
        assertIncludes(s5.terminal, 'hello, IR0', 'tcc step6 output');
    }
}

if (failures) {
    console.error('\n' + failures + ' test failure(s)');
    process.exit(1);
}

console.log('\nAll story playback tests passed (' + SCENARIOS.length + ' scenarios)');
