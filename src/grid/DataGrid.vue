<!--
  Vue용 DataGridView다. 열 너비, 순서, 고정, 필터, 정렬, 선택은 grid/model.js가 계산한다.
  React는 DataGrid.jsx, Next는 components/DataGrid.js가 같은 모델을 그린다.
  스크롤과 열 너비는 team-flow ScrollableTable이 우선이다. 표는 하나고 헤더는 붙는다.
  헤더와 같은 칸의 본문 셀에 너비, 최소, 최대를 같이 쓴다. 트리, 정렬, 필터, 선택은 그 위에 더한다.
-->
<script setup>
import { computed, onBeforeUnmount, onMounted, onUpdated, ref } from "vue";
import {
    cellValue,
    estimateWidth,
    layoutColumns,
    loadLayout,
    moveColumn,
    nextSort,
    resizeColumn,
    saveLayout,
    selectRange,
    selectedNodes,
    toggleFlag,
    toggleSelection,
    visibleRows,
} from "./model";
import "./grid.css";

var props = defineProps({
    rows: { type: Array, default: function () { return []; } },
    columns: { type: Array, default: function () { return []; } },
    sortModel: { type: Array, default: function () { return []; } },
    filters: { type: Object, default: function () { return {}; } },
    identifier: { type: String, default: "" },
    findQuery: { type: String, default: "" },
    rowSelection: { type: String, default: "multiple" },
    showSelectionCheckBoxesFlag: { type: Boolean, default: true },
    showRowIndexFlag: { type: Boolean, default: true },
    showAlternateBackgroundFlag: { type: Boolean, default: true },
    showColumnBorderFlag: { type: Boolean, default: true },
    showContextualMenuColumnFlag: { type: Boolean, default: true },
    columnDragEnabledFlag: { type: Boolean, default: true },
    rowDragEnabledFlag: { type: Boolean, default: true },
    emptyText: { type: String, default: "표시할 행이 없습니다." },
});
var emit = defineEmits(["sort", "activate", "select", "filter", "reorder", "cell-edit"]);

var root = ref(null);
var scroller = ref(null);
var hBar = ref({ overflow: false, thumbWidth: 32, thumbLeft: 0 });
var dragWidth = ref(null);
var layout = ref(loadLayout(props.identifier));
var expanded = ref({});
var selected = ref({});
var anchor = ref("");
var menu = ref(null);
var draggingColumn = ref("");
var draggingRow = ref("");
var editing = ref(null);

var prepared = computed(function () {
    return layoutColumns(props.columns, layout.value);
});
var viewRows = computed(function () {
    return visibleRows(props.rows, props.sortModel, expanded.value);
});

function persist(next) {
    layout.value = next;
    if (props.identifier) saveLayout(props.identifier, next);
}

function sortMark(column) {
    var index = (props.sortModel || []).findIndex(function (item) {
        return item.dataIndex === column.dataIndex;
    });
    if (index < 0) return "";
    var item = props.sortModel[index];
    var name = item.sort === "desc" ? "내림차순" : "오름차순";
    return props.sortModel.length > 1 ? name + " " + (index + 1) : name;
}

function onHeader(event, column) {
    if (column.sortableFlag === false) return;
    emit("sort", nextSort(props.sortModel, column.dataIndex, event.shiftKey));
}

function onTwist(row) {
    var next = Object.assign({}, expanded.value);
    next[row.id] = !row.expanded;
    expanded.value = next;
}

function publishSelection(nextSelected) {
    selected.value = nextSelected;
    emit("select", selectedNodes(props.rows, nextSelected));
}

function onRow(row, event) {
    if (props.rowSelection === "multiple" && event && event.shiftKey && anchor.value) {
        publishSelection(selectRange(viewRows.value.map(function (item) { return item.id; }), anchor.value, row.id));
        return;
    }
    anchor.value = row.id;
    publishSelection(toggleSelection(selected.value, row.id, props.rowSelection));
}

