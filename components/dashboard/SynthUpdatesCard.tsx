"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function SynthUpdatesCard() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchUpdates() {
    setLoading(true);
    const res = await fetch("/api/synth/update");
    const json = await res.json();
    if (json.success) setData([json.report]);
    setLoading(false);
  }

  useEffect(() => {
    fetchUpdates();
  }, []);

  return (
    <motion.div
      className="rounded-2xl bg-[#0b0b0b] border border-[#0229bf]/30 p-5 text-white w-full"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className="text-lg font-semibold mb-3">Synth Updates</h2>
      {loading ? (
        <p className="text-neutral-400 text-sm">Loading latest updates…</p>
      ) : !data[0] ? (
        <p className="text-neutral-500 text-sm">
          No Synth Updates yet. Try running /api/synth/update.
        </p>
      ) : (
        <p className="text-neutral-300 text-sm whitespace-pre-line leading-relaxed">
          {data[0].summary}
        </p>
      )}
    </motion.div>
  );
}
