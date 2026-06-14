import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const DOCUMENT_BUCKET = "documents";

const roleLabels = {
  admin: "Administrateur",
  consultant: "Consultant",
  client: "Entreprise / Client",
};

const docTypeLabels = {
  contrat: "Contrat",
  fiche_paie: "Fiche de paie",
  justificatif: "Justificatif",
  cra: "CRA",
  autre: "Autre",
};

const craStatusLabels = {
  draft: "Brouillon",
  submitted: "Soumis",
  approved: "Validé",
  rejected: "Refusé",
};

const commentVisibilityLabels = {
  admin_only: "Admin uniquement",
  both: "Admin + consultant",
};

const COMPANY_INVOICE_INFO = {
  name: "LRN PORTAGE",
  legalName: "LRN PORTAGE",
  address: "18 RUE DE LA BRUYERE, 78300 POISSY",
  phone: "06.34.38.30.78",
  email: "lrninfo78@gmail.com",
  siret: "104 387 105 00018",
  vatNumber: "FR28104387105",
  iban: "FR42 3000 2023 3600 0024 8787 T61",
  bic: "CRLYFRPP",
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
  const [documents, setDocuments] = useState([]);
  const [cras, setCras] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [loadingCras, setLoadingCras] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [adminMessage, setAdminMessage] = useState("");

  useEffect(() => {
    loadProfiles();
    loadDocuments();
    loadCras();
    loadInvoices();
  }, []);

  async function loadProfiles() {
    setLoadingProfiles(true);
    setAdminMessage("");

    const { data, error } = await supabase
      .from("profiles")
      .select("id,email,full_name,role,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setAdminMessage("Impossible de charger les profils. Lance le script supabase-admin-policies.sql.");
      setLoadingProfiles(false);
      return;
    }

    setProfiles(data || []);
    setLoadingProfiles(false);
  }

  async function loadDocuments() {
    setLoadingDocuments(true);
    setAdminMessage("");

    const { data, error } = await supabase
      .from("documents")
      .select("id,owner_id,title,file_path,document_type,created_at,profiles:owner_id(email,full_name,role)")
      .order("created_at", { ascending: false });

    if (error) {
      setAdminMessage("Impossible de charger les documents. Lance le script supabase-documents.sql.");
      setLoadingDocuments(false);
      return;
    }

    setDocuments(data || []);
    setLoadingDocuments(false);
  }


  async function loadCras() {
    setLoadingCras(true);
    setAdminMessage("");

    const { data, error } = await supabase
      .from("cra")
      .select("id,consultant_id,client_id,month,worked_days,consultant_comment,client_comment,client_comment_visibility,status,created_at,updated_at,submitted_at,validated_at,consultant:consultant_id(email,full_name,role),client:client_id(email,full_name,role)")
      .order("created_at", { ascending: false });

    if (error) {
      setAdminMessage("Impossible de charger les CRA. Lance le script supabase-cra.sql.");
      setLoadingCras(false);
      return;
    }

    setCras(data || []);
    setLoadingCras(false);
  }

  async function loadInvoices() {
    setLoadingInvoices(true);
    setAdminMessage("");

    const { data, error } = await supabase
      .from("invoices")
      .select("id,cra_id,invoice_number,data,subtotal,vat_amount,total,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setAdminMessage("Impossible de charger les factures. Lance le script supabase-invoices.sql.");
      setLoadingInvoices(false);
      return;
    }

    setInvoices(data || []);
    setLoadingInvoices(false);
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
      documents: documents.length,
      craPending: cras.filter((cra) => cra.status === "submitted").length,
      craTotal: cras.length,
      invoices: invoices.length,
    };
  }, [profiles, documents, cras, invoices]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header signOut={signOut} />

      <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        {message && <Alert>{message}</Alert>}
        {adminMessage && <Alert>{adminMessage}</Alert>}

        <Hero role="Administrateur" title={`Bonjour, ${profile?.full_name || session.user.email}`} />

        <div className="mt-8 grid gap-5 md:grid-cols-7">
          <StatCard title="Utilisateurs" value={stats.total} text="Tous les comptes créés" />
          <StatCard title="Consultants" value={stats.consultants} text="Profils consultants" />
          <StatCard title="Clients" value={stats.clients} text="Comptes entreprises" />
          <StatCard title="Admins" value={stats.admins} text="Administrateurs" />
          <StatCard title="Documents" value={stats.documents} text="Documents déposés" />
          <StatCard title="CRA à valider" value={stats.craPending} text="Soumis par consultants" />
          <StatCard title="Factures" value={stats.invoices} text="Générées depuis CRA" />
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")}>Vue générale</TabButton>
          <TabButton active={activeTab === "profiles"} onClick={() => setActiveTab("profiles")}>Gestion des profils</TabButton>
          <TabButton active={activeTab === "documents"} onClick={() => setActiveTab("documents")}>Documents</TabButton>
          <TabButton active={activeTab === "cra"} onClick={() => setActiveTab("cra")}>CRA</TabButton>
          <TabButton active={activeTab === "invoices"} onClick={() => setActiveTab("invoices")}>Factures</TabButton>
        </div>

        {activeTab === "overview" && (
          <section className="mt-6 grid gap-6 md:grid-cols-2">
            <Panel title="Actions rapides">
              <ActionButton label="Gérer les profils" onClick={() => setActiveTab("profiles")} />
              <ActionButton label="Déposer / gérer les documents" onClick={() => setActiveTab("documents")} />
              <ActionButton label="Gérer les CRA" onClick={() => setActiveTab("cra")} />
              <ActionButton label="Générer une facture" onClick={() => setActiveTab("invoices")} />
              <ActionButton label="Rafraîchir les données" onClick={() => { loadProfiles(); loadDocuments(); loadCras(); loadInvoices(); }} />
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
          <DocumentsManager
            currentProfile={profile}
            isAdmin
            profiles={profiles}
            documents={documents}
            loading={loadingDocuments}
            onRefresh={loadDocuments}
          />
        )}

        {activeTab === "cra" && (
          <CraManager
            currentProfile={profile}
            profiles={profiles}
            cras={cras}
            loading={loadingCras}
            onRefresh={loadCras}
            mode="admin"
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

function DocumentsManager({ currentProfile, isAdmin = false, readOnly = false, profiles = [], documents, loading, onRefresh }) {
  const [form, setForm] = useState({
    ownerId: currentProfile?.id || "",
    title: "",
    documentType: "contrat",
    file: null,
  });
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [docMessage, setDocMessage] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!form.ownerId && currentProfile?.id) {
      setForm((prev) => ({ ...prev, ownerId: currentProfile.id }));
    }
  }, [currentProfile]);

  async function uploadDocument(e) {
    e.preventDefault();
    setUploading(true);
    setDocMessage("");

    try {
      const ownerId = isAdmin ? form.ownerId : currentProfile.id;
      if (!ownerId) throw new Error("Aucun propriétaire sélectionné.");
      if (!form.file) throw new Error("Sélectionne un fichier.");
      if (!form.title.trim()) throw new Error("Ajoute un titre.");

      const safeFileName = form.file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const filePath = `${ownerId}/${Date.now()}-${safeFileName}`;

      const { error: uploadError } = await supabase.storage
        .from(DOCUMENT_BUCKET)
        .upload(filePath, form.file, { upsert: false });

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase
        .from("documents")
        .insert({
          owner_id: ownerId,
          title: form.title.trim(),
          document_type: form.documentType,
          file_path: filePath,
        });

      if (insertError) throw insertError;

      setDocMessage("Document déposé avec succès.");
      setForm({ ownerId, title: "", documentType: "contrat", file: null });
      const fileInput = document.getElementById("document-file-input");
      if (fileInput) fileInput.value = "";
      await onRefresh();
    } catch (error) {
      setDocMessage(error.message || "Erreur pendant le dépôt du document.");
    } finally {
      setUploading(false);
    }
  }

  async function deleteDocument(doc) {
    const confirmed = window.confirm(`Supprimer le document \"${doc.title}\" ?`);
    if (!confirmed) return;

    setDeletingId(doc.id);
    setDocMessage("");

    try {
      const { error: storageError } = await supabase.storage
        .from(DOCUMENT_BUCKET)
        .remove([doc.file_path]);

      if (storageError) throw storageError;

      const { error: deleteError } = await supabase
        .from("documents")
        .delete()
        .eq("id", doc.id);

      if (deleteError) throw deleteError;

      setDocMessage("Document supprimé avec succès.");
      await onRefresh();
    } catch (error) {
      setDocMessage(error.message || "Impossible de supprimer le document.");
    } finally {
      setDeletingId(null);
    }
  }

  const visibleDocuments = documents.filter((doc) => {
    if (filter === "all") return true;
    return doc.document_type === filter;
  });

  return (
    <section className={readOnly ? "mt-6" : "mt-6 grid gap-6 lg:grid-cols-[420px_1fr]"}>
      {!readOnly && (
      <div className="rounded-[2rem] bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black text-slate-950">Déposer un document</h2>
        <p className="mt-2 text-sm text-slate-600">
          Ajoute un contrat, une fiche de paie, un CRA ou un justificatif.
        </p>

        <form className="mt-6 space-y-4" onSubmit={uploadDocument}>
          {isAdmin && (
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Propriétaire</span>
              <select
                value={form.ownerId}
                onChange={(e) => setForm({ ...form, ownerId: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-700"
              >
                <option value="">Sélectionner un utilisateur</option>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {(profile.full_name || profile.email)} — {roleLabels[profile.role] || profile.role}
                  </option>
                ))}
              </select>
            </label>
          )}

          <Input label="Titre du document" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Type de document</span>
            <select
              value={form.documentType}
              onChange={(e) => setForm({ ...form, documentType: e.target.value })}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-700"
            >
              <option value="contrat">Contrat</option>
              <option value="fiche_paie">Fiche de paie</option>
              <option value="justificatif">Justificatif</option>
              <option value="cra">CRA</option>
              <option value="autre">Autre</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Fichier</span>
            <input
              id="document-file-input"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx"
              onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-700"
            />
          </label>

          {docMessage && <Alert>{docMessage}</Alert>}

          <button
            disabled={uploading}
            className="min-h-12 w-full rounded-full bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
          >
            {uploading ? "Dépôt en cours..." : "Déposer le document"}
          </button>
        </form>
      </div>
      )}

      <div className="rounded-[2rem] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-950">Documents</h2>
            <p className="mt-2 text-sm text-slate-600">
              {readOnly ? "Consulte et ouvre tes documents." : "Consulte, ouvre et supprime les documents déposés."}
            </p>
          </div>

          <button
            onClick={onRefresh}
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Rafraîchir
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <TabButton active={filter === "all"} onClick={() => setFilter("all")}>Tous</TabButton>
          <TabButton active={filter === "contrat"} onClick={() => setFilter("contrat")}>Contrats</TabButton>
          <TabButton active={filter === "fiche_paie"} onClick={() => setFilter("fiche_paie")}>Fiches de paie</TabButton>
          <TabButton active={filter === "justificatif"} onClick={() => setFilter("justificatif")}>Justificatifs</TabButton>
          <TabButton active={filter === "cra"} onClick={() => setFilter("cra")}>CRA</TabButton>
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100">
          <div className="hidden grid-cols-5 bg-slate-50 px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500 md:grid">
            <span>Titre</span>
            <span>Type</span>
            <span>Propriétaire</span>
            <span>Date</span>
            <span>Action</span>
          </div>

          {loading ? (
            <div className="p-6 text-slate-600">Chargement des documents...</div>
          ) : visibleDocuments.length === 0 ? (
            <div className="p-6 text-slate-600">Aucun document trouvé.</div>
          ) : (
            visibleDocuments.map((doc) => (
              <DocumentRow
                key={doc.id}
                doc={doc}
                canDelete={isAdmin}
                deleting={deletingId === doc.id}
                onDelete={deleteDocument}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function DocumentRow({ doc, canDelete = false, deleting = false, onDelete }) {
  const [opening, setOpening] = useState(false);
  const ownerName = doc.profiles?.full_name || doc.profiles?.email || "Utilisateur";

  async function openDocument() {
    setOpening(true);

    const { data, error } = await supabase.storage
      .from(DOCUMENT_BUCKET)
      .createSignedUrl(doc.file_path, 60);

    setOpening(false);

    if (error) {
      alert("Impossible d’ouvrir le document. Vérifie les droits Storage.");
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="grid gap-3 border-t border-slate-100 px-5 py-4 md:grid-cols-5 md:items-center">
      <div>
        <p className="font-bold text-slate-950">{doc.title}</p>
        <p className="text-xs text-slate-500 md:hidden">{docTypeLabels[doc.document_type] || doc.document_type}</p>
      </div>
      <p className="text-sm text-slate-700">{docTypeLabels[doc.document_type] || doc.document_type}</p>
      <p className="text-sm text-slate-700">{ownerName}</p>
      <p className="text-xs text-slate-500">{formatDate(doc.created_at)}</p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={openDocument}
          disabled={opening || deleting}
          className="w-fit rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-60"
        >
          {opening ? "Ouverture..." : "Ouvrir"}
        </button>

        {canDelete && (
          <button
            onClick={() => onDelete?.(doc)}
            disabled={deleting || opening}
            className="w-fit rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
          >
            {deleting ? "Suppression..." : "Supprimer"}
          </button>
        )}
      </div>
    </div>
  );
}

function UserDashboard({ session, profile, message, signOut }) {
  const role = profile?.role || "consultant";
  const [activeTab, setActiveTab] = useState("overview");
  const [documents, setDocuments] = useState([]);
  const [cras, setCras] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [loadingCras, setLoadingCras] = useState(false);
  const [userMessage, setUserMessage] = useState("");

  useEffect(() => {
    loadDocuments();
    loadCras();
  }, [profile]);

  async function loadDocuments() {
    if (!profile?.id) return;
    setLoadingDocuments(true);
    setUserMessage("");

    const { data, error } = await supabase
      .from("documents")
      .select("id,owner_id,title,file_path,document_type,created_at")
      .eq("owner_id", profile.id)
      .order("created_at", { ascending: false });

    if (error) {
      setUserMessage("Impossible de charger les documents. Vérifie le script supabase-documents.sql.");
      setLoadingDocuments(false);
      return;
    }

    setDocuments(data || []);
    setLoadingDocuments(false);
  }


  async function loadCras() {
    if (!profile?.id) return;
    setLoadingCras(true);
    setUserMessage("");

    let query = supabase
      .from("cra")
      .select("id,consultant_id,client_id,month,worked_days,consultant_comment,client_comment,client_comment_visibility,status,created_at,updated_at,submitted_at,validated_at,consultant:consultant_id(email,full_name,role),client:client_id(email,full_name,role)")
      .order("created_at", { ascending: false });

    if (role === "client") {
      query = query.eq("client_id", profile.id);
    } else {
      query = query.eq("consultant_id", profile.id);
    }

    const { data, error } = await query;

    if (error) {
      setUserMessage("Impossible de charger les CRA. Vérifie le script supabase-cra.sql.");
      setLoadingCras(false);
      return;
    }

    setCras(data || []);
    setLoadingCras(false);
  }

  const cards = role === "client"
    ? [
        ["Consultants", "0", "Voir les profils affectés"],
        ["CRA en attente", cras.filter((cra) => cra.status === "submitted").length, "Valider l’activité mensuelle"],
        ["Documents", documents.length, "Contrats et factures"],
        ["Demandes", "0", "Demander un renfort opérationnel"],
      ]
    : [
        ["Mission active", "À définir", "Consulter les informations de mission"],
        ["CRA du mois", cras.find((cra) => cra.status === "submitted") ? "Soumis" : "À remplir", "Déclarer les jours travaillés"],
        ["Documents", documents.length, "Contrats, fiches de paie et justificatifs"],
        ["Frais", "À saisir", "IK, paniers repas et téléphone"],
      ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header signOut={signOut} />

      <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        {message && <Alert>{message}</Alert>}
        {userMessage && <Alert>{userMessage}</Alert>}

        <Hero role={roleLabels[role] || "Utilisateur"} title={`Bonjour, ${profile?.full_name || session.user.email}`} />

        <section className="mt-8 grid gap-5 md:grid-cols-4">
          {cards.map(([title, value, text]) => (
            <StatCard key={title} title={title} value={value} text={text} />
          ))}
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")}>Vue générale</TabButton>
          <TabButton active={activeTab === "documents"} onClick={() => setActiveTab("documents")}>Mes documents</TabButton>
          <TabButton active={activeTab === "cra"} onClick={() => setActiveTab("cra")}>CRA</TabButton>
          <TabButton active={activeTab === "invoices"} onClick={() => setActiveTab("invoices")}>Factures</TabButton>
          <TabButton active={activeTab === "frais"} onClick={() => setActiveTab("frais")}>Frais</TabButton>
        </div>

        {activeTab === "overview" && (
          <section className="mt-8 grid gap-6 md:grid-cols-2">
            <Panel title="Actions rapides">
              <ActionButton label="Voir mes documents" onClick={() => setActiveTab("documents")} />
              <ActionButton label="Remplir un CRA" onClick={() => setActiveTab("cra")} />
              <ActionButton label="Déclarer des frais" onClick={() => setActiveTab("frais")} />
              <ActionButton label="Contacter LRN PORTAGE" />
            </Panel>

            <Panel title="Informations du compte">
              <InfoLine label="Email" value={session.user.email} />
              <InfoLine label="Rôle" value={roleLabels[role] || role} />
              <InfoLine label="ID utilisateur" value={session.user.id} />
            </Panel>
          </section>
        )}

        {activeTab === "documents" && (
          <DocumentsManager
            currentProfile={profile}
            readOnly
            documents={documents}
            loading={loadingDocuments}
            onRefresh={loadDocuments}
          />
        )}

        {activeTab === "cra" && (
          <CraManager
            currentProfile={profile}
            cras={cras}
            loading={loadingCras}
            onRefresh={loadCras}
            mode={role === "client" ? "client" : "consultant"}
          />
        )}

        {activeTab === "frais" && (
          <ComingSoon title="Module frais" text="Prochaine étape : déclaration IK, paniers repas, téléphone et justificatifs." />
        )}
      </main>
    </div>
  );
}


function CraManager({ currentProfile, profiles = [], cras, loading, onRefresh, mode }) {
  const isAdmin = mode === "admin";
  const isClient = mode === "client";
  const isConsultant = mode === "consultant";

  const consultants = profiles.filter((profile) => profile.role === "consultant");
  const clients = profiles.filter((profile) => profile.role === "client");

  const [form, setForm] = useState({
    consultantId: currentProfile?.id || "",
    clientId: "",
    month: new Date().toISOString().slice(0, 7),
    workedDays: 20,
    consultantComment: "",
  });
  const [actionForm, setActionForm] = useState({ comment: "", visibility: "both" });
  const [saving, setSaving] = useState(false);
  const [craMessage, setCraMessage] = useState("");
  const [filter, setFilter] = useState("all");
  const [activeActionId, setActiveActionId] = useState(null);

  useEffect(() => {
    if (isConsultant && currentProfile?.id) {
      setForm((prev) => ({ ...prev, consultantId: currentProfile.id }));
    }
  }, [currentProfile, isConsultant]);

  async function submitCra(e) {
    e.preventDefault();
    setSaving(true);
    setCraMessage("");

    try {
      const consultantId = isAdmin ? form.consultantId : currentProfile.id;

      if (!consultantId) throw new Error("Aucun consultant sélectionné.");
      if (!form.month) throw new Error("Sélectionne le mois du CRA.");
      if (form.workedDays === "" || Number.isNaN(Number(form.workedDays))) throw new Error("Indique le nombre de jours travaillés.");

      const payload = {
        consultant_id: consultantId,
        client_id: form.clientId || null,
        month: `${form.month}-01`,
        worked_days: Number(form.workedDays),
        consultant_comment: form.consultantComment?.trim() || null,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("cra").insert(payload);
      if (error) throw error;

      setCraMessage("CRA soumis avec succès.");
      setForm((prev) => ({ ...prev, workedDays: 20, consultantComment: "" }));
      await onRefresh();
    } catch (error) {
      setCraMessage(error.message || "Impossible de soumettre le CRA.");
    } finally {
      setSaving(false);
    }
  }

  async function decideCra(cra, status) {
    setSaving(true);
    setCraMessage("");

    try {
      const payload = {
        status,
        validated_by: currentProfile.id,
        validated_at: new Date().toISOString(),
        client_comment: actionForm.comment?.trim() || null,
        client_comment_visibility: actionForm.visibility || "both",
      };

      const { error } = await supabase.from("cra").update(payload).eq("id", cra.id);
      if (error) throw error;

      setCraMessage(status === "approved" ? "CRA validé." : "CRA refusé.");
      setActionForm({ comment: "", visibility: "both" });
      setActiveActionId(null);
      await onRefresh();
    } catch (error) {
      setCraMessage(error.message || "Action impossible sur le CRA.");
    } finally {
      setSaving(false);
    }
  }

  const visibleCras = cras.filter((cra) => filter === "all" ? true : cra.status === filter);

  return (
    <section className={isConsultant ? "mt-6 grid gap-6 lg:grid-cols-[420px_1fr]" : "mt-6"}>
      {isConsultant && (
        <div className="rounded-[2rem] bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-slate-950">Soumettre un CRA</h2>
          <p className="mt-2 text-sm text-slate-600">Déclare les jours travaillés du mois.</p>

          <form className="mt-6 space-y-4" onSubmit={submitCra}>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Mois</span>
              <input type="month" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-700" />
            </label>

            <Input label="Jours travaillés" type="number" value={form.workedDays} onChange={(v) => setForm({ ...form, workedDays: v })} />

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Commentaire consultant facultatif</span>
              <textarea value={form.consultantComment} onChange={(e) => setForm({ ...form, consultantComment: e.target.value })} className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-700" placeholder="Ex : activité du mois, absence, précision..." />
            </label>

            {craMessage && <Alert>{craMessage}</Alert>}

            <button disabled={saving} className="min-h-12 w-full rounded-full bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
              {saving ? "Envoi..." : "Soumettre le CRA"}
            </button>
          </form>
        </div>
      )}

      {isAdmin && (
        <div className="mb-6 rounded-[2rem] bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-slate-950">Créer un CRA pour un consultant</h2>
          <p className="mt-2 text-sm text-slate-600">Option admin : crée un CRA directement pour un consultant si besoin.</p>

          <form className="mt-6 grid gap-4 md:grid-cols-5" onSubmit={submitCra}>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Consultant</span>
              <select value={form.consultantId} onChange={(e) => setForm({ ...form, consultantId: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-700">
                <option value="">Sélectionner</option>
                {consultants.map((consultant) => <option key={consultant.id} value={consultant.id}>{consultant.full_name || consultant.email}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Client facultatif</span>
              <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-700">
                <option value="">Aucun</option>
                {clients.map((client) => <option key={client.id} value={client.id}>{client.full_name || client.email}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Mois</span>
              <input type="month" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-700" />
            </label>

            <Input label="Jours" type="number" value={form.workedDays} onChange={(v) => setForm({ ...form, workedDays: v })} />

            <div className="flex items-end">
              <button disabled={saving} className="min-h-12 w-full rounded-full bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60">Créer</button>
            </div>
          </form>

          {craMessage && <div className="mt-4"><Alert>{craMessage}</Alert></div>}
        </div>
      )}

      <div className="rounded-[2rem] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-950">{isConsultant ? "Mes CRA" : "CRA"}</h2>
            <p className="mt-2 text-sm text-slate-600">
              {isClient ? "Valide ou refuse les CRA soumis. Le commentaire est facultatif." : isAdmin ? "Suivi global des CRA et validations." : "Consulte le statut de tes déclarations d’activité."}
            </p>
          </div>

          <button onClick={onRefresh} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">Rafraîchir</button>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <TabButton active={filter === "all"} onClick={() => setFilter("all")}>Tous</TabButton>
          <TabButton active={filter === "submitted"} onClick={() => setFilter("submitted")}>Soumis</TabButton>
          <TabButton active={filter === "approved"} onClick={() => setFilter("approved")}>Validés</TabButton>
          <TabButton active={filter === "rejected"} onClick={() => setFilter("rejected")}>Refusés</TabButton>
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100">
          <div className="hidden grid-cols-7 bg-slate-50 px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500 md:grid">
            <span>Mois</span><span>Consultant</span><span>Client</span><span>Jours</span><span>Statut</span><span>Commentaire</span><span>Action</span>
          </div>

          {loading ? (
            <div className="p-6 text-slate-600">Chargement des CRA...</div>
          ) : visibleCras.length === 0 ? (
            <div className="p-6 text-slate-600">Aucun CRA trouvé.</div>
          ) : (
            visibleCras.map((cra) => (
              <CraRow key={cra.id} cra={cra} mode={mode} activeActionId={activeActionId} setActiveActionId={setActiveActionId} actionForm={actionForm} setActionForm={setActionForm} onDecision={decideCra} saving={saving} />
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function CraRow({ cra, mode, activeActionId, setActiveActionId, actionForm, setActionForm, onDecision, saving }) {
  const isClient = mode === "client";
  const isAdmin = mode === "admin";
  const canDecide = (isClient || isAdmin) && cra.status === "submitted";
  const consultantName = cra.consultant?.full_name || cra.consultant?.email || "Consultant";
  const clientName = cra.client?.full_name || cra.client?.email || "Aucun client";
  const canSeeClientComment = isAdmin || cra.client_comment_visibility === "both";
  const showActionForm = activeActionId === cra.id;

  return (
    <div className="border-t border-slate-100 px-5 py-4">
      <div className="grid gap-3 md:grid-cols-7 md:items-start">
        <p className="font-bold text-slate-950">{formatMonth(cra.month)}</p>
        <p className="text-sm text-slate-700">{consultantName}</p>
        <p className="text-sm text-slate-700">{clientName}</p>
        <p className="text-sm font-semibold text-slate-900">{cra.worked_days}</p>
        <p><span className={`rounded-full px-3 py-2 text-xs font-bold ${cra.status === "approved" ? "bg-green-50 text-green-700" : cra.status === "rejected" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"}`}>{craStatusLabels[cra.status] || cra.status}</span></p>
        <div className="space-y-2 text-sm text-slate-700">
          {cra.consultant_comment && <p><span className="font-bold">Consultant :</span> {cra.consultant_comment}</p>}
          {cra.client_comment && canSeeClientComment && <p><span className="font-bold">Client :</span> {cra.client_comment}</p>}
          {cra.client_comment && isAdmin && <p className="text-xs text-slate-500">Visibilité : {commentVisibilityLabels[cra.client_comment_visibility] || cra.client_comment_visibility}</p>}
          {!cra.consultant_comment && !cra.client_comment && <p className="text-slate-400">Aucun</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {canDecide ? (
            <button onClick={() => setActiveActionId(showActionForm ? null : cra.id)} className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100">Traiter</button>
          ) : <span className="text-sm text-slate-400">—</span>}
        </div>
      </div>

      {showActionForm && (
        <div className="mt-4 rounded-3xl bg-slate-50 p-4">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Commentaire facultatif</span>
            <textarea value={actionForm.comment} onChange={(e) => setActionForm({ ...actionForm, comment: e.target.value })} className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-700" placeholder="Ex : validé, précision, motif de refus..." />
          </label>

          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Qui peut voir le commentaire ?</span>
            <select value={actionForm.visibility} onChange={(e) => setActionForm({ ...actionForm, visibility: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-700">
              <option value="both">Admin + consultant</option>
              <option value="admin_only">Admin uniquement</option>
            </select>
          </label>

          <div className="mt-4 flex flex-wrap gap-3">
            <button disabled={saving} onClick={() => onDecision(cra, "approved")} className="rounded-full bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60">Valider</button>
            <button disabled={saving} onClick={() => onDecision(cra, "rejected")} className="rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">Refuser</button>
            <button disabled={saving} onClick={() => setActiveActionId(null)} className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-100 disabled:opacity-60">Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
}



function InvoicesManager({ currentProfile, cras, invoices, loading, onRefresh }) {
  const approvedCras = cras.filter((cra) => cra.status === "approved");
  const [selectedCraId, setSelectedCraId] = useState(approvedCras[0]?.id || "");
  const [saving, setSaving] = useState(false);
  const [invoiceMessage, setInvoiceMessage] = useState("");
  const [form, setForm] = useState({
    invoiceNumber: buildInvoiceNumber(),
    invoiceDate: new Date().toISOString().slice(0, 10),
    clientName: "",
    clientAddress: "",
    clientEmail: "",
    clientRef: "",
    supplierOrder: "",
    paymentTerms: "Dans un délai de 30 jours",
    description: "Prestation de conseil",
    dailyRate: 250,
    extraHoursQty: 0,
    extraHoursRate: 44.64,
    saturdayQty: 0,
    saturdayRate: 223.21,
    vatRate: 20,
  });

  const selectedCra = approvedCras.find((cra) => cra.id === selectedCraId);

  useEffect(() => {
    if (!selectedCra) return;

    setForm((prev) => ({
      ...prev,
      clientName: selectedCra.client?.full_name || selectedCra.client?.email || prev.clientName || "",
      clientEmail: selectedCra.client?.email || prev.clientEmail || "",
      description: prev.description || "Prestation de conseil",
    }));
  }, [selectedCraId]);

  const invoiceData = buildInvoiceData(selectedCra, form);

  async function saveInvoice() {
    if (!selectedCra) {
      setInvoiceMessage("Aucun CRA validé sélectionné.");
      return;
    }

    setSaving(true);
    setInvoiceMessage("");

    try {
      const { error } = await supabase.from("invoices").upsert({
        cra_id: selectedCra.id,
        invoice_number: form.invoiceNumber,
        data: invoiceData,
        subtotal: invoiceData.subtotal,
        vat_amount: invoiceData.vatAmount,
        total: invoiceData.total,
        created_by: currentProfile.id,
      }, { onConflict: "cra_id" });

      if (error) throw error;

      setInvoiceMessage("Facture générée et enregistrée.");
      await onRefresh();
    } catch (error) {
      setInvoiceMessage(error.message || "Impossible d’enregistrer la facture.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-6 grid gap-6 lg:grid-cols-[430px_1fr]">
      <div className="rounded-[2rem] bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black text-slate-950">Générer une facture</h2>
        <p className="mt-2 text-sm text-slate-600">
          La facture se génère uniquement à partir d’un CRA validé.
        </p>

        {approvedCras.length === 0 ? (
          <Alert>Aucun CRA validé disponible. Il faut d’abord qu’un CRA soit validé par le client ou l’admin.</Alert>
        ) : (
          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">CRA validé</span>
              <select
                value={selectedCraId}
                onChange={(e) => setSelectedCraId(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-700"
              >
                {approvedCras.map((cra) => (
                  <option key={cra.id} value={cra.id}>
                    {formatMonth(cra.month)} — {cra.consultant?.full_name || cra.consultant?.email} — {cra.worked_days} j
                  </option>
                ))}
              </select>
            </label>

            <Input label="N° facture" value={form.invoiceNumber} onChange={(v) => setForm({ ...form, invoiceNumber: v })} />
            <Input label="Date facture" type="date" value={form.invoiceDate} onChange={(v) => setForm({ ...form, invoiceDate: v })} />
            <Input label="Client à facturer" value={form.clientName} onChange={(v) => setForm({ ...form, clientName: v })} />

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Adresse client</span>
              <textarea
                value={form.clientAddress}
                onChange={(e) => setForm({ ...form, clientAddress: e.target.value })}
                className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-700"
                placeholder="Adresse complète du client"
              />
            </label>

            <Input label="Email client" value={form.clientEmail} onChange={(v) => setForm({ ...form, clientEmail: v })} />
            <Input label="Réf client" value={form.clientRef} onChange={(v) => setForm({ ...form, clientRef: v })} />
            <Input label="Commande fournisseur" value={form.supplierOrder} onChange={(v) => setForm({ ...form, supplierOrder: v })} />
            <Input label="Conditions" value={form.paymentTerms} onChange={(v) => setForm({ ...form, paymentTerms: v })} />
            <Input label="Description principale" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
            <Input label="Prix journalier HT" type="number" value={form.dailyRate} onChange={(v) => setForm({ ...form, dailyRate: v })} />
            <Input label="Heures supplémentaires - quantité" type="number" value={form.extraHoursQty} onChange={(v) => setForm({ ...form, extraHoursQty: v })} />
            <Input label="Heures supplémentaires - prix HT" type="number" value={form.extraHoursRate} onChange={(v) => setForm({ ...form, extraHoursRate: v })} />
            <Input label="Samedi travaillé - quantité" type="number" value={form.saturdayQty} onChange={(v) => setForm({ ...form, saturdayQty: v })} />
            <Input label="Samedi travaillé - prix HT" type="number" value={form.saturdayRate} onChange={(v) => setForm({ ...form, saturdayRate: v })} />
            <Input label="TVA %" type="number" value={form.vatRate} onChange={(v) => setForm({ ...form, vatRate: v })} />

            {invoiceMessage && <Alert>{invoiceMessage}</Alert>}

            <button
              disabled={saving}
              onClick={saveInvoice}
              className="min-h-12 w-full rounded-full bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
            >
              {saving ? "Enregistrement..." : "Enregistrer la facture"}
            </button>

            <button
              onClick={() => printInvoice(invoiceData)}
              className="min-h-12 w-full rounded-full bg-slate-950 px-6 py-3 font-semibold text-white hover:bg-slate-800"
            >
              Imprimer / Exporter PDF
            </button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <InvoicePreview invoice={invoiceData} />

        <div className="rounded-[2rem] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-950">Factures enregistrées</h2>
              <p className="mt-2 text-sm text-slate-600">Historique des factures générées.</p>
            </div>
            <button onClick={onRefresh} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
              Rafraîchir
            </button>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100">
            <div className="hidden grid-cols-5 bg-slate-50 px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500 md:grid">
              <span>N°</span><span>Client</span><span>Total</span><span>Date</span><span>Action</span>
            </div>

            {loading ? (
              <div className="p-6 text-slate-600">Chargement des factures...</div>
            ) : invoices.length === 0 ? (
              <div className="p-6 text-slate-600">Aucune facture enregistrée.</div>
            ) : (
              invoices.map((invoice) => (
                <div key={invoice.id} className="grid gap-3 border-t border-slate-100 px-5 py-4 md:grid-cols-5 md:items-center">
                  <p className="font-bold">{invoice.invoice_number}</p>
                  <p className="text-sm text-slate-700">{invoice.data?.client?.name || "-"}</p>
                  <p className="text-sm font-semibold">{formatCurrency(invoice.total)}</p>
                  <p className="text-xs text-slate-500">{formatDate(invoice.created_at)}</p>
                  <button onClick={() => printInvoice(invoice.data)} className="w-fit rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100">
                    PDF
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function InvoicePreview({ invoice }) {
  if (!invoice?.cra) {
    return (
      <div className="rounded-[2rem] bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black text-slate-950">Aperçu facture</h2>
        <p className="mt-2 text-sm text-slate-600">Sélectionne un CRA validé pour générer l’aperçu.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] bg-white p-6 shadow-sm">
      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white p-6">
        <InvoiceHtml invoice={invoice} />
      </div>
    </div>
  );
}

function InvoiceHtml({ invoice }) {
  return (
    <div className="bg-white text-sm text-slate-950">
      <div className="flex flex-col justify-between gap-6 md:flex-row">
        <div>
          <h1 className="text-3xl font-black text-blue-800">{COMPANY_INVOICE_INFO.name}</h1>
          <p className="mt-2 font-semibold">{COMPANY_INVOICE_INFO.legalName}</p>
          <p>{COMPANY_INVOICE_INFO.address}</p>
          <p>Téléphone : {COMPANY_INVOICE_INFO.phone}</p>
          <p>{COMPANY_INVOICE_INFO.email}</p>
        </div>
        <div className="text-left md:text-right">
          <h2 className="text-4xl font-black text-blue-700">FACTURE</h2>
          <p className="mt-3"><b>N° facture :</b> {invoice.invoiceNumber}</p>
          <p><b>Date :</b> {formatDateOnly(invoice.invoiceDate)}</p>
          <p><b>N° TVA :</b> {COMPANY_INVOICE_INFO.vatNumber}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="bg-blue-700 px-3 py-2 font-bold text-white">FACTURER À</h3>
          <div className="border border-slate-200 p-3">
            <p className="font-bold">{invoice.client.name || "-"}</p>
            <p className="whitespace-pre-line">{invoice.client.address || "-"}</p>
            <p>{invoice.client.email || ""}</p>
          </div>
        </div>
        <div>
          <h3 className="bg-blue-700 px-3 py-2 font-bold text-white">CONDITIONS</h3>
          <div className="border border-slate-200 p-3">
            <p><b>Réf client :</b> {invoice.clientRef || "-"}</p>
            <p><b>Commande fournisseur :</b> {invoice.supplierOrder || "-"}</p>
            <p><b>Paiement :</b> {invoice.paymentTerms || "-"}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-blue-700 text-white">
              <th className="p-2">DESCRIPTION</th>
              <th className="p-2 text-right">QTÉ</th>
              <th className="p-2 text-right">PRIX HT</th>
              <th className="p-2 text-right">MONTANT HT</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((line, index) => (
              <tr key={index} className="border-b border-slate-200">
                <td className="p-2">{line.description}</td>
                <td className="p-2 text-right">{line.quantity}</td>
                <td className="p-2 text-right">{formatCurrency(line.unitPrice)}</td>
                <td className="p-2 text-right">{formatCurrency(line.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-end">
        <div className="w-full max-w-sm rounded-2xl bg-blue-50 p-4">
          <div className="flex justify-between"><span>Sous-total HT</span><b>{formatCurrency(invoice.subtotal)}</b></div>
          <div className="flex justify-between"><span>TVA {invoice.vatRate}%</span><b>{formatCurrency(invoice.vatAmount)}</b></div>
          <div className="mt-3 flex justify-between border-t border-blue-100 pt-3 text-xl"><span>TOTAL</span><b>{formatCurrency(invoice.total)}</b></div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border-2 border-slate-900 p-4">
        <h3 className="mb-3 bg-blue-700 px-3 py-2 text-center font-bold text-white">Détails bancaires</h3>
        <p><b>Titulaire :</b> {COMPANY_INVOICE_INFO.legalName}</p>
        <p><b>IBAN :</b> {COMPANY_INVOICE_INFO.iban}</p>
        <p><b>BIC :</b> {COMPANY_INVOICE_INFO.bic}</p>
        <p className="mt-2 text-right"><b>SIRET :</b> {COMPANY_INVOICE_INFO.siret}</p>
      </div>

      <p className="mt-6 text-center text-lg font-bold text-blue-700">Merci pour votre confiance !</p>
    </div>
  );
}

function buildInvoiceData(cra, form) {
  if (!cra) return null;

  const workedDays = Number(cra.worked_days || 0);
  const dailyRate = Number(form.dailyRate || 0);
  const extraHoursQty = Number(form.extraHoursQty || 0);
  const extraHoursRate = Number(form.extraHoursRate || 0);
  const saturdayQty = Number(form.saturdayQty || 0);
  const saturdayRate = Number(form.saturdayRate || 0);
  const vatRate = Number(form.vatRate || 0);

  const lines = [
    {
      description: `${form.description || "Prestation de conseil"} - ${formatMonth(cra.month)}`,
      quantity: workedDays,
      unitPrice: dailyRate,
      amount: workedDays * dailyRate,
    },
  ];

  if (extraHoursQty > 0) {
    lines.push({ description: "Heures supplémentaires", quantity: extraHoursQty, unitPrice: extraHoursRate, amount: extraHoursQty * extraHoursRate });
  }

  if (saturdayQty > 0) {
    lines.push({ description: "Samedi travaillé", quantity: saturdayQty, unitPrice: saturdayRate, amount: saturdayQty * saturdayRate });
  }

  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
  const vatAmount = subtotal * vatRate / 100;
  const total = subtotal + vatAmount;

  return {
    invoiceNumber: form.invoiceNumber,
    invoiceDate: form.invoiceDate,
    cra: {
      id: cra.id,
      month: cra.month,
      workedDays: workedDays,
      consultant: cra.consultant?.full_name || cra.consultant?.email || "",
      status: cra.status,
      validatedAt: cra.validated_at,
    },
    client: {
      name: form.clientName,
      address: form.clientAddress,
      email: form.clientEmail,
    },
    clientRef: form.clientRef,
    supplierOrder: form.supplierOrder,
    paymentTerms: form.paymentTerms,
    vatRate,
    lines,
    subtotal,
    vatAmount,
    total,
  };
}

function printInvoice(invoice) {
  if (!invoice) return;

  const html = buildInvoicePrintHtml(invoice);
  const printWindow = window.open("", "_blank", "width=1100,height=900");

  if (!printWindow) {
    alert("Autorise les popups pour exporter la facture en PDF.");
    return;
  }

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 500);
}

function buildInvoicePrintHtml(invoice) {
  const rows = invoice.lines.map((line) => `
    <tr>
      <td>${escapeHtml(line.description)}</td>
      <td style="text-align:right">${line.quantity}</td>
      <td style="text-align:right">${formatCurrency(line.unitPrice)}</td>
      <td style="text-align:right">${formatCurrency(line.amount)}</td>
    </tr>
  `).join("");

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>Facture ${escapeHtml(invoice.invoiceNumber)}</title>
<style>
  body { font-family: Arial, sans-serif; margin: 32px; color: #0f172a; }
  .top { display:flex; justify-content:space-between; gap:32px; }
  h1 { color:#1d4ed8; margin:0; font-size:34px; }
  h2 { color:#1d4ed8; margin:0; font-size:44px; text-align:right; }
  .blue { background:#1d4ed8; color:white; padding:8px 10px; font-weight:bold; }
  .box { border:1px solid #cbd5e1; padding:12px; min-height:90px; }
  .grid { display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-top:34px; }
  table { width:100%; border-collapse:collapse; margin-top:34px; }
  th { background:#1d4ed8; color:white; padding:9px; text-align:left; }
  td { border-bottom:1px solid #cbd5e1; padding:9px; }
  .totals { margin-left:auto; margin-top:24px; width:330px; background:#dbeafe; padding:16px; }
  .line { display:flex; justify-content:space-between; margin:7px 0; }
  .total { border-top:1px solid #93c5fd; padding-top:10px; font-size:22px; font-weight:bold; }
  .bank { border:3px solid #0f172a; margin-top:34px; padding:14px; width:620px; }
  .thanks { text-align:center; color:#1d4ed8; font-size:20px; font-weight:bold; margin-top:26px; }
  @media print { button { display:none; } body { margin: 18px; } }
</style>
</head>
<body>
  <div class="top">
    <div>
      <h1>${escapeHtml(COMPANY_INVOICE_INFO.name)}</h1>
      <p><b>${escapeHtml(COMPANY_INVOICE_INFO.legalName)}</b><br>
      ${escapeHtml(COMPANY_INVOICE_INFO.address)}<br>
      Téléphone : ${escapeHtml(COMPANY_INVOICE_INFO.phone)}<br>
      ${escapeHtml(COMPANY_INVOICE_INFO.email)}</p>
    </div>
    <div>
      <h2>FACTURE</h2>
      <p style="text-align:right"><b>N° facture :</b> ${escapeHtml(invoice.invoiceNumber)}<br>
      <b>Date :</b> ${formatDateOnly(invoice.invoiceDate)}<br>
      <b>N° TVA :</b> ${escapeHtml(COMPANY_INVOICE_INFO.vatNumber)}</p>
    </div>
  </div>

  <div class="grid">
    <div>
      <div class="blue">FACTURER À</div>
      <div class="box"><b>${escapeHtml(invoice.client.name || "-")}</b><br>${escapeHtml(invoice.client.address || "-").replaceAll("\\n", "<br>")}<br>${escapeHtml(invoice.client.email || "")}</div>
    </div>
    <div>
      <div class="blue">CONDITIONS</div>
      <div class="box"><b>Réf client :</b> ${escapeHtml(invoice.clientRef || "-")}<br>
      <b>Commande fournisseur :</b> ${escapeHtml(invoice.supplierOrder || "-")}<br>
      <b>Paiement :</b> ${escapeHtml(invoice.paymentTerms || "-")}</div>
    </div>
  </div>

  <table>
    <thead><tr><th>DESCRIPTION</th><th style="text-align:right">QTÉ</th><th style="text-align:right">PRIX HT</th><th style="text-align:right">MONTANT HT</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="totals">
    <div class="line"><span>Sous-total HT</span><b>${formatCurrency(invoice.subtotal)}</b></div>
    <div class="line"><span>TVA ${invoice.vatRate}%</span><b>${formatCurrency(invoice.vatAmount)}</b></div>
    <div class="line total"><span>TOTAL</span><b>${formatCurrency(invoice.total)}</b></div>
  </div>

  <div class="bank">
    <div class="blue" style="text-align:center">Détails bancaires</div>
    <p><b>Titulaire :</b> ${escapeHtml(COMPANY_INVOICE_INFO.legalName)}<br>
    <b>IBAN :</b> ${escapeHtml(COMPANY_INVOICE_INFO.iban)}<br>
    <b>BIC :</b> ${escapeHtml(COMPANY_INVOICE_INFO.bic)}</p>
    <p style="text-align:right"><b>SIRET :</b> ${escapeHtml(COMPANY_INVOICE_INFO.siret)}</p>
  </div>

  <p class="thanks">Merci pour votre confiance !</p>
</body>
</html>`;
}

function buildInvoiceNumber() {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(Number(value || 0));
}

function formatDateOnly(dateValue) {
  if (!dateValue) return "-";
  return new Intl.DateTimeFormat("fr-FR").format(new Date(dateValue));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function Header({ signOut }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 md:px-6">
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
      <h1 className="mt-5 text-3xl font-black leading-tight md:text-5xl">{title}</h1>
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
      <span className={`text-2xl font-black tracking-tight md:text-3xl ${light ? "text-white" : "text-slate-950"}`}>LRN</span>
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

function formatMonth(dateValue) {
  if (!dateValue) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(new Date(dateValue));
}

function formatDate(dateValue) {
  if (!dateValue) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(dateValue));
}
