.PHONY: all build frontend backend clean dev

all: build

frontend:
	cd frontend && npm install && npm run build

backend: frontend
	go build -o bin/crashpilot-interface ./cmd/server

build: backend

dev-frontend:
	cd frontend && npm run dev

dev-backend:
	go run ./cmd/server

clean:
	rm -rf bin/ frontend/dist frontend/node_modules
