import React, { useState, useEffect, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend
} from "recharts";
import {
  LayoutDashboard, Receipt, RefreshCw, Banknote, Users, Settings,
  FileText, Search, Download, TrendingUp, TrendingDown,
  CheckCircle2, XCircle, Clock, CreditCard, Smartphone,
  Wallet, Building2, Bell, ChevronRight, Eye, AlertCircle
} from "lucide-react";
import {
  SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useUser, useAuth,
} from '@clerk/clerk-react';

import {
  getOverview, getTransactions, getTransaction,
  getRefunds, getSettlements, setTokenGetter,
} from "./api";

const BRAND = {
  name: "ACC Merchants",
  tagline: "Applied Cloud Computing",
  primary: "#0F2A4A", primaryLight: "#1E4976",
  accent: "#2EB5A1", accentSoft: "#E6F7F4",
  success: "#16A34A", danger: "#DC2626", warning: "#F59E0B",
  bg: "#F6F8FB", card: "#FFFFFF", text: "#0F172A",
  textMuted: "#64748B", border: "#E2E8F0",
};

const TXN_STATUS = ["SUCCESS", "FAILED", "PENDING", "REFUNDED"];
const METHODS = ["UPI", "CARD", "WALLET", "NETBANKING"];

const fmtINR = (n) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtINRCompact = (n) => {
  if (n >= 10000000) return "₹" + (n / 10000000).toFixed(2) + " Cr";
  if (n >= 100000) return "₹" + (n / 100000).toFixed(2) + " L";
  if (n >= 1000) return "₹" + (n / 1000).toFixed(1) + "K";
  return "₹" + n.toFixed(0);
};

const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", {
  day: "2-digit", month: "short", year: "numeric"
});

const fmtDateTime = (d) => {
  const date = new Date(d);
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) +
    ", " + date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

const methodIcon = (m) => {
  if (m === "UPI") return <Smartphone size={14} />;
  if (m === "CARD") return <CreditCard size={14} />;
  if (m === "WALLET") return <Wallet size={14} />;
  return <Building2 size={14} />;
};

const StatusBadge = ({ status }) => {
  const styles = {
    SUCCESS: { bg: "#DCFCE7", fg: "#166534", icon: <CheckCircle2 size={12} /> },
    FAILED: { bg: "#FEE2E2", fg: "#991B1B", icon: <XCircle size={12} /> },
    PENDING: { bg: "#FEF3C7", fg: "#92400E", icon: <Clock size={12} /> },
    REFUNDED: { bg: "#E0E7FF", fg: "#3730A3", icon: <RefreshCw size={12} /> },
    PROCESSED: { bg: "#DCFCE7", fg: "#166534", icon: <CheckCircle2 size={12} /> },
    INITIATED: { bg: "#FEF3C7", fg: "#92400E", icon: <Clock size={12} /> },
    CREDITED: { bg: "#DCFCE7", fg: "#166534", icon: <CheckCircle2 size={12} /> },
    PROCESSING: { bg: "#FEF3C7", fg: "#92400E", icon: <Clock size={12} /> },
  };
  const s = styles[status] || styles.PENDING;
  return (
    <span style={{
      background: s.bg, color: s.fg, padding: "3px 8px", borderRadius: 6,
      fontSize: 11, fontWeight: 600, display: "inline-flex", alignItems: "center",
      gap: 4, letterSpacing: 0.3,
    }}>
      {s.icon} {status}
    </span>
  );
};

const LoadingSpinner = () => (
  <div style={{ padding: 60, textAlign: "center", color: BRAND.textMuted, fontSize: 13 }}>
    Loading...
  </div>
);

