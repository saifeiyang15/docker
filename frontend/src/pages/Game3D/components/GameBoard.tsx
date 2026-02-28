import React from 'react';
import { BoardBase } from './BoardBase';
import { Track } from './Track';
import { HomeBase } from './HomeBase';
import { CenterTower } from './CenterTower';
import { BOARD_CONFIG } from '../constants';

/**
 * 沙滩主题棋盘：四个玩家基地分布在沙滩四角，
 * 中心是灯塔终点，棋格沿沙滩环形路径分布。
 */
export const GameBoard: React.FC = () => {
  const homeDistance = BOARD_CONFIG.trackRadius + 4;

  return (
    <group>
      <BoardBase />
      <Track />

      {/* 两个玩家基地分布在沙滩两侧 */}
      <HomeBase color="red" position={[homeDistance, 0, homeDistance]} />
      <HomeBase color="blue" position={[-homeDistance, 0, -homeDistance]} />

      {/* 中心灯塔 */}
      <CenterTower />
    </group>
  );
};
