<div align="center">

# 🚀 End-to-End GitOps Deployment for Full-Stack App

**A production-grade CI/CD pipeline that takes a MERN application from source code to a self-healing Kubernetes cluster — fully automated, security-hardened, and GitOps-native.**

[![CI Pipeline](https://img.shields.io/badge/CI-GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)](https://github.com/features/actions)
[![GitOps](https://img.shields.io/badge/GitOps-ArgoCD-EF7B4D?style=for-the-badge&logo=argo&logoColor=white)](https://argoproj.github.io/cd/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-1.29-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white)](https://kubernetes.io/)
[![Helm](https://img.shields.io/badge/Helm-Charts-0F1689?style=for-the-badge&logo=helm&logoColor=white)](https://helm.sh/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![SonarCloud](https://img.shields.io/badge/SonarCloud-Quality_Gate-F3702A?style=for-the-badge&logo=sonarcloud&logoColor=white)](https://sonarcloud.io/)
[![Trivy](https://img.shields.io/badge/Trivy-Security_Scan-1904DA?style=for-the-badge&logo=aquasecurity&logoColor=white)](https://trivy.dev/)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Technology Stack](#-technology-stack)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Infrastructure Provisioning (Ansible)](#-infrastructure-provisioning-ansible)
- [Local Development with Docker Compose](#-local-development-with-docker-compose)
- [Kubernetes Deployment via ArgoCD](#-kubernetes-deployment-via-argocd)
- [Helm Charts](#-helm-charts)
- [Security Highlights](#-security-highlights)
- [Environment Variables & Secrets](#-environment-variables--secrets)
- [Monitoring & Health Checks](#-monitoring--health-checks)
- [Contributing](#-contributing)

---

## 🌟 Overview

This project demonstrates an **industry-standard, end-to-end GitOps workflow** for a full-stack MERN application. Every commit to `main` automatically triggers a pipeline that:

1. **Tests** both frontend and backend with Jest and generates coverage reports
2. **Scans code quality** with SonarCloud static analysis
3. **Lints Dockerfiles** with Hadolint for best-practice enforcement
4. **Builds** optimized, multi-stage Docker images
5. **Scans images** for CVEs with Trivy (blocking on CRITICAL vulnerabilities)
6. **Pushes** versioned images to Docker Hub (tagged with `latest` + git SHA)
7. **Auto-updates** Helm chart `values.yaml` with the new image tag
8. **ArgoCD detects** the chart change and **self-heals** the cluster to the desired state

The result is a **fully automated, auditable, and reproducible** deployment pipeline where the Git repository is the single source of truth.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Developer Workstation                         │
│                    git push → GitHub (main branch)                  │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    GitHub Actions CI Pipeline                        │
│                                                                      │
│  Job 1: backend-tests          Job 2: frontend-tests                │
│  ├── npm ci                    ├── npm ci                           │
│  ├── Jest + Coverage           ├── Jest + Coverage                  │
│  └── SonarCloud Scan           └── SonarCloud Scan                  │
│                                                                      │
│  Job 3: build-and-push  (needs: both test jobs)                     │
│  ├── Hadolint (Dockerfile lint)                                      │
│  ├── Docker Build (Backend + Frontend)                               │
│  ├── Trivy Scan (block on CRITICAL CVEs)                             │
│  ├── Docker Push → Docker Hub (:latest + :$SHA)                     │
│  └── Update Helm values.yaml → git commit [skip ci]                 │
└────────────────────────────┬────────────────────────────────────────┘
                             │  Helm chart updated in Git
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     ArgoCD (GitOps Controller)                       │
│                                                                      │
│  Polls Git repo every ~3 minutes                                     │
│  Detects image tag change in helm-charts/                           │
│  Runs: helm upgrade --install                                        │
│  Self-heals any manual cluster drift                                 │
│  Prunes resources removed from chart                                 │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Kubernetes Cluster (kubeadm + Calico CNI)               │
│                                                                      │
│  Namespace: mern-app                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  Frontend    │  │   Backend    │  │   MongoDB    │             │
│  │  Pod ×3      │  │   Pod ×1     │  │   Pod ×1     │             │
│  │  (React+Nginx│  │  (Express)   │  │  (Stateful)  │             │
│  │  NodePort    │  │  NodePort    │  │  ClusterIP   │             │
│  │  :30081)     │  │  :30500)     │  │  :27017)     │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                              │                       │
│                                    PersistentVolumeClaim             │
│                                    (local-path, 5Gi)                │
└─────────────────────────────────────────────────────────────────────┘
```

### Cluster Topology

| Node | IP | Role |
|------|----|------|
| master | 172.20.10.6 | Control Plane + Ansible Controller |
| worker-01 | 192.168.1.90 | Worker Node |
| worker-02 | 192.168.1.2 | Worker Node |

---

## 🛠️ Technology Stack

### Application Layer
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | React.js + Nginx | SPA served via Nginx with runtime env injection |
| Backend | Node.js + Express | RESTful API, image upload, user management |
| Database | MongoDB 4.4 | NoSQL persistent storage |
| Image Storage | Cloudinary | Cloud-based image hosting & CDN |

### DevOps & CI/CD Layer
| Tool | Version | Purpose |
|------|---------|---------|
| GitHub Actions | — | CI orchestration (test → scan → build → push) |
| SonarCloud | — | Static code analysis & quality gates |
| Hadolint | v3.1.0 | Dockerfile best-practice linting |
| Trivy | latest | Container vulnerability scanning (CVE detection) |
| Docker | — | Containerization with multi-stage builds |
| Docker Hub | — | Container image registry |

### Infrastructure & GitOps Layer
| Tool | Version | Purpose |
|------|---------|---------|
| Kubernetes | 1.29 | Container orchestration |
| kubeadm | 1.29 | Cluster bootstrapping |
| Calico CNI | v3.27.0 | Pod networking (CIDR: 192.168.0.0/16) |
| containerd | 1.7.x | Container runtime |
| Helm | 3.x | Kubernetes package management |
| ArgoCD | v2.10.0 | GitOps continuous delivery (self-healing) |
| Ansible | — | Automated cluster provisioning |

---

## 🔄 CI/CD Pipeline

The pipeline is defined in `.github/workflows/CI.yml` and consists of **3 parallel/sequential jobs**:

### Job 1 & 2: Parallel Test Jobs

```yaml
# Runs simultaneously for Backend and Frontend
- Checkout code (full history for SonarCloud)
- Setup Node.js 22 with npm cache
- npm ci (clean install)
- Jest --coverage --ci (coverage reports generated)
- SonarCloud Scan (uses lcov coverage report)
```

Both jobs must pass before Job 3 starts.

### Job 3: Build, Scan & Push

```yaml
# Only runs after BOTH test jobs succeed
- Hadolint: Lint both Dockerfiles recursively
- Docker Login to Docker Hub
- Build Backend: node:22-alpine (non-root user, production deps only)
- Trivy Scan Backend: Block on CRITICAL CVEs
- Push Backend: :latest + :$GITHUB_SHA
- Build Frontend: Multi-stage (node:22-alpine builder → nginx:1.27-alpine)
- Trivy Scan Frontend: Block on CRITICAL CVEs
- Push Frontend: :latest + :$GITHUB_SHA
- Sed: Replace "latest" tag with $GITHUB_SHA in both Helm values.yaml files
- Git Commit: Auto-commit Helm changes [skip ci]
- Git Push: Triggers ArgoCD sync
```

### GitOps Loop

```
Code Push → CI builds & tags image → Helm values.yaml updated in Git
    ↑                                              ↓
Self-heal ← ArgoCD reconciles cluster ← ArgoCD detects Git change
```

---

## 📁 Project Structure

```
End-to-End-GitOps-Deployment-For-Full-Stack-App/
│
├── .github/
│   └── workflows/
│       └── CI.yml                    # GitHub Actions pipeline
│
├── MERN_PROJECT_BACKEND/
│   ├── Dockerfile                    # node:22-alpine, non-root user
│   ├── index.js                      # Express server + MongoDB connection
│   ├── model/
│   │   └── user.js                   # Mongoose user schema
│   ├── routes/
│   │   └── user.js                   # CRUD + image upload routes
│   ├── utils/
│   │   ├── cloudinary.js             # Cloudinary SDK config
│   │   └── multer.js                 # Multipart file upload middleware
│   ├── tests/
│   │   └── app.test.js               # Jest integration tests
│   ├── sonar-project.properties      # SonarCloud configuration
│   └── package.json                  # Dependencies + test scripts
│
├── MERN_PROJECT_FRONTEND/
│   ├── Dockerfile                    # Multi-stage: builder → nginx:1.27-alpine
│   ├── nginx.conf                    # SPA routing + runtime env injection
│   ├── src/
│   │   ├── App.js                    # React router setup
│   │   ├── pages/
│   │   │   ├── Home.js               # User listing page
│   │   │   ├── AddUser.js            # User creation form
│   │   │   └── EditUser.js           # User edit form
│   │   └── components/
│   │       └── Navbar.js             # Navigation component
│   ├── sonar-project.properties      # SonarCloud configuration
│   └── package.json
│
├── helm-charts/
│   ├── backend/
│   │   ├── Chart.yaml
│   │   ├── values.yaml               # Image tag auto-updated by CI
│   │   └── templates/
│   │       ├── deployment.yaml       # Backend Deployment
│   │       ├── service.yaml          # NodePort :30500
│   │       ├── secret.yaml           # K8s Secret for DB + Cloudinary creds
│   │       ├── mongodb.yaml          # MongoDB StatefulSet
│   │       ├── pvc.yaml              # PersistentVolumeClaim (5Gi)
│   │       └── hpa.yml               # HorizontalPodAutoscaler
│   └── frontend/
│       ├── Chart.yaml
│       ├── values.yaml               # Image tag auto-updated by CI
│       └── templates/
│           ├── deployment.yaml       # Frontend Deployment (×3 replicas)
│           ├── service.yaml          # NodePort :30081
│           └── hpa.yaml              # HorizontalPodAutoscaler
│
├── argocd/
│   ├── backend-application.yaml      # ArgoCD Application CRD
│   └── frontend-application.yaml    # ArgoCD Application CRD
│
├── k8s-ansible/
│   ├── main.yml                      # Orchestrates all 5 phases
│   ├── ansible.cfg
│   ├── inventory/
│   │   └── hosts.ini                 # Cluster node inventory
│   ├── group_vars/
│   │   └── all.yml                   # K8s version, CIDRs, ArgoCD version
│   └── roles/
│       ├── common/                   # Prereqs: containerd, kubeadm, kubelet
│       ├── master/                   # kubeadm init + Calico CNI
│       ├── worker/                   # kubeadm join
│       └── argocd/                   # ArgoCD install + NodePort patch
│
├── docker-compose.yml                # Local dev: all 3 services
├── .env.example                      # Environment variable template
└── README.md
```

---

## 📋 Prerequisites

### For Local Development
- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)
- [Cloudinary account](https://cloudinary.com/) (free tier works)

### For Kubernetes Deployment
- 3× Linux VMs (Rocky Linux recommended) with SSH access
- [Ansible](https://docs.ansible.com/ansible/latest/installation_guide/) on the control machine
- [kubectl](https://kubernetes.io/docs/tasks/tools/) configured locally
- GitHub repository secrets configured (see [Secrets section](#environment-variables--secrets))

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token (not password) |
| `SONAR_TOKEN` | SonarCloud project token |

---

## 🤖 Infrastructure Provisioning (Ansible)

The `k8s-ansible/` directory contains a fully automated Ansible playbook that provisions a production-grade Kubernetes cluster from scratch in **5 phases**:

### Phase 1: Common Prerequisites (all nodes)
- Disables swap (required by kubelet)
- Configures kernel modules (`overlay`, `br_netfilter`)
- Installs `containerd` as the container runtime
- Installs `kubeadm`, `kubelet`, `kubectl` at version `1.29`

### Phase 2: Control Plane Initialization
- Runs `kubeadm init` with pod CIDR `192.168.0.0/16`
- Installs **Calico CNI** (`v3.27.0`) for pod networking
- Generates and stores the join token for workers

### Phase 3: Worker Node Join
- Retrieves the join command from the master
- Joins each worker to the cluster

### Phase 4: ArgoCD Installation
- Installs ArgoCD `v2.10.0` into the `argocd` namespace
- Patches the ArgoCD server service to NodePort (HTTP: `30080`, HTTPS: `30443`)

### Phase 5: Cluster Health Verification
- Waits for all nodes to reach `Ready` state
- Displays node and pod status

```bash
# Run the full provisioning
cd k8s-ansible
ansible-playbook main.yml -i inventory/hosts.ini

# Run only specific phases using tags
ansible-playbook main.yml -i inventory/hosts.ini --tags common
ansible-playbook main.yml -i inventory/hosts.ini --tags argocd

# Reset the cluster (destructive)
ansible-playbook reset.yml -i inventory/hosts.ini
```

---

## 🐳 Local Development with Docker Compose

For local development and testing without Kubernetes:

```bash
# 1. Clone the repository
git clone https://github.com/abdelrhmanmohamed1234/End-to-End-GitOps-Deployment-For-Full-Stack-App.git
cd End-to-End-GitOps-Deployment-For-Full-Stack-App

# 2. Configure environment variables
cp .env.example .env
# Edit .env with your Cloudinary credentials and desired DB credentials

# 3. Start all services
docker-compose up -d --build

# 4. Access the application
# Frontend: http://localhost:7070
# Backend API: http://localhost:5005
# MongoDB: localhost:27017
```

### Service Ports (Docker Compose)

| Service | Internal Port | Host Port |
|---------|--------------|-----------|
| Frontend (React + Nginx) | 80 | 7070 |
| Backend (Express) | 5000 | 5005 |
| MongoDB | 27017 | 27017 |

```bash
# Check service logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop all services
docker-compose down

# Stop and remove volumes (clears database)
docker-compose down -v
```

---

## ☸️ Kubernetes Deployment via ArgoCD

### Step 1: Apply ArgoCD Application Manifests

After the cluster is provisioned and ArgoCD is running:

```bash
# Apply both Application CRDs
kubectl apply -f argocd/backend-application.yaml
kubectl apply -f argocd/frontend-application.yaml

# Verify applications are registered
kubectl get applications -n argocd
```

### Step 2: Access ArgoCD UI

```bash
# Get the initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d

# Access the UI
# https://<MASTER_IP>:30443
# Username: admin
```

### Step 3: Trigger a Deployment

Simply push code to `main` — the pipeline handles the rest. ArgoCD will detect the Helm chart update (image tag change) within ~3 minutes and automatically sync the cluster.

```bash
# Check sync status
kubectl get applications -n argocd

# Watch rollout status
kubectl rollout status deployment/release-backend -n mern-app
kubectl rollout status deployment/release-frontend -n mern-app

# Check running pods
kubectl get pods -n mern-app -o wide
```

### Accessing the Deployed Application

| Service | URL |
|---------|-----|
| Frontend | `http://<MASTER_IP>:30081` |
| Backend API | `http://<MASTER_IP>:30500` |
| ArgoCD UI | `https://<MASTER_IP>:30443` |

---

## ⛵ Helm Charts

### Backend Chart (`helm-charts/backend/`)

| Resource | Description |
|----------|-------------|
| `Deployment` | Backend Express app, secrets mounted as env vars |
| `Service` | NodePort `:30500` |
| `Secret` | DB credentials + Cloudinary keys (base64 encoded) |
| `MongoDB StatefulSet` | MongoDB 4.4 with persistent volume |
| `PersistentVolumeClaim` | 5Gi `local-path` storage for MongoDB + uploads |
| `HPA` | Auto-scales 1→3 replicas at 80% CPU |

### Frontend Chart (`helm-charts/frontend/`)

| Resource | Description |
|----------|-------------|
| `Deployment` | React SPA in Nginx, 3 replicas |
| `Service` | NodePort `:30081` |
| `HPA` | Auto-scales 1→3 replicas at 80% CPU |

### Key `values.yaml` Fields

```yaml
# Backend
image:
  repository: <DOCKERHUB_USERNAME>/mern-backend
  tag: "<git-sha>"          # Auto-updated by CI pipeline

service:
  nodePort: 30500

mongodb:
  enabled: true
  persistence:
    size: 5Gi

# Frontend
replicaCount: 3
image:
  repository: <DOCKERHUB_USERNAME>/mern-frontend
  tag: "<git-sha>"          # Auto-updated by CI pipeline

service:
  nodePort: 30081
```

---

## 🔒 Security Highlights

This project applies **defense-in-depth** across all layers:

### Container Security
- **Non-root user**: Backend runs as `appuser:appgroup` — prevents privilege escalation
- **Minimal base images**: `node:22-alpine` and `nginx:1.27-alpine` reduce attack surface
- **`apk update && apk upgrade`**: OS packages patched in every build
- **`npm ci --only=production`**: No dev dependencies in production images
- **Multi-stage build** (Frontend): Build toolchain never ships to production

### CI/CD Security
- **Trivy scanning**: Blocks deployment on CRITICAL CVEs before any push
- **Hadolint**: Enforces Dockerfile best practices (no `latest` in FROM, etc.)
- **SonarCloud**: Detects security hotspots, code smells, and bugs in JS code
- **No hardcoded secrets**: All credentials via GitHub Secrets → K8s Secrets

### Kubernetes Security
- **K8s Secrets**: DB and Cloudinary credentials stored as `secretKeyRef` — never in plaintext YAML
- **Resource limits**: CPU and memory limits prevent noisy-neighbor issues
- **Namespace isolation**: All app resources in dedicated `mern-app` namespace
- **Self-healing**: ArgoCD reverts unauthorized manual changes to cluster state

---

## 🔑 Environment Variables & Secrets

### `.env.example` (local development)

```env
# Cloudinary Credentials
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Database Credentials
DB_USER=
DB_PASSWORD=
DB_NAME=
```

### GitHub Actions Secrets (CI/CD)

Configure these in **Settings → Secrets and Variables → Actions**:

```
DOCKERHUB_USERNAME    → Your Docker Hub username
DOCKERHUB_TOKEN       → Docker Hub access token
SONAR_TOKEN           → SonarCloud authentication token
```

### Kubernetes Secrets (Production)

Managed by the Helm `secret.yaml` template. The secrets are base64-encoded and referenced by name in the Deployment spec:

```yaml
# Referenced in deployment as:
env:
  - name: DB_USER
    valueFrom:
      secretKeyRef:
        name: mern-backend-secret
        key: db-user
```

---

## 📊 Monitoring & Health Checks

### Backend Health Endpoint

```bash
# Check backend health
curl http://<MASTER_IP>:30500/health
# Response: {"status":"ok","timestamp":"2024-..."}
```

### Kubernetes Probes (Frontend)

```yaml
livenessProbe:
  httpGet: { path: /, port: 80 }
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet: { path: /, port: 80 }
  initialDelaySeconds: 15
  periodSeconds: 5
```

### Useful kubectl Commands

```bash
# Cluster-wide overview
kubectl get nodes -o wide
kubectl get pods -n mern-app -o wide
kubectl get services -n mern-app

# Check ArgoCD sync status
kubectl get applications -n argocd

# View pod logs
kubectl logs -f deployment/release-backend -n mern-app
kubectl logs -f deployment/release-frontend -n mern-app

# Describe pod for events/errors
kubectl describe pod <pod-name> -n mern-app

# Scale manually (ArgoCD will revert if selfHeal=true)
kubectl scale deployment release-frontend --replicas=5 -n mern-app
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/your-feature-name`
3. **Commit** your changes: `git commit -m "feat: add your feature"`
4. **Push** to your branch: `git push origin feature/your-feature-name`
5. **Open** a Pull Request against `main`

### Development Notes

- The CI pipeline skips paths matching `k8s-ansible/**` and `README.md` — infrastructure changes don't trigger image rebuilds
- Image tag updates in `values.yaml` use `[skip ci]` commit message to prevent infinite loops
- Always test locally with Docker Compose before pushing

---

<div align="center">

**Built with ❤️ using the best tools in the DevOps ecosystem**

[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=flat-square&logo=github)](https://github.com/abdelrhmanmohamed1234/End-to-End-GitOps-Deployment-For-Full-Stack-App)

</div>
