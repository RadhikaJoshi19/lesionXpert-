"""
LesionXpert.AI — Mobile App Launcher & QR Code Generator
Allows instant testing and 1-tap installation on mobile phones (Android & iOS).
"""

import os
import sys
import socket
import subprocess

def get_local_ip():
    """Gets local LAN IP address to connect from phone on the same Wi-Fi network."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0.5)
        # Connect to a public DNS address to discover local routing interface
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        try:
            return socket.gethostbyname(socket.gethostname())
        except Exception:
            return '127.0.0.1'

def print_banner(local_ip):
    print("=" * 70)
    print(" 🔬  LESIONXPERT.AI — MOBILE PHONE APP & PWA RUNNER")
    print("=" * 70)
    print("\n📱 HOW TO OPEN & INSTALL ON YOUR PHONE:")
    print(" 1. Make sure your phone and computer are on the SAME Wi-Fi network.")
    print(" 2. Open Chrome (Android) or Safari (iPhone) on your phone.")
    print(f" 3. Enter this link:  👉  http://{local_ip}:3000")
    print(" 4. Click 'Install App' / 'Add to Home Screen' to use it as a full phone app!")
    print("\n🔗 ACCESS URLs:")
    print(f" • Mobile Web App (React + PWA):    http://{local_ip}:3000")
    print(f" • Streamlit Clinical Workstation:  http://{local_ip}:8501")
    print(" • Local PC Access:                 http://localhost:3000")
    print("=" * 70 + "\n")

if __name__ == '__main__':
    ip = get_local_ip()
    print_banner(ip)
    
    # Prompt user which server to start
    print("Select server to start:")
    print(" [1] React + Express Mobile App (Port 3000 - Recommended PWA)")
    print(" [2] Streamlit ML Clinical App (Port 8501)")
    print(" [3] Start Both (React on 3000 + Streamlit on 8501)")
    
    choice = sys.argv[1] if len(sys.argv) > 1 else "1"
    
    if choice == "2":
        print(f"\n🚀 Launching Streamlit on http://{ip}:8501 ...")
        subprocess.run(["streamlit", "run", "streamlit_app.py", "--server.address", "0.0.0.0", "--server.port", "8501"])
    elif choice == "3":
        print(f"\n🚀 Launching Streamlit and React Mobile servers...")
        p1 = subprocess.Popen(["streamlit", "run", "streamlit_app.py", "--server.address", "0.0.0.0", "--server.port", "8501"])
        subprocess.run(["npm", "run", "dev"])
    else:
        print(f"\n🚀 Launching React Mobile App on http://{ip}:3000 ...")
        subprocess.run(["npm", "run", "dev"], shell=True)
