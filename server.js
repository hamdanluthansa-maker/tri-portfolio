const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3300;

// Security Defense 1: Disable fingerprinting
app.disable('x-powered-by');

// Security Defense 2: HTTP Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// Security Defense 3: Rate Limiting (Anti-DoS & Anti-Bruteforce)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 menit
const MAX_REQUESTS = 250; // max 250 request per menit per IP

app.use((req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();
  let record = rateLimitMap.get(ip);
  if (!record || now - record.start > RATE_LIMIT_WINDOW) {
    record = { count: 1, start: now };
    rateLimitMap.set(ip, record);
  } else {
    record.count++;
  }
  if (record.count > MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Aktivitas tidak wajar terdeteksi. Silakan coba kembali dalam 1 menit.'
    });
  }
  next();
});

// Bersihkan memori rate limiter setiap 5 menit
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now - record.start > RATE_LIMIT_WINDOW) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Directories
const DATA_FILE = path.join(__dirname, 'data', 'portfolio.json');
const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Security Defense 4: Whitelist File Upload & Sanitize Filenames
const ALLOWED_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.mp4', '.pdf']);
const ALLOWED_MIMES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
  'video/mp4', 'application/pdf'
]);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${Date.now()}_${safeName}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max per file
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTS.has(ext) && ALLOWED_MIMES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipe file ditolak! Hanya gambar (JPG, PNG, WebP, SVG), Video MP4, atau PDF.'));
    }
  }
});

// Helper to read and write data safely
function getPortfolioData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading portfolio.json:', err);
  }
  return {};
}

function savePortfolioData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving portfolio.json:', err);
    return false;
  }
}

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

// Serve external portfolio assets & high-performance cached thumbnails
const PORTFOLIO_EXTERNAL_DIR = 'E:\\2021\\POROTOFOLIO 2021';
const THUMB_CACHE_DIR = path.join(__dirname, 'public', 'cache', 'thumbs');
if (!fs.existsSync(THUMB_CACHE_DIR)) {
  fs.mkdirSync(THUMB_CACHE_DIR, { recursive: true });
}

// Security Defense 5: Anti-Path Traversal Check
function isSafePathSegment(segment) {
  if (!segment || typeof segment !== 'string') return false;
  if (segment.includes('\0') || segment.includes('..') || segment.includes('/') || segment.includes('\\')) {
    return false;
  }
  return true;
}

// 1. High-performance thumbnail route (Always active, serves cached WebP from public/cache/thumbs)
app.get('/portfolio-thumbs/:folder/:filename', async (req, res) => {
  try {
    const folder = decodeURIComponent(req.params.folder);
    const rawFilename = decodeURIComponent(req.params.filename);

    if (!isSafePathSegment(folder) || !isSafePathSegment(rawFilename)) {
      return res.status(400).send('Bad Request: Invalid path parameters');
    }

    const filenameWebp = rawFilename.endsWith('.webp') ? rawFilename : rawFilename + '.webp';
    const cachedFile = path.join(THUMB_CACHE_DIR, folder, filenameWebp);

    if (fs.existsSync(cachedFile)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('Content-Type', 'image/webp');
      return res.sendFile(cachedFile);
    }

    // If cached thumbnail not found but external directory is connected, generate it on-the-fly
    if (fs.existsSync(PORTFOLIO_EXTERNAL_DIR)) {
      const srcFile = path.join(PORTFOLIO_EXTERNAL_DIR, folder, rawFilename);
      if (fs.existsSync(srcFile)) {
        const destFolder = path.join(THUMB_CACHE_DIR, folder);
        if (!fs.existsSync(destFolder)) fs.mkdirSync(destFolder, { recursive: true });

        const sharp = require('sharp');
        await sharp(srcFile)
          .resize({ width: 500, height: 500, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80, effort: 3 })
          .toFile(cachedFile);

        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.setHeader('Content-Type', 'image/webp');
        return res.sendFile(cachedFile);
      }
    }

    return res.status(404).send('Thumbnail not found');
  } catch (err) {
    console.error('Thumb error:', err);
    res.status(500).send('Error loading thumbnail');
  }
});

