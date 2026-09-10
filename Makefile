.PHONY: up down logs db-migrate db-seed-taxonomy db-seed db-studio generate-contracts bootstrap

up:
	docker compose up -d
	@echo "Waiting for Postgres..."
	@until docker compose exec -T postgres pg_isready -U $${POSTGRES_USER:-plated} >/dev/null 2>&1; do sleep 1; done
	@echo "Stack is up."

down:
	docker compose down

logs:
	docker compose logs -f

db-migrate:
	pnpm db:migrate

db-seed-taxonomy:
	pnpm db:seed-taxonomy

db-seed:
	pnpm db:seed

db-studio:
	pnpm db:studio

generate-contracts:
	pnpm contracts:generate
	cd services/data-workers && \
	  . .venv/bin/activate && \
	  datamodel-codegen \
	    --input ../../packages/contracts/schemas/extraction.schema.json \
	    --input-file-type jsonschema \
	    --output schemas/generated/extraction.py \
	    --output-model-type pydantic_v2.BaseModel \
	    --use-annotated \
	    --target-python-version 3.11

bootstrap: up
	pnpm install
	$(MAKE) generate-contracts
	pnpm db:migrate
	pnpm db:seed-taxonomy
	cd services/data-workers && python3 -m venv .venv && . .venv/bin/activate && pip install -e ".[dev]"
	@echo "Bootstrap complete. Canonical dish taxonomy loaded (see packages/db/src/taxonomy)."
	@echo "Run 'make db-seed' for fake demo restaurants/menus to test against, 'pnpm dev' to start web+api, and the data-workers service separately (see services/data-workers/README)."
