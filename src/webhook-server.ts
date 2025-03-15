import { Hono } from "hono";
import { serve } from "@hono/node-server";
import * as dotenv from "dotenv";
import {
  handleNewPullRequest,
  handleIssueComment,
  handleReviewComment,
} from "./pr-handlers";
import { getTokenForWebhook } from "./auth";
import { getPRReviewAgent } from "./github-agent";

// Load environment variables
dotenv.config();

/**
 * Start the webhook server
 */
export async function startServer() {
  // Create Hono app
  const app = new Hono();
  const port = process.env.PORT || 3000;

  // Health check endpoint
  app.get("/", (c) => c.text("GitHub PR Review Bot is running"));

  // Webhook endpoint for GitHub events
  app.post("/webhook", async (c) => {
    try {
      // Get the webhook payload and event type
      const payload = await c.req.json();
      const event = c.req.header("X-GitHub-Event");

      if (!event) {
        return c.json({ error: "Missing X-GitHub-Event header" }, 400);
      }

      console.log(`Received ${event} event`);

      // Get installation token for this webhook
      const installationId = payload.installation?.id;

      if (!installationId) {
        return c.json({ error: "Missing installation ID in webhook" }, 400);
      }

      const token = await getTokenForWebhook(installationId);
      const agent = await getPRReviewAgent();

      // Handle different event types
      switch (event) {
        case "pull_request":
          if (payload.action === "opened" || payload.action === "synchronize") {
            await handleNewPullRequest({ payload, agent, token });
          }
          break;

        case "issue_comment":
          if (
            payload.action === "created" &&
            !payload.comment?.body?.startsWith("🤖 ")
          ) {
            await handleIssueComment({ payload, agent, token });
          }
          break;

        case "pull_request_review_comment":
          if (
            payload.action === "created" &&
            !payload.comment?.body?.startsWith("🤖 ")
          ) {
            await handleReviewComment({ payload, agent, token });
          }
          break;
      }

      return c.json({ status: "success" });
    } catch (error) {
      console.error("Error processing webhook:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  });

  // Start the server
  serve(
    {
      fetch: app.fetch,
      port: Number(port),
    },
    (info) => {
      console.log(
        `PR Review Bot server running at http://localhost:${info.port}`
      );
    }
  );
}

// Start the server
if (require.main === module) {
  startServer().catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });
}
