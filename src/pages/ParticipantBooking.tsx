import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Check, X, HelpCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const ParticipantBooking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"confirmed" | "declined" | "maybe" | null>(null);

  const { data: activity, isLoading } = useQuery({
    queryKey: ["booking-activity", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("*, participants(id, status, user_id, name)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const respondMutation = useMutation({
    mutationFn: async (status: "confirmed" | "declined" | "maybe") => {
      if (!user) throw new Error("Du måste vara inloggad");

      // Check if user already has a participant entry (from invitee list)
      const existing = activity?.participants?.find((p: any) => p.user_id === user.id);

      if (existing) {
        const { error } = await supabase
          .from("participants")
          .update({ status, reason: reason || null })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        // Get profile name
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, email")
          .eq("user_id", user.id)
          .single();

        const { error } = await supabase.from("participants").insert({
          activity_id: id!,
          user_id: user.id,
          name: profile?.display_name || user.email?.split("@")[0] || "Anonym",
          email: profile?.email || user.email || null,
          status,
          reason: reason || null,
        });
        if (error) throw error;
      }
    },
    onSuccess: (_, status) => {
      const messages = {
        confirmed: "Du är anmäld! 🎉",
        declined: "Svar registrerat",
        maybe: "Svar registrerat som kanske",
      };
      toast.success(messages[status]);
      queryClient.invalidateQueries({ queryKey: ["booking-activity", id] });
      setSelectedStatus(null);
      setReason("");
      navigate(`/activity/${id}`);
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (authLoading || isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Laddar...</div>;
  }

  if (!activity) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Aktiviteten hittades inte</div>;
  }

  if (activity.is_recurring) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6 animate-fade-in">
          <div className="bg-card rounded-2xl border border-border shadow-elevated p-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl gradient-primary mx-auto flex items-center justify-center text-2xl text-primary-foreground font-bold">
              {activity.title[0]}
            </div>
            <h1 className="text-xl font-bold text-foreground">{activity.title}</h1>
            <p className="text-sm text-muted-foreground">
              Det här är en återkommande aktivitet. Du svarar på de enskilda tillfällena istället.
            </p>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Drivs av <Link to="/" className="text-primary hover:underline font-medium">Aktivly</Link>
          </p>
        </div>
      </div>
    );
  }

  const confirmed = activity.participants?.filter((p: any) => p.status === "confirmed").length ?? 0;
  const alreadyResponded = user && activity.participants?.some((p: any) => p.user_id === user.id);
  const currentResponse = user && activity.participants?.find((p: any) => p.user_id === user.id);

  const statusLabels: Record<string, string> = {
    confirmed: "Jag kommer ✓",
    declined: "Kan inte ✗",
    maybe: "Kanske ⟐",
    pending: "Inväntar svar",
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 animate-fade-in">
        <div className="bg-card rounded-2xl border border-border shadow-elevated overflow-hidden">
          <div className="p-6 text-center space-y-3 border-b border-border">
            <div className="w-14 h-14 rounded-2xl gradient-primary mx-auto flex items-center justify-center text-2xl text-primary-foreground font-bold">
              {activity.title[0]}
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{activity.title}</h1>
              {activity.description && <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>}
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="space-y-3">
              {[
                { icon: Calendar, text: `${activity.date} · ${activity.time?.slice(0, 5)}` },
                { icon: MapPin, text: activity.location || "Ingen plats angiven" },
                { icon: Users, text: `${confirmed} av ${activity.max_participants ?? "∞"} platser bokade` },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.text}
                </div>
              ))}
            </div>

            {activity.max_participants && (
              <div className="w-full bg-muted rounded-full h-1.5">
                <div className="h-1.5 rounded-full gradient-primary" style={{ width: `${Math.min((confirmed / activity.max_participants) * 100, 100)}%` }} />
              </div>
            )}

            {!user ? (
              <div className="space-y-3 pt-2">
                <p className="text-sm text-muted-foreground text-center">Logga in för att svara på inbjudan</p>
                <Button className="w-full gradient-primary text-primary-foreground border-0" asChild>
                  <Link to={`/login?redirect=${encodeURIComponent(`/booking/${id}`)}`}>Logga in</Link>
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Inget konto?{" "}
                  <Link to={`/signup?redirect=${encodeURIComponent(`/booking/${id}`)}`} className="text-primary hover:underline font-medium">
                    Skapa konto
                  </Link>
                </p>
              </div>
            ) : alreadyResponded && !selectedStatus ? (
              <div className="text-center py-4 space-y-3">
                <p className="text-sm font-medium text-foreground">
                  Ditt svar: {statusLabels[currentResponse?.status] || currentResponse?.status}
                </p>
                <Button variant="outline" size="sm" onClick={() => setSelectedStatus(currentResponse?.status as any)}>
                  Ändra svar
                </Button>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    className={`h-14 flex-col gap-1 text-xs ${selectedStatus === "confirmed" ? "gradient-primary text-primary-foreground border-0 ring-2 ring-primary/30" : ""}`}
                    variant={selectedStatus === "confirmed" ? "default" : "outline"}
                    onClick={() => setSelectedStatus("confirmed")}
                  >
                    <Check className="h-5 w-5" />
                    Jag kommer
                  </Button>
                  <Button
                    className={`h-14 flex-col gap-1 text-xs ${selectedStatus === "maybe" ? "bg-warning/10 text-warning border-warning/30 ring-2 ring-warning/20" : ""}`}
                    variant={selectedStatus === "maybe" ? "default" : "outline"}
                    onClick={() => setSelectedStatus("maybe")}
                  >
                    <HelpCircle className="h-5 w-5" />
                    Kanske
                  </Button>
                  <Button
                    className={`h-14 flex-col gap-1 text-xs ${selectedStatus === "declined" ? "bg-destructive/10 text-destructive border-destructive/30 ring-2 ring-destructive/20" : ""}`}
                    variant={selectedStatus === "declined" ? "default" : "outline"}
                    onClick={() => setSelectedStatus("declined")}
                  >
                    <X className="h-5 w-5" />
                    Kan inte
                  </Button>
                </div>

                {selectedStatus && (
                  <div className="space-y-2 animate-fade-in">
                    <Label htmlFor="reason" className="text-xs text-muted-foreground">
                      {selectedStatus === "confirmed" ? "Kommentar (valfritt)" : "Anledning (valfritt)"}
                    </Label>
                    <Textarea
                      id="reason"
                      placeholder={
                        selectedStatus === "declined"
                          ? "T.ex. Jobbar sent den kvällen..."
                          : selectedStatus === "maybe"
                          ? "T.ex. Vet inte om jag hinner..."
                          : "T.ex. Tar med extra utrustning..."
                      }
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      className="resize-none h-20"
                    />
                    <Button
                      className="w-full h-11 gradient-primary text-primary-foreground border-0"
                      onClick={() => respondMutation.mutate(selectedStatus)}
                      disabled={respondMutation.isPending}
                    >
                      {respondMutation.isPending ? "Skickar..." : "Skicka svar"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Drivs av <Link to="/" className="text-primary hover:underline font-medium">Aktivly</Link>
        </p>
      </div>
    </div>
  );
};

export default ParticipantBooking;
