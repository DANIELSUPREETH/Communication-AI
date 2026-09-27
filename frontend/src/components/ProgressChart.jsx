import { useId } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatDateTime, formatShortDate } from '../utils/formatDate';

function ChartTooltip({ active, payload, label: seriesLabel }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <div className="t-date">{formatDateTime(point.created_at)}</div>
      <div className="t-value">
        {seriesLabel}: {Number(payload[0].value).toFixed(1)} / 10
      </div>
    </div>
  );
}

/** Line/area chart of one metric over time. `data` = dashboard trend points. */
export default function ProgressChart({ data, dataKey, label, color = '#8b5cf6', small = false }) {
  const reduce = useReducedMotion();
  const gradientId = useId().replace(/:/g, '');

  if (!data?.length) {
    return (
      <div className={`chart-box${small ? ' sm' : ''}`}>
        <div className="chart-empty">No data available yet.</div>
      </div>
    );
  }

  const values = data.map((d) => d[dataKey]);
  const summary = `${label} across ${data.length} sessions, from ${values[0]} to ${values[values.length - 1]} out of 10.`;

  return (
    <div className={`chart-box${small ? ' sm' : ''}`} role="img" aria-label={summary}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#25252c" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="created_at"
            tickFormatter={formatShortDate}
            stroke="#767680"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
            hide={small}
          />
          <YAxis domain={[0, 10]} ticks={[0, 5, 10]} stroke="#767680" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip content={<ChartTooltip label={label} />} cursor={{ stroke: '#34343d' }} />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={data.length <= 12 ? { r: 3, fill: color, strokeWidth: 0 } : false}
            activeDot={{ r: 5, strokeWidth: 0 }}
            isAnimationActive={!reduce}
            animationDuration={900}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
