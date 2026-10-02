import { Fragment } from 'react';

export function NetworkValue({ value }: { value: string }) {
  // Keep IPv6 groups intact at normal line breaks without changing the copied value.
  const parts = value.match(/[^:]*:+|[^:]+$/g) ?? [value];
  return parts.map((part, index) => <Fragment key={index}>
    {part}{index < parts.length - 1 && <wbr />}
  </Fragment>);
}
