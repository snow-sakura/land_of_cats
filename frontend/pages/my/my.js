import api from '../../utils/api'

Page({
  data: {
    loggedIn: false,
    userInfo: {},
    catStats: { total: 0, photos: 0, sounds: 0 }
  },

  onShow: function () {
    // 更新 tab 高亮
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        currentPath: '/pages/my/my'
      })
    }
    this.checkLogin()
  },

  checkLogin: function () {
    if (!api.hasToken()) {
      this.setData({ loggedIn: false, userInfo: {}, catStats: { total: 0, photos: 0, sounds: 0 } })
      return
    }

    const that = this
    api.getUserProfile().then(res => {
      that.setData({
        loggedIn: true,
        userInfo: res.data
      })
      // 同时加载统计数据
      return api.getCatList()
    }).then(res => {
      const cats = res.data || []
      let photos = 0
      let sounds = 0
      cats.forEach(c => {
        photos += (c.photos || []).length
        sounds += (c.sounds || []).length
      })
      that.setData({
        catStats: { total: cats.length, photos, sounds }
      })
    }).catch(err => {
      // token 无效时清除
      if (err.code === 401) {
        api.clearToken()
        this.setData({ loggedIn: false, userInfo: {} })
      }
      console.error('获取用户信息失败:', err)
    })
  },

  goToLogin: function () {
    wx.navigateTo({ url: '/pages/login/login' })
  },

  goToMyCats: function () {
    wx.switchTab({ url: '/pages/index/index' })
  },

  bindPhone: function () {
    wx.showToast({ title: '手机号绑定功能开发中', icon: 'none' })
  },

  goToAbout: function () {
    wx.showModal({
      title: '关于',
      content: '流浪猫足迹 v1.0.0\n\n帮助记录每一只遇见的猫咪，让流浪猫也有自己的档案。',
      showCancel: false,
      confirmColor: '#FF9A6B'
    })
  },

  logout: function () {
    const that = this
    wx.showModal({
      title: '确认退出',
      content: '确定要退出当前账号吗？',
      confirmColor: '#FF7B7B',
      success: (res) => {
        if (res.confirm) {
          api.clearToken()
          that.setData({ loggedIn: false, userInfo: {}, catStats: { total: 0, photos: 0, sounds: 0 } })
          wx.showToast({ title: '已退出登录', icon: 'success' })
        }
      }
    })
  }
})
