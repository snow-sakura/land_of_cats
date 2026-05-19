import {
  COAT_COLORS,
  HAIR_LENGTH,
  BODY_TYPE,
  EYE_COLOR,
  HEALTH_STATUS,
  PERSONALITIES
} from '../../constants/cat-tags.js'
import api from '../../utils/api'

Page({
  data: {
    catId: '',
    nickname: '',
    photos: [],
    sounds: [],
    coatColors: [],
    hairLength: '',
    bodyType: '',
    specialFeatures: '',
    eyeColor: '',
    healthStatus: '',
    healthNote: '',
    personalities: [],
    relationships: '',
    location: {
      name: '',
      address: '',
      latitude: 0,
      longitude: 0
    },
    notes: '',
    playingSound: '',

    coatColorsOptions: COAT_COLORS,
    hairLengthOptions: HAIR_LENGTH,
    bodyTypeOptions: BODY_TYPE,
    eyeColorOptions: EYE_COLOR,
    healthStatusOptions: HEALTH_STATUS,
    personalitiesOptions: PERSONALITIES
  },

  onLoad: function (options) {
    const id = options.id
    this.loadCatData(id)
  },

  loadCatData: function (id) {
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
      that.setData({
        catId: id,
        nickname: cat.nickname,
        photos: cat.photos || [],
        sounds: cat.sounds || [],
        coatColors: cat.attributes?.coatColors || [],
        hairLength: cat.attributes?.hairLength || '',
        bodyType: cat.attributes?.bodyType || '',
        specialFeatures: cat.attributes?.specialFeatures || '',
        eyeColor: cat.attributes?.eyeColor || '',
        healthStatus: cat.attributes?.healthStatus || '',
        healthNote: cat.attributes?.healthNote || '',
        personalities: cat.attributes?.personalities || [],
        relationships: cat.attributes?.relationships || '',
        location: cat.location || { name: '', address: '', latitude: 0, longitude: 0 },
        notes: cat.notes || ''
      })
      wx.hideLoading()
    }).catch(err => {
      wx.hideLoading()
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
    })
  },

  inputNickname: function (e) {
    this.setData({ nickname: e.detail.value })
  },

  choosePhoto: function () {
    wx.chooseMedia({
      count: 9 - this.data.photos.length,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newPhotos = res.tempFiles.map((file, index) => ({
          id: `img_${Date.now()}_${index}`,
          url: file.tempFilePath,
          isCover: this.data.photos.length === 0
        }))
        this.setData({
          photos: [...this.data.photos, ...newPhotos]
        })
      }
    })
  },

  previewPhoto: function (e) {
    const index = e.currentTarget.dataset.index
    const urls = this.data.photos.map(p => p.url)
    wx.previewImage({
      current: urls[index],
      urls: urls
    })
  },

  deletePhoto: function (e) {
    const index = e.currentTarget.dataset.index
    const photos = this.data.photos.filter((_, i) => i !== index)
    if (photos.length > 0 && !photos.find(p => p.isCover)) {
      photos[0].isCover = true
    }
    this.setData({ photos })
  },

  goToRecord: function () {
    const that = this
    wx.navigateTo({
      url: '/pages/record/record',
      events: {
        acceptSounds: function (sounds) {
          that.setData({
            sounds: [...that.data.sounds, ...sounds]
          })
        }
      }
    })
  },

  playSound: function (e) {
    const url = e.currentTarget.dataset.url
    const id = e.currentTarget.dataset.id
    if (!url) {
      wx.showToast({ title: '暂无音频', icon: 'none' })
      return
    }
    // 点击同一个音频则停止播放
    if (this.data.playingSound === id) {
      if (this.innerAudio) this.innerAudio.stop()
      this.setData({ playingSound: '' })
      return
    }
    if (this.innerAudio) this.innerAudio.stop()
    this.innerAudio = wx.createInnerAudioContext()
    this.innerAudio.src = url.startsWith('http') ? url : `http://localhost:3000${url}`
    this.innerAudio.onPlay(() => {
      this.setData({ playingSound: id })
    })
    this.innerAudio.onEnded(() => {
      this.setData({ playingSound: '' })
    })
    this.innerAudio.play()
  },

  deleteSound: function (e) {
    const id = e.currentTarget.dataset.id
    this.setData({
      sounds: this.data.sounds.filter(s => s.id !== id)
    })
  },

  toggleCoatColor: function (e) {
    const value = e.currentTarget.dataset.value
    const coatColors = this.data.coatColors.includes(value)
      ? this.data.coatColors.filter(c => c !== value)
      : [...this.data.coatColors, value]
    this.setData({ coatColors })
  },

  selectHairLength: function (e) {
    this.setData({ hairLength: e.currentTarget.dataset.value })
  },

  selectBodyType: function (e) {
    this.setData({ bodyType: e.currentTarget.dataset.value })
  },

  inputSpecialFeatures: function (e) {
    this.setData({ specialFeatures: e.detail.value })
  },

  selectEyeColor: function (e) {
    this.setData({ eyeColor: e.currentTarget.dataset.value })
  },

  selectHealthStatus: function (e) {
    this.setData({ healthStatus: e.currentTarget.dataset.value })
  },

  inputHealthNote: function (e) {
    this.setData({ healthNote: e.detail.value })
  },

  togglePersonality: function (e) {
    const value = e.currentTarget.dataset.value
    const personalities = this.data.personalities.includes(value)
      ? this.data.personalities.filter(p => p !== value)
      : [...this.data.personalities, value]
    this.setData({ personalities })
  },

  inputRelationships: function (e) {
    this.setData({ relationships: e.detail.value })
  },

  chooseLocation: function () {
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          location: {
            name: res.name,
            address: res.address,
            latitude: res.latitude,
            longitude: res.longitude
          }
        })
      }
    })
  },

  inputNotes: function (e) {
    this.setData({ notes: e.detail.value })
  },

  saveCat: async function () {
    const { catId, nickname, photos, sounds, coatColors, personalities, location } = this.data

    if (!nickname.trim()) {
      wx.showToast({ title: '请输入猫咪昵称', icon: 'none' })
      return
    }
    if (photos.length === 0) {
      wx.showToast({ title: '请至少添加一张照片', icon: 'none' })
      return
    }
    if (coatColors.length === 0) {
      wx.showToast({ title: '请选择毛色', icon: 'none' })
      return
    }
    if (personalities.length === 0) {
      wx.showToast({ title: '请选择至少一个性格标签', icon: 'none' })
      return
    }
    if (!location.name) {
      wx.showToast({ title: '请选择遇见地点', icon: 'none' })
      return
    }

    wx.showLoading({ title: '保存中...', mask: true })

    try {
      // 1. 上传新增的照片
      const uploadedPhotos = []
      for (const photo of photos) {
        if (photo.url.startsWith('/uploads/') || photo.url.startsWith('http://') || photo.url.startsWith('https://')) {
          uploadedPhotos.push(photo)
        } else {
          const result = await api.uploadFile(photo.url, 'photo')
          uploadedPhotos.push({
            id: result.id,
            url: result.url,
            isCover: uploadedPhotos.length === 0
          })
        }
      }

      // 2. 上传新增的音频
      const uploadedSounds = []
      for (const sound of sounds) {
        if (sound.url.startsWith('/uploads/') || sound.url.startsWith('http://') || sound.url.startsWith('https://')) {
          uploadedSounds.push(sound)
        } else if (sound.url) {
          const result = await api.uploadFile(sound.url, 'sound', {
            duration: String(sound.duration || 0),
            desc: sound.desc || ''
          })
          uploadedSounds.push(result)
        }
      }

      // 3. 提交更新
      wx.showLoading({ title: '保存修改...', mask: true })
      const catData = {
        nickname,
        location,
        photos: uploadedPhotos,
        sounds: uploadedSounds,
        attributes: {
          coatColors,
          hairLength: this.data.hairLength,
          bodyType: this.data.bodyType,
          specialFeatures: this.data.specialFeatures,
          eyeColor: this.data.eyeColor,
          healthStatus: this.data.healthStatus,
          healthNote: this.data.healthNote,
          personalities,
          relationships: this.data.relationships
        },
        notes: this.data.notes
      }

      await api.updateCat(catId, catData)
      wx.hideLoading()
      wx.showToast({ title: '修改成功', icon: 'success', duration: 2000 })
      setTimeout(() => wx.navigateBack(), 1500)
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: err.message || '保存失败', icon: 'none' })
    }
  },

  onUnload: function () {
    if (this.innerAudio) this.innerAudio.destroy()
  }
})