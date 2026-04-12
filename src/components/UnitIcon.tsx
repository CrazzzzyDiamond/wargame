import { CompanyType } from '../units/types'
import { UNIT_IMAGES } from '../assets/unitImages'

interface Props {
  type: CompanyType
  selected?: boolean
  size?: number
}

export function UnitIcon({ type, selected = false, size = 52 }: Props) {
  const src = UNIT_IMAGES[type]
  if (!src) return null

  return (
    <img
      src={src}
      width={size}
      height={size}
      style={{
        objectFit: 'contain',
        display: 'block',
        filter: selected
          ? 'drop-shadow(0 0 4px #ffdd00) drop-shadow(0 0 2px #ffdd00)'
          : 'drop-shadow(0 0 2px rgba(0,0,0,0.9))',
      }}
    />
  )
}