function onSelectAll() {
    var ids = viewRows.value.map(function (row) { return row.id; });
    var every = ids.length && ids.every(function (id) { return selected.value[id]; });
    var next = {};
    if (!every) ids.forEach(function (id) { next[id] = true; });
    publishSelection(next);
}

function onActivate(row, column) {
    var value = cellValue(column, row.node);
    if (typeof value.func === "function") value.func();
    emit("activate", { node: row.node, column: column, value: value });
}

function columnCount() {
    return prepared.value.visible.length + (props.showSelectionCheckBoxesFlag ? 1 : 0) + (props.showRowIndexFlag ? 1 : 0) + (props.showContextualMenuColumnFlag ? 1 : 0);
}

function stickyLeft(column, index) {
    if (!column.pinned) return null;
    var left = 0;
    if (props.showRowIndexFlag) left += 44;
    if (props.showSelectionCheckBoxesFlag) left += 36;
    for (var i = 0; i < index; i += 1) {
        if (prepared.value.visible[i].pinned) left += shownWidth(prepared.value.visible[i]);
    }
    return left + "px";
}

// team-flow ScrollableTable과 같다. 헤더와 같은 칸의 본문 셀에 너비·최소·최대를 같이 쓴다.
function applyColumnWidth(headerCell, width) {
    var px = Math.max(50, Math.round(width)) + "px";
    var table = headerCell.closest("table");
    var index = Array.prototype.indexOf.call(headerCell.parentElement.children, headerCell);
    [headerCell].concat(Array.prototype.slice.call(table.querySelectorAll("tr")).map(function (row) { return row.children[index]; })).forEach(function (cell) {
        if (!cell) return;
        cell.style.width = px;
        cell.style.minWidth = px;
        cell.style.maxWidth = px;
    });
    fitTableToColumns(table);
}

function fitTableToColumns(table) {
    var total = 0;
    Array.prototype.forEach.call(table.rows[0].cells, function (cell) {
        total += parseFloat(cell.style.width) || 0;
    });
    var px = total + "px";
    table.style.width = px;
    table.style.minWidth = px;
    table.style.maxWidth = px;
}

function tablePixelWidth() {
    var width = 0;
    if (props.showRowIndexFlag) width += 44;
    if (props.showSelectionCheckBoxesFlag) width += 36;
    prepared.value.visible.forEach(function (column) { width += shownWidth(column); });
    if (props.showContextualMenuColumnFlag) width += 44;
    return width;
}

function tableStyle() {
    var width = tablePixelWidth();
    return { width: width + "px", minWidth: width + "px", maxWidth: width + "px" };
}

function onResizeDown(event, column) {
    if (column.resizableFlag === false) return;
    event.preventDefault();
    event.stopPropagation();
    var resizer = event.currentTarget;
    var headerCell = resizer.parentElement;
    var startX = event.pageX;
    var startWidth = headerCell.offsetWidth;
    resizer.classList.add("resizing");
    document.body.style.cursor = "col-resize";
    function widthAt(pageX) {
        return Math.max(50, Math.round(startWidth + pageX - startX));
    }
    function move(moveEvent) {
        var width = widthAt(moveEvent.pageX);
        dragWidth.value = { dataIndex: column.dataIndex, width: width };
        applyColumnWidth(headerCell, width);
    }
    function up(upEvent) {
        document.removeEventListener("mousemove", move);
        document.removeEventListener("mouseup", up);
        document.body.style.cursor = "";
        resizer.classList.remove("resizing");
        var width = widthAt(upEvent.pageX);
        dragWidth.value = null;
        persist(resizeColumn(layout.value, column.dataIndex, width));
        measureHBar();
    }
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
}

function onResizeFit(event, column) {
    event.preventDefault();
    event.stopPropagation();
    var values = viewRows.value.map(function (row) { return cellValue(column, row.node).label; });
    persist(resizeColumn(layout.value, column.dataIndex, estimateWidth(column.text, values)));
}

