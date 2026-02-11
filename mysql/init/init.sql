CREATE DATABASE IF NOT EXISTS flight_chess CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE flight_chess;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    nickname VARCHAR(50),
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 游戏房间表
CREATE TABLE IF NOT EXISTS game_rooms (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    room_code VARCHAR(20) NOT NULL UNIQUE,
    room_name VARCHAR(100) NOT NULL,
    max_players INT DEFAULT 4,
    current_players INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'WAITING',
    creator_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id),
    INDEX idx_room_code (room_code),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 游戏记录表
CREATE TABLE IF NOT EXISTS game_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    room_id BIGINT NOT NULL,
    winner_id BIGINT,
    player_ids JSON,
    game_duration INT,
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES game_rooms(id),
    FOREIGN KEY (winner_id) REFERENCES users(id),
    INDEX idx_room_id (room_id),
    INDEX idx_winner_id (winner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 玩家统计表
CREATE TABLE IF NOT EXISTS player_statistics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    total_games INT DEFAULT 0,
    wins INT DEFAULT 0,
    losses INT DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0.00,
    total_play_time INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入测试用户
-- BCrypt hash for password: "password"
INSERT INTO users (username, password, email, nickname) VALUES 
('admin', '$2a$10$sguC1MHi/jlFOyI5GpvGjehjdHs/Vw5pr.kQGtVq.aPKW.LLexOZG', 'admin@example.com', '管理员'),
('player1', '$2a$10$sguC1MHi/jlFOyI5GpvGjehjdHs/Vw5pr.kQGtVq.aPKW.LLexOZG', 'player1@example.com', '玩家1'),
('player2', '$2a$10$sguC1MHi/jlFOyI5GpvGjehjdHs/Vw5pr.kQGtVq.aPKW.LLexOZG', 'player2@example.com', '玩家2');
