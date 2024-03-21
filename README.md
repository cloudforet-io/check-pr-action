# Check Pull Request Action

[![GitHub Super-Linter](https://github.com/actions/javascript-action/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/actions/javascript-action/actions/workflows/ci.yml/badge.svg)

## Usage

```
# .github/workflows/check-pull-request.yml
name: Check PR-BOT

on:
  pull_request_target:

jobs:
  check-pull-request:
    name: Check Pull Request
    runs-on: ubuntu-latest

    steps:
      - name: Check signed commits
        id: review
        uses: cloudforet-io/check-pr-action@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Notify Result
        if: ${{ steps.review.outputs.signedoff == 'false' }}
        run: |
          echo "The review result is ${{ steps.review.outputs.signedoff }}"
          exit 1
```

## Outputs

signedoff: 'true' or 'false'
