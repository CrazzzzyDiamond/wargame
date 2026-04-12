import { CompanyType } from '../units/types'

import imgAssault   from '../images/units/assault.png'
import imgLine      from '../images/units/line.png'
import imgRecon     from '../images/units/recon.png'
import imgUAV       from '../images/units/uav.png'
import imgSpecial   from '../images/units/special.png'
import imgTank      from '../images/units/tank.png'
import imgArtillery from '../images/units/artillery.png'

export const UNIT_IMAGES: Record<CompanyType, string> = {
  [CompanyType.Assault]:   imgAssault,
  [CompanyType.Line]:      imgLine,
  [CompanyType.Recon]:     imgRecon,
  [CompanyType.UAV]:       imgUAV,
  [CompanyType.Special]:   imgSpecial,
  [CompanyType.Tank]:      imgTank,
  [CompanyType.Artillery]: imgArtillery,
}
