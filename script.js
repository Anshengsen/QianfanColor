const mainNav = document.getElementById('mainNav');
const gallery = document.getElementById('gallery');
const pagination = document.getElementById('pagination');
const themeToggle = document.getElementById('themeToggle');
const modal = document.getElementById('modal');
const modalImg = document.getElementById('modalImg');
const closeModalBtn = document.getElementById('closeModal');
const downloadBtn = document.getElementById('downloadBtn');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchScopeBtn = document.getElementById('searchScopeBtn');

let currentGroupIndex = 0;
let currentCategoryIndex = 0;
let currentPage = 1;
const itemsPerPage = 50;
let isSearching = false;
let searchResults = [];
let searchInCurrentCategory = false;

function renderNavigation() {
    mainNav.innerHTML = "";
    galleryData.forEach((group, groupIndex) => {
        const li = document.createElement("li");
        li.className = "nav-group";

        const groupButton = document.createElement("button");
        groupButton.className = "group-btn";
        groupButton.innerHTML = `<span>${group.group}</span>`;
        groupButton.onclick = () => {
            if (currentGroupIndex !== groupIndex) {
                currentGroupIndex = groupIndex;
                currentCategoryIndex = 0;
                currentPage = 1;
                clearSearch();
                renderAll();
            }
        };
        li.appendChild(groupButton);

        if (group.categories && group.categories.length > 0) {
            const categoryList = document.createElement("ul");
            categoryList.className = "category-list";
            group.categories.forEach((category, categoryIndex) => {
                const categoryLi = document.createElement("li");
                const categoryButton = document.createElement("button");
                categoryButton.textContent = category.name;
                categoryButton.className = "category-btn";
                categoryButton.onclick = () => {
                    currentGroupIndex = groupIndex;
                    currentCategoryIndex = categoryIndex;
                    currentPage = 1;
                    clearSearch();
                    updateNavActiveState();
                    renderGallery();
                    renderPagination();
                };
                categoryLi.appendChild(categoryButton);
                categoryList.appendChild(categoryLi);
            });
            li.appendChild(categoryList);
        }
        mainNav.appendChild(li);
    });
    updateNavActiveState();
}

function updateNavActiveState() {
    document.querySelectorAll("#mainNav .group-btn, #mainNav .category-btn").forEach(btn => btn.classList.remove("active"));
    
    if (isSearching) {
        document.body.classList.add('is-searching');
    } else {
        document.body.classList.remove('is-searching');
    }

    const groupBtn = mainNav.children[currentGroupIndex]?.querySelector(".group-btn");
    if (groupBtn) {
        groupBtn.classList.add("active");
    }

    const categoryList = mainNav.children[currentGroupIndex]?.querySelector(".category-list");
    if (categoryList) {
        const categoryBtn = categoryList.children[currentCategoryIndex]?.querySelector(".category-btn");
        if (categoryBtn) {
            categoryBtn.classList.add("active");
        }
    }
}

function renderGallery() {
    gallery.innerHTML = "";
    const images = isSearching ? searchResults : galleryData[currentGroupIndex]?.categories[currentCategoryIndex]?.images;

    if (!images || images.length === 0) {
        const message = isSearching ? "未找到匹配的结果。" : "此分类下暂无图片。";
        gallery.innerHTML = `<p style="grid-column: 1 / -1; text-align:center; column-span: all;">${message}</p>`;
        return;
    }

    const paginatedImages = images.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    paginatedImages.forEach(imageUrl => {
        const itemDiv = document.createElement("div");
        itemDiv.className = "gallery-item";

        const imageContainer = document.createElement("div");
        imageContainer.onclick = () => openModal(imageUrl);

        const img = document.createElement("img");
        img.src = imageUrl;
        img.loading = "lazy";
        
        const filenameWithExt = imageUrl.split("/").pop();
        const filename = filenameWithExt.substring(0, filenameWithExt.lastIndexOf("."));
        const decodedName = decodeURIComponent(filename);

        let displayText = '';
        let copyText = '';
        
        if (decodedName.includes('→')) {
            displayText = decodedName.replace(/→/g, ' → ').trim().toUpperCase();
            copyText = displayText.split('→')[0].trim();
        } else {
            const hexMatch = decodedName.match(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})/);
            if (hexMatch) {
                copyText = hexMatch[0].toUpperCase();
                let namePart = decodedName.substring(0, hexMatch.index).trim();
                namePart = namePart.replace(/[-‐][\u3040-\u309F\u30A0-\u30FF\s]*$/, '').replace(/[-‐]$/, '').split('-')[0].trim();
                displayText = namePart ? `${namePart} ${copyText}` : copyText;
            } else {
                displayText = decodedName.toUpperCase();
                copyText = displayText;
            }
        }
        
        img.alt = displayText;
        imageContainer.appendChild(img);

        const colorValueDiv = document.createElement('div');
        colorValueDiv.className = "color-value";
        colorValueDiv.textContent = displayText;
        colorValueDiv.onclick = (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(copyText).then(() => {
                const originalText = colorValueDiv.textContent;
                colorValueDiv.textContent = `已复制: ${copyText}`;
                setTimeout(() => { colorValueDiv.textContent = originalText; }, 1500);
            });
        };

        itemDiv.appendChild(imageContainer);
        itemDiv.appendChild(colorValueDiv);
        gallery.appendChild(itemDiv);
    });
}

