import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Download, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface AttachmentBubbleProps {
  metadata: any;
  mine: boolean;
}

export function AttachmentBubble({ metadata, mine }: AttachmentBubbleProps) {
  const attachment = metadata?.attachment;
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!attachment?.path) {
      setLoading(false);
      setError(true);
      return;
    }

    let isMounted = true;

    async function fetchAttachment() {
      try {
        const { data, error: downloadError } = await supabase.storage
          .from("chat-attachments")
          .download(attachment.path);

        if (downloadError) {
          throw downloadError;
        }

        if (data && isMounted) {
          const objectUrl = URL.createObjectURL(data);
          setUrl(objectUrl);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error downloading chat attachment:", err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    }

    fetchAttachment();

    return () => {
      isMounted = false;
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [attachment?.path]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-3 px-4 rounded-xl bg-muted/20">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-medium">Loading attachment…</span>
      </div>
    );
  }

  if (error || !attachment) {
    return (
      <div className="flex items-center gap-2 py-3 px-4 rounded-xl bg-destructive/10 text-destructive">
        <FileText className="h-4 w-4 shrink-0" />
        <span className="text-xs font-medium">Failed to load attachment</span>
      </div>
    );
  }

  const isImage = attachment.type?.startsWith("image/");

  if (isImage && url) {
    return (
      <div className="relative group max-w-full rounded-xl overflow-hidden shadow-sm border border-border/30">
        <img
          src={url}
          alt={attachment.name || "Attachment"}
          className="max-h-60 w-full object-cover rounded-xl transition-all duration-200 group-hover:brightness-95 cursor-zoom-in"
          onClick={() => {
            // Open full image in new tab safely
            const w = window.open();
            if (w) {
              w.document.write(`<img src="${url}" style="max-width:100%; max-height:100dvh; display:block; margin:auto;" />`);
              w.document.title = attachment.name || "Image Preview";
            }
          }}
        />
        <a
          href={url}
          download={attachment.name}
          className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 hover:bg-black/80"
          title="Download image"
          onClick={(e) => e.stopPropagation()}
        >
          <Download className="h-4 w-4" />
        </a>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 py-2.5 px-3.5 rounded-xl border border-border/40 bg-card text-card-foreground shadow-sm">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileText className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-xs font-semibold">{attachment.name}</div>
          <div className="text-[10px] text-muted-foreground uppercase font-medium mt-0.5">
            {attachment.type?.split("/")[1] || "file"}
          </div>
        </div>
      </div>
      {url && (
        <a
          href={url}
          download={attachment.name}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary hover:bg-secondary-hover text-secondary-foreground shadow-sm transition-colors shrink-0"
          title="Download file"
        >
          <Download className="h-4 w-4" />
        </a>
      )}
    </div>
  );
}
