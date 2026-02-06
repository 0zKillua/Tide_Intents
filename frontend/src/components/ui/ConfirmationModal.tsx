import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
}

export function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Are you sure?", 
  message = "This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default"
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-[400px] border-surface-hover bg-surface">
        <CardHeader className="flex flex-row items-center gap-3">
            <div className={`p-2 rounded-full ${variant === 'destructive' ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary'}`}>
                <AlertTriangle className="w-6 h-6" />
            </div>
            <CardTitle className="text-xl text-white">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300">{message}</p>
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose} className="hover:text-white">
                {cancelLabel}
            </Button>
            <Button 
                variant={variant} 
                onClick={() => {
                    onConfirm();
                    onClose();
                }}
            >
                {confirmLabel}
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
