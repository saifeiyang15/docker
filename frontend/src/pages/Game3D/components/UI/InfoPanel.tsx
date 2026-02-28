import React from 'react';
import { useGame } from '../../GameContext';
import { glassStyle } from './styles';

export const InfoPanel: React.FC = () => {
  const { logs, winner, resetGame } = useGame();

  return (
    <div style={{ ...glassStyle, width: '300px', maxHeight: '200px', display: 'flex', flexDirection: 'column' }}>
      <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#555' }}>Game Logs</h4>
      
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        fontSize: '12px', 
        color: '#333', 
        marginBottom: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        {logs.map((log, i) => (
          <div key={i} style={{ opacity: i === 0 ? 1 : 0.6 }}>
            {i === 0 ? '> ' : ''}{log}
          </div>
        ))}
      </div>

      {winner && (
        <div style={{ 
          textAlign: 'center', 
          padding: '10px', 
          background: 'rgba(255, 215, 0, 0.3)', 
          borderRadius: '8px',
          fontWeight: 'bold',
          marginBottom: '5px'
        }}>
          GAME OVER! Winner: {winner}
        </div>
      )}

      {winner && (
        <button 
          onClick={resetGame}
          style={{
            background: '#ff4d4f',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px',
            cursor: 'pointer',
            pointerEvents: 'auto'
          }}
        >
          Restart Game
        </button>
      )}
    </div>
  );
};
