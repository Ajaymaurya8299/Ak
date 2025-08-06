import { useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { useAuthStore } from "../../lib/stores/useAuth";
import { PaymentModal } from "./PaymentModal";
import { Wallet, Plus, Minus, History, CreditCard } from "lucide-react";
import { Card } from "../ui/card";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<"deposit" | "withdraw">("deposit");
  const { user } = useAuthStore();

  const handleAddMoney = () => {
    setPaymentType("deposit");
    setPaymentModalOpen(true);
  };

  const handleWithdraw = () => {
    setPaymentType("withdraw");
    setPaymentModalOpen(true);
  };

  const recentTransactions = [
    { id: 1, type: "deposit", amount: 500, status: "completed", date: "2025-01-05" },
    { id: 2, type: "withdraw", amount: 200, status: "pending", date: "2025-01-04" },
    { id: 3, type: "deposit", amount: 1000, status: "completed", date: "2025-01-03" },
  ];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Wallet
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Manage your wallet balance and transactions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Balance Display */}
            <Card className="p-6 bg-gradient-to-r from-blue-600 to-purple-600 border-0">
              <div className="text-center text-white">
                <p className="text-sm opacity-90">Current Balance</p>
                <p className="text-3xl font-bold">₹{user?.balance || 0}</p>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={handleAddMoney}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="w-4 h-4" />
                Add Money
              </Button>
              <Button
                onClick={handleWithdraw}
                variant="outline"
                className="flex items-center gap-2 border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                <Minus className="w-4 h-4" />
                Withdraw
              </Button>
            </div>

            {/* Payment Methods Info */}
            <Card className="p-4 bg-gray-800 border-gray-600">
              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Supported Payment Methods
              </h4>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex justify-between">
                  <span>• UPI (PhonePe, GPay, Paytm)</span>
                  <span className="text-green-400">Instant</span>
                </div>
                <div className="flex justify-between">
                  <span>• Net Banking</span>
                  <span className="text-green-400">Instant</span>
                </div>
                <div className="flex justify-between">
                  <span>• Debit/Credit Cards</span>
                  <span className="text-green-400">Instant</span>
                </div>
                <div className="flex justify-between">
                  <span>• Bank Transfer (Withdrawal)</span>
                  <span className="text-yellow-400">1-2 days</span>
                </div>
              </div>
            </Card>

            {/* Recent Transactions */}
            <Card className="p-4 bg-gray-800 border-gray-600">
              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                <History className="w-4 h-4" />
                Recent Transactions
              </h4>
              <div className="space-y-2">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-2 bg-gray-700 rounded"
                  >
                    <div>
                      <div className="text-white text-sm">
                        {transaction.type === "deposit" ? "+" : "-"}₹{transaction.amount}
                      </div>
                      <div className="text-gray-400 text-xs">{transaction.date}</div>
                    </div>
                    <div
                      className={`px-2 py-1 rounded text-xs ${
                        transaction.status === "completed"
                          ? "bg-green-600 text-white"
                          : "bg-yellow-600 text-white"
                      }`}
                    >
                      {transaction.status}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Important Notes */}
            <div className="text-xs text-gray-400 space-y-1">
              <p>• Minimum deposit: ₹1</p>
              <p>• Minimum withdrawal: ₹100</p>
              <p>• All transactions are secured by Razorpay</p>
              <p>• No charges on deposits, standard banking charges apply for withdrawals</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        type={paymentType}
      />
    </>
  );
}