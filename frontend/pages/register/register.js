import api from '../../utils/api'

Page({
  data: {
    avatarUrl: '',
    nickname: '',
    username: '',
    password: '',
    phone: '',
    showPassword: false,
    loading: false
  },

  chooseAvatar: function () {
    const that = this
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        that.setData({ avatarUrl: res.tempFiles[0].tempFilePath })
      }
    })
  },

  inputNickname: function (e) {
    this.setData({ nickname: e.detail.value })
  },

  inputUsername: function (e) {
    this.setData({ username: e.detail.value })
  },

  inputPassword: function (e) {
    this.setData({ password: e.detail.value })
  },

  inputPhone: function (e) {
    this.setData({ phone: e.detail.value })
  },

  handleRegister: function () {
    const { nickname, username, password, phone } = this.data

    if (!nickname.trim()) {
      wx.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }
    if (!username.trim()) {
      wx.showToast({ title: '请输入用户名', icon: 'none' })
      return
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      wx.showToast({ title: '用户名只能包含字母、数字和下划线', icon: 'none' })
      return
    }
    if (!password || password.length < 6) {
      wx.showToast({ title: '密码至少 6 位', icon: 'none' })
      return
    }
    if (phone && !/^1\d{10}$/.test(phone)) {
      wx.showToast({ title: '手机号格式不正确', icon: 'none' })
      return
    }

    this.setData({ loading: true })
    const data = { nickname: nickname.trim(), username: username.trim(), password }
    if (phone) data.phone = phone

    const that = this
    api.register(data).then(res => {
      api.saveToken(res.data.token)
      wx.showToast({ title: '注册成功', icon: 'success' })
      that.setData({ loading: false })
      setTimeout(() => wx.navigateBack(), 1500)
    }).catch(err => {
      that.setData({ loading: false })
      wx.showToast({ title: err.message || '注册失败', icon: 'none' })
    })
  },

  goToLogin: function () {
    wx.navigateBack()
  }
})
