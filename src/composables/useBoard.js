/*
 * Vue 게시판 상태다. reactive 객체 하나를 화면이 그대로 읽는다.
 * 필드를 바꾸면 템플릿이 다시 그려진다. render를 호출하지 않는다.
 * React는 setState로 스냅샷을 바꾸고, Next도 useState다.
 * 글 목록은 이 컴포저블 안에만 있다. define이나 require는 없다.
 */
import { onMounted, reactive } from "vue";
import { PAGE_SIZE, createPost, deletePost, findPost, normalize, pageOf, updatePost } from "../domain";
import { bindWidget } from "../widget";

export function useBoard() {
    var state = reactive({
        screen: "list",
        query: "",
        page: 1,
        sort: [{ dataIndex: "date", sort: "desc" }],
        posts: [],
        list: null,
        post: null,
        errors: [],
        notice: "",
        loadError: "",
    });
    var started = false;
    var refreshTimer = 0;
    var widget = null;

    function showList() {
        var list = pageOf(state.posts, state.page, PAGE_SIZE, state.query, state.sort);
        state.screen = "list";
        state.list = list;
        state.page = list.page;
        state.post = null;
        state.errors = [];
    }

    function showDetail(id) {
        var found = findPost(state.posts, id);
        if (!found) {
            state.errors = ["글을 찾지 못했습니다."];
            return;
        }
        state.screen = "detail";
        state.post = normalize(found);
        state.errors = [];
    }

    function handle(command, payload) {
        payload = payload || {};
        if (command === "search") {
            state.query = payload.query || "";
            state.page = 1;
            state.notice = "";
            if (widget && widget.setValue) widget.setValue("query", state.query);
            showList();
            return;
        }
        if (command === "page") {
            state.page = payload.page;
            showList();
            return;
        }
        if (command === "sort") {
            state.sort = payload.sortModel && payload.sortModel.length ? payload.sortModel : [{ dataIndex: "date", sort: "desc" }];
            state.page = 1;
            showList();
            return;
        }
        if (command === "open") {
            state.notice = "";
            showDetail(payload.id);
            return;
        }
        if (command === "create") {
            state.errors = [];
            state.notice = "";
            state.screen = "create";
            state.post = null;
            return;
        }
        if (command === "edit") {
            state.errors = [];
            showDetail(payload.id);
            if (state.post) state.screen = "edit";
            return;
        }
        if (command === "delete") {
            if (!window.confirm("이 글을 삭제할까요?")) return;
            var removed = deletePost(state.posts, payload.id);
            if (!removed.ok) {
                state.errors = removed.errors;
                return;
            }
            state.posts = removed.posts;
            state.notice = "글을 삭제했습니다.";
            state.page = 1;
            showList();
            return;
        }
        if (command === "save") {
            var editingId = state.post && state.post.id;
            var result = state.screen === "create" ? createPost(state.posts, payload.fields) : updatePost(state.posts, editingId, payload.fields);
            if (!result.ok) {
                state.errors = result.errors;
                state.post = Object.assign({ id: editingId || "" }, normalize(payload.fields));
                return;
            }
            state.posts = result.posts;
            state.notice = state.screen === "create" ? "글을 등록했습니다." : "글을 수정했습니다.";
            state.errors = [];
            showDetail(result.post.id);
            return;
        }
        if (command === "back" || command === "cancel") {
            state.errors = [];
            if (command === "cancel" && state.screen === "edit" && state.post && state.post.id) {
                showDetail(state.post.id);
                return;
            }
            showList();
        }
    }

    function start() {
        if (started) return;
        started = true;
        if (widget && widget.setValue) widget.setValue("tenantAware", true);
        if (widget && widget.setTitle) widget.setTitle("ENXBoard");
        fetch("/data/posts.json")
            .then(function (response) {
                if (!response.ok) throw new Error("목 데이터를 읽지 못했습니다.");
                return response.json();
            })
            .then(function (rows) {
                state.posts = rows.map(normalize);
                var saved = widget && widget.getValue && widget.getValue("query");
                if (typeof saved === "string") state.query = saved;
                showList();
            })
            .catch(function (error) {
                state.loadError = (error && error.message) || "게시판을 시작하지 못했습니다.";
            });
    }

    onMounted(function () {
        widget = bindWidget({
            onLoad: start,
            onRefresh: function () {
                if (!state.list) return;
                window.clearTimeout(refreshTimer);
                refreshTimer = window.setTimeout(showList, 1000);
            },
            onSearch: function (data) {
                var query = "";
                if (typeof data === "string") query = data;
                else if (data && typeof data.query === "string") query = data.query;
                else if (data && typeof data.searchQuery === "string") query = data.searchQuery;
                handle("search", { query: query });
            },
        });
        start();
    });

    return { state: state, handle: handle };
}
