# `@docmd/plugin-ai`

> Interactive AI Chat assistant plugin for docmd, powered by `aiplug` multi-provider connection.

`@docmd/plugin-ai` connects your docmd documentation site with an interactive "Chat with Docs" assistant. Powered by `aiplug`, it supports 110+ AI providers (OpenAI, Anthropic, Gemini, DeepSeek, Groq, Ollama, local models).

## Features

- 💬 **Interactive Chat Widget**: Sleek floating glassmorphism AI chat drawer matching docmd aesthetics.
- ⚡ **Multi-Provider Connection**: Powered by `aiplug` (`mgks/aiplug`), switch providers seamlessly.
- 📚 **Docs Context Retrieval**: Automatically retrieves relevant markdown sections to answer user questions with source citations.
- 💡 **Suggestion Pills**: Actionable question starters for quick engagement.
- 🎨 **Dark / Light Mode**: Automatically adapts to active site theme tokens.

## Configuration

In your `docmd.config.json` (or `docmd.config.js`):

```json
{
  "plugins": {
    "ai": {
      "provider": "openai",
      "model": "gpt-4o-mini",
      "position": "bottom-right",
      "suggestions": [
        "How do I get started?",
        "What are the main features?",
        "Show code examples"
      ]
    }
  }
}
```

### Environment Variables

Set your provider's API key in your environment or `.env`:
- `OPENAI_API_KEY` (for OpenAI)
- `ANTHROPIC_API_KEY` (for Anthropic)
- `GEMINI_API_KEY` (for Gemini)
- `DEEPSEEK_API_KEY` (for DeepSeek)
- `GROQ_API_KEY` (for Groq)

## License

MIT © docmd.io
