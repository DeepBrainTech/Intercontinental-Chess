import { useEffect, useState } from 'react';
import { socket } from '../socket';
import { GameState, Position, Move } from '../types';
import { Square } from './Square';

export const Board = () => {
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [selectedPos, setSelectedPos] = useState<Position | null>(null);
    const [validMoves, setValidMoves] = useState<Move[]>([]);

    useEffect(() => {
        // Listen for game state updates
        socket.on('game_state', (state: GameState) => {
            setGameState(state);
            // Clear selection on update if needed, or keep if valid
            // Usually clearing is safer to avoid stale state
            if (state.lastMove) {
                 // Check if it was our move, if so clear selection
            }
        });

        socket.on('legal_moves', (data: { from: Position, moves: Move[] }) => {
            // Ensure the moves are for the currently selected piece
            if (selectedPos && data.from.r === selectedPos.r && data.from.c === selectedPos.c) {
                setValidMoves(data.moves);
            }
        });

        socket.on('error', (err: { message: string }) => {
            console.error("Game Error:", err.message);
            // Could show a toast here
        });

        return () => {
            socket.off('game_state');
            socket.off('legal_moves');
            socket.off('error');
        };
    }, [selectedPos]);

    const handleSquareClick = (r: number, c: number) => {
        if (!gameState) return;

        const piece = gameState.board[r][c];
        const isMyTurn = gameState.turn === 'w'; // TODO: Check actual player color when MP implemented
        const isMyPiece = piece && piece.color === gameState.turn;

        // 1. If clicking a valid move target (and we have a selection)
        const move = validMoves.find(m => m.to.r === r && m.to.c === c);
        
        if (selectedPos && move) {
            // Execute Move
            socket.emit('make_move', {
                from: selectedPos,
                to: { r, c },
                promotion: 'q' // Default promotion for now
            });
            setSelectedPos(null);
            setValidMoves([]);
            return;
        }

        // 2. If clicking own piece -> Select it
        if (isMyPiece && isMyTurn) {
            // If clicking same piece, deselect
            if (selectedPos?.r === r && selectedPos?.c === c) {
                setSelectedPos(null);
                setValidMoves([]);
            } else {
                setSelectedPos({ r, c });
                setValidMoves([]); // Clear old moves first
                socket.emit('get_legal_moves', { r, c });
            }
            return;
        }

        // 3. Clicking empty space or enemy without valid move -> Deselect
        setSelectedPos(null);
        setValidMoves([]);
    };

    if (!gameState) return <div className="text-white animate-pulse">Loading Board...</div>;

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Status Bar */}
            <div className={`
                px-6 py-2 rounded-lg font-bold text-lg shadow-lg transition-colors duration-300
                ${gameState.isGameOver ? 'bg-purple-600 text-white animate-bounce' : 
                  gameState.inCheck ? 'bg-red-600 text-white animate-pulse' :
                  gameState.turn === 'w' ? 'bg-white text-black' : 'bg-black text-white border border-gray-600'}
            `}>
                {gameState.statusMessage}
            </div>

            {/* Board Grid */}
            <div className="relative p-2 bg-gray-800 rounded-lg shadow-2xl border border-gray-700">
                <div className="grid grid-cols-8 grid-rows-8 w-[min(90vw,70vh)] h-[min(90vw,70vh)] border-2 border-gray-600">
                    {/* Render rows (0 is top for black, 7 is bottom for white) */}
                    {gameState.board.map((row, r) => (
                        row.map((piece, c) => {
                            const isSelected = selectedPos?.r === r && selectedPos?.c === c;
                            const isLastMove = (gameState.lastMove?.from.r === r && gameState.lastMove?.from.c === c) ||
                                               (gameState.lastMove?.to.r === r && gameState.lastMove?.to.c === c);
                            
                            const validMove = validMoves.find(m => m.to.r === r && m.to.c === c);
                            const isCaptureTarget = !!(validMove && (piece || (selectedPos && gameState.board[selectedPos.r][selectedPos.c]?.type === 'p' && c !== selectedPos.c)));
                            
                            const inCheck = piece?.type === 'k' && piece.color === gameState.turn && gameState.inCheck;

                            return (
                                <Square 
                                    key={`${r}-${c}`}
                                    piece={piece}
                                    pos={{ r, c }}
                                    isSelected={isSelected}
                                    isLastMove={!!isLastMove}
                                    isValidMove={!!validMove}
                                    isCaptureTarget={isCaptureTarget}
                                    inCheck={!!inCheck}
                                    onClick={() => handleSquareClick(r, c)}
                                />
                            );
                        })
                    ))}
                </div>
            </div>

             {/* Controls */}
             <div className="flex gap-4">
                <button 
                    onClick={() => socket.emit('reset_game')}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm font-bold transition"
                >
                    Reset Game
                </button>
            </div>
        </div>
    );
};
