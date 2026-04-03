'use strict';

// ── 状態 ────────────────────────────────────────────────
const state = {
  todos: [],   // { id, text, done, createdAt }
  filter: 'all',
};

// ── LocalStorage ─────────────────────────────────────────
const STORAGE_KEY = 'todo-app-v1';

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.todos));
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) state.todos = JSON.parse(raw);
  } catch {
    state.todos = [];
  }
}

// ── CRUD ─────────────────────────────────────────────────
function addTodo(text) {
  const trimmed = text.trim();
  if (!trimmed) return false;
  state.todos.unshift({ id: Date.now(), text: trimmed, done: false, createdAt: Date.now() });
  save();
  return true;
}

function toggleTodo(id) {
  const todo = state.todos.find(t => t.id === id);
  if (todo) { todo.done = !todo.done; save(); }
}

function deleteTodo(id) {
  state.todos = state.todos.filter(t => t.id !== id);
  save();
}

function editTodo(id, newText) {
  const trimmed = newText.trim();
  if (!trimmed) return deleteTodo(id);
  const todo = state.todos.find(t => t.id === id);
  if (todo) { todo.text = trimmed; save(); }
}

function clearDone() {
  state.todos = state.todos.filter(t => !t.done);
  save();
}

// ── フィルタ ──────────────────────────────────────────────
function filteredTodos() {
  switch (state.filter) {
    case 'active': return state.todos.filter(t => !t.done);
    case 'done':   return state.todos.filter(t => t.done);
    default:       return state.todos;
  }
}

// ── DOM 要素 ──────────────────────────────────────────────
const $ = id => document.getElementById(id);
const todoInput   = $('todo-input');
const addBtn      = $('add-btn');
const todoList    = $('todo-list');
const remaining   = $('remaining');
const clearDoneBtn = $('clear-done');
const themeToggle = $('theme-toggle');
const filterBtns  = document.querySelectorAll('.filter-btn');

// ── レンダリング ───────────────────────────────────────────
function render() {
  const items = filteredTodos();

  todoList.innerHTML = '';

  items.forEach(todo => {
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.done ? ' done' : '');
    li.dataset.id = todo.id;

    // チェックボタン
    const check = document.createElement('button');
    check.className = 'todo-check';
    check.setAttribute('aria-label', todo.done ? '未完了に戻す' : '完了にする');
    check.textContent = todo.done ? '✓' : '';
    check.addEventListener('click', () => {
      toggleTodo(todo.id);
      render();
    });

    // テキスト（contenteditable でインライン編集）
    const span = document.createElement('span');
    span.className = 'todo-text';
    span.textContent = todo.text;
    span.setAttribute('contenteditable', 'true');
    span.setAttribute('aria-label', 'タスクテキスト');
    span.setAttribute('spellcheck', 'false');

    span.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); span.blur(); }
      if (e.key === 'Escape') { span.textContent = todo.text; span.blur(); }
    });

    span.addEventListener('blur', () => {
      const newText = span.textContent;
      if (newText !== todo.text) {
        editTodo(todo.id, newText);
        render();
      }
    });

    // 削除ボタン
    const del = document.createElement('button');
    del.className = 'todo-delete';
    del.setAttribute('aria-label', '削除');
    del.textContent = '×';
    del.addEventListener('click', () => {
      li.style.opacity = '0';
      li.style.transform = 'translateX(20px)';
      li.style.transition = '.2s ease';
      setTimeout(() => { deleteTodo(todo.id); render(); }, 180);
    });

    li.append(check, span, del);
    todoList.appendChild(li);
  });

  // フッター更新
  const activeCount = state.todos.filter(t => !t.done).length;
  remaining.textContent = `${activeCount}件のタスク残り`;
  clearDoneBtn.style.visibility = state.todos.some(t => t.done) ? 'visible' : 'hidden';
}

// ── イベント ──────────────────────────────────────────────
function handleAdd() {
  if (addTodo(todoInput.value)) {
    todoInput.value = '';
    render();
    todoInput.focus();
  }
}

todoInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') handleAdd();
});
addBtn.addEventListener('click', handleAdd);

clearDoneBtn.addEventListener('click', () => {
  clearDone();
  render();
});

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.filter = btn.dataset.filter;
    render();
  });
});

// ── テーマ ────────────────────────────────────────────────
const THEME_KEY = 'todo-theme';

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  localStorage.setItem(THEME_KEY, theme);
}

themeToggle.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
});

// 初期テーマ（システム設定 or 保存値）
const savedTheme = localStorage.getItem(THEME_KEY);
if (savedTheme) {
  applyTheme(savedTheme);
} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  applyTheme('dark');
} else {
  applyTheme('light');
}

// ── 起動 ──────────────────────────────────────────────────
load();
render();
todoInput.focus();
