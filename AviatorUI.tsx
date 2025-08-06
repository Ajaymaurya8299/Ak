import { useState } from "react";
import { useAviatorGame } from "../../lib/stores/useAviatorGame";
import { useAuthStore } from "../../lib/stores/useAuth";
import { formatMultiplier, formatCurrency } from "../../lib/gameLogic";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { WalletModal } from "../wallet/WalletModal";
import { Wallet, LogOut, TrendingUp, TrendingDown } from "lucide-react";
import { useIsMobile } from "../../hooks/use-is-mobile";

export function AviatorUI() {
  const [showWallet, setShowWallet] = useState(false);
  const [betAmount, setBetAmount] = useState(10);
  const isMobile = useIsMobile();
  
  const { 
    phase, 
    currentMultiplier, 
    currentBet, 
    gameHistory,
    placeBet,
    cashOut
  } = useAviatorGame();
  
  const { user, logout } = useAuthStore();
  const balance = user?.balance || 0;

  const canPlaceBet = (phase === "waiting" || phase === "preparing") && !currentBet && balance >= betAmount;
  const canCashOut = phase === "flying" && currentBet?.active;

  const getMultiplierColor = () => {
    if (phase === "crashed") return "text-red-500";
    if (phase === "flying") {
      if (currentMultiplier < 2) return "text-green-400";
      if (currentMultiplier < 5) return "text-yellow-400";
      return "text-red-400";
    }
    return "text-gray-400";
  };

  const getPhaseText = () => {
    switch (phase) {
      case "waiting": return "WAITING FOR NEXT ROUND";
      case "preparing": return "PLACE YOUR BETS";
      case "flying": return "FLYING...";
      case "crashed": return "FLEW AWAY!";
      default: return "";
    }
  };

  const handleBet = () => {
    if (canPlaceBet) {
      placeBet(betAmount);
    }
  };

  const handleCashOut = () => {
    if (canCashOut) {
      cashOut();
    }
  };

  const quickAmounts = [1, 5, 10, 25, 50, 100];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-3xl">✈️</span>
            <h1 className="text-2xl font-bold text-white">Flight Game</h1>
          </div>
          <div className="bg-gray-800 px-3 py-1 rounded-lg border border-green-500/30">
            <span className="text-green-400 font-semibold">₹{formatCurrency(balance)}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setShowWallet(true)}
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Wallet
          </Button>
          <Button
            onClick={logout}
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Recent Results Bar */}
      <div className="bg-black border-b border-gray-800 p-3">
        <div className="flex items-center space-x-2 overflow-x-auto">
          <span className="text-gray-400 text-sm whitespace-nowrap">Recent:</span>
          {gameHistory.slice(0, 12).map((round, index) => {
            const multiplier = round.finalMultiplier;
            const isHigh = multiplier >= 2;
            return (
              <div
                key={round.id}
                className={`flex items-center space-x-1 px-2 py-1 rounded text-sm font-bold whitespace-nowrap ${
                  isHigh 
                    ? 'bg-green-600/20 text-green-400 border border-green-600/30' 
                    : 'bg-red-600/20 text-red-400 border border-red-600/30'
                }`}
              >
                {isHigh ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{formatMultiplier(multiplier)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
        {/* Current Multiplier Display */}
        <div className="text-center mb-8">
          <div className="text-gray-400 text-lg mb-2 uppercase tracking-wide">
            {getPhaseText()}
          </div>
          
          {phase === "flying" || phase === "crashed" ? (
            <div className={`text-8xl md:text-9xl font-bold multiplier-text ${getMultiplierColor()} drop-shadow-2xl`}>
              {formatMultiplier(currentMultiplier)}
            </div>
          ) : (
            <div className="text-6xl md:text-8xl font-bold text-gray-600 multiplier-text">
              {formatMultiplier(1.00)}
            </div>
          )}
          
          {currentBet?.active && phase === "flying" && (
            <div className="mt-4 text-green-400 text-xl font-semibold">
              Potential Win: ₹{(currentBet.amount * currentMultiplier).toFixed(2)}
            </div>
          )}
        </div>

        {/* Flying Animation Area */}
        <div className="w-full max-w-2xl h-32 relative overflow-hidden">
          {phase === "flying" && (
            <div className="absolute inset-0 flex items-center">
              {/* Plane Animation */}
              <div 
                className="text-4xl transform transition-all duration-100 ease-out"
                style={{
                  left: `${Math.min((currentMultiplier - 1) * 20, 90)}%`,
                  transform: `translateY(${Math.sin((currentMultiplier - 1) * 0.5) * -20}px) rotate(${Math.min((currentMultiplier - 1) * 5, 30)}deg)`
                }}
              >
                ✈️
              </div>
              
              {/* Trail Effect */}
              <div 
                className="absolute h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-60"
                style={{
                  width: `${Math.min((currentMultiplier - 1) * 20, 90)}%`,
                  top: '50%'
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Betting Panel */}
      <div className="bg-black border-t border-gray-800 p-4">
        <div className="max-w-4xl mx-auto">
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
            
            {/* Bet Amount Section */}
            <Card className="aviator-card p-4">
              <h3 className="text-white font-semibold mb-3">Bet Amount</h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400">₹</span>
                  <Input
                    type="number"
                    min="1"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Number(e.target.value) || 1)}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Enter amount"
                  />
                </div>
                
                {/* Quick Bet Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  {quickAmounts.map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => setBetAmount(amount)}
                      className={`border-gray-600 text-gray-300 hover:bg-gray-700 ${
                        betAmount === amount ? 'bg-gray-700 border-green-500' : ''
                      }`}
                    >
                      ₹{amount}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Action Section */}
            <Card className="aviator-card p-4">
              <h3 className="text-white font-semibold mb-3">Action</h3>
              
              <div className="space-y-3">
                {canCashOut ? (
                  <Button
                    onClick={handleCashOut}
                    className="w-full cashout-button text-white text-lg font-bold py-4 pulse-red"
                  >
                    CASH OUT
                    <div className="text-sm font-normal">
                      ₹{(currentBet?.amount! * currentMultiplier).toFixed(2)}
                    </div>
                  </Button>
                ) : (
                  <Button
                    onClick={handleBet}
                    disabled={!canPlaceBet}
                    className="w-full bet-button disabled:bg-gray-600 text-white text-lg font-bold py-4"
                  >
                    {currentBet ? 'BET PLACED' : 'BET'}
                    <div className="text-sm font-normal">
                      ₹{betAmount}
                    </div>
                  </Button>
                )}
                
                {currentBet && !currentBet.active && (
                  <div className="text-center p-2 bg-green-600/20 border border-green-600/30 rounded text-green-400">
                    Won: ₹{currentBet.profit.toFixed(2)}
                  </div>
                )}
                
                <div className="text-xs text-gray-400 text-center">
                  Balance: ₹{formatCurrency(balance)}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Wallet Modal */}
      <WalletModal 
        isOpen={showWallet} 
        onClose={() => setShowWallet(false)} 
      />
    </div>
  );
}