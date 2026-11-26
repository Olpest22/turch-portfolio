import { useState } from 'react';

/* Small shared pieces of the tracker. */
export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const t = document.createElement('textarea');
    t.value = text;
    document.body.appendChild(t);
    t.select();
    document.execCommand('copy');
    t.remove();
  }
}
export function CopyBtn({ text, label, primary }: { text: string; label: string; primary?: boolean }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={`btn ${primary ? 'btn-a' : 'btn-b ui-press--on-dark'} ui-press ui-focus h-[44px] px-4 text-[15px]`}
      onClick={async () => {
        await copyText(text);
        setDone(true);
        window.setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? 'Скопировано ✓' : label}
    </button>
  );
}
