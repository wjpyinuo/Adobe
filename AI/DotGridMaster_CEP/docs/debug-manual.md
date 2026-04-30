# DotGridMaster 全模块深度调试手册

---

## 目录

1. [调试环境搭建](css/style.css "div")
2. [CEP 通信层调试](css/style.css "div")
3. [HostAdapter 调试](css/style.css "div")
4. [网格引擎调试](css/style.css "div")
5. [构图辅助线调试](css/style.css "div")
6. [电商模板引擎调试](css/style.css "div")
7. [印刷出血模块调试](css/style.css "div")
8. [撤销/重做系统调试](css/style.css "div")
9. [批处理引擎调试](css/style.css "div")
10. [预设管理调试](css/style.css "div")
11. [UI 渲染层调试](css/style.css "div")
12. [性能瓶颈排查](css/style.css "div")
13. [常见故障速查表](css/style.css "div")


---

## 1. 调试环境搭建

### 1.1 开启 CEP 调试模式

CEP 面板默认不允许加载未签名扩展。必须先开启调试模式。

**Windows（注册表）**：

```gm-toast
HKEY_CURRENT_USER\Software\Adobe\CSXS.11
```

新建字符串值：

```gm-toast
名称: PlayerDebugMode          
值:   1
```

**macOS（终端）**：

```gm-toast
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
```

> 
> **注意**：`CSXS.11` 中的数字对应 CEP 版本。CC 2022+ 使用 11，CC 2021 使用 10。如果你同时开发多个版本，需要为每个版本号都设置。
> 

### 1.2 Chrome DevTools 远程调试

CEP 面板内嵌 Chromium，可通过远程调试端口连接 DevTools。

**第一步**：在扩展根目录创建 `.debug` 文件（无扩展名）：

```gm-toast
<?xml version="1.0" encoding="UTF-8"?>          
<ExtensionList>          
<Extension Id="com.yourname.dotgridmaster.main">          
<HostList>          
<Host Name="ILST" Port="8088" />          
</HostList>          
</Extension>          
</ExtensionList>
```

**第二步**：重启 Illustrator，打开 Chrome 浏览器访问：

```gm-toast
http://localhost:8088
```

你将看到一个可点击的链接，点击后进入完整的 DevTools 界面，包含 Console、Elements、Network、Sources、Performance 面板。

### 1.3 ExtendScript 调试

**方法 A — ExtendScript Toolkit（已停产但仍可用）**：

- 打开 ESTK，目标应用选择 `Adobe Illustrator`
- 加载 `jsx/hostscript.jsx`
- 设置断点，点击运行

**方法 B — VS Code + ExtendScript Debugger 插件**：

```gm-toast
// .vscode/launch.json          
{          
"version": "0.2.0",          
"configurations": [          
{          
"type": "extendscript-debug",          
"request": "launch",          
"name": "Debug ExtendScript",          
"program": "${workspaceFolder}/jsx/hostscript.jsx",          
"targetSpecifier": "illustrator-26"          
}          
]          
}
```

### 1.4 全局调试开关

在 `app.js` 顶部添加统一调试控制器：

