# 陪读小喵 · Cocos 3.8 配置表

从 `js/core.js` 抽离的静态配置，供 Cocos Creator 3.8 作为 JSON 配置表直接引用。
H5 原型仍同步加载 `js/core.js`，本目录可随时用下面的命令重新导出：

```bash
node scripts/export-config.js
```

## 文件一览

| 文件 | 来源常量 | 说明 | 条目数 |
|---|---|---|---|
| `slots.json` | `SLOTS` | 家具槽位 | 5 |
| `furniture.json` | `FURNITURE` | 家具目录 | 29 |
| `outfits.json` | `OUTFITS` | 服装目录 | 12 |
| `foods.json` | `FOODS` | 食物目录 | 3 |
| `activities.json` | `ACTIVITIES` | 猫咪陪伴图鉴 | 8 |
| `activity-tasks.json` | `ACTIVITY_TASKS` | 互动手册任务 | 8 |
| `comics.json` | `COMICS` | 番外目录 | 6 |
| `levels.json` | `LEVELS` | 等级表 | 8 |
| `fishing.json` | `FISHING` | 钓鱼规则与装备 | 2 |
| `rarity.json` | `RARITY` | 鱼类稀有度 | 4 |
| `fish.json` | `FISH` | 鱼类图鉴 | 9 |
| `cat-house-tiers.json` | `CAT_HOUSE_TIERS` | 猫屋档位 | 3 |
| `accessories.json` | `ACCESSORIES` | 猫咪配饰 | 16 |
| `room-themes.json` | `ROOM_THEMES` | 房间主题 | 3 |
| `achievements.json` | `ACHIEVEMENTS` | 成就 | 12 |
| `goals.json` | `goalInfo` | 每日/每周目标 | 2 |

成就条目里的 `val: s => ...` 已改写成可序列化的 `valueExpr`（原表达式字符串）和 `valueOf`（去掉 `s.` 前缀的字段路径，便于在 TS 里重写取值函数）。等级表额外补了从 1 开始的 `level` 字段。

