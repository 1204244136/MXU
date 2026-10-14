import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

// Node 测试运行器不读取 tsconfig paths；只补齐解析，使用真实的业务模块。
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/')) {
      return nextResolve(new URL(`../src/${specifier.slice(2)}.ts`, import.meta.url).href, context);
    }
    return nextResolve(specifier, context);
  },
});
const { buildTabConfigExportText, importTabConfigFromText } =
  await import('../src/utils/tabExportImport.ts');
hooks.deregister();

function makeInstance(weeklySchedule) {
  return {
    id: 'instance',
    name: '周计划配置',
    controllerName: 'controller',
    selectedTasks: [
      {
        id: 'weekly',
        taskName: 'weekly',
        enabled: true,
        weeklySchedule,
        optionValues: {},
        expanded: true,
      },
    ],
  };
}

test('标签页导出导入保留任务周计划', async () => {
  const instance = makeInstance([0, 3]);
  const text = await buildTabConfigExportText(instance, 'demo');
  const result = await importTabConfigFromText('demo', text);
  assert.equal(result.tabName, instance.name);
  assert.deepEqual(result.payload.selectedTasks[0].weeklySchedule, [0, 3]);
});

test('标签页导出导入兼容缺省与空数组周计划', async () => {
  for (const weeklySchedule of [undefined, []]) {
    const text = await buildTabConfigExportText(makeInstance(weeklySchedule), 'demo');
    const result = await importTabConfigFromText('demo', text);
    assert.deepEqual(result.payload.selectedTasks[0].weeklySchedule, weeklySchedule);
  }
});
