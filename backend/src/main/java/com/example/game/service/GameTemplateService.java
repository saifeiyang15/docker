package com.example.game.service;

import com.example.game.model.GameTemplate;
import com.example.game.model.SpecialCell;
import com.example.game.repository.GameTemplateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class GameTemplateService {
    
    @Autowired
    private GameTemplateRepository templateRepository;
    
    @Transactional(readOnly = true)
    public List<GameTemplate> getAllTemplates() {
        return templateRepository.findAllWithSpecialCells();
    }
    
    @Transactional(readOnly = true)
    public GameTemplate getTemplateById(Long id) {
        GameTemplate template = templateRepository.findByIdWithSpecialCells(id);
        if (template == null) {
            throw new RuntimeException("模板不存在");
        }
        return template;
    }
    
    @Transactional
    public GameTemplate createTemplate(GameTemplate template) {
        validateTemplate(template);
        
        // Set bidirectional relationship for special cells
        if (template.getSpecialCells() != null) {
            template.getSpecialCells().forEach(cell -> cell.setTemplate(template));
        }
        
        return templateRepository.save(template);
    }
    
    @Transactional
    public GameTemplate updateTemplate(Long id, GameTemplate updatedTemplate) {
        GameTemplate existingTemplate = getTemplateById(id);
        
        validateTemplate(updatedTemplate);
        
        existingTemplate.setName(updatedTemplate.getName());
        existingTemplate.setDescription(updatedTemplate.getDescription());
        existingTemplate.setBoardSize(updatedTemplate.getBoardSize());
        existingTemplate.setMaxPlayers(updatedTemplate.getMaxPlayers());
        
        // Update special cells
        existingTemplate.getSpecialCells().clear();
        if (updatedTemplate.getSpecialCells() != null) {
            updatedTemplate.getSpecialCells().forEach(cell -> {
                cell.setTemplate(existingTemplate);
                existingTemplate.getSpecialCells().add(cell);
            });
        }
        
        return templateRepository.save(existingTemplate);
    }
    
    @Transactional
    public void deleteTemplate(Long id) {
        GameTemplate template = getTemplateById(id);
        templateRepository.delete(template);
    }
    
    private void validateTemplate(GameTemplate template) {
        if (template.getName() == null || template.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("模板名称不能为空");
        }
        
        if (template.getBoardSize() == null || template.getBoardSize() < 20 || template.getBoardSize() > 100) {
            throw new IllegalArgumentException("棋盘大小必须在 20-100 之间");
        }
        
        if (template.getMaxPlayers() == null || template.getMaxPlayers() < 2 || template.getMaxPlayers() > 4) {
            throw new IllegalArgumentException("最大玩家数必须在 2-4 之间");
        }
        
        // Validate special cells
        if (template.getSpecialCells() != null) {
            for (SpecialCell cell : template.getSpecialCells()) {
                if (cell.getPosition() == null || cell.getPosition() < 0 || cell.getPosition() >= template.getBoardSize()) {
                    throw new IllegalArgumentException("特殊格子位置必须在 0 到 " + (template.getBoardSize() - 1) + " 之间");
                }
                
                if (cell.getType() == null) {
                    throw new IllegalArgumentException("特殊格子类型不能为空");
                }
                
                if (cell.getValue() == null) {
                    throw new IllegalArgumentException("特殊格子数值不能为空");
                }
            }
        }
    }
}
