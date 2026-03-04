import { Piece, PlayerColor, Position, Move, GameState, ArmyType, PieceType } from './types';

export class ChessGame {
    board: (Piece | null)[][];
    turn: PlayerColor;
    isGameOver: boolean;
    winner: PlayerColor | null;
    statusMessage: string;
    lastMove: { from: Position; to: Position } | null;
    inCheck: boolean;
    
    // History could be stored here or in a separate manager
    history: GameState[] = [];

    // Special state tracking
    castling: { w: { k: boolean, q: boolean }, b: { k: boolean, q: boolean } };
    enPassant: Position | null;

    constructor(whiteArmy: ArmyType = 'western', blackArmy: ArmyType = 'empire') {
        this.board = Array(8).fill(null).map(() => Array(8).fill(null));
        this.turn = 'w';
        this.isGameOver = false;
        this.winner = null;
        this.statusMessage = "White's Turn";
        this.lastMove = null;
        this.inCheck = false;
        this.castling = { w: { k: true, q: true }, b: { k: true, q: true } };
        this.enPassant = null;

        this.initBoard(whiteArmy, blackArmy);
    }

    private initBoard(whiteArmy: ArmyType, blackArmy: ArmyType) {
        const setupRow = (row: number, color: PlayerColor, army: ArmyType) => {
            const types: PieceType[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
            types.forEach((type, col) => {
                this.placePiece(row, col, type, color, army);
            });
        };

        // White Setup (Bottom, Row 7)
        setupRow(7, 'w', whiteArmy);
        for (let c = 0; c < 8; c++) this.placePiece(6, c, 'p', 'w', whiteArmy);

        // Black Setup (Top, Row 0)
        setupRow(0, 'b', blackArmy);
        for (let c = 0; c < 8; c++) this.placePiece(1, c, 'p', 'b', blackArmy);
    }

    private placePiece(r: number, c: number, type: PieceType, color: PlayerColor, army: ArmyType) {
        const piece: Piece = { type, color, army, charges: 0 };
        
        // Special charges logic based on Army Type
        if (army === 'empire') {
            if (type === 'q') piece.charges = 2; // Cannon
        } else if (army === 'african') {
            if (type === 'q') piece.charges = 1; // Leopard
            if (type === 'b') piece.charges = 1; // Chimpanzee
        }
        
        this.board[r][c] = piece;
    }

    public getGameState(): GameState {
        return {
            board: this.board, // In a real app, maybe deep copy to be safe
            turn: this.turn,
            isGameOver: this.isGameOver,
            winner: this.winner,
            statusMessage: this.statusMessage,
            lastMove: this.lastMove,
            inCheck: this.inCheck
        };
    }

    // --- Core Move Logic ---

    private isValidPos(r: number, c: number): boolean {
        return r >= 0 && r < 8 && c >= 0 && c < 8;
    }

    private getPseudoMoves(r: number, c: number, piece: Piece, boardState = this.board): Move[] {
        const moves: Move[] = [];
        const { type, color, army, charges } = piece;
        const opponent = color === 'w' ? 'b' : 'w';
        
        const addMove = (tr: number, tc: number, isJumpCapture = false) => {
            moves.push({ from: { r, c }, to: { r: tr, c: tc }, isJumpCapture });
        };

        const orth = [[1,0], [-1,0], [0,1], [0,-1]];
        const diag = [[1,1], [1,-1], [-1,1], [-1,-1]];
        const knightDirs = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];

        // 1. Pawn Logic
        if (type === 'p') {
            const forward = color === 'w' ? -1 : 1;
            const startRow = color === 'w' ? 6 : 1;
            
            // Move forward 1
            if (this.isValidPos(r + forward, c) && !boardState[r + forward][c]) {
                addMove(r + forward, c);
                // Move forward 2
                if (r === startRow && this.isValidPos(r + forward * 2, c) && !boardState[r + forward * 2][c]) {
                    addMove(r + forward * 2, c);
                }
            }
            // Captures
            [[forward, -1], [forward, 1]].forEach(([dr, dc]) => {
                const tr = r + dr, tc = c + dc;
                if (this.isValidPos(tr, tc)) {
                    const target = boardState[tr][tc];
                    if (target && target.color === opponent) {
                        addMove(tr, tc);
                    } else if (this.enPassant && this.enPassant.r === tr && this.enPassant.c === tc) {
                        // En Passant capture logic handled in execution
                        addMove(tr, tc); 
                    }
                }
            });
        }

        // 2. Knight Logic
        if (type === 'n') {
            knightDirs.forEach(([dr, dc]) => {
                const tr = r + dr, tc = c + dc;
                if (this.isValidPos(tr, tc)) {
                    const target = boardState[tr][tc];
                    if (!target || target.color !== color) addMove(tr, tc);
                }
            });
        }

        // 3. King Logic
        if (type === 'k') {
            [...orth, ...diag].forEach(([dr, dc]) => {
                const tr = r + dr, tc = c + dc;
                if (this.isValidPos(tr, tc)) {
                    const target = boardState[tr][tc];
                    if (!target || target.color !== color) addMove(tr, tc);
                }
            });

            // Castling (Only if checking real board state, simplified here)
            // We'll refine castling validation in getLegalMoves to check for attacks
            if (boardState === this.board && !this.inCheck) {
                if (color === 'w' && r === 7 && c === 4) {
                    if (this.castling.w.k && !boardState[7][5] && !boardState[7][6]) addMove(7, 6);
                    if (this.castling.w.q && !boardState[7][3] && !boardState[7][2] && !boardState[7][1]) addMove(7, 2);
                }
                if (color === 'b' && r === 0 && c === 4) {
                    if (this.castling.b.k && !boardState[0][5] && !boardState[0][6]) addMove(0, 6);
                    if (this.castling.b.q && !boardState[0][3] && !boardState[0][2] && !boardState[0][1]) addMove(0, 2);
                }
            }
        }

        // 4. Sliding & Jumping Logic (Rook, Bishop, Queen/Cannon/Leopard)
        const slideAndJump = (dirs: number[][], canSlide: boolean, canJump: boolean, chargesCost: number) => {
            dirs.forEach(([dr, dc]) => {
                let i = 1;
                let screenFound = false;
                while (true) {
                    const tr = r + dr * i, tc = c + dc * i;
                    if (!this.isValidPos(tr, tc)) break;
                    
                    const target = boardState[tr][tc];
                    
                    if (!screenFound) {
                        // Standard sliding
                        if (!target) {
                            if (canSlide) addMove(tr, tc);
                        } else {
                            // Hit a piece
                            if (canSlide && target.color !== color) addMove(tr, tc);
                            screenFound = true; // Now looking for jump target if capable
                        }
                    } else {
                        // After screen (jumping logic)
                        if (canJump && charges > 0) {
                            if (target) {
                                if (target.color !== color) addMove(tr, tc, true); // Jump capture
                                break; // Stop after jump target found
                            }
                        } else {
                            break; // Cannot jump or no charges
                        }
                    }
                    i++;
                }
            });
        };

        if (type === 'r') slideAndJump(orth, true, false, 0);
        if (type === 'b') slideAndJump(diag, true, (army === 'african'), 1); // African Chimp jumps
        if (type === 'q') {
            if (army === 'empire' || army === 'african') {
                // Cannon / Leopard: Orthogonal slide + Jump
                slideAndJump(orth, true, true, 1);
            } else {
                // Western Queen: Standard slide
                slideAndJump([...orth, ...diag], true, false, 0);
            }
        }

        return moves;
    }

