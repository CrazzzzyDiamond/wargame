import img3      from '../images/3.png'
import img14     from '../images/14.png'
import img25     from '../images/25.png'
import img80     from '../images/80.png'
import img92     from '../images/92.png'
import img95     from '../images/95.png'
import img113    from '../images/113.png'
import img127    from '../images/127.png'
import imgKraken from '../images/kraken.png'
import imgSSO    from '../images/sso.png'

// Мапінг brigadeId → зображення шеврону/патчу бригади
export const BRIGADE_IMAGES: Record<string, string> = {
  '3-otbr':    img3,
  '14-ombr':   img14,
  '25-opdbr':  img25,
  '80-odshbr': img80,
  '92-ombr':   img92,
  '95-odshbr': img95,
  '113-tro':   img113,
  '127-tro':   img127,
  'kraken':    imgKraken,
  'sso':       imgSSO,
}
