import { useState, useEffect, useReducer } from "react";

// ==================== SUPABASE CONFIG ====================
const SUPABASE_URL = "https://rytmfebuxsviqhlltbez.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5dG1mZWJ1eHN2aXFobGx0YmV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1OTAzMjUsImV4cCI6MjA5ODE2NjMyNX0.aAJjA_9rSqNy5RK_cpfGJdaFbE4mJBBfJB1qUJdy7aY";

const db = {
  async get(table) {
    const hasDate = ["sales", "maintenance", "software"].includes(table);
    const order = hasDate ? "?order=date.desc" : "";
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}${order}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    return r.ok ? r.json() : [];
  },
  async insert(table, data) {
    await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(data)
    });
  },
  async update(table, id, data) {
    await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: "PATCH",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
  },
  async getProducts() {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    const rows = r.ok ? await r.json() : [];
    const grouped = { iphone: [], android: [], accessories: [] };
    rows.forEach(p => { if (grouped[p.category]) grouped[p.category].push(p); });
    return grouped;
  },
  async insertProduct(data) {
    await fetch(`${SUPABASE_URL}/rest/v1/products`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(data)
    });
  },
};

// ==================== HELPERS ====================
const dinarFmt = (n) => `${Number(n).toLocaleString("ar-LY")} د.ل`;
const today = () => new Date().toISOString().split("T")[0];
const uid = () => Math.random().toString(36).slice(2, 8);

// ==================== COMPONENTS ====================
function StatCard({ icon, label, value, color, sub }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: "20px 18px", flex: 1, minWidth: 160, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", borderTop: `4px solid ${color}`, display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: 26 }}>{icon}</div>
      <div style={{ color: "#888", fontSize: 13 }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: 22, color: "#1a1a2e" }}>{value}</div>
      {sub && <div style={{ color: color, fontSize: 12 }}>{sub}</div>}
    </div>
  );
}

function Badge({ status }) {
  const map = { "مكتمل": { bg: "#e8f5e9", color: "#2e7d32" }, "قيد التنفيذ": { bg: "#fff8e1", color: "#f57c00" }, "نقد": { bg: "#e3f2fd", color: "#1565c0" }, "قسط": { bg: "#fce4ec", color: "#c62828" } };
  const s = map[status] || { bg: "#f0f0f0", color: "#555" };
  return <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: "2px 12px", fontSize: 12, fontWeight: 700 }}>{status}</span>;
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, minWidth: 340, maxWidth: 480, width: "90%", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1a1a2e" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "#f0f0f0", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e0e0e0", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", outline: "none" };

function Loader() {
  return <div style={{ textAlign: "center", padding: 40, color: "#888", fontSize: 16 }}>⏳ جاري التحميل...</div>;
}

