/**
 * Endpoint resolution for the AWS Bedrock (Mantle) provider.
 *
 * AWS documents two different path prefixes on the same Mantle host, and they
 * do NOT serve the same model catalog:
 *
 *   - `https://bedrock-mantle.{region}.api.aws/v1`
 *     Documented in the Bedrock User Guide "Chat Completions API on the
 *     bedrock-mantle endpoint" page, and what upstream AnythingLLM uses.
 *
 *   - `https://bedrock-mantle.{region}.api.aws/openai/v1`
 *     Documented in the "Introducing Gemma 4 models on Amazon Bedrock" post,
 *     which states: "Its endpoint URL is
 *     https://bedrock-mantle.{region}.api.aws/openai/v1, and it exposes the
 *     Chat Completions and Responses APIs."
 *
 * Verified against a live account (us-west-2):
 *   - `google.gemma-4-31b` returns `400 model ... isn't supported on this
 *     route` on `/v1/chat/completions`, but succeeds on
 *     `/openai/v1/chat/completions`.
 *   - `GET /openai/v1/models` returns 404; model listing is only served at
 *     `GET /v1/models`.
 *
 * So the two are deliberately split: inference goes to `/openai/v1` and model
 * listing goes to `/v1`. Both are overridable per-account/region via env.
 */

/**
 * Base host for the Mantle endpoint. Overridable for air-gapped partitions
 * whose domains do not follow the commercial naming scheme.
 * @param {string} region
 * @returns {string}
 */
function mantleHost(region) {
  return (
    process.env.AWS_BEDROCK_MANTLE_LLM_ENDPOINT ||
    `https://bedrock-mantle.${region}.api.aws`
  );
}

/**
 * Normalize a path prefix so it always has a leading slash.
 * @param {string} path
 * @returns {string}
 */
function normalizePath(path) {
  return path.startsWith("/") ? path : `/${path}`;
}

/**
 * Path prefix for inference (chat completions).
 * @returns {string}
 */
function apiPath() {
  return normalizePath(
    process.env.AWS_BEDROCK_MANTLE_LLM_API_PATH || "/openai/v1"
  );
}

/**
 * Path prefix for model listing. Served on `/v1` even though inference is on
 * `/openai/v1` - `GET /openai/v1/models` 404s.
 * @returns {string}
 */
function modelsPath() {
  return normalizePath(
    process.env.AWS_BEDROCK_MANTLE_LLM_MODELS_PATH || "/v1"
  );
}

/**
 * OpenAI-compatible base URL for inference (chat completions).
 * @param {string} region
 * @returns {string}
 */
function openaiBaseURL(region) {
  return `${mantleHost(region)}${apiPath()}`;
}

/**
 * Base URL for model listing. Deliberately separate from `openaiBaseURL`.
 * @param {string} region
 * @returns {string}
 */
function modelsBaseURL(region) {
  return `${mantleHost(region)}${modelsPath()}`;
}

/**
 * Anthropic Messages API base URL for Claude models on Mantle.
 * @param {string} region
 * @returns {string}
 */
function anthropicBaseURL(region) {
  return `${mantleHost(region)}${process.env.AWS_BEDROCK_MANTLE_LLM_ANTHROPIC_PATH || "/anthropic"}`;
}

module.exports = {
  mantleHost,
  apiPath,
  modelsPath,
  openaiBaseURL,
  modelsBaseURL,
  anthropicBaseURL,
};