// 2. High-resolution portfolio asset route (serves original if available, falls back to WebP preview)
app.get('/portfolio-assets/:folder/:filename', (req, res) => {
  try {
    const folder = decodeURIComponent(req.params.folder);
    const rawFilename = decodeURIComponent(req.params.filename);

    if (!isSafePathSegment(folder) || !isSafePathSegment(rawFilename)) {
      return res.status(400).send('Bad Request: Invalid path parameters');
    }

    if (fs.existsSync(PORTFOLIO_EXTERNAL_DIR)) {
      const srcFile = path.join(PORTFOLIO_EXTERNAL_DIR, folder, rawFilename);
      if (fs.existsSync(srcFile)) {
        return res.sendFile(srcFile);
      }
    }

    // Graceful offline fallback to cached WebP so images never appear broken
    const filenameWebp = rawFilename.endsWith('.webp') ? rawFilename : rawFilename + '.webp';
    const cachedFile = path.join(THUMB_CACHE_DIR, folder, filenameWebp);
    if (fs.existsSync(cachedFile)) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Content-Type', 'image/webp');
      return res.sendFile(cachedFile);
    }

    return res.status(404).send('Asset not found');
  } catch (err) {
    console.error('Asset error:', err);
    res.status(500).send('Error loading asset');
  }
});

// API Routes
app.get('/api/data', (req, res) => {
  const data = getPortfolioData();
  res.json({ success: true, data });
});

app.post('/api/profile', (req, res) => {
  const data = getPortfolioData();
  data.profile = { ...data.profile, ...req.body };
  savePortfolioData(data);
  res.json({ success: true, message: 'Profil berhasil diperbarui', data: data.profile });
});

// Skills CRUD
app.post('/api/skills', (req, res) => {
  const data = getPortfolioData();
  const skill = req.body;
  if (!data.skills) data.skills = [];

  if (skill.id) {
    const idx = data.skills.findIndex(s => s.id === skill.id);
    if (idx !== -1) {
      data.skills[idx] = { ...data.skills[idx], ...skill };
    } else {
      data.skills.push(skill);
    }
  } else {
    skill.id = 'sk-' + Date.now();
    data.skills.push(skill);
  }
  savePortfolioData(data);
  res.json({ success: true, message: 'Skill tersimpan', skills: data.skills });
});

app.delete('/api/skills/:id', (req, res) => {
  const data = getPortfolioData();
  data.skills = (data.skills || []).filter(s => s.id !== req.params.id);
  savePortfolioData(data);
  res.json({ success: true, message: 'Skill dihapus', skills: data.skills });
});

// Experience CRUD
app.post('/api/experience', (req, res) => {
  const data = getPortfolioData();
  const exp = req.body;
  if (!data.experience) data.experience = [];

  if (exp.id) {
    const idx = data.experience.findIndex(e => e.id === exp.id);
    if (idx !== -1) {
      data.experience[idx] = { ...data.experience[idx], ...exp };
    } else {
      data.experience.unshift(exp);
    }
  } else {
    exp.id = 'exp-' + Date.now();
    data.experience.unshift(exp);
  }
  savePortfolioData(data);
  res.json({ success: true, message: 'Pengalaman kerja tersimpan', experience: data.experience });
});

app.delete('/api/experience/:id', (req, res) => {
  const data = getPortfolioData();
  data.experience = (data.experience || []).filter(e => e.id !== req.params.id);
  savePortfolioData(data);
  res.json({ success: true, message: 'Pengalaman kerja dihapus', experience: data.experience });
});

// Education CRUD
app.post('/api/education', (req, res) => {
  const data = getPortfolioData();
  const edu = req.body;
  if (!data.education) data.education = [];

  if (edu.id) {
    const idx = data.education.findIndex(e => e.id === edu.id);
    if (idx !== -1) {
      data.education[idx] = { ...data.education[idx], ...edu };
    } else {
      data.education.unshift(edu);
    }
  } else {
    edu.id = 'edu-' + Date.now();
    data.education.unshift(edu);
  }
  savePortfolioData(data);
  res.json({ success: true, message: 'Pendidikan tersimpan', education: data.education });
});

app.delete('/api/education/:id', (req, res) => {
  const data = getPortfolioData();
  data.education = (data.education || []).filter(e => e.id !== req.params.id);
  savePortfolioData(data);
  res.json({ success: true, message: 'Pendidikan dihapus', education: data.education });
});

// Projects CRUD
app.post('/api/projects', (req, res) => {
  const data = getPortfolioData();
  const proj = req.body;
  if (!data.projects) data.projects = [];

  if (typeof proj.tech === 'string') {
    proj.tech = proj.tech.split(',').map(t => t.trim()).filter(Boolean);
  }

  if (proj.id) {
    const idx = data.projects.findIndex(p => p.id === proj.id);
    if (idx !== -1) {
      data.projects[idx] = { ...data.projects[idx], ...proj };
    } else {
      data.projects.unshift(proj);
    }
  } else {
    proj.id = 'proj-' + Date.now();
    data.projects.unshift(proj);
  }
  savePortfolioData(data);
  res.json({ success: true, message: 'Project berhasil disimpan', projects: data.projects });
});

