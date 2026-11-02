const TONES = {
  blue: "bg-sky-50 text-sky-700",
  violet: "bg-violet-50 text-violet-700",
  green: "bg-emerald-50 text-emerald-700",
};

export default function StatCard({ icon: Icon, label, value, tone = "blue" }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${TONES[tone]}`}>
        <Icon size={18} />
      </div>
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
      <div className="mt-0.5 text-xs text-slate-500">{label}</div>
    </div>
  );
}
