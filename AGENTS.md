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

- Keep the scheduling algorithm in a pure client-safe module; it must compute directly from editable workspace data so results are never fabricated.
- Store each signed-in user's workspace as one RLS-protected JSON document; this keeps editing and scheduling atomic while preserving user isolation.
