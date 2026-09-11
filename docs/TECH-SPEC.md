# Chefs Help Chefs MVP — TECH-SPEC

**状态：** 已确认的 Architectural 技术设计  
**日期：** 2026-09-10  
**范围：** 纽约机场、标准关卡 1–50、匿名玩家计算器与共享口令管理后台。
**不含：** 业务代码、实施计划、玩家账户、多机场后台管理及任何 PRD 明确排除的功能。

## 1. 文档目标与范围

本文件把已确认的产品、交互和视觉规格转化为可真实部署的 MVP 技术架构。目标是让一位个人开发者能够用少量服务维护以下闭环：

```text
管理员维护可信标准数据
        ↓
PostgreSQL 持久化并校验数据
        ↓
玩家端读取最新纽约标准数据
        ↓
玩家输入一次性状态与资源条件
        ↓
独立计算引擎返回唯一最优三星方案
```

本 TECH-SPEC 的上游依据为 `docs/PRD.md`、`docs/UX-SPEC.md`、`docs/UI-SPEC-users.md` 和 `docs/UI-SPEC-admin.md`。此前被引用但不存在的设计说明文件由这四份已确认规格替代。

当资料冲突时，遵循：PRD 的业务规则优先于 UX-SPEC；UX-SPEC 的流程优先于 UI-SPEC 或 Figma 原型中不一致的展示；UI-SPEC 决定视觉落地。不得以技术便利修改任一已确认逻辑。

## 2. 设计原则

- **模块化单体。** 一个 Next.js 项目同时承载玩家端、管理端、服务端逻辑和计算调用；不拆分微服务。
- **标准数据为服务端真相。** 关卡、分类、食物目录和纪念品仅由管理端写入 PostgreSQL；浏览器不直连数据库。
- **玩家数据最小化。** 玩家输入只用于本次计算和本机草稿，不建立玩家数据表、历史或云同步。
- **计算独立且可复核。** 三星求解器是无 I/O 的纯 domain module；UI、数据库与 HTTP 层都不能包含求解规则。
- **安全边界在服务端。** 前端校验用于体验，服务端校验和数据库约束才是写入与鉴权依据。
- **YAGNI。** 不引入 Redis、消息队列、对象存储、Supabase Auth、Realtime、Storage、RBAC、独立后端或复杂 CI/CD。
- **为机场扩展留接口，不预建产品。** 所有标准数据带 `airport_id`；但 MVP 只 seed 纽约，也不提供机场管理功能。

## 3. 技术方案比较

| 方案 | 组成 | 优点 | 主要取舍 | 适合度 |
| --- | --- | --- | --- | --- |
| A（采用） | Next.js + TypeScript + React + Tailwind + Drizzle + Supabase PostgreSQL + Vercel | 单仓库、一个 Web 部署、托管数据库与可视化维护；玩家和管理端共享组件与类型；预览部署成熟 | 要管理 Vercel 与 Supabase 两个服务 | **最高** |
| B | 同一 Next.js 单体 + Railway Web/托管 PostgreSQL | 服务商较少，Web 与 DB 可放在同一平台 | 部署、预览、备份与排障的学习负担更集中在开发者身上 | 可行，但次选 |
| C | Next.js + 托管 SQLite/libSQL + Vercel | 初始模型简单，起步成本低 | 生产远程数据库、迁移和后续关系扩展的收益不如 PostgreSQL 清晰；多一个特定数据库范式 | 仅适合原型 |

### 3.1 评估维度

| 维度 | A：Vercel + Supabase | B：Railway | C：libSQL |
| --- | --- | --- | --- |
| 学习成本 | 中低；主流文档多，职责明确 | 中；需要理解更多平台运维项 | 中；要额外理解 SQLite 远程运行方式 |
| 开发速度 | 高 | 高 | 中高 |
| 部署难度 | 低 | 中 | 中 |
| 数据库维护 | 低；PostgreSQL 控制台、备份、SQL 编辑器齐全 | 中；取决于平台设置 | 中 |
| 管理端开发 | 高；同一 React/Next 项目 | 高 | 高 |
| CSV/XLSX | 高；Node runtime 内解析即可 | 高 | 高 |
| 后续机场扩展 | 高；关系型模型自然支持 | 高 | 中高 |
| 运行成本 | MVP 数据量低，通常可低成本起步；以部署当日价格为准 | 同类或略高，取决于实例策略 | 低到中 |
| 个人开发友好度 | **最高** | 中 | 中 |

## 4. 最终技术栈

- **Web 框架：** Next.js App Router。
- **语言与 UI：** TypeScript、React、Tailwind CSS。Tailwind 只承担将 UI-SPEC Token 映射为样式，不改变视觉规则。
- **数据库：** Supabase 托管 PostgreSQL；仅使用其 PostgreSQL、备份与管理控制台能力。
- **数据访问与迁移：** Drizzle ORM + Drizzle migration。它将表结构、查询与数据库迁移保持为可审阅的 TypeScript/SQL 文件；并不替代 PostgreSQL。
- **校验：** Zod。共享输入 schema，分别用于表单提示、Server Action/Route Handler 验证和导入行验证。
- **表格文件：** `xlsx`（SheetJS Community）解析和生成 CSV/XLSX。文件规模很小，不使用流式处理或文件服务。
- **认证会话：** 一个小型、成熟的加密 session-cookie 库；共享口令本身只由环境变量提供。
- **单元/集成/E2E：** Vitest、Playwright。
- **托管：** Vercel 托管 Next.js；Supabase 托管 PostgreSQL。Vercel 提供 HTTPS、部署与 Preview；Supabase 提供标准 PostgreSQL、备份和数据库控制台。

不采用 Supabase Auth、Storage、Realtime、客户端 Supabase SDK、Prisma、GraphQL、tRPC、Redux、Redis 或独立 API 服务。它们在本 MVP 没有足够收益。

## 5. 系统架构

