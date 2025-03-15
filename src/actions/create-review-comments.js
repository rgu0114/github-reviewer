import { createAction } from "spinai";
import { Octokit } from "@octokit/rest";
function isReviewComment(obj) {
    if (!obj || typeof obj !== "object") {
        console.log("Not an object:", obj);
        return false;
    }
    const comment = obj;
    // Required fields
    if (typeof comment.line !== "number") {
        console.log("line is not a number:", comment.line);
        return false;
    }
    if (typeof comment.position !== "number") {
        console.log("position is not a number:", comment.position);
        return false;
    }
    if (typeof comment.comment !== "string") {
        console.log("comment is not a string:", comment.comment);
        return false;
    }
    return true;
}
function validateParameters(params) {
    const errors = [];
    if (!params.prUrl || typeof params.prUrl !== "string") {
        errors.push("prUrl must be a string");
    }
    if (!params.filename || typeof params.filename !== "string") {
        errors.push("filename must be a string");
    }
    if (!Array.isArray(params.comments)) {
        errors.push("comments must be an array");
    }
    else {
        // Validate each comment
        params.comments.forEach((comment, index) => {
            if (!isReviewComment(comment)) {
                errors.push(`comment at index ${index} is invalid: ${JSON.stringify(comment)}`);
            }
        });
    }
    if (errors.length > 0) {
        console.log("Validation failed for parameters:", JSON.stringify(params, null, 2));
        throw new Error(`Invalid parameters:\n${errors.join("\n")}`);
    }
    return {
        prUrl: params.prUrl,
        filename: params.filename,
        comments: params.comments,
    };
}
export const createReviewComments = createAction({
    id: "create_review_comments",
    description: "Creates new review comments on a GitHub Pull Request",
    parameters: {
        type: "object",
        properties: {
            prUrl: {
                type: "string",
                description: "Full URL of the GitHub PR (e.g., https://github.com/owner/repo/pull/number)",
            },
            filename: {
                type: "string",
                description: "Name of the file to comment on",
            },
            comments: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        line: { type: "number" },
                        position: { type: "number" },
                        comment: { type: "string" },
                    },
                    required: ["line", "position", "comment"],
                },
                description: "Array of comments with line numbers and positions",
            },
        },
        required: ["prUrl", "filename", "comments"],
    },
    async run({ parameters, context }) {
        if (!parameters || typeof parameters !== "object") {
            throw new Error("Parameters are required");
        }
        const { state } = context || {};
        const { token } = state || {};
        const { prUrl, filename, comments } = validateParameters(parameters);
        // Parse PR URL to get owner, repo, and PR number
        const prUrlRegex = /github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/;
        const match = prUrl.match(prUrlRegex);
        if (!match) {
            throw new Error("Invalid GitHub PR URL format");
        }
        const [, owner, repo, pullNumber] = match;
        // Initialize Octokit
        const octokit = new Octokit({
            auth: token,
        });
        try {
            // Get the latest commit SHA from the PR
            const { data: pr } = await octokit.pulls.get({
                owner,
                repo,
                pull_number: parseInt(pullNumber),
            });
            const commitId = pr.head.sha;
            // Create new comments as a review
            await octokit.pulls.createReview({
                owner,
                repo,
                pull_number: parseInt(pullNumber),
                commit_id: commitId,
                event: "COMMENT",
                comments: comments.map((comment) => ({
                    path: filename,
                    position: comment.position,
                    body: comment.comment,
                })),
            });
            return {
                newComments: comments.length,
            };
        }
        catch (error) {
            throw new Error(`Failed to create review comments: ${error}`);
        }
    },
});
