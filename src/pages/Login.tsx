import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      navigate(redirectTo);
    }
  };

  return (
    <div className="min-h-screen flex gradient-hero">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8 animate-fade-in">
          <div className="text-center space-y-2">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">A</span>
              </div>
              <span className="font-semibold text-lg text-foreground">Aktivly</span>
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Välkommen tillbaka</h1>
            <p className="text-sm text-muted-foreground">Logga in på ditt konto</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-post</Label>
              <Input id="email" type="email" placeholder="namn@organisation.se" value={email} onChange={e => setEmail(e.target.value)} className="h-11" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Lösenord</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="h-11" required />
            </div>

            <Button type="submit" className="w-full h-11 gradient-primary text-primary-foreground border-0" disabled={loading}>
              {loading ? "Loggar in..." : "Logga in"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Inget konto?{" "}
            <Link to={`/signup${redirectTo !== "/dashboard" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`} className="text-primary font-medium hover:underline">Skapa konto</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
