# 儿童英语测评项目上下文

注意！需要先读 agent.md
最后更新时间：2026-04-15

## 项目定位

这是一个面向儿童英语测评的双端项目：

- 老师端：登录后管理卷子、员工、答题记录
- 学生端：通过分享码进入卷子，填写信息后开始答题

当前设计目标已经从“能做题”升级到“3-6 岁儿童边玩边测”，所以学生端正在持续去掉“卷子感 / 后台感”，改成更像小游戏、贴纸卡和奖励反馈的体验。

## 技术栈

- 前端：Vue 3 + Vue Router + Ant Design Vue
- 后端：Node.js + Express
- 数据库：MySQL（mysql2）
- 动效：
  - `gsap`：播放浮层、开屏、结束动画等
  - `canvas-confetti`：庆祝/奖励粒子
- 其他：
  - `html-to-image`：导出报告图片

## 主要路由

### 老师端

- `#/login`
- `#/papers`
- `#/papers/new`
- `#/answers?paperId=...`
- `#/users`
- `#/users/new`

### 学生端

- `#/join`
- `#/paper/:shareCode`

## 当前支持题型

- 听音选图 `listen_choose_image`
- 听音做指令 `listen_follow_instruction`
- 看图选词 `look_choose_word`
- 拖拽组句 `sentence_sort`
- 跟读练习 `read_aloud`
- 拼写填空 `spell_blank`
- 听题口答 `listen_answer_question`
- 听音选字母 `listen_choose_letter`
- 图文跟读 `read_sentence_with_image`
- 图片连线 `match_image_word`

## 重要产品规则

### 老师端

- 新建卷子默认是空白卷
- 卷子总分必须配置到 100 分才允许保存
- 题目能力维度当前只使用：`听 / 说 / 读`
- 每题最多允许 2 个能力维度
- 已有答题记录的卷子不能直接编辑，只能复制后再修改

### 学生端

- 不暴露老师端配置入口
- 学生信息必填：
  - 姓名
  - 手机号
  - 年龄
  - 年级 / 班级
- 学校字段已支持，但当前不是必填
- 默认不提前展示错误提示，点击开始后再提示未填项

### 报告与奖励

- 每张卷子支持配置报告评语：
  - 开头评语
  - 中间评语（按分数命中）
  - 结尾评语
- 报告支持导出 HTML 和 PNG
- 每张卷子可单独配置：
  - 开屏动画
  - 完成动画
  - 转盘抽奖
  - 奖品列表与权重

## 当前后台结构

### 编辑卷子页

当前编辑页已经做过一轮结构整理：

- 顶部标题区域显示 `编辑卷子`
- 顶部操作按钮已经移到标题区：
  - 返回卷子列表
  - 预览学生页
  - 答题情况
  - 保存卷子
- 原来的“新增卷子配置”统计大块已移除
- 左列当前顺序：
  1. 添加题型
  2. 卷子基础信息
  3. 互动奖励
  4. 报告评语
- 右列为题目列表

## 当前学生端 UI / 动效状态

### 已完成的学生端体验优化

#### 全局

- 学生端主容器宽度已放大到接近全屏
- 正在答题状态下，答题壳体高度提高到接近 `90vh`
- 已引入更儿童化字体，并按角色分配：
  - 标题：手写/绘本感
  - 按钮/贴纸/选项：圆润卡通感
  - 正文说明：更柔和、易读

#### 开屏 / 结束 / 播放

- `StudentOpeningOverlay`
  - 已接入较强的 GSAP 入场动画
- `StudentFinishOverlay`
  - 已升级为更明显的奖励式结束动画
  - 当前包含：
    - `finish-ribbon`
    - `finish-mascot`
    - `finish-burst`
    - confetti
- `PlaybackAnimalOverlay`
  - 已保留播放浮层，但去掉了“听音播放中”这类状态标题
  - 当前版本已经放大卡片、主形象、光晕和音波条

#### 听音选图

- 当前方向：贴纸卡片感
- 已经去掉多余外框层
- 图片改为完整显示优先（`object-fit: contain`）
- 图片展示区已放大，避免裁切
- 仍可继续优化点：
  - 卡片排布可以继续更像“散放贴纸”
  - 选中成功反馈可以再明显一些

#### 看图选词

- 已改成新模型：
  - 单张目标图片
  - 多个文字选项
  - 其中一个为正确答案
- 学生端当前结构：
  - 上面目标图
  - 下面单词贴纸
- 已解决：
  - 旧的“每个选项一张图”不再使用
  - 图片完整显示优先
