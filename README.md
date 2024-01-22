# testing-farm-as-github-action

[![codecov][codecov-status]][codecov]

[codecov]: https://codecov.io/github/sclorg/testing-farm-as-github-action
[codecov-status]: https://codecov.io/github/sclorg/testing-farm-as-github-action/graph/badge.svg

Testing Farm as GitHub Action is a GitHub Action for executing tests on the [Testing Farm Service](https://docs.testing-farm.io).

The tests to run are to be described with a [`tmt` plan](https://tmt.readthedocs.io/en/latest/spec.html) by the user of this GitHub Action.
Pull Request status is automatically updated after the tests are executed,
if this option is enabled with the `update_pull_request_status` user-defined input variable.

API key to the Testing Farm MUST be stored in your organization's secrets to successfully access its infrastructure.
See [Testing Farm onboarding guide](https://docs.testing-farm.io/general/0.1/onboarding.html) for information how to onboard to Testing Farm.

## Compatibility Notes

> [!IMPORTANT]
>
> Currently only testing of copr builds is supported by the action.
> See [Testing Farm docs](https://docs.testing-farm.io) for more information on supported test artifacts which Testing > > Farm can install into the environment.

## Action Inputs

### Testing Farm

| Input Name | Description | Default value |
|------------|-------------|---------------|
| `api_key`  | Testing farm API key | empty, **required from user** |
| `api_url`  | Testing farm API server url | https://api.dev.testing-farm.io/v0.1 |
| `tf_scope` | Define the scope of Testing Farm. Possible options are 'public' or 'private' | public |

### Tmt Metadata

| Input Name | Description | Default value |
|------------|-------------|---------------|
| `git_url` | An url to the repository with tmt metadata | empty, **required from user** |
| `git_ref` | A tmt tests branch which will be used for tests | master |
| `tmt_plan_regex` | A regular expression used to select tmt plans | all |
| `tmt_context` | A mapping of tmt context variable [tmt-context](https://tmt.readthedocs.io/en/latest/spec/context.html), variables separated by ; | empty |

### Test Environment

| Input Name | Description | Default value |
|------------|-------------|---------------|
| `compose` | Compose to run tests on. [Available composes.](https://api.dev.testing-farm.io/v0.1/composes) | Fedora-latest |
| `arch` | Define an architecture for testing environment | x86_64 |
| `variables` | Environment variables for test env, separated by ; | empty |
| `secrets` | Environment secrets for test env, separated by ; | empty |

### Test Artifacts

| Input Name | Description | Default value |
|------------|-------------|---------------|
| `copr` | Copr name to use for the artifacts | epel-7-x86_64 |
| `copr_artifacts` | `fedora-copr-build` artifacts for testing environment, separated by ; | empty |

### Miscellaneous

| Input Name | Description | Default value |
|------------|-------------|---------------|
| `github_token` | GitHub token passed from secrets | `${{ github.token }}` |
| `create_issue_comment` | If GitHub action will create a github issue comment | false |
| `pull_request_status_name` | GitHub pull request status name | Fedora |
| `debug` | Print debug logs when working with testing farm | true |
| `update_pull_request_status` | Action will update pull request status. Default: true | true |
| `environment_settings` | Pass custom settings to the test environment. Default: {} | empty |
| `pr_head_sha` | SHA of the latest commit in PR. Used for setting commit statuses. | $(git rev-parse HEAD) |
| `create_github_summary` | Create summary of the Testing Farm as GiHub Action job. Possible options: "false", "true", "key=value" | true |
| `timeout` | Timeout for the Testing Farm job in minutes. | 480 |

> [!TIP]
>
> Testing Farm as GitHub Action requires a GitHub token with the following permissions:
>
> ```yaml
> permissions:
>   contents: read
>   # This is required for the ability to create Issue comment
>   pull-requests: write
>   # This is required for the ability to create/update the Pull request status
>   statuses: write
> ```

## Example

### Pull request example

The example below shows how the `sclorg/testing-farm-as-github-action` action can be used to schedule tests on Testing Farm.

```yaml
name: Schedule test on Testing Farm
on:
  issue_comment:
    types:
      - created

jobs:
  tests:
    runs-on: ubuntu-latest
    # Let's schedule tests only on user request. NOT automatically.
    # Only repository owner or member can schedule tests
    if: |
      github.event.issue.pull_request
      && contains(github.event.comment.body, '[test]')
      && contains(fromJson('["OWNER", "MEMBER"]'), github.event.comment.author_association)
    steps:
      - name: Schedule test on Testing Farm
        uses: sclorg/testing-farm-as-github-action@v1
        with:
          api_key: ${{ secrets.TF_API_KEY }}
          git_url: https://github.com/sclorg/sclorg-testing-farm
          tmt_plan_regex: "centos"
          pull_request_status_name: "CentOS 7"
```

and as soon as the job is finished you will see the test results in the pull request status:

✅ | ❌ Testing Farm - CentOS 7 - Build finished

### Run workflow at push to the main branch

The example below shows how the `sclorg/testing-farm-as-github-action` action can be used when pushing commits to `main` branch.

```yaml
name: Testing repository by Testing Farm when push to main branch
on:
  push:
    branches:
      - main

jobs:
  tests:
    runs-on: ubuntu-latest
    steps:
      - name: Schedule test on Testing Farm
        uses: sclorg/testing-farm-as-github-action@v1
        with:
          api_key: ${{ secrets.TF_API_KEY }}
          git_url: https://github.com/sclorg/sclorg-testing-farm
          tmt_plan_regex: "centos"
          update_pull_request_status: "false"
```
