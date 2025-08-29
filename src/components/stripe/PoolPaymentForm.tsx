import { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from "@/components/ui/button";
import { PaymentService } from '@/services/PaymentService';

interface PoolPaymentFormProps {
  amount: number;
  poolName: string;
  totalLicenses: number;
  licenseType: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#32325d',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4'
      }
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a'
    }
  }
};

export default function PoolPaymentForm({ 
  amount, 
  poolName,
  totalLicenses,
  licenseType,
  onSuccess, 
  onError,
  isProcessing,
  setIsProcessing
}: PoolPaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardError, setCardError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      console.error('Stripe or Elements not loaded');
      setCardError('Payment system not ready. Please refresh the page.');
      return;
    }

    setIsProcessing(true);
    setCardError(null);

    try {
      
      // Create payment intent for pool purchase
      const response = await PaymentService.createPoolPaymentIntent({
        amount,
        poolName,
        totalLicenses,
        licenseType
      });

      console.log('Payment intent response:', response);

      if (!response.clientSecret) {
        throw new Error('Failed to create payment intent - no client secret received');
      }

      // Handle test mode
      if (response.testMode) {
        console.log('🧪 Test payment mode - simulating successful payment');
        // Simulate a successful payment in test mode
        setTimeout(() => {
          onSuccess(response.paymentIntentId);
        }, 1000);
        return;
      }

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        response.clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
          },
        }
      );

      if (stripeError) {
        setCardError(stripeError.message || 'An error occurred');
        onError(stripeError.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent.id);
      } else {
        setCardError('Payment was not completed successfully');
        onError('Payment was not completed successfully');
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while processing your payment';
      setCardError(errorMessage);
      onError('Payment failed: ' + errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Check if we're in test mode
  const isTestMode = !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 
                    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.includes('your_publishable_key_here') ||
                    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.startsWith('pk_test_');

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isTestMode ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-yellow-800 text-sm">
              <strong>Test Mode:</strong> Payment processing is in test mode. No real charges will be made.
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-800 text-sm">
              <strong>Live Payment:</strong> This is a real payment. You will be charged the full amount.
            </div>
          </div>
        </div>
      )}
      
      <div className="p-4 border rounded-lg">
        <CardElement options={CARD_ELEMENT_OPTIONS} />
      </div>
      
      {cardError && (
        <div className="text-sm text-red-500">
          {cardError}
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="text-sm text-gray-600 mb-2">Payment Summary:</div>
        <div className="text-sm">
          <div className="flex justify-between">
            <span>Pool:</span>
            <span className="font-medium">{poolName}</span>
          </div>
          <div className="flex justify-between">
            <span>Licenses:</span>
            <span className="font-medium">{totalLicenses} {licenseType}</span>
          </div>
          <div className="flex justify-between border-t pt-2 mt-2">
            <span className="font-medium">Total:</span>
            <span className="font-bold">${amount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full"
      >
        {isProcessing ? 'Processing Payment...' : `Pay $${amount.toFixed(2)}`}
      </Button>
    </form>
  );
}
