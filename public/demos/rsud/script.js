/**
 * RSUD dr. Soedono Madiun - Landing Page Scripts
 * Interactive behaviors: Mobile navigation, Tabs, Search & Filters, Modal
 */

document.addEventListener('DOMContentLoaded', () => {
  // Mobile Nav Toggle
  const menuToggle = document.getElementById('menuToggle');
  const mainNav = document.getElementById('mainNav');

  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => {
      mainNav.classList.toggle('active');
    });

    // Close mobile nav when clicking a link
    const navLinks = mainNav.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        mainNav.classList.remove('active');
      });
    });
  }

  // Active Navbar link on scroll
  const sections = document.querySelectorAll('section[id], header[id]');
  window.addEventListener('scroll', () => {
    let current = '';
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
      const sectionHeight = section.offsetHeight;
      const sectionTop = section.offsetTop - 120;
      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });

    // Back to top visibility
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
      if (scrollY > 400) {
        backToTop.style.display = 'inline-flex';
      } else {
        backToTop.style.display = 'none';
      }
    }
  });
});

/**
 * Tab Switcher for Alur Pendaftaran
 */
function switchTab(tabId, buttonElement) {
  // Deactivate all tabs
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => btn.classList.remove('active'));

  const tabPanels = document.querySelectorAll('.tab-panel');
  tabPanels.forEach(panel => panel.classList.remove('active'));

  // Activate selected tab
  buttonElement.classList.add('active');
  const activePanel = document.getElementById(`tab-${tabId}`);
  if (activePanel) {
    activePanel.classList.add('active');
  }
}

/**
 * Filter Doctors by Specialty Category
 */
let currentSpecialtyFilter = 'all';

function setSpecialtyFilter(specialty, buttonElement) {
  currentSpecialtyFilter = specialty;
  
  // Update active pill button
  const pills = document.querySelectorAll('.filter-pill');
  pills.forEach(p => p.classList.remove('active'));
  buttonElement.classList.add('active');

  filterDoctors();
}

/**
 * Filter Doctors by Search Keyword & Active Category
 */
function filterDoctors() {
  const searchInput = document.getElementById('doctorSearch');
  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const doctorCards = document.querySelectorAll('.doctor-card');

  doctorCards.forEach(card => {
    const cardSpecialty = card.getAttribute('data-specialty');
    const doctorName = card.querySelector('.doctor-name')?.innerText.toLowerCase() || '';
    const doctorSub = card.querySelector('.doctor-sub')?.innerText.toLowerCase() || '';
    const badgeText = card.querySelector('.doc-badge')?.innerText.toLowerCase() || '';

    const matchesCategory = (currentSpecialtyFilter === 'all' || cardSpecialty === currentSpecialtyFilter);
    const matchesSearch = query === '' || 
      doctorName.includes(query) || 
      doctorSub.includes(query) || 
      badgeText.includes(query);

    if (matchesCategory && matchesSearch) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });
}

/**
 * Book Doctor Action Simulation
 */
function bookDoctor(doctorName, polyclinic) {
  openModal('daftarModal');
}

/**
 * Modal Handling
 */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
}

// Close modal when clicking outside modal box
window.addEventListener('click', (e) => {
  const modals = document.querySelectorAll('.modal-overlay');
  modals.forEach(modal => {
    if (e.target === modal) {
      modal.classList.remove('active');
      document.body.style.overflow = 'auto';
    }
  });
});
