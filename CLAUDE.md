# CLAUDE.md — PDF 기반 업무 어시스턴트 챗봇

## 프로젝트 개요

- **프로젝트명**: PDF 기반 업무 어시스턴트 챗봇
- **목적**: PDF 문서를 읽고 사용자 질문에 답변하는 챗봇
- **배포 환경**: Vercel

## 기술 스택

- **서버**: Node.js + Express
- **프론트엔드**: HTML / CSS / JavaScript
- **AI API**: Sambanova Cloud API, Meta-Llama-3.3-70B-Instruct (무료)

## 프로젝트 구조

```
my-pdf-chatbot/
├── docs/          # PDF 문서 보관 폴더
├── public/        # 프론트엔드 파일 (HTML, CSS, JS)
├── server.js      # Express 서버 진입점
├── .env           # 환경 변수 (Git에 추가 금지)
├── .gitignore
└── CLAUDE.md
```

## 필수 규칙 (반드시 준수)

1. **`.env` 파일은 절대 수정하거나 Git에 추가하지 말 것**
2. **API 키는 서버에서만 처리** — 프론트엔드 코드에 노출 금지
3. **PDF 파일은 `docs/` 폴더에 보관**
4. **모든 주석은 한국어로 작성**

## 환경 변수

`.env` 파일에 아래 항목이 정의되어 있어야 한다. 값은 직접 확인할 것.

```
SAMBANOVA_API_KEY=your_api_key_here
```

## 응답 및 코드 작성 규칙

- 모든 답변은 한국어로 작성한다.
- 코드 설명은 초보자도 이해할 수 있도록 쉽게 풀어서 설명한다.
- 주석은 반드시 한글로 작성한다.
- 보안에 민감한 정보(API 키, 토큰 등)는 절대 코드에 하드코딩하지 않는다.
