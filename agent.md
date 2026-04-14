# 儿童英语测评项目上下文

## 当前需求
这是一个儿童英语测评系统，当前按 4 个页面设计：

1. 已配置卷子页面
2. 新增卷子配置页面
3. 卷子页面
4. 本卷答题情况页面

核心目标：

- 老师配置固定 5 个题型模板
- 学生进入某张卷子后填写信息并答题
- 做完后生成结果，并查看该卷子的答题情况
- 第一版兼容电脑和 iPad
- 学生端页面不能跳回配置页
- 数据正式写入 MySQL

## 当前 5 个题型模板

- 听音选图
- 看图选词
- 拖拽组句
- 单词跟读
- 拼写填空

## 现在已经做了什么

### 前端
项目已经是标准 Vue 工程：

- Vue CLI
- Vue Router
- 题型拆成独立组件
- 支持电脑和 iPad 响应式布局

### 当前页面

#### 1. 已配置卷子页面
支持：

- 搜索卷子名称
- 按题型筛选
- 复制卷子
- 编辑卷子
- 进入卷子页面
- 查看本卷答题情况

#### 2. 新增卷子配置页面
支持：

- 配置卷子基础信息
- 配置 5 个固定题型
- 保存后写入数据库

#### 3. 卷子页面
支持：

- 学生填写姓名 / 电话 / 年龄 / 年级
- 进入答题流程
- 做完生成当前结果
- 可跳到“本卷答题情况”
- 不暴露配置页入口

#### 4. 本卷答题情况页面
支持：

- 只看当前卷子的答题记录
- 不能切换别的卷子
- 只能按学生姓名 / 手机号筛选

## 后端
已经加了 Node 后端：

- Express
- mysql2
- dotenv
- cors

### 已实现 API

- GET /api/health
- GET /api/papers
- GET /api/papers/:paperId
- POST /api/papers
- PUT /api/papers/:paperId
- DELETE /api/papers/:paperId
- POST /api/papers/:paperId/copy
- GET /api/papers/:paperId/submissions
- POST /api/papers/:paperId/submissions

## 数据库
已建 MySQL 数据库：

- 数据库名：kids_english

已建表：

- papers
- paper_questions
- submissions
- submission_answers
- 视图：vw_paper_summary

## 当前启动方式
在项目根目录执行：

```bash
npm start
```

当前会同时启动：

- 前端 Vue 开发服务
- 后端 API 服务

## 当前项目状态总结
一句话概括：

- 基础产品结构已搭完
- 固定 5 个题型 UI 已有
- MySQL 已接入
- 卷子和答题记录开始走正式数据库
- 还没做更深的生产化细节，例如参数校验、分页、鉴权、真实语音评分接口

## 建议下一步
优先级建议：

1. 给保存卷子 / 提交答卷加参数校验和错误提示
2. 给“本卷答题情况”页加分页
3. 接入真实音频生成 / 图片生成 / 语音评分接口
4. 增加登录、权限、老师端账号体系
