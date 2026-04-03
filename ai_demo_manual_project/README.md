# AI 매뉴얼 데모

## 사전 요구사항

- [Node.js 22 이상](https://nodejs.org/) 설치 필요

## 시작하기

### 1. 패키지 설치
```bash
npm install
```

### 2. 환경 변수 설정

`.env.example` 파일을 복사해 `.env` 파일을 만들고, API 키를 입력합니다.

```bash
copy .env.example .env
```

`.env` 파일을 열어 아래 두 값을 직접 채워넣으세요:

| 항목 | 설명 | 발급 링크 |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API 키 | https://aistudio.google.com/apikey |
| `GITHUB_TOKEN` | GitHub Personal Access Token (read:contents 권한) | https://github.com/settings/tokens |

### 3. 서버 실행
```bash
npm start
```

브라우저에서 http://localhost:4173 접속
