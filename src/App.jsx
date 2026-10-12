
import { useState, useEffect } from "react";
import { HashRouter, Routes, Route, NavLink, Navigate } from "react-router-dom";
import "./App.css";

const LOW = 2;

const startingBooks = [
  { id: 1, title: "Malebela", author: "Ntai Odilon Ramakau", genre: "Fiction", isbn: "9789991149738", quantity: 4 },
  { id: 2, title: "Tholoana Tsa Sethepu", author: "B.M.Khaketla", genre: "Drama", isbn: "9780132350884", quantity: 1 }
];

const startingUsers = [
  { id: 1, name: "Head Librarian", membershipId: "ADMIN01", role: "admin", password: "admin123" },
  { id: 2, name: "Mateele Phamotse", membershipId: "MEM100", role: "member", password: "member123" }
];

function load(key, fallback) {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    return saved === null ? fallback : saved;
  } catch {
    return fallback;
  }
}

function Field({ label, type = "text", value, onChange, error, disabled }) {
  return (
    <label>
      {label}
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <span className="error">{error}</span>}
    </label>
  );
}

function Login({ users, onLogin }) {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submit(e) {
    e.preventDefault();
    const user = users.find(
      (u) =>
        u.membershipId.toLowerCase() === id.trim().toLowerCase() &&
        u.password === password
    );

    if (user) {
      onLogin(user.id);
    } else {
      setError("Wrong membership ID or password");
    }
  }

  return (
    <div className="card login">
      <h2>Login</h2>
      <form onSubmit={submit}>
        <Field label="Membership ID" value={id} onChange={setId} />
        <Field label="Password" type="password" value={password} onChange={setPassword} error={error} />
        <button>Log in</button>
      </form>
      <p>Demo admin: ADMIN01 / admin123</p>
      <p>Demo member: MEM100 / member123</p>
    </div>
  );
}

function BookCard({ book }) {
  return (
    <div className={book.quantity < LOW ? "book low" : "book"}>
      <strong>{book.title}</strong>
      <p>{book.author}</p>
      <p>Genre: {book.genre}</p>
      <p>In stock: {book.quantity}</p>
      {book.quantity < LOW && <p className="error">Low stock!</p>}
    </div>
  );
}

function Dashboard({ books }) {
  return (
    <div className="card">
      <h2>Book Availability</h2>
      {books.length === 0 ? (
        <p>No books available.</p>
      ) : (
        <div className="book-list">
          {books.map((book) => <BookCard key={book.id} book={book} />)}
        </div>
      )}
    </div>
  );
}

const emptyBook = {
  title: "",
  author: "",
  genre: "",
  isbn: "",
  quantity: ""
};

