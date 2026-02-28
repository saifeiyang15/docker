import { Vector3 } from 'three';

export const BOARD_CONFIG = {
  width: 28,
  height: 28,
  thickness: 0.6,
  trackRadius: 11,
  homeBaseSize: 3.0,
  centerRadius: 2.2,
  /** 沙滩岛屿半径 */
  islandRadius: 18,
  /** 沙滩高度（水面以上） */
  sandHeight: 0.3,
};

export const COLORS = {
  red: '#ff4d4f',
  blue: '#1890ff',
  green: '#52c41a',
  yellow: '#faad14',
  trackDefault: '#f5e6c8',
  trackSafe: '#00e5ff',
  trackStart: '#7c4dff',
  border: '#d2b48c',
  ground: '#f0d9a0',
  sand: '#f5deb3',
  sandDark: '#d2b48c',
  water: '#0072ff',
};

export const PATH_MAP = {
  totalSteps: 72,
  safeZones: [0, 6, 12, 18, 24, 30, 36, 42, 48, 54, 60, 66],
};

export const CAMERA_DEFAULT = {
  /** 默认水平 320°，俯仰 80° */
  azimuthDeg: 320,
  polarDeg: 80,
  distance: 55,
  fov: 55,
  target: new Vector3(0, 1, 0),
};

export const LIGHT_CONFIG = {
  ambientIntensity: 0.8,
  dirLightPosition: [-30, 52.5, 30],
  dirLightIntensity: 1.0,
};
