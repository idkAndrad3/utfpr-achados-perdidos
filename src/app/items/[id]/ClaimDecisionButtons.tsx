"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";

export default function ClaimDecisionButtons({ claimId }: { claimId: string }) {
  const router = useRouter();
  const { show } = useToast();
  const [loading, setLoading] = useState<"APROVAR" | "RECUSAR" | null>(null);

  async function decide(action: "APROVAR" | "RECUSAR") {
    setLoading(action);
    const res = await fetch(`/api/claims/${claimId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setLoading(null);
    if (!res.ok) {
      show("Erro ao processar a reivindicação.", "error");
      return;
    }
    show(
      action === "APROVAR" ? "Reivindicação aprovada." : "Reivindicação recusada.",
      "success"
    );
    router.refresh();
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <button
        className="btn-primary"
        disabled={loading !== null}
        onClick={() => decide("APROVAR")}
      >
        {loading === "APROVAR" ? "Aprovando..." : "Aprovar"}
      </button>
      <button
        className="btn-danger"
        disabled={loading !== null}
        onClick={() => decide("RECUSAR")}
      >
        {loading === "RECUSAR" ? "Recusando..." : "Recusar"}
      </button>
    </div>
  );
}
