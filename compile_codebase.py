import os

# Configuration
SOURCE_DIR = r"c:\Users\abdel\OneDrive\Documents\Coturne\progressed-codebase"
OUTPUT_FILE = r"c:\Users\abdel\OneDrive\Documents\Coturne\coturne_codebase.txt"

EXCLUDE_DIRS = {
    "node_modules", ".git", ".lovable", ".agents", "dist", ".cache"
}
EXCLUDE_FILES = {
    "bun.lock", "package-lock.json", ".env", "pnpm-lock.yaml"
}
ALLOWED_EXTENSIONS = {
    ".ts", ".tsx", ".js", ".jsx", ".json", ".sql", ".css", ".md", ".jsonc"
}

def compile_codebase():
    if not os.path.exists(SOURCE_DIR):
        print(f"Error: Source directory {SOURCE_DIR} does not exist.")
        return

    print(f"Compiling codebase from: {SOURCE_DIR}")
    print(f"Saving combined file to: {OUTPUT_FILE}")

    count = 0
    with open(OUTPUT_FILE, "w", encoding="utf-8") as out:
        out.write("========================================================================\n")
        out.write("COTURNE MATCHING APP - PROGRESSED CODEBASE COMPILED FOR REVIEW\n")
        out.write("========================================================================\n\n")

        for root, dirs, files in os.walk(SOURCE_DIR):
            # Filter directories in-place to prevent walking down excluded paths
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]

            for file in files:
                if file in EXCLUDE_FILES:
                    continue

                ext = os.path.splitext(file)[1].lower()
                if ext not in ALLOWED_EXTENSIONS:
                    continue

                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, SOURCE_DIR)

                print(f"Packing: {rel_path}")
                out.write(f"--- FILE START: {rel_path} ---\n")
                
                try:
                    with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                        out.write(f.read())
                except Exception as e:
                    out.write(f"[ERROR READING FILE: {str(e)}]\n")
                
                out.write(f"\n--- FILE END: {rel_path} ---\n\n")
                count += 1

    print(f"\nSuccessfully packed {count} files into {OUTPUT_FILE}")

if __name__ == "__main__":
    compile_codebase()
