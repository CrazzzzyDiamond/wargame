import { CompanyType } from '../units/types'
import { UNIT_IMAGES } from '../assets/unitImages'

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
    filter = 'drop-shadow(0 0 4px #ffdd00) drop-shadow(0 0 2px #ffdd00)'
  } else if (enemy) {
    filter = 'drop-shadow(0 0 3px #e74c3c) sepia(1) saturate(5) hue-rotate(310deg)'
  } else {
    filter = 'drop-shadow(0 0 2px rgba(0,0,0,0.9))'
  }

  return (
    <img
      src={src}
      width={size}
      height={size}
      style={{ objectFit: 'contain', display: 'block', filter }}
    />
  )
}
