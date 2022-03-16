.PHONY: check test-unit

test-unit:
	cd tests && PYTHONDONTWRITEBYTECODE="nono" python3 -m pytest --showlocals --verbose test_*
check: test-unit
