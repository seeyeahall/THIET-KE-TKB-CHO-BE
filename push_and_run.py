"""
push_and_run.py — Menu khởi động Kid Adventure Planner
=======================================================
Chạy: python push_and_run.py  (hoặc double-click push_and_run.bat)

Menu:
    [1] 🖥️  Chạy LOCAL (dev, localhost:3005 + :8001)
    [2] ☁️  Push lên Cloud (git + Fly.io deploy)
    [3] 🧪  Chỉ test backend API (không mở frontend)
    [4] ❌  Thoát
"""

import os
import subprocess
import sys
import time
import webbrowser

ROOT_DIR    = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")

# ─── Màu terminal ─────────────────────────────────────────────────────────────
def c(code, s): return f"\033[{code}m{s}\033[0m"
def green(s):   return c(92, s)
def yellow(s):  return c(93, s)
def cyan(s):    return c(96, s)
def bold(s):    return c(1, s)
def red(s):     return c(91, s)

# ─── Banner ───────────────────────────────────────────────────────────────────
def banner():
    print()
    print(cyan("╔══════════════════════════════════════════════╗"))
    print(cyan("║") + bold("  🚀  KID ADVENTURE PLANNER                 ") + cyan("║"))
    print(cyan("╠══════════════════════════════════════════════╣"))
    print(cyan("║") + "  [1] 🖥️   Chay LOCAL  (localhost:3005)       " + cyan("║"))
    print(cyan("║") + "  [2] ☁️   Push len Cloud (Fly.io + Cloudflare)" + cyan("║"))
    print(cyan("║") + "  [3] 🧪   Chi test Backend API                " + cyan("║"))
    print(cyan("║") + "  [4] ❌   Thoat                               " + cyan("║"))
    print(cyan("╚══════════════════════════════════════════════╝"))
    print()

# ─── Option 1: Chạy LOCAL ─────────────────────────────────────────────────────
def run_local():
    local_script = os.path.join(ROOT_DIR, "local_dev.py")
    if not os.path.exists(local_script):
        print(red("✗ Khong tim thay local_dev.py — vui long tao file nay truoc."))
        return
    print(green("\n→ Khoi dong LOCAL dev mode...\n"))
    # Kế thừa terminal hiện tại để Ctrl+C hoạt động đúng
    subprocess.run([sys.executable, local_script], cwd=ROOT_DIR)

# ─── Option 2: Push Cloud ─────────────────────────────────────────────────────
def push_cloud():
    print(bold("\n☁️  PUSH LEN CLOUD"))
    print("─" * 44)

    # 1. Git
    print(f"\n[1/3] {bold('Git add + commit + push...')}")
    subprocess.run("git add .", shell=True, cwd=ROOT_DIR)
    
    import datetime
    ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    commit_msg = f"Deploy: {ts}"
    print(f"  Commit: {commit_msg}")
    result = subprocess.run(
        f'git commit -m "{commit_msg}"',
        shell=True, cwd=ROOT_DIR, capture_output=True, text=True
    )
    if "nothing to commit" in result.stdout + result.stderr:
        print(yellow("  (Khong co thay doi moi de commit)"))
    else:
        print(green("  ✓ Committed"))
    
    subprocess.run("git push -u origin HEAD", shell=True, cwd=ROOT_DIR)
    print(green("  ✓ Pushed len GitHub → Cloudflare tu dong deploy frontend"))

    # 2. Fly.io deploy backend
    print(f"\n[2/3] {bold('Deploy Backend len Fly.io...')}")
    fly_exe = r"C:\Users\NHVANG\.fly\bin\flyctl.exe"
    if not os.path.exists(fly_exe):
        fly_exe = "flyctl"  # fallback: dung PATH
    
    result = subprocess.run(
        f'"{fly_exe}" deploy',
        shell=True, cwd=BACKEND_DIR, capture_output=False
    )
    if result.returncode == 0:
        print(green("  ✓ Backend deployed len Fly.io"))
    else:
        print(yellow("  ⚠ Fly.io deploy co the loi — kiem tra output tren"))

    # 3. Mở browser
    print(f"\n[3/3] {bold('Mo trinh duyet...')}")
    frontend_url = "https://kid-adventure-planner.pages.dev"
    print(f"  URL: {frontend_url}")
    print("  (Cho Cloudflare deploy xong ~ 1-2 phut...)")
    time.sleep(3)
    webbrowser.open(frontend_url)
    print(green("\n✓ Hoan tat! App se san sang sau vai phut."))

# ─── Option 3: Chỉ test backend ───────────────────────────────────────────────
def test_backend_only():
    print(bold("\n🧪 TEST BACKEND API"))
    print("─" * 44)
    local_script = os.path.join(ROOT_DIR, "local_dev.py")
    if os.path.exists(local_script):
        subprocess.run(
            [sys.executable, local_script, "--backend"],
            cwd=ROOT_DIR
        )
        time.sleep(3)
        subprocess.run(
            [sys.executable, local_script, "--test"],
            cwd=ROOT_DIR
        )
    else:
        print(red("✗ Khong tim thay local_dev.py"))

# ─── Main ─────────────────────────────────────────────────────────────────────
def main():
    # Enable ANSI colors on Windows
    if sys.platform == "win32":
        os.system("color")

    while True:
        banner()
        choice = input("  Chon (1/2/3/4): ").strip()
        print()

        if choice == "1":
            run_local()
        elif choice == "2":
            push_cloud()
        elif choice == "3":
            test_backend_only()
        elif choice == "4":
            print(green("Bye! 👋\n"))
            break
        else:
            print(yellow(f"  Lua chon '{choice}' khong hop le. Vui long nhap 1, 2, 3 hoac 4.\n"))

        if choice in ("2", "3"):
            input("\n  [Enter de quay lai menu]")

if __name__ == "__main__":
    main()
