FROM kalilinux/kali-rolling

# Evitar prompts interactivos durante la instalacion
ENV DEBIAN_FRONTEND=noninteractive

# Actualizar e instalar dependencias basicas: Python, pip y nmap
# Se incluye 'kali-linux-headless' si se desea el conjunto minimo de herramientas de Kali,
# pero por ahora solo instalamos lo estrictamente necesario.
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    nmap \
    iputils-ping \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .

# Instalar dependencias de Python. 
# Se usa --break-system-packages por la politica de Debian 12+ en Kali
RUN pip3 install --no-cache-dir -r requirements.txt --break-system-packages

COPY . .

# Comando de inicio del motor Aura
CMD ["sh", "-c", "exec uvicorn main:app --host 0.0.0.0 --port ${BACKEND_PORT} --reload"]
