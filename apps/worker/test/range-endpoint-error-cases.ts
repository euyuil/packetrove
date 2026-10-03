export const rangeEndpointErrorCases = [
  { request: { start: 'bad', end: '::/128' }, code: 'INVALID_INPUT', fields: ['start', 'end'] },
  { request: { start: '', end: '::1' }, code: 'INVALID_INPUT', fields: ['start'] },
  { request: { start: '::1' }, code: 'INVALID_INPUT', fields: ['end'] },
  { request: { start: '203.0.113.1', end: '::1' }, code: 'MIXED_ADDRESS_FAMILIES', fields: ['end'] },
  { request: { start: '::2', end: '::1' }, code: 'INVALID_INPUT', fields: ['end'] },
];