```text
                         ┌──────────────────────────────────┐
                         │        Next.js on Vercel          │
                         │                                  │
Player Web ────────────► │  Player pages / Server Components │
                         │  Calculation Server Action        │
                         │  Pure calculation domain module   │
                         │                                  │
Admin Web ─────────────► │  Admin pages / Server Components  │
                         │  Auth + CRUD Server Actions       │
                         │  Import/Export Route Handlers     │
                         └───────────────┬──────────────────┘
                                         │ server-only DB connection
                                         ▼
                         ┌──────────────────────────────────┐
                         │      Supabase PostgreSQL          │
                         │ airports / levels / categories /  │
                         │ foods / souvenirs                 │
                         └──────────────────────────────────┘

Browser localStorage: only anonymous player draft
Browser sessionStorage: only ephemeral result/import-result view data
```

### 5.1 层职责

| 层 | 职责 | 不负责 |
| --- | --- | --- |
| 玩家 UI | 录入、字段提示、草稿恢复、展示结果 | 数据库写入、最优算法规则、鉴权判断 |
| 管理 UI | 搜索、表单、Drawer/Modal、导入错误展示 | 仅靠隐藏按钮保护数据 |
| Next.js 服务端 | 读取标准数据、校验、认证、事务、计算调用、导出下载 | 保存玩家档案 |
| Domain | 纯粹计算候选方案、预算与排序 | HTTP、SQL、React、cookie |
| Repository/DB | 参数化查询、事务、持久化约束 | 页面状态、计算展示 |
| PostgreSQL | 标准数据完整性和唯一性 | 玩家瞬时输入、文件长期存储 |

## 6. 前端架构

### 6.1 一个 Web App，两个受控区域

玩家端和管理端放在同一个 Next.js Web App：它们共享构建、部署、类型、基础组件和数据访问层，但通过路由 layout、功能模块和鉴权边界隔离。这样避免维护两个项目或两个 API。

建议路由如下：

```text
/
├─ page.tsx                              城市引入页
├─ new-york/
│  ├─ page.tsx                            纽约计算页
│  └─ result/page.tsx                     本次结果页
└─ admin/
   ├─ page.tsx                            登录页；已登录则转 /admin/levels
   ├─ levels/page.tsx                     纽约标准关卡
   ├─ levels/import-result/page.tsx       关卡导入结果
   ├─ categories/page.tsx                 食物分类
   ├─ foods/page.tsx                      食物升级目录
   ├─ foods/import-result/page.tsx        食物目录导入结果
   └─ souvenirs/page.tsx                  两种纪念品配置
```

`/` 的 18 城市路线来自静态前端配置。仅开放城市才能导航至 `/new-york`；未开放城市既不发起标准数据读取，也不创建草稿。

### 6.2 Server Component 与 Client Component 原则

- **Server Component（默认）：** 页面壳、城市可用性、玩家端标准数据读取、管理列表读取、受保护 layout。它们可安全访问 repository，减少浏览器 JavaScript 与额外请求。
- **Client Component（按交互边界使用）：** 城市轮播、计算表单、食物展开/折叠、纪念品输入、草稿、清除确认弹窗、管理搜索、Drawer、Modal、上传控件、导入结果显示。
- **纯组件：** 视觉组件只通过 props 渲染，不读取数据库、不调用计算器。UI-SPEC 中的玩家 Glass Card 与管理端平面 Table/Drawer 使用不同组件和 Token，避免视觉混用。

### 6.3 表单、草稿和结果导航

- React Hook Form + Zod resolver 管理交互表单状态和字段级错误；不引入全局状态库。
- 玩家表单失焦时做对应字段校验；提交时全量校验。UX-SPEC 所定义的自动展开、滚动到首个错误和加载禁用由 Client Component 实现。
- 计算成功、已达三星或无解均调用同一 `calculatePlan` Server Action。结果是一次性数据，写入 `sessionStorage` 后导航至 `/new-york/result`；结果页读取该数据。若用户直接打开或清空会话后刷新结果路径，显示“本次计算结果已失效，请返回修改输入”，不伪造历史记录。
- 回到计算页时，用户的输入来自仍在内存中的表单或已保存的 `localStorage` 草稿；不会因查看结果丢失。

### 6.4 调用、加载与错误

- 标准数据读取由 Server Component 在服务端完成；管理员保存、删除、登录、登出和计算使用 Server Actions。
- CSV/XLSX 导入、下载导出使用 Route Handlers，因为它们天然处理 `multipart/form-data`、二进制文件与 `Content-Disposition` 下载头。
- 任何可重试服务错误均保留现有输入；管理端保留 Drawer/上传上下文，玩家端保留草稿。
- 页面以 `loading.tsx` 或局部 skeleton 表达数据读取；表单按钮使用 pending 状态，禁止重复提交。不得把 loading、空数据或未填写表单混为一谈。

### 6.5 Figma 到组件的落地

先建立与 UI-SPEC 一一对应的 token 层（玩家 Token 与 admin Token 分开），再以小组件组合页面：

- 玩家：`CityCarousel`、`CalculatorHeader`、`GlassSection`、`FoodCandidateRow`、`SouvenirInputRow`、`PreferenceSegmentedControl`、`ResultMetricSection`、`DraftClearDialog`。
- 管理：`AdminShell`、`AdminSidebar`、`DataTable`、`SearchToolbar`、`EditorDrawer`、`ConfirmDeleteDialog`、`ImportDropzone`、`ImportErrorTable`。

UI-SPEC 标为“待确认”的视觉状态在设计补充前不能凭技术人员偏好补写；但 PRD/UX-SPEC 已规定的文字、行为和无障碍要求必须实现。

## 7. 后端架构与数据访问

服务端代码按三个边界组织：

1. **Action/Route Handler：** HTTP/FormData、鉴权、请求解析和统一错误转换。
2. **Service：** 单条 CRUD、导入全量校验、事务、缓存失效；服务不能返回未验证的输入。
3. **Repository：** Drizzle 查询与 PostgreSQL transaction；只接受已经过验证的领域值。

