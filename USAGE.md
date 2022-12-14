# How to use Testing Farm as GitHub Action in your projects

Before start of using Testing Farm as GitHub Action in your projects,
there are several steps which you have to do it.

## Ask Testing Farm team for public or private ranch

Before any implementation as Testing Farm team for API_KEY here [onboarding](https://docs.testing-farm.io/general/0.1/onboarding.html).
Public ranch is used for testing your upstream repository on Fedora, CentOS 7, and CentOS Stream guests.

Private ranch is used for testing your upstream repository on RHEL and Oracle-linux guests.

## Setup TMT plan in GitHub / GitLab repos

In your GitHub or GitLab repos create:
* [.fmf](https://github.com/sclorg/sclorg-testing-farm/tree/main/.fmf) directory with file [version](https://github.com/sclorg/sclorg-testing-farm/blob/main/.fmf/version) which contains 1.
* [plans](https://github.com/sclorg/sclorg-testing-farm/tree/main/plans) directory which will contain TMT plans for Testing Farm.
* create a TMT plan like it is already done here [c9s](https://github.com/sclorg/sclorg-testing-farm/blob/main/plans/c9s.fmf).
* The TMT plan contains instructions how to setup, install and execute tests on quest provided by Testing Farm. For more information see [documentation](https://tmt.readthedocs.io/en/stable/examples.html#plans) or take an inspiration from our [plans](https://github.com/sclorg/sclorg-testing-farm/tree/main/plans) directory.

To create a TMT plan by `tmt` tool, run a command:
```bash
$ tmt init --template mini
```
How to validate your TMT plans locally? Run a command:
```bash
$ tmt plans lint
```

How to test your TMT plans locally? Run a command:
```bash
$ tmt run plan --name <your TMT plan name>
```
## Setup GitHub Action

As soon as you have your TMT plan ready then let's create an GitHub Actions for your use case

### Testing by GitHub Actions

Create a directory `.github/workflows` in your GitHub repository.

### Testing pull request changes via Testing Farm

Create a file like `testing-farm-pr.yml`
The file can look like as is mentioned in [README.md](https://github.com/sclorg/testing-farm-as-github-action#example)

### Testing or other actions performed at push to the main branch.
Create a file like `testing-farm-merge.yml`
The file can look like as is mentioned in [README.md](https://github.com/sclorg/testing-farm-as-github-action#example)
