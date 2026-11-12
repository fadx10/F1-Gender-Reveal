export type GenderWinner = 'boy' | 'girl';

export type GameStage = 'INTRO' | 'LIGHTS_OUT' | 'RACE' | 'REVEAL';

export interface GenderRevealConfig {
  winner: GenderWinner;
  parentsNames: string;
  babyDueDate: string;
  customMessage: string;
  circuitName: string;
}

export interface RaceTelemetry {
  p1: 'boy' | 'girl';
  p2: 'boy' | 'girl';
  gapSeconds: number;
  lap: number;
  totalLaps: number;
  boySpeed: number;
  girlSpeed: number;
  boyDrs: boolean;
  girlDrs: boolean;
  sector: 1 | 2 | 3;
}

export interface RaceRadioMessage {
  id: string;
  second: number;
  lap: string;
  text: string;
  type: 'radio' | 'commentator' | 'overtake' | 'flag' | 'finish';
  team?: 'boy' | 'girl';
}
