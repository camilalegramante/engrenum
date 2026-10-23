/** Conventional Commits v1.0.0 — see CLAUDE.md, section 9. */
const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "header-max-length": [2, "always", 72],
  },
};

export default config;
