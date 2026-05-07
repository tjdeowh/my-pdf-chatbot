require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// JSON 요청 파싱 미들웨어
app.use(express.json());

// public 폴더를 정적 파일로 제공
app.use(express.static(path.join(__dirname, 'public')));

// PDF 텍스트와 파일 목록을 메모리에 보관
let pdfText = '';
let pdfFileNames = [];

// 세션별 대화 내역 (간단한 메모리 방식)
const conversationHistory = [];

// docs/ 폴더의 모든 PDF를 읽어 텍스트 추출
async function loadPdfDocuments() {
  const docsDir = path.join(__dirname, 'docs');

  // docs 폴더가 없으면 생성
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir);
    console.log('docs/ 폴더가 없어 새로 생성했습니다.');
    return;
  }

  // docs/ 폴더에서 PDF 파일만 필터링
  const files = fs.readdirSync(docsDir).filter((f) => f.endsWith('.pdf'));

  if (files.length === 0) {
    console.log('docs/ 폴더에 PDF 파일이 없습니다.');
    return;
  }

  const extractedTexts = [];
  pdfFileNames = [];

  for (const file of files) {
    const filePath = path.join(docsDir, file);
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      extractedTexts.push(`[${file}]\n${data.text}`);
      pdfFileNames.push(file);
      console.log(`PDF 로드 완료: ${file} (${data.numpages}페이지)`);
    } catch (err) {
      console.error(`PDF 파싱 실패: ${file}`, err.message);
    }
  }

  // 여러 PDF 텍스트를 하나로 합치고 토큰 한도 초과 방지를 위해 8000자로 제한
  pdfText = extractedTexts.join('\n\n').slice(0, 8000);
  console.log(`총 ${pdfFileNames.length}개 PDF 로드 완료`);
}

// 로드된 PDF 파일 목록 반환 API
app.get('/api/pdfs', (req, res) => {
  res.json({ files: pdfFileNames });
});

// 채팅 API — 사용자 질문을 받아 OpenAI에 전달 후 답변 반환
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  // 빈 메시지 차단
  if (!message || message.trim() === '') {
    return res.status(400).json({ error: '질문을 입력해주세요.' });
  }

  // PDF가 로드되지 않은 경우 안내 메시지
  if (!pdfText) {
    return res.json({
      reply: 'docs/ 폴더에 PDF 파일이 없습니다. PDF를 추가한 후 서버를 재시작해주세요.',
    });
  }

  // 대화 내역에 사용자 메시지 추가
  conversationHistory.push({ role: 'user', content: message });

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          // PDF 내용을 시스템 프롬프트에 포함
          role: 'system',
          content: `당신은 업무 문서를 기반으로 질문에 답변하는 어시스턴트입니다.
아래 PDF 문서 내용을 참고하여 사용자의 질문에 한국어로 정확하게 답변해주세요.
문서에 없는 내용은 "해당 문서에서 관련 내용을 찾을 수 없습니다."라고 안내해주세요.

[PDF 문서 내용]
${pdfText}`,
        },
        // 이전 대화 내역 포함 (최근 10개로 제한)
        ...conversationHistory.slice(-10),
      ],
    });

    const reply = response.choices[0].message.content;

    // 대화 내역에 AI 응답 추가
    conversationHistory.push({ role: 'assistant', content: reply });

    res.json({ reply });
  } catch (err) {
    console.error('OpenAI API 오류:', err.message);
    res.status(500).json({ error: '답변을 가져오지 못했습니다. 잠시 후 다시 시도해주세요.' });
  }
});

// 서버 시작 시 PDF 로드 후 Express 서버 실행
loadPdfDocuments().then(() => {
  app.listen(PORT, () => {
    console.log(`서버 실행 중: http://localhost:${PORT}`);
  });
});
