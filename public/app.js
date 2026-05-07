// DOM 요소 참조
const chatMessages = document.getElementById('chat-messages');
const emptyState = document.getElementById('empty-state');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const pdfList = document.getElementById('pdf-list');
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');

// 사이드바 토글 (모바일)
sidebarToggle.addEventListener('click', () => {
  sidebar.classList.toggle('open');
  overlay.classList.toggle('active');
});

// 오버레이 클릭 시 사이드바 닫기
overlay.addEventListener('click', () => {
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
});

// 서버에서 로드된 PDF 파일 목록 가져오기
async function loadPdfList() {
  try {
    const res = await fetch('/api/pdfs');
    const data = await res.json();

    if (data.files.length === 0) {
      pdfList.innerHTML = '<li class="pdf-empty">로드된 문서 없음</li>';
    } else {
      pdfList.innerHTML = data.files
        .map((f) => `<li class="pdf-item">${f}</li>`)
        .join('');
    }
  } catch {
    pdfList.innerHTML = '<li class="pdf-empty">목록 불러오기 실패</li>';
  }
}

// 말풍선을 채팅 영역에 추가
function appendMessage(role, text, isError = false) {
  // 첫 메시지가 추가될 때 빈 상태 화면 숨기기
  if (emptyState.style.display !== 'none') {
    emptyState.style.display = 'none';
  }

  const messageEl = document.createElement('div');
  messageEl.className = `message ${role}`;

  const bubbleEl = document.createElement('div');
  bubbleEl.className = `bubble${isError ? ' error' : ''}`;
  bubbleEl.textContent = text;

  messageEl.appendChild(bubbleEl);
  chatMessages.appendChild(messageEl);

  // 새 메시지로 자동 스크롤
  chatMessages.scrollTop = chatMessages.scrollHeight;

  return messageEl;
}

// 로딩 말풍선 표시
function showLoading() {
  if (emptyState.style.display !== 'none') {
    emptyState.style.display = 'none';
  }

  const messageEl = document.createElement('div');
  messageEl.className = 'message assistant';
  messageEl.id = 'loading-bubble';

  messageEl.innerHTML = `
    <div class="bubble loading">
      <span></span><span></span><span></span>
    </div>
  `;

  chatMessages.appendChild(messageEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 로딩 말풍선 제거
function hideLoading() {
  const loading = document.getElementById('loading-bubble');
  if (loading) loading.remove();
}

// 입력창 높이를 내용에 맞게 자동 조절
function autoResizeTextarea() {
  userInput.style.height = 'auto';
  userInput.style.height = `${userInput.scrollHeight}px`;
}

// 메시지 전송 처리
async function sendMessage() {
  const message = userInput.value.trim();

  // 빈 메시지 전송 차단
  if (!message) return;

  // 입력창 초기화 및 버튼 비활성화
  userInput.value = '';
  userInput.style.height = 'auto';
  sendBtn.disabled = true;

  // 사용자 메시지 말풍선 추가
  appendMessage('user', message);

  // 로딩 표시
  showLoading();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    const data = await res.json();
    hideLoading();

    if (!res.ok || data.error) {
      // API 오류 시 에러 말풍선 표시
      appendMessage('assistant', `⚠ ${data.error || '답변을 가져오지 못했습니다. 잠시 후 다시 시도해주세요.'}`, true);
    } else {
      appendMessage('assistant', data.reply);
    }
  } catch {
    hideLoading();
    appendMessage('assistant', '⚠ 서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.', true);
  }

  // 버튼 다시 활성화 후 입력창 포커스
  sendBtn.disabled = false;
  userInput.focus();
}

// Enter 키로 전송 (Shift+Enter는 줄바꿈)
userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// 전송 버튼 클릭
sendBtn.addEventListener('click', sendMessage);

// 입력창 자동 높이 조절
userInput.addEventListener('input', autoResizeTextarea);

// 페이지 로드 시 PDF 목록 불러오기
loadPdfList();
