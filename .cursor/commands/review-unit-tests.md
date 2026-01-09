# Review Unit Tests

## Overview
Performs a comprehensive code review on unit tests to identify missing test coverage, redundant tests, and quality issues. Acts as a senior software engineer reviewing the test suite for robustness.

## Usage
```
/review-unit-tests [path]
```

**Arguments:**
- `path` (optional): Directory or file path to review. Defaults to the attached folder/file.

## Steps

1. **Read all test files in scope**
   - Read each `.test.ts` or `.test.tsx` file in the specified directory
   - Identify the corresponding source files being tested

2. **Read source files**
   - Read the actual implementation files that the tests are covering
   - Identify all exported functions, classes, and constants

3. **Analyze test coverage gaps**
   - Check if all exported functions have corresponding tests
   - Identify untested code branches (if/else, switch cases, error paths)
   - Check for missing edge cases (null, undefined, empty arrays, boundary values)
   - Verify error handling paths are tested

4. **Identify redundant tests**
   - Find tests that cover the same code path with different inputs
   - Identify duplicate assertions across tests
   - Flag tests that don't add meaningful coverage

5. **Check test quality**
   - Verify tests follow AAA pattern (Arrange, Act, Assert)
   - Check for proper mock cleanup (beforeEach/afterEach)
   - Ensure descriptive test names
   - Verify assertions are meaningful (not just checking truthy/falsy)

6. **Check for files without tests**
   - List source files in scope that have no corresponding test file
   - Assess whether each file needs tests (skip type-only files, constants)

7. **Generate review report**
   - **Redundant Tests**: List tests that can be removed or consolidated
   - **Missing Tests**: List functions/branches without test coverage
   - **Quality Issues**: List test quality problems found
   - **Files Without Tests**: List source files needing test coverage

## Review Checklist

### Coverage Analysis
- [ ] All exported functions are tested
- [ ] All code branches are covered
- [ ] Error/exception paths are tested
- [ ] Edge cases are covered (null, empty, boundary values)
- [ ] Async error handling is tested

### Redundancy Check
- [ ] No duplicate tests for same code path
- [ ] Tests with parameterized data instead of copy-paste
- [ ] Single responsibility per test

### Quality Check
- [ ] Tests follow AAA pattern
- [ ] Mocks are properly set up and cleaned up
- [ ] Test names are descriptive and follow naming convention
- [ ] No hardcoded values that should be constants
- [ ] Console spies are properly restored

## Output Format

The review will produce a report with:

1. **Executive Summary** - Overall assessment of test suite health
2. **Redundant Tests** - Table of tests to remove with line numbers
3. **Missing Tests** - List of untested functionality with priority
4. **Quality Issues** - Specific problems with recommended fixes
5. **Files Without Tests** - Assessment of which files need tests
6. **Verdict** - Final recommendation

## Example Output

```markdown
# Test Suite Code Review: `tests/unit/lib`

## Executive Summary
Overall, the test suite is **well-structured** and provides good coverage.
However, I've identified **8 redundant tests** and **2 missing edge cases**.

## Redundant Tests

| File | Test Name | Reason |
|------|-----------|--------|
| media-utils.test.ts | "returns video for video/webm" | Same code path as video/mp4 test |

## Missing Tests

| File | Missing Coverage | Priority |
|------|-----------------|----------|
| utils.ts | Empty URL handling | Medium |

## Recommendations
1. Remove 8 redundant tests (~60 lines)
2. Add 2 edge case tests
3. Fix console spy cleanup in 1 file
```

## Implementation Notes
- When asked to implement changes, create a todo list first
- Run tests after making changes to verify nothing broke
- Check for linting errors after edits

## Related Files
- Test files: `tests/unit/**/*.test.ts`
- Source files: `lib/**/*.ts`, `convex/**/*.ts`, `app/**/*.ts`
- Testing guidelines: `.cursor/rules/testing.mdc`

