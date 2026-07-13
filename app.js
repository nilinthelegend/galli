/* ==========================================================================
   Galli Cafe & Restro - Luxury Soundscapes, Preloader & Cursor Trails
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // --- 1. Preloader Screen Animation ---
  const preloader = document.getElementById('preloader');
  const preloaderBar = document.getElementById('preloader-bar');
  
  if (preloaderBar) {
    // Start progress loading line
    setTimeout(() => {
      preloaderBar.style.width = '100%';
    }, 100);
  }

  const enterBtn = document.getElementById('enter-btn');

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
      
      if (!isMuted) {
        playWaterDrop(200, 1100, 0.08, 0.2);
      }
    });
  }

  function updateAudioButtonUI() {
    if (!audioToggleBtn) return;
    if (isMuted) {
      audioIcon.setAttribute('data-lucide', 'volume-x');
      audioStatusText.textContent = 'MUTED';
      audioToggleBtn.classList.add('text-stone-600');
      audioToggleBtn.classList.remove('text-gold-gold');
      const indicators = audioToggleBtn.querySelectorAll('span');
      indicators.forEach(ind => {
        if (ind.classList.contains('pulse-glow-amber')) ind.classList.add('hidden');
      });
    } else {
      audioIcon.setAttribute('data-lucide', 'volume-2');
      audioStatusText.textContent = 'SOUND ON';
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
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('bg-stone-950/95', 'py-3', 'shadow-xl');
      header.classList.remove('bg-stone-950/75', 'py-4');
    } else {
      header.classList.add('bg-stone-950/75', 'py-4');
      header.classList.remove('bg-stone-950/95', 'py-3', 'shadow-xl');
    }
  });


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

      const name = document.getElementById('res-name').value.trim();
      const phone = document.getElementById('res-phone').value.trim();
      const date = document.getElementById('res-date').value;
      const time = document.getElementById('res-time').value;
      const guests = document.getElementById('res-guests').value;

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

});
