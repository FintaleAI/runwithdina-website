/* ==========================================================================
   RunWithDina - Main JavaScript
   Accessible interactions for the Vadodara redesign.
   ========================================================================== */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduceMotion = prefersReducedMotion.matches;

  const pageLoader = document.getElementById('pageLoader');
  if (pageLoader) {
    const hideLoader = () => pageLoader.classList.add('hidden');

    window.addEventListener('load', () => {
      if (reduceMotion) {
        hideLoader();
        return;
      }

      window.setTimeout(hideLoader, 250);
    });

    // Fallback: hide loader after 2.5s even if load event hasn't fired (e.g. CDN timeout)
    window.setTimeout(hideLoader, reduceMotion ? 0 : 2500);

    // Extra fallback for file:// protocol where load event may never fire due to blocked CDN resources
    document.addEventListener('DOMContentLoaded', () => {
      window.setTimeout(hideLoader, reduceMotion ? 0 : 1500);
    });
  }

  const header = document.getElementById('header');
  if (header) {
    const onScroll = () => {
      header.classList.toggle('scrolled', window.scrollY > 40);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  const menuToggle = document.getElementById('menuToggle');
  const mobileNav = document.getElementById('mobileNav');

  if (menuToggle && mobileNav) {
    const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    let previouslyFocused = null;

    const closeMenu = () => {
      menuToggle.classList.remove('active');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open navigation menu');
      mobileNav.classList.remove('open');
      mobileNav.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('nav-open');

      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
    };

    const openMenu = () => {
      previouslyFocused = document.activeElement;
      menuToggle.classList.add('active');
      menuToggle.setAttribute('aria-expanded', 'true');
      menuToggle.setAttribute('aria-label', 'Close navigation menu');
      mobileNav.classList.add('open');
      mobileNav.setAttribute('aria-hidden', 'false');
      document.body.classList.add('nav-open');

      const firstFocusable = mobileNav.querySelector(focusableSelector);
      if (firstFocusable) {
        firstFocusable.focus();
      }
    };

    menuToggle.addEventListener('click', () => {
      if (mobileNav.classList.contains('open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    const mobileNavClose = document.getElementById('mobileNavClose');
    if (mobileNavClose) {
      mobileNavClose.addEventListener('click', closeMenu);
    }

    mobileNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        closeMenu();
      });
    });

    mobileNav.addEventListener('click', (event) => {
      if (event.target === mobileNav) {
        closeMenu();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (!mobileNav.classList.contains('open')) {
        return;
      }

      if (event.key === 'Escape') {
        closeMenu();
        return;
      }

      if (event.key === 'Tab') {
        const focusable = Array.from(mobileNav.querySelectorAll(focusableSelector));
        if (focusable.length === 0) {
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
  }

  const scrollTopBtn = document.getElementById('scrollTop');
  if (scrollTopBtn) {
    const onScroll = () => {
      scrollTopBtn.classList.toggle('visible', window.scrollY > 400);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  const revealElements = document.querySelectorAll('.reveal');
  if (revealElements.length > 0) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealElements.forEach((element) => element.classList.add('visible'));
    } else {
      const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
      });

      revealElements.forEach((element) => revealObserver.observe(element));
    }
  }

  const counters = document.querySelectorAll('[data-count]');
  if (counters.length > 0) {
    const setCounterValue = (element) => {
      const target = Number.parseInt(element.getAttribute('data-count') || '0', 10);
      element.textContent = target.toLocaleString() + '+';
    };

    const animateCounter = (element) => {
      if (element.dataset.counted) return;
      element.dataset.counted = '1';
      const target = Number.parseInt(element.getAttribute('data-count') || '0', 10);
      const duration = 1800;
      const startTime = performance.now();

      const tick = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(eased * target);
        element.textContent = current.toLocaleString();

        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          element.textContent = target.toLocaleString() + '+';
        }
      };

      requestAnimationFrame(tick);
    };

    // Check if the element's parent .reveal is actually visible before animating
    const isRevealVisible = (el) => {
      const reveal = el.closest('.reveal');
      return !reveal || reveal.classList.contains('visible');
    };

    if (reduceMotion || !('IntersectionObserver' in window)) {
      counters.forEach(setCounterValue);
    } else {
      const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const element = entry.target;
          if (element.dataset.counted) { counterObserver.unobserve(element); return; }

          // If parent reveal is not yet visible, wait for it
          if (!isRevealVisible(element)) {
            const reveal = element.closest('.reveal');
            if (reveal) {
              const mo = new MutationObserver(() => {
                if (reveal.classList.contains('visible')) {
                  mo.disconnect();
                  setTimeout(() => animateCounter(element), 150);
                  counterObserver.unobserve(element);
                }
              });
              mo.observe(reveal, { attributes: true, attributeFilter: ['class'] });
              // Fallback: if MutationObserver doesn't fire within 3s, animate anyway
              setTimeout(() => { mo.disconnect(); if (!element.dataset.counted) animateCounter(element); counterObserver.unobserve(element); }, 3000);
              return;
            }
          }

          animateCounter(element);
          counterObserver.unobserve(element);
        });
      }, { threshold: 0.2 });

      counters.forEach((element) => counterObserver.observe(element));
    }
  }

  const track = document.getElementById('testimonialsTrack');
  const prevBtn = document.getElementById('sliderPrev');
  const nextBtn = document.getElementById('sliderNext');

  if (track && prevBtn && nextBtn) {
    let currentIndex = 0;

    const getVisibleCount = () => (window.innerWidth >= 768 ? 2 : 1);

    const getCardWidth = () => {
      const card = track.querySelector('.testimonial-card');
      if (!card) {
        return 0;
      }

      const style = getComputedStyle(track);
      const gap = Number.parseInt(style.gap || '24', 10) || 24;
      return card.offsetWidth + gap;
    };

    const getMaxIndex = () => {
      const cards = track.querySelectorAll('.testimonial-card');
      return Math.max(0, cards.length - getVisibleCount());
    };

    const updateButtons = () => {
      prevBtn.disabled = currentIndex === 0;
      nextBtn.disabled = currentIndex >= getMaxIndex();
    };

    const updateSlider = () => {
      const offset = currentIndex * getCardWidth();
      track.style.transform = 'translateX(-' + offset + 'px)';
      updateButtons();
    };

    prevBtn.addEventListener('click', () => {
      currentIndex = Math.max(0, currentIndex - 1);
      updateSlider();
    });

    nextBtn.addEventListener('click', () => {
      currentIndex = Math.min(getMaxIndex(), currentIndex + 1);
      updateSlider();
    });

    let resizeTimer;
    window.addEventListener('resize', () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        currentIndex = Math.min(currentIndex, getMaxIndex());
        updateSlider();
      }, 160);
    });

    updateSlider();
  }

  const contactForm = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');
  const formNext = document.getElementById('formNext');

  const setFormStatus = (state, message) => {
    if (!formStatus) {
      return;
    }

    formStatus.className = state ? 'form-status is-' + state : 'form-status';
    formStatus.textContent = message;
  };

  if (formNext) {
    const baseUrl = window.location.href.replace(/contact\.html(?:#.*)?(?:\?.*)?$/i, '');
    formNext.value = baseUrl + 'contact-success.html';
  }

  if (contactForm) {
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const defaultBtnHtml = submitBtn ? submitBtn.innerHTML : '';

    contactForm.addEventListener('submit', async (event) => {
      if (!contactForm.checkValidity()) {
        event.preventDefault();
        setFormStatus('error', 'Please complete the required fields before sending your message.');
        contactForm.reportValidity();

        const firstInvalid = contactForm.querySelector(':invalid');
        if (firstInvalid && typeof firstInvalid.focus === 'function') {
          firstInvalid.focus();
        }
        return;
      }

      if (!window.fetch) {
        setFormStatus('sending', 'Sending your message...');
        return;
      }

      event.preventDefault();

      if (submitBtn) {
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Sending...';
        submitBtn.disabled = true;
      }

      setFormStatus('sending', 'Sending your message to Dina...');

      try {
        const response = await fetch(contactForm.action, {
          method: 'POST',
          body: new FormData(contactForm),
          headers: {
            Accept: 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Request failed');
        }

        setFormStatus('success', 'Thanks. Your message is on its way. Redirecting to the confirmation page...');
        contactForm.reset();

        window.setTimeout(() => {
          window.location.href = 'contact-success.html';
        }, 900);
      } catch (error) {
        if (submitBtn) {
          submitBtn.innerHTML = defaultBtnHtml;
          submitBtn.disabled = false;
        }

        setFormStatus('error', 'We could not send that right now. Please try again or message Dina on WhatsApp.');
      }
    });
  }
})();