```gm-toast
// ============================          
// 全局调试控制器          
// ============================          
          
var DEBUG = (function () {          
  var _flags = {          
    host: true,         // CEP 通信日志          
    grid: true,         // 网格计算日志          
    composition: true,  // 构图辅助线日志          
    ecom: true,         // 电商模板日志          
    print: true,        // 印刷出血日志          
    undo: true,         // 撤销/重做日志          
    batch: true,        // 批处理引擎日志          
    preset: true,       // 预设管理日志          
    ui: false,          // UI 渲染日志（默认关闭，输出量大）          
    perf: true          // 性能监控日志          
  };          
          
  function log(module, message, data) {          
    if (!_flags[module]) return;          
          
    var prefix = '[GM:' + module.toUpperCase() + ']';          
    var timestamp = new Date().toISOString().substr(11, 12);          
          
    if (data !== undefined) {          
      console.log('%c' + prefix + ' %c' + timestamp + ' %c' + message,          
        'color:#007aff;font-weight:bold',          
        'color:#808080',          
        'color:#e0e0e0',          
        data          
      );          
    } else {          
      console.log('%c' + prefix + ' %c' + timestamp + ' %c' + message,          
        'color:#007aff;font-weight:bold',          
        'color:#808080',          
        'color:#e0e0e0'          
      );          
    }          
  }          
          
  function warn(module, message, data) {          
    if (!_flags[module]) return;          
    var prefix = '[GM:' + module.toUpperCase() + ']';          
    console.warn(prefix + ' ' + message, data || '');          
  }          
          
  function error(module, message, data) {          
    // 错误始终输出，不受开关控制          
    var prefix = '[GM:' + module.toUpperCase() + ']';          
    console.error(prefix + ' ' + message, data || '');          
  }          
          
  /**          
   * 在 DevTools Console 中切换模块日志          
   * 用法: DEBUG.toggle('grid', false)          
   */          
  function toggle(module, enabled) {          
    if (_flags.hasOwnProperty(module)) {          
      _flags[module] = enabled;          
      console.log('[DEBUG] ' + module + ' logging ' + (enabled ? 'ON' : 'OFF'));          
    }          
  }          
          
  /**          
   * 查看所有模块开关状态          
   */          
  function status() {          
    console.table(_flags);          
  }          
          
  /**          
   * 全部开启/关闭          
   */          
  function all(enabled) {          
    var keys = Object.keys(_flags);          
    for (var i = 0; i < keys.length; i++) {          
      _flags[keys[i]] = enabled;          
    }          
    console.log('[DEBUG] All modules ' + (enabled ? 'ON' : 'OFF'));          
  }          
          
  // 暴露到全局，方便在 Console 中直接调用          
  window.__GM_DEBUG = {          
    toggle: toggle,          
    status: status,          
    all: all          
  };          
          
  return {          
    log: log,          
    warn: warn,          
    error: error,          
    toggle: toggle,          
    status: status,          
    all: all          
  };          
})();
```

---

## 2. CEP 通信层调试

### 2.1 通信链路验证

