#!/usr/bin/env node

const { execSync } = require("child_process");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function extractFilesChanged(lines) {
  const files = [];
  for (const line of lines) {
    if (line.startsWith("diff --git")) {
      const match = line.match(/diff --git a\/(.*) b\//);
      if (match) files.push(match[1]);
    }
  }
  return files;
}

function detectChangeType(lines) {
  const content = lines.join(" ").toLowerCase();
  if (content.includes("fix") || content.includes("bug")) return "fix";
  if (content.includes("add") || content.includes("new")) return "feat";
  if (content.includes("refactor")) return "refactor";
  if (content.includes("test")) return "test";
  if (content.includes("doc")) return "docs";
  return "chore";
}

function generateSubject(files, type) {
  const fileNames = files.map(f => f.split("/").pop() || f).slice(0, 3);
  const fileStr = fileNames.join(", ");
  
  switch (type) {
    case "feat": return `add new features to ${fileStr}`;
    case "fix": return `fix issues in ${fileStr}`;
    case "refactor": return `refactor ${fileStr}`;
    case "docs": return `update documentation for ${fileStr}`;
    default: return `update ${fileStr}`;
  }
}

async function main() {
  try {
    const diff = execSync("git diff --cached", { encoding: "utf-8" });
    
    if (!diff.trim()) {
      console.log("No staged changes. Run git add first.");
      process.exit(1);
    }

    console.log("Analyzing changes...");
    
    const lines = diff.split("\n");
    const files = extractFilesChanged(lines);
    const type = detectChangeType(lines);
    const subject = generateSubject(files, type);
    const message = `${type}: ${subject}`;
    
    console.log("\\nSuggested commit message:");
    console.log(message);
    
    rl.question("\\nUse this message? (y/n) ", (answer) => {
      if (answer.toLowerCase() === "y") {
        execSync(`git commit -m "${message}"`, { stdio: "inherit" });
        console.log("Committed successfully!");
      } else {
        console.log("Commit cancelled.");
      }
      rl.close();
    });
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
