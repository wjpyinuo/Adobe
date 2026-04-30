/**
 * DotGridMaster Units 工具单元测试
 * 测试 core.js 中 GM.Units 的单位转换逻辑
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// 模拟 GM.Units（从 core.js 提取）
const Units = {
  TO_PT: {
    px: 0.75,
    pt: 1,
    mm: 2.83465,
    cm: 28.3465,
    in: 72,
    pica: 12
  },

  convert: function (value, fromUnit, toUnit) {
    var fromFactor = this.TO_PT[fromUnit] || 1;
    var toFactor = this.TO_PT[toUnit] || 1;
    return value * fromFactor / toFactor;
  }
};

describe('Units.convert', () => {
  it('相同单位转换应返回原值', () => {
    assert.equal(Units.convert(100, 'px', 'px'), 100);
    assert.equal(Units.convert(50, 'mm', 'mm'), 50);
    assert.equal(Units.convert(0, 'pt', 'pt'), 0);
  });

  it('px 到 pt 应乘以 0.75', () => {
    assert.ok(Math.abs(Units.convert(100, 'px', 'pt') - 75) < 0.01);
    assert.ok(Math.abs(Units.convert(200, 'px', 'pt') - 150) < 0.01);
  });

  it('pt 到 px 应除以 0.75', () => {
    assert.ok(Math.abs(Units.convert(75, 'pt', 'px') - 100) < 0.01);
  });

  it('mm 到 pt 应乘以 2.83465', () => {
    assert.ok(Math.abs(Units.convert(10, 'mm', 'pt') - 28.3465) < 0.01);
    assert.ok(Math.abs(Units.convert(3, 'mm', 'pt') - 8.50395) < 0.01);
  });

  it('mm 到 px 应正确转换', () => {
    // 3mm = 3 * 2.83465 pt = 8.50395 pt = 8.50395 / 0.75 px = 11.3386 px
    assert.ok(Math.abs(Units.convert(3, 'mm', 'px') - 11.3386) < 0.01);
  });

  it('in 到 pt 应乘以 72', () => {
    assert.ok(Math.abs(Units.convert(1, 'in', 'pt') - 72) < 0.01);
  });

  it('cm 到 mm 应乘以 10', () => {
    assert.ok(Math.abs(Units.convert(1, 'cm', 'mm') - 10) < 0.01);
  });

  it('未知单位应使用默认因子 1', () => {
    assert.equal(Units.convert(100, 'unknown', 'pt'), 100);
    assert.equal(Units.convert(100, 'pt', 'unknown'), 100);
  });

  it('零值应返回零', () => {
    assert.equal(Units.convert(0, 'mm', 'px'), 0);
    assert.equal(Units.convert(0, 'px', 'in'), 0);
  });

  it('负值应正确处理', () => {
    assert.ok(Math.abs(Units.convert(-10, 'px', 'pt') - (-7.5)) < 0.01);
  });
});
