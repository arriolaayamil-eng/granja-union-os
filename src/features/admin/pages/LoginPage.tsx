import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Drumstick, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { loginRequest } from "@/lib/api/auth";
import { login } from "@/lib/auth-store";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const doLogin = async (mail: string, pass: string) => {
    setLoading(true);
    try {
      const { token, user } = await loginRequest(mail, pass);
      login(token, user);
      toast.success(`Bienvenido, ${user.name}`);
      navigate({ to: "/admin" });
    } catch {
      toast.error("No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Drumstick className="h-6 w-6" />
          </div>
          <CardTitle>Granja La Unión</CardTitle>
          <CardDescription>Panel de gestión del negocio</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              doLogin(email, password);
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <Button type="submit" className="h-11 w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Entrar
            </Button>
          </form>

          <div className="relative py-1 text-center text-xs text-muted-foreground">
            <span className="bg-card px-2">Accesos rápidos (demo)</span>
          </div>

          <div className="grid gap-2">
            <Button variant="outline" className="h-11" disabled={loading} onClick={() => doLogin("dueno@granjalaunion.com", "demo")}>
              Entrar como Dueño
            </Button>
            <Button variant="outline" className="h-11" disabled={loading} onClick={() => doLogin("ostende@granjalaunion.com", "demo")}>
              Entrar como Encargado Ostende
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
