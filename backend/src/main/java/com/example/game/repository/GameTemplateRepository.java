package com.example.game.repository;

import com.example.game.model.GameTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface GameTemplateRepository extends JpaRepository<GameTemplate, Long> {
    
    @Query("SELECT t FROM GameTemplate t LEFT JOIN FETCH t.specialCells ORDER BY t.createdAt DESC")
    List<GameTemplate> findAllWithSpecialCells();
    
    @Query("SELECT t FROM GameTemplate t LEFT JOIN FETCH t.specialCells WHERE t.id = :id")
    GameTemplate findByIdWithSpecialCells(Long id);
}
