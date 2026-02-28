import { GameTask3D } from '../types';

const TASK_TEMPLATES: Array<Omit<GameTask3D, 'id' | 'position'>> = [
  { title: '甜蜜拥抱', description: '给对方一个温暖的拥抱，持续10秒', type: 'BONUS', reward: 0, timeLimit: 10 },
  { title: '前进两步', description: '运气不错！额外前进2步', type: 'FORWARD', reward: 2, timeLimit: 0 },
  { title: '情话时刻', description: '对对方说一句最甜的情话', type: 'BONUS', reward: 0, timeLimit: 30 },
  { title: '后退一步', description: '哎呀！后退1步', type: 'BACKWARD', reward: 1, timeLimit: 0 },
  { title: '比心挑战', description: '用双手比出一个爱心，保持5秒', type: 'CHALLENGE', reward: 0, timeLimit: 5 },
  { title: '前进三步', description: '大步向前！额外前进3步', type: 'FORWARD', reward: 3, timeLimit: 0 },
  { title: '眼神对视', description: '和对方深情对视10秒，不许笑', type: 'BONUS', reward: 0, timeLimit: 10 },
  { title: '后退两步', description: '小小挫折，后退2步', type: 'BACKWARD', reward: 2, timeLimit: 0 },
  { title: '猜歌挑战', description: '哼一首你们的歌，让对方猜', type: 'CHALLENGE', reward: 0, timeLimit: 30 },
  { title: '前进一步', description: '稳步前进！额外前进1步', type: 'FORWARD', reward: 1, timeLimit: 0 },
  { title: '亲亲脸颊', description: '亲对方的脸颊一下', type: 'BONUS', reward: 0, timeLimit: 5 },
  { title: '模仿挑战', description: '模仿对方的一个招牌动作', type: 'CHALLENGE', reward: 0, timeLimit: 20 },
  { title: '后退三步', description: '遇到障碍，后退3步', type: 'BACKWARD', reward: 3, timeLimit: 0 },
  { title: '撒娇时刻', description: '对对方撒个娇，越可爱越好', type: 'BONUS', reward: 0, timeLimit: 15 },
  { title: '前进两步', description: '顺风顺水！额外前进2步', type: 'FORWARD', reward: 2, timeLimit: 0 },
  { title: '夸夸对方', description: '说出对方3个你最喜欢的优点', type: 'BONUS', reward: 0, timeLimit: 30 },
  { title: '舞蹈挑战', description: '和对方一起跳一段即兴舞蹈', type: 'CHALLENGE', reward: 0, timeLimit: 20 },
  { title: '后退一步', description: '小小退步，后退1步', type: 'BACKWARD', reward: 1, timeLimit: 0 },
  { title: '牵手散步', description: '牵着对方的手绕房间走一圈', type: 'BONUS', reward: 0, timeLimit: 30 },
  { title: '前进一步', description: '继续前进！额外前进1步', type: 'FORWARD', reward: 1, timeLimit: 0 },
  { title: '自拍时刻', description: '和对方一起拍一张搞怪自拍', type: 'BONUS', reward: 0, timeLimit: 20 },
  { title: '真心话', description: '回答对方一个真心话问题', type: 'CHALLENGE', reward: 0, timeLimit: 30 },
  { title: '前进三步', description: '飞速前进！额外前进3步', type: 'FORWARD', reward: 3, timeLimit: 0 },
  { title: '后退两步', description: '遇到小坑，后退2步', type: 'BACKWARD', reward: 2, timeLimit: 0 },
  { title: '喂食挑战', description: '闭着眼睛喂对方吃一颗糖', type: 'CHALLENGE', reward: 0, timeLimit: 20 },
  { title: '许愿时刻', description: '和对方一起许一个愿望', type: 'BONUS', reward: 0, timeLimit: 15 },
  { title: '前进两步', description: '好运来了！额外前进2步', type: 'FORWARD', reward: 2, timeLimit: 0 },
  { title: '画像挑战', description: '用手指在对方手心画一个爱心', type: 'CHALLENGE', reward: 0, timeLimit: 10 },
  { title: '后退一步', description: '稍作休息，后退1步', type: 'BACKWARD', reward: 1, timeLimit: 0 },
  { title: '回忆杀', description: '分享你们在一起最美好的一个回忆', type: 'BONUS', reward: 0, timeLimit: 30 },
  { title: '前进一步', description: '小步前进！额外前进1步', type: 'FORWARD', reward: 1, timeLimit: 0 },
  { title: '昵称大赛', description: '给对方取一个新的甜蜜昵称', type: 'BONUS', reward: 0, timeLimit: 15 },
  { title: '默契考验', description: '同时说出一个数字，看是否一样', type: 'CHALLENGE', reward: 0, timeLimit: 10 },
  { title: '后退两步', description: '小小波折，后退2步', type: 'BACKWARD', reward: 2, timeLimit: 0 },
  { title: '前进三步', description: '冲刺时刻！额外前进3步', type: 'FORWARD', reward: 3, timeLimit: 0 },
  { title: '按摩时光', description: '给对方按摩肩膀30秒', type: 'BONUS', reward: 0, timeLimit: 30 },
  { title: '表白宣言', description: '大声说出"我爱你"三遍', type: 'BONUS', reward: 0, timeLimit: 10 },
  { title: '前进两步', description: '加速前进！额外前进2步', type: 'FORWARD', reward: 2, timeLimit: 0 },
  { title: '后退一步', description: '慢一拍，后退1步', type: 'BACKWARD', reward: 1, timeLimit: 0 },
  { title: '唱歌挑战', description: '唱一首对方最喜欢的歌的副歌', type: 'CHALLENGE', reward: 0, timeLimit: 30 },
  { title: '感恩时刻', description: '说出3件你感谢对方的事', type: 'BONUS', reward: 0, timeLimit: 30 },
  { title: '前进一步', description: '稳扎稳打！额外前进1步', type: 'FORWARD', reward: 1, timeLimit: 0 },
  { title: '后退三步', description: '大风大浪，后退3步', type: 'BACKWARD', reward: 3, timeLimit: 0 },
  { title: '情书挑战', description: '即兴写一句情诗给对方', type: 'CHALLENGE', reward: 0, timeLimit: 30 },
  { title: '承诺时刻', description: '对对方许一个小小的承诺', type: 'BONUS', reward: 0, timeLimit: 20 },
  { title: '前进两步', description: '势如破竹！额外前进2步', type: 'FORWARD', reward: 2, timeLimit: 0 },
  { title: '猜心挑战', description: '猜对方现在最想做的一件事', type: 'CHALLENGE', reward: 0, timeLimit: 15 },
  { title: '后退一步', description: '小小退让，后退1步', type: 'BACKWARD', reward: 1, timeLimit: 0 },
  { title: '头碰头', description: '和对方额头轻轻碰在一起5秒', type: 'BONUS', reward: 0, timeLimit: 5 },
  { title: '前进一步', description: '一步一个脚印！额外前进1步', type: 'FORWARD', reward: 1, timeLimit: 0 },
  { title: '对唱挑战', description: '和对方合唱一首歌', type: 'CHALLENGE', reward: 0, timeLimit: 30 },
  { title: '后退两步', description: '暂时后退，后退2步', type: 'BACKWARD', reward: 2, timeLimit: 0 },
  { title: '前进三步', description: '一飞冲天！额外前进3步', type: 'FORWARD', reward: 3, timeLimit: 0 },
  { title: '比划猜词', description: '用动作比划一个词让对方猜', type: 'CHALLENGE', reward: 0, timeLimit: 20 },
  { title: '甜蜜告白', description: '用最深情的语气说"你是我的全世界"', type: 'BONUS', reward: 0, timeLimit: 10 },
  { title: '前进两步', description: '乘风破浪！额外前进2步', type: 'FORWARD', reward: 2, timeLimit: 0 },
  { title: '后退一步', description: '小小绊脚石，后退1步', type: 'BACKWARD', reward: 1, timeLimit: 0 },
  { title: '拍手游戏', description: '和对方玩一轮拍手游戏', type: 'CHALLENGE', reward: 0, timeLimit: 15 },
  { title: '前进一步', description: '继续加油！额外前进1步', type: 'FORWARD', reward: 1, timeLimit: 0 },
  { title: '公主抱', description: '尝试公主抱对方（或被公主抱）', type: 'BONUS', reward: 0, timeLimit: 10 },
  { title: '后退两步', description: '遇到逆风，后退2步', type: 'BACKWARD', reward: 2, timeLimit: 0 },
  { title: '前进两步', description: '好运连连！额外前进2步', type: 'FORWARD', reward: 2, timeLimit: 0 },
  { title: '石头剪刀布', description: '和对方玩三局石头剪刀布', type: 'CHALLENGE', reward: 0, timeLimit: 15 },
  { title: '耳语时刻', description: '在对方耳边悄悄说一句甜蜜的话', type: 'BONUS', reward: 0, timeLimit: 10 },
  { title: '后退一步', description: '小小后退，后退1步', type: 'BACKWARD', reward: 1, timeLimit: 0 },
  { title: '前进三步', description: '最后冲刺！额外前进3步', type: 'FORWARD', reward: 3, timeLimit: 0 },
  { title: '拥抱转圈', description: '抱着对方原地转一圈', type: 'BONUS', reward: 0, timeLimit: 10 },
  { title: '前进一步', description: '胜利在望！额外前进1步', type: 'FORWARD', reward: 1, timeLimit: 0 },
  { title: '后退两步', description: '最后的考验，后退2步', type: 'BACKWARD', reward: 2, timeLimit: 0 },
  { title: '终点挑战', description: '和对方一起大喊"我们是最棒的！"', type: 'CHALLENGE', reward: 0, timeLimit: 5 },
  { title: '前进两步', description: '冲向终点！额外前进2步', type: 'FORWARD', reward: 2, timeLimit: 0 },
  { title: '甜蜜合照', description: '和对方摆一个最甜蜜的pose合照', type: 'BONUS', reward: 0, timeLimit: 15 },
];

export const generateTasks = (): GameTask3D[] => {
  const tasks: GameTask3D[] = [];
  for (let i = 0; i < 72; i++) {
    const template = TASK_TEMPLATES[i % TASK_TEMPLATES.length];
    tasks.push({
      id: i + 1,
      position: i,
      ...template,
    });
  }
  return tasks;
};

export const TASK_TYPE_ICONS: Record<string, string> = {
  FORWARD: '⬆',
  BACKWARD: '⬇',
  BONUS: '💰',
  CHALLENGE: '⚡',
};

export const TASK_TYPE_FULL_ICONS: Record<string, string> = {
  FORWARD: '⬆️',
  BACKWARD: '⬇️',
  BONUS: '💰',
  CHALLENGE: '🏆',
};

export const TASK_TYPE_COLORS: Record<string, string> = {
  FORWARD: '#00ff88',
  BACKWARD: '#ff4444',
  BONUS: '#ff69b4',
  CHALLENGE: '#ffd700',
};