- 当前仍需继续打磨：
  - 版式仍然偏空
  - 词贴纸和目标图的整体舞台感还可以更好

#### 听字母

- 已从“方框 + 字母池”改成：
  - 上方两个“小窝”
  - 下方散落字母
- 已去掉：
  - 小熊
  - 中间提示条
  - 大写框 / 小写框标签
- 当前已实现：
  - 真拖拽主玩法
  - 拖进小窝吸附
  - 未命中回弹
  - 小窝命中高亮
- 当前已开始尝试 `ghost` 跟手拖拽方向，但仍在细调手感和视觉，后续还需要继续收口

#### 图片连线

- 已经去掉学生端技术味编号
- 当前方向：贴纸式配对小游戏
- 已增加轻量状态反馈：
  - 点我开始
  - 准备配对
  - 配对成功
- 后续仍可继续增强：
  - 配对成功时的更明显反馈动画

### 当前仍明显偏“卷子感”的题型

这些题型还没有彻底游戏化，后续建议继续优化：

- 听题口答 `listen_answer_question`
- 跟读练习 `read_aloud`
- 图文跟读 `read_sentence_with_image`
- 拼写填空 `spell_blank`
- 拖拽组句 `sentence_sort`

其中：

- `spell_blank` 当前最像做卷子（输入框强）
- `listen_answer_question / read_aloud / read_sentence_with_image` 当前更像录音台，而不是小游戏

## 看图选词当前数据模型

当前 `look_choose_word` 采用新模型：

- `imageUrl`
- `choices: [{ id, word }]`
- `correctChoiceId`

规范化后用于学生端展示的数据：

- `imageUrl`
- `targetWord`
- `options`

## 听字母当前交互说明

当前 `listen_choose_letter` 仍保留 store 里的这些事件接口：

- `set-letter-slot`
- `clear-letter-slot`

学生端组件内部负责：

- 散落字母的拖拽表现
- 命中检测
- 回弹动画
- 小窝高亮

## 当前使用的动画能力

- `gsap`
  - 开屏动画
  - 结束动画
  - 播放浮层
- `canvas-confetti`
  - 结束动画
  - 奖励转盘
- `CSS animation / transition`
  - 贴纸悬浮
  - 字母漂浮
  - 各类轻量交互反馈
- `speechSynthesis`
  - 单词/字母/问题播放（浏览器原生）

## iPad / 平板适配现状

已经做过一轮真实自测：

- iPad 横屏
- iPad 竖屏

当前确认：

- 没有明显横向溢出
- 主容器宽度利用率已提升
- 题目页能正常展示与切换

但注意：

- “不炸”不代表“好看”
- 当前仍然需要继续用截图审美巡检，而不是只看布局是否溢出

## 老师端默认管理员

- 用户名：`admin`
- 密码：`123456`

## 常用启动命令

在项目根目录执行：

```bash
npm install
npm run api
npm run serve
```

默认地址：

- 前端：`http://127.0.0.1:8080`
- 后端：`http://127.0.0.1:3001`

## 当前常用测试方式

### 代码测试

当前常用 Node 测试包括：

- `tests/antDesignMigration.test.cjs`
- `tests/studentExperience.test.cjs`
- `tests/playbackOverlay.test.cjs`
- `tests/studentGamefeel.test.cjs`
- `tests/lookChooseWord.test.cjs`
- `tests/listenChooseLetterPlayful.test.cjs`
- `tests/matchImageWordGamefeel.test.cjs`
- `tests/paperEditorHeader.test.cjs`
- 以及原有业务测试若干

### 页面真实自测

本地页面巡检临时目录使用：

- `D:\temp\englishquestion-webtest-20260414`

当前已经积累过的截图目录包括：

- `artifacts/ipad-check`
- `artifacts/playback-recheck`
- `artifacts/listen-image-recheck`
- `artifacts/look-word-recheck`
- `artifacts/letter-drag-check`
- `artifacts/match-finish-check`

## 当前已知待继续优化点

1. 听字母拖拽手感和视觉仍在继续收口
2. 看图选词版式仍然偏空，需要再压缩比例
3. 口语类题型（口答 / 跟读 / 图文跟读）仍偏“录音台”
4. 图片连线可以继续增加更明显的成功反馈
5. 播放浮层与结束动画已经增强，但如果参考 GSAP Showcase 级别，还可以继续拉大幅度

## 建议的后续优先级

1. 收口 `listen_choose_letter`
2. 收口 `look_choose_word`
3. 改造 `listen_answer_question / read_aloud / read_sentence_with_image`
4. 增强 `match_image_word`
5. 继续统一全站学生端成功反馈与入场动画
