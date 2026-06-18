import React, { useState, useEffect } from "react";

export default function App() {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("catalog");
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Öğrenci");
  const [isRegister, setIsRegister] = useState(false);
  const [history, setHistory] = useState([]);
  const [reports, setReports] = useState(null);
  const [loggedInEmail, setLoggedInEmail] = useState(localStorage.getItem("loggedInEmail") || "");

  // Add Book Form Inputs
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newIsbn, setNewIsbn] = useState("");
  const [newPublisher, setNewPublisher] = useState("");
  const [newYear, setNewYear] = useState(2026);

  const syncCatalog = () => {
    fetch("http://localhost:8000/books" + (search ? "?search=" + search : ""))
      .then((res) => res.json())
      .then((data) => setBooks(data))
      .catch((err) => console.error("Catalog fetch error:", err));
  };

  useEffect(() => {
    syncCatalog();
  }, [search]);

  const syncHistoryAndReports = () => {
    if (token) {
      fetch("http://localhost:8000/users/me/history", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => { if (Array.isArray(data)) setHistory(data); });

      fetch("http://localhost:8000/reports")
        .then((res) => res.json())
        .then((data) => setReports(data));
    }
  };

  useEffect(() => {
    syncHistoryAndReports();
  }, [token, activeTab]);

  const handleAuth = (e) => {
    e.preventDefault();
    const endpoint = isRegister ? "register" : "token";
    const body = isRegister 
      ? JSON.stringify({ email, password, role }) 
      : new URLSearchParams({ username: email, password: password });

    const sessionEmail = email;

    fetch(`http://localhost:8000/${endpoint}`, {
      method: "POST",
      headers: isRegister ? { "Content-Type": "application/json" } : {},
      body: body,
    })
      .then((res) => {
        if (!res.ok) throw new Error("Authentication failed. Check credentials.");
        return res.json();
      })
      .then((data) => {
        if (!isRegister) {
          localStorage.setItem("token", data.access_token);
          localStorage.setItem("loggedInEmail", sessionEmail);
          setToken(data.access_token);
          setLoggedInEmail(sessionEmail);
          setEmail("");
          setPassword("");
          alert("Login Successful!");
        } else {
          alert("Registration Successful! Proceeding to login template.");
          setIsRegister(false);
          setEmail("");
          setPassword("");
        }
      })
      .catch((err) => alert(err.message));
  };

  const handleBorrow = (isbn) => {
    if (!token) return alert("Please login first.");
    fetch("http://localhost:8000/borrow", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isbn }),
    })
      .then((res) => res.json())
      .then((data) => { alert(data.detail || data.message); syncCatalog(); });
  };

  const handleReturn = (transaction_id) => {
    fetch("http://localhost:8000/return", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transaction_id }),
    })
      .then((res) => res.json())
      .then((data) => { alert(data.message); syncHistoryAndReports(); syncCatalog(); });
  };

  const handleReserve = (isbn) => {
    if (!token) return alert("Please sign in to reserve items.");
    
    fetch("http://localhost:8000/reserve", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "Authorization": `Bearer ${token}` 
      },
      body: JSON.stringify({ isbn }),
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((err) => {
            throw new Error(err.detail || "Failed to create reservation request.");
          });
        }
        return res.json();
      })
      .then((data) => {
        alert("✨ Success: " + (data.message || "Reservation logged!"));
        syncCatalog();
        syncHistoryAndReports();
      })
      .catch((err) => {
        alert("❌ Error: " + err.message);
      });
  };

  const handleDeleteBook = (isbn) => {
    if (!confirm("Are you sure you want to remove this available book from index?")) return;
    
    fetch(`http://localhost:8000/books/${isbn}`, {
      method: "DELETE",
      headers: { 
        "Authorization": `Bearer ${token}` 
      }
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((err) => {
            throw new Error(err.detail || "Action denied. Only Admins/Librarians can remove available books.");
          });
        }
        return res.json();
      })
      .then((data) => { 
        setBooks((prevBooks) => prevBooks.filter((book) => book.isbn !== isbn));
        alert(data.message || "Book successfully deleted."); 
        syncCatalog(); 
      })
      .catch((err) => alert(err.message));
  };

  const handleAddBook = (e) => {
    e.preventDefault();
    fetch("http://localhost:8000/books", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isbn: newIsbn, title: newTitle, author: newAuthor, publisher: newPublisher, year_of_publication: parseInt(newYear) }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized to execute inventory changes.");
        return res.json();
      })
      .then(() => { 
        alert("Book added successfully!"); 
        setNewTitle(""); setNewAuthor(""); setNewIsbn(""); setNewPublisher("");
        syncCatalog(); 
        setActiveTab("catalog"); 
      })
      .catch((err) => alert(err.message));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("loggedInEmail");
    setToken("");
    setLoggedInEmail("");
    alert("Logged out successfully.");
  };

  return (
    <div style={styles.appContainer}>
      {/* SIDEBAR PANEL */}
      <aside style={styles.sidebar}>
        <div style={styles.brandContainer}>
          <span style={{ fontSize: "1.5rem" }}>🎀</span>
          <h2 style={styles.sidebarHeading}>Shadi's Library</h2>
        </div>
        <nav style={styles.nav}>
          <button onClick={() => setActiveTab("catalog")} style={activeTab === "catalog" ? styles.activeBtn : styles.btn}>🌸 Book Catalog</button>
          {token && <button onClick={() => setActiveTab("history")} style={activeTab === "history" ? styles.activeBtn : styles.btn}>✨ My Activity Logs</button>}
          {token && <button onClick={() => setActiveTab("addBook")} style={activeTab === "addBook" ? styles.activeBtn : styles.btn}>📖 Add New Books</button>}
          <button onClick={() => setActiveTab("reports")} style={activeTab === "reports" ? styles.activeBtn : styles.btn}>💕 Analytics Dashboard</button>
        </nav>
        {token && (
          <div style={styles.sidebarFooter}>
            <p style={styles.userDisplay}>💌 {loggedInEmail}</p>
            <button onClick={handleLogout} style={styles.logoutBtn}>Log Out</button>
          </div>
        )}
      </aside>

      {/* CORE WORKSPACE PANEL */}
      <main style={styles.main}>
        {!token && (activeTab === "history" || activeTab === "addBook") ? (
          <div style={styles.authCard}>
            <h3>Access Restricted</h3>
            <p style={{ color: "#a18294" }}>Please login or create an account to view operations.</p>
            <button onClick={() => setActiveTab("catalog")} style={styles.submitBtn}>Back to Sign In Panel</button>
          </div>
        ) : (
          <>
            {/* AUTH BLOCK */}
            {activeTab === "catalog" && !token && (
              <div style={styles.authCard}>
                <h3 style={{ marginBottom: "0.5rem" }}>{isRegister ? "Create Account ✨" : "Welcome Back 💞"}</h3>
                <p style={{ color: "#a18294", fontSize: "0.9rem", marginBottom: "1.5rem" }}>Enter your credentials to access the resource index</p>
                <form onSubmit={handleAuth} style={styles.form}>
                  <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required style={styles.input}/>
                  <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={styles.input}/>
                  {isRegister && (
                    <select value={role} onChange={e => setRole(e.target.value)} style={styles.input}>
                      <option value="Öğrenci">Student (Öğrenci)</option>
                      <option value="Kütüphaneci">Librarian (Kütüphaneci)</option>
                      <option value="Yönetici">Admin (Yönetici)</option>
                    </select>
                  )}
                  <button type="submit" style={styles.submitBtn}>{isRegister ? "Register" : "Sign In"}</button>
                </form>
                <p onClick={() => { setIsRegister(!isRegister); setEmail(""); setPassword(""); }} style={styles.toggleAuthMode}>
                  {isRegister ? "Already have an account? Sign In" : "Need an account? Register Here"}
                </p>
              </div>
            )}

            {/* CATALOG VIEW SECTION */}
            {activeTab === "catalog" && (
              <div style={{marginTop: token ? "0" : "2rem"}}>
                <div style={styles.catalogHeader}>
                  <div>
                    <h2 style={styles.viewTitle}>Book Catalog and Discovery</h2>
                    <p style={{ color: "#a18294", margin: 0 }}>Discover new resources and manage your active checkout lines</p>
                  </div>
                  <input placeholder="🔍 Search title, author, or ISBN..." value={search} onChange={e => setSearch(e.target.value)} style={styles.searchBar}/>
                </div>
                <div style={styles.grid}>
                  {books.map(b => {
                    const isAdminOrLibrarian = token && (loggedInEmail.includes("admin") || loggedInEmail.includes("librarian"));
                    const isStudent = token && loggedInEmail.includes("student");

                    return (
                      <div key={b.isbn} style={styles.card}>
                        <div style={styles.cardHeaderDecoration}></div>
                        <h4 style={styles.bookTitle}>{b.title}</h4>
                        <p style={styles.bookAuthor}>✍️ {b.author}</p>
                        <span style={styles.isbnTag}>ISBN: {b.isbn}</span>
                        <div style={styles.cardFooter}>
                          <span style={{
                            ...styles.badge,
                            backgroundColor: b.is_available ? "#f0fdf4" : "#fff1f2",
                            color: b.is_available ? "#15803d" : "#e11d48"
                          }}>
                            {b.is_available ? "✨ Available" : "🎀 Checked Out"}
                          </span>
                          <div style={{display:"flex", gap:"0.5rem", alignItems:"center"}}>
                            {token ? (
                              <>
                                {b.is_available ? (
                                  <>
                                    <button onClick={() => handleBorrow(b.isbn)} style={styles.actionBtn}>Borrow</button>
                                    {isAdminOrLibrarian && (
                                      <button onClick={() => handleDeleteBook(b.isbn)} style={{...styles.actionBtn, backgroundColor:"#fff1f2", color: "#e11d48", border: "1px solid #ffe4e6"}}>Delete</button>
                                    )}
                                  </>
                                ) : (
                                  <button onClick={() => handleReserve(b.isbn)} style={{...styles.actionBtn, backgroundColor:"#f3e8ff", color: "#6b21a8"}}>Reserve</button>
                                )}
                                
                                {isStudent && (
                                  <span style={styles.lockBadge}>🔒 Locked</span>
                                )}
                              </>
                            ) : (
                              <span style={styles.signinPrompt}>Sign in to borrow</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TRANSACTION HISTORY VIEW */}
            {activeTab === "history" && (
              <div>
                <h2 style={styles.viewTitle}>My Account Transactions & Loans Logs</h2>
                <p style={{ color: "#a18294", marginBottom: "1.5rem" }}>Track returning timelines and reserved queues</p>
                <table style={styles.table}>
                  <thead>
                    <tr style={{ backgroundColor: "#faf5f7" }}>
                      <th style={styles.th}>Transaction ID</th>
                      <th style={styles.th}>ISBN</th>
                      <th style={styles.th}>Borrow Date</th>
                      <th style={styles.th}>Due Date</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(h => (
                      <tr key={h.transaction_id} style={{ borderBottom: "1px solid #fdf2f7" }}>
                        <td style={styles.td}>{h.transaction_id}</td>
                        <td style={styles.td}>{h.isbn}</td>
                        <td style={styles.td}>{new Date(h.borrow_date).toLocaleDateString()}</td>
                        <td style={styles.td}>{new Date(h.due_date).toLocaleDateString()}</td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.badge,
                            backgroundColor: "#fff1f2",
                            color: "#e11d48"
                          }}>{h.status}</span>
                        </td>
                        <td style={styles.td}>
                          {(h.status === "Ödünç Alındı" || h.status === "BORROWED" || h.status === "Borrowed" || h.status.toLowerCase().includes("alındı")) && (
                            <button onClick={() => handleReturn(h.transaction_id)} style={{...styles.actionBtn, backgroundColor: "#f0fdf4", color: "#16a34a"}}>Return Book</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* MANUAL MANAGE ENTRY */}
            {activeTab === "addBook" && (
              <div style={styles.authCard}>
                <h3>Kaggle Dataset Management Entry</h3>
                <p style={{ color: "#a18294", fontSize: "0.9rem", marginBottom: "1.5rem" }}>Incorporate entries straight to core index models</p>
                <form onSubmit={handleAddBook} style={styles.form}>
                  <input placeholder="Book Title" value={newTitle} onChange={e => setNewTitle(e.target.value)} required style={styles.input}/>
                  <input placeholder="Author Name" value={newAuthor} onChange={e => setNewAuthor(e.target.value)} required style={styles.input}/>
                  <input placeholder="ISBN Reference" value={newIsbn} onChange={e => setNewIsbn(e.target.value)} required style={styles.input}/>
                  <input placeholder="Publisher" value={newPublisher} onChange={e => setNewPublisher(e.target.value)} required style={styles.input}/>
                  <input type="number" placeholder="Publication Year" value={newYear} onChange={e => setNewYear(e.target.value)} required style={styles.input}/>
                  <button type="submit" style={styles.submitBtn}>Commit to Index</button>
                </form>
              </div>
            )}

            {/* ANALYTICS DISPLAY */}
            {activeTab === "reports" && reports && (
              <div>
                <h2 style={styles.viewTitle}>Reporting, Metrics & Analytics</h2>
                <p style={{ color: "#a18294", marginBottom: "2rem" }}>Real-time usage metrics and inventory data analytics</p>
                <div style={{display:"flex", gap:"1.5rem", marginBottom:"3rem"}}>
                  <div style={styles.statCard}>
                    <p style={styles.statLabel}>Total Library Books</p>
                    <h3 style={styles.statNum}>{reports.total_books}</h3>
                  </div>
                  <div style={styles.statCard}>
                    <p style={{ ...styles.statLabel, color: "#b45309" }}>Active Loans</p>
                    <h3 style={{ ...styles.statNum, color: "#b45309" }}>{reports.active_loans}</h3>
                  </div>
                  <div style={styles.statCard}>
                    <p style={{ ...styles.statLabel, color: "#e11d48" }}>Overdue Registry Items</p>
                    <h3 style={{ ...styles.statNum, color: "#e11d48" }}>{reports.overdue_books}</h3>
                  </div>
                </div>
                
                <div style={{ ...styles.authCard, maxWidth: "100%", textAlign: "left", margin: 0 }}>
                  <h3 style={{ color: "#4c3846", marginBottom: "1rem" }}>🔥 High Demand Popular Books</h3>
                  {reports.popular_books.map((p, idx) => (
                    <div key={idx} style={{ padding: "0.75rem 0", borderBottom: "1px solid #faf0f5", display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#5c4656", fontWeight: "500" }}>{p.title}</span>
                      <span style={{ ...styles.badge, backgroundColor: "#fdf2f7", color: "#be185d" }}>{p.count} borrows</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

const styles = {
  appContainer: { display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif", backgroundColor: "#fbf7f9" },
  sidebar: { width: "250px", backgroundColor: "#fff5f8", padding: "2.5rem 1.5rem", display: "flex", flexDirection: "column", borderRight: "1px solid #f5e1e7" },
  brandContainer: { display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "3rem", paddingLeft: "0.5rem" },
  sidebarHeading: { fontSize: "1.25rem", color: "#4c3846", fontWeight: "700", margin: 0 },
  nav: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  btn: { background: "none", border: "none", color: "#8a6e7f", padding: "0.85rem 1rem", cursor: "pointer", borderRadius: "12px", width: "100%", textAlign: "left", fontSize: "0.95rem", fontWeight: "500" },
  activeBtn: { backgroundColor: "#fff0f5", border: "none", color: "#be185d", padding: "0.85rem 1rem", cursor: "pointer", borderRadius: "12px", width: "100%", textAlign: "left", fontWeight: "600", fontSize: "0.95rem" },
  sidebarFooter: { marginTop: "auto", borderTop: "1px solid #f5e1e7", paddingTop: "1.5rem" },
  userDisplay: { fontSize: "0.8rem", color: "#8a6e7f", marginBottom: "0.75rem", wordBreak: "break-all" },
  logoutBtn: { backgroundColor: "#fff1f2", border: "1px solid #ffe4e6", color: "#e11d48", padding: "0.6rem", borderRadius: "10px", cursor: "pointer", width: "100%", fontWeight: "500" },
  main: { flexGrow: 1, padding: "3rem 4rem", maxWidth: "1300px", margin: "0 auto", width: "calc(100% - 260px)" },
  catalogHeader: { display: "flex", justifyContent: "space-between", marginBottom: "2.5rem", alignItems: "flex-end", flexWrap: "wrap", gap: "1.5rem" },
  viewTitle: { fontSize: "1.75rem", color: "#4c3846", fontWeight: "700", margin: "0 0 0.25rem 0" },
  searchBar: { padding: "0.75rem 1.25rem", width: "320px", borderRadius: "14px", border: "1px solid #ecdce3", backgroundColor: "white", fontSize: "0.9rem", outline: "none", boxShadow: "0 2px 4px rgba(190,24,93,0.02)" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "2rem" },
  card: { backgroundColor: "white", borderRadius: "20px", border: "1px solid #f5e6ed", boxShadow: "0 4px 12px rgba(190,24,93,0.02)", position: "relative", overflow: "hidden", padding: "1.75rem", display: "flex", flexDirection: "column", minHeight: "180px" },
  cardHeaderDecoration: { position: "absolute", top: 0, left: 0, right: 0, height: "4px", backgroundColor: "#f472b6", opacity: 0.4 },
  bookTitle: { margin: "0 0 0.35rem 0", fontSize: "1.15rem", fontWeight: "700", color: "#4c3846", lineHeight: "1.4" },
  bookAuthor: { margin: "0 0 1rem 0", fontSize: "0.9rem", color: "#8a6e7f" },
  isbnTag: { fontSize: "0.75rem", color: "#bca4b3", fontFamily: "monospace", display: "block", marginBottom: "1.5rem" },
  cardFooter: { marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" },
  badge: { fontSize: "0.75rem", fontWeight: "600", padding: "0.35rem 0.75rem", borderRadius: "20px" },
  lockBadge: { fontSize: "0.75rem", color: "#8a6e7f", backgroundColor: "#f3f4f6", padding: "0.35rem 0.6rem", borderRadius: "6px" },
  signinPrompt: { fontSize: "0.85rem", color: "#bca4b3", fontStyle: "italic" },
  actionBtn: { backgroundColor: "#be185d", color: "white", border: "none", padding: "0.5rem 1rem", borderRadius: "10px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "600" },
  authCard: { backgroundColor: "white", padding: "2.5rem", borderRadius: "24px", maxWidth: "400px", margin: "4rem auto", border: "1px solid #f5e6ed", boxShadow: "0 10px 25px rgba(190,24,93,0.03)", textAlign: "center" },
  form: { display: "flex", flexDirection: "column", gap: "1rem" },
  input: { padding: "0.75rem", borderRadius: "12px", border: "1px solid #ecdce3", fontSize: "0.9rem", outline: "none" },
  submitBtn: { backgroundColor: "#db2777", color: "white", border: "none", padding: "0.75rem", borderRadius: "12px", cursor: "pointer", fontWeight: "600", fontSize: "0.95rem" },
  toggleAuthMode: { cursor: "pointer", color: "#db2777", marginTop: "1.25rem", fontSize: "0.85rem", fontWeight: "500" },
  table: { width: "100%", borderCollapse: "collapse", backgroundColor: "white", borderRadius: "16px", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.01)", marginTop: "1rem" },
  th: { padding: "1rem", textAlign: "left", color: "#4c3846", fontWeight: "600", fontSize: "0.9rem", borderBottom: "1px solid #f5e6ed" },
  td: { padding: "1rem", color: "#5c4656", fontSize: "0.9rem" },
  statCard: { backgroundColor: "white", padding: "1.5rem", borderRadius: "18px", flexGrow: 1, border: "1px solid #f5e6ed", boxShadow: "0 4px 12px rgba(190,24,93,0.01)" },
  statLabel: { margin: "0 0 0.5rem 0", color: "#be185d", fontSize: "0.85rem", fontWeight: "600", letterSpacing: "0.5px", textTransform: "uppercase" },
  statNum: { margin: 0, fontSize: "2rem", fontWeight: "700", color: "#4c3846" }
};