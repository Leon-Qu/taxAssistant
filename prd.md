# 个人所得税计算助手 PRD

## 1. 产品概述
个人所得税计算助手是一款帮助中国大陆纳税人快速计算个人所得税的小程序，支持个人模式和家庭模式，能够根据最新的税收政策进行精确计算，帮助纳税人合理规划个税申报方案。

## 2. 功能需求

### 2.1 基础功能
#### 2.1.1 个人模式
- 月度工资收入录入
  - 税前工资金额
  - 社保公积金扣除金额
  - 专项附加扣除金额（子女教育、继续教育、住房贷款利息、住房租金、赡养老人、婴幼儿照护）
  - 其他扣除金额（商业健康保险、税收递延型养老保险等）
  
- 年终奖计算
  - 支持年终奖单独计税
  - 支持年终奖与工资收入合并计税
  - 自动比较两种方案并推荐最优方案

- 计算结果展示
  - 月度应纳税所得额
  - 月度应纳税额
  - 年度累计应纳税额
  - 税率明细说明

#### 2.1.2 家庭模式
- 夫妻双方信息录入
  - 各自工资收入
  - 各自社保公积金扣除
  - 共同专项附加扣除的分配（住房贷款利息、婴幼儿照护）
  - 各自其他专项附加扣除
  
- 家庭税收优化
  - 自动计算最优的专项附加扣除分配方案
  - 显示不同分配方案下的税收对比
  
- 结果展示
  - 夫妻双方各自应纳税额
  - 家庭总纳税额
  - 优化建议

### 2.2 扩展功能
- 历史数据保存
- 计算结果导出
- 税收政策更新提醒
- 常见问题解答

## 3. 技术方案

### 3.1 开发框架
- 前端：React Native
  - 跨平台支持
  - 良好的用户体验
  - 丰富的UI组件

### 3.2 核心模块设计
1. 数据模型
```typescript
// 个人信息模型
interface PersonalInfo {
  monthlyIncome: number;
  socialInsurance: number;
  specialDeductions: SpecialDeductions;
  otherDeductions: number;
  annualBonus?: number;
}

// 专项附加扣除模型
interface SpecialDeductions {
  childrenEducation: number;
  continuingEducation: number;
  housingLoan: number;
  housingRent: number;
  elderlySupport: number;
  childcare: number;
}

// 家庭信息模型
interface FamilyInfo {
  spouse1: PersonalInfo;
  spouse2: PersonalInfo;
  sharedDeductions: SharedDeductions;
}