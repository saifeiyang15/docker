package com.example.game.controller;

import com.example.game.model.GameRoom;
import com.example.game.service.GameRoomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/game")
@CrossOrigin(origins = "*")
public class GameController {

    @Autowired
    private GameRoomService gameRoomService;

    @PostMapping("/rooms")
    public ResponseEntity<?> createRoom(@RequestBody Map<String, Object> request) {
        try {
            String roomName = (String) request.get("roomName");
            Long creatorId = Long.valueOf(request.get("creatorId").toString());
            GameRoom room = gameRoomService.createRoom(roomName, creatorId);
            return ResponseEntity.ok(room);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/rooms")
    public ResponseEntity<List<GameRoom>> getAvailableRooms() {
        return ResponseEntity.ok(gameRoomService.getAvailableRooms());
    }

    @PostMapping("/rooms/{roomCode}/join")
    public ResponseEntity<?> joinRoom(@PathVariable String roomCode) {
        try {
            GameRoom room = gameRoomService.joinRoom(roomCode);
            return ResponseEntity.ok(room);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/rooms/{roomCode}/start")
    public ResponseEntity<?> startGame(@PathVariable String roomCode) {
        try {
            GameRoom room = gameRoomService.startGame(roomCode);
            return ResponseEntity.ok(room);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
