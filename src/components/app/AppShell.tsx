import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate, useRouter } from "@tanstack/react-router";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  LayoutDashboard, ListOrdered, Users, BookOpen, Receipt, Wallet, ShieldCheck, Settings, LogOut, Search, Menu, ArrowLeft, Lock, Moon, Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AccountSearch, Field, TitleInput } from "./inputs";
import { changePassword, checkPw, getData, loadData, redo, setupAuth, takeSnapshot, undo, useData, useLoaded } from "@/lib/db";
import { norm } from "@/lib/format";
import logo from "@/assets/mussa-logo.png.asset.json";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/entries", label: "All Entries", icon: ListOrdered },
  { to: "/accounts", label: "Accounts", icon: Users },
  { to: "/cashbook", label: "Cash Book", icon: Wallet },
  { to: "/expenses", label: "Expenses", icon: Receipt },
  { to: "/reports", label: "Reports", icon: BookOpen },
  { to: "/admin", label: "Admin Panel", icon: ShieldCheck },
  { to: "/settings", label: "Settings & Backup", icon: Settings },
] as const;

const SESSION = "cashbook-session";

function isTextField(el: Element | null) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (el as HTMLElement).isContentEditable;
}

function useShortcuts() {
  const navigate = useNavigate();
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const k = e.key.toLowerCase();
      const active = document.activeElement;
      if (k === "s") {
        e.preventDefault();
        const form = (active?.closest("form") as HTMLFormElement | null) ?? (document.querySelector("form[data-entry-form]") as HTMLFormElement | null);
        form?.requestSubmit();
      } else if ((k === "z" && !e.shiftKey) && !isTextField(active)) {
        e.preventDefault();
        toast(undo() ? "Undone" : "Nothing to undo");
      } else if ((k === "y" || (k === "z" && e.shiftKey)) && !isTextField(active)) {
        e.preventDefault();
        toast(redo() ? "Redone" : "Nothing to redo");
      } else if (k === "f") {
        e.preventDefault();
        (document.getElementById("global-search") as HTMLInputElement | null)?.focus();
      } else if (k === "p") {
        e.preventDefault();
        window.print();
      } else if (k === "n") {
        e.preventDefault();
        navigate({ to: "/" }).then(() => setTimeout(() => document.getElementById("entry-account")?.focus() ?? document.getElementById("entry-amount")?.focus(), 50));
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [navigate]);
}

export function AppShell() {
  const loaded = useLoaded();
  const d = useData();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    loadData();
    setAuthed(sessionStorage.getItem(SESSION) === "1");
  }, []);

  if (!loaded) return <div className="min-h-screen bg-background" />;
  if (!d.auth || !authed) return <Login firstRun={!d.auth} onDone={() => { sessionStorage.setItem(SESSION, "1"); setAuthed(true); }} />;
  return <Shell onLogout={() => { sessionStorage.removeItem(SESSION); setAuthed(false); }} />;
}

function Shell({ onLogout }: { onLogout: () => void }) {
  useShortcuts();
  useEffect(() => {
    takeSnapshot();
    const t = setInterval(takeSnapshot, 30 * 60 * 1000);
    const h = () => takeSnapshot();
    window.addEventListener("beforeunload", h);
    return () => { clearInterval(t); window.removeEventListener("beforeunload", h); };
  }, []);
  const navigate = useNavigate();
  const router = useRouter();
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(localStorage.getItem("cashbook-theme") === "dark"); }, []);
  useEffect(() => { document.documentElement.classList.toggle("dark", dark); localStorage.setItem("cashbook-theme", dark ? "dark" : "light"); }, [dark]);
  return (
    <div className="min-h-screen bg-background">
      <header className="no-print sticky top-0 z-30 border-b bg-card/80 backdrop-blur">
        <div className="mx-auto grid max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <button aria-label="Menu" className="rounded-full border bg-card p-2 hover:bg-surface"><Menu className="h-5 w-5" /></button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetHeader className="border-b p-4"><SheetTitle><img src={logo.url} alt="Mussa Enterprises" className="h-auto w-44" /></SheetTitle></SheetHeader>
                <div className="space-y-1 p-3">
                  <SheetClose asChild>
                    <button onClick={() => router.history.back()} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-surface"><ArrowLeft className="h-4 w-4" /> Back</button>
                  </SheetClose>
                  <div className="my-2 border-t" />
                  {NAV.map((n) => (
                    <SheetClose asChild key={n.to}>
                      <Link to={n.to} activeOptions={{ exact: n.to === "/" }} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-surface" activeProps={{ className: "bg-accent font-medium text-accent-foreground" }}>
                        <n.icon className="h-4 w-4" /> {n.label}
                      </Link>
                    </SheetClose>
                  ))}
                  <div className="my-2 border-t" />
                  <button onClick={() => setDark((v) => !v)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-surface">{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} {dark ? "Day mode" : "Night mode"}</button>
                  <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-surface"><LogOut className="h-4 w-4" /> Log out</button>
                </div>
              </SheetContent>
            </Sheet>
            <Link to="/" className="hidden sm:block"><img src={logo.url} alt="Mussa Enterprises" className="h-8 w-auto" /></Link>
          </div>
          <div className="mx-auto flex w-full max-w-xl items-center gap-2 rounded-full border bg-background px-4 py-1">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <AccountSearch
              id="global-search"
              clearOnSelect
              className="w-full [&_input]:border-0 [&_input]:bg-transparent [&_input]:shadow-none [&_input]:focus-visible:ring-0"
              placeholder="Search accounts…  (Ctrl+F)"
              onSelect={(a) => navigate({ to: "/ledger/$id", params: { id: a.id } })}
            />
          </div>
          <label className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium" title="Lock the app now">
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">App Lock</span>
            <Switch checked={false} onCheckedChange={(v) => { if (v) onLogout(); }} aria-label="Lock app" />
          </label>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  );
}

