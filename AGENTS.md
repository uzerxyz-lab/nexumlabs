<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- All app data is local-first in the browser (src/lib/db.ts, localStorage + undo stack) — the app must work fully offline for a single user.
- The login gate and app shell live in src/components/app/AppShell.tsx rendered from __root — every route is behind the local login.
