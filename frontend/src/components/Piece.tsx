import type { Piece as PieceType } from '../types';

interface PieceProps {
    piece: PieceType;
}

const WESTERN_PIECES: Record<string, Record<string, string>> = {
    w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
    b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }
};

const EMPIRE_PIECES: Record<string, string> = { k: '將', q: '砲', r: '車', b: '相', n: '馬', p: '卒' };
const AFRICAN_PIECES: Record<string, string> = { k: '🦁', q: '🐆', r: '🐘', b: '🐵', n: '🦓', p: '🐾' };

export const Piece = ({ piece }: PieceProps) => {
    const { type, color, army, charges } = piece;

    if (army === 'western') {
        return (
            <div className={`
                flex items-center justify-center w-full h-full text-[clamp(2rem,6vw,4rem)] font-bold
                ${color === 'w' 
                    ? 'text-white drop-shadow-[0_1px_1px_#000]' 
                    : 'text-[#111] drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] [text-shadow:0_0_2px_#fff,0_0_1px_#fff]'}
            `}>
                {WESTERN_PIECES[color][type]}
            </div>
        );
    }

    if (army === 'empire') {
        const isCannon = type === 'q';
        const bgGradient = isCannon 
            ? (color === 'w' ? 'bg-gradient-to-br from-[#ffcccc] to-[#ffaaaa]' : 'bg-gradient-to-br from-[#3a1a1a] to-[#1a0505]')
            : (color === 'w' ? 'bg-gradient-to-br from-[#f3e5ab] to-[#d4b483]' : 'bg-gradient-to-br from-[#2a2a2a] to-[#0a0a0a]');
        
        const borderColor = isCannon
            ? (color === 'w' ? 'border-[#d00]' : 'border-[#ff4444]')
            : (color === 'w' ? 'border-[#8b4513]' : 'border-[#666]');
            
        const textColor = isCannon
            ? (color === 'w' ? 'text-[#d00]' : 'text-[#ff4444]')
            : (color === 'w' ? 'text-[#c00]' : 'text-[#d4af37]');

        return (
            <div className={`
                w-[90%] h-[90%] rounded-full border-[3px] shadow-lg flex items-center justify-center
                font-serif-sc font-bold text-[clamp(1.2rem,4vw,2.2rem)] relative
                ${bgGradient} ${borderColor} ${textColor}
            `}>
                {/* Inner Ring */}
                <div className="absolute inset-[3px] rounded-full border border-dashed border-white/20"></div>
                
                {/* Symbol */}
                <span className="relative z-10">{EMPIRE_PIECES[type]}</span>

                {/* Charges */}
                {charges > 0 && (
                    <div className="absolute bottom-0 w-full flex justify-center gap-1">
                        {Array.from({ length: charges }).map((_, i) => (
                            <div key={i} className="w-2 h-2 rounded-full bg-green-500 border border-black shadow-[0_0_4px_#00ff00]"></div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (army === 'african') {
        return (
            <div className={`
                w-[90%] h-[90%] flex items-center justify-center text-[clamp(1.8rem,5vw,3rem)] rounded-full drop-shadow-md
                ${color === 'w' ? 'bg-radial-gradient from-white/30 to-transparent' : 'bg-radial-gradient from-black/40 to-transparent'}
            `}>
                {AFRICAN_PIECES[type]}
                {/* Charges */}
                {charges > 0 && (
                     <div className="absolute bottom-1 w-full flex justify-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500 border border-black shadow-[0_0_4px_#00ff00]"></div>
                    </div>
                )}
            </div>
        );
    }

    return null;
};
