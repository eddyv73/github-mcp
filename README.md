# GitHub MCP (Model Context Protocol)

A comprehensive MCP tool for GitHub operations including repository management, pull requests, issues, workflows, and more.

## 📋 Features

- **Repository Management**: Create, clone, fork, delete repositories
- **Pull Requests**: Create, review, merge, and manage PRs
- **Issues**: Create, update, label, and track issues
- **GitHub Actions**: Trigger and monitor workflows
- **Releases**: Create and manage releases with assets
- **Gists**: Create and manage code snippets
- **API Access**: Direct GitHub API calls for advanced operations

## 🚀 Installation

```bash
# Clone this repository
git clone https://github.com/[your-username]/github-mcp.git
cd github-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

## 🔧 Configuration

### Authentication
The GitHub MCP requires authentication via personal access token:

```bash
# Option 1: Environment variable
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxx"

# Option 2: Use gh CLI authentication
gh auth login
```

### Required Permissions
Your GitHub token needs these scopes:
- `repo` - Full control of private repositories
- `workflow` - Update GitHub Action workflows
- `write:packages` - Upload packages to GitHub Package Registry
- `delete_repo` - Delete repositories (optional)
- `gist` - Create gists

## 📚 Available Functions

### Repository Operations

#### `gh_repo`
Manage GitHub repositories.

```javascript
// List repositories
gh_repo({ action: "list" })

// Create a new repository
gh_repo({ 
  action: "create", 
  name: "my-awesome-project",
  description: "A fantastic new project",
  public: true 
})

// Clone a repository
gh_repo({ 
  action: "clone", 
  name: "owner/repo",
  path: "./local-path" 
})

// Fork a repository
gh_repo({ 
  action: "fork", 
  name: "original-owner/repo" 
})

// Delete a repository (use with caution!)
gh_repo({ 
  action: "delete", 
  name: "owner/repo" 
})
```

### Pull Request Operations

#### `gh_pr`
Manage pull requests.

```javascript
// List PRs
gh_pr({ 
  action: "list", 
  repo: "owner/repo",
  state: "open" // "open", "closed", "all"
})

// Create a PR
gh_pr({ 
  action: "create",
  repo: "owner/repo",
  title: "Add awesome feature",
  body: "This PR adds...",
  base: "main",
  head: "feature-branch",
  draft: false
})

// Review a PR
gh_pr({ 
  action: "view",
  repo: "owner/repo",
  number: 123
})

// Merge a PR
gh_pr({ 
  action: "merge",
  repo: "owner/repo",
  number: 123
})
```

### Issue Operations

#### `gh_issue`
Manage GitHub issues.

```javascript
// Create an issue
gh_issue({ 
  action: "create",
  repo: "owner/repo",
  title: "Bug: Something is broken",
  body: "Description of the issue...",
  labels: ["bug", "high-priority"],
  assignees: ["username"]
})

// List issues
gh_issue({ 
  action: "list",
  repo: "owner/repo",
  state: "open",
  labels: ["bug"]
})

// Close an issue
gh_issue({ 
  action: "close",
  repo: "owner/repo",
  number: 42
})

// Add a comment
gh_issue({ 
  action: "comment",
  repo: "owner/repo",
  number: 42,
  body: "Thanks for reporting! We're looking into it."
})
```

### GitHub Actions

#### `gh_workflow`
Manage GitHub Actions workflows.

```javascript
// List workflows
gh_workflow({ 
  action: "list",
  repo: "owner/repo"
})

// Trigger a workflow
gh_workflow({ 
  action: "run",
  repo: "owner/repo",
  workflow: "ci.yml",
  ref: "main",
  inputs: {
    environment: "production",
    version: "1.2.3"
  }
})

// View workflow runs
gh_workflow({ 
  action: "view",
  repo: "owner/repo",
  workflow: "ci.yml"
})
```

### Release Management

#### `gh_release`
Create and manage releases.

```javascript
// Create a release
gh_release({ 
  action: "create",
  repo: "owner/repo",
  tag: "v1.0.0",
  title: "Version 1.0.0",
  notes: "## What's New\n- Feature 1\n- Feature 2",
  draft: false,
  prerelease: false,
  files: ["./dist/app.zip", "./dist/app.tar.gz"]
})

// List releases
gh_release({ 
  action: "list",
  repo: "owner/repo"
})
```

### Gist Operations

#### `gh_gist`
Manage GitHub gists.

```javascript
// Create a gist
gh_gist({ 
  action: "create",
  description: "Useful bash scripts",
  public: true,
  files: {
    "setup.sh": "#!/bin/bash\necho 'Setting up...'",
    "deploy.sh": "#!/bin/bash\necho 'Deploying...'"
  }
})

// List your gists
gh_gist({ action: "list" })
```

### Direct API Access

#### `gh_api`
Make custom GitHub API requests.

```javascript
// Get user information
gh_api({ 
  endpoint: "/user",
  method: "GET"
})

// Update repository settings
gh_api({ 
  endpoint: "/repos/owner/repo",
  method: "PATCH",
  data: {
    has_issues: true,
    has_wiki: false
  }
})

// Get repository contributors
gh_api({ 
  endpoint: "/repos/owner/repo/contributors",
  method: "GET",
  paginate: true
})
```

## 🎯 Common Use Cases

### 1. Automated Release Process
```javascript
// Create a release with changelog
const changelog = await generateChangelog();
await gh_release({ 
  action: "create",
  repo: "myorg/myapp",
  tag: "v2.0.0",
  title: "Release v2.0.0",
  notes: changelog,
  files: ["./build/myapp-v2.0.0.zip"]
});
```

### 2. Bulk Issue Management
```javascript
// Close all issues with "wontfix" label
const issues = await gh_issue({ 
  action: "list",
  repo: "owner/repo",
  state: "open",
  labels: ["wontfix"]
});

for (const issue of issues) {
  await gh_issue({ 
    action: "close",
    repo: "owner/repo",
    number: issue.number
  });
}
```

### 3. PR Automation
```javascript
// Auto-merge dependabot PRs
const prs = await gh_pr({ 
  action: "list",
  repo: "owner/repo",
  state: "open"
});

const dependabotPRs = prs.filter(pr => pr.user.login === 'dependabot[bot]');
for (const pr of dependabotPRs) {
  await gh_pr({ 
    action: "merge",
    repo: "owner/repo",
    number: pr.number
  });
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Authentication Failed**
   ```bash
   # Check your token
   echo $GITHUB_TOKEN
   
   # Verify gh CLI auth
   gh auth status
   ```

2. **Permission Denied**
   - Ensure your token has the required scopes
   - Check repository permissions

3. **Rate Limiting**
   - GitHub API has rate limits (5000 requests/hour for authenticated requests)
   - Use pagination for large datasets

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Write tests for new functionality
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Resources

- [GitHub API Documentation](https://docs.github.com/en/rest)
- [GitHub CLI Manual](https://cli.github.com/manual/)
- [Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
