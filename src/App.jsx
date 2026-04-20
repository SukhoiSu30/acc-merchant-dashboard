import React, { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend
} from "recharts";
import {
  LayoutDashboard, Receipt, RefreshCw, Banknote, Users, Settings,
  FileText, LogOut, Search, Download, TrendingUp, TrendingDown,
  CheckCircle2, XCircle, Clock, CreditCard, Smartphone,
  Wallet, Building2, Bell, ChevronRight, Eye, Shield
} from "lucide-react";

const BRAND = {
  name: "ACC Merchants",
  tagline: "Applied Cloud Computing",
  primary: "#0F2A4A",
  primaryLight: "#1E4976",
  accent: "#2EB5A1",
  accentSoft: "#E6F7F4",
  success: "#16A34A",
  danger: "#DC2626",
  warning: "#F59E0B",
  bg: "#F6F8FB",
  card: "#FFFFFF",
  text: "#0F172A",
  textMuted: "#64748B",
  border: "#E2E8F0",
};

const TXN_STATUS = ["SUCCESS", "FAILED", "PENDING", "REFUNDED"];
const METHODS = ["UPI", "CARD", "WALLET", "NETBANKING"];
const CUSTOMER_NAMES = [
  "Rohan Sharma", "Priya Iyer", "Arjun Mehta", "Sneha Reddy", "Vikram Nair",
  "Aisha Khan", "Karan Patel", "Meera Joshi", "Siddharth Rao", "Tanvi Desai",
  "Rahul Verma", "Nisha Pillai", "Aditya Singh", "Isha Kapoor", "Neel Bhatia",
];
const GATEWAYS = ["Razorpay", "PayU", "Cashfree", "Paytm"];

function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const TRANSACTIONS = Array.from({ length: 80 }, (_, i) => {
  const r = seededRandom(i + 1);
  const daysAgo = Math.floor(r * 30);
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(Math.floor(seededRandom(i + 2) * 24));
  date.setMinutes(Math.floor(seededRandom(i + 3) * 60));

  const statusRoll = seededRandom(i + 4);
  let status;
  if (statusRoll < 0.75) status = "SUCCESS";
  else if (statusRoll < 0.88) status = "FAILED";
  else if (statusRoll < 0.95) status = "PENDING";
  else status = "REFUNDED";

  return {
    id: `TXN${String(10234560 + i).padStart(10, "0")}`,
    orderId: `ORD${String(80010 + i).padStart(6, "0")}`,
    date,
    amount: Math.round((seededRandom(i + 5) * 9500 + 50) * 100) / 100,
    status,
    method: METHODS[Math.floor(seededRandom(i + 6) * METHODS.length)],
    customer: CUSTOMER_NAMES[Math.floor(seededRandom(i + 7) * CUSTOMER_NAMES.length)],
    customerPhone: `+91 9${String(Math.floor(seededRandom(i + 8) * 900000000) + 100000000)}`,
    gateway: GATEWAYS[Math.floor(seededRandom(i + 9) * GATEWAYS.length)],
    fee: 0,
    last4: String(Math.floor(seededRandom(i + 10) * 9000) + 1000),
  };
}).map(t => ({ ...t, fee: Math.round(t.amount * 0.02 * 100) / 100 }));

const SETTLEMENTS = Array.from({ length: 12 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - i * 2 - 1);
  const gross = Math.round((seededRandom(i + 100) * 80000 + 15000) * 100) / 100;
  const fee = Math.round(gross * 0.021 * 100) / 100;
  return {
    id: `STL${String(50010 + i).padStart(6, "0")}`,
    date: d,
    gross,
    fee,
    net: Math.round((gross - fee) * 100) / 100,
    utr: `HDFC${Math.floor(seededRandom(i + 200) * 900000000) + 100000000}`,
    status: i === 0 ? "PROCESSING" : "CREDITED",
    txnCount: Math.floor(seededRandom(i + 300) * 40) + 10,
  };
});

const REFUNDS = TRANSACTIONS.filter(t => t.status === "REFUNDED").slice(0, 8).map((t, i) => ({
  id: `REF${String(30010 + i).padStart(6, "0")}`,
  txnId: t.id,
  amount: t.amount,
  customer: t.customer,
  date: new Date(t.date.getTime() + 86400000),
  status: seededRandom(i + 500) > 0.2 ? "PROCESSED" : "INITIATED",
  reason: ["Customer request", "Duplicate payment", "Item unavailable", "Cancelled order"][i % 4],
}));

