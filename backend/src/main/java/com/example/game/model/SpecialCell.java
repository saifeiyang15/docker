package com.example.game.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "special_cells")
public class SpecialCell {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private Integer position;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CellType type;
    
    @Column(nullable = false)
    private Integer value;
    
    @Column(length = 500)
    private String description;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id")
    @JsonIgnore
    private GameTemplate template;
    
    // Enum for cell types
    public enum CellType {
        FORWARD,
        BACKWARD,
        SKIP,
        EXTRA_TURN
    }
    
    // Constructors
    public SpecialCell() {}
    
    public SpecialCell(Integer position, CellType type, Integer value, String description) {
        this.position = position;
        this.type = type;
        this.value = value;
        this.description = description;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Integer getPosition() {
        return position;
    }
    
    public void setPosition(Integer position) {
        this.position = position;
    }
    
    public CellType getType() {
        return type;
    }
    
    public void setType(CellType type) {
        this.type = type;
    }
    
    public Integer getValue() {
        return value;
    }
    
    public void setValue(Integer value) {
        this.value = value;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public GameTemplate getTemplate() {
        return template;
    }
    
    public void setTemplate(GameTemplate template) {
        this.template = template;
    }
}
