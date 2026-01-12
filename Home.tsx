import { useState } from "react";
import { motion } from "framer-motion";
import { Train, Plus, LogOut } from "lucide-react";

export default function Home() {
  const [admin, setAdmin] = useState(false);

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <Train /> Train Maintenance Tracker
      </h1>

      {!admin ? (
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="mt-6 px-4 py-2 bg-black text-white rounded"
          onClick={() => setAdmin(true)}
        >
          Login (Mock)
        </motion.button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 border p-4 rounded"
        >
          <div className="flex justify-between items-center">
            <strong>Admin Panel</strong>
            <button onClick={() => setAdmin(false)}>
              <LogOut />
            </button>
          </div>
          <button className="mt-4 flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded">
            <Plus /> Add Record
          </button>
        </motion.div>
      )}
    </main>
  );
}
