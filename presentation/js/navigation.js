/* 
 * AFYAROOT Healthcare Interactive Presentation
 * Slide Navigation Logic (navigation.js)
 */

class PresentationController {
  constructor() {
    this.currentSlideIndex = 0;
    this.slides = [];
    this.tocDots = [];
    this.progressBarFill = null;
    this.counterCurrent = null;
    this.counterTotal = null;
    this.prevBtn = null;
    this.nextBtn = null;
    
    // Touch Swipe properties
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.swipeThreshold = 50; // pixels
    
    this.init();
  }

  init() {
    // Collect slide DOM elements
    this.slides = Array.from(document.querySelectorAll('.slide'));
    this.progressBarFill = document.querySelector('.progress-bar-fill');
    this.counterCurrent = document.querySelector('.hud-counter-current');
    this.counterTotal = document.querySelector('.hud-counter-total');
    this.prevBtn = document.getElementById('nav-prev');
    this.nextBtn = document.getElementById('nav-next');
    
    if (this.slides.length === 0) return;
    
    // Set total slide count in HUD
    if (this.counterTotal) {
      this.counterTotal.textContent = this.padZero(this.slides.length);
    }
    
    // Generate Table of Contents Dots dynamically
    this.createTOCDots();
    
    // Read initial slide from URL Hash (e.g. #slide-3)
    const hash = window.location.hash;
    let initialIndex = 0;
    if (hash && hash.startsWith('#slide-')) {
      const parsedIndex = parseInt(hash.replace('#slide-', ''), 10) - 1;
      if (!isNaN(parsedIndex) && parsedIndex >= 0 && parsedIndex < this.slides.length) {
        initialIndex = parsedIndex;
      }
    }
    
    // Render initial slide
    this.goToSlide(initialIndex, false);
    
    // Setup Event Listeners
    this.setupListeners();
  }

  createTOCDots() {
    const sidebar = document.querySelector('.sidebar-toc');
    if (!sidebar) return;
    
    sidebar.innerHTML = '';
    this.tocDots = [];
    
    this.slides.forEach((slide, index) => {
      const dot = document.createElement('div');
      dot.className = 'toc-dot';
      dot.setAttribute('data-index', index);
      
      // Get title for tooltip description
      const titleEl = slide.querySelector('.slide-title');
      const titleText = titleEl ? titleEl.innerText : `Slide ${index + 1}`;
      dot.setAttribute('data-title', titleText);
      
      dot.addEventListener('click', () => {
        this.goToSlide(index);
      });
      
      sidebar.appendChild(dot);
      this.tocDots.push(dot);
    });
  }

