// ============================
// P3-19: 批处理引擎
// ============================

/**
* 将多个 ExtendScript 调用合并为单次执行，减少 CEP 通信开销
* AI 面板每次 csInterface.evalScript 都有 ~50ms 开销
* 批处理可将 N 次调用压缩为 1 次
*/
var BatchProcessor = (function () {
var _queue = [];
var _batchTimer = null;
var _batchDelay = 16; // 一帧的时间（60fps）
var _isProcessing = false;
var _resolvers = {};
var _batchIdCounter = 0;

/**
* 添加操作到批处理队列
* @param {string} fnName - ExtendScript 函数名
* @param {Array} args - 参数数组
* @returns {Promise} - 该操作完成的 Promise
*/
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

// 安排批处理执行
if (!_batchTimer && !_isProcessing) {
_batchTimer = setTimeout(function () {
_batchTimer = null;
_flush();
}, _batchDelay);
}

return promise;
}

/**
* 立即执行当前队列（不等待延迟）
*/
function flush() {
if (_batchTimer) {
clearTimeout(_batchTimer);
_batchTimer = null;
}
return _flush();
}

/**
* 内部执行
*/
function _flush() {
if (_queue.length === 0 || _isProcessing) return Promise.resolve();

_isProcessing = true;

// 取出当前队列，清空
var batch = _queue.splice(0);

// 构建批处理脚本
var script = _buildBatchScript(batch);

return new Promise(function (resolve) {
callHostRaw(script).then(function (resultJSON) {
_isProcessing = false;

try {
var results = JSON.parse(resultJSON);

for (var i = 0; i < batch.length; i++) {
var item = batch[i];
var resolver = _resolvers[item.id];
if (resolver) {
var result = results[item.id];
if (result && result.success === false) {
resolver.reject(new Error(result.error || 'Unknown error'));
} else {
resolver.resolve(result);
}
delete _resolvers[item.id];
}
}
} catch (parseErr) {
// 解析失败，全部 reject
for (var j = 0; j < batch.length; j++) {
var r = _resolvers[batch[j].id];
if (r) {
r.reject(parseErr);
delete _resolvers[batch[j].id];
}
}
}

resolve();

// 如果队列中又有新任务，继续处理
if (_queue.length > 0) {
_batchTimer = setTimeout(function () {
_batchTimer = null;
_flush();
}, _batchDelay);
}
}).catch(function (err) {
_isProcessing = false;
// 全部 reject
for (var k = 0; k < batch.length; k++) {
var r2 = _resolvers[batch[k].id];
if (r2) {
r2.reject(err);
delete _resolvers[batch[k].id];
}
}
resolve();
});
});
}

/**
* 构建合并的 ExtendScript 脚本
* 将多个函数调用打包为一个脚本，返回 JSON 对象
*/
function _buildBatchScript(batch) {
var lines = [];
lines.push('(function(){');
lines.push('var __results = {};');

for (var i = 0; i < batch.length; i++) {
var item = batch[i];
var argsStr = item.args.map(function (arg) {
if (typeof arg === 'string') {
// 转义字符串中的特殊字符
return "'" + arg.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n') + "'";
}
return JSON.stringify(arg);
}).join(', ');

lines.push('try {');
lines.push('  __results["' + item.id + '"] = JSON.parse(' + item.fn + '(' + argsStr + '));');
lines.push('} catch(__e' + i + ') {');
lines.push('  __results["' + item.id + '"] = { success: false, error: __e' + i + '.message };');
lines.push('}');
}

lines.push('return JSON.stringify(__results);');
lines.push('})()');

return lines.join('\n');
}

/**
* 获取队列状态
*/
function getStatus() {
return {
queueLength: _queue.length,
isProcessing: _isProcessing,
pendingResolvers: Object.keys(_resolvers).length
};
}

return {
enqueue: enqueue,
flush: flush,
getStatus: getStatus
};
})();

/**
* 原始 Host 调用（不经过批处理）
* 通过 DotGridMaster 全局对象访问 csInterface
*/
function callHostRaw(script) {
return new Promise(function (resolve, reject) {
var cs = (window.DotGridMaster && window.DotGridMaster._csInterface);
if (cs && cs.evalScript) {
cs.evalScript(script, function (result) {
if (result === 'EvalScript error.' || result === 'undefined') {
reject(new Error('EvalScript error'));
} else {
resolve(result);
}
});
} else {
reject(new Error('csInterface not available'));
}
});
}

/**
* 增强版 callHost：自动选择批处理或直接调用
* 在 index.js 加载后调用 BatchProcessor.init() 激活
*/
var _originalCallHost = null;

// 需要立即执行的函数（不走批处理）
var IMMEDIATE_FUNCTIONS = ['healthCheck', 'getDocumentInfo', 'getDocumentGuides'];

BatchProcessor.init = function () {
if (window.DotGridMaster && window.DotGridMaster.HostAdapter) {
_originalCallHost = function (fnName, args) {
var fn = window.DotGridMaster.HostAdapter[fnName];
if (!fn) return Promise.reject(new Error('Unknown function: ' + fnName));
return fn.apply(window.DotGridMaster.HostAdapter, args || []);
};
}
};

BatchProcessor.callHost = function (fnName, args) {
if (!_originalCallHost) {
BatchProcessor.init();
}
if (IMMEDIATE_FUNCTIONS.indexOf(fnName) !== -1) {
return _originalCallHost ? _originalCallHost(fnName, args) : Promise.reject(new Error('BatchProcessor not initialized'));
}
return BatchProcessor.enqueue(fnName, args);
};
