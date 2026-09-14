# 👩‍🍳 Chefs Help Chefs

> **Smarter plans. More stars.**  
> 卡三星不知道该升什么？Chefs Help Chefs 帮你算出更省资源的升级方案。

Chefs Help Chefs 是一个面向《飞机大厨》（Airplane Chefs）玩家的三星通关辅助决策工具。

当玩家在某个关卡距离三星还差一点，却不知道应该升级哪种食物、需要花多少金币或钻石时，Chefs Help Chefs 会根据玩家当前状态和可用升级选项，计算出一套满足三星目标的最低资源方案。

它只解决一个很具体的问题：

> **“我现在距离三星还差这么多，应该怎么升级最划算？”**

---

## ✨ Demo

🔗 **Online Demo：**  
https://airplane-chefs-helper.vercel.app/new-york

🎨 **Figma Prototype：**  
https://www.figma.com/make/2BYiw7LsBZDZIrMe2fOgru/User-Page-Prototype?code-node-id=0-6&p=f&t=oUA49cXNTPuB61Mj-0&fullscreen=1&preview-route=%2Fshanghai

## 💡 Why Chefs Help Chefs?

《飞机大厨》中，不同食物升级会带来不同的收入增量，同时消耗金币或钻石。

当某一关无法达到三星时，玩家通常会遇到一个问题：

**到底应该升级什么？**

直接凭感觉升级，可能出现：

- 花了很多金币，还是没到三星
- 浪费稀缺的钻石
- 升级了其实并不需要的食物
- 不知道哪种组合更划算

Chefs Help Chefs 把这个问题转换成一个简单的资源优化问题：

**在达到三星收入目标的前提下，找到符合当前资源预算的更优升级组合。**

---

## 🧭 How it works

```text
选择机场 / 城市
      ↓
选择关卡
      ↓
输入当前关卡总收入
      ↓
填写当前可升级食物
      ↓
填写每项升级：
收入增量 / 金币成本 / 钻石成本
      ↓
设置金币与钻石预算
      ↓
选择「优先省金币」或「优先省钻石」
      ↓
计算
      ↓
得到三星升级方案
