import hookapi from './hookapi.h'
import macro from './macro.h'
import extern from './extern.h'
import error from './error.h'
import sfcodes from './sfcodes.h'
import tts from './tts.h'
import lsflags from './ls_flags.h'
import txflags from './tx_flags.h'

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
