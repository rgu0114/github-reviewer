import { createAction } from "spinai";
import { Octokit } from "@octokit/rest";
function validateParameters(params) {
    const errors = [];
    if (!params.prUrl || typeof params.prUrl !== "string") {
        errors.push("prUrl must be a string");
    }
    if (!params.comment || typeof params.comment !== "string") {
        errors.push("comment must be a string");
    }
    if (typeof params.inReplyTo !== "number") {
        errors.push("inReplyTo must be a number");
    }
    if (errors.length > 0) {
        console.log("Validation failed for parameters:", JSON.stringify(params, null, 2));
        throw new Error(`Invalid parameters:\n${errors.join("\n")}`);
    }
    return {
        prUrl: params.prUrl,
        comment: params.comment,
        inReplyTo: params.inReplyTo,
    };
}
export const replyToComment = createAction({
    id: "reply_to_comment",
    description: "Replies to an existing review comment on a GitHub Pull Request",
    parameters: {
        type: "object",
        properties: {
            prUrl: {
                type: "string",
                description: "Full URL of the GitHub PR (e.g., https://github.com/owner/repo/pull/number)",
            },
            comment: {
                type: "string",
                description: "The reply text",
            },
            inReplyTo: {
                type: "number",
                description: "ID of the comment to reply to",
            },
        },
        required: ["prUrl", "comment", "inReplyTo"],
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
            // Create the reply using the createReplyForReviewComment endpoint
            const { data } = await octokit.rest.pulls.createReplyForReviewComment({
                owner,
                repo,
                pull_number: parseInt(pullNumber),
                body: params.comment,
                comment_id: params.inReplyTo,
            });
            return {
                commentId: data.id,
                url: data.html_url,
            };
        }
        catch (error) {
            throw new Error(`Failed to create reply comment: ${error}`);
        }
    },
});
