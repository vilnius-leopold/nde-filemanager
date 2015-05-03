PACKAGE_NAME=nde-filemanager
PREFX=/home/leo/.local

LIVERELOAD_DIR = ./testing/ ./elements/
LIVERELOAD_SRC = $(shell find $(LIVERELOAD_DIR) -name "*.js" -o -name "*.html" )
include node_modules/make-livereload/index.mk

all: dev


kill:
	-pkill nw

dev: kill install run

clean:
	rm -rf dist/
	rm -f lookup_icon

lookup_icon: lookup_icon.c
	gcc `pkg-config --cflags gtk+-3.0` -o lookup_icon lookup_icon.c `pkg-config --libs gtk+-3.0`

build: clean lookup_icon
	zip -rq ../$(PACKAGE_NAME).nw *
	mkdir -p dist
	mv ../$(PACKAGE_NAME).nw dist/$(PACKAGE_NAME).nw

install: build install-icons
	install $(PACKAGE_NAME).desktop $(PREFX)/share/applications
	install $(PACKAGE_NAME) $(PREFX)/bin
	mkdir -p $(PREFX)/share/$(PACKAGE_NAME)
	install dist/$(PACKAGE_NAME).nw $(PREFX)/share/$(PACKAGE_NAME)

install-icons:
	mkdir -p $(PREFX)/share/icons/hicolor/scalable/apps
	mkdir -p $(PREFX)/share/icons/hicolor/64x64/apps
	install assets/icons/nde-filemanager.svg $(PREFX)/share/icons/hicolor/scalable/apps
	install assets/icons/nde-filemanager.png $(PREFX)/share/icons/hicolor/64x64/apps

run: build
	$(PREFX)/bin/$(PACKAGE_NAME) --debug

file-test:
	node file.js

test:
	cd testing/; node root-test.js

dev-reload:
	# start server if not running
	test "$$(ps -A | grep node)" || node testing/server.js ./ &

	# start chromium on localhost if not running
	test "$$(ps -A | grep chromium)" || chromium http://localhost:8080/testing/shadow.html &

	# start tiny-lr if not running
	test "$$(ps -A --format pid | grep $$(cat tiny-lr.pid))" || make livereload-start &

	# reload
	make reload