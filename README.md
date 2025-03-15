# GitHub PR Review Bot

A GitHub webhook bot that automatically reviews pull requests and responds to comments using AI.

## Features

- **Automated PR Reviews**: When a new PR is opened, the bot analyzes the code and provides detailed feedback
- **Comment Responses**: Responds to comments in PRs when mentioned or when specific keywords are used
- **Code Suggestions**: Provides specific code improvement suggestions when asked
- **Structured Data**: Uses Zod schemas to ensure consistent and typed responses from the AI

## How It Works

The bot uses:
- **Hono**: For a lightweight webhook server
- **SpinAI**: To create an agent with access to GitHub actions
- **MCP GitHub Actions**: To interact with GitHub (reading files, adding comments, etc.)
- **Zod**: For schema validation and typed responses from the AI agent

## Getting Started

### Prerequisites

- Node.js 18+
- GitHub account and repository
- GitHub Personal Access Token

### Environment Setup

Create a `.env` file with your credentials:

```
OPENAI_API_KEY=your_openai_api_key
GITHUB_TOKEN=your_github_token
GITHUB_WEBHOOK_SECRET=your_webhook_secret  # Optional but recommended
BOT_USERNAME=your-bot-username              # Optional, defaults to "github-bot"
PORT=3000                                  # Optional, defaults to 3000
```

### Installation

```bash
npm install
```

### Running

```bash
npm run dev
```

## Webhook Setup

1. Go to your GitHub repository settings > Webhooks
2. Add a new webhook
3. Set Payload URL to your server URL (e.g., `https://your-server.com/webhook`)
4. Set Content type to `application/json`
5. Set Secret (recommended) to match your `GITHUB_WEBHOOK_SECRET`
6. Select events: Pull requests, Issue comments, Pull request review comments
7. Save the webhook

## Customization

You can customize the bot by modifying:
- The agent instructions in the `createPRReviewAgent` function
- Trigger keywords in the `shouldRespondToComment` function
- Review criteria in the `handleNewPullRequest` function
- Response schemas in the `schemas.ts` file to adjust the structure of AI responses

## License

MIT
