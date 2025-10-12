class BookmarkManager {
  constructor() {
    this.bookmarks = [];
    this.filteredBookmarks = [];
    this.folders = new Set(["Root"]);
    this.itemHeight = 72;
    this.visibleItems = Math.ceil(600 / this.itemHeight) + 2;
    this.scrollTop = 0;

    this.initializeElements();
    this.bindEvents();
    this.loadExistingBookmarks();
  }

  initializeElements() {
    this.uploadArea = document.getElementById("uploadArea");
    this.fileInput = document.getElementById("fileInput");
    this.urlForm = document.getElementById("urlForm");
    this.urlInput = document.getElementById("urlInput");
    this.titleInput = document.getElementById("titleInput");
    this.folderSelect = document.getElementById("folderSelect");
    this.descriptionInput = document.getElementById("descriptionInput");
    this.addBookmarkBtn = document.getElementById("addBookmarkBtn");
    this.statsBar = document.getElementById("statsBar");
    this.bookmarksContainer = document.getElementById("bookmarksContainer");
    this.virtualList = document.getElementById("virtualList");
    this.searchBox = document.getElementById("searchBox");
    this.clearBtn = document.getElementById("clearBtn");
    this.totalBookmarks = document.getElementById("totalBookmarks");
    this.totalFolders = document.getElementById("totalFolders");
  }

  bindEvents() {
    // Upload area events
    this.uploadArea.addEventListener("click", () => this.fileInput.click());
    this.uploadArea.addEventListener(
      "dragover",
      this.handleDragOver.bind(this)
    );
    this.uploadArea.addEventListener(
      "dragleave",
      this.handleDragLeave.bind(this)
    );
    this.uploadArea.addEventListener("drop", this.handleDrop.bind(this));

    // File input
    this.fileInput.addEventListener("change", this.handleFileSelect.bind(this));

    // URL form
    this.urlForm.addEventListener("submit", this.handleAddBookmark.bind(this));
    this.urlInput.addEventListener("blur", this.autoFetchTitle.bind(this));

    // Search
    this.searchBox.addEventListener("input", this.handleSearch.bind(this));

    // Clear button
    this.clearBtn.addEventListener("click", this.clearBookmarks.bind(this));

    // Virtual scrolling
    this.virtualList.addEventListener("scroll", this.handleScroll.bind(this));
  }

  async loadExistingBookmarks() {
    try {
      const response = await fetch("/bookmarks/api/bookmarks/");
      if (response.ok) {
        const data = await response.json();
        this.bookmarks = data.bookmarks || [];
        this.filteredBookmarks = [...this.bookmarks];
        this.updateFolders();
        this.updateStats();
        this.renderBookmarks();
      }
    } catch (error) {
      console.error("Failed to load existing bookmarks:", error);
    }
  }

  async handleAddBookmark(e) {
    e.preventDefault();

    const url = this.urlInput.value.trim();
    const title = this.titleInput.value.trim();
    const folder = this.folderSelect.value;
    const description = this.descriptionInput.value.trim();

    if (!url) {
      this.showMessage("Please enter a URL", "error");
      return;
    }

    this.addBookmarkBtn.disabled = true;
    this.addBookmarkBtn.innerHTML =
      '<span class="spinner" style="width: 16px; height: 16px; border-width: 2px; margin: 0 8px 0 0;"></span>Adding...';

    try {
      const bookmarkData = {
        url: url,
        title: title || (await this.fetchPageTitle(url)),
        folder: folder || "Root",
        description: description,
        favicon: this.getFaviconUrl(url),
      };

      // Save to backend
      await this.saveToDatabase([bookmarkData]);

      // Add to frontend
      this.addBookmarks([bookmarkData]);
      this.updateStats();
      this.renderBookmarks();

      // Clear form
      this.urlForm.reset();
      this.showMessage("Bookmark added successfully!", "success");
    } catch (error) {
      this.showMessage("Failed to add bookmark: " + error.message, "error");
    } finally {
      this.addBookmarkBtn.disabled = false;
      this.addBookmarkBtn.innerHTML =
        '<span class="material-icons">add</span>Add Bookmark';
    }
  }

  async autoFetchTitle() {
    const url = this.urlInput.value.trim();
    if (url && !this.titleInput.value.trim()) {
      try {
        const title = await this.fetchPageTitle(url);
        this.titleInput.value = title;
      } catch (error) {
        console.log("Could not fetch page title");
      }
    }
  }

  async fetchPageTitle(url) {
    try {
      // This would need a backend endpoint to fetch page title due to CORS
      // For now, extract domain as fallback
      const domain = new URL(url).hostname;
      return domain.replace("www.", "");
    } catch {
      return "Untitled";
    }
  }

  updateFolders() {
    this.folders.clear();
    this.folders.add("Root");

    this.bookmarks.forEach((bookmark) => {
      if (bookmark.folder) {
        this.folders.add(bookmark.folder);
      }
    });

    // Update folder select
    const currentValue = this.folderSelect.value;
    this.folderSelect.innerHTML = '<option value="">Root</option>';

    Array.from(this.folders)
      .filter((f) => f !== "Root")
      .forEach((folder) => {
        const option = document.createElement("option");
        option.value = folder;
        option.textContent = folder;
        this.folderSelect.appendChild(option);
      });

    this.folderSelect.value = currentValue;
  }

  async saveToDatabase(bookmarks) {
    try {
      const response = await fetch("/bookmarks/upload/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookmarks: bookmarks }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      return result;
    } catch (error) {
      console.error("Save error:", error);
      throw error;
    }
  }

  showMessage(message, type = "success") {
    const messageDiv = document.createElement("div");
    messageDiv.className = `${type}-message`;
    messageDiv.textContent = message;

    // Insert after input methods
    const inputMethods = document.querySelector(".input-methods");
    inputMethods.after(messageDiv);

    setTimeout(() => {
      messageDiv.remove();
    }, 5000);
  }

  handleDragOver(e) {
    e.preventDefault();
    this.uploadArea.classList.add("dragover");
  }

  handleDragLeave(e) {
    if (!this.uploadArea.contains(e.relatedTarget)) {
      this.uploadArea.classList.remove("dragover");
    }
  }

  handleDrop(e) {
    e.preventDefault();
    this.uploadArea.classList.remove("dragover");
    const files = Array.from(e.dataTransfer.files);
    this.processFiles(files);
  }

  handleFileSelect(e) {
    const files = Array.from(e.target.files);
    this.processFiles(files);
  }

  async processFiles(files) {
    this.showLoading();

    try {
      const allBookmarks = [];

      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File ${file.name} is too large (max 10MB)`);
        }

        const content = await this.readFile(file);
        const bookmarks = await this.parseBookmarkFile(content, file.name);
        allBookmarks.push(...bookmarks);
      }

      // Save to backend
      await this.saveToDatabase(allBookmarks);

      this.addBookmarks(allBookmarks);
      this.updateStats();
      this.renderBookmarks();
      this.showMessage(
        `Successfully imported ${allBookmarks.length} bookmarks!`,
        "success"
      );
    } catch (error) {
      this.showError(error.message);
    } finally {
      this.hideLoading();
    }
  }

  readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  }

  async parseBookmarkFile(content, filename) {
    const extension = filename.toLowerCase().split(".").pop();

    if (extension === "json") {
      return this.parseJsonBookmarks(content);
    } else if (extension === "html") {
      return this.parseHtmlBookmarks(content);
    } else {
      throw new Error("Unsupported file format");
    }
  }

  parseJsonBookmarks(content) {
    try {
      const data = JSON.parse(content);
      return this.extractBookmarksFromJson(data);
    } catch (error) {
      throw new Error("Invalid JSON format");
    }
  }

  parseHtmlBookmarks(content) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "text/html");
    return this.extractBookmarksFromHtml(doc);
  }

  extractBookmarksFromJson(data, folder = "Root") {
    const bookmarks = [];

    const traverse = (node, currentFolder) => {
      if (Array.isArray(node)) {
        node.forEach((item) => traverse(item, currentFolder));
      } else if (typeof node === "object") {
        if (node.type === "url" || node.url) {
          bookmarks.push({
            title: node.title || node.name || "Untitled",
            url: node.url,
            folder: currentFolder,
            favicon: this.getFaviconUrl(node.url),
          });
        } else if (node.children || node.type === "folder") {
          const folderName = node.title || node.name || "Untitled Folder";
          if (node.children) {
            traverse(node.children, folderName);
          }
        } else {
          Object.values(node).forEach((value) => {
            if (typeof value === "object") {
              traverse(value, currentFolder);
            }
          });
        }
      }
    };

    traverse(data, folder);
    return bookmarks;
  }

  extractBookmarksFromHtml(doc, folder = "Root") {
    const bookmarks = [];

    const traverse = (element, currentFolder) => {
      const links = element.querySelectorAll("a[href]");
      links.forEach((link) => {
        bookmarks.push({
          title: link.textContent.trim() || "Untitled",
          url: link.href,
          folder: currentFolder,
          favicon: this.getFaviconUrl(link.href),
        });
      });

      const folders = element.querySelectorAll("h3, dt");
      folders.forEach((folderElement) => {
        const folderName =
          folderElement.textContent.trim() || "Untitled Folder";
        const nextElement = folderElement.nextElementSibling;
        if (
          nextElement &&
          (nextElement.tagName === "DL" || nextElement.tagName === "UL")
        ) {
          traverse(nextElement, folderName);
        }
      });
    };

    traverse(doc.body || doc, folder);
    return bookmarks;
  }

  getFaviconUrl(url) {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return null;
    }
  }

  addBookmarks(newBookmarks) {
    this.bookmarks.push(...newBookmarks);
    this.filteredBookmarks = [...this.bookmarks];
    this.updateFolders();
  }

  updateStats() {
    const folders = [...new Set(this.bookmarks.map((b) => b.folder))];
    this.totalBookmarks.textContent = this.bookmarks.length.toLocaleString();
    this.totalFolders.textContent = folders.length.toLocaleString();

    this.statsBar.style.display = this.bookmarks.length > 0 ? "flex" : "none";
    this.bookmarksContainer.style.display =
      this.bookmarks.length > 0 ? "block" : "none";
  }

  handleSearch(e) {
    const query = e.target.value.toLowerCase().trim();

    if (query === "") {
      this.filteredBookmarks = [...this.bookmarks];
    } else {
      this.filteredBookmarks = this.bookmarks.filter(
        (bookmark) =>
          bookmark.title.toLowerCase().includes(query) ||
          bookmark.url.toLowerCase().includes(query) ||
          bookmark.folder.toLowerCase().includes(query)
      );
    }

    this.scrollTop = 0;
    this.virtualList.scrollTop = 0;
    this.renderBookmarks();
  }

  handleScroll() {
    this.scrollTop = this.virtualList.scrollTop;
    this.renderBookmarks();
  }

  renderBookmarks() {
    if (this.filteredBookmarks.length === 0) {
      this.showEmptyState();
      return;
    }

    const startIndex = Math.floor(this.scrollTop / this.itemHeight);
    const endIndex = Math.min(
      startIndex + this.visibleItems,
      this.filteredBookmarks.length
    );

    const containerHeight = this.filteredBookmarks.length * this.itemHeight;
    const offsetY = startIndex * this.itemHeight;

    let html = `<div style="height: ${containerHeight}px; position: relative;">`;
    html += `<div style="transform: translateY(${offsetY}px);">`;

    for (let i = startIndex; i < endIndex; i++) {
      const bookmark = this.filteredBookmarks[i];
      html += this.renderBookmarkItem(bookmark);
    }

    html += "</div></div>";
    this.virtualList.innerHTML = html;
  }

  renderBookmarkItem(bookmark) {
    const favicon = bookmark.favicon
      ? `<img src="${bookmark.favicon}" alt="" style="width: 16px; height: 16px;" onerror="this.style.display='none'">`
      : '<span class="material-icons" style="font-size: 16px;">public</span>';

    return `
                    <div class="bookmark-item" onclick="window.open('${this.escapeHtml(
                      bookmark.url
                    )}', '_blank')">
                        <div class="bookmark-favicon">${favicon}</div>
                        <div class="bookmark-content">
                            <div class="bookmark-title">${this.escapeHtml(
                              bookmark.title
                            )}</div>
                            <div class="bookmark-url">${this.escapeHtml(
                              bookmark.url
                            )}</div>
                        </div>
                        <div class="bookmark-folder">${this.escapeHtml(
                          bookmark.folder
                        )}</div>
                    </div>
                `;
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  clearBookmarks() {
    this.bookmarks = [];
    this.filteredBookmarks = [];
    this.searchBox.value = "";
    this.updateStats();
    this.virtualList.innerHTML = "";
  }

  showLoading() {
    this.virtualList.innerHTML = `
                    <div class="loading">
                        <div class="spinner"></div>
                        <div>Processing bookmark files...</div>
                    </div>
                `;
    this.bookmarksContainer.style.display = "block";
  }

  hideLoading() {
    // Loading will be replaced by actual content or empty state
  }

  showError(message) {
    this.virtualList.innerHTML = `
                    <div class="error-message">
                        <strong>Error:</strong> ${this.escapeHtml(message)}
                    </div>
                `;
  }

  showEmptyState() {
    this.virtualList.innerHTML = `
                    <div class="empty-state">
                        <div class="material-icons empty-icon">bookmark_border</div>
                        <div>No bookmarks found</div>
                        <div style="margin-top: 8px; opacity: 0.7;">Upload bookmark files to get started</div>
                    </div>
                `;
  }

  async saveToDatabase(bookmarks) {
    try {
      const response = await fetch("/bookmarks/upload/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookmarks: bookmarks }),
      });

      const result = await response.json();

      if (result.success) {
        alert(result.message);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save bookmarks: " + error.message);
    }
  }
}

// Initialize the bookmark manager
document.addEventListener("DOMContentLoaded", () => {
  new BookmarkManager();
});