const fmtINR = (n) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtINRCompact = (n) => {
  if (n >= 10000000) return "₹" + (n / 10000000).toFixed(2) + " Cr";
  if (n >= 100000) return "₹" + (n / 100000).toFixed(2) + " L";
  if (n >= 1000) return "₹" + (n / 1000).toFixed(1) + "K";
  return "₹" + n.toFixed(0);
};

const fmtDate = (d) =>
  d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const fmtDateTime = (d) =>
  d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) +
  ", " +
  d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

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
      fontSize: 11, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4,
      letterSpacing: 0.3,
    }}>
      {s.icon} {status}
    </span>
  );
};

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("demo@acc-merchants.in");
  const [password, setPassword] = useState("demo123");
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.primaryLight} 100%)`,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <div style={{
        background: "white", borderRadius: 16, padding: 40, width: "100%", maxWidth: 440,
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
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
            Sign in to your merchant dashboard
          </p>
        </div>

        {!showOtp ? (
          <>
            <label style={{ fontSize: 12, fontWeight: 600, color: BRAND.text }}>Email / Merchant ID</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%", padding: "11px 14px", marginTop: 6, marginBottom: 18,
                border: `1px solid ${BRAND.border}`, borderRadius: 8, fontSize: 14,
                boxSizing: "border-box", outline: "none",
              }}
            />
            <label style={{ fontSize: 12, fontWeight: 600, color: BRAND.text }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%", padding: "11px 14px", marginTop: 6, marginBottom: 6,
                border: `1px solid ${BRAND.border}`, borderRadius: 8, fontSize: 14,
                boxSizing: "border-box", outline: "none",
              }}
            />
            <div style={{ textAlign: "right", marginBottom: 20 }}>
              <a href="#" style={{ fontSize: 12, color: BRAND.accent, textDecoration: "none" }}>
                Forgot password?
              </a>
            </div>
            <button
              onClick={() => setShowOtp(true)}
              style={{
                width: "100%", padding: "12px 14px", background: BRAND.primary, color: "white",
                border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
            >
              Continue
            </button>
          </>
        ) : (
          <>
            <div style={{
              background: BRAND.accentSoft, padding: 12, borderRadius: 8, marginBottom: 18,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <Shield size={18} color={BRAND.accent} />
              <div style={{ fontSize: 12, color: BRAND.text }}>
                Enter the 6-digit OTP from your Authenticator app
              </div>
            </div>
            <label style={{ fontSize: 12, fontWeight: 600, color: BRAND.text }}>6-digit OTP</label>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              style={{
                width: "100%", padding: "11px 14px", marginTop: 6, marginBottom: 18,
                border: `1px solid ${BRAND.border}`, borderRadius: 8, fontSize: 18,
                boxSizing: "border-box", outline: "none", letterSpacing: 6, textAlign: "center",
                fontWeight: 600,
              }}
            />
            <button
              onClick={onLogin}
              style={{
                width: "100%", padding: "12px 14px", background: BRAND.primary, color: "white",
                border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer",
                marginBottom: 10,
              }}
            >
              Verify & Sign In
            </button>
            <button
              onClick={() => setShowOtp(false)}
              style={{
                width: "100%", padding: "10px", background: "transparent", color: BRAND.textMuted,
                border: "none", fontSize: 12, cursor: "pointer",
              }}
            >
              ← Back
            </button>
          </>
        )}

        <div style={{
          marginTop: 28, paddingTop: 20, borderTop: `1px solid ${BRAND.border}`,
          textAlign: "center", fontSize: 11, color: BRAND.textMuted,
        }}>
          Demo credentials pre-filled · Powered by {BRAND.tagline}
        </div>
      </div>
    </div>
  );
}

function Sidebar({ current, onNavigate, onLogout }) {
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
      display: "flex", flexDirection: "column", flexShrink: 0,
    }}>
      <div style={{ padding: "22px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: `linear-gradient(135deg, ${BRAND.accent}, #1D8E7F)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 13,
          }}>ACC</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{BRAND.name}</div>
            <div style={{ fontSize: 10, opacity: 0.6 }}>{BRAND.tagline}</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: "16px 10px" }}>
        {items.map(it => {
          const Icon = it.icon;
          const active = current === it.id;
          return (
            <button
              key={it.id}
              onClick={() => onNavigate(it.id)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "10px 14px", marginBottom: 4, borderRadius: 8,
                background: active ? "rgba(46,181,161,0.15)" : "transparent",
                border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500,
                color: active ? BRAND.accent : "rgba(255,255,255,0.75)",
                textAlign: "left",
              }}
            >
              <Icon size={17} />
              {it.label}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: 14, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{
          padding: 12, background: "rgba(255,255,255,0.06)", borderRadius: 8,
          marginBottom: 10,
        }}>
          <div style={{ fontSize: 12, fontWeight: 600 }}>Prat Sharma</div>
          <div style={{ fontSize: 10, opacity: 0.6 }}>Merchant Admin</div>
        </div>
        <button
          onClick={onLogout}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10,
            padding: "10px 14px", background: "transparent", border: "none",
            color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 12,
          }}
        >
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </aside>
  );
}

