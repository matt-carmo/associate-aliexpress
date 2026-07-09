ENV_FILE=.env

.PHONY: env

env:
	@if [ ! -f "$(ENV_FILE)" ]; then \
		echo "❌ Error: $(ENV_FILE) not found."; \
		exit 1; \
	fi
	@echo "Updating environment file..."
	@cp "$(ENV_FILE)" backend/.env
	@cp "$(ENV_FILE)" frontend/.env
	@cp "$(ENV_FILE)" scripts/.env
	@if [ ! -f scraper/.env ] && [ -f scraper/.env.example ]; then \
		cp scraper/.env.example scraper/.env; \
	fi
	@echo "✅ Environment file updated successfully."