import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, Crown, Zap, ShieldCheck, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface PaywallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export function PaywallModal({ open, onOpenChange, userId }: PaywallModalProps) {
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      // In development/test mode, we simulate upgrading directly in the database.
      // In a production setup, this would direct the user to Stripe Checkout.
      const { error } = await supabase
        .from("subscriptions")
        .upsert({
          user_id: userId,
          tier: "premium",
          status: "active",
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        });

      if (error) throw error;

      toast.success("Upgrade successful!", {
        description: "Welcome to Roomies Premium! You now have unlimited swiping.",
      });
      
      // Invalidate queries to refresh the UI limits immediately
      qc.invalidateQueries({ queryKey: ["subscription"] });
      qc.invalidateQueries({ queryKey: ["candidates"] });
      
      onOpenChange(false);
    } catch (err: any) {
      console.error("Upgrade error:", err);
      toast.error(err.message || "Failed to complete premium upgrade");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden border border-border/80 bg-background rounded-2xl shadow-2xl">
        {/* Banner with sleek premium gradient */}
        <div className="relative p-6 text-center text-white bg-gradient-to-tr from-violet-600 via-primary to-rose-500 overflow-hidden">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />
          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-yellow-300 animate-pulse border border-white/10">
              <Crown className="h-6 w-6" fill="currentColor" />
            </div>
            <DialogTitle className="text-2xl font-bold tracking-tight text-white">
              Upgrade to Premium
            </DialogTitle>
            <DialogDescription className="text-white/90 text-sm max-w-xs mx-auto">
              You've swiped all your free daily matches. Go premium to keep searching!
            </DialogDescription>
          </div>
        </div>

        {/* Pricing & Features List */}
        <div className="p-6 space-y-6">
          <div className="rounded-xl border border-border/60 bg-muted/40 p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-primary uppercase tracking-wider">Premium Access</div>
              <div className="text-sm text-muted-foreground">Monthly Plan</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-extrabold text-foreground">49 MAD</div>
              <div className="text-[10px] text-muted-foreground">per month</div>
            </div>
          </div>

          <div className="space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">What's Included:</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Zap className="h-3 w-3" fill="currentColor" />
                </div>
                <span><strong>Unlimited Swiping:</strong> Find the perfect roommate without daily limits.</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Heart className="h-3 w-3" fill="currentColor" />
                </div>
                <span><strong>See Who Liked You:</strong> Match instantly with roommates seeking your lifestyle.</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <ShieldCheck className="h-3 w-3" fill="currentColor" />
                </div>
                <span><strong>Verified Premium Badge:</strong> Gain trust and attract matches 3x faster.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <DialogFooter className="p-6 pt-0 flex flex-col sm:flex-row gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="flex-1 rounded-xl text-sm"
          >
            Maybe Later
          </Button>
          <Button
            onClick={handleUpgrade}
            disabled={loading}
            className="flex-1 rounded-xl text-sm bg-gradient-to-r from-violet-600 to-rose-500 hover:from-violet-500 hover:to-rose-400 text-white font-semibold shadow-lg shadow-primary/20 border-0"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Upgrade Now <Sparkles className="ms-1.5 h-4 w-4 fill-white/20" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Simple loader helper in case Loader2 import is missing
function Loader2({ className }: { className?: string }) {
  return <div className={`h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent ${className}`} />;
}
