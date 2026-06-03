import os
import subprocess
import webbrowser
import time

def main():
    print("========================================================")
    print("  🚀 KID ADVENTURE PLANNER - AUTO DEPLOY SCRIPT 🚀")
    print("========================================================")
    print()

    # 1. Git Add & Commit
    print("[1/4] Dang luu cac thay doi vao Git...")
    subprocess.run("git add .", shell=True)
    
    commit_msg = "Deploy: Hoan thien AI Chat, Schedule, Parent Settings"
    subprocess.run(f'git commit -m "{commit_msg}"', shell=True)

    # 2. Git Push (Frontend Cloudflare)
    print("\n[2/4] Dang day code len Github de Cloudflare tu dong deploy Frontend...")
    subprocess.run("git push -u origin HEAD", shell=True)

    # 3. Fly Deploy (Backend)
    print("\n[3/4] Dang deploy Backend len Fly.io (vui long cho vai phut)...")
    fly_cmd = r"C:\Users\NHVANG\.fly\bin\flyctl.exe deploy"
    # Chay lenh fly deploy trong thu muc backend
    backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
    subprocess.run(fly_cmd, shell=True, cwd=backend_dir)

    # 4. Open Production URL
    print("\n[4/4] Mo trinh duyet den trang Production...")
    
    frontend_url = "https://kid-adventure-planner.pages.dev"
    
    print(f"Server cloud se mat them chut thoi gian de hoan tat tren Cloudflare.")
    print(f"Trinh duyet se mo URL: {frontend_url} sau 3 giay...")
    time.sleep(3)
    
    webbrowser.open(frontend_url)
    
    print("\n✓ Hoan tat! Ban co the su dung he thong ngay bay gio.")

if __name__ == "__main__":
    main()
