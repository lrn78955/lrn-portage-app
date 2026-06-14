
import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BUCKET = "documents";

const roles = {
  consultant: "Consultant",
  client: "Client",
  admin: "Administrateur",
};

const docTypes = {
  contrat: "Contrat",
  fiche_paie: "Fiche de paie",
  justificatif: "Justificatif",
  cra: "CRA",
  facture: "Facture",
  bon_commande: "Bon de commande",
  autre: "Autre",
};

const statuses = {
  draft: "Brouillon",
  submitted: "Soumis",
  approved: "Validé",
  rejected: "Refusé",
};

const COMPANY = {
  name: "LRN PORTAGE",
  address: "18 RUE DE LA BRUYERE, 78300 POISSY",
  phone: "06.34.38.30.78",
  email: "lrninfo78@gmail.com",
  siret: "104 387 105 00018",
  vat: "FR28104387105",
  iban: "FR42 3000 2023 3600 0024 8787 T61",
  bic: "CRLYFRPP",
};

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authMessage, setAuthMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session || null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user?.id) {
      setProfile(null);
      return;
    }
    loadMyProfile();
  }, [session?.user?.id]);

  async function loadMyProfile() {
    const { data, error } = await supabase
      .from("profiles")
      .select("id,email,full_name,role,created_at")
      .eq("id", session.user.id)
      .maybeSingle();

    if (error) {
      setAuthMessage("Impossible de charger ton profil. Vérifie supabase-schema/documents.");
      return;
    }
    setProfile(data);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }

  if (loading) return <FullPage text="Chargement..." />;

  if (!session) {
    return <AuthScreen mode={authMode} setMode={setAuthMode} message={authMessage} setMessage={setAuthMessage} />;
  }

  if (!profile) return <FullPage text="Chargement du profil..." />;

  return (
    <Dashboard session={session} profile={profile} signOut={signOut} />
  );
}

function AuthScreen({ mode, setMode, message, setMessage }) {
  const [form, setForm] = useState({ email: "", password: "", fullName: "", role: "consultant" });
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            data: {
              full_name: form.fullName.trim(),
              role: form.role,
            },
          },
        });
        if (error) throw error;
        setMessage("Compte créé. Si la confirmation email est activée, vérifie ta boîte mail.");
        setMode("login");
      }
    } catch (error) {
      setMessage(error.message || "Erreur d’authentification.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-6 py-10 lg:grid-cols-2">
        <div>
          <Logo light />
          <div className="mt-10 inline-flex rounded-full border border-blue-700/50 bg-blue-950/50 px-4 py-2 text-sm">
            Espace connecté · consultants · clients · admin
          </div>
          <h1 className="mt-8 text-5xl font-black leading-tight md:text-6xl">Votre espace privé LRN PORTAGE.</h1>
          <p className="mt-6 max-w-xl text-lg text-slate-300">
            Suivi des documents, CRA, validations, frais et factures.
          </p>
        </div>

        <form onSubmit={submit} className="rounded-[2rem] bg-white p-8 text-slate-950 shadow-xl">
          <h2 className="text-3xl font-black">{mode === "login" ? "Connexion" : "Créer un compte"}</h2>
          <p className="mt-2 text-sm text-slate-600">
            {mode === "login" ? "Accédez à votre espace sécurisé." : "Créez un accès consultant ou client."}
          </p>

          <div className="mt-6 space-y-4">
            {mode === "signup" && (
              <>
                <Input label="Nom complet / société" value={form.fullName} onChange={(v) => setForm({ ...form, fullName: v })} />
                <Select label="Type de compte" value={form.role} onChange={(v) => setForm({ ...form, role: v })}>
                  <option value="consultant">Consultant</option>
                  <option value="client">Client</option>
                </Select>
              </>
            )}

            <Input label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            <Input label="Mot de passe" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} />

            {message && <Alert>{message}</Alert>}

            <button disabled={loading} className="w-full rounded-full bg-blue-700 px-6 py-3 font-bold text-white hover:bg-blue-800 disabled:opacity-60">
              {loading ? "Patiente..." : mode === "login" ? "Se connecter" : "Créer le compte"}
            </button>

            <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")} className="w-full text-sm font-semibold text-blue-700">
              {mode === "login" ? "Pas encore de compte ? Créer un accès" : "Déjà un compte ? Se connecter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Dashboard({ session, profile, signOut }) {
  const [tab, setTab] = useState("overview");
  const [profiles, setProfiles] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [cras, setCras] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [message, setMessage] = useState("");
  const isAdmin = profile.role === "admin";
  const isClient = profile.role === "client";
  const isConsultant = profile.role === "consultant";

  async function refreshAll() {
    setMessage("");
    await Promise.all([loadProfiles(), loadDocuments(), loadCras(), loadInvoices(), loadPurchaseOrders(), loadAssignments()]);
  }

  useEffect(() => {
    refreshAll();
  }, [profile.id, profile.role]);

  async function loadProfiles() {
    if (!isAdmin) {
      setProfiles([profile]);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id,email,full_name,role,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage("Impossible de charger les profils.");
      return;
    }
    setProfiles(data || []);
  }

  async function loadAssignments() {
    let query = supabase
      .from("consultant_clients")
      .select("id,consultant_id,client_id,created_at,consultant:consultant_id(id,email,full_name,role,created_at),client:client_id(id,email,full_name,role,created_at)")
      .order("created_at", { ascending: false });

    if (isConsultant) query = query.eq("consultant_id", profile.id);
    if (isClient) query = query.eq("client_id", profile.id);

    const { data, error } = await query;
    if (error) {
      setAssignments([]);
      if (isAdmin || isConsultant) setMessage("Impossible de charger les affiliations consultants/clients. Relance supabase-affiliations.sql.");
      return;
    }

    setAssignments(data || []);
  }

  async function loadDocuments() {
    let query = supabase
      .from("documents")
      .select("id,owner_id,shared_with_id,title,file_path,document_type,created_at,profiles:owner_id(email,full_name,role),shared_with:shared_with_id(email,full_name,role)")
      .order("created_at", { ascending: false });

    if (!isAdmin) query = query.or(`owner_id.eq.${profile.id},shared_with_id.eq.${profile.id}`);

    const { data, error } = await query;
    if (error) {
      setMessage("Impossible de charger les documents. Relance supabase-documents.sql.");
      setDocuments([]);
      return;
    }
    setDocuments(data || []);
  }

  async function loadCras() {
    let query = supabase
      .from("cra")
      .select("id,consultant_id,client_id,month,worked_days,extra_hours,extra_hours_rate,saturday_days,saturday_rate,consultant_comment,client_comment,client_comment_visibility,status,created_at,submitted_at,validated_at,consultant:consultant_id(email,full_name,role),client:client_id(email,full_name,role)")
      .order("created_at", { ascending: false });

    if (isClient) query = query.eq("client_id", profile.id);
    if (isConsultant) query = query.eq("consultant_id", profile.id);

    const { data, error } = await query;
    if (error) {
      setMessage("Impossible de charger les CRA. Relance supabase-cra.sql.");
      setCras([]);
      return;
    }
    setCras(data || []);
  }

  async function loadInvoices() {
    if (!isAdmin) {
      setInvoices([]);
      return;
    }

    const { data, error } = await supabase
      .from("invoices")
      .select("id,cra_id,invoice_number,data,subtotal,vat_amount,total,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage("Impossible de charger les factures. Relance supabase-invoices.sql.");
      setInvoices([]);
      return;
    }
    setInvoices(data || []);
  }

  async function loadPurchaseOrders() {
    if (!isAdmin) {
      setPurchaseOrders([]);
      return;
    }

    const { data, error } = await supabase
      .from("purchase_orders")
      .select("id,client_id,consultant_id,document_id,file_path,order_number,supplier_ref,supplier_code,order_date,end_date,client_name,client_address,client_email,client_ref,payment_terms,daily_rate,extra_hour_rate,vat_rate,created_at,client:client_id(id,email,full_name,role),consultant:consultant_id(id,email,full_name,role)")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage("Impossible de charger les bons de commande. Lance supabase-purchase-orders.sql.");
      setPurchaseOrders([]);
      return;
    }
    setPurchaseOrders(data || []);
  }

  const stats = {
    users: profiles.length,
    consultants: profiles.filter((p) => p.role === "consultant").length,
    clients: profiles.filter((p) => p.role === "client").length,
    admins: profiles.filter((p) => p.role === "admin").length,
    documents: documents.length,
    craPending: cras.filter((c) => c.status === "submitted").length,
    invoices: invoices.length,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <Logo />
          <button onClick={signOut} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white">Déconnexion</button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        {message && <Alert>{message}</Alert>}

        <Hero role={roles[profile.role] || profile.role} title={`Bonjour, ${profile.full_name || session.user.email}`} />

        <div className="mt-8 grid gap-4 md:grid-cols-4 lg:grid-cols-7">
          {isAdmin && <Stat title="Utilisateurs" value={stats.users} text="Tous les comptes" />}
          {isAdmin && <Stat title="Consultants" value={stats.consultants} text="Profils consultants" />}
          {isAdmin && <Stat title="Clients" value={stats.clients} text="Comptes entreprises" />}
          {isAdmin && <Stat title="Admins" value={stats.admins} text="Administrateurs" />}
          <Stat title="Documents" value={stats.documents} text="Documents déposés" />
          <Stat title="CRA à valider" value={stats.craPending} text="CRA soumis" />
          {isAdmin && <Stat title="Factures" value={stats.invoices} text="Depuis CRA" />}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Pill active={tab === "overview"} onClick={() => setTab("overview")}>Vue générale</Pill>
          {isAdmin && <Pill active={tab === "profiles"} onClick={() => setTab("profiles")}>Gestion des profils</Pill>}
          <Pill active={tab === "documents"} onClick={() => setTab("documents")}>{isAdmin ? "Documents" : "Mes documents"}</Pill>
          <Pill active={tab === "cra"} onClick={() => setTab("cra")}>CRA</Pill>
          {isAdmin && <Pill active={tab === "invoices"} onClick={() => setTab("invoices")}>Factures</Pill>}
        </div>

        {tab === "overview" && (
          <section className="mt-6 grid gap-6 md:grid-cols-2">
            <Panel title="Actions rapides">
              {isAdmin && <Action label="Gérer les profils" onClick={() => setTab("profiles")} />}
              <Action label="Gérer les documents" onClick={() => setTab("documents")} />
              <Action label="Gérer les CRA" onClick={() => setTab("cra")} />
              {isAdmin && <Action label="Générer une facture" onClick={() => setTab("invoices")} />}
              <Action label="Rafraîchir les données" onClick={refreshAll} />
            </Panel>

            <Panel title={isAdmin ? "Informations admin" : "Informations du compte"}>
              <Info label="Email" value={session.user.email} />
              <Info label="Rôle" value={roles[profile.role] || profile.role} />
              <Info label="ID utilisateur" value={session.user.id} />
            </Panel>
          </section>
        )}

        {tab === "profiles" && isAdmin && (
          <Profiles profiles={profiles} assignments={assignments} onRefresh={refreshAll} />
        )}

        {tab === "documents" && (
          <Documents
            profile={profile}
            isAdmin={isAdmin}
            profiles={profiles}
            documents={documents}
            onRefresh={loadDocuments}
          />
        )}

        {tab === "cra" && (
          <Cra
            profile={profile}
            isAdmin={isAdmin}
            isClient={isClient}
            profiles={profiles}
            assignments={assignments}
            cras={cras}
            onRefresh={loadCras}
          />
        )}

        {tab === "invoices" && isAdmin && (
          <Invoices profile={profile} profiles={profiles} cras={cras} invoices={invoices} purchaseOrders={purchaseOrders} onRefresh={refreshAll} />
        )}
      </main>
    </div>
  );
}

