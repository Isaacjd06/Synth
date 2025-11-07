"use client";

import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/data-chain")
      .then((res) => res.json())
      .then((res) => setData(res.data))
      .catch((err) => console.error(err));
  }, []);

  if (!data) return <div className="p-6 text-gray-400">Loading...</div>;

  return (
    <div className="p-6 space-y-6 bg-gray-950 text-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold">Synth Dashboard</h1>

      {data.map((user: any) => (
        <div key={user.id} className="border border-gray-800 rounded-xl p-4">
          <h2 className="text-xl font-semibold">{user.name}</h2>
          <p className="text-sm text-gray-400">{user.email}</p>

          {/* Workflows */}
          <section className="mt-4">
            <h3 className="text-lg font-semibold">Workflows</h3>
            <ul className="list-disc ml-6">
              {user.workflows.map((wf: any) => (
                <li key={wf.id}>
                  <strong>{wf.name}</strong> — {wf.description ?? "No description"}
                  <ul className="list-square ml-6 text-sm text-gray-400">
                    {wf.executions.map((ex: any) => (
                      <li key={ex.id}>Execution at {ex.created_at}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>

          {/* Connections */}
          <section className="mt-4">
            <h3 className="text-lg font-semibold">Connections</h3>
            <ul className="list-disc ml-6">
              {user.connections.map((c: any) => (
                <li key={c.id}>{c.service_name}</li>
              ))}
            </ul>
          </section>

          {/* Memory */}
          <section className="mt-4">
            <h3 className="text-lg font-semibold">Memory</h3>
            <ul className="list-disc ml-6">
              {user.memory.map((m: any) => (
                <li key={m.id}>
                  {m.key}: <span className="text-gray-400">{m.value}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Chat */}
          <section className="mt-4">
            <h3 className="text-lg font-semibold">Chat Messages</h3>
            <ul className="list-disc ml-6">
              {user.chatMessages.map((msg: any) => (
                <li key={msg.id}>
                  <span className="text-gray-300">[{msg.role}]</span> {msg.message}
                </li>
              ))}
            </ul>
          </section>
        </div>
      ))}
    </div>
  );
}
