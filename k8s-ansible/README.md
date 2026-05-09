# 🚀 Kubernetes Cluster + ArgoCD Deployment using Ansible

![Kubernetes](https://img.shields.io/badge/Kubernetes-1.29-blue?logo=kubernetes)
![Ansible](https://img.shields.io/badge/Ansible-Automation-red?logo=ansible)
![ArgoCD](https://img.shields.io/badge/ArgoCD-v2.10.0-orange?logo=argo)
![Rocky Linux](https://img.shields.io/badge/Rocky_Linux-9.7-green?logo=rockylinux)
![License](https://img.shields.io/badge/License-MIT-yellow)

> A fully automated Ansible playbook to deploy a production-ready Kubernetes cluster using kubeadm with Calico CNI, followed by ArgoCD installation for GitOps continuous delivery — all on Rocky Linux 9.

---

## 📋 Table of Contents

- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Playbook Phases](#playbook-phases)
- [Roles Explained](#roles-explained)
- [ArgoCD Access](#argocd-access)
- [Troubleshooting](#troubleshooting)
- [Lessons Learned](#lessons-learned)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Infrastructure                             │
│                                                                 │
│  ┌──────────────────────┐     ┌──────────────────────────────┐  │
│  │  Master Node         │     │  Worker Nodes                │  │
│  │  192.168.1.89        │     │  worker-01: 192.168.1.90     │  │
│  │                      │     │  worker-02: 192.168.1.2      │  │
│  │  • Control Plane     │     │                              │  │
│  │  • Ansible Controller│     │  • Application Workloads     │  │
│  │  • ArgoCD            │     │  • Calico CNI Agents         │  │
│  │  • etcd              │     │                              │  │
│  │  • API Server        │     └──────────────────────────────┘  │
│  └──────────────────────┘                                       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  Kubernetes Components                  │    │
│  │                                                         │    │
│  │  CNI: Calico v3.27.0      Service CIDR: 10.96.0.0/12    │    │
│  │  Runtime: containerd      Pod CIDR: 192.168.0.0/16      │    │
│  │  Version: K8s 1.29        ArgoCD: v2.10.0               │    │ 
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ Prerequisites

### Hardware Requirements

| Node | Role | CPU | RAM | Disk |
|------|------|-----|-----|------|
| master | Control Plane + Ansible | 2+ vCPU | 4+ GB | 30+ GB |
| worker-01 | Worker Node | 2+ vCPU | 2+ GB | 20+ GB |
| worker-02 | Worker Node | 2+ vCPU | 2+ GB | 20+ GB |

### Software Requirements

- Rocky Linux 9.x on all VMs
- Ansible installed on master node
- SSH key-based authentication configured
- Internet access from all nodes
- `ansible` user with passwordless sudo

### Install Ansible on Master

```bash
sudo dnf install -y ansible
ansible --version
```

### Setup SSH Keys

```bash
# Generate SSH key on master
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""

# Copy to all nodes
ssh-copy-id ansible@192.168.1.89   # master itself
ssh-copy-id ansible@192.168.1.90   # worker-01
ssh-copy-id ansible@192.168.1.2    # worker-02
```

### Configure Passwordless Sudo

Run on ALL nodes:
```bash
echo "ansible ALL=(ALL) NOPASSWD:ALL" | sudo tee /etc/sudoers.d/ansible
```

---

## 📁 Project Structure

```
k8s-ansible/
├── ansible.cfg                     # Ansible configuration
├── site.yml                        # Main deployment playbook
├── argocd.yml                      # ArgoCD installation playbook
├── reset.yml                       # Cluster teardown playbook
│
├── inventory/
│   └── hosts.ini                   # VM inventory with IPs
│
├── group_vars/
│   └── all.yml                     # Shared variables (IPs, versions)
│
└── roles/
    ├── common/                     # Applied to ALL nodes
    │   ├── tasks/
    │   │   └── main.yml            # Prerequisites, containerd, kubelet
    │   └── handlers/
    │       └── main.yml            # Service restart handlers
    │
    ├── master/                     # Control plane only
    │   └── tasks/
    │       └── main.yml            # kubeadm init, Calico, join command
    │
    ├── worker/                     # Worker nodes only
    │   └── tasks/
    │       └── main.yml            # kubeadm join
    │
    └── argocd/                     # ArgoCD installation
        └── tasks/
            └── main.yml            # Namespace, deploy, NodePort, password
```

---

## ⚡ Quick Start

### Step 1 — Clone the Project

```bash
git clone <your-repo-url>
cd k8s-ansible
```

### Step 2 — Configure Inventory

Edit `inventory/hosts.ini` with your actual IPs:

```ini
[control_plane]
master ansible_host=192.168.1.89 ansible_connection=local ansible_user=ansible

[workers]
worker-01 ansible_host=192.168.1.90 ansible_user=ansible
worker-02 ansible_host=192.168.1.2  ansible_user=ansible

[k8s_cluster:children]
control_plane
workers
```

### Step 3 — Configure Variables

Edit `group_vars/all.yml`:

```yaml
# !! Change these to your actual IPs
control_plane_ip: "192.168.1.89"
control_plane_endpoint: "192.168.1.89:6443"
apiserver_advertise_address: "192.168.1.89"

# Kubernetes
kubernetes_version: "1.29"
pod_network_cidr: "192.168.0.0/16"
service_cidr: "10.96.0.0/12"
calico_version: "v3.27.0"

# ArgoCD
argocd_version: "v2.10.0"
argocd_http_nodeport: 30080
argocd_https_nodeport: 30443
```

### Step 4 — Test Connectivity

```bash
ansible all -m ping
```

Expected output:
```
master    | SUCCESS => pong
worker-01 | SUCCESS => pong
worker-02 | SUCCESS => pong
```

### Step 5 — Deploy the Cluster

```bash
# Deploy everything at once
ansible-playbook main.yml

# Or phase by phase (recommended)
ansible-playbook main.yml --tags common    # Step 1: Prerequisites
ansible-playbook main.yml --tags master    # Step 2: Control plane
ansible-playbook main.yml --tags workers   # Step 3: Join workers
ansible-playbook main.yml --tags verify    # Step 4: Verify cluster
ansible-playbook main.yml --tags argocd    # Step 5: Verify argocd



---

## ⚙️ Configuration

### ansible.cfg

```ini
[defaults]
inventory           = /home/ansible/k8s-ansible/inventory/hosts.ini
remote_user         = ansible
host_key_checking   = False
stdout_callback     = yaml
forks               = 5
timeout             = 60
log_path            = /home/ansible/k8s-ansible/ansible.log

[privilege_escalation]
become              = True
become_method       = sudo
become_user         = root
become_ask_pass     = False

[ssh_connection]
pipelining          = True
```

### group_vars/all.yml — All Variables

```yaml
# Kubernetes
kubernetes_version: "1.29"
pod_network_cidr: "192.168.0.0/16"
service_cidr: "10.96.0.0/12"
calico_version: "v3.27.0"

# Control Plane
control_plane_ip: "192.168.1.89"
control_plane_endpoint: "192.168.1.89:6443"
apiserver_advertise_address: "192.168.1.89"

# ArgoCD
argocd_version: "v2.10.0"
argocd_http_nodeport: 30080
argocd_https_nodeport: 30443
```

---

## 🔄 Playbook Phases

### Phase 1 — Common (All Nodes)

Applied to master + worker-01 + worker-02:

| Step | Task | Why |
|------|------|-----|
| 1 | Remove K3s if installed | Prevents port conflicts |
| 2 | Disable Swap | Required by Kubernetes |
| 3 | Set hostname | Node identification |
| 4 | Update /etc/hosts dynamically | DNS resolution between nodes |
| 5 | Set SELinux to permissive | Required for K8s |
| 6 | Configure firewalld (ports + CIDRs) | Network access |
| 7 | Load kernel modules | overlay + br_netfilter |
| 8 | Set sysctl parameters | IP forwarding |
| 9 | Install containerd (fresh config) | Container runtime |
| 10 | Verify containerd working | Prevent CRI errors |
| 11 | Add Kubernetes repo (RPM) | Package source |
| 12 | Install kubelet/kubeadm/kubectl | K8s tools |

### Phase 2 — Master (Control Plane)

| Step | Task | Why |
|------|------|-----|
| 1 | kubeadm init | Initialize control plane |
| 2 | Configure kubectl for users | CLI access |
| 3 | Wait for API Server ready | Prevent timing issues |
| 4 | Install Calico CNI | Pod networking |
| 5 | Generate join command | Workers can join |
| 6 | Install bash-completion | kubectl autocomplete |

### Phase 3 — Worker (Worker Nodes)

| Step | Task | Why |
|------|------|-----|
| 1 | Verify containerd working | Prevent CRI errors |
| 2 | Read join command | Generated by master |
| 3 | Execute kubeadm join | Join the cluster |
| 4 | Ensure kubelet running | Node agent |

### Phase 4 — ArgoCD

| Step | Task | Why |
|------|------|-----|
| 1 | Create argocd namespace | Isolation |
| 2 | Apply ArgoCD manifests | Install ArgoCD |
| 3 | Wait for pods ready | Ensure healthy state |
| 4 | Patch service to NodePort | External access |
| 5 | Open firewall ports | Network access |
| 6 | Get initial admin password | Login access |
| 7 | Install ArgoCD CLI | Command line tool |

---

## 🎭 Roles Explained

### common role
Runs on ALL 3 nodes. Handles all prerequisites before Kubernetes installation. Most critical role — must complete successfully before any other role runs.

**Key fixes applied:**
- Removes K3s before installation to prevent port conflicts
- Builds `/etc/hosts` dynamically from inventory (no hardcoded IPs)
- Opens Pod CIDR and Service CIDR in firewalld (not just ports)
- Generates fresh containerd config and verifies it works

### master role
Runs only on the control plane node. Initializes the cluster with `kubeadm init`, installs Calico CNI for pod networking, and generates the join token for workers.

**Key fixes applied:**
- Waits for API Server to be ready before applying Calico
- Uses `--validate=false` on kubectl apply to avoid timeout
- Removed `--upload-certs` flag (not needed for single master)

### worker role
Runs on worker-01 and worker-02. Verifies containerd is working before joining, then executes the join command generated by master.

**Key fixes applied:**
- Verifies containerd CRI before join (prevents common CRI error)
- Reads join command from controller file (not hardcoded)

### argocd role
Runs on control plane. Installs ArgoCD, exposes it via NodePort, and retrieves the initial admin password.

---

## 🌐 ArgoCD Access

After successful deployment:

### Web UI
```
URL:      https://192.168.1.89:30443
Username: admin
Password: (printed at end of argocd playbook)
```

### Get Password Manually
```bash
kubectl get secret argocd-initial-admin-secret \
  -n argocd \
  -o jsonpath="{.data.password}" | base64 -d && echo
```

### CLI Login
```bash
argocd login 192.168.1.89:30443 \
  --username admin \
  --password <your-password> \
  --insecure
```

### Create an Application
```bash
argocd app create my-app \
  --repo https://github.com/your-org/your-repo \
  --path helm-chart \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace default \
  --sync-policy automated
```

---

## 🔍 Verify Cluster Health

```bash
# Check all nodes are Ready
kubectl get nodes -o wide

# Expected output:
# NAME        STATUS   ROLES           AGE   VERSION
# master      Ready    control-plane   10m   v1.29.15
# worker-01   Ready    <none>          8m    v1.29.15
# worker-02   Ready    <none>          8m    v1.29.15

# Check all system pods
kubectl get pods --all-namespaces

# Check ArgoCD pods
kubectl get pods -n argocd

# Label worker nodes (optional)
kubectl label node worker-01 node-role.kubernetes.io/worker=worker
kubectl label node worker-02 node-role.kubernetes.io/worker=worker
```

---

## 🔥 Useful Commands

```bash
# Run full playbook
ansible-playbook main.yml

# Run specific phase
ansible-playbook main.yml --tags common
ansible-playbook main.yml --tags master
ansible-playbook main.yml --tags workers
ansible-playbook main.yml --tags argocd
ansible-playbook main.yml --tags verify

# Check syntax before running
ansible-playbook main.yml --syntax-check

# Dry run (check mode)
ansible-playbook main.yml --check

# Run with verbose output
ansible-playbook main.yml -v

# Reset cluster completely
ansible-playbook reset.yml

# Test connectivity
ansible all -m ping
ansible all -m command -a "hostname"
```

---

## 🚨 Troubleshooting

### ❌ Nodes NotReady

```bash
# Check kubelet logs
journalctl -u kubelet -f --no-pager | tail -50

# Check Calico pods
kubectl get pods -n kube-system | grep calico
kubectl logs -n kube-system <calico-pod-name>
```

**Common cause:** firewalld blocking Pod/Service CIDR traffic.

**Fix:**
```bash
sudo firewall-cmd --permanent --add-rich-rule='rule family=ipv4 destination address=10.96.0.0/12 accept'
sudo firewall-cmd --permanent --add-rich-rule='rule family=ipv4 destination address=192.168.0.0/16 accept'
sudo firewall-cmd --permanent --add-rich-rule='rule family=ipv4 source address=192.168.0.0/16 accept'
sudo firewall-cmd --permanent --zone=trusted --add-interface=tunl0
sudo firewall-cmd --permanent --zone=trusted --add-interface=kube-ipvs0
sudo firewall-cmd --permanent --add-masquerade
sudo firewall-cmd --reload
```

---

### ❌ CRI Error on Workers

```
[ERROR CRI]: container runtime is not running
```

**Fix:**
```bash
sudo rm -f /etc/containerd/config.toml
sudo containerd config default | sudo tee /etc/containerd/config.toml
sudo sed -i 's/SystemdCgroup = false/SystemdCgroup = true/' /etc/containerd/config.toml
sudo systemctl restart containerd
sudo systemctl status containerd
```

---

### ❌ DNS Not Working (ArgoCD pods failing)

```
dial tcp 10.96.0.1:443: i/o timeout
```

**Diagnosis:**
```bash
kubectl run test-dns --image=busybox --rm -it --restart=Never -- \
  nslookup kubernetes.default.svc.cluster.local
```

**Fix:** Apply firewall rules above, then:
```bash
kubectl rollout restart deployment coredns -n kube-system
kubectl rollout restart deployment -n argocd
```

---

### ❌ kubeadm init fails — Ports in use

```
[ERROR Port-6443]: Port 6443 is in use
```

**Cause:** K3s or previous Kubernetes installation running.

**Fix:**
```bash
# Remove K3s
sudo /usr/local/bin/k3s-uninstall.sh

# Reset kubeadm
sudo kubeadm reset -f
sudo rm -rf /etc/kubernetes /var/lib/etcd /var/lib/kubelet /etc/cni/net.d

# Verify ports are free
sudo ss -tlnp | grep -E '6443|10250|10257|10259'
```

---

### ❌ Port Conflict with K3s

K3s was pre-installed on the VMs and was occupying Kubernetes ports (6443, 10250, 10257, 10259). Always check for existing Kubernetes distributions before running kubeadm.

---

## 📚 Lessons Learned

During this project, several real-world issues were encountered and resolved:

| # | Problem | Root Cause | Solution |
|---|---------|-----------|----------|
| 1 | K3s occupying ports | K3s pre-installed on VMs | Uninstall K3s first |
| 2 | Wrong /etc/hosts entries | Hardcoded IPs in playbook | Dynamic hosts from inventory |
| 3 | DNS timeout in pods | firewalld blocking CIDRs | Open Pod + Service CIDRs |
| 4 | containerd CRI error | Stale config.toml | Delete and regenerate config |
| 5 | Calico apply fails | API Server not ready | Wait for API Server first |
| 6 | apt in Rocky Linux | Wrong OS assumption | Use dnf everywhere |
| 7 | Role files not found | Wrong file names | Always use tasks/main.yml |
| 8 | IP address changed | VM DHCP | Update group_vars + reset |

---

## 🛡️ Security Notes

- Change default JWT secrets in production
- Use private container registry instead of public DockerHub
- Enable Pod Security Standards
- Configure Network Policies
- Rotate ArgoCD admin password after first login
- Use RBAC for fine-grained access control

---

## 📦 Tech Stack

| Component | Version | Purpose |
|-----------|---------|---------|
| Rocky Linux | 9.7 | Operating System |
| Ansible | Latest | Automation |
| Kubernetes | 1.29.15 | Container Orchestration |
| kubeadm | 1.29 | Cluster Bootstrap |
| containerd | 2.2.2 | Container Runtime |
| Calico | v3.27.0 | CNI / Pod Networking |
| ArgoCD | v2.10.0 | GitOps CD           |

