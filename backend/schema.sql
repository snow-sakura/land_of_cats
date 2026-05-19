-- 流浪猫足迹 · 数据库建表脚本
-- 使用方法: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS stray_cats
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE stray_cats;

-- 猫咪档案主表
CREATE TABLE IF NOT EXISTS cat_profiles (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  openid      VARCHAR(64)  NOT NULL COMMENT '微信用户标识，用于数据隔离',
  nickname    VARCHAR(20)  NOT NULL COMMENT '猫咪昵称',
  create_time DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '首次遇见时间',
  update_time DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
  -- 位置信息
  location_name    VARCHAR(255)  DEFAULT '' COMMENT '地点名称',
  location_address VARCHAR(255)  DEFAULT '' COMMENT '详细地址',
  latitude         DECIMAL(10,7) DEFAULT 0 COMMENT '纬度',
  longitude        DECIMAL(10,7) DEFAULT 0 COMMENT '经度',
  -- 外貌特征
  coat_colors     JSON        DEFAULT NULL COMMENT '毛色数组，如 ["橘色","白色"]',
  hair_length     VARCHAR(20) DEFAULT '' COMMENT '毛长',
  body_type       VARCHAR(20) DEFAULT '' COMMENT '体型',
  special_features VARCHAR(50) DEFAULT '' COMMENT '显著特征',
  eye_color       VARCHAR(20) DEFAULT '' COMMENT '眼部颜色',
  -- 健康状态
  health_status   VARCHAR(30) DEFAULT '' COMMENT '健康状况',
  health_note     VARCHAR(100) DEFAULT '' COMMENT '健康备注',
  -- 性格行为
  personalities   JSON        DEFAULT NULL COMMENT '性格标签数组',
  relationships   VARCHAR(100) DEFAULT '' COMMENT '与其他猫关系',
  -- 其他
  notes           TEXT        DEFAULT NULL COMMENT '备注故事',
  INDEX idx_openid (openid),
  INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='猫咪档案表';

-- 猫咪照片表
CREATE TABLE IF NOT EXISTS cat_photos (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  cat_id   INT          NOT NULL COMMENT '关联 cat_profiles.id',
  file_id  VARCHAR(255) NOT NULL COMMENT '文件唯一标识',
  url      VARCHAR(500) NOT NULL COMMENT '文件访问 URL',
  is_cover TINYINT(1)   DEFAULT 0 COMMENT '是否为封面',
  FOREIGN KEY (cat_id) REFERENCES cat_profiles(id) ON DELETE CASCADE,
  INDEX idx_cat_id (cat_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='猫咪照片表';

-- 猫咪音频表
CREATE TABLE IF NOT EXISTS cat_sounds (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  cat_id      INT          NOT NULL COMMENT '关联 cat_profiles.id',
  file_id     VARCHAR(255) DEFAULT '' COMMENT '文件标识',
  url         VARCHAR(500) DEFAULT '' COMMENT '文件访问 URL',
  duration    DECIMAL(5,1) DEFAULT 0 COMMENT '音频时长(秒)',
  description VARCHAR(50)  DEFAULT '' COMMENT '叫声描述',
  FOREIGN KEY (cat_id) REFERENCES cat_profiles(id) ON DELETE CASCADE,
  INDEX idx_cat_id (cat_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='猫咪音频表';

-- 管理后台用户表
CREATE TABLE IF NOT EXISTS admin_users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL UNIQUE COMMENT '管理员用户名',
  password_hash VARCHAR(255) NOT NULL COMMENT 'bcrypt 加密密码',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理后台用户表';
