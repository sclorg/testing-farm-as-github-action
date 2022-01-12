# About
GitHub Action to execute tests by Testing Farm and update Pull Request status.

The Action uses ubuntu-20.04

## Prerequisities

Before scheduling tests on Testing Farm, developer is responsible for checkouting repo, eg. by actions/checkout@v2.
In your organization secrets you should have stored API key to testing farm.

Important binaries, like curl, jq, which are used for getting scheduled jobs from Testing Farm are already installed
by this GitHub Action.