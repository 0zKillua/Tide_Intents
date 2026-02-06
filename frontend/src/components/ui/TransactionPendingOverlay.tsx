import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface TransactionPendingOverlayProps {
  isVisible: boolean;
  message?: string;
  status?: "pending" | "success" | "error";
  onClose?: () => void;
}

export function TransactionPendingOverlay({ 
  isVisible, 
  message = "Transaction pending...",
  status = "pending",
  onClose
}: TransactionPendingOverlayProps) {
    const [show, setShow] = useState(isVisible);

    useEffect(() => {
        if (isVisible) setShow(true);
        // On success/error, you might want to auto-hide or let parent handle it.
        // We'll let parent handle visibility, but we can animate out if needed.
        if (!isVisible) {
            const t = setTimeout(() => setShow(false), 200); // fade out delay
            return () => clearTimeout(t);
        }
    }, [isVisible]);

  if (!show && !isVisible) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="flex flex-col items-center gap-4 p-8 rounded-xl bg-surface border border-surface-hover min-w-[300px] text-center">
        
        {status === "pending" && (
            <>
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <div>
                    <p className="text-white font-medium text-lg">{message}</p>
                    <p className="text-gray-400 text-sm mt-1">Please wait for confirmation...</p>
                </div>
            </>
        )}

        {status === "success" && (
            <>
                <CheckCircle2 className="w-12 h-12 text-success animate-in zoom-in duration-300" />
                <div>
                    <p className="text-white font-medium text-lg">Success!</p>
                    <p className="text-gray-400 text-sm mt-1">{message}</p>
                </div>
            </>
        )}

        {status === "error" && (
            <>
                <XCircle className="w-12 h-12 text-destructive animate-in zoom-in duration-300" />
                <div>
                    <p className="text-white font-medium text-lg">Transaction Failed</p>
                    <p className="text-red-400 text-sm mt-1 max-w-[250px] break-words">{message}</p>
                </div>
                {onClose && (
                    <button onClick={onClose} className="mt-4 px-4 py-2 bg-surface-hover rounded text-sm hover:text-white transition-colors">
                        Close
                    </button>
                )}
            </>
        )}
      </div>
    </div>
  );
}
