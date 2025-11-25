const settings = require('../../utils/settings.js')

Page({
  data: {
    theme: 'light'
  },
  onShow() {
    try {
      const s = settings.getSettings()
      const theme = s.theme || 'light'
      this.setData({ theme })
      try { wx.setNavigationBarColor({ frontColor: theme === 'dark' ? '#ffffff' : '#000000', backgroundColor: theme === 'dark' ? '#0f0f0f' : '#ffffff' }) } catch(e) {}
    } catch(e) {}
  }
})
