import os

def scan_directory(root_path, output_file, show_hidden=False):
    """
    Scan a directory and export its structure to a text file.
    
    Args:
        root_path (str): Path to the directory to scan
        output_file (str): Path to the output text file
        show_hidden (bool): Whether to include hidden files/folders
    """
    
    def write_structure(path, file_handle, prefix="", is_last=True):
        """Recursively write directory structure with tree-like formatting."""
        items = []
        
        try:
            # Get all items in the directory
            all_items = os.listdir(path)
            
            # Filter hidden files if needed
            if not show_hidden:
                all_items = [item for item in all_items if not item.startswith('.')]
            
            # Sort items: directories first, then files
            all_items.sort()
            dirs = [item for item in all_items if os.path.isdir(os.path.join(path, item))]
            files = [item for item in all_items if os.path.isfile(os.path.join(path, item))]
            items = dirs + files
            
        except PermissionError:
            file_handle.write(f"{prefix}[Permission Denied]\n")
            return
        
        for i, item in enumerate(items):
            item_path = os.path.join(path, item)
            is_last_item = (i == len(items) - 1)
            
            # Choose the appropriate tree symbols
            if is_last_item:
                current_prefix = "└── "
                next_prefix = prefix + "    "
            else:
                current_prefix = "├── "
                next_prefix = prefix + "│   "
            
            # Write the current item
            if os.path.isdir(item_path):
                file_handle.write(f"{prefix}{current_prefix}{item}/\n")
                # Recursively process subdirectory
                write_structure(item_path, file_handle, next_prefix, is_last_item)
            else:
                # Get file size
                try:
                    size = os.path.getsize(item_path)
                    size_str = format_file_size(size)
                    file_handle.write(f"{prefix}{current_prefix}{item} ({size_str})\n")
                except (OSError, IOError):
                    file_handle.write(f"{prefix}{current_prefix}{item} (size unknown)\n")

    def format_file_size(size_bytes):
        """Convert bytes to human readable format."""
        if size_bytes == 0:
            return "0 B"
        
        size_names = ["B", "KB", "MB", "GB", "TB"]
        i = 0
        size = float(size_bytes)
        
        while size >= 1024.0 and i < len(size_names) - 1:
            size /= 1024.0
            i += 1
        
        return f"{size:.1f} {size_names[i]}"

    # Check if the root path exists
    if not os.path.exists(root_path):
        print(f"Error: The path '{root_path}' does not exist.")
        return False
    
    if not os.path.isdir(root_path):
        print(f"Error: The path '{root_path}' is not a directory.")
        return False
    
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            # Write header
            f.write(f"Directory Structure for: {os.path.abspath(root_path)}\n")
            f.write("=" * 60 + "\n\n")
            
            # Write root directory name
            root_name = os.path.basename(os.path.abspath(root_path)) or os.path.abspath(root_path)
            f.write(f"{root_name}/\n")
            
            # Write the structure
            write_structure(root_path, f)
            
            f.write(f"\n" + "=" * 60 + "\n")
            f.write(f"Scan completed successfully!\n")
        
        print(f"Directory structure exported to: {output_file}")
        return True
        
    except IOError as e:
        print(f"Error writing to file '{output_file}': {e}")
        return False

# Example usage
if __name__ == "__main__":
    # Configuration
    folder_to_scan = input("Enter the folder path to scan: ").strip()
    if not folder_to_scan:
        folder_to_scan = "."  # Current directory if no input
    
    output_filename = input("Enter output filename (default: directory_structure.txt): ").strip()
    if not output_filename:
        output_filename = "directory_structure.txt"
    
    include_hidden = input("Include hidden files/folders? (y/n, default: n): ").strip().lower()
    show_hidden_files = include_hidden in ['y', 'yes', '1', 'true']
    
    # Run the scanner
    print(f"\nScanning directory: {folder_to_scan}")
    print(f"Output file: {output_filename}")
    print(f"Include hidden files: {show_hidden_files}")
    print("-" * 40)
    
    success = scan_directory(folder_to_scan, output_filename, show_hidden_files)
    
    if success:
        print("✓ Scan completed successfully!")
    else:
        print("✗ Scan failed!")