```gm-toast
// ============================          
// CEP 通信诊断工具          
// ============================          

var CEPDiagnostics = (function () {          

/**          
* 测试 1: csInterface 是否存在          
*/          
function testCSInterface() {          
DEBUG.log('host', '=== CEP 通信诊断开始 ===');          

if (typeof CSInterface === 'undefined') {          
DEBUG.error('host', 'CSInterface 类未定义。检查 CSInterface.js 是否正确加载。');          
return false;          
}          

var cs = new CSInterface();          

// 检查关键方法          
var methods = ['evalScript', 'getHostEnvironment', 'addEventListener', 'getSystemPath'];          
var missing = [];          
for (var i = 0; i < methods.length; i++) {          
if (typeof cs[methods[i]] !== 'function') {          
missing.push(methods[i]);          
}          
}          

if (missing.length > 0) {          
DEBUG.error('host', 'CSInterface 缺少方法:', missing);          
return false;          
}          

DEBUG.log('host', '✓ CSInterface 实例化成功，所有方法可用');          
return true;          
}          

/**          
* 测试 2: 宿主环境信息          
*/          
function testHostEnvironment() {          
var cs = new CSInterface();          
var env = cs.getHostEnvironment();          

DEBUG.log('host', '宿主环境信息:', {          
appName: env.appName,          
appVersion: env.appVersion,          
appLocale: env.appLocale,          
appUILocale: env.appUILocale,          
appId: env.appId,          
isAppOnline: env.isAppOnline          
});          

// 检查是否在 Illustrator 中运行          
if (env.appId !== 'ILST') {          
DEBUG.warn('host', '当前宿主不是 Illustrator，appId=' + env.appId);          
}          

return env;          
}          

/**          
* 测试 3: ExtendScript 往返通信          
*/          
function testRoundTrip() {          
DEBUG.log('host', '开始 ExtendScript 往返通信测试...');          
var startTime = performance.now();          

return new Promise(function (resolve) {          
var cs = new CSInterface();          
var testPayload = '{"test":true,"timestamp":' + Date.now() + '}';          

cs.evalScript(          
'function __test__(p){return p;}; __test__("' + testPayload + '")',          
function (result) {          
var elapsed = performance.now() - startTime;          

if (result === 'EvalScript error.' || result === 'undefined') {          
DEBUG.error('host', '✗ ExtendScript 通信失败', {          
result: result,          
elapsed: elapsed.toFixed(1) + 'ms'          
});          
resolve({ success: false, elapsed: elapsed });          
} else {          
DEBUG.log('host', '✓ ExtendScript 往返通信成功', {          
sent: testPayload,          
received: result,          
elapsed: elapsed.toFixed(1) + 'ms'          
});          
resolve({ success: true, elapsed: elapsed });          
}          
}          
);          
});          
}          

/**          
* 测试 4: hostscript.jsx 是否已加载          
*/          
function testHostScriptLoaded() {          
return new Promise(function (resolve) {          
var cs = new CSInterface();          
cs.evalScript('typeof healthCheck === "function"', function (result) {          
if (result === 'true') {          
DEBUG.log('host', '✓ hostscript.jsx 已加载，healthCheck 函数可用');          
resolve(true);          
} else {          
DEBUG.error('host', '✗ hostscript.jsx 未加载或 healthCheck 未定义');          
DEBUG.log('host', '排查步骤:');          
DEBUG.log('host', '  1. 检查 manifest.xml 中 <ScriptPath> 路径是否正确');          
DEBUG.log('host', '  2. 检查 hostscript.jsx 文件是否存在语法错误');          
DEBUG.log('host', '  3. 在 ESTK 中手动执行 hostscript.jsx 看是否报错');          
resolve(false);          
}          
});          
});          
}          

/**          
* 测试 5: 通信延迟基准测试          
*/          
function benchmarkLatency(rounds) {          
rounds = rounds || 20;          
DEBUG.log('host', '开始通信延迟基准测试 (' + rounds + ' 轮)...');          

var cs = new CSInterface();          
var times = [];          
var completed = 0;          

return new Promise(function (resolve) {          
function runOne() {          
var start = performance.now();          
cs.evalScript('"pong"', function () {          
times.push(performance.now() - start);          
completed++;          
if (completed < rounds) {          
runOne();          
} else {          
var avg = times.reduce(function (a, b) { return a + b; }, 0) / times.length;          
var min = Math.min.apply(null, times);          
var max = Math.max.apply(null, times);          
var sorted = times.slice().sort(function (a, b) { return a - b; });          
var p95 = sorted[Math.floor(sorted.length * 0.95)];          

var report = {          
rounds: rounds,          
avg: avg.toFixed(2) + 'ms',          
min: min.toFixed(2) + 'ms',          
max: max.toFixed(2) + 'ms',          
p95: p95.toFixed(2) + 'ms'          
};          

DEBUG.log('host', '通信延迟基准测试结果:', report);          

if (avg > 50) {          
DEBUG.warn('host', '平均延迟超过 50ms，建议启用 BatchProcessor 合并请求');          
}          

resolve(report);          
}          
});          
}          
runOne();          
});          
}          

/**          
* 运行全部诊断          
*/          
function runAll() {          
console.group('[DotGridMaster] CEP 通信全面诊断');          

var step1 = testCSInterface();          
if (!step1) {          
console.groupEnd();          
return Promise.resolve(false);          
}          

testHostEnvironment();          

return testRoundTrip()          
.then(function (rt) {          
if (!rt.success) return false;          
return testHostScriptLoaded();          
})          
.then(function (loaded) {          
if (!loaded) return false;          
return benchmarkLatency(20);          
})          
.then(function (bench) {          
DEBUG.log('host', '=== CEP 通信诊断完成 ===');          
console.groupEnd();          
return bench;          
});          
}          

// 暴露到全局          
window.__GM_CEP_DIAG = {          
testCSInterface: testCSInterface,          
testHostEnvironment: testHostEnvironment,          
testRoundTrip: testRoundTrip,          
testHostScriptLoaded: testHostScriptLoaded,          
benchmarkLatency: benchmarkLatency,          
runAll: runAll          
};          

return {          
testCSInterface: testCSInterface,          
testHostEnvironment: testHostEnvironment,          
testRoundTrip: testRoundTrip,          
testHostScriptLoaded: testHostScriptLoaded,          
benchmarkLatency: benchmarkLatency,          
runAll: runAll          
};          
})();
```

**在 DevTools Console 中使用**：

```xml
// 运行全部诊断          
__GM_CEP_DIAG.runAll()          
          
// 单独测试通信延迟          
__GM_CEP_DIAG.benchmarkLatency(50)
```

---

## 3. HostAdapter 调试

### 3.1 请求/响应拦截器

