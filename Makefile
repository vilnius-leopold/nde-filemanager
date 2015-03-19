PACKAGE_NAME=nde-filemanger

all: dev


kill:
	-pkill nw

dev: kill run

clean:
	rm -rf dist/

build: clean
	zip -r ../$(PACKAGE_NAME).nw *
	mkdir -p dist
	mv ../$(PACKAGE_NAME).nw dist/$(PACKAGE_NAME).nw

run: build
	nw dist/$(PACKAGE_NAME).nw
