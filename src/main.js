'use strict'

const github = require('@actions/github')
const core = require('@actions/core')

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
  try {
    const myToken = core.getInput('token')
    const octokit = github.getOctokit(myToken)
    const context = github.context
    const isPullRequest = context.payload.pull_request
    if (!isPullRequest)
      throw new Error(
        'This actions only runs against pull request events. Try modifying your workflow trigger.'
      )

    const pr = await octokit.rest.pulls.get({
      ...context.repo,
      pull_number: context.issue.number
    })
    const commits = await octokit.rest.pulls.listCommits({
      ...context.repo,
      pull_number: context.issue.number
    })

    const footer =
      "#### ✅ Why it is required\nThe Developer Certificate of Origin (DCO) is a lightweight way for contributors to certify that they wrote or otherwise have the right to submit the code they are contributing to the project. Here is the full [text of the DCO](https://developercertificate.org/).\n\nContributors _sign-off_ that they adhere to these requirements by adding a `Signed-off-by` line to commit messages.\n\n```\nThis is my commit message\n\nSigned-off-by: Random Developer <randomdeveloper@example.com>\n```\n\nGit even has a `-s` command line option to append this automatically to your commit message:\n\n```\n$ git commit -s -m 'This is my commit message'\n```"
    const commitLines = commits.data
      .filter(item => !/Signed-off-by: (.*) <(.*)>/i.test(item.commit.message))
      .map(item => item.sha)
    const header =
      '⚠️  @' +
      pr.data.user.login +
      ' the `signed-off-by` was not found in the following **' +
      commitLines.length +
      '** commits:'
    core.warning(`Found: ${commits.data.length} total commits`)
    commits.data.forEach(item =>
      core.info(
        `\u001B[1;36m ${item.sha.slice(0, 6)}\u001B[21;39m: \u001B[90m${item.commit.message.split('\n', 1)[0]}`
      )
    )
    if (commitLines.length > 0) {
      await octokit.rest.issues.createComment({
        ...context.repo,
        issue_number: context.issue.number,
        body:
          header +
          '\n\n' +
          commits.data
            .filter(item => commitLines.includes(item.sha))
            .map(
              item =>
                `- ${item.html_url}: ${item.commit.message.split('\n', 1)[0]}`
            )
            .join('\n') +
          '\n\n' +
          footer
      })
      core.info('\n')
      core.error(`Found: ${commitLines.length} commits without a valid signoff`)
      commits.data
        .filter(item => commitLines.includes(item.sha))
        .forEach(item =>
          core.info(
            `\u001B[1;35m ${item.sha.slice(0, 6)}\u001B[21;39m: \u001B[90m${item.commit.message.split('\n', 1)[0]}`
          )
        )

      await octokit.rest.issues.addLabels({
        ...context.repo,
        issue_number: context.issue.number,
        labels: ['fail/signedoff']
      })
      core.setOutput('signedoff', false)
      return false
    } else {
      core.info('All commits have a valid signed-off-by')
      await octokit.rest.issues.addLabels({
        ...context.repo,
        issue_number: context.issue.number,
        labels: ['pass/signedoff']
      })
      core.setOutput('signedoff', true)
      return true
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}
