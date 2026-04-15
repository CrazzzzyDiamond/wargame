import { CompanyType } from '../units/types'
import { UNIT_IMAGES } from '../assets/unitImages'
import { ACCENT, SIDE_COLORS } from '../config/theme'

interface Props {
  type: CompanyType
  selected?: boolean
  enemy?: boolean
  size?: number
}

export function UnitIcon({ type, selected = false, enemy = false, size = 52 }: Props) {
  const src = UNIT_IMAGES[type]
  if (!src) return null

  let filter: string
  if (selected) {
    filter = `drop-shadow(0 0 4px ${ACCENT.yellow}) drop-shadow(0 0 2px ${ACCENT.yellow})`
  } else if (enemy) {
    filter = `drop-shadow(0 0 3px ${SIDE_COLORS.russia}) sepia(1) saturate(5) hue-rotate(310deg)`
  } else {
    filter = 'drop-shadow(0 0 2px rgba(0,0,0,0.9))'
  }

  return (
    <img
      src={src}
      style={{ width: 'auto', maxWidth: size * 2, height: size, display: 'block', filter }}
    />
  )
}
