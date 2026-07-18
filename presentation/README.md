# AFYAROOT Healthcare – Interactive Presentation Deck

A premium, interactive, and offline-compatible HTML/CSS/JavaScript slide presentation representing the **AFYAROOT Healthcare** pitch deck. Engineered to feel like an Apple Keynote or high-end startup pitch.

---

## 🌟 Key Features

1. **Rich Aesthetics**: Deep dark-mode gradients, glassmorphism, soft glow highlights, and floating backdrop elements.
2. **Keyboard Navigation**:
   - `Right Arrow` / `Space` / `Page Down` to go forward.
   - `Left Arrow` / `Backspace` / `Page Up` to go backward.
   - `Home` to jump to the cover.
   - `End` to jump to the final slide.
3. **Interactive Demos**:
   - **Slide 5**: A real-time smartphone simulator displaying localized Swahili AI SMS diagnostic conversations.
   - **Slide 6**: A sequential pipeline workflow that animates connection lines and highlights milestones automatically.
   - **Slide 10**: An animated SVG donut chart detailing financial budget distribution.
4. **Touch Swipe Support**: Seamless horizontal swipe navigation for mobile, iPad, and tablet touchscreens.
5. **Table of Contents (TOC) Sidebar**: Hoverable navigation dots on the left sidebar with tooltips displaying slide titles for direct access.
6. **Fully Offline-Ready**: Replaces external fonts and icon libraries with optimized inline SVGs and standard system fallback styles, ensuring it launches instantly from disk.

---

## 📁 Directory Structure

```text
presentation/
│
├── index.html          # Core structural markup containing the 13 slides
├── css/
│   ├── style.css       # Core layout styling, theme variables, and layouts
│   ├── animations.css  # CSS transitions, entry triggers, keyframes, and animations
│   └── responsive.css  # Mobile and tablet viewport scaling & columns
├── js/
│   ├── app.js          # Core bootstrap, utility logging, and lazy loading
│   ├── navigation.js   # State management, keyboard, touch, and progress bar
│   └── animations.js   # Interactive JS phone simulation & pipeline cycles
├── assets/
│   ├── images/
│   │   ├── surgeon.png       # Extracted surgeon cover visual
│   │   ├── team_polycap.png  # Extracted CEO photo
│   │   ├── team_amos.png     # Extracted Public Health Officer photo
│   │   ├── team_timothy.png  # Extracted Web Developer photo
│   │   ├── team_willinton.png# Extracted Lead Developer (Willington Juma) photo
│   │   └── team_ikram.png    # Extracted Advisor photo
│   ├── icons/          # Reserved folder for customized vector assets
│   └── fonts/          # Reserved folder for local offline font hosting
└── README.md           # Documentation
```

---

## 🚀 How to Run

1. Open the `/presentation` folder on your system.
2. Double-click `index.html` to open the presentation in any modern web browser (Chrome, Safari, Firefox, Edge).
3. Press `F11` (or Cmd+Ctrl+F on macOS) to enter full-screen mode for the best viewing experience.

---

## 🛠️ Slide Sequence Guide

1. **Cover**: Cover page introducing AFYAROOT Healthcare and Tech Innovators.
2. **Our Team**: Meet the founders with interactive avatar cards.
3. **Introduction**: Setting the background and the critical need for rural guidance.
4. **Problem Statement**: Details the primary friction points (connectivity, dialects, delays, hospital crowding).
5. **The Solution**: An interactive SMS demonstration of our AI system.
6. **How It Works**: A step-by-step pipeline from symptom input to dispatch.
7. **Unique Value Proposition**: What sets us apart (GSM offline capacity, localized routing).
8. **Business Model**: Quad-canvas representation of partners, customers, channels, and revenue.
9. **Sustainable Goals**: Alignment details with SDG 3, 4, 9, and 10.
10. **Cost Structure**: Budget breakdown of the KSH 1M total ask.
11. **Impact**: Visualized projection of health outcomes and mortality improvements.
12. **Come Join Us!**: Call to Action to help revolutionize rural medicine.
13. **Thank You**: Concluding slide with website and direct support contact links.
