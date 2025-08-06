import { useState } from "react";
import { useAviatorGame } from "../../lib/stores/useAviatorGame";
import { useAuthStore } from "../../lib/stores/useAuth";
import { syncAuthBalanceFromGame } from "../../lib/stores/syncStores";
import { formatCurrency } from "../../lib/gameLogic";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import { useIsMobile } from "../../hooks/use-is-mobile";

export function BettingPanel() {
  const isMobile = useIsMobile();
  const { user } = useAuthStore();
  const {
    phase,
    currentBet,
    betAmount,
    isAutoPlay,
    autoCashOut,
    placeBet,
    cashOut,
    setBetAmount,
    setAutoPlay,
    setAutoCashOut
  } = useAviatorGame();
  
  const balance = user?.balance || 0;

  const [autoCashOutInput, setAutoCashOutInput] = useState(autoCashOut?.toString() || "");

  const canPlaceBet = (phase === "waiting" || phase === "preparing") && !currentBet && balance >= betAmount;
  const canCashOut = phase === "flying" && currentBet?.active;

  const handlePlaceBet = () => {
    if (canPlaceBet) {
      placeBet(betAmount);
    }
  };

  const handleCashOut = () => {
    if (canCashOut) {
      cashOut();
    }
  };

  const handleBetAmountChange = (value: string) => {
    const amount = parseFloat(value) || 0;
    if (amount >= 0) {
      setBetAmount(amount);
    }
  };

  const handleAutoCashOutChange = (value: string) => {
    setAutoCashOutInput(value);
    const multiplier = parseFloat(value);
    if (multiplier >= 1.1) {
      setAutoCashOut(multiplier);
    } else if (value === "") {
      setAutoCashOut(null);
    }
  };

  const quickBetAmounts = [1, 5, 10, 25, 50, 100];

  return (
    <div className={`bg-black/90 border-t border-gray-600 p-4 ${isMobile ? 'pb-safe' : ''}`}>
      <div className="max-w-6xl mx-auto">
        <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
          
          {/* Betting Section */}
          <Card className="bg-gray-800 border-gray-600 p-4">
            <h3 className="text-white font-semibold mb-3">Place Bet</h3>
            
            {/* Bet Amount Input */}
            <div className="mb-3">
              <label className="text-gray-300 text-sm mb-1 block">Bet Amount</label>
              <Input
                type="number"
                value={betAmount}
                onChange={(e) => handleBetAmountChange(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
                min="1"
                max={balance}
                disabled={currentBet?.active}
              />
            </div>

            {/* Quick bet buttons */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {quickBetAmounts.map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  onClick={() => setBetAmount(amount)}
                  disabled={currentBet?.active || balance < amount}
                  className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                >
                  {amount}
                </Button>
              ))}
            </div>

            {/* Bet/Cash Out Button */}
            <div className="space-y-2">
              {canCashOut ? (
                <Button
                  onClick={handleCashOut}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3"
                  size="lg"
                >
                  Cash Out
                </Button>
              ) : (
                <Button
                  onClick={handlePlaceBet}
                  disabled={!canPlaceBet}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3"
                  size="lg"
                >
                  {currentBet ? "Bet Placed" : `Bet ${formatCurrency(betAmount)}`}
                </Button>
              )}
              
              {!canPlaceBet && !canCashOut && !currentBet && (
                <div className="text-yellow-400 text-sm text-center">
                  {balance < betAmount ? "Insufficient balance" : "Wait for next round"}
                </div>
              )}
            </div>
          </Card>

          {/* Auto Play Section */}
          <Card className="bg-gray-800 border-gray-600 p-4">
            <h3 className="text-white font-semibold mb-3">Auto Play</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-gray-300 text-sm">Enable Auto Play</label>
                <Switch
                  checked={isAutoPlay}
                  onCheckedChange={setAutoPlay}
                />
              </div>

              <div>
                <label className="text-gray-300 text-sm mb-1 block">Auto Cash Out at</label>
                <Input
                  type="number"
                  value={autoCashOutInput}
                  onChange={(e) => handleAutoCashOutChange(e.target.value)}
                  placeholder="e.g., 2.5"
                  className="bg-gray-700 border-gray-600 text-white"
                  min="1.1"
                  step="0.1"
                />
                <div className="text-gray-400 text-xs mt-1">
                  Leave empty to disable auto cash out
                </div>
              </div>
            </div>
          </Card>

          {/* Statistics Section */}
          <Card className="bg-gray-800 border-gray-600 p-4">
            <h3 className="text-white font-semibold mb-3">Stats</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300 text-sm">Balance:</span>
                <span className="text-white font-semibold">{formatCurrency(balance)}</span>
              </div>
              
              {currentBet && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-300 text-sm">Current Bet:</span>
                    <span className="text-white font-semibold">{formatCurrency(currentBet.amount)}</span>
                  </div>
                  
                  {currentBet.profit !== 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-300 text-sm">Profit/Loss:</span>
                      <span className={`font-semibold ${currentBet.profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {currentBet.profit > 0 ? '+' : ''}{formatCurrency(currentBet.profit)}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
