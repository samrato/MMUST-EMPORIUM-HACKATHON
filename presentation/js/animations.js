/* 
 * AFYAROOT Healthcare Interactive Presentation
 * Slide-Specific Custom Interactive Animations (animations.js)
 */

class SlideAnimations {
  constructor() {
    this.chatInterval = null;
    this.workflowInterval = null;
    this.init();
    this.setupProblemCardClicks();
    this.setupUniquenessCardClicks();
  }

  init() {
    // Listen for slide change events dispatched by navigation.js
    document.addEventListener('slideChanged', (e) => {
      const { slideIndex, slideEl } = e.detail;
      
      // Stop any ongoing animation loops
      this.clearAllIntervals();
      
      // Trigger slide-specific animations
      if (slideIndex === 4) {
        // Solution Slide -> Phone SMS Demo
        this.runPhoneDemo();
      } else if (slideIndex === 5) {
        // How It Works Slide -> Interactive Workflow Timeline
        this.runWorkflowTimeline();
      } else if (slideIndex === 9) {
        // Cost Structure Slide -> Animate budget donut slices
        this.animateCostDonut();
      }
    });
  }

  setupProblemCardClicks() {
    const tabs = document.querySelectorAll('.problem-tab');
    const spotlightIcon = document.querySelector('.problem-spotlight .spotlight-icon');
    const spotlightTitle = document.querySelector('.problem-spotlight .spotlight-title');
    const spotlightDesc = document.querySelector('.problem-spotlight .spotlight-desc');
    
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
    const tabs = document.querySelectorAll('.uniqueness-tab');
    const spotlightIcon = document.querySelector('.uniqueness-spotlight .spotlight-icon');
    const spotlightTitle = document.querySelector('.uniqueness-spotlight .spotlight-title');
    const spotlightDesc = document.querySelector('.uniqueness-spotlight .spotlight-desc');
    
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
   * SLIDE 6: HOW IT WORKS PIPELINE WORKFLOW
   * -------------------------------------------------------- */
  runWorkflowTimeline() {
    const nodes = document.querySelectorAll('.workflow-node');
    const lineFill = document.querySelector('.workflow-line-progress');
    if (nodes.length === 0) return;
    
    // Reset all nodes
    nodes.forEach(node => node.classList.remove('active'));
    if (lineFill) lineFill.style.width = '0%';
    
    let activeNodeIdx = 0;
    const totalNodes = nodes.length;
    
    const stepWorkflow = () => {
      // Deactivate all nodes up to current
      nodes.forEach((node, i) => {
        node.classList.toggle('active', i === activeNodeIdx);
      });
      
      // Update line progress percentage
      if (lineFill) {
        const progressPercentage = (activeNodeIdx / (totalNodes - 1)) * 100;
        lineFill.style.width = `${progressPercentage}%`;
      }
      
      activeNodeIdx++;
      
      if (activeNodeIdx >= totalNodes) {
        // Complete the pipeline and hold, then reset after 6 seconds
        this.workflowInterval = setTimeout(() => {
          activeNodeIdx = 0;
          stepWorkflow();
        }, 6000);
      } else {
        this.workflowInterval = setTimeout(stepWorkflow, 2000);
      }
    };
    
    // Start workflow sequence
    stepWorkflow();
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
}

// Instantiate animations controller
document.addEventListener('DOMContentLoaded', () => {
  window.slideAnimations = new SlideAnimations();
});
