const addBtn = document.getElementById("add-task-btn");
const modal = document.getElementById("modal");
const closeModal = document.getElementById("close-modal");
const saveBtn = document.getElementById("save-task");
const taskBoard = document.getElementById("task-board");
const completeAreaLeft = document.getElementById('complete-area-left');
const completeAreaRight = document.getElementById('complete-area-right');

// SVGファイルをfetchして埋め込む関数
async function setSVGIcon(element, svgPath) {
  const res = await fetch(svgPath);
  const svgText = await res.text();
  element.innerHTML = svgText;
}

function getIconFilenames() {
  const isDark = document.body.classList.contains('dark');
  return {
    classroom: isDark ? 'classroom_white.svg' : 'classroom.svg',
    note: isDark ? 'note_white.svg' : 'note.svg'
  };
}

// テーマ切り替え
const themeLight = document.getElementById('theme-light');
const themeDark = document.getElementById('theme-dark');
function updateThemeIcons() {
  if (document.body.classList.contains('dark')) {
    themeLight.style.display = '';
    themeDark.style.display = 'none';
  } else {
    themeLight.style.display = 'none';
    themeDark.style.display = '';
  }
}
themeLight.onclick = () => {
  document.body.classList.remove('dark');
  updateThemeIcons();
  // アイコン色切り替え（カード内も）
  const icons = getIconFilenames();
  document.querySelectorAll('.task-card').forEach(card => {
    const classroomImg = card.querySelector('.classroom-icon img');
    const noteImg = card.querySelector('.note-icon img');
    if (classroomImg) classroomImg.src = icons.classroom;
    if (noteImg) noteImg.src = icons.note;
  });
};
themeDark.onclick = () => {
  document.body.classList.add('dark');
  updateThemeIcons();
  const icons = getIconFilenames();
  document.querySelectorAll('.task-card').forEach(card => {
    const classroomImg = card.querySelector('.classroom-icon img');
    const noteImg = card.querySelector('.note-icon img');
    if (classroomImg) classroomImg.src = icons.classroom;
    if (noteImg) noteImg.src = icons.note;
  });
};
updateThemeIcons();

// マイルストーンUIの管理
const milestoneInput = document.getElementById('milestone-input');
const milestoneListUI = document.getElementById('milestone-list');
const addMilestoneBtn = document.getElementById('add-milestone-btn');
let milestoneItems = [];

addMilestoneBtn.onclick = () => {
  const value = milestoneInput.value.trim();
  if (value) {
    milestoneItems.push(value);
    milestoneInput.value = '';
    renderMilestoneList();
  }
};