app.delete('/api/projects/:id', (req, res) => {
  const data = getPortfolioData();
  data.projects = (data.projects || []).filter(p => p.id !== req.params.id);
  savePortfolioData(data);
  res.json({ success: true, message: 'Project berhasil dihapus', projects: data.projects });
});

// Gallery CRUD
app.post('/api/gallery', (req, res) => {
  const data = getPortfolioData();
  const item = req.body;
  if (!data.gallery) data.gallery = [];

  if (item.id) {
    const idx = data.gallery.findIndex(g => g.id === item.id);
    if (idx !== -1) {
      data.gallery[idx] = { ...data.gallery[idx], ...item };
    } else {
      data.gallery.unshift(item);
    }
  } else {
    item.id = 'gal-' + Date.now();
    data.gallery.unshift(item);
  }
  savePortfolioData(data);
  res.json({ success: true, message: 'Item galeri portofolio disimpan', gallery: data.gallery });
});

app.delete('/api/gallery/:id', (req, res) => {
  const data = getPortfolioData();
  data.gallery = (data.gallery || []).filter(g => g.id !== req.params.id);
  savePortfolioData(data);
  res.json({ success: true, message: 'Item galeri portofolio dihapus', gallery: data.gallery });
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Tidak ada file yang diunggah' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    success: true,
    message: 'File berhasil diunggah!',
    url: fileUrl,
    filename: req.file.filename,
    mimetype: req.file.mimetype,
    size: req.file.size
  });
});

// Combined direct upload & add portfolio
app.post('/api/upload-portfolio', upload.single('file'), (req, res) => {
  try {
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : req.body.imageUrl || '';
    const { title, category, desc, isProject, tech, liveUrl } = req.body;

    const data = getPortfolioData();

    if (isProject === 'true' || isProject === true) {
      const newProj = {
        id: 'proj-' + Date.now(),
        title: title || 'New Vibe Project',
        category: category || 'Vibe Coding & Web App',
        tag: `⚡ ${category || 'Project'}`,
        featured: true,
        badge: 'Karya Terbaru',
        tech: tech ? tech.split(',').map(s => s.trim()) : ['Vibe Coding', 'AI Prototyping'],
        image: fileUrl || '/assets/projects/showreel_p01.png',
        summary: desc || 'Project baru buatan Tri Hamdani',
        liveUrl: liveUrl || '#',
        githubUrl: '#',
        details: desc || ''
      };
      data.projects = data.projects || [];
      data.projects.unshift(newProj);
    }

    // Always add to gallery portfolio as well
    const newGal = {
      id: 'gal-' + Date.now(),
      title: title || 'Karya Portofolio',
      category: category || 'Portofolio',
      image: fileUrl || '/assets/projects/showreel_p01.png',
      desc: desc || ''
    };
    data.gallery = data.gallery || [];
    data.gallery.unshift(newGal);

    savePortfolioData(data);
    res.json({
      success: true,
      message: 'Portofolio baru berhasil diunggah dan disimpan!',
      gallery: data.gallery,
      projects: data.projects
    });
  } catch (err) {
    console.error('Error in upload-portfolio:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Export & Import backup
app.get('/api/export', (req, res) => {
  const data = getPortfolioData();
  res.setHeader('Content-disposition', 'attachment; filename=tri-hamdani-portfolio-backup.json');
  res.setHeader('Content-type', 'application/json');
  res.send(JSON.stringify(data, null, 2));
});

app.post('/api/import', (req, res) => {
  try {
    const incomingData = req.body;
    if (!incomingData || !incomingData.profile) {
      return res.status(400).json({ success: false, message: 'Format data JSON tidak valid' });
    }
    savePortfolioData(incomingData);
    res.json({ success: true, message: 'Data portofolio berhasil dipulihkan dari backup!', data: incomingData });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal memulihkan data: ' + err.message });
  }
});

// Redirect /admin to home
app.get('/admin', (req, res) => {
  res.redirect('/');
});

// Fallback for SPA
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const os = require('os');

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal && !iface.address.startsWith('169.254')) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIp = getLocalIp();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`===================================================`);
  console.log(`🚀 Portfolio Tri Hamdani Aktif!`);
  console.log(`💻 Local (Laptop/PC) : http://localhost:${PORT}`);
  console.log(`📱 Mobile (Buka di HP): http://${localIp}:${PORT}`);
  console.log(`===================================================`);
});