function openMenu(event, kind, payload) {
    event.preventDefault();
    event.stopPropagation();
    menu.value = { kind: kind, x: event.clientX, y: event.clientY, payload: payload };
}

function closeMenu() {
    menu.value = null;
}

function onMenu(action) {
    var column = menu.value && menu.value.payload;
    if (action === "asc" || action === "desc") {
        emit("sort", [{ dataIndex: column.dataIndex, sort: action === "desc" ? "desc" : "asc" }]);
    } else if (action === "clear-sort") {
        emit("sort", (props.sortModel || []).filter(function (item) { return item.dataIndex !== column.dataIndex; }));
    } else if (action === "hide") {
        persist(toggleFlag(layout.value, column.dataIndex, "hidden"));
    } else if (action === "pin") {
        persist(toggleFlag(layout.value, column.dataIndex, "pinned"));
    } else if (action === "fit") {
        var values = viewRows.value.map(function (row) { return cellValue(column, row.node).label; });
        persist(resizeColumn(layout.value, column.dataIndex, estimateWidth(column.text, values)));
    } else if (action === "reset-width") {
        var next = Object.assign({}, layout.value, { widths: Object.assign({}, layout.value.widths) });
        delete next.widths[column.dataIndex];
        persist(next);
    } else if (action === "open") {
        emit("activate", { node: menu.value.payload.node, column: { dataIndex: "tree" }, value: { label: menu.value.payload.node.title || menu.value.payload.node.label } });
    } else if (action === "show") {
        persist(toggleFlag(layout.value, column.dataIndex, "hidden"));
    }
    closeMenu();
}

function onFilter(column, value) {
    var next = Object.assign({}, props.filters);
    if (value) next[column.dataIndex] = value;
    else delete next[column.dataIndex];
    emit("filter", next);
}

function onDragColumnStart(event, column) {
    if (!props.columnDragEnabledFlag) {
        event.preventDefault();
        return;
    }
    draggingColumn.value = column.dataIndex;
    event.dataTransfer.setData("text/plain", "column:" + column.dataIndex);
    event.dataTransfer.effectAllowed = "move";
}

function onDropColumn(event, column) {
    event.preventDefault();
    var from = draggingColumn.value;
    draggingColumn.value = "";
    if (!from || from === column.dataIndex) return;
    persist(moveColumn(layout.value, prepared.value.order, from, column.dataIndex));
}

function onDragRowStart(event, row) {
    if (!props.rowDragEnabledFlag) {
        event.preventDefault();
        return;
    }
    draggingRow.value = row.id;
    event.dataTransfer.setData("text/plain", "row:" + row.id);
    event.dataTransfer.effectAllowed = "move";
}

function onDropRow(event, row) {
    event.preventDefault();
    var from = draggingRow.value;
    draggingRow.value = "";
    if (!from || from === row.id) return;
    var source = viewRows.value.filter(function (item) { return item.id === from; })[0];
    if (!source || source.parentId !== row.parentId) return;
    emit("reorder", { id: from, beforeId: row.id });
}

function beginEdit(row, column) {
    if (!column.editableFlag) return;
    editing.value = { id: row.id, dataIndex: column.dataIndex, value: cellValue(column, row.node).label };
}

function commitEdit() {
    if (!editing.value) return;
    var payload = editing.value;
    editing.value = null;
    emit("cell-edit", payload);
}

function toggleVisible(column) {
    persist(toggleFlag(layout.value, column.dataIndex, "hidden"));
}

function matched(label) {
    var query = String(props.findQuery || "").trim().toLowerCase();
    return query && String(label || "").toLowerCase().indexOf(query) !== -1;
}