function Topbar({ title }) {
  return (
    <div style={{
      padding: "18px 28px", background: "white", borderBottom: `1px solid ${BRAND.border}`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
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
          padding: 8, borderRadius: 8, cursor: "pointer", position: "relative",
        }}>
          <Bell size={16} color={BRAND.textMuted} />
          <span style={{
            position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: 4,
            background: BRAND.danger,
          }} />
        </button>
        <div style={{
          width: 36, height: 36, borderRadius: 18,
          background: `linear-gradient(135deg, ${BRAND.accent}, ${BRAND.primary})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontWeight: 600, fontSize: 13,
        }}>PS</div>
      </div>
    </div>
  );
}

function StatCard({ label, value, trend, trendValue, accent }) {
  return (
    <div style={{
      background: "white", padding: 20, borderRadius: 12,
      border: `1px solid ${BRAND.border}`,
    }}>
      <div style={{ fontSize: 12, color: BRAND.textMuted, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: BRAND.text, marginTop: 6 }}>
        {value}
      </div>
      {trend && (
        <div style={{
          marginTop: 8, fontSize: 12, fontWeight: 600,
          color: trend === "up" ? BRAND.success : BRAND.danger,
          display: "flex", alignItems: "center", gap: 4,
        }}>
          {trend === "up" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {trendValue}
        </div>
      )}
      {accent && (
        <div style={{
          marginTop: 8, fontSize: 11, color: BRAND.accent, fontWeight: 600,
        }}>{accent}</div>
      )}
    </div>
  );
}

function OverviewScreen({ onTxnClick }) {
  const today = new Date();
  const todayTxns = TRANSACTIONS.filter(t =>
    t.date.toDateString() === today.toDateString() && t.status === "SUCCESS");
  const todayTotal = todayTxns.reduce((s, t) => s + t.amount, 0);

  const yest = new Date(today); yest.setDate(yest.getDate() - 1);
  const yestTxns = TRANSACTIONS.filter(t =>
    t.date.toDateString() === yest.toDateString() && t.status === "SUCCESS");
  const yestTotal = yestTxns.reduce((s, t) => s + t.amount, 0);

  const monthTotal = TRANSACTIONS
    .filter(t => t.status === "SUCCESS" && t.date.getMonth() === today.getMonth())
    .reduce((s, t) => s + t.amount, 0);

  const pendingSettlement = TRANSACTIONS
    .filter(t => t.status === "SUCCESS").slice(0, 12)
    .reduce((s, t) => s + t.amount - t.fee, 0);

  const failedCount = TRANSACTIONS.filter(t => t.status === "FAILED").length;

  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() - (6 - i));
    const sum = TRANSACTIONS
      .filter(t => t.date.toDateString() === d.toDateString() && t.status === "SUCCESS")
      .reduce((s, t) => s + t.amount, 0);
    return {
      day: d.toLocaleDateString("en-IN", { weekday: "short" }),
      amount: Math.round(sum),
    };
  });

  const methodData = METHODS.map(m => ({
    name: m,
    value: TRANSACTIONS.filter(t => t.method === m && t.status === "SUCCESS").length,
  }));
  const METHOD_COLORS = [BRAND.accent, BRAND.primary, "#F59E0B", "#8B5CF6"];

  const recentTxns = [...TRANSACTIONS].sort((a, b) => b.date - a.date).slice(0, 6);

  const trendPct = yestTotal > 0 ? ((todayTotal - yestTotal) / yestTotal * 100).toFixed(1) : 0;
  const trendDir = todayTotal >= yestTotal ? "up" : "down";

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <StatCard label="Today's Sales" value={fmtINRCompact(todayTotal)} trend={trendDir} trendValue={`${Math.abs(trendPct)}% vs yesterday`} />
        <StatCard label="This Month" value={fmtINRCompact(monthTotal)} accent={`${TRANSACTIONS.filter(t => t.status === "SUCCESS").length} successful txns`} />
        <StatCard label="Pending Settlement" value={fmtINRCompact(pendingSettlement)} accent="Expected in 1-2 days" />
        <StatCard label="Failed Txns" value={failedCount} trend={failedCount > 10 ? "down" : "up"} trendValue="Needs review" />
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
              <Pie data={methodData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={2}>
                {methodData.map((_, i) => <Cell key={i} fill={METHOD_COLORS[i]} />)}
              </Pie>
              <Tooltip />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: "white", borderRadius: 12, border: `1px solid ${BRAND.border}`, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${BRAND.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Recent Transactions</h3>
          <a href="#" style={{ fontSize: 12, color: BRAND.accent, textDecoration: "none", fontWeight: 600 }}>View all →</a>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: BRAND.bg }}>
              {["TXN ID", "Customer", "Method", "Amount", "Status", "Date", ""].map(h => (
                <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: 11, color: BRAND.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentTxns.map(t => (
              <tr key={t.id} onClick={() => onTxnClick(t)} style={{ borderTop: `1px solid ${BRAND.border}`, cursor: "pointer" }}
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

function TransactionsScreen({ onTxnClick }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");

  const filtered = useMemo(() => {
    return TRANSACTIONS
      .filter(t => {
        if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
        if (methodFilter !== "ALL" && t.method !== methodFilter) return false;
        if (search) {
          const s = search.toLowerCase();
          return t.id.toLowerCase().includes(s) || t.customer.toLowerCase().includes(s) || t.orderId.toLowerCase().includes(s);
        }
        return true;
      })
      .sort((a, b) => b.date - a.date);
  }, [search, statusFilter, methodFilter]);

  return (
    <div style={{ padding: 28 }}>
      <div style={{ background: "white", padding: 16, borderRadius: 12, border: `1px solid ${BRAND.border}`, marginBottom: 16, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 260, display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", border: `1px solid ${BRAND.border}`, borderRadius: 8 }}>
          <Search size={15} color={BRAND.textMuted} />
          <input placeholder="Search by TXN ID, Order ID, or customer..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ border: "none", outline: "none", fontSize: 13, flex: 1, background: "transparent" }} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: "9px 12px", border: `1px solid ${BRAND.border}`, borderRadius: 8, fontSize: 13, background: "white" }}>
          <option value="ALL">All statuses</option>
          {TXN_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}
          style={{ padding: "9px 12px", border: `1px solid ${BRAND.border}`, borderRadius: 8, fontSize: 13, background: "white" }}>
          <option value="ALL">All methods</option>
          {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <button style={{ padding: "9px 14px", background: BRAND.primary, color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div style={{ background: "white", borderRadius: 12, border: `1px solid ${BRAND.border}`, overflow: "hidden" }}>
        <div style={{ padding: "12px 20px", background: BRAND.bg, borderBottom: `1px solid ${BRAND.border}`, fontSize: 12, color: BRAND.textMuted, fontWeight: 500 }}>
          Showing {filtered.length} of {TRANSACTIONS.length} transactions
        </div>
        <div style={{ maxHeight: 600, overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ position: "sticky", top: 0, background: "white", zIndex: 1 }}>
              <tr>
                {["TXN ID", "Customer", "Method", "Gateway", "Amount", "Status", "Date", ""].map(h => (
                  <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: 11, color: BRAND.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, background: BRAND.bg }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} onClick={() => onTxnClick(t)} style={{ borderTop: `1px solid ${BRAND.border}`, cursor: "pointer" }}
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
    </div>
  );
}

function TransactionDetail({ txn, onBack }) {
  return (
    <div style={{ padding: 28 }}>
      <button onClick={onBack} style={{ background: "transparent", border: "none", color: BRAND.accent, fontSize: 13, cursor: "pointer", marginBottom: 16, fontWeight: 600 }}>
        ← Back to transactions
      </button>
      <div style={{ background: "white", borderRadius: 12, border: `1px solid ${BRAND.border}`, padding: 24, marginBottom: 16 }}>
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
    <div style={{ fontSize: 14, marginTop: 4, color: BRAND.text, fontWeight: 500, fontFamily: mono ? "monospace" : "inherit" }}>{value}</div>
  </div>
);

const actionBtn = (color, filled) => ({
  padding: "10px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
  display: "flex", alignItems: "center", gap: 7, cursor: "pointer",
  background: filled ? color : "white",
  color: filled ? "white" : color,
  border: `1px solid ${color}`,
});

function RefundsScreen() {
  return (
    <div style={{ padding: 28 }}>
      <div style={{ background: "white", borderRadius: 12, border: `1px solid ${BRAND.border}`, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: BRAND.bg }}>
              {["Refund ID", "Original TXN", "Customer", "Amount", "Reason", "Status", "Date"].map(h => (
                <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: 11, color: BRAND.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {REFUNDS.map(r => (
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

function SettlementsScreen() {
  const totalCredited = SETTLEMENTS.filter(s => s.status === "CREDITED").reduce((a, s) => a + s.net, 0);
  const processing = SETTLEMENTS.find(s => s.status === "PROCESSING");
  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
        <StatCard label="Total Credited (30 days)" value={fmtINRCompact(totalCredited)} />
        <StatCard label="Pending" value={processing ? fmtINRCompact(processing.net) : "—"} accent="Expected tomorrow" />
        <StatCard label="Next Settlement" value="T+1 days" accent="To HDFC Bank ••9621" />
      </div>
      <div style={{ background: "white", borderRadius: 12, border: `1px solid ${BRAND.border}`, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: BRAND.bg }}>
              {["Settlement ID", "Date", "Txns", "Gross", "Fee", "Net Credited", "UTR", "Status"].map(h => (
                <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: 11, color: BRAND.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SETTLEMENTS.map(s => (
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

function PlaceholderScreen({ title, description, icon: Icon }) {
  return (
    <div style={{ padding: 28 }}>
      <div style={{ background: "white", padding: 60, borderRadius: 12, border: `1px solid ${BRAND.border}`, textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: 12, background: BRAND.accentSoft, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <Icon size={24} color={BRAND.accent} />
        </div>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{title}</h3>
        <p style={{ color: BRAND.textMuted, fontSize: 13, maxWidth: 460, margin: "10px auto 0" }}>{description}</p>
        <div style={{ display: "inline-block", marginTop: 20, padding: "6px 14px", background: BRAND.accentSoft, color: BRAND.accent, fontSize: 11, borderRadius: 20, fontWeight: 600 }}>
          Coming in Phase 2 of the build
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [page, setPage] = useState("home");
  const [selectedTxn, setSelectedTxn] = useState(null);

  if (!loggedIn) return <LoginScreen onLogin={() => setLoggedIn(true)} />;

  const titles = {
    home: "Overview", transactions: "Transactions", refunds: "Refunds",
    settlements: "Settlements", reports: "Reports", users: "Team", settings: "Settings",
  };

  let content;
  if (selectedTxn) {
    content = <TransactionDetail txn={selectedTxn} onBack={() => setSelectedTxn(null)} />;
  } else if (page === "home") {
    content = <OverviewScreen onTxnClick={setSelectedTxn} />;
  } else if (page === "transactions") {
    content = <TransactionsScreen onTxnClick={setSelectedTxn} />;
  } else if (page === "refunds") {
    content = <RefundsScreen />;
  } else if (page === "settlements") {
    content = <SettlementsScreen />;
  } else if (page === "reports") {
    content = <PlaceholderScreen title="Reports" description="Schedule daily, weekly, or monthly reports. Download GST-ready transaction summaries for your accountant." icon={FileText} />;
  } else if (page === "users") {
    content = <PlaceholderScreen title="Team Management" description="Invite team members, assign roles, and control access to refunds, reports, and settings." icon={Users} />;
  } else if (page === "settings") {
    content = <PlaceholderScreen title="Settings" description="Business profile, bank account, GST details, API keys, webhook URLs, and 2FA setup." icon={Settings} />;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: BRAND.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: BRAND.text }}>
      <Sidebar current={page} onNavigate={(p) => { setPage(p); setSelectedTxn(null); }} onLogout={() => setLoggedIn(false)} />
      <main style={{ flex: 1, overflow: "auto" }}>
        <Topbar title={selectedTxn ? "Transaction Detail" : titles[page]} />
        {content}
      </main>
    </div>
  );
}