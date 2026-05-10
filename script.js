// Mobile menu
const menuBtn = document.getElementById('menuBtn');
const navLinks = document.getElementById('navLinks');

menuBtn.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('active');
    menuBtn.classList.toggle('active', isOpen);
});

navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        menuBtn.classList.remove('active');
    });
});

// Navbar shadow on scroll
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// Scroll-spy
const sections = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        if (window.scrollY >= section.offsetTop - 120) current = section.id;
    });
    navAnchors.forEach(a => {
        a.classList.toggle('active-link', a.getAttribute('href') === '#' + current);
    });
}, { passive: true });

// Preview tabs
document.querySelectorAll('.preview-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.preview-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.preview-pane').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const pane = document.getElementById('preview-' + tab.dataset.tab);
        pane.classList.add('active');
        pane.classList.add('visible');
    });
});

// Scroll reveal with stagger
const revealEls = document.querySelectorAll('.f-card, .step, .cta-box, .download-content, .nora-feat, .update-card, .gallery-item');
// Add stagger classes to grouped items
document.querySelectorAll('.f-card, .nora-feat, .gallery-item').forEach((el, i) => {
    const group = el.closest('.features-grid, .nora-features, .gallery-track');
    if (group) {
        const siblings = Array.from(group.children);
        const idx = siblings.indexOf(el);
        el.classList.add('reveal', 'stagger-' + Math.min(idx, 5));
    }
});
revealEls.forEach(el => { if (!el.classList.contains('reveal')) el.classList.add('reveal'); });

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.08 });

revealEls.forEach(el => revealObserver.observe(el));

// Initial pane
document.querySelector('.preview-pane.active')?.classList.add('visible');

// Gallery drag-to-scroll + mouse wheel
const galleryTrack = document.querySelector('.gallery-track');
if (galleryTrack) {
    let isDown = false, startX, scrollLeft, moved = false;

    galleryTrack.addEventListener('mousedown', e => {
        isDown = true;
        moved = false;
        galleryTrack.style.cursor = 'grabbing';
        startX = e.pageX;
        scrollLeft = galleryTrack.scrollLeft;
    });

    window.addEventListener('mouseup', () => {
        if (isDown) {
            isDown = false;
            galleryTrack.style.cursor = 'grab';
        }
    });

    galleryTrack.addEventListener('mousemove', e => {
        if (!isDown) return;
        e.preventDefault();
        const dx = e.pageX - startX;
        if (Math.abs(dx) > 3) moved = true;
        galleryTrack.scrollLeft = scrollLeft - dx;
    });

    // Prevent click on gallery items after drag
    galleryTrack.addEventListener('click', e => {
        if (moved) e.preventDefault();
    }, true);

    // Mouse wheel → horizontal scroll
    galleryTrack.addEventListener('wheel', e => {
        e.preventDefault();
        const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
        galleryTrack.scrollLeft += delta;
    }, { passive: false });

    // Arrow keys when gallery is hovered
    let galleryHovered = false;
    galleryTrack.addEventListener('mouseenter', () => { galleryHovered = true; });
    galleryTrack.addEventListener('mouseleave', () => { galleryHovered = false; });
    document.addEventListener('keydown', e => {
        if (!galleryHovered) return;
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            e.preventDefault();
            const dir = e.key === 'ArrowRight' ? 1 : -1;
            galleryTrack.scrollBy({ left: dir * 240, behavior: 'smooth' });
        }
    });
}

// Dark mode
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');

const sunSVG = `<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`;
const moonSVG = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`;

function setTheme(dark) {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    themeIcon.innerHTML = dark ? sunSVG : moonSVG;
    localStorage.setItem('planora-theme', dark ? 'dark' : 'light');
}

const savedTheme = localStorage.getItem('planora-theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
setTheme(savedTheme ? savedTheme === 'dark' : prefersDark);

themeToggle.addEventListener('click', () => {
    setTheme(document.documentElement.getAttribute('data-theme') !== 'dark');
});
