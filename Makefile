.PHONY: install
install:
	poetry install

.PHONY: all
all: clean fix lint

.PHONY: clean
clean:
	rm -rf .mypy_cache
	rm -rf .pytest_cache
	find . -name '*.pyc' -exec rm -f {} +
	find . -name '*.pyo' -exec rm -f {} +
	find . -name '*~' -exec rm -f {} +
	find . -name '__pycache__' -exec rm -fr {} +

.PHONY: fix
fix:
	poetry run ruff format
	poetry run ruff check --preview --fix

.PHONY: lint
lint:
	poetry run ruff check --preview
	poetry run mypy .

.PHONY: run
run:
	poetry run streamlit run app.py
