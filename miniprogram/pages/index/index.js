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

  /**
   * 用户点击右上角分享给好友
   */
  onShareAppMessage: function() {
    return {
      title: '个人/家庭所得税计算器',
      path: '/pages/index/index',
      imageUrl: '/images/happycat.jpg'
    };
  },

  /**
   * 用户点击右上角分享到朋友圈
   */
  onShareTimeline: function() {
    return {
      title: '个人/家庭所得税计算器',
      query: '',
      imageUrl: '/images/happycat.jpg'
    };
  }
});
