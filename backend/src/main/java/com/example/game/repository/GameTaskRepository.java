package com.example.game.repository;

import com.example.game.model.GameTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface GameTaskRepository extends JpaRepository<GameTask, Long> {
    
    List<GameTask> findByIsActiveTrue();
    
    Optional<GameTask> findByPosition(Integer position);
    
    List<GameTask> findByPositionIn(List<Integer> positions);
}