function onKey(event) {
    if (!viewRows.value.length) return;
    var ids = viewRows.value.map(function (row) { return row.id; });
    var current = ids.indexOf(anchor.value);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        var nextIndex = event.key === "ArrowDown" ? Math.min(ids.length - 1, current + 1) : Math.max(0, current < 0 ? 0 : current - 1);
        anchor.value = ids[nextIndex];
        publishSelection(toggleSelection({}, ids[nextIndex], "single"));
    } else if (event.key === "Enter" && anchor.value) {
        var row = viewRows.value.filter(function (item) { return item.id === anchor.value; })[0];
        var column = prepared.value.visible.filter(function (item) { return item.dataIndex === "tree"; })[0] || prepared.value.visible[0];
        if (row && column) onActivate(row, column);
    }
}

function allChecked() {
    return viewRows.value.length > 0 && viewRows.value.every(function (row) { return selected.value[row.id]; });
}

function shownWidth(column) {
    if (dragWidth.value && dragWidth.value.dataIndex === column.dataIndex) return dragWidth.value.width;
    return column.width;
}

function measureHBar() {
    if (dragWidth.value) return;
    var el = scroller.value;
    if (!el) return;
    var max = el.scrollWidth - el.clientWidth;
    var overflow = max > 1;
    var track = el.clientWidth;
    var thumbWidth = overflow ? Math.max(32, Math.round(track * el.clientWidth / el.scrollWidth)) : 0;
    var thumbLeft = overflow ? Math.round((el.scrollLeft / max) * Math.max(0, track - thumbWidth)) : 0;
    var prev = hBar.value;
    if (prev.overflow === overflow && prev.thumbWidth === thumbWidth && prev.thumbLeft === thumbLeft) return;
    hBar.value = { overflow: overflow, thumbWidth: thumbWidth, thumbLeft: thumbLeft };
}

function onGridWheel(event) {
    var el = scroller.value;
    if (!el) return;
    var max = el.scrollWidth - el.clientWidth;
    if (max <= 0) return;
    var delta = 0;
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) delta = event.deltaX;
    else if (event.shiftKey) delta = event.deltaY;
    else if (el.scrollHeight <= el.clientHeight + 1) delta = event.deltaY;
    if (!delta) return;
    event.preventDefault();
    el.scrollLeft = Math.max(0, Math.min(max, el.scrollLeft + delta));
    measureHBar();
}

