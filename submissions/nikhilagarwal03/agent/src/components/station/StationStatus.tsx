type StationStatusProps = {
  status: "SEAL" | "STOP" | "UNCERTAIN";
};

const statusStyles = {
  SEAL: "text-emerald-500",
  STOP: "text-red-500",
  UNCERTAIN: "text-amber-500",
} as const;

export function StationStatus({ status }: StationStatusProps) {
  return <span className={statusStyles[status]}>{status}</span>;
}