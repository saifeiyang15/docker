import React from 'react';

/**
 * 沙滩主题下不再需要独立的棋盘底座，
 * 棋盘直接铺设在 BackgroundScene 的沙滩岛屿上。
 * 保留组件以维持 GameBoard 的引用结构。
 */
export const BoardBase: React.FC = () => {
  return null;
};
