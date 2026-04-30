/* Debug: Batch Queue Diagnostics */

// 查看当前队列状态
var status = BatchProcessor.getStatus();
if (status.queueLength > 10) {
DEBUG.warn('batch', '队列堆积严重，当前任务数: ' + status.queueLength);
}
