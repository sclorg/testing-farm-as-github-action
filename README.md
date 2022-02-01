# testing-farm-as-github-action

Testing Farm as GitHub Action is a GitHub Action to execute tests by Testing Farm and update Pull Request status.

This action runs on [composite](https://docs.github.com/en/actions/creating-actions/creating-a-composite-action).
Before a calling this GitHub Action, you must first clone your project by e.g. 
by GitHub Action [Checkout V2](https://github.com/actions/checkout).

The Action uses ubuntu-20.04.

Important binaries, like curl, jq, which are used for getting scheduled jobs from Testing Farm are already installed
by this GitHub Action.
 
In your organization secrets you should have stored API key to testing farm.

## Action Inputs

| Input Name      | Description                                            | Default                           |
|-----------------|--------------------------------------------------------|-----------------------------------|
| api_key         | A testing farm API key.                                | **Must be provided**              |
| tmt_repository | An url to tmt repository                               | **Must be provided**              |
| test_fmf_plan | A fmf plan which will be selected from tmt repository. | All plans are executed by default |
| tests_tmt_ref | A tmt tests branch which will be used for tests        | master                            |
|  compose | compose for tests                                      | Fedora                            |
|  create_issue_comment| If Github action will create a github issue comment.   | false                             |
|  pull_request_status_name | GitHub pull request status name                        | Fedora |
| env_vars | Environment variables for test env, separated by ;     |                                   |
|  env_secrets | Environment secrets for test env, separated by ;       |                                   |
|debug | Print debug logs when working with testing farm        | true                              |
|  update_pull_request_status| Action will update pull request status. Default: true  | true                              |

## Example

The example below shows how the `testing-farm-as-github-action` action can be used to schedule tests on Testing Farm.

```yaml
name: Schedule test on Testing Farm
on:
  issue_comment:
    types:
      - created

jobs:
  tests:
    runs-on: ubuntu-20.04
    # Let's schedule tests only on user request. NOT automatically.
    # Only repository owner or member can schedule tests
    if: |
      github.event.issue.pull_request
      && contains(github.event.comment.body, '[test]')
      && contains(fromJson('["OWNER", "MEMBER"]'), github.event.comment.author_association)
    steps:
      - name: Get pull request number
        id: pr_nr
        run: |
          PR_URL="${{ github.event.comment.issue_url }}"
          echo "::set-output name=PR_NR::${PR_URL##*/}"
          
      - name: Checkout repo and switch to corresponding pull request
        uses: actions/checkout@v2
        with:
          ref: "refs/pull/${{ steps.pr_nr.outputs.PR_NR }}/head"
          
      - name: Schedule test on Testing Farm 
        uses: actions/schedule-tests-on-testing-farm@v1
        with:
          api_key: ${{ secrets.TF_API_KEY }}
          tmt_repository: https://github.com/sclorg/sclorg-testing-farm
          test_fmf_plan: "centos"
          pull_request_status_name: "CentOS 7"
```

and as soon as the job is finished, then you will see in pull request status with proper state like:

✅ | ❌ Testing Farm - CentOS 7 - Build finished
