package com.example.game.controller;

import com.example.game.service.SinglePlayerGameService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/game/single")
@CrossOrigin(origins = "*")
public class SinglePlayerGameController {
    
    @Autowired
    private SinglePlayerGameService singlePlayerGameService;
    
    @PostMapping("/start")
    public ResponseEntity<?> startGame(@RequestBody Map<String, Object> request) {
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            String username = (String) request.get("username");
            
            SinglePlayerGameService.TwoPlayerGameState gameState = 
                singlePlayerGameService.startGame(userId, username);
            
            return ResponseEntity.ok(gameState);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/state/{userId}")
    public ResponseEntity<?> getGameState(@PathVariable Long userId) {
        try {
            SinglePlayerGameService.TwoPlayerGameState gameState = 
                singlePlayerGameService.getGameState(userId);
            
            if (gameState == null) {
                return ResponseEntity.notFound().build();
            }
            
            return ResponseEntity.ok(gameState);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/roll")
    public ResponseEntity<?> rollDice(@RequestBody Map<String, Object> request) {
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            
            SinglePlayerGameService.RollDiceResult result = 
                singlePlayerGameService.rollDice(userId);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/reset/{userId}")
    public ResponseEntity<?> resetGame(@PathVariable Long userId) {
        try {
            singlePlayerGameService.resetGame(userId);
            return ResponseEntity.ok(Map.of("message", "游戏已重置"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/init-tasks")
    public ResponseEntity<?> initializeTasks() {
        try {
            singlePlayerGameService.initializeDefaultTasks();
            return ResponseEntity.ok(Map.of("message", "任务初始化成功"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
