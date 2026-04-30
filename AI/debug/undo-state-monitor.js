// 在控制台输入
var state = UndoManager.getState();
console.table({
  "Undo栈长度": state.undoCount,
  "Redo栈长度": state.redoCount,
  "栈顶标签": state.undoLabel
});
