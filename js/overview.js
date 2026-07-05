/**
 * overview.js — Progress overview page
 * Reads localStorage, renders per-topic progress + overall stats
 */

let vocabData = {};
let allTopics = [];
let sortMode = 'least'; // 'least' | 'most' | 'alpha'

// ─── Storage ──────────────────────────────────────
function storageKey(topic, word) {
  return `toeic_${topic}_${word}`;
}

function getRememberedCount(topic) {
  const words = vocabData[topic] || [];
  return words.filter(item =>
    localStorage.getItem(storageKey(topic, item.word)) === 'remembered'
  ).length;
}

function getTotalWords(topic) {
  return (vocabData[topic] || []).length;
}

// ─── Init ─────────────────────────────────────────
async function init() {
  try {
    const res = await fetch('./data/toeic_vocab.json');
    if (!res.ok) throw new Error('Cannot load vocab data');
    vocabData = await res.json();
    allTopics = Object.keys(vocabData);
  } catch (err) {
    document.getElementById('overviewList').innerHTML =
      '<div class="empty-state"><div class="empty-icon">⚠️</div><p>Không thể tải dữ liệu</p></div>';
    return;
  }

  renderOverallStats();
  renderOverviewList();
  setupControls();
}

// ─── Overall stats & ring ─────────────────────────
function renderOverallStats() {
  const totalWords = allTopics.reduce((s, t) => s + getTotalWords(t), 0);
  const totalRemembered = allTopics.reduce((s, t) => s + getRememberedCount(t), 0);
  const completedTopics = allTopics.filter(t =>
    getTotalWords(t) > 0 && getRememberedCount(t) === getTotalWords(t)
  ).length;
  const overallPct = totalWords > 0 ? Math.round((totalRemembered / totalWords) * 100) : 0;

  setEl('statTotalWords', totalWords);
  setEl('statTotalRemembered', totalRemembered);
  setEl('statCompletedTopics', completedTopics);
  setEl('statOverallPct', `${overallPct}%`);

  // Progress ring
  setEl('ringPct', `${overallPct}%`);
  const fill = document.getElementById('ringFill');
  if (fill) {
    const circumference = 440; // 2 * π * 70 ≈ 440
    const offset = circumference - (overallPct / 100) * circumference;
    // Animate after short delay
    setTimeout(() => { fill.style.strokeDashoffset = offset; }, 100);
  }
}

// ─── Overview List ────────────────────────────────
function renderOverviewList() {
  const list = document.getElementById('overviewList');
  if (!list) return;

  // Build data
  let topicData = allTopics.map(topic => {
    const total = getTotalWords(topic);
    const remembered = getRememberedCount(topic);
    const pct = total > 0 ? Math.round((remembered / total) * 100) : 0;
    return { topic, total, remembered, pct };
  });

  // Sort
  if (sortMode === 'least') {
    topicData.sort((a, b) => a.pct - b.pct);
  } else if (sortMode === 'most') {
    topicData.sort((a, b) => b.pct - a.pct);
  } else if (sortMode === 'alpha') {
    topicData.sort((a, b) => a.topic.localeCompare(b.topic));
  }

  list.innerHTML = topicData.map(({ topic, total, remembered, pct }, idx) => {
    const isComplete = pct === 100 && total > 0;
    const topicEncoded = encodeURIComponent(topic);
    return `
      <a href="study.html?topic=${topicEncoded}"
         class="overview-item fade-in ${isComplete ? 'complete' : ''}"
         style="animation-delay: ${Math.min(idx * 0.02, 0.4)}s"
         aria-label="${topic}: ${pct}% đã nhớ">
        <div class="ov-rank">${idx + 1}</div>
        <div class="ov-info">
          <div class="ov-name">${topic}</div>
          <div class="ov-bar-wrap" role="progressbar"
               aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
            <div class="ov-bar-fill ${isComplete ? 'complete' : ''}"
                 style="width: ${pct}%"></div>
          </div>
        </div>
        <div class="ov-count">
          <span class="ov-pct">${pct}%</span>
          ${remembered}/${total}
        </div>
      </a>`;
  }).join('');
}

// ─── Controls (sort + reset) ──────────────────────
function setupControls() {
  // Sort buttons
  document.querySelectorAll('[data-sort]').forEach(btn => {
    btn.addEventListener('click', () => {
      sortMode = btn.dataset.sort;
      // Update active button
      document.querySelectorAll('[data-sort]').forEach(b =>
        b.classList.toggle('btn-primary', b === btn));
      document.querySelectorAll('[data-sort]').forEach(b => {
        if (b !== btn) b.classList.remove('btn-primary');
        if (b !== btn) { b.classList.remove('btn-primary'); b.classList.add('btn-ghost'); }
      });
      btn.classList.remove('btn-ghost');
      btn.classList.add('btn-primary');
      renderOverviewList();
    });
  });

  // Set default active sort button
  const defaultBtn = document.querySelector('[data-sort="least"]');
  if (defaultBtn) {
    defaultBtn.classList.remove('btn-ghost');
    defaultBtn.classList.add('btn-primary');
  }

  // Reset button
  document.getElementById('btnReset')?.addEventListener('click', () => {
    const confirmed = confirm('⚠️ Bạn có chắc muốn xóa toàn bộ tiến trình học?\nHành động này không thể hoàn tác.');
    if (!confirmed) return;

    // Remove only toeic_ keys
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('toeic_')) keysToRemove.push(key);
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));

    showToast('🗑️ Đã xóa toàn bộ tiến trình', 'info');
    // Re-render
    renderOverallStats();
    renderOverviewList();
  });
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
  }, 2500);
}

// ─── Helpers ──────────────────────────────────────
function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ─── Run ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
