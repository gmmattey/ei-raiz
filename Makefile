.PHONY: help dev docker logs clean install build preview

help:
	@echo "========================================"
	@echo "  Esquilo Invest - Makefile"
	@echo "========================================"
	@echo ""
	@echo "Comandos disponíveis:"
	@echo ""
	@echo "  make dev          - Inicia desenvolvimento (npm run dev)"
	@echo "  make install      - Instala dependências"
	@echo "  make build        - Build para produção"
	@echo "  make preview      - Testa build localmente"
	@echo "  make docker       - Inicia via Docker"
	@echo "  make docker-build - Build Docker"
	@echo "  make logs         - Mostra logs Docker"
	@echo "  make clean        - Remove node_modules e dist"
	@echo "  make stop         - Para containers Docker"
	@echo ""
	@echo "Exemplo: make dev"
	@echo ""

dev:
	@echo "[INFO] Iniciando desenvolvimento..."
	cd apps/web && npm run dev

install:
	@echo "[INFO] Instalando dependências..."
	cd apps/web && npm ci

build:
	@echo "[INFO] Buildando para produção..."
	cd apps/web && npm run build

preview: build
	@echo "[INFO] Testando build localmente..."
	cd apps/web && npm run preview

docker:
	@echo "[INFO] Iniciando Docker..."
	docker-compose up --build

docker-build:
	@echo "[INFO] Buildando imagem Docker..."
	docker-compose build --no-cache

logs:
	@echo "[INFO] Mostrando logs Docker..."
	docker-compose logs -f esquilo-web

stop:
	@echo "[INFO] Parando containers..."
	docker-compose down

clean:
	@echo "[INFO] Limpando..."
	cd apps/web && rm -rf node_modules dist
	@echo "[OK] Limpeza concluída"

clean-all: clean
	@echo "[INFO] Removendo containers Docker..."
	docker-compose down -v
	@echo "[OK] Limpeza completa concluída"

.DEFAULT_GOAL := help