数据库连接变量只存在于 Vercel 服务端环境变量，绝不使用 `NEXT_PUBLIC_` 前缀。浏览器不拥有 database URL、service role key 或可写数据库凭证。

玩家标准数据在每次新页面请求中读取最新版本。数据总量很小，不建立应用级缓存层；管理员成功变更后调用 `revalidatePath('/new-york')`、`revalidatePath('/new-york/result')` 与相应管理路由失效，确保后续玩家请求不读到旧数据。

## 8. 数据模型

### 8.1 建模约定

- 主键使用 UUID；`created_at`、`updated_at` 使用 `timestamptz`，默认 `now()`。
- 金额、收入、数量使用 PostgreSQL `integer`，应用层只接受 JavaScript safe integer；不使用浮点数。
- 名称保存显示原值，同时保存经 Unicode 规范化、去首尾空格和小写化后的 `name_key` 供唯一性比较；禁止只用 UI 判断重复。
- `airport_id` 是为未来机场准备的正常外键，并不意味着 MVP 开放多机场。
- `updated_at` 由数据库触发器统一更新时间戳；这是仅有的通用触发器，不承载业务规则。

### 8.2 `airports`

| Column | Type | Null / default | 约束与索引 |
| --- | --- | --- | --- |
| `id` | `uuid` | NOT NULL，生成 UUID | PK |
| `slug` | `varchar(63)` | NOT NULL | UNIQUE；小写 kebab-case 检查，例如 `new-york` |
| `display_name` | `varchar(100)` | NOT NULL | trim 后非空 |
| `created_at` | `timestamptz` | NOT NULL, `now()` |  |
| `updated_at` | `timestamptz` | NOT NULL, `now()` |  |

MVP migration/seed 只创建 `new-york / 纽约`。没有机场创建、删除或编辑页面。

### 8.3 `levels`

| Column | Type | Null / default | 约束与索引 |
| --- | --- | --- | --- |
| `id` | `uuid` | NOT NULL，生成 UUID | PK |
| `airport_id` | `uuid` | NOT NULL | FK → `airports.id`，删除 RESTRICT；索引 |
| `level_type` | `varchar(32)` | NOT NULL | MVP 值为 `standard`；非空 |
| `level_number` | `smallint` | NOT NULL | CHECK `>= 1` |
| `star_target_revenue` | `integer` | NOT NULL | CHECK `> 0` |
| `created_at`, `updated_at` | `timestamptz` | NOT NULL, `now()` |  |

唯一约束：`UNIQUE (airport_id, level_type, level_number)`。MVP 服务端额外约束纽约 `level_type = standard` 且编号 `1..50`；数据库保留未来机场/关卡类型的合法扩展空间，不把“1–50”硬编码为永久全局限制。索引为 `(airport_id, level_type, level_number)`，同时满足玩家读取和管理端排序。

### 8.4 `food_categories`

| Column | Type | Null / default | 约束与索引 |
| --- | --- | --- | --- |
| `id` | `uuid` | NOT NULL，生成 UUID | PK |
| `airport_id` | `uuid` | NOT NULL | FK → `airports.id`，删除 RESTRICT；索引 |
| `name` | `varchar(100)` | NOT NULL | trim 后非空 |
| `name_key` | `varchar(100)` | NOT NULL | 标准化后的值 |
| `created_at`, `updated_at` | `timestamptz` | NOT NULL, `now()` |  |

唯一约束：`UNIQUE (airport_id, name_key)`，以及仅为复合外键提供支持的 `UNIQUE (id, airport_id)`。`food_categories` 被 `foods` 引用时，数据库的 RESTRICT 与服务端业务错误共同阻止删除。

### 8.5 `foods`

| Column | Type | Null / default | 约束与索引 |
| --- | --- | --- | --- |
| `id` | `uuid` | NOT NULL，生成 UUID | PK |
| `airport_id` | `uuid` | NOT NULL | FK → `airports.id`，删除 RESTRICT；索引 |
| `category_id` | `uuid` | NOT NULL | FK 到同一机场的分类；删除 RESTRICT |
| `name` | `varchar(100)` | NOT NULL | trim 后非空 |
| `name_key` | `varchar(100)` | NOT NULL | 标准化后的值 |
| `display_order` | `smallint` | NOT NULL | CHECK `>= 1`；玩家固定目录顺序 |
| `created_at`, `updated_at` | `timestamptz` | NOT NULL, `now()` |  |

约束：`UNIQUE (airport_id, name_key)`、`UNIQUE (airport_id, display_order)`，以及 `FOREIGN KEY (category_id, airport_id) REFERENCES food_categories(id, airport_id) ON DELETE RESTRICT`。这个复合 FK 在数据库层保证食物不能跨机场引用分类。查询索引 `(airport_id, display_order)`。

食物目录**只**保存名称、分类和固定展示顺序。绝不保存收入增量、金币成本、钻石成本、等级或前置条件；这些都是玩家的一次性输入。

“每机场最多 20 项”不能用单行 CHECK 正确表达。所有新增、编辑涉及机场改变、导入都在 PostgreSQL transaction 内锁定对应 `airports` 行、统计现有目录和本次变更后数量；超过 20 时回滚并返回 `Conflict`。这避免并发写入绕过上限，而不需要业务触发器。

### 8.6 `souvenirs`

| Column | Type | Null / default | 约束与索引 |
| --- | --- | --- | --- |
| `id` | `uuid` | NOT NULL，生成 UUID | PK |
| `airport_id` | `uuid` | NOT NULL | FK → `airports.id`，删除 RESTRICT；索引 |
| `slot` | `smallint` | NOT NULL | CHECK `IN (1, 2)` |
| `name` | `varchar(100)` | NOT NULL | trim 后非空 |
| `per_item_revenue` | `integer` | NOT NULL | CHECK `> 0` |
| `package_size` | `smallint` | NOT NULL, `5` | CHECK `= 5`；管理端只读 |
| `diamond_package_price` | `integer` | NOT NULL | CHECK `>= 0` |
| `created_at`, `updated_at` | `timestamptz` | NOT NULL, `now()` |  |

