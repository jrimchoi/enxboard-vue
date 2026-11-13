<!--
  Vue 단일 파일 컴포넌트다. <template>은 Vite의 vue 플러그인이 렌더 함수로 컴파일한다.
  v-if와 v-for가 화면을 고른다. {{ }}는 텍스트를 이스케이프한다.
  입력은 v-model이라 컴포넌트 안의 form 객체가 글자를 가진다.
  React는 JSX와 useState, Next는 pages 안의 JSX가 같은 화면을 그린다.
-->
<script setup>
import { reactive, watch } from "vue";
import { useBoard } from "./composables/useBoard";
import DataGrid from "./grid/DataGrid.vue";

var columns = [
    { text: "제목", dataIndex: "tree", width: 280, editableFlag: true },
    { text: "작성자", dataIndex: "author", width: 120, editableFlag: true },
    { text: "날짜", dataIndex: "date", typeRepresentation: "date", width: 120, editableFlag: true },
    { text: "태그", dataIndex: "tags", width: 160, editableFlag: true },
];

var board = useBoard();
var state = board.state;
var form = reactive({ title: "", author: "", date: "", content: "", tags: "" });

watch(
    function () {
        return [state.screen, state.post && state.post.id, state.errors.join("|")].join(":");
    },
    function () {
        var post = state.post || {};
        form.title = post.title || "";
        form.author = post.author || "";
        form.date = post.date || "";
        form.content = post.content || "";
        form.tags = Array.isArray(post.tags) ? post.tags.join(", ") : "";
    },
    { immediate: true }
);

function heading() {
    if (state.screen === "detail" && state.post) return state.post.title;
    if (state.screen === "create") return "새 글";
    if (state.screen === "edit") return "글 수정";
    return "게시판";
}

function onSearch(event) {
    board.handle("search", { query: event.target.query.value });
}

function onSave() {
    board.handle("save", { fields: { title: form.title, author: form.author, date: form.date, content: form.content, tags: form.tags } });
}
</script>

<template>
    <p v-if="state.loadError">{{ state.loadError }}</p>
    <p v-else-if="!state.list && state.screen === 'list'">게시판을 불러오는 중입니다.</p>
    <template v-else>
        <header>
            <h1><i class="wux-ui-3ds wux-ui-3ds-list" aria-hidden="true"></i> {{ heading() }}</h1>
        </header>
        <p v-if="state.notice" class="notice">{{ state.notice }}</p>
        <ul v-if="state.errors.length" class="errors">
            <li v-for="error in state.errors" :key="error">{{ error }}</li>
        </ul>
        <template v-if="state.screen === 'list'">
            <form class="toolbar" @submit.prevent="onSearch">
                <i class="wux-ui-3ds wux-ui-3ds-search" aria-hidden="true"></i>
                <input name="query" type="search" :value="state.query" placeholder="제목, 작성자, 본문, 태그">
                <button type="submit">검색</button>
                <button type="button" @click="board.handle('create', {})"><i class="wux-ui-3ds wux-ui-3ds-plus" aria-hidden="true"></i> 새 글</button>
            </form>
            <p class="count">전체 {{ state.list.total }}건, {{ state.list.page }} / {{ state.list.pageCount }}쪽</p>
            <div class="grid-host">
                <DataGrid
                    identifier="enxboard"
                    :rows="state.list.items"
                    :columns="columns"
                    :sort-model="state.sort"
                    :filters="state.filters"
                    :find-query="state.query"
                    row-selection="multiple"
                    empty-text="검색 결과가 없습니다."
                    @sort="board.handle('sort', { sortModel: $event })"
                    @filter="board.handle('filter', { filters: $event })"
                    @reorder="board.handle('reorder', $event)"
                    @cell-edit="board.handle('cell-edit', $event)"
                    @activate="board.handle('open', { id: $event.node.id })"
                />
            </div>
            <div class="pager">
                <button type="button" :disabled="state.list.page <= 1" @click="board.handle('page', { page: state.list.page - 1 })"><i class="wux-ui-3ds wux-ui-3ds-left" aria-hidden="true"></i> 이전</button>
                <button type="button" :disabled="state.list.page >= state.list.pageCount" @click="board.handle('page', { page: state.list.page + 1 })">다음</button>
            </div>
        </template>
        <template v-else-if="state.screen === 'detail' && state.post">
            <p class="meta">{{ state.post.author }} · {{ state.post.date }}</p>
            <p>{{ state.post.tags.join(", ") }}</p>
            <article class="content">{{ state.post.content }}</article>
            <div class="actions">
                <button type="button" @click="board.handle('back', {})"><i class="wux-ui-3ds wux-ui-3ds-left" aria-hidden="true"></i> 목록</button>
                <button type="button" @click="board.handle('edit', { id: state.post.id })"><i class="wux-ui-3ds wux-ui-3ds-pencil" aria-hidden="true"></i> 수정</button>
                <button type="button" @click="board.handle('delete', { id: state.post.id })"><i class="wux-ui-3ds wux-ui-3ds-trash" aria-hidden="true"></i> 삭제</button>
            </div>
        </template>
        <form v-else class="editor" @submit.prevent="onSave">
            <label>제목<input v-model="form.title"></label>
            <label>작성자<input v-model="form.author"></label>
            <label>날짜<input v-model="form.date"></label>
            <label>본문<textarea v-model="form.content" rows="8"></textarea></label>
            <label>태그<input v-model="form.tags"></label>
            <div class="actions">
                <button type="button" @click="board.handle('cancel', {})"><i class="wux-ui-3ds wux-ui-3ds-left" aria-hidden="true"></i> 취소</button>
                <button type="submit"><i class="wux-ui-3ds wux-ui-3ds-check" aria-hidden="true"></i> 저장</button>
            </div>
        </form>
    </template>
</template>
