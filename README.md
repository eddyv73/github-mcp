# GitHub MCP

A Model Context Protocol server for GitHub operations. This MCP allows Claude to interact with GitHub repositories, pull requests, issues, and more.

## Features

- **Repository Management**
  - List repositories
  - Create new repositories
  - View repository details
  - Clone repositories
  - Fork repositories

- **Pull Request Operations**
  - List pull requests
  - Create new PRs
  - Review and merge PRs
  - Close PRs

- **Issue Management**
  - List issues
  - Create new issues
  - Comment on issues
  - Close/reopen issues

- **GitHub Actions**
  - List workflows
  - Trigger workflow runs
  - View workflow status

- **Release Management**
  - Create releases
  - Upload release assets
  - List releases

## Installation

```bash
# Clone the repository
git clone https://github.com/eddyv73/github-mcp.git
cd github-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

## Configuration

1. Set your GitHub token as an environment variable:
```bash
export GITHUB_TOKEN="your-github-personal-access-token"
```

2. Add to Claude Desktop configuration file (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "github": {
      "command": "node",
      "args": ["/path/to/github-mcp/dist/index.js"],
      "env": {
        "GITHUB_TOKEN": "your-github-personal-access-token"
      }
    }
  }
}
```

Replace `/path/to/github-mcp` with the actual path where you cloned this repository.

## Required GitHub Token Permissions

Your GitHub Personal Access Token needs these scopes:
- `repo` - Full control of private repositories
- `workflow` - Update GitHub Action workflows
- `write:packages` - Upload packages to GitHub Package Registry
- `gist` - Create gists

## Usage in Claude

Once configured, you can use commands like:

- "List my GitHub repositories"
- "Create a new repository called my-project"
- "Show me the open pull requests in eddyv73/github-mcp"
- "Create an issue in my repository"
- "List the latest releases"

## Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Start the server
npm start
```

## License

MIT
