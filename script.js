document.addEventListener('DOMContentLoaded', () => {
  const TOTAL_TILES = 12;

  // DOM elements
  const gridContainer = document.getElementById('puzzle-grid');
  const frameContainer = document.getElementById('frame-container');
  const frameOverlayImg = document.getElementById('frame-overlay-img');
  const completionBanner = document.getElementById('completion-banner');
  const btnPlayAgain = document.getElementById('btn-play-again');
  const bannerCloseBtn = document.getElementById('banner-close-btn');
  const bannerBackdrop = document.getElementById('banner-backdrop');
  const confettiCanvas = document.getElementById('confetti-canvas');

  // Loading Screen Logic
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    setTimeout(() => {
      loadingScreen.classList.add('hidden');
    }, 2000);
  }
  // Device-only mode detection
  function detectDeviceMode() {
    return (window.innerWidth <= 768 || window.innerHeight > window.innerWidth) ? 'mob' : 'pc';
  }

  let currentMode = detectDeviceMode();
  let audioCtx = null;
  let soundEnabled = true;
  let cards = [];

  // PC files: 4 columns x 3 rows (Carnavale Razzmatazz)
  const pcFiles = [
    'image PC/Carnavale_Razzmatazz_01_row1_col1.png',
    'image PC/Carnavale_Razzmatazz_02_row1_col2.png',
    'image PC/Carnavale_Razzmatazz_03_row1_col3.png',
    'image PC/Carnavale_Razzmatazz_04_row1_col4.png',
    'image PC/Carnavale_Razzmatazz_05_row2_col1.png',
    'image PC/Carnavale_Razzmatazz_06_row2_col2.png',
    'image PC/Carnavale_Razzmatazz_07_row2_col3.png',
    'image PC/Carnavale_Razzmatazz_08_row2_col4.png',
    'image PC/Carnavale_Razzmatazz_09_row3_col1.png',
    'image PC/Carnavale_Razzmatazz_10_row3_col2.png',
    'image PC/Carnavale_Razzmatazz_11_row3_col3.png',
    'image PC/Carnavale_Razzmatazz_12_row3_col4.png'
  ];

  // Mobile files: 3 columns x 4 rows
  const mobFiles = Array.from({ length: TOTAL_TILES }, (_, i) => {
    const num = String(i + 1).padStart(2, '0');
    return `images/theme-reveal-3x4_${num}.png`;
  });

  // Audio system using Web Audio API
  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playFlipSound(isRevealing) {
    if (!soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      const now = audioCtx.currentTime;
      if (isRevealing) {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(640, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
        osc.start(now);
        osc.stop(now + 0.14);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(260, now + 0.1);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
        osc.start(now);
        osc.stop(now + 0.12);
      }
    } catch (e) {}
  }

  function playVictorySound() {
    if (!soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;

      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        const startTime = audioCtx.currentTime + idx * 0.08;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.24, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

        osc.start(startTime);
        osc.stop(startTime + 0.36);
      });
    } catch (e) {}
  }

  // Setup View based on device mode
  function applyDeviceMode(mode) {
    currentMode = mode;

    if (mode === 'pc') {
      frameContainer.classList.remove('mob-mode');
      frameContainer.classList.add('pc-mode');
      frameOverlayImg.src = 'Elements/Border_pc.png';
    } else {
      frameContainer.classList.remove('pc-mode');
      frameContainer.classList.add('mob-mode');
      frameOverlayImg.src = 'Elements/Border_mob.png';
    }

    buildBoard();
  }

  // Build the puzzle cards with completely blank pink backs
  function buildBoard() {
    gridContainer.innerHTML = '';
    cards = [];
    completionBanner.classList.remove('show');

    const imageList = currentMode === 'pc' ? pcFiles : mobFiles;

    imageList.forEach((src, index) => {
      const card = document.createElement('div');
      card.className = 'puzzle-card';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `Tile ${index + 1}`);
      card.dataset.index = index;

      const inner = document.createElement('div');
      inner.className = 'card-inner';

      // Back (Pink face with logo)
      const back = document.createElement('div');
      back.className = 'card-face card-back';
      const logo = document.createElement('img');
      logo.src = 'Elements/dhwani logo png og.png';
      logo.alt = 'Dhwani Logo';
      logo.className = 'card-back-logo';
      back.appendChild(logo);

      // Front (real image face)
      const front = document.createElement('div');
      front.className = 'card-face card-front';
      const img = document.createElement('img');
      img.src = src;
      img.alt = `Theme slice ${index + 1}`;
      img.draggable = false;
      img.loading = 'eager';

      front.appendChild(img);
      inner.appendChild(back);
      inner.appendChild(front);
      card.appendChild(inner);

      card.addEventListener('click', () => handleCardClick(card));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick(card);
        }
      });

      gridContainer.appendChild(card);
      cards.push(card);
    });
  }

  function handleCardClick(card) {
    const isFlipped = card.classList.contains('is-flipped');

    if (isFlipped) {
      card.classList.remove('is-flipped');
      playFlipSound(false);
    } else {
      card.classList.add('is-flipped');
      playFlipSound(true);
    }

    checkCompletion();
  }

  function checkCompletion() {
    const flippedCards = cards.filter(c => c.classList.contains('is-flipped'));

    if (flippedCards.length === TOTAL_TILES) {
      playVictorySound();
      fireConfetti();

      setTimeout(() => {
        completionBanner.classList.add('show');
      }, 650);
    } else {
      completionBanner.classList.remove('show');
    }
  }

  // Play Again: reset board with smooth cascading flip back
  btnPlayAgain.addEventListener('click', () => {
    completionBanner.classList.remove('show');
    const flipped = cards.filter(c => c.classList.contains('is-flipped'));

    if (flipped.length > 0) {
      flipped.forEach((card, i) => {
        setTimeout(() => {
          card.classList.remove('is-flipped');
          playFlipSound(false);
        }, i * 30);
      });
    }
  });

  bannerCloseBtn.addEventListener('click', () => {
    completionBanner.classList.remove('show');
  });

  // Confetti Particle Engine
  function fireConfetti() {
    const ctx = confettiCanvas.getContext('2d');
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#ff2b85', '#ffd700', '#ffffff', '#02CAEF', '#ff6dae', '#10b981', '#ff9800'];

    for (let i = 0; i < 110; i++) {
      particles.push({
        x: window.innerWidth / 2,
        y: window.innerHeight * 0.45,
        vx: (Math.random() - 0.5) * 18,
        vy: (Math.random() - 0.7) * 20,
        size: Math.random() * 9 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vr: (Math.random() - 0.5) * 12,
        alpha: 1,
        decay: Math.random() * 0.014 + 0.008
      });
    }

    let animationFrame;
    function render() {
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      let alive = false;

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.38;
        p.rotation += p.vr;
        p.alpha -= p.decay;

        if (p.alpha > 0) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        }
      });

      if (alive) {
        animationFrame = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        cancelAnimationFrame(animationFrame);
      }
    }

    render();
  }

  // Automatic Device Orientation & Resize handling
  window.addEventListener('resize', () => {
    if (confettiCanvas) {
      confettiCanvas.width = window.innerWidth;
      confettiCanvas.height = window.innerHeight;
    }

    const newMode = detectDeviceMode();
    if (newMode !== currentMode) {
      applyDeviceMode(newMode);
    }
  });

  // Initial load
  applyDeviceMode(currentMode);
});
