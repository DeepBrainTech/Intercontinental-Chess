import { useEffect, useState } from 'react';
import { socket } from './socket';
import { GameInfo } from './components/GameInfo';
import { Board } from './components/Board';

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [lastPing, setLastPing] = useState<number | null>(null);

  useEffect(() => {
    // Event definitions
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    const onServerStatus = (data: { timestamp: number }) => setLastPing(data.timestamp);

    // Listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('server_status', onServerStatus);

    // Cleanup
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('server_status', onServerStatus);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 font-roboto">
      <div className="mb-4 text-center">
        <h1 className="text-3xl md:text-5xl font-bold text-yellow-500 mb-2 tracking-wider font-serif-sc">
          Intercontinental Chess
        </h1>
      </div>

      <div className="flex flex-col xl:flex-row gap-8 items-start justify-center w-full max-w-7xl">
        {/* Left Side: Game Board */}
        <div className="flex-1 flex justify-center w-full">
            <Board />
        </div>

        {/* Right Side: Info Panel */}
        <div className="w-full xl:w-96 flex flex-col gap-4">
             <GameInfo isConnected={isConnected} lastPing={lastPing} />
             
             {/* Future: Chat, Move History, etc. */}
             <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 text-sm text-gray-400">
                <p>Move: Click piece -&gt; Click target</p>
                <p>Rules: Standard + Empire + African</p>
             </div>
        </div>
      </div>
    </div>
  );
}

export default App;
