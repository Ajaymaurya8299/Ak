import { useAviatorGame } from "../../lib/stores/useAviatorGame";
import { formatMultiplier } from "../../lib/gameLogic";
import { Card } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { useIsMobile } from "../../hooks/use-is-mobile";

export function GameHistory() {
  const { gameHistory } = useAviatorGame();
  const isMobile = useIsMobile();

  if (isMobile) {
    // On mobile, show a compact horizontal history bar
    return (
      <div className="absolute top-16 left-0 right-0 px-4 z-10">
        <Card className="bg-black/80 border-gray-600 p-2">
          <div className="flex space-x-2 overflow-x-auto">
            {gameHistory.slice(0, 10).map((round, index) => (
              <div
                key={round.id}
                className={`flex-shrink-0 px-2 py-1 rounded text-xs font-semibold ${
                  getMultiplierColor(round.finalMultiplier)
                }`}
              >
                {formatMultiplier(round.finalMultiplier)}
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-64 h-full bg-black/90 border-l border-gray-600 p-4">
      <h3 className="text-white font-semibold mb-4">Recent Rounds</h3>
      
      <ScrollArea className="h-[calc(100vh-6rem)]">
        <div className="space-y-2">
          {gameHistory.length === 0 ? (
            <div className="text-gray-400 text-sm text-center py-8">
              No rounds played yet
            </div>
          ) : (
            gameHistory.map((round, index) => (
              <Card
                key={round.id}
                className="bg-gray-800 border-gray-600 p-3"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-gray-300 text-xs">
                      Round #{gameHistory.length - index}
                    </div>
                    <div className={`text-lg font-bold ${getMultiplierColor(round.finalMultiplier)}`}>
                      {formatMultiplier(round.finalMultiplier)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-400 text-xs">
                      {new Date(round.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Statistics Summary */}
      {gameHistory.length > 0 && (
        <Card className="bg-gray-800 border-gray-600 p-3 mt-4">
          <h4 className="text-white font-semibold mb-2 text-sm">Statistics</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-300">Rounds:</span>
              <span className="text-white">{gameHistory.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Highest:</span>
              <span className="text-green-400">
                {formatMultiplier(Math.max(...gameHistory.map(r => r.finalMultiplier)))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Average:</span>
              <span className="text-yellow-400">
                {formatMultiplier(
                  gameHistory.reduce((sum, r) => sum + r.finalMultiplier, 0) / gameHistory.length
                )}
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function getMultiplierColor(multiplier: number): string {
  if (multiplier < 1.5) return "text-red-400";
  if (multiplier < 2) return "text-yellow-400";
  if (multiplier < 5) return "text-green-400";
  if (multiplier < 10) return "text-blue-400";
  return "text-purple-400";
}
