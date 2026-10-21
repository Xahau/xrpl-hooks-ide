import hookapi from '../../../public/headers/hookapi.h'
import macro from '../../../public/headers/macro.h'
import extern from '../../../public/headers/extern.h'
import error from '../../../public/headers/error.h'
import sfcodes from '../../../public/headers/sfcodes.h'
import tts from '../../../public/headers/tts.h'
import lsflags from '../../../public/headers/ls_flags.h'
import txflags from '../../../public/headers/tx_flags.h'

export const defaultHookHeaders: Record<string, string> = {
  'hookapi.h': hookapi,
  'macro.h': macro,
  'extern.h': extern,
  'error.h': error,
  'sfcodes.h': sfcodes,
  'tts.h': tts,
  'ls_flags.h': lsflags,
  'tx_flags.h': txflags
}