唯一约束：`UNIQUE (airport_id, slot)`。seed 在纽约创建 slot 1、2 两条记录；MVP 不暴露新增或删除 handler，只允许更新名称、单个收入和包价。因此该表对每个 MVP 机场最多且恰好维护两个可编辑配置，不需额外的复杂触发器。

### 8.7 不入库的玩家输入

以下字段绝不写入以上标准数据表：选定关卡、当前收入、金币/钻石预算、成本偏好、是否选择某食物、每个选中食物的收入增量/金币成本/钻石成本、是否允许纪念品、纪念品库存、计算结果、购买余量。它们仅存在于提交请求、计算结果和本机草稿。

## 9. 城市路线配置

18 个城市的固定顺序属于**前端 TypeScript 静态配置**：丹佛、悉尼、伦敦、纽约、新加坡、东京、那不勒斯、里约热内卢、开普敦、巴黎、雅加达、洛杉矶、墨西哥、孟买、札幌、柏林、上海、布宜诺斯艾利斯。每项只含 `slug`、中文名、`isOpen` 和静态场景资源引用；MVP 仅 `new-york` 的 `isOpen` 为真，`shanghai` 为假。

选择 TypeScript config，而非数据库或 JSON，理由是：路线不是后台可维护数据；未开放城市不需要业务数据；代码可在构建时校验类型并与静态资源直接关联；无须为一个固定展示清单新增查询、权限、迁移或管理页面。未来开通机场时，新增该城市的静态配置并为其 seed `airports` 记录即可。JSON 也能表示数据，但失去类型检查且没有实际维护收益；数据库会错误暗示管理员可运营路线。

## 10. API 与 Server Actions

### 10.1 选择原则

Server Actions 用于同一 Next.js 应用内、由表单触发的登录、计算和管理 CRUD：调用点接近 UI，减少无意义 REST endpoint。Route Handler 只用于文件上传/下载这种 HTTP 文件语义明确的场景。不会为每个表机械创建 REST API。

### 10.2 玩家接口

| 名称 | 形式 | 输入 | 成功输出 |
| --- | --- | --- | --- |
| `getCalculatorData('new-york')` | 服务端页面读取 | 固定 city slug | 50 关卡、最多 20 项食物及分类、2 个纪念品 |
| `calculatePlan(input)` | Server Action | 玩家一次性计算输入 | `already_starred`、`success` 或 `no_solution` 的判别联合 |

`calculatePlan` 不信任客户端传来的目标收入、食物名称、分类、纪念品收入或包价。它以请求中的 level、food id 和玩家动态数值为索引，在服务端读取当前纽约标准数据，再调用计算器。因此客户端不能把旧目录或伪造配置当作权威输入。

### 10.3 管理接口

| 范围 | 形式 | 操作 |
| --- | --- | --- |
| 登录/退出 | Server Action | `loginAdmin`、`logoutAdmin` |
| 标准关卡 | 受保护 Server Action | create、update、delete |
| 食物分类 | 受保护 Server Action | create、update、delete |
| 食物目录 | 受保护 Server Action | create、update、delete |
| 纪念品 | 受保护 Server Action | update；无 create/delete |
| 关卡导入 | `POST /api/admin/imports/levels` | CSV/XLSX multipart 上传 |
| 食物导入 | `POST /api/admin/imports/foods` | CSV/XLSX multipart 上传 |
| 关卡导出 | `GET /api/admin/exports/levels?format=csv|xlsx` | attachment 下载 |
| 食物导出 | `GET /api/admin/exports/foods?format=csv|xlsx` | attachment 下载 |

所有 `/admin` 页面、Action 和 `/api/admin/*` handler 在执行前都调用同一 `requireAdminSession()`；页面未认证时重定向至 `/admin`，API 返回 `Unauthorized`。只在前端隐藏导航不被视为鉴权。

### 10.4 统一响应与验证

Action 的可预期失败返回：

```text
{ ok: false, error: { code, message, fieldErrors? } }
```

Action 成功返回：

```text
{ ok: true, data: ... }
```

文件 Route Handler 的 JSON 失败使用：

```text
{ error: { code, message, details? } }
```

每个边界先以 Zod 验证原始 input，再执行服务规则和数据库写入。数据库冲突仍会被捕获、转换为可理解的 `Conflict`，防御 Action 之间的竞争条件。

## 11. Calculation Engine

### 11.1 模块边界与接口

计算模块位于 `src/domain/calculation/`，不得导入 React、Next.js、Zod、Drizzle 或数据库客户端。它接收已经验证、已经补全了标准数据的对象，返回一个可序列化的判别联合。

概念接口：

```text
calculateOptimalPlan(input: CalculationInput): CalculationResult
```

`CalculationInput` 包含：目标收入、当前收入、可选金币/钻石预算、`gold_first | diamond_first` 偏好、按固定目录顺序的已选食物（id、目录位置、收入增量、金币成本、钻石成本）、最多两种被允许纪念品（slot、库存、单个收入、包价、固定 `packageSize=5`）。

输入字段的精确语义如下：

| 字段 | 类型 | 规则 / 来源 |
| --- | --- | --- |
| `targetRevenue` | non-negative safe integer | 服务端依据 `levelId` 从数据库读取；必须为正 |
| `currentRevenue` | non-negative safe integer | 玩家本次输入 |
| `goldBudget` / `diamondBudget` | safe integer 或 `null` | `null` 表示不限，非负；玩家本次输入 |
| `preference` | `gold_first` / `diamond_first` | 玩家必选 |
| `foods[]` | `FoodCandidate[]` | 仅玩家勾选的目录项；每项含稳定 `displayOrder` 与本次三项数值 |
| `foods[].revenueDelta` | positive safe integer | 玩家本次输入 |
| `foods[].goldCost` / `diamondCost` | non-negative safe integer | 玩家本次输入 |
| `souvenirs[]` | 最多两项 `AllowedSouvenir` | 仅玩家允许的标准纪念品 |
| `souvenirs[].inventory` | non-negative safe integer | 玩家本次输入 |
| `souvenirs[].perItemRevenue` / `diamondPackagePrice` | positive / non-negative safe integer | 服务端从标准纪念品记录读取 |

