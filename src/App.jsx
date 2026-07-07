import { useState, useEffect } from "react";

// ==================== SUPABASE CONFIG ====================
const SUPABASE_URL = "https://rytmfebuxsviqhlltbez.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5dG1mZWJ1eHN2aXFobGx0YmV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1OTAzMjUsImV4cCI6MjA5ODE2NjMyNX0.aAJjA_9rSqNy5RK_cpfGJdaFbE4mJBBfJB1qUJdy7aY";

const H = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };
const HJ = { ...H, "Content-Type": "application/json", Prefer: "return=minimal" };

const db = {
  async get(table, query = "") {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, { headers: H });
    return r.ok ? r.json() : [];
  },
  async insert(table, data) {
    await fetch(`${SUPABASE_URL}/rest/v1/${table}`, { method: "POST", headers: HJ, body: JSON.stringify(data) });
  },
  async update(table, id, data) {
    await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, { method: "PATCH", headers: { ...H, "Content-Type": "application/json" }, body: JSON.stringify(data) });
  },
  async remove(table, id) {
    await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, { method: "DELETE", headers: H });
  },
};

// ==================== HELPERS ====================
const fmt = (n) => `${Number(n || 0).toLocaleString("ar-LY")} د.ل`;
const today = () => new Date().toISOString().split("T")[0];
const nowTime = () => new Date().toLocaleTimeString("ar-LY", { hour: "2-digit", minute: "2-digit" });
const uid = () => Math.random().toString(36).slice(2, 10);
const genBarcode = () => String(Math.floor(100000000000 + Math.random() * 899999999999));

// ==================== SHARED UI ====================
const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e0e0e0", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", outline: "none" };
const btnStyle = (bg) => ({ background: bg, color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontFamily: "inherit", fontWeight: 700, cursor: "pointer", fontSize: 14 });

