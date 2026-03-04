import { Piece as PieceType, Position } from '../types';
import { Piece } from './Piece';

interface SquareProps {
    piece: PieceType | null;
    pos: Position;
    isSelected: boolean;
    isLastMove: boolean;
    isValidMove: boolean;
    isCaptureTarget: boolean;
    inCheck: boolean;
    onClick: () => void;
}

export const Square = ({ piece, pos, isSelected, isLastMove, isValidMove, isCaptureTarget, inCheck, onClick }: SquareProps) => {
    const isDark = (pos.r + pos.c) % 2 === 1;
    
    // Base Color
    let bgClass = isDark ? 'bg-board-dark' : 'bg-board-light';

    // Overlays
    if (isSelected) bgClass = 'bg-[#64c864]/60'; // Greenish selection
    else if (inCheck) bgClass = 'bg-[radial-gradient(circle,rgba(255,0,0,0.8)_0%,rgba(255,0,0,0)_70%)]';
    else if (isLastMove) bgClass = 'bg-yellow-400/30';

    return (
        <div 
            className={`
                w-full h-full flex items-center justify-center relative select-none cursor-pointer
                ${bgClass}
            `}
            onClick={onClick}
        >
            {/* Move Hint Dot */}
            {isValidMove && !isCaptureTarget && (
                <div className="w-[30%] h-[30%] rounded-full bg-move-hint shadow-sm z-0"></div>
            )}

            {/* Capture Ring */}
            {isCaptureTarget && (
                <div className="absolute w-[85%] h-[85%] rounded-full border-[6px] border-capture-hint shadow-sm z-0"></div>
            )}

            {/* Piece Layer */}
            {piece && (
                <div className="absolute inset-0 flex items-center justify-center z-10 hover:scale-105 transition-transform active:scale-110 active:cursor-grabbing">
                    <Piece piece={piece} />
                </div>
            )}
            
            {/* Coordinate Label (Optional Debug) */}
            {/* <span className="absolute bottom-0 right-0 text-[8px] opacity-30">{pos.r},{pos.c}</span> */}
        </div>
    );
};