`success` 输出至少包含：`gap`、`selectedFoods[]`、`souvenirUses[]`、`addedRevenue`、`finalRevenue`、`revenueOverTarget`、`goldCost`、`diamondCost`、`goldBudgetRemaining`、`diamondBudgetRemaining`、`preference`。每个 `souvenirUses[]` 含 `quantityUsed`、`inventoryConsumed`、`packagesPurchased`、`quantityPurchased`、`remainingAfterPurchase`、`diamondCost`。预算不限时对应 remaining 明确为 `null`，由 UI 显示“不限预算”。

`CalculationResult` 为以下之一：

- `already_starred`：目标、当前收入、`gap=0`；没有方案清单。
- `success`：选择的食物、每种纪念品的数量/库存消耗/购买包数/购买数量/剩余、收入汇总、成本汇总、预算余量和偏好。
- `no_solution`：目标、当前收入、正收入缺口，以及在当前有限候选与预算下的有限最大可增加收入。

### 11.2 核心规则

设 `G = max(0, targetRevenue - currentRevenue)`。

- 每项食物升级只能取 `x ∈ {0, 1}`。
- 食物收入与成本仅由本次玩家输入提供。
- 纪念品使用量 `Q` 是非负整数，先消耗库存；购买包数为 `max(0, ceil((Q - inventory) / 5))`。
- 方案必须满足最终收入不少于目标，且任一已填写预算不被超过。
- `G = 0` 时立即返回 `already_starred`；不要求选择候选项。

### 11.3 枚举策略与复杂度

MVP 的上限为 20 项食物、2 种纪念品。纽约已确认 12 项；直接枚举仍是 MVP 可读且可证明的默认方案，不提前引入整数规划、动态规划服务或第三方优化器。

1. 枚举所有已选食物子集；纽约当前最多 `2^12 = 4,096` 个，产品目录上限为 `2^20 = 1,048,576` 个。
2. 对每个子集先计算食物收入与成本，超过预算者立即跳过。
3. 若剩余缺口不大于 0，形成“不使用纪念品”的候选。
4. 对允许的一种或两种纪念品，枚举第一种数量 `0..ceil(remainingGap / perItemRevenue)`；第二种仅取补齐余下缺口的最小整数数量。若仅允许一种，则直接取最小数量。任何更高数量不会降低成本，且在相同包成本下会被“纪念品使用数量更少”规则支配。
5. 对每个候选计算整包购买、两种资源成本、预算和完整结果，再通过统一 comparator 选择第一名。

复杂度为 `O(2^F × (1 + ceil(G / M)))`，其中 `F ≤ 10`，`M` 是作为外层枚举的纪念品单个收入。MVP 的目标收入来自 50 个受控标准关卡，纪念品只有两类，实际候选远小于通用优化问题；该实现可读、可测试且足够快。每轮也依据预算上界提前截断不可行购买量。数据库和服务端验证只接受 safe integer，避免浮点误差与异常大数。

### 11.4 确定性的最优排序

将每个可行候选转换为下列 lexicographic key：

```text
若 preference = gold_first：
(goldCost, diamondCost, selectedFoodCount, totalSouvenirQuantity, stableDirectoryVector)

若 preference = diamond_first：
(diamondCost, goldCost, selectedFoodCount, totalSouvenirQuantity, stableDirectoryVector)
```

`stableDirectoryVector` 固定为：按食物 `display_order` 排列的已选/未选位向量，再接纪念品 slot 1、slot 2 的使用量。按该向量做数字字典序比较。输出清单也始终按食物目录顺序、纪念品 slot 顺序展示。故相同输入必定返回同一唯一方案，不依赖对象遍历顺序、数据库 UUID 或浏览器排序。

### 11.5 无解与最大可增加收入

- 有任一允许纪念品、单个收入为正且钻石预算不限时，总能购买足够包，因此不返回无解。
- 无解只在候选与预算都有限且无法补足缺口时发生。
- 无解的“最大可增加收入”从同一枚举空间计算，取预算内收入增加最多的候选；若存在可无限购买的零价或不限预算纪念品，不会进入无解状态。
- `no_solution` 是正常业务结果，返回成功 Action 响应，不是异常或 HTTP 500。

## 12. 管理员认证

### 12.1 口令与验证

- 部署时设置 `ADMIN_PASSWORD_HASH` 和独立的高强度 `ADMIN_SESSION_SECRET` 环境变量。前者保存共享口令的慢哈希，而非显示口令；两者永不进入 Git、浏览器 bundle、日志或 UI。
- 登录 Action 在服务端验证输入口令；失败一律显示“口令不正确，请重试”，不泄露账户状态或口令规则。
- 成功后创建加密、签名的无状态 session cookie。cookie 内只含最小管理员标记、签发时间和过期时间，不含口令或个人资料。
- 建议 session 有固定短期有效期（例如 8 小时）且不会自动无限续期；退出时立即删除 cookie。

### 12.2 Cookie 与 API 保护

Session cookie 必须设置 `HttpOnly`、`Secure`（production）、`SameSite=Lax`、`Path=/`、明确 `Max-Age`。每个管理页面、Action 和 Route Handler 都在服务端验证签名与过期时间。任何无效或缺失 session 都无法读取管理数据、上传、下载或写入。

这不是账号系统：没有用户表、RBAC、OAuth、找回密码、改密页面、审计日志或管理员档案。

## 13. CSV / XLSX 导入

### 13.1 支持的数据集与列