// ==================== DASHBOARD ====================
function Dashboard({ sales, maintenance, debts }) {
  const totalRevenue = sales.reduce((s, x) => s + (x.sell_price || 0) * (x.qty || 1), 0);
  const totalProfit = sales.reduce((s, x) => s + ((x.sell_price || 0) - (x.buy_price || 0)) * (x.qty || 1), 0);
  const totalDebt = debts.reduce((s, d) => s + (d.remaining || 0), 0);
  const pendingMaint = maintenance.filter(m => m.status !== "مكتمل").length;

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 24 }}>
        <StatCard icon="💰" label="إجمالي المبيعات" value={dinarFmt(totalRevenue)} color="#4a6fa5" sub={`${sales.length} صفقة`} />
        <StatCard icon="📈" label="صافي الربح" value={dinarFmt(totalProfit)} color="#2e7d32" />
        <StatCard icon="🔧" label="طلبات الصيانة" value={maintenance.length} color="#f57c00" sub={`${pendingMaint} قيد التنفيذ`} />
        <StatCard icon="📋" label="الديون المستحقة" value={dinarFmt(totalDebt)} color="#c62828" sub={`${debts.length} عميل`} />
      </div>
      <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>📦 آخر المبيعات</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#f7f8fc" }}>
              {["التاريخ", "المنتج", "العميل", "المبلغ", "الطريقة"].map(h => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "#555", borderBottom: "2px solid #eee" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sales.slice(0, 5).map((s, i) => (
              <tr key={s.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafbff" }}>
                <td style={{ padding: "10px 12px", color: "#888" }}>{s.date}</td>
                <td style={{ padding: "10px 12px", fontWeight: 600 }}>{s.product}</td>
                <td style={{ padding: "10px 12px" }}>{s.customer}</td>
                <td style={{ padding: "10px 12px", fontWeight: 700, color: "#2e7d32" }}>{dinarFmt((s.sell_price || 0) * (s.qty || 1))}</td>
                <td style={{ padding: "10px 12px" }}><Badge status={s.pay_type} /></td>
              </tr>
            ))}
            {sales.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", padding: 24, color: "#aaa" }}>لا توجد مبيعات بعد</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==================== SALES SECTION ====================
function SalesSection({ type, title, icon, products, sales, onRefresh }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ product: "", qty: 1, sellPrice: "", customer: "", payType: "نقد" });
  const [saving, setSaving] = useState(false);

  const catProducts = products[type] || [];
  const catSales = sales.filter(s => s.type === type);
  const selectedProduct = catProducts.find(p => p.name === form.product);
  const profit = selectedProduct ? (Number(form.sellPrice) - selectedProduct.buy_price) * Number(form.qty) : 0;

  const handleSell = async () => {
    if (!form.product || !form.sellPrice || !form.customer) return alert("الرجاء تعبئة جميع الحقول");
    setSaving(true);
    const sale = { id: uid(), date: today(), type, product: form.product, qty: Number(form.qty), sell_price: Number(form.sellPrice), buy_price: selectedProduct?.buy_price || 0, customer: form.customer, pay_type: form.payType };
    await db.insert("sales", sale);
    if (form.payType === "قسط") {
      await db.insert("debts", { id: uid(), customer: form.customer, product: form.product, total: sale.sell_price * sale.qty, paid: 0, remaining: sale.sell_price * sale.qty, next_due: today() });
    }
    await onRefresh();
    setSaving(false);
    setShowModal(false);
    setForm({ product: "", qty: 1, sellPrice: "", customer: "", payType: "نقد" });
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{icon} {title}</h2>
        <button onClick={() => setShowModal(true)} style={{ background: "#4a6fa5", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontFamily: "inherit", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>+ بيع جديد</button>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {catProducts.slice(0, 4).map(p => (
          <div key={p.id} style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", flex: 1, minWidth: 140, boxShadow: "0 2px 10px rgba(0,0,0,0.07)", borderRight: "4px solid #4a6fa5" }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{p.name}</div>
            <div style={{ color: "#2e7d32", fontWeight: 800, fontSize: 16 }}>{dinarFmt(p.sell_price)}</div>
            <div style={{ color: "#888", fontSize: 12 }}>مخزون: {p.stock}</div>
          </div>
        ))}
        {catProducts.length === 0 && <div style={{ color: "#aaa", fontSize: 14 }}>لا توجد منتجات — أضفها من قسم الجرد</div>}
      </div>
      <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#f7f8fc" }}>
              {["التاريخ", "المنتج", "الكمية", "العميل", "المبلغ", "الربح", "الطريقة"].map(h => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "#555", borderBottom: "2px solid #eee" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {catSales.map((s, i) => (
              <tr key={s.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafbff" }}>
                <td style={{ padding: "10px 12px", color: "#888" }}>{s.date}</td>
                <td style={{ padding: "10px 12px", fontWeight: 600 }}>{s.product}</td>
                <td style={{ padding: "10px 12px", textAlign: "center" }}>{s.qty}</td>
                <td style={{ padding: "10px 12px" }}>{s.customer}</td>
                <td style={{ padding: "10px 12px", fontWeight: 700 }}>{dinarFmt((s.sell_price || 0) * (s.qty || 1))}</td>
                <td style={{ padding: "10px 12px", color: "#2e7d32", fontWeight: 700 }}>{dinarFmt(((s.sell_price || 0) - (s.buy_price || 0)) * (s.qty || 1))}</td>
                <td style={{ padding: "10px 12px" }}><Badge status={s.pay_type} /></td>
              </tr>
            ))}
            {catSales.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", padding: 24, color: "#aaa" }}>لا توجد مبيعات بعد</td></tr>}
          </tbody>
        </table>
      </div>
      {showModal && (
        <Modal title={`بيع ${title}`} onClose={() => setShowModal(false)}>
          <FormField label="المنتج">
            <select style={inputStyle} value={form.product} onChange={e => {
              const p = catProducts.find(x => x.name === e.target.value);
              setForm(f => ({ ...f, product: e.target.value, sellPrice: p?.sell_price || "" }));
            }}>
              <option value="">اختر المنتج</option>
              {catProducts.map(p => <option key={p.id}>{p.name}</option>)}
            </select>
          </FormField>
          <FormField label="سعر البيع (د.ل)"><input type="number" style={inputStyle} value={form.sellPrice} onChange={e => setForm(f => ({ ...f, sellPrice: e.target.value }))} /></FormField>
          <FormField label="الكمية"><input type="number" min={1} style={inputStyle} value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} /></FormField>
          <FormField label="اسم العميل"><input type="text" style={inputStyle} value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))} /></FormField>
          <FormField label="طريقة الدفع">
            <select style={inputStyle} value={form.payType} onChange={e => setForm(f => ({ ...f, payType: e.target.value }))}>
              <option>نقد</option><option>قسط</option>
            </select>
          </FormField>
          {selectedProduct && (
            <div style={{ background: profit >= 0 ? "#e8f5e9" : "#ffebee", borderRadius: 8, padding: 12, marginBottom: 16, textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "#555" }}>الربح المتوقع</div>
              <div style={{ fontWeight: 800, fontSize: 20, color: profit >= 0 ? "#2e7d32" : "#c62828" }}>{dinarFmt(profit)}</div>
            </div>
          )}
          <button onClick={handleSell} disabled={saving} style={{ width: "100%", background: "#4a6fa5", color: "#fff", border: "none", borderRadius: 10, padding: 12, fontFamily: "inherit", fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? "⏳ جاري الحفظ..." : "✅ تأكيد البيع"}
          </button>
        </Modal>
      )}
    </div>
  );
}

// ==================== MAINTENANCE ====================
function MaintenanceSection({ maintenance, onRefresh }) {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ device: "", customer: "", cost: "", discount: "0", status: "قيد التنفيذ" });
  const [saving, setSaving] = useState(false);

  const finalCost = () => Math.max(0, Number(form.cost) - Number(form.discount));
  const hasDiscount = Number(form.discount) > 0;

  const openAdd = () => { setEditItem(null); setForm({ device: "", customer: "", cost: "", discount: "0", status: "قيد التنفيذ" }); setShowModal(true); };
  const openEdit = (m) => { setEditItem(m); setForm({ device: m.device, customer: m.customer, cost: String(m.cost), discount: String(m.discount || 0), status: m.status }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.device || !form.customer || !form.cost) return alert("الرجاء تعبئة جميع الحقول");
    setSaving(true);
    const data = { device: form.device, customer: form.customer, cost: Number(form.cost), discount: Number(form.discount), final_cost: finalCost(), status: form.status, paid: form.status === "مكتمل" };
    if (editItem) await db.update("maintenance", editItem.id, data);
    else await db.insert("maintenance", { id: uid(), date: today(), ...data });
    await onRefresh();
    setSaving(false);
    setShowModal(false);
  };

  const markDone = async (m) => {
    await db.update("maintenance", m.id, { status: "مكتمل", paid: true });
    await onRefresh();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>🔧 قسم الصيانة</h2>
        <button onClick={openAdd} style={{ background: "#f57c00", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontFamily: "inherit", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>+ طلب صيانة</button>
      </div>
      <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#f7f8fc" }}>
              {["التاريخ", "الجهاز", "العميل", "السعر", "الخصم", "الصافي", "الحالة", "إجراء"].map(h => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "#555", borderBottom: "2px solid #eee" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {maintenance.map((m, i) => {
              const net = m.final_cost ?? m.cost;
              const disc = m.discount || 0;
              return (
                <tr key={m.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafbff" }}>
                  <td style={{ padding: "10px 12px", color: "#888" }}>{m.date}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 600 }}>{m.device}</td>
                  <td style={{ padding: "10px 12px" }}>{m.customer}</td>
                  <td style={{ padding: "10px 12px", color: disc > 0 ? "#aaa" : "#1a1a2e", textDecoration: disc > 0 ? "line-through" : "none" }}>{dinarFmt(m.cost)}</td>
                  <td style={{ padding: "10px 12px", color: "#c62828" }}>{disc > 0 ? `-${dinarFmt(disc)}` : "—"}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 800, color: "#2e7d32" }}>{dinarFmt(net)}</td>
                  <td style={{ padding: "10px 12px" }}><Badge status={m.status} /></td>
                  <td style={{ padding: "10px 12px", display: "flex", gap: 4, flexWrap: "wrap" }}>
                    <button onClick={() => openEdit(m)} style={{ background: "#e3f2fd", color: "#1565c0", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 12 }}>✏️</button>
                    {m.status !== "مكتمل" && <button onClick={() => markDone(m)} style={{ background: "#e8f5e9", color: "#2e7d32", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 12 }}>✅</button>}
                  </td>
                </tr>
              );
            })}
            {maintenance.length === 0 && <tr><td colSpan={8} style={{ textAlign: "center", padding: 24, color: "#aaa" }}>لا توجد طلبات بعد</td></tr>}
          </tbody>
        </table>
      </div>
      {showModal && (
        <Modal title={editItem ? "تعديل طلب الصيانة" : "طلب صيانة جديد"} onClose={() => setShowModal(false)}>
          <FormField label="الجهاز والعطل"><input type="text" style={inputStyle} placeholder="مثال: iPhone 13 - شاشة" value={form.device} onChange={e => setForm(f => ({ ...f, device: e.target.value }))} /></FormField>
          <FormField label="اسم العميل"><input type="text" style={inputStyle} value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))} /></FormField>
          <FormField label="تكلفة الصيانة (د.ل)"><input type="number" style={inputStyle} value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} /></FormField>
          <FormField label="الخصم (د.ل) — اختياري">
            <input type="number" min="0" style={{ ...inputStyle, borderColor: hasDiscount ? "#f57c00" : "#e0e0e0" }} value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} />
          </FormField>
          {form.cost && (
            <div style={{ background: hasDiscount ? "#fff8e1" : "#f5f5f5", borderRadius: 10, padding: 14, marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center", border: hasDiscount ? "1.5px solid #f57c00" : "1.5px solid #eee" }}>
              <div>
                <div style={{ fontSize: 12, color: "#888" }}>السعر بعد الخصم</div>
                {hasDiscount && <div style={{ fontSize: 12, color: "#aaa", textDecoration: "line-through" }}>{dinarFmt(form.cost)}</div>}
              </div>
              <div style={{ fontWeight: 800, fontSize: 22, color: hasDiscount ? "#f57c00" : "#1a1a2e" }}>{dinarFmt(finalCost())}</div>
            </div>
          )}
          <FormField label="الحالة">
            <select style={inputStyle} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option>قيد التنفيذ</option><option>مكتمل</option>
            </select>
          </FormField>
          <button onClick={handleSave} disabled={saving} style={{ width: "100%", background: "#f57c00", color: "#fff", border: "none", borderRadius: 10, padding: 12, fontFamily: "inherit", fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? "⏳ جاري الحفظ..." : editItem ? "💾 حفظ التعديلات" : "➕ إضافة الطلب"}
          </button>
        </Modal>
      )}
    </div>
  );
}

// ==================== SOFTWARE ====================
function SoftwareSection({ software, onRefresh }) {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ service: "", customer: "", price: "", discount: "0", status: "قيد التنفيذ" });
  const [saving, setSaving] = useState(false);
  const services = ["فلاشة iPhone", "فلاشة Android", "إزالة iCloud", "إزالة FRP", "نقل بيانات", "تفعيل iOS", "إصلاح بوت لوب", "أخرى"];

  const finalPrice = () => Math.max(0, Number(form.price) - Number(form.discount));
  const hasDiscount = Number(form.discount) > 0;

  const openAdd = () => { setEditItem(null); setForm({ service: "", customer: "", price: "", discount: "0", status: "قيد التنفيذ" }); setShowModal(true); };
  const openEdit = (s) => { setEditItem(s); setForm({ service: s.service, customer: s.customer, price: String(s.price), discount: String(s.discount || 0), status: s.status }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.service || !form.customer || !form.price) return alert("الرجاء تعبئة جميع الحقول");
    setSaving(true);
    const data = { service: form.service, customer: form.customer, price: Number(form.price), discount: Number(form.discount), final_price: finalPrice(), status: form.status };
    if (editItem) await db.update("software", editItem.id, data);
    else await db.insert("software", { id: uid(), date: today(), ...data });
    await onRefresh();
    setSaving(false);
    setShowModal(false);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>💻 قسم السوفتوير</h2>
        <button onClick={openAdd} style={{ background: "#6a0dad", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontFamily: "inherit", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>+ خدمة جديدة</button>
      </div>
      <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#f7f8fc" }}>
              {["التاريخ", "الخدمة", "العميل", "السعر", "الخصم", "الصافي", "الحالة", "تعديل"].map(h => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "#555", borderBottom: "2px solid #eee" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {software.map((s, i) => {
              const net = s.final_price ?? s.price;
              const disc = s.discount || 0;
              return (
                <tr key={s.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafbff" }}>
                  <td style={{ padding: "10px 12px", color: "#888" }}>{s.date}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 600 }}>{s.service}</td>
                  <td style={{ padding: "10px 12px" }}>{s.customer}</td>
                  <td style={{ padding: "10px 12px", color: disc > 0 ? "#aaa" : "#1a1a2e", textDecoration: disc > 0 ? "line-through" : "none" }}>{dinarFmt(s.price)}</td>
                  <td style={{ padding: "10px 12px", color: "#c62828" }}>{disc > 0 ? `-${dinarFmt(disc)}` : "—"}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 800, color: "#2e7d32" }}>{dinarFmt(net)}</td>
                  <td style={{ padding: "10px 12px" }}><Badge status={s.status} /></td>
                  <td style={{ padding: "10px 12px" }}>
                    <button onClick={() => openEdit(s)} style={{ background: "#e3f2fd", color: "#1565c0", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 12 }}>✏️ تعديل</button>
                  </td>
                </tr>
              );
            })}
            {software.length === 0 && <tr><td colSpan={8} style={{ textAlign: "center", padding: 24, color: "#aaa" }}>لا توجد خدمات بعد</td></tr>}
          </tbody>
        </table>
      </div>
      {showModal && (
        <Modal title={editItem ? "تعديل الخدمة" : "خدمة سوفتوير جديدة"} onClose={() => setShowModal(false)}>
          <FormField label="نوع الخدمة">
            <select style={inputStyle} value={form.service} onChange={e => setForm(f => ({ ...f, service: e.target.value }))}>
              <option value="">اختر الخدمة</option>
              {services.map(s => <option key={s}>{s}</option>)}
            </select>
          </FormField>
          <FormField label="اسم العميل"><input type="text" style={inputStyle} value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))} /></FormField>
          <FormField label="السعر (د.ل)"><input type="number" style={inputStyle} value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></FormField>
          <FormField label="الخصم (د.ل) — اختياري">
            <input type="number" min="0" style={{ ...inputStyle, borderColor: hasDiscount ? "#6a0dad" : "#e0e0e0" }} value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} />
          </FormField>
          {form.price && (
            <div style={{ background: hasDiscount ? "#f3e5f5" : "#f5f5f5", borderRadius: 10, padding: 14, marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center", border: hasDiscount ? "1.5px solid #6a0dad" : "1.5px solid #eee" }}>
              <div>
                <div style={{ fontSize: 12, color: "#888" }}>السعر بعد الخصم</div>
                {hasDiscount && <div style={{ fontSize: 12, color: "#aaa", textDecoration: "line-through" }}>{dinarFmt(form.price)}</div>}
              </div>
              <div style={{ fontWeight: 800, fontSize: 22, color: hasDiscount ? "#6a0dad" : "#1a1a2e" }}>{dinarFmt(finalPrice())}</div>
            </div>
          )}
          <FormField label="الحالة">
            <select style={inputStyle} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option>قيد التنفيذ</option><option>مكتمل</option>
            </select>
          </FormField>
          <button onClick={handleSave} disabled={saving} style={{ width: "100%", background: "#6a0dad", color: "#fff", border: "none", borderRadius: 10, padding: 12, fontFamily: "inherit", fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? "⏳ جاري الحفظ..." : editItem ? "💾 حفظ التعديلات" : "➕ إضافة الخدمة"}
          </button>
        </Modal>
      )}
    </div>
  );
}