function Profiles({ profiles, assignments, onRefresh }) {
  const [msg, setMsg] = useState("");
  const [linkForm, setLinkForm] = useState({
    consultantId: "",
    clientId: "",
    orderNumber: "",
    supplierRef: "",
    supplierCode: "",
    orderDate: new Date().toISOString().slice(0, 10),
    endDate: "",
    clientName: "",
    clientAddress: "",
    clientEmail: "",
    clientRef: "",
    paymentTerms: "Règlement à 30 jours fin de mois",
    dailyRate: 250,
    extraHourRate: 230,
    vatRate: 20,
    file: null,
  });
  const [busy, setBusy] = useState(false);
  const consultants = profiles.filter((p) => p.role === "consultant");
  const clients = profiles.filter((p) => p.role === "client");

  async function changeRole(id, role) {
    setMsg("");
    const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
    if (error) {
      setMsg(error.message);
      return;
    }
    await onRefresh();
  }

  function selectedClient() {
    return clients.find((c) => c.id === linkForm.clientId) || null;
  }

  async function linkConsultantClient(e) {
    e.preventDefault();
    setBusy(true);
    setMsg("");

    try {
      if (!linkForm.consultantId || !linkForm.clientId) throw new Error("Sélectionne un consultant et un client.");
      if (!linkForm.orderNumber.trim()) throw new Error("Le numéro de bon de commande est obligatoire.");
      if (!linkForm.endDate) throw new Error("La date de fin / péremption du bon de commande est obligatoire.");
      if (!linkForm.file) throw new Error("Le bon de commande papier/PDF est obligatoire.");

      const client = selectedClient();
      const clientName = linkForm.clientName.trim() || client?.full_name || client?.email || "Client";
      const clientEmail = linkForm.clientEmail.trim() || client?.email || "";
      const clientRef = linkForm.clientRef.trim() || clientName;
      const fileName = linkForm.file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const path = `${linkForm.clientId}/${Date.now()}-BDC-${linkForm.orderNumber.trim()}-${fileName}`;

      const uploadResult = await supabase.storage.from(BUCKET).upload(path, linkForm.file, { upsert: false });
      if (uploadResult.error) throw uploadResult.error;

      const docResult = await supabase.from("documents").insert({
        owner_id: linkForm.clientId,
        shared_with_id: null,
        title: `Bon de commande ${linkForm.orderNumber.trim()}`,
        document_type: "bon_commande",
        file_path: path,
      }).select("id").single();
      if (docResult.error) throw docResult.error;

      const assignmentResult = await supabase.from("consultant_clients").upsert({
        consultant_id: linkForm.consultantId,
        client_id: linkForm.clientId,
      }, { onConflict: "consultant_id,client_id" });
      if (assignmentResult.error) throw assignmentResult.error;

      const poResult = await supabase.from("purchase_orders").upsert({
        consultant_id: linkForm.consultantId,
        client_id: linkForm.clientId,
        document_id: docResult.data.id,
        file_path: path,
        order_number: linkForm.orderNumber.trim(),
        supplier_ref: linkForm.supplierRef.trim() || null,
        supplier_code: linkForm.supplierCode.trim() || null,
        order_date: linkForm.orderDate || null,
        end_date: linkForm.endDate,
        client_name: clientName,
        client_address: linkForm.clientAddress.trim() || null,
        client_email: clientEmail || null,
        client_ref: clientRef,
        payment_terms: linkForm.paymentTerms.trim() || "Règlement à 30 jours fin de mois",
        daily_rate: Number(linkForm.dailyRate || 0),
        extra_hour_rate: Number(linkForm.extraHourRate || 0),
        vat_rate: Number(linkForm.vatRate || 0),
        created_by: profiles.find((p) => p.role === "admin")?.id || null,
      }, { onConflict: "client_id,order_number" });
      if (poResult.error) throw poResult.error;

      setMsg("Affiliation créée et bon de commande enregistré.");
      setLinkForm({
        consultantId: "",
        clientId: "",
        orderNumber: "",
        supplierRef: "",
        supplierCode: "",
        orderDate: new Date().toISOString().slice(0, 10),
        endDate: "",
        clientName: "",
        clientAddress: "",
        clientEmail: "",
        clientRef: "",
        paymentTerms: "Règlement à 30 jours fin de mois",
        dailyRate: 250,
        extraHourRate: 230,
        vatRate: 20,
        file: null,
      });
      const input = document.getElementById("po-affiliation-file");
      if (input) input.value = "";
      await onRefresh();
    } catch (error) {
      setMsg(error.message || "Impossible de créer l’affiliation.");
    } finally {
      setBusy(false);
    }
  }

  async function unlinkConsultantClient(id) {
    if (!window.confirm("Supprimer cette affiliation consultant/client ?")) return;
    setMsg("");

    const { error } = await supabase.from("consultant_clients").delete().eq("id", id);

    if (error) {
      setMsg(error.message || "Impossible de supprimer l’affiliation.");
      return;
    }

    setMsg("Affiliation supprimée.");
    await onRefresh();
  }

  return (
    <section className="mt-6 space-y-6">
      <Panel title="Gestion des profils" subtitle="Consulte les comptes créés et ajuste les rôles.">
        {msg && <Alert>{msg}</Alert>}
        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100">
          <HeaderRow cols="md:grid-cols-4" values={["Nom", "Email", "Rôle", "ID"]} />
          {profiles.map((p) => (
            <div key={p.id} className="grid gap-3 border-t border-slate-100 px-5 py-4 md:grid-cols-4 md:items-center">
              <b>{p.full_name || "Sans nom"}</b>
              <span className="break-all text-sm">{p.email}</span>
              <select value={p.role} onChange={(e) => changeRole(p.id, e.target.value)} className="w-fit rounded-full border bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">
                <option value="consultant">Consultant</option>
                <option value="client">Client</option>
                <option value="admin">Admin</option>
              </select>
              <span className="break-all text-xs text-slate-500">{p.id}</span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Affiliation + bon de commande obligatoire" subtitle="Associe un consultant à un client. Le bon de commande PDF est obligatoire et reste visible uniquement par l’admin et le client.">
        <form onSubmit={linkConsultantClient} className="mt-4 grid gap-4 md:grid-cols-2">
          <Select label="Consultant" value={linkForm.consultantId} onChange={(v) => setLinkForm({ ...linkForm, consultantId: v })}>
            <option value="">Sélectionner un consultant</option>
            {consultants.map((p) => <option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}
          </Select>

          <Select label="Client" value={linkForm.clientId} onChange={(v) => {
            const client = clients.find((c) => c.id === v);
            setLinkForm({
              ...linkForm,
              clientId: v,
              clientName: client?.full_name || client?.email || linkForm.clientName,
              clientEmail: client?.email || linkForm.clientEmail,
              clientRef: client?.full_name || client?.email || linkForm.clientRef,
            });
          }}>
            <option value="">Sélectionner un client</option>
            {clients.map((p) => <option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}
          </Select>

          <Input label="N° bon de commande obligatoire" value={linkForm.orderNumber} onChange={(v) => setLinkForm({ ...linkForm, orderNumber: v })} />
          <Input label="Réf client / contrat" value={linkForm.clientRef} onChange={(v) => setLinkForm({ ...linkForm, clientRef: v })} />
          <Input label="Réf fournisseur" value={linkForm.supplierRef} onChange={(v) => setLinkForm({ ...linkForm, supplierRef: v })} />
          <Input label="Code fournisseur" value={linkForm.supplierCode} onChange={(v) => setLinkForm({ ...linkForm, supplierCode: v })} />
          <Input label="Date de commande" type="date" value={linkForm.orderDate} onChange={(v) => setLinkForm({ ...linkForm, orderDate: v })} />
          <Input label="Date fin / péremption obligatoire" type="date" value={linkForm.endDate} onChange={(v) => setLinkForm({ ...linkForm, endDate: v })} />
          <Input label="Société à facturer" value={linkForm.clientName} onChange={(v) => setLinkForm({ ...linkForm, clientName: v })} />
          <Input label="Email facturation" value={linkForm.clientEmail} onChange={(v) => setLinkForm({ ...linkForm, clientEmail: v })} />
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-bold">Adresse société à facturer</span>
            <textarea value={linkForm.clientAddress} onChange={(e) => setLinkForm({ ...linkForm, clientAddress: e.target.value })} className="min-h-24 w-full rounded-2xl border px-4 py-3" />
          </label>
          <Input label="Conditions de règlement" value={linkForm.paymentTerms} onChange={(v) => setLinkForm({ ...linkForm, paymentTerms: v })} />
          <Input label="Prix journalier HT / TJM" type="number" value={linkForm.dailyRate} onChange={(v) => setLinkForm({ ...linkForm, dailyRate: v })} />
          <Input label="Prix heure supp HT" type="number" value={linkForm.extraHourRate} onChange={(v) => setLinkForm({ ...linkForm, extraHourRate: v })} />
          <Input label="TVA %" type="number" value={linkForm.vatRate} onChange={(v) => setLinkForm({ ...linkForm, vatRate: v })} />

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-bold text-slate-700">Bon de commande papier/PDF obligatoire</span>
            <input id="po-affiliation-file" type="file" accept="application/pdf,image/*" onChange={(e) => setLinkForm({ ...linkForm, file: e.target.files?.[0] || null })} className="w-full rounded-2xl border px-4 py-3" />
          </label>

          <div className="md:col-span-2">
            <button disabled={busy} className="w-full rounded-full bg-blue-700 px-6 py-3 font-bold text-white disabled:opacity-60">
              {busy ? "Traitement..." : "Affilier et enregistrer le bon de commande"}
            </button>
          </div>
        </form>

        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100">
          <HeaderRow cols="md:grid-cols-3" values={["Consultant", "Client", "Action"]} />
          {assignments.length === 0 ? (
            <Empty text="Aucune affiliation trouvée." />
          ) : assignments.map((a) => (
            <div key={a.id} className="grid gap-3 border-t border-slate-100 px-5 py-4 md:grid-cols-3 md:items-center">
              <span className="text-sm font-semibold">{a.consultant?.full_name || a.consultant?.email || a.consultant_id}</span>
              <span className="text-sm font-semibold">{a.client?.full_name || a.client?.email || a.client_id}</span>
              <button onClick={() => unlinkConsultantClient(a.id)} className="w-fit rounded-full bg-red-50 px-4 py-2 text-sm font-bold text-red-700">Supprimer</button>
            </div>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function Documents({ profile, isAdmin, profiles, documents, onRefresh }) {
  const [form, setForm] = useState({ ownerId: profile.id, title: "", type: "contrat", file: null });
  const [msg, setMsg] = useState("");
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(false);

  const filterOptions = profile.role === "consultant"
    ? ["all", "contrat", "fiche_paie", "justificatif", "cra", "facture", "autre"]
    : ["all", "contrat", "fiche_paie", "justificatif", "cra", "facture", "bon_commande", "autre"];
  const visible = documents.filter((d) => {
    if (profile.role === "consultant" && d.document_type === "bon_commande") return false;
    return filter === "all" || d.document_type === filter;
  });

  async function upload(e) {
    e.preventDefault();
    setBusy(true);
    setMsg("");

    try {
      const ownerId = isAdmin ? form.ownerId : profile.id;
      if (!ownerId) throw new Error("Sélectionne un propriétaire.");
      if (!form.title.trim()) throw new Error("Ajoute un titre.");
      if (!form.file) throw new Error("Choisis un fichier.");

      const fileName = form.file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const path = `${ownerId}/${Date.now()}-${fileName}`;

      const uploadResult = await supabase.storage.from(BUCKET).upload(path, form.file, { upsert: false });
      if (uploadResult.error) throw uploadResult.error;

      const insertResult = await supabase.from("documents").insert({
        owner_id: ownerId,
        title: form.title.trim(),
        document_type: form.type,
        file_path: path,
      });
      if (insertResult.error) throw insertResult.error;

      setMsg("Document déposé avec succès.");
      setForm({ ownerId, title: "", type: "contrat", file: null });
      const input = document.getElementById("doc-file");
      if (input) input.value = "";
      await onRefresh();
    } catch (error) {
      setMsg(error.message || "Erreur pendant le dépôt.");
    } finally {
      setBusy(false);
    }
  }

  async function openDoc(doc) {
    if (doc.document_type === "facture" || doc.file_path?.toLowerCase().endsWith(".html")) {
      const { data, error } = await supabase.storage.from(BUCKET).download(doc.file_path);
      if (error) {
        alert(error.message || "Impossible d’ouvrir la facture.");
        return;
      }
      const html = await data.text();
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      return;
    }

    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(doc.file_path, 120);
    if (error) {
      alert(error.message || "Impossible d’ouvrir le document.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function deleteDoc(doc) {
    if (!window.confirm(`Supprimer "${doc.title}" ?`)) return;
    setBusy(true);
    setMsg("");

    try {
      await supabase.storage.from(BUCKET).remove([doc.file_path]);
      const { error } = await supabase.from("documents").delete().eq("id", doc.id);
      if (error) throw error;
      setMsg("Document supprimé.");
      await onRefresh();
    } catch (error) {
      setMsg(error.message || "Suppression impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-6 grid gap-6 lg:grid-cols-[420px_1fr]">
      <div className="rounded-[2rem] bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black">Déposer un document</h2>
        <p className="mt-2 text-sm text-slate-600">Contrat, fiche de paie, CRA ou justificatif.</p>

        <form onSubmit={upload} className="mt-6 space-y-4">
          {isAdmin && (
            <Select label="Propriétaire" value={form.ownerId} onChange={(v) => setForm({ ...form, ownerId: v })}>
              <option value="">Sélectionner</option>
              {profiles.map((p) => <option key={p.id} value={p.id}>{p.full_name || p.email} — {roles[p.role]}</option>)}
            </Select>
          )}

          <Input label="Titre du document" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
          <Select label="Type de document" value={form.type} onChange={(v) => setForm({ ...form, type: v })}>
            <option value="contrat">Contrat</option>
            <option value="fiche_paie">Fiche de paie</option>
            <option value="justificatif">Justificatif</option>
            <option value="cra">CRA</option>
            <option value="facture">Facture</option>
            <option value="autre">Autre</option>
          </Select>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">Fichier</span>
            <input id="doc-file" type="file" onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })} className="w-full rounded-2xl border px-4 py-3" />
          </label>

          {msg && <Alert>{msg}</Alert>}

          <button disabled={busy} className="w-full rounded-full bg-blue-700 px-6 py-3 font-bold text-white disabled:opacity-60">
            {busy ? "Traitement..." : "Déposer le document"}
          </button>
        </form>
      </div>

      <Panel title="Documents" subtitle="Consulte, ouvre et supprime les documents déposés.">
        <div className="mt-6 flex flex-wrap gap-3">
          {filterOptions.map((v) => (
            <Pill key={v} active={filter === v} onClick={() => setFilter(v)}>{v === "all" ? "Tous" : docTypes[v]}</Pill>
          ))}
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100">
          <HeaderRow cols="md:grid-cols-5" values={["Titre", "Type", "Propriétaire", "Date", "Action"]} />
          {visible.length === 0 ? (
            <Empty text="Aucun document trouvé." />
          ) : visible.map((d) => (
            <div key={d.id} className="grid gap-3 border-t border-slate-100 px-5 py-4 md:grid-cols-5 md:items-center">
              <b>{d.title}</b>
              <span className="text-sm">{docTypes[d.document_type] || d.document_type}</span>
              <span className="text-sm">{d.profiles?.full_name || d.profiles?.email || "Utilisateur"}</span>
              <span className="text-xs text-slate-500">{formatDate(d.created_at)}</span>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => openDoc(d)} className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">Ouvrir</button>
                {(isAdmin || d.owner_id === profile.id) && <button onClick={() => deleteDoc(d)} className="rounded-full bg-red-50 px-4 py-2 text-sm font-bold text-red-700">Supprimer</button>}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function Cra({ profile, isAdmin, isClient, profiles, assignments, cras, onRefresh }) {
  const adminConsultants = profiles.filter((p) => p.role === "consultant");
  const assignedClients = assignments
    .filter((a) => a.consultant_id === profile.id && a.client)
    .map((a) => a.client);
  const clientConsultants = assignments
    .filter((a) => a.client_id === profile.id && a.consultant)
    .map((a) => a.consultant);
  const clients = isAdmin ? profiles.filter((p) => p.role === "client") : isClient ? [profile] : assignedClients;
  const consultantsForForm = isAdmin ? adminConsultants : isClient ? clientConsultants : [profile];
  const [form, setForm] = useState({
    consultantId: isAdmin || isClient ? "" : profile.id,
    clientId: isClient ? profile.id : "",
    month: new Date().toISOString().slice(0, 7),
    workedDays: 20,
    extraHours: 0,
    extraHoursRate: 44.64,
  });
  const [msg, setMsg] = useState("");
  const [openId, setOpenId] = useState(null);
  const [pricingOpenId, setPricingOpenId] = useState(null);
  const [pricingForm, setPricingForm] = useState({});
  const [decision, setDecision] = useState({ comment: "", visibility: "both", file: null });

  useEffect(() => {
    if (!isAdmin && !isClient && clients.length === 1 && !form.clientId) {
      setForm((current) => ({ ...current, clientId: clients[0].id }));
    }
    if (isClient && clientConsultants.length === 1 && !form.consultantId) {
      setForm((current) => ({ ...current, consultantId: clientConsultants[0].id, clientId: profile.id }));
    }
  }, [isAdmin, isClient, clients.length, clientConsultants.length, form.clientId, form.consultantId]);

  async function createCra(e) {
    e.preventDefault();
    setMsg("");

    try {
      const consultantId = isAdmin || isClient ? form.consultantId : profile.id;
      const clientId = isClient ? profile.id : form.clientId;
      if (!consultantId) throw new Error("Sélectionne un consultant.");
      if (!clientId) throw new Error("Sélectionne le client concerné par le CRA.");
      if (isClient && !clientConsultants.some((c) => c.id === consultantId)) throw new Error("Ce consultant n’est pas affilié à ton compte client.");
      if (!isAdmin && !isClient && !assignedClients.some((c) => c.id === clientId)) throw new Error("Ce client n’est pas affilié à ton compte consultant.");

      const { error } = await supabase.from("cra").insert({
        consultant_id: consultantId,
        client_id: clientId,
        month: `${form.month}-01`,
        worked_days: Number(form.workedDays || 0),
        extra_hours: Number(form.extraHours || 0),
        extra_hours_rate: isAdmin ? Number(form.extraHoursRate || 0) : 0,
        saturday_days: 0,
        saturday_rate: 0,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      });

      if (error) throw error;
      setMsg("CRA créé.");
      await onRefresh();
    } catch (error) {
      setMsg(error.message || "Création impossible.");
    }
  }

  async function uploadDecisionAttachment(cra) {
    if (!decision.file) return;
    const ownerId = profile.id;
    const sharedWithId = decision.visibility === "both" ? cra.consultant_id : null;
    const fileName = decision.file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const title = `Pièce jointe CRA ${formatMonth(cra.month)} ${cra.consultant?.full_name || cra.consultant?.email || "consultant"}`;
    const path = `${ownerId}/${Date.now()}-CRA-${cra.id}-${fileName}`;

    const uploadResult = await supabase.storage.from(BUCKET).upload(path, decision.file, { upsert: false });
    if (uploadResult.error) throw uploadResult.error;

    const insertResult = await supabase.from("documents").insert({
      owner_id: ownerId,
      shared_with_id: sharedWithId,
      title,
      document_type: "cra",
      file_path: path,
    });
    if (insertResult.error) throw insertResult.error;
  }

  async function decide(cra, status) {
    setMsg("");
    try {
      const { error } = await supabase.from("cra").update({
        status,
        client_comment: decision.comment || null,
        client_comment_visibility: decision.visibility,
        validated_at: new Date().toISOString(),
        validated_by: profile.id,
      }).eq("id", cra.id);

      if (error) throw error;
      await uploadDecisionAttachment(cra);
      setMsg(status === "approved" ? "CRA validé." : "CRA refusé.");
      setOpenId(null);
      setDecision({ comment: "", visibility: "both", file: null });
      await onRefresh();
    } catch (error) {
      setMsg(error.message || "Action impossible.");
    }
  }

  function openPricing(cra) {
    setPricingOpenId(pricingOpenId === cra.id ? null : cra.id);
    setPricingForm({
      extra_hours_rate: cra.extra_hours_rate ?? 44.64,
      worked_days: cra.worked_days ?? 0,
      extra_hours: cra.extra_hours ?? 0,
    });
  }

  async function updateCraPricing(cra) {
    setMsg("");

    const { error } = await supabase.from("cra").update({
      worked_days: Number(pricingForm.worked_days || 0),
      extra_hours: Number(pricingForm.extra_hours || 0),
      extra_hours_rate: Number(pricingForm.extra_hours_rate || 0),
      saturday_days: 0,
      saturday_rate: 0,
      updated_at: new Date().toISOString(),
    }).eq("id", cra.id);

    if (error) {
      setMsg(error.message || "Impossible de mettre à jour les informations de facturation.");
      return;
    }

    setMsg("Informations de facturation mises à jour.");
    setPricingOpenId(null);
    await onRefresh();
  }

  async function deleteCra(cra) {
    if (!window.confirm(`Supprimer le CRA de ${formatMonth(cra.month)} ?`)) return;
    setMsg("");

    try {
      await supabase.from("invoices").delete().eq("cra_id", cra.id);
      const { error } = await supabase.from("cra").delete().eq("id", cra.id);
      if (error) throw error;
      setMsg("CRA supprimé.");
      await onRefresh();
    } catch (error) {
      setMsg(error.message || "Suppression impossible. Relance supabase-cra.sql.");
    }
  }

  const noClientForConsultant = !isAdmin && !isClient && clients.length === 0;
  const noConsultantForClient = isClient && clientConsultants.length === 0;

  return (
    <section className="mt-6 space-y-6">
      {isClient && (
        <Panel title="Consultants affiliés" subtitle="Tu peux créer et suivre des CRA séparés pour chaque consultant affilié à ton compte.">
          {clientConsultants.length === 0 ? <Empty text="Aucun consultant affilié." /> : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {clientConsultants.map((c) => (
                <div key={c.id} className="rounded-2xl bg-slate-50 p-4">
                  <b>{c.full_name || c.email}</b>
                  <p className="mt-1 text-sm text-slate-600">{c.email}</p>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      <div className="rounded-[2rem] bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black">{isAdmin ? "Créer un CRA pour un consultant" : isClient ? "Créer un CRA pour un consultant" : "Créer mon CRA"}</h2>
        {!isAdmin && <p className="mt-2 text-sm text-slate-600">Renseigne uniquement le nombre de jours travaillés et le nombre d’heures supplémentaires du mois. Les taux et prix sont gérés par l’administrateur.</p>}
        {noClientForConsultant && <Alert>Aucun client n’est encore affilié à ton compte. Demande à l’administrateur de t’affilier à un client avant de créer un CRA.</Alert>}
        {noConsultantForClient && <Alert>Aucun consultant n’est encore affilié à ton compte client.</Alert>}

        <form onSubmit={createCra} className="mt-6 grid gap-4 md:grid-cols-4">
          {(isAdmin || isClient) && (
            <Select label="Consultant" value={form.consultantId} onChange={(v) => setForm({ ...form, consultantId: v })}>
              <option value="">Sélectionner un consultant</option>
              {consultantsForForm.map((p) => <option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}
            </Select>
          )}

          {!isClient && (
            <Select label="Client" value={form.clientId} onChange={(v) => setForm({ ...form, clientId: v })}>
              <option value="">Sélectionner un client</option>
              {clients.map((p) => <option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}
            </Select>
          )}

          {isClient && <Info label="Client" value={profile.full_name || profile.email} />}

          <Input label="Mois" type="month" value={form.month} onChange={(v) => setForm({ ...form, month: v })} />
          <Input label="Nombre de jours travaillés dans le mois" type="number" value={form.workedDays} onChange={(v) => setForm({ ...form, workedDays: v })} />
          <Input label="Nombre d’heures supp dans le mois" type="number" value={form.extraHours} onChange={(v) => setForm({ ...form, extraHours: v })} />
          {isAdmin && <Input label="Taux heure supp HT" type="number" value={form.extraHoursRate} onChange={(v) => setForm({ ...form, extraHoursRate: v })} />}

          <div className="flex items-end">
            <button disabled={noClientForConsultant || noConsultantForClient} className="w-full rounded-full bg-blue-700 px-6 py-3 font-bold text-white disabled:opacity-50">Créer</button>
          </div>
        </form>
      </div>

      <Panel title="CRA" subtitle="Suivi global des CRA et validations, séparé par consultant et client.">
        {msg && <Alert>{msg}</Alert>}

        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100">
          <HeaderRow cols="md:grid-cols-7" values={["Mois", "Consultant", "Client", "Temps", "Statut", "Commentaire", "Action"]} />
          {cras.length === 0 ? (
            <Empty text="Aucun CRA trouvé." />
          ) : cras.map((c) => {
            const canDecide = (isAdmin || isClient) && c.status === "submitted";
            const canDelete = isAdmin || c.consultant_id === profile.id;

            return (
              <div key={c.id} className="border-t border-slate-100">
                <div className="grid gap-3 px-5 py-4 md:grid-cols-7 md:items-center">
                  <b>{formatMonth(c.month)}</b>
                  <span className="text-sm">{c.consultant?.full_name || c.consultant?.email || "-"}</span>
                  <span className="text-sm">{c.client?.full_name || c.client?.email || "Aucun client"}</span>
                  <span className="text-sm">{Number(c.worked_days || 0)} j<br />{Number(c.extra_hours || 0)} h supp</span>
                  <Badge status={c.status}>{statuses[c.status] || c.status}</Badge>
                  <span className="text-sm text-slate-600">{c.client_comment || "Aucun"}</span>
                  <div className="flex flex-wrap gap-2">
                    {canDecide && <button onClick={() => setOpenId(openId === c.id ? null : c.id)} className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">Traiter</button>}
                    {isAdmin && <button onClick={() => openPricing(c)} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-800">Tarifs admin</button>}
                    {canDelete && <button onClick={() => deleteCra(c)} className="rounded-full bg-red-50 px-4 py-2 text-sm font-bold text-red-700">Supprimer</button>}
                  </div>
                </div>

                {isAdmin && pricingOpenId === c.id && (
                  <div className="mx-5 mb-5 rounded-3xl bg-slate-50 p-5">
                    <h3 className="text-lg font-black">Informations de facturation admin</h3>
                    <p className="mt-1 text-sm text-slate-600">Ces montants ne sont visibles que par l’administrateur. Le consultant ne voit pas les taux.</p>

                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                      <Input label="Jours" type="number" value={pricingForm.worked_days} onChange={(v) => setPricingForm({ ...pricingForm, worked_days: v })} />
                      <Input label="Heures supp" type="number" value={pricingForm.extra_hours} onChange={(v) => setPricingForm({ ...pricingForm, extra_hours: v })} />
                      <Input label="Taux heure supp HT" type="number" value={pricingForm.extra_hours_rate} onChange={(v) => setPricingForm({ ...pricingForm, extra_hours_rate: v })} />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button onClick={() => updateCraPricing(c)} className="rounded-full bg-blue-700 px-5 py-3 font-bold text-white">Enregistrer tarifs</button>
                      <button onClick={() => setPricingOpenId(null)} className="rounded-full bg-white px-5 py-3 font-bold">Annuler</button>
                    </div>
                  </div>
                )}

                {openId === c.id && (
                  <div className="mx-5 mb-5 rounded-3xl bg-slate-50 p-5">
                    <label className="block">
                      <span className="mb-2 block text-sm font-bold">Commentaire facultatif</span>
                      <textarea value={decision.comment} onChange={(e) => setDecision({ ...decision, comment: e.target.value })} className="min-h-24 w-full rounded-2xl border px-4 py-3" />
                    </label>

                    <Select label="Qui peut voir le commentaire et la pièce jointe ?" value={decision.visibility} onChange={(v) => setDecision({ ...decision, visibility: v })}>
                      <option value="both">Admin + consultant</option>
                      <option value="admin_only">Admin uniquement</option>
                    </Select>

                    <label className="mt-4 block">
                      <span className="mb-2 block text-sm font-bold text-slate-700">Pièce jointe facultative PDF / image</span>
                      <input type="file" accept="application/pdf,image/*" onChange={(e) => setDecision({ ...decision, file: e.target.files?.[0] || null })} className="w-full rounded-2xl border px-4 py-3" />
                    </label>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button onClick={() => decide(c, "approved")} className="rounded-full bg-green-600 px-5 py-3 font-bold text-white">Valider</button>
                      <button onClick={() => decide(c, "rejected")} className="rounded-full bg-red-600 px-5 py-3 font-bold text-white">Refuser</button>
                      <button onClick={() => setOpenId(null)} className="rounded-full bg-white px-5 py-3 font-bold">Annuler</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Panel>
    </section>
  );
}

function Invoices({ profile, profiles, cras, invoices, purchaseOrders, onRefresh }) {
  const approved = cras.filter((c) => c.status === "approved");
  const clients = profiles.filter((p) => p.role === "client");
  const consultants = profiles.filter((p) => p.role === "consultant");
  const [selectedId, setSelectedId] = useState("");
  const selected = approved.find((c) => c.id === selectedId) || approved[0] || null;
  const [selectedPoId, setSelectedPoId] = useState("");
  const [msg, setMsg] = useState("");
  const [poMsg, setPoMsg] = useState("");
  const [documentTitle, setDocumentTitle] = useState("");
  const [form, setForm] = useState({
    number: invoiceNumber(),
    date: new Date().toISOString().slice(0, 10),
    clientName: "",
    clientAddress: "",
    clientEmail: "",
    clientRef: "",
    purchaseOrder: "",
    paymentTerms: "Règlement à 30 jours fin de mois",
    dailyRate: 250,
    extraHourRate: 230,
    vatRate: 20,
  });
  const [poForm, setPoForm] = useState({
    consultantId: "",
    clientId: "",
    orderNumber: "",
    supplierRef: "",
    supplierCode: "",
    orderDate: new Date().toISOString().slice(0, 10),
    endDate: "",
    clientName: "",
    clientAddress: "",
    clientEmail: "",
    clientRef: "",
    paymentTerms: "Règlement à 30 jours fin de mois",
    dailyRate: 250,
    extraHourRate: 230,
    vatRate: 20,
    file: null,
  });
  const [showPoManager, setShowPoManager] = useState(false);

  useEffect(() => {
    if (!selectedId && approved[0]) setSelectedId(approved[0].id);
  }, [approved.length]);

  useEffect(() => {
    if (!selected) return;
    const clientName = selected.client?.full_name || selected.client?.email || "";
    setForm((p) => ({
      ...p,
      clientName: clientName || p.clientName,
      clientEmail: selected.client?.email || p.clientEmail,
      clientRef: clientName || p.clientRef,
    }));
    setSelectedPoId("");
    setDocumentTitle(defaultInvoiceDocumentTitle(selected));
  }, [selected?.id]);

  const purchaseOrdersForCra = selected?.client_id
    ? purchaseOrders.filter((po) =>
        po.client_id === selected.client_id
        && (!po.consultant_id || po.consultant_id === selected.consultant_id)
        && isPurchaseOrderValidForMonth(po, selected.month)
      )
    : [];

  const expiredPurchaseOrdersForCra = selected?.client_id
    ? purchaseOrders.filter((po) =>
        po.client_id === selected.client_id
        && (!po.consultant_id || po.consultant_id === selected.consultant_id)
        && !isPurchaseOrderValidForMonth(po, selected.month)
      )
    : [];

  const invoice = selected ? makeInvoice(selected, form) : null;

  function selectedClientFromPoForm() {
    return clients.find((c) => c.id === poForm.clientId) || null;
  }

  function applyPurchaseOrder(po) {
    if (!po) return;
    if (selected && !isPurchaseOrderValidForMonth(po, selected.month)) {
      setMsg(`Le bon de commande ${po.order_number} est expiré pour ${formatMonth(selected.month)}. Il faut un nouveau bon de commande.`);
      return;
    }
    const clientName = po.client_name || po.client?.full_name || po.client?.email || "";
    setSelectedPoId(po.id);
    setForm((p) => ({
      ...p,
      clientName,
      clientAddress: po.client_address || "",
      clientEmail: po.client_email || po.client?.email || "",
      clientRef: po.client_ref || clientName,
      purchaseOrder: po.order_number || "",
      paymentTerms: po.payment_terms || "Règlement à 30 jours fin de mois",
      dailyRate: po.daily_rate ?? p.dailyRate,
      extraHourRate: po.extra_hour_rate ?? p.extraHourRate,
      vatRate: po.vat_rate ?? p.vatRate,
    }));
  }

  async function savePurchaseOrder(e) {
    e.preventDefault();
    setPoMsg("");

    try {
      if (!poForm.consultantId) throw new Error("Sélectionne le consultant lié au bon de commande.");
      if (!poForm.clientId) throw new Error("Sélectionne le client lié au bon de commande.");
      if (!poForm.orderNumber.trim()) throw new Error("Le numéro de bon de commande est obligatoire.");
      if (!poForm.endDate) throw new Error("La date de fin / péremption du bon de commande est obligatoire.");
      if (!poForm.file) throw new Error("Le bon de commande papier/PDF est obligatoire.");

      const selectedClient = selectedClientFromPoForm();
      const fallbackName = selectedClient?.full_name || selectedClient?.email || "";
      const fallbackEmail = selectedClient?.email || "";
      const clientName = poForm.clientName.trim() || fallbackName;
      const fileName = poForm.file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const path = `${poForm.clientId}/${Date.now()}-BDC-${poForm.orderNumber.trim()}-${fileName}`;

      const uploadResult = await supabase.storage.from(BUCKET).upload(path, poForm.file, { upsert: false });
      if (uploadResult.error) throw uploadResult.error;

      const docResult = await supabase.from("documents").insert({
        owner_id: poForm.clientId,
        shared_with_id: null,
        title: `Bon de commande ${poForm.orderNumber.trim()}`,
        document_type: "bon_commande",
        file_path: path,
      }).select("id").single();
      if (docResult.error) throw docResult.error;

      const affiliationResult = await supabase.from("consultant_clients").upsert({
        consultant_id: poForm.consultantId,
        client_id: poForm.clientId,
      }, { onConflict: "consultant_id,client_id" });
      if (affiliationResult.error) throw affiliationResult.error;

      const { error } = await supabase.from("purchase_orders").upsert({
        consultant_id: poForm.consultantId,
        client_id: poForm.clientId,
        document_id: docResult.data.id,
        file_path: path,
        order_number: poForm.orderNumber.trim(),
        supplier_ref: poForm.supplierRef.trim() || null,
        supplier_code: poForm.supplierCode.trim() || null,
        order_date: poForm.orderDate || null,
        end_date: poForm.endDate,
        client_name: clientName,
        client_address: poForm.clientAddress.trim() || null,
        client_email: poForm.clientEmail.trim() || fallbackEmail,
        client_ref: poForm.clientRef.trim() || clientName,
        payment_terms: poForm.paymentTerms.trim() || "Règlement à 30 jours fin de mois",
        daily_rate: Number(poForm.dailyRate || 0),
        extra_hour_rate: Number(poForm.extraHourRate || 0),
        vat_rate: Number(poForm.vatRate || 0),
        created_by: profile.id,
      }, { onConflict: "client_id,order_number" });

      if (error) throw error;
      setPoMsg("Bon de commande enregistré avec document et affiliation.");
      setPoForm({
        consultantId: "",
        clientId: "",
        orderNumber: "",
        supplierRef: "",
        supplierCode: "",
        orderDate: new Date().toISOString().slice(0, 10),
        endDate: "",
        clientName: "",
        clientAddress: "",
        clientEmail: "",
        clientRef: "",
        paymentTerms: "Règlement à 30 jours fin de mois",
        dailyRate: 250,
        extraHourRate: 230,
        vatRate: 20,
        file: null,
      });
      const input = document.getElementById("po-file");
      if (input) input.value = "";
      await onRefresh();
    } catch (error) {
      setPoMsg(error.message || "Impossible d’enregistrer le bon de commande.");
    }
  }

  async function deletePurchaseOrder(po) {
    if (!window.confirm(`Supprimer le bon de commande ${po.order_number} ?`)) return;
    setPoMsg("");

    const { error } = await supabase.from("purchase_orders").delete().eq("id", po.id);
    if (error) {
      setPoMsg(error.message || "Suppression du bon de commande impossible.");
      return;
    }

    setPoMsg("Bon de commande supprimé.");
    await onRefresh();
  }

  async function save() {
    if (!invoice || !selected) {
      setMsg("Aucun CRA validé sélectionné.");
      return;
    }

    const selectedPo = purchaseOrders.find((po) => po.id === selectedPoId);
    if (!selectedPo) {
      setMsg("Sélectionne un bon de commande enregistré et valide pour ce mois.");
      return;
    }

    if (!isPurchaseOrderValidForMonth(selectedPo, selected.month)) {
      setMsg(`Le bon de commande ${selectedPo.order_number} est expiré pour ${formatMonth(selected.month)}. Il faut un nouveau bon de commande.`);
      return;
    }

    if (!form.purchaseOrder.trim()) {
      setMsg("Le numéro du bon de commande est obligatoire pour générer la facture.");
      return;
    }

    if (!selected.client_id) {
      setMsg("Le CRA doit être lié à un client pour enregistrer la facture dans ses documents.");
      return;
    }

    const { data, error } = await supabase.from("invoices").upsert({
      cra_id: selected.id,
      invoice_number: form.number,
      data: invoice,
      subtotal: invoice.subtotal,
      vat_amount: invoice.vat,
      total: invoice.total,
      created_by: profile.id,
    }, { onConflict: "cra_id" }).select("id").single();

    if (error) {
      setMsg(error.message || "Impossible d’enregistrer la facture.");
      return;
    }

    try {
      await saveInvoiceAsDocument(invoice, selected, data.id, documentTitle);
      setMsg("Facture enregistrée et ajoutée dans les documents du client.");
    } catch (documentError) {
      setMsg(`Facture enregistrée, mais impossible de l’ajouter aux documents : ${documentError.message}`);
    }

    await onRefresh();
  }

  async function deleteInvoice(invoiceToDelete) {
    if (!window.confirm(`Supprimer la facture ${invoiceToDelete.invoice_number} ?`)) return;

    const { error } = await supabase
      .from("invoices")
      .delete()
      .eq("id", invoiceToDelete.id);

    if (error) {
      setMsg(error.message || "Suppression de facture impossible.");
      return;
    }

    setMsg("Facture supprimée.");
    await onRefresh();
  }

  return (
    <section className="mt-6 grid gap-6 lg:grid-cols-[430px_1fr]">
      <div className="flex flex-col gap-6">
        <div className="order-2 rounded-[2rem] bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black">Préenregistrer un bon de commande</h2>
              <p className="mt-2 text-sm text-slate-600">Section pliable. Le bon de commande papier/PDF est obligatoire et reste visible uniquement par l’admin et le client.</p>
            </div>
            <button type="button" onClick={() => setShowPoManager(!showPoManager)} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white">
              {showPoManager ? "Replier" : "Déplier"}
            </button>
          </div>

          {showPoManager && (<>
          <form onSubmit={savePurchaseOrder} className="mt-6 space-y-4">
            <Select label="Consultant" value={poForm.consultantId} onChange={(v) => setPoForm({ ...poForm, consultantId: v })}>
              <option value="">Sélectionner un consultant</option>
              {consultants.map((c) => <option key={c.id} value={c.id}>{c.full_name || c.email}</option>)}
            </Select>
            <Select label="Client" value={poForm.clientId} onChange={(v) => {
              const client = clients.find((c) => c.id === v);
              setPoForm({
                ...poForm,
                clientId: v,
                clientName: client?.full_name || client?.email || poForm.clientName,
                clientEmail: client?.email || poForm.clientEmail,
                clientRef: client?.full_name || client?.email || poForm.clientRef,
              });
            }}>
              <option value="">Sélectionner un client</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name || c.email}</option>)}
            </Select>
            <Input label="N° bon de commande" value={poForm.orderNumber} onChange={(v) => setPoForm({ ...poForm, orderNumber: v })} />
            <Input label="Réf client / contrat" value={poForm.clientRef} onChange={(v) => setPoForm({ ...poForm, clientRef: v })} />
            <Input label="Réf fournisseur" value={poForm.supplierRef} onChange={(v) => setPoForm({ ...poForm, supplierRef: v })} />
            <Input label="Code fournisseur" value={poForm.supplierCode} onChange={(v) => setPoForm({ ...poForm, supplierCode: v })} />
            <Input label="Date commande" type="date" value={poForm.orderDate} onChange={(v) => setPoForm({ ...poForm, orderDate: v })} />
            <Input label="Date fin / péremption" type="date" value={poForm.endDate} onChange={(v) => setPoForm({ ...poForm, endDate: v })} />
            <Input label="Client à facturer" value={poForm.clientName} onChange={(v) => setPoForm({ ...poForm, clientName: v })} />
            <label className="block">
              <span className="mb-2 block text-sm font-bold">Adresse client</span>
              <textarea value={poForm.clientAddress} onChange={(e) => setPoForm({ ...poForm, clientAddress: e.target.value })} className="min-h-24 w-full rounded-2xl border px-4 py-3" />
            </label>
            <Input label="Email client" value={poForm.clientEmail} onChange={(v) => setPoForm({ ...poForm, clientEmail: v })} />
            <Input label="Conditions" value={poForm.paymentTerms} onChange={(v) => setPoForm({ ...poForm, paymentTerms: v })} />
            <Input label="Prix journalier HT / TJM" type="number" value={poForm.dailyRate} onChange={(v) => setPoForm({ ...poForm, dailyRate: v })} />
            <Input label="Prix heure supp HT" type="number" value={poForm.extraHourRate} onChange={(v) => setPoForm({ ...poForm, extraHourRate: v })} />
            <Input label="TVA %" type="number" value={poForm.vatRate} onChange={(v) => setPoForm({ ...poForm, vatRate: v })} />
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Bon de commande PDF obligatoire</span>
              <input id="po-file" type="file" accept="application/pdf,image/*" onChange={(e) => setPoForm({ ...poForm, file: e.target.files?.[0] || null })} className="w-full rounded-2xl border px-4 py-3" />
            </label>

            {poMsg && <Alert>{poMsg}</Alert>}
            <button className="w-full rounded-full bg-slate-950 px-6 py-3 font-bold text-white">Enregistrer le bon de commande</button>
          </form>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100">
            <HeaderRow cols="md:grid-cols-5" values={["BDC", "Client", "Consultant", "Fin", "Action"]} />
            {purchaseOrders.length === 0 ? <Empty text="Aucun bon de commande enregistré." /> : purchaseOrders.map((po) => (
              <div key={po.id} className="grid gap-3 border-t border-slate-100 px-5 py-4 md:grid-cols-5 md:items-center">
                <b>{po.order_number}</b>
                <span className="text-sm">{po.client_name || po.client?.full_name || po.client?.email || "-"}</span>
                <span className="text-sm">{po.consultant?.full_name || po.consultant?.email || "-"}</span>
                <span className="text-sm">{formatDate(po.end_date)}</span>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => applyPurchaseOrder(po)} className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">Appliquer</button>
                  <button type="button" onClick={() => deletePurchaseOrder(po)} className="rounded-full bg-red-50 px-4 py-2 text-sm font-bold text-red-700">Supprimer</button>
                </div>
              </div>
            ))}
          </div>
          </>)}
        </div>

        <div className="order-1 rounded-[2rem] bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black">Générer une facture</h2>
          <p className="mt-2 text-sm text-slate-600">Depuis un CRA validé et un bon de commande encore valide pour le mois du CRA.</p>

          {approved.length === 0 ? (
            <div className="mt-6"><Alert>Aucun CRA validé disponible.</Alert></div>
          ) : (
            <div className="mt-6 space-y-4">
              <Select label="CRA validé" value={selectedId || selected?.id || ""} onChange={(v) => { setSelectedId(v); setSelectedPoId(""); }}>
                {approved.map((c) => <option key={c.id} value={c.id}>{formatMonth(c.month)} — {c.consultant?.full_name || c.consultant?.email} — {c.worked_days} j</option>)}
              </Select>

              <Select label="Bon de commande enregistré" value={selectedPoId} onChange={(v) => {
                const po = purchaseOrders.find((item) => item.id === v);
                if (po) applyPurchaseOrder(po);
                else setSelectedPoId("");
              }}>
                <option value="">Sélectionner un bon de commande valide</option>
                {purchaseOrdersForCra.map((po) => <option key={po.id} value={po.id}>{po.order_number} — valable jusqu’au {formatDate(po.end_date)}</option>)}
              </Select>

              {selected && purchaseOrdersForCra.length === 0 && (
                <Alert>Aucun bon de commande valide pour {formatMonth(selected.month)}. Il faut enregistrer un nouveau bon de commande.</Alert>
              )}
              {expiredPurchaseOrdersForCra.length > 0 && (
                <Alert>{expiredPurchaseOrdersForCra.length} bon(s) de commande existent mais sont expirés pour ce mois.</Alert>
              )}

              <Input label="N° facture" value={form.number} onChange={(v) => setForm({ ...form, number: v })} />
              <Input label="Date facture" type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
              <Input label="Client à facturer" value={form.clientName} onChange={(v) => setForm({ ...form, clientName: v })} />
              <label className="block">
                <span className="mb-2 block text-sm font-bold">Adresse client</span>
                <textarea value={form.clientAddress} onChange={(e) => setForm({ ...form, clientAddress: e.target.value })} className="min-h-24 w-full rounded-2xl border px-4 py-3" />
              </label>
              <Input label="Email client" value={form.clientEmail} onChange={(v) => setForm({ ...form, clientEmail: v })} />
              <Input label="Réf client" value={form.clientRef} onChange={(v) => setForm({ ...form, clientRef: v })} />
              <Input label="N° bon de commande obligatoire" value={form.purchaseOrder} onChange={(v) => setForm({ ...form, purchaseOrder: v })} />
              <Input label="Conditions" value={form.paymentTerms} onChange={(v) => setForm({ ...form, paymentTerms: v })} />
              <Input label="Prix journalier HT / TJM" type="number" value={form.dailyRate} onChange={(v) => setForm({ ...form, dailyRate: v })} />
              <Input label="Prix heure supp HT" type="number" value={form.extraHourRate} onChange={(v) => setForm({ ...form, extraHourRate: v })} />
              <Input label="TVA %" type="number" value={form.vatRate} onChange={(v) => setForm({ ...form, vatRate: v })} />
              <Input label="Nom du document facture" value={documentTitle} onChange={setDocumentTitle} />

              {msg && <Alert>{msg}</Alert>}

              <button onClick={save} className="w-full rounded-full bg-blue-700 px-6 py-3 font-bold text-white">Enregistrer la facture</button>
              <button onClick={() => window.print()} className="w-full rounded-full bg-slate-950 px-6 py-3 font-bold text-white">Imprimer / Exporter PDF</button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <InvoicePreview invoice={invoice} />

        <Panel title="Factures enregistrées" subtitle="Historique des factures générées.">
          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100">
            <HeaderRow cols="md:grid-cols-5" values={["N°", "Client", "Total", "Date", "Action"]} />
            {invoices.length === 0 ? <Empty text="Aucune facture enregistrée." /> : invoices.map((i) => (
              <div key={i.id} className="grid gap-3 border-t border-slate-100 px-5 py-4 md:grid-cols-5 md:items-center">
                <b>{i.invoice_number}</b>
                <span className="text-sm">{i.data?.client?.name || "-"}</span>
                <span className="text-sm font-bold">{money(i.total)}</span>
                <span className="text-xs text-slate-500">{formatDate(i.created_at)}</span>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => window.print()} className="w-fit rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">PDF</button>
                  <button onClick={() => deleteInvoice(i)} className="w-fit rounded-full bg-red-50 px-4 py-2 text-sm font-bold text-red-700">Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </section>
  );
}

function invoiceHtmlDocument(invoice) {
  const rows = invoice.lines.map((line) => `
    <tr>
      <td>${escapeHtml(line.description)}</td>
      <td style="text-align:right">${escapeHtml(String(line.quantity))}</td>
      <td style="text-align:right">${money(line.unitPrice)}</td>
      <td style="text-align:right">${money(line.amount)}</td>
    </tr>
  `).join("");

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Facture ${escapeHtml(invoice.number)}</title>
  <style>
    body { font-family: Arial, sans-serif; color:#020617; margin:40px; }
    .top { display:flex; justify-content:space-between; gap:30px; }
    h1 { color:#1d4ed8; font-size:42px; margin:0; }
    h2 { color:#1e40af; font-size:34px; margin:0; }
    .blue { background:#1d4ed8; color:white; padding:10px; font-weight:bold; text-transform:uppercase; }
    .grid { display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-top:32px; }
    table { width:100%; border-collapse:collapse; margin-top:32px; }
    th { background:#1d4ed8; color:white; padding:10px; text-align:left; }
    td { padding:10px; border-bottom:1px solid #e2e8f0; }
    .total { margin-left:auto; margin-top:24px; width:320px; background:#eff6ff; padding:18px; border-radius:12px; }
    .line { display:flex; justify-content:space-between; margin:6px 0; }
    .big { font-size:22px; font-weight:bold; }
    .bank { margin-top:32px; border:1px solid #0f172a; padding:18px; }
  </style>
</head>
<body>
  <div class="top">
    <div>
      <h2>LRN PORTAGE</h2>
      <p><b>${escapeHtml(COMPANY.name)}</b><br>
      ${escapeHtml(COMPANY.address)}<br>
      Téléphone : ${escapeHtml(COMPANY.phone)}<br>
      SIRET : ${escapeHtml(COMPANY.siret)}</p>
    </div>
    <div style="text-align:right">
      <h1>FACTURE</h1>
      <p><b>N° :</b> ${escapeHtml(invoice.number)}<br>
      <b>Date :</b> ${escapeHtml(formatDate(invoice.date))}</p>
    </div>
  </div>

  <div class="grid">
    <div>
      <div class="blue">Facturer à</div>
      <p><b>${escapeHtml(invoice.client.name || "-")}</b><br>
      ${escapeHtml(invoice.client.address || "").replaceAll("\\n", "<br>")}<br>
      ${escapeHtml(invoice.client.email || "")}</p>
    </div>
    <div>
      <div class="blue">Conditions</div>
      <p><b>Réf client :</b> ${escapeHtml(invoice.clientRef || "-")}<br>
      <b>Bon de commande :</b> ${escapeHtml(invoice.purchaseOrder || "-")}<br>
      <b>Consultant :</b> ${escapeHtml(invoice.consultant || "-")}<br>
      <b>Paiement :</b> ${escapeHtml(invoice.paymentTerms || "-")}<br>
      <b>TVA :</b> ${escapeHtml(COMPANY.vat)}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr><th>Description</th><th style="text-align:right">Qté</th><th style="text-align:right">Prix HT</th><th style="text-align:right">Montant HT</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="total">
    <div class="line"><span>Sous-total HT</span><b>${money(invoice.subtotal)}</b></div>
    <div class="line"><span>TVA ${escapeHtml(String(invoice.vatRate))}%</span><b>${money(invoice.vat)}</b></div>
    <div class="line big"><span>Total</span><span>${money(invoice.total)}</span></div>
  </div>

  <div class="bank">
    <b>Détails bancaires</b><br>
    IBAN : ${escapeHtml(COMPANY.iban)}<br>
    BIC : ${escapeHtml(COMPANY.bic)}
  </div>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function saveInvoiceAsDocument(invoice, cra, invoiceRowId, title) {
  const ownerId = cra.client_id;
  if (!ownerId) throw new Error("La facture doit être rattachée à un client. Sélectionne un client sur le CRA.");

  const cleanTitle = title?.trim() || defaultInvoiceDocumentTitle(cra);
  const safeTitle = cleanTitle.replace(/[^a-zA-Z0-9À-ÿ ._\-]/g, "_");
  const fileName = `${safeTitle}-${invoiceRowId}.html`;
  const path = `${ownerId}/${Date.now()}-${fileName}`;
  const blob = new Blob(["\ufeff", invoiceHtmlDocument(invoice)], { type: "text/html;charset=utf-8" });

  const uploadResult = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: "text/html; charset=utf-8",
    upsert: true,
  });
  if (uploadResult.error) throw uploadResult.error;

  const insertResult = await supabase.from("documents").insert({
    owner_id: ownerId,
    title: cleanTitle,
    document_type: "facture",
    file_path: path,
  });
  if (insertResult.error) throw insertResult.error;
}

function defaultInvoiceDocumentTitle(cra) {
  const month = formatMonth(cra.month);
  const consultant = cra.consultant?.full_name || cra.consultant?.email || "consultant";
  return `Facture ${month} ${consultant}`;
}


function InvoicePreview({ invoice }) {
  if (!invoice) return <Panel title="Aperçu facture" subtitle="Sélectionne un CRA validé." />;

  return (
    <div id="invoice-print" className="rounded-[2rem] bg-white p-8 shadow-sm">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-blue-800">LRN PORTAGE</h2>
          <p className="mt-2 text-sm font-bold">{COMPANY.name}</p>
          <p className="text-sm">{COMPANY.address}</p>
          <p className="text-sm">Téléphone : {COMPANY.phone}</p>
          <p className="text-sm">SIRET : {COMPANY.siret}</p>
        </div>
        <div className="text-right">
          <h1 className="text-4xl font-black text-blue-700">FACTURE</h1>
          <p className="mt-3"><b>N° :</b> {invoice.number}</p>
          <p><b>Date :</b> {formatDate(invoice.date)}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="bg-blue-700 px-3 py-2 text-sm font-bold uppercase text-white">Facturer à</h3>
          <div className="p-3 text-sm">
            <p className="font-bold">{invoice.client.name || "-"}</p>
            <p className="whitespace-pre-line">{invoice.client.address}</p>
            <p>{invoice.client.email}</p>
          </div>
        </div>
        <div>
          <h3 className="bg-blue-700 px-3 py-2 text-sm font-bold uppercase text-white">Conditions</h3>
          <div className="p-3 text-sm">
            <p><b>Réf client :</b> {invoice.clientRef || "-"}</p>
            <p><b>Bon de commande :</b> {invoice.purchaseOrder || "-"}</p>
            <p><b>Consultant :</b> {invoice.consultant || "-"}</p>
            <p><b>Paiement :</b> {invoice.paymentTerms}</p>
            <p><b>TVA :</b> {COMPANY.vat}</p>
          </div>
        </div>
      </div>

      <table className="mt-8 w-full border-collapse text-sm">
        <thead>
          <tr className="bg-blue-700 text-white">
            <th className="p-2 text-left">Description</th>
            <th className="p-2 text-right">Qté</th>
            <th className="p-2 text-right">Prix HT</th>
            <th className="p-2 text-right">Montant HT</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lines.map((line, index) => (
            <tr key={index} className="border-b">
              <td className="p-2">{line.description}</td>
              <td className="p-2 text-right">{line.quantity}</td>
              <td className="p-2 text-right">{money(line.unitPrice)}</td>
              <td className="p-2 text-right">{money(line.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="ml-auto mt-6 w-full max-w-sm rounded-xl bg-blue-50 p-4 text-sm">
        <div className="flex justify-between"><span>Sous-total HT</span><b>{money(invoice.subtotal)}</b></div>
        <div className="flex justify-between"><span>TVA {invoice.vatRate}%</span><b>{money(invoice.vat)}</b></div>
        <div className="mt-2 flex justify-between text-xl"><span>Total</span><b>{money(invoice.total)}</b></div>
      </div>

      <div className="mt-8 rounded-xl border p-4 text-sm">
        <h3 className="font-black text-blue-700">Détails bancaires</h3>
        <p>IBAN : {COMPANY.iban}</p>
        <p>BIC : {COMPANY.bic}</p>
      </div>
    </div>
  );
}

function makeInvoice(cra, form) {
  const daily = Number(form.dailyRate || 0);
  const days = Number(cra.worked_days || 0);
  const extraHours = Number(cra.extra_hours || 0);
  const extraRate = Number(form.extraHourRate || 0);
  const vatRate = Number(form.vatRate || 0);
  const consultantName = cra.consultant?.full_name || cra.consultant?.email || "consultant";

  const lines = [
    { description: `Prestation de conseil - ${formatMonth(cra.month)} - ${consultantName}`, quantity: days, unitPrice: daily, amount: days * daily },
  ];

  if (extraHours > 0) lines.push({ description: "Heures supplémentaires", quantity: extraHours, unitPrice: extraRate, amount: extraHours * extraRate });

  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
  const vat = subtotal * vatRate / 100;
  const total = subtotal + vat;

  return {
    number: form.number,
    date: form.date,
    client: { name: form.clientName, address: form.clientAddress, email: form.clientEmail },
    consultant: consultantName,
    clientRef: form.clientRef || form.clientName,
    purchaseOrder: form.purchaseOrder,
    paymentTerms: form.paymentTerms,
    vatRate,
    lines,
    subtotal,
    vat,
    total,
  };
}

function Input({ label, value, onChange, type = "text" }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">{label}</span>
      <input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-700" />
    </label>
  );
}

function Select({ label, value, onChange, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">{label}</span>
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-700">
        {children}
      </select>
    </label>
  );
}

function Panel({ title, subtitle, children }) {
  return (
    <section className="rounded-[2rem] bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-black text-slate-950">{title}</h2>
      {subtitle && <p className="mt-2 text-sm text-slate-600">{subtitle}</p>}
      {children}
    </section>
  );
}

function Hero({ role, title }) {
  return (
    <div className="rounded-[2rem] bg-gradient-to-br from-slate-950 to-blue-950 p-8 text-white md:p-12">
      <span className="rounded-full border border-blue-500/50 px-4 py-2 text-sm">{role}</span>
      <h1 className="mt-8 text-4xl font-black md:text-5xl">{title}</h1>
      <p className="mt-4 text-slate-200">Bienvenue dans votre espace connecté LRN PORTAGE.</p>
    </div>
  );
}

function Logo({ light = false }) {
  return (
    <div className={`text-2xl font-black tracking-tight ${light ? "text-white" : "text-slate-950"}`}>
      LRN <span className="text-sm font-bold tracking-[0.4em] text-blue-500">PORTAGE</span>
    </div>
  );
}

function Stat({ title, value, text }) {
  return (
    <div className="rounded-[1.5rem] bg-white p-6 shadow-sm">
      <p className="text-sm font-bold text-blue-700">{title}</p>
      <p className="mt-3 text-3xl font-black">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{text}</p>
    </div>
  );
}

function Pill({ active, onClick, children }) {
  return (
    <button onClick={onClick} className={`rounded-full px-6 py-3 text-sm font-bold shadow-sm ${active ? "bg-blue-700 text-white" : "bg-white text-slate-950"}`}>
      {children}
    </button>
  );
}

function Action({ label, onClick }) {
  return (
    <button onClick={onClick} className="flex w-full items-center justify-between rounded-2xl bg-slate-50 px-5 py-4 font-bold hover:bg-blue-50">
      {label}<span>→</span>
    </button>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 break-all font-bold">{value}</p>
    </div>
  );
}

function HeaderRow({ cols, values }) {
  return (
    <div className={`hidden ${cols} bg-slate-50 px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500 md:grid`}>
      {values.map((v) => <span key={v}>{v}</span>)}
    </div>
  );
}

function Empty({ text }) {
  return <div className="border-t border-slate-100 p-6 text-slate-600">{text}</div>;
}

function Alert({ children }) {
  return <div className="my-4 rounded-2xl bg-yellow-50 p-4 text-sm text-yellow-900">{children}</div>;
}

function Badge({ status, children }) {
  const cls = status === "approved" ? "bg-green-50 text-green-700" : status === "rejected" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700";
  return <span className={`w-fit rounded-full px-3 py-2 text-sm font-bold ${cls}`}>{children}</span>;
}

function FullPage({ text }) {
  return <div className="grid min-h-screen place-items-center bg-slate-50 text-xl font-black">{text}</div>;
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("fr-FR");
}

function formatMonth(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

function isPurchaseOrderValidForMonth(po, monthValue) {
  if (!po?.end_date || !monthValue) return false;
  const monthStart = new Date(monthValue);
  if (Number.isNaN(monthStart.getTime())) return false;
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
  const poEnd = new Date(po.end_date);
  return poEnd >= monthEnd;
}

function money(value) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(Number(value || 0));
}

function invoiceNumber() {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
}