| 数据集 | 必须列 | 唯一键 |
| --- | --- | --- |
| 纽约标准关卡 | `airport`、`level_type`、`level_number`、`star_target_revenue` | `airport + level_type + level_number` |
| 纽约食物升级目录 | `name`、`category` | 纽约机场内标准化 `name` |

关卡导入要求机场为“纽约”、类型为“标准关卡”、编号为 1–50、目标收入为正整数。食物导入要求分类已经存在，导入后目录总数不超过 20。文件中不存在的既有记录必须保留；同键记录代表更新而不是删除冲突。

### 13.2 完整流程

```text
管理员上传 CSV/XLSX
      ↓
文件类型/大小/结构检查
      ↓
解析为原始行（不写 DB）
      ↓
schema validation + business validation + 文件内重复检查
      ↓
查询当前 DB，检查分类/目录上限/并发条件
      ↓
任一错误：返回全部行错误，完全不写入
      ↓
全部合法：一个 transaction 内 atomic upsert
      ↓
提交、失效相关缓存、返回成功统计
```

### 13.3 校验与原子性

- 仅接受 `.csv`、`.xlsx`，并同时检查扩展名、MIME 线索和实际解析结果；设置 1 MB 服务端文件上限。MVP 的 50/10 条数据远小于该限制。
- 使用 `xlsx` 读取工作簿的首个数据 sheet；CSV 按 UTF-8（含 BOM）解析。拒绝空文件、缺列、空表头、无法解析的工作簿和额外业务不合法行。
- 先积累**所有**行错误。每项格式为 `{ row, field, value, reason }`；行号以用户可见的表头后第一条数据为第 2 行计数。
- 所有行基础校验通过后才查询数据库。食物类别查找、名称冲突/归一化冲突、文件内重复、关卡范围和 20 项上限都必须报错。
- 最终写入使用一个 PostgreSQL transaction。关卡与食物均为按唯一键 `INSERT ... ON CONFLICT DO UPDATE` 的语义；事务失败会整体回滚。对食物目录同时锁机场行，防止并发导入突破 20 项。
- 失败导入不产生部分更新、导入历史、临时表、对象文件或回滚功能。

导入文件只在该请求的 Node memory 内读取、解析和丢弃；不保存到 Supabase Storage、Vercel Blob 或本地磁盘。

### 13.4 导入结果页面

成功后返回原列表并显示新增/更新/处理总数。失败时客户端将非敏感结果临时写入当前浏览器 `sessionStorage` 并导航到相应 import-result 路由，完整显示数据集名称、文件名、`row / field / value / reason` 和“未导入，未产生任何数据变更”。刷新仍可读取当前会话；会话清除后要求重新上传。该机制不构成导入历史。

## 14. 导出

只有纽约标准关卡和食物升级目录可以导出为 CSV 或 XLSX；纪念品与食物分类不在导出范围。

受保护的 `GET` Route Handler 从 PostgreSQL 读取当前标准数据，在请求内生成 `Buffer`，设置正确的 `Content-Type`、UTF-8 文件名和 `Content-Disposition: attachment` 后直接下载。CSV 使用 RFC 4180 兼容转义，并对以 `=`, `+`, `-`, `@` 开头的文本值做公式注入防护；XLSX 输出显式字符串/整数单元格，不执行工作簿公式。

没有对象存储、导出队列、生成历史或预签名下载链接。数据最多几十行，实时生成即可。

## 15. 本地草稿

### 15.1 localStorage schema

key 使用带范围的名字：`chefs-help-chefs:player-draft`。建议 schema：

```text
{
  version: 1,
  city: "new-york",
  level: number | null,
  currentRevenue: string,
  budgets: { gold: string, diamond: string },
  preference: "gold_first" | "diamond_first" | null,
  selectedFoods: {
    [foodId]: {
      selected: boolean,
      revenueDelta: string,
      goldCost: string,
      diamondCost: string
    }
  },
  souvenirInventory: {
    [souvenirId]: { enabled: boolean, inventory: string }
  },
  updatedAt: string
}
```

数值在草稿中使用字符串，目的是保留用户正在输入的空值和未完成值；提交时才由 Zod 转换并验证为整数。草稿不保存计算结果、购买余量或任何永久历史。

### 15.2 生命周期

- 表单初始挂载时先读取、JSON parse、Zod 安全校验版本 1 草稿；无效、损坏、城市不匹配或引用了已删除标准数据的条目将安全忽略其无效部分，不阻塞页面。
- 用户变更经轻量 debounce 后自动保存，页面卸载前不依赖额外网络请求。
- “清除草稿”经 UX-SPEC 指定二次确认后删除该 key，并把表单重置为默认状态。
- 未来 schema 变更时，`version` 驱动小型迁移函数；无法无损迁移时删除旧草稿并显示低干扰说明，而非猜测字段含义。

## 16. 验证策略

| 层 | 职责 | 例子 |
| --- | --- | --- |
| 前端 | 及时提示、禁用明显非法提交、引导定位 | 当前收入为空、已选食物缺成本、纪念品库存缺失 |
| 服务端 | 权威 schema 与业务规则、鉴权、重新读取标准数据 | 预算整数、纽约 1–50、food 属于纽约、目录上限、分类引用 |
| 数据库 | 持久化完整性与并发最后防线 | FK、UNIQUE、CHECK、RESTRICT、transaction |

Zod schema 分为：玩家计算 input、登录 input、单条 Level/Category/Food/Souvenir input、导入 row。前端可复用其中安全的一部分，但绝不以浏览器验证代替服务端验证。所有数值先以字符串接收，明确拒绝空值（需填写时）、小数、科学计数法、负数、超出 safe integer 的数字和隐式类型转换。

## 17. 错误模型

