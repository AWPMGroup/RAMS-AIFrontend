# RAMS.AI Render staging

Three staging services are live on the approved US$21/month compute baseline. The two application commits remain unchanged; OpenAI is disabled. Authentication/private-network/PDF cloud smoke and local connected mocked-model journeys passed.

Read [the validation and review record](validation-2026-10-22.md) for deployment IDs, exact scope, dependency PRs, remaining vulnerabilities, public HTTPS test limitation and shutdown instructions.

Important: the gateway was created separately after the original Blueprint failed. It is currently ungrouped. Do not sync until the Dashboard review confirms that the existing gateway srv-dbd1qurncjis73e0335g is adopted rather than duplicated. The connector cannot inspect/apply Blueprint changes or assign environments. Workspace-aware CLI validation is blocked by missing CLI authentication. The corrected render.yaml passes the current published JSON Schema.

Gateway authentication settings are configured on the Render service. Obtain the generated password through the Dashboard Environment tab; never paste it into chat or repository files. Keep OPENAI_API_KEY empty. Use synthetic data only. Do not merge staging/dependency PRs or deploy production.