function renderMilestoneList() {
  milestoneListUI.innerHTML = '';
  milestoneItems.forEach((item, idx) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${item}</span> <button type='button' class='remove-milestone' data-idx='${idx}'>×</button>`;
    milestoneListUI.appendChild(li);
  });
  milestoneListUI.querySelectorAll('.remove-milestone').forEach(btn => {
    btn.onclick = function() {
      const idx = +this.getAttribute('data-idx');
      milestoneItems.splice(idx, 1);
      renderMilestoneList();
    };
  });
}

// モーダル開閉
addBtn.onclick = () => {
  modal.classList.remove('hidden');
  milestoneItems = [];
  renderMilestoneList();
};
closeModal.onclick = () => modal.classList.add('hidden');

// 残り時間の計算
function formatTime(diffMs) {
  let totalMinutes = Math.floor(diffMs / 1000 / 60);
  const days = Math.floor(totalMinutes / (60 * 24));
  totalMinutes -= days * 60 * 24;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return {days, hours, minutes};
}

function getClassroomSVG(isDark) {
  // 黒板＋チョーク風アイコン
  const board = isDark ? '#e6d88b' : '#31493a';
  const chalk = isDark ? '#fff' : '#bfa77a';
  return `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="7" width="20" height="12" rx="2" fill="${board}" stroke="#888" stroke-width="1.5"/>
    <rect x="7" y="19" width="14" height="2" rx="1" fill="${chalk}" />
    <rect x="10" y="10" width="8" height="5" rx="1" fill="#fff" fill-opacity="0.2" />
  </svg>`;
}
function getNoteSVG(isDark) {
  // ノート風アイコン
  const paper = isDark ? '#eaeae2' : '#fff';
  const line = isDark ? '#bfa77a' : '#b2bfa3';
  return `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="6" width="16" height="16" rx="2" fill="${paper}" stroke="#888" stroke-width="1.5"/>
    <line x1="8" y1="10" x2="20" y2="10" stroke="${line}" stroke-width="1.2"/>
    <line x1="8" y1="14" x2="20" y2="14" stroke="${line}" stroke-width="1.2"/>
    <line x1="8" y1="18" x2="16" y2="18" stroke="${line}" stroke-width="1.2"/>
  </svg>`;
}

// タスク保存処理
let tasks = [];
let currentStatus = 'inprogress'; // 追加: 表示中のステータス

// localStorage保存・復元関数
function saveTasksToStorage() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}
function loadTasksFromStorage() {
  const data = localStorage.getItem('tasks');
  if (data) {
    try {
      tasks = JSON.parse(data);
    } catch (e) {
      tasks = [];
    }
  }
}

// 初期化時にlocalStorageから復元
loadTasksFromStorage();

// カード描画関数
function renderTasks() {
  taskBoard.innerHTML = '';
  let filteredTasks = tasks;
  if (currentStatus === 'inprogress') {
    filteredTasks = tasks.filter(t => !t.completed);
  } else if (currentStatus === 'completed') {
    filteredTasks = tasks.filter(t => t.completed);
  }
  filteredTasks.forEach(task => {
    const card = document.createElement("div");
    card.className = `task-card ${task.priority}`;
    card.setAttribute("data-note", task.note);
    card.setAttribute("data-link", task.link);
    card.setAttribute("data-milestone", JSON.stringify(task.milestoneList));
    let pinSrc = "pin.svg";
    if (task.priority === "low") pinSrc = "pin_green.svg";
    else if (task.priority === "medium") pinSrc = "pin_yellow.svg";
    else if (task.priority === "high") pinSrc = "pin_red.svg";
    card.innerHTML = `
      <img src="${pinSrc}" alt="pin" class="pin" />
      <div class="card-header">
        <span class="card-deadline">${task.deadlineStrShort}</span>
        </div>
      <h3 class="card-title">${task.title}</h3>
      <div class="card-timer">
        <span class="timer-main">${task.timeStr}</span>
      </div>
      <div class="card-icons">
        <span class="classroom-icon" title="Classroomへ"></span>
        <span class="note-icon" title="備考"></span>
      </div>
      <ul class="card-milestone-list">
        ${(task.milestoneList || []).map((item, i) => `<li><label><input type='checkbox' class='milestone-check'><span>${item}</span></label></li>`).join('')}
      </ul>
      <div class="card-footer"></div>
    `;
    const icons = getIconFilenames();
    card.querySelector('.classroom-icon').innerHTML = `<img src="${icons.classroom}" alt="classroom" class="classroom-img" width="28" height="28">`;
    card.querySelector('.note-icon').innerHTML = `<img src="${icons.note}" alt="note" class="note-img" width="28" height="28">`;
    // Classroomロゴクリックでリンクを新規タブで開く
    const classroomImg = card.querySelector('.classroom-icon img');
    if (classroomImg) {
      classroomImg.style.cursor = 'pointer';
      classroomImg.onclick = (e) => {
        e.stopPropagation();
        const url = card.getAttribute('data-link');
        if (url) window.open(url, '_blank');
      };
    }
    // ノートボタンクリックでオーバーレイ表示
    const noteImg = card.querySelector('.note-icon img');
    if (noteImg) {
      noteImg.style.cursor = 'pointer';
      noteImg.onclick = (e) => {
        e.stopPropagation();
        showNoteOverlay(card, (newNote) => {
          card.setAttribute('data-note', newNote);
          // tasks配列にも反映
          const idx = tasks.findIndex(t => t.title === card.querySelector('.card-title').textContent && t.deadlineStrShort === card.querySelector('.card-deadline').textContent);
          if (idx !== -1) tasks[idx].note = newNote;
          saveTasksToStorage();
        });
      };
    }
    // チェックリストのチェックで取り消し線
    card.querySelectorAll('.milestone-check').forEach(checkbox => {
      checkbox.addEventListener('change', function() {
        const span = this.parentNode.querySelector('span');
        if (this.checked) {
          span.style.textDecoration = 'line-through';
          span.style.color = '#aaa';
        } else {
          span.style.textDecoration = '';
          span.style.color = '';
        }
      });
    });
    // 各カード用のフリック検出変数
    let cardStartX = 0;
    let cardStartY = 0;
    let cardCurrentX = 0;
    let cardCurrentY = 0;
    let cardIsDragging = false;

    // クリックイベント（備考とリンク用）
    card.addEventListener("click", (e) => {
      if (cardIsDragging) return;
      // 何もしない
    });

    // タッチイベント（フリック検出用）
    card.addEventListener("touchstart", (e) => {
      cardStartX = e.touches[0].clientX;
      cardStartY = e.touches[0].clientY;
      cardIsDragging = false;
      card.style.transition = '';
    });

    card.addEventListener("touchmove", (e) => {
      if (!cardStartX) return;
      cardCurrentX = e.touches[0].clientX;
      cardCurrentY = e.touches[0].clientY;
      const diffX = cardCurrentX - cardStartX;
      const diffY = cardCurrentY - cardStartY;
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
        cardIsDragging = true;
        card.classList.add("dragging");
        card.style.zIndex = 1001;
        card.style.transform = `translateX(${diffX}px)`;
        // 完了エリア表示
        if (diffX < 0) {
          completeAreaLeft.classList.add('active');
          completeAreaRight.classList.remove('active');
        } else {
          completeAreaRight.classList.add('active');
          completeAreaLeft.classList.remove('active');
        }
        // 完了エリア重なり判定
        const cardRect = card.getBoundingClientRect();
        const leftRect = completeAreaLeft.getBoundingClientRect();
        const rightRect = completeAreaRight.getBoundingClientRect();
        if (cardRect.left < leftRect.right) {
          completeAreaLeft.classList.add('over');
        } else {
          completeAreaLeft.classList.remove('over');
        }
        if (cardRect.right > rightRect.left) {
          completeAreaRight.classList.add('over');
        } else {
          completeAreaRight.classList.remove('over');
        }
        e.preventDefault();
      }
    });

    card.addEventListener("touchend", (e) => {
      card.classList.remove("dragging");
      card.style.zIndex = '';
      // 完了エリア非表示
      completeAreaLeft.classList.remove('active', 'over');
      completeAreaRight.classList.remove('active', 'over');
      if (!cardStartX || !cardIsDragging) {
        card.style.transform = '';
        cardStartX = 0;
        cardStartY = 0;
        return;
      }
      
      // フリック距離と方向で完了判定
      const diffX = cardCurrentX - cardStartX;
      const diffY = cardCurrentY - cardStartY;
      const isHorizontalSwipe = Math.abs(diffX) > Math.abs(diffY);
      const isLongSwipe = Math.abs(diffX) > 100; // 100px以上フリック
      
      let completed = false;
      if (isHorizontalSwipe && isLongSwipe) {
        // 左フリック（負の値）または右フリック（正の値）で完了
        completed = true;
      }
      
      if (completed) {
        completeTask(card);
      } else {
        card.style.transition = 'transform 0.2s';
        card.style.transform = '';
      }
      cardStartX = 0;
      cardStartY = 0;
      cardIsDragging = false;
    });

    // マウスイベント（デスクトップ用）
    card.addEventListener("mousedown", (e) => {
      cardStartX = e.clientX;
      cardStartY = e.clientY;
      cardIsDragging = false;
      card.style.transition = '';
      card.style.zIndex = 1001;
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    });

    // マウス移動イベントをdocumentに追加
    const handleMouseMove = (e) => {
      if (!cardStartX) return;
      cardCurrentX = e.clientX;
      cardCurrentY = e.clientY;
      const diffX = cardCurrentX - cardStartX;
      const diffY = cardCurrentY - cardStartY;
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
        cardIsDragging = true;
        card.classList.add("dragging");
        card.style.transform = `translateX(${diffX}px)`;
        // 完了エリア表示
        if (diffX < 0) {
          completeAreaLeft.classList.add('active');
          completeAreaRight.classList.remove('active');
        } else {
          completeAreaRight.classList.add('active');
          completeAreaLeft.classList.remove('active');
        }
        // 完了エリア重なり判定
        const cardRect = card.getBoundingClientRect();
        const leftRect = completeAreaLeft.getBoundingClientRect();
        const rightRect = completeAreaRight.getBoundingClientRect();
        if (cardRect.left < leftRect.right) {
          completeAreaLeft.classList.add('over');
        } else {
          completeAreaLeft.classList.remove('over');
        }
        if (cardRect.right > rightRect.left) {
          completeAreaRight.classList.add('over');
        } else {
          completeAreaRight.classList.remove('over');
        }
      }
    };

    const handleMouseUp = (e) => {
      card.classList.remove("dragging");
      card.style.zIndex = '';
      // 完了エリア非表示
      completeAreaLeft.classList.remove('active', 'over');
      completeAreaRight.classList.remove('active', 'over');
      if (!cardStartX || !cardIsDragging) {
        card.style.transform = '';
        cardStartX = 0;
        cardStartY = 0;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        return;
      }
      
      // フリック距離と方向で完了判定
      const diffX = cardCurrentX - cardStartX;
      const diffY = cardCurrentY - cardStartY;
      const isHorizontalSwipe = Math.abs(diffX) > Math.abs(diffY);
      const isLongSwipe = Math.abs(diffX) > 100; // 100px以上フリック
      
      let completed = false;
      if (isHorizontalSwipe && isLongSwipe) {
        // 左フリック（負の値）または右フリック（正の値）で完了
        completed = true;
      }
      
      if (completed) {
        completeTask(card);
      } else {
        card.style.transition = 'transform 0.2s';
        card.style.transform = '';
      }
      cardStartX = 0;
      cardStartY = 0;
      cardIsDragging = false;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    taskBoard.appendChild(card);
  });
}

// 並べ替え関数・UIイベントを削除
// function sortTasks(by) { ... }
// const sortSelect = document.getElementById('sort-select');
// sortSelect.addEventListener('change', ...);

// saveBtn.onclickの中身を修正
saveBtn.onclick = () => {
  const title = document.getElementById("title-input").value;
  const deadlineStr = document.getElementById("deadline-input").value;
  const link = document.getElementById("link-input").value;
  const note = document.getElementById("note-input").value;
  const priority = document.querySelector('input[name="priority"]:checked').value;

  // デバッグ用
  console.log("title:", title, "deadlineStr:", deadlineStr);

  // 入力チェック
  if (!title.trim()) {
    alert("タイトルを入力してください。");
    return;
  }
  if (!deadlineStr) {
    alert("締切日時を入力してください。");
    return;
  }

  const deadline = new Date(deadlineStr);
  const now = new Date();
  const diffMs = deadline - now;
  if (diffMs <= 0 || isNaN(diffMs)) {
    alert("期限は未来の日時を入力してください。");
    return;
  }
  const {days, hours, minutes} = formatTime(diffMs);
  const pad = n => n.toString().padStart(2, '0');
  const timeStr = `${pad(days)}:${pad(hours)}:${pad(minutes)}`;
  const deadlineMonth = deadline.getMonth() + 1;
  const deadlineDate = deadline.getDate();
  const deadlineStrShort = `${deadlineMonth}/${deadlineDate}`;
  const milestoneList = [...milestoneItems];
  // tasks配列に追加
  tasks.push({
    title, deadline: deadlineStr, link, note, priority, milestoneList,
    timeStr, deadlineStrShort, completed: false // 追加
  });
  renderTasks(); // ← 修正
  saveTasksToStorage();
  modal.classList.add("hidden");
  // フォームリセット
  document.getElementById("title-input").value = "";
  document.getElementById("deadline-input").value = "";
  milestoneItems = [];
  renderMilestoneList();
  document.getElementById("link-input").value = "";
  document.getElementById("note-input").value = "";
  document.querySelector('input[name="priority"][value="low"]').checked = true;
};

// 初期描画
renderTasks();

// 課題完了処理
function completeTask(card) {
  card.classList.add("completing");
  
  setTimeout(() => {
    // tasks配列の該当タスクをcompleted: trueに
    const title = card.querySelector('.card-title').textContent;
    const deadlineStrShort = card.querySelector('.card-deadline').textContent;
    const idx = tasks.findIndex(t => t.title === title && t.deadlineStrShort === deadlineStrShort);
    if (idx !== -1) {
      tasks[idx].completed = true; // 削除ではなく完了フラグ
      saveTasksToStorage();
    }
    renderTasks();
  }, 300);
}

// 備考編集用オーバーレイ
function showNoteOverlay(card, onSave) {
  let overlay = document.getElementById('note-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'note-overlay';
    overlay.innerHTML = `
      <div class="note-modal">
        <textarea id="note-edit-area" rows="8" style="width:100%;font-size:1em;"></textarea>
        <div style="text-align:right;margin-top:1em;">
          <button id="note-close">閉じる</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }
  overlay.style.display = 'flex';
  const textarea = overlay.querySelector('#note-edit-area');
  textarea.value = card.getAttribute('data-note') || '';
  textarea.oninput = () => {
    const newNote = textarea.value;
    onSave(newNote);
  };
  overlay.querySelector('#note-close').onclick = () => {
    overlay.style.display = 'none';
  };
}

