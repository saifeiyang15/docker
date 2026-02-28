import React from 'react';
import { useGame } from '../../GameContext';
import { glassStyle } from './styles';
import { Player } from '../../types';

export const PlayerPanel: React.FC = () => {
  const { players, currentPlayerIndex, pawns } = useGame();

  return (
    <div style={{ ...glassStyle, width: '250px', maxHeight: '400px', overflowY: 'auto' }}>
      <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #ddd', paddingBottom: '8px' }}>Players</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {players.map((player, idx) => {
          const isCurrent = idx === currentPlayerIndex;
          const playerPawns = pawns.filter(p => p.playerId === player.id);
          const finishedCount = playerPawns.filter(p => p.status === 'finished').length;
          
          return (
            <div key={player.id} style={{
              padding: '10px',
              borderRadius: '8px',
              background: isCurrent ? 'rgba(255, 255, 255, 0.4)' : 'transparent',
              border: isCurrent ? `2px solid ${player.color}` : '1px solid transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ 
                  width: '16px', 
                  height: '16px', 
                  borderRadius: '50%', 
                  background: player.color,
                  boxShadow: '0 0 5px rgba(0,0,0,0.2)'
                }} />
                <span style={{ fontWeight: isCurrent ? 'bold' : 'normal' }}>
                  {player.name} {player.isComputer ? '(Bot)' : ''}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {finishedCount > 0 ? '✓' : '-'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
