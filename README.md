# testing-farm-as-github-action

Testing Farm as GitHub Action is a GitHub Action for executing tests on the Testing Farm infrastructure.

The tests to run are to be described with a [`fmf` plan](https://tmt.readthedocs.io/en/latest/spec.html) by the user of this GitHub Action.
Pull Request status is automatically updated after the tests are executed,
if this option is enabled with the `update_pull_request_status` user-defined input variable.


Before calling this GitHub Action, you must first clone your project,
e.g., with the [Checkout V2](https://github.com/actions/checkout) GitHub Action.

The Action uses ubuntu-20.04 and it is a [composite](https://docs.github.com/en/actions/creating-actions/about-custom-actions).
It internally downloads needed binaries `curl` and `jq` for communicating with the Testing Farms API and parsing the responses.
 
API key to the Testing Farm should be stored in your organization's secrets to successfully access its infrastructure.

## Action Inputs

|   Input Name                | Description                                            | Default value                 |
|-----------------------------|--------------------------------------------------------|-------------------------------|
| `api_key`                   | A testing farm API key.                                | empty, **required from user** |
| `tmt_repository`            | An url to tmt repository                               | empty, **required from user** |
| `test_fmf_plan`             | A fmf plan which will be selected from tmt repository. | all                           |
| `tests_tmt_ref`             | A tmt tests branch which will be used for tests        | master                        |
| `compose`                   | Compose to run tests on. [Available composes.](https://api.dev.testing-farm.io/v0.1/composes)| Fedora |
| `create_issue_comment`      | If GitHub action will create a github issue comment.   | false                         |
| `pull_request_status_name`  | GitHub pull request status name                        | Fedora                        |
| `env_vars`                  | Environment variables for test env, separated by ;     | empty                         |
| `env_secrets`               | Environment secrets for test env, separated by ;       | empty                         |
| `debug`                     | Print debug logs when working with testing farm        | true                          |
| `update_pull_request_status`| Action will update pull request status. Default: true  | true                          |

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

and as soon as the job is finished you will see the test results in the pull request status:

✅ | ❌ Testing Farm - CentOS 7 - Build finished
