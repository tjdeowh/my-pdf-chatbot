require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;

// Sambanova Cloud 클라이언트 초기화 (OpenAI SDK 호환)
const openai = new OpenAI({
  apiKey: process.env.SAMBANOVA_API_KEY,
  baseURL: 'https://api.sambanova.ai/v1',
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// PDF 텍스트와 파일 목록을 메모리에 보관
let pdfText = '';
let pdfFileNames = [];

// 세션별 대화 내역
const conversationHistory = [];

// docs/ 폴더의 모든 PDF를 읽어 텍스트 추출
async function loadPdfDocuments() {
  // Vercel 배포 시 __dirname 기준으로 docs/ 경로 탐색
  const candidates = [
    path.join(__dirname, 'docs'),
    path.join(process.cwd(), 'docs'),
  ];

  let docsDir = null;
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      docsDir = candidate;
      break;
    }
  }

  if (!docsDir) {
    console.log('docs/ 폴더를 찾을 수 없습니다.');
    return;
  }

  // docs/ 폴더에서 PDF 파일만 필터링 (하위 폴더 제외)
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

  // gpt-4o-mini 컨텍스트 한도 고려, 30000자로 제한
  pdfText = extractedTexts.join('\n\n').slice(0, 30000);
  console.log(`총 ${pdfFileNames.length}개 PDF 로드 완료`);
}

// 로드된 PDF 파일 목록 반환 API
app.get('/api/pdfs', (req, res) => {
  res.json({ files: pdfFileNames });
});

// 채팅 API
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  if (!message || message.trim() === '') {
    return res.status(400).json({ error: '질문을 입력해주세요.' });
  }

  if (!pdfText) {
    return res.json({
      reply: 'docs/ 폴더에 PDF 파일이 없습니다. PDF를 추가한 후 서버를 재시작해주세요.',
    });
  }

  conversationHistory.push({ role: 'user', content: message });

  try {
    const response = await openai.chat.completions.create({
      model: 'Meta-Llama-3.3-70B-Instruct',
      messages: [
        {
          role: 'system',
          content: `당신은 업무 문서를 기반으로 질문에 답변하는 어시스턴트입니다.
아래 PDF 문서 내용을 참고하여 사용자의 질문에 한국어로 정확하게 답변해주세요.
문서에 없는 내용은 "해당 문서에서 관련 내용을 찾을 수 없습니다."라고 안내해주세요.

[PDF 문서 내용]
${pdfText}`,
        },
        ...conversationHistory.slice(-10),
      ],
    });

    const reply = response.choices[0].message.content;
    conversationHistory.push({ role: 'assistant', content: reply });
    res.json({ reply });
  } catch (err) {
    console.error('OpenAI API 오류:', err.message);
    res.status(500).json({ error: '답변을 가져오지 못했습니다. 잠시 후 다시 시도해주세요.' });
  }
});

// PDF 로드 완료 여부를 추적하는 Promise
const pdfReady = loadPdfDocuments();

// 서버리스 환경(Vercel)에서는 module.exports, 로컬에서는 직접 실행
if (require.main === module) {
  // 로컬 실행: PDF 로드 완료 후 서버 시작
  pdfReady.then(() => {
    app.listen(PORT, () => {
      console.log(`서버 실행 중: http://localhost:${PORT}`);
    });
  });
} else {
  // Vercel 서버리스: app export (PDF 로드는 pdfReady Promise로 관리)
  module.exports = app;
}
