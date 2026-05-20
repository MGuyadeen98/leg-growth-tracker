import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export default function ExposureChart({ points, state, metricLabel, height = 128, onSelectPoint }) {
  return (
    <div className="chart-wrap" style={{ '--chart-height': `${height}px` }}>
      {points.length > 0 && (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={points} margin={{ top: 12, right: 12, bottom: 4, left: 0 }}>
            <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
            <XAxis dataKey="index" tick={{ fill: '#a8bdb8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis hide domain={['dataMin', 'dataMax']} />
            <Tooltip
              cursor={{ stroke: 'rgba(94, 234, 212, 0.35)', strokeWidth: 1 }}
              contentStyle={{ background: '#10201c', border: '1px solid rgba(94, 234, 212, 0.35)', borderRadius: 8, color: '#f8fafc' }}
              labelFormatter={(label) => `Exposure ${label}`}
              formatter={(value) => [value, metricLabel]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#5eead4"
              strokeWidth={3}
              dot={{ r: 5, fill: '#07120f', stroke: '#5eead4', strokeWidth: 2, cursor: 'pointer' }}
              activeDot={{ r: 7, fill: '#99f6e4', stroke: '#042f2e', strokeWidth: 2, onClick: (_, payload) => onSelectPoint?.(payload.payload) }}
              onClick={(payload) => payload?.activePayload?.[0]?.payload && onSelectPoint?.(payload.activePayload[0].payload)}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
      {state !== 'ready' && (
        <div className="chart-empty-overlay">
          <strong>{state === 'locked' ? 'Log your first workout to unlock this chart.' : 'Log 2-3 exposures to see a trend.'}</strong>
        </div>
      )}
    </div>
  )
}
