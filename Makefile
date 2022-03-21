.PHONY: check test-unit

test-unit:
	cd tests && PYTHONDONTWRITEBYTECODE=1 python3 -m pytest --showlocals --verbose test_*
check: test-unit
