/**
 * Tri Hamdani Portfolio Client Script
 * Ultra-Modern Vibe Coding & Content Creator Experience
 */

let portfolioData = null;
let activeSkillFilter = 'all';
let activeGalleryFilter = 'all';
let currentPhotoTab = 'formal';

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

async function initApp() {
  await loadPortfolioData();
  setupEventListeners();
  setupScrollSpy();
}

// Fetch data from local backend API or static JSON on Vercel
async function loadPortfolioData() {
  try {
    let res = await fetch('/api/data');
    if (!res.ok) {
      res = await fetch('/data/portfolio.json');
    }
    const json = await res.json();
    portfolioData = json.data || json;
    if (portfolioData && (portfolioData.profile || portfolioData.skills)) {
      renderAll();
    }
  } catch (err) {
    console.warn('Initial load error, trying static fallback:', err);
    try {
      const resFallback = await fetch('/data/portfolio.json');
      const jsonFallback = await resFallback.json();
      portfolioData = jsonFallback.data || jsonFallback;
      if (portfolioData) renderAll();
    } catch (e) {
      console.error('All data sources failed:', e);
      showToast('Gagal memuat data portofolio', true);
    }
  }
}

// Render all components
function renderAll() {
  if (!portfolioData) return;

  renderNavigation();
  renderHero();
  renderAbout();
  renderSkills();
  renderProjects();
  renderTimeline();
  renderGallery();
}

// 1. Navigation Rendering
function renderNavigation() {
  const p = portfolioData.profile || {};
  const navAvatar = document.getElementById('navAvatar');
  const navBrandName = document.getElementById('navBrandName');
  const navBrandRole = document.getElementById('navBrandRole');

  if (navAvatar && p.avatar) navAvatar.src = p.avatar;
  if (navBrandName && p.name) navBrandName.textContent = p.name;
  if (navBrandRole && p.role) navBrandRole.textContent = p.role;
}

// 2. Hero Section Rendering
function renderHero() {
  const p = portfolioData.profile || {};

  // Badge & Taglines
  setTxt('heroBadge', (p.badge || 'Vibe Coding • AI Prototyper').replace(/^[^\w\s]+/, '').trim());
  setTxt('taglinePrefix', p.taglinePrefix || 'Dua tangan, satu laptop,');
  setTxt('taglineHighlight', p.taglineHighlight || 'Skill Vibe Coding & Desain');
  setTxt('taglineSuffix', p.taglineSuffix || 'Bikin Ide Gila Jadi Nyata!');
  setTxt('heroSubheadline', p.subheadline || '');

  // Profile Card Inside Board
  const heroAvatar = document.getElementById('heroAvatar');
  if (heroAvatar && p.avatar) heroAvatar.src = p.avatar;

  setTxt('profileName', p.name || 'TRI HAMDANI');
  setTxt('profileRole', p.role || 'Graphic Designer | Vibe Coder');
  setTxt('profileHeadline', p.headline || '');

  // Contacts
  const phoneFormatted = p.phone || '+62 857-3585-1739';
  setTxt('contactPhone', phoneFormatted);
  const waLink = document.getElementById('waLink');
  if (waLink) {
    const cleanPhone = (p.whatsapp || p.phone || '6285735851739').replace(/[^0-9]/g, '');
    waLink.href = `https://wa.me/${cleanPhone}`;
  }

  setTxt('contactEmail', p.email || 'hamdan.luthansa@gmail.com');
  const mailLink = document.getElementById('mailLink');
  if (mailLink && p.email) mailLink.href = `mailto:${p.email}`;

  setTxt('contactIg', p.instagram || 'dnny.roam404');
  const igLink = document.getElementById('igLink');
  if (igLink && p.instagram) {
    const cleanIg = p.instagram.replace('@', '');
    igLink.href = `https://instagram.com/${cleanIg}`;
  }

  // Stat Panel (Vertical Stack from Reference)
  const statsContainer = document.getElementById('statsContainer');
  if (statsContainer && p.stats && p.stats.length) {
    statsContainer.innerHTML = p.stats.map(s => `
      <div class="metric-vertical-item">
        <span class="metric-huge-number">${escapeHtml(s.value)}</span>
        <span class="metric-caption">${escapeHtml(s.label)}</span>
      </div>
    `).join('');
  }
}

