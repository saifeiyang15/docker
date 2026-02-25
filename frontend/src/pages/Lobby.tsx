import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gameAPI, friendGameAPI } from '../services/api';
import { getUser, logout } from '../utils/auth';
import { GameRoom } from '../types';
import '../styles/Lobby.css';

const Lobby: React.FC = () => {
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFriendModal, setShowFriendModal] = useState(false);
  const [friendRoomCode, setFriendRoomCode] = useState('');
  const [roomName, setRoomName] = useState('');
  const navigate = useNavigate();
  const user = getUser();

  useEffect(() => {
    loadRooms();
    const interval = setInterval(loadRooms, 4000);
    return () => clearInterval(interval);
  }, []);

  const loadRooms = async () => {
    try {
      const data = await gameAPI.getAvailableRooms();
      setRooms(data);
    } catch (err) {
      console.error('Failed to load rooms:', err);
    }
  };

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      alert('请输入房间名称');
      return;
    }
    try {
      const room = await gameAPI.createRoom(roomName, user.id);
      navigate(`/game/${room.roomCode}`);
    } catch (err) {
      alert('创建房间失败');
    }
  };

  const handleJoinRoom = async (roomCode: string) => {
    try {
      await gameAPI.joinRoom(roomCode);
      navigate(`/game/${roomCode}`);
    } catch (err: any) {
      alert(err.response?.data?.error || '加入房间失败');
    }
  };

  const handleCreateFriendGame = async () => {
    try {
      const gameState = await friendGameAPI.createGame(user.id, user.nickname || user.username);
      navigate(`/friend-game/${gameState.roomCode}`);
    } catch (err) {
      alert('创建好友房间失败');
    }
  };

  const handleJoinFriendGame = async () => {
    if (!friendRoomCode.trim()) {
      alert('请输入房间号');
      return;
    }
    try {
      await friendGameAPI.joinGame(friendRoomCode.trim().toUpperCase(), user.id, user.nickname || user.username);
      navigate(`/friend-game/${friendRoomCode.trim().toUpperCase()}`);
    } catch (err: any) {
      alert(err.response?.data?.error || '加入好友房间失败');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="lobby-container">
      <div className="lobby-header">
        <h1>飞行棋游戏大厅</h1>
        <div className="user-info">
          <span>欢迎，{user?.nickname || user?.username}</span>
          <button onClick={handleLogout} className="logout-btn">退出</button>
        </div>
      </div>

      <div className="lobby-content">
        <div className="actions">
          <button onClick={() => navigate('/single-player')} className="single-player-btn">
            单人游戏
          </button>
          <button onClick={handleCreateFriendGame} className="friend-create-btn">
            好友对战
          </button>
          <button onClick={() => setShowFriendModal(true)} className="friend-join-btn">
            加入好友
          </button>
          <button onClick={() => navigate('/game-config')} className="config-btn">
            游戏配置
          </button>
          <button onClick={() => setShowCreateModal(true)} className="create-btn">
            创建房间
          </button>
          <button onClick={() => navigate('/templates')} className="template-btn">
            模板管理
          </button>
          <button onClick={loadRooms} className="refresh-btn">
            刷新列表
          </button>
        </div>

        <div className="rooms-list">
          <h2>可用房间</h2>
          {rooms.length === 0 ? (
            <p className="no-rooms">暂无可用房间</p>
          ) : (
            <div className="rooms-grid">
              {rooms.map((room) => (
                <div key={room.id} className="room-card">
                  <h3>{room.roomName}</h3>
                  <p>房间号：{room.roomCode}</p>
                  <p>玩家：{room.currentPlayers}/{room.maxPlayers}</p>
                  <div className="room-actions">
                    <button
                      onClick={() => handleJoinRoom(room.roomCode)}
                      disabled={room.currentPlayers >= room.maxPlayers}
                      className="join-btn"
                    >
                      {room.currentPlayers >= room.maxPlayers ? '房间已满' : '加入房间'}
                    </button>
                    {room.maxPlayers === 2 && room.currentPlayers < room.maxPlayers && (
                      <button
                        onClick={() => navigate(`/two-player/${room.roomCode}`)}
                        className="two-player-btn"
                      >
                        两人对战
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showFriendModal && (
        <div className="modal-overlay" onClick={() => setShowFriendModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>加入好友房间</h2>
            <p style={{ color: '#666', marginBottom: '16px', fontSize: '14px' }}>
              输入好友分享的房间号，一起开始甜蜜冒险吧～ 💕
            </p>
            <input
              type="text"
              placeholder="输入房间号（如：ABC123）"
              value={friendRoomCode}
              onChange={(e) => setFriendRoomCode(e.target.value.toUpperCase())}
              className="room-name-input"
              maxLength={6}
              style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '18px', fontWeight: 700 }}
            />
            <div className="modal-actions">
              <button onClick={handleJoinFriendGame} className="confirm-btn">加入</button>
              <button onClick={() => setShowFriendModal(false)} className="cancel-btn">取消</button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>创建房间</h2>
            <input
              type="text"
              placeholder="输入房间名称"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="room-name-input"
            />
            <div className="modal-actions">
              <button onClick={handleCreateRoom} className="confirm-btn">创建</button>
              <button onClick={() => setShowCreateModal(false)} className="cancel-btn">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lobby;
