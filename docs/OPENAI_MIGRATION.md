# OpenAI generation

The active pipeline uses the official `openai` JavaScript SDK and Responses API directly with `OPENAI_API_KEY`. `OPEN_ROUTER_API_KEY` is no longer required. The existing OpenAI SDK dependency supports Responses and the Zod schema helper used here.

| Workload                                 | Model         | Reasoning   | Rationale                                                                                                    |
| ---------------------------------------- | ------------- | ----------- | ------------------------------------------------------------------------------------------------------------ |
| Ordered topic batches (`TopicService`)   | `gpt-6-sol`   | API default | Lower-cost model for bounded topic planning, preserving the former Sonnet role.                              |
| Newsletter content (`NewsletterService`) | `gpt-6-astra` | `high`      | More capable model for technical explanations and tradeoffs, preserving the former Opus/high-reasoning role. |

These exact API identifiers were verified on October 14, 2026 against the official [Astra model page](https://developers.openai.com/api/docs/models/gpt-6-astra) and [Sol model page](https://developers.openai.com/api/docs/models/gpt-6-sol). Sol is deliberately GPT-6 Sol, as requested, rather than GPT-6.1 Sol. Account access is a separate prerequisite and has not been verified by live generation.

`openaiClient.ts` retains the `complete` interface for text and Zod-validated JSON. It uses `zodTextFormat` for strict structured output, preserves schema names/system instructions, and rejects incomplete responses, refusals, empty content, malformed JSON, and schema violations before content can be saved. Requests set `store: false`; logs record request metadata and usage without prompts or generated content. See the official [structured output guide](https://developers.openai.com/api/docs/guides/structured-outputs).

Deployment configuration must supply an OpenAI project API key with access to both models. Review topic and newsletter quality in a development database before enabling scheduled sending. Unit tests mock OpenAI, databases, and email; they verify the API contract and service routing without paid API calls or production newsletters. No live model-quality, latency, or account-access claim is implied by those tests.

Issue lifecycle, auto-approval, HTML rendering, scheduling, and SES handoff are unchanged. Errors still propagate to the services so newsletter generation can mark a failed issue instead of saving invalid content.