// 3. About Section Rendering
function renderAbout() {
  const p = portfolioData.profile || {};
  setTxt('aboutLongText', p.aboutLong || '');
  setTxt('profileQuote', p.quote ? `"${p.quote}"` : '');
}

// Flat 1-Color Vector Icons in Neon Lime (#B8FF36)
function getFlatSkillIcon(skill) {
  const name = ((skill.name || '') + ' ' + (skill.category || '')).toLowerCase();

  if (name.includes('vibe') || name.includes('code') || name.includes('tech') || name.includes('ai') || name.includes('prompt')) {
    return `<svg class="skill-flat-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
  }
  if (name.includes('desain') || name.includes('brand') || name.includes('grafis') || name.includes('design')) {
    return `<svg class="skill-flat-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>`;
  }
  if (name.includes('video') || name.includes('motion') || name.includes('kinetic')) {
    return `<svg class="skill-flat-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>`;
  }
  if (name.includes('creator') || name.includes('content') || name.includes('story')) {
    return `<svg class="skill-flat-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>`;
  }
  if (name.includes('foto') || name.includes('photo') || name.includes('retouch')) {
    return `<svg class="skill-flat-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`;
  }
  if (name.includes('host') || name.includes('live') || name.includes('sales') || name.includes('comm')) {
    return `<svg class="skill-flat-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`;
  }
  if (name.includes('vape') || name.includes('vapor')) {
    return `<svg class="skill-flat-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>`;
  }
  return `<svg class="skill-flat-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
}

function getFlatOrgIcon(org) {
  const t = ((org.title || '') + ' ' + (org.badge || '')).toLowerCase();
  if (t.includes('talent') || t.includes('prestasi') || t.includes('juara') || t.includes('award')) {
    return `<svg class="flat-lime-icon-inline" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>`;
  }
  if (t.includes('komunitas') || t.includes('relasi') || t.includes('community')) {
    return `<svg class="flat-lime-icon-inline" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
  }
  return `<svg class="flat-lime-icon-inline" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`;
}

// 4. Skills & Vibe Coding Rendering
function renderSkills() {
  const grid = document.getElementById('skillsGrid');
  if (!grid || !portfolioData.skills) return;

  const filtered = activeSkillFilter === 'all' 
    ? portfolioData.skills 
    : portfolioData.skills.filter(s => s.category === activeSkillFilter);

  grid.innerHTML = filtered.map(s => `
    <div class="skill-card ${s.highlight ? 'highlight' : ''}">
      <div class="skill-card-top">
        <span class="skill-icon-box">${getFlatSkillIcon(s)}</span>
        <span class="skill-badge">${escapeHtml(s.level || s.category)}</span>
      </div>
      <h4 class="skill-name">${escapeHtml(s.name)}</h4>
      <p class="skill-desc">${escapeHtml(s.desc || '')}</p>
    </div>
  `).join('');
}

