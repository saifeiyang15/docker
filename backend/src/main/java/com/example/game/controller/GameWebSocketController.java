package com.example.game.controller;

import com.example.game.model.GameRoom;
import com.example.game.service.GameRoomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import java.util.*;

@Controller
public class GameWebSocketController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private GameRoomService gameRoomService;

    // 存储游戏状态
    private Map<String, GameStateDTO> gameStates = new HashMap<>();

    @MessageMapping("/game/{roomCode}/join")
    public void joinGame(@DestinationVariable String roomCode, Map<String, Object> payload) {
        try {
            Long userId = Long.valueOf(payload.get("userId").toString());
            String username = payload.get("username").toString();

            // 获取或创建游戏状态
            GameStateDTO gameState = gameStates.computeIfAbsent(roomCode, k -> {
                GameStateDTO state = new GameStateDTO();
                state.setRoomCode(roomCode);
                state.setPlayers(new ArrayList<>());
                state.setCurrentPlayerIndex(0);
                state.setGameStatus("WAITING");
                state.setDiceValue(0);
                return state;
            });

            // 检查玩家是否已经在游戏中
            boolean playerExists = gameState.getPlayers().stream()
                    .anyMatch(p -> p.getId().equals(userId));

            if (!playerExists) {
                // 添加新玩家
                PlayerDTO player = new PlayerDTO();
                player.setId(userId);
                player.setUsername(username);
                player.setColor(getPlayerColor(gameState.getPlayers().size()));
                player.setPosition(new ArrayList<>(Arrays.asList(-1, -1, -1, -1))); // 4个棋子都在起点
                player.setFinished(false);
                gameState.getPlayers().add(player);

                // 如果有2个或更多玩家，自动开始游戏
                if (gameState.getPlayers().size() >= 2) {
                    gameState.setGameStatus("PLAYING");
                }
            }

            // 推送游戏状态给所有订阅该房间的客户端
            messagingTemplate.convertAndSend("/topic/game/" + roomCode, gameState);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @MessageMapping("/game/{roomCode}/roll")
    public void rollDice(@DestinationVariable String roomCode, Map<String, Object> payload) {
        try {
            Long userId = Long.valueOf(payload.get("userId").toString());
            GameStateDTO gameState = gameStates.get(roomCode);

            if (gameState == null || !gameState.getGameStatus().equals("PLAYING")) {
                return;
            }

            // 检查是否是当前玩家的回合
            PlayerDTO currentPlayer = gameState.getPlayers().get(gameState.getCurrentPlayerIndex());
            if (!currentPlayer.getId().equals(userId)) {
                return;
            }

            // 掷骰子
            Random random = new Random();
            int diceValue = random.nextInt(6) + 1;
            gameState.setDiceValue(diceValue);

            // 移动棋子（简化版本：只移动第一个棋子）
            List<Integer> positions = currentPlayer.getPosition();
            int currentPos = positions.get(0);
            
            if (currentPos == -1) {
                // 如果在起点，掷到6才能出发
                if (diceValue == 6) {
                    positions.set(0, 0);
                }
            } else {
                // 移动棋子
                int newPos = currentPos + diceValue;
                if (newPos >= 52) {
                    // 到达终点
                    positions.set(0, 52);
                    currentPlayer.setFinished(true);
                    
                    // 检查是否获胜
                    if (checkWinner(currentPlayer)) {
                        gameState.setGameStatus("FINISHED");
                        gameState.setWinner(currentPlayer);
                    }
                } else {
                    positions.set(0, newPos);
                }
            }

            // 如果没有掷到6，切换到下一个玩家
            if (diceValue != 6 && !gameState.getGameStatus().equals("FINISHED")) {
                gameState.setCurrentPlayerIndex(
                    (gameState.getCurrentPlayerIndex() + 1) % gameState.getPlayers().size()
                );
            }

            // 推送更新后的游戏状态
            messagingTemplate.convertAndSend("/topic/game/" + roomCode, gameState);

            // 推送掷骰子结果
            DiceRollResultDTO result = new DiceRollResultDTO();
            result.setValue(diceValue);
            result.setPlayerId(userId);
            result.setCanMove(true);
            if (currentPos == -1 && diceValue != 6) {
                result.setMessage("需要掷到6才能出发");
                result.setCanMove(false);
            }
            messagingTemplate.convertAndSend("/topic/game/" + roomCode + "/dice", result);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private String getPlayerColor(int playerIndex) {
        String[] colors = {"#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A"};
        return colors[playerIndex % colors.length];
    }

    private boolean checkWinner(PlayerDTO player) {
        // 简化版本：只检查第一个棋子是否到达终点
        return player.getPosition().get(0) >= 52;
    }

    // DTO 类
    public static class GameStateDTO {
        private String roomCode;
        private List<PlayerDTO> players;
        private Integer currentPlayerIndex;
        private Integer diceValue;
        private String gameStatus;
        private PlayerDTO winner;

        // Getters and Setters
        public String getRoomCode() { return roomCode; }
        public void setRoomCode(String roomCode) { this.roomCode = roomCode; }
        public List<PlayerDTO> getPlayers() { return players; }
        public void setPlayers(List<PlayerDTO> players) { this.players = players; }
        public Integer getCurrentPlayerIndex() { return currentPlayerIndex; }
        public void setCurrentPlayerIndex(Integer currentPlayerIndex) { this.currentPlayerIndex = currentPlayerIndex; }
        public Integer getDiceValue() { return diceValue; }
        public void setDiceValue(Integer diceValue) { this.diceValue = diceValue; }
        public String getGameStatus() { return gameStatus; }
        public void setGameStatus(String gameStatus) { this.gameStatus = gameStatus; }
        public PlayerDTO getWinner() { return winner; }
        public void setWinner(PlayerDTO winner) { this.winner = winner; }
    }

    public static class PlayerDTO {
        private Long id;
        private String username;
        private String color;
        private List<Integer> position;
        private Boolean isFinished;

        // Getters and Setters
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getColor() { return color; }
        public void setColor(String color) { this.color = color; }
        public List<Integer> getPosition() { return position; }
        public void setPosition(List<Integer> position) { this.position = position; }
        public Boolean getFinished() { return isFinished; }
        public void setFinished(Boolean finished) { isFinished = finished; }
    }

    public static class DiceRollResultDTO {
        private Integer value;
        private Long playerId;
        private Boolean canMove;
        private String message;

        // Getters and Setters
        public Integer getValue() { return value; }
        public void setValue(Integer value) { this.value = value; }
        public Long getPlayerId() { return playerId; }
        public void setPlayerId(Long playerId) { this.playerId = playerId; }
        public Boolean getCanMove() { return canMove; }
        public void setCanMove(Boolean canMove) { this.canMove = canMove; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
}
