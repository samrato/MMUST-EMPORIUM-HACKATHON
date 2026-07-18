/* 
 * AFYAROOT Healthcare Interactive Presentation
 * Main Application Bootstrapper (app.js)
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('%c AFYAROOT Presentation Loaded ', 'background: #00bf63; color: #fff; font-weight: bold; padding: 4px 8px; border-radius: 4px;');
  
  // Verify scripts are loaded correctly
  if (window.presentation) {
    console.log('Navigation Controller: Active');
  } else {
    console.warn('Navigation Controller: Not found. Initializing fallback.');
  }

  if (window.slideAnimations) {
    console.log('Animations Controller: Active');
  } else {
    console.warn('Animations Controller: Not found. Initializing fallback.');
  }

  // Handle Lazy Loading of Slide Images (e.g. background slides, cropped team assets)
  initializeLazyLoading();
});

function initializeLazyLoading() {
  const lazyImages = document.querySelectorAll('img[data-src]');
  
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const image = entry.target;
          image.src = image.getAttribute('data-src');
          image.removeAttribute('data-src');
          imageObserver.unobserve(image);
        }
      });
    });
    
    lazyImages.forEach(image => imageObserver.observe(image));
  } else {
    // Fallback for browsers without IntersectionObserver
    lazyImages.forEach(image => {
      image.src = image.getAttribute('data-src');
      image.removeAttribute('data-src');
    });
  }
}
