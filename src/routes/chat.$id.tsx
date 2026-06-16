import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { RequireAuth } from "@/components/RequireAuth";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowLeft, Send, Home, CalendarClock, MoreVertical, ShieldAlert, Ban, X, Paperclip, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { SharePlaceSheet } from "@/components/chat/SharePlaceSheet";
import { ProposeViewingSheet } from "@/components/chat/ProposeViewingSheet";
import { PlaceRefBubble } from "@/components/chat/PlaceRefBubble";
import { ViewingBubble } from "@/components/chat/ViewingBubble";
import { AttachmentBubble } from "@/components/chat/AttachmentBubble";
import { LeaseChecklist } from "@/components/chat/LeaseChecklist";
import { useT } from "@/i18n/LocaleProvider";

export const Route = createFileRoute("/chat/$id")({
  head: () => ({
    meta: [
      { title: "Chat — Roomies" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <AppLayout>
        <Chat />
      </AppLayout>
    </RequireAuth>
  ),
});

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
  kind: "text" | "place_ref" | "viewing";
  metadata: unknown;
};

function Chat() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const nav = useNavigate();
  const t = useT();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !conversation) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${id}/${fileName}`;

      // Upload file to private bucket
      const { data, error: uploadError } = await supabase.storage
        .from("chat-attachments")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Insert message with metadata
      const { error: msgError } = await supabase.from("messages").insert({
        conversation_id: id,
        sender_id: user.id,
        body: `Sent an attachment: ${file.name}`,
        metadata: {
          attachment: {
            path: filePath,
            type: file.type,
            name: file.name,
          },
        },
      });

      if (msgError) throw msgError;

      toast.success("Attachment sent!");
    } catch (err: any) {
      console.error("Error uploading file:", err);
      toast.error(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };
  const safetyKey = `chat-safety-dismissed:${id}`;
  const [showSafety, setShowSafety] = useState(() => {
    if (typeof window === "undefined") return false;
    return !window.localStorage.getItem(safetyKey);
  });
  const dismissSafety = () => {
    try { window.localStorage.setItem(safetyKey, "1"); } catch { /* ignore */ }
    setShowSafety(false);
  };
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: conversation } = useQuery({
    queryKey: ["conversation", id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("id, user_a, user_b")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const otherId = conversation
    ? conversation.user_a === user?.id
      ? conversation.user_b
      : conversation.user_a
    : null;

  const { data: other } = useQuery({
    queryKey: ["profile", otherId],
    enabled: !!otherId,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, photo_url")
        .eq("id", otherId!)
        .maybeSingle();
      return data;
    },
  });

  const { data: messages } = useQuery({
    queryKey: ["messages", id],
    enabled: !!conversation,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Message[];
    },
  });

  // Realtime subscription
  useEffect(() => {
    if (!conversation) return;
    const channel = supabase
      .channel(`messages:${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` },
        (payload) => {
          qc.setQueryData<Message[]>(["messages", id], (old) => {
            const m = payload.new as Message;
            if (old?.some((x) => x.id === m.id)) return old;
            return [...(old ?? []), m];
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation, id, qc]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages?.length]);

  // Mark unread (from other user) as read when viewing
  useEffect(() => {
    if (!messages || !user) return;
    const unread = messages.filter((m) => m.sender_id !== user.id && !m.read_at).map((m) => m.id);
    if (unread.length === 0) return;
    supabase.from("messages").update({ read_at: new Date().toISOString() }).in("id", unread).then();
  }, [messages, user]);

  const send = async () => {
    const body = text.trim();
    if (!body || !user || !conversation || sending) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      conversation_id: id,
      sender_id: user.id,
      body,
    });
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setText("");
  };

  if (!conversation) {
    return <div className="p-8 text-center text-muted-foreground">{t("chat.loading")}</div>;
  }

  if (user && conversation.user_a !== user.id && conversation.user_b !== user.id) {
    return <div className="p-8 text-center">{t("chat.access")}</div>;
  }

  const blockOther = async () => {
    if (!user || !otherId) return;
    const { error } = await supabase.from("blocks").insert({ blocker_id: user.id, blocked_id: otherId });
    if (error) return toast.error(error.message);
    toast.success(t("pd.blocked"));
    nav({ to: "/chats" });
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-3.5rem-5rem)] max-w-md flex-col">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur">
        <button onClick={() => nav({ to: "/chats" })} className="text-muted-foreground hover:text-foreground" aria-label={t("chat.back")}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        {other && (
          <Link to="/profile/$id" params={{ id: other.id }} className="flex flex-1 items-center gap-3">
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-accent to-primary/40">
              {other.photo_url ? (
                <img src={other.photo_url} alt={other.display_name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center font-semibold text-primary-foreground">
                  {other.display_name?.charAt(0)?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="font-semibold">{other.display_name}</div>
          </Link>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-muted-foreground hover:text-foreground" aria-label={t("chat.menu")}>
              <MoreVertical className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to="/safety">
                <ShieldAlert className="me-2 h-4 w-4" /> {t("chat.safety")}
              </Link>
            </DropdownMenuItem>
            {otherId && (
              <DropdownMenuItem onClick={blockOther} className="text-destructive focus:text-destructive">
                <Ban className="me-2 h-4 w-4" /> {t("pd.block")}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <LeaseChecklist />

      {showSafety && (
        <div className="border-b border-border bg-accent/30 px-4 py-3 text-sm">
          <div className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="flex-1">
              <div className="font-semibold">{t("chat.safetyBanner.title")}</div>
              <p className="mt-1 text-muted-foreground">{t("chat.safetyBanner.body")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button asChild size="sm" variant="secondary" className="h-7 px-3 text-xs">
                  <Link to="/safety">{t("chat.safetyBanner.cta")}</Link>
                </Button>
                <Button size="sm" variant="ghost" className="h-7 px-3 text-xs" onClick={dismissSafety}>
                  {t("chat.safetyBanner.dismiss")}
                </Button>
              </div>
            </div>
            <button
              onClick={dismissSafety}
              className="text-muted-foreground hover:text-foreground"
              aria-label={t("chat.safetyBanner.dismiss")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {messages?.length === 0 && (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            {t("chat.sayHi", { name: other?.display_name ?? t("chat.match") })}
          </p>
        )}
        {messages?.map((m) => {
          const mine = m.sender_id === user?.id;
          const hasAttachment = !!(m.metadata as any)?.attachment;
          const isImage = hasAttachment && (m.metadata as any)?.attachment?.type?.startsWith("image/");
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl shadow-sm",
                  isImage
                    ? ""
                    : cn(
                        "px-3 py-2 text-sm",
                        mine
                          ? "rounded-br-sm bg-primary text-primary-foreground"
                          : "rounded-bl-sm bg-muted text-foreground",
                      )
                )}
              >
                {m.kind === "place_ref" ? (
                  <PlaceRefBubble metadata={m.metadata} mine={mine} />
                ) : m.kind === "viewing" ? (
                  <ViewingBubble metadata={m.metadata} conversationId={id} mine={mine} />
                ) : hasAttachment ? (
                  <AttachmentBubble metadata={m.metadata} mine={mine} />
                ) : (
                  m.body
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-0 z-10 border-t border-border bg-background px-3 py-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-center gap-2"
        >
          <SharePlaceSheet
            conversationId={id}
            trigger={
              <Button type="button" size="icon" variant="ghost" className="rounded-full" aria-label={t("chat.share")}>
                <Home className="h-4 w-4" />
              </Button>
            }
          />
          <ProposeViewingSheet
            conversationId={id}
            trigger={
              <Button type="button" size="icon" variant="ghost" className="rounded-full" aria-label={t("chat.propose")}>
                <CalendarClock className="h-4 w-4" />
              </Button>
            }
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="rounded-full"
            aria-label="Upload file"
            onClick={triggerFileUpload}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <Paperclip className="h-4 w-4" />
            )}
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,application/pdf"
          />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("chat.placeholder")}
            className="flex-1 rounded-full border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
            maxLength={4000}
            aria-label={t("chat.placeholder")}
          />
          <Button type="submit" size="icon" className="rounded-full" disabled={!text.trim() || sending}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
