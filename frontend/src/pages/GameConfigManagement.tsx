import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/GameConfigManagement.css';

interface GameTask {
  id?: number;
  title: string;
  description: string;
  position: number;
  type: 'FORWARD' | 'BACKWARD' | 'BONUS' | 'CHALLENGE';
  reward: number;
  timeLimit: number;
  isActive?: boolean;
}

const DEFAULT_TASKS: GameTask[] = [
  { title: '幸运之星', description: '运气爆棚！前进3步', position: 3, type: 'FORWARD', reward: 3, timeLimit: 0, isActive: true },
  { title: '甜蜜告白', description: '对对方说一句最想说的情话', position: 5, type: 'BONUS', reward: 0, timeLimit: 30, isActive: true },
  { title: '倒霉蛋', description: '踩到香蕉皮，后退2步', position: 8, type: 'BACKWARD', reward: 2, timeLimit: 0, isActive: true },
  { title: '比心挑战', description: '两人一起比心拍照留念', position: 10, type: 'CHALLENGE', reward: 0, timeLimit: 20, isActive: true },
  { title: '加速冲刺', description: '一路顺风！前进5步', position: 13, type: 'FORWARD', reward: 5, timeLimit: 0, isActive: true },
  { title: '真心话', description: '回答对方一个真心话问题', position: 16, type: 'BONUS', reward: 0, timeLimit: 60, isActive: true },
  { title: '小惩罚', description: '走错路了，后退3步', position: 19, type: 'BACKWARD', reward: 3, timeLimit: 0, isActive: true },
  { title: '默契考验', description: '两人同时说出对方最喜欢的食物', position: 22, type: 'CHALLENGE', reward: 0, timeLimit: 15, isActive: true },
  { title: '顺风车', description: '搭上顺风车，前进4步', position: 25, type: 'FORWARD', reward: 4, timeLimit: 0, isActive: true },
  { title: '拥抱时刻', description: '给对方一个大大的拥抱', position: 28, type: 'BONUS', reward: 0, timeLimit: 10, isActive: true },
  { title: '迷路了', description: '走错方向，后退4步', position: 31, type: 'BACKWARD', reward: 4, timeLimit: 0, isActive: true },
  { title: '才艺展示', description: '为对方唱一首歌或跳一段舞', position: 34, type: 'CHALLENGE', reward: 0, timeLimit: 60, isActive: true },
  { title: '火箭加速', description: '坐上火箭！前进6步', position: 37, type: 'FORWARD', reward: 6, timeLimit: 0, isActive: true },
  { title: '大冒险', description: '完成对方指定的一个小任务', position: 39, type: 'CHALLENGE', reward: 0, timeLimit: 120, isActive: true },
];

