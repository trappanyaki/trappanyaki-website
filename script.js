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
     2 · PLATE SHIFT
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
     3 · REVEALS
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
     4 · BATCH REEL — small looping card in the ticker section
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
     5 · DRIZZLE + GRIDDLE REELS — same ambient loop pattern as
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
     6 · BRAND STING
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
     7 · BATCH FIGURES
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
     8 · BATCH-SLOT BUILDER (hard cap: 8 plates)
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
     9 · SHATTER MARK — logo breaks into cube fragments, reforms
     0.00–0.40  shatter .... logo breaks apart, cubes fly outward tumbling
     0.40–0.60  scattered ... held at max scatter
     0.60–1.00  reform ...... cubes fly back, snap into the sharp logo
     ========================================================== */
  (function shatterMark() {
    var track = $('#shatter-track');
    var stage = $('#shatter-stage');
    var rig   = $('#shatter-rig');
    var grid  = $('#shatter-grid');
    if (!track || !stage || !rig || !grid) return;

    /* Reduced motion never builds the cube grid — the flat #shatter-fallback
       <img> already in the DOM is the whole experience, same convention as
       module 7 (BRAND STING): reduced motion never arms the animated path. */
    if (reduced) return;

    var mobile = window.innerWidth < 820;
    var cols = mobile ? 6 : 8;
    var rows = mobile ? 4 : 5;

    var hash = function (i, salt) {
      var x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
      return x - Math.floor(x);
    };

    /* ---- build the grid ---- */
    var frag = document.createDocumentFragment();
    var faces = ['front', 'back', 'right', 'left', 'top', 'bottom'];
    var els = [];
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var cubeEl = document.createElement('div');
        cubeEl.className = 'cube';
        for (var f = 0; f < faces.length; f++) {
          var faceEl = document.createElement('div');
          faceEl.className = 'cube-face cube-face--' + faces[f];
          if (faces[f] === 'front') {
            faceEl.style.backgroundPosition =
              (c / (cols - 1) * 100).toFixed(3) + '% ' + (r / (rows - 1) * 100).toFixed(3) + '%';
          }
          cubeEl.appendChild(faceEl);
        }
        frag.appendChild(cubeEl);
        els.push(cubeEl);
      }
    }
    grid.appendChild(frag);

    grid.style.setProperty('--cols', String(cols));
    grid.style.setProperty('--rows', String(rows));
    var cubeSize = grid.getBoundingClientRect().width / cols;
    grid.style.setProperty('--cube-d', (cubeSize / 2).toFixed(2) + 'px');

    /* ---- per-cube deterministic explosion data, computed once ---- */
    var spreadScale = mobile ? 0.55 : 1;
    var rotScale = mobile ? 0.65 : 1;
    var spread = cubeSize * 3.0 * spreadScale;
    var depth  = cubeSize * 3.6 * spreadScale;
    var rotXY  = 480 * rotScale;
    var rotZ   = 260 * rotScale;

    var cubes = els.map(function (el, i) {
      var c = i % cols, r = Math.floor(i / cols);
      var dirX = (c / (cols - 1) - 0.5) * 2;
      var dirY = (r / (rows - 1) - 0.5) * 2;
      return {
        el: el,
        dx: dirX * spread * 0.65 + (hash(i, 1) - 0.5) * spread,
        dy: dirY * spread * 0.65 + (hash(i, 2) - 0.5) * spread,
        dz: (hash(i, 3) - 0.5) * 2 * depth,
        rx: (hash(i, 4) - 0.5) * 2 * rotXY,
        ry: (hash(i, 5) - 0.5) * 2 * rotXY,
        rz: (hash(i, 6) - 0.5) * 2 * rotZ,
        scalePeak: 0.72 + 0.18 * hash(i, 11),
        /* jittering the window EDGES (not the progress value) guarantees every
           cube is still exactly at rest (s=0) at p=0 and p=1, because seg()
           clamps outside its window regardless of jitter */
        outStart: 0.03 * hash(i, 7),
        outEnd:   0.38 + 0.06 * hash(i, 8),
        inStart:  0.58 + 0.06 * hash(i, 9),
        inEnd:    0.97 + 0.03 * hash(i, 10)
      };
    });

    var render = function (p) {
      for (var i = 0; i < cubes.length; i++) {
        var cube = cubes[i];
        var outPhase = easeInOut(seg(p, cube.outStart, cube.outEnd));
        var inPhase  = easeInOut(seg(p, cube.inStart,  cube.inEnd));
        var s = outPhase * (1 - inPhase);
        var dx = cube.dx * s, dy = cube.dy * s, dz = cube.dz * s;
        var rx = cube.rx * s, ry = cube.ry * s, rz = cube.rz * s;
        var sc = lerp(1, cube.scalePeak, s);
        cube.el.style.transform =
          'translate3d(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px,' + dz.toFixed(1) + 'px) ' +
          'rotateX(' + rx.toFixed(1) + 'deg) rotateY(' + ry.toFixed(1) + 'deg) rotateZ(' + rz.toFixed(1) + 'deg) ' +
          'scale(' + sc.toFixed(3) + ')';
      }
      var globalOut = easeInOut(seg(p, 0.00, 0.40));
      var globalIn  = easeInOut(seg(p, 0.60, 1.00));
      var globalS   = globalOut * (1 - globalIn);
      rig.style.transform = 'scale(' + lerp(1, 1.10, globalS).toFixed(3) + ')';
    };

    stage.classList.add('has-cubes');   /* reveal rig, hide fallback (CSS-driven) */
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
