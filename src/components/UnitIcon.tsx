import { CompanyType } from '../units/types'

interface Props {
  type: CompanyType
  selected?: boolean
  size?: number
}

// NATO MILSTD-2525 стиль — сині прямокутники з символами типу
export function UnitIcon({ type, selected = false, size = 36 }: Props) {
  const w = size * 1.6
  const h = size
  const stroke = selected ? '#ffdd00' : '#003399'
  const strokeWidth = selected ? 2.5 : 1.5

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {/* Основний прямокутник */}
      <rect
        x={strokeWidth}
        y={strokeWidth}
        width={w - strokeWidth * 2}
        height={h - strokeWidth * 2}
        fill="#a8c4e8"
        stroke={stroke}
        strokeWidth={strokeWidth}
        rx={2}
      />
      {/* Символ типу */}
      {renderSymbol(type, w, h)}
    </svg>
  )
}

function renderSymbol(type: CompanyType, w: number, h: number) {
  const cx = w / 2
  const cy = h / 2
  const color = '#003399'

  switch (type) {
    case CompanyType.Assault:
      // Піхота — хрест (X)
      return (
        <g stroke={color} strokeWidth={1.5}>
          <line x1={w * 0.2} y1={h * 0.2} x2={w * 0.8} y2={h * 0.8} />
          <line x1={w * 0.8} y1={h * 0.2} x2={w * 0.2} y2={h * 0.8} />
        </g>
      )

    case CompanyType.Line:
      // Лінійна — горизонтальна лінія
      return (
        <line x1={w * 0.2} y1={cy} x2={w * 0.8} y2={cy} stroke={color} strokeWidth={2} />
      )

    case CompanyType.Tank:
      // Танки — овал всередині
      return (
        <ellipse cx={cx} cy={cy} rx={w * 0.28} ry={h * 0.22} stroke={color} strokeWidth={1.5} fill="none" />
      )

    case CompanyType.Artillery:
      // Артилерія — коло з крапкою
      return (
        <g>
          <circle cx={cx} cy={cy} r={h * 0.28} stroke={color} strokeWidth={1.5} fill="none" />
          <circle cx={cx} cy={cy} r={2.5} fill={color} />
        </g>
      )

    case CompanyType.Recon:
      // Розвідка — діагональна лінія
      return (
        <line x1={w * 0.2} y1={h * 0.8} x2={w * 0.8} y2={h * 0.2} stroke={color} strokeWidth={2} />
      )

    case CompanyType.UAV:
      // БПЛА — стрілки вгору-вниз (повітряний символ)
      return (
        <g stroke={color} strokeWidth={1.5} fill="none">
          <polyline points={`${cx},${h * 0.15} ${cx - w * 0.2},${h * 0.45} ${cx + w * 0.2},${h * 0.45}`} />
          <polyline points={`${cx},${h * 0.85} ${cx - w * 0.2},${h * 0.55} ${cx + w * 0.2},${h * 0.55}`} />
        </g>
      )

    case CompanyType.Special:
      // Спецпідрозділ — ромб
      return (
        <polygon
          points={`${cx},${h * 0.15} ${w * 0.82},${cy} ${cx},${h * 0.85} ${w * 0.18},${cy}`}
          stroke={color}
          strokeWidth={1.5}
          fill="none"
        />
      )

    default:
      return null
  }
}
