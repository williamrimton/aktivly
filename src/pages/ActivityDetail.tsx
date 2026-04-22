import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TimeInput24h } from "@/components/ui/time-input-24h";
import { ArrowLeft, Calendar, MapPin, Users, Clock, Share2, Pencil, Trash2, X, Save, Search, UserPlus, Bell } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const statusConfig: Record<string, { label: string; className: string }> = {
  confirmed: { label: "Bekräftad", className: "bg-success/10 text-success" },
  pending: { label: "Inväntar svar", className: "bg-warning/10 text-warning" },
  declined: { label: "Avböjt", className: "bg-destructive/10 text-destructive" },
  maybe: { label: "Kanske", className: "bg-warning/10 text-warning" },
  waitlist: { label: "Väntelista", className: "bg-muted text-muted-foreground" },
};

const ActivityDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "", date: "", time: "", location: "", max_participants: "" });
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [rsvpReason, setRsvpReason] = useState("");
  const [reminderSentAt, setReminderSentAt] = useState<number | null>(() => {
    try { return JSON.parse(localStorage.getItem(`reminder_sent_${id}`) || "null"); } catch { return null; }
  });
  const reminderCoolingDown = reminderSentAt !== null && Date.now() - reminderSentAt < 10 * 60 * 1000;

  const { data: activity, isLoading } = useQuery({
    queryKey: ["activity", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("*, participants(*)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  // Fetch child events for recurring activities
  const { data: childEvents = [] } = useQuery({
    queryKey: ["child-events", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("*, participants(id, status, name, reason)")
        .eq("parent_activity_id", id!)
        .order("date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user && !!activity?.is_recurring,
  });

  const addUserByEmail = async () => {
    const email = emailInput.trim().toLowerCase();
    if (!email) return;
    const existingEmails = activity?.participants?.map((p: any) => p.email?.toLowerCase()).filter(Boolean) ?? [];
    if (existingEmails.includes(email)) {
      setEmailError("Redan tillagd");
      return;
    }
    setEmailLoading(true);
    setEmailError("");
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, display_name, email")
        .ilike("email", email)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        setEmailError("Ingen användare hittades med den e-postadressen");
        return;
      }
      addParticipantMutation.mutate(data);
      setEmailInput("");
    } catch {
      setEmailError("Något gick fel vid sökning");
    } finally {
      setEmailLoading(false);
    }
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("activities")
        .update({
          title: editForm.title,
          description: editForm.description || null,
          date: editForm.date,
          time: editForm.time,
          location: editForm.location || null,
          max_participants: editForm.max_participants ? parseInt(editForm.max_participants) : null,
        })
        .eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Aktiviteten uppdaterad!");
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["activity", id] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const addParticipantMutation = useMutation({
    mutationFn: async (profile: { user_id: string; display_name: string | null; email: string | null }) => {
      const name = profile.display_name || profile.email || "Anonym";
      // Add to this activity
      const { error } = await supabase.from("participants").insert({
        activity_id: id!,
        user_id: profile.user_id,
        name,
        email: profile.email || null,
        status: "pending",
      });
      if (error) throw error;

      // If recurring, also add to all child events
      if (activity?.is_recurring) {
        const { data: children } = await supabase
          .from("activities")
          .select("id")
          .eq("parent_activity_id", id!);
        if (children && children.length > 0) {
          // Check which child events already have this participant
          const { data: existingParticipants } = await supabase
            .from("participants")
            .select("activity_id")
            .eq("user_id", profile.user_id)
            .in("activity_id", children.map(c => c.id));
          const existingIds = new Set(existingParticipants?.map(p => p.activity_id) ?? []);
          const toInsert = children
            .filter(c => !existingIds.has(c.id))
            .map(c => ({
              activity_id: c.id,
              user_id: profile.user_id,
              name,
              email: profile.email || null,
              status: "pending" as const,
            }));
          if (toInsert.length > 0) {
            const { error: childError } = await supabase.from("participants").insert(toInsert);
            if (childError) throw childError;
          }
        }
      }
    },
    onSuccess: () => {
      toast.success("Deltagare tillagd!");
      setEmailInput("");
      setEmailError("");
      queryClient.invalidateQueries({ queryKey: ["activity", id] });
      queryClient.invalidateQueries({ queryKey: ["child-events", id] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteParticipantMutation = useMutation({
    mutationFn: async (participantId: string) => {
      const { error } = await supabase.from("participants").delete().eq("id", participantId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deltagare borttagen");
      queryClient.invalidateQueries({ queryKey: ["activity", id] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const rsvpMutation = useMutation({
    mutationFn: async (status: string) => {
      const myParticipant = activity?.participants?.find((p: any) => p.user_id === user?.id);
      if (!myParticipant) return;
      const { error } = await supabase
        .from("participants")
        .update({ status, reason: rsvpReason.trim() || null })
        .eq("id", myParticipant.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Ditt svar har sparats!");
      queryClient.invalidateQueries({ queryKey: ["activity", id] });
      queryClient.invalidateQueries({ queryKey: ["participated-activities", user?.id] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteActivityMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("activities").delete().eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Aktiviteten borttagen");
      navigate("/dashboard");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const sendReminderMutation = useMutation({
    mutationFn: async () => {
      const { data: pending, error } = await supabase
        .from("participants")
        .select("name, email")
        .eq("activity_id", id!)
        .eq("status", "pending")
        .not("email", "is", null);
      if (error) throw error;
      if (!pending || pending.length === 0) throw new Error("Alla deltagare har redan svarat");
      await supabase.functions.invoke("notify-participants", {
        body: {
          participants: pending,
          activityTitle: activity?.title,
          siteUrl: window.location.origin,
        },
      });
    },
    onSuccess: () => {
      const now = Date.now();
      setReminderSentAt(now);
      localStorage.setItem(`reminder_sent_${id}`, JSON.stringify(now));
      toast.success("Påminnelse skickad till ej svarade!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  useEffect(() => {
    if (activity && user) {
      const me = activity.participants?.find((p: any) => p.user_id === user.id);
      if (me?.reason) setRsvpReason(me.reason);
    }
  }, [activity?.id]);

  const startEditing = () => {
    if (!activity) return;
    setEditForm({
      title: activity.title,
      description: activity.description || "",
      date: activity.date,
      time: activity.time?.slice(0, 5) || "",
      location: activity.location || "",
      max_participants: activity.max_participants?.toString() || "",
    });
    setEditing(true);
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Laddar...</div>;
  if (!activity) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Aktiviteten hittades inte</div>;

  const confirmed = activity.participants?.filter((p: any) => p.status === "confirmed").length ?? 0;
  const isOwner = activity.user_id === user?.id;
  const myParticipant = activity.participants?.find((p: any) => p.user_id === user?.id);

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-background border-b border-border">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <h1 className="font-semibold text-foreground">Aktivitetsdetaljer</h1>
          </div>
          <div className="flex items-center gap-2">
            {isOwner && !activity.is_recurring && (
              <Button variant="outline" size="sm" onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/booking/${activity.id}`);
                toast.success("Inbjudningslänk kopierad!");
              }}>
                <Share2 className="h-3.5 w-3.5 mr-1.5" />
                Kopiera länk
              </Button>
            )}
            {isOwner && !editing && (
              <Button variant="outline" size="sm" onClick={startEditing}>
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Redigera
              </Button>
            )}
            {isOwner && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Ta bort aktivitet?</AlertDialogTitle>
                    <AlertDialogDescription>Detta kommer permanent ta bort aktiviteten och alla deltagare.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Avbryt</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteActivityMutation.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Ta bort
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </header>

      <div className="container max-w-2xl py-8 space-y-6">
        {editing ? (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Redigera aktivitet</h2>
              <Button variant="ghost" size="icon" onClick={() => setEditing(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-2">
              <Label>Titel</Label>
              <Input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} className="h-11" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Datum</Label>
                <Input type="date" value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label>Tid</Label>
                <TimeInput24h value={editForm.time} onChange={v => setEditForm(f => ({ ...f, time: v }))} className="h-11" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Plats</Label>
              <Input value={editForm.location} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>Max deltagare</Label>
              <Input type="number" value={editForm.max_participants} onChange={e => setEditForm(f => ({ ...f, max_participants: e.target.value }))} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>Beskrivning</Label>
              <Textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows={3} />
            </div>
            <Button className="w-full h-11 gradient-primary text-primary-foreground border-0" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending ? "Sparar..." : "Spara ändringar"}
            </Button>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4 animate-fade-in">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">{activity.title}</h2>
              {activity.is_recurring && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {activity.recurrence_type === "weekly" ? "Veckovis" : "Månadsvis"}
                </span>
              )}
            </div>
            {activity.description && <p className="text-sm text-muted-foreground">{activity.description}</p>}
            {activity.is_recurring && (
              <p className="text-xs text-muted-foreground bg-surface rounded-lg px-3 py-2">
                Deltagare som läggs till här läggs automatiskt till på alla enskilda tillfällen. Deltagarna svarar på de enskilda tillfällena.
              </p>
            )}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Calendar, label: activity.date },
                { icon: Clock, label: activity.time?.slice(0, 5) },
                { icon: MapPin, label: activity.location || "Ingen plats" },
                { icon: Users, label: `${confirmed} / ${activity.max_participants ?? "∞"} platser` },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </div>
              ))}
            </div>
            {activity.max_participants && !activity.is_recurring && (
              <div className="w-full bg-muted rounded-full h-2">
                <div className="h-2 rounded-full gradient-primary" style={{ width: `${Math.min((confirmed / activity.max_participants) * 100, 100)}%` }} />
              </div>
            )}
          </div>
        )}

        {/* RSVP for invited participants */}
        {!activity.is_recurring && myParticipant && (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Ditt svar</h3>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusConfig[myParticipant.status]?.className ?? "bg-warning/10 text-warning"}`}>
                {statusConfig[myParticipant.status]?.label ?? "Inväntar svar"}
              </span>
            </div>
            <Textarea
              placeholder="Lägg till en kommentar (valfritt)..."
              value={rsvpReason}
              onChange={e => setRsvpReason(e.target.value)}
              rows={2}
              className="resize-none"
            />
            <div className="flex gap-3">
              <Button
                variant={myParticipant.status === "confirmed" ? "default" : "outline"}
                onClick={() => rsvpMutation.mutate("confirmed")}
                disabled={rsvpMutation.isPending}
                className={`flex-1 ${myParticipant.status === "confirmed" ? "gradient-primary text-primary-foreground border-0" : ""}`}
              >
                Jag kommer
              </Button>
              <Button
                variant={myParticipant.status === "maybe" ? "default" : "outline"}
                onClick={() => rsvpMutation.mutate("maybe")}
                disabled={rsvpMutation.isPending}
                className={`flex-1 ${myParticipant.status === "maybe" ? "gradient-primary text-primary-foreground border-0" : ""}`}
              >
                Kanske
              </Button>
              <Button
                variant="outline"
                onClick={() => rsvpMutation.mutate("declined")}
                disabled={rsvpMutation.isPending}
                className={`flex-1 ${myParticipant.status === "declined" ? "bg-destructive text-destructive-foreground border-0" : "text-destructive hover:text-destructive"}`}
              >
                Kan inte
              </Button>
            </div>
          </div>
        )}

        {/* Child events for recurring activities */}
        {activity.is_recurring && childEvents.length > 0 && (
          <div className="bg-card rounded-2xl border border-border overflow-hidden animate-fade-in" style={{ animationDelay: "0.05s" }}>
            <div className="p-5 border-b border-border">
              <h3 className="font-semibold text-foreground">Enskilda tillfällen ({childEvents.length})</h3>
            </div>
            <div className="divide-y divide-border">
              {childEvents.map((child: any) => {
                const childConfirmed = child.participants?.filter((p: any) => p.status === "confirmed").length ?? 0;
                return (
                  <Link
                    key={child.id}
                    to={`/activity/${child.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-surface/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-primary" />
                      <div>
                        <span className="text-sm font-medium text-foreground">{child.date}</span>
                        <span className="text-xs text-muted-foreground ml-2">{child.time?.slice(0, 5)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{childConfirmed}/{child.max_participants ?? "∞"} bekräftade</span>
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={e => {
                        e.preventDefault();
                        navigator.clipboard.writeText(`${window.location.origin}/booking/${child.id}`);
                        toast.success("Inbjudningslänk kopierad!");
                      }}>
                        <Share2 className="h-3 w-3 mr-1" />
                        Länk
                      </Button>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-card rounded-2xl border border-border overflow-hidden animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Deltagare ({activity.participants?.length ?? 0})</h3>
            {isOwner && (
              <div className="flex items-center gap-2">
                {!activity.is_recurring && (
                  reminderCoolingDown ? (
                    <Button variant="outline" size="sm" disabled className="text-success border-success/30">
                      <Bell className="h-3.5 w-3.5 mr-1.5" />
                      Påminnelse skickad ✓
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => sendReminderMutation.mutate()} disabled={sendReminderMutation.isPending}>
                      <Bell className="h-3.5 w-3.5 mr-1.5" />
                      {sendReminderMutation.isPending ? "Skickar..." : "Påminn ej svarade"}
                    </Button>
                  )
                )}
                <Button variant="outline" size="sm" onClick={() => setShowAddUser(!showAddUser)}>
                  <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                  Lägg till
                </Button>
              </div>
            )}
          </div>

          {showAddUser && (
            <div className="p-4 border-b border-border space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Ange e-postadress..."
                    type="email"
                    value={emailInput}
                    onChange={e => { setEmailInput(e.target.value); setEmailError(""); }}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addUserByEmail(); } }}
                    className="h-10 pl-9"
                  />
                </div>
                <Button variant="outline" className="h-10" onClick={addUserByEmail} disabled={emailLoading}>
                  {emailLoading ? "Söker..." : "Lägg till"}
                </Button>
              </div>
              {emailError && (
                <p className="text-xs text-destructive">{emailError}</p>
              )}
            </div>
          )}

          {activity.participants && activity.participants.length > 0 ? (
            <div>
              <div className={`grid ${activity.is_recurring ? (isOwner ? 'grid-cols-[2.5rem_minmax(0,10rem)_1fr_auto]' : 'grid-cols-[2.5rem_minmax(0,10rem)_1fr]') : (isOwner ? 'grid-cols-[2.5rem_minmax(0,10rem)_1fr_auto_auto]' : 'grid-cols-[2.5rem_minmax(0,10rem)_1fr_auto]')} items-center gap-3 px-5 py-2 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wide`}>
                <span></span>
                <span>Namn</span>
                <span>Kommentar</span>
                {!activity.is_recurring && <span>Status</span>}
                {isOwner && <span></span>}
              </div>
              <div className="divide-y divide-border">
                {activity.participants.map((p: any) => {
                  const config = statusConfig[p.status] ?? statusConfig.pending;
                  return (
                    <div key={p.id} className={`grid ${activity.is_recurring ? (isOwner ? 'grid-cols-[2.5rem_minmax(0,10rem)_1fr_auto]' : 'grid-cols-[2.5rem_minmax(0,10rem)_1fr]') : (isOwner ? 'grid-cols-[2.5rem_minmax(0,10rem)_1fr_auto_auto]' : 'grid-cols-[2.5rem_minmax(0,10rem)_1fr_auto]')} items-center gap-3 px-5 py-3 hover:bg-surface/50 transition-colors`}>
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0">
                        {p.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-medium text-foreground truncate block">{p.name}</span>
                        {isOwner && p.email && (
                          <span className="text-[11px] text-muted-foreground truncate block">{p.email}</span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground italic truncate">{p.reason ? `"${p.reason}"` : "—"}</span>
                      {!activity.is_recurring && (
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${config.className}`}>
                          {config.label}
                        </span>
                      )}
                      {isOwner && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Ta bort {p.name}?</AlertDialogTitle>
                              <AlertDialogDescription>Deltagaren tas bort från denna aktivitet.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Avbryt</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteParticipantMutation.mutate(p.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Ta bort
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Inga deltagare ännu. Dela inbjudningslänken eller lägg till användare.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityDetail;
