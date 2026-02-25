package com.example.game.service;

import com.example.game.model.GameTask;
import com.example.game.repository.GameTaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class FriendGameService {

    @Autowired
    private GameTaskRepository taskRepository;

    private final Map<String, FriendGameState> gameStates = new ConcurrentHashMap<>();

    public FriendGameState createGame(String roomCode, Long creatorId, String creatorName) {
        FriendGameState gameState = new FriendGameState();
        gameState.setRoomCode(roomCode);
        gameState.setGameStatus("WAITING");
        gameState.setCurrentTurn(1);
        gameState.setDiceValue(0);

        FriendPlayerState player1 = new FriendPlayerState();
        player1.setPlayerId(1);
        player1.setUserId(creatorId);
        player1.setUsername(creatorName);
        player1.setCurrentPosition(0);
        player1.setScore(0);
        player1.setColor("#4A90D9");

        gameState.setPlayer1(player1);
        gameState.setPlayer2(null);

        List<GameTask> tasks = taskRepository.findByIsActiveTrue();
        gameState.setTasks(tasks);

        gameStates.put(roomCode, gameState);
        return gameState;
    }

    public FriendGameState joinGame(String roomCode, Long userId, String username) {
        FriendGameState gameState = gameStates.get(roomCode);
        if (gameState == null) {
            throw new RuntimeException("房间不存在");
        }
        if (gameState.getPlayer2() != null) {
            if (gameState.getPlayer1().getUserId().equals(userId)
                    || gameState.getPlayer2().getUserId().equals(userId)) {
                return gameState;
            }
            throw new RuntimeException("房间已满");
        }
        if (gameState.getPlayer1().getUserId().equals(userId)) {
            return gameState;
        }

        FriendPlayerState player2 = new FriendPlayerState();
        player2.setPlayerId(2);
        player2.setUserId(userId);
        player2.setUsername(username);
        player2.setCurrentPosition(0);
        player2.setScore(0);
        player2.setColor("#E91E8C");

        gameState.setPlayer2(player2);
        gameState.setGameStatus("PLAYING");

        return gameState;
    }

    public FriendGameState getGameState(String roomCode) {
        return gameStates.get(roomCode);
    }

    public RollResult rollDice(String roomCode, Long userId) {
        FriendGameState gameState = gameStates.get(roomCode);
        if (gameState == null) {
            throw new RuntimeException("游戏不存在");
        }
        if (!"PLAYING".equals(gameState.getGameStatus())) {
            throw new RuntimeException("游戏未在进行中");
        }

        FriendPlayerState currentPlayer = gameState.getCurrentTurn() == 1
                ? gameState.getPlayer1()
                : gameState.getPlayer2();

        if (!currentPlayer.getUserId().equals(userId)) {
            throw new RuntimeException("还没轮到你");
        }

        Random random = new Random();
        int diceValue = random.nextInt(6) + 1;
        gameState.setDiceValue(diceValue);

        int diceTargetPosition = currentPlayer.getCurrentPosition() + diceValue;

        if (diceTargetPosition >= 40) {
            diceTargetPosition = 40;
            gameState.setGameStatus("FINISHED");
            gameState.setWinner(currentPlayer.getPlayerId());
        }

        currentPlayer.setCurrentPosition(diceTargetPosition);

        GameTask task = null;
        Optional<GameTask> taskOpt = taskRepository.findByPosition(diceTargetPosition);
        if (taskOpt.isPresent()) {
            task = taskOpt.get();
            executeTask(currentPlayer, task);
        }

        gameState.setCurrentTask(task);

        int finalPosition = currentPlayer.getCurrentPosition();

        RollResult result = new RollResult();
        result.setDiceValue(diceValue);
        result.setNewPosition(diceTargetPosition);
        result.setFinalPosition(finalPosition);
        result.setTask(task);
        result.setCurrentPlayerId(currentPlayer.getPlayerId());
        result.setGameState(gameState);

        if (!"FINISHED".equals(gameState.getGameStatus())) {
            gameState.setCurrentTurn(gameState.getCurrentTurn() == 1 ? 2 : 1);
        }

        return result;
    }

    private void executeTask(FriendPlayerState player, GameTask task) {
        switch (task.getType()) {
            case FORWARD:
                int forwardPos = player.getCurrentPosition() + task.getReward();
                player.setCurrentPosition(Math.min(40, forwardPos));
                break;
            case BACKWARD:
                player.setCurrentPosition(Math.max(0, player.getCurrentPosition() - task.getReward()));
                break;
            case BONUS:
            case CHALLENGE:
                break;
        }
    }

    public void removeGame(String roomCode) {
        gameStates.remove(roomCode);
    }

    public String generateRoomCode() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        Random random = new Random();
        StringBuilder code = new StringBuilder();
        for (int i = 0; i < 6; i++) {
            code.append(chars.charAt(random.nextInt(chars.length())));
        }
        return code.toString();
    }

    // DTO: 好友模式玩家状态
    public static class FriendPlayerState {
        private Integer playerId;
        private Long userId;
        private String username;
        private Integer currentPosition;
        private Integer score;
        private String color;

        public Integer getPlayerId() { return playerId; }
        public void setPlayerId(Integer playerId) { this.playerId = playerId; }
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public Integer getCurrentPosition() { return currentPosition; }
        public void setCurrentPosition(Integer currentPosition) { this.currentPosition = currentPosition; }
        public Integer getScore() { return score; }
        public void setScore(Integer score) { this.score = score; }
        public String getColor() { return color; }
        public void setColor(String color) { this.color = color; }
    }

    // DTO: 好友模式游戏状态
    public static class FriendGameState {
        private String roomCode;
        private FriendPlayerState player1;
        private FriendPlayerState player2;
        private Integer currentTurn;
        private Integer diceValue;
        private String gameStatus;
        private GameTask currentTask;
        private Integer winner;
        private List<GameTask> tasks;

        public String getRoomCode() { return roomCode; }
        public void setRoomCode(String roomCode) { this.roomCode = roomCode; }
        public FriendPlayerState getPlayer1() { return player1; }
        public void setPlayer1(FriendPlayerState player1) { this.player1 = player1; }
        public FriendPlayerState getPlayer2() { return player2; }
        public void setPlayer2(FriendPlayerState player2) { this.player2 = player2; }
        public Integer getCurrentTurn() { return currentTurn; }
        public void setCurrentTurn(Integer currentTurn) { this.currentTurn = currentTurn; }
        public Integer getDiceValue() { return diceValue; }
        public void setDiceValue(Integer diceValue) { this.diceValue = diceValue; }
        public String getGameStatus() { return gameStatus; }
        public void setGameStatus(String gameStatus) { this.gameStatus = gameStatus; }
        public GameTask getCurrentTask() { return currentTask; }
        public void setCurrentTask(GameTask currentTask) { this.currentTask = currentTask; }
        public Integer getWinner() { return winner; }
        public void setWinner(Integer winner) { this.winner = winner; }
        public List<GameTask> getTasks() { return tasks; }
        public void setTasks(List<GameTask> tasks) { this.tasks = tasks; }
    }

    // DTO: 掷骰子结果
    public static class RollResult {
        private Integer diceValue;
        private Integer newPosition;
        private Integer finalPosition;
        private Integer currentPlayerId;
        private GameTask task;
        private FriendGameState gameState;

        public Integer getDiceValue() { return diceValue; }
        public void setDiceValue(Integer diceValue) { this.diceValue = diceValue; }
        public Integer getNewPosition() { return newPosition; }
        public void setNewPosition(Integer newPosition) { this.newPosition = newPosition; }
        public Integer getFinalPosition() { return finalPosition; }
        public void setFinalPosition(Integer finalPosition) { this.finalPosition = finalPosition; }
        public Integer getCurrentPlayerId() { return currentPlayerId; }
        public void setCurrentPlayerId(Integer currentPlayerId) { this.currentPlayerId = currentPlayerId; }
        public GameTask getTask() { return task; }
        public void setTask(GameTask task) { this.task = task; }
        public FriendGameState getGameState() { return gameState; }
        public void setGameState(FriendGameState gameState) { this.gameState = gameState; }
    }
}
