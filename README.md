# ENXBoardVue

같은 게시판의 Vue 3 화면이다. 단일 파일 컴포넌트가 아니라 문자열 템플릿이고, `vendor/vue/vue.js` 전체 빌드의 런타임 컴파일러가 그 문자열을 렌더 함수로 바꾼다. `vue.runtime`만 있으면 이 템플릿은 동작하지 않는다.

상태는 `Vue.reactive` 한 객체다. 공유 컨트롤러가 필드를 바꾸면 템플릿이 다시 그려진다. React처럼 `render`를 직접 호출하지 않는다.

## StackBlitz

https://stackblitz.com/fork/github/jrimchoi/enxboard-vue

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
| `js/view.js` | Vue 3 문자열 템플릿 |
| `js/app.js` | `reactive` 상태와 공유 컨트롤러 |
| `js/loader.js` | AMD 로더 |
| `vendor/vue/vue.js` | Vue 3.4.15 전체 빌드 |
| `vendor/enxboard` | 글 모델, 목록, 저장, 명령, 위젯, 스타일, 목 데이터 |
| `vendor/core` | 아이콘 CSS와 글꼴 |
