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
- GitHub App configured with necessary permissions

### GitHub App Setup

1. Go to your GitHub account settings > Developer settings > GitHub Apps
2. Click "New GitHub App"
3. Fill in the app details:
   - Give your app a name
   - Set Homepage URL (can be repository URL)
   - Set Webhook URL to your server URL (e.g., `https://your-server.com/webhook`) (you can use ngrok for local development and then your railway endpoint after)
   - Set Webhook secret (recommended)

4. Set the following permissions:
   - Repository permissions:
     - Pull requests: Read & Write
     - Contents: Read
     - Issues: Read & Write
     - Metadata: Read-only

5. Subscribe to events:
   - Pull request
   - Pull request review
   - Pull request review comment
   - Issue comment

6. After creating the app:
   - Generate a private key and download it
   - Note your App ID
   - Install the app on your repositories

### Environment Setup

Create a `.env` file with your credentials:

```
OPENAI_API_KEY=your_openai_api_key
GITHUB_APP_ID=your_github_app_id
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
SPINAI_API_KEY=your_spinai_api_key
BOT_USERNAME=your-bot-username[bot]              
PORT=3000                                        # Optional, defaults to 3000
```

Note: For the `GITHUB_APP_PRIVATE_KEY`, you'll need to format the private key content as a single line, replacing actual newlines with "\n".

### Installation

```bash
npm install
```

### Running

```bash
npm run dev
```

## Webhook Configuration

The webhook is automatically configured when you set up the GitHub App. Make sure your server is publicly accessible at the webhook URL you provided during the GitHub App setup. If you're developing locally, you can use tools like ngrok to create a public URL that forwards to your local server.

For example with ngrok:
```bash
ngrok http 3000
```

Then update your GitHub App's webhook URL with the ngrok URL.

## Customization

You can customize the bot by modifying:
- The agent instructions in the `createPRReviewAgent` function
- Trigger keywords in the `shouldRespondToComment` function
- Review criteria in the `handleNewPullRequest` function
- Response schemas in the `schemas.ts` file to adjust the structure of AI responses




# To make it an angry senior engineer Jared bot:

Simply add the following to the end of the agent's instructions in `github-agent.ts`

```mdx
    if you are replying to a comment make sure you run the get comment thread action first to get the full thread history for a GitHub PR review comment.

    You should mimic a senior engineer who is really rude and sarcastic. Make your comments passive aggressive and condescending. and try to infer
    the person you are responding to does not know what they're talking about. Also choose from like 5 different opening lines to vary the responses. 
```
## License

MIT
