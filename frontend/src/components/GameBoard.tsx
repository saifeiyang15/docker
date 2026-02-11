import React from 'react';
import { GameState } from '../types';
import '../styles/GameBoard.css';

interface GameBoardProps {
  gameState: GameState | null;
}

const GameBoard: React.FC<GameBoardProps> = ({ gameState }) => {
  const renderBoard = () => {
    const boardSize = 52;
    const cells = [];

    for (let i = 0; i < boardSize; i++) {
      const playersOnCell = gameState?.players.filter(
        (player) => player.position.includes(i)
      ) || [];

      cells.push(
        <div key={i} className="board-cell">
          <span className="cell-number">{i}</span>
          <div className="cell-players">
            {playersOnCell.map((player) => (
              <div
                key={player.id}
                className="player-piece"
                style={{ backgroundColor: player.color }}
              ></div>
            ))}
          </div>
        </div>
      );
    }

    return cells;
  };

  return (
    <div className="game-board">
      {gameState ? (
        <div className="board-grid">{renderBoard()}</div>
      ) : (
        <div className="board-loading">加载游戏中...</div>
      )}
    </div>
  );
};

export default GameBoard;
