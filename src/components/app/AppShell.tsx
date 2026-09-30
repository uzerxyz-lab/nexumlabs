import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  LayoutDashboard, ListOrdered, Users, BookOpen, Receipt, Wallet, ShieldCheck, Settings, LogOut, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AccountSearch, Field, TitleInput } from "./inputs";
import { checkPw, loadData, redo, setupAuth, takeSnapshot, undo, useData, useLoaded } from "@/lib/db";
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
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="no-print sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="border-b border-sidebar-border p-4">
          <div className="rounded-md bg-card px-3 py-2.5">
            <img src={logo.url} alt="Mussa Enterprises" className="h-auto w-full" />
          </div>
          <div className="mt-2 text-center text-[10px] uppercase tracking-[0.2em] text-sidebar-primary">Cash Book & Ledger</div>
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === "/" }}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground font-medium" }}
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </Link>
          ))}
        </nav>
        <button onClick={onLogout} className="m-3 flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-30 flex items-center gap-3 border-b bg-card/90 px-6 py-3 backdrop-blur">
          <Search className="h-4 w-4 text-muted-foreground" />
          <AccountSearch
            id="global-search"
            clearOnSelect
            className="w-full max-w-md"
            placeholder="Search accounts…  (Ctrl+F)"
            onSelect={(a) => navigate({ to: "/ledger/$id", params: { id: a.id } })}
          />
          <nav className="ml-auto flex gap-1 overflow-x-auto md:hidden">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className="rounded p-2 text-muted-foreground" activeProps={{ className: "text-primary" }}>
                <n.icon className="h-4 w-4" />
              </Link>
            ))}
          </nav>
          <span className="ml-auto hidden text-xs text-muted-foreground lg:block">Ctrl+N new entry · Ctrl+S save · Ctrl+Z undo</span>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function Login({ firstRun, onDone }: { firstRun: boolean; onDone: () => void }) {
  const [company, setCompany] = useState("Mussa Enterprises");
  const [username, setUsername] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !pw) { toast.error("Username and password are required"); return; }
    setBusy(true);
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
            <h1 className="text-xl font-semibold">{firstRun ? "Set up your Cash Book" : "Sign in"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{firstRun ? "Create your login. You will use this every time." : "Enter your username and password."}</p>
          </div>
          {firstRun && (
            <Field label="Company / Business Name">
              <TitleInput value={company} onValueChange={setCompany} placeholder="e.g. Ahmad Steel" />
            </Field>
          )}
          <Field label="Username">
            <Input autoFocus value={username} onChange={(e) => setUsername(e.target.value)} />
          </Field>
          <Field label="Password">
            <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
          </Field>
          {firstRun && (
            <Field label="Confirm Password">
              <Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
            </Field>
          )}
          <Button type="submit" className="w-full" disabled={busy}>{firstRun ? "Create & Continue" : "Sign in"}</Button>
        </form>
      </div>
    </div>
  );
}
