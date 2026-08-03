/* ==========================================================================
   TRAPPANYAKI LLC — GSAP & Interactive Vanilla JavaScript
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const navbar = document.getElementById('navbar');
  const mobileToggle = document.getElementById('mobile-toggle');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  // 1. GSAP Animations & ScrollTrigger Registration
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    if (typeof SplitText !== 'undefined') gsap.registerPlugin(SplitText);

    // Split the hero title into characters for a stronger reveal (falls back to a plain tween if SplitText didn't load)
    const heroTitleSplit = (typeof SplitText !== 'undefined')
      ? new SplitText('.hero-title', { type: 'chars' })
      : null;

    // Initial Hero Entrance Animation
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    heroTl
      .from('.stamp-logo', { rotation: -180, scale: 0.5, opacity: 0, duration: 1.2 })
      .from('.badge-tag', { y: -25, opacity: 0, duration: 0.8 }, '-=0.8')
      .from(
        heroTitleSplit ? heroTitleSplit.chars : '.hero-title',
        heroTitleSplit
          ? { y: 45, opacity: 0, duration: 0.8, stagger: 0.025 }
          : { y: 45, opacity: 0, duration: 1 },
        '-=0.6'
      )
      .from('.hero-tagline', { y: 25, opacity: 0, duration: 0.8 }, '-=0.7')
      .from('.hero-description', { y: 25, opacity: 0, duration: 0.8 }, '-=0.6')
      .from('.hero-actions .btn', { y: 20, opacity: 0, stagger: 0.2, duration: 0.8 }, '-=0.6');

    // Section Headers Reveal Animation
    gsap.utils.toArray('.section-header').forEach(header => {
      gsap.from(header.children, {
        scrollTrigger: {
          trigger: header,
          start: 'top 85%'
        },
        y: 35,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power2.out'
      });
    });

    // 3-Column Menu Grid Staggered Reveal Animation
    gsap.from('.menu-card', {
      scrollTrigger: {
        trigger: '.menu-grid',
        start: 'top 85%',
        toggleActions: 'play none none reverse'
      },
      y: 65,
      opacity: 0,
      duration: 0.9,
      stagger: 0.25,
      ease: 'power3.out'
    });

    // Gallery Grid Staggered Reveal Animation
    gsap.from('.gallery-item', {
      scrollTrigger: {
        trigger: '.gallery-grid',
        start: 'top 85%',
        toggleActions: 'play none none reverse'
      },
      y: 50,
      opacity: 0,
      duration: 0.8,
      stagger: 0.12,
      ease: 'power3.out'
    });

    // Catering Box Reveal Animation
    gsap.from('.catering-box', {
      scrollTrigger: {
        trigger: '.catering-section',
        start: 'top 80%'
      },
      scale: 0.94,
      opacity: 0,
      duration: 1,
      ease: 'power3.out'
    });

    gsap.from('.catering-features li', {
      scrollTrigger: {
        trigger: '.catering-features',
        start: 'top 85%'
      },
      y: 20,
      opacity: 0,
      duration: 0.6,
      stagger: 0.15,
      ease: 'power2.out'
    });

    // Footprint Section Reveal
    gsap.from('.footprint-card', {
      scrollTrigger: {
        trigger: '.footprint-section',
        start: 'top 85%'
      },
      y: 40,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out'
    });

    // Mouse-driven 3D tilt on the stamp logo + menu card images (desktop/pointer-fine only)
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      const tiltTargets = [
        document.querySelector('.stamp-logo'),
        ...document.querySelectorAll('.card-image-wrapper'),
        ...document.querySelectorAll('.gallery-item'),
        ...document.querySelectorAll('.catering-image-wrapper')
      ].filter(Boolean);

      tiltTargets.forEach(el => {
        el.addEventListener('mousemove', (e) => {
          const rect = el.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width - 0.5;
          const y = (e.clientY - rect.top) / rect.height - 0.5;
          gsap.to(el, {
            rotationY: x * 18,
            rotationX: -y * 18,
            transformPerspective: 600,
            duration: 0.5,
            ease: 'power2.out'
          });
        });
        el.addEventListener('mouseleave', () => {
          gsap.to(el, { rotationX: 0, rotationY: 0, duration: 0.6, ease: 'power2.out' });
        });
      });
    }
  }

  // 2. Mobile Navigation Toggle
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      mobileToggle.classList.toggle('active');
      const isExpanded = navMenu.classList.contains('active');
      mobileToggle.setAttribute('aria-expanded', isExpanded);
    });
  }

  // Close mobile menu when a link is clicked
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
        mobileToggle.classList.remove('active');
        mobileToggle.setAttribute('aria-expanded', false);
      }
    });
  });

  // 3. Sticky Navbar Scroll State
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // 4. Smooth Scrolling for Navigation Links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        const headerOffset = 70;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // 5. Scroll Active State Highlight for Navigation Links
  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;

    sections.forEach(current => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 100;
      const sectionId = current.getAttribute('id');

      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          }
        });
      }
    });
  });
});
