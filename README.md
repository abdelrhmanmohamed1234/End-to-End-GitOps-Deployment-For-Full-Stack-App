# 🐳 Orchestrating a Full-Stack MERN Application using Docker
This project is a comprehensive implementation of a MERN Stack (MongoDB, Express, React, Node.js) application, fully containerized and orchestrated with Docker. The primary goal of this project was to transition from a local development workflow to a professional, isolated, and scalable container-based architecture.

# 🎯 Project Focus: Docker & DevOps
Unlike standard MERN tutorials, this project serves as a practical application of Advanced Docker Concepts, focusing on service isolation, internal networking, and persistent storage.

# 🐳 Key Docker Implementations:
Multi-Container Orchestration: Managed three distinct services (Frontend, Backend, Database) using a single docker-compose.yml file.
Custom Networking: Created a dedicated bridge network to allow secure communication between containers while isolating them from the public internet where necessary.
Persistent Data Volumes: Implemented Docker Volumes for MongoDB to ensure that data (user records) persists even after containers are stopped or removed.
Environment Abstraction: Used .env files to inject sensitive Cloudinary API keys and database URIs into the container environment without hardcoding.
System Time Synchronization: Resolved critical "Stale Request" errors with external APIs (Cloudinary) by synchronizing the host and container system clocks.
Shutterstock
ا
# 🛠️ Technology Stack
Frontend: React.js (Hooks, Functional Components, React Router).
Backend: Node.js & Express.js (RESTful API).
Database: MongoDB (NoSQL).
Image Management: Cloudinary API (Cloud Hosting).
Infrastructure: Docker & Docker Compose.

# 📋 Prerequisites
Docker
Docker Compose
Cloudinary Account (for Image API keys).

# ⚙️ Quick Start
Clone the Repository:
Bash
git clone https://github.com/abdelrhmanmohamed1234/Orchestrating-a-Full-Stack-MERN-Application-using-Docker.git
cd Orchestrating-a-Full-Stack-MERN-Application-using-Docker
Configure Environment Variables:
Create a .env file in the backend/ directory with the following keys:

CLOUD_NAME=your_cloudinary_name
API_KEY=your_api_key
API_SECRET=your_api_secret
MONGO_URI=mongodb://db:27017/mern_db
Spin Up the Environment:

Bash
docker-compose up -d --build
Access the Application:
Frontend: http://localhost:8080
Backend API: http://localhost:5005

# 🛠️ Troubleshooting & Lessons Learned
During the containerization process, several production-level challenges were addressed:
Permission Denied (Docker Volumes): Fixed by ensuring the MongoDB container had the correct UID/GID permissions to write to the host's volume.
Cloudinary Stale Requests: Solved by implementing ntpdate logic on the host server to fix clock drifts that caused API authentication failures.
CORS & Proxying: Configured the React frontend to communicate with the containerized backend using internal Docker DNS names.

# 🤝 Contributing
Contributions are welcome! If you have suggestions for optimizing the Dockerfiles or adding new features, feel free to open a Pull Request.
