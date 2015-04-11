PACKAGE_NAME=nde-filemanager
PREFX=/home/leo/.local

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

install: build
	install $(PACKAGE_NAME).desktop $(PREFX)/share/applications
	install $(PACKAGE_NAME) $(PREFX)/bin
	mkdir -p $(PREFX)/share/$(PACKAGE_NAME)
	install dist/$(PACKAGE_NAME).nw $(PREFX)/share/$(PACKAGE_NAME)

run: build
	$(PREFX)/bin/$(PACKAGE_NAME) --debug

file-test:
	node file.js

pipe-test:
	node pipeTest.js

shadow-test:
	make reload