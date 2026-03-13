const github = require('@actions/github');
const core = require('@actions/core');

async function createIssues(token, issues, labelPrefix) {
  const octokit = github.getOctokit(token);
  const context = github.context;
  
  if (issues.length === 0) {
    core.info('No issues to create.');
    return;
  }

  core.info(`Found ${issues.length} issues to create.`);
  
  for (const issue of issues) {
    try {
      let labels = issue.labels || [];
      if (labelPrefix) {
        labels.push(labelPrefix);
      }
      
      await octokit.rest.issues.create({
        owner: context.repo.owner,
        repo: context.repo.repo,
        title: issue.title,
        body: issue.body,
        labels: Object.values(labels).filter(l => typeof l === 'string') // clean up any object structures mapping to labels
      });
      core.info(`Created issue: ${issue.title}`);
    } catch (error) {
      core.warning(`Failed to create issue "${issue.title}": ${error.message}`);
    }
  }
}

module.exports = {
  createIssues
};
