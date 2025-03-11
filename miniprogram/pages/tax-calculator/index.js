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
      spouse1: {
        monthlyIncome: 0,
        socialInsurance: 0,
        otherDeductions: 0,
        annualBonus: 0,
        specialDeductions: {
          childrenEducation: 0,
          continuingEducation: 0,
          housingRent: 0,
          elderlySupport: 0
        }
      },
      spouse2: {
        monthlyIncome: 0,
        socialInsurance: 0,
        otherDeductions: 0,
        annualBonus: 0,
        specialDeductions: {
          childrenEducation: 0,
          continuingEducation: 0,
          housingRent: 0,
          elderlySupport: 0
        }
      },
      // 共享扣除项
      sharedDeductions: {
        housingLoan: 0, // 住房贷款利息
        childcare: 0 // 婴幼儿照护
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
        spouse1Tax: 0, // 配偶1应纳税额
        spouse2Tax: 0, // 配偶2应纳税额
        totalTax: 0, // 家庭总纳税额
        optimalRatio: 0.5, // 最优分配比例
        taxSaving: 0 // 节税金额
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
        this.setData({
          [`familyInfo.spouse${spouse}.specialDeductions.${subfield}`]: value
        });
      } else {
        // 更新普通字段
        this.setData({
          [`familyInfo.spouse${spouse}.${field}`]: value
        });
      }
    }
  },

  /**
   * 计算个人所得税
   */
  calculatePersonalTax: function() {
    const { monthlyIncome, socialInsurance, otherDeductions, annualBonus, specialDeductions } = this.data.personalInfo;
    
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
    
    // 计算年度累计应纳税额（假设12个月收入相同）
    const annualTax = taxResult.tax * 12;
    
    // 更新结果
    this.setData({
      'result.personal': {
        taxableIncome: taxableIncome.toFixed(2),
        tax: taxResult.tax.toFixed(2),
        rate: (taxResult.rate * 100).toFixed(0),
        annualTax: annualTax.toFixed(2)
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
    const { spouse1, spouse2, sharedDeductions } = this.data.familyInfo;
    
    // 计算各自的专项附加扣除总额
    const totalSpecialDeduction1 = Object.values(spouse1.specialDeductions).reduce((sum, value) => sum + value, 0);
    const totalSpecialDeduction2 = Object.values(spouse2.specialDeductions).reduce((sum, value) => sum + value, 0);
    
    // 构建计算所需的配偶信息对象
    const spouse1Info = {
      monthlyIncome: spouse1.monthlyIncome,
      socialInsurance: spouse1.socialInsurance,
      specialDeduction: totalSpecialDeduction1,
      otherDeduction: spouse1.otherDeductions
    };
    
    const spouse2Info = {
      monthlyIncome: spouse2.monthlyIncome,
      socialInsurance: spouse2.socialInsurance,
      specialDeduction: totalSpecialDeduction2,
      otherDeduction: spouse2.otherDeductions
    };
    
    // 计算最优分配方案
    const familyResult = taxCalculator.calculateOptimalFamilyDeduction(
      spouse1Info,
      spouse2Info,
      sharedDeductions
    );
    
    // 计算各自应纳税额
    const spouse1TaxableIncome = taxCalculator.calculateTaxableIncome(
      spouse1.monthlyIncome,
      spouse1.socialInsurance,
      totalSpecialDeduction1 + familyResult.spouse1Deduction,
      spouse1.otherDeductions
    );
    
    const spouse2TaxableIncome = taxCalculator.calculateTaxableIncome(
      spouse2.monthlyIncome,
      spouse2.socialInsurance,
      totalSpecialDeduction2 + familyResult.spouse2Deduction,
      spouse2.otherDeductions
    );
    
    const spouse1Tax = taxCalculator.calculateTax(spouse1TaxableIncome).tax;
    const spouse2Tax = taxCalculator.calculateTax(spouse2TaxableIncome).tax;
    
    // 更新结果
    this.setData({
      'result.family': {
        spouse1Tax: spouse1Tax.toFixed(2),
        spouse2Tax: spouse2Tax.toFixed(2),
        totalTax: (spouse1Tax + spouse2Tax).toFixed(2),
        optimalRatio: (familyResult.optimalRatio * 100).toFixed(0),
        taxSaving: familyResult.taxSaving.toFixed(2)
      },
      isSubmitted: true
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
          spouse1: {
            monthlyIncome: 0,
            socialInsurance: 0,
            otherDeductions: 0,
            annualBonus: 0,
            specialDeductions: {
              childrenEducation: 0,
              continuingEducation: 0,
              housingRent: 0,
              elderlySupport: 0
            }
          },
          spouse2: {
            monthlyIncome: 0,
            socialInsurance: 0,
            otherDeductions: 0,
            annualBonus: 0,
            specialDeductions: {
              childrenEducation: 0,
              continuingEducation: 0,
              housingRent: 0,
              elderlySupport: 0
            }
          },
          sharedDeductions: {
            housingLoan: 0,
            childcare: 0
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
  }
});