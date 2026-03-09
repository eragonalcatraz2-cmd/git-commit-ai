#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class GitCommitAI {
  // 转义 shell 特殊字符
  escapeShellArg(arg) {
    // 使用单引号包裹，并将单引号替换为 '\''
    return "'" + arg.replace(/'/g, "'\"'\"'") + "'";
  }

  // 验证 commit message 不包含危险字符
  validateMessage(message) {
    // 检查是否包含危险的 shell 元字符
    const dangerousChars = /[;|&$`\n\r]/;
    if (dangerousChars.test(message)) {
      throw new Error('Commit message contains dangerous characters');
    }
    
    // 限制长度
    if (message.length > 500) {
      throw new Error('Commit message too long (max 500 chars)');
    }
    
    return true;
  }

  async generateCommitMessage(diff) {
    // 限制 diff 大小，防止内存问题
    const maxDiffSize = 100000; // 100KB
    if (diff.length > maxDiffSize) {
      console.log('⚠️  Diff too large, analyzing first 100KB only...');
      diff = diff.substring(0, maxDiffSize);
    }

    const lines = diff.split('\n');
    const filesChanged = this.extractFilesChanged(lines);
    const changeType = this.detectChangeType(lines);
    
    return {
      type: changeType,
      scope: this.extractScope(filesChanged),
      subject: this.generateSubject(filesChanged, changeType),
    };
  }

  extractFilesChanged(lines) {
    const files = [];
    for (const line of lines) {
      if (line.startsWith('diff --git')) {
        const match = line.match(/diff --git a\/(.*) b\//);
        if (match) files.push(match[1]);
      }
    }
    return files;
  }

  detectChangeType(lines) {
    const content = lines.join(' ').toLowerCase();
    
    if (content.includes('fix') || content.includes('bug')) return 'fix';
    if (content.includes('add') || content.includes('new')) return 'feat';
    if (content.includes('update') || content.includes('upgrade')) return 'chore';
    if (content.includes('refactor')) return 'refactor';
    if (content.includes('test')) return 'test';
    if (content.includes('doc')) return 'docs';
    
    return 'chore';
  }

  extractScope(files) {
    if (files.length === 0) return 'general';
    
    const dirs = files.map(f => f.split('/')[0]);
    const uniqueDirs = [...new Set(dirs)];
    
    if (uniqueDirs.length === 1) return uniqueDirs[0];
    return 'multiple';
  }

  generateSubject(files, type) {
    const fileNames = files.map(f => f.split('/').pop() || f).slice(0, 3);
    const fileStr = fileNames.join(', ');
    
    switch (type) {
      case 'feat':
        return `add new features to ${fileStr}`;
      case 'fix':
        return `fix issues in ${fileStr}`;
      case 'refactor':
        return `refactor ${fileStr}`;
      case 'docs':
        return `update documentation for ${fileStr}`;
      default:
        return `update ${fileStr}`;
    }
  }

  formatCommitMessage(message) {
    const scope = message.scope ? `(${message.scope})` : '';
    return `${message.type}${scope}: ${message.subject}`;
  }

  // 安全的 commit 方法，使用 spawn 代替 execSync
  async safeCommit(message) {
    return new Promise((resolve, reject) => {
      const git = spawn('git', ['commit', '-m', message], {
        stdio: 'inherit'
      });

      git.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Git commit exited with code ${code}`));
        }
      });

      git.on('error', (err) => {
        reject(err);
      });
    });
  }

  async run() {
    try {
      // 检查是否在 git 仓库中
      try {
        execSync('git rev-parse --git-dir', { stdio: 'pipe' });
      } catch (e) {
        console.error('❌ Not a git repository. Run "git init" first.');
        process.exit(1);
      }

      const diff = execSync('git diff --cached', { 
        encoding: 'utf-8',
        maxBuffer: 1024 * 1024 // 1MB buffer limit
      });
      
      if (!diff.trim()) {
        console.log('⚠️  No staged changes found. Run "git add" first.');
        process.exit(1);
      }

      // 显示 diff 摘要，提醒用户检查
      const diffLines = diff.split('\n').length;
      console.log(`📊 Found ${diffLines} lines of changes`);
      console.log('⚠️  Please review your changes before committing.\n');

      console.log('🤖 Analyzing changes...');
      
      const message = await this.generateCommitMessage(diff);
      const formattedMessage = this.formatCommitMessage(message);
      
      // 验证生成的消息
      this.validateMessage(formattedMessage);
      
      console.log('\n✨ Suggested commit message:');
      console.log(formattedMessage);
      
      rl.question('\nUse this commit message? (y/n/e for edit) ', async (answer) => {
        const lowerAnswer = answer.toLowerCase().trim();
        
        if (lowerAnswer === 'y' || lowerAnswer === 'yes') {
          try {
            await this.safeCommit(formattedMessage);
            console.log('✅ Committed successfully!');
          } catch (error) {
            console.error('❌ Commit failed:', error.message);
            process.exit(1);
          } finally {
            rl.close();
          }
        } else if (lowerAnswer === 'e' || lowerAnswer === 'edit') {
          rl.question('Enter your commit message: ', async (customMessage) => {
            try {
              this.validateMessage(customMessage);
              await this.safeCommit(customMessage);
              console.log('✅ Committed successfully!');
            } catch (error) {
              console.error('❌ Commit failed:', error.message);
              process.exit(1);
            } finally {
              rl.close();
            }
          });
        } else {
          console.log('❌ Commit cancelled.');
          rl.close();
        }
      });
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  }
}

// 验证命令行参数
const args = process.argv.slice(2);
const validCommands = ['commit', 'c', '--help', '-h', '--version', '-v'];

if (args.length === 0 || !validCommands.includes(args[0])) {
  console.log('🤖 git-commit-ai v1.0.0');
  console.log('AI-powered git commit message generator\n');
  console.log('Usage:');
  console.log('  git-commit-ai commit    Generate and commit with AI message');
  console.log('  git-commit-ai c         Short alias for commit');
  console.log('  git-commit-ai --help    Show this help');
  console.log('  git-commit-ai --version Show version\n');
  console.log('Safety features:');
  console.log('  • Shell injection protection');
  console.log('  • Commit message validation');
  console.log('  • Diff size limits');
  console.log('  • Interactive confirmation');
  process.exit(0);
}

if (args[0] === '--version' || args[0] === '-v') {
  console.log('v1.0.0');
  process.exit(0);
}

if (args[0] === 'commit' || args[0] === 'c') {
  const ai = new GitCommitAI();
  ai.run();
}
