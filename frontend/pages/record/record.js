Page({
  data: {
    isRecording: false,
    recordDuration: 0,
    waveData: Array(12).fill(20),
    recordedSounds: [],
    playingSound: '',
    showPermissionTip: false,
    recorderManager: null,
    timer: null,
    uploading: false
  },

  onLoad: function () {
    this.recorderManager = wx.getRecorderManager()

    this.recorderManager.onStart(() => {
      console.log('开始录音')
    })

    this.recorderManager.onStop((res) => {
      console.log('录音结束', res)
      const sound = {
        id: `sound_${Date.now()}`,
        url: res.tempFilePath,
        duration: res.duration / 1000,
        desc: `叫声 ${this.data.recordedSounds.length + 1}`
      }
      this.setData({
        recordedSounds: [...this.data.recordedSounds, sound]
      })
    })

    this.recorderManager.onError((err) => {
      console.error('录音错误', err)
      if (err.errMsg.includes('permission')) {
        this.setData({ showPermissionTip: true })
      }
      this.stopRecording()
    })
  },

  startRecord: function () {
    if (this.data.isRecording) return

    this.setData({
      isRecording: true,
      recordDuration: 0
    })

    this.recorderManager.start({
      duration: 60000,
      sampleRate: 44100,
      numberOfChannels: 1,
      encodeBitRate: 192000,
      format: 'mp3'
    })

    this.timer = setInterval(() => {
      this.setData({
        recordDuration: this.data.recordDuration + 0.1,
        waveData: Array(12).fill(0).map(() => 20 + Math.random() * 60)
      })
    }, 100)
  },

  stopRecord: function () {
    if (!this.data.isRecording) return
    this.stopRecording()
  },

  stopRecording: function () {
    this.setData({ isRecording: false })

    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }

    if (this.data.recordDuration > 0.5) {
      this.recorderManager.stop()
    }

    this.setData({
      waveData: Array(12).fill(20)
    })
  },

  formatDuration: function (seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 10)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`
  },

  playSound: function (e) {
    const url = e.currentTarget.dataset.url
    const id = e.currentTarget.dataset.id

    if (!url) return

    if (this.data.playingSound === id) {
      if (this.innerAudio) this.innerAudio.stop()
      this.setData({ playingSound: '' })
      return
    }

    if (this.innerAudio) this.innerAudio.stop()

    this.innerAudio = wx.createInnerAudioContext()
    this.innerAudio.src = url
    this.innerAudio.onPlay(() => {
      this.setData({ playingSound: id })
    })
    this.innerAudio.onEnded(() => {
      this.setData({ playingSound: '' })
    })
    this.innerAudio.play()
  },

  reRecord: function (e) {
    const id = e.currentTarget.dataset.id
    const sounds = this.data.recordedSounds.filter(s => s.id !== id)
    this.setData({ recordedSounds: sounds })
  },

  deleteSound: function (e) {
    const id = e.currentTarget.dataset.id
    const sounds = this.data.recordedSounds.filter(s => s.id !== id)
    this.setData({ recordedSounds: sounds })
  },

  goBack: function () {
    wx.navigateBack()
  },

  confirmRecord: async function () {
    if (this.data.recordedSounds.length === 0) {
      wx.showToast({ title: '请先录制声音', icon: 'none' })
      return
    }

    // 通过 EventChannel 将录音数据传回调用页面
    const eventChannel = this.getOpenerEventChannel()
    eventChannel.emit('acceptSounds', this.data.recordedSounds)

    wx.showToast({ title: '已保存', icon: 'success' })
    setTimeout(() => wx.navigateBack(), 1000)
  },

  openSettings: function () {
    wx.openSetting({
      success: (res) => {
        if (res.authSetting['scope.record']) {
          this.setData({ showPermissionTip: false })
        }
      }
    })
  },

  onUnload: function () {
    this.stopRecording()
    if (this.innerAudio) this.innerAudio.destroy()
  }
})