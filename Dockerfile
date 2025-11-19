FROM python:3.9-slim

# Install system dependencies (Nmap)
RUN apt-get update && apt-get install -y nmap && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose the Flask port
EXPOSE 5000

# Run the application
CMD ["python", "ai_studio_code.py"]