function renderPagination() {
    pagination.innerHTML = '';
    const images = isSearching ? searchResults : galleryData[currentGroupIndex]?.categories[currentCategoryIndex]?.images;
    const totalItems = images ? images.length : 0;
    
    if (totalItems <= itemsPerPage) {
        pagination.style.display = 'none';
        return;
    }

    pagination.style.display = 'flex';
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const jumpToPage = (page) => {
        const pageNum = parseInt(page, 10);
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
            currentPage = pageNum;
            renderGallery();
            renderPagination();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            const jumpInput = document.getElementById('page-jump-input');
            if(jumpInput) {
                jumpInput.style.borderColor = 'red';
                setTimeout(() => { jumpInput.style.borderColor = ''; }, 1500);
            }
        }
    };
    
    const createPageButton = (text, pageNumber, isDisabled = false, isActive = false) => {
        const btn = document.createElement('button');
        btn.innerHTML = text;
        btn.disabled = isDisabled;
        if (isActive) btn.classList.add('active');
        if (pageNumber) btn.onclick = () => jumpToPage(pageNumber);
        return btn;
    };
    
    pagination.appendChild(createPageButton('上一页', currentPage - 1, currentPage === 1));

    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) {
            pagination.appendChild(createPageButton(i, i, false, i === currentPage));
        }
    } else {
        const pageNumbers = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
        if (currentPage <= 3) { pageNumbers.add(2); pageNumbers.add(3); }
        if (currentPage >= totalPages - 2) { pageNumbers.add(totalPages - 1); pageNumbers.add(totalPages - 2); }
        
        let lastPage = 0;
        Array.from(pageNumbers).sort((a,b) => a - b).forEach(page => {
            if (page > 0 && page <= totalPages) {
                if (page > lastPage + 1) {
                    const ellipsis = document.createElement('span');
                    ellipsis.textContent = '...';
                    ellipsis.className = 'pagination-ellipsis';
                    pagination.appendChild(ellipsis);
                }
                pagination.appendChild(createPageButton(page, page, false, page === currentPage));
                lastPage = page;
            }
        });
    }

    pagination.appendChild(createPageButton('下一页', currentPage + 1, currentPage === totalPages));

    if (totalPages > 7) {
        const jumpContainer = document.createElement('div');
        jumpContainer.className = 'pagination-jump';
        jumpContainer.innerHTML = '<span>到第</span><input type="number" id="page-jump-input" min="1" max="'+ totalPages +'"><span>页</span><button id="jumpBtn">确定</button>';
        pagination.appendChild(jumpContainer);
        
        const input = jumpContainer.querySelector('input');
        const btn = jumpContainer.querySelector('button');
        btn.onclick = () => jumpToPage(input.value);
        input.onkeydown = (e) => { if (e.key === 'Enter') jumpToPage(input.value); };
    }
}

function performSearch() {
    const searchTerm = searchInput.value.trim().toUpperCase();

    if (!searchTerm) {
        clearSearch();
        renderAll();
        return;
    }

    isSearching = true;
    searchResults = [];

    if (searchInCurrentCategory) {
        const currentImages = galleryData[currentGroupIndex]?.categories[currentCategoryIndex]?.images;
        if (currentImages) {
            searchResults = currentImages.filter(imageUrl => {
                const decodedName = decodeURIComponent(imageUrl.split('/').pop()).toUpperCase();
                return decodedName.includes(searchTerm);
            });
        }
    } else {
        galleryData.forEach(group => {
            group.categories.forEach(category => {
                category.images.forEach(imageUrl => {
                    const decodedName = decodeURIComponent(imageUrl.split('/').pop()).toUpperCase();
                    if (decodedName.includes(searchTerm)) {
                        searchResults.push(imageUrl);
                    }
                });
            });
        });
    }

    currentPage = 1;
    updateNavActiveState();
    renderGallery();
    renderPagination();
}

function clearSearch() {
    isSearching = false;
    searchInput.value = "";
    searchResults = [];
    updateNavActiveState();
}

function openModal(imageUrl) {
    modal.classList.remove("hidden");
    modalImg.src = imageUrl;
    const filename = imageUrl.split("/").pop();
    downloadBtn.href = imageUrl;
    downloadBtn.download = decodeURIComponent(filename);
}

function closeModalFunc() {
    modal.classList.add("hidden");
    modalImg.src = "";
}

function applyTheme(theme) {
    document.body.classList.toggle("dark", theme === "dark");
}

function toggleTheme() {
    const newTheme = document.body.classList.contains("dark") ? "light" : "dark";
    applyTheme(newTheme);
    localStorage.setItem("theme", newTheme);
}

function renderAll() {
    renderNavigation();
    renderGallery();
    renderPagination();
}

function init() {
    const savedTheme = localStorage.getItem("theme") || "light";
    applyTheme(savedTheme);

    renderAll();

    searchBtn.onclick = performSearch;
    searchInput.addEventListener("keydown", e => {
        if (e.key === "Enter") performSearch();
    });

    searchScopeBtn.addEventListener('click', () => {
        searchInCurrentCategory = !searchInCurrentCategory;
        searchScopeBtn.classList.toggle('active', searchInCurrentCategory);
        searchScopeBtn.title = searchInCurrentCategory ? '在当前分类下搜索' : '全局搜索';
        if (isSearching) {
            performSearch();
        }
    });

    themeToggle.onclick = toggleTheme;

    closeModalBtn.onclick = closeModalFunc;
    modal.onclick = e => {
        if (e.target === modal) closeModalFunc();
    };
    document.addEventListener("keydown", e => {
        if (e.key === "Escape" && !modal.classList.contains("hidden")) {
            closeModalFunc();
        }
    });
}

document.addEventListener("DOMContentLoaded", init);