// ステータス切り替えボタンのイベント追加
const showInprogressBtn = document.getElementById('show-inprogress');
const showCompletedBtn = document.getElementById('show-completed');
showInprogressBtn.onclick = () => {
  currentStatus = 'inprogress';
  showInprogressBtn.classList.add('active');
  showCompletedBtn.classList.remove('active');
  renderTasks();
};
showCompletedBtn.onclick = () => {
  currentStatus = 'completed';
  showCompletedBtn.classList.add('active');
  showInprogressBtn.classList.remove('active');
  renderTasks();
};

// モチベーションメッセージ（後で編集しやすいように配列で定義）
const motivationMessages = [
  '始めるのがいちばんの難所',
  'やることやって遊ぼうぜ',
  '後回しにしちゃうの？',
  '未来の自分に楽させよう',
  '今やらなかったらいつやる？',
  'あとでやろうは馬鹿野郎',
  'リール見てないで課題しよう',
  '思考を止めるな！',
];
let motivationIndex = 0;
function showMotivationMessage() {
  const el = document.getElementById('motivation-message');
  if (!el) return;
  el.textContent = motivationMessages[motivationIndex];
  motivationIndex = (motivationIndex + 1) % motivationMessages.length;
}
setInterval(showMotivationMessage, 3000);
window.addEventListener('DOMContentLoaded', showMotivationMessage);