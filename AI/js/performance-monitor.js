// ============================
  // P3-20: 性能监控
  // ============================

  var PerfMonitor = (function () {
    var _metrics = {};
    var _enabled = false;

    /**
     * 开始计时
     */
    function start(label) {
      if (!_enabled) return;
      _metrics[label] = {
        start: performance.now(),
        end: null,
        duration: null
      };
    }

    /**
     * 结束计时
     */
    function end(label) {
      if (!_enabled || !_metrics[label]) return 0;
      _metrics[label].end = performance.now();
      _metrics[label].duration = _metrics[label].end - _metrics[label].start;
      return _metrics[label].duration;
    }

    /**
     * 包装异步函数，自动计时
     */
    function wrap(label, fn) {
      return function () {
        start(label);
        var result = fn.apply(this, arguments);
        if (result && typeof result.then === 'function') {
          return result.then(function (val) {
            var dur = end(label);
            if (_enabled) {
              console.log('[Perf] ' + label + ': ' + dur.toFixed(1) + 'ms');
            }
            return val;
          });
        } else {
          var dur = end(label);
          if (_enabled) {
            console.log('[Perf] ' + label + ': ' + dur.toFixed(1) + 'ms');
          }
          return result;
        }
      };
    }

    /**
     * 获取所有指标
     */
    function getAll() {
      var results = [];
      var keys = Object.keys(_metrics);
      for (var i = 0; i < keys.length; i++) {
        var m = _metrics[keys[i]];
        if (m.duration !== null) {
          results.push({
            label: keys[i],
            duration: m.duration
          });
        }
      }
      return results.sort(function (a, b) {
        return b.duration - a.duration;
      });
    }

    /**
     * 清除
     */
    function clear() {
      _metrics = {};
    }

    function setEnabled(v) {
      _enabled = v;
    }

    function isEnabled() {
      return _enabled;
    }

    return {
      start: start,
      end: end,
      wrap: wrap,
      getAll: getAll,
      clear: clear,
      setEnabled: setEnabled,
      isEnabled: isEnabled
    };
  })();
