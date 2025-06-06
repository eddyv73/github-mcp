import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { Octokit } from '@octokit/rest';
import { z } from 'zod';

const GitHubActionSchema = z.object({
  action: z.enum(['list', 'create', 'clone', 'view', 'delete', 'fork']),
  name: z.string().optional(),
  description: z.string().optional(),
  public: z.boolean().optional(),
  clone: z.boolean().optional(),
  path: z.string().optional(),
  org: z.string().optional(),
});

class GitHubMCPServer {
  private server: Server;
  private octokit: Octokit;

  constructor() {
    this.server = new Server(
      {
        name: 'github-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize GitHub client
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('GITHUB_TOKEN environment variable is required');
    }
    
    this.octokit = new Octokit({
      auth: token,
    });

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'gh_repo',
          description: 'Manage GitHub repositories',
          inputSchema: {
            type: 'object',
            properties: {
              action: {
                type: 'string',
                enum: ['list', 'create', 'clone', 'view', 'delete', 'fork'],
                description: 'Repository action',
              },
              name: {
                type: 'string',
                description: 'Repository name (owner/repo or just repo)',
              },
              description: {
                type: 'string',
                description: 'Repository description',
              },
              public: {
                type: 'boolean',
                description: 'Make repository public',
                default: true,
              },
              org: {
                type: 'string',
                description: 'Organization name',
              },
              path: {
                type: 'string',
                description: 'Local path for clone',
              },
            },
            required: ['action'],
          },
        },
        {
          name: 'gh_pr',
          description: 'Manage pull requests',
          inputSchema: {
            type: 'object',
            properties: {
              action: {
                type: 'string',
                enum: ['list', 'create', 'view', 'merge', 'close', 'review', 'checkout'],
                description: 'PR action',
              },
              repo: {
                type: 'string',
                description: 'Repository (owner/repo)',
              },
              number: {
                type: 'number',
                description: 'PR number',
              },
              title: {
                type: 'string',
                description: 'PR title',
              },
              body: {
                type: 'string',
                description: 'PR body',
              },
              base: {
                type: 'string',
                description: 'Base branch',
              },
              head: {
                type: 'string',
                description: 'Head branch',
              },
              state: {
                type: 'string',
                enum: ['open', 'closed', 'all'],
                default: 'open',
              },
              draft: {
                type: 'boolean',
                default: false,
              },
            },
            required: ['action'],
          },
        },
        {
          name: 'gh_issue',
          description: 'Manage GitHub issues',
          inputSchema: {
            type: 'object',
            properties: {
              action: {
                type: 'string',
                enum: ['list', 'create', 'view', 'close', 'reopen', 'comment'],
                description: 'Issue action',
              },
              repo: {
                type: 'string',
                description: 'Repository (owner/repo)',
              },
              number: {
                type: 'number',
                description: 'Issue number',
              },
              title: {
                type: 'string',
                description: 'Issue title',
              },
              body: {
                type: 'string',
                description: 'Issue body',
              },
              labels: {
                type: 'array',
                items: { type: 'string' },
                description: 'Issue labels',
              },
              assignees: {
                type: 'array',
                items: { type: 'string' },
                description: 'Assignees',
              },
              state: {
                type: 'string',
                enum: ['open', 'closed', 'all'],
                default: 'open',
              },
            },
            required: ['action'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'gh_repo':
            return await this.handleRepoAction(args);
          case 'gh_pr':
            return await this.handlePRAction(args);
          case 'gh_issue':
            return await this.handleIssueAction(args);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) throw error;
        throw new McpError(
          ErrorCode.InternalError,
          `GitHub API error: ${error.message}`
        );
      }
    });
  }

  private async handleRepoAction(args: any) {
    const params = GitHubActionSchema.parse(args);
    
    switch (params.action) {
      case 'list': {
        const { data } = await this.octokit.repos.listForAuthenticatedUser({
          sort: 'updated',
          per_page: 100,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data.map(repo => ({
                name: repo.full_name,
                description: repo.description,
                private: repo.private,
                url: repo.html_url,
                language: repo.language,
                stars: repo.stargazers_count,
                updated: repo.updated_at,
              })), null, 2),
            },
          ],
        };
      }

      case 'create': {
        if (!params.name) {
          throw new McpError(ErrorCode.InvalidParams, 'Repository name is required');
        }
        
        const { data } = await this.octokit.repos.createForAuthenticatedUser({
          name: params.name,
          description: params.description,
          private: !params.public,
          auto_init: true,
        });
        
        return {
          content: [
            {
              type: 'text',
              text: `Repository created: ${data.html_url}`,
            },
          ],
        };
      }

      case 'view': {
        if (!params.name) {
          throw new McpError(ErrorCode.InvalidParams, 'Repository name is required');
        }
        
        const [owner, repo] = params.name.includes('/') 
          ? params.name.split('/')
          : [(await this.octokit.users.getAuthenticated()).data.login, params.name];
        
        const { data } = await this.octokit.repos.get({ owner, repo });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                name: data.full_name,
                description: data.description,
                private: data.private,
                url: data.html_url,
                language: data.language,
                stars: data.stargazers_count,
                forks: data.forks_count,
                issues: data.open_issues_count,
                created: data.created_at,
                updated: data.updated_at,
                topics: data.topics,
                default_branch: data.default_branch,
              }, null, 2),
            },
          ],
        };
      }

      default:
        throw new McpError(
          ErrorCode.InvalidParams,
          `Unsupported action: ${params.action}`
        );
    }
  }

  private async handlePRAction(args: any) {
    // Implementation for PR actions
    return {
      content: [
        {
          type: 'text',
          text: 'PR action handler not fully implemented yet',
        },
      ],
    };
  }

  private async handleIssueAction(args: any) {
    // Implementation for issue actions
    return {
      content: [
        {
          type: 'text',
          text: 'Issue action handler not fully implemented yet',
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('GitHub MCP server running on stdio');
  }
}

const server = new GitHubMCPServer();
server.run().catch(console.error);
