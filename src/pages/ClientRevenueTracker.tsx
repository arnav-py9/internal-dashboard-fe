import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import OperationsDialog from "../components/clientRevenue/OperationsDialog";
import type {
  Client,
  Batch,
  Payment,
  DeliveryLog,
  Settlement,
} from "../data/clientRevenueMockData";
import { formatINR, formatDate } from "../utils/clientRevenueCalculations";
import { batchOperations, todayIN } from "../utils/clientRevenueOperations";
import "../styles/Dashboard.css";
import "../styles/ClientOperations.css";

type Data = {
  clients: Client[];
  batches: Batch[];
  payments: Payment[];
  deliveries: DeliveryLog[];
  settlements: Settlement[];
};
type Action =
  | "client"
  | "batch"
  | "payment"
  | "delivery"
  | "edit-client"
  | "edit-batch"
  | "settlement"
  | "end";
type Modal = { kind: Action; batchId?: string; clientId?: string };
type Filter = "active" | "attention" | "balance" | "completed" | "all";
const empty: Data = {
  clients: [],
  batches: [],
  payments: [],
  deliveries: [],
  settlements: [],
};
const accounts = ["Business", "Personal", "Slice", "Other"];
const api = "/api/client-revenue";
const money = formatINR;
async function request<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const user = localStorage.getItem("user_id");
  if (!user) throw new Error("Your session has ended. Please sign in again.");
  const response = await fetch(api + path, {
    method,
    headers: {
      "user-id": user,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(
      typeof result?.detail === "string"
        ? result.detail
        : `Could not save this change (${response.status}). Please try again.`,
    );
  return result as T;
}
const errorText = (e: unknown) =>
  e instanceof Error
    ? e.message
    : "Could not connect. Your changes have not been saved.";

export default function ClientRevenueTracker() {
  const [sidebar, setSidebar] = useState(() => window.innerWidth >= 1200);
  const [data, setData] = useState<Data>(empty);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [section, setSection] = useState<"batches" | "clients">("batches");
  const [filter, setFilter] = useState<Filter>("active");
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [detail, setDetail] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [next, setNext] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      setData(await request<Data>("/"));
    } catch (e) {
      setLoadError(errorText(e));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const rows = useMemo(
    () =>
      data.batches.map((batch) => ({
        batch,
        client: data.clients.find((c) => c.id === batch.clientId),
        m: batchOperations(
          batch,
          data.payments,
          data.deliveries,
          data.settlements,
        ),
      })),
    [data],
  );
  const active = rows.filter((r) => r.batch.status === "active");
  const collectible = rows.filter((r) =>
    ["active", "completed", "settled"].includes(r.batch.status),
  );
  const remaining = collectible.reduce((s, r) => s + r.m.remaining, 0);
  const attention = active.filter((r) => r.m.needsConfirmation);
  const month = todayIN().slice(0, 7);
  const received = data.payments
    .filter((p) => p.date.startsWith(month))
    .reduce((s, p) => s + p.amount, 0);
  const filterCounts = {
    active: active.length,
    attention: attention.length,
    balance: collectible.filter((r) => r.m.remaining > 0).length,
    completed: rows.filter((r) =>
      ["completed", "settled"].includes(r.batch.status),
    ).length,
    all: rows.length,
  };
  const visible = rows
    .filter((r) => {
      if (clientFilter && r.batch.clientId !== clientFilter) return false;
      if (
        !`${r.client?.name} ${r.batch.batchName} ${r.batch.notes || ""}`
          .toLowerCase()
          .includes(search.toLowerCase())
      )
        return false;
      return (
        filter === "all" ||
        (filter === "active" && r.batch.status === "active") ||
        (filter === "attention" && r.m.needsConfirmation) ||
        (filter === "balance" &&
          ["active", "completed", "settled"].includes(r.batch.status) &&
          r.m.remaining > 0) ||
        (filter === "completed" &&
          ["completed", "settled"].includes(r.batch.status))
      );
    })
    .sort(
      (a, b) =>
        Number(b.m.overdue) - Number(a.m.overdue) ||
        Number(b.m.needsConfirmation) - Number(a.m.needsConfirmation) ||
        b.batch.startDate.localeCompare(a.batch.startDate),
    );
  const selected = rows.find((r) => r.batch.id === detail);
  const target = rows.find(
    (r) => r.batch.id === (modal?.batchId || form.batchId),
  );
  const set = (key: string, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  function open(kind: Action, batchId?: string, clientId?: string) {
    const batch = data.batches.find((b) => b.id === batchId);
    const client = data.clients.find(
      (c) => c.id === (clientId || batch?.clientId),
    );
    const m = batch
      ? batchOperations(batch, data.payments, data.deliveries, data.settlements)
      : undefined;
    setModal({ kind, batchId, clientId });
    setFormError("");
    setNext(true);
    setForm({
      clientId: clientId || batch?.clientId || "",
      batchId: batchId || "",
      name: client?.name || "",
      contactName: client?.contactName || "",
      contactEmail: client?.contactEmail || "",
      contactPhone: client?.contactPhone || "",
      clientNotes: client?.notes || "",
      batchName: batch?.batchName || "",
      committedVideos: batch ? String(batch.committedVideos) : "",
      committedValue: batch ? String(batch.committedValue) : "",
      startDate: batch?.startDate || todayIN(),
      expectedEndDate: batch?.expectedEndDate || "",
      notes: kind === "edit-batch" ? batch?.notes || "" : "",
      date: todayIN(),
      receivedIn: "Business",
      amount: "",
      total: m ? String(m.videosDelivered) : "",
      fromAccount: "Business",
      toAccount: "Personal",
      baseline: m ? String(m.videosDelivered) : "",
    });
  }
  function chooseBatch(id: string) {
    const r = rows.find((r) => r.batch.id === id);
    setForm((p) => ({
      ...p,
      batchId: id,
      total: r ? String(r.m.videosDelivered) : "",
      baseline: r ? String(r.m.videosDelivered) : "",
      amount: "",
    }));
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!modal || busy) return;
    setFormError("");
    setBusy(true);
    const kind = modal.kind;
    try {
      if (kind === "client" || kind === "edit-client") {
        if (!form.name.trim()) throw new Error("Enter a client name.");
        if (
          data.clients.some(
            (c) =>
              c.id !== modal.clientId &&
              c.name.trim().toLowerCase() === form.name.trim().toLowerCase(),
          )
        )
          throw new Error(
            "This client already exists. Select them when creating a batch.",
          );
        const saved = await request<Client>(
          kind === "client" ? "/clients" : `/clients/${modal.clientId}`,
          kind === "client" ? "POST" : "PUT",
          {
            name: form.name.trim(),
            contactName: form.contactName.trim(),
            contactEmail: form.contactEmail.trim(),
            contactPhone: form.contactPhone.trim(),
            notes: form.clientNotes.trim(),
          },
        );
        setData((p) => ({
          ...p,
          clients:
            kind === "client"
              ? [saved, ...p.clients]
              : p.clients.map((c) => (c.id === saved.id ? saved : c)),
        }));
        setNotice(`${saved.name} ${kind === "client" ? "added" : "updated"}.`);
        if (kind === "client" && next) {
          setModal({ kind: "batch", clientId: saved.id });
          setForm({
            ...form,
            clientId: saved.id,
            batchName: "",
            committedVideos: "",
            committedValue: "",
            notes: "",
            startDate: todayIN(),
            expectedEndDate: "",
          });
          setNext(true);
          return;
        }
      } else if (kind === "batch" || kind === "edit-batch") {
        const count = Number(form.committedVideos),
          value = Number(form.committedValue);
        if (!form.clientId || !form.batchName.trim())
          throw new Error("Choose a client and enter a batch name.");
        if (!Number.isInteger(count) || count <= 0)
          throw new Error("Enter a whole number of videos greater than zero.");
        if (!Number.isFinite(value) || value <= 0)
          throw new Error("Enter a total price greater than zero.");
        if (
          kind === "edit-batch" &&
          target &&
          target.batch.status !== "active" &&
          count !== target.batch.committedVideos
        )
          throw new Error(
            "Video counts on closed batches cannot be changed here. Payment and delivery history is preserved.",
          );
        if (form.expectedEndDate && form.expectedEndDate < form.startDate)
          throw new Error(
            "The expected delivery date must be on or after the start date.",
          );
        if (
          (kind === "batch" || target?.batch.status === "active") &&
          data.batches.some(
            (b) =>
              b.clientId === form.clientId &&
              b.status === "active" &&
              b.id !== modal.batchId,
          )
        )
          throw new Error(
            "This client already has an active batch. Open it to update delivery, or end it before starting another.",
          );
        const saved = await request<Batch>(
          kind === "batch" ? "/batches" : `/batches/${modal.batchId}`,
          kind === "batch" ? "POST" : "PUT",
          {
            clientId: form.clientId,
            batchName: form.batchName.trim(),
            committedVideos: count,
            committedValue: value,
            startDate: form.startDate,
            expectedEndDate: form.expectedEndDate,
            notes: form.notes.trim(),
          },
        );
        setData((p) => ({
          ...p,
          batches:
            kind === "batch"
              ? [saved, ...p.batches]
              : p.batches.map((b) => (b.id === saved.id ? saved : b)),
        }));
        setNotice(
          `${saved.batchName} ${kind === "batch" ? "created" : "updated"}.`,
        );
        setSection("batches");
        setFilter("active");
        setClientFilter("");
        setSearch("");
        setDetail(saved.id);
        if (kind === "batch" && next) {
          setModal({ kind: "payment", batchId: saved.id });
          setForm({
            ...form,
            batchId: saved.id,
            amount: "",
            notes: "",
            date: todayIN(),
            receivedIn: "Business",
          });
          return;
        }
      } else {
        if (!target) throw new Error("Choose a batch first.");
        const batch = target.batch;
        if (kind === "payment") {
          const amount = Number(form.amount);
          if (!Number.isFinite(amount) || amount <= 0)
            throw new Error("Enter the actual amount received.");
          if (form.date > todayIN())
            throw new Error("A received payment cannot have a future date.");
          const saved = await request<Payment>("/payments", "POST", {
            batchId: batch.id,
            amount,
            date: form.date,
            receivedIn: form.receivedIn,
            notes: form.notes.trim(),
          });
          setData((p) => ({ ...p, payments: [saved, ...p.payments] }));
          setNotice(
            `${money(amount)} recorded for ${target.client?.name} in ${form.receivedIn}.`,
          );
        } else if (kind === "delivery") {
          const total = Number(form.total),
            baseline = Number(form.baseline);
          if (
            !Number.isInteger(total) ||
            total <= baseline ||
            total > batch.committedVideos
          )
            throw new Error(
              `Enter a new total between ${baseline + 1} and ${batch.committedVideos}. This adds only the difference to the history.`,
            );
          if (form.date > todayIN())
            throw new Error("Delivered work cannot have a future date.");
          // Refresh before converting a running total into an additive delivery entry.
          const latest = await request<Data>("/");
          const latestTotal = latest.deliveries
            .filter((d) => d.batchId === batch.id)
            .reduce((s, d) => s + d.videosCompleted, 0);
          setData(latest);
          if (latestTotal !== baseline) {
            set("baseline", String(latestTotal));
            throw new Error(
              `Another update changed the delivered total to ${latestTotal}. Review your total before saving again.`,
            );
          }
          const saved = await request<DeliveryLog>("/deliveries", "POST", {
            batchId: batch.id,
            videosCompleted: total - baseline,
            date: form.date,
            notes: form.notes.trim(),
          });
          setData((p) => ({
            ...p,
            deliveries: [saved, ...p.deliveries],
            batches: p.batches.map((b) =>
              b.id === batch.id && total === batch.committedVideos
                ? { ...b, status: "completed" }
                : b,
            ),
          }));
          setNotice(
            `${target.client?.name}: ${total} of ${batch.committedVideos} videos recorded as delivered.`,
          );
        } else if (kind === "settlement") {
          const amount = Number(form.amount);
          if (
            !Number.isFinite(amount) ||
            amount <= 0 ||
            amount > target.m.unsettledEarned
          )
            throw new Error(
              "Enter an amount within the available estimated earned revenue.",
            );
          if (form.fromAccount === form.toAccount)
            throw new Error(
              "Choose different source and destination accounts.",
            );
          const saved = await request<Settlement>("/settlements", "POST", {
            batchId: batch.id,
            amount,
            date: form.date,
            fromAccount: form.fromAccount,
            toAccount: form.toAccount,
            notes: form.notes.trim(),
          });
          setData((p) => ({
            ...p,
            settlements: [saved, ...p.settlements],
            batches: p.batches.map((b) =>
              b.id === batch.id &&
              b.status === "completed" &&
              amount === target.m.unsettledEarned
                ? { ...b, status: "settled" }
                : b,
            ),
          }));
          setNotice("Internal settlement recorded.");
        } else if (kind === "end") {
          if (!form.notes.trim())
            throw new Error("Enter the reason for ending this batch.");
          const saved = await request<Batch>(
            `/batches/${batch.id}/end`,
            "PATCH",
            { reason: form.notes.trim() },
          );
          setData((p) => ({
            ...p,
            batches: p.batches.map((b) => (b.id === saved.id ? saved : b)),
          }));
          setNotice(
            "Batch ended. Its payment and delivery history is preserved.",
          );
        }
      }
      setModal(null);
    } catch (e) {
      setFormError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  const titles: Record<Action, string> = {
    client: "Add a client",
    batch: "Create a batch",
    payment: "Record payment",
    delivery: "Update delivery",
    "edit-client": "Edit client",
    "edit-batch": "Edit batch",
    settlement: "Record internal settlement",
    end: "End batch early",
  };
  const field = (
    key: string,
    label: string,
    type = "text",
    required = false,
  ) => (
    <label className="ro-field">
      {label}
      <input
        name={key}
        type={type}
        value={form[key] || ""}
        onChange={(e) => set(key, e.target.value)}
        required={required}
        step={type === "number" ? "any" : undefined}
      />
    </label>
  );
  const statusBadge = (label: string, tone = "") => (
    <span className={`ro-badge ${tone}`}>{label}</span>
  );
  const paymentBadge = (m: ReturnType<typeof batchOperations>) =>
    statusBadge(
      m.paymentStatus,
      m.paymentStatus === "Fully paid"
        ? "green"
        : m.paymentStatus === "Part-paid"
          ? "amber"
          : m.paymentStatus === "Overpaid"
            ? "blue"
            : "neutral",
    );
  const showBalance = (m: ReturnType<typeof batchOperations>) =>
    m.credit > 0
      ? `${money(m.credit)} credit`
      : `${money(m.remaining)} remaining`;

  return (
    <div className="dashboard revenue-ops">
      <Navbar toggleSidebar={() => setSidebar(!sidebar)} />
      <div className="dashboard-body">
        <Sidebar isOpen={sidebar} currentPage="client-revenue" />
        <main className="dashboard-main ro-main" id="client-operations">
          <header className="ro-header">
            <div>
              <p className="ro-eyebrow">FINTRACK / CLIENT OPERATIONS</p>
              <h1>Clients & revenue</h1>
              <p>Know what’s paid. See what’s delivered. Take the next step.</p>
            </div>
            <div className="ro-header-actions">
              <button
                className="ro-button"
                onClick={() => open("client")}
                disabled={loading || !!loadError}
              >
                ＋ Add client
              </button>
              <button
                className="ro-button primary"
                onClick={() => open("batch")}
                disabled={loading || !!loadError}
              >
                ＋ Create batch
              </button>
            </div>
          </header>
          {notice && (
            <div className="ro-success" role="status">
              {notice}
              <button
                aria-label="Dismiss notification"
                onClick={() => setNotice("")}
              >
                ×
              </button>
            </div>
          )}
          {loadError ? (
            <div role="alert" className="ro-error">
              {loadError}{" "}
              <button className="ro-button" onClick={() => void load()}>
                Try again
              </button>
            </div>
          ) : loading ? (
            <div
              className="ro-skeleton"
              aria-label="Loading clients and batches"
            >
              <div />
              <div />
              <div />
            </div>
          ) : (
            <>
              <section className="ro-summary" aria-label="At a glance">
                <button
                  onClick={() => {
                    setFilter("active");
                    setSection("batches");
                    setClientFilter("");
                    setSearch("");
                    setDetail(null);
                  }}
                >
                  <span>Active batches</span>
                  <strong>{active.length}</strong>
                  <small>
                    {active.reduce((s, r) => s + r.m.pendingVideos, 0)} videos
                    remaining in records
                  </small>
                </button>
                <button
                  onClick={() => {
                    setFilter("balance");
                    setSection("batches");
                    setClientFilter("");
                    setSearch("");
                    setDetail(null);
                  }}
                >
                  <span>Remaining contract balance</span>
                  <strong>{money(remaining)}</strong>
                  <small>Across active and completed batches</small>
                </button>
                <div>
                  <span>Received this month</span>
                  <strong>{money(received)}</strong>
                  <small>
                    {new Date().toLocaleDateString("en-IN", {
                      month: "long",
                      year: "numeric",
                      timeZone: "Asia/Kolkata",
                    })}{" "}
                    · all accounts
                  </small>
                </div>
                <button
                  className="ro-attention-stat"
                  onClick={() => {
                    setFilter("attention");
                    setSection("batches");
                    setClientFilter("");
                    setSearch("");
                    setDetail(null);
                  }}
                >
                  <span>Delivery checks</span>
                  <strong>{attention.length}</strong>
                  <small>Missing or older delivery updates</small>
                </button>
              </section>
              <div className="ro-workbar">
                <div className="ro-sections" aria-label="View">
                  <button
                    className={section === "batches" ? "selected" : ""}
                    onClick={() => {
                      setSection("batches");
                      setDetail(null);
                    }}
                  >
                    Batches <span>{rows.length}</span>
                  </button>
                  <button
                    className={section === "clients" ? "selected" : ""}
                    onClick={() => {
                      setSection("clients");
                      setDetail(null);
                    }}
                  >
                    Clients <span>{data.clients.length}</span>
                  </button>
                </div>
                <div className="ro-quick">
                  <button className="ro-button" onClick={() => open("payment")}>
                    Record payment
                  </button>
                  <button
                    className="ro-button"
                    onClick={() => open("delivery")}
                  >
                    Update delivery
                  </button>
                </div>
              </div>
              {section === "batches" && selected ? (
                <section className="ro-detail">
                  <button className="ro-back" onClick={() => setDetail(null)}>
                    ← All batches
                  </button>
                  <div className="ro-detail-heading">
                    <div>
                      <p className="ro-eyebrow">{selected.client?.name}</p>
                      <h2>{selected.batch.batchName}</h2>
                      <p>
                        Started {formatDate(selected.batch.startDate)}
                        {selected.batch.expectedEndDate
                          ? ` · Expected ${formatDate(selected.batch.expectedEndDate)}`
                          : ""}
                      </p>
                    </div>
                    <button
                      className="ro-button"
                      onClick={() => open("edit-batch", selected.batch.id)}
                    >
                      Edit batch
                    </button>
                  </div>
                  <div className="ro-detail-grid">
                    <section className="ro-panel">
                      <div className="ro-panel-heading">
                        <h3>Payment</h3>
                        {paymentBadge(selected.m)}
                      </div>
                      <dl>
                        <div>
                          <dt>Total price</dt>
                          <dd>{money(selected.batch.committedValue)}</dd>
                        </div>
                        <div>
                          <dt>Received</dt>
                          <dd>{money(selected.m.cashReceived)}</dd>
                        </div>
                        <div className="ro-balance-line">
                          <dt>Remaining balance</dt>
                          <dd>{money(selected.m.remaining)}</dd>
                        </div>
                        {selected.m.credit > 0 && (
                          <div>
                            <dt>Client credit</dt>
                            <dd>{money(selected.m.credit)}</dd>
                          </div>
                        )}
                      </dl>
                      {selected.m.fxAdjusted && (
                        <p className="ro-help">
                          {money(Math.abs(selected.m.conversionDifference))}{" "}
                          conversion difference ignored. Original receipts are
                          retained.
                        </p>
                      )}
                      <button
                        className="ro-button primary"
                        onClick={() => open("payment", selected.batch.id)}
                      >
                        Record payment
                      </button>
                    </section>
                    <section className="ro-panel">
                      <div className="ro-panel-heading">
                        <h3>Delivery</h3>
                        {statusBadge(
                          selected.m.deliveryStatus,
                          selected.m.pendingVideos === 0 ? "green" : "neutral",
                        )}
                      </div>
                      <p className="ro-delivery-number">
                        <strong>{selected.m.videosDelivered}</strong> /{" "}
                        {selected.batch.committedVideos} videos
                      </p>
                      <progress
                        value={selected.m.videosDelivered}
                        max={selected.batch.committedVideos}
                        aria-label="Videos delivered"
                      />
                      <p className="ro-help">
                        {selected.m.lastDelivery
                          ? `Last delivery recorded ${formatDate(selected.m.lastDelivery)}.`
                          : "No delivery update has been recorded. Confirm with the team before updating."}
                      </p>
                      {selected.m.needsConfirmation && (
                        <p className="ro-warning">
                          {selected.m.nextStep}. Records may be incomplete.
                        </p>
                      )}
                      <button
                        className="ro-button primary"
                        disabled={
                          selected.batch.status !== "active" ||
                          selected.m.pendingVideos === 0
                        }
                        onClick={() => open("delivery", selected.batch.id)}
                      >
                        Update delivery
                      </button>
                    </section>
                  </div>
                  <section className="ro-panel ro-scope">
                    <h3>Scope & notes</h3>
                    <p>
                      {selected.batch.notes ||
                        "No scope notes added. Use Edit batch to describe the formats and services included."}
                    </p>
                  </section>
                  <section className="ro-panel">
                    <h3>Payment & delivery history</h3>
                    <div className="ro-history">
                      {[
                        ...data.payments
                          .filter((p) => p.batchId === detail)
                          .map((p) => ({
                            id: "p" + p.id,
                            date: p.date,
                            title: `${money(p.amount)} received`,
                            meta: `${p.receivedIn} account`,
                            notes: p.notes,
                          })),
                        ...data.deliveries
                          .filter((d) => d.batchId === detail)
                          .map((d) => ({
                            id: "d" + d.id,
                            date: d.date,
                            title: `${d.videosCompleted} videos delivered`,
                            meta: "Delivery update",
                            notes: d.notes,
                          })),
                      ]
                        .sort((a, b) => b.date.localeCompare(a.date))
                        .map((item) => (
                          <article key={item.id}>
                            <time>{formatDate(item.date)}</time>
                            <div>
                              <strong>{item.title}</strong>
                              <span>{item.meta}</span>
                              {item.notes && <p>{item.notes}</p>}
                            </div>
                          </article>
                        ))}
                      {!data.payments.some((p) => p.batchId === detail) &&
                        !data.deliveries.some((d) => d.batchId === detail) && (
                          <p className="ro-help">
                            No activity yet. Record a payment or update delivery
                            above.
                          </p>
                        )}
                    </div>
                  </section>
                  <details className="ro-panel ro-accounting">
                    <summary>Accounting details & internal settlements</summary>
                    <p className="ro-help">
                      Earned revenue is an estimate: total package price × the
                      fraction of videos delivered. It does not value long
                      forms, short forms, hosting or posting separately.
                      Internal settlements do not change what the client has
                      paid.
                    </p>
                    <dl>
                      <div>
                        <dt>Estimated earned revenue</dt>
                        <dd>{money(selected.m.earnedRevenue)}</dd>
                      </div>
                      <div>
                        <dt>Estimated delivered work unpaid</dt>
                        <dd>{money(selected.m.receivable)}</dd>
                      </div>
                      <div>
                        <dt>Paid toward undelivered work</dt>
                        <dd>{money(selected.m.unearnedAdvance)}</dd>
                      </div>
                      <div>
                        <dt>Internal settlements recorded</dt>
                        <dd>{money(selected.m.settledAmount)}</dd>
                      </div>
                    </dl>
                    <button
                      className="ro-button"
                      disabled={selected.m.unsettledEarned <= 0}
                      onClick={() => open("settlement", selected.batch.id)}
                    >
                      Record internal settlement
                    </button>
                    {data.settlements
                      .filter((s) => s.batchId === detail)
                      .map((s) => (
                        <p key={s.id}>
                          {formatDate(s.date)} · {money(s.amount)} ·{" "}
                          {s.fromAccount} → {s.toAccount}
                          {s.notes ? ` · ${s.notes}` : ""}
                        </p>
                      ))}
                    {selected.batch.status === "active" && (
                      <div className="ro-end">
                        <button
                          className="ro-button danger"
                          onClick={() => open("end", selected.batch.id)}
                        >
                          End batch early
                        </button>
                        <small>
                          Preserves history. Review the final price with the
                          client.
                        </small>
                      </div>
                    )}
                    {selected.batch.endedEarlyReason && (
                      <p>Ended early: {selected.batch.endedEarlyReason}</p>
                    )}
                  </details>
                </section>
              ) : (
                <>
                  <div className="ro-tools">
                    <label className="ro-search">
                      <span className="ro-sr">Search clients or batches</span>
                      <input
                        placeholder={
                          section === "clients"
                            ? "Search clients…"
                            : "Search clients, batches or scope…"
                        }
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </label>
                    {section === "batches" && (
                      <label>
                        <span className="ro-sr">Filter by client</span>
                        <select
                          value={clientFilter}
                          onChange={(e) => setClientFilter(e.target.value)}
                        >
                          <option value="">All clients</option>
                          {data.clients.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    <button
                      className="ro-text-button"
                      onClick={() => void load()}
                    >
                      Refresh
                    </button>
                  </div>
                  {section === "batches" ? (
                    <>
                      <nav className="ro-filters" aria-label="Filter batches">
                        {(
                          [
                            ["active", "Active"],
                            ["attention", "Needs delivery check"],
                            ["balance", "Balance remaining"],
                            ["completed", "Delivered"],
                            ["all", "All batches"],
                          ] as [Filter, string][]
                        ).map(([key, label]) => (
                          <button
                            key={key}
                            aria-pressed={filter === key}
                            onClick={() => setFilter(key)}
                          >
                            {label}
                            <span>{filterCounts[key]}</span>
                          </button>
                        ))}
                      </nav>
                      <p className="ro-caption">
                        {visible.length}{" "}
                        {visible.length === 1 ? "batch" : "batches"} · Delivery
                        counts reflect recorded updates, not a live production
                        feed.
                      </p>
                      <div className="ro-batch-list">
                        <div className="ro-table-head">
                          <span>Client & batch</span>
                          <span>Payment</span>
                          <span>Delivery</span>
                          <span>Next step</span>
                        </div>
                        {visible.map(({ batch, client, m }) => (
                          <article className="ro-batch" key={batch.id}>
                            <div className="ro-identity">
                              <div className="ro-monogram" aria-hidden="true">
                                {(client?.name || "?")
                                  .split(" ")
                                  .map((n) => n[0])
                                  .slice(0, 2)
                                  .join("")}
                              </div>
                              <div>
                                <button
                                  className="ro-name"
                                  onClick={() => setDetail(batch.id)}
                                >
                                  {client?.name || "Client"}
                                </button>
                                <p>{batch.batchName}</p>
                                <small>
                                  {batch.expectedEndDate
                                    ? `Expected ${formatDate(batch.expectedEndDate)}`
                                    : `Started ${formatDate(batch.startDate)}`}
                                </small>
                                {!["active", "completed", "settled"].includes(
                                  batch.status,
                                ) && statusBadge(m.deliveryStatus)}
                              </div>
                            </div>
                            <div className="ro-payment-cell">
                              {paymentBadge(m)}
                              <p>
                                <strong>{money(m.cashReceived)}</strong>{" "}
                                <span>of {money(batch.committedValue)}</span>
                              </p>
                              <small
                                className={
                                  m.remaining > 0 ? "ro-amount-due" : ""
                                }
                              >
                                {showBalance(m)}
                              </small>
                              {m.fxAdjusted && (
                                <small className="ro-fx">
                                  Conversion difference ignored
                                </small>
                              )}
                            </div>
                            <div className="ro-delivery-cell">
                              <strong>
                                {m.videosDelivered}
                                <span> / {batch.committedVideos} videos</span>
                              </strong>
                              <progress
                                value={m.videosDelivered}
                                max={batch.committedVideos}
                                aria-label={`${client?.name} videos delivered`}
                              />
                              <small>
                                {m.lastDelivery
                                  ? `Last update ${formatDate(m.lastDelivery)}`
                                  : "No delivery recorded"}
                              </small>
                              {m.overdue &&
                                statusBadge("Past expected date", "amber")}
                            </div>
                            <div className="ro-next">
                              <p
                                className={m.needsConfirmation ? "ro-flag" : ""}
                              >
                                {m.nextStep}
                              </p>
                              <div className="ro-row-actions">
                                <button
                                  onClick={() => open("payment", batch.id)}
                                  aria-label={`Record payment for ${client?.name}, ${batch.batchName}`}
                                >
                                  Record payment
                                </button>
                                <button
                                  disabled={
                                    batch.status !== "active" ||
                                    m.pendingVideos === 0
                                  }
                                  onClick={() => open("delivery", batch.id)}
                                  aria-label={`Update delivery for ${client?.name}, ${batch.batchName}`}
                                >
                                  Update delivery
                                </button>
                              </div>
                              <button
                                className="ro-text-button"
                                onClick={() => setDetail(batch.id)}
                              >
                                Details & history →
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                      {visible.length === 0 && (
                        <div className="ro-empty">
                          <h3>
                            {rows.length
                              ? "No batches match this view"
                              : "Start with your first batch"}
                          </h3>
                          <p>
                            {rows.length
                              ? "Try another filter or clear your search."
                              : "Add a client, create their batch, then record payment and delivery as they happen."}
                          </p>
                          <button
                            className="ro-button"
                            onClick={() => {
                              setSearch("");
                              setClientFilter("");
                              setFilter("all");
                            }}
                          >
                            Show all batches
                          </button>
                          <button
                            className="ro-button primary"
                            onClick={() => open("batch")}
                          >
                            Create batch
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="ro-client-list">
                      {data.clients
                        .filter((c) =>
                          `${c.name} ${c.contactName || ""}`
                            .toLowerCase()
                            .includes(search.toLowerCase()),
                        )
                        .map((c) => {
                          const clientRows = rows.filter(
                            (r) => r.batch.clientId === c.id,
                          );
                          const current = clientRows.find(
                            (r) => r.batch.status === "active",
                          );
                          return (
                            <article className="ro-client" key={c.id}>
                              <div>
                                <p className="ro-eyebrow">
                                  {c.status === "active"
                                    ? "CLIENT"
                                    : "INACTIVE CLIENT"}
                                </p>
                                <h3>{c.name}</h3>
                                <p>
                                  {c.contactName || "No contact person added"}
                                </p>
                                {c.contactEmail && <p>{c.contactEmail}</p>}
                                <small>
                                  {clientRows.length} batches ·{" "}
                                  {money(
                                    clientRows
                                      .filter((r) =>
                                        [
                                          "active",
                                          "completed",
                                          "settled",
                                        ].includes(r.batch.status),
                                      )
                                      .reduce((s, r) => s + r.m.remaining, 0),
                                  )}{" "}
                                  remaining
                                </small>
                              </div>
                              <div>
                                <p>
                                  {current
                                    ? `Active: ${current.batch.batchName}`
                                    : "No active batch"}
                                </p>
                                <div className="ro-row-actions">
                                  {current ? (
                                    <button
                                      onClick={() => {
                                        setSection("batches");
                                        setDetail(current.batch.id);
                                      }}
                                    >
                                      Open active batch
                                    </button>
                                  ) : (
                                    <button
                                      disabled={c.status !== "active"}
                                      onClick={() =>
                                        open("batch", undefined, c.id)
                                      }
                                    >
                                      ＋ Create batch
                                    </button>
                                  )}
                                  <button
                                    onClick={() =>
                                      open("edit-client", undefined, c.id)
                                    }
                                  >
                                    Edit client
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSection("batches");
                                      setClientFilter(c.id);
                                      setSearch("");
                                      setFilter("all");
                                    }}
                                  >
                                    View history
                                  </button>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      {data.clients.length === 0 && (
                        <div className="ro-empty">
                          <h3>Add your first client</h3>
                          <p>
                            Start with a name. You can add contact details
                            later.
                          </p>
                          <button
                            className="ro-button primary"
                            onClick={() => open("client")}
                          >
                            Add client
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
              <footer className="ro-footer">
                <span>
                  Conversion differences below ₹50 are ignored in remaining
                  balances and credit alerts.
                </span>
                <span>Actual payment amounts stay unchanged.</span>
              </footer>
            </>
          )}
        </main>
      </div>
      {modal && (
        <OperationsDialog
          title={titles[modal.kind]}
          subtitle={
            target
              ? `${target.client?.name} · ${target.batch.batchName}`
              : modal.kind === "client"
                ? "A client is the person or business you work with."
                : modal.kind === "batch"
                  ? "A batch is one agreed package of videos and services."
                  : undefined
          }
          busy={busy}
          onClose={() => setModal(null)}
        >
          <form onSubmit={submit} className="ro-form">
            {formError && (
              <div className="ro-error" role="alert">
                {formError}
              </div>
            )}
            <fieldset disabled={busy}>
              {(modal.kind === "client" || modal.kind === "edit-client") && (
                <>
                  {field("name", "Client name", "text", true)}
                  {field("contactName", "Contact person")}
                  <details>
                    <summary>Contact details & notes (optional)</summary>
                    <div className="ro-form-grid">
                      {field("contactEmail", "Email", "email")}
                      {field("contactPhone", "Phone", "tel")}
                    </div>
                    <label className="ro-field">
                      Notes
                      <textarea
                        value={form.clientNotes}
                        onChange={(e) => set("clientNotes", e.target.value)}
                      />
                    </label>
                  </details>
                  {modal.kind === "client" && (
                    <label className="ro-check">
                      <input
                        type="checkbox"
                        checked={next}
                        onChange={(e) => setNext(e.target.checked)}
                      />
                      Create their first batch next
                    </label>
                  )}
                </>
              )}
              {(modal.kind === "batch" || modal.kind === "edit-batch") && (
                <>
                  <label className="ro-field">
                    Client
                    <select
                      value={form.clientId}
                      onChange={(e) => set("clientId", e.target.value)}
                      required
                    >
                      <option value="">Choose client</option>
                      {data.clients
                        .filter(
                          (c) =>
                            c.status === "active" || c.id === form.clientId,
                        )
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                            {data.batches.some(
                              (b) =>
                                b.clientId === c.id &&
                                b.status === "active" &&
                                b.id !== modal.batchId,
                            )
                              ? " · already has an active batch"
                              : ""}
                          </option>
                        ))}
                    </select>
                  </label>
                  {!data.clients.length && (
                    <p className="ro-help">
                      Add a client first.{" "}
                      <button
                        type="button"
                        className="ro-text-button"
                        onClick={() => open("client")}
                      >
                        Add client
                      </button>
                    </p>
                  )}
                  {field("batchName", "Batch name", "text", true)}
                  <div className="ro-form-grid">
                    {field("committedVideos", "Total videos", "number", true)}
                    {field(
                      "committedValue",
                      "Total package price (₹)",
                      "number",
                      true,
                    )}
                  </div>
                  <label className="ro-field">
                    Scope & services
                    <textarea
                      placeholder="Describe short forms, long forms, host, posting and other included work."
                      value={form.notes}
                      onChange={(e) => set("notes", e.target.value)}
                    />
                  </label>
                  <p className="ro-help">
                    Enter the combined video count. Keep formats and other
                    services in the scope above. Package price includes all
                    services.
                  </p>
                  <div className="ro-form-grid">
                    {field("startDate", "Start date", "date", true)}
                    {field("expectedEndDate", "Expected delivery date", "date")}
                  </div>
                  {modal.kind === "batch" && (
                    <label className="ro-check">
                      <input
                        type="checkbox"
                        checked={next}
                        onChange={(e) => setNext(e.target.checked)}
                      />
                      Record a payment after creating this batch
                    </label>
                  )}
                </>
              )}
              {["payment", "delivery", "settlement", "end"].includes(
                modal.kind,
              ) && (
                <>
                  {!modal.batchId && (
                    <label className="ro-field">
                      Client & batch
                      <select
                        value={form.batchId}
                        onChange={(e) => chooseBatch(e.target.value)}
                        required
                      >
                        <option value="">Choose a batch</option>
                        {rows
                          .filter(
                            (r) =>
                              modal.kind !== "delivery" ||
                              r.batch.status === "active",
                          )
                          .map((r) => (
                            <option key={r.batch.id} value={r.batch.id}>
                              {r.client?.name} · {r.batch.batchName}
                            </option>
                          ))}
                      </select>
                    </label>
                  )}
                  {modal.kind === "payment" && (
                    <>
                      {target && (
                        <div className="ro-form-context">
                          <span>
                            Total {money(target.batch.committedValue)}
                          </span>
                          <span>Received {money(target.m.cashReceived)}</span>
                          <strong>{showBalance(target.m)}</strong>
                        </div>
                      )}
                      <div className="ro-form-grid">
                        {field("amount", "Amount received (₹)", "number", true)}
                        {field("date", "Payment date", "date", true)}
                      </div>
                      {target && target.m.remaining > 0 && (
                        <button
                          type="button"
                          className="ro-text-button"
                          onClick={() =>
                            set("amount", String(target.m.remaining))
                          }
                        >
                          Use remaining balance: {money(target.m.remaining)}
                        </button>
                      )}
                      <label className="ro-field">
                        Received in
                        <select
                          value={form.receivedIn}
                          onChange={(e) => set("receivedIn", e.target.value)}
                        >
                          {accounts.map((a) => (
                            <option key={a}>{a}</option>
                          ))}
                        </select>
                      </label>
                      <p className="ro-help">
                        Record only money already received. Full or partial
                        status updates automatically.
                      </p>
                    </>
                  )}
                  {modal.kind === "delivery" && (
                    <>
                      {target && (
                        <div className="ro-form-context">
                          <span>
                            Currently recorded: {form.baseline} /{" "}
                            {target.batch.committedVideos}
                          </span>
                          <strong>
                            {target.batch.committedVideos -
                              Number(form.baseline)}{" "}
                            still unrecorded
                          </strong>
                        </div>
                      )}
                      <div className="ro-form-grid">
                        {field(
                          "total",
                          "Total videos delivered so far",
                          "number",
                          true,
                        )}
                        {field("date", "Delivery date", "date", true)}
                      </div>
                      {target && (
                        <>
                          <button
                            type="button"
                            className="ro-text-button"
                            onClick={() =>
                              set("total", String(target.batch.committedVideos))
                            }
                          >
                            All {target.batch.committedVideos} videos delivered
                          </button>
                          <p className="ro-help">
                            {Number(form.total) > Number(form.baseline)
                              ? `This will add ${Number(form.total) - Number(form.baseline)} newly delivered videos to the history.`
                              : "Enter the new running total, not the number in the latest delivery."}{" "}
                            Only save after confirming delivery with the team.
                          </p>
                        </>
                      )}
                    </>
                  )}
                  {modal.kind === "settlement" && (
                    <>
                      <p className="ro-help">
                        Log an internal allocation that has already happened.
                        This does not transfer money or record a client payment.
                        Available estimated earned revenue:{" "}
                        {money(target?.m.unsettledEarned || 0)}.
                      </p>
                      <div className="ro-form-grid">
                        {field("amount", "Amount (₹)", "number", true)}
                        {field("date", "Settlement date", "date", true)}
                        {(["fromAccount", "toAccount"] as const).map((key) => (
                          <label className="ro-field" key={key}>
                            {key === "fromAccount"
                              ? "From account"
                              : "To account"}
                            <select
                              value={form[key]}
                              onChange={(e) => set(key, e.target.value)}
                            >
                              {accounts.map((a) => (
                                <option key={a}>{a}</option>
                              ))}
                            </select>
                          </label>
                        ))}
                      </div>
                    </>
                  )}
                  {modal.kind === "end" && (
                    <div className="ro-warning">
                      This stops further delivery updates and cannot be undone
                      here. {target?.m.videosDelivered} of{" "}
                      {target?.batch.committedVideos} videos are recorded.
                      Payments and history will be preserved; confirm the final
                      agreement separately.
                    </div>
                  )}
                  <label className="ro-field">
                    {modal.kind === "end"
                      ? "Reason for ending early"
                      : "Notes (optional)"}
                    <textarea
                      value={form.notes}
                      onChange={(e) => set("notes", e.target.value)}
                      required={modal.kind === "end"}
                    />
                  </label>
                </>
              )}
            </fieldset>
            <footer className="ro-form-actions">
              <button
                className="ro-button"
                type="button"
                disabled={busy}
                onClick={() => setModal(null)}
              >
                Cancel
              </button>
              <button
                className={`ro-button ${modal.kind === "end" ? "danger" : "primary"}`}
                type="submit"
                disabled={busy}
              >
                {busy
                  ? "Saving…"
                  : modal.kind === "client"
                    ? next
                      ? "Save client & create batch"
                      : "Save client"
                    : modal.kind === "batch"
                      ? next
                        ? "Create batch & add payment"
                        : "Create batch"
                      : modal.kind === "payment"
                        ? "Save payment"
                        : modal.kind === "delivery"
                          ? "Save delivery update"
                          : modal.kind === "end"
                            ? "End batch early"
                            : "Save changes"}
              </button>
            </footer>
          </form>
        </OperationsDialog>
      )}
    </div>
  );
}
