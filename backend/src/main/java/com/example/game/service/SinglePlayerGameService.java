package com.example.game.service;

import com.example.game.model.GameTask;
import com.example.game.repository.GameTaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
public class SinglePlayerGameService {
    
    @Autowired
    private GameTaskRepository taskRepository;
    
    private Map<Long, TwoPlayerGameState> gameStates = new HashMap<>();
    
    @Transactional
    public TwoPlayerGameState startGame(Long userId, String username) {
        TwoPlayerGameState gameState = new TwoPlayerGameState();
        
        PlayerState player1 = new PlayerState();
        player1.setPlayerId(1);
        player1.setUsername("👦 他");
        player1.setCurrentPosition(0);
        player1.setScore(0);
        player1.setCharacterImage("character_boy.png");
        player1.setColor("#4A90D9");
        
        PlayerState player2 = new PlayerState();
        player2.setPlayerId(2);
        player2.setUsername("👧 她");
        player2.setCurrentPosition(0);
        player2.setScore(0);
        player2.setCharacterImage("character_girl.png");
        player2.setColor("#E91E8C");
        
        gameState.setUserId(userId);
        gameState.setPlayer1(player1);
        gameState.setPlayer2(player2);
        gameState.setCurrentTurn(1);
        gameState.setDiceValue(0);
        gameState.setGameStatus("PLAYING");
        gameState.setCurrentTask(null);
        
        List<GameTask> tasks = taskRepository.findByIsActiveTrue();
        gameState.setTasks(tasks);
        
        gameStates.put(userId, gameState);
        return gameState;
    }
    
    public TwoPlayerGameState getGameState(Long userId) {
        return gameStates.get(userId);
    }
    
    public RollDiceResult rollDice(Long userId) {
        TwoPlayerGameState gameState = gameStates.get(userId);
        if (gameState == null || !gameState.getGameStatus().equals("PLAYING")) {
            throw new RuntimeException("游戏未开始或已结束");
        }
        
        PlayerState currentPlayer = gameState.getCurrentTurn() == 1
                ? gameState.getPlayer1()
                : gameState.getPlayer2();
        
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
        
        RollDiceResult result = new RollDiceResult();
        result.setDiceValue(diceValue);
        result.setNewPosition(diceTargetPosition);
        result.setFinalPosition(finalPosition);
        result.setTask(task);
        result.setCurrentPlayerId(currentPlayer.getPlayerId());
        result.setGameState(gameState);
        
        if (!gameState.getGameStatus().equals("FINISHED")) {
            gameState.setCurrentTurn(gameState.getCurrentTurn() == 1 ? 2 : 1);
        }
        
        return result;
    }
    
    private void executeTask(PlayerState player, GameTask task) {
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
    
    public void resetGame(Long userId) {
        gameStates.remove(userId);
    }
    
    @Transactional
    public void initializeDefaultTasks() {
        taskRepository.deleteAll();
        
        
    }
    
    // DTO: 单个玩家状态
    public static class PlayerState {
        private Integer playerId;
        private String username;
        private Integer currentPosition;
        private Integer score;
        private String characterImage;
        private String color;
        
        public Integer getPlayerId() { return playerId; }
        public void setPlayerId(Integer playerId) { this.playerId = playerId; }
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public Integer getCurrentPosition() { return currentPosition; }
        public void setCurrentPosition(Integer currentPosition) { this.currentPosition = currentPosition; }
        public Integer getScore() { return score; }
        public void setScore(Integer score) { this.score = score; }
        public String getCharacterImage() { return characterImage; }
        public void setCharacterImage(String characterImage) { this.characterImage = characterImage; }
        public String getColor() { return color; }
        public void setColor(String color) { this.color = color; }
    }
    
    // DTO: 双人游戏状态
    public static class TwoPlayerGameState {
        private Long userId;
        private PlayerState player1;
        private PlayerState player2;
        private Integer currentTurn;
        private Integer diceValue;
        private String gameStatus;
        private GameTask currentTask;
        private Integer winner;
        private List<GameTask> tasks;
        
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        public PlayerState getPlayer1() { return player1; }
        public void setPlayer1(PlayerState player1) { this.player1 = player1; }
        public PlayerState getPlayer2() { return player2; }
        public void setPlayer2(PlayerState player2) { this.player2 = player2; }
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
    public static class RollDiceResult {
        private Integer diceValue;
        private Integer newPosition;
        private Integer finalPosition;
        private Integer currentPlayerId;
        private GameTask task;
        private TwoPlayerGameState gameState;
        
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
        public TwoPlayerGameState getGameState() { return gameState; }
        public void setGameState(TwoPlayerGameState gameState) { this.gameState = gameState; }
    }
}
