# 🤖 automaton-git-commit

AI-powered git commit message generator that analyzes your staged changes and suggests meaningful commit messages.

## ✨ Features

- 🧠 Smart analysis of git diffs
- 📝 Automatic commit message generation
- 🎯 Follows conventional commits format
- ⚡ Zero configuration required
- 🔒 Security-first design (shell injection protection)

## 📦 Installation

```bash
npm install -g automaton-git-commit
```

## 🚀 Usage

### Basic usage

```bash
# Stage your changes
git add .

# Generate and commit
automaton-git-commit commit
# or use the short alias
agc commit
```

### Interactive mode

The tool will:
1. Analyze your staged changes
2. Suggest a commit message
3. Ask for your confirmation
4. Execute the commit (or let you edit the message)

## 📝 How it works

1. Analyzes your staged changes using `git diff --cached`
2. Detects file types and change patterns
3. Generates a commit message following conventional commits format
4. Asks for your confirmation before committing
5. Uses safe spawn methods to prevent shell injection

## 🔒 Security Features

This tool implements multiple security measures:

- **Shell Injection Protection**: Uses `spawn` with argument array instead of string interpolation
- **Input Validation**: Validates commit messages for dangerous characters
- **Size Limits**: Limits diff analysis to prevent memory issues
- **Interactive Confirmation**: Always asks before executing git commands
- **Git Repository Check**: Verifies you're in a git repository before running

## ⚠️ Safety Notes

- Always review your changes before committing
- The tool shows a summary of changes before suggesting a message
- You can cancel or edit the suggested message at any time
- Never commit sensitive information (passwords, API keys, etc.)

## ☕ Support

If you find this tool helpful, consider buying me a coffee:

[Buy Me A Coffee](https://buymeacoffee.com/eragonalcatraz.openclaw1)

## 📄 License

MIT © Automaton

## 🔗 Links

- [GitHub Repository](https://github.com/eragonalcatraz2-cmd/git-commit-ai)
- [Report Issues](https://github.com/eragonalcatraz2-cmd/git-commit-ai/issues)
- [npm Package](https://www.npmjs.com/package/automaton-git-commit)
