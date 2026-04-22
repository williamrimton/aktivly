import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setEmail(profile.email || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName || null,
          email: email || null,
          phone: phone || null,
        })
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profil uppdaterad!");
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-background border-b border-border">
        <div className="container flex items-center gap-4 h-14">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="font-semibold text-foreground">Min profil</h1>
        </div>
      </header>

      <div className="container max-w-lg py-8">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Laddar...</div>
        ) : (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">{displayName || "Namnlös"}</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Namn</Label>
                <Input
                  id="displayName"
                  placeholder="Ditt namn"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-post (kontakt)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="din@email.se"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">Denna e-post visas för aktivitetsarrangörer</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="070-123 45 67"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>

            <Button
              className="w-full h-11 gradient-primary text-primary-foreground border-0"
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending ? "Sparar..." : "Spara profil"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
