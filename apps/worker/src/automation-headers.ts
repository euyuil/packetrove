export const AUTOMATION_TOKEN_HEADER = 'Packetrove-Automation-Token';
export const AUTOMATION_RUN_ID_HEADER = 'Packetrove-Automation-Run-Id';

export function isAutomationToken(value: unknown): value is string {
  return typeof value === 'string' && value.length === 64 && !/[^0-9a-f]/.test(value);
}

export function isAutomationRunId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 20
    && value[0] !== '0' && !/[^0-9]/.test(value);
}
