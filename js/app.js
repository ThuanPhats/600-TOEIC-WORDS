/**
 * app.js — Homepage logic
 * Loads vocab.json, renders topic grid, reads localStorage progress
 */

const TOPIC_ICONS = {
  'Contracts': '📄', 'Marketing': '📣', 'Warranties': '🛡️',
  'Business Planning': '📊', 'Conferences': '🎤', 'Computers': '💻',
  'Office Technology': '🖨️', 'Office Procedures': '📋', 'Electronics': '⚡',
  'Correspondence': '✉️', 'Job advertising and recruitment': '📢',
  'Applying and interviewing': '🤝', 'Hiring and training': '🏋️',
  'Salaries and benefits': '💰', 'Promotions, pensions and awards': '🏆',
  'Shopping': '🛍️', 'Ordering supplies': '📦', 'Shipping': '🚚',
  'Invoices': '🧾', 'Inventory': '📦', 'Banking': '🏦',
  'Accounting': '📒', 'Investments': '📈', 'Taxes': '💹',
  'Financial statements': '📑', 'Property and departments': '🏢',
  'Broad meeting and committees': '🗣️', 'Quality control': '✅',
  'Product development': '🔬', 'Renting and leasing': '🔑',
  'Selecting a restaurant': '🍽️', 'Eating out': '🍜',
  'Ordering lunch': '🥗', 'Cooking as a career': '👨‍🍳',
  'Events': '🎉', 'General travel': '✈️', 'Airlines': '🛫',
  'Trains': '🚆', 'Hotels': '🏨', 'Car rentals': '🚗',
  'Movies': '🎬', 'Theater': '🎭', 'Music': '🎵',
  'Museums': '🏛️', 'Media': '📰', 'Doctor\'s office': '🩺',
  'Health insurance': '💊', 'Hospitals': '🏥', 'Pharmacy': '💉'
};

let vocabData = {};
let allTopics = [];

// ─── Init ─────────────────────────────────────────
async function init() {
  try {
    const res = await fetch('./data/toeic_vocab.json');
    if (!res.ok) throw new Error('Cannot load vocab data');
    vocabData = await res.json();
    allTopics = Object.keys(vocabData);
    renderStats();
    renderGrid(allTopics);
    setupSearch();
  } catch (err) {
    console.error(err);
    document.getElementById('topicGrid').innerHTML =
      '<div class="no-results">⚠️ Không thể tải dữ liệu từ vựng. Hãy mở trang qua một server (ví dụ: Live Server).</div>';
  }
}

// ─── Stats ────────────────────────────────────────
function renderStats() {
  const totalWords = allTopics.reduce((s, t) => s + vocabData[t].length, 0);
  const totalTopics = allTopics.length;
  const rememberedTotal = countTotalRemembered();

  setEl('statTopics', totalTopics);
  setEl('statWords', totalWords);
  setEl('statRemembered', rememberedTotal);
}

function countTotalRemembered() {
  let count = 0;
  for (const topic of allTopics) {
    count += getRememberedCount(topic);
  }
  return count;
}

function getRememberedCount(topic) {
  if (!vocabData[topic]) return 0;
  return vocabData[topic].filter(item =>
    localStorage.getItem(storageKey(topic, item.word)) === 'remembered'
  ).length;
}

function storageKey(topic, word) {
  return `toeic_${topic}_${word}`;
}

// ─── Topic Grid ───────────────────────────────────
function renderGrid(topics) {
  const grid = document.getElementById('topicGrid');
  const countEl = document.getElementById('topicCount');

  countEl.textContent = `${topics.length} chủ đề`;

  if (topics.length === 0) {
    grid.innerHTML = '<div class="no-results">🔍 Không tìm thấy chủ đề nào</div>';
    return;
  }

  grid.innerHTML = topics.map((topic, idx) => {
    const words = vocabData[topic] || [];
    const total = words.length;
    const remembered = getRememberedCount(topic);
    const pct = total > 0 ? Math.round((remembered / total) * 100) : 0;
    const isComplete = pct === 100 && total > 0;
    const icon = TOPIC_ICONS[topic] || '📚';
    const topicEncoded = encodeURIComponent(topic);

    return `
      <a href="study.html?topic=${topicEncoded}"
         class="topic-card fade-in ${isComplete ? 'completed' : ''}"
         style="animation-delay: ${Math.min(idx * 0.03, 0.5)}s"
         id="topic-card-${idx}"
         aria-label="Học chủ đề ${topic}">
        <div class="topic-card-inner">
          <span class="topic-icon" aria-hidden="true">${icon}</span>
          <div class="topic-name">${topic}</div>
          <div class="topic-meta">${total} từ${isComplete ? ' • ✨ Hoàn thành' : ''}</div>
          <div class="topic-progress-bar-wrap" role="progressbar"
               aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
            <div class="topic-progress-bar-fill" style="width: ${pct}%"></div>
          </div>
          <div class="topic-progress-text">${remembered}/${total} đã nhớ (${pct}%)</div>
        </div>
      </a>`;
  }).join('');
}

// ─── Search ───────────────────────────────────────
function setupSearch() {
  const input = document.getElementById('searchInput');
  if (!input) return;

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) {
      renderGrid(allTopics);
      return;
    }
    const filtered = allTopics.filter(t => t.toLowerCase().includes(q));
    renderGrid(filtered);
  });
}

// ─── Helpers ──────────────────────────────────────
function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ─── Run ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
