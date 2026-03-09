#!/usr/bin/env node

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class GitCommitAI {
  async generateCommitMessage(diff) {
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

  async run() {
    try {
      const diff = execSync('git diff --cached', { encoding: 'utf-8' });
      
      if (!diff.trim()) {
        console.log('⚠️  No staged changes found. Run "git add" first.');
        process.exit(1);
      }

      console.log('🤖 Analyzing changes...');
      
      const message = await this.generateCommitMessage(diff);
      const formattedMessage = this.formatCommitMessage(message);
      
      console.log('\n✨ Suggested commit message:');
      console.log(formattedMessage);
      
      rl.question('\nUse this commit message? (y/n) ', (answer) => {
        if (answer.toLowerCase() === 'y') {
          try {
            execSync(`git commit -m "${formattedMessage}"`, { stdio: 'inherit' });
            console.log('✅ Committed successfully!');
          } catch (error) {
            console.error('❌ Commit failed:', error.message);
          }
        } else {
          console.log('❌ Commit cancelled.');
        }
        rl.close();
      });
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  }
}

// Main
const args = process.argv.slice(2);
if (args[0] === 'commit' || args[0] === 'c') {
  const ai = new GitCommitAI();
  ai.run();
} else {
  console.log('🤖 git-commit-ai v1.0.0');
  console.log('Usage: git-commit-ai commit');
  console.log('   or: git-commit-ai c');
}
