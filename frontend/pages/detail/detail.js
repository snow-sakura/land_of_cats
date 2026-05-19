import { formatDaysAgo } from '../../data/mock-data.js'
import { HAIR_LENGTH, BODY_TYPE, EYE_COLOR, HEALTH_STATUS } from '../../constants/cat-tags.js'
import api from '../../utils/api'

Page({
  data: {
    cat: {
      id: '',
      nickname: '',
      createTime: '',
      updateTime: '',
      location: {},
      photos: [],
      sounds: [],
      attributes: {},
      notes: ''
    },
    currentPhoto: 0,
    playingSound: '',
    markers: [],
    // 可见性标志（在 JS 中计算，WXML 只引用简单布尔值）
    _hasPhotos: false,
    _hasLocationName: false,
    _hasTags: false,
    _hasAppearanceSection: false,
    _hasSpecialFeatures: false,
    _hasEyeColor: false,
    _hasPersonalitySection: false,
    _hasPersonalityTags: false,
    _hasRelationships: false,
    _hasHealthSection: false,
    _hasHealthStatus: false,
    _hasSounds: false,
    _hasMap: false,
    _hasTextAddress: false,
    _hasAddress: false,
    _hasNotes: false
  },

  onLoad: function (options) {
    const id = options.id
    this.loadCatDetail(id)
  },

  loadCatDetail: function (id) {
    const that = this
    wx.showLoading({ title: '加载中...' })
    api.getCatDetail(id).then(res => {
      const cat = res.data
      // 补全相对路径为完整 URL（小程序 image 组件不支持相对路径）
      if (cat.photos) {
        cat.photos = cat.photos.map(p => ({
          ...p,
          url: p.url && !p.url.startsWith('http') ? `http://localhost:3000${p.url}` : p.url
        }))
      }
      if (cat.sounds) {
        cat.sounds = cat.sounds.map(s => ({
          ...s,
          url: s.url && !s.url.startsWith('http') ? `http://localhost:3000${s.url}` : s.url
        }))
      }
      // 只在有位置数据时设置地图标记，避免地图组件请求失败
      const markers = (cat.location && cat.location.longitude) ? [{
        id: 1,
        longitude: cat.location.longitude,
        latitude: cat.location.latitude,
        width: 40,
        height: 40
      }] : []
      // 预计算所有可见性标志，避免 WXML 复杂表达式解析异常
      const flags = that._computeFlags(cat)
      that.setData({ cat, markers, ...flags })
      wx.hideLoading()
    }).catch(err => {
      wx.hideLoading()
      console.error('加载猫咪详情失败:', err)
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
    })
  },

  // 根据实际数据计算各区域可见性
  _computeFlags: function (cat) {
    const attr = cat.attributes || {}
    return {
      _hasPhotos: !!(cat.photos && cat.photos.length > 0),
      _hasLocationName: !!(cat.location && cat.location.name),
      _hasTags: !!((attr.coatColors && attr.coatColors.length > 0) || attr.hairLength || attr.bodyType),
      _hasAppearanceSection: !!(attr.specialFeatures || attr.eyeColor),
      _hasSpecialFeatures: !!attr.specialFeatures,
      _hasEyeColor: !!attr.eyeColor,
      _hasPersonalitySection: !!((attr.personalities && attr.personalities.length > 0) || attr.relationships),
      _hasPersonalityTags: !!(attr.personalities && attr.personalities.length > 0),
      _hasRelationships: !!attr.relationships,
      _hasHealthSection: !!(attr.healthStatus || attr.healthNote),
      _hasHealthStatus: !!attr.healthStatus,
      _hasSounds: !!(cat.sounds && cat.sounds.length > 0),
      _hasMap: !!(cat.location && cat.location.longitude),
      _hasTextAddress: !!(cat.location && cat.location.name && !cat.location.longitude),
      _hasAddress: !!(cat.location && cat.location.address),
      _hasNotes: !!cat.notes
    }
  },

  formatDaysAgo: function (dateStr) {
    if (!dateStr) return ''
    return formatDaysAgo(dateStr)
  },

  formatDuration: function (duration) {
    return (duration || 0).toFixed(1)
  },

  getLabel: function (type, value) {
    const options = {
      hairLength: HAIR_LENGTH,
      bodyType: BODY_TYPE,
      eyeColor: EYE_COLOR,
      healthStatus: HEALTH_STATUS
    }
    const opts = options[type] || []
    const opt = opts.find(o => o.value === value) || {}
    return opt.label || value
  },

  previewPhoto: function (e) {
    const photos = this.data.cat.photos
    if (!photos || photos.length === 0) return
    const index = e.currentTarget.dataset.index
    const urls = photos.map(p => p.url)
    wx.previewImage({
      current: urls[index],
      urls: urls
    })
  },

  playSound: function (e) {
    const url = e.currentTarget.dataset.url
    const id = e.currentTarget.dataset.id

    if (!url) {
      wx.showToast({ title: '暂无音频', icon: 'none' })
      return
    }

    if (this.data.playingSound === id) {
      if (this.innerAudio) this.innerAudio.stop()
      this.setData({ playingSound: '' })
      return
    }

    if (this.innerAudio) this.innerAudio.stop()

    this.innerAudio = wx.createInnerAudioContext()
    // 本地开发时相对路径补全为完整 URL
    this.innerAudio.src = url.startsWith('http') ? url : `http://localhost:3000${url}`
    this.innerAudio.onPlay(() => {
      this.setData({ playingSound: id })
    })
    this.innerAudio.onEnded(() => {
      this.setData({ playingSound: '' })
    })
    this.innerAudio.play()
  },

  openMap: function () {
    const loc = this.data.cat.location
    if (!loc || !loc.longitude) {
      wx.showToast({ title: '暂无位置信息', icon: 'none' })
      return
    }
    wx.openLocation({
      longitude: loc.longitude,
      latitude: loc.latitude,
      name: loc.name || '',
      scale: 18
    })
  },

  goToEdit: function () {
    const id = this.data.cat.id
    if (!id) {
      wx.showToast({ title: '数据未加载', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: `/pages/edit/edit?id=${id}`
    })
  },

  deleteCat: function () {
    const that = this
    wx.showModal({
      title: '确认删除',
      content: '确定删除这只猫咪的所有记录吗？',
      confirmColor: '#FF7B7B',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' })
          api.deleteCat(that.data.cat.id).then(() => {
            wx.hideLoading()
            wx.showToast({ title: '删除成功', icon: 'success' })
            setTimeout(() => wx.navigateBack(), 1500)
          }).catch(err => {
            wx.hideLoading()
            wx.showToast({ title: err.message || '删除失败', icon: 'none' })
          })
        }
      }
    })
  },

  onUnload: function () {
    if (this.innerAudio) this.innerAudio.destroy()
  }
})