const pool = require('./db')

/**
 * 将 MySQL 行数据（snake_case）转换为前端期望的嵌套 camelCase 格式
 */
function toFrontendFormat(row) {
  return {
    id: row.id,
    nickname: row.nickname || '',
    createTime: row.create_time,
    updateTime: row.update_time,
    location: {
      name: row.location_name || '',
      address: row.location_address || '',
      latitude: Number(row.latitude) || 0,
      longitude: Number(row.longitude) || 0
    },
    attributes: {
      coatColors: parseJSONArray(row.coat_colors),
      hairLength: row.hair_length || '',
      bodyType: row.body_type || '',
      specialFeatures: row.special_features || '',
      eyeColor: row.eye_color || '',
      healthStatus: row.health_status || '',
      healthNote: row.health_note || '',
      personalities: parseJSONArray(row.personalities),
      relationships: row.relationships || ''
    },
    notes: row.notes || '',
    photos: [],
    sounds: []
  }
}

function parseJSONArray(val) {
  if (!val) return []
  try {
    const parsed = typeof val === 'string' ? JSON.parse(val) : val
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const catModel = {
  /**
   * 获取用户的所有猫咪列表，按创建时间倒序
   */
  async listByUser(openid) {
    const [rows] = await pool.query(
      'SELECT * FROM cat_profiles WHERE openid = ? OR openid = ? ORDER BY create_time DESC',
      [openid, 'admin']
    )
    const result = []
    for (const row of rows) {
      const cat = toFrontendFormat(row)
      cat.photos = await this.getPhotos(row.id)
      cat.sounds = await this.getSounds(row.id)
      result.push(cat)
    }
    return result
  },

  /**
   * 按 ID 获取单只猫咪详情
   */
  async getById(id, openid) {
    const [rows] = await pool.query(
      'SELECT * FROM cat_profiles WHERE id = ? AND (openid = ? OR openid = ?)',
      [id, openid, 'admin']
    )
    if (rows.length === 0) return null
    const row = rows[0]
    const cat = toFrontendFormat(row)
    cat.photos = await this.getPhotos(row.id)
    cat.sounds = await this.getSounds(row.id)
    return cat
  },

  /**
   * 创建猫咪档案
   */
  async create(data, openid) {
    const { nickname, location, photos, sounds, attributes, notes } = data
    const now = new Date()

    // 插入主表
    const [result] = await pool.query(
      `INSERT INTO cat_profiles
       (openid, nickname, create_time, update_time,
        location_name, location_address, latitude, longitude,
        coat_colors, hair_length, body_type, special_features, eye_color,
        health_status, health_note, personalities, relationships, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        openid, nickname || '', now, now,
        location?.name || '', location?.address || '',
        location?.latitude || 0, location?.longitude || 0,
        JSON.stringify(attributes?.coatColors || []),
        attributes?.hairLength || '', attributes?.bodyType || '',
        attributes?.specialFeatures || '', attributes?.eyeColor || '',
        attributes?.healthStatus || '', attributes?.healthNote || '',
        JSON.stringify(attributes?.personalities || []),
        attributes?.relationships || '', notes || ''
      ]
    )

    const catId = result.insertId

    // 插入照片
    if (photos && photos.length > 0) {
      await this.insertPhotos(catId, photos)
    }

    // 插入音频
    if (sounds && sounds.length > 0) {
      await this.insertSounds(catId, sounds)
    }

    return catId
  },

  /**
   * 更新猫咪档案
   */
  async update(id, openid, data) {
    const { nickname, location, photos, sounds, attributes, notes } = data
    const now = new Date()

    const [result] = await pool.query(
      `UPDATE cat_profiles SET
        nickname = ?, update_time = ?,
        location_name = ?, location_address = ?, latitude = ?, longitude = ?,
        coat_colors = ?, hair_length = ?, body_type = ?, special_features = ?, eye_color = ?,
        health_status = ?, health_note = ?, personalities = ?, relationships = ?, notes = ?
       WHERE id = ? AND openid = ?`,
      [
        nickname || '', now,
        location?.name || '', location?.address || '',
        location?.latitude || 0, location?.longitude || 0,
        JSON.stringify(attributes?.coatColors || []),
        attributes?.hairLength || '', attributes?.bodyType || '',
        attributes?.specialFeatures || '', attributes?.eyeColor || '',
        attributes?.healthStatus || '', attributes?.healthNote || '',
        JSON.stringify(attributes?.personalities || []),
        attributes?.relationships || '', notes || '',
        id, openid
      ]
    )

    if (result.affectedRows === 0) return null

    // 替换照片（先删后插）
    if (photos) {
      await pool.query('DELETE FROM cat_photos WHERE cat_id = ?', [id])
      if (photos.length > 0) {
        await this.insertPhotos(id, photos)
      }
    }

    // 替换音频
    if (sounds) {
      await pool.query('DELETE FROM cat_sounds WHERE cat_id = ?', [id])
      if (sounds.length > 0) {
        await this.insertSounds(id, sounds)
      }
    }

    return id
  },

  /**
   * 删除猫咪档案（级联删除照片和音频由数据库外键 ON DELETE CASCADE 自动处理）
   */
  async delete(id, openid) {
    // 先查出所有文件信息，供调用方清理物理文件
    const cat = await this.getById(id, openid)
    if (!cat) return null

    await pool.query('DELETE FROM cat_profiles WHERE id = ? AND openid = ?', [id, openid])
    return cat  // 返回删除前的数据，以便清理文件
  },

  // ---- 管理后台方法 ----

  /**
   * 获取所有猫咪列表（不按 openid 过滤）
   */
  async getAll() {
    const [rows] = await pool.query(
      'SELECT cp.*, (SELECT url FROM cat_photos WHERE cat_id = cp.id ORDER BY is_cover DESC LIMIT 1) AS cover_url FROM cat_profiles cp ORDER BY cp.create_time DESC'
    )
    return rows.map(row => ({
      id: row.id,
      nickname: row.nickname || '',
      openid: row.openid,
      createTime: row.create_time,
      updateTime: row.update_time,
      locationName: row.location_name || '',
      locationAddress: row.location_address || '',
      latitude: Number(row.latitude) || 0,
      longitude: Number(row.longitude) || 0,
      coatColors: parseJSONArray(row.coat_colors),
      hairLength: row.hair_length || '',
      bodyType: row.body_type || '',
      specialFeatures: row.special_features || '',
      eyeColor: row.eye_color || '',
      healthStatus: row.health_status || '',
      healthNote: row.health_note || '',
      personalities: parseJSONArray(row.personalities),
      relationships: row.relationships || '',
      notes: row.notes || '',
      coverUrl: row.cover_url || ''
    }))
  },

  /**
   * 按 ID 获取猫咪详情（管理后台，不按 openid 过滤）
   */
  async getByIdAdmin(id) {
    const [rows] = await pool.query('SELECT * FROM cat_profiles WHERE id = ?', [id])
    if (rows.length === 0) return null
    const row = rows[0]
    const cat = toFrontendFormat(row)
    cat.photos = await this.getPhotos(row.id)
    cat.sounds = await this.getSounds(row.id)
    cat.raw = row  // 保留原始字段供管理后台展示
    return cat
  },

  /**
   * 按 ID 删除猫咪（管理后台，不按 openid 过滤）
   */
  async deleteById(id) {
    const [rows] = await pool.query('SELECT * FROM cat_profiles WHERE id = ?', [id])
    if (rows.length === 0) return null
    const cat = toFrontendFormat(rows[0])
    cat.photos = await this.getPhotos(id)
    cat.sounds = await this.getSounds(id)
    await pool.query('DELETE FROM cat_profiles WHERE id = ?', [id])
    return cat
  },

  /**
   * 管理后台更新猫咪（不按 openid 过滤）
   */
  async updateByIdAdmin(id, data) {
    const { nickname, location, photos, sounds, attributes, notes } = data
    const now = new Date()

    const [result] = await pool.query(
      `UPDATE cat_profiles SET
        nickname = ?, update_time = ?,
        location_name = ?, location_address = ?, latitude = ?, longitude = ?,
        coat_colors = ?, hair_length = ?, body_type = ?, special_features = ?, eye_color = ?,
        health_status = ?, health_note = ?, personalities = ?, relationships = ?, notes = ?
       WHERE id = ?`,
      [
        nickname || '', now,
        location?.name || '', location?.address || '',
        location?.latitude || 0, location?.longitude || 0,
        JSON.stringify(attributes?.coatColors || []),
        attributes?.hairLength || '', attributes?.bodyType || '',
        attributes?.specialFeatures || '', attributes?.eyeColor || '',
        attributes?.healthStatus || '', attributes?.healthNote || '',
        JSON.stringify(attributes?.personalities || []),
        attributes?.relationships || '', notes || '',
        id
      ]
    )

    if (result.affectedRows === 0) return null

    // 替换照片（先删后插）
    if (photos) {
      await pool.query('DELETE FROM cat_photos WHERE cat_id = ?', [id])
      if (photos.length > 0) {
        await this.insertPhotos(id, photos)
      }
    }

    // 替换音频
    if (sounds) {
      await pool.query('DELETE FROM cat_sounds WHERE cat_id = ?', [id])
      if (sounds.length > 0) {
        await this.insertSounds(id, sounds)
      }
    }

    return id
  },

  /**
   * 获取所有不重复的 openid
   */
  async getDistinctOpenids() {
    const [rows] = await pool.query('SELECT DISTINCT openid FROM cat_profiles ORDER BY openid')
    return rows.map(r => r.openid)
  },

  /**
   * 获取统计数据
   */
  async getStats() {
    const [[{ totalCats }]] = await pool.query('SELECT COUNT(*) AS totalCats FROM cat_profiles')
    const [[{ totalPhotos }]] = await pool.query('SELECT COUNT(*) AS totalPhotos FROM cat_photos')
    const [[{ totalSounds }]] = await pool.query('SELECT COUNT(*) AS totalSounds FROM cat_sounds')
    const [[{ totalUsers }]] = await pool.query('SELECT COUNT(DISTINCT openid) AS totalUsers FROM cat_profiles')

    const [perUser] = await pool.query(
      'SELECT openid, COUNT(*) AS count FROM cat_profiles GROUP BY openid ORDER BY count DESC'
    )

    const [recentCats] = await pool.query(
      'SELECT id, nickname, openid, create_time FROM cat_profiles ORDER BY create_time DESC LIMIT 10'
    )

    return {
      totalCats,
      totalPhotos,
      totalSounds,
      totalUsers,
      perUser: perUser.map(r => ({ openid: r.openid, count: r.count })),
      recentCats: recentCats.map(r => ({
        id: r.id,
        nickname: r.nickname,
        openid: r.openid,
        createTime: r.create_time
      }))
    }
  },

  // ---- 内部辅助方法 ----

  async getPhotos(catId) {
    const [rows] = await pool.query(
      'SELECT * FROM cat_photos WHERE cat_id = ? ORDER BY is_cover DESC',
      [catId]
    )
    return rows.map(r => ({
      id: r.file_id,
      url: r.url,
      isCover: !!r.is_cover
    }))
  },

  async getSounds(catId) {
    const [rows] = await pool.query(
      'SELECT * FROM cat_sounds WHERE cat_id = ?',
      [catId]
    )
    return rows.map(r => ({
      id: r.file_id,
      url: r.url,
      duration: Number(r.duration) || 0,  // DECIMAL 可能返回字符串，统一转数字
      desc: r.description
    }))
  },

  async insertPhotos(catId, photos) {
    const values = photos.map((p, i) => [
      catId, p.id || `img_${Date.now()}_${i}`, p.url, i === 0 ? 1 : 0
    ])
    await pool.query(
      'INSERT INTO cat_photos (cat_id, file_id, url, is_cover) VALUES ?',
      [values]
    )
  },

  async insertSounds(catId, sounds) {
    const values = sounds.map(s => [
      catId, s.id || `snd_${Date.now()}`, s.url || '',
      s.duration || 0, s.desc || ''
    ])
    await pool.query(
      'INSERT INTO cat_sounds (cat_id, file_id, url, duration, description) VALUES ?',
      [values]
    )
  }
}

module.exports = catModel
