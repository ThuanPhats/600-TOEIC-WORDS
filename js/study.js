/**
 * study.js — Flashcard study page logic
 * Features: flip card, pronunciation (Web Speech API),
 *           next/prev, keyboard shortcuts, localStorage progress
 */

// ─── State ────────────────────────────────────────
let vocabData = {};
let topicName = '';
let words = [];
let currentIndex = 0;
let isFlipped = false;
let isSpeaking = false;

// ─── Storage helpers ──────────────────────────────
function storageKey(word) {
  return `toeic_${topicName}_${word}`;
}

function getStatus(word) {
  return localStorage.getItem(storageKey(word)); // 'remembered' | 'not_remembered' | null
}

function setStatus(word, status) {
  localStorage.setItem(storageKey(word), status);
}

// ─── Init ─────────────────────────────────────────
async function init() {
  const params = new URLSearchParams(window.location.search);
  topicName = decodeURIComponent(params.get('topic') || '');

  if (!topicName) {
    window.location.href = 'index.html';
    return;
  }

  try {
    const res = await fetch('./data/toeic_vocab.json');
    if (!res.ok) throw new Error('Cannot load vocab data');
    vocabData = await res.json();
  } catch (err) {
    showToast('⚠️ Không thể tải dữ liệu từ vựng', 'error');
    return;
  }

  words = vocabData[topicName];
  if (!words || words.length === 0) {
    window.location.href = 'index.html';
    return;
  }

  // Set page title & topic name
  document.title = `${topicName} — TOEIC 600`;
  setEl('topicName', topicName);
  setEl('topicNameNav', topicName);

  renderCard();
  renderStrip();
  updateProgress();
  setupEventListeners();
}

// ─── Render Card ──────────────────────────────────
function renderCard() {
  const item = words[currentIndex];
  if (!item) return;

  // Update front face
  setEl('cardWord', item.word);
  setEl('cardType', item.type);

  // Update back face
  setEl('cardMeaning', item.meaning);
  setEl('cardWordBack', item.word);

  // Update counter
  setEl('cardCounter', `${currentIndex + 1} / ${words.length}`);

  // Reset flip state — entrance animation on WRAPPER (no transform, so preserve-3d is safe)
  isFlipped = false;
  const fc = document.getElementById('flashcard');
  const wrap = document.getElementById('flashcardWrap');
  if (fc) {
    fc.classList.remove('flipped');
  }
  if (wrap) {
    wrap.classList.remove('card-enter');
    void wrap.offsetWidth; // trigger reflow to restart animation
    wrap.classList.add('card-enter');
  }

  // Update remembered buttons
  updateStatusButtons();

  // Update nav buttons
  const prevBtn = document.getElementById('btnPrev');
  const nextBtn = document.getElementById('btnNext');
  if (prevBtn) prevBtn.disabled = currentIndex === 0;
  if (nextBtn) nextBtn.disabled = currentIndex === words.length - 1;

  // Highlight current dot
  highlightStrip();
}

function updateStatusButtons() {
  const status = getStatus(words[currentIndex].word);
  const remBtn = document.getElementById('btnRemembered');
  const notBtn = document.getElementById('btnNotRemembered');
  if (remBtn) remBtn.classList.toggle('active', status === 'remembered');
  if (notBtn) notBtn.classList.toggle('active', status === 'not_remembered');
}

// ─── Card Strip (dots) ────────────────────────────
function renderStrip() {
  const strip = document.getElementById('cardStrip');
  if (!strip) return;

  strip.innerHTML = words.map((item, i) => {
    const status = getStatus(item.word);
    let cls = 'strip-dot';
    if (i === currentIndex) cls += ' current';
    else if (status === 'remembered') cls += ' remembered';
    else if (status === 'not_remembered') cls += ' not-remembered';

    return `<div class="${cls}" title="${item.word}" data-index="${i}"
                 role="button" tabindex="-1" aria-label="Thẻ ${i + 1}: ${item.word}"></div>`;
  }).join('');

  // Click on dot to jump
  strip.querySelectorAll('.strip-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      const idx = parseInt(dot.dataset.index, 10);
      goTo(idx);
    });
  });
}

function highlightStrip() {
  const dots = document.querySelectorAll('.strip-dot');
  dots.forEach((dot, i) => {
    const status = getStatus(words[i].word);
    dot.className = 'strip-dot';
    if (i === currentIndex) dot.classList.add('current');
    else if (status === 'remembered') dot.classList.add('remembered');
    else if (status === 'not_remembered') dot.classList.add('not-remembered');
  });
}

