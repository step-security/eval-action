[![StepSecurity Maintained Action](https://raw.githubusercontent.com/step-security/maintained-actions-assets/main/assets/maintained-action-banner.png)](https://docs.stepsecurity.io/actions/stepsecurity-maintained-actions)

# Braintrust eval action

This project enables you to run [Braintrust evals](https://www.braintrust.dev/) as part of
your CI/CD workflow in Github, using
[Github actions](https://github.com/features/actions). To use this action,
simply include the following step in an action file:

```yaml
- name: Run Evals
  uses: step-security/eval-action@v1
  with:
    api_key: ${{ secrets.BRAINTRUST_API_KEY }}
    runtime: node
```

You can configure the following variables:

- `api_key`: Your
  [Braintrust API key](https://www.braintrust.dev/docs/api-reference/index#api-reference).
- `root`: The root directory containing your evals (defaults to `'.'`). The root
  directory must either have `node` or `python` configured.
- `paths`: Specific paths, relative to the root, containing evals you'd like to
  run.
- `runtime`: Either `node` or `python`
- `package_manager`: Either `npm`, `pnpm`, or `yarn` for a `node` runtime, or
  `pip` or `uv` for a `python` runtime.
- `use_proxy`: Either `true` or `false`. If set, `OPENAI_BASE_URL` will be set
  to `https://braintrustproxy.com/v1`, which will automatically cache repetitive
  LLM calls and run your evals faster. Defaults to `true`.
- `terminate_on_failure`: Either `true` or `false`. If set to `true`, the
  evaluation process will stop when an error occurs. Defaults to `false`.

## Full example

```yaml
name: Run pnpm evals

on:
  push:
    # Uncomment to run only when files in the 'evals' directory change
    # - paths:
    #     - "evals/**"

permissions:
  pull-requests: write
  contents: read

jobs:
  eval:
    name: Run evals
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        id: checkout
        uses: actions/checkout@v7
        with:
          fetch-depth: 0

      - name: Setup Node.js
        id: setup-node
        uses: actions/setup-node@v6
        with:
          node-version: 20

      - uses: step-security/action-setup@v5
        with:
          version: 8

      - name: Install Dependencies
        id: install
        run: pnpm install

      - name: Run Evals
        uses: step-security/eval-action@v1
        with:
          api_key: ${{ secrets.BRAINTRUST_API_KEY }}
          runtime: node
          root: my_eval_dir
```

> [!IMPORTANT] You must specify `permissions` for the action to leave comments
> on your PR. Without these permissions, you'll see Github API errors.

To see examples of fully configured templates, see the `examples` directory:

- [`node with npm`](examples/node/npm.yml)
- [`node with pnpm`](examples/node/pnpm.yml)
- [`python with pip`](examples/python/pip.yml)
- [`python with uv`](examples/python/uv.yml)

## How it works

The action runs `braintrust eval` and collects experiment results, which are
posted as a comment in the PR alongside a link to Braintrust. For example:

### Example braintrust eval report

**Say Hi Bot (HEAD-1714341466)**

| Score       | Average     | Improvements | Regressions |
| ----------- | ----------- | -----------: | ----------: |
| Levenshtein | 0.83 (+3pp) |         8 🟢 |        4 🔴 |
| Duration    | 1s (0s)     |        16 🟢 |        1 🔴 |
