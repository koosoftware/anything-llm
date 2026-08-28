const OpenAI = require("openai");
const Provider = require("./ai-provider.js");
const InheritMultiple = require("./helpers/classes.js");
const UnTooled = require("./helpers/untooled.js");
const { APIError } = require("../error.js");
const {
  openaiBaseURL,
} = require("../../../AiProviders/bedrockMantle/endpoints.js");

/**
 * The agent provider for AWS Bedrock via the Bedrock Mantle endpoint.
 *
 * This is separate from the legacy `bedrock` agent provider, which talks to the
 * AWS SDK with SigV4 credentials. Mantle exposes an OpenAI-compatible API, so we
 * use the OpenAI client here, wrapped in UnTooled for prompt-based tool calling
 * (same approach as the other UnTooled providers on this branch).
 */
class AWSBedrockMantleProvider extends InheritMultiple([Provider, UnTooled]) {
  model;

  constructor(config = {}) {
    super();
    const model =
      config.model ||
      process.env.AWS_BEDROCK_MANTLE_LLM_MODEL_PREFERENCE ||
      null;
    const region = process.env.AWS_BEDROCK_MANTLE_LLM_REGION;
    const client = new OpenAI({
      baseURL: openaiBaseURL(region),
      apiKey: process.env.AWS_BEDROCK_MANTLE_LLM_API_KEY,
      maxRetries: 0,
    });

    this._client = client;
    this.model = model;
    this.verbose = true;
  }

  get client() {
    return this._client;
  }

  async #handleFunctionCallChat({ messages = [] }) {
    return await this.client.chat.completions
      .create({
        model: this.model,
        temperature: 0,
        messages: this.cleanMsgs(messages),
      })
      .then((result) => {
        if (!result.hasOwnProperty("choices"))
          throw new Error("Bedrock Mantle chat: No results!");
        if (result.choices.length === 0)
          throw new Error("Bedrock Mantle chat: No results length!");
        return result.choices[0].message.content;
      })
      .catch((_) => {
        return null;
      });
  }

  /**
   * Create a completion based on the received messages.
   *
   * @param messages A list of messages to send to the API.
   * @param functions
   * @returns The completion.
   */
  async complete(messages, functions = []) {
    try {
      let completion;
      if (functions.length > 0) {
        const { toolCall, text } = await this.functionCall(
          messages,
          functions,
          this.#handleFunctionCallChat.bind(this)
        );

        if (toolCall !== null) {
          this.providerLog(`Valid tool call found - running ${toolCall.name}.`);
          this.deduplicator.trackRun(toolCall.name, toolCall.arguments);
          return {
            result: null,
            functionCall: {
              name: toolCall.name,
              arguments: toolCall.arguments,
            },
            cost: 0,
          };
        }
        completion = { content: text };
      }

      if (!completion?.content) {
        this.providerLog(
          "Will assume chat completion without tool call inputs."
        );
        const response = await this.client.chat.completions.create({
          model: this.model,
          messages: this.cleanMsgs(messages),
        });
        completion = response.choices[0].message;
      }

      // The UnTooled class inherited Deduplicator is mostly useful to prevent the agent
      // from calling the exact same function over and over in a loop within a single chat exchange
      // _but_ we should enable it to call previously used tools in a new chat interaction.
      this.deduplicator.reset("runs");
      return {
        result: completion.content,
        cost: 0,
      };
    } catch (error) {
      throw new APIError(
        error?.message
          ? `${this.constructor.name} encountered an error while executing the request: ${error.message}`
          : "There was an error with the AWS Bedrock (Mantle) provider executing the request"
      );
    }
  }

  /**
   * Get the cost of the completion.
   * Stubbed since Bedrock pricing is per-model and not reported by the API.
   *
   * @param _usage The completion to get the cost for.
   * @returns The cost of the completion.
   */
  getCost(_usage) {
    return 0;
  }
}

module.exports = AWSBedrockMantleProvider;
