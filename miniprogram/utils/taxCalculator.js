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

const BONUS_TAX_RATE_TABLE = [
  { min: 0, max: 3000, rate: 0.03, quickDeduction: 0 },
  { min: 3000, max: 12000, rate: 0.1, quickDeduction: 210 },
  { min: 12000, max: 25000, rate: 0.2, quickDeduction: 1410 },
  { min: 25000, max: 35000, rate: 0.25, quickDeduction: 2660 },
  { min: 35000, max: 55000, rate: 0.3, quickDeduction: 4410 },
  { min: 55000, max: 80000, rate: 0.35, quickDeduction: 7160 },
  { min: 80000, max: Infinity, rate: 0.45, quickDeduction: 15160 }
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

function calculateTaxableIncomeAnnual(income, socialInsurance, specialDeduction, otherDeduction) {
  return Math.max(0, income - socialInsurance - TAX_THRESHOLD * 12 - specialDeduction - otherDeduction);
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
  const tax = (taxableIncome * taxLevel.rate - taxLevel.quickDeduction).toFixed(2);
  
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
  const taxLevel = BONUS_TAX_RATE_TABLE.find(level => monthlyBonus > level.min && monthlyBonus <= level.max);
  
  if (!taxLevel) {
    return { tax: 0, rate: 0, level: null };
  }
  
  // 计算税额 = 年终奖金额 * 适用税率 - 速算扣除数
  const tax = (bonus * taxLevel.rate - taxLevel.quickDeduction).toFixed(2);
  
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
  const { monthlyIncome, socialInsurance, specialDeduction, otherDeduction, annualBonus, otherIncome } = personalInfo;
  
  // 方案1: 年终奖单独计税
  const separateTaxResult = calculateBonusTax(annualBonus);
  
  // 计算常规月度工资的年度累计税额
  let annualRegularTax = 0;
  let annualTaxableIncome = calculateTaxableIncomeAnnual(
    monthlyIncome * months,
    socialInsurance * months,
    specialDeduction * months,
    otherDeduction
  );
  // 再加上年度其他收入减去年度其他扣除
  annualTaxableIncome = annualTaxableIncome + otherIncome;
  const annualTaxResult = calculateTax(annualTaxableIncome);
  annualRegularTax = annualTaxResult.tax;
  
  // 方案1总税额 = 年度常规工资税额 + 年终奖单独计税税额
  const separateTotalTax = annualRegularTax + separateTaxResult.tax;
  
  // 方案2: 年终奖与工资合并计税
  const combinedAnnualIncome = monthlyIncome * months + annualBonus + otherIncome;
  const combinedTaxableIncome = calculateTaxableIncomeAnnual(
    combinedAnnualIncome,
    socialInsurance * months,
    specialDeduction * months,
    otherDeduction
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
function calculateOptimalFamilyDeduction(originalSpouse1, originalSpouse2, sharedDeductions) {
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


  // 生成所有组合
  // 定义每个变量的可能取值
  const values = [0, 0.5, 1];
  const variableCount = 4;

  // 使用函数式方法生成所有组合
  const generateCombinations = () => {
    return Array(variableCount).fill(values).reduce((acc, currentValues) => {
      return acc.flatMap(combination => 
        currentValues.map(value => [...combination, value])
      );
    }, [[]]);
  };
  const allCombinations = generateCombinations();

  let optimalTotalTaxResult = Number.MAX_SAFE_INTEGER;
  // 计算每个组合的总扣除额并得到最优解
  let bestCombination = [0,0,0,0];
  for (const combination of allCombinations) {
    // 本人每月共享扣除
    const spouse1Deduction = combination[0] * housingLoan + combination[1] * childcare + combination[2] * childrenEducation + combination[3] * housingRent;
    // 配偶每月共享扣除
    const spouse2Deduction = totalSharedDeduction - spouse1Deduction;

    console.log(`组合: ${combination}`);
    console.log(`本人每月共享扣除: ${spouse1Deduction}`);
    console.log(`配偶每月共享扣除: ${spouse2Deduction}`);

    // 计算本人年度累计应纳税额（使用累进计税方式）,不考虑年终奖，加上共享部分分配到的
    const originalTaxableIncome1 = calculateAnnualTax(
      originalSpouse1.monthlyIncome,
      originalSpouse1.socialInsurance,
      originalSpouse1.specialDeduction + spouse1Deduction,
      originalSpouse1.otherDeduction,
      12,
      originalSpouse1.otherIncome
    );
    
    // 计算配偶年度累计应纳税额（使用累进计税方式）,不考虑年终奖，加上共享部分分配到的

    // 计算本人年终奖单独计税税额
    const spouse1SeparateTaxResult = calculateBonusTax(originalSpouse1.annualBonus);
    // 计算本人年度纳税，不含年终奖
    const spouse1OriginalTax1 = originalTaxableIncome1.tax;
    // 本人年终奖单独计税总税额
    const spouse1SeparateTaxTotalResult = spouse1OriginalTax1 + spouse1SeparateTaxResult.tax;

    // 方案2: 年终奖与工资合并计税
    // 本人年终奖合并计税总税额
    const spouse1CombinedAnnualIncome = originalSpouse1.monthlyIncome * 12 + originalSpouse1.annualBonus + originalSpouse1.otherIncome;
    const spouse1CombinedTaxableIncome = calculateTaxableIncomeAnnual(
      spouse1CombinedAnnualIncome,
      originalSpouse1.socialInsurance * 12,
      (originalSpouse1.specialDeduction + spouse1Deduction) * 12,
      originalSpouse1.otherDeduction
    );
    const spouse1CombineTaxTotalResult = calculateTax(spouse1CombinedTaxableIncome).tax;
    
    //本人最佳方案
    const spouse1OptimalTax = Math.min(spouse1SeparateTaxTotalResult, spouse1CombineTaxTotalResult);

    console.log(`本人年度累计应纳税额（使用累进计税方式）: ${originalTaxableIncome1.tax}`);
    console.log(`本人年终奖单独计税总税额: ${spouse1SeparateTaxTotalResult}`);
    console.log(`本人年终奖合并计税总税额: ${spouse1CombineTaxTotalResult}`);
    console.log(`本人最佳方案: ${spouse1OptimalTax}`);
 

    // 计算配偶年度累计应纳税额（使用累进计税方式）,不考虑年终奖，加上共享部分分配到的
    const originalTaxableIncome2 = calculateAnnualTax(
      originalSpouse2.monthlyIncome,
      originalSpouse2.socialInsurance,
      originalSpouse2.specialDeduction + spouse2Deduction,
      originalSpouse2.otherDeduction,
      12,
      originalSpouse2.otherIncome
    );

    // 配偶年终奖单独计税
    const spouse2SeparateTaxResult = calculateBonusTax(originalSpouse2.annualBonus);
    // 计算配偶年度纳税，不含年终奖
    const spouse2OriginalTax1 = originalTaxableIncome2.tax;
    // 配偶年终奖单独计税总税额
    const spouse2SeparateTaxTotalResult = spouse2OriginalTax1 + spouse2SeparateTaxResult.tax;
    // 方案2: 年终奖与工资合并计税
    // 配偶年终奖合并计税总税额
    const spouse2CombinedAnnualIncome = originalSpouse2.monthlyIncome * 12 + originalSpouse2.annualBonus + originalSpouse2.otherIncome;
    const spouse2CombinedTaxableIncome = calculateTaxableIncomeAnnual(
      spouse2CombinedAnnualIncome,
      originalSpouse2.socialInsurance * 12,
      (originalSpouse2.specialDeduction + spouse2Deduction) * 12,
      originalSpouse2.otherDeduction
    );
    const spouse2CombineTaxTotalResult = calculateTax(spouse2CombinedTaxableIncome).tax;
    // 配偶最佳方案
    const spouse2OptimalTax = Math.min(spouse2SeparateTaxTotalResult, spouse2CombineTaxTotalResult);

    console.log(`配偶年度累计应纳税额（使用累进计税方式）: ${originalTaxableIncome2.tax}`);
    console.log(`配偶年终奖单独计税总税额: ${spouse2SeparateTaxTotalResult}`);
    console.log(`配偶年终奖合并计税总税额: ${spouse2CombineTaxTotalResult}`);
    console.log(`配偶最佳方案: ${spouse2OptimalTax}`);

    // 当前分配方案
    const originalTotalTax = spouse1OptimalTax + spouse2OptimalTax;
    console.log(`当前分配方案总税额：${originalTotalTax}`);
    
    if (originalTotalTax < optimalTotalTaxResult) {
      optimalTotalTaxResult = originalTotalTax;
      bestCombination = combination;
      console.log(`当前分配方案最组合：${bestCombination}，总税额：${optimalTotalTaxResult}`);
    }
  }

  console.log(`分配方案最组合：${bestCombination}，总税额：${optimalTotalTaxResult}`);
  const spouse1Deduction = housingLoan * bestCombination[0] + childcare * bestCombination[1] + childrenEducation * bestCombination[2] + housingRent * bestCombination[3];
  const spouse2Deduction = totalSharedDeduction - spouse1Deduction;
  
  return {
    spouse1Deduction: spouse1Deduction,
    spouse2Deduction: spouse2Deduction,
    taxSaving: 0,
    originalTax: 0,
    optimalTax: optimalTotalTaxResult,
    optimalRatio: bestCombination
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
  const annualOtherDeduction = otherDeduction;
  
  // 计算年度累计应纳税所得额
  const annualTaxableIncome = calculateTaxableIncomeAnnual(
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
  calculateTaxableIncomeAnnual,
  calculateTax,
  calculateBonusTax,
  calculateOptimalBonusPlan,
  calculateOptimalFamilyDeduction,
  calculateAnnualTax,
  TAX_THRESHOLD,
  TAX_RATE_TABLE,
  BONUS_TAX_RATE_TABLE
};