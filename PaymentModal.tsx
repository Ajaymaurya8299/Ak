import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { AlertCircle, CreditCard, Smartphone } from "lucide-react";
import { useAuthStore } from "../../lib/stores/useAuth";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "deposit" | "withdraw";
}

export function PaymentModal({ isOpen, onClose, type }: PaymentModalProps) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [accountDetails, setAccountDetails] = useState({
    account_number: "",
    ifsc: "",
    name: "",
    upi_id: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "bank">("upi");
  
  const { user, updateBalance } = useAuthStore();

  const handleDeposit = async () => {
    try {
      setLoading(true);
      setError("");
      
      const depositAmount = parseFloat(amount);
      if (!depositAmount || depositAmount < 1) {
        setError("Please enter a valid amount (minimum ₹1)");
        return;
      }

      // Create payment order
      const response = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: depositAmount,
          userId: user?.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to create payment order");
        return;
      }

      const orderData = await response.json();

      // Initialize Razorpay
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Aviator Game",
        description: "Add money to wallet",
        order_id: orderData.orderId,
        handler: async (response: any) => {
          try {
            // Verify payment
            const verifyResponse = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: orderData.orderId,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                userId: user?.id,
                amount: orderData.amount,
              }),
            });

            if (verifyResponse.ok) {
              const verifyData = await verifyResponse.json();
              // Update user balance
              const newBalance = (user?.balance || 0) + verifyData.amount;
              updateBalance(newBalance);
              alert(`₹${verifyData.amount} added successfully!`);
              onClose();
            } else {
              setError("Payment verification failed");
            }
          } catch (error) {
            setError("Payment verification failed");
          }
        },
        prefill: {
          name: user?.username || "Player",
          email: user?.email || "",
          contact: "9999999999",
        },
        theme: {
          color: "#3B82F6",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      setError("Failed to process payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    try {
      setLoading(true);
      setError("");
      
      const withdrawAmount = parseFloat(amount);
      if (!withdrawAmount || withdrawAmount < 100) {
        setError("Minimum withdrawal amount is ₹100");
        return;
      }

      if (withdrawAmount > (user?.balance || 0)) {
        setError("Insufficient balance");
        return;
      }

      // Validate account details
      if (paymentMethod === "upi") {
        if (!accountDetails.upi_id) {
          setError("Please enter UPI ID");
          return;
        }
      } else {
        if (!accountDetails.account_number || !accountDetails.ifsc || !accountDetails.name) {
          setError("Please fill all bank account details");
          return;
        }
      }

      const response = await fetch("/api/payments/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: withdrawAmount,
          userId: user?.id,
          accountDetails,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Withdrawal failed");
        return;
      }

      const data = await response.json();
      
      // Update user balance
      const newBalance = (user?.balance || 0) - withdrawAmount;
      updateBalance(newBalance);
      
      alert(`Withdrawal request of ₹${withdrawAmount} submitted successfully. ${data.estimatedTime}`);
      onClose();
    } catch (error) {
      setError("Withdrawal request failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isDeposit = type === "deposit";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">
            {isDeposit ? "Add Money" : "Withdraw Money"}
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            {isDeposit 
              ? "Add money to your wallet using UPI or bank transfer"
              : "Withdraw money to your UPI or bank account"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Amount Input */}
          <div>
            <Label htmlFor="amount" className="text-gray-300">
              Amount (₹)
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder={isDeposit ? "Enter amount (min ₹1)" : "Enter amount (min ₹100)"}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>

          {/* Payment Method Selection for Withdrawals */}
          {!isDeposit && (
            <div>
              <Label className="text-gray-300 mb-2 block">Payment Method</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={paymentMethod === "upi" ? "default" : "outline"}
                  onClick={() => setPaymentMethod("upi")}
                  className="flex items-center gap-2"
                >
                  <Smartphone className="w-4 h-4" />
                  UPI
                </Button>
                <Button
                  variant={paymentMethod === "bank" ? "default" : "outline"}
                  onClick={() => setPaymentMethod("bank")}
                  className="flex items-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  Bank
                </Button>
              </div>
            </div>
          )}

          {/* Account Details for Withdrawals */}
          {!isDeposit && (
            <Card className="p-4 bg-gray-800 border-gray-600">
              <h4 className="text-white font-medium mb-3">
                {paymentMethod === "upi" ? "UPI Details" : "Bank Account Details"}
              </h4>
              
              {paymentMethod === "upi" ? (
                <div>
                  <Label htmlFor="upi" className="text-gray-300">UPI ID</Label>
                  <Input
                    id="upi"
                    placeholder="example@upi"
                    value={accountDetails.upi_id}
                    onChange={(e) => setAccountDetails({
                      ...accountDetails,
                      upi_id: e.target.value
                    })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="name" className="text-gray-300">Account Holder Name</Label>
                    <Input
                      id="name"
                      placeholder="Full name as per bank"
                      value={accountDetails.name}
                      onChange={(e) => setAccountDetails({
                        ...accountDetails,
                        name: e.target.value
                      })}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="account" className="text-gray-300">Account Number</Label>
                    <Input
                      id="account"
                      placeholder="Bank account number"
                      value={accountDetails.account_number}
                      onChange={(e) => setAccountDetails({
                        ...accountDetails,
                        account_number: e.target.value
                      })}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ifsc" className="text-gray-300">IFSC Code</Label>
                    <Input
                      id="ifsc"
                      placeholder="Bank IFSC code"
                      value={accountDetails.ifsc}
                      onChange={(e) => setAccountDetails({
                        ...accountDetails,
                        ifsc: e.target.value.toUpperCase()
                      })}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Current Balance */}
          <div className="text-center text-gray-300 text-sm">
            Current Balance: ₹{user?.balance || 0}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={isDeposit ? handleDeposit : handleWithdraw}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Processing..." : (isDeposit ? "Add Money" : "Withdraw")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}