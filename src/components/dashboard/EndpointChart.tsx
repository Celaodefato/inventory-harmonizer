import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface EndpointChartProps {
  vicariusCount: number;
  cortexCount: number;
  warpCount: number;
  pamCount: number;
  jumpcloudCount: number;
}

const COLORS = {
  vicarius: 'hsl(173, 80%, 45%)',
  cortex: 'hsl(38, 92%, 55%)',
  warp: 'hsl(262, 83%, 58%)',
  pam: 'hsl(0, 72%, 51%)',
  jumpcloud: 'hsl(210, 80%, 55%)',
};

export function EndpointChart({ vicariusCount, cortexCount, warpCount, pamCount, jumpcloudCount }: EndpointChartProps) {
  const data = [
    { name: 'Vicarius', count: vicariusCount, color: COLORS.vicarius },
    { name: 'Cortex', count: cortexCount, color: COLORS.cortex },
    { name: 'Warp', count: warpCount, color: COLORS.warp },
    { name: 'PAM', count: pamCount, color: COLORS.pam },
    { name: 'JumpCloud', count: jumpcloudCount, color: COLORS.jumpcloud },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-5 animate-fade-in">
      <h3 className="mb-4 text-sm font-medium text-muted-foreground">
        Endpoints por Ferramenta
      </h3>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              interval={0}
              angle={-15}
              textAnchor="end"
              height={40}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--card-foreground))',
              }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
