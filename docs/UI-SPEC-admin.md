# Chefs Help Chefs MVP：管理端 UI 视觉规范

**状态：** 基于已确认 PRD、UX-SPEC、玩家端 UI-SPEC 与管理端 Figma 整理  
**日期：** 2026-09-10  
**范围：** 管理员登录、管理后台布局、上海标准关卡、食物分类、食物升级目录、纪念品及管理端共用组件。  
**不含范围：** 玩家端页面、组件、Token，以及任何管理端以外的功能或技术实现。

## 1. 依据、优先级与读取说明

本文件仅定义管理端视觉，不改变既有产品逻辑。发生冲突时，按以下优先级处理：

1. `docs/PRD.md`：产品范围、数据字段、业务限制与访问规则。
2. `docs/UX-SPEC.md`：页面流程、交互、数据状态与文案规则。
3. `docs/UI-SPEC-users.md`：仅作为文档格式、严谨度和“待确认”标记方式的参照；**不复用其玩家端视觉 Token**。
4. 管理端 Figma [Untitled](https://www.figma.com/design/94Id7gEtHbdLO3ko3m8xm1/Untitled?node-id=0-1)：管理端最终视觉、桌面布局、组件尺寸和已出现状态。

已直接读取 Figma 图层、填充、描边、字体、自动布局、阴影、模糊与画板尺寸，而非按截图猜测。文件包含 `1470 × 692` 的登录、列表、导入与删除画板，以及 `1101 × 643` 的 Drawer 画板；标准关卡列表另有 `1470 × 1080` 长表格画板。

Figma 没有覆盖所有状态和所有断点。凡不能由当前图层可靠读取的视觉值，均标注为**待确认**。这些标记不改变 PRD 或 UX-SPEC 已确认的交互、字段和反馈要求。

## 2. 管理端整体视觉语言

管理端是桌面优先的轻量数据维护界面：浅灰页面画布、白色导航与内容容器、深色文本和高密度但可读的表格。视觉重点是稳定导航、搜索、录入与错误定位，而不是玩家端的航空氛围、渐变或毛玻璃。

- 页面使用平面 `#F7F8FA` 画布、白色表格 Card、细灰边界和克制的蓝色主操作。
- 左侧导航固定、顶部 Header 简洁，列表工具栏将搜索与操作分居两端。
- 模态弹窗和右侧 Drawer 是唯一使用背景暗化与 Background Blur 的管理端层级；普通 Card、表格与输入框不使用玻璃化效果。
- 关键数字、字段、状态和操作必须有文字标签；颜色、图标或位置不能是唯一信息载体。
- 管理端不自动继承玩家端的渐变、毛玻璃、圆角、字体比例或 mobile-first Token。

## 3. 管理端 Design Tokens

### 3.1 Colors

| Token | Figma 值 | 用途 |
| --- | --- | --- |
| `admin/color/canvas` | `#F7F8FA` | 主内容页背景 |
| `admin/color/surface/base` | `#FFFFFF` | Sidebar、Header、Table、Drawer、Modal |
| `admin/color/surface/subtle` | `#F9FAFB` | 表头、斑马行与低强调容器；Figma 出现 30% / 40% 透明变体 |
| `admin/color/surface/selected` | `#F3F4F6` | Sidebar 当前项、轻标签 |
| `admin/color/text/strong` | `#101828` | 页面标题、主导航、强强调文本 |
| `admin/color/text/number` | `#1E2939` | 数值、分页当前页 |
| `admin/color/text/default` | `#364153` | 表头、字段标签 |
| `admin/color/text/secondary` | `#4A5565` | 次级操作与辅助正文 |
| `admin/color/text/muted` | `#6A7282` | 普通表格正文、说明 |
| `admin/color/text/faint` | `#99A1AF` | Placeholder、低强调信息 |
| `admin/color/primary` | `#155DFC` | 新增、保存等蓝色主操作 |
| `admin/color/login/primary` | `#1A1A1A` | 登录按钮与登录品牌标识；仅登录页 |
| `admin/color/danger` | `#FB2C36` | 删除操作与危险强调 |
| `admin/color/danger/strong` | `#E7000B` | 删除确认操作的已出现深红文字 / 图标层 |
| `admin/color/danger/soft` | `#FFE2E2` | 删除确认图标底 |
| `admin/color/success` | `#00A63E` | 文件校验通过图标 / 确认导入操作 |
| `admin/color/success/strong` | `#008236` | 成功状态文字 |
| `admin/color/success/soft` | `#F0FDF4` | 文件校验通过提示背景 |
| `admin/color/warning` | `#BB4D00` | 导入说明文字 |
| `admin/color/warning/icon` | `#FDC700` | 导入提示图标 |
| `admin/color/warning/soft` | `#FFFBEB` | 导入说明底 |
| `admin/color/line/default` | `#E5E7EB` | Card、Header、表格主要分界线 |
| `admin/color/line/subtle` | `#F3F4F6` | 表格行分隔线 |
| `admin/color/line/control` | `#D1D5DC` | Search / Input / Select 边框 |
| `admin/color/line/login` | `#CDD2D9` | 登录页输入边框 |
| `admin/color/scrim` | `#101828` at 40%（Modal）/ 30%（Drawer） | 覆层背景 |

Figma 中可见紫色标签色 `#F3E8FF` / `#9810FA`，但未足以确定其分类语义、完整色阶或复用范围，故为**待确认**；不得据此扩展为全局分类色板。

### 3.2 Gradients

普通管理端页面、控件与覆层没有可复用的渐变 Token。登录页背景可见极低对比的线性网格效果，但当前文件未提供可作为正式 Token 的完整视觉规则；其是否保留、线宽、间距和绘制方式均为**待确认**。

管理端不得使用玩家端的天空渐变、径向光晕、半透明玻璃渐变或底部渐变栏。

### 3.3 Typography

主字体为 **Inter**；数值和部分等级标识使用 **Menlo**。Figma 已出现样式如下。

| Token | Font | Size / line-height | Letter spacing | 用途 |
| --- | --- | --- | --- | --- |
| `admin/type/page-title` | Inter Semi Bold | 20 / 28 | 默认 | 列表页标题 |
| `admin/type/dialog-title` | Inter Semi Bold | 16 / 24 | 默认 | Drawer、Modal 标题 |
| `admin/type/login-brand` | Inter Semi Bold | 18 / 28 | -0.45 | 登录品牌名称 |
| `admin/type/body` | Inter Regular | 14 / 20 | 默认 | 正文、表格内容、字段值 |
| `admin/type/body-medium` | Inter Medium | 14 / 20 | 默认 | 导航项、标签、按钮 |
| `admin/type/caption` | Inter Medium | 12 / 16 | 默认 | 辅助说明、帮助信息 |
| `admin/type/table-header` | Inter Semi Bold | 12 / 16 | +0.6 | 表头 / 小型强调标签 |
| `admin/type/numeric` | Menlo Semi Bold | 14 / 20 | 默认 | 表格内数值 |
| `admin/type/level-tag` | Menlo Semi Bold | 12 / 16 | 默认 | 关卡标识 |
| `admin/type/metric` | Menlo Bold | 24 / 32 | 默认 | 导入校验统计数值 |

未在 Figma 中明确出现的字体回退、中文字体优先级、输入错误文字、空状态、加载状态与响应式字级均为**待确认**。

### 3.4 Spacing

Figma 反复出现的管理端间距为 `4 / 6 / 8 / 10 / 12 / 16 / 20 / 24 / 32px`。不得为迁就其他端的 Token 改写已给出尺寸。

| 用途 | Figma 值 |
| --- | --- |
| Sidebar 品牌区 | 顶部 / 水平 `20`，底部 `16` |
| Sidebar 导航区 | 水平 `12`，标题内缩 `8`，导航项纵向 `10` |
| Main Header 水平内边距 | `24` |
| 主内容页内边距 | `24` |
| 标题与描述 / 工具栏间距 | `20` |
| 输入与按钮内容水平内边距 | `12`（部分控件为 `14`，由组件定义） |
| Table footer 内边距 | `12 × 16` |
| Modal / Drawer 内部正文基准 | `24` |
| Pagination 项间距 | `4` |

### 3.5 Radius, border, shadow, opacity, blur

| 类别 | Token / Figma 值 |
| --- | --- |
| Radius / control | `8px`：Input、Search、Button、Pagination |
| Radius / tag | `6px` |
| Radius / Card、Modal | `12px`：Table 外层、导入 Modal、删除确认 |
| Radius / 登录 Card | `16px` |
| Radius / pill、圆形图标 | Figma 使用最大圆角；具体实现 Token 为**待确认** |
| Border / content | `1px #E5E7EB`：Card、Header、常规边界 |
| Border / control | `1px #D1D5DC`；登录输入为 `1px #CDD2D9` |
| Border / row | `1px #F3F4F6` |
| Shadow / overlay panel | `0 8px 10px -6px rgba(0,0,0,.10)` + `0 20px 25px -5px rgba(0,0,0,.10)` |
| Shadow / 登录 Card | Figma 约为 `0 1px 2px -1px rgba(0,0,0,.10)` + `0 1px 3px rgba(0,0,0,.10)` |
| Overlay / Modal | `#101828` at 40% + Background Blur `16px` |
| Overlay / Drawer | `#101828` at 30% + Background Blur `16px` |

除 Modal / Drawer 覆层外，不得为常规管理端内容增加 Background Blur。hover、focus-visible、pressed、disabled（Pagination 已出现的上一页 disabled 除外）、error、empty、loading 的透明度和阴影均为**待确认**。

## 4. 页面基础尺寸与 desktop-first 规则

- **基准画板：** 常规管理页为 `1470 × 692px`；标准关卡长表格展示为 `1470 × 1080px`；Drawer 画板为 `1101 × 643px`。
- **Desktop-first：** Figma 已明确展示固定 `240px` Sidebar、`56px` Header、其余主内容区，以及右侧 `384px` Drawer。
- **主内容：** 1470px 画板中 Sidebar 后主区为 `1230px`；页面内容左右内边距为 `24px`，常规表格可用宽约 `1180px`。
- **滚动：** 列表页纵向滚动由主内容承载；表格在小宽度的水平滚动、固定列、列隐藏和最小列宽均为**待确认**。
- **移动端：** 管理端不是 mobile-first 视觉。窄屏下的结构性降级遵循 UX-SPEC，第 23 节仅规定已确认方向；具体断点和尺寸不可从现有桌面图臆造。

## 5. 管理员登录页

### 5.1 结构与视觉

- 画板为 `1470 × 692px`，背景 `#F7F8FA`；中央登录 Card 为 `384px` 宽，白底、`16px` radius、`1px #E5E7EB` 边框及登录 Card 阴影。
- Card 约在页面垂直中部，内容内边距 `32px`。顶部为 `32 × 32px` 深色圆角品牌图标、品牌名和浅灰 `ADMIN` 标签。
- 标签高度 `24px`、`#F3F4F6` 背景、最大圆角；文字为 12px Medium、约 `+0.6px` 字距。
- 表单距品牌区 `32px`；字段标签在控件上方，登录口令 Input 为约 `318 × 42px`、`8px` radius；主按钮约 `318 × 40px`、`8px` radius、`#1A1A1A` 白字。
- 底部帮助说明与按钮间距约 `20px`，采用低强调 caption。

### 5.2 行为与状态

- 访问控制、共享口令来源和成功后默认进入上海标准关卡完全遵循 PRD / UX-SPEC；后台不显示账号体系、改密、找回或权限入口。
- Figma 中的示例口令属于原型展示，不得写入成品 UI、文档示例或帮助文案；部署配置提供的共享口令不在界面中暴露。
- 登录失败、输入 focus、提交 loading、禁用、错误提示和登出后的反馈视觉均为**待确认**；但 UX-SPEC 所要求的明确文字反馈不可省略。

## 6. Admin Layout

- Layout 由固定左侧 Sidebar、顶部 Header、`#F7F8FA` 主内容画布和页面主体构成；不设置仪表盘。
- 列表模块页均沿用“标题 / 描述 → 搜索与操作 → Table”的信息层级。导入结果页仅属于当前模块流程，不是 Sidebar 项。
- Figma 标准列表页面的 Table 外层为白底、`12px` radius；在 1470px 基准画板中占约 `1180px` 宽。
- 页面切换、Sidebar 收缩动效、全局 toast 容器和 Header 附加操作均为**待确认**。

## 7. Sidebar

- 固定宽 `240px`、白底，右侧使用 `#E5E7EB` 的细分界线。
- 品牌区含深色图标、`Chefs Help Chefs` 名称及 `ADMIN` 标签；其上下间距遵循第 3.4 节。
- 导航标题为“数据管理”类低强调分组标题；四个固定模块依序为：上海标准关卡、食物分类、食物升级目录、纪念品。
- 导航项为约 `40px` 高的图标 + 文字行，左右内容间距约 `12px`；当前项使用 `#F3F4F6` 背景，并出现右侧小灰点标记。
- 底部以分隔线隔开“退出管理端”操作。
- 图标的精确 SVG、线宽、当前项灰点尺寸、hover / focus / 键盘态和 Sidebar 收缩状态均为**待确认**。

## 8. Header

- 固定视觉高 `56px`、白底，左右内边距 `24px`，下方 `1px #E5E7EB` 分隔线。
- 左侧为层级路径，例如“管理后台 > 标准关卡”；文字使用管理端正文层级，当前页比上级更强强调。
- Figma 未出现右侧用户信息、头像、通知、全局搜索或页面级帮助入口；不得自行补充。
- Header 固定 / 滚动行为、窄屏菜单按钮、面包屑截断和 hover / focus 样式均为**待确认**。

## 9. 上海标准关卡

### 9.1 页面

- 页面标题为“标准关卡”层级，标题下放置简短说明；标题使用 `admin/type/page-title`。
- 搜索框位于工具栏左侧，导入、导出、新增操作在右侧；搜索框约 `320 × 38px`。
- Table 字段遵循 PRD：机场、关卡类型、关卡编号、三星目标收入、操作。机场为上海、类型为标准关卡、编号范围与目标收入校验不因视觉格式改变。
- Figma 的列表样例可将关卡显示为短标签，但 `Lv.N`、`第 N 关` 或纯整数的最终展示格式与原始数值映射为**待确认**；不得改变 PRD 的 1–50 整数语义。
- 新增和单条编辑使用右侧 Drawer；删除使用独立确认 Modal；导入 / 导出仅支持 UX-SPEC 已定义的 CSV/XLSX 流程。

### 9.2 状态

- 搜索、分页、骨架、初始空列表、无匹配、保存失败、删除失败与导入失败的业务行为遵循 UX-SPEC。
- 除常规数据列表与 Pagination 上一页 disabled 外，以上状态均未有完整 Figma 视觉，具体样式为**待确认**。

## 10. 食物分类

- 使用与标准关卡相同的 Admin Layout、标题 / 描述、Search、右侧新增与 Table 结构。
- Table 以分类名称和操作为核心；新增 / 编辑使用 Drawer，删除使用确认 Modal。
- 若分类仍被食物升级项引用，删除必须按 UX-SPEC 阻止，并呈现已确认文案：“该分类仍被食物升级项引用，请先迁移或删除关联升级项”。
- 分类标签色、空态、引用阻止反馈、搜索无结果和保存错误的精确视觉均为**待确认**。

## 11. 食物升级目录

- 页面标题、Search、导入 / 导出 / 新增工具栏与标准关卡布局一致，Table 在基准画板约 `1180px` 宽。
- Figma 样例 Table 列从左至右为编号（约 `40px`）、名称（约 `900px`）、分类（约 `144px`）、操作（约 `96px`）；这些仅适用于当前桌面画板，不可在窄屏强制保持同宽。
- 新增 / 编辑使用 `384px` 右侧 Drawer，表单包含名称与既有分类 Select；Table 的编辑、删除操作以图标承载，但必须提供可识别的文字名称或无障碍名称。
- 目录上限 10 项、名称唯一、分类必填且必须已存在、导入第 11 项原子失败均按 PRD / UX-SPEC；新增不可用时的文案、样式和 tooltip 均为**待确认**。
- Figma 出现过分类彩色标签，但完整标签系统未定义，具体分类色映射为**待确认**。

## 12. 纪念品配置

- 纪念品页沿用同一 Layout、Search、标题与 Table Card；Figma 显示表格与单条编辑入口。
- 页面只管理固定两条记录。Table / Drawer 字段遵循 PRD：名称、单个收入增量、每包数量（固定 5、只读）、每包钻石价格。
- 仅允许编辑；不得出现新增、删除、导入或导出操作，也不得用视觉入口暗示这些能力。
- 只读“每包数量”控件在 Figma 中有低强调表面；其精确填充、文字色与只读图标为**待确认**。

## 13. Table

| 属性 | Figma 已读参数 |
| --- | --- |
| 外层 | 白底、`12px` radius；标准画板约 `1180px` 宽 |
| 表头 | 约 `40.5px` 高，`#F9FAFB` 低强调表面，`admin/type/table-header` |
| 数据行 | 约 `51px` 高，使用 `#F3F4F6` 分隔线；Figma 出现 `#F9FAFB` 30% / 40% 斑马变体 |
| Footer | 约 `55px` 高，`12px 16px` 内边距，含总数 / Pagination |
| 标准关卡列 | 机场 `96px`、类型 `112px`、关卡 `96px`、目标约 `780px`、操作 `96px`（1470px 样例） |
| 操作列 | 图标按钮承载编辑、删除；删除仅用于允许删除的模块 |

- 表格不能用颜色区分唯一语义；列名与行值必须可读。
- 排序、筛选、列拖拽、列显隐、固定表头、行 hover、行选中、批量选择、横向滚动样式与空 / 骨架 / error 表格视觉均为**待确认**，除非 UX-SPEC 已明确要求其行为。

## 14. Search、Input 与 Select

### 14.1 Search

- 列表搜索框基准约 `320 × 38px`、白底、`8px` radius、`1px #D1D5DC` 边框，左侧搜索图标、14px 正文 Placeholder。
- 各模块的搜索字段和实时 / 提交行为遵循 UX-SPEC；清除按钮、输入 loading、无匹配强调和 focus 态为**待确认**。

### 14.2 Input

- 常规管理表单 Input 高约 `38px`，`8px` radius、`1px #D1D5DC` 边框、白底；Drawer 内可用宽约 `344px`。
- 登录口令 Input 是独立的 `42px` 高规格，遵循第 5 节，不得据此扩展到后台其他表单。
- 标签为 14px Medium，必填星号为危险色；placeholder 用低强调文本色。
- hover、focus、disabled、readonly、错误边框、成功边框、字段内图标、数字步进器与错误文字的精确视觉均为**待确认**。字段校验和错误位置仍按 UX-SPEC。

### 14.3 Select

- Select 与常规 Input 共享 `38px` 高、`8px` radius、边框和 Drawer 可用宽度；右端使用下拉指示图标。
- 仅显示已有食物分类；不可用、无选项、展开菜单、键盘导航、option hover / selected / disabled 与错误态视觉均为**待确认**。

## 15. Button

| 类型 | Figma 已出现视觉 | 典型用途 |
| --- | --- | --- |
| 登录主按钮 | `318 × 40px`、`8px` radius、`#1A1A1A`、白字 | 管理员登录 |
| 后台主按钮 | 约 `38px` 高、`8px` radius、`#155DFC`、白字 | 新增、保存、导入 / 导出主操作 |
| 次按钮 | 约 `36px` 高、`8px` radius、浅灰底或细边界、深灰字 | 取消、返回列表 |
| 危险按钮 | 约 `36px` 高、`8px` radius、`#FB2C36`、白字 | 确认删除 |
| 成功按钮 | `8px` radius、绿色底 | Figma 的“确认导入”视觉参照，见第 21 节 |
| 图标按钮 | 无大面积填充、与表格行对齐 | 编辑、删除、关闭 |

除 Pagination 上一页 disabled 外，Button 的 hover、pressed、focus-visible、disabled、loading、权限拒绝和错误重试样式均为**待确认**。所有图标按钮必须有可读名称，不能只依赖图标。

## 16. Pagination

- Table Footer 右侧使用紧凑 Pagination：单项约 `28 × 28px`、`8px` radius、相邻间距 `4px`。
- 当前页为深色 `#1E2939` 填充、白字；未选页为白底 / 深色文字。
- Figma 明确出现上一页不可用态，使用约 30% opacity；该状态只适用于已无上一页的 Pagination 控件。
- 页码截断、省略号、每页条数、首尾页、加载中、错误、键盘焦点和其他 disabled 样式均为**待确认**。

## 17. Drawer

- Drawer 从右侧覆盖内容区，Figma 基准宽 `384px`，高度与视口相同；白底、无圆角、使用 overlay panel shadow。
- 背景覆层为 `#101828` at 30% 并使用 `16px` Background Blur；背景可见但不可操作。
- Header 高约 `61px`，含 16px 标题与右侧关闭图标；正文以 `24px` 基准内边距组织。
- 表单控件可用宽约 `344px`、高约 `38px`。底部行动区由分隔线隔开，包含取消与保存，按钮约 `60 × 36px`；按钮间距与对齐方式遵循当前画板。
- 单条新增 / 编辑在 Drawer 完成；提交成功、失败后是否关闭或保留输入严格按 UX-SPEC。
- 自动保存、未保存离开确认、内部滚动、全屏窄屏 Drawer、打开 / 关闭动效、focus trap 与关闭按钮 hover 均为**待确认**。

## 18. Modal

- 通用 Modal 覆层为 `#101828` at 40% + `16px` Background Blur；白色前景容器、`12px` radius，并使用 overlay panel shadow。
- 导入 Modal 为 `672 × 442px`：Header `75px`、正文 `298px`、Footer `69px`。
- Figma 的文件校验通过状态容器为 `672 × 380px`；删除确认容器为 `384 × 172px`。
- Modal 必须阻断背景交互；关闭、取消与确认的业务后果按 UX-SPEC。
- Esc 关闭、点击遮罩关闭、焦点管理、窄屏全屏化、动画、错误状态和 Modal stacking 均为**待确认**。

## 19. Import Dropzone

- 导入 Modal 标题为“导入 [当前模块]”，标题下给出 CSV / XLSX 范围说明和关闭图标。
- Dropzone 位于正文上方，约 `624 × 160px`，白底、虚线边框、居中云上传图标；主文案为“点击选择文件或拖拽至此处”，辅助文字说明支持 `.csv`、`.xlsx`。
- 下方使用 `#FFFBEB` 警示说明块与琥珀色图标 / 文本，说明导入要求；其完整文案由 UX-SPEC / PRD 的字段规则确定。
- Footer 有“返回列表”次按钮；关闭和返回均不写入数据。
- Drag-over、文件选择中、格式不支持、文件过大、解析中、重复文件、键盘上传、上传进度与错误行预览样式均为**待确认**。

## 20. 删除确认

- 删除确认 Modal 为 `384 × 172px`、白底、`12px` radius、居中展示。
- 左侧危险提示圆形图标底为 `#FFE2E2`，图标 / 强调使用危险色；右侧含明确的删除对象标题与不可逆说明。
- 底部使用取消次按钮与红色“确认删除”按钮；仅出现在标准关卡、食物分类、食物升级目录等允许删除的对象上，纪念品没有此入口。
- 标题必须带入待删除对象可识别名称；对分类引用阻止的业务提示遵循第 10 节，不能误呈现为可继续确认的删除。
- 二次提交 loading、删除失败、删除成功反馈、焦点态与按钮 disabled 视觉均为**待确认**。

## 21. 导入流程与状态

### 21.1 已确认流程（PRD / UX-SPEC）

1. 仅上海标准关卡与食物升级目录提供 CSV/XLSX 导入。
2. 选择文件后先校验；任一行 / 字段出错时，不写入任何数据，进入独立导入结果页，逐行列出行号、字段和原因。
3. 全部合法时原子导入 / upsert，并返回原模块列表；未出现在文件中的既有数据不删除。
4. 不提供导入历史、模板下载、回滚或额外的业务确认步骤。

### 21.2 Figma 已出现视觉与处理原则

- Figma 展示了绿色“文件校验通过”提示、`新增 / 更新 / 总计处理`三个统计卡，以及绿色“确认导入”按钮；提示卡为成功软底，统计数值采用 `admin/type/metric`。
- 此画面可作为**校验成功状态的视觉参考**，但其“确认导入”动作与 UX-SPEC 的“合法后直接原子导入并返回列表”存在流程差异。
- 依资料优先级，不得把该按钮实现为新增的产品确认步骤；该状态在 MVP 中如何映射为自动导入中的反馈，及“准备导入”文案是否保留，均为**待确认**。
- Figma 未展示导入错误结果页、解析中和写入失败页；这些视觉均为**待确认**，但错误页必须完整保留 UX-SPEC 要求的行号、字段、原因和“未写入任何数据”的文本事实。

## 22. Status / Feedback

- Figma 已出现的状态色仅包括：导入校验通过（绿色软底 + 文字 + 图标）、导入说明（琥珀软底 + 文字 + 图标）、删除危险提示（红色图标底 + 明确不可逆文案）、Pagination 上一页 disabled（30% opacity）。
- 登录失败、保存成功 / 失败、删除成功 / 失败、分类引用阻止、目录上限、首屏空列表、搜索无匹配、Skeleton、网络失败、解析中、导入错误结果页与全局提示的**视觉规范均为待确认**。
- 无论视觉待确认与否，状态反馈须遵循 UX-SPEC：使用明确文字，保留失败时当前输入或上下文，并提供必要的重试 / 返回操作；不得仅用红绿颜色或图标表达。

## 23. Responsive Rules

- **桌面（Figma 已展示）：** 固定 `240px` Sidebar、`56px` Header、主内容 Table 与右侧 `384px` Drawer；导入 Modal 居中 `672px` 宽。
- **中等宽度：** UX-SPEC 要求 Sidebar 可收缩为图标或按需展开；Figma 未给出收缩后的图标、宽度、Header 变化或断点，均为**待确认**。
- **窄屏：** UX-SPEC 要求导航改为菜单入口、列表转为带字段标签的纵向卡片、Drawer 全屏；具体触发断点、卡片排版、操作收纳、Modal 宽度、字体和间距均为**待确认**。
- **导入错误表：** 窄屏必须允许受控横向滚动以保留行号、字段与原因；滚动条、最小宽度和固定列样式为**待确认**。
- 响应式不能把玩家端移动卡片、渐变或毛玻璃直接移植到管理端。

## 24. UI 验收标准

### 24.1 范围与资料优先级

- [ ] 只覆盖管理员登录和四个固定管理模块；没有仪表盘、账号体系、改密、审计、玩家端页面或管理端以外的功能。
- [ ] PRD 的字段与业务限制、UX-SPEC 的流程与状态优先于 Figma 原型中的冲突展示。
- [ ] 未修改 `docs/UI-SPEC-users.md`，且没有把其渐变、Glass Card 或移动 Token 套用到管理端。

### 24.2 基础视觉与组件

- [ ] 1470px 基准桌面呈现 `240px` 白色 Sidebar、`56px` Header、`#F7F8FA` 内容画布与约 `1180px` 宽的白色 Table Card。
- [ ] 管理端独立使用 Inter / Menlo、平面表面、`8px` 控件圆角、`12px` Card / Modal 圆角和已列颜色、边框、阴影 Token。
- [ ] Search、Input、Select、Button、Pagination、Table、Drawer、Modal、Dropzone 与删除确认符合已列的 Figma 参数；所有图标操作有文字化可识别名称。
- [ ] 常规内容没有玩家端渐变或毛玻璃；仅 Drawer / Modal 覆层使用 `16px` Background Blur 和对应 30% / 40% scrim。

### 24.3 页面、业务与状态

- [ ] 登录成功直接进入上海标准关卡；共享口令不在界面或帮助文案中泄露，后台不出现账户管理功能。
- [ ] 标准关卡、食物分类、食物升级目录、纪念品分别遵循 PRD / UX-SPEC 的字段、操作权限和限制；纪念品仅可编辑固定两条记录。
- [ ] 分类被引用时阻止删除并显示既定文字；食物目录最多 10 项；关卡和食物目录导入具有原子性。
- [ ] 导入错误不写入数据且展示行号、字段、原因；有效导入不额外增加 Figma 原型中的人工确认步骤，除非该流程差异得到重新确认。
- [ ] Loading、empty、error、focus、hover、disabled、success 等未由 Figma 明确呈现的视觉，不得自行编造；在设计补充前保持“待确认”，但 UX-SPEC 所要求的文字反馈与状态行为必须完整。

### 24.4 待确认项闭环

- [ ] 开始实现前补充：登录失败与加载、所有控件交互态、空 / 骨架 / 错误表格、导入错误结果页、目录上限反馈、分类引用阻止反馈、Drawer / Modal 焦点与动效、Sidebar 收缩、窄屏卡片表格和所有响应式断点。
- [ ] 明确 Figma“文件校验通过 / 确认导入”画面与 UX-SPEC 直接原子导入流程之间的最终视觉映射。