| 类别 | 何时发生 | 面向用户的处理 |
| --- | --- | --- |
| `ValidationError` | 输入字段格式或值不合法 | 字段错误；不写入、不导航 |
| `Unauthorized` | 缺少/过期/无效管理员 session | 管理页跳登录；API 返回 401 |
| `NotFound` | 标准数据、对象或路由资源不存在 | 清晰提示或 404；不泄露内部数据 |
| `Conflict` | 唯一键冲突、被引用分类删除、目录超 10、并发版本冲突 | 保留编辑上下文并说明如何修正 |
| `ImportValidationError` | 导入任意行或文件结构不合法 | 结果页列出全部行错误；无写入 |
| `CalculationNoSolution` | 预算内无可行方案 | **正常计算结果**，结果页展示，不是 HTTP 错误 |
| `InternalError` | 未预期 DB/网络/解析运行时故障 | 通用可重试提示；记录安全日志，不泄露栈或 secret |

`already_starred` 同样是正常计算结果。只有后端真实意外失败才以 500 语义处理。

## 18. 安全

- **认证：** 管理端所有读写在服务端验证 session；管理口令 hash 和 session secret 只在环境变量。
- **输入与 SQL：** Zod + Drizzle 参数化查询；禁止拼接 SQL、动态表名或未验证排序字段。
- **XSS：** React 默认转义用户/管理员文本；禁止 `dangerouslySetInnerHTML` 渲染名称、CSV 内容和错误详情；下载文件的 CSV 进行公式注入防护。
- **CSRF：** 管理 cookie 使用 `SameSite=Lax`；所有有副作用的 Route Handler 校验同源 `Origin`/`Host`，Server Actions 采用 Next.js 同源保护，并不接受跨站 JSON 写入。
- **Cookie：** `HttpOnly`、production `Secure`、签名加密、固定过期时间；不把 session 放 localStorage。
- **文件上传：** 仅管理员、仅 CSV/XLSX、1 MB 限制、内存解析、拒绝解析错误；不执行宏、公式、外部链接或文件内容中的指令。
- **安全头：** 生产设置 `Content-Security-Policy`、`X-Content-Type-Options: nosniff`、`Referrer-Policy`、`frame-ancestors 'none'`/等价点击劫持防护和 HTTPS 重定向。
- **日志：** 可记录 request id、错误类别、导入行数、部署版本；不得记录口令、session、数据库 URL 或玩家完整输入。
- **限流：** MVP 不新建 Redis 限流系统。共享口令应为强随机口令；如果观察到暴力尝试，优先在 Vercel/域名层添加对 `/admin` 登录请求的 IP 限流或 WAF 规则。此项是可配置的防护升级，不阻塞 MVP 架构。

## 19. 性能

- 玩家所需标准数据当前为 50 Level、12 Food、2 Souvenir，产品目录上限为 20 Food；单次数据库查询与响应体都很小，不分页、不建 Redis、不做复杂缓存。
- 城市路线、图片和图标是构建时静态资源，可由 CDN 缓存。城市配置立即渲染，图片失败仍保留开放状态和重试。
- 计算放在服务端，原因是结果总与最新权威标准数据配套，且可以复用同一 domain module 和统一验证；纽约当前 12 项食物时规模为 4,096 个组合及很小的纪念品候选集，远低于一次普通请求可承受范围。目录产品上限为 20，未来某机场实际目录超过 12 时先以 20 项的 1,048,576 子集压测直接枚举，再决定是否需要另立性能设计；本 MVP 不预先引入复杂优化器。
- 管理端列表虽然只有几十行，仍按 UX-SPEC 支持搜索与基础分页 UI；无需服务端复杂分页、全文搜索或索引优化。已有机场/名称/目录索引已足够。

## 20. 测试策略

### 20.1 Unit Tests

重点覆盖纯 calculation domain：

- `G = max(0, target - current)` 与已达三星；
- 全部食物子集及食物 `0/1` 选择；
- 纪念品先库存、按 5 个整包购买、剩余数量与钻石成本；
- 金币/钻石边界等于预算和超过预算 1 的情况；
- 两种成本偏好的 lexicographic 排序；
- 食物数量、纪念品数量和目录向量的稳定平局规则；
- 无解与有限最大可增加收入；
- 不限钻石时允许纪念品必然可行。

另测名称规范化、Zod 整数转换、草稿版本迁移和 CSV/XLSX 行解析。

### 20.2 Integration Tests

对独立测试 PostgreSQL 数据库执行 migration，并验证：

- 管理 session 缺失时页面 Action、import/export 均拒绝；
- Level/Food/Category/Souvenir CRUD 的 Zod 与 DB 约束；
- 被引用分类不可删除；食物目录第 21 项不可写入；
- 管理保存后玩家读取到新标准数据；
- 合法导入按唯一键 upsert，未出现记录保留；
- 导入单个错误或事务失败时完全无数据变更；
- CSV 与 XLSX 输出列和值一致。

### 20.3 E2E Tests

Playwright 覆盖关键用户旅程，而非追求无意义覆盖率：

1. 城市引入页默认纽约、未开放城市不可进入。
2. 玩家填写合法输入，获得唯一成功方案；回到表单仍保留输入。
3. 已达三星、输入不足、字段错误、无解和服务失败的规定展示。
4. 草稿自动恢复、确认清除后不恢复。
5. 管理员登录、维护数据、玩家端读取更新。
6. 分类引用删除阻止、目录上限、导入错误页和成功导出下载。

## 21. 部署与运维

### 21.1 生产形态

- 一个 Vercel Project 部署 Next.js；自动提供 HTTPS。
- 一个 Supabase Production Project 托管 PostgreSQL。
- Vercel Function 区域应与 Supabase 数据库同一区域，最终以主要用户所在地和服务可达性决定；不要在不同洲默认部署。
- 自定义域名在 Vercel 配置；TLS 由平台托管续期。

### 21.2 环境变量

| 变量 | 用途 | 暴露范围 |
| --- | --- | --- |
| `DATABASE_URL` | 服务端 PostgreSQL 连接 | server only |
| `ADMIN_PASSWORD_HASH` | 共享口令慢哈希 | server only |
| `ADMIN_SESSION_SECRET` | session 加密/签名密钥 | server only |
| `APP_URL` | 同源检查与规范 URL | server only |

