import { formatDateTime, statusColor, statusLabel } from "@/lib/utils";

type Log = {
  id: string;
  previousStatus: string | null;
  newStatus: string;
  createdAt: Date | string;
  changedBy: { id: string; name: string };
};

export default function StatusTimeline({ logs }: { logs: Log[] }) {
  if (!logs || logs.length === 0) return null;
  return (
    <section className="card mt-6 p-6">
      <h2 className="text-lg font-semibold text-slate-900">Histórico de status</h2>
      <ol className="mt-4 flex flex-col gap-3">
        {logs.map((l) => (
          <li
            key={l.id}
            className="flex flex-col gap-1 rounded-md border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {l.previousStatus ? (
                <>
                  <span className={"badge " + statusColor[l.previousStatus]}>
                    {statusLabel[l.previousStatus]}
                  </span>
                  <span className="text-slate-500">→</span>
                </>
              ) : (
                <span className="text-slate-500">Inicial:</span>
              )}
              <span className={"badge " + statusColor[l.newStatus]}>
                {statusLabel[l.newStatus]}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              por <strong className="text-slate-700">{l.changedBy.name}</strong> em{" "}
              {formatDateTime(l.createdAt)}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
