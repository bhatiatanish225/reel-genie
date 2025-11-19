.PHONY: help dev test lint migrate init-db clean

help:
	@echo "Reel Genie Backend - Available Commands"
	@echo "========================================"
	@echo "make dev         - Start development environment"
	@echo "make test        - Run tests"
	@echo "make lint        - Run linters"
	@echo "make migrate     - Run database migrations"
	@echo "make init-db     - Initialize database with sample data"
	@echo "make clean       - Clean up containers and volumes"

dev:
	docker-compose up

test:
	pytest tests/ -v --cov=app --cov-report=html

lint:
	black app/ tests/ --check
	flake8 app/ tests/
	mypy app/

migrate:
	alembic upgrade head

init-db:
	python scripts/init_db.py

clean:
	docker-compose down -v
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
