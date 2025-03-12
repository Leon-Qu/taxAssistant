// pages/tax-calculator/index.js
const taxCalculator = require('../../utils/taxCalculator');

Page({
  data: {
    // 计算模式：personal-个人模式，family-家庭模式
    mode: 'personal',
    // 个人信息
    personalInfo: {
      monthlyIncome: 0, // 月度工资收入
      socialInsurance: 0, // 社保公积金
      otherDeductions: 0, // 其他扣除
      annualBonus: 0, // 年终奖
      otherIncome: 0, // 其他收入(年度)
      // 专项附加扣除
      specialDeductions: {
        childrenEducation: 0, // 子女教育
        continuingEducation: 0, // 继续教育
        housingLoan: 0, // 住房贷款利息
        housingRent: 0, // 住房租金
        elderlySupport: 0, // 赡养老人
        childcare: 0 // 婴幼儿照护
      }
    },
    // 家庭信息
    familyInfo: {
      self: {
        monthlyIncome: 0,
        socialInsurance: 0,
        otherDeductions: 0,
        annualBonus: 0,
        otherIncome: 0, // 其他收入(年度)
        specialDeductions: {
          continuingEducation: 0,
          elderlySupport: 0
        }
      },
      spouse: {
        monthlyIncome: 0,
        socialInsurance: 0,
        otherDeductions: 0,
        annualBonus: 0,
        otherIncome: 0, // 其他收入(年度)
        specialDeductions: {
          continuingEducation: 0,
          elderlySupport: 0
        }
      },
      // 共享扣除项
      sharedDeductions: {
        housingLoan: 0, // 住房贷款利息
        childcare: 0, // 婴幼儿照护
        childrenEducation: 0, // 子女教育
        housingRent: 0 // 住房租金
      }
    },
    // 计算结果
    result: {
      personal: {
        taxableIncome: 0, // 应纳税所得额
        tax: 0, // 应纳税额
        rate: 0, // 适用税率
        annualTax: 0 // 年度累计应纳税额
      },
      bonus: {
        separatePlan: null, // 单独计税方案
        combinedPlan: null, // 合并计税方案
        optimalPlan: '', // 最优方案
        taxSaving: 0 // 节税金额
      },
      family: {
        selfTax: 0, // 本人月度应纳税额
        spouseTax: 0, // 配偶月度应纳税额
        totalTax: 0, // 家庭月度总纳税额
        annualTotalTax: 0, // 家庭年度总纳税额
        optimalRatio: 0.5, // 最优分配比例
        taxSaving: 0, // 节税金额
        bonus: {
          selfBonus: null, // 本人年终奖计算结果
          spouseBonus: null // 配偶年终奖计算结果
        }
      }
    },
    // 表单是否已提交
    isSubmitted: false,
    // 是否显示年终奖计算结果
    showBonusResult: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 页面加载时的初始化逻辑
  },

  /**
   * 切换计算模式
   */
  switchMode: function(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({
      mode: mode,
      isSubmitted: false,
      showBonusResult: false
    });
  },

  /**
   * 输入框数值变化处理函数
   */
  onInputChange: function(e) {
    const { field, subfield } = e.currentTarget.dataset;
    const value = parseFloat(e.detail.value) || 0;
    
    if (this.data.mode === 'personal') {
      if (subfield) {
        // 更新专项附加扣除子字段
        this.setData({
          [`personalInfo.specialDeductions.${subfield}`]: value
        });
      } else {
        // 更新普通字段
        this.setData({
          [`personalInfo.${field}`]: value
        });
      }
    } else {
      // 家庭模式下的字段更新
      const { spouse, shared } = e.currentTarget.dataset;
      
      if (shared) {
        // 更新共享扣除项
        this.setData({
          [`familyInfo.sharedDeductions.${field}`]: value
        });
      } else if (subfield) {
        // 更新专项附加扣除子字段
        const member = spouse === '1' ? 'self' : 'spouse';
        this.setData({
          [`familyInfo.${member}.specialDeductions.${subfield}`]: value
        });
      } else {
        // 更新普通字段
        const member = spouse === '1' ? 'self' : 'spouse';
        this.setData({
          [`familyInfo.${member}.${field}`]: value
        });
      }
    }
  },

  /**
   * 计算个人所得税
   */
  calculatePersonalTax: function() {
    const { monthlyIncome, socialInsurance, otherDeductions, annualBonus, otherIncome, specialDeductions } = this.data.personalInfo;
    
    // 计算专项附加扣除总额
    const totalSpecialDeduction = Object.values(specialDeductions).reduce((sum, value) => sum + value, 0);
    
    // 计算应纳税所得额
    const taxableIncome = taxCalculator.calculateTaxableIncome(
      monthlyIncome,
      socialInsurance,
      totalSpecialDeduction,
      otherDeductions
    );
    
    // 计算应纳税额
    const taxResult = taxCalculator.calculateTax(taxableIncome);
    
    // 计算年度累计应纳税额（使用累进计税方式）
    const annualTaxResult = taxCalculator.calculateAnnualTax(
      monthlyIncome,
      socialInsurance,
      totalSpecialDeduction,
      otherDeductions,
      12,
      otherIncome
    );
    
    // 更新结果
    this.setData({
      'result.personal': {
        taxableIncome: taxableIncome.toFixed(2),
        tax: taxResult.tax.toFixed(2),
        rate: (taxResult.rate * 100).toFixed(0),
        annualTax: annualTaxResult.tax.toFixed(2)
      },
      isSubmitted: true
    });
    
    // 如果有年终奖，计算最优方案
    if (annualBonus > 0) {
      this.calculateBonusTax();
    } else {
      this.setData({
        showBonusResult: false
      });
    }
  },

  /**
   * 计算年终奖最优方案
   */
  calculateBonusTax: function() {
    const { personalInfo } = this.data;
    const totalSpecialDeduction = Object.values(personalInfo.specialDeductions).reduce((sum, value) => sum + value, 0);
    
    // 构建计算所需的个人信息对象
    const info = {
      monthlyIncome: personalInfo.monthlyIncome,
      socialInsurance: personalInfo.socialInsurance,
      specialDeduction: totalSpecialDeduction,
      otherDeduction: personalInfo.otherDeductions,
      annualBonus: personalInfo.annualBonus
    };
    
    // 计算最优方案
    const bonusResult = taxCalculator.calculateOptimalBonusPlan(info);
    
    // 更新结果
    this.setData({
      'result.bonus': {
        separatePlan: {
          tax: bonusResult.separatePlan.tax.toFixed(2),
          bonusTax: bonusResult.separatePlan.bonusTax.toFixed(2),
          bonusTaxRate: (bonusResult.separatePlan.bonusTaxRate * 100).toFixed(0),
          regularTax: bonusResult.separatePlan.regularTax.toFixed(2)
        },
        combinedPlan: {
          tax: bonusResult.combinedPlan.tax.toFixed(2),
          taxRate: (bonusResult.combinedPlan.taxRate * 100).toFixed(0)
        },
        optimalPlan: bonusResult.optimalPlan,
        taxSaving: bonusResult.taxSaving.toFixed(2)
      },
      showBonusResult: true
    });
  },

  /**
   * 计算家庭最优方案
   */
  calculateFamilyTax: function() {
    const { self, spouse, sharedDeductions } = this.data.familyInfo;
    
    // 计算各自的专项附加扣除总额
    const totalSpecialDeductionSelf = Object.values(self.specialDeductions).reduce((sum, value) => sum + value, 0);
    const totalSpecialDeductionSpouse = Object.values(spouse.specialDeductions).reduce((sum, value) => sum + value, 0);
    
    // 构建计算所需的本人和配偶信息对象
    const selfInfo = {
      monthlyIncome: self.monthlyIncome,
      socialInsurance: self.socialInsurance,
      specialDeduction: totalSpecialDeductionSelf,
      otherDeduction: self.otherDeductions,
      otherIncome: self.otherIncome
    };
    
    const spouseInfo = {
      monthlyIncome: spouse.monthlyIncome,
      socialInsurance: spouse.socialInsurance,
      specialDeduction: totalSpecialDeductionSpouse,
      otherDeduction: spouse.otherDeductions,
      otherIncome: spouse.otherIncome
    };
    
    // 计算最优分配方案
    const familyResult = taxCalculator.calculateOptimalFamilyDeduction(
      selfInfo,
      spouseInfo,
      sharedDeductions
    );
    
    // 计算各自应纳税额
    const selfTaxableIncome = taxCalculator.calculateTaxableIncome(
      self.monthlyIncome,
      self.socialInsurance,
      totalSpecialDeductionSelf + familyResult.spouse1Deduction,
      self.otherDeductions
    );
    
    const spouseTaxableIncome = taxCalculator.calculateTaxableIncome(
      spouse.monthlyIncome,
      spouse.socialInsurance,
      totalSpecialDeductionSpouse + familyResult.spouse2Deduction,
      spouse.otherDeductions
    );
    
    const selfTax = taxCalculator.calculateTax(selfTaxableIncome).tax;
    const spouseTax = taxCalculator.calculateTax(spouseTaxableIncome).tax;
    const totalTax = selfTax + spouseTax;
    const annualTotalTax = totalTax * 12;
    
    // 更新结果
    this.setData({
      'result.family': {
        selfTax: selfTax.toFixed(2),
        spouseTax: spouseTax.toFixed(2),
        totalTax: totalTax.toFixed(2),
        annualTotalTax: annualTotalTax.toFixed(2),
        optimalRatio: (familyResult.optimalRatio * 100).toFixed(0),
        taxSaving: familyResult.taxSaving.toFixed(2),
        bonus: {
          selfBonus: null,
          spouseBonus: null
        }
      },
      isSubmitted: true
    });
    
    // 如果有年终奖，计算最优方案
    if (self.annualBonus > 0 || spouse.annualBonus > 0) {
      this.calculateFamilyBonusTax();
    }
  },
  
  /**
   * 计算家庭年终奖最优方案
   */
  calculateFamilyBonusTax: function() {
    const { self, spouse } = this.data.familyInfo;
    const result = this.data.result.family;
    
    // 计算本人专项附加扣除总额
    const totalSpecialDeductionSelf = Object.values(self.specialDeductions).reduce((sum, value) => sum + value, 0);
    
    // 计算配偶专项附加扣除总额
    const totalSpecialDeductionSpouse = Object.values(spouse.specialDeductions).reduce((sum, value) => sum + value, 0);
    
    // 计算本人年终奖
    if (self.annualBonus > 0) {
      const selfInfo = {
        monthlyIncome: self.monthlyIncome,
        socialInsurance: self.socialInsurance,
        specialDeduction: totalSpecialDeductionSelf,
        otherDeduction: self.otherDeductions,
        annualBonus: self.annualBonus
      };
      
      const selfBonusResult = taxCalculator.calculateOptimalBonusPlan(selfInfo);
      
      this.setData({
        'result.family.bonus.selfBonus': {
          separatePlan: {
            tax: selfBonusResult.separatePlan.tax.toFixed(2),
            bonusTax: selfBonusResult.separatePlan.bonusTax.toFixed(2),
            bonusTaxRate: (selfBonusResult.separatePlan.bonusTaxRate * 100).toFixed(0),
            regularTax: selfBonusResult.separatePlan.regularTax.toFixed(2)
          },
          combinedPlan: {
            tax: selfBonusResult.combinedPlan.tax.toFixed(2),
            taxRate: (selfBonusResult.combinedPlan.taxRate * 100).toFixed(0)
          },
          optimalPlan: selfBonusResult.optimalPlan,
          taxSaving: selfBonusResult.taxSaving.toFixed(2)
        }
      });
    }
    
    // 计算配偶年终奖
    if (spouse.annualBonus > 0) {
      const spouseInfo = {
        monthlyIncome: spouse.monthlyIncome,
        socialInsurance: spouse.socialInsurance,
        specialDeduction: totalSpecialDeductionSpouse,
        otherDeduction: spouse.otherDeductions,
        annualBonus: spouse.annualBonus
      };
      
      const spouseBonusResult = taxCalculator.calculateOptimalBonusPlan(spouseInfo);
      
      this.setData({
        'result.family.bonus.spouseBonus': {
          separatePlan: {
            tax: spouseBonusResult.separatePlan.tax.toFixed(2),
            bonusTax: spouseBonusResult.separatePlan.bonusTax.toFixed(2),
            bonusTaxRate: (spouseBonusResult.separatePlan.bonusTaxRate * 100).toFixed(0),
            regularTax: spouseBonusResult.separatePlan.regularTax.toFixed(2)
          },
          combinedPlan: {
            tax: spouseBonusResult.combinedPlan.tax.toFixed(2),
            taxRate: (spouseBonusResult.combinedPlan.taxRate * 100).toFixed(0)
          },
          optimalPlan: spouseBonusResult.optimalPlan,
          taxSaving: spouseBonusResult.taxSaving.toFixed(2)
        }
      });
    }
    
    this.setData({
      showBonusResult: true
    });
  },

  /**
   * 提交表单计算税额
   */
  submitForm: function() {
    if (this.data.mode === 'personal') {
      this.calculatePersonalTax();
    } else {
      this.calculateFamilyTax();
    }
  },

  /**
   * 重置表单
   */
  resetForm: function() {
    if (this.data.mode === 'personal') {
      this.setData({
        personalInfo: {
          monthlyIncome: 0,
          socialInsurance: 0,
          otherDeductions: 0,
          annualBonus: 0,
          otherIncome: 0,
          specialDeductions: {
            childrenEducation: 0,
            continuingEducation: 0,
            housingLoan: 0,
            housingRent: 0,
            elderlySupport: 0,
            childcare: 0
          }
        },
        isSubmitted: false,
        showBonusResult: false
      });
    } else {
      this.setData({
        familyInfo: {
          self: {
            monthlyIncome: 0,
            socialInsurance: 0,
            otherDeductions: 0,
            annualBonus: 0,
            otherIncome: 0,
            specialDeductions: {
              continuingEducation: 0,
              elderlySupport: 0
            }
          },
          spouse: {
            monthlyIncome: 0,
            socialInsurance: 0,
            otherDeductions: 0,
            annualBonus: 0,
            otherIncome: 0,
            specialDeductions: {
              continuingEducation: 0,
              elderlySupport: 0
            }
          },
          sharedDeductions: {
            housingLoan: 0,
            childcare: 0,
            childrenEducation: 0,
            housingRent: 0
          }
        },
        isSubmitted: false
      });
    }
  },

  /**
   * 保存历史记录
   */
  saveHistory: function() {
    // 获取当前时间作为记录ID
    const recordId = Date.now().toString();
    const currentDate = new Date().toLocaleDateString();
    
    // 构建历史记录对象
    const historyRecord = {
      id: recordId,
      date: currentDate,
      mode: this.data.mode,
      data: this.data.mode === 'personal' ? this.data.personalInfo : this.data.familyInfo,
      result: this.data.mode === 'personal' ? this.data.result.personal : this.data.result.family
    };
    
    // 获取现有历史记录
    let historyRecords = wx.getStorageSync('taxCalculatorHistory') || [];
    
    // 添加新记录
    historyRecords.unshift(historyRecord);
    
    // 限制历史记录数量，最多保存10条
    if (historyRecords.length > 10) {
      historyRecords = historyRecords.slice(0, 10);
    }
    
    // 保存到本地存储
    wx.setStorageSync('taxCalculatorHistory', historyRecords);
    
    wx.showToast({
      title: '已保存',
      icon: 'success',
      duration: 2000
    });
  },

  /**
   * 显示其他扣除项说明
   */
  showOtherDeductionsInfo: function() {
    wx.showModal({
      title: '其他扣除项说明',
      content: '其他扣除项包括：\n\n1. 捐赠支出：个人通过公益性社会组织或县级以上人民政府及其部门等国家机关，向教育、扶贫、救灾等公益慈善事业的捐赠支出，可以按照税法规定在计算应纳税所得额时扣除。\n\n2. 生育津贴：符合国家计划生育政策生育的，可以享受生育津贴，该部分收入可以在计算个人所得税时扣除。\n\n3. 商业健康保险：购买符合规定的商业健康保险产品的支出，可以按照规定在计算应纳税所得额时扣除。\n\n4. 税收递延型养老保险：个人购买符合规定的商业养老保险产品的支出，可以按照规定在一定标准内税前扣除。',
      showCancel: false,
      confirmText: '我知道了'
    });
  }
});