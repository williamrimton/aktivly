import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const MyBookings = () => {
  const { user } = useAuth();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["my-bookings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("participants")
        .select("*, activities(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const statusBadge = (status: string) => {
    if (status === "confirmed") return <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full font-medium">Bekräftad</span>;
    if (status === "pending") return <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full font-medium">Inväntar svar</span>;
    if (status === "declined") return <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-medium">Avböjd</span>;
    if (status === "maybe") return <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full font-medium">Kanske</span>;
    return <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">Väntelista</span>;
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-background border-b border-border">
        <div className="container flex items-center gap-4 h-14">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="font-semibold text-foreground">Mina bokningar</h1>
        </div>
      </header>

      <div className="container max-w-lg py-8 space-y-4">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Laddar...</div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p>Inga bokningar ännu</p>
          </div>
        ) : (
          bookings.map((b: any, i: number) => (
            <div key={b.id} className="bg-card rounded-2xl border border-border p-5 space-y-3 animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-foreground">{b.activities?.title}</h3>
                {statusBadge(b.status)}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{b.activities?.date} · {b.activities?.time?.slice(0, 5)}</span>
                {b.activities?.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{b.activities.location}</span>}
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/booking/${b.activity_id}`}>Ändra svar</Link>
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyBookings;
