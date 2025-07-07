# ProductBoard 스타일 로드맵 웹앱

ProductBoard와 유사한 로드맵 웹앱으로, Node.js(Express) 백엔드와 정적 파일 기반 프론트엔드로 구현되었습니다.

## 🚀 주요 기능

### 1. 로드맵 카드 시스템
- **카드 형태의 컨텐츠 표시**: 제목, 설명, 상태, 카테고리, 우선순위, 진행률 표시
- **썸네일 이미지 지원**: 각 카드에 이미지 업로드 및 표시 기능
- **필터링 시스템**: 상태, 카테고리, 우선순위별 필터링
- **반응형 디자인**: 모바일/데스크톱 환경 모두 지원

### 2. 상호작용 기능
- **하트(♥) 기능**: 카드에 하트를 누를 수 있고, 개수가 실시간으로 동기화
- **댓글 시스템**: 각 카드에 댓글 작성/조회 가능
- **상세 모달**: 카드 클릭 시 전체 내용, 댓글, 하트, 진행률을 팝업으로 표시
- **진행률 표시**: 시각적 프로그레스 바로 진행 상황 표시

### 3. 관리자 기능
- **컨텐츠 관리**: 로드맵 아이템 추가/수정/삭제
- **카테고리 관리**: 카테고리 추가/삭제 (삭제 시 해당 컨텐츠는 "Uncategorized"로 자동 변경)
- **이미지 업로드**: multer를 사용한 썸네일 이미지 업로드
- **이력 관리**: 컨텐츠 수정/삭제 이력 조회 및 복구 기능

### 4. 데이터 관리
- **SQLite 데이터베이스**: 영구 저장소로 데이터 보존
- **이력 백업**: items_history 테이블로 최대 50개까지 변경 이력 보관
- **실시간 동기화**: 하트, 댓글 등의 변경사항이 즉시 반영

## 🛠 기술 스택

### 백엔드
- **Node.js + Express**: 서버 프레임워크
- **SQLite**: 데이터베이스
- **multer**: 파일 업로드 처리
- **CORS**: 크로스 오리진 요청 처리

### 프론트엔드
- **Vanilla JavaScript**: 순수 JS로 구현
- **CSS3**: 반응형 디자인 및 애니메이션
- **HTML5**: 시맨틱 마크업

## 📁 프로젝트 구조

```
card-content-app/
├── backend/
│   ├── index.js              # 메인 서버 파일
│   ├── package.json          # 의존성 관리
│   ├── public/               # 정적 파일들
│   │   ├── index.html        # 메인 페이지
│   │   ├── roadmap.js        # 로드맵 기능
│   │   ├── roadmap.css       # 로드맵 스타일
│   │   ├── admin.html        # 관리자 페이지
│   │   ├── admin.js          # 관리자 기능
│   │   ├── admin.css         # 관리자 스타일
│   │   └── styles.css        # 공통 스타일
│   └── uploads/              # 업로드된 이미지 저장소
└── README.md                 # 프로젝트 문서
```

## 🗄 데이터베이스 스키마

### items 테이블
- `id`: 고유 식별자
- `title`: 제목
- `description`: 설명
- `status`: 상태 (Planning, In Progress, Completed, On Hold)
- `category`: 카테고리
- `priority`: 우선순위 (Low, Medium, High, Critical)
- `progress`: 진행률 (0-100%)
- `thumbnail`: 썸네일 이미지 경로
- `heartCount`: 하트 개수
- `createdAt`: 생성일
- `updatedAt`: 수정일

### categories 테이블
- `id`: 고유 식별자
- `name`: 카테고리명

### comments 테이블
- `id`: 고유 식별자
- `itemId`: 아이템 ID
- `author`: 작성자명
- `content`: 댓글 내용
- `createdAt`: 작성일

### items_history 테이블
- `id`: 고유 식별자
- `itemId`: 아이템 ID
- `backupType`: 백업 타입 (UPDATE, DELETE)
- `backupAt`: 백업 시간
- 기타 아이템 필드들 (백업 시점의 상태)

## 🚀 실행 방법

1. **의존성 설치**
```bash
cd backend
npm install
```

2. **서버 실행**
```bash
npm start
```

3. **접속**
- 메인 페이지: `http://localhost:3000`
- 관리자 페이지: `http://localhost:3000/admin`

## 📋 구현 과정

### 1단계: 기본 구조
- Express 서버 설정
- 정적 파일 서빙
- 기본 HTML/CSS 구조

### 2단계: 정적 컨텐츠
- 하드코딩된 로드맵 데이터로 카드 표시
- 필터링 기능 구현

### 3단계: 동적 컨텐츠 관리
- 관리자 페이지 구현
- CRUD API 개발
- 이미지 업로드 기능

### 4단계: 상호작용 기능
- 하트 기능 구현
- 댓글 시스템 추가
- 상세 모달 구현

### 5단계: 데이터 영속성
- SQLite 데이터베이스 도입
- 메모리 기반에서 DB 기반으로 전환

### 6단계: 고급 기능
- 카테고리 관리 기능
- 이력 관리 시스템
- 실시간 동기화 개선

## 🎨 UI/UX 특징

### 메인 페이지
- **카드 레이아웃**: 깔끔한 그리드 형태의 카드 배치
- **필터 바**: 상단에 필터 옵션 배치
- **반응형**: 모바일에서도 최적화된 레이아웃

### 상세 모달
- **전체 내용 표시**: 카드의 모든 정보를 한눈에 확인
- **댓글 섹션**: 스크롤 가능한 댓글 영역
- **하트 기능**: 모달 내에서도 하트 누르기 가능
- **닫기 제한**: X 버튼으로만 닫기 (실수 방지)

### 관리자 페이지
- **직관적 폼**: 컨텐츠 추가/수정을 위한 사용자 친화적 폼
- **이력 관리**: 각 아이템별 변경 이력 조회 및 복구
- **카테고리 관리**: 카테고리 추가/삭제 기능

## 🔧 주요 API 엔드포인트

### 컨텐츠 관리
- `GET /api/roadmap` - 전체 로드맵 데이터
- `POST /api/roadmap/items` - 새 아이템 추가
- `PUT /api/roadmap/items/:id` - 아이템 수정
- `DELETE /api/roadmap/items/:id` - 아이템 삭제

### 상호작용
- `POST /api/roadmap/items/:id/heart` - 하트 추가
- `GET /api/roadmap/items/:id/comments` - 댓글 조회
- `POST /api/roadmap/items/:id/comments` - 댓글 추가

### 카테고리 관리
- `POST /api/roadmap/categories` - 카테고리 추가
- `DELETE /api/roadmap/categories/:name` - 카테고리 삭제

### 이력 관리
- `GET /api/roadmap/items/:id/history` - 아이템 이력 조회
- `POST /api/roadmap/items/:id/restore/:historyId` - 특정 이력으로 복구

## 🎯 향후 개선 방향

1. **사용자 인증**: 관리자 로그인 시스템
2. **실시간 업데이트**: WebSocket을 통한 실시간 동기화
3. **고급 필터링**: 날짜, 태그 등 추가 필터 옵션
4. **데이터 내보내기**: CSV/PDF 내보내기 기능
5. **모바일 앱**: React Native 앱 개발
6. **성능 최적화**: 이미지 압축, 캐싱 등

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 