function StatCard({ icon, label, value, color, sub }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: "18px 16px", flex: 1, minWidth: 150, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", borderTop: `4px solid ${color}` }}>
      <div style={{ fontSize: 24 }}>{icon}</div>
      <div style={{ color: "#888", fontSize: 12, marginTop: 4 }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: 20, color: "#1a1a2e", marginTop: 2 }}>{value}</div>
      {sub && <div style={{ color, fontSize: 11, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 24, width: wide ? 640 : 440, maxWidth: "96%", maxHeight: "88vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "#f0f0f0", border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}

function Badge({ text, color = "#1565c0", bg = "#e3f2fd" }) {
  return <span style={{ background: bg, color, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>{text}</span>;
}

function Loader() {
  return <div style={{ textAlign: "center", padding: 40, color: "#888" }}>⏳ جاري التحميل...</div>;
}

// ==================== BARCODE PRINT ====================
function printLabels(product, qty) {
  const labels = Array.from({ length: qty }).map((_, i) => `
    <div class="label">
      <div class="shop">أبل للهاتف المحمول - الزاوية</div>
      <div class="name">${product.name}</div>
      <div class="barcode" id="bc${i}"></div>
      <div class="num">${product.barcode}</div>
      <div class="price">${Number(product.sell_price).toLocaleString("ar-LY")} د.ل</div>
    </div>`).join("");
  const scripts = Array.from({ length: qty }).map((_, i) => `
    (function(){const b=document.getElementById('bc${i}');const v="${product.barcode}";
    b.innerHTML='<div class="bar" style="width:3px"></div>';
    for(let j=0;j<v.length;j++){const c=v.charCodeAt(j);const p=(c*3+j*7+13)%15;
    b.innerHTML+='<div class="bar" style="width:'+((p%3)+1)*2+'px"></div><div style="width:'+((p%2)+1)*2+'px"></div>';}
    b.innerHTML+='<div class="bar" style="width:3px"></div>';})();`).join("");
  const w = window.open("", "_blank");
  w.document.write(`<html><head><title>بطاقات - ${product.name}</title><style>
    body{font-family:Arial;direction:rtl;margin:0;padding:8px}
    .grid,body{display:flex;flex-wrap:wrap;gap:8px}
    .label{border:2px solid #000;border-radius:8px;padding:10px;width:170px;text-align:center;page-break-inside:avoid}
    .shop{font-size:9px;color:#555}.name{font-size:12px;font-weight:bold;margin:3px 0}
    .price{font-size:17px;font-weight:900;margin-top:5px}
    .barcode{display:flex;justify-content:center;align-items:flex-end;height:42px;gap:1px;margin:5px 0}
    .bar{background:#000;height:42px}.num{font-size:9px;letter-spacing:2px}
    @media print{body{margin:0}}</style></head><body>${labels}<script>${scripts}window.print();</` + `script></body></html>`);
  w.document.close();
}

// ==================== LOGIN ====================
function LoginScreen({ onLogin, sellers }) {
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (pass === "apple2024") return onLogin({ role: "admin", name: "المدير" });
    const seller = sellers.find(s => s.password === pass);
    if (seller) return onLogin({ role: "seller", name: seller.name, id: seller.id });
    setError("كلمة السر غلط");
    setPass("");
  };

  return (
    <div dir="rtl" style={{ fontFamily: "'Segoe UI',Tahoma,Arial,sans-serif", height: "100vh", background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 36, width: 320, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ fontSize: 44 }}>📱</div>
        <div style={{ fontWeight: 900, fontSize: 19, marginTop: 6 }}>أبل للهاتف المحمول</div>
        <div style={{ color: "#888", fontSize: 12, marginBottom: 24 }}>الزاوية، ليبيا</div>
        <input type="password" placeholder="كلمة السر" value={pass}
          onChange={e => { setPass(e.target.value); setError(""); }}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
          style={{ ...inputStyle, textAlign: "center", letterSpacing: 4, fontSize: 16, marginBottom: 10 }} />
        {error && <div style={{ color: "#c62828", fontSize: 13, marginBottom: 10 }}>{error}</div>}
        <button onClick={handleLogin} style={{ ...btnStyle("#1a1a2e"), width: "100%", padding: 13 }}>🔓 دخول</button>
      </div>
    </div>
  );
}

// ==================== CATEGORIES (أقسام رئيسية وفرعية) ====================
function CategoriesSection({ categories, onRefresh }) {
  const [showMain, setShowMain] = useState(false);
  const [showSub, setShowSub] = useState(null); // main category object
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📦");

  const mains = categories.filter(c => !c.parent_id);
  const subsOf = (id) => categories.filter(c => c.parent_id === id);

  const addMain = async () => {
    if (!name) return alert("اكتب اسم القسم");
    await db.insert("categories", { id: uid(), name, icon, parent_id: null });
    setName(""); setIcon("📦"); setShowMain(false);
    await onRefresh();
  };

  const addSub = async () => {
    if (!name) return alert("اكتب اسم القسم الفرعي");
    await db.insert("categories", { id: uid(), name, icon: "", parent_id: showSub.id });
    setName(""); setShowSub(null);
    await onRefresh();
  };

  const deleteCategory = async (c) => {
    if (!window.confirm(`حذف القسم "${c.name}"؟`)) return;
    await db.remove("categories", c.id);
    await onRefresh();
  };

  const icons = ["📱", "🎧", "💻", "⌚", "🔌", "🔋", "📦", "🖥️", "🎮", "📷"];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>📁 الأقسام</h2>
        <button onClick={() => setShowMain(true)} style={btnStyle("#1a1a2e")}>+ قسم رئيسي</button>
      </div>
      {mains.length === 0 && <div style={{ color: "#aaa", padding: 30, textAlign: "center", background: "#fff", borderRadius: 14 }}>لا توجد أقسام — أضف قسم رئيسي أولاً (مثال: هواتف، إكسسوارات)</div>}
      {mains.map(m => (
        <div key={m.id} style={{ background: "#fff", borderRadius: 14, padding: 18, marginBottom: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>{m.icon} {m.name}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setName(""); setShowSub(m); }} style={{ ...btnStyle("#4a6fa5"), padding: "6px 14px", fontSize: 12 }}>+ فرعي</button>
              <button onClick={() => deleteCategory(m)} style={{ ...btnStyle("#c62828"), padding: "6px 14px", fontSize: 12 }}>حذف</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {subsOf(m.id).map(s => (
              <div key={s.id} style={{ background: "#f4f6fb", borderRadius: 20, padding: "6px 14px", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                {s.name}
                <span onClick={() => deleteCategory(s)} style={{ cursor: "pointer", color: "#c62828", fontWeight: 800 }}>✕</span>
              </div>
            ))}
            {subsOf(m.id).length === 0 && <span style={{ color: "#aaa", fontSize: 12 }}>لا أقسام فرعية (مثال: آيفون، سامسونج)</span>}
          </div>
        </div>
      ))}
      {showMain && (
        <Modal title="قسم رئيسي جديد" onClose={() => setShowMain(false)}>
          <Field label="اسم القسم (مثال: هواتف)"><input style={inputStyle} value={name} onChange={e => setName(e.target.value)} /></Field>
          <Field label="أيقونة">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {icons.map(i => <button key={i} onClick={() => setIcon(i)} style={{ fontSize: 22, padding: 6, border: icon === i ? "2px solid #1a1a2e" : "1px solid #eee", borderRadius: 8, background: "#fff", cursor: "pointer" }}>{i}</button>)}
            </div>
          </Field>
          <button onClick={addMain} style={{ ...btnStyle("#1a1a2e"), width: "100%" }}>➕ إضافة</button>
        </Modal>
      )}
      {showSub && (
        <Modal title={`قسم فرعي تحت "${showSub.name}"`} onClose={() => setShowSub(null)}>
          <Field label="اسم القسم الفرعي (مثال: آيفون)"><input style={inputStyle} value={name} onChange={e => setName(e.target.value)} /></Field>
          <button onClick={addSub} style={{ ...btnStyle("#4a6fa5"), width: "100%" }}>➕ إضافة</button>
        </Modal>
      )}
    </div>
  );
}

// ==================== PRODUCTS / INVENTORY ====================
function ProductsSection({ products, categories, onRefresh, isAdmin }) {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ mainCat: "", subCat: "", name: "", buyPrice: "", sellPrice: "", stock: "", barcode: "" });
  const [saving, setSaving] = useState(false);

  const mains = categories.filter(c => !c.parent_id);
  const subsOf = (id) => categories.filter(c => c.parent_id === id);
  const catName = (id) => categories.find(c => c.id === id)?.name || "—";

  const filtered = products.filter(p =>
    !search || p.name?.includes(search) || p.barcode?.includes(search)
  );

  const handleAdd = async () => {
    if (!form.name || !form.sellPrice || !form.stock || !form.mainCat) return alert("عبّئ الاسم والقسم والسعر والكمية");
    setSaving(true);
    const bc = form.barcode.trim() || genBarcode();
    const newProduct = {
      id: uid(), name: form.name, main_cat: form.mainCat, sub_cat: form.subCat || null,
      buy_price: Number(form.buyPrice || 0), sell_price: Number(form.sellPrice),
      stock: Number(form.stock), barcode: bc,
    };
    await db.insert("products2", newProduct);
    await onRefresh();
    setSaving(false);
    setShowModal(false);
    setForm({ mainCat: "", subCat: "", name: "", buyPrice: "", sellPrice: "", stock: "", barcode: "" });
    if (window.confirm(`تم الحفظ ✅\nطباعة ${newProduct.stock} بطاقة باركود الآن؟`)) {
      printLabels(newProduct, newProduct.stock);
    }
  };

  const deleteProduct = async (p) => {
    if (!window.confirm(`حذف "${p.name}"؟`)) return;
    await db.remove("products2", p.id);
    await onRefresh();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>📦 المخزون والجرد</h2>
        {isAdmin && <button onClick={() => setShowModal(true)} style={btnStyle("#1a1a2e")}>+ إضافة منتج</button>}
      </div>
      <input style={{ ...inputStyle, marginBottom: 14, fontSize: 15 }} placeholder="🔍 ابحث بالاسم أو الباركود..." value={search} onChange={e => setSearch(e.target.value)} />
      <div style={{ background: "#fff", borderRadius: 14, padding: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr style={{ background: "#f7f8fc" }}>
            {(isAdmin
              ? ["المنتج", "القسم", "الباركود", "سعر الشراء", "سعر البيع", "المتبقي", "إجراء"]
              : ["المنتج", "القسم", "الباركود", "سعر البيع", "المتبقي"]
            ).map(h => <th key={h} style={{ padding: "9px 10px", textAlign: "right", fontWeight: 700, color: "#555", borderBottom: "2px solid #eee", whiteSpace: "nowrap" }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr key={p.id} style={{ background: i % 2 ? "#fafbff" : "#fff" }}>
                <td style={{ padding: "9px 10px", fontWeight: 600 }}>{p.name}</td>
                <td style={{ padding: "9px 10px", fontSize: 11, color: "#666" }}>{catName(p.main_cat)}{p.sub_cat ? ` › ${catName(p.sub_cat)}` : ""}</td>
                <td style={{ padding: "9px 10px", fontSize: 11, color: "#888", direction: "ltr" }}>{p.barcode}</td>
                {isAdmin && <td style={{ padding: "9px 10px", color: "#c62828" }}>{fmt(p.buy_price)}</td>}
                <td style={{ padding: "9px 10px", fontWeight: 700 }}>{fmt(p.sell_price)}</td>
                <td style={{ padding: "9px 10px" }}>
                  <Badge text={`${p.stock} قطعة`} color={p.stock < 3 ? "#c62828" : "#2e7d32"} bg={p.stock < 3 ? "#ffebee" : "#e8f5e9"} />
                </td>
                {isAdmin && <td style={{ padding: "9px 10px", whiteSpace: "nowrap" }}>
                  <button onClick={() => printLabels(p, p.stock)} style={{ ...btnStyle("#4a6fa5"), padding: "4px 10px", fontSize: 11, marginLeft: 4 }}>🖨️</button>
                  <button onClick={() => deleteProduct(p)} style={{ ...btnStyle("#c62828"), padding: "4px 10px", fontSize: 11 }}>🗑️</button>
                </td>}
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", padding: 24, color: "#aaa" }}>لا توجد منتجات</td></tr>}
          </tbody>
        </table>
      </div>
      {showModal && (
        <Modal title="إضافة منتج جديد" onClose={() => setShowModal(false)}>
          <Field label="القسم الرئيسي *">
            <select style={inputStyle} value={form.mainCat} onChange={e => setForm(f => ({ ...f, mainCat: e.target.value, subCat: "" }))}>
              <option value="">اختر القسم</option>
              {mains.map(m => <option key={m.id} value={m.id}>{m.icon} {m.name}</option>)}
            </select>
          </Field>
          {form.mainCat && subsOf(form.mainCat).length > 0 && (
            <Field label="القسم الفرعي">
              <select style={inputStyle} value={form.subCat} onChange={e => setForm(f => ({ ...f, subCat: e.target.value }))}>
                <option value="">بدون</option>
                {subsOf(form.mainCat).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
          )}
          <Field label="اسم المنتج *"><input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Field>
          <Field label="الباركود (امسح باركود العلبة أو اتركه فارغ ليتولّد تلقائياً)">
            <input style={{ ...inputStyle, direction: "ltr" }} placeholder="613xxxxxxxxxx" value={form.barcode} onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))} />
          </Field>
          <div style={{ display: "flex", gap: 10 }}>
            <Field label="سعر الشراء (جملة)"><input type="number" style={inputStyle} value={form.buyPrice} onChange={e => setForm(f => ({ ...f, buyPrice: e.target.value }))} /></Field>
            <Field label="سعر البيع *"><input type="number" style={inputStyle} value={form.sellPrice} onChange={e => setForm(f => ({ ...f, sellPrice: e.target.value }))} /></Field>
          </div>
          <Field label="الكمية *"><input type="number" style={inputStyle} value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} /></Field>
          <button onClick={handleAdd} disabled={saving} style={{ ...btnStyle("#1a1a2e"), width: "100%", opacity: saving ? 0.7 : 1 }}>
            {saving ? "⏳ جاري الحفظ..." : "➕ حفظ + طباعة الباركود"}
          </button>
        </Modal>
      )}
    </div>
  );
}

// ==================== POS / SALES (فاتورة متعددة المنتجات + خصم) ====================
function POSSection({ products, onRefresh, user }) {
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [customer, setCustomer] = useState("");
  const [payType, setPayType] = useState("نقد");
  const [invoiceDiscount, setInvoiceDiscount] = useState("0");
  const [saving, setSaving] = useState(false);

  const results = search ? products.filter(p =>
    (p.name?.includes(search) || p.barcode?.includes(search)) && p.stock > 0
  ).slice(0, 6) : [];

  const addToCart = (p) => {
    const existing = cart.find(c => c.id === p.id);
    if (existing) {
      if (existing.qty >= p.stock) return alert(`المتبقي ${p.stock} فقط!`);
      setCart(cart.map(c => c.id === p.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { ...p, qty: 1, itemDiscount: 0 }]);
    }
    setSearch("");
  };

  const updateItem = (id, field, value) => {
    setCart(cart.map(c => c.id === id ? { ...c, [field]: Number(value) } : c));
  };

  const removeItem = (id) => setCart(cart.filter(c => c.id !== id));

  const subtotal = cart.reduce((s, c) => s + c.sell_price * c.qty - (c.itemDiscount || 0), 0);
  const total = Math.max(0, subtotal - Number(invoiceDiscount || 0));

  const checkout = async () => {
    if (cart.length === 0) return alert("السلة فارغة!");
    if (!customer) return alert("اكتب اسم العميل");
    setSaving(true);
    const invoiceId = uid();
    for (const item of cart) {
      await db.insert("sales2", {
        id: uid(), invoice_id: invoiceId, date: today(), time: nowTime(),
        product_id: item.id, product_name: item.name, qty: item.qty,
        sell_price: item.sell_price, buy_price: item.buy_price || 0,
        item_discount: item.itemDiscount || 0,
        customer, pay_type: payType, seller: user.name,
      });
      await db.update("products2", item.id, { stock: item.stock - item.qty });
    }
    if (Number(invoiceDiscount) > 0) {
      await db.insert("sales2", {
        id: uid(), invoice_id: invoiceId, date: today(), time: nowTime(),
        product_id: null, product_name: "خصم فاتورة", qty: 1,
        sell_price: -Number(invoiceDiscount), buy_price: 0, item_discount: 0,
        customer, pay_type: payType, seller: user.name,
      });
    }
    if (payType === "قسط") {
      await db.insert("debts", { id: uid(), customer, product: cart.map(c => c.name).join("، "), total, paid: 0, remaining: total, next_due: today() });
    }
    await onRefresh();
    setSaving(false);
    setCart([]); setCustomer(""); setInvoiceDiscount("0"); setPayType("نقد");
    alert(`✅ تمت الفاتورة بنجاح!\nالإجمالي: ${fmt(total)}`);
  };

  return (
    <div>
      <h2 style={{ margin: "0 0 14px", fontSize: 20, fontWeight: 800 }}>🛒 بيع جديد (فاتورة)</h2>
      <div style={{ position: "relative", marginBottom: 14 }}>
        <input style={{ ...inputStyle, fontSize: 15, padding: 13 }} placeholder="🔍 امسح الباركود أو اكتب اسم المنتج..."
          value={search} onChange={e => setSearch(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && results.length === 1) addToCart(results[0]); }} />
        {results.length > 0 && (
          <div style={{ position: "absolute", top: "100%", right: 0, left: 0, background: "#fff", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 100, overflow: "hidden" }}>
            {results.map(p => (
              <div key={p.id} onClick={() => addToCart(p)} style={{ padding: "11px 14px", cursor: "pointer", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 600 }}>{p.name}</span>
                <span style={{ color: "#2e7d32", fontWeight: 700 }}>{fmt(p.sell_price)} <span style={{ color: "#888", fontSize: 11 }}>({p.stock} متبقي)</span></span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ background: "#fff", borderRadius: 14, padding: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", marginBottom: 14 }}>
        {cart.length === 0 && <div style={{ textAlign: "center", color: "#aaa", padding: 20 }}>السلة فارغة — ابحث وأضف منتجات</div>}
        {cart.map(item => (
          <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #f0f0f0", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 120, fontWeight: 700, fontSize: 14 }}>{item.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: "#888" }}>كمية</span>
              <input type="number" min={1} max={item.stock} value={item.qty}
                onChange={e => updateItem(item.id, "qty", Math.min(Number(e.target.value), item.stock))}
                style={{ ...inputStyle, width: 60, padding: 6, textAlign: "center" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: "#888" }}>خصم</span>
              <input type="number" min={0} value={item.itemDiscount}
                onChange={e => updateItem(item.id, "itemDiscount", e.target.value)}
                style={{ ...inputStyle, width: 70, padding: 6, textAlign: "center" }} />
            </div>
            <div style={{ fontWeight: 800, color: "#2e7d32", minWidth: 90, textAlign: "left" }}>{fmt(item.sell_price * item.qty - (item.itemDiscount || 0))}</div>
            <button onClick={() => removeItem(item.id)} style={{ background: "#ffebee", color: "#c62828", border: "none", borderRadius: 6, width: 26, height: 26, cursor: "pointer", fontWeight: 800 }}>✕</button>
          </div>
        ))}
      </div>

      {cart.length > 0 && (
        <div style={{ background: "#fff", borderRadius: 14, padding: 18, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Field label="اسم العميل *"><input style={inputStyle} value={customer} onChange={e => setCustomer(e.target.value)} /></Field>
            <Field label="خصم على الفاتورة كاملة (د.ل)"><input type="number" style={inputStyle} value={invoiceDiscount} onChange={e => setInvoiceDiscount(e.target.value)} /></Field>
            <Field label="طريقة الدفع">
              <select style={inputStyle} value={payType} onChange={e => setPayType(e.target.value)}>
                <option>نقد</option><option>قسط</option>
              </select>
            </Field>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f4f6fb", borderRadius: 10, padding: 14, margin: "12px 0" }}>
            <span style={{ fontWeight: 700 }}>الإجمالي النهائي</span>
            <span style={{ fontWeight: 900, fontSize: 22, color: "#1a1a2e" }}>{fmt(total)}</span>
          </div>
          <button onClick={checkout} disabled={saving} style={{ ...btnStyle("#2e7d32"), width: "100%", padding: 14, fontSize: 16, opacity: saving ? 0.7 : 1 }}>
            {saving ? "⏳ جاري الحفظ..." : "✅ تأكيد البيع"}
          </button>
        </div>
      )}
    </div>
  );
}

// ==================== SHIFT (الوردية اليومية) ====================
function ShiftSection({ sales, shifts, onRefresh, user, isAdmin }) {
  const todaySales = sales.filter(s => s.date === today() && (isAdmin || s.seller === user.name));
  const todayCash = todaySales.filter(s => s.pay_type === "نقد").reduce((t, s) => t + s.sell_price * s.qty - (s.item_discount || 0), 0);
  const todayTotal = todaySales.reduce((t, s) => t + s.sell_price * s.qty - (s.item_discount || 0), 0);
  const todayProfit = todaySales.reduce((t, s) => t + (s.sell_price - (s.buy_price || 0)) * s.qty - (s.item_discount || 0), 0);
  const itemsSold = todaySales.filter(s => s.product_id).reduce((t, s) => t + s.qty, 0);
  const alreadyClosed = shifts.some(sh => sh.date === today() && sh.seller === user.name);

  const closeShift = async () => {
    if (todaySales.length === 0) return alert("لا مبيعات اليوم");
    if (!window.confirm(`إغلاق وردية اليوم؟\nالمبيعات: ${fmt(todayTotal)}\nالنقد في الدرج: ${fmt(todayCash)}`)) return;
    await db.insert("shifts", {
      id: uid(), date: today(), time: nowTime(), seller: user.name,
      total_sales: todayTotal, cash: todayCash, items_count: itemsSold,
      profit: isAdmin ? todayProfit : null,
    });
    await onRefresh();
    alert("✅ تم إغلاق الوردية");
  };

  return (
    <div>
      <h2 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 800 }}>🕐 الوردية اليومية — {today()}</h2>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        <StatCard icon="💵" label="النقد في الدرج" value={fmt(todayCash)} color="#2e7d32" />
        <StatCard icon="🧾" label="إجمالي مبيعات اليوم" value={fmt(todayTotal)} color="#4a6fa5" sub={`${itemsSold} قطعة`} />
        {isAdmin && <StatCard icon="📈" label="ربح اليوم" value={fmt(todayProfit)} color="#6a0dad" />}
      </div>
      <div style={{ background: "#fff", borderRadius: 14, padding: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", marginBottom: 16 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700 }}>مبيعات اليوم</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr style={{ background: "#f7f8fc" }}>
            {["الوقت", "المنتج", "كمية", "المبلغ", "البائع"].map(h => <th key={h} style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: "#555", borderBottom: "2px solid #eee" }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {todaySales.map((s, i) => (
              <tr key={s.id} style={{ background: i % 2 ? "#fafbff" : "#fff" }}>
                <td style={{ padding: "8px 10px", color: "#888", fontSize: 11 }}>{s.time}</td>
                <td style={{ padding: "8px 10px", fontWeight: 600 }}>{s.product_name}</td>
                <td style={{ padding: "8px 10px", textAlign: "center" }}>{s.qty}</td>
                <td style={{ padding: "8px 10px", fontWeight: 700 }}>{fmt(s.sell_price * s.qty - (s.item_discount || 0))}</td>
                <td style={{ padding: "8px 10px", fontSize: 11, color: "#666" }}>{s.seller}</td>
              </tr>
            ))}
            {todaySales.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", padding: 20, color: "#aaa" }}>لا مبيعات اليوم بعد</td></tr>}
          </tbody>
        </table>
      </div>
      {!alreadyClosed
        ? <button onClick={closeShift} style={{ ...btnStyle("#c62828"), width: "100%", padding: 14, fontSize: 15 }}>🔒 إغلاق وردية اليوم</button>
        : <div style={{ background: "#e8f5e9", color: "#2e7d32", padding: 14, borderRadius: 10, textAlign: "center", fontWeight: 700 }}>✅ الوردية مغلقة لليوم</div>}
    </div>
  );
}

// ==================== DAILY REPORTS (تقارير يومية للمدير) ====================
function ReportsSection({ sales, shifts }) {
  const days = [...new Set(sales.map(s => s.date))].sort().reverse();
  const dayStats = (d) => {
    const daySales = sales.filter(s => s.date === d);
    return {
      total: daySales.reduce((t, s) => t + s.sell_price * s.qty - (s.item_discount || 0), 0),
      profit: daySales.reduce((t, s) => t + (s.sell_price - (s.buy_price || 0)) * s.qty - (s.item_discount || 0), 0),
      items: daySales.filter(s => s.product_id).reduce((t, s) => t + s.qty, 0),
      cash: daySales.filter(s => s.pay_type === "نقد").reduce((t, s) => t + s.sell_price * s.qty - (s.item_discount || 0), 0),
    };
  };

  const grandTotal = sales.reduce((t, s) => t + s.sell_price * s.qty - (s.item_discount || 0), 0);
  const grandProfit = sales.reduce((t, s) => t + (s.sell_price - (s.buy_price || 0)) * s.qty - (s.item_discount || 0), 0);

  return (
    <div>
      <h2 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 800 }}>📊 التقارير اليومية</h2>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        <StatCard icon="💰" label="إجمالي المبيعات الكلي" value={fmt(grandTotal)} color="#4a6fa5" />
        <StatCard icon="📈" label="إجمالي الأرباح الكلي" value={fmt(grandProfit)} color="#2e7d32" />
      </div>
      <div style={{ background: "#fff", borderRadius: 14, padding: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700 }}>كل يوم بروحه</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr style={{ background: "#f7f8fc" }}>
            {["التاريخ", "القطع المباعة", "المبيعات", "النقد", "الربح"].map(h => <th key={h} style={{ padding: "9px 10px", textAlign: "right", fontWeight: 700, color: "#555", borderBottom: "2px solid #eee" }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {days.map((d, i) => {
              const st = dayStats(d);
              return (
                <tr key={d} style={{ background: i % 2 ? "#fafbff" : "#fff" }}>
                  <td style={{ padding: "9px 10px", fontWeight: 700 }}>{d === today() ? `اليوم (${d})` : d}</td>
                  <td style={{ padding: "9px 10px", textAlign: "center" }}>{st.items}</td>
                  <td style={{ padding: "9px 10px", fontWeight: 700 }}>{fmt(st.total)}</td>
                  <td style={{ padding: "9px 10px", color: "#4a6fa5" }}>{fmt(st.cash)}</td>
                  <td style={{ padding: "9px 10px", color: "#2e7d32", fontWeight: 800 }}>{fmt(st.profit)}</td>
                </tr>
              );
            })}
            {days.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", padding: 20, color: "#aaa" }}>لا توجد مبيعات بعد</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==================== SELLERS (إدارة البياعين) ====================
function SellersSection({ sellers, onRefresh }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", password: "" });

  const addSeller = async () => {
    if (!form.name || !form.password) return alert("عبّئ الاسم وكلمة السر");
    if (form.password === "apple2024") return alert("هذه كلمة سر المدير! اختر غيرها");
    await db.insert("sellers", { id: uid(), name: form.name, password: form.password });
    setForm({ name: "", password: "" });
    setShowModal(false);
    await onRefresh();
  };

  const removeSeller = async (s) => {
    if (!window.confirm(`حذف البائع "${s.name}"؟`)) return;
    await db.remove("sellers", s.id);
    await onRefresh();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>👥 البياعين</h2>
        <button onClick={() => setShowModal(true)} style={btnStyle("#1a1a2e")}>+ بائع جديد</button>
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {sellers.map(s => (
          <div key={s.id} style={{ background: "#fff", borderRadius: 14, padding: 18, minWidth: 180, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", textAlign: "center" }}>
            <div style={{ width: 50, height: 50, borderRadius: "50%", background: "#4a6fa5", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, margin: "0 auto 10px" }}>{s.name[0]}</div>
            <div style={{ fontWeight: 800 }}>{s.name}</div>
            <div style={{ color: "#888", fontSize: 11, margin: "4px 0" }}>كلمة السر: {s.password}</div>
            <button onClick={() => removeSeller(s)} style={{ ...btnStyle("#c62828"), padding: "5px 14px", fontSize: 11, marginTop: 6 }}>حذف</button>
          </div>
        ))}
        {sellers.length === 0 && <div style={{ color: "#aaa", padding: 20 }}>لا يوجد بياعين — أضفهم وأعطهم كلمات سرهم</div>}
      </div>
      {showModal && (
        <Modal title="إضافة بائع" onClose={() => setShowModal(false)}>
          <Field label="اسم البائع"><input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Field>
          <Field label="كلمة السر الخاصة به"><input style={inputStyle} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} /></Field>
          <button onClick={addSeller} style={{ ...btnStyle("#1a1a2e"), width: "100%" }}>➕ إضافة</button>
        </Modal>
      )}
    </div>
  );
}

// ==================== DEBTS (الديون) ====================
function DebtsSection({ debts, onRefresh }) {
  const pay = async (d, amt) => {
    const newPaid = Math.min(d.paid + amt, d.total);
    await db.update("debts", d.id, { paid: newPaid, remaining: d.total - newPaid });
    await onRefresh();
  };
  return (
    <div>
      <h2 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 800 }}>📋 الديون والأقساط</h2>
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <StatCard icon="💸" label="إجمالي الديون" value={fmt(debts.reduce((s, d) => s + d.remaining, 0))} color="#c62828" />
        <StatCard icon="👥" label="عدد المدينين" value={debts.filter(d => d.remaining > 0).length} color="#4a6fa5" />
      </div>
      <div style={{ background: "#fff", borderRadius: 14, padding: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
        {debts.filter(d => d.remaining > 0).map((d, i, arr) => {
          const pct = d.total > 0 ? Math.round((d.paid / d.total) * 100) : 0;
          return (
            <div key={d.id} style={{ borderBottom: i < arr.length - 1 ? "1px solid #f0f0f0" : "none", padding: "14px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{d.customer}</div>
                  <div style={{ color: "#888", fontSize: 12 }}>{d.product}</div>
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ color: "#c62828", fontWeight: 800 }}>متبقي: {fmt(d.remaining)}</div>
                  <div style={{ color: "#2e7d32", fontSize: 12 }}>مدفوع: {fmt(d.paid)}</div>
                </div>
              </div>
              <div style={{ background: "#f0f0f0", borderRadius: 20, height: 7, overflow: "hidden", margin: "8px 0 6px" }}>
                <div style={{ background: "#4a6fa5", height: "100%", width: `${pct}%` }} />
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[100, 500, 1000].map(a => (
                  <button key={a} onClick={() => pay(d, a)} style={{ background: "#e8f5e9", color: "#2e7d32", border: "none", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "inherit" }}>+{a}</button>
                ))}
                <button onClick={() => pay(d, d.remaining)} style={{ background: "#e3f2fd", color: "#1565c0", border: "none", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "inherit" }}>سداد كامل</button>
              </div>
            </div>
          );
        })}
        {debts.filter(d => d.remaining > 0).length === 0 && <div style={{ textAlign: "center", padding: 24, color: "#aaa" }}>لا توجد ديون 🎉</div>}
      </div>
    </div>
  );
}

// ==================== MAIN APP ====================
export default function App() {
  const [user, setUser] = useState(null);
  const [active, setActive] = useState("pos");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ products: [], categories: [], sales: [], debts: [], sellers: [], shifts: [] });

  const loadAll = async () => {
    setLoading(true);
    const [products, categories, sales, debts, sellers, shifts] = await Promise.all([
      db.get("products2"), db.get("categories"), db.get("sales2", "?order=date.desc"), db.get("debts"), db.get("sellers"), db.get("shifts"),
    ]);
    setData({ products, categories, sales, debts, sellers, shifts });
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  if (!user) return <LoginScreen onLogin={setUser} sellers={data.sellers} />;

  const isAdmin = user.role === "admin";

  const SECTIONS = [
    { key: "pos", icon: "🛒", label: "بيع جديد", all: true },
    { key: "shift", icon: "🕐", label: "الوردية اليومية", all: true },
    { key: "inventory", icon: "📦", label: "المخزون والجرد", all: true },
    { key: "categories", icon: "📁", label: "الأقسام", admin: true },
    { key: "debts", icon: "📋", label: "الديون", admin: true },
    { key: "reports", icon: "📊", label: "التقارير اليومية", admin: true },
    { key: "sellers", icon: "👥", label: "البياعين", admin: true },
  ].filter(s => s.all || (s.admin && isAdmin));

  const renderSection = () => {
    if (loading) return <Loader />;
    switch (active) {
      case "pos": return <POSSection products={data.products} onRefresh={loadAll} user={user} />;
      case "shift": return <ShiftSection sales={data.sales} shifts={data.shifts} onRefresh={loadAll} user={user} isAdmin={isAdmin} />;
      case "inventory": return <ProductsSection products={data.products} categories={data.categories} onRefresh={loadAll} isAdmin={isAdmin} />;
      case "categories": return <CategoriesSection categories={data.categories} onRefresh={loadAll} />;
      case "debts": return <DebtsSection debts={data.debts} onRefresh={loadAll} />;
      case "reports": return <ReportsSection sales={data.sales} shifts={data.shifts} />;
      case "sellers": return <SellersSection sellers={data.sellers} onRefresh={loadAll} />;
      default: return null;
    }
  };

  return (
    <div dir="rtl" style={{ fontFamily: "'Segoe UI',Tahoma,Arial,sans-serif", display: "flex", height: "100vh", background: "#f4f6fb", overflow: "hidden" }}>
      <div style={{ width: sidebarOpen ? 210 : 60, background: "#1a1a2e", transition: "width .3s", display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0, zIndex: 10 }}>
        <div style={{ padding: "16px 14px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setSidebarOpen(o => !o)} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, width: 32, height: 32, color: "#fff", cursor: "pointer", fontSize: 15, flexShrink: 0 }}>☰</button>
          {sidebarOpen && <div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 13 }}>أبل للهاتف المحمول</div>
            <div style={{ color: isAdmin ? "#4caf50" : "#ffb74d", fontSize: 10 }}>{isAdmin ? "👑 المدير" : `👤 ${user.name}`}</div>
          </div>}
        </div>
        <nav style={{ flex: 1, overflowY: "auto", padding: 8 }}>
          {SECTIONS.map(s => (
            <button key={s.key} onClick={() => { setActive(s.key); setSidebarOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "right", padding: "11px 12px", borderRadius: 10, border: "none", cursor: "pointer", background: active === s.key ? "rgba(74,111,165,0.4)" : "transparent", color: active === s.key ? "#7eb3ff" : "#bbb", fontFamily: "inherit", fontSize: 13, fontWeight: active === s.key ? 700 : 400, marginBottom: 2, whiteSpace: "nowrap" }}>
              <span style={{ fontSize: 17, flexShrink: 0 }}>{s.icon}</span>
              {sidebarOpen && <span>{s.label}</span>}
            </button>
          ))}
        </nav>
        {sidebarOpen && (
          <div style={{ padding: 14, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <button onClick={() => setUser(null)} style={{ ...btnStyle("#c62828"), width: "100%", padding: 9, fontSize: 12 }}>🚪 خروج</button>
          </div>
        )}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>{renderSection()}</div>
      </div>
    </div>
  );
}
