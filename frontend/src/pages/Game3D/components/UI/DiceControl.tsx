import React from 'react';
import { useGame } from '../../GameContext';
import { glassStyle, buttonStyle } from './styles';

export const DiceControl: React.FC = () => {
  const { phase, diceValue, rollDiceAction, currentPlayerIndex, players } = useGame();
  const currentPlayer = players[currentPlayerIndex];

  const canRoll = phase === 'waiting' && !currentPlayer.isComputer;

  return (
    <div style={{ ...glassStyle, marginTop: '10px', textAlign: 'center' }}>
      <h3 style={{ margin: '0 0 10px 0' }}>Dice Control</h3>
      
      <div style={{ 
        fontSize: '36px', 
        fontWeight: 'bold', 
        color: '#4a5b6d',
        height: '50px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {diceValue > 0 ? diceValue : '-'}
      </div>

      <button 
        style={{
          ...buttonStyle,
          opacity: canRoll ? 1 : 0.5,
          cursor: canRoll ? 'pointer' : 'not-allowed',
          background: canRoll ? buttonStyle.background : '#ccc'
        }}
        onClick={rollDiceAction}
        disabled={!canRoll}
      >
        {phase === 'rolling' ? 'Rolling...' : 'Roll Dice'}
      </button>

      <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
        Current Turn: <span style={{ color: currentPlayer.color, fontWeight: 'bold' }}>{currentPlayer.name}</span>
      </div>
    </div>
  );
};
