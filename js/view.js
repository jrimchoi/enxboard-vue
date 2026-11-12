define("DS/ENXBoardVue/js/view", ["DS/vue-3.4.15/vue"], function (Vue) {
    var template = [
        '<div>',
        '<p v-if="!state.list && state.screen === \'list\'">게시판을 불러오는 중입니다.</p>',
        '<template v-else>',
        '<header><h1><i class="wux-ui-3ds wux-ui-3ds-list" aria-hidden="true"></i> {{ heading() }}</h1></header>',
        '<p v-if="state.notice" class="notice">{{ state.notice }}</p>',
        '<ul v-if="state.errors.length" class="errors"><li v-for="error in state.errors" :key="error">{{ error }}</li></ul>',
        '<template v-if="state.screen === \'list\'">',
        '<form class="toolbar" @submit.prevent="onSearch">',
        '<i class="wux-ui-3ds wux-ui-3ds-search" aria-hidden="true"></i>',
        '<input name="query" type="search" :value="state.query" placeholder="제목, 작성자, 본문, 태그">',
        '<button type="submit">검색</button>',
        '<button type="button" @click="command(\'create\', {})"><i class="wux-ui-3ds wux-ui-3ds-plus" aria-hidden="true"></i> 새 글</button>',
        '</form>',
        '<p class="count">전체 {{ state.list.total }}건, {{ state.list.page }} / {{ state.list.pageCount }}쪽</p>',
        '<div class="grid-host"><table><thead><tr><th>제목</th><th>작성자</th><th>날짜</th><th>태그</th></tr></thead>',
        '<tbody>',
        '<tr v-if="!state.list.items.length"><td colspan="4" class="empty">검색 결과가 없습니다.</td></tr>',
        '<tr v-for="post in state.list.items" :key="post.id">',
        '<td><button type="button" class="link" @click="command(\'open\', { id: post.id })">{{ post.title }}</button></td>',
        '<td>{{ post.author }}</td><td>{{ post.date }}</td><td>{{ post.tags.join(", ") }}</td>',
        '</tr></tbody></table></div>',
        '<div class="pager">',
        '<button type="button" :disabled="state.list.page <= 1" @click="command(\'page\', { page: state.list.page - 1 })"><i class="wux-ui-3ds wux-ui-3ds-left" aria-hidden="true"></i> 이전</button>',
        '<button type="button" :disabled="state.list.page >= state.list.pageCount" @click="command(\'page\', { page: state.list.page + 1 })">다음</button>',
        '</div>',
        '</template>',
        '<template v-else-if="state.screen === \'detail\' && state.post">',
        '<p class="meta">{{ state.post.author }} · {{ state.post.date }}</p>',
        '<p>{{ state.post.tags.join(", ") }}</p>',
        '<article class="content">{{ state.post.content }}</article>',
        '<div class="actions">',
        '<button type="button" @click="command(\'back\', {})"><i class="wux-ui-3ds wux-ui-3ds-left" aria-hidden="true"></i> 목록</button>',
        '<button type="button" @click="command(\'edit\', { id: state.post.id })"><i class="wux-ui-3ds wux-ui-3ds-pencil" aria-hidden="true"></i> 수정</button>',
        '<button type="button" @click="command(\'delete\', { id: state.post.id })"><i class="wux-ui-3ds wux-ui-3ds-trash" aria-hidden="true"></i> 삭제</button>',
        '</div>',
        '</template>',
        '<form v-else class="editor" @submit.prevent="onSave">',
        '<label>제목<input name="title" :value="field(\'title\')"></label>',
        '<label>작성자<input name="author" :value="field(\'author\')"></label>',
        '<label>날짜<input name="date" :value="field(\'date\')"></label>',
        '<label>본문<textarea name="content" rows="8" :value="field(\'content\')"></textarea></label>',
        '<label>태그<input name="tags" :value="tagsValue()"></label>',
        '<div class="actions">',
        '<button type="button" @click="command(\'cancel\', {})"><i class="wux-ui-3ds wux-ui-3ds-left" aria-hidden="true"></i> 취소</button>',
        '<button type="submit"><i class="wux-ui-3ds wux-ui-3ds-check" aria-hidden="true"></i> 저장</button>',
        '</div></form>',
        '</template>',
        '</div>',
    ].join("");

    function mount(root, state, onCommand) {
        window.Vue = Vue;
        var app = Vue.createApp({
            setup: function () {
                return { state: state, command: onCommand };
            },
            methods: {
                heading: function () {
                    if (this.state.screen === "detail" && this.state.post) {
                        return this.state.post.title;
                    }
                    if (this.state.screen === "create") {
                        return "새 글";
                    }
                    if (this.state.screen === "edit") {
                        return "글 수정";
                    }
                    return "게시판";
                },
                field: function (name) {
                    return (this.state.post && this.state.post[name]) || "";
                },
                tagsValue: function () {
                    var tags = this.state.post && this.state.post.tags;
                    return Array.isArray(tags) ? tags.join(", ") : tags || "";
                },
                onSearch: function (event) {
                    this.command("search", { query: event.target.query.value });
                },
                onSave: function (event) {
                    var form = event.target;
                    this.command("save", {
                        fields: {
                            title: form.title.value,
                            author: form.author.value,
                            date: form.date.value,
                            content: form.content.value,
                            tags: form.tags.value,
                        },
                    });
                },
            },
            template: template,
        });
        app.mount(root);
        return app;
    }

    return { mount: mount };
});
