Component({
  data: {
    currentPath: '',
    tabList: [
      { pagePath: '/pages/index/index', text: '遇见' },
      { pagePath: '/pages/add/add', text: '记录' },
      { pagePath: '/pages/my/my', text: '我的' }
    ]
  },

  attached: function () {
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    if (currentPage && currentPage.route) {
      this.setData({
        currentPath: '/' + currentPage.route
      })
    }
  },

  methods: {
    switchTab: function (e) {
      const path = e.currentTarget.dataset.path
      if (path === this.data.currentPath) return
      wx.switchTab({ url: path })
    }
  }
})