```xml
// ============================          
// HostAdapter 请求拦截器          
// ============================          

var HostInterceptor = (function () {          
var _log = [];          
var _enabled = false;          
var MAX_LOG = 200;          

/**          
* 安装拦截器（包装 callHost）          
*/          
function install() {          
if (_enabled) return;          
_enabled = true;          

var _original = callHost;          

callHost = function (fnName, args) {          
var entry = {          
id: Date.now() + '_' + Math.random().toString(36).substr(2, 4),          
fn: fnName,          
args: args ? JSON.parse(JSON.stringify(args)) : [],          
startTime: performance.now(),          
endTime: null,          
duration: null,          
result: null,          
error: null,          
status: 'pending'          
};          

_log.push(entry);          
if (_log.length > MAX_LOG) _log.shift();          

DEBUG.log('host', '→ 请求: ' + fnName, { args: entry.args });          

return _original(fnName, args).then(function (result) {          
entry.endTime = performance.now();          
entry.duration = entry.endTime - entry.startTime;          
entry.result = result;          
entry.status = 'success';          

DEBUG.log('host', '← 响应: ' + fnName, {          
duration: entry.duration.toFixed(1) + 'ms',          
result: typeof result === 'string' && result.length > 200          
? result.substr(0, 200) + '...'          
: result          
});          

return result;          
}).catch(function (err) {          
entry.endTime = performance.now();          
entry.duration = entry.endTime - entry.startTime;          
entry.error = err.message;          
entry.status = 'error';          

DEBUG.error('host', '✗ 错误: ' + fnName, {          
duration: entry.duration.toFixed(1) + 'ms',          
error: err.message          
});          

throw err;          
});          
};          

DEBUG.log('host', '✓ HostAdapter 拦截器已安装');          
}          

/**          
* 获取请求日志          
*/          
function getLog(filter) {          
if (!filter) return _log.slice();          
return _log.filter(function (entry) {          
if (filter.status && entry.status !== filter.status) return false;          
if (filter.fn && entry.fn !== filter.fn) return false;          
if (filter.minDuration && entry.duration < filter.minDuration) return false;          
return true;          
});          
}          

/**          
* 打印请求统计          
*/          
function printStats() {          
var stats = {};          
for (var i = 0; i < _log.length; i++) {          
var entry = _log[i];          
if (!stats[entry.fn]) {          
stats[entry.fn] = { count: 0, totalTime: 0, errors: 0, avgTime: 0 };          
}          
stats[entry.fn].count++;          
if (entry.duration) stats[entry.fn].totalTime += entry.duration;          
if (entry.status === 'error') stats[entry.fn].errors++;          
}          

// 计算平均值          
var keys = Object.keys(stats);          
for (var j = 0; j < keys.length; j++) {          
var s = stats[keys[j]];          
s.avgTime = s.count > 0 ? (s.totalTime / s.count).toFixed(1) + 'ms' : '0ms';          
s.totalTime = s.totalTime.toFixed(1) + 'ms';          
}          

console.table(stats);          
return stats;          
}          

/**          
* 查找慢请求          
*/          
function findSlow(threshold) {          
threshold = threshold || 100; // 默认 100ms          
var slow = getLog({ minDuration: threshold });          
if (slow.length === 0) {          
DEBUG.log('host', '没有超过 ' + threshold + 'ms 的慢请求');          
} else {          
DEBUG.warn('host', '发现 ' + slow.length + ' 个慢请求 (>' + threshold + 'ms):');          
for (var i = 0; i < slow.length; i++) {          
DEBUG.warn('host', '  ' + slow[i].fn + ': ' + slow[i].duration.toFixed(1) + 'ms');          
}          
}          
return slow;          
}          

/**          
* 清除日志          
*/          
function clearLog() {          
_log = [];          
DEBUG.log('host', '请求日志已清空');          
}          

window.__GM_HOST_LOG = {          
install: install,          
getLog: getLog,          
printStats: printStats,          
findSlow: findSlow,          
clearLog: clearLog          
};          

return {          
install: install,          
getLog: getLog,          
printStats: printStats,          
findSlow: findSlow,          
clearLog: clearLog          
};          
})();
```

**在 DevTools Console 中使用**：

```html
// 安装拦截器（开始记录所有请求）          
__GM_HOST_LOG.install()          
          
// 执行一些操作后...          
          
// 查看请求统计          
__GM_HOST_LOG.printStats()          
          
// 查找超过 200ms 的慢请求          
__GM_HOST_LOG.findSlow(200)          
          
// 查看所有失败请求          
__GM_HOST_LOG.getLog({ status: 'error' })
```

---

## 4. 网格引擎调试

### 4.1 网格计算验证器