    private isSquareAttacked(r: number, c: number, attackerColor: PlayerColor, boardState = this.board): boolean {
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const p = boardState[i][j];
                if (p && p.color === attackerColor) {
                    const moves = this.getPseudoMoves(i, j, p, boardState);
                    if (moves.some(m => m.to.r === r && m.to.c === c)) return true;
                }
            }
        }
        return false;
    }

    public getLegalMoves(r: number, c: number): Move[] {
        const piece = this.board[r][c];
        if (!piece || piece.color !== this.turn) return [];

        const pseudoMoves = this.getPseudoMoves(r, c, piece, this.board);
        const legalMoves: Move[] = [];

        pseudoMoves.forEach(move => {
            // Simulate move
            const nextBoard = this.board.map(row => row.map(p => p ? { ...p } : null));
            const movingPiece = nextBoard[r][c]!;
            
            // Apply jump cost
            if (move.isJumpCapture) movingPiece.charges--;
            
            nextBoard[r][c] = null;
            nextBoard[move.to.r][move.to.c] = movingPiece;

            // En Passant Capture Simulation
            if (piece.type === 'p' && move.to.c !== c && !this.board[move.to.r][move.to.c]) {
                // Remove the pawn being captured en passant
                nextBoard[r][move.to.c] = null; 
            }

            // Find King
            let kingPos: Position | null = null;
            for (let i = 0; i < 8; i++) {
                for (let j = 0; j < 8; j++) {
                    const p = nextBoard[i][j];
                    if (p && p.color === piece.color && p.type === 'k') {
                        kingPos = { r: i, c: j };
                        break;
                    }
                }
            }

            // Verify King Safety
            if (kingPos) {
                const opponent = piece.color === 'w' ? 'b' : 'w';
                if (!this.isSquareAttacked(kingPos.r, kingPos.c, opponent, nextBoard)) {
                    // Castling specific checks (path safety)
                    if (piece.type === 'k' && Math.abs(move.to.c - c) === 2) {
                        const row = r;
                        const dir = (move.to.c - c) > 0 ? 1 : -1;
                        // Check if path is attacked
                        if (!this.isSquareAttacked(row, c, opponent, this.board) &&
                            !this.isSquareAttacked(row, c + dir, opponent, this.board) &&
                            !this.isSquareAttacked(row, c + 2 * dir, opponent, this.board)) {
                            legalMoves.push(move);
                        }
                    } else {
                        legalMoves.push(move);
                    }
                }
            }
        });

        return legalMoves;
    }

    public makeMove(from: Position, to: Position, promotion: PieceType = 'q'): boolean {
        if (this.isGameOver) return false;

        const moves = this.getLegalMoves(from.r, from.c);
        const move = moves.find(m => m.to.r === to.r && m.to.c === to.c);

        if (!move) return false;

        const piece = this.board[from.r][from.c]!;
        const target = this.board[to.r][to.c];

        // 1. Update Castling Rights
        if (piece.type === 'k') {
            this.castling[piece.color].k = false;
            this.castling[piece.color].q = false;
        } else if (piece.type === 'r') {
            if (from.r === 0 || from.r === 7) {
                if (from.c === 0) this.castling[piece.color].q = false;
                if (from.c === 7) this.castling[piece.color].k = false;
            }
        }

        // 2. Handle Castling Move (Move Rook)
        if (piece.type === 'k' && Math.abs(to.c - from.c) === 2) {
            const isKingSide = to.c > from.c;
            const rookSrcCol = isKingSide ? 7 : 0;
            const rookDstCol = isKingSide ? 5 : 3;
            const rook = this.board[to.r][rookSrcCol];
            this.board[to.r][rookDstCol] = rook;
            this.board[to.r][rookSrcCol] = null;
        }

        // 3. Handle En Passant Capture
        if (piece.type === 'p' && to.c !== from.c && !target) {
            // Remove captured pawn
            this.board[from.r][to.c] = null;
        }

        // 4. Update Charges
        if (move.isJumpCapture) piece.charges--;

        // 5. Move Piece
        this.board[to.r][to.c] = piece;
        this.board[from.r][from.c] = null;

        // 6. Handle Promotion
        if (piece.type === 'p' && (to.r === 0 || to.r === 7)) {
            // Simplified: Auto-queen or use provided promotion type
            // In a real game, we'd wait for user input, but here we take the arg
            // Re-create piece with correct army/charges logic
            this.placePiece(to.r, to.c, promotion, piece.color, piece.army);
        }

        // 7. Update En Passant State
        if (piece.type === 'p' && Math.abs(to.r - from.r) === 2) {
            this.enPassant = { r: (to.r + from.r) / 2, c: to.c };
        } else {
            this.enPassant = null;
        }

        // 8. Update Last Move
        this.lastMove = { from, to };

        // 9. Switch Turn & Check Status
        this.finishTurn();

        return true;
    }

    private finishTurn() {
        this.turn = this.turn === 'w' ? 'b' : 'w';
        
        // Check for Game Over conditions
        let hasMoves = false;
        let kingFound = false;
        let kingPos: Position | null = null;

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = this.board[r][c];
                if (p && p.color === this.turn) {
                    if (p.type === 'k') {
                        kingFound = true;
                        kingPos = { r, c };
                    }
                    if (this.getLegalMoves(r, c).length > 0) {
                        hasMoves = true;
                    }
                }
            }
        }

        // King capture check (shouldn't happen in legal chess but good for safety)
        if (!kingFound) {
            this.isGameOver = true;
            this.winner = this.turn === 'w' ? 'b' : 'w';
            this.statusMessage = `${this.winner === 'w' ? 'White' : 'Black'} Wins (King Captured)`;
            return;
        }

        this.inCheck = kingPos ? this.isSquareAttacked(kingPos.r, kingPos.c, this.turn === 'w' ? 'b' : 'w') : false;

        if (!hasMoves) {
            this.isGameOver = true;
            if (this.inCheck) {
                this.winner = this.turn === 'w' ? 'b' : 'w';
                this.statusMessage = `Checkmate! ${this.winner === 'w' ? 'White' : 'Black'} Wins`;
            } else {
                this.winner = null; // Draw
                this.statusMessage = "Stalemate! Draw";
            }
        } else {
            if (this.inCheck) {
                this.statusMessage = "Check!";
            } else {
                this.statusMessage = `${this.turn === 'w' ? "White" : "Black"}'s Turn`;
            }
        }
    }
}
