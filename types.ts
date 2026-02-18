export type GameMode = 'TIENLEN' | 'XIDACH';

export interface Player {
  id: string;
  name: string;
  score: number;
}

export interface TienLenRules {
  FIRST: number;
  SECOND: number;
  THIRD: number;
  LAST: number;
  PIG_BLACK: number;
  PIG_RED: number;
}

export const DEFAULT_TIENLEN_RULES: TienLenRules = {
  FIRST: 5,
  SECOND: 3,
  THIRD: -3,
  LAST: -5,
  PIG_BLACK: 3,
  PIG_RED: 6,
};

export interface GameState {
  players: Player[];
  history: any[];
  mode?: GameMode;
  dealerId?: string | null;
  tienLenRules?: TienLenRules;
  defaultBets?: Record<string, number>;
}