```css
// ============================          
// 网格引擎调试工具          
// ============================          

var GridDebugger = (function () {          

/**          
* 验证网格参数合法性          
*/          
function validateParams(params) {          
DEBUG.log('grid', '=== 网格参数验证 ===');          

var errors = [];          
var warnings = [];          

// 必填字段检查          
var required = ['columns', 'rows', 'gutterH', 'gutterV',          
'marginTop', 'marginRight', 'marginBottom', 'marginLeft'];          
for (var i = 0; i < required.length; i++) {          
if (params[required[i]] === undefined || params[required[i]] === null) {          
errors.push('缺少必填参数: ' + required[i]);          
}          
}          

// 类型检查          
var numericFields = required;          
for (var j = 0; j < numericFields.length; j++) {          
var val = params[numericFields[j]];          
if (typeof val !== 'number' || isNaN(val)) {          
errors.push(numericFields[j] + ' 必须是有效数字，当前值: ' + JSON.stringify(val));          
}          
}          

// 范围检查          
if (params.columns < 1 || params.columns > 100) {          
errors.push('columns 超出合理范围 [1, 100]，当前值: ' + params.columns);          
}          
if (params.rows < 1 || params.rows > 100) {          
errors.push('rows 超出合理范围 [1, 100]，当前值: ' + params.rows);          
}          
if (params.gutterH < 0) {          
errors.push('gutterH 不能为负数');          
}          
if (params.gutterV < 0) {          
errors.push('gutterV 不能为负数');          
}          

// 逻辑检查（需要文档尺寸）          
if (currentDocInfo) {          
var availableWidth = currentDocInfo.width - params.marginLeft - params.marginRight;          
var availableHeight = currentDocInfo.height - params.marginTop - params.marginBottom;          
var totalGutterH = (params.columns - 1) * params.gutterH;          
var totalGutterV = (params.rows - 1) * params.gutterV;          

if (totalGutterH >= availableWidth) {          
errors.push('水平间距总和 (' + totalGutterH.toFixed(1) +          
'pt) 超过可用宽度 (' + availableWidth.toFixed(1) + 'pt)');          
}          

if (totalGutterV >= availableHeight) {          
errors.push('垂直间距总和 (' + totalGutterV.toFixed(1) +          
'pt) 超过可用高度 (' + availableHeight.toFixed(1) + 'pt)');          
}          

var colWidth = (availableWidth - totalGutterH) / params.columns;          
var rowHeight = (availableHeight - totalGutterV) / params.rows;          

if (colWidth < 1) {          
warnings.push('列宽过小: ' + colWidth.toFixed(2) + 'pt，可能无法正常显示');          
}          
if (rowHeight < 1) {          
warnings.push('行高过小: ' + rowHeight.toFixed(2) + 'pt，可能无法正常显示');          
}          

DEBUG.log('grid', '计算结果预览:', {          
availableWidth: availableWidth.toFixed(1) + 'pt',          
availableHeight: availableHeight.toFixed(1) + 'pt',          
columnWidth: colWidth.toFixed(2) + 'pt',          
rowHeight: rowHeight.toFixed(2) + 'pt',          
totalGutterH: totalGutterH.toFixed(1) + 'pt',          
totalGutterV: totalGutterV.toFixed(1) + 'pt'          
});          
} else {          
warnings.push('无法获取文档信息，跳过尺寸逻辑校验');          
}          

// 输出结果          
if (errors.length > 0) {          
DEBUG.error('grid', '✗ 验证失败 (' + errors.length + ' 个错误):');          
for (var k = 0; k < errors.length; k++) {          
DEBUG.error('grid', '  [E' + (k + 1) + '] ' + errors[k]);          
}          
}          

if (warnings.length > 0) {          
DEBUG.warn('grid', '⚠ 警告 (' + warnings.length + ' 条):');          
for (var l = 0; l < warnings.length; l++) {          
DEBUG.warn('grid', '  [W' + (l + 1) + '] ' + warnings[l]);          
}          
}          

if (errors.length === 0 && warnings.length === 0) {          
DEBUG.log('grid', '✓ 所有参数验证通过');          
}          

return {          
valid: errors.length === 0,          
errors: errors,          
warnings: warnings          
};          
}          

/**          
* 模拟网格计算（不实际绘制）          
*/          
function simulateGrid(params) {          
DEBUG.log('grid', '=== 网格模拟计算 ===');          

if (!currentDocInfo) {          
DEBUG.error('grid', '无法模拟：没有打开的文档');          
return null;          
}          

var w = currentDocInfo.width;          
var h = currentDocInfo.height;          
var availW = w - params.marginLeft - params.marginRight;          
var availH = h - params.marginTop - params.marginBottom;          
var gutterTotalH = (params.columns - 1) * params.gutterH;          
var gutterTotalV = (params.rows - 1) * params.gutterV;          
var colW = (availW - gutterTotalH) / params.columns;          
var rowH = (availH - gutterTotalV) / params.rows;          

var guides = { vertical: [], horizontal: [] };          

// 计算垂直参考线          
for (var c = 0; c <= params.columns; c++) {          
var x;          
if (c === 0) {          
x = params.marginLeft;          
} else {          
x = params.marginLeft + c * colW + (c - 1) * params.gutterH;          
// 间距右边线          
if (c < params.columns) {          
guides.vertical.push({          
position: x + params.gutterH,          
type: 'gutter_right',          
label: 'G' + c + 'R'          
});          
}          
}          
guides.vertical.push({          
position: x,          
type: c === 0 || c === params.columns ? 'margin' : 'gutter_left',          
label: c === 0 ? 'ML' : (c === params.columns ? 'MR' : 'G' + c + 'L')          
});          
}          

// 计算水平参考线          
for (var r = 0; r <= params.rows; r++) {          
var y;          
if (r === 0) {          
y = params.marginTop;          
} else {          
y = params.marginTop + r * rowH + (r - 1) * params.gutterV;          
if (r < params.rows) {          
guides.horizontal.push({          
position: y + params.gutterV,          
type: 'gutter_bottom',          
label: 'G' + r + 'B'          
});          
}          
}          
guides.horizontal.push({          
position: y,          
type: r === 0 || r === params.rows ? 'margin' : 'gutter_top',          
label: r === 0 ? 'MT' : (r === params.rows ? 'MB' : 'G' + r + 'T')          
});          
}          

var totalGuides = guides.vertical.length + guides.horizontal.length;          

DEBUG.log('grid', '模拟结果:', {          
documentSize: w.toFixed(0) + ' × ' + h.toFixed(0) + 'pt',          
availableArea: availW.toFixed(1) + ' × ' + availH.toFixed(1) + 'pt',          
columnWidth: colW.toFixed(2) + 'pt',          
rowHeight: rowH.toFixed(2) + 'pt',          
verticalGuides: guides.vertical.length,          
horizontalGuides: guides.horizontal.length,          
totalGuides: totalGuides          
});          

// 打印参考线详情          
console.group('[GM:GRID] 垂直参考线 (' + guides.vertical.length + ')');          
for (var vi = 0; vi < guides.vertical.length; vi++) {          
var vg = guides.vertical[vi];          
console.log('  ' + vg.label + ': ' + vg.position.toFixed(2) + 'pt (' + vg.type + ')');          
}          
console.groupEnd();          

console.group('[GM:GRID] 水平参考线 (' + guides.horizontal.length + ')');          
for (var hi = 0; hi < guides.horizontal.length; hi++) {          
var hg = guides.horizontal[hi];          
console.log('  ' + hg.label + ': ' + hg.position.toFixed(2) + 'pt (' + hg.type + ')');          
}          
console.groupEnd();          

return guides;          

中断对接处          

```javascript          
    console.groupEnd();          
          
    return guides;          
  }          
          
  // 暴露到全局          
  window.__GM_GRID_DEBUG = {          
    validateParams: validateParams,          
    simulateGrid: simulateGrid          
  };          
          
  return {          
    validateParams: validateParams,          
    simulateGrid: simulateGrid          
  };          
})();
```

---

## 5. 构图辅助线与电商模块调试

### 5.1 构图辅助线 (Composition) 逻辑验证

构图线（如黄金分割、三分法）依赖于当前选区或画板。调试重点在于坐标系转换。

```javascript
/**          
* 构图辅助线调试：检查坐标计算          
*/          
function debugCompositionBounds() {          
callHost('getDocumentInfo', []).then(function(doc) {          
var info = JSON.parse(doc);          
var target = info.selectionBounds || {left: 0, top: 0, width: info.width, height: info.height};          

DEBUG.log('composition', '当前计算边界:', target);          

// 验证黄金分割线          
var golden = target.width * 0.618;          
DEBUG.log('composition', '黄金分割线 X 坐标: ' + (target.left + golden).toFixed(2));          
});          
}
```

### 5.2 电商功能区 (Ecom) 调试

电商模块通常涉及复杂的图层叠加（如“促销价”、“原价”占位符）。调试建议：

1. **分层检查**：在 `hostscript.jsx` 中添加函数，强制返回当前所有 `DotGridMaster_` 前缀的图层名称列表，以便检查是否产生图层堆积。
2. **JSON 数据完整性**：在 `BatchProcessor` 中捕获 `JSON.parse` 错误，如果解析失败，直接在控制台输出原始字符串，检查是否有未转义的特殊字符。


---

## 6. 印刷出血模块调试

### 6.1 印刷标记 (PrintMarks) 坐标校验

印刷标记（裁切线、十字线）通常位于画板边缘外侧。

- **调试点**：在宿主中执行 `alert(app.activeDocument.artboards[0].artboardRect)`，检查获得的矩形坐标是否包含出血区域。
- **常见 Bug**：如果画板本身没有设置出血 (Bleed)，脚本计算出的坐标可能为负值，导致 AI 报错。

---

## 7. 撤销/重做系统调试

### 7.1 栈状态监控

当撤销失效时，使用以下方法查看栈内数据：

```javascript
// 在控制台输入          
var state = UndoManager.getState();          
console.table({          
  "Undo栈长度": state.undoCount,          
  "Redo栈长度": state.redoCount,          
  "栈顶标签": state.undoLabel          
});
```

### 7.2 历史快照恢复测试

如果 `clearAll`
后撤销无法恢复，请手动验证`UndoManager.captureSnapshot()`的返回值，确保`guides`数组已正确序列化。

---

## 8. 批处理引擎 (`BatchProcessor`) 深度排查

### 8.1 队列堆积诊断

如果面板操作响应变慢，可能是批处理队列未及时清空。

```javascript
// 查看当前队列状态          
var status = BatchProcessor.getStatus();          
if (status.queueLength > 10) {          
DEBUG.warn('batch', '队列堆积严重，当前任务数: ' + status.queueLength);          
}
```

### 8.2 脚本注入错误

批处理会构建一个巨大的 `(function(){...})()` 字符串。如果 AI 报 `EvalScript error`，请在 `BatchProcessor._buildBatchScript` 中增加：

```javascript
console.log('生成的批处理脚本:', script);
```

然后将打印出的脚本复制到 ESTK 中运行，查看具体的 Syntax Error。

---

## 9. 性能瓶颈排查表 (Performance Checklist)


| 现象                 | 可能原因                                | 解决办法                                        |
|------------------------|---------------------------------------------|-----------------------------------------------------|
| **面板打开缓慢** | 资源加载过多                          | 检查 `index.html` 是否有大型非必要库     |
| **频繁卡顿**       | `csInterface.evalScript` 调用过于频繁 | 确保所有业务调用已接入 `BatchProcessor`  |
| **内存泄露**       | 监听器未销毁                          | 检查 `UndoManager.onChange` 的回调移除逻辑 |
| **UI 响应迟钝**    | 复杂 DOM 渲染                           | 对长列表使用虚拟滚动或减少 DOM 节点  |


---

## 10. 常见故障速查表

- **错误：`EvalScript error.`**- **原因**：ExtendScript 函数内部抛出了异常，或者返回了不可序列化的数据（如 `undefined` 或 `null`）。
- **修复**：在 JSX 函数末尾添加 `return "success";` 确保返回类型一致。
- **错误：`undefined`**
- **原因**：JSX 函数没有返回值，或者回调函数执行过早。
- **修复**：所有 JSX 函数必须以 `return JSON.stringify(result);` 结尾。
- **错误：UI 闪烁**
- **原因**：主题同步逻辑在 DOM 加载后才触发。
- **修复**：将 `ThemeManager.init()` 放在 `DOMContentLoaded` 的最前端。

---

**调试总结**：DotGridMaster的稳定性核心在于\*\*“通信协议一致性”\*\*。始终保持 JSX 与 JS 之间的数据交互为 JSON
字符串格式，并利用`__GM_DEBUG`工具集进行模块化监控。

如果你在某一个具体模块（如批处理逻辑）中遇到了无法复现的偶发 Bug，建议开启 `HostInterceptor` 并导出日志，我可以帮你分析日志中的调用时序。

 
