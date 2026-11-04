# CLAUDE.md — anything-llm (RagmyAI backend fork)

This is Koo's fork of Mintplex Labs' AnythingLLM (`origin` = `github.com/koosoftware/anything-llm`, `upstream` = `github.com/mintplex-labs/anything-llm`). It is the RAG/chat engine behind RagmyAI: the `ragmyai` API server calls it for workspaces, document ingestion and chat. Work happens on branch **`pg`** (the production line); a local `master` branch also exists.

Fork point: upstream **v1.8.5** (merge-base `6358d087`, 2025-08-15, v1.8.5 + 3 commits). The branch has 35 commits on top (82 files, +2413/−568). Upstream is at v1.19.0 (`git ls-remote --tags upstream`, 2026-11-01; the earlier note of v1.9.1 on 2026-10-25 was a misread), so the fork is far behind. Releases are tagged `ragmyai-v1.8.5.N`; current is **v1.8.5.10** (15 Oct 2026). Release notes are kept at the top of `readme.txt`.

Upstream layout still applies: `server/` (Express + Prisma), `collector/` (document and link ingestion), `frontend/` (React/Vite), `docker/`. Node 18 (`.nvmrc` v18.18.0).

## What Koo changed (diff against upstream v1.8.5 base)

Refresh this list any time with:
```bash
git fetch upstream --tags
B=$(git merge-base HEAD upstream/master)
git diff --stat $B HEAD          # file-level
git log --no-merges --oneline $B..HEAD
```

1. **PostgreSQL + pgvector by default.** `server/prisma/schema.prisma` datasource is `postgresql` (`DATABASE_URL`) instead of SQLite. All upstream SQLite migrations were deleted and replaced by a reset baseline (`migrations/20250509192540_init`, plus `20250822232527_init`, `20250823232527_init`; `migration_lock.toml` provider changed). Default `VECTOR_DB` is `pgvector` instead of `lancedb` (`server/endpoints/utils.js`, `server/models/systemSettings.js`), with matching text edits in the frontend onboarding/settings pages. `.github/workflows/build-and-push-pg-image.yaml` builds and pushes the Docker image on pushes to `pg`. `server/src/anythingllm/` in the `ragmyai` repo holds the SQLite→Postgres data migration script.
2. **New LLM provider: AWS Bedrock Mantle** (`bedrock_mantle`). Files: `server/utils/AiProviders/bedrockMantle/{index,endpoints,anthropicChat}.js`, agent provider `server/utils/agents/aibitat/providers/bedrockMantle.js`, frontend `components/LLMSelection/AwsBedrockMantleLLMOptions/`, plus wiring in `updateENV.js`, `customModels.js`, `helpers/index.js`, `agents/index.js`, and `AWS_BEDROCK_MANTLE_*` vars in both `.env.example` files. Added in v1.8.5.3; the fix commit mentions Gemma 4 31B.
3. **Groq provider rewritten** (`server/utils/AiProviders/groq/index.js`, `groq-sdk` added to `server/package.json`): handles image attachments and strips unsupported `attachments` from history.
4. **Gemini and Azure OpenAI tweaks:** optional max output tokens (`GEMINI_LLM_MAX_TOKENS`, `AZURE_OPENAI_MAX_TOKENS`); `<thought>` blocks stripped from Gemma 4 output via the Gemini API. The Gemini 2.5 Flash `reasoning_effort: none` change was added then reverted in v1.8.5.7/8, so treat default reasoning behaviour as upstream.
5. **Developer API additions** in `server/endpoints/api/workspace/index.js`: `DELETE /v1/workspace/:slug/delete-chats`, `POST /v1/workspace/:slug/parse-file`, `DELETE /v1/workspace/:slug/delete-parsed-files`; chat responses return `chatId`. `workspace_parsed_files` gained a `sessionId` column, and `apiChatHandler.js` injects that session's parsed files into context (inferred from commits "support user attachment" and "Ask doc": this backs document attachments in RagmyAI chat). Touches `models/workspaceParsedFiles.js`, `models/documents.js`, `endpoints/workspaceThreads.js`, `endpoints/workspaces.js`, `endpoints/chat.js`, `api/openai/index.js`, `api/workspaceThread/index.js`.
6. **Link scraping hardening** (`collector/processLink/convert/generic.js`): the Puppeteer scrape override now always applies, blocks images/media/fonts and sub-frame navigations, and always closes Chrome in a `finally`. Fixes for sites that froze the server (v1.8.5.9, v1.8.5.10).
7. **Performance:** cached LanceDB connection (`vectorDbProviders/lance/index.js`) and a single ONNX embedding pipeline per model (`EmbeddingEngines/native/index.js`); small pgvector provider edit. Likely the "Fix slow chat response when vector count not empty" fix (v1.8.5.2); not confirmed per-commit.
8. **Ops notes:** `readme.txt` (release log and docker build/push commands) was added by Koo. It is tracked; keep it free of credentials.

## Commands

Dev (upstream scripts, from repo root):
```bash
yarn setup            # installs server, collector, frontend; envs; prisma
yarn dev:all          # server + frontend + collector (or dev:server / dev:collector / dev:frontend)
yarn lint
yarn test             # jest
yarn prisma:generate
```
Running locally needs a reachable Postgres (`DATABASE_URL` in `server/.env.development`). Do not run `prisma migrate dev` against production.

Build and publish a release image (do not run without Koo's go-ahead):
```bash
sudo docker buildx build --platform linux/amd64 -t koosoftware/anything-llm:ragmyai-v<ver> -f ./docker/Dockerfile .
sudo docker push koosoftware/anything-llm:ragmyai-v<ver>
```
Production runs two containers (`al3002`, `al3003`, ports 3002/3003 mapped to 3001) against one Postgres database; run steps are in the `ragmyai` repo's `readme.txt`.

## Rules for working here

- Keep fork changes small and well-marked so upstream merges stay tractable. Before adding a feature, check whether upstream v1.9.x already has it.
- Merging upstream will conflict mainly in: `server/prisma/` (migrations were reset, so expect to keep the PG baseline and port new upstream migrations by hand), `server/endpoints/api/workspace/index.js`, `updateENV.js`, `customModels.js`, the Groq provider, and `collector/.../generic.js`.
- When you ship a change: add an entry at the top of `readme.txt` with the next `v1.8.5.N`, matching the existing format.
- Never write API keys, endpoints with embedded tokens, or DB passwords into tracked files.
- Commit only when asked. Existing commit messages are short and imperative; pushing to `pg` triggers a Docker image build, so ask before pushing.
