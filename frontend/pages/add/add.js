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

  onLoad: function () {
    this.getLocation()
  },

  onShow: function () {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        currentPath: '/pages/add/add'
      })
    }
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
        // 接收录音页返回的声音数据
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
      },
      fail: () => {
        wx.showToast({ title: '定位失败，请手动输入', icon: 'none' })
      }
    })
  },

  getLocation: function () {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        wx.chooseLocation({
          latitude: res.latitude,
          longitude: res.longitude,
          success: (loc) => {
            this.setData({
              location: {
                name: loc.name,
                address: loc.address,
                latitude: loc.latitude,
                longitude: loc.longitude
              }
            })
          }
        })
      },
      fail: () => {
        console.log('自动定位失败')
      }
    })
  },

  inputNotes: function (e) {
    this.setData({ notes: e.detail.value })
  },

  saveCat: async function () {
    const { nickname, photos, sounds, coatColors, personalities, location } = this.data

    // 表单校验
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

    wx.showLoading({ title: '上传照片...', mask: true })

    try {
      // 1. 上传所有照片到后端
      const uploadedPhotos = []
      for (const photo of photos) {
        if (photo.url.startsWith('http://') || photo.url.startsWith('https://')) {
          // 已有完整 URL 的直接使用
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

      // 2. 上传音频（如果有）
      const uploadedSounds = []
      for (const sound of sounds) {
        if (sound.url.startsWith('http://') || sound.url.startsWith('https://')) {
          uploadedSounds.push(sound)
        } else if (sound.url) {
          const result = await api.uploadFile(sound.url, 'sound', {
            duration: String(sound.duration || 0),
            desc: sound.desc || ''
          })
          uploadedSounds.push(result)
        }
      }

      // 3. 构建提交数据
      wx.showLoading({ title: '保存档案...', mask: true })
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

      const res = await api.createCat(catData)
      wx.hideLoading()
      wx.showToast({ title: '档案建立成功', icon: 'success', duration: 2000 })

      setTimeout(() => {
        wx.navigateTo({
          url: `/pages/detail/detail?id=${res.data.id}`
        })
      }, 1500)
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: err.message || '保存失败', icon: 'none' })
    }
  },

  onUnload: function () {
    if (this.innerAudio) this.innerAudio.destroy()
  }
})