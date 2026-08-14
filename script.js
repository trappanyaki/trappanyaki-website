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
    var macro    = $('#face-macro');
    var gloss    = $('#gloss');
    var shadow   = $('#tray-shadow');
    var rim      = $('#tray-rim');
    var scrim    = $('#hud-scrim');
    var layers   = $$('#plate .pl');
    var railFill = $('#rail-fill');
    var hudCh    = $('#hud-ch');
    var chapters = $$('.chapter');
    var video    = $('#take-video');
    var hero     = $('#take-hero');

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

    /* pull the macro frame down just before the push-in needs it */
    var macroArmed = false;
    var armMacro = function (p) {
      if (macroArmed || p < 0.30 || !macro || !macro.dataset.src) return;
      macroArmed = true;
      macro.src = macro.dataset.src;
    };

    var render = function (p) {
      armMacro(p);

      /* HUD is always driven, even in video mode */
      if (railFill) railFill.style.width = (p * 100).toFixed(2) + '%';
      setChapter(clamp(Math.floor(p * 4), 0, 3));

      /* CH01 hero plate dissolves into the rig by p=0.22 — a push-through,
         not a jump cut, so "ONE TAKE · NO CUTS" still holds. */
      if (hero) hero.style.opacity = (1 - easeInOut(seg(p, 0, 0.22))).toFixed(3);

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
      /* the scrim carries the copy from the moment the layers start dropping.
         Plus a hero boost: the CH01 photo is bright and busy under the copy,
         so add extra darken that fades out in step with the photo itself. */
      var heroScrim = 0.55 * (1 - easeInOut(seg(p, 0, 0.22)));
      if (scrim) {
        var baseScrim = (window.innerWidth < 820)
          ? (0.35 + 0.65 * easeInOut(seg(p, 0.34, 0.55)))
          : (0.15 + 0.85 * easeInOut(seg(p, 0.44, 0.72)));
        scrim.style.opacity = clamp(baseScrim + heroScrim, 0, 1).toFixed(3);
      }

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

      /* THE BUILD — each layer hangs apart, then drops into the tray in order.
         Staggered so rice lands first and the drizzle lands last. */
      /* narrow screens get a tighter explode so the stack stays clear of the copy */
      var ex = window.innerWidth < 820 ? 0.5 : 1;
      layers.forEach(function (el, i) {
        var from = 0.44 + i * 0.038;
        var land = easeInOut(seg(p, from, from + 0.16));
        var y  = lerp(-50 - (46 + i * 26) * ex, -50, land);   // hangs above the rim, then seats
        var z  = lerp((190 + i * 105) * ex, i * 6, land);
        var rx = lerp(-30, 0, land);
        var sc = lerp(1.16, 1, land);
        el.style.transform =
          'translate(-50%,' + y.toFixed(2) + '%) translateZ(' + z.toFixed(1) + 'px) ' +
          'rotateX(' + rx.toFixed(2) + 'deg) scale(' + sc.toFixed(3) + ')';
        /* fade in just before it starts falling, fade out under the macro push */
        el.style.opacity = (clamp((p - (from - 0.10)) / 0.10, 0, 1) * (1 - easeInOut(seg(p, 0.80, 0.94)))).toFixed(3);
      });

      /* the snap into macro on a single piece */
      var m = easeInOut(seg(p, 0.80, 0.97));
      macro.style.opacity = m.toFixed(3);
      macro.style.transform = 'scale(' + lerp(1.6, 1.02, m).toFixed(3) + ')';
    };

    if (reduced) {
      stage.classList.remove('has-video');
      render(0.78);   /* the assembled plate — every layer landed, before the macro push */
      chapters.forEach(function (c) { c.classList.add('is-live'); });
      return;
    }

    render(0);

    /* GSAP/ScrollTrigger replaces the rAF-throttled scroll listener, the
       position:sticky pin (see .take-stage in style.css), and the plain
       resize listener — ScrollTrigger recalculates start/end and re-fires
       onUpdate on resize automatically. render() itself is unchanged, so
       the sequence looks identical to the hand-rolled version. */
    gsap.registerPlugin(ScrollTrigger);

    ScrollTrigger.create({
      trigger: track,
      start: 'top top',
      end: 'bottom bottom',
      pin: stage,
      scrub: true,
      onUpdate: function (self) { render(self.progress); }
    });

    /* Hold the compositor layers only while the take is on screen. The margin
       gives the browser a screen of warning in each direction, so the hint is
       in place well before the first frame that needs it. Without an observer
       the layers stay promoted for the life of the page. */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        stage.classList.toggle('is-running', entries[0].isIntersecting);
      }, { rootMargin: '100% 0px' }).observe(track);
    } else {
      stage.classList.add('is-running');
    }
  })();

  /* ==========================================================
     3 · PLATE SHIFT
     ========================================================== */
  (function plateShift() {
    var track = $('#shift-track');
    var stage = $('#shift-stage');
    if (!track || !stage) return;

    var images   = $$('.shift-img', stage);
    var railFill = $('#shift-rail-fill');
    var labelEl  = $('#shift-label');
    if (!images.length) return;

    var last = images[0].dataset.label;

    var render = function (p) {
      var scaled = p * (images.length - 1);
      images.forEach(function (img, i) {
        img.style.opacity = easeInOut(clamp(1 - Math.abs(scaled - i), 0, 1)).toFixed(3);
      });
      if (railFill) railFill.style.width = (p * 100).toFixed(2) + '%';
      if (labelEl) {
        var nearest = images[clamp(Math.round(scaled), 0, images.length - 1)];
        if (nearest.dataset.label !== last) {
          last = nearest.dataset.label;
          labelEl.textContent = last;
        }
      }
    };

    if (reduced) { render(0); return; }

    render(0);

    gsap.registerPlugin(ScrollTrigger);

    ScrollTrigger.create({
      trigger: track,
      start: 'top top',
      end: 'bottom bottom',
      pin: stage,
      scrub: true,
      onUpdate: function (self) { render(self.progress); }
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        stage.classList.toggle('is-running', entries[0].isIntersecting);
      }, { rootMargin: '100% 0px' }).observe(track);
    } else {
      stage.classList.add('is-running');
    }
  })();

  /* ==========================================================
     4 · REVEALS
     ========================================================== */
  (function reveals() {
    var items = $$('.reveal');

    if (!('IntersectionObserver' in window) || reduced) {
      items.forEach(function (el) { el.classList.add('is-in'); });
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
  })();

  /* ==========================================================
     5 · BATCH REEL — small looping card in the ticker section
     Ambient, not a one-time reveal, so it's allowed to loop and to resume
     when scrolled back into view. Same load-on-demand and reduced-motion
     rules as the brand sting below.
     ========================================================== */
  (function batchReel() {
    var card = $('.ticker-reel');
    var video = $('#batch-loop-video');
    if (!card || !video) return;

    if (reduced) return; // poster only, via the video's poster attribute

    var armed = false;
    var arm = function () {
      if (armed) return;
      armed = true;
      $$('source', video).forEach(function (s) { s.src = s.dataset.src; });
      video.load();
    };

    if (!('IntersectionObserver' in window)) {
      arm();
      video.play().catch(function () {});
      return;
    }

    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        arm();
        video.play().catch(function () {});
      } else {
        video.pause();
      }
    }, { threshold: 0.3 }).observe(card);
  })();

  /* ==========================================================
     6 · DRIZZLE + GRIDDLE REELS — same ambient loop pattern as
     the batch reel above, one instance per card.
     ========================================================== */
  (function ambientReels() {
    if (reduced) return;

    var reels = [
      { card: $('.bd-video-wrap'), video: $('#drizzle-video') },
      { card: $('.griddle-video-wrap'), video: $('#griddle-video') }
    ];

    reels.forEach(function (reel) {
      var card = reel.card, video = reel.video;
      if (!card || !video) return;

      var armed = false;
      var arm = function () {
        if (armed) return;
        armed = true;
        $$('source', video).forEach(function (s) { s.src = s.dataset.src; });
        video.load();
      };

      if (!('IntersectionObserver' in window)) {
        arm();
        video.play().catch(function () {});
        return;
      }

      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          arm();
          video.play().catch(function () {});
        } else {
          video.pause();
        }
      }, { threshold: 0.3 }).observe(card);
    });
  })();

  /* ==========================================================
     7 · BRAND STING
     Loads nothing until the section is nearly in view, plays once, pauses if
     scrolled away mid-play. Reduced motion never arms it — the poster frame
     (logo-sting-poster.webp, set via the video's poster attribute) is the
     whole experience in that case.
     ========================================================== */
  (function sting() {
    var section = $('#sting');
    var stage = $('.sting-stage', section);
    var video = $('#sting-video');
    if (!section || !video) return;

    if (reduced) {
      if (stage) stage.classList.add('is-in');
      return;
    }

    var armed = false;
    var played = false;

    var arm = function () {
      if (armed) return;
      armed = true;
      $$('source', video).forEach(function (s) { s.src = s.dataset.src; });
      video.load();
    };

    var enter = function () {
      if (stage) stage.classList.add('is-in');
      if (played) return;
      arm();
      video.play().then(function () { played = true; }).catch(function () {});
    };

    if (!('IntersectionObserver' in window)) {
      enter();
      return;
    }

    new IntersectionObserver(function (entries) {
      var e = entries[0];
      if (e.isIntersecting) {
        enter();
      } else if (played && !video.ended) {
        video.pause();
      }
    }, { threshold: 0.4, rootMargin: '0px 0px -10% 0px' }).observe(section);
  })();

  /* ==========================================================
     8 · BATCH FIGURES
     The cap, the pickup windows and the kitchen hours are fixed facts written
     straight into the markup. Slots left is the only live one: the builder
     drives it.
     ========================================================== */
  var Ticker = (function ticker() {
    var slots   = $('#tick-slots');
    var footer  = $('#footer-status');

    var slotsLeft = 8;

    var paintFooter = function () {
      if (!footer) return;
      footer.textContent = slotsLeft > 0
        ? 'Next batch open · ' + slotsLeft + ' slot' + (slotsLeft === 1 ? '' : 's')
        : 'This batch is closed · next drop posting soon';
    };

    if (slots) slots.textContent = slotsLeft;
    paintFooter();


    return {
      setSlots: function (n) {
        slotsLeft = clamp(n, 0, 8);
        if (slots) slots.textContent = slotsLeft;
        paintFooter();
      }
    };
  })();

  /* ==========================================================
     9 · BATCH-SLOT BUILDER (hard cap: 8 plates)
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
    var statusEl = $('#batch-status');
    var copyBtn  = $('#copy-btn');
    var lockBtn  = $('#lock-btn');
    var payBtn   = $('#pay-btn');
    var msgEl    = $('#receipt-msg');
    var nameEl   = $('#cust-name');
    var phoneEl  = $('#cust-phone');
    var notesEl  = $('#cust-notes');
    var botEl    = $('#cust-botcheck');

    /* The send button's label, read before anything overwrites it. By the time
       a send resolves the button already says "Sending…", so the handler's own
       copy of the text cannot restore it. */
    var lockLabel = lockBtn ? lockBtn.textContent : '';
    /* sent, and untouched since — the next edit puts the send button back */
    var awaitingEdit = false;
    /* sent at least once, so later sends are corrections, not new orders */
    var everSent = false;

    /* Web3Forms access key. Public by design — it only permits posting to the
       inbox configured in that account's dashboard, so no address or phone
       number sits in this file. Rotate it there if it ever gets abused. */
    var FORM_KEY = 'e33f75e6-e7a8-4c6a-88f0-8e723ba62b94';
    var FORM_URL = 'https://api.web3forms.com/submit';

    /* Not a real secret — anything shipped to the browser is readable. This
       just filters out casual/automated hits on /api/notify-order so the
       text-alert endpoint isn't wide open to anyone who finds the URL. Real
       protection is the Cloudflare rate-limit rule on that path. */
    var NOTIFY_CLIENT_TOKEN = 'trap-8f2c4a1e-notify';

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

    /* Restart a CSS animation on an element that may still be mid-run from the
       last tap. Removing the class alone is not enough — the browser coalesces
       the remove and re-add into no change at all, so a fast second tap would
       go unacknowledged. Reading offsetWidth forces the reflow between them. */
    var replay = function (el, cls) {
      if (!el) return;
      el.classList.remove(cls);
      void el.offsetWidth;
      el.classList.add(cls);
    };

    /* What the receipt showed last paint, so only genuinely new lines animate. */
    var lastKeys = [];
    var lastTotal = null;

    function paint() {
      var used = totalPlates();
      var left = CAP - used;
      var full = used >= CAP;

      /* steppers respect the cap */
      state.forEach(function (s) {
        var up = $('.step-up', s.row);
        var down = $('.step-down', s.row);
        var qtyEl = $('[data-qty]', s.row);
        if (qtyEl.textContent !== String(s.qty)) {
          qtyEl.textContent = s.qty;
          replay(qtyEl, 'is-bumped');
        }
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
      if (totalEl) {
        totalEl.textContent = money(total);
        /* Skip the very first paint: nothing changed, the page just loaded. */
        if (lastTotal !== null && total !== lastTotal) replay(totalEl, 'is-bumped');
        lastTotal = total;
      }

      /* One spoken sentence for the whole change, instead of the receipt
         re-reading itself line by line. Only written when the wording actually
         differs, or assistive tech would repeat it on every repaint. */
      if (statusEl) {
        var spoken = used === 0
          ? 'Batch empty'
          : used + (used === 1 ? ' plate' : ' plates') + ' of ' + CAP +
            (full ? ', batch full' : ', ' + left + ' still open') +
            '. Total ' + money(total) + '.';
        if (statusEl.textContent !== spoken) statusEl.textContent = spoken;
      }

      /* receipt lines */
      if (linesEl) {
        var lines = summary();
        /* Key on the item, not the line. The label carries the quantity
           ("2× Chicken Plate"), so keying on it whole would make every
           increment look like a brand new line. */
        var keys = lines.map(function (l) {
          return l.split(' — ')[0].replace(/^\d+×\s*/, '');
        });
        var html = lines.length
          ? lines.map(function (l) {
              var parts = l.split(' — ');
              return '<li><span>' + parts[0] + '</span><b>' + parts[1] + '</b></li>';
            }).join('')
          : '<li class="receipt-empty">No plates yet. Start with the chicken.</li>';
        /* Rewriting identical markup still counts as a DOM change, and paint()
           runs on every stepper tap, checkbox and slot change. Only touch it
           when the receipt genuinely differs. */
        if (linesEl.innerHTML !== html) linesEl.innerHTML = html;
        /* Animate only the lines that were not on the receipt a moment ago. A
           quantity going 2 → 3 rewrites its line but should not re-enter it. */
        $$('li', linesEl).forEach(function (li, i) {
          if (keys[i] && lastKeys.indexOf(keys[i]) === -1) li.classList.add('is-new');
        });
        lastKeys = keys;
      }

      /* The pickup slot rarely changes, but this reassignment ran on every tap
         and re-announced "Tracy · 4:00 PM" each time. */
      if (slotEl) {
        var slotText = currentSlot();
        if (slotEl.textContent !== slotText) slotEl.textContent = slotText;
      }
      Ticker.setSlots(left);

      /* The batch changed after it was sent, so what the kitchen has is now
         stale. Put the send button back and say so. */
      if (awaitingEdit) { awaitingEdit = false; armResend(); }
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

    /* Name, phone and notes never reach paint(), so a corrected phone number
       after a send would otherwise leave the button hidden. */
    [nameEl, phoneEl, notesEl].forEach(function (el) {
      if (!el) return;
      el.addEventListener('input', function () {
        if (awaitingEdit) { awaitingEdit = false; armResend(); }
      });
    });

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

    /* ---- send the batch --------------------------------------------------
       The email body is built from the same summary() the receipt uses, so what
       the kitchen reads is exactly what the customer saw on screen. */
    var say = function (text, kind) {
      if (!msgEl) return;
      msgEl.textContent = text;
      msgEl.hidden = !text;
      msgEl.className = 'receipt-msg' + (kind ? ' is-' + kind : '');
    };

    /* Hand the send button back after an edit. Payment info is hidden again on
       purpose: it would otherwise sit there inviting payment for a batch the
       kitchen never received. */
    var armResend = function () {
      if (lockBtn) {
        lockBtn.hidden = false;
        lockBtn.disabled = false;
        lockBtn.textContent = 'Send Updated Batch';
      }
      if (payBtn) payBtn.hidden = true;
      say('Order changed — send it again so the kitchen gets the update.', 'warn');
    };

    var invalid = function () {
      if (totalPlates() === 0) return { el: null, why: 'Add at least one plate first.' };
      if (!nameEl.value.trim())  return { el: nameEl,  why: 'Add your name so we know who is picking up.' };
      if (!phoneEl.value.trim()) return { el: phoneEl, why: 'Add a phone number so we can confirm the batch.' };
      return null;
    };

    if (lockBtn) {
      lockBtn.addEventListener('click', function () {
        var bad = invalid();
        if (bad) {
          say(bad.why, 'warn');
          if (bad.el) { bad.el.focus(); bad.el.classList.add('is-bad'); }
          return;
        }
        [nameEl, phoneEl].forEach(function (el) { el.classList.remove('is-bad'); });

        var lines = summary();
        var body = [
          'PLATES',
          lines.join('\n'),
          '',
          'Pickup: ' + currentSlot(),
          'Total:  ' + (totalEl ? totalEl.textContent : ''),
          '',
          'Name:   ' + nameEl.value.trim(),
          'Phone:  ' + phoneEl.value.trim(),
          'Notes:  ' + (notesEl.value.trim() || '—')
        ].join('\n');

        lockBtn.disabled = true;
        lockBtn.textContent = 'Sending…';
        say('', '');

        /* Whoever gets here first owns the UI. Without this a request that
           stalls past the deadline and then answers would flip the page to
           "sent" after the customer had already been told it failed. */
        var settled = false;

        var ctl = window.AbortController ? new window.AbortController() : null;
        /* A stalled request is the dangerous case: no rejection ever arrives,
           so without a deadline the button sits on "Sending…" for good. */
        var timer = setTimeout(function () {
          if (settled) return;
          settled = true;
          if (ctl) ctl.abort();
          lockBtn.disabled = false;
          lockBtn.textContent = lockLabel;
          say('That did not send. Copy the summary below and text it to us — nothing is lost.', 'warn');
        }, 15000);

        fetch(FORM_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          signal: ctl ? ctl.signal : undefined,
          body: JSON.stringify({
            access_key: FORM_KEY,
            botcheck: botEl && botEl.checked ? true : false,
            subject: '[TRAPP ORDER] ' + nameEl.value.trim() + ' · ' + currentSlot()
                     + ' · ' + (totalEl ? totalEl.textContent : '')
                     + (everSent ? ' · UPDATED' : ''),
            from_name: 'Trappanyaki site',
            message: body
          })
        }).then(function (r) { return r.json(); }).then(function (res) {
          clearTimeout(timer);
          if (settled) return;
          /* claimed only once the send is known good, so a rejection still
             falls through to the catch below */
          if (!res || !res.success) throw new Error(res && res.message || 'rejected');
          settled = true;
          lockBtn.hidden = true;
          if (payBtn) payBtn.hidden = false;
          awaitingEdit = true;
          everSent = true;
          if (typeof fbq !== 'undefined') fbq('track', 'Lead');
          /* Best-effort text alert to the kitchen. The order already reached us
             via email above — this is a bonus nudge, so a failure here must
             never affect what the customer sees. */
          fetch('/api/notify-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Trapp-Client': NOTIFY_CLIENT_TOKEN },
            body: JSON.stringify({
              name: nameEl.value.trim(),
              slot: currentSlot(),
              total: totalEl ? totalEl.textContent : '',
              botcheck: botEl && botEl.checked ? true : false
            })
          }).catch(function () { /* no-op */ });
          say('Batch sent. We will text you to confirm — pay at pickup when you are ready.', 'ok');
        }).catch(function () {
          clearTimeout(timer);
          if (settled) return;
          settled = true;
          lockBtn.disabled = false;
          lockBtn.textContent = lockLabel;
          say('That did not send. Copy the summary below and text it to us — nothing is lost.', 'warn');
        });
      });
    }

    paint();
  })();

  /* ==========================================================
     10 · SMALL STUFF
     ========================================================== */
  (function misc() {
    var year = $('#year');
    if (year) year.textContent = new Date().getFullYear();

    /* Meta Pixel — track DM-order clicks as Leads alongside the batch builder */
    if (typeof fbq !== 'undefined') {
      $$('a[href*="ig.me/m/TRAPPANYAKI"]').forEach(function (link) {
        link.addEventListener('click', function () { fbq('track', 'Lead'); });
      });
    }

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