// ==================== DEBTS ====================
function DebtsSection({ debts, onRefresh }) {
  const handlePay = async (d, amt) => {
    const newPaid = Math.min(d.paid + amt, d.total);
    await db.update("debts", d.id, { paid: newPaid, remaining: d.total - newPaid });
    await onRefresh();
  };

  return (
    <div>
      <h2 style={{ margin: "0 0 18px", fontSize: 20, fontWeight: 800 }}>📋 إدارة الديون والأقساط</h2>
      <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
        <StatCard icon="💸" label="إجمالي الديون" value={dinarFmt(debts.reduce((s, d) => s + (d.remaining || 0), 0))} color="#c62828" />
        <StatCard icon="👥" label="عدد المدينين" value={debts.length} color="#4a6fa5" />
      </div>
      <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
        {debts.map((d, i) => {
          const pct = d.total > 0 ? Math.round((d.paid / d.total) * 100) : 0;
          return (
            <div key={d.id} style={{ borderBottom: i < debts.length - 1 ? "1px solid #f0f0f0" : "none", paddingBottom: 18, marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{d.customer}</div>
                  <div style={{ color: "#888", fontSize: 13 }}>{d.product}</div>
                  <div style={{ color: "#888", fontSize: 12, marginTop: 4 }}>موعد القسط: {d.next_due}</div>
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ color: "#c62828", fontWeight: 800, fontSize: 16 }}>متبقي: {dinarFmt(d.remaining)}</div>
                  <div style={{ color: "#2e7d32", fontSize: 13 }}>مدفوع: {dinarFmt(d.paid)}</div>
                </div>
              </div>
              <div style={{ marginTop: 10 }}>
                <div style={{ background: "#f0f0f0", borderRadius: 20, height: 8, overflow: "hidden" }}>
                  <div style={{ background: "#4a6fa5", height: "100%", width: `${pct}%`, borderRadius: 20 }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#888", marginTop: 4 }}>
                  <span>{pct}% مدفوع</span>
                  <span>الإجمالي: {dinarFmt(d.total)}</span>
                </div>
              </div>
              <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[200, 500, 1000].map(amt => (
                  <button key={amt} onClick={() => handlePay(d, amt)} style={{ background: "#e8f5e9", color: "#2e7d32", border: "none", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 13 }}>+{amt}</button>
                ))}
              </div>
            </div>
          );
        })}
        {debts.length === 0 && <div style={{ textAlign: "center", padding: 32, color: "#aaa" }}>لا توجد ديون مسجلة 🎉</div>}
      </div>
    </div>
  );
}

