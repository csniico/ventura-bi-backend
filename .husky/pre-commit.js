const { execSync } = require('child_process');
const fs = require('fs');

console.log('Running pre-commit checks...');

try {
  // 1. Run lint-staged for Linting and Formatting
  console.log('Running lint-staged...');
  execSync('npx lint-staged', { stdio: 'inherit' });
} catch (error) {
  console.error('Linting/Formatting failed. Commit aborted.');
  process.exit(1);
}

// 2. Check Branch Naming Convention
try {
  const branchName = execSync('git symbolic-ref --short HEAD', {
    encoding: 'utf-8',
  }).trim();

  const validBranchPattern =
    /^(main|dev|feature\/|fix\/|hotfix\/|refactor\/|ci\/)/;

  if (!validBranchPattern.test(branchName)) {
    console.error('');
    console.error(
      `ERROR: Branch name '${branchName}' must start with 'feature/', 'fix/', or 'hotfix/'. (Skipping main/dev)`,
    );
    process.exit(1);
  }
} catch (error) {
  console.error('Failed to check branch name.');
  process.exit(1);
}

console.log('Pre-commit checks passed.');
