# Alexandria Orchestrator — multi-stage build
# Stage 1: Build
FROM rust:1.93-bookworm AS builder

WORKDIR /app

# Cache de dependencias: copia manifests primeiro
COPY Cargo.toml Cargo.lock ./
COPY crates/core-sdk/Cargo.toml crates/core-sdk/Cargo.toml
COPY crates/orchestrator/Cargo.toml crates/orchestrator/Cargo.toml
COPY crates/node-agent/Cargo.toml crates/node-agent/Cargo.toml

# Cria dummy sources para cache de deps
RUN mkdir -p crates/core-sdk/src crates/orchestrator/src crates/node-agent/src && \
    echo "pub fn dummy() {}" > crates/core-sdk/src/lib.rs && \
    echo "fn main() {}" > crates/orchestrator/src/main.rs && \
    echo "fn main() {}" > crates/node-agent/src/main.rs

RUN cargo build --release --bin orchestrator 2>/dev/null || true

# Copia source real e compila
COPY crates/ crates/
COPY migrations/ migrations/

# Touch para invalidar cache dos dummy files
RUN touch crates/core-sdk/src/lib.rs crates/orchestrator/src/main.rs

RUN cargo build --release --bin orchestrator

# Stage 2: Runtime
FROM debian:bookworm-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/orchestrator /usr/local/bin/orchestrator
COPY --from=builder /app/migrations /app/migrations

WORKDIR /app

ENV HOST=0.0.0.0
ENV PORT=8080
ENV RUST_LOG=alexandria=info,tower_http=info

EXPOSE 8080

CMD ["orchestrator"]
