# 🎬 구스범스 스튜디오 (Goosebumps Studio)

AI 기반 스토리보드 제작 엔진

## 🚀 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

## 🌐 Vercel 배포 방법

1. 이 프로젝트를 GitHub 레포지토리에 push
2. [Vercel](https://vercel.com) 접속 → GitHub 연결
3. 레포 선택 → Deploy 클릭
4. 배포 완료! 받은 URL로 어디서든 접속 가능

## 🔑 API 키

- 첫 화면에서 Gemini API 키를 입력하면 자동 저장됩니다
- API 키는 브라우저 localStorage에만 저장되며 외부 서버로 전송되지 않습니다
- [Google AI Studio](https://aistudio.google.com/apikey)에서 무료 키 발급 가능

## 📌 주요 기능

- **6가지 스타일 프리셋**: 야담풍, 심리학, Photorealistic, Anime Style, 3D Render, Digital Art
- **AI 자동 장면 분할**: 대본을 넣으면 AI가 자동으로 장면을 나눕니다
- **캐릭터 일관성**: 레퍼런스 이미지로 캐릭터 외형 고정
- **스타일 레퍼런스**: 원하는 화풍의 이미지를 업로드하면 반영
- **Standard/Ultra 모드**: 무료 키(Standard) 또는 유료 키(Ultra) 선택
