# web/ (React 19 + Tailwind 4 + Vite 8)

- One screen: `src/App.tsx`. Split out a component only when it is reused or the file stops
  being readable.
- Styling: Tailwind utility classes only. No component library, no CSS-in-JS. Every colour has a
  `dark:` variant (the page follows the OS theme).
- Data: `POST /api/chat` returns NDJSON; `readEvents()` yields `ChatEvent`s. The type is imported
  from `../../src/agent.ts`, so a backend change that breaks the UI fails `npm run typecheck`.
- Event → UI mapping: `blocked` → red card + layer 1; `tool_result.layer` 2/4 → trace highlight
  + layer badge; `approval` → approval card + layer 3; `message` → agent bubble (`layer === 5` → "withheld" note + layer 5).
- Accessibility: the engine switch is a `radiogroup`; the chat log is `aria-live`; errors use
  `role="alert"`; inputs have labels.
- Vite proxies `/api` to `:8787` (`vite.config.ts` at the repo root).
