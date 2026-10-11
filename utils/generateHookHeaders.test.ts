import { test } from 'node:test'
import assert from 'node:assert'
import { generateHookHeaders, TT_MACRO_NAMES } from './generateHookHeaders.ts'

const defaults = {
  'hookapi.h': 'a\n#define KEYLET_HOOK 1\n#define KEYLET_OLD 9\nb\n',
  'error.h': 'DEFAULT_ERROR',
  'extern.h': 'DEFAULT_EXTERN',
  'macro.h': 'MACRO',
  'ls_flags.h': 'LS',
  'tx_flags.h': 'TX'
}

const base = {
  TYPES: { UInt16: 1, UInt8: 16 },
  FIELDS: [
    ['Method', { nth: 2, type: 'UInt8', isSerialized: true }],
    ['Hidden', { nth: 3, type: 'UInt8', isSerialized: false }],
    ['LedgerEntryType', { nth: 1, type: 'UInt16', isSerialized: true }]
  ] as [string, { nth: number; type: string; isSerialized: boolean }][],
  TRANSACTION_TYPES: { Invoke: 99, FooBar: 200, AMMFoo: 201, Payment: 0, Invalid: -1 }
}

const hook = {
  API: {
    accept: {
      return: 'int64_t',
      params: [
        { type: 'uint32_t', name: 'read_ptr' },
        { type: 'uint32_t', name: 'read_len' }
      ],
      amendment: 'HooksUpdate1'
    },
    _g: { return: 'int32_t', params: [{ type: 'uint32_t', name: 'id' }] }
  },
  KEYLET_TYPES: { MANIFEST: 37, HOOK: 1 },
  RETURN_CODES: { OUT_OF_BOUNDS: -1, SUCCESS: 0, INVALID_FLOAT: -10024 }
}

test('sfcodes and tts', () => {
  const out = generateHookHeaders(base, defaults)
  assert.equal(
    out['sfcodes.h'],
    '// For documentation please see: https://xrpl-hooks.readme.io/reference/\n' +
      '// Generated using generate_sfcodes.sh\n' +
      '#define sfMethod ((16U << 16U) + 2U)\n#define sfLedgerEntryType ((1U << 16U) + 1U)\n'
  )
  assert.deepEqual(out['tts.h'].split('\n').slice(2, -1), [
    '#define ttPAYMENT 0',
    `#define ${TT_MACRO_NAMES.Invoke} 99`,
    '#define ttFOO_BAR 200',
    '#define ttAMM_FOO 201'
  ])
})

test('falls back to defaults without HOOK', () => {
  const out = generateHookHeaders(base, defaults)
  for (const f of ['error.h', 'extern.h', 'hookapi.h', 'macro.h', 'ls_flags.h', 'tx_flags.h'])
    assert.equal(out[f], defaults[f as keyof typeof defaults])
})

test('HOOK section', () => {
  const out = generateHookHeaders({ ...base, HOOK: hook }, defaults)
  assert.deepEqual(
    out['error.h'].split('\n').filter(l => /^#define [A-Z_]+ -?\d+$/.test(l)),
    ['#define SUCCESS 0', '#define OUT_OF_BOUNDS -1', '#define INVALID_FLOAT -10024']
  )
  const ext = out['extern.h']
  assert.ok(
    ext.includes(
      '// requires amendment HooksUpdate1\nextern int64_t accept(uint32_t read_ptr, uint32_t read_len);\n'
    )
  )
  assert.ok(ext.includes('extern int32_t __attribute__((noduplicate)) _g(uint32_t id);\n'))
  assert.ok(ext.indexOf('_g(') < ext.indexOf('accept('))
  assert.equal(out['hookapi.h'], 'a\n#define KEYLET_HOOK 1\n#define KEYLET_MANIFEST 37\nb\n')
})
