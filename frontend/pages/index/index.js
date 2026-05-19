import { formatDaysAgo } from '../../data/mock-data.js'
import api from '../../utils/api'

Page({
  data: {
    catList: [],
    loading: true
  },

  onLoad: function () {
    this.loadCatList()
  },

  onShow: function () {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        currentPath: '/pages/index/index'
      })
    }
  },

  loadCatList: function () {
    const that = this
    this.setData({ loading: true })
    api.getCatList().then(res => {
      // 补全相对路径为完整 URL（小程序 image 组件不支持相对路径）
      const cats = (res.data || []).map(cat => ({
        ...cat,
        photos: (cat.photos || []).map(p => ({
          ...p,
          url: p.url && !p.url.startsWith('http') ? `http://localhost:3000${p.url}` : p.url
        })),
        sounds: (cat.sounds || []).map(s => ({
          ...s,
          url: s.url && !s.url.startsWith('http') ? `http://localhost:3000${s.url}` : s.url
        }))
      }))
      that.setData({
        catList: cats,
        loading: false
      })
    }).catch(err => {
      console.error('加载猫咪列表失败:', err)
      that.setData({ loading: false })
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
    })
  },

  goToDetail: function (e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  },

  formatDaysAgo: function (dateStr) {
    return formatDaysAgo(dateStr)
  },

  getRandomRotate: function (id) {
    const hash = String(id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return ((hash % 7) - 3) * 0.8
  }
})