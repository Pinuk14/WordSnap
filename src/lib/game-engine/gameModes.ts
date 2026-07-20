import { GameMode } from './types';
import { 
  CLASSIC_LIVES, 
  SPEED_LIVES, 
  CATEGORY_LIVES, 
  TURN_TIME_CLASSIC, 
  TURN_TIME_SPEED, 
  TURN_TIME_CATEGORY 
} from './constants';

export function getInitialLives(mode: GameMode): number {
  switch (mode) {
    case 'speed': return SPEED_LIVES;
    case 'category': return CATEGORY_LIVES;
    case 'classic':
    default:
      return CLASSIC_LIVES;
  }
}

export function getTurnDuration(mode: GameMode): number {
  switch (mode) {
    case 'speed': return TURN_TIME_SPEED;
    case 'category': return TURN_TIME_CATEGORY;
    case 'classic':
    default:
      return TURN_TIME_CLASSIC;
  }
}
