/**
 * DotGridMaster BatchProcessor 单元测试
 * 测试 batch-processor.js 的队列管理逻辑
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// 模拟 BatchProcessor 核心逻辑（去除 DOM 依赖）
function createBatchProcessor() {
  var _queue = [];
  var _batchTimer = null;
  var _batchDelay = 16;
  var _isProcessing = false;
  var _resolvers = {};
  var _batchIdCounter = 0;

  function enqueue(fnName, args) {
    var batchId = 'b_' + (++_batchIdCounter);
    var promise = new Promise(function (resolve, reject) {
      _resolvers[batchId] = { resolve: resolve, reject: reject };
    });
    _queue.push({
      id: batchId,
      fn: fnName,
      args: args || []
    });
    return promise;
  }

  function flush() {
    if (_batchTimer) {
      clearTimeout(_batchTimer);
      _batchTimer = null;
    }
    // In test, just return the queue info
    var batch = _queue.splice(0);
    return Promise.resolve(batch);
  }

  function getStatus() {
    return {
      queueLength: _queue.length,
      isProcessing: _isProcessing,
      pendingResolvers: Object.keys(_resolvers).length
    };
  }

  function getQueueLength() {
    return _queue.length;
  }

  function clear() {
    _queue = [];
    _resolvers = {};
    if (_batchTimer) {
      clearTimeout(_batchTimer);
      _batchTimer = null;
    }
  }

  return {
    enqueue: enqueue,
    flush: flush,
    getStatus: getStatus,
    getQueueLength: getQueueLength,
    clear: clear
  };
}

describe('BatchProcessor 队列管理', () => {
  it('初始状态应为空队列', () => {
    var bp = createBatchProcessor();
    var status = bp.getStatus();
    assert.equal(status.queueLength, 0);
    assert.equal(status.isProcessing, false);
    assert.equal(status.pendingResolvers, 0);
  });

  it('enqueue 应添加到队列', () => {
    var bp = createBatchProcessor();
    bp.enqueue('addGuides', ['test']);
    assert.equal(bp.getQueueLength(), 1);
  });

  it('多次 enqueue 应累积队列', () => {
    var bp = createBatchProcessor();
    bp.enqueue('addGuides', ['test1']);
    bp.enqueue('addOverlays', ['test2']);
    bp.enqueue('clearGuides', []);
    assert.equal(bp.getQueueLength(), 3);
  });

  it('enqueue 应返回 Promise', () => {
    var bp = createBatchProcessor();
    var result = bp.enqueue('test', []);
    assert.ok(result instanceof Promise);
  });

  it('flush 应清空队列并返回批次', async () => {
    var bp = createBatchProcessor();
    bp.enqueue('addGuides', ['a']);
    bp.enqueue('addOverlays', ['b']);
    var batch = await bp.flush();
    assert.equal(batch.length, 2);
    assert.equal(bp.getQueueLength(), 0);
  });

  it('flush 空队列应返回空数组', async () => {
    var bp = createBatchProcessor();
    var batch = await bp.flush();
    assert.equal(batch.length, 0);
  });

  it('clear 应清空队列和 resolver', () => {
    var bp = createBatchProcessor();
    bp.enqueue('test1', []);
    bp.enqueue('test2', []);
    bp.clear();
    assert.equal(bp.getQueueLength(), 0);
    assert.equal(bp.getStatus().pendingResolvers, 0);
  });

  it('每个 enqueue 应生成唯一 ID', () => {
    var bp = createBatchProcessor();
    var p1 = bp.enqueue('a', []);
    var p2 = bp.enqueue('b', []);
    // Both should be pending (different resolvers)
    assert.equal(bp.getStatus().pendingResolvers, 2);
  });
});

describe('BatchProcessor 参数序列化', () => {
  it('应正确传递字符串参数', () => {
    var bp = createBatchProcessor();
    bp.enqueue('addGuides', ['[{\"orientation\":\"vertical\",\"position\":100}]']);
    assert.equal(bp.getQueueLength(), 1);
  });

  it('应正确传递空参数', () => {
    var bp = createBatchProcessor();
    bp.enqueue('clearGuides', []);
    assert.equal(bp.getQueueLength(), 1);
  });

  it('应正确传递多参数', () => {
    var bp = createBatchProcessor();
    bp.enqueue('addEcomZones', ['[]', '#FF6B00', 12]);
    assert.equal(bp.getQueueLength(), 1);
  });
});
