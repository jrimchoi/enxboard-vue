# ENXBoardVue

같은 게시판을 Vue 3 앱으로 만든 것이다. 단일 파일 컴포넌트와 `reactive`를 쓰고, AMD 모듈은 없다.

화면은 `src/Board.vue`다. 목록은 `src/grid/DataGrid.vue`다. 열 너비, 순서, 고정, 숨기기, 필터, 다중 정렬, 행 선택과 순서는 `src/grid/model.js`가 계산하고 너비는 `enx-grid:enxboard`에 남는다. 이 모델 파일은 React, Next와 같고 화면만 Vue다. 상세, 등록, 수정, 삭제, 검색, 5건 쪽 나눔은 `src/composables/useBoard.js`가 상태로 가진다. 검사와 정렬은 `src/domain.js`의 함수다. 글은 `public/data/posts.json`을 읽어 메모리에만 둔다. 아이콘 글꼴은 `public/core`에 있다.

## StackBlitz

https://stackblitz.com/fork/github/jrimchoi/enxboard-vue

Vite 개발 서버가 열리고 미리보기는 `/`다.

## 로컬

```text
npm install
npm run dev
```

| 주소 | 화면 |
|---|---|
| `/` | 게시판 |
| `/mock-shell.html` | 대시보드 목 셸 |

## 구성

| 경로 | 역할 |
|---|---|
| `src/main.js` | `createApp` |
| `src/Board.vue` | 템플릿과 입력 |
| `src/composables/useBoard.js` | 화면 상태. Vue `reactive` |
| `src/domain.js` | 검색, 쪽, 검사, 저장 |
| `src/widget.js` | 목 셸의 위젯 이벤트 |
| `src/styles/board.css` | 화면 골격 |
