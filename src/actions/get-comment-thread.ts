import { createAction } from "spinai";
import { Octokit } from "@octokit/rest";

interface GetThreadParams {
  prUrl: string;
  commentId: number;
}

function validateParameters(params: Record<string, unknown>): GetThreadParams {
  const errors = [];

  if (!params.prUrl || typeof params.prUrl !== "string") {
    errors.push("prUrl must be a string");
  }

  if (typeof params.commentId !== "number") {
    errors.push("commentId must be a number");
  }

  if (errors.length > 0) {
    console.log(
      "Validation failed for parameters:",
      JSON.stringify(params, null, 2)
    );
    throw new Error(`Invalid parameters:\n${errors.join("\n")}`);
  }

  return {
    prUrl: params.prUrl as string,
    commentId: params.commentId as number,
  };
}

export const getCommentThread = createAction({
  id: "get_comment_thread",
  description: "Gets the full thread history for a GitHub PR review comment",
  parameters: {
    type: "object",
    properties: {
      prUrl: {
        type: "string",
        description:
          "Full URL of the GitHub PR (e.g., https://github.com/owner/repo/pull/number)",
      },
      commentId: {
        type: "number",
        description: "ID of the comment to get the thread for",
      },
    },
    required: ["prUrl", "commentId"],
  },
  async run({ parameters, context }) {
    if (!parameters || typeof parameters !== "object") {
      throw new Error("Parameters are required");
    }
    const { state } = context || {};
    const { token } = state || {};
    const params = validateParameters(parameters);

    // Parse PR URL to get owner, repo, and PR number
    const prUrlRegex = /github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/;
    const match = params.prUrl.match(prUrlRegex);

    if (!match) {
      throw new Error("Invalid GitHub PR URL format");
    }

    const [, owner, repo, pullNumber] = match;

    // Initialize Octokit
    const octokit = new Octokit({
      auth: token,
    });

    try {
      // First get the comment we're looking for
      const { data: originalComment } =
        await octokit.rest.pulls.getReviewComment({
          owner,
          repo,
          comment_id: params.commentId,
        });

      // Get all review comments for the PR
      const { data: allComments } = await octokit.rest.pulls.listReviewComments(
        {
          owner,
          repo,
          pull_number: parseInt(pullNumber),
        }
      );

      // Find all comments in the same thread by matching on the original comment's path and position
      const thread = allComments
        .filter(
          (comment) =>
            comment.path === originalComment.path &&
            comment.position === originalComment.position
        )
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
        .map((comment) => ({
          id: comment.id,
          body: comment.body,
          user: {
            login: comment.user.login,
          },
          created_at: comment.created_at,
          path: comment.path,
          position: comment.position,
          diff_hunk: comment.diff_hunk,
        }));

      return {
        thread,
        context: {
          path: originalComment.path,
          position: originalComment.position,
          diff_hunk: originalComment.diff_hunk,
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch comment thread: ${error}`);
    }
  },
});
