/*
 * Vue 3 앱의 진입이다. createApp이 단일 파일 컴포넌트 Board를 #board에 마운트한다.
 * AMD define/require는 쓰지 않는다. Vite가 .vue를 컴파일한다.
 * React는 createRoot, Next는 pages/index.js가 이 역할이다.
 */
import { createApp } from "vue";
import Board from "./Board.vue";
import "./styles/board.css";

createApp(Board).mount("#board");
