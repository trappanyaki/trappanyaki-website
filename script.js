/* ============================================================
   TRAPPANYAKI LLC — site behaviour
   No external dependencies. Everything degrades without JS.
   ============================================================ */
(function () {
  'use strict';

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  /* progress of p inside the segment [from,to], eased */
  var seg = function (p, from, to) { return clamp((p - from) / (to - from), 0, 1); };
  var easeInOut = function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
  var money = function (n) {
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ==========================================================
     1 · NAV
     ========================================================== */
  (function nav() {
    var bar = $('#navbar');
    var toggle = $('#mobile-toggle');
    var menu = $('#nav-menu');

    var onScroll = function () {
      bar.classList.toggle('is-stuck', window.scrollY > 40);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    if (toggle && menu) {
      toggle.addEventListener('click', function () {
        var open = menu.classList.toggle('is-open');
        toggle.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      $$('.nav-link, .nav-btn', menu).forEach(function (link) {
        link.addEventListener('click', function () {
          menu.classList.remove('is-open');
          toggle.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });
    }
  })();

  /* ==========================================================
     2 · THE TAKE — one continuous scrubbed shot, four chapters
     0.00–0.25  lift .... tray rises into frame
     0.25–0.50  release . snap-lid lets go, steam
     0.50–0.75  turn .... tray rotates, drizzle catches light
     0.75–1.00  bite .... hard push-in to macro
     ========================================================== */
  (function take() {
    var track = $('#take-track');
    var stage = $('#take-stage');
    if (!track || !stage) return;

    var rig      = $('#rig');
    var tray     = $('#tray');
    var lid      = $('#tray-lid');
    var steam    = $('#steam');
    var wide     = $('#face-wide');
    var macro    = $('#face-macro');
    var gloss    = $('#gloss');
    var shadow   = $('#tray-shadow');
    var rim      = $('#tray-rim');
    var scrim    = $('#hud-scrim');
    var railFill = $('#rail-fill');
    var hudCh    = $('#hud-ch');
    var chapters = $$('.chapter');
    var video    = $('#take-video');

    var hasVideo = false;
    if (video && video.dataset.src) {
      video.addEventListener('loadedmetadata', function () {
        if (video.duration > 0) { hasVideo = true; stage.classList.add('has-video'); }
      });
      video.addEventListener('error', function () { hasVideo = false; stage.classList.remove('has-video'); });
      video.src = video.dataset.src;
    }

    var live = -1;
    var setChapter = function (i) {
      if (i === live) return;
      live = i;
      chapters.forEach(function (c, n) { c.classList.toggle('is-live', n === i); });
      if (hudCh) hudCh.textContent = '0' + (i + 1);
    };

    var render = function (p) {
      /* HUD is always driven, even in video mode */
      if (railFill) railFill.style.width = (p * 100).toFixed(2) + '%';
      setChapter(clamp(Math.floor(p * 4), 0, 3));

      if (hasVideo && video.duration) {
        video.currentTime = clamp(p, 0, 0.999) * video.duration;
        return;
      }

      var lift    = easeInOut(seg(p, 0.00, 0.25));
      var release = easeInOut(seg(p, 0.25, 0.50));
      var turn    = easeInOut(seg(p, 0.50, 0.75));
      var bite    = easeInOut(seg(p, 0.75, 1.00));

      /* camera rig — one move, never re-framed. Pushes into the right of the
         frame so the chapter copy on the left keeps its air. */
      var camScale = lerp(1, 2.75, bite);
      var camY     = lerp(0, -8, bite);
      rig.style.transformOrigin = '66% 48%';
      rig.style.transform = 'translate3d(0,' + camY + 'vh,0) scale(' + camScale.toFixed(3) + ')';

      /* the tray itself */
      var trayY  = lerp(38, 0, lift);
      var trayS  = lerp(0.78, 1, lift);
      var rotX   = lerp(62, 52, lift) - 14 * turn - 32 * bite;
      var rotZ   = -26 * turn - 6 * bite;
      var op     = clamp(0.25 + lift * 1.5, 0, 1);
      tray.style.transform =
        'translate3d(0,' + trayY.toFixed(2) + 'vh,0) scale(' + trayS.toFixed(3) + ') ' +
        'rotateX(' + rotX.toFixed(2) + 'deg) rotateZ(' + rotZ.toFixed(2) + 'deg)';
      tray.style.opacity = op.toFixed(3);
      if (shadow) shadow.style.opacity = (0.35 + 0.5 * lift - 0.5 * bite).toFixed(3);
      if (rim) rim.style.opacity = (1 - bite * 0.9).toFixed(3);
      if (scrim) scrim.style.opacity = (0.15 + 0.85 * easeInOut(seg(p, 0.6, 0.85))).toFixed(3);

      /* lid: seated, then released up and away */
      lid.style.transform =
        'translate3d(0,' + (-46 * release).toFixed(2) + 'vh,0) ' +
        'rotateX(' + (-38 * release).toFixed(2) + 'deg) scale(' + lerp(1, 1.06, release).toFixed(3) + ')';
      lid.style.opacity = (1 - release).toFixed(3);

      /* steam breathes out of the gap, then thins */
      if (steam) steam.style.opacity = (Math.sin(release * Math.PI) * 0.9 + release * 0.15).toFixed(3);

      /* glaze catching the light as the tray turns */
      if (gloss) {
        gloss.style.transform = 'translate3d(' + lerp(-120, 120, turn).toFixed(1) + '%,0,0)';
        gloss.style.opacity = (0.25 + 0.75 * Math.sin(turn * Math.PI) + 0.3 * bite).toFixed(3);
      }

      /* the snap into macro on a single piece */
      var m = easeInOut(seg(p, 0.68, 0.96));
      macro.style.opacity = m.toFixed(3);
      macro.style.transform = 'scale(' + lerp(1.6, 1.02, m).toFixed(3) + ')';
      wide.style.opacity = (1 - m).toFixed(3);
    };

    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        ticking = false;
        var rect = track.getBoundingClientRect();
        var total = track.offsetHeight - window.innerHeight;
        var p = clamp(-rect.top / (total || 1), 0, 1);
        render(p);
      });
    };

    if (reduced) {
      stage.classList.remove('has-video');
      render(0.35);
      chapters.forEach(function (c) { c.classList.add('is-live'); });
      return;
    }

    render(0);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
  })();

  /* ==========================================================
     3 · REVEALS + BAR FILLS
     ========================================================== */
  (function reveals() {
    var items = $$('.reveal');
    var bars = $$('[data-bars]');

    if (!('IntersectionObserver' in window) || reduced) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      bars.forEach(function (el) { el.classList.add('is-filled'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });

    var barIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-filled');
        barIo.unobserve(e.target);
      });
    }, { threshold: 0.35 });
    bars.forEach(function (el) { barIo.observe(el); });
  })();

  /* ==========================================================
     4 · LIVE BATCH TICKER
     ========================================================== */
  var Ticker = (function ticker() {
    var batches = $('#tick-batches');
    var plates  = $('#tick-plates');
    var slots   = $('#tick-slots');
    var marquee = $('#marquee');
    var footer  = $('#footer-status');

    /* seeded off the clock so the numbers read plausible all day */
    var hour = new Date().getHours();
    var served = clamp(Math.round((hour - 11) * 7.5), 0, 92);
    var batchCount = clamp(Math.round(served / 8) + 1, 1, 12);
    var slotsLeft = 8;

    var bump = function (el, value) {
      if (!el) return;
      el.textContent = value;
      el.classList.add('is-bumped');
      setTimeout(function () { el.classList.remove('is-bumped'); }, 600);
    };

    var paintFooter = function () {
      if (!footer) return;
      footer.textContent = slotsLeft > 0
        ? 'Next batch open · ' + slotsLeft + ' slot' + (slotsLeft === 1 ? '' : 's')
        : 'This batch is closed · next drop posting soon';
    };

    if (batches) batches.textContent = batchCount;
    if (plates)  plates.textContent = served;
    if (slots)   slots.textContent = slotsLeft;
    paintFooter();

    if (marquee) {
      var strip =
        '<span>BLESS YA TASTE BUDS</span><span>·</span>' +
        '<span>TRACY, CALIFORNIA</span><span>·</span>' +
        '<span>8-PLATE BATCH CAP</span><span>·</span>' +
        '<span><b>CROSSED DRIZZLE</b> — CHIPOTLE-ORANGE MAYO OVER DARK SOY</span><span>·</span>' +
        '<span>PICKUP ONLY</span><span>·</span>' +
        '<span>SEARED TO ORDER ON THE FLAT-TOP</span><span>·</span>';
      marquee.innerHTML = strip + strip;
    }

    if (!reduced) {
      setInterval(function () {
        served += 1 + Math.floor(Math.random() * 2);
        bump(plates, served);
        if (Math.random() > 0.72) { batchCount += 1; bump(batches, batchCount); }
      }, 9000);
    }

    return {
      setSlots: function (n) {
        slotsLeft = clamp(n, 0, 8);
        if (slots) slots.textContent = slotsLeft;
        paintFooter();
      }
    };
  })();

  /* ==========================================================
     5 · BATCH-SLOT BUILDER (hard cap: 8 plates)
     ========================================================== */
  (function builder() {
    var list = $('#plate-list');
    if (!list) return;

    var CAP = 8;
    var rows = $$('.plate-row', list);
    var addons = $$('[data-addon]');
    var slotInputs = $$('input[name="slot"]');

    var capFill  = $('#cap-fill');
    var capBar   = capFill ? capFill.parentElement : null;
    var capUsed  = $('#cap-used');
    var capLeft  = $('#cap-left');
    var capWarn  = $('#cap-warn');
    var linesEl  = $('#receipt-lines');
    var totalEl  = $('#receipt-total');
    var slotEl   = $('#receipt-slot');
    var copyBtn  = $('#copy-btn');

    var state = rows.map(function (row) {
      return {
        row: row,
        name: $('.plate-name', row).textContent.trim(),
        price: parseFloat(row.dataset.price),
        qty: 0
      };
    });

    var totalPlates = function () {
      return state.reduce(function (n, s) { return n + s.qty; }, 0);
    };

    var currentSlot = function () {
      var picked = slotInputs.filter(function (i) { return i.checked; })[0];
      return picked ? picked.value : '';
    };

    var summary = function () {
      var lines = state.filter(function (s) { return s.qty > 0; })
        .map(function (s) { return s.qty + '× ' + s.name + ' — ' + money(s.qty * s.price); });
      addons.forEach(function (a) {
        if (a.checked) {
          lines.push('+ ' + a.parentElement.querySelector('span').textContent.trim() +
            ' — ' + money(parseFloat(a.dataset.price)));
        }
      });
      return lines;
    };

    function paint() {
      var used = totalPlates();
      var left = CAP - used;
      var full = used >= CAP;

      /* steppers respect the cap */
      state.forEach(function (s) {
        var up = $('.step-up', s.row);
        var down = $('.step-down', s.row);
        $('[data-qty]', s.row).textContent = s.qty;
        up.disabled = full;
        down.disabled = s.qty === 0;
        s.row.classList.toggle('is-picked', s.qty > 0);
      });

      if (capFill) capFill.style.width = (used / CAP * 100) + '%';
      if (capBar) capBar.classList.toggle('is-full', full);
      if (capUsed) capUsed.textContent = used;
      if (capLeft) capLeft.textContent = full ? 'batch full' : left + ' open';
      if (capWarn) capWarn.hidden = !full;

      /* live price */
      var total = state.reduce(function (n, s) { return n + s.qty * s.price; }, 0);
      addons.forEach(function (a) {
        a.parentElement.classList.toggle('is-on', a.checked);
        if (a.checked) total += parseFloat(a.dataset.price);
      });
      if (totalEl) totalEl.textContent = money(total);

      /* receipt lines */
      if (linesEl) {
        var lines = summary();
        linesEl.innerHTML = lines.length
          ? lines.map(function (l) {
              var parts = l.split(' — ');
              return '<li><span>' + parts[0] + '</span><b>' + parts[1] + '</b></li>';
            }).join('')
          : '<li class="receipt-empty">No plates yet. Start with the chicken.</li>';
      }

      if (slotEl) slotEl.textContent = currentSlot();
      Ticker.setSlots(left);
    }

    list.addEventListener('click', function (e) {
      var btn = e.target.closest('.step');
      if (!btn) return;
      var row = btn.closest('.plate-row');
      var s = state.filter(function (x) { return x.row === row; })[0];
      if (!s) return;

      if (btn.classList.contains('step-up')) {
        if (totalPlates() >= CAP) return;
        s.qty += 1;
      } else if (s.qty > 0) {
        s.qty -= 1;
      }
      paint();
    });

    addons.forEach(function (a) { a.addEventListener('change', paint); });
    slotInputs.forEach(function (i) { i.addEventListener('change', paint); });

    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var lines = summary();
        var text = 'TRAPPANYAKI — batch request\n' +
          (lines.length ? lines.join('\n') : '(no plates selected)') +
          '\nPickup: ' + currentSlot() +
          '\nTotal: ' + (totalEl ? totalEl.textContent : '$0');

        var done = function () {
          var was = copyBtn.textContent;
          copyBtn.textContent = 'Copied to clipboard';
          setTimeout(function () { copyBtn.textContent = was; }, 2200);
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, done);
        } else {
          var ta = document.createElement('textarea');
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand('copy'); } catch (err) { /* no-op */ }
          document.body.removeChild(ta);
          done();
        }
      });
    }

    paint();
  })();

  /* ==========================================================
     6 · SMALL STUFF
     ========================================================== */
  (function misc() {
    var year = $('#year');
    if (year) year.textContent = new Date().getFullYear();

    /* one FAQ panel open at a time */
    var faqs = $$('.faq-item');
    faqs.forEach(function (item) {
      item.addEventListener('toggle', function () {
        if (!item.open) return;
        faqs.forEach(function (other) { if (other !== item) other.open = false; });
      });
    });
  })();
})();
