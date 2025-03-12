# **TesterAlly - AI-Based Automation Testing Tool**

## **1. Introduction**
TesterAlly is an AI-powered automation testing tool designed to perform UI interactions, capture screenshots, and execute test cases using **Django, PyAutoGUI, and VNC Server**. It enables users to test web applications across multiple OS environments remotely. The application is deployed on **AWS EC2 (t3.medium)** and uses **Cloudflare** to manage the domain `testerally.ai`.

---

## **2. Project Architecture**
```
TesterAlly/
│-- TesterAlly-BE/             # Django Backend repo
│   │-- api/                   # API app
│   │-- automation/            # Automation app
│-- TesterAlly-FE/             # React for UI repo

```

---

## **3. Tech Stack**
- **Backend**: Django (REST API) with Gunicorn & Nginx
- **Frontend**: React
- **Automation**: PyAutoGUI, Replicate - OmniParser v2 model
- **Remote Control**: VNC Server
- **Database**: AWS RDS (PostgreSQL)
- **Cloud**: AWS EC2 (t3.medium) with an Elastic IP (`13.48.64.40`)
- **Domain & Security**: Cloudflare (`testerally.ai`)

---

## **4. Installation Guide**

### **Step 1: Clone the Repositories**
```bash
git clone https://github.com/rangad123/TesterAlly-FE.git
cd TesterAlly-FE

git clone https://github.com/rangad123/TesterAlly-BE.git
cd TesterAlly-BE
```

### **Step 2: Set Up the Backend (Django)**
```bash
# Move to Backend Directory
cd TesterAlly-BE

# Create a Virtual Environment
python3 -m venv venv
source venv/bin/activate  # For Linux/Mac
venv\Scripts\activate     # For Windows

# Install Required Dependencies
pip install -r requirements.txt

# Apply Migrations
python manage.py migrate

```

### **Step 3: Set Up the Frontend (React)**
```bash
# Move to Frontend Directory
cd ../TesterAlly-FE

# Install Dependencies
npm install

# Start React Development Server
npm start
```

---

## **5. Configuring Gunicorn & Nginx on EC2**
### **Step 1: Connect to EC2 and Install Dependencies on EC2**
```bash
ssh -i your-key.pem ubuntu@yourIPaddress
sudo apt update && sudo apt install -y python3-pip python3-venv nginx
```

### **Step 2: Install Gunicorn & Start Django Server**
```bash
cd /home/ubuntu/TesterAlly-BE
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Gunicorn  file
sudo nano /etc/systemd/system/gunicorn.service
```

### **Step 3: Configure Nginx**
```bash
sudo nano /etc/nginx/sites-available/nginx
```

```bash
# Enable the configuration and restart Nginx
sudo systemctl daemon-reload
sudo systemctl restart nginx
sudo systemctl restart gunicorn
```
---

## **6. VNC Server Setup on EC2**

### **Step 1: Install VNC Server and XFCE4**
```bash
sudo apt update
sudo apt install tightvncserver xfce4 xfce4-goodies dbus-x11 -y
```

### **Step 2: Configure VNC Server**
```bash
vncserver -kill :1
sudo rm -rf /tmp/.X1-lock /tmp/.X11-unix/X1
```

### **Step 3: Edit .bashrc File for Auto Export Display Variable**
```bash
nano ~/.bashrc
```
Add the following line at the end of the file:
```bash
export DISPLAY=:1
```
Then run:
```bash
source ~/.bashrc
```

### **Step 4: Configure VNC Startup Script**
```bash
nano ~/.vnc/xstartup
```

### **Step 5: Set Permissions & Restart Services**
```bash
chmod +x ~/.vnc/xstartup
rm -rf ~/.vnc/*.log ~/.vnc/*.pid
vncserver :1
```

### **Step 6: Verify VNC Process**
```bash
ps aux | grep Xtightvnc
ps aux | grep vnc
echo $DISPLAY
```

### **Step 7: Check a Systemd Service for VNC**
```bash
sudo nano /etc/systemd/system/vncserver.service
```
```bash
sudo systemctl daemon-reload
sudo systemctl enable vncserver.service
sudo systemctl start vncserver.service
```

---

## **7. Installing Google Chrome on EC2**
```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt-get install -f
```
Verify installation:
```bash
google-chrome --version
```

---

## **8. Configuring Cloudflare for Domain `testerally.ai`**
1. Go to **Cloudflare Dashboard**.
2. Add your **AWS Elastic IP ** to an **A Record** pointing to `testerally.ai`.
3. Set up **HTTPS SSL/TLS** mode to "Full".
4. Enable **Caching and Firewall** for security.

---

## **9. Troubleshooting**
- **Check Gunicorn Logs:** `sudo journalctl -u gunicorn -f`
- **Check Nginx Logs:** `sudo journalctl -u nginx --no-pager`
- **Restart Services:**
  ```bash
  sudo systemctl restart nginx
  sudo systemctl restart gunicorn
  ```