// ==================== BARCODE ====================
function BarcodeBar({ value }) {
  // Simple Code128-style visual barcode using bars
  const encode = (str) => {
    let bars = [];
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      const pattern = (code * 3 + i * 7 + 13) % 15;
      bars.push({ w: (pattern % 3) + 1, gap: (pattern % 2) + 1 });
    }
    return bars;
  };
  const bars = encode(value);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", height: 50, gap: 1, justifyContent: "center", margin: "8px 0" }}>
      <div style={{ width: 2, height: 50, background: "#000" }} />
      {bars.map((b, i) => (
        <div key={i} style={{ display: "flex", gap: b.gap }}>
          <div style={{ width: b.w * 2, height: 50, background: "#000" }} />
          <div style={{ width: b.gap * 2, height: 50, background: "#fff" }} />
        </div>
      ))}
      <div style={{ width: 2, height: 50, background: "#000" }} />
    </div>
  );
}

function PrintLabel({ product, onClose }) {
  const handlePrint = () => {
    const qty = product.stock || 1;
    const labels = Array.from({ length: qty }).map((_, idx) => `
      <div class="label">
        <div class="shop">أبل للهاتف المحمول - الزاوية</div>
        <div class="name">${product.name}</div>
        <div class="code">كود: ${product.barcode}</div>
        <div class="barcode" id="bc${idx}"></div>
        <div class="num">${product.barcode}</div>
        <div class="price">${Number(product.sell_price).toLocaleString("ar-LY")} د.ل</div>
      </div>
    `).join("");

    const scripts = Array.from({ length: qty }).map((_, idx) => `
      (function(){
        const bc = document.getElementById('bc${idx}');
        const val = "${product.barcode}";
        bc.innerHTML = '<div class="bar" style="width:3px;height:50px"></div>';
        for(let i=0;i<val.length;i++){
          const c=val.charCodeAt(i);
          const p=(c*3+i*7+13)%15;
          bc.innerHTML += '<div class="bar" style="width:'+(p%3+1)*3+'px;height:50px"></div>';
          bc.innerHTML += '<div style="width:'+(p%2+1)*2+'px;height:50px"></div>';
        }
        bc.innerHTML += '<div class="bar" style="width:3px;height:50px"></div>';
      })();
    `).join("");

    const w = window.open("", "_blank");
    w.document.write(`
      <html><head><title>بطاقات سعر - ${product.name}</title>
      <style>
        body { font-family: Arial, sans-serif; direction: rtl; margin: 0; padding: 10px; }
        .grid { display: flex; flex-wrap: wrap; gap: 10px; }
        .label { border: 2px solid #000; border-radius: 8px; padding: 12px; width: 180px; text-align: center; page-break-inside: avoid; }
        .shop { font-size: 10px; color: #555; margin-bottom: 4px; }
        .name { font-size: 12px; font-weight: bold; margin-bottom: 4px; }
        .code { font-size: 10px; color: #888; margin-bottom: 4px; }
        .price { font-size: 18px; font-weight: 900; color: #1a1a2e; margin: 6px 0; }
        .barcode { display: flex; justify-content: center; align-items: flex-end; height: 45px; gap: 1px; margin: 6px 0; }
        .bar { background: #000; }
        .num { font-size: 9px; letter-spacing: 2px; margin-top: 2px; }
        @media print { body { margin: 0; } }
      </style></head><body>
      <div class="grid">${labels}</div>
      <script>${scripts} window.print();</script>
      </body></html>
    `);
    w.document.close();
  };

  return (
    <Modal title="طباعة بطاقة السعر" onClose={onClose}>
      <div style={{ textAlign: "center", border: "2px solid #1a1a2e", borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>أبل للهاتف المحمول - الزاوية</div>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>{product.name}</div>
        <div style={{ fontSize: 11, color: "#888" }}>كود: {product.barcode}</div>
        <BarcodeBar value={product.barcode} />
        <div style={{ fontSize: 10, letterSpacing: 3, color: "#555", marginBottom: 8 }}>{product.barcode}</div>
        <div style={{ fontWeight: 900, fontSize: 24, color: "#1a1a2e" }}>{dinarFmt(product.sell_price)}</div>
      </div>
      <button onClick={handlePrint} style={{ width: "100%", background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 10, padding: 12, fontFamily: "inherit", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
        🖨️ طباعة البطاقة
      </button>
    </Modal>
  );
}

// ==================== INVENTORY ====================
function InventorySection({ products, onRefresh }) {
  const [showModal, setShowModal] = useState(false);
  const [printProduct, setPrintProduct] = useState(null);
  const [form, setForm] = useState({ category: "iphone", name: "", buyPrice: "", sellPrice: "", stock: "", barcode: "" });
  const [saving, setSaving] = useState(false);

  const allProducts = [
    ...(products.iphone || []).map(p => ({ ...p, cat: "📱 آيفون" })),
    ...(products.android || []).map(p => ({ ...p, cat: "🤖 أندرويد" })),
    ...(products.accessories || []).map(p => ({ ...p, cat: "🎧 إكسسوارات" })),
  ];

  const handleAdd = async () => {
    if (!form.name || !form.buyPrice || !form.sellPrice || !form.stock) return alert("الرجاء تعبئة جميع الحقول");
    setSaving(true);
    await db.insertProduct({ id: uid(), category: form.category, name: form.name, buy_price: Number(form.buyPrice), sell_price: Number(form.sellPrice), stock: Number(form.stock), color: "", barcode: form.barcode || uid().toUpperCase() });
    await onRefresh();
    setSaving(false);
    setShowModal(false);
    setForm({ category: "iphone", name: "", buyPrice: "", sellPrice: "", stock: "", barcode: "" });
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>📦 الجرد والمخزون</h2>
        <button onClick={() => setShowModal(true)} style={{ background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontFamily: "inherit", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>+ إضافة منتج</button>
      </div>
      <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#f7f8fc" }}>
              {["الفئة", "المنتج", "الكود", "سعر الشراء", "سعر البيع", "هامش الربح", "المخزون", "طباعة"].map(h => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "#555", borderBottom: "2px solid #eee" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allProducts.map((p, i) => {
              const margin = p.buy_price > 0 ? Math.round(((p.sell_price - p.buy_price) / p.buy_price) * 100) : 0;
              return (
                <tr key={p.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafbff" }}>
                  <td style={{ padding: "10px 12px", fontSize: 12 }}>{p.cat}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 600 }}>{p.name}</td>
                  <td style={{ padding: "10px 12px", color: "#888", fontSize: 12 }}>{p.barcode || "—"}</td>
                  <td style={{ padding: "10px 12px", color: "#c62828" }}>{dinarFmt(p.buy_price)}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 700 }}>{dinarFmt(p.sell_price)}</td>
                  <td style={{ padding: "10px 12px", color: "#2e7d32", fontWeight: 700 }}>{margin}%</td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ background: p.stock < 3 ? "#ffebee" : "#e8f5e9", color: p.stock < 3 ? "#c62828" : "#2e7d32", borderRadius: 20, padding: "3px 12px", fontWeight: 700, fontSize: 13 }}>{p.stock}</span>
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <button onClick={() => setPrintProduct(p)} style={{ background: "#e3f2fd", color: "#1565c0", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 12 }}>🖨️ طباعة</button>
                  </td>
                </tr>
              );
            })}
            {allProducts.length === 0 && <tr><td colSpan={8} style={{ textAlign: "center", padding: 24, color: "#aaa" }}>لا توجد منتجات بعد</td></tr>}
          </tbody>
        </table>
      </div>
      {showModal && (
        <Modal title="إضافة منتج جديد" onClose={() => setShowModal(false)}>
          <FormField label="الفئة">
            <select style={inputStyle} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              <option value="iphone">آيفون</option>
              <option value="android">أندرويد</option>
              <option value="accessories">إكسسوارات</option>
            </select>
          </FormField>
          <FormField label="اسم المنتج"><input type="text" style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></FormField>
          <FormField label="رقم الباركود (اختياري — أو سيُولَّد تلقائياً)"><input type="text" style={inputStyle} placeholder="مثال: 12345" value={form.barcode} onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))} /></FormField>
          <FormField label="سعر الشراء (د.ل)"><input type="number" style={inputStyle} value={form.buyPrice} onChange={e => setForm(f => ({ ...f, buyPrice: e.target.value }))} /></FormField>
          <FormField label="سعر البيع (د.ل)"><input type="number" style={inputStyle} value={form.sellPrice} onChange={e => setForm(f => ({ ...f, sellPrice: e.target.value }))} /></FormField>
          <FormField label="الكمية في المخزون"><input type="number" style={inputStyle} value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} /></FormField>
          <button onClick={handleAdd} disabled={saving} style={{ width: "100%", background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 10, padding: 12, fontFamily: "inherit", fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? "⏳ جاري الحفظ..." : "➕ إضافة المنتج"}
          </button>
        </Modal>
      )}
      {printProduct && <PrintLabel product={printProduct} onClose={() => setPrintProduct(null)} />}
    </div>
  );
}

