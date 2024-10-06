#!/bin/bash

# Daftar file dan folder yang akan diabaikan
ignore_list=(
    "node_modules"
    ".env"
    ".wwebjs_auth"
    ".wwebjs_cache"
    "authorizedGroups.json"
    "package-lock.json"
)

# Fungsi untuk mencetak header
print_header() {
    echo -e "\n\n===== $1 =====\n"
}

# Fungsi untuk memeriksa apakah item harus diabaikan
should_ignore() {
    local item="$1"
    for ignore in "${ignore_list[@]}"; do
        if [[ "$item" == *"$ignore"* ]]; then
            return 0  # true, harus diabaikan
        fi
    done
    [[ "$item" == *.log ]]  # true jika file berakhiran .log
}

# Fungsi rekursif untuk menjelajahi direktori
explore_dir() {
    for item in "$1"/*; do
        if should_ignore "$item"; then
            continue  # Lewati item yang harus diabaikan
        fi
        
        if [ -d "$item" ]; then
            print_header "FOLDER: ${item#./}"
            explore_dir "$item"
        elif [ -f "$item" ]; then
            print_header "FILE: ${item#./}"
            # Gunakan 'cat' untuk file teks, 'file' untuk mendeteksi tipe file
            if file "$item" | grep -qE 'text|empty'; then
                cat "$item"
            else
                echo "[Binary file, content not displayed]"
            fi
        fi
    done
}

# Mulai dari direktori saat ini
explore_dir .

# Simpan output ke file (gunakan path absolut untuk menghindari masalah)
explore_dir . > "$(pwd)/structure_and_content.txt"