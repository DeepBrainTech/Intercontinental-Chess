export type PlayerColor = 'w' | 'b';
export type ArmyType = 'western' | 'empire' | 'african';
export type PieceType = 'k' | 'q' | 'r' | 'b' | 'n' | 'p';

export interface Piece {
    type: PieceType;
    color: PlayerColor;
    army: ArmyType;
    charges: number; // For special abilities (e.g., cannon, leopard)
}

export interface Position {
    r: number;
    c: number;
}

export interface Move {
    from: Position;
    to: Position;
    isJumpCapture?: boolean;
    promotion?: PieceType;
}

export interface GameState {
    board: (Piece | null)[][];
    turn: PlayerColor;
    isGameOver: boolean;
    winner: PlayerColor | null;
    statusMessage: string;
    lastMove: { from: Position; to: Position } | null;
    inCheck: boolean;
    history?: GameState[];
}

export interface GameConfig {
    whiteArmy: ArmyType;
    blackArmy: ArmyType;
    mode: 'pvp' | 'ai';
}
