# pdf-chatbot Planning Document

> **Summary**: PDF 문서를 읽고 사용자 질문에 한국어로 답변하는 업무 어시스턴트 챗봇
>
> **Project**: PDF 기반 업무 어시스턴트 챗봇
> **Version**: 0.1.0
> **Author**: tjdeowh
> **Date**: 2026-05-07
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 사용자가 업무 관련 PDF 문서에서 원하는 정보를 직접 찾는 데 시간이 오래 걸린다 |
| **Solution** | PDF 텍스트를 추출하여 Claude API에 컨텍스트로 전달하고, 사용자 질문에 자연어로 답변한다 |
| **Function/UX Effect** | 사용자가 채팅창에 질문을 입력하면 즉시 PDF 기반의 정확한 답변을 받을 수 있다 |
| **Core Value** | 업무 문서 검색 시간을 단축하고 정보 접근성을 높인다 |

---

## Context Anchor

> Executive Summary에서 자동 추출. Design/Do 문서에 전파되어 컨텍스트 연속성을 보장한다.

| Key | Value |
|-----|-------|
| **WHY** | 업무 PDF 문서에서 정보를 빠르게 찾지 못하는 문제를 해결하기 위해 |
| **WHO** | PDF 업무 문서를 자주 참조하는 실무 담당자 |
| **RISK** | PDF 텍스트 추출 실패 또는 Claude API 토큰 한도 초과 |
| **SUCCESS** | 질문 입력 후 3초 이내 답변, PDF 내용 기반 정확한 응답 |
| **SCOPE** | Phase 1: 서버 구축 + PDF 파싱 + Claude API 연동 + 채팅 UI |

---

## 1. Overview

### 1.1 Purpose

`docs/` 폴더에 저장된 PDF 문서를 서버에서 읽어 텍스트를 추출하고, 사용자가 채팅 UI에서 질문하면 Claude API(`claude-haiku-4-5`)가 해당 내용을 바탕으로 답변을 반환한다.

### 1.2 Background

업무 현장에서 규정집, 매뉴얼, 보고서 등 PDF 문서를 수시로 참조해야 하는 상황이 많다. 문서를 직접 열어 검색하는 대신 챗봇에게 질문하면 빠르게 원하는 내용을 얻을 수 있다.

### 1.3 Related Documents

- CLAUDE.md: 프로젝트 규칙 및 기술 스택 정의
- .gitignore: 민감 파일 제외 설정

---

## 2. Scope

### 2.1 In Scope

- [x] Express 서버 구축 (server.js)
- [x] `docs/` 폴더 PDF 텍스트 자동 추출 (서버 시작 시)
- [x] `/api/chat` POST 엔드포인트 (사용자 질문 → Claude API → 답변 반환)
- [x] HTML/CSS/JS 기반 채팅 UI (public/)
- [x] Vercel 배포 설정 (vercel.json)
- [x] 세션 중 대화 내역 유지 (서버 메모리, 브라우저 재시작 시 초기화)

### 2.2 Out of Scope

- 사용자 인증 / 로그인 기능
- PDF 파일 업로드 UI (docs/ 폴더에 직접 저장하는 방식 사용)
- 대화 내역 DB 영구 저장
- 다국어 지원 (한국어 단일)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 서버 시작 시 `docs/` 폴더의 모든 PDF를 읽어 텍스트 추출 | High | Pending |
| FR-02 | POST `/api/chat` — 질문 수신 후 Claude API 호출, 답변 반환 | High | Pending |
| FR-03 | 추출한 PDF 텍스트를 Claude 시스템 프롬프트에 포함 | High | Pending |
| FR-04 | 채팅 UI: 메시지 입력창, 전송 버튼, 대화 내역 표시 | High | Pending |
| FR-05 | 세션 중 대화 내역(messages 배열) 서버 메모리에 유지 | Medium | Pending |
| FR-06 | PDF 없을 때 안내 메시지 반환 | Medium | Pending |
| FR-07 | Vercel 배포 가능한 프로젝트 구조 | High | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | 질문 후 응답까지 10초 이내 (네트워크 포함) | 브라우저 개발자 도구 |
| Security | API 키는 서버에서만 처리, 프론트엔드 노출 금지 | 코드 리뷰 |
| Security | `.env` 파일 Git 미포함 | .gitignore 확인 |
| Usability | 모바일 브라우저에서도 사용 가능한 반응형 UI | 직접 테스트 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] `docs/` 폴더에 PDF를 넣으면 서버가 자동으로 텍스트 추출
- [ ] 채팅창에서 질문 입력 → PDF 기반 답변 정상 수신
- [ ] API 키가 프론트엔드 코드에 노출되지 않음
- [ ] `vercel deploy` 명령으로 배포 성공
- [ ] `.env` 파일이 Git에 포함되지 않음

### 4.2 Quality Criteria

