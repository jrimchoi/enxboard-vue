define("DS/ENXBoardVue/js/app", ["DS/vue-3.4.15/vue", "DS/ENXBoardVue/js/view", "DS/ENXBoard/js/controller"], function (Vue, View, createController) {
    function App(options) {
        var state = Vue.reactive({
            screen: "list",
            query: "",
            list: null,
            post: null,
            errors: [],
            notice: "",
        });
        var controller = createController({
            root: options.root,
            title: options.title || "ENXBoard",
            appId: options.appId || "ENXBoardVue",
            postsUrl: options.postsUrl || "./vendor/enxboard/data/posts.json",
            widget: options.widget,
            paint: function (snap) {
                state.screen = snap.screen;
                state.query = snap.query;
                state.list = snap.list;
                state.post = snap.post;
                state.errors = snap.errors;
                state.notice = snap.notice;
            },
        });
        View.mount(options.root, state, function (command, payload) {
            controller.handle(command, payload);
        });
        this.controller = controller;
    }

    App.prototype.init = function () {
        return this.controller.init();
    };

    return App;
});
