package com.example.game.controller;

import com.example.game.service.FriendGameService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
public class FriendGameWebSocketController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private FriendGameService friendGameService;

    @MessageMapping("/friend/{roomCode}/join")
    public void joinGame(@DestinationVariable String roomCode, Map<String, Object> payload) {
        try {
            Long userId = Long.valueOf(payload.get("userId").toString());
            String username = payload.get("username").toString();

            FriendGameService.FriendGameState gameState =
                    friendGameService.joinGame(roomCode, userId, username);

            messagingTemplate.convertAndSend("/topic/friend/" + roomCode, gameState);
        } catch (Exception e) {
            messagingTemplate.convertAndSend("/topic/friend/" + roomCode + "/error",
                    Map.of("error", e.getMessage()));
        }
    }

    @MessageMapping("/friend/{roomCode}/roll")
    public void rollDice(@DestinationVariable String roomCode, Map<String, Object> payload) {
        try {
            Long userId = Long.valueOf(payload.get("userId").toString());

            FriendGameService.RollResult result = friendGameService.rollDice(roomCode, userId);

            messagingTemplate.convertAndSend("/topic/friend/" + roomCode + "/roll", result);
            messagingTemplate.convertAndSend("/topic/friend/" + roomCode, result.getGameState());
        } catch (Exception e) {
            messagingTemplate.convertAndSend("/topic/friend/" + roomCode + "/error",
                    Map.of("error", e.getMessage()));
        }
    }

    @MessageMapping("/friend/{roomCode}/leave")
    public void leaveGame(@DestinationVariable String roomCode, Map<String, Object> payload) {
        try {
            friendGameService.removeGame(roomCode);
            messagingTemplate.convertAndSend("/topic/friend/" + roomCode,
                    Map.of("gameStatus", "CANCELLED", "message", "对方已离开游戏"));
        } catch (Exception e) {
            messagingTemplate.convertAndSend("/topic/friend/" + roomCode + "/error",
                    Map.of("error", e.getMessage()));
        }
    }
}
