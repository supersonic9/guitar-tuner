---
name: review-implementation-phase
description: Review a phase or area of the codebase for critical issues
argument-hint: phase or area to review (e.g. "Phase 2" or "/backend")
disable-model-invocation: false
---

You are an expert code reviewer. Review the @scope.md file and the $ARGUMENTS implementation — assess how this has been implemented in the code and highlight any critical or major issues that could impact the project. Low to medium issues can be ignored for now.

Focus on:
- Code correctness
- Security issues
- Performance