function Login({ firstRun, onDone }: { firstRun: boolean; onDone: () => void }) {
  const [company, setCompany] = useState("Mussa Enterprises");
  const [username, setUsername] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !pw) { toast.error("Username and password are required"); return; }
    setBusy(true);
    if (forgot) {
      const d = getData();
      const ok = d.auth && norm(username) === norm(d.auth.username) && norm(company) === norm(d.company.name);
      if (!ok) { setBusy(false); toast.error("Username or business name does not match"); return; }
      if (pw.length < 4 || pw !== pw2) { setBusy(false); toast.error("New passwords must match and be at least 4 characters"); return; }
      await changePassword(pw);
      toast.success("Password reset. You are signed in.");
      setBusy(false);
      onDone();
      return;
    }
    if (firstRun) {
      if (pw.length < 4) { setBusy(false); { toast.error("Password must be at least 4 characters"); return; } }
      if (pw !== pw2) { setBusy(false); { toast.error("Passwords do not match"); return; } }
      await setupAuth(username.trim(), pw, company.trim());
      onDone();
    } else if (await checkPw(pw, username)) onDone();
    else toast.error("Wrong username or password");
    setBusy(false);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-sidebar p-12 text-sidebar-foreground lg:flex">
        <div className="text-xs uppercase tracking-widest text-sidebar-primary">Mussa Enterprises · Cash Book</div>
        <div>
          <h2 className="text-4xl font-semibold leading-tight text-sidebar-accent-foreground">Every rupee in,<br />every rupee out.</h2>
          <p className="mt-4 max-w-sm text-sm">Sales, purchases, payments, salaries and expenses — recorded, searchable and safe on this computer.</p>
        </div>
        <div className="text-xs">Works fully offline</div>
      </div>
      <div className="flex items-center justify-center bg-background p-6">
        <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-xl border bg-card p-8 shadow-sm">
          <img src={logo.url} alt="Mussa Enterprises" className="mx-auto mb-2 h-auto w-64" />
          <div className="border-t pt-4">
            <h1 className="text-xl font-semibold">{firstRun ? "Set up your Cash Book" : forgot ? "Reset password" : "Sign in"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{firstRun ? "Create your login. You will use this every time." : forgot ? "Confirm your username and business name, then choose a new password." : "Enter your username and password."}</p>
          </div>
          {(firstRun || forgot) && (
            <Field label="Company / Business Name">
              <TitleInput value={forgot && company === "Mussa Enterprises" ? company : company} onValueChange={setCompany} placeholder="e.g. Ahmad Steel" />
            </Field>
          )}
          <Field label="Username">
            <Input autoFocus value={username} onChange={(e) => setUsername(e.target.value)} />
          </Field>
          <Field label={forgot ? "New Password" : "Password"}>
            <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
          </Field>
          {(firstRun || forgot) && (
            <Field label="Confirm Password">
              <Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
            </Field>
          )}
          <Button type="submit" className="w-full" disabled={busy}>{firstRun ? "Create & Continue" : forgot ? "Reset & Sign in" : "Sign in"}</Button>
          {!firstRun && (
            <button type="button" onClick={() => setForgot((v) => !v)} className="w-full text-center text-sm text-primary hover:underline">
              {forgot ? "Back to sign in" : "Forgot password?"}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
