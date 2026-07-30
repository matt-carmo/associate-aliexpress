ENV_FILE=.env

.PHONY: env

env:
	@if [ ! -f "$(ENV_FILE)" ]; then \
		echo "❌ Error: $(ENV_FILE) not found."; \
		exit 1; \
	fi
	@echo "Updating environment file..."
	@cp "$(ENV_FILE)" backend/.env
	@cp "$(ENV_FILE)" scripts/.env
	@cp "$(ENV_FILE)" scraper/.env
	@cp "$(ENV_FILE)" frontend/.env
	@if [ ! -f scraper/.env ] && [ -f scraper/.env.example ]; then \
		cp scraper/.env.example scraper/.env; \
	fi
	@echo "Generating frontend/.env.development and frontend/.env.production..."
	@BACKEND_URL_DEV=$$(grep '^BACKEND_URL_DEV=' $(ENV_FILE) | cut -d= -f2-) && \
	 BACKEND_URL_PROD=$$(grep '^BACKEND_URL_PROD=' $(ENV_FILE) | cut -d= -f2-) && \
	 echo "NEXT_PUBLIC_MESSAGING_API_URL=$$BACKEND_URL_DEV" > frontend/.env.development && \
	 echo "NEXT_PUBLIC_MESSAGING_API_URL=$$BACKEND_URL_PROD" > frontend/.env.production
	@echo "✅ Environment files updated successfully."

reset-backend:
	@echo "Resetting backend service..."
	@cd backend && \
	sudo kill -9 $$(sudo lsof -t -i:4000) 2>/dev/null || true; \
	sudo rm -rf auth_info_baileys/ && \
	nohup npm start > ./app.log 2>&1 &