const ErrorBox = ({ error, onRetry }) => (
  <div style={{
    padding: 24, margin: 24, background: "#FEF2F2", border: "1px solid #FECACA",
    borderRadius: 12, color: "#991B1B", display: "flex", gap: 12, alignItems: "flex-start",
  }}>
    <AlertCircle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>Could not load data</div>
      <div style={{ fontSize: 12, opacity: 0.8 }}>{error.message}</div>
      <div style={{ fontSize: 11, marginTop: 8, opacity: 0.7 }}>
        Make sure your backend is running.
      </div>
      {onRetry && (
        <button onClick={onRetry} style={{
          marginTop: 10, padding: "6px 14px", background: "#991B1B", color: "white",
          border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer",
        }}>Retry</button>
      )}
    </div>
  </div>
);

// ---------- Login (powered by Clerk) ----------
function LoginScreen() {
  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.primaryLight} 100%)`,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <div style={{
        background: "white", borderRadius: 16, padding: 40, width: "100%",
        maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 12,
            background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.accent})`,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            marginBottom: 16,
          }}>
            <span style={{ color: "white", fontWeight: 800, fontSize: 22 }}>ACC</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, color: BRAND.text, fontWeight: 700 }}>
            {BRAND.name}
          </h1>
          <p style={{ color: BRAND.textMuted, fontSize: 13, marginTop: 6 }}>
            Sign in or create your merchant account
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <SignInButton mode="modal">
            <button style={{
              width: "100%", padding: "12px 14px", background: BRAND.primary,
              color: "white", border: "none", borderRadius: 8, fontSize: 14,
              fontWeight: 600, cursor: "pointer",
            }}>
              Sign In
            </button>
          </SignInButton>

          <SignUpButton mode="modal">
            <button style={{
              width: "100%", padding: "12px 14px", background: "white",
              color: BRAND.primary, border: `1px solid ${BRAND.primary}`,
              borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}>
              Create Account
            </button>
          </SignUpButton>
        </div>

        <div style={{
          marginTop: 28, paddingTop: 20, borderTop: `1px solid ${BRAND.border}`,
          textAlign: "center", fontSize: 11, color: BRAND.textMuted,
        }}>
          Secure authentication · Powered by {BRAND.tagline}
        </div>
      </div>
    </div>
  );
}