// ==================== REPORTS ====================
function ReportsSection({ sales, maintenance, software }) {
  const totalRevenue = sales.reduce((s, x) => s + (x.sell_price || 0) * (x.qty || 1), 0);
  const totalCost = sales.reduce((s, x) => s + (x.buy_price || 0) * (x.qty || 1), 0);
  const totalProfit = totalRevenue - totalCost;
  const maintIncome = maintenance.filter(m => m.paid).reduce((s, m) => s + (m.final_cost ?? m.cost), 0);
  const swIncome = software.filter(s => s.status === "مكتمل").reduce((s, x) => s + (x.final_price ?? x.price), 0);
  const grand = totalProfit + maintIncome + swIncome;

  const byType = [
    { label: "آيفون", value: sales.filter(s => s.type === "iphone").reduce((s, x) => s + ((x.sell_price || 0) - (x.buy_price || 0)) * (x.qty || 1), 0), color: "#4a6fa5" },
    { label: "أندرويد", value: sales.filter(s => s.type === "android").reduce((s, x) => s + ((x.sell_price || 0) - (x.buy_price || 0)) * (x.qty || 1), 0), color: "#2e7d32" },
    { label: "إكسسوارات", value: sales.filter(s => s.type === "accessories").reduce((s, x) => s + ((x.sell_price || 0) - (x.buy_price || 0)) * (x.qty || 1), 0), color: "#f57c00" },
    { label: "صيانة", value: maintIncome, color: "#c62828" },
    { label: "سوفتوير", value: swIncome, color: "#6a0dad" },
  ];

  return (
    <div>
      <h2 style={{ margin: "0 0 18px", fontSize: 20, fontWeight: 800 }}>📊 التقارير والأرباح</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 24 }}>
        <StatCard icon="💰" label="إجمالي المبيعات" value={dinarFmt(totalRevenue)} color="#4a6fa5" />
        <StatCard icon="📉" label="تكلفة البضاعة" value={dinarFmt(totalCost)} color="#c62828" />
        <StatCard icon="📈" label="ربح المبيعات" value={dinarFmt(totalProfit)} color="#2e7d32" />
        <StatCard icon="🏆" label="صافي الدخل الكلي" value={dinarFmt(grand)} color="#6a0dad" sub="شامل الصيانة والسوفتوير" />
      </div>
      <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
        <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 700 }}>توزيع الأرباح حسب القسم</h3>
        {byType.map(item => {
          const pct = grand > 0 ? Math.round((item.value / grand) * 100) : 0;
          return (
            <div key={item.label} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontWeight: 600 }}>{item.label}</span>
                <span style={{ fontWeight: 700, color: item.color }}>{dinarFmt(item.value)} ({pct}%)</span>
              </div>
              <div style={{ background: "#f0f0f0", borderRadius: 20, height: 10, overflow: "hidden" }}>
                <div style={{ background: item.color, height: "100%", width: `${pct}%`, borderRadius: 20 }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==================== EMPLOYEES ====================
function EmployeesSection({ employees, onRefresh }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", permissions: "", salary: "" });
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!form.name || !form.role) return alert("الرجاء تعبئة الاسم والمنصب");
    setSaving(true);
    await db.insert("employees", { id: uid(), name: form.name, role: form.role, permissions: form.permissions, salary: Number(form.salary) });
    await onRefresh();
    setSaving(false);
    setShowModal(false);
    setForm({ name: "", role: "", permissions: "", salary: "" });
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>👥 إدارة الموظفين</h2>
        <button onClick={() => setShowModal(true)} style={{ background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontFamily: "inherit", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>+ موظف جديد</button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
        {employees.map(e => (
          <div key={e.id} style={{ background: "#fff", borderRadius: 14, padding: 20, flex: 1, minWidth: 200, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#4a6fa5", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, margin: "0 auto 12px" }}>
              {e.name[0]}
            </div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>{e.name}</div>
            <div style={{ color: "#4a6fa5", fontWeight: 600, fontSize: 13, marginTop: 4 }}>{e.role}</div>
            <div style={{ color: "#888", fontSize: 12, marginTop: 4 }}>صلاحيات: {e.permissions}</div>
            {e.salary > 0 && <div style={{ color: "#2e7d32", fontWeight: 700, marginTop: 8 }}>{dinarFmt(e.salary)} / شهر</div>}
          </div>
        ))}
        {employees.length === 0 && <div style={{ color: "#aaa" }}>لا يوجد موظفون مسجلون</div>}
      </div>
      {showModal && (
        <Modal title="إضافة موظف" onClose={() => setShowModal(false)}>
          <FormField label="الاسم الكامل"><input type="text" style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></FormField>
          <FormField label="المنصب"><input type="text" style={inputStyle} placeholder="بائع / محاسب / فني..." value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} /></FormField>
          <FormField label="الصلاحيات"><input type="text" style={inputStyle} placeholder="مبيعات، تقارير..." value={form.permissions} onChange={e => setForm(f => ({ ...f, permissions: e.target.value }))} /></FormField>
          <FormField label="الراتب الشهري (د.ل)"><input type="number" style={inputStyle} value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))} /></FormField>
          <button onClick={handleAdd} disabled={saving} style={{ width: "100%", background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 10, padding: 12, fontFamily: "inherit", fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? "⏳ جاري الحفظ..." : "➕ إضافة الموظف"}
          </button>
        </Modal>
      )}
    </div>
  );
}

// ==================== MAIN APP ====================
const SECTIONS = [
  { key: "dashboard", icon: "🏠", label: "لوحة التحكم" },
  { key: "iphone", icon: "📱", label: "مبيعات آيفون" },
  { key: "android", icon: "🤖", label: "مبيعات أندرويد" },
  { key: "accessories", icon: "🎧", label: "الإكسسوارات" },
  { key: "maintenance", icon: "🔧", label: "الصيانة" },
  { key: "software", icon: "💻", label: "السوفتوير" },
  { key: "debts", icon: "📋", label: "الديون والأقساط" },
  { key: "inventory", icon: "📦", label: "الجرد والمخزون" },
  { key: "reports", icon: "📊", label: "التقارير" },
  { key: "employees", icon: "👥", label: "الموظفين" },
];

// ==================== PASSWORDS ====================
const PASSWORDS = {
  admin: "apple2024",   // كلمة سر المدير — غيّرها لاحقاً
  seller: "sell1234",   // كلمة سر البائع — غيّرها لاحقاً
};

const SELLER_SECTIONS = ["dashboard", "iphone", "android", "accessories", "maintenance", "software"];
const ADMIN_SECTIONS = SECTIONS.map(s => s.key);

// ==================== LOGIN ====================
function LoginScreen({ onLogin }) {
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (pass === PASSWORDS.admin) { onLogin("admin"); }
    else if (pass === PASSWORDS.seller) { onLogin("seller"); }
    else { setError("كلمة السر غلط، حاول مرة ثانية"); setPass(""); }
  };

  return (
    <div dir="rtl" style={{ fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif", height: "100vh", background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 40, width: 320, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>📱</div>
        <div style={{ fontWeight: 900, fontSize: 20, color: "#1a1a2e", marginBottom: 4 }}>أبل للهاتف المحمول</div>
        <div style={{ color: "#888", fontSize: 13, marginBottom: 28 }}>الزاوية، ليبيا</div>
        <div style={{ textAlign: "right", marginBottom: 8, fontSize: 13, fontWeight: 600, color: "#555" }}>كلمة السر</div>
        <input
          type="password"
          placeholder="أدخل كلمة السر"
          value={pass}
          onChange={e => { setPass(e.target.value); setError(""); }}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
          style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #e0e0e0", fontSize: 16, fontFamily: "inherit", boxSizing: "border-box", marginBottom: 12, outline: "none", textAlign: "center", letterSpacing: 4 }}
        />
        {error && <div style={{ color: "#c62828", fontSize: 13, marginBottom: 12 }}>{error}</div>}
        <button onClick={handleLogin} style={{ width: "100%", background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 10, padding: 13, fontFamily: "inherit", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
          🔓 دخول
        </button>
        <div style={{ marginTop: 20, fontSize: 11, color: "#ccc" }}>
          مدير / بائع
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN APP ====================
export default function App() {
  const [role, setRole] = useState(null); // null = not logged in
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ sales: [], maintenance: [], software: [], debts: [], employees: [], products: { iphone: [], android: [], accessories: [] } });

  const loadAll = async () => {
    setLoading(true);
    const [sales, maintenance, software, debts, employees, products] = await Promise.all([
      db.get("sales"), db.get("maintenance"), db.get("software"), db.get("debts"), db.get("employees"), db.getProducts()
    ]);
    setData({ sales, maintenance, software, debts, employees, products });
    setLoading(false);
  };

  useEffect(() => { if (role) loadAll(); }, [role]);

  if (!role) return <LoginScreen onLogin={setRole} />;

  const allowedSections = SECTIONS.filter(s => role === "admin" ? true : SELLER_SECTIONS.includes(s.key));
  const isAdmin = role === "admin";

  const renderSection = () => {
    if (loading) return <Loader />;
    switch (activeSection) {
      case "dashboard": return <Dashboard sales={data.sales} maintenance={data.maintenance} debts={data.debts} />;
      case "iphone": return <SalesSection type="iphone" title="مبيعات آيفون" icon="📱" products={data.products} sales={data.sales} onRefresh={loadAll} isAdmin={isAdmin} />;
      case "android": return <SalesSection type="android" title="مبيعات أندرويد" icon="🤖" products={data.products} sales={data.sales} onRefresh={loadAll} isAdmin={isAdmin} />;
      case "accessories": return <SalesSection type="accessories" title="الإكسسوارات" icon="🎧" products={data.products} sales={data.sales} onRefresh={loadAll} isAdmin={isAdmin} />;
      case "maintenance": return <MaintenanceSection maintenance={data.maintenance} onRefresh={loadAll} isAdmin={isAdmin} />;
      case "software": return <SoftwareSection software={data.software} onRefresh={loadAll} isAdmin={isAdmin} />;
      case "debts": return <DebtsSection debts={data.debts} onRefresh={loadAll} />;
      case "inventory": return <InventorySection products={data.products} onRefresh={loadAll} />;
      case "reports": return <ReportsSection sales={data.sales} maintenance={data.maintenance} software={data.software} />;
      case "employees": return <EmployeesSection employees={data.employees} onRefresh={loadAll} />;
      default: return null;
    }
  };

  return (
    <div dir="rtl" style={{ fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif", display: "flex", height: "100vh", background: "#f4f6fb", overflow: "hidden" }}>
      <div style={{ width: sidebarOpen ? 220 : 64, background: "#1a1a2e", transition: "width .3s", display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0, zIndex: 10 }}>
        <div style={{ padding: "18px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setSidebarOpen(o => !o)} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, width: 32, height: 32, color: "#fff", cursor: "pointer", fontSize: 16, flexShrink: 0 }}>☰</button>
          {sidebarOpen && <div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 14, lineHeight: 1.2 }}>أبل للهاتف المحمول</div>
            <div style={{ color: isAdmin ? "#4caf50" : "#ffb74d", fontSize: 11 }}>{isAdmin ? "👑 مدير" : "👤 بائع"}</div>
          </div>}
        </div>
        <nav style={{ flex: 1, overflowY: "auto", padding: "8px 8px" }}>
          {allowedSections.map(s => (
            <button key={s.key} onClick={() => { setActiveSection(s.key); setSidebarOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "right", padding: "11px 12px", borderRadius: 10, border: "none", cursor: "pointer", background: activeSection === s.key ? "rgba(74,111,165,0.4)" : "transparent", color: activeSection === s.key ? "#7eb3ff" : "#bbb", fontFamily: "inherit", fontSize: 13, fontWeight: activeSection === s.key ? 700 : 400, marginBottom: 2, transition: "all .2s", whiteSpace: "nowrap" }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{s.icon}</span>
              {sidebarOpen && <span>{s.label}</span>}
            </button>
          ))}
        </nav>
        {sidebarOpen && (
          <div style={{ padding: 16, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <button onClick={() => setRole(null)} style={{ width: "100%", background: "#c62828", color: "#fff", border: "none", borderRadius: 8, padding: "8px", fontFamily: "inherit", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              🚪 خروج
            </button>
          </div>
        )}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          {renderSection()}
        </div>
      </div>
    </div>
  );
}
