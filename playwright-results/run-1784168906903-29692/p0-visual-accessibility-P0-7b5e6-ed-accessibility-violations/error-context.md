# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: p0-visual-accessibility.spec.js >> P0 visual and accessibility gate >> has no serious or critical automated accessibility violations
- Location: tests\e2e\p0-visual-accessibility.spec.js:70:3

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  -   1
+ Received  + 886

- Array []
+ Array [
+   Object {
+     "description": "Ensure interactive controls are not nested as they are not always announced by screen readers or can cause focus problems for assistive technologies",
+     "help": "Interactive controls must not be nested",
+     "helpUrl": "https://dequeuniversity.com/rules/axe/4.12/nested-interactive?application=playwright",
+     "id": "nested-interactive",
+     "impact": "serious",
+     "nodes": Array [
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "no-focusable-content",
+             "impact": "serious",
+             "message": "Element has focusable descendants",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<button type=\"button\" class=\"shape-favorite-btn\" aria-label=\"Favorite 流程\" title=\"Favorite\" aria-pressed=\"false\">☆</button>",
+                 "target": Array [
+                   "button[aria-label=\"Favorite 流程\"]",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has focusable descendants",
+         "html": "<div class=\"shape-item\" draggable=\"true\" data-shape=\"rectangle\" data-label=\"Process\" data-shape-bound=\"true\" role=\"button\" tabindex=\"0\" aria-label=\"流程\">",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "div[data-shape=\"rectangle\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "no-focusable-content",
+             "impact": "serious",
+             "message": "Element has focusable descendants",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<button type=\"button\" class=\"shape-favorite-btn\" aria-label=\"Favorite 子流程\" title=\"Favorite\" aria-pressed=\"false\">☆</button>",
+                 "target": Array [
+                   "button[aria-label=\"Favorite 子流程\"]",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has focusable descendants",
+         "html": "<div class=\"shape-item\" draggable=\"true\" data-shape=\"rounded\" data-label=\"Subprocess\" data-shape-bound=\"true\" role=\"button\" tabindex=\"0\" aria-label=\"子流程\">",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "div[data-shape=\"rounded\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "no-focusable-content",
+             "impact": "serious",
+             "message": "Element has focusable descendants",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<button type=\"button\" class=\"shape-favorite-btn\" aria-label=\"Favorite 判断\" title=\"Favorite\" aria-pressed=\"false\">☆</button>",
+                 "target": Array [
+                   "button[aria-label=\"Favorite 判断\"]",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has focusable descendants",
+         "html": "<div class=\"shape-item\" draggable=\"true\" data-shape=\"diamond\" data-label=\"Decision\" data-shape-bound=\"true\" role=\"button\" tabindex=\"0\" aria-label=\"判断\">",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "div[data-shape=\"diamond\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "no-focusable-content",
+             "impact": "serious",
+             "message": "Element has focusable descendants",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<button type=\"button\" class=\"shape-favorite-btn\" aria-label=\"Favorite 开始/结束\" title=\"Favorite\" aria-pressed=\"false\">☆</button>",
+                 "target": Array [
+                   "button[aria-label=\"Favorite 开始/结束\"]",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has focusable descendants",
+         "html": "<div class=\"shape-item\" draggable=\"true\" data-shape=\"terminator\" data-label=\"Start/End\" data-shape-bound=\"true\" role=\"button\" tabindex=\"0\" aria-label=\"开始/结束\">",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "div[data-shape=\"terminator\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "no-focusable-content",
+             "impact": "serious",
+             "message": "Element has focusable descendants",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<button type=\"button\" class=\"shape-favorite-btn\" aria-label=\"Favorite 连接点\" title=\"Favorite\" aria-pressed=\"false\">☆</button>",
+                 "target": Array [
+                   "button[aria-label=\"Favorite 连接点\"]",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has focusable descendants",
+         "html": "<div class=\"shape-item\" draggable=\"true\" data-shape=\"circle\" data-label=\"Connector\" data-shape-bound=\"true\" role=\"button\" tabindex=\"0\" aria-label=\"连接点\">",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "div[data-shape=\"circle\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "no-focusable-content",
+             "impact": "serious",
+             "message": "Element has focusable descendants",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<button type=\"button\" class=\"shape-favorite-btn\" aria-label=\"Favorite 数据\" title=\"Favorite\" aria-pressed=\"false\">☆</button>",
+                 "target": Array [
+                   "button[aria-label=\"Favorite 数据\"]",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has focusable descendants",
+         "html": "<div class=\"shape-item\" draggable=\"true\" data-shape=\"database\" data-label=\"Database\" data-shape-bound=\"true\" role=\"button\" tabindex=\"0\" aria-label=\"数据\">",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "div[data-shape=\"database\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "no-focusable-content",
+             "impact": "serious",
+             "message": "Element has focusable descendants",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<button type=\"button\" class=\"shape-favorite-btn\" aria-label=\"Favorite 输入/输出\" title=\"Favorite\" aria-pressed=\"false\">☆</button>",
+                 "target": Array [
+                   "button[aria-label=\"Favorite 输入/输出\"]",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has focusable descendants",
+         "html": "<div class=\"shape-item\" draggable=\"true\" data-shape=\"parallelogram\" data-label=\"Input/Output\" data-shape-bound=\"true\" role=\"button\" tabindex=\"0\" aria-label=\"输入/输出\">",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "div[data-shape=\"parallelogram\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "no-focusable-content",
+             "impact": "serious",
+             "message": "Element has focusable descendants",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<button type=\"button\" class=\"shape-favorite-btn\" aria-label=\"Favorite 文档\" title=\"Favorite\" aria-pressed=\"false\">☆</button>",
+                 "target": Array [
+                   "button[aria-label=\"Favorite 文档\"]",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has focusable descendants",
+         "html": "<div class=\"shape-item\" draggable=\"true\" data-shape=\"document\" data-label=\"Document\" data-shape-bound=\"true\" role=\"button\" tabindex=\"0\" aria-label=\"文档\">",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "div[data-shape=\"document\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "no-focusable-content",
+             "impact": "serious",
+             "message": "Element has focusable descendants",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<button type=\"button\" class=\"shape-favorite-btn\" aria-label=\"Favorite 准备\" title=\"Favorite\" aria-pressed=\"false\">☆</button>",
+                 "target": Array [
+                   "button[aria-label=\"Favorite 准备\"]",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has focusable descendants",
+         "html": "<div class=\"shape-item\" draggable=\"true\" data-shape=\"hexagon\" data-label=\"Preparation\" data-shape-bound=\"true\" role=\"button\" tabindex=\"0\" aria-label=\"准备\">",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "div[data-shape=\"hexagon\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "no-focusable-content",
+             "impact": "serious",
+             "message": "Element has focusable descendants",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<button type=\"button\" class=\"shape-favorite-btn\" aria-label=\"Favorite 合并\" title=\"Favorite\" aria-pressed=\"false\">☆</button>",
+                 "target": Array [
+                   "button[aria-label=\"Favorite 合并\"]",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has focusable descendants",
+         "html": "<div class=\"shape-item\" draggable=\"true\" data-shape=\"triangle\" data-label=\"Merge\" data-shape-bound=\"true\" role=\"button\" tabindex=\"0\" aria-label=\"合并\">",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "div[data-shape=\"triangle\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "no-focusable-content",
+             "impact": "serious",
+             "message": "Element has focusable descendants",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<button type=\"button\" class=\"shape-favorite-btn\" aria-label=\"Favorite 延迟\" title=\"Favorite\" aria-pressed=\"false\">☆</button>",
+                 "target": Array [
+                   "button[aria-label=\"Favorite 延迟\"]",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has focusable descendants",
+         "html": "<div class=\"shape-item\" draggable=\"true\" data-shape=\"delay\" data-label=\"Delay\" data-shape-bound=\"true\" role=\"button\" tabindex=\"0\" aria-label=\"延迟\">",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "div[data-shape=\"delay\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "no-focusable-content",
+             "impact": "serious",
+             "message": "Element has focusable descendants",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<button type=\"button\" class=\"shape-favorite-btn\" aria-label=\"Favorite 显示\" title=\"Favorite\" aria-pressed=\"false\">☆</button>",
+                 "target": Array [
+                   "button[aria-label=\"Favorite 显示\"]",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has focusable descendants",
+         "html": "<div class=\"shape-item\" draggable=\"true\" data-shape=\"display\" data-label=\"Display\" data-shape-bound=\"true\" role=\"button\" tabindex=\"0\" aria-label=\"显示\">",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "div[data-shape=\"display\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "no-focusable-content",
+             "impact": "serious",
+             "message": "Element has focusable descendants",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<button type=\"button\" class=\"shape-favorite-btn\" aria-label=\"Favorite 手动操作\" title=\"Favorite\" aria-pressed=\"false\">☆</button>",
+                 "target": Array [
+                   "button[aria-label=\"Favorite 手动操作\"]",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has focusable descendants",
+         "html": "<div class=\"shape-item\" draggable=\"true\" data-shape=\"manual\" data-label=\"Manual\" data-shape-bound=\"true\" role=\"button\" tabindex=\"0\" aria-label=\"手动操作\">",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "div[data-shape=\"manual\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "no-focusable-content",
+             "impact": "serious",
+             "message": "Element has focusable descendants",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<button type=\"button\" class=\"shape-favorite-btn\" aria-label=\"Favorite 排序\" title=\"Favorite\" aria-pressed=\"false\">☆</button>",
+                 "target": Array [
+                   "button[aria-label=\"Favorite 排序\"]",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has focusable descendants",
+         "html": "<div class=\"shape-item\" draggable=\"true\" data-shape=\"sort\" data-label=\"Sort\" data-shape-bound=\"true\" role=\"button\" tabindex=\"0\" aria-label=\"排序\">",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "div[data-shape=\"sort\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "no-focusable-content",
+             "impact": "serious",
+             "message": "Element has focusable descendants",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<button type=\"button\" class=\"shape-favorite-btn\" aria-label=\"Favorite 或\" title=\"Favorite\" aria-pressed=\"false\">☆</button>",
+                 "target": Array [
+                   "button[aria-label=\"Favorite 或\"]",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has focusable descendants",
+         "html": "<div class=\"shape-item\" draggable=\"true\" data-shape=\"or\" data-label=\"Or\" data-shape-bound=\"true\" role=\"button\" tabindex=\"0\" aria-label=\"或\">",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "div[data-shape=\"or\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "no-focusable-content",
+             "impact": "serious",
+             "message": "Element has focusable descendants",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<button type=\"button\" class=\"shape-favorite-btn\" aria-label=\"Favorite 存储\" title=\"Favorite\" aria-pressed=\"false\">☆</button>",
+                 "target": Array [
+                   "button[aria-label=\"Favorite 存储\"]",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has focusable descendants",
+         "html": "<div class=\"shape-item\" draggable=\"true\" data-shape=\"storage\" data-label=\"Storage\" data-shape-bound=\"true\" role=\"button\" tabindex=\"0\" aria-label=\"存储\">",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "div[data-shape=\"storage\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "no-focusable-content",
+             "impact": "serious",
+             "message": "Element has focusable descendants",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<button type=\"button\" class=\"shape-favorite-btn\" aria-label=\"Favorite 多文档\" title=\"Favorite\" aria-pressed=\"false\">☆</button>",
+                 "target": Array [
+                   "button[aria-label=\"Favorite 多文档\"]",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has focusable descendants",
+         "html": "<div class=\"shape-item\" draggable=\"true\" data-shape=\"multidoc\" data-label=\"Multi-document\" data-shape-bound=\"true\" role=\"button\" tabindex=\"0\" aria-label=\"多文档\">",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "div[data-shape=\"multidoc\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "no-focusable-content",
+             "impact": "serious",
+             "message": "Element has focusable descendants",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<button type=\"button\" class=\"shape-favorite-btn\" aria-label=\"Favorite 内部存储\" title=\"Favorite\" aria-pressed=\"false\">☆</button>",
+                 "target": Array [
+                   "button[aria-label=\"Favorite 内部存储\"]",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has focusable descendants",
+         "html": "<div class=\"shape-item\" draggable=\"true\" data-shape=\"internalstorage\" data-label=\"Internal storage\" data-shape-bound=\"true\" role=\"button\" tabindex=\"0\" aria-label=\"内部存储\">",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "div[data-shape=\"internalstorage\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "no-focusable-content",
+             "impact": "serious",
+             "message": "Element has focusable descendants",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<button type=\"button\" class=\"shape-favorite-btn\" aria-label=\"Favorite 离线存储\" title=\"Favorite\" aria-pressed=\"false\">☆</button>",
+                 "target": Array [
+                   "button[aria-label=\"Favorite 离线存储\"]",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has focusable descendants",
+         "html": "<div class=\"shape-item\" draggable=\"true\" data-shape=\"offlinestorage\" data-label=\"Offline storage\" data-shape-bound=\"true\" role=\"button\" tabindex=\"0\" aria-label=\"离线存储\">",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "div[data-shape=\"offlinestorage\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "no-focusable-content",
+             "impact": "serious",
+             "message": "Element has focusable descendants",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<button type=\"button\" class=\"shape-favorite-btn\" aria-label=\"Favorite 注释\" title=\"Favorite\" aria-pressed=\"false\">☆</button>",
+                 "target": Array [
+                   "button[aria-label=\"Favorite 注释\"]",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has focusable descendants",
+         "html": "<div class=\"shape-item\" draggable=\"true\" data-shape=\"annotation\" data-label=\"Annotation\" data-shape-bound=\"true\" role=\"button\" tabindex=\"0\" aria-label=\"注释\">",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "div[data-shape=\"annotation\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "no-focusable-content",
+             "impact": "serious",
+             "message": "Element has focusable descendants",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<button type=\"button\" class=\"shape-favorite-btn\" aria-label=\"Favorite 云服务\" title=\"Favorite\" aria-pressed=\"false\">☆</button>",
+                 "target": Array [
+                   "button[aria-label=\"Favorite 云服务\"]",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has focusable descendants",
+         "html": "<div class=\"shape-item\" draggable=\"true\" data-shape=\"cloud\" data-label=\"Cloud\" data-shape-bound=\"true\" role=\"button\" tabindex=\"0\" aria-label=\"云服务\">",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "div[data-shape=\"cloud\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "no-focusable-content",
+             "impact": "serious",
+             "message": "Element has focusable descendants",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<button type=\"button\" class=\"shape-favorite-btn\" aria-label=\"Favorite 角色\" title=\"Favorite\" aria-pressed=\"false\">☆</button>",
+                 "target": Array [
+                   "button[aria-label=\"Favorite 角色\"]",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has focusable descendants",
+         "html": "<div class=\"shape-item\" draggable=\"true\" data-shape=\"actor\" data-label=\"Actor\" data-shape-bound=\"true\" role=\"button\" tabindex=\"0\" aria-label=\"角色\">",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "div[data-shape=\"actor\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "no-focusable-content",
+             "impact": "serious",
+             "message": "Element has focusable descendants",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<button type=\"button\" class=\"shape-favorite-btn\" aria-label=\"Favorite 便签\" title=\"Favorite\" aria-pressed=\"false\">☆</button>",
+                 "target": Array [
+                   "button[aria-label=\"Favorite 便签\"]",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has focusable descendants",
+         "html": "<div class=\"shape-item\" draggable=\"true\" data-shape=\"note\" data-label=\"Note\" data-shape-bound=\"true\" role=\"button\" tabindex=\"0\" aria-label=\"便签\">",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "div[data-shape=\"note\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "no-focusable-content",
+             "impact": "serious",
+             "message": "Element has focusable descendants",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<button type=\"button\" class=\"shape-favorite-btn\" aria-label=\"Favorite 跨页\" title=\"Favorite\" aria-pressed=\"false\">☆</button>",
+                 "target": Array [
+                   "button[aria-label=\"Favorite 跨页\"]",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has focusable descendants",
+         "html": "<div class=\"shape-item\" draggable=\"true\" data-shape=\"offpage\" data-label=\"Off-page\" data-shape-bound=\"true\" role=\"button\" tabindex=\"0\" aria-label=\"跨页\">",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "div[data-shape=\"offpage\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "no-focusable-content",
+             "impact": "serious",
+             "message": "Element has focusable descendants",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<button type=\"button\" class=\"shape-favorite-btn\" aria-label=\"Favorite 子流程框\" title=\"Favorite\" aria-pressed=\"false\">☆</button>",
+                 "target": Array [
+                   "button[aria-label=\"Favorite 子流程框\"]",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has focusable descendants",
+         "html": "<div class=\"shape-item\" draggable=\"true\" data-shape=\"subprocess\" data-label=\"Subprocess frame\" data-shape-bound=\"true\" role=\"button\" tabindex=\"0\" aria-label=\"子流程框\">",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "div[data-shape=\"subprocess\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "no-focusable-content",
+             "impact": "serious",
+             "message": "Element has focusable descendants",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<button type=\"button\" class=\"shape-favorite-btn\" aria-label=\"Favorite 交叉\" title=\"Favorite\" aria-pressed=\"false\">☆</button>",
+                 "target": Array [
+                   "button[aria-label=\"Favorite 交叉\"]",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has focusable descendants",
+         "html": "<div class=\"shape-item\" draggable=\"true\" data-shape=\"cross\" data-label=\"Cross\" data-shape-bound=\"true\" role=\"button\" tabindex=\"0\" aria-label=\"交叉\">",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "div[data-shape=\"cross\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "no-focusable-content",
+             "impact": "serious",
+             "message": "Element has focusable descendants",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<button type=\"button\" class=\"shape-favorite-btn\" aria-label=\"Favorite 开始\" title=\"Favorite\" aria-pressed=\"false\">☆</button>",
+                 "target": Array [
+                   "button[aria-label=\"Favorite 开始\"]",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has focusable descendants",
+         "html": "<div class=\"shape-item\" draggable=\"true\" data-shape=\"start\" data-label=\"Start\" data-shape-bound=\"true\" role=\"button\" tabindex=\"0\" aria-label=\"开始\">",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "div[data-shape=\"start\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "no-focusable-content",
+             "impact": "serious",
+             "message": "Element has focusable descendants",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<button type=\"button\" class=\"shape-favorite-btn\" aria-label=\"Favorite 结束\" title=\"Favorite\" aria-pressed=\"false\">☆</button>",
+                 "target": Array [
+                   "button[aria-label=\"Favorite 结束\"]",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has focusable descendants",
+         "html": "<div class=\"shape-item\" draggable=\"true\" data-shape=\"end\" data-label=\"End\" data-shape-bound=\"true\" role=\"button\" tabindex=\"0\" aria-label=\"结束\">",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "div[data-shape=\"end\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "no-focusable-content",
+             "impact": "serious",
+             "message": "Element has focusable descendants",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<button type=\"button\" class=\"shape-favorite-btn\" aria-label=\"Favorite 卡片\" title=\"Favorite\" aria-pressed=\"false\">☆</button>",
+                 "target": Array [
+                   "button[aria-label=\"Favorite 卡片\"]",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has focusable descendants",
+         "html": "<div class=\"shape-item\" draggable=\"true\" data-shape=\"card\" data-label=\"Card\" data-shape-bound=\"true\" role=\"button\" tabindex=\"0\" aria-label=\"卡片\">",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "div[data-shape=\"card\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "no-focusable-content",
+             "impact": "serious",
+             "message": "Element has focusable descendants",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<button type=\"button\" class=\"shape-favorite-btn\" aria-label=\"Favorite 求和\" title=\"Favorite\" aria-pressed=\"false\">☆</button>",
+                 "target": Array [
+                   "button[aria-label=\"Favorite 求和\"]",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has focusable descendants",
+         "html": "<div class=\"shape-item\" draggable=\"true\" data-shape=\"summing\" data-label=\"Summing\" data-shape-bound=\"true\" role=\"button\" tabindex=\"0\" aria-label=\"求和\">",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "div[data-shape=\"summing\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "no-focusable-content",
+             "impact": "serious",
+             "message": "Element has focusable descendants",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<button type=\"button\" class=\"shape-favorite-btn\" aria-label=\"Favorite Webhook\" title=\"Favorite\" aria-pressed=\"false\">☆</button>",
+                 "target": Array [
+                   "button[aria-label=\"Favorite Webhook\"]",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has focusable descendants",
+         "html": "<div class=\"shape-item\" draggable=\"true\" data-shape=\"webhook\" data-label=\"Webhook\" data-shape-bound=\"true\" role=\"button\" tabindex=\"0\" aria-label=\"Webhook\">",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "div[data-shape=\"webhook\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "no-focusable-content",
+             "impact": "serious",
+             "message": "Element has focusable descendants",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<button type=\"button\" class=\"shape-favorite-btn\" aria-label=\"Favorite 消息队列\" title=\"Favorite\" aria-pressed=\"false\">☆</button>",
+                 "target": Array [
+                   "button[aria-label=\"Favorite 消息队列\"]",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has focusable descendants",
+         "html": "<div class=\"shape-item\" draggable=\"true\" data-shape=\"queue\" data-label=\"消息队列\" data-shape-bound=\"true\" role=\"button\" tabindex=\"0\" aria-label=\"消息队列\">",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "div[data-shape=\"queue\"]",
+         ],
+       },
+     ],
+     "tags": Array [
+       "cat.keyboard",
+       "wcag2a",
+       "wcag412",
+       "TTv5",
+       "TT6.a",
+       "EN-301-549",
+       "EN-9.4.1.2",
+       "RGAAv4",
+       "RGAA-7.1.1",
+     ],
+   },
+ ]
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e3]:
      - img [ref=e4]
      - text: DiagramWeave
    - button "New Project" [ref=e7] [cursor=pointer]:
      - img [ref=e8]
    - button "Select (V)" [ref=e11] [cursor=pointer]:
      - img [ref=e12]
    - button "Connect (L)" [ref=e14] [cursor=pointer]:
      - img [ref=e15]
    - button "Pan canvas (H)" [ref=e19] [cursor=pointer]:
      - img [ref=e20]
    - button "Undo (Ctrl+Z)" [ref=e25] [cursor=pointer]:
      - img [ref=e26]
    - button "Redo (Ctrl+Y)" [ref=e29] [cursor=pointer]:
      - img [ref=e30]
    - button "Table editor (T)" [ref=e33] [cursor=pointer]:
      - img [ref=e34]
    - button "Auto layout" [ref=e38] [cursor=pointer]:
      - img [ref=e39]
    - combobox "Connection routing" [ref=e44] [cursor=pointer]:
      - option "Curved"
      - option "Orthogonal"
      - option "Avoid obstacles"
      - option "Straight"
      - option "Visio-style" [selected]
    - button "Delete selection (Delete)" [ref=e46] [cursor=pointer]:
      - img [ref=e47]
    - button "Clear canvas" [ref=e49] [cursor=pointer]:
      - img [ref=e50]
    - generic "Untitled Project" [ref=e55]
    - button "Presentation mode" [ref=e56] [cursor=pointer]:
      - img [ref=e57]
    - generic [ref=e60]:
      - button "Zoom out" [ref=e61] [cursor=pointer]: −
      - generic [ref=e62]: 100%
      - button "Zoom in" [ref=e63] [cursor=pointer]: +
      - button "Reset zoom 100%" [ref=e64] [cursor=pointer]:
        - img [ref=e65]
    - button "Download PNG / SVG / PDF" [ref=e69] [cursor=pointer]:
      - img [ref=e70]
    - button "Save project (.diagramweave.json)" [ref=e73] [cursor=pointer]:
      - img [ref=e74]
    - button "Load project" [ref=e78] [cursor=pointer]:
      - img [ref=e79]
    - button "Excel template & import" [ref=e82] [cursor=pointer]:
      - img [ref=e83]
    - combobox "Language" [ref=e87] [cursor=pointer]:
      - option "中文"
      - option "EN" [selected]
    - button "Settings & updates" [ref=e88] [cursor=pointer]:
      - img [ref=e89]
  - generic [ref=e92]:
    - button "Page 1" [ref=e94] [cursor=pointer]
    - button "+" [ref=e95] [cursor=pointer]
    - button "⧉" [ref=e96] [cursor=pointer]
  - generic [ref=e97]:
    - generic [ref=e98]:
      - button "Templates" [ref=e99] [cursor=pointer]:
        - img [ref=e100]
        - generic [ref=e105]: Templates
      - generic [ref=e106]: Shapes
      - searchbox "搜索图形" [ref=e108]
      - generic [ref=e109]:
        - button "Basic shapes ▾" [expanded] [ref=e110] [cursor=pointer]
        - generic [ref=e111]:
          - button "流程" [ref=e112]:
            - img [ref=e113]
            - generic [ref=e115]: Process
            - button "Favorite 流程" [ref=e116] [cursor=pointer]: ☆
          - button "子流程" [ref=e117]:
            - img [ref=e118]
            - generic [ref=e120]: Subprocess
            - button "Favorite 子流程" [ref=e121] [cursor=pointer]: ☆
          - button "判断" [ref=e122]:
            - img [ref=e123]
            - generic [ref=e125]: Decision
            - button "Favorite 判断" [ref=e126] [cursor=pointer]: ☆
          - button "开始/结束" [ref=e127]:
            - img [ref=e128]
            - generic [ref=e130]: Start/End
            - button "Favorite 开始/结束" [ref=e131] [cursor=pointer]: ☆
          - button "连接点" [ref=e132]:
            - img [ref=e133]
            - generic [ref=e135]: Connector
            - button "Favorite 连接点" [ref=e136] [cursor=pointer]: ☆
          - button "数据" [ref=e137]:
            - img [ref=e138]
            - generic [ref=e141]: Database
            - button "Favorite 数据" [ref=e142] [cursor=pointer]: ☆
          - button "输入/输出" [ref=e143]:
            - img [ref=e144]
            - generic [ref=e146]: Input/Output
            - button "Favorite 输入/输出" [ref=e147] [cursor=pointer]: ☆
          - button "文档" [ref=e148]:
            - img [ref=e149]
            - generic [ref=e151]: Document
            - button "Favorite 文档" [ref=e152] [cursor=pointer]: ☆
          - button "准备" [ref=e153]:
            - img [ref=e154]
            - generic [ref=e156]: Preparation
            - button "Favorite 准备" [ref=e157] [cursor=pointer]: ☆
          - button "合并" [ref=e158]:
            - img [ref=e159]
            - generic [ref=e161]: Merge
            - button "Favorite 合并" [ref=e162] [cursor=pointer]: ☆
          - button "延迟" [ref=e163]:
            - img [ref=e164]
            - generic [ref=e166]: Delay
            - button "Favorite 延迟" [ref=e167] [cursor=pointer]: ☆
          - button "显示" [ref=e168]:
            - img [ref=e169]
            - generic [ref=e172]: Display
            - button "Favorite 显示" [ref=e173] [cursor=pointer]: ☆
          - button "手动操作" [ref=e174]:
            - img [ref=e175]
            - generic [ref=e177]: Manual
            - button "Favorite 手动操作" [ref=e178] [cursor=pointer]: ☆
          - button "排序" [ref=e179]:
            - img [ref=e180]
            - generic [ref=e182]: Sort
            - button "Favorite 排序" [ref=e183] [cursor=pointer]: ☆
          - button "或" [ref=e184]:
            - img [ref=e185]
            - generic [ref=e187]: Or
            - button "Favorite 或" [ref=e188] [cursor=pointer]: ☆
          - button "存储" [ref=e189]:
            - img [ref=e190]
            - generic [ref=e192]: Storage
            - button "Favorite 存储" [ref=e193] [cursor=pointer]: ☆
          - button "多文档" [ref=e194]:
            - img [ref=e195]
            - generic [ref=e198]: Multi-document
            - button "Favorite 多文档" [ref=e199] [cursor=pointer]: ☆
          - button "内部存储" [ref=e200]:
            - img [ref=e201]
            - generic [ref=e203]: Internal storage
            - button "Favorite 内部存储" [ref=e204] [cursor=pointer]: ☆
          - button "离线存储" [ref=e205]:
            - img [ref=e206]
            - generic [ref=e209]: Offline storage
            - button "Favorite 离线存储" [ref=e210] [cursor=pointer]: ☆
          - button "注释" [ref=e211]:
            - img [ref=e212]
            - generic [ref=e214]: Annotation
            - button "Favorite 注释" [ref=e215] [cursor=pointer]: ☆
      - generic [ref=e216]:
        - button "Extended shapes ▾" [expanded] [ref=e217] [cursor=pointer]
        - generic [ref=e218]:
          - button "云服务" [ref=e219]:
            - img [ref=e220]
            - generic [ref=e222]: Cloud
            - button "Favorite 云服务" [ref=e223] [cursor=pointer]: ☆
          - button "角色" [ref=e224]:
            - img [ref=e225]
            - generic [ref=e228]: Actor
            - button "Favorite 角色" [ref=e229] [cursor=pointer]: ☆
          - button "便签" [ref=e230]:
            - img [ref=e231]
            - generic [ref=e233]: Note
            - button "Favorite 便签" [ref=e234] [cursor=pointer]: ☆
          - button "跨页" [ref=e235]:
            - img [ref=e236]
            - generic [ref=e238]: Off-page
            - button "Favorite 跨页" [ref=e239] [cursor=pointer]: ☆
          - button "子流程框" [ref=e240]:
            - img [ref=e241]
            - generic [ref=e244]: Subprocess frame
            - button "Favorite 子流程框" [ref=e245] [cursor=pointer]: ☆
          - button "交叉" [ref=e246]:
            - img [ref=e247]
            - generic [ref=e248]: Cross
            - button "Favorite 交叉" [ref=e249] [cursor=pointer]: ☆
          - button "开始" [ref=e250]:
            - img [ref=e251]
            - generic [ref=e253]: Start
            - button "Favorite 开始" [ref=e254] [cursor=pointer]: ☆
          - button "结束" [ref=e255]:
            - img [ref=e256]
            - generic [ref=e258]: End
            - button "Favorite 结束" [ref=e259] [cursor=pointer]: ☆
          - button "卡片" [ref=e260]:
            - img [ref=e261]
            - generic [ref=e263]: Card
            - button "Favorite 卡片" [ref=e264] [cursor=pointer]: ☆
          - button "求和" [ref=e265]:
            - img [ref=e266]
            - generic [ref=e268]: Summing
            - button "Favorite 求和" [ref=e269] [cursor=pointer]: ☆
      - generic [ref=e270]:
        - button "Remote icons ▾" [expanded] [ref=e271] [cursor=pointer]
        - generic [ref=e272]:
          - button "Webhook" [ref=e273]:
            - img [ref=e274]
            - generic [ref=e277]: Webhook
            - button "Favorite Webhook" [ref=e278] [cursor=pointer]: ☆
          - button "消息队列" [ref=e279]:
            - img [ref=e280]
            - generic [ref=e283]: 消息队列
            - button "Favorite 消息队列" [ref=e284] [cursor=pointer]: ☆
      - generic [ref=e285]:
        - generic [ref=e286]: Layers
        - generic [ref=e287]:
          - generic [ref=e288] [cursor=pointer]:
            - button "👁" [ref=e289]
            - generic [ref=e290]: Layer 1
            - button "🔓" [ref=e291]
          - button "+ New layer" [ref=e292] [cursor=pointer]
      - generic [ref=e294]:
        - generic [ref=e295]: T Text editor
        - generic [ref=e296]: Double-click Edit label
        - generic [ref=e297]: Delete Delete selection
        - generic [ref=e298]: Ctrl+Z Undo
    - generic [ref=e299]:
      - generic [ref=e300]:
        - heading "开始创建流程" [level=2] [ref=e301]
        - generic [ref=e302]:
          - button "从模板开始" [ref=e303] [cursor=pointer]
          - button "导入文件" [ref=e304] [cursor=pointer]
          - button "空白画布" [ref=e305] [cursor=pointer]
      - generic "画布导航" [ref=e306]:
        - button "适应全部" [ref=e307] [cursor=pointer]: ⌗
        - button "适应选区" [ref=e308] [cursor=pointer]: ▣
        - button "缩放至 100%" [ref=e309] [cursor=pointer]: 100%
        - button "打开节点大纲" [ref=e310] [cursor=pointer]: ☷
        - combobox "对齐所选节点" [ref=e311] [cursor=pointer]:
          - option "对齐" [selected]
          - option "左对齐"
          - option "水平居中"
          - option "右对齐"
          - option "顶部对齐"
          - option "垂直居中"
          - option "底部对齐"
        - combobox "等距分布所选节点" [ref=e312] [cursor=pointer]:
          - option "分布" [selected]
          - option "水平等距"
          - option "垂直等距"
      - generic "画布小地图" [ref=e313]
      - generic [ref=e314]:
        - generic:
          - img
      - generic [ref=e315]:
        - generic [ref=e316]: V Select
        - generic [ref=e317]: L Connect
        - generic [ref=e318]: Click connection to edit
        - generic [ref=e319]: Wheel Zoom
        - generic [ref=e320]: Hold Space to pan canvas
    - generic [ref=e321]:
      - generic [ref=e322]: Properties
      - generic [ref=e324]:
        - generic [ref=e325]: Page info
        - generic [ref=e326]:
          - generic [ref=e327]: Page name
          - textbox "Page name" [ref=e328]: Page 1
        - paragraph [ref=e329]: JSON save / image export uses the current page name as the default filename.
        - generic [ref=e330]:
          - generic [ref=e331]: Scale
          - generic [ref=e332]: 当前页 0 个图形
        - generic [ref=e333]:
          - generic [ref=e334]: Total duration
          - generic [ref=e335]: 0 天
        - generic [ref=e336]:
          - generic [ref=e337]: Critical path
          - generic [ref=e338]: —
        - generic [ref=e339]:
          - generic [ref=e340]: Step count
          - generic [ref=e341]: 0 步
  - generic [ref=e342]:
    - generic [ref=e343]:
      - generic [ref=e344]: 表格编辑
      - paragraph [ref=e345]: 节点表填步骤 · 连线表填「起点编号→终点编号」 · 画布改完点刷新 · 表格改完点应用
      - button "展开说明" [ref=e346] [cursor=pointer]: 说明
      - generic [ref=e347]:
        - button "从画布同步到表格" [ref=e348] [cursor=pointer]:
          - img [ref=e349]
        - button "将表格内容应用到画布" [ref=e352] [cursor=pointer]:
          - img [ref=e353]
        - button "关闭表格编辑" [ref=e355] [cursor=pointer]:
          - img [ref=e356]
    - generic:
      - generic [ref=e359]:
        - generic [ref=e360]:
          - button "编辑各步骤节点" [ref=e361] [cursor=pointer]: 节点表
          - button "编辑节点之间的连线" [ref=e362] [cursor=pointer]: 连线表
        - generic [ref=e363]:
          - button "在表格末尾添加一行空节点" [ref=e364] [cursor=pointer]: + 节点
          - button "先点击行选中（高亮），再删除" [ref=e365] [cursor=pointer]: 删节点
      - generic "流程数据表":
        - table [ref=e366]:
          - rowgroup [ref=e367]:
            - row "编号 简介 去向 角色 图形 详细说明 耗时天 泳道 图层 目标页" [ref=e368] [cursor=pointer]:
              - columnheader "编号" [ref=e369]
              - columnheader "简介" [ref=e370]
              - columnheader "去向" [ref=e371]
              - columnheader "角色" [ref=e372]
              - columnheader "图形" [ref=e373]
              - columnheader "详细说明" [ref=e374]
              - columnheader "耗时天" [ref=e375]
              - columnheader "泳道" [ref=e376]
              - columnheader "图层" [ref=e377]
              - columnheader "目标页" [ref=e378]
          - rowgroup
    - generic [ref=e379]:
      - strong [ref=e380]: 怎么用：
      - text: ① 顶部工具栏点「表格」图标打开本面板。 ②
      - strong [ref=e381]: 节点表
      - text: ：每行一个步骤（编号唯一），「去向」列只读，由连线自动算出。 ③
      - strong [ref=e382]: 连线表
      - text: ：每行一条箭头，填起点编号、终点编号、条件（如「是/否」）；也可在画布用连线工具拖拽。 ④ 在画布改形状/连线 → 点
      - strong [ref=e383]: ↺ 刷新
      - text: ；在表格改内容 → 点
      - strong [ref=e384]: ✓ 应用
      - text: （会重新布局）。 ⑤ 删除：先
      - strong [ref=e385]: 点击表格行
      - text: 使其高亮，再点「删节点/删连线」。
  - tooltip
```

# Test source

```ts
  1  | import AxeBuilder from '@axe-core/playwright';
  2  | import { expect, test } from '@playwright/test';
  3  | 
  4  | async function prepare(page, { suppressInitialPrompt = true } = {}) {
  5  |   await page.addInitScript(({ suppress }) => {
  6  |     window.__dwSkipRemoteBootstrap = true;
  7  |     if (suppress) window.sessionStorage.setItem('dw-initial-save-prompted', '1');
  8  |   }, { suppress: suppressInitialPrompt });
  9  |   await page.goto('/flowchart-editor.html');
  10 |   await page.waitForFunction(() => window.__dwEditorReady === true, null, { timeout: 90000 });
  11 | }
  12 | 
  13 | async function expectVisual(page, name) {
  14 |   await expect(page).toHaveScreenshot(name, {
  15 |     animations: 'disabled',
  16 |     caret: 'hide',
  17 |     fullPage: true,
  18 |     maxDiffPixelRatio: 0.01,
  19 |   });
  20 | }
  21 | 
  22 | test.describe('P0 visual and accessibility gate', () => {
  23 |   test('canonical theme tokens are parsed by the browser', async ({ page }) => {
  24 |     await prepare(page);
  25 |     const tokens = await page.evaluate(() => {
  26 |       const styles = getComputedStyle(document.documentElement);
  27 |       return ['--bg-base', '--text-primary', '--accent', '--radius-sm', '--shadow-md']
  28 |         .map(name => [name, styles.getPropertyValue(name).trim()]);
  29 |     });
  30 |     for (const [name, value] of tokens) {
  31 |       expect(value, `${name} must be available`).not.toBe('');
  32 |     }
  33 |   });
  34 | 
  35 |   test('initial entry and blank canvas visual baselines', async ({ page }) => {
  36 |     await prepare(page, { suppressInitialPrompt: false });
  37 |     await expect(page.locator('#confirmOverlay')).not.toHaveClass(/visible/);
  38 |     await expect(page.locator('#canvasEmptyState')).toBeVisible();
  39 |     await expectVisual(page, 'desktop-initial-entry.png');
  40 |     await page.evaluate(() => dismissCanvasEmptyState());
  41 |     await expectVisual(page, 'desktop-blank-canvas.png');
  42 |   });
  43 | 
  44 |   test('template, applied template, selected node, and export baselines', async ({ page }) => {
  45 |     await prepare(page);
  46 |     await page.evaluate(() => showTemplateDialog());
  47 |     await expect(page.locator('.template-dialog-item')).toHaveCount(7);
  48 |     await expectVisual(page, 'desktop-template-center.png');
  49 | 
  50 |     await page.locator('.template-dialog-item').first().click();
  51 |     await expect(page.locator('.node').first()).toBeVisible();
  52 |     await expectVisual(page, 'desktop-template-applied.png');
  53 | 
  54 |     await page.locator('.node').first().click();
  55 |     await expectVisual(page, 'desktop-node-selected.png');
  56 | 
  57 |     await page.evaluate(() => showExportDialog());
  58 |     await expectVisual(page, 'desktop-export-dialog.png');
  59 |   });
  60 | 
  61 |   test('phone and tablet visual baselines', async ({ page }) => {
  62 |     await page.setViewportSize({ width: 390, height: 844 });
  63 |     await prepare(page);
  64 |     await expectVisual(page, 'phone-390x844.png');
  65 | 
  66 |     await page.setViewportSize({ width: 768, height: 1024 });
  67 |     await expectVisual(page, 'tablet-768x1024.png');
  68 |   });
  69 | 
  70 |   test('has no serious or critical automated accessibility violations', async ({ page }) => {
  71 |     await prepare(page);
  72 |     const results = await new AxeBuilder({ page }).analyze();
  73 |     const blocking = results.violations.filter(v => ['serious', 'critical'].includes(v.impact));
> 74 |     expect(blocking).toEqual([]);
     |                      ^ Error: expect(received).toEqual(expected) // deep equality
  75 |   });
  76 | 
  77 |   test('template node labels maintain readable contrast', async ({ page }) => {
  78 |     await prepare(page);
  79 |     await page.evaluate(() => showTemplateDialog());
  80 |     await page.locator('.template-dialog-item').first().click();
  81 |     const ratios = await page.locator('.node').evaluateAll(nodes => nodes.map(node => {
  82 |       const shape = node.querySelector('.node-shape');
  83 |       const label = node.querySelector('.node-label');
  84 |       const parse = value => value.match(/[\d.]+/g).slice(0, 3).map(Number);
  85 |       const luminance = rgb => rgb.map(v => {
  86 |         const s = v / 255;
  87 |         return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  88 |       }).reduce((sum, v, index) => sum + v * [0.2126, 0.7152, 0.0722][index], 0);
  89 |       const a = luminance(parse(getComputedStyle(shape).backgroundColor));
  90 |       const b = luminance(parse(getComputedStyle(label).color));
  91 |       return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  92 |     }));
  93 |     expect(Math.min(...ratios)).toBeGreaterThanOrEqual(4.5);
  94 |   });
  95 | });
  96 | 
```