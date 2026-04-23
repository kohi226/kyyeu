// ========== CSS NOTEBOOK INTRO ==========
// Không dùng Three.js — CSS 3D transform thuần

(function () {

  /* --------------------------------------------------
     Build the notebook HTML into #notebook-intro-wrapper
  -------------------------------------------------- */
  window.initNotebookIntro = function () {
    const wrapper = document.getElementById('notebook-intro-wrapper');
    if (!wrapper) return;

    // Sprinkle stars
    for (let i = 0; i < 50; i++) {
      const s = document.createElement('div');
      s.className = 'nb-star';
      s.style.left  = Math.random() * 100 + '%';
      s.style.top   = Math.random() * 100 + '%';
      s.style.animationDelay    = (Math.random() * 3) + 's';
      s.style.animationDuration = (2 + Math.random() * 3) + 's';
      wrapper.appendChild(s);
    }

    // Inject markup
    wrapper.insertAdjacentHTML('beforeend', `
      <div class="nb-title">
        ✨ KỶ YẾU LỚP 9/9 ✨
        <span>KỶ NIỆM THANH XUÂN 2025</span>
      </div>

      <div class="nb-scene">
        <div class="nb-book" id="nb-book" onclick="window._nbOpen()">
          <div class="nb-book-back"></div>
          <div class="nb-book-spine"></div>
          <div class="nb-book-pages">
            <div class="nb-page-line" style="width:70%"></div>
            <div class="nb-page-line" style="width:90%"></div>
            <div class="nb-page-line" style="width:80%"></div>
            <div class="nb-page-line" style="width:60%"></div>
            <div class="nb-page-line" style="width:85%"></div>
            <div class="nb-page-line" style="width:75%"></div>
            <div class="nb-page-line" style="width:45%"></div>
          </div>
          <div class="nb-book-cover" id="nb-cover">
            <div class="nb-cover-border"></div>
            <div class="nb-cover-corner nb-cc-tl"></div>
            <div class="nb-cover-corner nb-cc-tr"></div>
            <div class="nb-cover-corner nb-cc-bl"></div>
            <div class="nb-cover-corner nb-cc-br"></div>
            <div class="nb-ribbon"></div>
            <div class="nb-cover-title">
              <span class="nb-cover-icon">🎓</span>
              <div class="nb-cover-main">KỶ YẾU<br>LỚP 9/9</div>
              <div class="nb-cover-year">✦ 2025 ✦</div>
            </div>
          </div>
        </div>
      </div>

      <div class="nb-ui">
        <span class="nb-hint" id="nb-hint">Nhấn để mở sổ kỷ niệm</span>
        <button class="nb-open-btn" id="nb-open-btn" onclick="window._nbOpen()">
          📖 Mở Cuốn Sổ Kỷ Niệm
        </button>
      </div>
    `);
  };

  /* --------------------------------------------------
     Open animation sequence
  -------------------------------------------------- */
  let _opened = false;

  window._nbOpen = function () {
    if (_opened) return;
    _opened = true;

    const cover  = document.getElementById('nb-cover');
    const book   = document.getElementById('nb-book');
    const btn    = document.getElementById('nb-open-btn');
    const hint   = document.getElementById('nb-hint');
    const wrapper = document.getElementById('notebook-intro-wrapper');

    // Hide UI
    if (btn)  btn.classList.add('nb-hidden');
    if (hint) hint.style.opacity = '0';

    // 1. Open cover
    if (cover) cover.classList.add('nb-open');
    if (book)  book.classList.add('nb-book-opened');

    // 2. After cover swings open → zoom + fade out wrapper
    setTimeout(function () {
      if (wrapper) wrapper.classList.add('nb-zooming');

      setTimeout(function () {
        if (wrapper) wrapper.style.display = 'none';
        showNamePrompt();
      }, 520);
    }, 900);
  };

  /* --------------------------------------------------
     After animation: show name input or go straight to main
  -------------------------------------------------- */
  function showNamePrompt() {
    const stored = localStorage.getItem('userName');
    if (stored) { revealMain(stored); return; }

    const overlay = document.getElementById('name-overlay');
    if (!overlay) { revealMain('Bạn'); return; }

    overlay.style.display = 'flex';
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        overlay.classList.add('nb-visible');
      });
    });

    document.getElementById('nb-name-form').addEventListener('submit', function (e) {
      e.preventDefault();
      const name = document.getElementById('nb-name-input').value.trim();
      if (!name) return;

      localStorage.setItem('userName', name);
      fetch('/api/save-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name })
      }).catch(function () {});

      overlay.style.opacity = '0';
      setTimeout(function () {
        overlay.style.display = 'none';
        revealMain(name);
      }, 450);
    });
  }

  function revealMain(name) {
    // Populate name fields
    var ids = ['display-name', 'message-name', 'future-name', 'comment-name', 'voice-name'];
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        if (id === 'display-name') el.textContent = name;
        else el.value = name;
      }
    });

    var main = document.getElementById('main-website');
    if (main) {
      main.style.display = 'block';
      main.style.opacity = '0';
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          main.style.opacity = '1';
        });
      });
    }

    if (typeof loadAllData === 'function') loadAllData();
  }

})();