import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const roleLabels = {
  admin: "Administrateur",
  consultant: "Consultant",
  client: "Entreprise / Client",
};

export default function App() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState("login");
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !session?.user) {
      setProfile(null);
      return;
    }
    loadProfile(session.user);
  }, [session]);

  async function loadProfile(user) {
    setMessage("");

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      setMessage("Table profiles introuvable ou accès refusé. Vérifie les scripts SQL Supabase.");
      return;
    }

    if (data) {
      setProfile(data);
      return;
    }

    const newProfile = {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || "",
      role: user.user_metadata?.role || "consultant",
    };

    const { data: created, error: createError } = await supabase
      .from("profiles")
      .insert(newProfile)
      .select("*")
      .single();

    if (createError) {
      setMessage("Impossible de créer le profil. Vérifie les règles RLS Supabase.");
      return;
    }

    setProfile(created);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
    setView("login");
  }

  if (!supabase) return <ConfigMissing />;
  if (!ready) return <Loader text="Chargement..." />;
  if (!session) return <Auth view={view} setView={setView} message={message} setMessage={setMessage} />;

  return <Dashboard session={session} profile={profile} message={message} signOut={signOut} />;
}

function Auth({ view, setView, message, setMessage }) {
  const isLogin = view === "login";
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", fullName: "", role: "consultant" });

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { full_name: form.fullName, role: form.role } },
        });
        if (error) throw error;
        setMessage("Compte créé. Vous pouvez maintenant vous connecter.");
        setView("login");
      }
    } catch (err) {
      setMessage(err.message || "Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 py-10 md:grid-cols-2 md:px-6">
        <div>
          <Logo light />
          <p className="mb-4 mt-10 inline-flex rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-100">
            Espace connecté · consultants · clients · admin
          </p>
          <h1 className="text-4xl font-black leading-tight md:text-6xl">
            Votre espace privé LRN PORTAGE.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
            Connectez-vous pour suivre les missions, CRA, documents, frais, validations et informations administratives.
          </p>
        </div>

        <div className="rounded-[2rem] bg-white p-6 text-slate-950 shadow-2xl md:p-8">
          <h2 className="text-2xl font-black">{isLogin ? "Connexion" : "Créer un compte"}</h2>
          <p className="mt-2 text-sm text-slate-600">
            {isLogin ? "Accédez à votre espace sécurisé." : "Créez un accès consultant ou client."}
          </p>

          <form className="mt-6 space-y-4" onSubmit={submit}>
            {!isLogin && (
              <>
                <Input label="Nom complet / société" value={form.fullName} onChange={(v) => setForm({ ...form, fullName: v })} />
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Type de compte</span>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-700"
                  >
                    <option value="consultant">Consultant</option>
                    <option value="client">Entreprise / Client</option>
                  </select>
                </label>
              </>
            )}

            <Input label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            <Input label="Mot de passe" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} />

            {message && <div className="rounded-2xl bg-blue-50 p-4 text-sm leading-6 text-blue-900">{message}</div>}

            <button disabled={loading} className="min-h-12 w-full rounded-full bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
              {loading ? "Chargement..." : isLogin ? "Se connecter" : "Créer le compte"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600">
            {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}{" "}
            <button
              onClick={() => {
                setMessage("");
                setView(isLogin ? "signup" : "login");
              }}
              className="font-bold text-blue-700"
            >
              {isLogin ? "Créer un accès" : "Se connecter"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function Dashboard({ session, profile, message, signOut }) {
  const role = profile?.role || "consultant";

  if (role === "admin") {
    return <AdminDashboard session={session} profile={profile} message={message} signOut={signOut} />;
  }

  return <UserDashboard session={session} profile={profile} message={message} signOut={signOut} />;
}

function AdminDashboard({ session, profile, message, signOut }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [profiles, setProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [adminMessage, setAdminMessage] = useState("");

  useEffect(() => {
    loadProfiles();
  }, []);

  async function loadProfiles() {
    setLoadingProfiles(true);
    setAdminMessage("");

    const { data, error } = await supabase
      .from("profiles")
      .select("id,email,full_name,role,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setAdminMessage("Impossible de charger les profils. Lance le script supabase-admin-policies.sql dans Supabase.");
      setLoadingProfiles(false);
      return;
    }

    setProfiles(data || []);
    setLoadingProfiles(false);
  }

  async function updateRole(id, newRole) {
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", id);

    if (error) {
      setAdminMessage("Modification impossible. Vérifie les droits admin RLS.");
      return;
    }

    await loadProfiles();
  }

  const stats = useMemo(() => {
    return {
      consultants: profiles.filter((p) => p.role === "consultant").length,
      clients: profiles.filter((p) => p.role === "client").length,
      admins: profiles.filter((p) => p.role === "admin").length,
      total: profiles.length,
    };
  }, [profiles]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header signOut={signOut} />

      <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        {message && <Alert type="warning">{message}</Alert>}
        {adminMessage && <Alert type="warning">{adminMessage}</Alert>}

        <Hero role="Administrateur" title={`Bonjour, ${profile?.full_name || session.user.email}`} />

        <div className="mt-8 grid gap-5 md:grid-cols-4">
          <StatCard title="Utilisateurs" value={stats.total} text="Tous les comptes créés" />
          <StatCard title="Consultants" value={stats.consultants} text="Profils consultants" />
          <StatCard title="Clients" value={stats.clients} text="Comptes entreprises" />
          <StatCard title="Admins" value={stats.admins} text="Administrateurs" />
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")}>Vue générale</TabButton>
          <TabButton active={activeTab === "profiles"} onClick={() => setActiveTab("profiles")}>Gestion des profils</TabButton>
          <TabButton active={activeTab === "documents"} onClick={() => setActiveTab("documents")}>Documents</TabButton>
          <TabButton active={activeTab === "cra"} onClick={() => setActiveTab("cra")}>CRA</TabButton>
        </div>

        {activeTab === "overview" && (
          <section className="mt-6 grid gap-6 md:grid-cols-2">
            <Panel title="Actions rapides">
              <ActionButton label="Gérer les profils" onClick={() => setActiveTab("profiles")} />
              <ActionButton label="Préparer module documents" onClick={() => setActiveTab("documents")} />
              <ActionButton label="Préparer module CRA" onClick={() => setActiveTab("cra")} />
              <ActionButton label="Rafraîchir les données" onClick={loadProfiles} />
            </Panel>

            <Panel title="Informations admin">
              <InfoLine label="Email" value={session.user.email} />
              <InfoLine label="Rôle" value="Administrateur" />
              <InfoLine label="ID utilisateur" value={session.user.id} />
            </Panel>
          </section>
        )}

        {activeTab === "profiles" && (
          <ProfilesManager
            profiles={profiles}
            loading={loadingProfiles}
            onRefresh={loadProfiles}
            onUpdateRole={updateRole}
          />
        )}

        {activeTab === "documents" && (
          <ComingSoon
            title="Module documents"
            text="Prochaine étape : dépôt de contrats, fiches de paie, justificatifs et documents par utilisateur."
          />
        )}

        {activeTab === "cra" && (
          <ComingSoon
            title="Module CRA"
            text="Prochaine étape : déclaration des jours travaillés, soumission et validation côté client/admin."
          />
        )}
      </main>
    </div>
  );
}

function ProfilesManager({ profiles, loading, onRefresh, onUpdateRole }) {
  const [filter, setFilter] = useState("all");

  const filteredProfiles = profiles.filter((profile) => {
    if (filter === "all") return true;
    return profile.role === filter;
  });

  return (
    <section className="mt-6 rounded-[2rem] bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-950">Gestion des profils</h2>
          <p className="mt-2 text-sm text-slate-600">
            Consulte les comptes créés et ajuste les rôles si nécessaire.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="rounded-full bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800"
        >
          Rafraîchir
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <TabButton active={filter === "all"} onClick={() => setFilter("all")}>Tous</TabButton>
        <TabButton active={filter === "consultant"} onClick={() => setFilter("consultant")}>Consultants</TabButton>
        <TabButton active={filter === "client"} onClick={() => setFilter("client")}>Clients</TabButton>
        <TabButton active={filter === "admin"} onClick={() => setFilter("admin")}>Admins</TabButton>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100">
        <div className="hidden grid-cols-4 bg-slate-50 px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500 md:grid">
          <span>Nom</span>
          <span>Email</span>
          <span>Rôle</span>
          <span>ID</span>
        </div>

        {loading ? (
          <div className="p-6 text-slate-600">Chargement des profils...</div>
        ) : filteredProfiles.length === 0 ? (
          <div className="p-6 text-slate-600">Aucun profil trouvé.</div>
        ) : (
          filteredProfiles.map((profile) => (
            <div key={profile.id} className="grid gap-3 border-t border-slate-100 px-5 py-4 md:grid-cols-4 md:items-center">
              <div>
                <p className="font-bold text-slate-950">{profile.full_name || "Sans nom"}</p>
                <p className="text-xs text-slate-500 md:hidden">{profile.email}</p>
              </div>
              <p className="break-all text-sm text-slate-700">{profile.email}</p>
              <select
                value={profile.role}
                onChange={(e) => onUpdateRole(profile.id, e.target.value)}
                className="w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 outline-none"
              >
                <option value="consultant">Consultant</option>
                <option value="client">Client</option>
                <option value="admin">Admin</option>
              </select>
              <p className="break-all text-xs text-slate-500">{profile.id}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function UserDashboard({ session, profile, message, signOut }) {
  const role = profile?.role || "consultant";

  const cards = role === "client"
    ? [
        ["Consultants", "0", "Voir les profils affectés"],
        ["CRA en attente", "0", "Valider l’activité mensuelle"],
        ["Factures", "0", "Suivre les documents de facturation"],
        ["Demandes", "0", "Demander un renfort opérationnel"],
      ]
    : [
        ["Mission active", "À définir", "Consulter les informations de mission"],
        ["CRA du mois", "À remplir", "Déclarer les jours travaillés"],
        ["Documents", "0", "Contrats, fiches de paie et justificatifs"],
        ["Frais", "À saisir", "IK, paniers repas et téléphone"],
      ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header signOut={signOut} />

      <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        {message && <Alert type="warning">{message}</Alert>}

        <Hero role={roleLabels[role] || "Utilisateur"} title={`Bonjour, ${profile?.full_name || session.user.email}`} />

        <section className="mt-8 grid gap-5 md:grid-cols-4">
          {cards.map(([title, value, text]) => (
            <StatCard key={title} title={title} value={value} text={text} />
          ))}
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <Panel title="Actions rapides">
            <ActionButton label="Déposer un document" />
            <ActionButton label="Remplir un CRA" />
            <ActionButton label="Déclarer des frais" />
            <ActionButton label="Contacter LRN PORTAGE" />
          </Panel>

          <Panel title="Informations du compte">
            <InfoLine label="Email" value={session.user.email} />
            <InfoLine label="Rôle" value={roleLabels[role] || role} />
            <InfoLine label="ID utilisateur" value={session.user.id} />
          </Panel>
        </section>
      </main>
    </div>
  );
}

function Header({ signOut }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
        <Logo />
        <button onClick={signOut} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
          Déconnexion
        </button>
      </div>
    </header>
  );
}

function Hero({ role, title }) {
  return (
    <section className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 text-white md:p-10">
      <p className="inline-flex rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-100">
        {role}
      </p>
      <h1 className="mt-5 text-3xl font-black md:text-5xl">{title}</h1>
      <p className="mt-4 max-w-2xl leading-8 text-slate-300">
        Bienvenue dans votre espace connecté LRN PORTAGE.
      </p>
    </section>
  );
}

function ComingSoon({ title, text }) {
  return (
    <section className="mt-6 rounded-[2rem] bg-white p-8 shadow-sm">
      <p className="mb-3 inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">Bientôt</p>
      <h2 className="text-2xl font-black text-slate-950">{title}</h2>
      <p className="mt-3 max-w-2xl leading-7 text-slate-600">{text}</p>
    </section>
  );
}

function ConfigMissing() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <div className="max-w-2xl rounded-[2rem] bg-white p-8 text-slate-950 shadow-2xl">
        <h1 className="text-3xl font-black">Configuration Supabase manquante</h1>
        <p className="mt-4 leading-7 text-slate-700">
          Ajoute ces variables dans Vercel ou dans un fichier <code className="rounded bg-slate-100 px-2 py-1">.env</code> en local :
        </p>
        <pre className="mt-5 overflow-x-auto rounded-2xl bg-slate-950 p-5 text-sm text-blue-100">
{`VITE_SUPABASE_URL=ton_project_url
VITE_SUPABASE_ANON_KEY=ta_anon_public_key`}
        </pre>
      </div>
    </main>
  );
}

function Loader({ text }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <div className="rounded-[2rem] bg-white/10 p-8 text-center">
        <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-4 border-blue-300 border-t-transparent" />
        <p className="font-semibold">{text}</p>
      </div>
    </main>
  );
}

function Logo({ light = false }) {
  return (
    <div className="flex items-end gap-2">
      <span className={`text-3xl font-black tracking-tight ${light ? "text-white" : "text-slate-950"}`}>LRN</span>
      <span className="mb-1 text-sm font-semibold tracking-[0.35em] text-blue-500">PORTAGE</span>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div className="rounded-[2rem] bg-white p-6 shadow-sm">
      <h2 className="text-xl font-black text-slate-950">{title}</h2>
      <div className="mt-5 space-y-3">{children}</div>
    </div>
  );
}

function ActionButton({ label, onClick }) {
  return (
    <button onClick={onClick} className="flex w-full items-center justify-between rounded-2xl bg-slate-50 px-4 py-4 text-left font-semibold text-slate-800 hover:bg-blue-50">
      {label}
      <span className="text-blue-700">→</span>
    </button>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={active
        ? "rounded-full bg-blue-700 px-5 py-3 text-sm font-semibold text-white"
        : "rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-blue-50 hover:text-blue-700"
      }
    >
      {children}
    </button>
  );
}

function StatCard({ title, value, text }) {
  return (
    <div className="rounded-[2rem] bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold text-blue-700">{title}</p>
      <p className="mt-3 text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}

function InfoLine({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 break-all font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function Alert({ children }) {
  return (
    <div className="mb-6 rounded-2xl bg-yellow-50 p-4 text-sm leading-6 text-yellow-900">
      {children}
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <input
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-700"
      />
    </label>
  );
}
