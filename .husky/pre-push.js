const { execSync } = require('child_process');

console.log('Running pre-push checks...');

// Run E2E tests
try {
  console.log('Running E2E tests...');
  execSync('npm run test:e2e', { stdio: 'inherit' });
  console.log('E2E tests passed.');
} catch (error) {
  console.error('');
  console.error('E2E tests failed. Aborting push.');
  process.exit(1);
}

console.log('Pre-push checks passed.');