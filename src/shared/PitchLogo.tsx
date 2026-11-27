import type { ReactNode } from 'react';
import { LOGO } from './brand';

/** The lead's logo on a pitch page, otherwise the demo's own mark. `chip` puts it on white for dark headers. */
export function PitchLogo({ children, chip, size = 32 }: { children: ReactNode; chip?: boolean; size?: number }) {
  if (!LOGO) return <>{children}</>;
  return (
    <img
      src={LOGO}
      alt=""
      aria-hidden="true"
      className="block w-auto max-w-[140px] shrink-0 object-contain"
      style={{ height: size, ...(chip ? { background: '#fff', borderRadius: 8, padding: '3px 6px', height: size + 6 } : {}) }}
    />
  );
}
