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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <Card className="mx-auto w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="bg-primary/20 mx-auto flex h-20 w-20 items-center justify-center rounded-full">
            <CheckCircle2 className="text-primary h-12 w-12" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold">
              Successfully Submitted
            </CardTitle>
            <CardDescription className="text-base">
              Thank you for your feedback!
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Button
            onClick={onClose}
            className="w-full"
            variant="default"
            size="lg"
          >
            Close
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
