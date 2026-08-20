/* 
 * AFYAROOT Healthcare Interactive Presentation
 * Slide-Specific Custom Interactive Animations (animations.js)
 */

class SlideAnimations {
  constructor() {
    this.chatInterval = null;
    this.workflowInterval = null;
    this.init();
    this.setupSlideTabs();
    this.setupProblemCardClicks();
    this.setupUniquenessCardClicks();
    this.setupMechanismVideoControls();
  }

  setupSlideTabs() {
    const tabBtns = document.querySelectorAll('.slide-tab-btn');
    tabBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetId = btn.getAttribute('data-target');
        
        const header = btn.closest('.slide-header');
        if (header) {
          header.querySelectorAll('.slide-tab-btn').forEach(b => b.classList.remove('active'));
        }
        btn.classList.add('active');

        const slide = btn.closest('.slide');
        if (slide) {
          const panes = slide.querySelectorAll('.tab-pane');
          panes.forEach((pane) => {
            if (pane.id === targetId) {
              pane.classList.add('active');
            } else {
              pane.classList.remove('active');
            }
          });
        }

        // Pause video if user switches away from video tab
        if (targetId !== 'tab-video') {
          const vid = document.getElementById('mechanism-video');
          if (vid && !vid.paused) {
            vid.pause();
          }
        }
      });
    });
  }

  init() {
    // Listen for slide change events dispatched by navigation.js
    document.addEventListener('slideChanged', (e) => {
      const { slideIndex, slideEl } = e.detail;
      
      // Stop any ongoing animation loops
      this.clearAllIntervals();

      // Pause mechanism video if leaving the demo slide
      const isVideoSlide = slideEl && slideEl.querySelector('#mechanism-video');
      if (!isVideoSlide) {
        const vid = document.getElementById('mechanism-video');
        if (vid && !vid.paused) {
          vid.pause();
        }
      }
      
      // Trigger slide-specific animations
      if (slideIndex === 4) {
        // Solution Slide (Slide 5) -> Phone SMS Demo
        this.runPhoneDemo();
      }
    });
  }

  setupProblemCardClicks() {
    const slide = document.getElementById('slide-4');
    if (!slide) return;
    const tabs = slide.querySelectorAll('.problem-tab');
    const spotlightIcon = slide.querySelector('.spotlight-icon');
    const spotlightTitle = slide.querySelector('.spotlight-title');
    const spotlightDesc = slide.querySelector('.spotlight-desc');
    
    if (!spotlightTitle || !spotlightDesc) return;
    
    const updateSpotlight = (icon, title, desc) => {
      // Fade out spotlight items
      if (spotlightIcon) spotlightIcon.style.opacity = 0;
      spotlightTitle.style.opacity = 0;
      spotlightDesc.style.opacity = 0;
      
      setTimeout(() => {
        if (spotlightIcon) spotlightIcon.textContent = icon;
        spotlightTitle.textContent = title;
        spotlightDesc.textContent = desc;
        
        // Fade in spotlight items
        if (spotlightIcon) spotlightIcon.style.opacity = 1;
        spotlightTitle.style.opacity = 1;
        spotlightDesc.style.opacity = 1;
      }, 200);
    };

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const isActive = tab.classList.contains('active');
        if (!isActive) {
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          
          const icon = tab.querySelector('.tab-icon').textContent;
          const title = tab.querySelector('.tab-label').textContent;
          const desc = tab.getAttribute('data-desc');
          
          updateSpotlight(icon, title, desc);
        }
      });
    });

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const target = mutation.target;
          if (target.classList.contains('active')) {
            const icon = target.querySelector('.tab-icon').textContent;
            const title = target.querySelector('.tab-label').textContent;
            const desc = target.getAttribute('data-desc');
            updateSpotlight(icon, title, desc);
          }
        }
      });
    });

    tabs.forEach(tab => {
      observer.observe(tab, { attributes: true });
    });
  }

  setupUniquenessCardClicks() {
    const slide = document.getElementById('slide-6');
    if (!slide) return;
    const tabs = slide.querySelectorAll('.uniqueness-tab');
    const spotlightIcon = slide.querySelector('.spotlight-icon');
    const spotlightTitle = slide.querySelector('.spotlight-title');
    const spotlightDesc = slide.querySelector('.spotlight-desc');
    
    if (!spotlightTitle || !spotlightDesc) return;
    
    const updateSpotlight = (icon, title, desc) => {
      // Fade out spotlight items
      if (spotlightIcon) spotlightIcon.style.opacity = 0;
      spotlightTitle.style.opacity = 0;
      spotlightDesc.style.opacity = 0;
      
      setTimeout(() => {
        if (spotlightIcon) spotlightIcon.textContent = icon;
        spotlightTitle.textContent = title;
        spotlightDesc.textContent = desc;
        
        // Fade in spotlight items
        if (spotlightIcon) spotlightIcon.style.opacity = 1;
        spotlightTitle.style.opacity = 1;
        spotlightDesc.style.opacity = 1;
      }, 200);
    };

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const isActive = tab.classList.contains('active');
        if (!isActive) {
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          
          const icon = tab.querySelector('.tab-icon').textContent;
          const title = tab.querySelector('.tab-label').textContent;
          const desc = tab.getAttribute('data-desc');
          
          updateSpotlight(icon, title, desc);
        }
      });
    });

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const target = mutation.target;
          if (target.classList.contains('active')) {
            const icon = target.querySelector('.tab-icon').textContent;
            const title = target.querySelector('.tab-label').textContent;
            const desc = target.getAttribute('data-desc');
            updateSpotlight(icon, title, desc);
          }
        }
      });
    });

    tabs.forEach(tab => {
      observer.observe(tab, { attributes: true });
    });
  }

  clearAllIntervals() {
    if (this.chatInterval) clearInterval(this.chatInterval);
    if (this.workflowInterval) clearInterval(this.workflowInterval);
  }

  /* --------------------------------------------------------
   * SLIDE 5: PHONE SMS DEMO SIMULATION
   * -------------------------------------------------------- */
  runPhoneDemo() {
    const chatArea = document.querySelector('.phone-chat-area');
    if (!chatArea) return;
    
    // Clear chat area
    chatArea.innerHTML = '';
    
    const messages = [
      { sender: 'user', text: 'Habari, ninajisikia homa na kichwa kinaniuma sana tangu jana.' },
      { sender: 'ai', text: 'Habari! Nimesikia dalili zako. Tafadhali, una dalili zingine kama kikohozi, mafua, au maumivu ya viungo?' },
      { sender: 'user', text: 'Ndio, nina kikohozi na viungo vinaniuma sana pia.' },
      { sender: 'ai', text: 'Asante kwa taarifa. Dalili hizi zinaweza kuashiria Malaria. Nakushauri utembelee Kituo cha Afya cha MMUST kilicho karibu nawe mita 500 kwa vipimo kamili.' }
    ];
    
    let msgIdx = 0;
    
    const appendMessage = () => {
      if (msgIdx >= messages.length) {
        // Loop again after 5 seconds
        this.chatInterval = setTimeout(() => {
          chatArea.innerHTML = '';
          msgIdx = 0;
          appendMessage();
        }, 5000);
        return;
      }
      
      const msg = messages[msgIdx];
      const bubble = document.createElement('div');
      bubble.className = `chat-bubble ${msg.sender}`;
      bubble.textContent = msg.text;
      
      chatArea.appendChild(bubble);
      chatArea.scrollTop = chatArea.scrollHeight;
      
      msgIdx++;
      
      // Set delay for next message
      const nextDelay = msg.sender === 'user' ? 2500 : 3500;
      this.chatInterval = setTimeout(appendMessage, nextDelay);
    };
    
    // Start first message
    this.chatInterval = setTimeout(appendMessage, 1000);
  }

  /* --------------------------------------------------------
   * SLIDE 10: BUDGET COST STRUCTURE DONUT CHART
   * -------------------------------------------------------- */
  animateCostDonut() {
    const slices = document.querySelectorAll('.cost-donut-slice');
    
    slices.forEach(slice => {
      // Fetch data-dashoffset stored as percentage
      const finalOffset = slice.getAttribute('data-offset');
      const circumference = 628.3; // 2 * pi * 100 (r=100)
      
      // Start from full circumference (invisible stroke)
      slice.style.strokeDasharray = circumference;
      slice.style.strokeDashoffset = circumference;
      
      // Force layout recalculation
      slice.getBoundingClientRect();
      
      // Transition to final offset
      slice.style.transition = 'stroke-dashoffset 1.5s cubic-bezier(0.25, 1, 0.5, 1)';
      slice.style.strokeDashoffset = finalOffset;
    });
  }

  /* --------------------------------------------------------
   * SLIDE 6: MECHANISM VIDEO DEMO CONTROLS & DYNAMIC STAGE SYNC
   * -------------------------------------------------------- */
  setupMechanismVideoControls() {
    const vid = document.getElementById('mechanism-video');
    if (!vid) return;

    // Multi-Video Configuration & Precise Stage Timelines
    const VIDEO_CONFIG = {
      'assets/videos/faster.mp4': {
        id: 'faster',
        title: 'FAST ARCHITECTURE & SYSTEM DEMO',
        syncPill: '⚡ Fast Sync (365s • 1.5x)',
        duration: 365.5,
        defaultSpeed: 1.5,
        stages: [
          { num: '01', time: 0, tag: '0:00', title: 'Patient Input Ingestion', desc: 'SMS (Kabambe) & Speech-to-Text logging' },
          { num: '02', time: 40, tag: '0:40', title: 'Gateway Normalization', desc: 'Cleanses, normalizes headers & queues queries' },
          { num: '03', time: 100, tag: '1:40', title: 'Medical AI Diagnostics', desc: 'Edge AI & Diagnostic classification engine' },
          { num: '04', time: 140, tag: '2:20', title: 'Triage & GBV Safety', desc: 'Triage guidance & emergency protection filter' },
          { num: '05', time: 180, tag: '3:00', title: 'KMHFR Facility Matching', desc: 'Geospatial routing to nearest equipped clinic' },
          { num: '06', time: 260, tag: '4:20', title: 'SMS & Helpline 1195 Dispatch', desc: 'Instant SMS diagnostic summary & 1195 relay' }
        ]
      },
      'assets/videos/normal.mp4': {
        id: 'normal',
        title: 'NORMAL PACING SYSTEM DISPLAY',
        syncPill: '🎬 Normal Sync (585s • 1.0x)',
        duration: 584.8,
        defaultSpeed: 1.0,
        stages: [
          { num: '01', time: 0, tag: '0:00', title: 'Patient Input Ingestion', desc: 'SMS (Kabambe) & Speech-to-Text logging' },
          { num: '02', time: 64, tag: '1:04', title: 'Gateway Normalization', desc: 'Cleanses, normalizes headers & queues queries' },
          { num: '03', time: 160, tag: '2:40', title: 'Medical AI Diagnostics', desc: 'Edge AI & Diagnostic classification engine' },
          { num: '04', time: 224, tag: '3:44', title: 'Triage & GBV Safety', desc: 'Triage guidance & emergency protection filter' },
          { num: '05', time: 288, tag: '4:48', title: 'KMHFR Facility Matching', desc: 'Geospatial routing to nearest equipped clinic' },
          { num: '06', time: 416, tag: '6:56', title: 'SMS & Helpline 1195 Dispatch', desc: 'Instant SMS diagnostic summary & 1195 relay' }
        ]
      },
      'assets/videos/mechanism_flow.mp4': {
        id: 'mechanism',
        title: 'MECHANISM & PROCESS FLOW SIMULATION',
        syncPill: '🔄 Flow Sync (24s • Schematic)',
        duration: 23.4,
        defaultSpeed: 1.0,
        stages: [
          { num: '01', time: 0.0, tag: '0.0s', title: 'Patient Input Ingestion', desc: 'SMS (Kabambe) & Speech-to-Text logging' },
          { num: '02', time: 7.5, tag: '7.5s', title: 'Gateway Normalization', desc: 'Cleanses, normalizes headers & queues queries' },
          { num: '03', time: 10.5, tag: '10.5s', title: 'Medical AI Diagnostics', desc: 'Edge AI & Diagnostic classification engine' },
          { num: '04', time: 12.3, tag: '12.3s', title: 'Triage & GBV Safety', desc: 'Triage guidance & emergency protection filter' },
          { num: '05', time: 14.7, tag: '14.7s', title: 'KMHFR Facility Matching', desc: 'Geospatial routing to nearest equipped clinic' },
          { num: '06', time: 17.7, tag: '17.7s', title: 'SMS & Helpline 1195 Dispatch', desc: 'Instant SMS diagnostic summary & 1195 relay' }
        ]
      }
    };

    // DOM References
    const playToggleBtn = document.getElementById('vid-play-toggle');
    const playOverlayBtn = document.getElementById('vid-overlay-btn');
    const restartBtn = document.getElementById('vid-restart');
    const skipBackBtn = document.getElementById('vid-skip-back');
    const skipFwdBtn = document.getElementById('vid-skip-fwd');
    const fullscreenBtn = document.getElementById('vid-fullscreen');
    const pipBtn = document.getElementById('vid-pip-btn');
    const pipHeaderBtn = document.getElementById('vid-pip-btn-header');
    const popoutBtn = document.getElementById('vid-btn-popout');
    const openPopoutHeaderBtn = document.getElementById('vid-open-normal-win-top');
    const fileInput = document.getElementById('vid-file-input');
    const videoWrapper = document.querySelector('.video-wrapper');
    const speedHud = document.getElementById('video-speed-hud');
    const timerDisplay = document.getElementById('video-timer-display');
    const chaptersContainer = document.getElementById('chapters-list-container');
    const chaptersSyncPill = document.getElementById('chapters-sync-pill');
    const speedPills = document.querySelectorAll('.speed-pill-btn');
    const sourcePills = document.querySelectorAll('.video-source-pill');

    // Video State
    let currentVideoSrc = 'assets/videos/faster.mp4';
    let currentSpeed = 1.5;
    let speedHudTimeout = null;

    // Helper: Format Seconds to MM:SS
    const formatTime = (seconds) => {
      if (isNaN(seconds) || seconds < 0) return '00:00';
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Pre-cache video sources for instantaneous smooth switching
    ['assets/videos/faster.mp4', 'assets/videos/normal.mp4', 'assets/videos/mechanism_flow.mp4'].forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'video';
      link.href = src;
      document.head.appendChild(link);
    });

    // Speed Display HUD
    const showSpeedHud = (speed) => {
      if (!speedHud) return;
      speedHud.textContent = `⚡ ${speed}x Speed`;
      speedHud.classList.add('visible');
      if (speedHudTimeout) clearTimeout(speedHudTimeout);
      speedHudTimeout = setTimeout(() => speedHud.classList.remove('visible'), 1200);
    };

    // Apply Playback Speed
    const applyPlaybackSpeed = (speed, showHud = true) => {
      currentSpeed = Math.max(0.5, Math.min(3.0, parseFloat(speed.toFixed(2))));
      vid.playbackRate = currentSpeed;

      speedPills.forEach(btn => {
        const btnSpeed = parseFloat(btn.getAttribute('data-speed'));
        btn.classList.toggle('active', btnSpeed === currentSpeed);
      });

      if (showHud) showSpeedHud(currentSpeed);
    };

    // Render Synchronized Mechanism Chapters in Sidebar
    const renderChapters = (cfg) => {
      if (!chaptersContainer) return;
      chaptersContainer.innerHTML = '';

      if (chaptersSyncPill && cfg && cfg.syncPill) {
        chaptersSyncPill.textContent = cfg.syncPill;
      }

      const stages = (cfg && cfg.stages) || VIDEO_CONFIG['assets/videos/faster.mp4'].stages;

      stages.forEach((stage, idx) => {
        const item = document.createElement('div');
        item.className = `chapter-item ${idx === 0 ? 'active' : ''}`;
        item.setAttribute('data-time', stage.time);

        item.innerHTML = `
          <div class="chapter-badge">${stage.num}</div>
          <div class="chapter-info">
            <div class="chapter-title-row">
              <h5>${stage.title}</h5>
              <span class="chapter-time-tag">${stage.tag}</span>
            </div>
          </div>
        `;

        // Click to seek smoothly to stage timestamp
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          document.querySelectorAll('.chapter-item').forEach(c => c.classList.remove('active'));
          item.classList.add('active');
          vid.currentTime = stage.time;
          vid.playbackRate = currentSpeed;
          vid.play().catch(() => {});
        });

        chaptersContainer.appendChild(item);
      });
    };

    // Switch Video Source (Dynamically Realigns All 6 Stages)
    const switchVideoSource = (src, autoPlay = true) => {
      currentVideoSrc = src;
      const config = VIDEO_CONFIG[src] || {
        id: 'custom',
        title: 'CUSTOM VIDEO WALKTHROUGH',
        syncPill: '📁 Custom Video',
        duration: vid.duration || 0,
        defaultSpeed: 1.0,
        stages: VIDEO_CONFIG['assets/videos/faster.mp4'].stages
      };

      // Update active source tab
      sourcePills.forEach(pill => {
        pill.classList.toggle('active', pill.getAttribute('data-src') === src);
      });

      // Render chapters aligned to this specific video source
      renderChapters(config);

      // Apply video's default recommended speed if switching between fast / normal
      if (config.defaultSpeed) {
        applyPlaybackSpeed(config.defaultSpeed, false);
      }

      // Swap video source
      const isPaused = vid.paused;
      vid.src = src;
      vid.playbackRate = currentSpeed;
      vid.load();

      if (autoPlay || !isPaused) {
        vid.play().catch(() => {});
      }
    };

    // Open Dedicated Standalone Video Player Window
    const openDedicatedWindow = (videoSrc = currentVideoSrc, speed = currentSpeed) => {
      const playerUrl = `video-player.html?video=${encodeURIComponent(videoSrc)}&speed=${speed}`;
      const winFeatures = 'width=1240,height=760,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=no';
      const popWin = window.open(playerUrl, 'AfyarootVideoWindow', winFeatures);
      if (popWin) {
        popWin.focus();
        if (!vid.paused) vid.pause();
      } else {
        window.open(playerUrl, '_blank');
      }
    };

    // Float Picture-in-Picture Mode
    const togglePictureInPicture = async () => {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else if (vid.requestPictureInPicture) {
          await vid.requestPictureInPicture();
        }
      } catch (err) {
        console.warn('Picture-in-Picture error:', err);
      }
    };

    // Play/Pause UI Sync
    const updatePlayUI = (isPlaying) => {
      if (playToggleBtn) {
        const icon = playToggleBtn.querySelector('.vid-btn-icon');
        const label = playToggleBtn.querySelector('.vid-btn-label');
        if (icon) icon.textContent = isPlaying ? '⏸' : '▶';
        if (label) label.textContent = isPlaying ? 'Pause' : 'Play';
        playToggleBtn.classList.toggle('active', isPlaying);
      }
      if (playOverlayBtn) {
        playOverlayBtn.classList.toggle('hidden', isPlaying);
      }
    };

    const togglePlay = () => {
      if (vid.paused || vid.ended) {
        vid.playbackRate = currentSpeed;
        vid.play().catch(() => {});
      } else {
        vid.pause();
      }
    };

    // Playback Button Listeners
    if (playToggleBtn) {
      playToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePlay();
      });
    }

    if (playOverlayBtn) {
      playOverlayBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePlay();
      });
    }

    if (restartBtn) {
      restartBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        vid.currentTime = 0;
        vid.playbackRate = currentSpeed;
        vid.play().catch(() => {});
      });
    }

    if (skipBackBtn) {
      skipBackBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        vid.currentTime = Math.max(0, vid.currentTime - 10);
      });
    }

    if (skipFwdBtn) {
      skipFwdBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        vid.currentTime = Math.min(vid.duration || 9999, vid.currentTime + 10);
      });
    }

    // Speed Preset Buttons
    speedPills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        const speed = parseFloat(pill.getAttribute('data-speed'));
        applyPlaybackSpeed(speed);
      });
    });

    // Video Source Switcher Tabs
    sourcePills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        const src = pill.getAttribute('data-src');
        switchVideoSource(src, true);
      });
    });

    // Dedicated Window Buttons
    if (popoutBtn) {
      popoutBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openDedicatedWindow(currentVideoSrc, currentSpeed);
      });
    }

    if (openPopoutHeaderBtn) {
      openPopoutHeaderBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openDedicatedWindow(currentVideoSrc, currentSpeed);
      });
    }

    // Picture-in-Picture Buttons
    if (pipBtn) {
      pipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePictureInPicture();
      });
    }

    if (pipHeaderBtn) {
      pipHeaderBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePictureInPicture();
      });
    }

    // Fullscreen Button
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!document.fullscreenElement) {
          const container = document.querySelector('.video-main-frame') || vid;
          if (container.requestFullscreen) {
            container.requestFullscreen();
          } else if (vid.requestFullscreen) {
            vid.requestFullscreen();
          }
        } else {
          document.exitFullscreen();
        }
      });
    }

    // Video Playback & Timeupdate Events
    vid.addEventListener('play', () => {
      vid.playbackRate = currentSpeed;
      updatePlayUI(true);
    });
    vid.addEventListener('pause', () => updatePlayUI(false));
    vid.addEventListener('ended', () => updatePlayUI(false));
    vid.addEventListener('canplay', () => {
      vid.playbackRate = currentSpeed;
      if (timerDisplay) {
        timerDisplay.textContent = `${formatTime(vid.currentTime)} / ${formatTime(vid.duration)}`;
      }
    });

    // Real-Time Progress & Stage Highlighter
    vid.addEventListener('timeupdate', () => {
      const current = vid.currentTime;
      const total = vid.duration || 0;

      // Update timer display
      if (timerDisplay) {
        timerDisplay.textContent = `${formatTime(current)} / ${formatTime(total)}`;
      }

      // Highlight active stage accurately based on active video stages
      const chapterEls = document.querySelectorAll('#chapters-list-container .chapter-item');
      let activeEl = null;

      chapterEls.forEach((item) => {
        const time = parseFloat(item.getAttribute('data-time') || '0');
        if (current >= time) {
          activeEl = item;
        }
      });

      if (activeEl && !activeEl.classList.contains('active')) {
        chapterEls.forEach(c => c.classList.remove('active'));
        activeEl.classList.add('active');
      }
    });

    // Custom File Picker
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          const url = URL.createObjectURL(file);
          switchVideoSource(url, true);
        }
      });
    }

    // Drag-and-Drop Video
    if (videoWrapper) {
      videoWrapper.addEventListener('dragover', (e) => {
        e.preventDefault();
        videoWrapper.classList.add('dragover');
      });
      videoWrapper.addEventListener('dragleave', () => {
        videoWrapper.classList.remove('dragover');
      });
      videoWrapper.addEventListener('drop', (e) => {
        e.preventDefault();
        videoWrapper.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files && files.length > 0 && files[0].type.startsWith('video/')) {
          const url = URL.createObjectURL(files[0]);
          switchVideoSource(url, true);
        }
      });
    }

    // Keyboard Shortcuts (Space/K for Play, [ / ] for Speed, W for Popout, P for PiP)
    document.addEventListener('keydown', (e) => {
      const currentSlide = document.querySelector('.slide.active');
      if (currentSlide && (currentSlide.id === 'slide-10' || currentSlide.querySelector('#mechanism-video'))) {
        if (e.key === 'k') {
          e.preventDefault();
          togglePlay();
        } else if (e.key === ']' || e.key === '>') {
          e.preventDefault();
          applyPlaybackSpeed(currentSpeed + 0.25);
        } else if (e.key === '[' || e.key === '<') {
          e.preventDefault();
          applyPlaybackSpeed(currentSpeed - 0.25);
        } else if (e.key === 'w' || e.key === 'W') {
          e.preventDefault();
          openDedicatedWindow(currentVideoSrc, currentSpeed);
        } else if (e.key === 'p' || e.key === 'P') {
          e.preventDefault();
          togglePictureInPicture();
        }
      }
    });

    // Initial Setup: Render default stages (Fast demo) and set speed
    renderChapters(VIDEO_CONFIG['assets/videos/faster.mp4']);
    applyPlaybackSpeed(1.5, false);
  }
}

// Instantiate animations controller
document.addEventListener('DOMContentLoaded', () => {
  window.slideAnimations = new SlideAnimations();
});
