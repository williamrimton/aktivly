import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Calendar, Users, BarChart3, LogOut, Filter, Repeat, Mail, UserCheck, Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; className: string }> = {
  confirmed: { label: "Bekräftad", className: "bg-success/10 text-success" },
  pending: { label: "Inväntar svar", className: "bg-warning/10 text-warning" },
  declined: { label: "Avböjt", className: "bg-destructive/10 text-destructive" },
  maybe: { label: "Kanske", className: "bg-warning/10 text-warning" },
  waitlist: { label: "Väntelista", className: "bg-muted text-muted-foreground" },
};

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "upcoming" | "full">("all");
  const [inviteSentAt, setInviteSentAt] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem("inv_sent") || "{}"); } catch { return {}; }
  });
  const [sendingId, setSendingId] = useState<string | null>(null);

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["activities", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("*, participants(id, status)")
        .eq("user_id", user!.id)
        .order("date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: participatedActivities = [], isLoading: isLoadingParticipated } = useQuery({
    queryKey: ["participated-activities", user?.id],
    queryFn: async () => {
      // First get activity IDs where the user is a participant
      const { data: participantRows, error: pError } = await supabase
        .from("participants")
        .select("activity_id")
        .eq("user_id", user!.id);
      if (pError) throw pError;
      if (!participantRows || participantRows.length === 0) return [];
      
      const activityIds = participantRows.map(p => p.activity_id);
      
      // Fetch those activities (exclude ones the user owns)
      const { data, error } = await supabase
        .from("activities")
        .select("*, participants(id, status, name, user_id)")
        .in("id", activityIds)
        .order("date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const isCoolingDown = (activityId: string) => {
    const sentAt = inviteSentAt[activityId];
    if (!sentAt) return false;
    return Date.now() - sentAt < 10 * 60 * 1000;
  };

  const forceSendMutation = useMutation({
    mutationFn: async (event: any) => {
      const nextDate = getNextOccurrence(event);
      if (!nextDate) throw new Error("Ingen kommande förekomst hittades");
      const dateStr = formatDate(nextDate);

      // Check if child event already exists for this date
      const { data: existing } = await supabase
        .from("activities")
        .select("id")
        .eq("parent_activity_id", event.id)
        .eq("date", dateStr)
        .maybeSingle();

      let childId: string;

      if (!existing) {
        const { data: newEvent, error } = await supabase
          .from("activities")
          .insert({
            user_id: event.user_id,
            title: event.title,
            description: event.description,
            date: dateStr,
            time: event.time,
            location: event.location,
            max_participants: event.max_participants,
            is_recurring: false,
            parent_activity_id: event.id,
          })
          .select("id")
          .single();
        if (error) throw error;
        childId = newEvent.id;

        // Copy invitees as participants on the new child event
        const { data: invitees } = await supabase
          .from("activity_invitees")
          .select("*")
          .eq("activity_id", event.id);
        if (invitees && invitees.length > 0) {
          await supabase.from("participants").insert(
            invitees.map((inv: any) => ({
              activity_id: childId,
              name: inv.name,
              email: inv.email,
              status: "pending",
            }))
          );
        }
      } else {
        childId = existing.id;
      }

      // Send email invitations
      const { data: invitees } = await supabase
        .from("activity_invitees")
        .select("name, email")
        .eq("activity_id", event.id);
      if (invitees && invitees.length > 0) {
        await supabase.functions.invoke("notify-participants", {
          body: {
            participants: invitees,
            activityTitle: `${event.title} – ${dateStr}`,
            siteUrl: window.location.origin,
          },
        });
      }

      return event.id;
    },
    onSuccess: (activityId: string) => {
      const updated = { ...inviteSentAt, [activityId]: Date.now() };
      setInviteSentAt(updated);
      localStorage.setItem("inv_sent", JSON.stringify(updated));
      setSendingId(null);
      toast.success("Inbjudan skickad!");
      queryClient.invalidateQueries({ queryKey: ["activities", user?.id] });
    },
    onError: (err: any) => {
      setSendingId(null);
      toast.error(err.message || "Kunde inte skicka inbjudan");
    },
  });

  const reminderMutation = useMutation({
    mutationFn: async ({ childId, parentId, eventTitle, dateStr }: { childId: string; parentId: string; eventTitle: string; dateStr: string }) => {
      const { data: pending, error } = await supabase
        .from("participants")
        .select("name, email")
        .eq("activity_id", childId)
        .eq("status", "pending")
        .not("email", "is", null);
      if (error) throw error;
      if (!pending || pending.length === 0) throw new Error("Alla deltagare har redan svarat");
      await supabase.functions.invoke("notify-participants", {
        body: {
          participants: pending,
          activityTitle: `${eventTitle} – ${dateStr}`,
          siteUrl: window.location.origin,
        },
      });
      return parentId;
    },
    onSuccess: (parentId: string) => {
      const updated = { ...inviteSentAt, [parentId]: Date.now() };
      setInviteSentAt(updated);
      localStorage.setItem("inv_sent", JSON.stringify(updated));
      setSendingId(null);
      toast.success("Påminnelse skickad!");
      queryClient.invalidateQueries({ queryKey: ["activities", user?.id] });
    },
    onError: (err: any) => {
      setSendingId(null);
      toast.error(err.message || "Kunde inte skicka påminnelse");
    },
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const enriched = activities.map(a => {
    const confirmed = a.participants?.filter((p: any) => p.status === "confirmed").length ?? 0;
    const total = a.participants?.length ?? 0;
    return { ...a, confirmed, total };
  });

  const oneTimeActivities = enriched.filter(e => !e.is_recurring && !(e as any).parent_activity_id);
  const childActivities = enriched.filter(e => !!(e as any).parent_activity_id);
  const recurringActivities = enriched.filter(e => e.is_recurring && !(e as any).parent_activity_id);

  // Actual scheduled events = standalone + child events (not recurring templates)
  const scheduledEvents = [...oneTimeActivities, ...childActivities];

  const ownedIds = new Set([...oneTimeActivities, ...childActivities].map(e => e.id));
  const confirmedParticipated = participatedActivities
    .filter((e: any) => !e.is_recurring && !ownedIds.has(e.id))
    .filter((e: any) => e.participants?.find((p: any) => p.user_id === user?.id)?.status === "confirmed")
    .map((e: any) => ({ ...e, confirmed: e.participants?.filter((p: any) => p.status === "confirmed").length ?? 0, total: e.participants?.length ?? 0 }));

  const filtered = [...oneTimeActivities, ...childActivities, ...confirmedParticipated].filter(e => {
    if (filter === "full" && e.max_participants && e.confirmed < e.max_participants) return false;
    if (filter === "upcoming" && e.max_participants && e.confirmed >= e.max_participants) return false;
    return e.title.toLowerCase().includes(search.toLowerCase());
  });

  const totalParticipants = scheduledEvents.reduce((sum, e) => sum + e.confirmed, 0);
  const thisWeek = scheduledEvents.filter(e => {
    const d = new Date(e.date);
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return d >= now && d <= weekFromNow;
  }).length;

  const statusColor = (confirmed: number, max: number | null) => {
    if (max && confirmed >= max) return "bg-warning";
    if (max && confirmed / max > 0.7) return "bg-success";
    return "bg-primary";
  };

  const getNextOccurrence = (activity: any) => {
    const startDate = new Date(activity.date);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    let next = new Date(startDate);

    while (next < now) {
      if (activity.recurrence_type === "weekly") {
        next.setDate(next.getDate() + 7);
      } else {
        next.setMonth(next.getMonth() + 1);
      }
    }

    if (activity.recurrence_end_date && next > new Date(activity.recurrence_end_date)) {
      return null;
    }
    return next;
  };

  const getInvitationSendDate = (nextDate: Date) => {
    const sendDate = new Date(nextDate);
    sendDate.setDate(sendDate.getDate() - 5);
    return sendDate;
  };

  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  if (!user) {
    navigate("/login");
    return null;
  }

  const ActivityCard = ({ event, i }: { event: any; i: number }) => (
    <Link
      key={event.id}
      to={`/activity/${event.id}`}
      className="bg-card rounded-2xl border border-border p-5 space-y-4 hover:shadow-card hover:border-primary/20 transition-all animate-fade-in group"
      style={{ animationDelay: `${i * 0.05}s` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{event.title}</h3>
          <p className="text-xs text-muted-foreground mt-1">{event.location || "Ingen plats"}</p>
        </div>
        <div className={`w-2 h-2 rounded-full mt-2 ${statusColor(event.confirmed, event.max_participants)}`} />
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{event.date}</span>
        <span>{event.time?.slice(0, 5)}</span>
      </div>
      {event.max_participants && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Deltagare</span>
            <span className="font-medium text-foreground">{event.confirmed}/{event.max_participants}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5">
            <div className="h-1.5 rounded-full gradient-primary transition-all" style={{ width: `${(event.confirmed / event.max_participants) * 100}%` }} />
          </div>
        </div>
      )}
    </Link>
  );

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-background border-b border-border sticky top-0 z-40">
        <div className="container flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">A</span>
            </div>
            <span className="font-semibold text-foreground hidden sm:inline">Aktivly</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-muted-foreground" asChild>
              <Link to="/my-bookings">Mina bokningar</Link>
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground" asChild>
              <Link to="/profile">Min profil</Link>
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-8 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Calendar, label: "Aktiva aktiviteter", value: String(oneTimeActivities.length) },
            { icon: Users, label: "Bekräftade deltagare", value: String(totalParticipants) },
            { icon: Repeat, label: "Återkommande", value: String(recurringActivities.length) },
            { icon: Calendar, label: "Denna vecka", value: String(thisWeek) },
          ].map(stat => (
            <div key={stat.label} className="bg-card rounded-2xl border border-border p-5 space-y-2">
              <stat.icon className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Aktiviteter</h1>
            <p className="text-sm text-muted-foreground">Hantera dina kommande och pågående event</p>
          </div>
          <Button className="gradient-primary text-primary-foreground border-0 shadow-soft" asChild>
            <Link to="/create">
              <Plus className="h-4 w-4 mr-2" />
              Skapa aktivitet
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="activities" className="space-y-6">
          <TabsList>
            <TabsTrigger value="activities">
              <Calendar className="h-4 w-4 mr-1.5" />
              Aktiviteter
            </TabsTrigger>
            <TabsTrigger value="recurring">
              <Repeat className="h-4 w-4 mr-1.5" />
              Återkommande ({recurringActivities.length})
            </TabsTrigger>
            <TabsTrigger value="invited">
              <UserCheck className="h-4 w-4 mr-1.5" />
              Inbjuden till ({participatedActivities.filter((e: any) => !e.is_recurring).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activities" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Sök aktiviteter..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10 bg-card" />
              </div>
              <div className="flex gap-2">
                {(["all", "upcoming", "full"] as const).map(f => (
                  <Button key={f} variant={filter === f ? "default" : "outline"} size="sm"
                    className={filter === f ? "gradient-primary text-primary-foreground border-0" : ""}
                    onClick={() => setFilter(f)}
                  >
                    <Filter className="h-3 w-3 mr-1.5" />
                    {f === "all" ? "Alla" : f === "upcoming" ? "Kommande" : "Fullbokade"}
                  </Button>
                ))}
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Laddar...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto" />
                <p className="text-muted-foreground">Inga aktiviteter ännu</p>
                <Button className="gradient-primary text-primary-foreground border-0" asChild>
                  <Link to="/create"><Plus className="h-4 w-4 mr-2" />Skapa din första aktivitet</Link>
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((event, i) => <ActivityCard key={event.id} event={event} i={i} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="recurring" className="space-y-6">
            {recurringActivities.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <Repeat className="h-12 w-12 text-muted-foreground/30 mx-auto" />
                <p className="text-muted-foreground">Inga återkommande aktiviteter</p>
                <Button className="gradient-primary text-primary-foreground border-0" asChild>
                  <Link to="/create"><Plus className="h-4 w-4 mr-2" />Skapa återkommande aktivitet</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recurringActivities.map((event, i) => {
                  const nextOccurrence = getNextOccurrence(event);
                  const invitationDate = nextOccurrence ? getInvitationSendDate(nextOccurrence) : null;
                  const now = new Date();
                  now.setHours(0, 0, 0, 0);
                  const invitationSent = invitationDate ? invitationDate <= now : false;

                  const nextDateStr = nextOccurrence ? formatDate(nextOccurrence) : null;
                  const existingChild = nextDateStr
                    ? childActivities.find(c => (c as any).parent_activity_id === event.id && c.date === nextDateStr)
                    : null;
                  const cooling = isCoolingDown(event.id);

                  return (
                    <Link
                      key={event.id}
                      to={`/activity/${event.id}`}
                      className="block bg-card rounded-2xl border border-border p-5 space-y-4 hover:shadow-card hover:border-primary/20 transition-all animate-fade-in group"
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{event.title}</h3>
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              {event.recurrence_type === "weekly" ? "Veckovis" : "Månadsvis"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{event.location || "Ingen plats"}</p>
                        </div>
                        <div className={`w-2 h-2 rounded-full mt-2 ${statusColor(event.confirmed, event.max_participants)}`} />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          <div>
                            <p className="font-medium text-foreground">Nästa tillfälle</p>
                            <p>{nextOccurrence ? formatDate(nextOccurrence) : "Avslutat"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />
                          <div>
                            <p className="font-medium text-foreground">Inbjudan skickas</p>
                            <p>{invitationDate ? (invitationSent ? "Skickad ✓" : formatDate(invitationDate)) : "—"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-3.5 w-3.5" />
                          <div>
                            <p className="font-medium text-foreground">Deltagare</p>
                            <p>{event.confirmed} / {event.max_participants ?? "∞"}</p>
                          </div>
                        </div>
                      </div>

                      {event.recurrence_end_date && (
                        <p className="text-xs text-muted-foreground">Slutar: {event.recurrence_end_date}</p>
                      )}

                      {nextOccurrence && !existingChild && (
                        <div className="pt-1" onClick={e => e.preventDefault()}>
                          {cooling ? (
                            <Button variant="outline" size="sm" disabled className="w-full text-success border-success/30">
                              <Mail className="h-3.5 w-3.5 mr-1.5" />
                              Inbjudan skickad ✓
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="w-full gradient-primary text-primary-foreground border-0"
                              disabled={sendingId === event.id}
                              onClick={e => { e.preventDefault(); e.stopPropagation(); setSendingId(event.id); forceSendMutation.mutate(event); }}
                            >
                              <Send className="h-3.5 w-3.5 mr-1.5" />
                              {sendingId === event.id ? "Skickar..." : "Skicka inbjudan nu"}
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Show child events */}
                      {childActivities.filter(c => (c as any).parent_activity_id === event.id).length > 0 && (
                        <div className="border-t border-border pt-3 mt-2">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Kommande event:</p>
                          <div className="space-y-1.5">
                            {childActivities
                              .filter(c => (c as any).parent_activity_id === event.id)
                              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                              .map(child => (
                                <Link
                                  key={child.id}
                                  to={`/activity/${child.id}`}
                                  onClick={e => e.stopPropagation()}
                                  className="flex items-center justify-between text-xs bg-surface/50 rounded-lg px-3 py-2 hover:bg-surface transition-colors"
                                >
                                  <span className="flex items-center gap-2">
                                    <Calendar className="h-3 w-3 text-primary" />
                                    <span className="text-foreground">{child.date}</span>
                                    <span className="text-muted-foreground">{child.time?.slice(0, 5)}</span>
                                  </span>
                                  <span className="text-muted-foreground">{child.confirmed}/{child.max_participants ?? "∞"}</span>
                                </Link>
                              ))}
                          </div>
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="invited" className="space-y-6">
            {isLoadingParticipated ? (
              <div className="text-center py-12 text-muted-foreground">Laddar...</div>
            ) : participatedActivities.filter((e: any) => !e.is_recurring).length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <UserCheck className="h-12 w-12 text-muted-foreground/30 mx-auto" />
                <p className="text-muted-foreground">Du har inte blivit tillagd på några aktiviteter ännu</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {participatedActivities.filter((event: any) => !event.is_recurring).map((event: any, i: number) => {
                  const myParticipant = event.participants?.find((p: any) => p.user_id === user?.id);
                  const confirmedCount = event.participants?.filter((p: any) => p.status === "confirmed").length ?? 0;
                  const enrichedEvent = { ...event, confirmed: confirmedCount, total: event.participants?.length ?? 0 };
                  return (
                    <Link
                      key={event.id}
                      to={`/activity/${event.id}`}
                      className="bg-card rounded-2xl border border-border p-5 space-y-4 hover:shadow-card hover:border-primary/20 transition-all animate-fade-in group"
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{event.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1">{event.location || "Ingen plats"}</p>
                        </div>
                        {myParticipant && (
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${statusConfig[myParticipant.status]?.className ?? "bg-warning/10 text-warning"}`}>
                            {statusConfig[myParticipant.status]?.label ?? "Inväntar svar"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{event.date}</span>
                        <span>{event.time?.slice(0, 5)}</span>
                      </div>
                      {event.max_participants && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Deltagare</span>
                            <span className="font-medium text-foreground">{confirmedCount}/{event.max_participants}</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div className="h-1.5 rounded-full gradient-primary transition-all" style={{ width: `${(confirmedCount / event.max_participants) * 100}%` }} />
                          </div>
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
