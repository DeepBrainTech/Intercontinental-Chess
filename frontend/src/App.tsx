import { useEffect, useState } from 'react';
import { socket } from './socket';
import { GameInfo } from './components/GameInfo';

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
      <div className="mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-yellow-500 mb-2 tracking-wider font-serif-sc">
          Intercontinental Chess
        </h1>
        <p className="text-gray-400 italic">Pre-Alpha Build</p>
      </div>

      <GameInfo isConnected={isConnected} lastPing={lastPing} />

      <div className="mt-8 text-sm text-gray-600">
        Waiting for game logic migration...
      </div>
    </div>
  );
}

export default App;
