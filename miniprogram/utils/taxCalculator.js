/**
 * 个人所得税计算工具类
 */

// 个税起征点
const TAX_THRESHOLD = 5000;

// 个人所得税税率表（2019年起实行）
const TAX_RATE_TABLE = [
  { min: 0, max: 36000, rate: 0.03, quickDeduction: 0 },
  { min: 36000, max: 144000, rate: 0.1, quickDeduction: 2520 },
  { min: 144000, max: 300000, rate: 0.2, quickDeduction: 16920 },
  { min: 300000, max: 420000, rate: 0.25, quickDeduction: 31920 },
  { min: 420000, max: 660000, rate: 0.3, quickDeduction: 52920 },
  { min: 660000, max: 960000, rate: 0.35, quickDeduction: 85920 },
  { min: 960000, max: Infinity, rate: 0.45, quickDeduction: 181920 }
];

/**
 * 计算应纳税所得额
 * @param {number} income - 税前收入
 * @param {number} socialInsurance - 社保公积金
 * @param {number} specialDeduction - 专项附加扣除总额
 * @param {number} otherDeduction - 其他扣除总额
 * @returns {number} 应纳税所得额
 */
function calculateTaxableIncome(income, socialInsurance, specialDeduction, otherDeduction) {
  return Math.max(0, income - socialInsurance - TAX_THRESHOLD - specialDeduction - otherDeduction);
}

/**
 * 计算个人所得税
 * @param {number} taxableIncome - 应纳税所得额
 * @returns {object} 税额和适用税率信息
 */
function calculateTax(taxableIncome) {
  // 查找适用的税率档位
  const taxLevel = TAX_RATE_TABLE.find(level => taxableIncome > level.min && taxableIncome <= level.max);
  
  if (!taxLevel) {
    return { tax: 0, rate: 0, level: null };
  }
  
  // 计算税额 = 应纳税所得额 * 税率 - 速算扣除数
  const tax = taxableIncome * taxLevel.rate - taxLevel.quickDeduction;
  
  return {
    tax: Math.max(0, tax),
    rate: taxLevel.rate,
    level: taxLevel
  };
}

/**
 * 计算年终奖个人所得税（单独计税）
 * @param {number} bonus - 年终奖金额
 * @returns {object} 税额和适用税率信息
 */
function calculateBonusTax(bonus) {
  // 年终奖单独计税时，以年终奖金额 ÷ 12 确定适用税率
  const monthlyBonus = bonus / 12;
  
  // 查找适用的税率档位
  const taxLevel = TAX_RATE_TABLE.find(level => monthlyBonus > level.min && monthlyBonus <= level.max);
  
  if (!taxLevel) {
    return { tax: 0, rate: 0, level: null };
  }
  
  // 计算税额 = 年终奖金额 * 适用税率 - 速算扣除数
  const tax = bonus * taxLevel.rate - taxLevel.quickDeduction;
  
  return {
    tax: Math.max(0, tax),
    rate: taxLevel.rate,
    level: taxLevel
  };
}

/**
 * 计算最优的年终奖纳税方案
 * @param {object} personalInfo - 个人信息
 * @param {number} personalInfo.monthlyIncome - 月度工资收入
 * @param {number} personalInfo.socialInsurance - 社保公积金
 * @param {number} personalInfo.specialDeduction - 专项附加扣除总额
 * @param {number} personalInfo.otherDeduction - 其他扣除总额
 * @param {number} personalInfo.annualBonus - 年终奖金额
 * @param {number} months - 已工作月数
 * @returns {object} 最优方案信息
 */
function calculateOptimalBonusPlan(personalInfo, months = 12) {
  const { monthlyIncome, socialInsurance, specialDeduction, otherDeduction, annualBonus } = personalInfo;
  
  // 方案1: 年终奖单独计税
  const separateTaxResult = calculateBonusTax(annualBonus);
  
  // 计算常规月度工资的年度累计税额
  let annualRegularTax = 0;
  for (let i = 1; i <= months; i++) {
    const monthTaxableIncome = calculateTaxableIncome(
      monthlyIncome * i,
      socialInsurance * i,
      specialDeduction * i,
      otherDeduction * i
    );
    const monthTaxResult = calculateTax(monthTaxableIncome);
    annualRegularTax = monthTaxResult.tax;
  }
  
  // 方案1总税额 = 年度常规工资税额 + 年终奖单独计税税额
  const separateTotalTax = annualRegularTax + separateTaxResult.tax;
  
  // 方案2: 年终奖与工资合并计税
  const combinedAnnualIncome = monthlyIncome * months + annualBonus;
  const combinedTaxableIncome = calculateTaxableIncome(
    combinedAnnualIncome,
    socialInsurance * months,
    specialDeduction * months,
    otherDeduction * months
  );
  const combinedTaxResult = calculateTax(combinedTaxableIncome);
  
  // 比较两种方案
  const isSeperateOptimal = separateTotalTax <= combinedTaxResult.tax;
  
  return {
    separatePlan: {
      tax: separateTotalTax,
      bonusTax: separateTaxResult.tax,
      bonusTaxRate: separateTaxResult.rate,
      regularTax: annualRegularTax
    },
    combinedPlan: {
      tax: combinedTaxResult.tax,
      taxRate: combinedTaxResult.rate
    },
    optimalPlan: isSeperateOptimal ? 'separate' : 'combined',
    taxSaving: isSeperateOptimal ? 
      (combinedTaxResult.tax - separateTotalTax) : 
      (separateTotalTax - combinedTaxResult.tax)
  };
}