不使用 `NEXT_PUBLIC_DATABASE_URL`、Supabase service role key 或任何把认证 secret 暴露给客户端的变量。

### 21.3 Production、Preview、迁移与 Seed

- `main` 对应 Production；每个分支/PR 可由 Vercel 创建 Preview。
- Preview 必须使用独立的非生产数据库环境/变量，绝不指向生产数据；可使用一个小型 shared staging DB，且不将真实管理员口令放入 Preview。
- Schema 变更通过受版本控制的 Drizzle migration 执行。部署前先备份，再在对应环境运行 migration；不在页面运行时自动改 schema。
- 初始 seed 仅写入纽约机场、已确认的 50 个标准关卡、4 个食物分类、12 项食物目录和固定两种纪念品。标准数据由 `AIRPALNE INFORMATION NEW YORK.xlsx` 规范化而来。seed 必须可重复执行，不覆盖管理员后续维护的数据，除非由明确的受控初始化流程执行。
- 日常运营只通过受保护管理端修改标准数据；紧急数据库修复应记录在 migration/运维记录中，而非成为常规工作流。

## 22. 未来机场扩展

当未来开通东京、巴黎等机场时：

1. 在静态 `cityRoute` config 把相应城市从未开放改为开放，并补充其静态视觉资源和路由 slug。
2. 在 `airports` 新增该机场记录。
3. 为新机场 seed/导入其 Level、FoodCategory、Food 和两条 Souvenir；所有表已通过 `airport_id` 关联。
4. 路由由 `/[citySlug]` 或新增同构路径读取对应机场，计算器复用同一 domain module；查询永远按 `airport_id` 限定。
5. 如产品届时允许后台维护新机场，另立产品与技术规格；本 MVP 不提供机场 CRUD 或跨机场管理 UI。

因此扩展是新增数据、配置和有限路由泛化，而不是迁移 New York 硬编码数据库或重写算法。

## 23. 建议项目目录

```text
src/
├─ app/
│  ├─ (player)/
│  │  ├─ page.tsx
│  │  └─ new-york/
│  ├─ admin/
│  └─ api/admin/
├─ components/
│  ├─ player/                         仅玩家视觉组件
│  ├─ admin/                          仅管理视觉组件
│  └─ shared/                         Button、Field、Dialog 等无业务组件
├─ features/
│  ├─ player-calculator/              表单、草稿、结果 UI 编排
│  ├─ admin-levels/
│  ├─ admin-foods/
│  ├─ admin-categories/
│  ├─ admin-souvenirs/
│  └─ imports/
├─ domain/
│  ├─ calculation/                    纯求解器、类型、comparator
│  └─ standard-data/                  业务常量、名称规范化
├─ server/
│  ├─ actions/                        Server Actions
│  ├─ services/                       用例、事务编排
│  ├─ repositories/                   数据访问
│  ├─ auth/                           共享口令与 session
│  └─ imports/                        解析、校验、导出
├─ db/
│  ├─ schema/
│  ├─ migrations/
│  └─ seed/
├─ lib/
│  ├─ validation/                     Zod schemas
│  ├─ city-route.ts                   18 城市静态配置
│  └─ errors/
└─ test/
   ├─ unit/
   ├─ integration/
   └─ e2e/
```

目录边界要求：`domain` 不依赖 `app/components/server/db`；`db/repositories` 不依赖 React；组件不直接查询数据库；`lib` 不是杂项堆放区，只存跨功能且职责明确的工具。

## 24. Technical Acceptance Criteria

- [ ] 一个 Next.js 应用即可同时部署玩家端、管理端、服务端计算和文件接口。
- [ ] 仅 Supabase PostgreSQL 持久化标准数据；玩家输入、结果和草稿不入库。
- [ ] 数据库有机场外键、所列唯一约束、CHECK、RESTRICT 与索引；纽约仍是唯一 MVP 数据集。
- [ ] 食物目录不含收入/成本字段，且无法通过单条或导入操作超过 20 项。
- [ ] 管理员共享口令仅存在部署环境变量；未认证访问不能读取或修改管理数据，也不能导入/导出。
- [ ] 计算器是独立纯函数，满足收入、预算、纪念品包数和两种 lexicographic 偏好的全部规则，并且平局稳定。
- [ ] 已达三星、无解和成功均作为正常业务结果；无解不会成为 500。
- [ ] CSV/XLSX 导入先完整验证，任一错误时返回所有行错误且零写入；合法文件在一个 transaction 中 upsert。
- [ ] CSV/XLSX 导出按当前数据库实时生成下载，不引入对象存储。
- [ ] 草稿遵循 versioned localStorage schema，可恢复、清除和安全丢弃旧版本；结果不是永久历史。
- [ ] 所有关键逻辑有针对性的 unit、integration 和 E2E 覆盖；部署有独立 production/preview 环境、迁移和 seed 流程。

## 25. Risks / Open Questions

这些项目不会阻塞 TECH-SPEC，但在实施前或上线前需要明确：

1. **中国大陆可达性与区域：** 主要玩家实际网络位置、域名和 Vercel/Supabase 区域必须在发布前进行真机网络验证；若可达性不达标，托管供应商是唯一可能需要重新评估的架构边界。
2. **UI-SPEC 待确认视觉：** 玩家端桌面断点、未开放城市状态、错误/focus/disabled/loading、已达三星画板、食物结果项、纪念品库存展开；管理端错误/空/骨架/窄屏与 Figma 导入确认按钮的视觉映射，均须由设计补充后实现。
3. **初始标准数据来源：** `AIRPALNE INFORMATION NEW YORK.xlsx` 是纽约标准数据的唯一来源。Foundation plan 在 seed 前将其规范化为受 Zod 校验的版本控制 JSON，只允许 trim 字符串和修复源列名/工作表名的结构命名；不得改变任何业务值。
4. **共享口令交接：** 上线前必须生成高强度口令、以 hash 写入生产环境变量，并为部署负责人建立安全的保管/轮换流程；产品不增加改密页面。