- [ ] PDF 텍스트 추출 실패 시 에러 메시지 처리
- [ ] Claude API 호출 실패 시 사용자에게 안내 메시지 표시
- [ ] 빈 질문 입력 시 전송 차단

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| PDF 텍스트 추출 라이브러리 호환성 문제 | High | Medium | `pdf-parse` 라이브러리 사용, 실패 시 `pdfjs-dist` 대체 |
| Claude API 토큰 한도 초과 (대용량 PDF) | High | Medium | PDF 텍스트를 최대 길이로 잘라 전달 (예: 8000자) |
| Vercel 서버리스 환경에서 PDF 파일 접근 불가 | High | Low | `docs/` 폴더를 정적 에셋으로 포함하거나 Base64 인코딩 저장 방식 검토 |
| API 키 환경 변수 누락으로 배포 실패 | Medium | Low | Vercel 대시보드 환경 변수 설정 체크리스트 작성 |

---

## 6. Impact Analysis

### 6.1 Changed Resources

| Resource | Type | Change Description |
|----------|------|--------------------|
| `server.js` | 신규 파일 | Express 서버, PDF 파싱, Claude API 연동 |
| `public/index.html` | 신규 파일 | 채팅 UI 메인 페이지 |
| `public/style.css` | 신규 파일 | 채팅 UI 스타일 |
| `public/app.js` | 신규 파일 | 채팅 UI 프론트엔드 로직 |
| `vercel.json` | 신규 파일 | Vercel 배포 설정 |
| `package.json` | 신규 파일 | 의존성 정의 |

### 6.2 Current Consumers

신규 프로젝트이므로 기존 소비자 없음.

### 6.3 Verification

- [ ] server.js의 API 키가 환경 변수로만 처리됨을 확인
- [ ] public/app.js에 API 키 관련 코드가 없음을 확인

---

## 7. Architecture Considerations

### 7.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | 단순 구조 (`public/`, `server.js`) | 정적 사이트, 간단한 서버 | ☑ |
| **Dynamic** | 기능 모듈화, BaaS 연동 | 풀스택 웹앱 | ☐ |
| **Enterprise** | 레이어 분리, DI, 마이크로서비스 | 대규모 시스템 | ☐ |

→ **Starter** 수준 선택: 단일 서버 파일 + 정적 프론트엔드로 충분

### 7.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| 서버 프레임워크 | Express / Fastify / Koa | Express | 간단하고 Vercel 호환성 우수 |
| PDF 파싱 | pdf-parse / pdfjs-dist | pdf-parse | Node.js 환경에서 간단한 API |
| Claude API | Anthropic SDK / fetch | @anthropic-ai/sdk | 공식 SDK로 안정적 |
| 프론트엔드 | React / Vue / Vanilla JS | Vanilla JS | 빌드 도구 없이 바로 배포 가능 |
| 스타일링 | Tailwind / CSS Modules / 일반 CSS | 일반 CSS | 의존성 최소화 |
| 배포 | Vercel / Netlify / Railway | Vercel | 서버리스 함수 지원 |

### 7.3 폴더 구조

```
my-pdf-chatbot/
├── docs/              # PDF 문서 보관 (Git 추적)
├── public/
│   ├── index.html     # 채팅 UI
│   ├── style.css      # 스타일
│   └── app.js         # 프론트엔드 로직
├── server.js          # Express 서버 (PDF 파싱 + Claude API)
├── vercel.json        # Vercel 배포 설정
├── package.json
├── .env               # API 키 (Git 제외)
├── .gitignore
└── CLAUDE.md
```

---

## 8. Convention Prerequisites

### 8.1 Existing Project Conventions

- [x] `CLAUDE.md` 존재 (API 키 보안, 한국어 주석 규칙 포함)
- [x] `.gitignore` 존재 (.env, node_modules/ 제외)
- [ ] ESLint / Prettier 설정 (이 프로젝트에서는 불필요)

### 8.2 Conventions to Define/Verify

| Category | Current State | To Define | Priority |
|----------|---------------|-----------|:--------:|
| **API 키 처리** | CLAUDE.md에 정의됨 | 서버에서만 처리, 프론트 노출 금지 | High |
| **주석 언어** | CLAUDE.md에 정의됨 | 한국어 주석 | High |
| **폴더 구조** | CLAUDE.md에 정의됨 | docs/ PDF 보관 | High |

### 8.3 Environment Variables Needed

| Variable | Purpose | Scope | To Be Created |
|----------|---------|-------|:-------------:|
| `ANTHROPIC_API_KEY` | Claude API 인증 | Server only | ☑ (이미 .env 존재) |

---

## 9. Next Steps

1. [ ] Design 문서 작성 (`/pdca design pdf-chatbot`)
2. [ ] `package.json` 및 의존성 설치 (`express`, `pdf-parse`, `@anthropic-ai/sdk`)
3. [ ] 구현 시작 (`/pdca do pdf-chatbot`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-05-07 | Initial draft | tjdeowh |
