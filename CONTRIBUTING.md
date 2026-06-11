## Coding Style

This project uses prettier and ESLint to enforce a coding style.
Contributors should ensure they are following the formatting and
linting rules set up.

**Formatting**  
Formatting is specifically enforced by prettier and follows
these general rules.

- No trailing commas
- Double Quotes for strings
- Statements end with semicolon
- lines have a max width of 64 characters
- JSX/HTML closing brackets are on the same line as the final
  attribute if it spans multiple lines
- Markdown and documentation files should wrap to the configured
  line width

To run the formatter use the following commands on the file you
want to format

```bash
#rewrite a file to match formatting
npx prettier <file Path> --write

#check if a file matches formatting without rewriting
npx prettier <file Path> --check
```

Most IDEs also support Prettier plugins and can be configured to
automatically format files on save.

**Linting**  
ESLint is used on the front and backend of the project. For the
most part if follows the recommended rule set of JavaScript and
TypeScript. That allows for any mistakes to be caught
statically. As a result when linting it will follow these
general rules:

- No unused/undefined variables
- No duplicate declaration of variables
- No unreachable code

The frontend also includes additional React-specific linting
rules. These rules help ensure that React Hooks are used
correctly and that components remain compatible with Vite's Fast
Refresh functionality. Along with allowing unused variables if
they meet a specific condition. These rules follow as:

- Hooks should only be called at the top level of a React
  component or custom Hook
- Dependencies used inside something like `useEffect` should be
  included in their dependency arrays
- Variables prefixed with `_` or a capital letter can remain
  unused

To run linting use the following command on the file you want
from the `backend` or `frontend` of the project:

```bash
#packages/frontend or packages/backend

#running lint on a specific file
npx eslint <file path>

#if issue can be fixed automatically on a file  run this
npx eslint <file path>  --fix

#running lint on the current directory
npm run lint

```

**Naming Conventions**  
For the most part there are two variable naming conventions

- CamelCase for variables and functions
- PascalCase for React components

**Pushing Changes**  
Before opening a pull request or pushing changes, ensure you
have run the formatter and linter on all modified files.