  setupListeners() {
    // Keyboard events
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        this.nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'Backspace' || e.key === 'PageUp') {
        e.preventDefault();
        this.prevSlide();
      } else if (e.key === 'Home') {
        this.goToSlide(0);
      } else if (e.key === 'End') {
        this.goToSlide(this.slides.length - 1);
      }
    });

    // Arrow Buttons
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => this.prevSlide());
    }
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => this.nextSlide());
    }

    // Touch events for mobile swiping
    document.addEventListener('touchstart', (e) => {
      this.touchStartX = e.changedTouches[0].screenX;
      this.touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].screenX;
      const touchEndY = e.changedTouches[0].screenY;
      this.handleSwipe(touchEndX, touchEndY);
    }, { passive: true });

    // Handle hash change events (e.g. browser history back/forward)
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#slide-')) {
        const index = parseInt(hash.replace('#slide-', ''), 10) - 1;
        if (!isNaN(index) && index !== this.currentSlideIndex && index >= 0 && index < this.slides.length) {
          this.goToSlide(index, false);
        }
      }
    });
  }

  handleSwipe(endX, endY) {
    const diffX = endX - this.touchStartX;
    const diffY = endY - this.touchStartY;
    
    // Check if horizontal swipe was larger than vertical swipe
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (Math.abs(diffX) > this.swipeThreshold) {
        if (diffX > 0) {
          // Swiped right -> go to previous slide
          this.prevSlide();
        } else {
          // Swiped left -> go to next slide
          this.nextSlide();
        }
      }
    }
  }

  nextSlide() {
    const currentSlide = this.slides[this.currentSlideIndex];
    const unrevealedFragments = Array.from(currentSlide.querySelectorAll('.fragment:not(.visible)'));
    
    if (unrevealedFragments.length > 0) {
      const nextFragment = unrevealedFragments[0];
      nextFragment.classList.add('visible');
      
      // Auto-focus active card accordion if it's a problem-tab or uniqueness-tab
      if (nextFragment.classList.contains('problem-tab') || nextFragment.classList.contains('uniqueness-tab')) {
        const selector = nextFragment.classList.contains('problem-tab') ? '.problem-tab' : '.uniqueness-tab';
        const siblingCards = currentSlide.querySelectorAll(selector);
        siblingCards.forEach(c => c.classList.remove('active'));
        nextFragment.classList.add('active');
      }
      return; // Stop slide transition
    }

    if (this.currentSlideIndex < this.slides.length - 1) {
      this.goToSlide(this.currentSlideIndex + 1);
    }
  }

  prevSlide() {
    const currentSlide = this.slides[this.currentSlideIndex];
    const revealedFragments = Array.from(currentSlide.querySelectorAll('.fragment.visible'));
    
    if (revealedFragments.length > 0) {
      const lastFragment = revealedFragments[revealedFragments.length - 1];
      lastFragment.classList.remove('visible');
      lastFragment.classList.remove('active');
      
      // Set the previous visible fragment as active (accordion focus)
      if (revealedFragments.length > 1) {
        const prevFragment = revealedFragments[revealedFragments.length - 2];
        if (prevFragment.classList.contains('problem-tab') || prevFragment.classList.contains('uniqueness-tab')) {
          const selector = prevFragment.classList.contains('problem-tab') ? '.problem-tab' : '.uniqueness-tab';
          const siblingCards = currentSlide.querySelectorAll(selector);
          siblingCards.forEach(c => c.classList.remove('active'));
          prevFragment.classList.add('active');
        }
      }
      return; // Stop slide transition
    }

    if (this.currentSlideIndex > 0) {
      this.goToSlide(this.currentSlideIndex - 1);
    }
  }

  goToSlide(index, updateHash = true) {
    const prevIndex = this.currentSlideIndex;
    this.currentSlideIndex = index;
    
    // Update active slide visibility
    this.slides.forEach((slide, i) => {
      slide.classList.remove('active', 'previous-slide', 'slide-exit-next', 'slide-exit-prev');
      
      if (i === index) {
        slide.classList.add('active');
      } else if (i < index) {
        slide.classList.add('previous-slide');
      }
    });

    // Handle slide fragment resets when moving between slides
    if (prevIndex !== index) {
      const targetSlide = this.slides[index];
      const targetFragments = Array.from(targetSlide.querySelectorAll('.fragment'));
      if (targetFragments.length > 0) {
        if (index > prevIndex) {
          // Entering slide moving forward -> Hide all fragments
          targetFragments.forEach(f => {
            f.classList.remove('visible');
            f.classList.remove('active');
          });
        } else {
          // Entering slide moving backward -> Make all fragments visible
          targetFragments.forEach(f => {
            f.classList.add('visible');
            f.classList.remove('active');
          });
          // Focus the last card
          const lastFragment = targetFragments[targetFragments.length - 1];
          if (lastFragment.classList.contains('problem-tab') || lastFragment.classList.contains('uniqueness-tab')) {
            const selector = lastFragment.classList.contains('problem-tab') ? '.problem-tab' : '.uniqueness-tab';
            targetSlide.querySelectorAll(selector).forEach(c => c.classList.remove('active'));
            lastFragment.classList.add('active');
          }
        }
      }
    }
    
    // Add page transition directions
    if (prevIndex !== index) {
      const direction = index > prevIndex ? 'next' : 'prev';
      if (direction === 'next') {
        this.slides[prevIndex].classList.add('slide-exit-next');
      } else {
        this.slides[prevIndex].classList.add('slide-exit-prev');
      }
    }

    // Update Sidebar dots
    this.tocDots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });

    // Update Progress bar
    if (this.progressBarFill) {
      const percentage = (index / (this.slides.length - 1)) * 100;
      this.progressBarFill.style.width = `${percentage}%`;
    }

    // Update Counter HUD
    if (this.counterCurrent) {
      this.counterCurrent.textContent = this.padZero(index + 1);
    }

    // Update Window hash (silently or triggering hashchange)
    if (updateHash) {
      window.location.hash = `slide-${index + 1}`;
    }

    // Trigger page-specific animations
    this.triggerSlideAnimations(index);
  }

  triggerSlideAnimations(slideIndex) {
    // Custom event to notify app.js / animations.js that slide changed
    const event = new CustomEvent('slideChanged', {
      detail: { slideIndex: slideIndex, slideEl: this.slides[slideIndex] }
    });
    document.dispatchEvent(event);
  }

  padZero(num) {
    return num < 10 ? `0${num}` : num.toString();
  }
}

// Instantiate presentation controller when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  window.presentation = new PresentationController();
});
