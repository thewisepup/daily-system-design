import { CheckCircle2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

interface FeedbackSuccessModalProps {
  onClose: () => void;
}

export function FeedbackSuccessModal({ onClose }: FeedbackSuccessModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="mx-4 max-w-sm">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center text-accent">
            <CheckCircle2 className="h-16 w-16" />
          </div>
          <CardTitle className="text-xl">Successfully Submitted</CardTitle>
          <CardDescription>Thank you for your feedback!</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onClose} className="w-full" variant="default">
            Close
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
