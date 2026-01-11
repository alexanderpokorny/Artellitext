#!/usr/bin/env bash
set -e

echo "== 1) System-Update =="
sudo apt-get update

echo "== 2) Basis-Pakete für Docker-Repo =="
sudo apt-get install -y \
  ca-certificates curl gnupg lsb-release apt-transport-https software-properties-common

echo "== 3) Docker GPG-Key installieren =="
sudo mkdir -p /usr/share/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg \
  | sudo gpg --dearmor -o /usr/share/keyrings/docker.gpg

echo "== 4) Docker-Repository für Debian $(lsb_release -cs) eintragen =="
echo "deb [arch=$(dpkg --print-architecture) \
signed-by=/usr/share/keyrings/docker.gpg] \
https://download.docker.com/linux/debian \
$(lsb_release -cs) stable" \
| sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

echo "== 5) Paketlisten aktualisieren =="
sudo apt-get update

echo "== 6) Docker Engine + Compose-Plugin installieren =="
sudo apt-get install -y \
  docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin

echo "== 7) docker-Gruppe und Benutzerrechte setzen =="
# Gruppe 'docker' anlegen (falls noch nicht vorhanden)
sudo groupadd -f docker

# Aktuellen User in die docker-Gruppe aufnehmen
sudo usermod -aG docker "$USER"

echo "== 8) Docker-Dienst starten (falls nötig) =="
# In Crostini i.d.R. systemd-basiert, aber zur Sicherheit:
if command -v systemctl >/dev/null 2>&1; then
  sudo systemctl enable docker || true
  sudo systemctl start docker || true
fi

echo
echo "== 9) Test: Docker 'hello-world' (mit sudo, falls Gruppenrechte noch nicht aktiv sind) =="
if ! docker run --rm hello-world >/dev/null 2>&1; then
  echo "Docker ohne sudo noch nicht möglich, versuche mit sudo..."
  sudo docker run --rm hello-world
fi

echo
echo "== 10) pgvector-Image für Postgres 17 laden =="
docker pull pgvector/pgvector:pg17

echo "== 11) Existierenden Container 'pgvector-db' (falls vorhanden) stoppen/löschen =="
docker stop pgvector-db >/dev/null 2>&1 || true
docker rm pgvector-db >/dev/null 2>&1 || true

echo "== 12) Postgres 17 + pgvector Container starten =="
docker run -d --name pgvector-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=Artellitext \
  -p 5432:5432 \
  -v pgdata:/var/lib/postgresql/data \
  pgvector/pgvector:pg17

echo
echo "== 13) Status anzeigen =="
docker ps

cat <<EOF

FERTIG.

- Docker ist installiert und konfiguriert.
- Postgres 17 mit pgvector läuft im Container 'pgvector-db'.
- DB-Name: Artellitext
- User:     postgres
- Passwort: postgres
- Host:     localhost
- Port:     5432

WICHTIG:
- Nach diesem Skript einmal ab- und wieder anmelden ODER 'newgrp docker' ausführen,
  damit alle künftigen Shells Docker ohne 'sudo' nutzen können:

    newgrp docker

EOF

docker exec -it pgvector-db psql -U postgres -d Artellitext
