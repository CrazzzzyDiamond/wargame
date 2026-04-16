// Озвучення вибору бригади через Web Speech API (українська)
const BRIGADE_PHRASES: Record<string, string[]> = {
  '80 ОДШБр': [
    'Вісімдесята ДШБ, слухаю!',
    'Вісімдесята — завжди перші!',
    'До бою готові, командире!',
  ],
  '95 ОДШБр': [
    'Дев\'яносто п\'ята, на зв\'язку!',
    'Штурм не зупинити — дев\'яносто п\'ята!',
    'Десант готовий. Чекаємо наказу!',
  ],
  '92 ОМБр': [
    'Дев\'яносто друга механізована слухає!',
    'Техніка заведена, йдемо!',
    'Дев\'яносто друга — тримаємо фронт!',
  ],
  '25 ОПДБр': [
    'Двадцять п\'ята повітряно-десантна, є!',
    'Небо наше — земля теж буде наша!',
    'Двадцять п\'ята до стрибка готова!',
  ],
  '3 ОТБр': [
    'Третя танкова, броня на місці!',
    'Залізо рухається, командире!',
    'Танки до бою — третя бригада!',
  ],
  '14 ОМБр': [
    'Чотирнадцята механізована, слухаю!',
    'Чотирнадцята готова пробивати шлях!',
    'Є, командире. Рухаємось!',
  ],
}

let ukrainianVoice: SpeechSynthesisVoice | null = null

function loadVoices() {
  const voices = speechSynthesis.getVoices()
  ukrainianVoice = voices.find(v => v.lang.startsWith('uk')) ?? null
}

if ('speechSynthesis' in window) {
  loadVoices()
  speechSynthesis.addEventListener('voiceschanged', loadVoices)
}

export function playBrigadeSelectSound(shortName: string) {
  if (!('speechSynthesis' in window)) return
  const phrases = BRIGADE_PHRASES[shortName]
  if (!phrases?.length) return
  const text = phrases[Math.floor(Math.random() * phrases.length)]

  speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(text)
  utt.lang = 'uk-UA'
  utt.rate = 0.95
  utt.pitch = 0.9
  if (ukrainianVoice) utt.voice = ukrainianVoice
  speechSynthesis.speak(utt)
}