// 5. Projects Showcase Rendering
function renderProjects() {
  const grid = document.getElementById('projectsGrid');
  if (!grid || !portfolioData.projects) return;

  grid.innerHTML = portfolioData.projects.map(proj => {
    const techBadges = (proj.tech || []).map(t => `<span class="tech-badge">${escapeHtml(t)}</span>`).join('');
    
    return `
      <div class="project-card" data-proj-id="${proj.id}">
        <div class="project-media-thumb">
          <img src="${escapeHtml(proj.image || '/assets/projects/showreel_p01.png')}" alt="${escapeHtml(proj.title)}" loading="lazy">
          <span class="project-tag-overlay">${escapeHtml(proj.tag || proj.category)}</span>
          <span class="project-badge-overlay">${escapeHtml(proj.badge || 'Featured')}</span>
        </div>
        <div class="project-info-body">
          <h3 class="project-card-title">${escapeHtml(proj.title)}</h3>
          <p class="project-summary">${escapeHtml(proj.summary || '')}</p>
          <div class="project-tech-row">
            ${techBadges}
          </div>
          <div class="project-action-buttons">
            <button class="btn-proj-primary" onclick="openProjectModal('${proj.id}')">
              Lihat Proyek & Demo ↗
            </button>
            ${proj.liveUrl && proj.liveUrl !== '#' ? `
              <a href="${proj.liveUrl}" target="_blank" class="btn-proj-detail" title="Buka Tab Baru">
                Buka Web ↗
              </a>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// 6. Timeline (Experience & Education) Rendering
function renderTimeline() {
  // Experience
  const expTrack = document.getElementById('experienceTimeline');
  if (expTrack && portfolioData.experience) {
    expTrack.innerHTML = portfolioData.experience.map(e => `
      <div class="timeline-item">
        <span class="timeline-period-badge">${escapeHtml(e.period)}</span>
        <h4 class="timeline-role">${escapeHtml(e.role)}</h4>
        <div class="timeline-company">${escapeHtml(e.company)} ${e.badge ? `• <span style="color:var(--text-muted);font-weight:500">${escapeHtml(e.badge)}</span>` : ''}</div>
        <p class="timeline-desc">${escapeHtml(e.description || '')}</p>
      </div>
    `).join('');
  }

  // Education
  const eduList = document.getElementById('educationList');
  if (eduList && portfolioData.education) {
    eduList.innerHTML = portfolioData.education.map(edu => `
      <div class="edu-card">
        <div class="edu-year">${escapeHtml(edu.period)}</div>
        <h5 class="edu-degree">${escapeHtml(edu.degree)}</h5>
        <div class="edu-institution">${escapeHtml(edu.institution)}</div>
        <p class="edu-notes">${escapeHtml(edu.description || edu.notes || '')}</p>
      </div>
    `).join('');
  }

  // Organizations
  const orgList = document.getElementById('organizationsList');
  if (orgList && portfolioData.organizations) {
    orgList.innerHTML = portfolioData.organizations.map(org => `
      <div class="org-card">
        <div class="org-year">${escapeHtml(org.period)} • ${escapeHtml(org.badge || '')}</div>
        <h5 class="org-title">${getFlatOrgIcon(org)} ${escapeHtml(org.title)}</h5>
        <p class="org-desc">${escapeHtml(org.description || org.desc || '')}</p>
      </div>
    `).join('');
  }
}

let galleryPage = 1;
const GALLERY_PAGE_SIZE = 16;

// 7. Gallery Rendering
function renderGallery() {
  const grid = document.getElementById('galleryGrid');
  const loadMoreWrap = document.getElementById('galleryLoadMoreWrap');
  const counterBadge = document.getElementById('galleryCounterBadge');
  if (!grid || !portfolioData.gallery) return;

  const filtered = activeGalleryFilter === 'all'
    ? portfolioData.gallery
    : portfolioData.gallery.filter(g => g.category === activeGalleryFilter);

  if (!filtered || filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: rgba(14, 21, 17, 0.4); border: 1px dashed var(--border-subtle); border-radius: var(--radius-md);">
        <p style="color: var(--text-secondary); font-size: 0.95rem; margin-bottom: 14px;">Belum ada karya dalam kategori ini.</p>
        <button type="button" class="btn-action-lime" onclick="document.getElementById('openQuickUploadBtn').click()" style="margin: 0 auto; display: inline-flex;">+ Upload Karya Baru</button>
      </div>
    `;
    if (loadMoreWrap) loadMoreWrap.style.display = 'none';
    return;
  }

  const visibleCount = galleryPage * GALLERY_PAGE_SIZE;
  const visibleItems = filtered.slice(0, visibleCount);

  grid.innerHTML = visibleItems.map(item => `
    <div class="gallery-card" onclick="openGalleryItemModal('${item.id}')">
      <div class="gallery-thumb-wrap">
        <img src="${escapeHtml(item.thumb || item.image)}" alt="${escapeHtml(item.title)}" loading="lazy" decoding="async">
        <span class="gallery-category-pill">${escapeHtml(item.category || 'Portofolio')}</span>
      </div>
      <div class="gallery-caption">
        <h4 class="gallery-item-title">${escapeHtml(item.title)}</h4>
        <p class="gallery-item-desc">${escapeHtml(item.desc || '')}</p>
      </div>
    </div>
  `).join('');

  if (loadMoreWrap) {
    if (visibleCount < filtered.length) {
      loadMoreWrap.style.display = 'block';
      if (counterBadge) {
        counterBadge.textContent = `${visibleItems.length} dari ${filtered.length}`;
      }
    } else {
      loadMoreWrap.style.display = 'none';
    }
  }
}

// Setup Event Listeners
function setupEventListeners() {
  // Skills filter buttons
  document.querySelectorAll('.skills-filter-tabs .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.skills-filter-tabs .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeSkillFilter = btn.getAttribute('data-skill-cat');
      renderSkills();
    });
  });

  // Gallery filter buttons
  document.querySelectorAll('.gal-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.gal-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeGalleryFilter = btn.getAttribute('data-filter');
      galleryPage = 1;
      renderGallery();
    });
  });

  // Load More Gallery Button
  const btnLoadMoreGallery = document.getElementById('btnLoadMoreGallery');
  if (btnLoadMoreGallery) {
    btnLoadMoreGallery.addEventListener('click', () => {
      galleryPage++;
      renderGallery();
    });
  }

  // Upload Modals
  const openUploadButtons = ['openQuickUploadBtn', 'uploadFromHeroBtn', 'btnAddNewProject', 'openUploadGalleryBtn'];
  openUploadButtons.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', () => openUploadModal(id === 'btnAddNewProject'));
  });

  const closeUploadModalBtn = document.getElementById('closeUploadModalBtn');
  const cancelUploadBtn = document.getElementById('cancelUploadBtn');
  if (closeUploadModalBtn) closeUploadModalBtn.addEventListener('click', closeUploadModal);
  if (cancelUploadBtn) cancelUploadBtn.addEventListener('click', closeUploadModal);

  // File Upload Dropzone
  setupDropzone();

  // Project Modal Close
  const closeProjectModalBtn = document.getElementById('closeProjectModalBtn');
  if (closeProjectModalBtn) closeProjectModalBtn.addEventListener('click', closeProjectModal);



  // Project checkbox toggle in upload form
  const isProjCheckbox = document.getElementById('uploadIsProject');
  const projectExtraFields = document.getElementById('projectExtraFields');
  if (isProjCheckbox && projectExtraFields) {
    isProjCheckbox.addEventListener('change', (e) => {
      projectExtraFields.style.display = e.target.checked ? 'flex' : 'none';
    });
  }

  // Close modals on clicking backdrop or Escape key
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('vibe-modal-backdrop')) {
      e.target.style.display = 'none';
      const vid = e.target.querySelector('video');
      if (vid) vid.pause();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.vibe-modal-backdrop').forEach(m => {
        m.style.display = 'none';
        const vid = m.querySelector('video');
        if (vid) vid.pause();
      });
    }
  });

  // Upload Form Submit
  const quickUploadForm = document.getElementById('quickUploadForm');
  if (quickUploadForm) {
    quickUploadForm.addEventListener('submit', handleUploadSubmit);
  }
}

// Dropzone Handling
function setupDropzone() {
  const fileInput = document.getElementById('portfolioFileInput');
  const dropzoneBox = document.getElementById('dropzoneBox');
  const dropzonePrompt = document.getElementById('dropzonePrompt');
  const dropzonePreview = document.getElementById('dropzonePreview');
  const uploadPreviewImg = document.getElementById('uploadPreviewImg');
  const previewFilename = document.getElementById('previewFilename');
  const clearFileBtn = document.getElementById('clearFileBtn');

  if (!fileInput || !dropzoneBox) return;

  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      previewFilename.textContent = file.name;
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          uploadPreviewImg.src = e.target.result;
          uploadPreviewImg.style.display = 'block';
        };
        reader.readAsDataURL(file);
      } else {
        uploadPreviewImg.style.display = 'none';
      }

      dropzonePrompt.style.display = 'none';
      dropzonePreview.style.display = 'flex';
    }
  });

  if (clearFileBtn) {
    clearFileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.value = '';
      dropzonePrompt.style.display = 'block';
      dropzonePreview.style.display = 'none';
    });
  }
}

// Upload Submission
async function handleUploadSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = document.getElementById('submitUploadBtn');
  const origBtnText = submitBtn.innerHTML;

  try {
    submitBtn.innerHTML = '<span>Mengunggah...</span>';
    submitBtn.disabled = true;

    const formData = new FormData(form);

    const res = await fetch('/api/upload-portfolio', {
      method: 'POST',
      body: formData
    });

    const json = await res.json();
    if (json.success) {
      showToast('Portofolio berhasil diunggah & disimpan!');
      closeUploadModal();
      form.reset();
      document.getElementById('dropzonePrompt').style.display = 'block';
      document.getElementById('dropzonePreview').style.display = 'none';
      // Refresh data
      await loadPortfolioData();
    } else {
      showToast(json.message || 'Gagal mengunggah portofolio', true);
    }
  } catch (err) {
    console.error('Error uploading portfolio:', err);
    showToast('Terjadi kesalahan koneksi server', true);
  } finally {
    submitBtn.innerHTML = origBtnText;
    submitBtn.disabled = false;
  }
}

// Modal open/close helpers
function openUploadModal(isProjectDefault = false) {
  const modal = document.getElementById('uploadModal');
  const isProjCheckbox = document.getElementById('uploadIsProject');
  const projectExtraFields = document.getElementById('projectExtraFields');
  
  if (isProjCheckbox) {
    isProjCheckbox.checked = isProjectDefault;
    if (projectExtraFields) projectExtraFields.style.display = isProjectDefault ? 'flex' : 'none';
  }
  
  if (modal) modal.style.display = 'flex';
}

function closeUploadModal() {
  const modal = document.getElementById('uploadModal');
  if (modal) modal.style.display = 'none';
}

// Project Modal Trigger
window.openProjectModal = function(projId) {
  if (!portfolioData || !portfolioData.projects) return;
  const proj = portfolioData.projects.find(p => p.id === projId);
  if (!proj) return;

  const modal = document.getElementById('projectModal');
  setTxt('modalProjTag', proj.tag || proj.category);
  setTxt('modalProjTitle', proj.title);
  setTxt('modalProjDesc', proj.details || proj.summary || '');

  // Tech tags
  const modalProjTech = document.getElementById('modalProjTech');
  if (modalProjTech && proj.tech) {
    modalProjTech.innerHTML = proj.tech.map(t => `<span class="tech-badge">${escapeHtml(t)}</span>`).join('');
  }

  // Media Area: Check if Video, Interactive Live Demo, or Image
  const mediaContainer = document.getElementById('modalMediaContainer');
  if (mediaContainer) {
    if (proj.videoUrl) {
      mediaContainer.innerHTML = `
        <video controls autoplay muted loop style="max-height:460px;width:100%;">
          <source src="${escapeHtml(proj.videoUrl)}" type="video/mp4">
          Browser tidak mendukung pemutar video.
        </video>
      `;
    } else if (proj.liveUrl && proj.liveUrl.startsWith('/demos/')) {
      mediaContainer.innerHTML = `
        <div style="width:100%;">
          <div style="background:#0b130e;padding:10px 14px;border-bottom:1px solid var(--border-subtle);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span class="pulse-lime"></span>
              <span style="font-size:0.75rem;color:var(--lime-primary);font-weight:700;">Tampilan Perangkat &amp; Live Demo</span>
            </div>
            <div style="display:flex;gap:8px;">
              <button type="button" id="toggleModalViewBtn" style="background:rgba(184,255,54,0.12);color:var(--lime-bright);border:1px solid var(--border-glow);border-radius:4px;padding:3px 10px;font-size:0.72rem;cursor:pointer;font-weight:700;">Beralih ke Live Interactive ⚡</button>
              <a href="${proj.liveUrl}" target="_blank" style="font-size:0.72rem;color:var(--lime-pale);text-decoration:underline;align-self:center;">Tab Baru ↗</a>
            </div>
          </div>
          <div id="modalMediaDisplay">
            <img src="${escapeHtml(proj.image)}" alt="${escapeHtml(proj.title)}" style="max-height:460px;width:100%;object-fit:cover;display:block;">
          </div>
        </div>
      `;
      const toggleBtn = document.getElementById('toggleModalViewBtn');
      const displayBox = document.getElementById('modalMediaDisplay');
      let showingLive = false;
      if (toggleBtn && displayBox) {
        toggleBtn.addEventListener('click', () => {
          showingLive = !showingLive;
          if (showingLive) {
            displayBox.innerHTML = `<iframe src="${proj.liveUrl}" style="width:100%;height:450px;border:none;"></iframe>`;
            toggleBtn.textContent = 'Lihat Foto Perangkat 🖼';
          } else {
            displayBox.innerHTML = `<img src="${escapeHtml(proj.image)}" alt="${escapeHtml(proj.title)}" style="max-height:460px;width:100%;object-fit:cover;display:block;">`;
            toggleBtn.textContent = 'Beralih ke Live Interactive ⚡';
          }
        });
      }
    } else {
      mediaContainer.innerHTML = `
        <img src="${escapeHtml(proj.image)}" alt="${escapeHtml(proj.title)}" style="max-height:460px;object-fit:contain;">
      `;
    }
  }

  // Modal Links
  const linksBox = document.getElementById('modalProjLinks');
  if (linksBox) {
    let linksHtml = '';
    if (proj.liveUrl && proj.liveUrl !== '#') {
      linksHtml += `<a href="${proj.liveUrl}" target="_blank" class="btn-cta-lime"><span>Buka Aplikasi Langsung ↗</span></a>`;
    }
    if (proj.videoUrl) {
      linksHtml += `<a href="${proj.videoUrl}" download class="btn-cta-ghost"><span>Unduh Video File</span></a>`;
    }
    linksBox.innerHTML = linksHtml;
  }

  modal.style.display = 'flex';
};

function closeProjectModal() {
  const modal = document.getElementById('projectModal');
  if (modal) {
    // Stop video playback if playing
    const vid = modal.querySelector('video');
    if (vid) vid.pause();
    modal.style.display = 'none';
  }
}

// Lightbox for gallery items
window.openGalleryItemModal = function(itemId) {
  if (!portfolioData || !portfolioData.gallery) return;
  const item = portfolioData.gallery.find(g => g.id === itemId);
  if (!item) return;

  const modal = document.getElementById('projectModal');
  setTxt('modalProjTag', item.category || 'PORTOFOLIO');
  setTxt('modalProjTitle', item.title);
  setTxt('modalProjDesc', item.desc || '');

  const modalProjTech = document.getElementById('modalProjTech');
  if (modalProjTech) modalProjTech.innerHTML = '';

  const mediaContainer = document.getElementById('modalMediaContainer');
  if (mediaContainer) {
    mediaContainer.innerHTML = `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" style="max-height:500px;object-fit:contain;">`;
  }

  const linksBox = document.getElementById('modalProjLinks');
  if (linksBox) {
    linksBox.innerHTML = `<a href="${item.image}" target="_blank" class="btn-cta-lime"><span>Buka Gambar Ukuran Penuh ↗</span></a>`;
  }

  modal.style.display = 'flex';
};

// Scroll Spy for Nav Pills
function setupScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link-pill');

  window.addEventListener('scroll', () => {
    let current = '';
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      const sectionHeight = section.offsetHeight;
      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('data-nav') === current) {
        link.classList.add('active');
      }
    });
  });
}

// Toast helper
function showToast(message, isError = false) {
  const toast = document.getElementById('vibeToast');
  const msgEl = document.getElementById('toastMessage');
  if (!toast || !msgEl) return;

  msgEl.textContent = message;
  toast.style.background = isError ? '#ff4d4f' : 'var(--lime-primary)';
  toast.style.color = isError ? '#ffffff' : 'var(--text-dark)';
  toast.style.display = 'flex';

  setTimeout(() => {
    toast.style.display = 'none';
  }, 3500);
}

// String helpers
function setTxt(id, txt) {
  const el = document.getElementById(id);
  if (el) el.textContent = txt;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
