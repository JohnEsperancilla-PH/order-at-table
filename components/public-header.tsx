import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface PublicHeaderProps {
  backHref?: string;
  backLabel?: string;
  showBack?: boolean;
}

export function PublicHeader({
  backHref = "/",
  backLabel = "Back to Home",
  showBack = true,
}: PublicHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="font-semibold tracking-tight text-lg"
        >
          QR<span className="text-brand">Der</span>
        </Link>
        {showBack && (
          <Button variant="ghost" size="sm" asChild>
            <Link href={backHref}>
              <ArrowLeft className="h-4 w-4" />
              {backLabel}
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
}
