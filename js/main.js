document.addEventListener('DOMContentLoaded', function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -------------------------------------------
     mobile nav — hamburger toggle
     ------------------------------------------- */
  var navToggle = document.querySelector('.nav-toggle');
  var navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    function closeNav() {
      navToggle.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('open');
    }
    function openNav() {
      navToggle.setAttribute('aria-expanded', 'true');
      navLinks.classList.add('open');
    }
    navToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = navToggle.getAttribute('aria-expanded') === 'true';
      if (isOpen) closeNav(); else openNav();
    });
    navLinks.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeNav);
    });
    document.addEventListener('click', function (e) {
      if (!navLinks.contains(e.target) && !navToggle.contains(e.target)) closeNav();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 760) closeNav();
    });
  }

  /* -------------------------------------------
     gallery masonry — reads left-to-right, top-to-
     bottom (matching source order), packed tight to
     each photo's real height instead of a fixed grid
     ------------------------------------------- */
  var galleries = document.querySelectorAll('.gallery');
  galleries.forEach(function (gallery) {
    var galleryFrames = Array.prototype.slice.call(gallery.querySelectorAll('.frame'));
    if (!galleryFrames.length) return;

    function layout() {
      var galleryStyle = window.getComputedStyle(gallery);
      var padLeft = parseFloat(galleryStyle.paddingLeft) || 0;
      var padRight = parseFloat(galleryStyle.paddingRight) || 0;
      var padTop = parseFloat(galleryStyle.paddingTop) || 0;
      var padBottom = parseFloat(galleryStyle.paddingBottom) || 0;

      var viewportWidth = window.innerWidth;
      var columns = viewportWidth <= 900 ? 2 : 3;
      var gap = viewportWidth <= 560 ? 8 : 14;
      var colWidth = (gallery.clientWidth - padLeft - padRight - gap * (columns - 1)) / columns;
      var colHeights = new Array(columns).fill(0);

      galleryFrames.forEach(function (frame, i) {
        var img = frame.querySelector('img');
        var w = parseFloat(img.getAttribute('width')) || img.naturalWidth || 1;
        var h = parseFloat(img.getAttribute('height')) || img.naturalHeight || 1;
        var col = i % columns;
        var top = colHeights[col];
        var frameHeight = colWidth * (h / w);

        frame.style.position = 'absolute';
        frame.style.margin = '0';
        frame.style.width = colWidth + 'px';
        frame.style.left = (padLeft + col * (colWidth + gap)) + 'px';
        frame.style.top = (padTop + top) + 'px';

        colHeights[col] = top + frameHeight + gap;
      });

      gallery.style.height = (padTop + Math.max.apply(null, colHeights) - gap + padBottom) + 'px';
    }

    layout();
    var resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(layout, 150);
    });
  });

  /* -------------------------------------------
     lightbox — click any .frame photo to enlarge,
     with left/right arrows (click or keyboard) to
     browse to the next/previous photo
     ------------------------------------------- */
  var frames = Array.prototype.slice.call(document.querySelectorAll('.frame'));
  if (frames.length) {
    var overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.innerHTML =
      '<button class="lightbox-close" aria-label="close">&times;</button>' +
      '<button class="lightbox-nav-btn lightbox-prev" aria-label="previous photo">&lsaquo;</button>' +
      '<button class="lightbox-nav-btn lightbox-next" aria-label="next photo">&rsaquo;</button>' +
      '<img class="lightbox-img" alt="">' +
      '<span class="lightbox-caption mono"></span>';
    document.body.appendChild(overlay);

    var lightboxImg = overlay.querySelector('.lightbox-img');
    var lightboxCaption = overlay.querySelector('.lightbox-caption');
    var closeBtn = overlay.querySelector('.lightbox-close');
    var lbPrevBtn = overlay.querySelector('.lightbox-prev');
    var lbNextBtn = overlay.querySelector('.lightbox-next');
    var lastFocused = null;
    var currentIndex = 0;

    function showFrame(index) {
      currentIndex = (index + frames.length) % frames.length;
      var frame = frames[currentIndex];
      var img = frame.querySelector('img');
      var tagEl = frame.querySelector('.frame-tag');
      lightboxImg.src = img.src;
      lightboxCaption.textContent = tagEl ? tagEl.textContent : '';
    }
    function openLightbox(index) {
      lastFocused = document.activeElement;
      showFrame(index);
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    }
    function closeLightbox() {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      lightboxImg.src = '';
      if (lastFocused) lastFocused.focus();
    }

    frames.forEach(function (frame, i) {
      var img = frame.querySelector('img');
      if (!img) return;
      frame.setAttribute('tabindex', '0');
      frame.setAttribute('role', 'button');
      frame.setAttribute('aria-label', 'view larger photo');
      frame.addEventListener('click', function () { openLightbox(i); });
      frame.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(i);
        }
      });
    });

    lbPrevBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      showFrame(currentIndex - 1);
    });
    lbNextBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      showFrame(currentIndex + 1);
    });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay || e.target === closeBtn) closeLightbox();
    });
    document.addEventListener('keydown', function (e) {
      if (!overlay.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') showFrame(currentIndex + 1);
      if (e.key === 'ArrowLeft') showFrame(currentIndex - 1);
    });
  }

  /* -------------------------------------------
     slideshow — homepage hero preview + testimonials
     ------------------------------------------- */
  var slideshows = Array.prototype.slice.call(document.querySelectorAll('.slideshow'));
  slideshows.forEach(function (slideshow) {
    var slides = Array.prototype.slice.call(slideshow.querySelectorAll('.slide'));
    var dots = Array.prototype.slice.call(slideshow.querySelectorAll('.slide-dot'));
    var current = slides.findIndex(function (s) { return s.classList.contains('active'); });
    if (current < 0) current = 0;
    var timer = null;

    function goTo(index) {
      slides[current].classList.remove('active');
      if (dots[current]) dots[current].classList.remove('active');
      current = (index + slides.length) % slides.length;
      slides[current].classList.add('active');
      if (dots[current]) dots[current].classList.add('active');
    }
    function next() { goTo(current + 1); }
    function prev() { goTo(current - 1); }
    function startTimer() {
      if (reduceMotion) return;
      timer = setInterval(next, 5000);
    }
    function resetTimer() {
      clearInterval(timer);
      startTimer();
    }

    var nextBtn = slideshow.querySelector('.slide-next');
    var prevBtn = slideshow.querySelector('.slide-prev');
    if (nextBtn) nextBtn.addEventListener('click', function () { next(); resetTimer(); });
    if (prevBtn) prevBtn.addEventListener('click', function () { prev(); resetTimer(); });
    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () { goTo(i); resetTimer(); });
    });
    slideshow.addEventListener('mouseenter', function () { clearInterval(timer); });
    slideshow.addEventListener('mouseleave', startTimer);

    startTimer();
  });

  /* -------------------------------------------
     contact form — submits to web3forms via fetch
     ------------------------------------------- */
  var contactForm = document.querySelector('.contact-form');
  if (contactForm) {
    var statusEl = contactForm.querySelector('.form-status');
    var submitBtn = contactForm.querySelector('button[type="submit"]');

    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      submitBtn.disabled = true;
      submitBtn.textContent = 'sending...';

      fetch(contactForm.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(contactForm)
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data.success) {
            contactForm.reset();
            statusEl.textContent = "thanks — that's on its way. i'll follow up soon.";
            statusEl.classList.remove('error');
          } else {
            statusEl.textContent = 'something went wrong — mind emailing sarvesh@bysarveshgupta.com instead?';
            statusEl.classList.add('error');
          }
          statusEl.hidden = false;
        })
        .catch(function () {
          statusEl.textContent = 'something went wrong — mind emailing sarvesh@bysarveshgupta.com instead?';
          statusEl.classList.add('error');
          statusEl.hidden = false;
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = 'send request';
        });
    });
  }
});
