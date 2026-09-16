/**
 * Apply saved theme before first paint (avoid flash).
 * Light mouse-wheel lerp (trackpad / reduced-motion keep native scroll).
 * Keep ease high so the page does not skate after the wheel stops.
 */
(function () {
    'use strict';
    var key = 'ir0-explore-theme';
    var saved = localStorage.getItem(key);
    var dark = saved === 'dark' ||
        (!saved && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) {
        document.documentElement.classList.add('theme-dark');
    }
    var lang = localStorage.getItem('ir0-explore-lang');
    if (lang) {
        document.documentElement.lang = lang;
    }

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    /* Higher = closer to native. 0.42 still lagged after the wheel stopped. */
    var ease = 0.58;
    var current = window.scrollY || 0;
    var target = current;
    var running = false;
    var nestedSel = '.atlas-wrap, .panel-body, .atlas-path-strip';

    function clamp(y) {
        var max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        return Math.max(0, Math.min(max, y));
    }

    function nestedTakesWheel(el, dy) {
        var node = el;
        while (node && node !== document.body && node !== document.documentElement) {
            if (node.nodeType === 1 && node.matches && node.matches(nestedSel)) {
                var top = node.scrollTop;
                var max = node.scrollHeight - node.clientHeight;
                if (max > 0 && ((dy < 0 && top > 0) || (dy > 0 && top < max - 1))) {
                    return true;
                }
            }
            node = node.parentElement;
        }
        return false;
    }

    function isMouseWheel(e) {
        if (e.deltaMode === 1 || e.deltaMode === 2) return true;
        var dy = e.deltaY;
        return Math.abs(dy) >= 40 && dy === Math.round(dy);
    }

    function tick() {
        current += (target - current) * ease;
        if (Math.abs(target - current) < 1) {
            current = target;
            running = false;
        } else {
            requestAnimationFrame(tick);
        }
        window.scrollTo(0, current);
    }

    window.addEventListener('wheel', function (e) {
        if (e.ctrlKey || e.defaultPrevented) return;
        if (!isMouseWheel(e) || nestedTakesWheel(e.target, e.deltaY)) return;
        e.preventDefault();
        var delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
        target = clamp(target + delta);
        var maxLag = Math.max(120, window.innerHeight * 0.4);
        if (target > current + maxLag) {
            target = current + maxLag;
        } else if (target < current - maxLag) {
            target = current - maxLag;
        }
        if (!running) {
            running = true;
            requestAnimationFrame(tick);
        }
    }, { passive: false });

    window.addEventListener('scroll', function () {
        if (running) return;
        current = window.scrollY;
        target = current;
    }, { passive: true });
})();