// ─── Progress Bar ─────────────────────────────────
function updateProgress() {
  const total = words.length;
  const remembered = words.filter(item => getStatus(item.word) === 'remembered').length;
  const pct = total > 0 ? Math.round((remembered / total) * 100) : 0;

  setEl('progressText', `${remembered} / ${total} đã nhớ`);
  setEl('progressPct', `${pct}%`);
  const fill = document.getElementById('progressFill');
  if (fill) fill.style.width = `${pct}%`;
}

// ─── Navigation ───────────────────────────────────
function goTo(index) {
  if (index < 0 || index >= words.length) return;
  currentIndex = index;
  renderCard();
  updateProgress();
}

function goPrev() { goTo(currentIndex - 1); }
function goNext() { goTo(currentIndex + 1); }

function flipCard() {
  isFlipped = !isFlipped;
  const fc = document.getElementById('flashcard');
  if (fc) fc.classList.toggle('flipped', isFlipped);
}

// ─── Web Speech API ───────────────────────────────
function speakWord() {
  if (!('speechSynthesis' in window)) {
    showToast('🔇 Trình duyệt không hỗ trợ phát âm', 'error');
    return;
  }

  const word = words[currentIndex]?.word;
  if (!word) return;

  // Stop any ongoing speech
  window.speechSynthesis.cancel();

  const btn = document.getElementById('btnSpeak');
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = 'en-US';
  utterance.rate = 0.9;
  utterance.pitch = 1;

  utterance.onstart = () => {
    isSpeaking = true;
    if (btn) btn.classList.add('speaking');
  };

  utterance.onend = utterance.onerror = () => {
    isSpeaking = false;
    if (btn) btn.classList.remove('speaking');
  };

  window.speechSynthesis.speak(utterance);
}

// ─── Mark remembered ──────────────────────────────
function markRemembered() {
  const word = words[currentIndex]?.word;
  if (!word) return;
  const current = getStatus(word);
  const newStatus = current === 'remembered' ? null : 'remembered';
  if (newStatus === null) {
    localStorage.removeItem(storageKey(word));
    showToast('↩️ Đã bỏ đánh dấu', 'info');
  } else {
    setStatus(word, newStatus);
    showToast('✅ Đã nhớ từ này!', 'success');
  }
  updateStatusButtons();
  updateProgress();
  highlightStrip();
}

function markNotRemembered() {
  const word = words[currentIndex]?.word;
  if (!word) return;
  const current = getStatus(word);
  const newStatus = current === 'not_remembered' ? null : 'not_remembered';
  if (newStatus === null) {
    localStorage.removeItem(storageKey(word));
    showToast('↩️ Đã bỏ đánh dấu', 'info');
  } else {
    setStatus(word, newStatus);
    showToast('📝 Ghi nhớ để ôn thêm', 'info');
  }
  updateStatusButtons();
  updateProgress();
  highlightStrip();
}

// ─── Event Listeners ──────────────────────────────
function setupEventListeners() {
  // Blur after button clicks so Space isn't captured by focused button
  const blurThenCall = (fn) => () => { document.activeElement?.blur(); fn(); };

  document.getElementById('btnPrev')?.addEventListener('click', blurThenCall(goPrev));
  document.getElementById('btnNext')?.addEventListener('click', blurThenCall(goNext));
  document.getElementById('btnSpeak')?.addEventListener('click', e => {
    e.stopPropagation();
    speakWord();
  });
  document.getElementById('btnRemembered')?.addEventListener('click', blurThenCall(markRemembered));
  document.getElementById('btnNotRemembered')?.addEventListener('click', blurThenCall(markNotRemembered));

  // Flip on card click
  document.getElementById('flashcard')?.addEventListener('click', flipCard);

  // Keyboard shortcuts — capture phase fires BEFORE browser processes focused-button Space click
  document.addEventListener('keydown', handleKeydown, true);
}

function handleKeydown(e) {
  // Don't trigger if typing in an input
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  switch (e.key) {
    case 'ArrowLeft':
      e.preventDefault();
      goPrev();
      break;
    case 'ArrowRight':
      e.preventDefault();
      goNext();
      break;
    case ' ':
    case 'Space':
      e.preventDefault();
      flipCard();
      break;
    case 'Enter':
      speakWord();
      break;
    case '1':
      markRemembered();
      break;
    case '2':
      markNotRemembered();
      break;
  }
}

// ─── Toast ────────────────────────────────────────
function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// ─── Helpers ──────────────────────────────────────
function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ─── Run ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
