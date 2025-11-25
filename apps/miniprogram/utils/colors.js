const settings = require('./settings.js')
const COLOR_MAP = {
  '😀': '#FFF3BF',
  '🙂': '#FFE8A3',
  '😐': '#E9EDF1',
  '🙁': '#FFD6D6',
  '😭': '#FFC7DB',
  '😡': '#FFB3B3',
  '🤩': '#E6D4FF',
  '😴': '#DDECFD',
  '🧘': '#DFF6EA',
  '🤒': '#E0F0F0',
  '🤗': '#FFE3CF',
  '🤯': '#EAD6FF',
  '🤤': '#E5F7D7'
}

function bgColorFor(mood) {
  if (!mood) return ''
  let map = null
  try { map = (settings.getSettings && settings.getSettings().colorMap) || COLOR_MAP } catch(e) { map = COLOR_MAP }
  const c = map[mood]
  return c || ''
}

function getColorMap() {
  try {
    const m = settings.getSettings().colorMap
    return Object.assign({}, m)
  } catch(e) {
    return Object.assign({}, COLOR_MAP)
  }
}

module.exports = { bgColorFor, getColorMap }
