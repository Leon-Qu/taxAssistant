// index.js
Page({
  data: {
    // 页面数据
  },
  
  gotoTaxCalculatorPage() {
    wx.switchTab({
      url: '/pages/tax-calculator/index',
    })
  },
});
