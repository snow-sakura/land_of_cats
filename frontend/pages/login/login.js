import api from '../../utils/api'

Page({
  data: {
    loginTab: 0,      // 0=微信 1=手机 2=密码
    wxLoading: false,
    smsLoading: false,
    pwdLoading: false,
    // 手机登录
    phone: '',
    smsCode: '',
    codeSending: false,
    codeCountdown: 0,
    // 密码登录
    username: '',
    password: '',
    showPassword: false
  },

  /** 切换登录方式 */
  switchTab: function (e) {
    this.setData({ loginTab: parseInt(e.currentTarget.dataset.tab) })
  },

  // ---- 微信登录 ----
  handleWxLogin: function () {
    const that = this
    this.setData({ wxLoading: true })
    wx.login({
      success: (res) => {
        const code = res.code || 'mock_' + Date.now()
        api.wxLogin({ code }).then(res => {
          api.saveToken(res.data.token)
          wx.showToast({ title: '登录成功', icon: 'success' })
          that.setData({ wxLoading: false })
          setTimeout(() => wx.navigateBack(), 1500)
        }).catch(err => {
          that.setData({ wxLoading: false })
          wx.showToast({ title: err.message || '登录失败', icon: 'none' })
        })
      },
      fail: () => {
        // wx.login 失败时用 mock
        api.wxLogin({ code: 'mock_' + Date.now() }).then(res => {
          api.saveToken(res.data.token)
          wx.showToast({ title: '登录成功', icon: 'success' })
          that.setData({ wxLoading: false })
          setTimeout(() => wx.navigateBack(), 1500)
        }).catch(err => {
          that.setData({ wxLoading: false })
          wx.showToast({ title: err.message || '登录失败', icon: 'none' })
        })
      }
    })
  },

  // ---- 手机登录 ----
  inputPhone: function (e) {
    this.setData({ phone: e.detail.value })
  },

  inputSmsCode: function (e) {
    this.setData({ smsCode: e.detail.value })
  },

  sendSmsCode: function () {
    const phone = this.data.phone
    if (!/^1\d{10}$/.test(phone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }

    this.setData({ codeSending: true })
    const that = this
    api.sendSmsCode({ phone }).then(res => {
      wx.showToast({ title: '验证码已发送（测试环境: 666666）', icon: 'none', duration: 3000 })
      // 倒计时
      that.setData({ codeCountdown: 60, codeSending: false })
      const timer = setInterval(() => {
        if (that.data.codeCountdown <= 1) {
          clearInterval(timer)
          that.setData({ codeCountdown: 0 })
        } else {
          that.setData({ codeCountdown: that.data.codeCountdown - 1 })
        }
      }, 1000)
    }).catch(err => {
      that.setData({ codeSending: false })
      wx.showToast({ title: err.message || '发送失败', icon: 'none' })
    })
  },

  handleSmsLogin: function () {
    const { phone, smsCode } = this.data
    if (!/^1\d{10}$/.test(phone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }
    if (!smsCode || smsCode.length < 4) {
      wx.showToast({ title: '请输入验证码', icon: 'none' })
      return
    }

    this.setData({ smsLoading: true })
    const that = this
    api.smsLogin({ phone, code: smsCode }).then(res => {
      api.saveToken(res.data.token)
      wx.showToast({ title: '登录成功', icon: 'success' })
      that.setData({ smsLoading: false })
      setTimeout(() => wx.navigateBack(), 1500)
    }).catch(err => {
      that.setData({ smsLoading: false })
      wx.showToast({ title: err.message || '登录失败', icon: 'none' })
    })
  },

  // ---- 密码登录 ----
  inputUsername: function (e) {
    this.setData({ username: e.detail.value })
  },

  inputPassword: function (e) {
    this.setData({ password: e.detail.value })
  },

  handlePasswordLogin: function () {
    const { username, password } = this.data
    if (!username.trim()) {
      wx.showToast({ title: '请输入用户名', icon: 'none' })
      return
    }
    if (!password) {
      wx.showToast({ title: '请输入密码', icon: 'none' })
      return
    }

    this.setData({ pwdLoading: true })
    const that = this
    api.login({ username: username.trim(), password }).then(res => {
      api.saveToken(res.data.token)
      wx.showToast({ title: '登录成功', icon: 'success' })
      that.setData({ pwdLoading: false })
      setTimeout(() => wx.navigateBack(), 1500)
    }).catch(err => {
      that.setData({ pwdLoading: false })
      wx.showToast({ title: err.message || '登录失败', icon: 'none' })
    })
  },

  goToRegister: function () {
    wx.navigateTo({ url: '/pages/register/register' })
  }
})
