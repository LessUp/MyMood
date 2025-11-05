const dateUtil = require('../../utils/date.js')
const storage = require('../../utils/storage.js')
const colors = require('../../utils/colors.js')
const settings = require('../../utils/settings.js')

Page({
  data: {
    year: 0,
    month: 0,
    monthLabel: '',
    days: [],
    pickerVisible: false,
    selectedDateKey: '',
    emojiOptions: ['😀','🙂','😐','🙁','😭','😡','🤩','😴','🧘','🤒','🤗','🤯','🤤'],
    weekHeaders: [],
    weekStart: 1,
    theme: 'light',
    ymValue: ''
  },
  onLoad() {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const s = settings.getSettings()
    const weekStart = s.weekStart
    const monthLabel = dateUtil.monthLabel(year, month)
    const entries = storage.getAllEntries()
    const days = this.buildDays(year, month, entries, weekStart)
    const weekHeaders = dateUtil.weekHeaders(weekStart)
    const emojiOptions = s.emojiOptions && s.emojiOptions.length ? s.emojiOptions : this.data.emojiOptions
    const theme = s.theme || 'light'
    const ymValue = year + '-' + dateUtil.pad(month)
    this.setData({ year, month, monthLabel, days, weekHeaders, weekStart, emojiOptions, theme, ymValue })
  },
  onShow() {
    const s = settings.getSettings()
    const weekStart = s.weekStart
    const weekHeaders = dateUtil.weekHeaders(weekStart)
    const emojiOptions = s.emojiOptions && s.emojiOptions.length ? s.emojiOptions : this.data.emojiOptions
    const theme = s.theme || 'light'
    this.setData({ weekStart, weekHeaders, emojiOptions, theme })
    try {
      wx.setNavigationBarColor({ frontColor: theme === 'dark' ? '#ffffff' : '#000000', backgroundColor: theme === 'dark' ? '#0f0f0f' : '#ffffff' })
    } catch(e) {}
    if (this.data.year && this.data.month) this.refresh()
  },
  applyMonthChange(year, month, extra = {}) {
    if (!year || !month) return
    const entries = storage.getAllEntries()
    const days = this.buildDays(year, month, entries, this.data.weekStart)
    const update = Object.assign({
      year,
      month,
      monthLabel: dateUtil.monthLabel(year, month),
      ymValue: year + '-' + dateUtil.pad(month),
      days
    }, extra)
    this.setData(update)
  },
  buildDays(year, month, entries, weekStart) {
    const base = dateUtil.buildMonthGrid(year, month, weekStart)
    for (let i = 0; i < base.length; i++) {
      const d = base[i]
      const e = entries[d.dateKey] || null
      d.mood = e && e.mood ? e.mood : ''
      d.note = !!(e && e.note)
      d.bg = d.inMonth ? colors.bgColorFor(d.mood) : ''
    }
    return base
  },
  refresh() {
    const entries = storage.getAllEntries()
    const days = this.buildDays(this.data.year, this.data.month, entries, this.data.weekStart)
    this.setData({ days })
  },
  onPrevMonth() {
    const p = dateUtil.prevMonth(this.data.year, this.data.month)
    this.applyMonthChange(p.year, p.month)
  },
  onNextMonth() {
    const n = dateUtil.nextMonth(this.data.year, this.data.month)
    this.applyMonthChange(n.year, n.month)
  },
  onMonthPicked(e) {
    const value = e && e.detail && e.detail.value ? e.detail.value : ''
    if (!value) return
    const parts = value.split('-')
    if (parts.length < 2) return
    const year = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10)
    if (!year || !month) return
    this.applyMonthChange(year, month, {
      selectedDateKey: '',
      pickerVisible: false
    })
  },
  onTodayTap() {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const day = now.getDate()
    const key = dateUtil.formatDateKey(year, month, day)
    this.applyMonthChange(year, month, {
      pickerVisible: true,
      selectedDateKey: key
    })
  },
  onDayTap(e) {
    const key = e.currentTarget.dataset.datekey
    const inMonthRaw = e.currentTarget.dataset.inmonth
    const inMonth = inMonthRaw === true || inMonthRaw === 'true'
    if (!inMonth) {
      const d = new Date(key.replace(/-/g, '/'))
      const year = d.getFullYear()
      const month = d.getMonth() + 1
      this.applyMonthChange(year, month)
    }
    this.setData({ pickerVisible: true, selectedDateKey: key })
  },
  onDayLongPress(e) {
    const key = e.currentTarget.dataset.datekey
    wx.navigateTo({ url: '/pages/detail/index?dateKey=' + key })
  },
  onGoDetailFromPicker() {
    const key = this.data.selectedDateKey
    if (key) wx.navigateTo({ url: '/pages/detail/index?dateKey=' + key })
    this.setData({ pickerVisible: false })
  },
  onTouchStart(e) {
    const t = (e && e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0] : null
    this._sx = t ? t.clientX : 0
    this._st = Date.now()
  },
  onTouchEnd(e) {
    const t = (e && e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0] : null
    if (!t) return
    const dx = t.clientX - (this._sx || 0)
    const dt = Date.now() - (this._st || 0)
    if (Math.abs(dx) > 60 && dt < 600) {
      if (dx < 0) this.onNextMonth()
      else this.onPrevMonth()
    }
  },
  goSettings() {
    wx.navigateTo({ url: '/pages/settings/index' })
  },
  goStats() {
    wx.navigateTo({ url: '/pages/stats/index' })
  },
  goSearch() {
    wx.navigateTo({ url: '/pages/search/index' })
  },
  onChooseEmoji(e) {
    const mood = e.currentTarget.dataset.mood
    const key = this.data.selectedDateKey
    storage.setMood(key, mood)
    this.setData({ pickerVisible: false })
    this.refresh()
  },
  onClearMood() {
    const key = this.data.selectedDateKey
    storage.setMood(key, '')
    this.setData({ pickerVisible: false })
    this.refresh()
  },
  onMaskTap() {
    this.setData({ pickerVisible: false })
  }
})
