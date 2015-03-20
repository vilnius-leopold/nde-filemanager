PACKAGE_NAME=nde-filemanager
PREFX=/home/leo/.local

all: dev


kill:
	-pkill nw

dev: kill install run

clean:
	rm -rf dist/

build: clean
	zip -r ../$(PACKAGE_NAME).nw *
	mkdir -p dist
	mv ../$(PACKAGE_NAME).nw dist/$(PACKAGE_NAME).nw

install: build
	install $(PACKAGE_NAME).desktop $(PREFX)/share/applications
	install $(PACKAGE_NAME) ~/bin
	mkdir -p $(PREFX)/share/$(PACKAGE_NAME)
	install dist/$(PACKAGE_NAME).nw $(PREFX)/share/$(PACKAGE_NAME)

run: build
	nw dist/$(PACKAGE_NAME).nw
