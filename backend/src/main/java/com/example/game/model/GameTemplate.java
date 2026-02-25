package com.example.game.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "game_templates")
public class GameTemplate {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(length = 1000)
    private String description;
    
    @Column(nullable = false)
    private Integer boardSize;
    
    @Column(nullable = false)
    private Integer maxPlayers;
    
    @OneToMany(mappedBy = "template", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SpecialCell> specialCells = new ArrayList<>();
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Constructors
    public GameTemplate() {}
    
    public GameTemplate(String name, String description, Integer boardSize, Integer maxPlayers) {
        this.name = name;
        this.description = description;
        this.boardSize = boardSize;
        this.maxPlayers = maxPlayers;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public Integer getBoardSize() {
        return boardSize;
    }
    
    public void setBoardSize(Integer boardSize) {
        this.boardSize = boardSize;
    }
    
    public Integer getMaxPlayers() {
        return maxPlayers;
    }
    
    public void setMaxPlayers(Integer maxPlayers) {
        this.maxPlayers = maxPlayers;
    }
    
    public List<SpecialCell> getSpecialCells() {
        return specialCells;
    }
    
    public void setSpecialCells(List<SpecialCell> specialCells) {
        this.specialCells.clear();
        if (specialCells != null) {
            this.specialCells.addAll(specialCells);
            specialCells.forEach(cell -> cell.setTemplate(this));
        }
    }
    
    public void addSpecialCell(SpecialCell cell) {
        specialCells.add(cell);
        cell.setTemplate(this);
    }
    
    public void removeSpecialCell(SpecialCell cell) {
        specialCells.remove(cell);
        cell.setTemplate(null);
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
