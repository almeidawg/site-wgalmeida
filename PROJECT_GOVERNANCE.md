# Project Governance

## Objective

This document defines mandatory rules for analysis, changes, validation, quality control, and production readiness.

No action should be taken without fully understanding the project context, impact, and consequences.

## 1. Project Context

Before any action, it is mandatory to understand:

- What is the purpose of the project?
- What problem does it solve?
- Who uses it?
- What stage is it in?
- What has already been implemented?

## 2. Project Inventory

Always register and understand:

- Existing features
- System structure
- Frontend and backend architecture
- APIs and integrations
- Dependencies
- Core user flows
- Environment variables

## 3. Problem Identification

For each problem, document:

- Clear description
- Location, including file and line when possible
- Impact
- Frequency
- How it was identified

## 4. Risk Classification

Each issue must be classified as:

- Critical: production breakage or security issue
- High: major functional impact
- Medium: improvement or maintainability concern
- Low: cosmetic or minor refactor

## 5. Root Cause Analysis

For every relevant issue, determine:

- What is the origin?
- Is it logic, architecture, integration, missing validation, or human error?
- Could it have been prevented?
- Is there technical debt involved?

## 6. Solution Standard

Every solution must include:

- Clear description
- Step-by-step implementation logic
- Expected impact
- Associated risk
- Test plan

## 7. Continuous Improvement

Always look for improvements in:

- Performance
- Security
- Scalability
- Readability
- Maintainability

## 8. Absolute Rules

### Forbidden

- Changing code without understanding the system
- Fixing issues without impact analysis
- Improvised solutions
- Ignoring existing standards
- Adding unnecessary code or dependencies

### Mandatory

- Analyze before acting
- Validate impact before changing
- Preserve architectural consistency
- Test before concluding
- Document all decisions and changes

## 9. Security Rules

- Never expose secrets in the frontend
- Use environment variables correctly
- Validate inputs
- Protect sensitive routes
- Prevent data leakage

## 10. Testing Rules

The following must be guaranteed:

- Automated tests passing
- Build working
- Lint passing

In addition:

- Perform manual smoke tests
- Validate real user flows
- Confirm integrations end to end

## 11. Change Workflow

Every change must follow this order:

1. Understand the problem
2. Analyze the system
3. Identify the cause
4. Propose a solution
5. Evaluate impact
6. Test
7. Document
8. Apply

## 12. Versioning and Deploy

- Maintain dependency consistency
- Avoid package manager conflicts
- Validate the build environment
- Guarantee deployment compatibility

## 13. Dependency Control

- Avoid dead code
- Remove unused code
- Keep dependencies consistent and justified
- Validate external API usage

## 14. Performance

Always review:

- Asset size
- Load time
- Memory usage
- Image and media optimization

## 15. Documentation

Always document:

- Errors found
- Decisions taken
- Changes applied
- Solutions implemented
- Identified impacts

## 16. Main Directive

Do not execute any action without fully understanding the context, impact, and consequences.

## 17. Standard Work Process

1. Understanding
2. Diagnosis
3. Classification
4. Planning
5. Execution
6. Testing
7. Validation
8. Documentation

## 18. Mandatory Checklist

Before any change, confirm:

- I fully understood the problem
- I analyzed the impact
- I identified the risks
- I evaluated better alternatives
- The solution fits the project standards
- I tested the solution
- I documented the result
- I did not break existing behavior

## 19. Project Audit Areas

Always review:

- Security
- Performance
- Consistency
- Architecture
- Dead code
- Dependencies

## 20. Quality Criteria

A change is only valid if it:

- Does not break existing behavior
- Improves or preserves project standards
- Is tested
- Is documented
- Makes sense in context

## 21. Reuse in Other Projects

To reuse this model:

- Replace project-specific context
- Adapt stack and integrations
- Adjust team-specific rules
- Preserve the governance logic, checklist, and security principles

## 22. Golden Rule

If you do not fully understand what you are doing, you should not do it.

## 23. Production Lessons Applied

These rules were added from real issues found in this repository and should be treated as mandatory checks in future rounds:

- Never keep frontend clients pointing to server routes that do not exist in the backend.
- Never expose third-party AI keys in browser code. Any AI provider integration must go through a server-side proxy.
- Package manager, deploy config, local commands, and documentation must all use the same standard.
- Frontmatter image paths must be validated against real files before build or deploy.
- Documentation must only reference scripts and folders that actually exist in the repository.
- Build validation is not enough on its own. A local smoke test against served production output is required before sign-off.
- When a static asset is unusually large, inspect its real structure before optimizing. Embedded base64 media inside SVG files must be treated as image payload, not vector artwork.
- If new optimized assets are introduced, update ignore rules carefully so only the intended production files become versioned.
- Experimental or OS-sensitive optimization steps must stay out of the mandatory build pipeline until they are stable and repeatable.

## How To Use This Document

- Save it at the repository root
- Consult it before any relevant change
- Use it for both human and AI decision-making
- Treat it as a mandatory governance baseline

## Expected Outcome

With this governance model, the project should gain:

- Fewer bugs
- More security
- Better consistency
- More stable deploys
- Controlled evolution
- Better technical decisions