const GameConfigManagement: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<GameTask[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<GameTask | null>(null);
  const [importing, setImporting] = useState(false);
  const [formData, setFormData] = useState<GameTask>({
    title: '',
    description: '',
    position: 0,
    type: 'BONUS',
    reward: 0,
    timeLimit: 0,
    isActive: true
  });

  const API_URL = (process.env.REACT_APP_API_URL || '').replace(/\/api\/?$/, '');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/game/tasks`);
      setTasks(response.data);
    } catch (error) {
      console.error('加载任务失败:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTask && editingTask.id) {
        await axios.put(`${API_URL}/api/game/tasks/${editingTask.id}`, formData);
      } else {
        await axios.post(`${API_URL}/api/game/tasks`, formData);
      }
      loadTasks();
      closeModal();
    } catch (error) {
      console.error('保存任务失败:', error);
      alert('保存任务失败，请重试');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('确定要删除这个任务吗？')) {
      return;
    }
    try {
      await axios.delete(`${API_URL}/api/game/tasks/${id}`);
      loadTasks();
    } catch (error) {
      console.error('删除任务失败:', error);
      alert('删除任务失败，请重试');
    }
  };

  const openModal = (task?: GameTask) => {
    if (task) {
      setEditingTask(task);
      setFormData(task);
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        position: 0,
        type: 'BONUS',
        reward: 0,
        timeLimit: 0,
        isActive: true
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTask(null);
  };

  const getTaskTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      FORWARD: '前进',
      BACKWARD: '后退',
      BONUS: '奖励',
      CHALLENGE: '挑战'
    };
    return labels[type] || type;
  };

  const handleCopy = (task: GameTask) => {
    const usedPositions = new Set(tasks.map(t => t.position));
    let nextPosition = task.position;
    for (let i = 0; i < 40; i++) {
      const candidate = (task.position + i + 1) % 40;
      if (!usedPositions.has(candidate)) {
        nextPosition = candidate;
        break;
      }
    }

    setEditingTask(null);
    setFormData({
      title: task.title,
      description: task.description,
      position: nextPosition,
      type: task.type,
      reward: task.reward,
      timeLimit: task.timeLimit,
      isActive: true,
    });
    setShowModal(true);
  };

  const handleImportDefaults = async () => {
    if (!window.confirm('确定要导入默认任务吗？已存在相同位置的任务不会被覆盖。')) {
      return;
    }
    setImporting(true);
    try {
      const existingPositions = new Set(tasks.map(t => t.position));
      const tasksToImport = DEFAULT_TASKS.filter(t => !existingPositions.has(t.position));

      if (tasksToImport.length === 0) {
        alert('所有默认任务的位置都已被占用，无需导入');
        setImporting(false);
        return;
      }

      for (const task of tasksToImport) {
        await axios.post(`${API_URL}/api/game/tasks`, task);
      }
      await loadTasks();
      alert(`成功导入 ${tasksToImport.length} 个默认任务！`);
    } catch (error) {
      console.error('导入默认任务失败:', error);
      alert('导入默认任务失败，请重试');
    } finally {
      setImporting(false);
    }
  };

  const getTaskTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      FORWARD: '#4CAF50',
      BACKWARD: '#f44336',
      BONUS: '#FF9800',
      CHALLENGE: '#9C27B0'
    };
    return colors[type] || '#999';
  };

  return (
    <div className="game-config-management">
      <div className="config-header">
        <h1>🎮 飞行棋配置管理</h1>
        <div className="header-actions">
          <button onClick={() => openModal()} className="add-button">
            ✨ 添加新任务
          </button>
          <button onClick={handleImportDefaults} className="import-button" disabled={importing}>
            {importing ? '导入中...' : '📦 导入默认任务'}
          </button>
          <button onClick={() => navigate('/lobby')} className="back-button">
            返回大厅
          </button>
        </div>
      </div>

      <div className="config-content">
        <div className="board-preview">
          <h2>📍 棋盘预览（40格）</h2>
          <div className="preview-grid">
            {Array.from({ length: 40 }, (_, i) => {
              const task = tasks.find(t => t.position === i);
              return (
                <div
                  key={i}
                  className={`preview-cell ${task ? 'has-task' : ''}`}
                  style={{
                    borderColor: task ? getTaskTypeColor(task.type) : undefined
                  }}
                  title={task ? `${task.title} - ${getTaskTypeLabel(task.type)}` : `位置 ${i}`}
                >
                  <span className="cell-number">{i}</span>
                  {task && (
                    <span className="cell-icon" style={{ color: getTaskTypeColor(task.type) }}>
                      {task.type === 'FORWARD' && '⬆️'}
                      {task.type === 'BACKWARD' && '⬇️'}
                      {task.type === 'BONUS' && '💰'}
                      {task.type === 'CHALLENGE' && '⚔️'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="tasks-list">
          <h2>📋 任务列表</h2>
          <div className="tasks-grid">
            {tasks.map((task) => (
              <div key={task.id} className="task-card">
                <div className="task-card-header">
                  <h3>{task.title}</h3>
                  <span
                    className="task-type-badge"
                    style={{ backgroundColor: getTaskTypeColor(task.type) }}
                  >
                    {getTaskTypeLabel(task.type)}
                  </span>
                </div>
                <div className="task-card-body">
                  <p className="task-description">{task.description}</p>
                  <div className="task-details">
                    <div className="detail-item">
                      <span className="detail-label">位置：</span>
                      <span className="detail-value">{task.position}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">奖励：</span>
                      <span className="detail-value">
                        {task.reward} {task.type === 'BONUS' ? '分' : '步'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">限时：</span>
                      <span className="detail-value">
                        {task.timeLimit > 0 ? `${task.timeLimit}秒 ⏱️` : '无限时'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">状态：</span>
                      <span className={`status-badge ${task.isActive ? 'active' : 'inactive'}`}>
                        {task.isActive ? '启用' : '禁用'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="task-card-actions">
                  <button onClick={() => openModal(task)} className="edit-button">
                    ✏️ 编辑
                  </button>
                  <button onClick={() => handleCopy(task)} className="copy-button">
                    📋 复制
                  </button>
                  <button onClick={() => task.id && handleDelete(task.id)} className="delete-button">
                    🗑️ 删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingTask ? '✏️ 编辑任务' : '✨ 添加新任务'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>任务标题 *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="例如：幸运星"
                />
              </div>

              <div className="form-group">
                <label>任务描述 *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  placeholder="例如：恭喜你！前进3步"
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>位置 (0-39) *</label>
                  <input
                    type="number"
                    min="0"
                    max="39"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>任务类型 *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    required
                  >
                    <option value="FORWARD">⬆️ 前进</option>
                    <option value="BACKWARD">⬇️ 后退</option>
                    <option value="BONUS">💰 奖励</option>
                    <option value="CHALLENGE">⚔️ 挑战</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>奖励数值 *</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.reward}
                    onChange={(e) => setFormData({ ...formData, reward: parseInt(e.target.value) })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>⏱️ 限时（秒，0为无限时）</label>
                  <input
                    type="number"
                    min="0"
                    max="300"
                    value={formData.timeLimit}
                    onChange={(e) => setFormData({ ...formData, timeLimit: parseInt(e.target.value) || 0 })}
                    placeholder="0 表示无限时"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>状态</label>
                  <div className="checkbox-wrapper">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    <label htmlFor="isActive">启用任务</label>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-button">
                  💾 保存
                </button>
                <button type="button" onClick={closeModal} className="cancel-button">
                  ❌ 取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameConfigManagement;
