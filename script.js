'use strict';

// ===== Data soal =====
const QUESTIONS = [
  { category: 'HTML', text: 'Tag HTML apa yang dipakai untuk tautan?', options: ['<link>', '<a>', '<href>', '<url>'], answer: 1 },
  { category: 'HTML', text: 'Atribut apa yang membuat gambar punya teks alternatif?', options: ['title', 'src', 'alt', 'name'], answer: 2 },
  { category: 'CSS', text: 'Properti CSS untuk mengubah warna teks adalah...', options: ['font-color', 'text-color', 'color', 'foreground'], answer: 2 },
  { category: 'CSS', text: 'Nilai display mana yang membuat layout satu dimensi fleksibel?', options: ['flex', 'block', 'inline', 'table'], answer: 0 },
  { category: 'JavaScript', text: 'Kata kunci mana yang mendeklarasikan variabel yang tidak bisa di-assign ulang?', options: ['var', 'let', 'const', 'static'], answer: 2 },
  { category: 'JavaScript', text: 'Method apa yang menyimpan data ke LocalStorage?', options: ['localStorage.setItem()', 'localStorage.push()', 'localStorage.add()', 'localStorage.write()'], answer: 0 },
  { category: 'DOM', text: 'Properti mana yang aman dari XSS untuk mengisi teks elemen?', options: ['innerHTML', 'outerHTML', 'textContent', 'insertAdjacentHTML'], answer: 2 },
  { category: 'DOM', text: 'Teknik menaruh satu listener di elemen induk untuk menangani banyak anak disebut...', options: ['Event bubbling saja', 'Event delegation', 'Event capturing', 'Event binding'], answer: 1 },
];

const TIME_PER_QUESTION = 15; // detik
const STORAGE_KEY = 'quizHighScore';

// ===== State =====
const state = { questions: [], index: 0, score: 0, answered: false, timeLeft: 0, timerId: null };

// ===== Elemen DOM =====
const $ = (id) => document.getElementById(id);
const screens = { start: $('screen-start'), quiz: $('screen-quiz'), result: $('screen-result') };
const els = {
  box: $('question-box'), next: $('btn-next'), counter: $('q-counter'), timer: $('timer'),
  bar: $('progress-bar'), progress: document.querySelector('.progress'),
  startHigh: $('start-high'), resultHigh: $('result-high'),
  finalScore: $('final-score'), total: $('total-q'), msg: $('result-msg'),
};

// ===== Utilitas =====
const shuffle = (arr) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const getHighScore = () => Number(localStorage.getItem(STORAGE_KEY)) || 0;
const saveHighScore = (score) => {
  if (score > getHighScore()) localStorage.setItem(STORAGE_KEY, String(score));
};

// Navigasi SPA: tampilkan satu layar tanpa reload
const showScreen = (name) => {
  Object.entries(screens).forEach(([key, el]) => el.classList.toggle('active', key === name));
};

// ===== Timer =====
const stopTimer = () => clearInterval(state.timerId);
const renderTimer = () => {
  els.timer.textContent = `${state.timeLeft} detik`;
  els.timer.classList.toggle('low', state.timeLeft <= 5);
};
const startTimer = () => {
  stopTimer();
  state.timeLeft = TIME_PER_QUESTION;
  renderTimer();
  state.timerId = setInterval(() => {
    state.timeLeft--;
    renderTimer();
    if (state.timeLeft <= 0) handleAnswer(-1); // waktu habis
  }, 1000);
};

// ===== Render soal (createElement + textContent) =====
const renderQuestion = () => {
  const q = state.questions[state.index];
  state.answered = false;
  els.next.hidden = true;
  els.box.replaceChildren();

  const cat = document.createElement('p');
  cat.className = 'category';
  cat.textContent = q.category;

  const title = document.createElement('h2');
  title.className = 'question-text';
  title.textContent = q.text;

  const list = document.createElement('div');
  list.className = 'options';
  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'option';
    btn.dataset.index = i;
    btn.textContent = opt;
    list.append(btn);
  });

  els.box.append(cat, title, list);
  els.box.classList.remove('enter');
  void els.box.offsetWidth; // restart animasi transisi
  els.box.classList.add('enter');

  els.counter.textContent = `Soal ${state.index + 1} dari ${state.questions.length}`;
  const pct = (state.index / state.questions.length) * 100;
  els.bar.style.width = `${pct}%`;
  els.progress.setAttribute('aria-valuenow', Math.round(pct));
  startTimer();
};

// ===== Jawaban & feedback visual =====
const handleAnswer = (chosen) => {
  if (state.answered) return;
  state.answered = true;
  stopTimer();

  const q = state.questions[state.index];
  const buttons = els.box.querySelectorAll('.option');
  buttons.forEach((btn) => {
    const i = Number(btn.dataset.index);
    btn.disabled = true;
    if (i === q.answer) btn.classList.add('correct');
    else if (i === chosen) btn.classList.add('wrong');
  });

  if (chosen === q.answer) state.score++;

  const isLast = state.index === state.questions.length - 1;
  els.next.textContent = isLast ? 'Lihat hasil' : 'Lanjut';
  els.next.hidden = false;
  els.next.focus();
};

const nextQuestion = () => {
  if (state.index < state.questions.length - 1) {
    state.index++;
    renderQuestion();
  } else {
    showResult();
  }
};

// ===== Hasil =====
const showResult = () => {
  stopTimer();
  els.bar.style.width = '100%';
  saveHighScore(state.score);

  const total = state.questions.length;
  els.finalScore.textContent = state.score;
  els.total.textContent = total;
  els.resultHigh.textContent = `${getHighScore()} / ${total}`;

  const ratio = state.score / total;
  els.msg.textContent = ratio === 1 ? 'Sempurna!' : ratio >= 0.6 ? 'Bagus, terus berlatih.' : 'Coba lagi untuk skor lebih tinggi.';
  showScreen('result');
};

// ===== Mulai / restart =====
const startQuiz = () => {
  state.questions = shuffle(QUESTIONS).map((q) => {
    // acak urutan pilihan sambil melacak jawaban benar
    const correctText = q.options[q.answer];
    const options = shuffle(q.options);
    return { ...q, options, answer: options.indexOf(correctText) };
  });
  state.index = 0;
  state.score = 0;
  showScreen('quiz');
  renderQuestion();
};

// ===== Dark mode =====
const themeBtn = $('theme-toggle');
const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  themeBtn.textContent = theme === 'dark' ? 'Mode terang' : 'Mode gelap';
  localStorage.setItem('quizTheme', theme);
};

// ===== Event listeners =====
// Event delegation: satu listener di kontainer untuk semua pilihan jawaban
els.box.addEventListener('click', (e) => {
  const btn = e.target.closest('.option');
  if (!btn || !els.box.contains(btn)) return;
  handleAnswer(Number(btn.dataset.index));
});

$('btn-start').addEventListener('click', startQuiz);
$('btn-restart').addEventListener('click', () => {
  els.startHigh.textContent = getHighScore();
  startQuiz();
});
els.next.addEventListener('click', nextQuestion);
themeBtn.addEventListener('click', () => {
  applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
});

// ===== Init =====
els.startHigh.textContent = getHighScore();
applyTheme(localStorage.getItem('quizTheme') || 'light');