function onHScrollDown(event) {
    var el = scroller.value;
    if (!el || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    var track = event.currentTarget.getBoundingClientRect();
    var max = el.scrollWidth - el.clientWidth;
    var thumb = hBar.value.thumbWidth;
    var travel = Math.max(1, track.width - thumb);
    var pointer = event.clientX - track.left;
    var onThumb = pointer >= hBar.value.thumbLeft && pointer <= hBar.value.thumbLeft + thumb;
    if (!onThumb) {
        el.scrollLeft = Math.max(0, Math.min(max, ((pointer - thumb / 2) / travel) * max));
        measureHBar();
    }
    var startX = event.clientX;
    var startLeft = el.scrollLeft;
    event.currentTarget.classList.add("dragging");
    function move(moveEvent) {
        el.scrollLeft = Math.max(0, Math.min(max, startLeft + ((moveEvent.clientX - startX) * max) / travel));
        measureHBar();
    }
    function up() {
        document.removeEventListener("mousemove", move);
        document.removeEventListener("mouseup", up);
        if (event.currentTarget) event.currentTarget.classList.remove("dragging");
    }
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
}

function applyNativeTitles() {
    var container = root.value;
    if (!container) return;
    container.querySelectorAll("thead th, tbody td").forEach(function (cell) {
        if (cell.querySelector("a")) return;
        var text = (cell.textContent || "").trim();
        if (text) cell.title = text;
    });
}

onMounted(function () {
    window.addEventListener("click", closeMenu);
    applyNativeTitles();
    var el = scroller.value;
    if (!el) return;
    el.addEventListener("wheel", onGridWheel, { passive: false });
    if (window.ResizeObserver) {
        var observer = new ResizeObserver(measureHBar);
        observer.observe(el);
        if (el.firstElementChild) observer.observe(el.firstElementChild);
        el._hObserver = observer;
    }
    measureHBar();
});
onUpdated(function () {
    applyNativeTitles();
    measureHBar();
});
onBeforeUnmount(function () {
    window.removeEventListener("click", closeMenu);
    var el = scroller.value;
    if (!el) return;
    el.removeEventListener("wheel", onGridWheel);
    if (el._hObserver) el._hObserver.disconnect();
});
</script>

<template>
    <div ref="root" class="enx-grid-wrap" tabindex="0" @keydown="onKey">
        <div class="enx-grid-tools">
            <button type="button" @click.stop="openMenu($event, 'columns', null)">열</button>
        </div>
        <div class="enx-grid-frame">
        <div ref="scroller" class="enx-grid-scroll scrollable-table-container-single" @scroll="measureHBar">
            <table class="enx-grid" :class="{ borders: showColumnBorderFlag, stripes: showAlternateBackgroundFlag }" :style="tableStyle()">
                <thead>
                    <tr>
                        <th v-if="showRowIndexFlag" class="index" style="width: 44px; min-width: 44px; max-width: 44px"></th>
                        <th v-if="showSelectionCheckBoxesFlag" style="width: 36px; min-width: 36px; max-width: 36px">
                            <input v-if="rowSelection === 'multiple'" type="checkbox" :checked="allChecked()" @click.stop="onSelectAll">
                        </th>
                        <th
                            v-for="(column, index) in prepared.visible"
                            :key="column.dataIndex"
                            :class="{ pinned: column.pinned }"
                            :style="{ width: shownWidth(column) + 'px', minWidth: shownWidth(column) + 'px', maxWidth: shownWidth(column) + 'px', left: stickyLeft(column, index) }"
                            @dragover.prevent
                            @drop="onDropColumn($event, column)"
                            @contextmenu="openMenu($event, 'header', column)"
                        >
                            <button type="button" class="header" draggable="true" @dragstart="onDragColumnStart($event, column)" @click="onHeader($event, column)">
                                {{ column.text }}
                                <span v-if="sortMark(column)" class="sort">{{ sortMark(column) }}</span>
                            </button>
                            <div v-if="column.resizableFlag" class="column-resizer" @mousedown="onResizeDown($event, column)" @dblclick="onResizeFit($event, column)"></div>
                        </th>
                        <th v-if="showContextualMenuColumnFlag" style="width: 44px; min-width: 44px; max-width: 44px"></th>
                    </tr>
                    <tr class="filters">
                        <th v-if="showRowIndexFlag" style="width: 44px; min-width: 44px; max-width: 44px"></th>
                        <th v-if="showSelectionCheckBoxesFlag" style="width: 36px; min-width: 36px; max-width: 36px"></th>
                        <th v-for="(column, index) in prepared.visible" :key="'filter-' + column.dataIndex" :class="{ pinned: column.pinned }" :style="{ width: shownWidth(column) + 'px', minWidth: shownWidth(column) + 'px', maxWidth: shownWidth(column) + 'px', left: stickyLeft(column, index) }">
                            <input :value="filters[column.dataIndex] || ''" :placeholder="column.typeRepresentation === 'number' ? '&gt; 10' : '필터'" @input="onFilter(column, $event.target.value)" @click.stop>
                        </th>
                        <th v-if="showContextualMenuColumnFlag" style="width: 44px; min-width: 44px; max-width: 44px"></th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-if="!viewRows.length">
                        <td :colspan="columnCount()" class="empty">{{ emptyText }}</td>
                    </tr>
                    <tr
                        v-for="(row, rowIndex) in viewRows"
                        :key="row.id"
                        :class="{ selected: selected[row.id], alt: showAlternateBackgroundFlag && rowIndex % 2 === 1 }"
                        @click="onRow(row, $event)"
                        @dragover.prevent
                        @drop="onDropRow($event, row)"
                    >
                        <td v-if="showRowIndexFlag" class="index" style="width: 44px; min-width: 44px; max-width: 44px">
                            <button v-if="rowDragEnabledFlag" type="button" class="drag" draggable="true" @dragstart.stop="onDragRowStart($event, row)" @click.stop>≡</button>
                            {{ rowIndex + 1 }}
                        </td>
                        <td v-if="showSelectionCheckBoxesFlag" style="width: 36px; min-width: 36px; max-width: 36px">
                            <input type="checkbox" :checked="!!selected[row.id]" @click.stop="onRow(row, $event)">
                        </td>
                        <td v-for="(column, index) in prepared.visible" :key="column.dataIndex" :class="{ pinned: column.pinned, match: matched(cellValue(column, row.node).label) }" :style="{ width: shownWidth(column) + 'px', minWidth: shownWidth(column) + 'px', maxWidth: shownWidth(column) + 'px', left: stickyLeft(column, index) }" @dblclick.stop="beginEdit(row, column)">
                            <input v-if="editing && editing.id === row.id && editing.dataIndex === column.dataIndex" v-model="editing.value" @keydown.enter.prevent="commitEdit" @blur="commitEdit" @click.stop>
                            <div v-else-if="column.dataIndex === 'tree'" class="tree-cell" :style="{ paddingLeft: row.depth * 16 + 'px' }">
                                <button v-if="row.hasChildren" type="button" class="twist" :class="{ expanded: row.expanded }" :aria-expanded="row.expanded ? 'true' : 'false'" @click.stop="onTwist(row)"><span class="mark"></span></button>
                                <span v-else class="twist-gap"></span>
                                <button type="button" class="link" @click.stop="onActivate(row, column)">{{ cellValue(column, row.node).label }}</button>
                            </div>
                            <button v-else-if="cellValue(column, row.node).func" type="button" class="link" @click.stop="onActivate(row, column)">{{ cellValue(column, row.node).label }}</button>
                            <span v-else>{{ cellValue(column, row.node).label }}</span>
                        </td>
                        <td v-if="showContextualMenuColumnFlag" style="width: 44px; min-width: 44px; max-width: 44px">
                            <button type="button" class="row-menu" @click.stop="openMenu($event, 'row', row)">⋯</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div v-show="hBar.overflow" class="enx-hscroll" role="scrollbar" aria-orientation="horizontal" aria-label="가로 스크롤" @mousedown="onHScrollDown">
            <div class="enx-hscroll-thumb" :style="{ width: hBar.thumbWidth + 'px', left: hBar.thumbLeft + 'px' }"></div>
        </div>
        </div>
        <div v-if="menu" class="enx-grid-menu" :style="{ left: menu.x + 'px', top: menu.y + 'px' }" @click.stop>
            <template v-if="menu.kind === 'header'">
                <button type="button" @click="onMenu('asc')">오름차순</button>
                <button type="button" @click="onMenu('desc')">내림차순</button>
                <button type="button" @click="onMenu('clear-sort')">이 열 정렬 해제</button>
                <button type="button" @click="onMenu('hide')">열 숨기기</button>
                <button type="button" @click="onMenu('pin')">{{ menu.payload && layout.pinned[menu.payload.dataIndex] ? '고정 해제' : '왼쪽 고정' }}</button>
                <button type="button" @click="onMenu('fit')">너비 맞춤</button>
                <button type="button" @click="onMenu('reset-width')">너비 초기화</button>
            </template>
            <template v-else-if="menu.kind === 'row'">
                <button type="button" @click="onMenu('open')">열기</button>
            </template>
            <template v-else>
                <button v-for="column in prepared.visible.concat(prepared.hidden)" :key="column.dataIndex" type="button" @click="toggleVisible(column)">
                    {{ layout.hidden[column.dataIndex] ? "보이기" : "숨기기" }} {{ column.text }}
                </button>
            </template>
        </div>
    </div>
</template>
