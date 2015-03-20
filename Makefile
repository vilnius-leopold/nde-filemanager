PACKAGE_NAME=nde-filemanager

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
	install nde-filemanager.desktop ~/.local/share/applications
	install nde-filemanager ~/bin
	mkdir -p ~/.local/share/nde-filemanger
	install dist/nde-filemanager.nw ~/.local/share/nde-filemanager

run: build
	nw dist/$(PACKAGE_NAME).nw
