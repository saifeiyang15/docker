package com.example.game.controller;

import com.example.game.service.FriendGameService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/game/friend")
@CrossOrigin(origins = "*")
public class FriendGameController {

    @Autowired
    private FriendGameService friendGameService;

    @PostMapping("/create")
    public ResponseEntity<?> createGame(@RequestBody Map<String, Object> request) {
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            String username = (String) request.get("username");
            String roomCode = friendGameService.generateRoomCode();

            FriendGameService.FriendGameState gameState =
                    friendGameService.createGame(roomCode, userId, username);

            return ResponseEntity.ok(gameState);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/join/{roomCode}")
    public ResponseEntity<?> joinGame(
            @PathVariable String roomCode,
            @RequestBody Map<String, Object> request) {
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            String username = (String) request.get("username");

            FriendGameService.FriendGameState gameState =
                    friendGameService.joinGame(roomCode, userId, username);

            return ResponseEntity.ok(gameState);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/state/{roomCode}")
    public ResponseEntity<?> getGameState(@PathVariable String roomCode) {
        try {
            FriendGameService.FriendGameState gameState =
                    friendGameService.getGameState(roomCode);

            if (gameState == null) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(gameState);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/reset/{roomCode}")
    public ResponseEntity<?> resetGame(@PathVariable String roomCode) {
        try {
            friendGameService.removeGame(roomCode);
            return ResponseEntity.ok(Map.of("message", "游戏已重置"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
