/* ==========================================================================
   Galli Cafe & Restro - Luxury Soundscapes, Preloader & Cursor Trails
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // --- 1. Preloader Screen Animation ---
  const preloader = document.getElementById('preloader');
  const preloaderBar = document.getElementById('preloader-bar');
  const enterBtn = document.getElementById('enter-btn');


  if (preloaderBar) {
    // Start progress loading line
    setTimeout(() => {
      preloaderBar.style.width = '100%';
    }, 100);
  }

  // Once loading line finishes, fade in the Enter button
  setTimeout(() => {
    if (enterBtn) {
      enterBtn.classList.remove('pointer-events-none', 'opacity-0');
      enterBtn.classList.add('opacity-100');
    }
  }, 2200);

  // Enter button click: initializes sound context, plays intro sound, and dismisses preloader
  if (enterBtn) {
    enterBtn.addEventListener('click', () => {
      initAudioContext();
      playWaterDrop(250, 1100, 0.12, 0.25);
      if (preloader) {
        preloader.classList.add('loaded');
      }
    });
  }


  // --- 2. Custom Gold & Black Mouse Cursor ---
  const customCursor = document.getElementById('custom-cursor');

  // Track and align custom cursor directly (no lag) to match native pace and muscle memory
  window.addEventListener('mousemove', (e) => {
    if (customCursor && window.innerWidth >= 1024) {
      customCursor.style.left = `${e.clientX}px`;
      customCursor.style.top = `${e.clientY}px`;
    }
  });

  // Hide cursor on screen sizes under 1024px
  if (window.innerWidth < 1024 && customCursor) {
    customCursor.style.display = 'none';
  }

  // Hover triggers to expand gold dot cursor
  const interactiveElements = document.querySelectorAll('a, button, select, input, textarea, .sound-trigger');
  interactiveElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
      if (customCursor) customCursor.classList.add('hovering');
    });
    el.addEventListener('mouseleave', () => {
      if (customCursor) customCursor.classList.remove('hovering');
    });
  });


  // --- 3. Web Audio API Drop Synthesizer ---
  let audioCtx = null;
  let flameNoiseBuffer = null;
  let isMuted = localStorage.getItem('galli-sound-muted') === 'true';

  // Toggle button selectors
  const audioToggleBtn = document.getElementById('audio-toggle-btn');
  const audioIcon = document.getElementById('audio-icon');
  const audioStatusText = document.getElementById('audio-status-text');

  updateAudioButtonUI();

  // Lazy initialize audio context
  function initAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx && !flameNoiseBuffer) {
      // Create a 2.5s white noise buffer once and cache it
      const sampleRate = audioCtx.sampleRate;
      const bufferSize = sampleRate * 2.5;
      flameNoiseBuffer = audioCtx.createBuffer(1, bufferSize, sampleRate);
      const data = flameNoiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      // Fade edges (50ms) to ensure seamless loop wrap transitions without clicks
      const fadeSamples = Math.floor(sampleRate * 0.05);
      for (let i = 0; i < fadeSamples; i++) {
        const gain = i / fadeSamples;
        data[i] *= gain;
        data[bufferSize - 1 - i] *= gain;
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // Synthesize clean water droplet sound using oscillator sweeps
  function playWaterDrop(frequencyStart = 150, frequencyEnd = 950, duration = 0.08, peakVolume = 0.25, filterFreq = 1300) {
    if (isMuted) return;
    initAudioContext();
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    osc.type = 'sine';
    
    // Smooth out frequency spikes
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, audioCtx.currentTime);

    // Exponential sweep modeling liquid droplet bubble oscillation
    osc.frequency.setValueAtTime(frequencyStart, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(frequencyEnd, audioCtx.currentTime + duration);

    // Shaping volume envelope (instant click swell -> decay)
    gainNode.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(peakVolume, audioCtx.currentTime + 0.008);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    // Nodes routing
    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // Start playing
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  }

  // Mute control click triggers
  if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', () => {
      isMuted = !isMuted;
      localStorage.setItem('galli-sound-muted', isMuted);
      updateAudioButtonUI();
      
      if (isMuted) {
        if (typeof stopFlameAudio === 'function') {
          stopFlameAudio();
        }
      } else {
        playWaterDrop(200, 1100, 0.08, 0.2);
      }
    });
  }

  function updateAudioButtonUI() {
    if (!audioToggleBtn) return;
    if (isMuted) {
      if (audioIcon) audioIcon.setAttribute('data-lucide', 'volume-x');
      if (audioStatusText) audioStatusText.textContent = 'MUTED';
      audioToggleBtn.classList.add('text-stone-600');
      audioToggleBtn.classList.remove('text-gold-gold');
      const indicators = audioToggleBtn.querySelectorAll('span');
      indicators.forEach(ind => {
        if (ind.classList.contains('pulse-glow-amber')) ind.classList.add('hidden');
      });
    } else {
      if (audioIcon) audioIcon.setAttribute('data-lucide', 'volume-2');
      if (audioStatusText) audioStatusText.textContent = 'SOUND ON';
      audioToggleBtn.classList.remove('text-stone-600');
      audioToggleBtn.classList.add('text-gold-gold');
      const indicators = audioToggleBtn.querySelectorAll('span');
      indicators.forEach(ind => {
        if (ind.classList.contains('pulse-glow-amber')) ind.classList.remove('hidden');
      });
    }
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  // Check recursively if an element or its parent is intentionally interactive
  function isInteractive(el) {
    if (!el || el === document.body || el === document.documentElement) return false;
    
    const tagName = el.tagName.toUpperCase();
    const interactiveTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'OPTION', 'LABEL', 'AUDIO', 'VIDEO'];
    if (interactiveTags.includes(tagName)) return true;
    
    if (el.classList.contains('sound-trigger') || el.hasAttribute('onclick')) return true;
    
    const role = el.getAttribute('role');
    if (role && ['button', 'link', 'checkbox', 'radio', 'menuitem', 'tab', 'option'].includes(role.toLowerCase())) return true;
    
    // Check computed cursor style (e.g. pointer cursor set via Tailwind or style sheet)
    const cursorStyle = window.getComputedStyle(el).cursor;
    if (cursorStyle === 'pointer') return true;
    
    return isInteractive(el.parentElement);
  }

  // Attach sound triggers to mouse events
  document.addEventListener('click', (e) => {
    initAudioContext();
    if (isInteractive(e.target)) {
      const trigger = e.target.closest('.sound-trigger');
      if (trigger) {
        playWaterDrop(160, 1000, 0.08, 0.25);
      }
    } else {
      // Play a soft, muted ambient liquid ripple for non-interactive click
      playWaterDrop(90, 260, 0.07, 0.06, 380);
    }
  });

  const soundHooks = document.querySelectorAll('.sound-trigger');
  soundHooks.forEach(hook => {
    hook.addEventListener('mouseenter', () => {
      // Soft, brief high bubble sound on hovers
      playWaterDrop(450, 1250, 0.04, 0.06);
    });
  });


  // --- 4. Intersection Observer Scroll Reveal Engine ---
  const revealElements = document.querySelectorAll('.reveal-item, .reveal-scale, .reveal-fade');
  
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target); // Trigger only once
      }
    });
  }, {
    threshold: 0.05,
    rootMargin: '0px 0px -40px 0px'
  });

  revealElements.forEach(el => {
    revealObserver.observe(el);
  });


  // --- 5. Interactive Header Scroll Class ---
  const header = document.querySelector('header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        header.classList.add('bg-stone-950/95', 'py-3', 'shadow-xl');
        header.classList.remove('bg-stone-950/75', 'py-4');
      } else {
        header.classList.add('bg-stone-950/75', 'py-4');
        header.classList.remove('bg-stone-950/95', 'py-3', 'shadow-xl');
      }
    });
  }


  // --- 6. Mobile Toggle Drawer ---
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileDrawer = document.getElementById('mobile-drawer');

  if (mobileMenuBtn && mobileDrawer) {
    mobileMenuBtn.addEventListener('click', () => {
      initAudioContext();
      mobileDrawer.classList.toggle('hidden');
      
      const icon = mobileMenuBtn.querySelector('i');
      if (icon) {
        const isClosed = mobileDrawer.classList.contains('hidden');
        icon.setAttribute('data-lucide', isClosed ? 'menu' : 'x');
        if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }
      }
      playWaterDrop(200, 950, 0.08, 0.18);
    });

    const mobileLinks = mobileDrawer.querySelectorAll('a');
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileDrawer.classList.add('hidden');
        const icon = mobileMenuBtn.querySelector('i');
        if (icon) {
          icon.setAttribute('data-lucide', 'menu');
          if (typeof lucide !== 'undefined') {
            lucide.createIcons();
          }
        }
      });
    });
  }


  // --- 7. Table Booking Confirmation Modal Form ---
  const resModal = document.getElementById('reservation-modal');
  const openResModalBtn = document.getElementById('open-res-modal-btn');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const resForm = document.getElementById('reservation-form');
  const resSuccessState = document.getElementById('reservation-success');
  const resetResBtn = document.getElementById('reset-res-btn');
  
  function openReservationModal(e) {
    if (e) e.preventDefault();
    initAudioContext();
    if (resModal) {
      resModal.classList.add('open');
      document.body.style.overflow = 'hidden'; // lock background scroll
      
      // Auto focus on name input field
      const nameInput = document.getElementById('res-name');
      if (nameInput) {
        setTimeout(() => nameInput.focus(), 100);
      }
    }
    playWaterDrop(200, 950, 0.08, 0.18);
  }

  function closeReservationModal() {
    if (resModal) {
      resModal.classList.remove('open');
      document.body.style.overflow = ''; // restore background scroll
    }
    playWaterDrop(280, 850, 0.06, 0.1);
  }

  // Bind Open triggers
  if (openResModalBtn) openResModalBtn.addEventListener('click', openReservationModal);
  
  // Bind all anchors pointing to #reservation on the page
  const reservationLinks = document.querySelectorAll('a[href="#reservation"]');
  reservationLinks.forEach(link => {
    link.addEventListener('click', openReservationModal);
  });

  // Bind Close triggers
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeReservationModal);
  
  // Close on Escape key press
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && resModal && resModal.classList.contains('open')) {
      closeReservationModal();
    }
  });

  // Close when clicking outside the modal panel card
  if (resModal) {
    resModal.addEventListener('click', (e) => {
      // Check if click was directly on the background overlay backdrop
      if (e.target === resModal) {
        closeReservationModal();
      }
    });
  }

  // Handle Form Submission
  if (resForm && resSuccessState) {
    resForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const nameEl = document.getElementById('res-name');
      const phoneEl = document.getElementById('res-phone');
      const dateEl = document.getElementById('res-date');
      const timeEl = document.getElementById('res-time');
      const guestsEl = document.getElementById('res-guests');

      const name = nameEl ? nameEl.value.trim() : '';
      const phone = phoneEl ? phoneEl.value.trim() : '';
      const date = dateEl ? dateEl.value : '';
      const time = timeEl ? timeEl.value : '';
      const guests = guestsEl ? guestsEl.value : '';

      console.log('--- BESPOKE LUXURY RESERVATION REQUESTED ---');
      console.log(`Client Name:   ${name}`);
      console.log(`Contact:       ${phone}`);
      console.log(`Schedule:      ${date} at ${time}`);
      console.log(`Seats:         ${guests} People`);
      console.log('--------------------------------------------');

      // Double ripple synthesized droplet confirmation sounds
      playWaterDrop(160, 850, 0.1, 0.28);
      setTimeout(() => {
        playWaterDrop(220, 1050, 0.08, 0.18);
      }, 100);

      resSuccessState.classList.remove('hidden');
    });
  }

  // Reset form and close modal
  if (resetResBtn && resForm && resSuccessState) {
    resetResBtn.addEventListener('click', () => {
      resForm.reset();
      resSuccessState.classList.add('hidden');
      closeReservationModal();
    });
  }

  // --- 8. Teleport Resolving Transition Engine ---
  const resolvingCanvas = document.getElementById('resolving-canvas');
  if (resolvingCanvas) {
    let transitionFinished = false;

    // Transition completion helper
    function cleanUpTransition() {
      if (transitionFinished) return;
      transitionFinished = true;

      // Fade canvas out and restore scroll
      resolvingCanvas.style.opacity = '0';
      document.documentElement.classList.remove('teleporting');

      // Fully hide canvas from pointer events after transition completes
      setTimeout(() => {
        resolvingCanvas.style.display = 'none';
      }, 500);
    }

    // 1. Check for reduced motion preference
    if (prefersReducedMotion.matches) {
      // Skip animation and clean up instantly
      cleanUpTransition();
    } else {
      // 2. Setup safety fallback (1.5 seconds)
      // Ensure "teleporting" class is deleted, scroll is restored, and overlay hidden
      const safetyTimeoutId = setTimeout(() => {
        console.warn('Resolving animation safety fallback triggered.');
        cleanUpTransition();
      }, 1500);

      // 3. Play warm gold restaurant converging particle animation
      const ctx = resolvingCanvas.getContext('2d');
      if (ctx) {
        resolvingCanvas.width = window.innerWidth;
        resolvingCanvas.height = window.innerHeight;

        const duration = 1000; // 1 second duration
        let startTime = null;

        // Gold particle array
        const particles = [];
        const particleCount = 100;
        for (let i = 0; i < particleCount; i++) {
          particles.push({
            x: Math.random() * resolvingCanvas.width,
            y: Math.random() * resolvingCanvas.height,
            targetX: resolvingCanvas.width / 2 + (Math.random() - 0.5) * 180,
            targetY: resolvingCanvas.height / 2 + (Math.random() - 0.5) * 180,
            size: 1 + Math.random() * 3,
            speed: 1.5 + Math.random() * 2,
            opacity: 0.3 + Math.random() * 0.7,
            color: `rgba(${197 + Math.random() * 30}, ${146 + Math.random() * 25}, 46, `
          });
        }

        function animate(timestamp) {
          if (!startTime) startTime = timestamp;
          const progress = timestamp - startTime;
          const elapsedPercent = progress / duration;

          // Fill obsidian background with slight alpha trail
          ctx.fillStyle = 'rgba(8, 7, 7, 0.2)';
          ctx.fillRect(0, 0, resolvingCanvas.width, resolvingCanvas.height);

          // Draw and converge particles
          particles.forEach(p => {
            const dx = p.targetX - p.x;
            const dy = p.targetY - p.y;
            
            p.x += dx * 0.05 * p.speed;
            p.y += dy * 0.05 * p.speed;

            const alpha = p.opacity * (1 - elapsedPercent);
            ctx.fillStyle = p.color + `${alpha})`;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (1 + elapsedPercent * 1.5), 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowColor = 'rgba(197, 146, 46, 0.4)';
            ctx.shadowBlur = p.size * 4;
          });

          // Radial golden glow in the center expanding outwards
          const gradient = ctx.createRadialGradient(
            resolvingCanvas.width / 2, resolvingCanvas.height / 2, 0,
            resolvingCanvas.width / 2, resolvingCanvas.height / 2, Math.max(resolvingCanvas.width, resolvingCanvas.height) * 0.5 * elapsedPercent
          );
          gradient.addColorStop(0, `rgba(197, 146, 46, ${0.15 * (1 - elapsedPercent)})`);
          gradient.addColorStop(1, 'rgba(8, 7, 7, 0)');
          ctx.fillStyle = gradient;
          ctx.shadowBlur = 0; // reset shadow blur
          ctx.fillRect(0, 0, resolvingCanvas.width, resolvingCanvas.height);

          if (progress < duration) {
            animationFrameId = requestAnimationFrame(animate);
          } else {
            clearTimeout(safetyTimeoutId);
            cleanUpTransition();
          }
        }

        let animationFrameId = null;

        // Handle resizing during animation
        const resizeHandler = () => {
          resolvingCanvas.width = window.innerWidth;
          resolvingCanvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resizeHandler);

        const originalCleanUp = cleanUpTransition;
        cleanUpTransition = () => {
          window.removeEventListener('resize', resizeHandler);
          originalCleanUp();
        };

        requestAnimationFrame(animate);
      } else {
        // Canvas 2d context unavailable, fallback immediately
        cleanUpTransition();
      }
    }
  }

  // ==========================================================================
  // Premium Animations & Interactions Section
  // ==========================================================================

  // --- A. Menu Card Sizzle Synth & Steam Particles ---
  const menuCards = document.querySelectorAll('.hover-glow');
  
  function playSizzle() {
    if (isMuted || !audioCtx) return;
    initAudioContext();
    if (!audioCtx) return;

    try {
      const bufferSize = audioCtx.sampleRate * 0.4;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseNode = audioCtx.createBufferSource();
      noiseNode.buffer = buffer;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(4500, audioCtx.currentTime);
      filter.Q.setValueAtTime(1.2, audioCtx.currentTime);

      const gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(0.001, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.04, audioCtx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.38);

      noiseNode.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      noiseNode.start();
      noiseNode.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      console.warn('Sizzle synth error:', e);
    }
  }

  menuCards.forEach(card => {
    const steamContainer = card.querySelector('.steam-container');
    let steamIntervalId = null;

    card.addEventListener('mouseenter', () => {
      // Play sizzle synth sound
      playSizzle();

      // Spawn steam particles if reduced motion is disabled
      if (steamContainer && !prefersReducedMotion.matches) {
        steamIntervalId = setInterval(() => {
          const particle = document.createElement('span');
          particle.className = 'steam-particle';
          // Randomize steam origin and horizontal drift
          particle.style.left = `${Math.random() * 80 + 10}%`;
          particle.style.setProperty('--drift', `${(Math.random() - 0.5) * 24}px`);
          steamContainer.appendChild(particle);

          // Clean up DOM particle after animation completes
          setTimeout(() => {
            if (particle.parentNode === steamContainer) {
              steamContainer.removeChild(particle);
            }
          }, 1600);
        }, 220);
      }
    });

    card.addEventListener('mouseleave', () => {
      if (steamIntervalId) {
        clearInterval(steamIntervalId);
        steamIntervalId = null;
      }
    });
  });

  // --- B. Hero Parallax (rAF Throttled) ---
  const heroImg = document.getElementById('hero-img');
  if (heroImg) {
    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (window.innerWidth >= 768 && !prefersReducedMotion.matches) {
            const scrollY = window.scrollY;
            heroImg.style.transform = `translateY(${scrollY * 0.16}px)`;
          } else {
            heroImg.style.transform = '';
          }
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  // --- C. Flowing Navigation Underline ---
  const navUnderline = document.getElementById('nav-underline');
  const desktopNav = document.querySelector('nav');
  const navLinks = desktopNav ? desktopNav.querySelectorAll('a') : [];

  if (navUnderline && desktopNav && navLinks.length > 0) {
    // Current active link tracking
    let activeLink = desktopNav.querySelector('a[href="#home"]');

    function positionUnderline(link) {
      if (!link) {
        navUnderline.style.width = '0px';
        navUnderline.style.opacity = '0';
        return;
      }
      navUnderline.style.opacity = '1';
      navUnderline.style.left = `${link.offsetLeft}px`;
      navUnderline.style.width = `${link.offsetWidth}px`;
    }

    // Set initial position
    setTimeout(() => {
      // Find active link matching current hash or fallback to #home
      const currentHash = window.location.hash || '#home';
      activeLink = desktopNav.querySelector(`a[href="${currentHash}"]`) || navLinks[0];
      positionUnderline(activeLink);
    }, 500);

    navLinks.forEach(link => {
      link.addEventListener('mouseenter', () => {
        positionUnderline(link);
      });

      link.addEventListener('mouseleave', () => {
        // Fallback back to current active link on mouse leaves
        positionUnderline(activeLink);
      });
    });

    // Update active underline on hash changes / scroll updates
    const headerObserver = new MutationObserver(() => {
      const newActive = desktopNav.querySelector('a.text-text-bright');
      if (newActive && newActive !== activeLink) {
        activeLink = newActive;
        positionUnderline(activeLink);
      }
    });

    headerObserver.observe(desktopNav, {
      attributes: true,
      subtree: true,
      attributeFilter: ['class']
    });

    // Handle resize adjustments
    window.addEventListener('resize', () => {
      positionUnderline(activeLink);
    });
  }

  // --- D. Ambient Floating Particles (Hero Canvas) ---
  const heroCanvas = document.getElementById('hero-particles');
  if (heroCanvas) {
    const ctx = heroCanvas.getContext('2d');
    let particles = [];
    let animationFrameId = null;

    function resizeCanvas() {
      if (heroCanvas && heroCanvas.parentElement) {
        heroCanvas.width = heroCanvas.parentElement.offsetWidth;
        heroCanvas.height = heroCanvas.parentElement.offsetHeight;
      }
    }

    class GoldParticle {
      constructor() {
        this.reset(true);
      }

      reset(init = false) {
        this.x = Math.random() * heroCanvas.width;
        this.y = init ? Math.random() * heroCanvas.height : heroCanvas.height + 10;
        this.size = 1 + Math.random() * 4;
        this.speedY = 0.2 + Math.random() * 0.4;
        this.speedX = (Math.random() - 0.5) * 0.15;
        this.opacity = 0.1 + Math.random() * 0.4;
      }

      update() {
        this.y -= this.speedY;
        this.x += this.speedX;
        
        // Soft swaying drift
        this.speedX += (Math.random() - 0.5) * 0.02;
        this.speedX = Math.max(-0.25, Math.min(0.25, this.speedX));

        if (this.y < -10 || this.x < -10 || this.x > heroCanvas.width + 10) {
          this.reset(false);
        }
      }

      draw() {
        ctx.fillStyle = `rgba(197, 146, 46, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function initParticles() {
      particles = [];
      // Mobile-specific performance reduction: screens < 768px run 4 particles, desktop runs 18
      const count = window.innerWidth < 768 ? 4 : 18;
      for (let i = 0; i < count; i++) {
        particles.push(new GoldParticle());
      }
    }

    function drawLoop() {
      ctx.clearRect(0, 0, heroCanvas.width, heroCanvas.height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      animationFrameId = requestAnimationFrame(drawLoop);
    }

    function startBokeh() {
      const isReduced = prefersReducedMotion.matches;
      // Completely disable particles if reduced motion is enabled
      if (isReduced) {
        ctx.clearRect(0, 0, heroCanvas.width, heroCanvas.height);
        return;
      }
      resizeCanvas();
      initParticles();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      drawLoop();
    }

    window.addEventListener('resize', () => {
      resizeCanvas();
      initParticles();
    });

    // Pause canvas processing when tab is invisible
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
      } else {
        startBokeh();
      }
    });

    startBokeh();
  }

  // --- E. Staggered Heading Reveal System ---
  const staggerHeadings = document.querySelectorAll('.reveal-stagger');
  staggerHeadings.forEach(heading => {
    const text = heading.textContent.trim();
    heading.innerHTML = ''; // Clear text
    
    // Split into individual words
    const words = text.split(' ');
    words.forEach((word, index) => {
      const span = document.createElement('span');
      span.className = 'stagger-word';
      span.textContent = word;
      heading.appendChild(span);
      
      // Inject incremental delay style rules
      span.style.transitionDelay = `${index * 0.08}s`;

      // Retain space between words
      if (index < words.length - 1) {
        heading.appendChild(document.createTextNode(' '));
      }
    });
  });

  // Re-register staggerHeadings to scroll reveal observer
  const staggerObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.05,
    rootMargin: '0px 0px -40px 0px'
  });

  staggerHeadings.forEach(el => {
    // Add reveal-item container trigger behaviour
    el.classList.add('reveal-item');
    staggerObserver.observe(el);
  });

  // --- F. Subtle Glow Pulse Accent Bindings ---
  // Inject glow pulsing animations to gold utensil icons and design separators
  const goldAccents = document.querySelectorAll('.text-gold-gold, .bg-gold-gold, .border-gold-gold');
  goldAccents.forEach(accent => {
    // Exclude links and interactive form elements to avoid distracting hover loops
    if (accent.tagName !== 'A' && accent.tagName !== 'BUTTON' && accent.tagName !== 'SPAN') {
      accent.classList.add('gold-accent-pulse');
    }
  });

  // --- G. Viewport Scroll-Flame indicator Canvas & Synthesized Looping Audio ---
  const scrollFlame = document.getElementById('scroll-flame');
  
  // Audio state holders in outer G scope for accessibility
  let flameAudioSource = null;
  let flameAudioGain = null;

  // Global functions so they hoist correctly inside DOMContentLoaded
  window.stopFlameAudio = function() {
    if (!flameAudioSource) return;
    
    const sourceToStop = flameAudioSource;
    const gainToFade = flameAudioGain;
    
    flameAudioSource = null;
    flameAudioGain = null;
    
    if (gainToFade && audioCtx) {
      try {
        gainToFade.gain.setValueAtTime(gainToFade.gain.value, audioCtx.currentTime);
        gainToFade.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5); // 500ms fade out
      } catch (e) {}
    }
    
    setTimeout(() => {
      try {
        if (sourceToStop) {
          sourceToStop.stop();
          sourceToStop.disconnect();
        }
      } catch (e) {}
    }, 550);
  };

  if (scrollFlame) {
    const ctx = scrollFlame.getContext('2d');
    let particles = [];
    let isScrolling = false;
    let loopRunning = false;
    let animationFrameId = null;
    let scrollTimeoutId = null;
    let ticking = false;
    let isMobile = window.innerWidth < 768;
    
    // Direction tracking states
    let lastScrollY = window.scrollY;
    let currentDirection = 'down';

    // Particle Blueprint
    class FlameParticle {
      constructor(spawnDirection) {
        this.direction = spawnDirection;
        this.reset(true);
      }

      reset(init = false) {
        this.x = Math.random() * scrollFlame.width;
        // Start thick at the base
        this.size = 5.5 + Math.random() * 5.5;
        this.speedX = (Math.random() - 0.5) * 0.2;
        this.life = 1.0;
        // Faster decay for realistic rapid movement licks
        this.decay = 0.02 + Math.random() * 0.018;

        // Sine wave horizontal turbulence parameters
        this.wavePhase = Math.random() * Math.PI * 2;
        this.waveSpeed = 0.05 + Math.random() * 0.06; // sway frequency
        this.waveAmplitude = 0.15 + Math.random() * 0.25; // sway displacement offset

        if (this.direction === 'down') {
          // Spawns at bottom edge, moves up (negative speedY)
          this.y = scrollFlame.height + (init ? Math.random() * 25 : Math.random() * 10);
          this.speedY = -(0.8 + Math.random() * 1.2);
        } else {
          // Spawns at top edge, moves down (positive speedY)
          this.y = 0 - (init ? Math.random() * 25 : Math.random() * 10);
          this.speedY = 0.8 + Math.random() * 1.2;
        }
      }

      update() {
        this.y += this.speedY;
        this.x += this.speedX;
        
        // Apply wave turbulence
        this.wavePhase += this.waveSpeed;
        this.x += Math.sin(this.wavePhase) * this.waveAmplitude;

        this.life -= this.decay;
        if (this.size > 0.1) {
          this.size -= 0.12; // Taper down quickly
        }
      }

      draw() {
        const alpha = Math.max(0, this.life * 0.8);
        
        // Multi-layered radial gradient centered on the particle's hot core
        const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 1.8);
        grad.addColorStop(0, `rgba(255, 255, 230, ${alpha})`); // White hot center
        grad.addColorStop(0.25, `rgba(240, 120, 10, ${alpha * 0.95})`); // Amber / Orange body
        grad.addColorStop(0.65, `rgba(180, 20, 0, ${alpha * 0.4})`); // Deep red licks
        grad.addColorStop(1, 'rgba(180, 20, 0, 0)'); // Fade out
        
        ctx.fillStyle = grad;

        // Custom Bezier path for elongated teardrop flame shape
        ctx.beginPath();
        if (this.direction === 'down') {
          // Pointing UP: narrow top (y - size*2.2), wide base (y + size*0.8)
          ctx.moveTo(this.x, this.y - this.size * 2.2);
          ctx.quadraticCurveTo(this.x + this.size * 1.1, this.y, this.x, this.y + this.size * 0.8);
          ctx.quadraticCurveTo(this.x - this.size * 1.1, this.y, this.x, this.y - this.size * 2.2);
        } else {
          // Pointing DOWN: wide base (y - size*0.8), narrow top (y + size*2.2)
          ctx.moveTo(this.x, this.y + this.size * 2.2);
          ctx.quadraticCurveTo(this.x + this.size * 1.1, this.y, this.x, this.y - this.size * 0.8);
          ctx.quadraticCurveTo(this.x - this.size * 1.1, this.y, this.x, this.y + this.size * 2.2);
        }
        ctx.closePath();
        ctx.fill();
      }
    }

    function resizeCanvas() {
      if (window.innerWidth < 768) {
        scrollFlame.style.display = 'none';
        isMobile = true;
        return;
      }
      isMobile = false;
      scrollFlame.style.display = 'block';
      scrollFlame.width = window.innerWidth;
      scrollFlame.height = window.innerHeight;
    }

    function startFlameAudio() {
      if (isMuted || !flameNoiseBuffer || prefersReducedMotion.matches || isMobile) return;
      initAudioContext();
      if (!audioCtx) return;
      if (flameAudioSource) return;

      try {
        // Create rumble filter node
        const rumbleFilter = audioCtx.createBiquadFilter();
        rumbleFilter.type = 'lowpass';
        rumbleFilter.frequency.setValueAtTime(180, audioCtx.currentTime);

        // Create main gain node
        flameAudioGain = audioCtx.createGain();
        flameAudioGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
        flameAudioGain.gain.linearRampToValueAtTime(0.045, audioCtx.currentTime + 0.3); // 300ms fade-in

        // Create buffer source
        flameAudioSource = audioCtx.createBufferSource();
        flameAudioSource.buffer = flameNoiseBuffer;
        flameAudioSource.loop = true;

        // Routing
        flameAudioSource.connect(rumbleFilter);
        rumbleFilter.connect(flameAudioGain);
        flameAudioGain.connect(audioCtx.destination);

        flameAudioSource.start();
      } catch (e) {
        console.warn('Failed to play flame audio:', e);
      }
    }

    function renderLoop() {
      ctx.clearRect(0, 0, scrollFlame.width, scrollFlame.height);

      // 1. Enable additive blending for glowing fire masses
      ctx.globalCompositeOperation = 'lighter';

      // Spawn new particles while scrolling is active, capped at 150 to prevent runaway frames
      if (isScrolling && !isMobile && !prefersReducedMotion.matches && particles.length < 150) {
        // Dense spawn rate
        const spawns = Math.floor(scrollFlame.width / 80);
        for (let i = 0; i < spawns; i++) {
          particles.push(new FlameParticle(currentDirection));
        }
      }

      // Update & Draw active particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        if (p.life <= 0 || p.size <= 0.1 || isMobile || prefersReducedMotion.matches) {
          particles.splice(i, 1);
        } else {
          p.draw();
        }
      }

      // Restore default composite operation
      ctx.globalCompositeOperation = 'source-over';

      // Loop controls
      if (particles.length > 0 && !isMobile && !prefersReducedMotion.matches) {
        animationFrameId = requestAnimationFrame(renderLoop);
      } else {
        loopRunning = false;
        ctx.clearRect(0, 0, scrollFlame.width, scrollFlame.height);
        scrollFlame.classList.remove('active');
      }
    }

    // Scroll trigger handler
    window.addEventListener('scroll', () => {
      if (isMobile || prefersReducedMotion.matches) return;

      // Track directional orientation
      const currentScrollY = window.scrollY;
      currentDirection = currentScrollY > lastScrollY ? 'down' : 'up';
      lastScrollY = currentScrollY;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (!isScrolling) {
            isScrolling = true;
            scrollFlame.classList.add('active');
            startFlameAudio();
          }
          if (!loopRunning) {
            loopRunning = true;
            renderLoop();
          }
          ticking = false;
        });
        ticking = true;
      }

      if (scrollTimeoutId) {
        clearTimeout(scrollTimeoutId);
      }

      scrollTimeoutId = setTimeout(() => {
        isScrolling = false;
        stopFlameAudio();
      }, 400); // 400ms debounce to start dying down
    });

    // Debounced Resize handler
    let resizeTimeoutId = null;
    window.addEventListener('resize', () => {
      if (resizeTimeoutId) clearTimeout(resizeTimeoutId);
      resizeTimeoutId = setTimeout(() => {
        resizeCanvas();
        if (isMobile) {
          particles = [];
          isScrolling = false;
          stopFlameAudio();
          if (animationFrameId) cancelAnimationFrame(animationFrameId);
          loopRunning = false;
          ctx.clearRect(0, 0, scrollFlame.width, scrollFlame.height);
        }
      }, 200);
    });

    // Initial canvas setup
    resizeCanvas();
  }

});
