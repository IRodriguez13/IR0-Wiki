# IR0 Atlas / Journal — build and serve

.PHONY: atlas-sync-edition atlas-validate atlas-build atlas-serve atlas-all \
        atlas-capture atlas-capture-all atlas-deploy-check atlas-test-story-playback

PYTHON ?= python3
SCENARIO ?= null-dereference
ATLAS_RUN_SMOKE ?=

IR0_ROOT ?= $(abspath ../IR0)
ISD_ROOT ?= $(abspath ../ISD)

atlas-sync-edition:
	$(PYTHON) scripts/sync_edition.py --ir0 "$(IR0_ROOT)" --isd "$(ISD_ROOT)"

atlas-validate:
	IR0_ROOT="$(IR0_ROOT)" $(PYTHON) scripts/validate_refs.py

atlas-build: atlas-sync-edition atlas-validate
	$(PYTHON) scripts/atlas_build.py

atlas-serve: atlas-build
	$(PYTHON) scripts/atlas_serve.py

atlas-test-story-playback:
	node tests/story_playback_test.js

atlas-all: atlas-build atlas-test-story-playback
	@echo "Atlas build OK"

atlas-capture:
	chmod +x scripts/capture_trace.sh
	IR0_ROOT="$(IR0_ROOT)" ISD_ROOT="$(ISD_ROOT)" \
		./scripts/capture_trace.sh $(SCENARIO) \
		$(if $(ATLAS_RUN_SMOKE),--run-smoke,)
	$(MAKE) atlas-build

atlas-capture-all:
	$(MAKE) atlas-capture SCENARIO=null-dereference ATLAS_RUN_SMOKE=$(ATLAS_RUN_SMOKE)
	$(MAKE) atlas-capture SCENARIO=ls-root ATLAS_RUN_SMOKE=$(ATLAS_RUN_SMOKE)
	$(MAKE) atlas-capture SCENARIO=hello-tcc ATLAS_RUN_SMOKE=$(ATLAS_RUN_SMOKE)

atlas-deploy-check: atlas-build
	test -f site/data/edition.json
	test -f site/data/atlas/map.json
	test -f site/data/scenarios/null-dereference.trace.json
	@echo "deploy-check OK"
