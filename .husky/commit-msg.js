const fs = require('fs');

console.log('Running commit-msg checks...');

try {
  // Read the message from the file path passed by Git (usually .git/COMMIT_EDITMSG)
  // The first argument to the hook is the file path
  const messageFile = process.argv[2] || '.git/COMMIT_EDITMSG';
  const commitMsg = fs.readFileSync(messageFile, 'utf-8');
  const firstLine = commitMsg.split('\n')[0];

  const conventionalCommitPattern =
    /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?:/;

  if (!conventionalCommitPattern.test(firstLine)) {
    console.error('');
    console.error(
      'ERROR: Commit message does not follow Conventional Commits format (e.g., feat(scope): message).',
    );
    process.exit(1);
  }
} catch (error) {
  console.error('Failed to check commit message.');
  process.exit(1);
}

console.log('Commit message valid.');