// ---------- Sidebar ----------
function Sidebar({ current, onNavigate }) {
  const { user } = useUser();

  const items = [
    { id: "home", label: "Overview", icon: LayoutDashboard },
    { id: "transactions", label: "Transactions", icon: Receipt },
    { id: "refunds", label: "Refunds", icon: RefreshCw },
    { id: "settlements", label: "Settlements", icon: Banknote },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "users", label: "Team", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside style={{
      width: 240, background: BRAND.primary, color: "white",
      display: "flex", flexDirection: "column", flexShrink: 0
    }}>
      <div style={{ padding: "22px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: `linear-gradient(135deg, ${BRAND.accent}, #1D8E7F)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 13
          }}>ACC</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{BRAND.name}</div>
            <div style={{ fontSize: 10, opacity: 0.6 }}>{BRAND.tagline}</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: "16px 10px" }}>
        {items.map((it) => {
          const Icon = it.icon;
          const active = current === it.id;
          return (
            <button key={it.id} onClick={() => onNavigate(it.id)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "10px 14px", marginBottom: 4, borderRadius: 8,
                background: active ? "rgba(46,181,161,0.15)" : "transparent",
                border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500,
                color: active ? BRAND.accent : "rgba(255,255,255,0.75)",
                textAlign: "left"
              }}>
              <Icon size={17} /> {it.label}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: 14, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{
          padding: 12, background: "rgba(255,255,255,0.06)",
          borderRadius: 8, display: "flex", alignItems: "center", gap: 10,
        }}>
          <UserButton afterSignOutUrl="/" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 12, fontWeight: 600,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {user?.fullName || user?.primaryEmailAddress?.emailAddress || 'User'}
            </div>
            <div style={{ fontSize: 10, opacity: 0.6 }}>Merchant Admin</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ---------- Topbar ----------
function Topbar({ title }) {
  return (
    <div style={{
      padding: "18px 28px", background: "white",
      borderBottom: `1px solid ${BRAND.border}`, display: "flex",
      alignItems: "center", justifyContent: "space-between"
    }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: BRAND.text }}>{title}</h1>
        <div style={{ fontSize: 12, color: BRAND.textMuted, marginTop: 2 }}>
          {fmtDate(new Date())}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button style={{
          background: "transparent", border: `1px solid ${BRAND.border}`,
          padding: 8, borderRadius: 8, cursor: "pointer", position: "relative"
        }}>
          <Bell size={16} color={BRAND.textMuted} />
          <span style={{
            position: "absolute", top: 4, right: 4, width: 8, height: 8,
            borderRadius: 4, background: BRAND.danger
          }} />
        </button>
      </div>
    </div>
  );
}

// ---------- Stat Card ----------
function StatCard({ label, value, trend, trendValue, accent }) {
  return (
    <div style={{
      background: "white", padding: 20, borderRadius: 12,
      border: `1px solid ${BRAND.border}`
    }}>
      <div style={{ fontSize: 12, color: BRAND.textMuted, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: BRAND.text, marginTop: 6 }}>{value}</div>
      {trend && (
        <div style={{
          marginTop: 8, fontSize: 12, fontWeight: 600,
          color: trend === "up" ? BRAND.success : BRAND.danger,
          display: "flex", alignItems: "center", gap: 4
        }}>
          {trend === "up" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {trendValue}
        </div>
      )}
      {accent && <div style={{ marginTop: 8, fontSize: 11, color: BRAND.accent, fontWeight: 600 }}>{accent}</div>}
    </div>
  );
}

// ---------- Overview ----------
function OverviewScreen({ onTxnClick }) {
  const [overview, setOverview] = useState(null);
  const [recentTxns, setRecentTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ov, txns] = await Promise.all([
        getOverview(),
        getTransactions({ limit: 6 }),
      ]);
      setOverview(ov);
      setRecentTxns(txns.transactions);
    } catch (e) { setError(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBox error={error} onRetry={load} />;

  const { stats, chartData, methodBreakdown } = overview;
  const trendPct = stats.yesterdayTotal > 0
    ? ((stats.todayTotal - stats.yesterdayTotal) / stats.yesterdayTotal * 100).toFixed(1) : 0;
  const trendDir = stats.todayTotal >= stats.yesterdayTotal ? "up" : "down";
  const METHOD_COLORS = [BRAND.accent, BRAND.primary, "#F59E0B", "#8B5CF6"];
  const pieData = methodBreakdown.map((m) => ({ name: m.name, value: m.count }));

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <StatCard label="Today's Sales" value={fmtINRCompact(stats.todayTotal)}
          trend={trendDir} trendValue={`${Math.abs(trendPct)}% vs yesterday`} />
        <StatCard label="This Month" value={fmtINRCompact(stats.monthTotal)}
          accent={`${stats.successfulTxnCount} successful txns`} />
        <StatCard label="Pending Settlement" value={fmtINRCompact(stats.pendingSettlement)}
          accent="Expected in 1-2 days" />
        <StatCard label="Failed Txns" value={stats.failedCount}
          trend={stats.failedCount > 10 ? "down" : "up"} trendValue="Needs review" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "white", padding: 20, borderRadius: 12, border: `1px solid ${BRAND.border}` }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Sales Trend</h3>
          <div style={{ fontSize: 11, color: BRAND.textMuted, marginTop: 2, marginBottom: 12 }}>Last 7 days</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={BRAND.border} vertical={false} />
              <XAxis dataKey="day" stroke={BRAND.textMuted} fontSize={11} />
              <YAxis stroke={BRAND.textMuted} fontSize={11} tickFormatter={fmtINRCompact} />
              <Tooltip formatter={(v) => fmtINR(v)} />
              <Line type="monotone" dataKey="amount" stroke={BRAND.accent} strokeWidth={2.5} dot={{ r: 4, fill: BRAND.accent }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: "white", padding: 20, borderRadius: 12, border: `1px solid ${BRAND.border}` }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Payment Methods</h3>
          <div style={{ fontSize: 11, color: BRAND.textMuted, marginTop: 2, marginBottom: 8 }}>Successful transactions</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                innerRadius={48} outerRadius={72} paddingAngle={2}>
                {pieData.map((_, i) => <Cell key={i} fill={METHOD_COLORS[i]} />)}
              </Pie>
              <Tooltip />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: "white", borderRadius: 12, border: `1px solid ${BRAND.border}`, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${BRAND.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Recent Transactions</h3>
          <a href="#" style={{ fontSize: 12, color: BRAND.accent, textDecoration: "none", fontWeight: 600 }}>View all →</a>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: BRAND.bg }}>
              {["TXN ID", "Customer", "Method", "Amount", "Status", "Date", ""].map((h) => (
                <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: 11,
                  color: BRAND.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentTxns.map((t) => (
              <tr key={t.id} onClick={() => onTxnClick(t.id)}
                style={{ borderTop: `1px solid ${BRAND.border}`, cursor: "pointer" }}
                onMouseEnter={(e) => e.currentTarget.style.background = BRAND.bg}
                onMouseLeave={(e) => e.currentTarget.style.background = "white"}>
                <td style={{ padding: "14px 20px", fontSize: 12, fontFamily: "monospace" }}>{t.id}</td>
                <td style={{ padding: "14px 20px", fontSize: 13 }}>{t.customer}</td>
                <td style={{ padding: "14px 20px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: BRAND.textMuted }}>
                    {methodIcon(t.method)} {t.method}
                  </span>
                </td>
                <td style={{ padding: "14px 20px", fontSize: 13, fontWeight: 600 }}>{fmtINR(t.amount)}</td>
                <td style={{ padding: "14px 20px" }}><StatusBadge status={t.status} /></td>
                <td style={{ padding: "14px 20px", fontSize: 12, color: BRAND.textMuted }}>{fmtDateTime(t.date)}</td>
                <td style={{ padding: "14px 20px" }}><ChevronRight size={16} color={BRAND.textMuted} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------- Transactions ----------
function TransactionsScreen({ onTxnClick }) {
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [totalCount, setTotalCount] = useState(0);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await getTransactions({ status: statusFilter, method: methodFilter, search });
      setTxns(res.transactions);
      setTotalCount(res.total);
    } catch (e) { setError(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const timer = setTimeout(() => { load(); }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line
  }, [search, statusFilter, methodFilter]);

  return (
    <div style={{ padding: 28 }}>
      <div style={{ background: "white", padding: 16, borderRadius: 12,
        border: `1px solid ${BRAND.border}`, marginBottom: 16, display: "flex",
        gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 260, display: "flex", alignItems: "center",
          gap: 8, padding: "8px 12px", border: `1px solid ${BRAND.border}`, borderRadius: 8 }}>
          <Search size={15} color={BRAND.textMuted} />
          <input placeholder="Search by TXN ID, Order ID, or customer..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ border: "none", outline: "none", fontSize: 13, flex: 1, background: "transparent" }} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: "9px 12px", border: `1px solid ${BRAND.border}`, borderRadius: 8, fontSize: 13, background: "white" }}>
          <option value="ALL">All statuses</option>
          {TXN_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}
          style={{ padding: "9px 12px", border: `1px solid ${BRAND.border}`, borderRadius: 8, fontSize: 13, background: "white" }}>
          <option value="ALL">All methods</option>
          {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <button style={{ padding: "9px 14px", background: BRAND.primary, color: "white",
          border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6 }}>
          <Download size={14} /> Export CSV
        </button>
      </div>

      {error ? (
        <ErrorBox error={error} onRetry={load} />
      ) : (
        <div style={{ background: "white", borderRadius: 12, border: `1px solid ${BRAND.border}`, overflow: "hidden" }}>
          <div style={{ padding: "12px 20px", background: BRAND.bg,
            borderBottom: `1px solid ${BRAND.border}`, fontSize: 12, color: BRAND.textMuted, fontWeight: 500 }}>
            {loading ? "Loading..." : `Showing ${totalCount} transactions`}
          </div>
          <div style={{ maxHeight: 600, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ position: "sticky", top: 0, background: "white", zIndex: 1 }}>
                <tr>
                  {["TXN ID", "Customer", "Method", "Gateway", "Amount", "Status", "Date", ""].map((h) => (
                    <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: 11,
                      color: BRAND.textMuted, fontWeight: 600, textTransform: "uppercase",
                      letterSpacing: 0.5, background: BRAND.bg }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {txns.map((t) => (
                  <tr key={t.id} onClick={() => onTxnClick(t.id)}
                    style={{ borderTop: `1px solid ${BRAND.border}`, cursor: "pointer" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = BRAND.bg}
                    onMouseLeave={(e) => e.currentTarget.style.background = "white"}>
                    <td style={{ padding: "12px 20px", fontSize: 12, fontFamily: "monospace" }}>{t.id}</td>
                    <td style={{ padding: "12px 20px", fontSize: 13 }}>
                      <div style={{ fontWeight: 500 }}>{t.customer}</div>
                      <div style={{ fontSize: 11, color: BRAND.textMuted }}>{t.customerPhone}</div>
                    </td>
                    <td style={{ padding: "12px 20px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                        {methodIcon(t.method)} {t.method}
                      </span>
                    </td>
                    <td style={{ padding: "12px 20px", fontSize: 12, color: BRAND.textMuted }}>{t.gateway}</td>
                    <td style={{ padding: "12px 20px", fontSize: 13, fontWeight: 600 }}>{fmtINR(t.amount)}</td>
                    <td style={{ padding: "12px 20px" }}><StatusBadge status={t.status} /></td>
                    <td style={{ padding: "12px 20px", fontSize: 12, color: BRAND.textMuted }}>{fmtDateTime(t.date)}</td>
                    <td style={{ padding: "12px 20px" }}><ChevronRight size={16} color={BRAND.textMuted} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Transaction Detail ----------
function TransactionDetail({ txnId, onBack }) {
  const [txn, setTxn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true); setError(null);
    try { setTxn(await getTransaction(txnId)); }
    catch (e) { setError(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [txnId]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBox error={error} onRetry={load} />;
  if (!txn) return null;

  return (
    <div style={{ padding: 28 }}>
      <button onClick={onBack}
        style={{ background: "transparent", border: "none", color: BRAND.accent,
          fontSize: 13, cursor: "pointer", marginBottom: 16, fontWeight: 600 }}>
        ← Back to transactions
      </button>
      <div style={{ background: "white", borderRadius: 12, border: `1px solid ${BRAND.border}`,
        padding: 24, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 12, color: BRAND.textMuted, fontWeight: 500 }}>Transaction ID</div>
            <div style={{ fontSize: 18, fontFamily: "monospace", fontWeight: 600, marginTop: 4 }}>{txn.id}</div>
          </div>
          <StatusBadge status={txn.status} />
        </div>
        <div style={{ padding: 20, background: BRAND.bg, borderRadius: 10, marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: BRAND.textMuted }}>Amount</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: BRAND.text, marginTop: 4 }}>{fmtINR(txn.amount)}</div>
          <div style={{ fontSize: 12, color: BRAND.textMuted, marginTop: 6 }}>
            Fee: {fmtINR(txn.fee)} · Net: {fmtINR(txn.amount - txn.fee)}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Order ID" value={txn.orderId} mono />
          <Field label="Date & Time" value={fmtDateTime(txn.date)} />
          <Field label="Customer" value={txn.customer} />
          <Field label="Phone" value={txn.customerPhone} />
          <Field label="Payment Method" value={`${txn.method}${txn.method === "CARD" ? ` •••• ${txn.last4}` : ""}`} />
          <Field label="Gateway" value={txn.gateway} />
        </div>
      </div>
      {txn.status === "SUCCESS" && (
        <div style={{ display: "flex", gap: 10 }}>
          <button style={actionBtn(BRAND.danger, true)}><RefreshCw size={14} /> Issue Refund</button>
          <button style={actionBtn(BRAND.primary, false)}><Download size={14} /> Download Receipt</button>
          <button style={actionBtn(BRAND.primary, false)}><Eye size={14} /> Resend to Customer</button>
        </div>
      )}
    </div>
  );
}

const Field = ({ label, value, mono }) => (
  <div>
    <div style={{ fontSize: 11, color: BRAND.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
    <div style={{ fontSize: 14, marginTop: 4, color: BRAND.text, fontWeight: 500,
      fontFamily: mono ? "monospace" : "inherit" }}>{value}</div>
  </div>
);

const actionBtn = (color, filled) => ({
  padding: "10px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
  display: "flex", alignItems: "center", gap: 7, cursor: "pointer",
  background: filled ? color : "white",
  color: filled ? "white" : color,
  border: `1px solid ${color}`,
});

// ---------- Refunds ----------
function RefundsScreen() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true); setError(null);
    try { const res = await getRefunds(); setRefunds(res.refunds); }
    catch (e) { setError(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBox error={error} onRetry={load} />;

  return (
    <div style={{ padding: 28 }}>
      <div style={{ background: "white", borderRadius: 12, border: `1px solid ${BRAND.border}`, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: BRAND.bg }}>
              {["Refund ID", "Original TXN", "Customer", "Amount", "Reason", "Status", "Date"].map((h) => (
                <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: 11,
                  color: BRAND.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {refunds.map((r) => (
              <tr key={r.id} style={{ borderTop: `1px solid ${BRAND.border}` }}>
                <td style={{ padding: "14px 20px", fontSize: 12, fontFamily: "monospace" }}>{r.id}</td>
                <td style={{ padding: "14px 20px", fontSize: 12, fontFamily: "monospace", color: BRAND.textMuted }}>{r.txnId}</td>
                <td style={{ padding: "14px 20px", fontSize: 13 }}>{r.customer}</td>
                <td style={{ padding: "14px 20px", fontSize: 13, fontWeight: 600 }}>{fmtINR(r.amount)}</td>
                <td style={{ padding: "14px 20px", fontSize: 12, color: BRAND.textMuted }}>{r.reason}</td>
                <td style={{ padding: "14px 20px" }}><StatusBadge status={r.status} /></td>
                <td style={{ padding: "14px 20px", fontSize: 12, color: BRAND.textMuted }}>{fmtDate(r.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------- Settlements ----------
function SettlementsScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true); setError(null);
    try { setData(await getSettlements()); }
    catch (e) { setError(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBox error={error} onRetry={load} />;

  const { summary, settlements } = data;
  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
        <StatCard label="Total Credited (30 days)" value={fmtINRCompact(summary.totalCredited)} />
        <StatCard label="Pending" value={fmtINRCompact(summary.pending)} accent="Expected tomorrow" />
        <StatCard label="Next Settlement" value={summary.nextSettlement} accent="To HDFC Bank ••9621" />
      </div>
      <div style={{ background: "white", borderRadius: 12, border: `1px solid ${BRAND.border}`, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: BRAND.bg }}>
              {["Settlement ID", "Date", "Txns", "Gross", "Fee", "Net Credited", "UTR", "Status"].map((h) => (
                <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: 11,
                  color: BRAND.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {settlements.map((s) => (
              <tr key={s.id} style={{ borderTop: `1px solid ${BRAND.border}` }}>
                <td style={{ padding: "14px 20px", fontSize: 12, fontFamily: "monospace" }}>{s.id}</td>
                <td style={{ padding: "14px 20px", fontSize: 12, color: BRAND.textMuted }}>{fmtDate(s.date)}</td>
                <td style={{ padding: "14px 20px", fontSize: 13 }}>{s.txnCount}</td>
                <td style={{ padding: "14px 20px", fontSize: 13 }}>{fmtINR(s.gross)}</td>
                <td style={{ padding: "14px 20px", fontSize: 13, color: BRAND.textMuted }}>{fmtINR(s.fee)}</td>
                <td style={{ padding: "14px 20px", fontSize: 13, fontWeight: 700 }}>{fmtINR(s.net)}</td>
                <td style={{ padding: "14px 20px", fontSize: 11, fontFamily: "monospace", color: BRAND.textMuted }}>{s.utr}</td>
                <td style={{ padding: "14px 20px" }}><StatusBadge status={s.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------- Placeholder ----------
function PlaceholderScreen({ title, description, icon: Icon }) {
  return (
    <div style={{ padding: 28 }}>
      <div style={{ background: "white", padding: 60, borderRadius: 12,
        border: `1px solid ${BRAND.border}`, textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: 12, background: BRAND.accentSoft,
          display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <Icon size={24} color={BRAND.accent} />
        </div>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{title}</h3>
        <p style={{ color: BRAND.textMuted, fontSize: 13, maxWidth: 460, margin: "10px auto 0" }}>{description}</p>
        <div style={{ display: "inline-block", marginTop: 20, padding: "6px 14px",
          background: BRAND.accentSoft, color: BRAND.accent, fontSize: 11,
          borderRadius: 20, fontWeight: 600 }}>
          Coming in Phase 2 of the build
        </div>
      </div>
    </div>
  );
}

// ---------- Main App ----------
export default function App() {
  const [page, setPage] = useState("home");
  const [selectedTxnId, setSelectedTxnId] = useState(null);
  const { getToken } = useAuth();

  // Tell api.js how to get the Clerk token — runs every time getToken changes
  useEffect(() => {
    setTokenGetter(async () => {
      try {
        return await getToken();
      } catch {
        return null;
      }
    });
  }, [getToken]);

  const titles = {
    home: "Overview", transactions: "Transactions", refunds: "Refunds",
    settlements: "Settlements", reports: "Reports", users: "Team", settings: "Settings",
  };

  let content;
  if (selectedTxnId) {
    content = <TransactionDetail txnId={selectedTxnId} onBack={() => setSelectedTxnId(null)} />;
  } else if (page === "home") {
    content = <OverviewScreen onTxnClick={setSelectedTxnId} />;
  } else if (page === "transactions") {
    content = <TransactionsScreen onTxnClick={setSelectedTxnId} />;
  } else if (page === "refunds") {
    content = <RefundsScreen />;
  } else if (page === "settlements") {
    content = <SettlementsScreen />;
  } else if (page === "reports") {
    content = <PlaceholderScreen title="Reports"
      description="Schedule daily, weekly, or monthly reports. Download GST-ready transaction summaries for your accountant."
      icon={FileText} />;
  } else if (page === "users") {
    content = <PlaceholderScreen title="Team Management"
      description="Invite team members, assign roles, and control access."
      icon={Users} />;
  } else if (page === "settings") {
    content = <PlaceholderScreen title="Settings"
      description="Business profile, bank account, GST details, API keys, webhooks, and 2FA."
      icon={Settings} />;
  }

  return (
    <>
      <SignedOut>
        <LoginScreen />
      </SignedOut>
      <SignedIn>
        <div style={{
          display: "flex", minHeight: "100vh", background: BRAND.bg,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          color: BRAND.text
        }}>
          <Sidebar
            current={page}
            onNavigate={(p) => { setPage(p); setSelectedTxnId(null); }}
          />
          <main style={{ flex: 1, overflow: "auto" }}>
            <Topbar title={selectedTxnId ? "Transaction Detail" : titles[page]} />
            {content}
          </main>
        </div>
      </SignedIn>
    </>
  );
}