/**
 * 计算家庭最优专项附加扣除分配方案
 * @param {object} spouse1 - 配偶1信息
 * @param {object} spouse2 - 配偶2信息
 * @param {object} sharedDeductions - 共享扣除项
 * @returns {object} 最优分配方案
 */
function calculateOptimalFamilyDeduction(spouse1, spouse2, sharedDeductions) {
  const { housingLoan, childcare, childrenEducation, housingRent } = sharedDeductions;
  const totalSharedDeduction = housingLoan + childcare + childrenEducation + housingRent;
  
  // 如果没有共享扣除项，直接返回原方案
  if (totalSharedDeduction === 0) {
    return {
      spouse1Deduction: 0,
      spouse2Deduction: 0,
      taxSaving: 0,
      originalTax: 0,
      optimalTax: 0
    };
  }
  
  // 计算原始税额（假设平均分配）
  const originalSpouse1 = {
    ...spouse1,
    specialDeduction: spouse1.specialDeduction + totalSharedDeduction / 2
  };
  
  const originalSpouse2 = {
    ...spouse2,
    specialDeduction: spouse2.specialDeduction + totalSharedDeduction / 2
  };
  
  const originalTaxableIncome1 = calculateTaxableIncome(
    originalSpouse1.monthlyIncome,
    originalSpouse1.socialInsurance,
    originalSpouse1.specialDeduction,
    originalSpouse1.otherDeduction
  );
  
  const originalTaxableIncome2 = calculateTaxableIncome(
    originalSpouse2.monthlyIncome,
    originalSpouse2.socialInsurance,
    originalSpouse2.specialDeduction,
    originalSpouse2.otherDeduction
  );
  
  const originalTax1 = calculateTax(originalTaxableIncome1).tax;
  const originalTax2 = calculateTax(originalTaxableIncome2).tax;
  const originalTotalTax = originalTax1 + originalTax2;
  
  // 尝试不同的分配比例，找出最优方案
  let optimalRatio = 0.5; // 默认平均分配
  let optimalTotalTax = originalTotalTax;
  
  // 以10%为步长尝试不同分配比例
  for (let ratio = 0; ratio <= 1; ratio += 0.1) {
    const testSpouse1 = {
      ...spouse1,
      specialDeduction: spouse1.specialDeduction + totalSharedDeduction * ratio
    };
    
    const testSpouse2 = {
      ...spouse2,
      specialDeduction: spouse2.specialDeduction + totalSharedDeduction * (1 - ratio)
    };
    
    const testTaxableIncome1 = calculateTaxableIncome(
      testSpouse1.monthlyIncome,
      testSpouse1.socialInsurance,
      testSpouse1.specialDeduction,
      testSpouse1.otherDeduction
    );
    
    const testTaxableIncome2 = calculateTaxableIncome(
      testSpouse2.monthlyIncome,
      testSpouse2.socialInsurance,
      testSpouse2.specialDeduction,
      testSpouse2.otherDeduction
    );
    
    const testTax1 = calculateTax(testTaxableIncome1).tax;
    const testTax2 = calculateTax(testTaxableIncome2).tax;
    const testTotalTax = testTax1 + testTax2;
    
    if (testTotalTax < optimalTotalTax) {
      optimalRatio = ratio;
      optimalTotalTax = testTotalTax;
    }
  }
  
  return {
    spouse1Deduction: totalSharedDeduction * optimalRatio,
    spouse2Deduction: totalSharedDeduction * (1 - optimalRatio),
    taxSaving: originalTotalTax - optimalTotalTax,
    originalTax: originalTotalTax,
    optimalTax: optimalTotalTax,
    optimalRatio: optimalRatio
  };
}

/**
 * 计算年度累计应纳税额
 * @param {number} monthlyIncome - 月度工资收入
 * @param {number} socialInsurance - 月度社保公积金
 * @param {number} specialDeduction - 月度专项附加扣除总额
 * @param {number} otherDeduction - 月度其他扣除总额
 * @param {number} months - 计算月数
 * @param {number} otherIncome - 其他收入(年度)
 * @returns {object} 年度累计税额和适用税率信息
 */
function calculateAnnualTax(monthlyIncome, socialInsurance, specialDeduction, otherDeduction, months = 12, otherIncome = 0) {
  // 计算年度累计收入和扣除
  const annualIncome = monthlyIncome * months;
  const annualSocialInsurance = socialInsurance * months;
  const annualSpecialDeduction = specialDeduction * months;
  const annualOtherDeduction = otherDeduction * months;
  
  // 计算年度累计应纳税所得额
  const annualTaxableIncome = calculateTaxableIncome(
    annualIncome + otherIncome,
    annualSocialInsurance,
    annualSpecialDeduction,
    annualOtherDeduction
  );
  
  // 计算年度累计应纳税额
  return calculateTax(annualTaxableIncome);
}

module.exports = {
  calculateTaxableIncome,
  calculateTax,
  calculateBonusTax,
  calculateOptimalBonusPlan,
  calculateOptimalFamilyDeduction,
  calculateAnnualTax,
  TAX_THRESHOLD,
  TAX_RATE_TABLE
};