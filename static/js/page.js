// Interactive pieces on this page: frame scrubber, method switcher, BibTeX copy button, mobile menu.
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var THUMB = 16; // px; keeps track labels under the range thumb

  function trackPos(fraction) {
    return 'calc(' + fraction + ' * (100% - ' + THUMB + 'px) + ' + THUMB / 2 + 'px)';
  }

  // ----- Frame scrubber: every .tl-stack shows frame i; autoplays while on screen -----
  document.querySelectorAll('[data-timeline]').forEach(function (root) {
    var stacks = root.querySelectorAll('.tl-stack');
    var range = root.querySelector('input[type="range"]');
    var button = root.querySelector('.tl-play');
    var n = Number(range.max) + 1;
    var interval = Number(root.dataset.interval || 1100);
    var pingpong = root.dataset.loop === 'pingpong';
    var i = 0, dir = 1, timer = null, visible = false;
    var userPaused = reduceMotion;

    root.querySelectorAll('.tl-labels span').forEach(function (s) {
      s.style.left = trackPos(Number(s.dataset.at) / (n - 1));
    });
    var band = root.querySelector('.tl-band');
    if (band) {
      var from = Math.max(0, (Number(band.dataset.from) - 0.5) / (n - 1));
      var to = Math.min(1, (Number(band.dataset.to) + 0.5) / (n - 1));
      band.style.left = trackPos(from);
      band.style.width = 'calc(' + (to - from) + ' * (100% - ' + THUMB + 'px))';
    }

    function show(k) {
      i = k;
      range.value = k;
      stacks.forEach(function (st) {
        st.querySelectorAll('img').forEach(function (img, j) { img.classList.toggle('on', j === k); });
      });
      root.querySelectorAll('.tl-labels span').forEach(function (s) {
        s.classList.toggle('hot', Number(s.dataset.at) === k && s.dataset.hot === '1');
      });
    }
    function step() {
      if (pingpong) {
        if (i + dir < 0 || i + dir >= n) dir = -dir;
        show(i + dir);
      } else {
        show((i + 1) % n);
      }
    }
    function sync() {
      var run = visible && !userPaused;
      if (run && !timer) timer = setInterval(step, interval);
      if (!run && timer) { clearInterval(timer); timer = null; }
      button.textContent = userPaused ? 'Play' : 'Pause';
      button.setAttribute('aria-label', userPaused ? 'Play the sequence' : 'Pause the sequence');
    }

    range.addEventListener('input', function () { userPaused = true; show(Number(range.value)); sync(); });
    button.addEventListener('click', function () { userPaused = !userPaused; sync(); });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting; sync();
      }, { threshold: 0.4 }).observe(root);
    }
    show(0);
    sync();
  });

  // ----- Method switcher: ground truth on the left, the chosen method on the right -----
  document.querySelectorAll('[data-compare]').forEach(function (root) {
    var pattern = root.dataset.src;          // e.g. "media/q-{method}-{stage}.webp"
    var state = { method: root.dataset.method, stage: root.dataset.stage };
    var gt = root.querySelector('[data-slot="gt"]');
    var mine = root.querySelector('[data-slot="method"]');
    var label = root.querySelector('[data-method-label]');
    var note = root.querySelector('[data-note-out]');

    // Preload every panel so switching is instant.
    root.querySelectorAll('[data-group="method"] button').forEach(function (m) {
      root.querySelectorAll('[data-group="stage"] button').forEach(function (s) {
        new Image().src = pattern.replace('{method}', m.dataset.value).replace('{stage}', s.dataset.value);
      });
    });

    function render() {
      gt.src = pattern.replace('{method}', 'gt').replace('{stage}', state.stage);
      mine.src = pattern.replace('{method}', state.method).replace('{stage}', state.stage);
      var mb = root.querySelector('[data-group="method"] button[data-value="' + state.method + '"]');
      var sb = root.querySelector('[data-group="stage"] button[data-value="' + state.stage + '"]');
      label.textContent = mb.dataset.label;
      note.textContent = mb.dataset.note;
      mine.alt = mb.dataset.label + ', ' + sb.textContent.toLowerCase();
      gt.alt = 'Ground truth, ' + sb.textContent.toLowerCase();
      root.querySelectorAll('.seg button').forEach(function (b) {
        var key = b.closest('[data-group]').dataset.group;
        b.setAttribute('aria-pressed', String(state[key] === b.dataset.value));
      });
    }
    root.querySelectorAll('.seg button').forEach(function (b) {
      b.addEventListener('click', function () {
        state[b.closest('[data-group]').dataset.group] = b.dataset.value;
        render();
      });
    });
    render();
  });

  // ----- Copy BibTeX -----
  document.querySelectorAll('.copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.parentElement.querySelector('pre').textContent;
      var done = function () {
        btn.textContent = 'Copied';
        setTimeout(function () { btn.textContent = 'Copy'; }, 1500);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () {});
    });
  });
  // ----- Navbar burger (mobile) -----
  document.querySelectorAll('.navbar-burger').forEach(function (burger) {
    burger.addEventListener('click', function () {
      burger.classList.toggle('is-active');
      document.querySelectorAll('.navbar-menu').forEach(function (m) { m.classList.toggle('is-active'); });
    });
  });
})();
