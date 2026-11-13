<!--
  Vue용 DataGridView다. 템플릿이 행을 그리고, 트리·정렬·선택 계산은 grid/model.js가 한다.
  React는 DataGrid.jsx, Next는 components/DataGrid.js다. 모델 파일은 세 앱이 같다.
-->
<script setup>
import { computed, ref } from "vue";
import { cellValue, nextSort, selectedNodes, toggleSelection, visibleRows } from "./model";
import "./grid.css";

var props = defineProps({
    rows: { type: Array, default: function () { return []; } },
    columns: { type: Array, default: function () { return []; } },
    sortModel: { type: Array, default: function () { return []; } },
    rowSelection: { type: String, default: "single" },
    showSelectionCheckBoxesFlag: { type: Boolean, default: false },
    emptyText: { type: String, default: "표시할 행이 없습니다." },
});
var emit = defineEmits(["sort", "activate", "select"]);
var expanded = ref({});
var selected = ref({});

var viewRows = computed(function () {
    return visibleRows(props.rows, props.sortModel, expanded.value);
});

function sortMark(column) {
    var current = (props.sortModel || []).filter(function (item) {
        return item.dataIndex === column.dataIndex;
    })[0];
    if (!current) return "";
    return current.sort === "desc" ? "내림차순" : "오름차순";
}

function onHeader(column) {
    if (column.sortableFlag === false) return;
    emit("sort", nextSort(props.sortModel, column.dataIndex));
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

function onRow(row) {
    publishSelection(toggleSelection(selected.value, row.id, props.rowSelection));
}

function onActivate(row, column) {
    var value = cellValue(column, row.node);
    if (typeof value.func === "function") value.func();
    emit("activate", { node: row.node, column: column, value: value });
}

function columnCount() {
    return props.columns.length + (props.showSelectionCheckBoxesFlag ? 1 : 0);
}
</script>

<template>
    <table class="enx-grid">
        <thead>
            <tr>
                <th v-if="showSelectionCheckBoxesFlag"></th>
                <th v-for="column in columns" :key="column.dataIndex">
                    <button type="button" class="header" @click="onHeader(column)">
                        {{ column.text }}
                        <span v-if="sortMark(column)" class="sort">{{ sortMark(column) }}</span>
                    </button>
                </th>
            </tr>
        </thead>
        <tbody>
            <tr v-if="!viewRows.length">
                <td :colspan="columnCount()" class="empty">{{ emptyText }}</td>
            </tr>
            <tr v-for="row in viewRows" :key="row.id" :class="{ selected: selected[row.id] }" @click="onRow(row)">
                <td v-if="showSelectionCheckBoxesFlag">
                    <input type="checkbox" :checked="!!selected[row.id]" @click.stop="onRow(row)">
                </td>
                <td v-for="column in columns" :key="column.dataIndex">
                    <div v-if="column.dataIndex === 'tree'" class="tree-cell" :style="{ paddingLeft: row.depth * 16 + 'px' }">
                        <button v-if="row.hasChildren" type="button" class="twist" :class="{ expanded: row.expanded }" :aria-expanded="row.expanded ? 'true' : 'false'" @click.stop="onTwist(row)">
                            <span class="mark"></span>
                        </button>
                        <span v-else class="twist-gap"></span>
                        <button type="button" class="link" @click.stop="onActivate(row, column)">{{ cellValue(column, row.node).label }}</button>
                    </div>
                    <button v-else-if="cellValue(column, row.node).func" type="button" class="link" @click.stop="onActivate(row, column)">{{ cellValue(column, row.node).label }}</button>
                    <span v-else>{{ cellValue(column, row.node).label }}</span>
                </td>
            </tr>
        </tbody>
    </table>
</template>
