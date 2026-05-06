'use client';

interface Appt {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  client: { fullName: string };
  service?: { name: string } | null;
}

interface Props {
  weekStart: Date;
  appointments: Appt[];
  onSelect?: (id: string) => void;
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
const HOURS = Array.from({ length: 14 }, (_, i) => 7 + i); // 7:00 a 20:00

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-amber-300 text-amber-900',
  CONFIRMED: 'bg-primary text-white',
  COMPLETED: 'bg-emerald-500 text-white',
  CANCELLED: 'bg-gray-300 text-gray-700 line-through',
  NO_SHOW: 'bg-red-300 text-red-900',
};

export function WeekCalendar({ weekStart, appointments, onSelect }: Props) {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    days.push(d);
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
      <div className="grid min-w-[720px] grid-cols-[60px_repeat(7,minmax(110px,1fr))]">
        <div className="border-b border-border bg-surface-2" />
        {days.map((d, idx) => (
          <div
            key={idx}
            className="border-b border-border bg-surface-2 px-2 py-2 text-center text-xs"
          >
            <p className="font-semibold text-fg">{DAY_NAMES[d.getDay()]}</p>
            <p className="text-fg-muted">
              {d.getDate()}/{d.getMonth() + 1}
            </p>
          </div>
        ))}

        {HOURS.map((h) => (
          <RowFragment
            key={h}
            hour={h}
            days={days}
            appointments={appointments}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

function RowFragment({
  hour,
  days,
  appointments,
  onSelect,
}: {
  hour: number;
  days: Date[];
  appointments: Appt[];
  onSelect?: (id: string) => void;
}) {
  return (
    <>
      <div className="border-b border-border px-2 py-3 text-right text-xs text-fg-muted">
        {String(hour).padStart(2, '0')}:00
      </div>
      {days.map((d, idx) => {
        const dayStart = new Date(d);
        dayStart.setHours(hour, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(hour + 1);
        const matches = appointments.filter((a) => {
          const s = new Date(a.startAt);
          return (
            s.getDate() === d.getDate() &&
            s.getMonth() === d.getMonth() &&
            s.getFullYear() === d.getFullYear() &&
            s.getHours() === hour
          );
        });
        return (
          <div key={idx} className="relative h-14 border-b border-border px-1 py-1">
            {matches.map((a) => (
              <button
                key={a.id}
                onClick={() => onSelect?.(a.id)}
                className={
                  'absolute inset-x-1 top-1 truncate rounded-lg px-2 py-1 text-left text-xs ' +
                  (STATUS_COLOR[a.status] ?? 'bg-primary-soft text-fg')
                }
                title={`${a.client.fullName}${a.service ? ' · ' + a.service.name : ''}`}
              >
                {new Date(a.startAt).toLocaleTimeString('es-CU', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                {a.client.fullName}
              </button>
            ))}
          </div>
        );
      })}
    </>
  );
}
