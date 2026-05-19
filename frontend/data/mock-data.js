export const mockCats = [
  {
    id: 'cat_001',
    nickname: '橘子',
    createTime: '2026-05-16T10:30:00+08:00',
    updateTime: '2026-05-16T12:00:00+08:00',
    location: {
      name: '济南泉城公园东门附近',
      address: '山东省济南市历下区泉城公园',
      latitude: 36.66,
      longitude: 117.02
    },
    photos: [
      { id: 'img_001', url: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20orange%20tabby%20cat%20sitting%20in%20park%20sunlight%20warm%20lighting%20soft%20focus&image_size=portrait_4_3', isCover: true },
      { id: 'img_002', url: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=orange%20cat%20eating%20food%20outdoor%20garden&image_size=portrait_4_3', isCover: false },
      { id: 'img_003', url: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=orange%20cat%20sleeping%20on%20bench%20peaceful&image_size=portrait_4_3', isCover: false }
    ],
    sounds: [
      { id: 'snd_001', url: '', duration: 3.5, desc: '温柔的喵喵' }
    ],
    attributes: {
      coatColors: ['橘色'],
      hairLength: '短毛',
      bodyType: '偏胖',
      specialFeatures: '尾巴尖白色',
      eyeColor: '黄色',
      healthStatus: '健康',
      healthNote: '',
      personalities: ['亲人', '贪吃'],
      relationships: '经常独自出现'
    },
    notes: '每天下午都会出现在长椅下面。'
  },
  {
    id: 'cat_002',
    nickname: '小黑',
    createTime: '2026-05-14T09:15:00+08:00',
    updateTime: '2026-05-15T16:30:00+08:00',
    location: {
      name: '山东大学中心校区',
      address: '山东省济南市历下区山大南路27号',
      latitude: 36.668,
      longitude: 117.035
    },
    photos: [
      { id: 'img_004', url: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=beautiful%20black%20cat%20with%20yellow%20eyes%20elegant%20mysterious&image_size=portrait_4_3', isCover: true },
      { id: 'img_005', url: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=black%20cat%20walking%20on%20campus%20path%20autumn&image_size=portrait_4_3', isCover: false }
    ],
    sounds: [],
    attributes: {
      coatColors: ['纯黑'],
      hairLength: '短毛',
      bodyType: '正常',
      specialFeatures: '左耳缺角',
      eyeColor: '黄色',
      healthStatus: '健康',
      healthNote: '',
      personalities: ['警惕', '安静'],
      relationships: '有时和一只橘猫在一起'
    },
    notes: '非常警觉，不容易接近。'
  },
  {
    id: 'cat_003',
    nickname: '花花',
    createTime: '2026-05-10T14:00:00+08:00',
    updateTime: '2026-05-10T14:00:00+08:00',
    location: {
      name: '千佛山景区',
      address: '山东省济南市历下区经十一路18号',
      latitude: 36.645,
      longitude: 117.042
    },
    photos: [
      { id: 'img_006', url: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=calico%20cat%20tricolor%20beautiful%20fluffy%20sitting%20on%20rock&image_size=portrait_4_3', isCover: true }
    ],
    sounds: [
      { id: 'snd_002', url: '', duration: 2.8, desc: '洪亮的叫声' }
    ],
    attributes: {
      coatColors: ['三花'],
      hairLength: '长毛',
      bodyType: '正常',
      specialFeatures: '戴红色项圈',
      eyeColor: '绿色',
      healthStatus: '已绝育',
      healthNote: '',
      personalities: ['亲人', '话痨'],
      relationships: ''
    },
    notes: '很亲人，会主动蹭人。'
  }
]

export const formatDaysAgo = (dateStr) => {
  const now = new Date()
  const past = new Date(dateStr)
  const diff = Math.floor((now - past) / (1000 * 60 * 60 * 24))
  
  if (diff === 0) return '今天遇见'
  if (diff === 1) return '昨天遇见'
  if (diff < 7) return `${diff}天前遇见`
  if (diff < 30) return `${Math.floor(diff / 7)}周前遇见`
  return `${Math.floor(diff / 30)}月前遇见`
}

export const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}