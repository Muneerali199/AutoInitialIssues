process.env['INPUT_MODE'] = 'preset';
process.env['INPUT_PRESET'] = 'frontend-nextjs';
process.env['INPUT_GITHUB_TOKEN'] = 'fake_token';

// We mock the github toolkit context so it doesn't crash without a real repo
process.env['GITHUB_REPOSITORY'] = 'AOSSIE-Org/TestRepo';
process.env['GITHUB_WORKSPACE'] = __dirname;
// Mock fetch for our tests if needed
require('./dist/index.js');
