package com.example.game.service;

import com.example.game.model.GameRoom;
import com.example.game.repository.GameRoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Random;

@Service
public class GameRoomService {

    @Autowired
    private GameRoomRepository gameRoomRepository;

    public GameRoom createRoom(String roomName, Long creatorId) {
        GameRoom room = new GameRoom();
        room.setRoomName(roomName);
        room.setRoomCode(generateRoomCode());
        room.setCreatorId(creatorId);
        room.setStatus("WAITING");
        room.setCurrentPlayers(1);
        return gameRoomRepository.save(room);
    }

    public List<GameRoom> getAvailableRooms() {
        return gameRoomRepository.findByStatus("WAITING");
    }

    public GameRoom joinRoom(String roomCode) {
        GameRoom room = gameRoomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new RuntimeException("Room not found"));
        
        if (room.getCurrentPlayers() >= room.getMaxPlayers()) {
            throw new RuntimeException("Room is full");
        }
        
        room.setCurrentPlayers(room.getCurrentPlayers() + 1);
        return gameRoomRepository.save(room);
    }

    public GameRoom startGame(String roomCode) {
        GameRoom room = gameRoomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new RuntimeException("Room not found"));
        room.setStatus("PLAYING");
        return gameRoomRepository.save(room);
    }

    private String generateRoomCode() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        Random random = new Random();
        StringBuilder code = new StringBuilder();
        for (int i = 0; i < 6; i++) {
            code.append(chars.charAt(random.nextInt(chars.length())));
        }
        return code.toString();
    }
}
