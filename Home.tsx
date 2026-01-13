import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Train, Plus, LogOut, FilePlus, Trash2, Search } from "lucide-react";
import * as XLSX from "xlsx";

type TrainRecord = {
  id: string;
  trainNumber: string;
  type: string;
  status: string;
  date: string; // ISO or simple string
  notes?: string;
};

const STORAGE_KEY = "train_records_v1";

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function Home() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  // Login form
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Records
  const [records, setRecords] = useState<TrainRecord[]>([]);

  // Admin manual form
  const [trainNumber, setTrainNumber] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  // User search
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("All");

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as TrainRecord[];
        setRecords(parsed);
      } catch {
        setRecords([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  // Simple mock auth: username=admin password=admin
  function handleLogin(e?: React.FormEvent) {
    e?.preventDefault();
    if (username === "admin" && password === "admin") {
      setLoggedIn(true);
      setIsAdmin(true);
      setUsername("");
      setPassword("");
    } else {
      alert("Invalid credentials. Use username: admin password: admin");
    }
  }

  function handleLogout() {
    setLoggedIn(false);
    setIsAdmin(false);
  }

  function addRecordManual(e?: React.FormEvent) {
    e?.preventDefault();
    if (!trainNumber || !type || !status) {
      alert("Please fill train number, type and status.");
      return;
    }
    const r: TrainRecord = {
      id: uid(),
      trainNumber,
      type,
      status,
      date: date || new Date().toISOString().slice(0, 10),
      notes,
    };
    setRecords((s) => [r, ...s]);
    setTrainNumber("");
    setType("");
    setStatus("");
    setDate("");
    setNotes("");
  }

  function deleteRecord(id: string) {
    if (!confirm("Delete this record?")) return;
    setRecords((s) => s.filter((r) => r.id !== id));
  }

  // Excel/CSV import
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
        defval: "",
      });

      // Accept rows with keys like trainNumber, type, status, date, notes (case-insensitive)
      const newRecords: TrainRecord[] = json.map((row) => {
        const mapKey = (k: string) => {
          if (!k) return "";
          return k.toString().toLowerCase();
        };
        const entries = Object.entries(row);
        const r: any = {};
        for (const [k, v] of entries) {
          const lk = mapKey(k);
          if (lk.includes("train")) r.trainNumber = String(v);
          else if (lk === "type" || lk.includes("class")) r.type = String(v);
          else if (lk === "status" || lk.includes("state")) r.status = String(v);
          else if (lk === "date") r.date = String(v);
          else if (lk === "notes" || lk.includes("remark")) r.notes = String(v);
          else {
            // try to guess
            if (!r.trainNumber) r.trainNumber = String(v);
          }
        }
        return {
          id: uid(),
          trainNumber: r.trainNumber || "",
          type: r.type || "Unknown",
          status: r.status || "Unknown",
          date:
            r.date && typeof r.date === "string"
              ? r.date
              : new Date().toISOString().slice(0, 10),
          notes: r.notes || "",
        } as TrainRecord;
      });

      // Filter out empty trainNumber rows
      const cleaned = newRecords.filter((nr) => nr.trainNumber.trim() !== "");
      if (cleaned.length === 0) {
        alert("No valid rows found in the file. Make sure it has trainNumber/type/status columns.");
      } else {
        setRecords((s) => [...cleaned, ...s]);
        alert(`Imported ${cleaned.length} records`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to read the file. Make sure it's a valid Excel or CSV file.");
    } finally {
      // reset input value to allow same file re-upload if needed
      e.target.value = "";
    }
  }

  // User filtering
  const types = Array.from(new Set(records.map((r) => r.type))).sort();
  const filtered = records.filter((r) => {
    const matchesQuery = r.trainNumber.toLowerCase().includes(query.toLowerCase());
    const matchesType = filterType === "All" ? true : r.type === filterType;
    return matchesQuery && matchesType;
  });

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <Train /> Train Maintenance Tracker
      </h1>

      {!loggedIn && (
        <section className="mt-6">
          <div className="mb-6">
            <strong>User lookup</strong>
            <div className="mt-2 border p-4 rounded">
              <div className="flex gap-2 items-center">
                <Search />
                <input
                  className="flex-1 px-3 py-2 border rounded"
                  placeholder="Search by train number..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="ml-2 px-3 py-2 border rounded"
                >
                  <option>All</option>
                  {types.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4">
                {filtered.length === 0 ? (
                  <div className="text-sm text-gray-600">No records found.</div>
                ) : (
                  <ul className="space-y-2">
                    {filtered.map((r) => (
                      <li key={r.id} className="border p-3 rounded">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{r.trainNumber}</div>
                            <div className="text-sm text-gray-600">{r.type} • {r.status}</div>
                            <div className="text-xs text-gray-500 mt-1">{r.date}</div>
                            {r.notes && <div className="text-sm mt-2">{r.notes}</div>}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2 bg-black text-white rounded"
            onClick={() => setLoggedIn(false) /* stays as guest; show login below */}
          >
            Continue as Guest
          </motion.button>

          <div className="mt-6">
            <strong>Admin (mock) login</strong>
            <form onSubmit={handleLogin} className="mt-2 border p-4 rounded max-w-md">
              <div className="mb-2">
                <label className="block text-sm">Username</label>
                <input
                  className="w-full px-3 py-2 border rounded"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm">Password</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border rounded"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="admin"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded">
                  Login (Mock)
                </button>
                <button
                  type="button"
                  onClick={() => { setUsername("admin"); setPassword("admin"); alert("Filled with admin/admin"); }}
                  className="px-3 py-2 border rounded"
                >
                  Fill admin
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {loggedIn && isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 border p-4 rounded"
        >
          <div className="flex justify-between items-center">
            <strong>Admin Panel</strong>
            <div className="flex items-center gap-2">
              <button onClick={handleLogout} className="px-2 py-1 border rounded flex items-center gap-1">
                <LogOut /> Logout
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Upload */}
            <div className="border p-3 rounded">
              <div className="flex items-center gap-2">
                <FilePlus />
                <strong>Import Excel / CSV</strong>
              </div>
              <p className="text-sm text-gray-600 mt-2">Upload a spreadsheet with columns like trainNumber, type, status, date, notes.</p>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="mt-3"
              />
            </div>

            {/* Manual add */}
            <div className="border p-3 rounded">
              <div className="flex items-center gap-2">
                <Plus />
                <strong>Add Record Manually</strong>
              </div>
              <form onSubmit={addRecordManual} className="mt-3 space-y-2">
                <input
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Train Number"
                  value={trainNumber}
                  onChange={(e) => setTrainNumber(e.target.value)}
                />
                <input
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Type (e.g., Express, Local)"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                />
                <input
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Status (e.g., On time, Delayed, Under Maintenance)"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                />
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
                <textarea
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Notes (optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <div className="flex gap-2">
                  <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded flex items-center gap-2">
                    <Plus /> Add
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="mt-6">
            <strong>Records ({records.length})</strong>
            <div className="mt-3">
              {records.length === 0 ? (
                <div className="text-sm text-gray-600">No records yet.</div>
              ) : (
                <ul className="space-y-2">
                  {records.map((r) => (
                    <li key={r.id} className="border p-3 rounded flex justify-between items-start">
                      <div>
                        <div className="font-medium">{r.trainNumber}</div>
                        <div className="text-sm text-gray-600">{r.type} • {r.status}</div>
                        <div className="text-xs text-gray-500 mt-1">{r.date}</div>
                        {r.notes && <div className="text-sm mt-2">{r.notes}</div>}
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <button
                          onClick={() => deleteRecord(r.id)}
                          className="text-red-600 px-2 py-1 border rounded flex items-center gap-1"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </main>
  );
}
