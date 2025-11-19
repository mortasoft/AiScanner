# NEXUS | SecOps Scanner

NEXUS is a web-based security scanner interface that allows users to run Nmap scans against targets and view the results. It features a modern, dark-themed UI with real-time status updates.

## Prerequisites

Before running the application, ensure you have the following installed:

*   **Python 3.x**
*   **MySQL Server** or **MariaDB**
*   **Nmap** (must be installed and available in your system's PATH)

### Ubuntu 24.04 Setup

To install the necessary dependencies on Ubuntu 24.04, run the following commands:

```bash
sudo apt update
sudo apt install mariadb-server nmap python3-pip python3-venv
sudo systemctl start mariadb
sudo systemctl enable mariadb
```

## Installation

1.  **Clone or Download the repository** to your local machine.

2.  **Set up a Virtual Environment** (Recommended):
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```

3.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

## Running with Docker

1.  **Build and Run**:
    ```bash
    docker-compose up --build
    ```
    The application will be available at [http://localhost:5000](http://localhost:5000).

## Database Setup (Manual / Non-Docker)

1.  Log in to your MySQL/MariaDB server:
    ```bash
    sudo mysql -u root
    ```

2.  Create the database and the required table using the following SQL commands:

    ```sql
    CREATE DATABASE secops;
    USE secops;

    CREATE TABLE scans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        target VARCHAR(255) NOT NULL,
        tool VARCHAR(50),
        status VARCHAR(50),
        output LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ```

## Configuration

Open `ai_studio_code.py` and update the `DB_CONFIG` dictionary with your database credentials:

```python
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',        # Change to your DB user
    'password': '',        # Change to your DB password
    'database': 'secops'
}
```

## Usage

1.  **Start the Application**:
    ```bash
    python ai_studio_code.py
    ```

2.  **Access the Interface**:
    Open your web browser and navigate to:
    [http://localhost:5000](http://localhost:5000)

3.  **Run a Scan**:
    - Enter a target IP or hostname (e.g., `127.0.0.1` or `scanme.nmap.org`).
    - Select a scan profile (Nmap Fast Scan or Nmap Intense).
    - Click **EXECUTE**.

## Troubleshooting

-   **Database Connection Error**: Ensure MariaDB/MySQL is running (`sudo systemctl status mariadb`) and the credentials in `ai_studio_code.py` are correct.
-   **Nmap Not Found**: Ensure Nmap is installed and added to your system's PATH.
