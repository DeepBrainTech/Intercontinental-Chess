interface GameInfoProps {
    isConnected: boolean;
    lastPing: number | null;
}

export const GameInfo = ({ isConnected, lastPing }: GameInfoProps) => {
    return (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-200 mb-4 border-b border-gray-700 pb-2">
                System Status
            </h2>
            
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">Connection</span>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${
                        isConnected 
                            ? 'bg-green-900/50 text-green-400 border border-green-700' 
                            : 'bg-red-900/50 text-red-400 border border-red-700'
                    }`}>
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        {isConnected ? 'ONLINE' : 'OFFLINE'}
                    </div>
                </div>

                <div className="flex justify-between items-center">
                    <span className="text-gray-400">Server Time</span>
                    <span className="font-mono text-yellow-500">
                        {lastPing ? new Date(lastPing).toLocaleTimeString() : '--:--:--'}
                    </span>
                </div>
            </div>
        </div>
    );
};