function BooksPage({ books, setBooks }) {
  const [form, setForm] = useState(emptyBook);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});

  function change(field, value) {
    setForm({ ...form, [field]: value });
  }

  function reset() {
    setForm(emptyBook);
    setEditId(null);
    setErrors({});
  }

  function save(e) {
    e.preventDefault();
    const err = {};

    if (!form.title.trim()) err.title = "Title is required";
    if (!form.author.trim()) err.author = "Author is required";
    if (!form.genre.trim()) err.genre = "Genre is required";
    if (!/^(\d{10}|\d{13})$/.test(form.isbn)) {
      err.isbn = "ISBN must be 10 or 13 digits";
    } else if (books.some((b) => b.isbn === form.isbn && b.id !== editId)) {
      err.isbn = "ISBN already exists";
    }

    if (!editId && (form.quantity === "" || !Number.isInteger(Number(form.quantity)) || Number(form.quantity) < 0)) {
      err.quantity = "Enter a whole number of 0 or more";
    }

    setErrors(err);
    if (Object.keys(err).length) return;

    if (editId) {
      setBooks(books.map((b) =>
        b.id === editId
          ? { ...b, title: form.title, author: form.author, genre: form.genre, isbn: form.isbn }
          : b
      ));
    } else {
      setBooks([
        ...books,
        { ...form, quantity: Number(form.quantity), id: Date.now() }
      ]);
    }

    reset();
  }

  function remove(book) {
    if (window.confirm("Delete " + book.title + "?")) {
      setBooks(books.filter((b) => b.id !== book.id));
      if (editId === book.id) reset();
    }
  }

  return (
    <div>
      <div className="card">
        <h2>{editId ? "Update book" : "Add book"}</h2>
        <form onSubmit={save}>
          <Field label="Title" value={form.title} error={errors.title} onChange={(v) => change("title", v)} />
          <Field label="Author" value={form.author} error={errors.author} onChange={(v) => change("author", v)} />
          <Field label="Genre" value={form.genre} error={errors.genre} onChange={(v) => change("genre", v)} />
          <Field label="ISBN" value={form.isbn} error={errors.isbn} onChange={(v) => change("isbn", v)} />
          <Field label="Initial quantity" type="number" value={form.quantity} error={errors.quantity} disabled={!!editId} onChange={(v) => change("quantity", v)} />
          <button>{editId ? "Save changes" : "Add book"}</button>
          {editId && <button type="button" onClick={reset}>Cancel</button>}
        </form>
      </div>

      <div className="card">
        <h2>All books</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th><th>Author</th><th>Genre</th>
                <th>ISBN</th><th>Qty</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr key={book.id} className={book.quantity < LOW ? "low" : ""}>
                  <td>{book.title}</td>
                  <td>{book.author}</td>
                  <td>{book.genre}</td>
                  <td>{book.isbn}</td>
                  <td>{book.quantity}</td>
                  <td>
                    <button type="button" onClick={() => {
                      setForm({ ...book, quantity: String(book.quantity) });
                      setEditId(book.id);
                    }}>Update</button>
                    <button type="button" className="delete" onClick={() => remove(book)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TransactionsPage({ books, setBooks, transactions, setTransactions }) {
  const [bookId, setBookId] = useState("");
  const [type, setType] = useState("add");
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState("");

  function submit(e) {
    e.preventDefault();
    const book = books.find((b) => b.id === Number(bookId));
    const amount = Number(quantity);

    if (!book) return setError("Please select a book");
    if (!Number.isInteger(amount) || amount < 1) {
      return setError("Quantity must be 1 or more");
    }
    if (type === "borrow" && amount > book.quantity) {
      return setError("Only " + book.quantity + " in stock");
    }

    const changeAmount = type === "add" ? amount : -amount;

    setBooks(books.map((b) =>
      b.id === book.id ? { ...b, quantity: b.quantity + changeAmount } : b
    ));

    setTransactions([
      {
        id: Date.now(),
        date: new Date().toLocaleString(),
        title: book.title,
        type,
        quantity: amount
      },
      ...transactions
    ]);

    setError("");
    setQuantity("1");
    setBookId("");
  }

  return (
    <div>
      <div className="card">
        <h2>Add or deduct stock</h2>
        <form onSubmit={submit}>
          <label>
            Book
            <select value={bookId} onChange={(e) => setBookId(e.target.value)}>
              <option value="">Select a book</option>
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} ({b.quantity} in stock)
                </option>
              ))}
            </select>
          </label>
          <label>
            Transaction
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="add">Add stock</option>
              <option value="borrow">Borrowed (deduct)</option>
            </select>
          </label>
          <Field label="Quantity" type="number" value={quantity} onChange={setQuantity} error={error} />
          <button>Record</button>
        </form>
      </div>

      <div className="card">
        <h2>Transaction History</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Date</th><th>Book</th><th>Type</th><th>Qty</th></tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td>{t.date}</td>
                  <td>{t.title}</td>
                  <td>{t.type === "add" ? "Stock added" : "Borrowed"}</td>
                  <td>{t.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const emptyUser = {
  name: "",
  membershipId: "",
  role: "member",
  password: ""
};

function UsersPage({ users, setUsers, currentUser }) {
  const [form, setForm] = useState(emptyUser);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});

  function change(field, value) {
    setForm({ ...form, [field]: value });
  }

  function reset() {
    setForm(emptyUser);
    setEditId(null);
    setErrors({});
  }

  if (currentUser.role !== "admin") {
    return (
      <div className="card">
        <h2>My Account</h2>
        <p>{currentUser.name} ({currentUser.role})</p>
        <p>Only admins can manage users.</p>
      </div>
    );
  }

  function save(e) {
    e.preventDefault();
    const err = {};

    if (form.name.trim().length < 2) err.name = "Enter a name";
    if (form.membershipId.trim().length < 4) {
      err.membershipId = "At least 4 characters";
    } else if (users.some((u) =>
      u.membershipId.toLowerCase() === form.membershipId.trim().toLowerCase() &&
      u.id !== editId
    )) {
      err.membershipId = "Already used";
    }

    if (!editId && form.password.length < 6) {
      err.password = "At least 6 characters";
    }
    if (editId && form.password && form.password.length < 6) {
      err.password = "At least 6 characters";
    }

    setErrors(err);
    if (Object.keys(err).length) return;

    const userData = {
      ...form,
      membershipId: form.membershipId.trim()
    };

    if (editId) {
      setUsers(users.map((u) => {
        if (u.id !== editId) return u;
        return {
          ...u,
          ...userData,
          password: userData.password || u.password
        };
      }));
    } else {
      setUsers([...users, { ...userData, id: Date.now() }]);
    }

    reset();
  }

  function remove(user) {
    if (user.id === currentUser.id) {
      alert("You cannot delete yourself");
      return;
    }

    if (window.confirm("Delete " + user.name + "?")) {
      setUsers(users.filter((u) => u.id !== user.id));
    }
  }

  return (
    <div>
      <div className="card">
        <h2>{editId ? "Update user" : "Add user"}</h2>
        <form onSubmit={save}>
          <Field label="Name" value={form.name} error={errors.name} onChange={(v) => change("name", v)} />
          <Field label="Membership ID" value={form.membershipId} error={errors.membershipId} onChange={(v) => change("membershipId", v)} />
          <label>
            Role
            <select value={form.role} onChange={(e) => change("role", e.target.value)}>
              <option value="member">Member</option>
              <option value="librarian">Librarian</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <Field label={editId ? "New password (leave blank to keep current)" : "Password"} type="password" value={form.password} error={errors.password} onChange={(v) => change("password", v)} />
          <button>{editId ? "Save changes" : "Add user"}</button>
          {editId && <button type="button" onClick={reset}>Cancel</button>}
        </form>
      </div>

      <div className="card">
        <h2>All users</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Name</th><th>Membership ID</th><th>Role</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.membershipId}</td>
                  <td>{user.role}</td>
                  <td>
                    <button type="button" onClick={() => {
                      setForm({ ...user, password: "" });
                      setEditId(user.id);
                    }}>Update</button>
                    <button type="button" className="delete" onClick={() => remove(user)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [books, setBooks] = useState(() => load("library_books", startingBooks));
  const [users, setUsers] = useState(() => load("library_users", startingUsers));
  const [transactions, setTransactions] = useState(() => load("library_transactions", []));
  const [loggedInId, setLoggedInId] = useState(() => load("library_loggedInId", null));

  useEffect(() => {
    localStorage.setItem("library_books", JSON.stringify(books));
  }, [books]);

  useEffect(() => {
    localStorage.setItem("library_users", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem("library_transactions", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("library_loggedInId", JSON.stringify(loggedInId));
  }, [loggedInId]);

  const currentUser = users.find((u) => u.id === loggedInId);
  const isStaff = currentUser &&
    (currentUser.role === "admin" || currentUser.role === "librarian");

  return (
    <HashRouter>
      <header>
        <h1>Community Library</h1>
        {currentUser && (
          <nav>
            <NavLink to="/">Dashboard</NavLink>
            {isStaff && <NavLink to="/books">Books</NavLink>}
            {isStaff && <NavLink to="/transactions">Transactions</NavLink>}
            <NavLink to="/users">
              {currentUser.role === "admin" ? "Users" : "My Account"}
            </NavLink>
            <button type="button" onClick={() => setLoggedInId(null)}>Logout</button>
          </nav>
        )}
      </header>

      <main>
        {!currentUser ? (
          <Login users={users} onLogin={setLoggedInId} />
        ) : (
          <Routes>
            <Route path="/" element={<Dashboard books={books} />} />
            {isStaff && (
              <Route path="/books" element={<BooksPage books={books} setBooks={setBooks} />} />
            )}
            {isStaff && (
              <Route path="/transactions" element={
                <TransactionsPage
                  books={books}
                  setBooks={setBooks}
                  transactions={transactions}
                  setTransactions={setTransactions}
                />
              } />
            )}
            <Route path="/users" element={
              <UsersPage users={users} setUsers={setUsers} currentUser={currentUser} />
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </main>
    </HashRouter>
  );
}

export default App;
