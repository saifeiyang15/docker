import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { templateAPI } from '../services/api';
import { GameTemplate, SpecialCell } from '../types';
import '../styles/TemplateManagement.css';

const TemplateManagement: React.FC = () => {
  const [templates, setTemplates] = useState<GameTemplate[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<GameTemplate | null>(null);
  const [formData, setFormData] = useState<GameTemplate>({
    name: '',
    description: '',
    boardSize: 52,
    maxPlayers: 4,
    specialCells: [],
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await templateAPI.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('加载模板失败:', error);
    }
  };

  const handleCreateNew = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      description: '',
      boardSize: 52,
      maxPlayers: 4,
      specialCells: [],
    });
    setShowForm(true);
  };

  const handleEdit = (template: GameTemplate) => {
    setEditingTemplate(template);
    setFormData(template);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('确定要删除这个模板吗？')) {
      try {
        await templateAPI.deleteTemplate(id);
        loadTemplates();
      } catch (error) {
        console.error('删除模板失败:', error);
        alert('删除失败，请重试');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTemplate?.id) {
        await templateAPI.updateTemplate(editingTemplate.id, formData);
      } else {
        await templateAPI.createTemplate(formData);
      }
      setShowForm(false);
      loadTemplates();
    } catch (error) {
      console.error('保存模板失败:', error);
      alert('保存失败，请重试');
    }
  };

  const handleAddSpecialCell = () => {
    setFormData({
      ...formData,
      specialCells: [
        ...formData.specialCells,
        {
          position: 0,
          type: 'FORWARD',
          value: 0,
          description: '',
        },
      ],
    });
  };

  const handleRemoveSpecialCell = (index: number) => {
    const newCells = formData.specialCells.filter((_, i) => i !== index);
    setFormData({ ...formData, specialCells: newCells });
  };

  const handleSpecialCellChange = (index: number, field: keyof SpecialCell, value: any) => {
    const newCells = [...formData.specialCells];
    newCells[index] = { ...newCells[index], [field]: value };
    setFormData({ ...formData, specialCells: newCells });
  };

  return (
    <div className="template-management">
      <div className="template-header">
        <h1>飞行棋模板管理</h1>
        <div className="header-actions">
          <button onClick={handleCreateNew} className="btn-primary">
            创建新模板
          </button>
          <button onClick={() => navigate('/lobby')} className="btn-secondary">
            返回大厅
          </button>
        </div>
      </div>

      {showForm ? (
        <div className="template-form-container">
          <div className="form-header">
            <h2>{editingTemplate ? '编辑模板' : '创建新模板'}</h2>
            <button onClick={() => setShowForm(false)} className="btn-close">
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="template-form">
            <div className="form-group">
              <label>模板名称</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="输入模板名称"
              />
            </div>

            <div className="form-group">
              <label>模板描述</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                placeholder="输入模板描述"
                rows={3}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>棋盘格子数</label>
                <input
                  type="number"
                  value={formData.boardSize}
                  onChange={(e) => setFormData({ ...formData, boardSize: parseInt(e.target.value) })}
                  required
                  min={20}
                  max={100}
                />
              </div>

              <div className="form-group">
                <label>最大玩家数</label>
                <input
                  type="number"
                  value={formData.maxPlayers}
                  onChange={(e) => setFormData({ ...formData, maxPlayers: parseInt(e.target.value) })}
                  required
                  min={2}
                  max={4}
                />
              </div>
            </div>

            <div className="special-cells-section">
              <div className="section-header">
                <h3>特殊格子配置</h3>
                <button type="button" onClick={handleAddSpecialCell} className="btn-add">
                  + 添加特殊格子
                </button>
              </div>

              {formData.specialCells.map((cell, index) => (
                <div key={index} className="special-cell-item">
                  <div className="cell-row">
                    <div className="form-group">
                      <label>位置</label>
                      <input
                        type="number"
                        value={cell.position}
                        onChange={(e) =>
                          handleSpecialCellChange(index, 'position', parseInt(e.target.value))
                        }
                        required
                        min={0}
                        max={formData.boardSize - 1}
                      />
                    </div>

                    <div className="form-group">
                      <label>类型</label>
                      <select
                        value={cell.type}
                        onChange={(e) => handleSpecialCellChange(index, 'type', e.target.value)}
                        required
                      >
                        <option value="FORWARD">前进</option>
                        <option value="BACKWARD">后退</option>
                        <option value="SKIP">暂停</option>
                        <option value="EXTRA_TURN">额外回合</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>数值</label>
                      <input
                        type="number"
                        value={cell.value}
                        onChange={(e) =>
                          handleSpecialCellChange(index, 'value', parseInt(e.target.value))
                        }
                        required
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveSpecialCell(index)}
                      className="btn-remove"
                    >
                      删除
                    </button>
                  </div>

                  <div className="form-group">
                    <label>描述</label>
                    <input
                      type="text"
                      value={cell.description}
                      onChange={(e) => handleSpecialCellChange(index, 'description', e.target.value)}
                      placeholder="输入特殊格子的描述"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                保存模板
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                取消
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="templates-grid">
          {templates.length === 0 ? (
            <div className="empty-state">
              <p>暂无模板，点击"创建新模板"开始创建</p>
            </div>
          ) : (
            templates.map((template) => (
              <div key={template.id} className="template-card">
                <div className="template-card-header">
                  <h3>{template.name}</h3>
                  <div className="card-actions">
                    <button onClick={() => handleEdit(template)} className="btn-icon" title="编辑">
                      ✏️
                    </button>
                    <button
                      onClick={() => template.id && handleDelete(template.id)}
                      className="btn-icon"
                      title="删除"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <p className="template-description">{template.description}</p>
                <div className="template-info">
                  <div className="info-item">
                    <span className="info-label">棋盘大小:</span>
                    <span className="info-value">{template.boardSize} 格</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">最大玩家:</span>
                    <span className="info-value">{template.maxPlayers} 人</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">特殊格子:</span>
                    <span className="info-value">{template.specialCells.length} 个</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default TemplateManagement;
