import { Shield, Clock, Users, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const ColorSwatch = ({ name, variable, className }: { name: string; variable: string; className: string }) => (
  <div className="flex flex-col items-center gap-2">
    <div className={`h-16 w-16 rounded-lg border border-border ${className}`} />
    <span className="text-xs font-medium text-foreground">{name}</span>
    <span className="text-[10px] text-muted-foreground">{variable}</span>
  </div>
);

const DesignSystem = () => {
  return (
    <div className="min-h-screen bg-background text-foreground p-8 md:p-16 space-y-16 max-w-5xl mx-auto">
      {/* Header */}
      <header>
        <p className="text-sm font-semibold tracking-widest uppercase text-primary mb-2">Huios Jiu Jitsu</p>
        <h1 className="text-4xl font-extrabold mb-2">Design System</h1>
        <p className="text-muted-foreground text-lg">Guia visual de tokens, cores, tipografia e componentes.</p>
      </header>

      {/* Colors */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b border-border pb-3">Cores</h2>

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Primárias</h3>
          <div className="flex flex-wrap gap-6">
            <ColorSwatch name="Background" variable="--background" className="bg-background" />
            <ColorSwatch name="Foreground" variable="--foreground" className="bg-foreground" />
            <ColorSwatch name="Primary" variable="--primary" className="bg-primary" />
            <ColorSwatch name="Primary FG" variable="--primary-foreground" className="bg-primary-foreground" />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Superfícies</h3>
          <div className="flex flex-wrap gap-6">
            <ColorSwatch name="Card" variable="--card" className="bg-card" />
            <ColorSwatch name="Secondary" variable="--secondary" className="bg-secondary" />
            <ColorSwatch name="Muted" variable="--muted" className="bg-muted" />
            <ColorSwatch name="Accent" variable="--accent" className="bg-accent" />
            <ColorSwatch name="Popover" variable="--popover" className="bg-popover" />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Utilitárias</h3>
          <div className="flex flex-wrap gap-6">
            <ColorSwatch name="Border" variable="--border" className="bg-border" />
            <ColorSwatch name="Input" variable="--input" className="bg-input" />
            <ColorSwatch name="Ring" variable="--ring" className="bg-ring" />
            <ColorSwatch name="Destructive" variable="--destructive" className="bg-destructive" />
            <ColorSwatch name="Muted FG" variable="--muted-foreground" className="bg-muted-foreground" />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Customizadas</h3>
          <div className="flex flex-wrap gap-6">
            <ColorSwatch name="Feature Icon BG" variable="--feature-icon-bg" className="bg-feature-icon" />
            <ColorSwatch name="Feature Icon FG" variable="--feature-icon-fg" className="bg-feature-icon-foreground" />
            <ColorSwatch name="Input BG" variable="--input-bg" className="bg-input-bg" />
            <div className="flex flex-col items-center gap-2">
              <div className="h-16 w-16 rounded-lg border border-border" style={{ background: "var(--gradient-login)" }} />
              <span className="text-xs font-medium text-foreground">Gradient Login</span>
              <span className="text-[10px] text-muted-foreground">--gradient-login</span>
            </div>
          </div>
        </div>
      </section>

      {/* Typography */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b border-border pb-3">Tipografia</h2>
        <p className="text-sm text-muted-foreground">Fonte: <span className="font-semibold text-foreground">Inter</span></p>

        <div className="space-y-4">
          <div className="flex items-baseline gap-4">
            <span className="text-xs text-muted-foreground w-32 shrink-0">5xl / extrabold</span>
            <span className="text-5xl font-extrabold">Sua jornada começa aqui.</span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-xs text-muted-foreground w-32 shrink-0">3xl / extrabold</span>
            <span className="text-3xl font-extrabold">Sua jornada começa aqui.</span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-xs text-muted-foreground w-32 shrink-0">2xl / bold</span>
            <span className="text-2xl font-bold">Bem-vindo de volta</span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-xs text-muted-foreground w-32 shrink-0">lg / regular</span>
            <span className="text-lg text-muted-foreground">Acesse sua conta para continuar</span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-xs text-muted-foreground w-32 shrink-0">sm / semibold / uppercase</span>
            <span className="text-sm font-semibold tracking-widest uppercase text-primary">Huios Jiu Jitsu</span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-xs text-muted-foreground w-32 shrink-0">sm / regular</span>
            <span className="text-sm text-secondary-foreground">Controle de graduações e faixas</span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-xs text-muted-foreground w-32 shrink-0">xs / muted</span>
            <span className="text-xs text-muted-foreground">SenseiSystem · Todos os direitos reservados.</span>
          </div>
        </div>
      </section>

      {/* Spacing & Radius */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b border-border pb-3">Border Radius</h2>
        <div className="flex flex-wrap gap-6">
          {[
            { name: "sm", class: "rounded-sm" },
            { name: "md", class: "rounded-md" },
            { name: "lg", class: "rounded-lg" },
            { name: "xl", class: "rounded-xl" },
            { name: "full", class: "rounded-full" },
          ].map((r) => (
            <div key={r.name} className="flex flex-col items-center gap-2">
              <div className={`h-16 w-16 bg-primary ${r.class}`} />
              <span className="text-xs text-muted-foreground">{r.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Buttons */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b border-border pb-3">Botões</h2>

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Variantes</h3>
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Tamanhos</h3>
          <div className="flex flex-wrap items-center gap-4">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon"><Shield className="h-4 w-4" /></Button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Botão Gradiente (Login)</h3>
          <button
            className="rounded-xl px-8 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
            style={{ background: "var(--gradient-login)" }}
          >
            Entrar
          </button>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Desabilitado</h3>
          <div className="flex flex-wrap items-center gap-4">
            <Button disabled>Default</Button>
            <Button variant="secondary" disabled>Secondary</Button>
            <Button variant="outline" disabled>Outline</Button>
          </div>
        </div>
      </section>

      {/* Inputs */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b border-border pb-3">Inputs</h2>

        <div className="max-w-md space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Padrão (shadcn)</h3>
            <Input placeholder="Digite algo..." />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Custom Login Style</h3>
            <input
              type="email"
              placeholder="Seu e-mail"
              className="w-full rounded-xl border border-border bg-input-bg px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Com Label</h3>
            <Label htmlFor="demo" className="mb-2 block">E-mail</Label>
            <input
              id="demo"
              type="email"
              placeholder="Seu e-mail"
              className="w-full rounded-xl border border-border bg-input-bg px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </section>

      {/* Cards */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b border-border pb-3">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Card Padrão</CardTitle>
              <CardDescription>Descrição do card com texto muted.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-secondary-foreground">Conteúdo do card com estilo secundário.</p>
            </CardContent>
          </Card>
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle>Card Destacado</CardTitle>
              <CardDescription>Com borda primária sutil.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Ação</Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Badges */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b border-border pb-3">Badges</h2>
        <div className="flex flex-wrap gap-3">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
      </section>

      {/* Feature Item */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b border-border pb-3">Feature Items</h2>
        <div className="space-y-5 max-w-md">
          {[
            { icon: Shield, text: "Controle de graduações e faixas" },
            { icon: Clock, text: "Presença registrada em tempo real" },
            { icon: Users, text: "Gestão completa de turmas e alunos" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-feature-icon">
                <Icon className="h-5 w-5 text-feature-icon-foreground" />
              </div>
              <span className="text-sm text-secondary-foreground">{text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Animations */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b border-border pb-3">Animações</h2>
        <div className="flex flex-wrap gap-6">
          <div className="animate-fade-in-up bg-card border border-border rounded-lg p-4">
            <p className="text-sm">fade-in-up</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border pt-8 text-xs text-muted-foreground">
        SenseiSystem · Todos os direitos reservados.
      </footer>
    </div>
  );
};

export default DesignSystem;
