const settings = require('./settings.js')

let inited = false
let envIdCache = ''
let openidCache = ''

function initCloud() {
  const s = settings.getSettings()
  if (!s.cloudEnabled) return false
  const envId = s.cloudEnvId || ''
  if (!envId) return false
  if (inited && envIdCache === envId) return true
  if (!wx.cloud) return false
  try { wx.cloud.init({ env: envId, traceUser: true }); inited = true; envIdCache = envId; return true } catch(e) { return false }
}

function getDb() {
  const s = settings.getSettings()
  const envId = s.cloudEnvId || ''
  return wx.cloud.database({ env: envId })
}

async function getOpenId() {
  if (openidCache) return openidCache
  const ok = initCloud()
  if (!ok) throw new Error('cloud not init')
  const res = await wx.cloud.callFunction({ name: 'login' })
  const id = res && res.result && res.result.openid ? res.result.openid : ''
  openidCache = id
  return id
}

module.exports = { initCloud, getDb, getOpenId }
