import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimeInput24h } from "@/components/ui/time-input-24h";
import { ArrowLeft, CalendarPlus, X, Repeat, UserPlus, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SelectedUser {
  user_id: string;
  display_name: string;
  email: string | null;
}

const CreateActivity = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<string>("weekly");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");

  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  const addUserByEmail = async () => {
    const email = emailInput.trim().toLowerCase();
    if (!email) return;
    if (selectedUsers.some(u => u.email === email)) {
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
      setSelectedUsers(prev => [...prev, {
        user_id: data.user_id,
        display_name: data.display_name || data.email || "Anonym",
        email: data.email,
      }]);
      setEmailInput("");
    } catch {
      setEmailError("Något gick fel vid sökning");
    } finally {
      setEmailLoading(false);
    }
  };

  const removeUser = (userId: string) => {
    setSelectedUsers(prev => prev.filter(u => u.user_id !== userId));
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: activity, error } = await supabase.from("activities").insert({
        user_id: user.id,
        title,
        date,
        time,
        location: location || null,
        max_participants: maxParticipants ? parseInt(maxParticipants) : null,
        description: description || null,
        is_recurring: isRecurring,
        recurrence_type: isRecurring ? recurrenceType : null,
        recurrence_end_date: isRecurring && recurrenceEndDate ? recurrenceEndDate : null,
      }).select().single();

      if (error) throw error;

      if (selectedUsers.length > 0 && activity) {
        // Add as invitees
        const { error: inviteeError } = await supabase.from("activity_invitees").insert(
          selectedUsers.map(u => ({
            activity_id: activity.id,
            name: u.display_name,
            email: u.email || null,
          }))
        );
        if (inviteeError) console.error("Failed to add invitees:", inviteeError);

        // Add as participants with pending status
        const { error: participantError } = await supabase.from("participants").insert(
          selectedUsers.map(u => ({
            activity_id: activity.id,
            user_id: u.user_id,
            name: u.display_name,
            email: u.email || null,
            status: "pending",
          }))
        );
        if (participantError) console.error("Failed to create participants:", participantError);

        // Send email notifications to participants
        const participantsWithEmail = selectedUsers.filter(u => u.email);
        if (participantsWithEmail.length > 0) {
          supabase.functions.invoke("notify-participants", {
            body: {
              participants: participantsWithEmail.map(u => ({ name: u.display_name, email: u.email })),
              activityTitle: title,
              siteUrl: window.location.origin,
            },
          }).catch(err => console.error("Failed to send notifications:", err));
        }
      }

      toast.success("Aktivitet skapad!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error("Kunde inte skapa aktiviteten: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-background border-b border-border">
        <div className="container flex items-center gap-4 h-14">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="font-semibold text-foreground">Skapa aktivitet</h1>
        </div>
      </header>

      <div className="container max-w-lg py-8">
        <form onSubmit={handleSubmit} className="space-y-6 bg-card rounded-2xl border border-border p-6 shadow-soft animate-fade-in">
          <div className="space-y-2">
            <Label htmlFor="title">Titel</Label>
            <Input id="title" placeholder="T.ex. Fotbollsträning" value={title} onChange={e => setTitle(e.target.value)} className="h-11" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Datum</Label>
              <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} className="h-11" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Tid</Label>
              <TimeInput24h value={time} onChange={setTime} className="h-11" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Plats</Label>
            <Input id="location" placeholder="T.ex. Eriksdalshallen" value={location} onChange={e => setLocation(e.target.value)} className="h-11" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max">Max antal deltagare</Label>
            <Input id="max" type="number" placeholder="T.ex. 16" value={maxParticipants} onChange={e => setMaxParticipants(e.target.value)} className="h-11" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">Beskrivning (valfritt)</Label>
            <Textarea id="desc" placeholder="Beskriv aktiviteten..." value={description} onChange={e => setDescription(e.target.value)} rows={3} />
          </div>

          {/* Recurring toggle */}
          <div className="rounded-xl border border-border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="recurring" className="cursor-pointer">Återkommande aktivitet</Label>
              </div>
              <Switch id="recurring" checked={isRecurring} onCheckedChange={setIsRecurring} />
            </div>

            {isRecurring && (
              <div className="space-y-4 pt-2 border-t border-border">
                <div className="space-y-2">
                  <Label>Intervall</Label>
                  <Select value={recurrenceType} onValueChange={setRecurrenceType}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Varje vecka</SelectItem>
                      <SelectItem value="monthly">Varje månad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recurrence-end">Slutdatum (valfritt)</Label>
                  <Input id="recurrence-end" type="date" value={recurrenceEndDate} onChange={e => setRecurrenceEndDate(e.target.value)} className="h-11" />
                </div>
              </div>
            )}
          </div>

          {/* User selection */}
          <div className="rounded-xl border border-border p-4 space-y-4">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-muted-foreground" />
              <Label>Deltagare</Label>
            </div>

            {selectedUsers.length > 0 && (
              <div className="space-y-2">
                {selectedUsers.map(u => (
                  <div key={u.user_id} className="flex items-center justify-between bg-surface rounded-lg px-3 py-2">
                    <div>
                      <span className="text-sm font-medium text-foreground">{u.display_name}</span>
                      {u.email && <span className="text-xs text-muted-foreground ml-2">{u.email}</span>}
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeUser(u.user_id)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

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
              <Button type="button" variant="outline" className="h-10" onClick={addUserByEmail} disabled={emailLoading}>
                {emailLoading ? "Söker..." : "Lägg till"}
              </Button>
            </div>

            {emailError && (
              <p className="text-xs text-destructive">{emailError}</p>
            )}
          </div>

          <Button type="submit" className="w-full h-11 gradient-primary text-primary-foreground border-0" disabled={loading}>
            <CalendarPlus className="h-4 w-4 mr-2" />
            {loading ? "Skapar..." : "Skapa aktivitet"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CreateActivity;
