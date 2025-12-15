# Development Workflow & Safety Protocols

## git Agent Protocol

### 1. Feature Implementation
- **Branching**: Before implementing any feature, create and switch to a branch named: `feature/{short-feature-name}`
- **Implementation**: Write code, tests, and documentation as needed.

### 2. Verification
- **Request**: After implementing the feature, ask the user to verify the changes.

### 3. Completion & Merge
**Condition**: user says "It works" OR "Go ahead".

**Actions**:
1.  `git add .`
2.  **Safety Check**: Double-check `.gitignore` to ensure no secrets (env files, keys, tokens, large datasets) are staged.
3.  `git commit -m "Implemented {feature-name}"`
4.  `git checkout main`
5.  `git merge feature/{short-feature-name}`
6.  `git push origin main`
7.  `git branch -d feature/{short-feature-name}`

## Safety & Discipline Rules

- **NEVER Commit**:
    - `.env` files
    - API keys
    - Tokens
    - Large datasets
- **Merge Conflicts**:
    - **STOP immediately**.
    - Explain the conflict.
    - Ask the user how to proceed.
