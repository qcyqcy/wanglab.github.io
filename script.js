// 全局变量存储JSON数据
let poetryData = [];

// 检查是否已登录
function checkLogin() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    
    // 如果当前是搜索页面但未登录，则重定向到登录页
    if (window.location.pathname.includes('search.html') && !isLoggedIn) {
        window.location.href = 'index.html';
        return false;
    }
    
    // 如果当前是登录页但已登录，则重定向到搜索页
    if ((window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) && isLoggedIn) {
        window.location.href = 'search.html';
        return true;
    }
    
    return isLoggedIn;
}

// 登录处理
function setupLogin() {
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        // 支持按钮点击登录
        loginBtn.addEventListener('click', handleLogin);
        
        // 支持回车键登录
        const passwordInput = document.getElementById('password');
        if (passwordInput) {
            passwordInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    handleLogin();
                }
            });
        }
    }
}

// 处理登录逻辑
function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');
    
    if (username === 'admin' && password === 'admin') {
        // 登录成功
        sessionStorage.setItem('isLoggedIn', 'true');
        window.location.href = 'search.html';
    } else {
        // 登录失败
        errorMessage.textContent = '用户名或密码错误！请使用 admin/admin';
    }
}

// 退出登录
function setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            sessionStorage.removeItem('isLoggedIn');
            window.location.href = 'index.html';
        });
    }
}

// 加载JSON数据
async function loadData() {
    try {
        // 从服务器获取数据
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        poetryData = await response.json();
        console.log('数据加载成功！', poetryData.length);
        
        // 更新状态显示
        const dataStatus = document.getElementById('dataStatus');
        if (dataStatus) {
            const poetEntryCount = poetryData.filter(item => item.type === 'poet_entry').length;
            const workEntryCount = poetryData.filter(item => item.type === 'work_entry').length;
            dataStatus.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                已加载 ${poetryData.length} 条数据（${poetEntryCount} 位诗人，${workEntryCount} 部文集）`;
        }
        
        // 隐藏初始提示和错误信息
        const initialMessage = document.getElementById('initialMessage');
        const errorMessage = document.getElementById('errorMessage');
        if (initialMessage) initialMessage.classList.add('hidden');
        if (errorMessage) errorMessage.classList.add('hidden');
        
        // 自动执行一次搜索，显示所有结果
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.disabled = false;
        
        const searchButton = document.getElementById('searchButton');
        if (searchButton) searchButton.disabled = false;
        
        performSearch();
        return true;
    } catch (error) {
        console.error('加载数据失败：', error);
        const errorMessage = document.getElementById('errorMessage');
        const errorDetails = document.getElementById('errorDetails');
        const dataStatus = document.getElementById('dataStatus');
        
        if (errorMessage) errorMessage.classList.remove('hidden');
        if (errorDetails) errorDetails.textContent = `加载数据失败: ${error.message}`;
        if (dataStatus) dataStatus.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            数据加载失败`;
        
        const initialMessage = document.getElementById('initialMessage');
        if (initialMessage) initialMessage.classList.add('hidden');
        return false;
    }
}

// 搜索功能设置
function setupSearch() {
    const searchBtn = document.getElementById('searchButton');
    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
        
        // 支持回车键搜索
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    performSearch();
                }
            });
            
            // 支持实时搜索（带防抖）
            searchInput.addEventListener('keyup', function(e) {
                if (e.key !== 'Enter') {
                    clearTimeout(searchInput.searchTimeout);
                    searchInput.searchTimeout = setTimeout(() => {
                        if (searchInput.value.length >= 1) {
                            performSearch();
                        }
                    }, 300);
                }
            });
        }
    }
    
    // 筛选按钮
    const filterAll = document.getElementById('filterAll');
    const filterPoet = document.getElementById('filterPoet');
    const filterWork = document.getElementById('filterWork');
    
    if (filterAll) filterAll.addEventListener('click', () => setFilter('all'));
    if (filterPoet) filterPoet.addEventListener('click', () => setFilter('poet_entry'));
    if (filterWork) filterWork.addEventListener('click', () => setFilter('work_entry'));
}

// 当前筛选器
let currentFilter = 'all';
let currentSearchResults = [];

// 设置筛选器
function setFilter(filter) {
    currentFilter = filter;
    
    // 更新按钮样式，添加过渡效果
    const filterAll = document.getElementById('filterAll');
    const filterPoet = document.getElementById('filterPoet');
    const filterWork = document.getElementById('filterWork');
    
    if (filterAll) filterAll.className = `py-1.5 px-4 rounded-full font-medium transition-all duration-200 ${filter === 'all' ? 'bg-primary text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`;
    if (filterPoet) filterPoet.className = `py-1.5 px-4 rounded-full font-medium transition-all duration-200 ${filter === 'poet_entry' ? 'bg-primary text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`;
    if (filterWork) filterWork.className = `py-1.5 px-4 rounded-full font-medium transition-all duration-200 ${filter === 'work_entry' ? 'bg-primary text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`;
    
    // 重新应用搜索，添加淡入效果
    if (currentSearchResults.length > 0) {
        const resultsContainer = document.getElementById('resultsContainer');
        if (resultsContainer) {
            resultsContainer.style.opacity = '0.6';
            setTimeout(() => {
                displaySearchResults(currentSearchResults);
                resultsContainer.style.opacity = '1';
            }, 300);
        }
    }
}

// 执行搜索
function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput ? searchInput.value.trim() : '';
    
    if (poetryData.length === 0) {
        console.warn("数据尚未加载完成");
        return;
    }
    
    // DOM元素引用
    const initialMessage = document.getElementById('initialMessage');
    const errorMessage = document.getElementById('errorMessage');
    const loadingResults = document.getElementById('loadingResults');
    const noResults = document.getElementById('noResults');
    const resultsContainer = document.getElementById('resultsContainer');
    const searchStats = document.getElementById('searchStats');
    
    // 显示加载状态并添加过渡效果
    if (initialMessage) initialMessage.classList.add('hidden');
    if (errorMessage) errorMessage.classList.add('hidden');
    if (loadingResults) {
        loadingResults.classList.remove('hidden');
        loadingResults.style.opacity = '0';
        setTimeout(() => loadingResults.style.opacity = '1', 50);
    }
    if (noResults) noResults.classList.add('hidden');
    
    if (resultsContainer) {
        // 淡出现有结果
        resultsContainer.style.opacity = '0.5';
        const existingCards = resultsContainer.querySelectorAll('.result-card');
        existingCards.forEach(card => card.remove());
    }
    
    // 模拟搜索延迟（增强用户体验）
    setTimeout(() => {
        // 如果查询为空，显示所有条目（最多50个）
        const results = query ? searchData(query) : poetryData.slice(0, 50);
        currentSearchResults = results;
        
        // 更新状态
        if (loadingResults) loadingResults.classList.add('hidden');
        if (searchStats) {
            searchStats.classList.remove('hidden');
            searchStats.style.opacity = '0';
            setTimeout(() => searchStats.style.opacity = '1', 50);
        }
        
        // 显示结果
        displaySearchResults(results);
        
        if (resultsContainer) {
            // 淡入新结果
            resultsContainer.style.opacity = '1';
        }
        
        if (results.length === 0 && noResults) {
            noResults.classList.remove('hidden');
            noResults.style.opacity = '0';
            setTimeout(() => noResults.style.opacity = '1', 50);
        }
    }, 300);
}

// 搜索数据
function searchData(query) {
    // 转为小写进行不区分大小写搜索
    const queryLower = query.toLowerCase();
    
    return poetryData.filter(item => {
        if (item.type === 'poet_entry') {
            // 匹配诗人姓名
            const nameMatch = item.poet_name && item.poet_name.toLowerCase().includes(queryLower);
            
            // 匹配诗人背景介绍
            const backgroundMatch = item.poet_background && item.poet_background.toLowerCase().includes(queryLower);
            
            // 匹配诗作内容
            const poemsMatch = item.poems && item.poems.toLowerCase().includes(queryLower);
            
            return nameMatch || backgroundMatch || poemsMatch;
        } else if (item.type === 'work_entry') {
            // 匹配作品标题
            const titleMatch = item.work_title && item.work_title.toLowerCase().includes(queryLower);
            
            // 匹配作品内容
            const poemsMatch = item.poems && item.poems.toLowerCase().includes(queryLower);
            
            // 匹配作品背景 (如果存在)
            const workBackgroundMatch = item.work_background && item.work_background.toLowerCase().includes(queryLower);
            
            return titleMatch || poemsMatch || workBackgroundMatch;
        }
        
        return false;
    });
}

// 显示搜索结果
function displaySearchResults(results) {
    const resultsContainer = document.getElementById('resultsContainer');
    const resultCount = document.getElementById('resultCount');
    const noResults = document.getElementById('noResults');
    
    if (!resultsContainer) return;
    
    // 清除现有结果
    const existingCards = resultsContainer.querySelectorAll('.result-card');
    existingCards.forEach(card => card.remove());
    
    // 应用筛选器
    let filteredResults = results;
    if (currentFilter !== 'all') {
        filteredResults = results.filter(item => item.type === currentFilter);
    }
    
    // 更新结果计数
    if (resultCount) resultCount.textContent = filteredResults.length;
    
    // 如果没有结果
    if (filteredResults.length === 0) {
        if (noResults) noResults.classList.remove('hidden');
        return;
    }
    
    if (noResults) noResults.classList.add('hidden');
    
    // 显示每个结果
    filteredResults.forEach(item => {
        const resultCard = createResultCard(item);
        resultsContainer.appendChild(resultCard);
    });
}

// 创建结果卡片
function createResultCard(item) {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    
    const cardDiv = document.createElement('div');
    cardDiv.className = 'result-card bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 cursor-pointer';
    
    // 头部：姓名/标题
    const header = document.createElement('div');
    header.className = 'flex justify-between items-start mb-4';
    
    const title = document.createElement('h3');
    if (item.type === 'poet_entry') {
        title.innerHTML = highlightText(item.poet_name || '无名', query);
    } else { // work_entry
        title.innerHTML = highlightText(`《${item.work_title || '无题'}》`, query);
    }
    title.className = 'text-xl font-bold text-primary dark:text-indigo-400';
    
    const typeTag = document.createElement('span');
    if (item.type === 'poet_entry') {
        typeTag.textContent = '诗人';
        typeTag.className = 'px-2.5 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full flex items-center';
        
        // 添加图标
        const icon = document.createElement('span');
        icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>`;
        typeTag.prepend(icon);
    } else { // work_entry
        typeTag.textContent = '文集/诗话';
        typeTag.className = 'px-2.5 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs font-medium rounded-full flex items-center';
        
        // 添加图标
        const icon = document.createElement('span');
        icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>`;
        typeTag.prepend(icon);
    }
    
    header.appendChild(title);
    header.appendChild(typeTag);
    
    // 内容区
    const contentDiv = document.createElement('div');
    contentDiv.className = 'space-y-3 collapse-content';
    
    // 根据条目类型显示不同内容
    if (item.type === 'poet_entry') {
        // 诗人背景
        if (item.poet_background) {
            const backgroundPara = document.createElement('div');
            backgroundPara.innerHTML = `<span class="font-medium text-gray-700 dark:text-gray-300">生平：</span> ${highlightText(item.poet_background, query)}`;
            backgroundPara.className = 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-3 rounded';
            contentDiv.appendChild(backgroundPara);
        }
        
        // 诗作内容
        if (item.poems) {
            const poemsPara = document.createElement('div');
            poemsPara.innerHTML = `<span class="font-medium text-gray-700 dark:text-gray-300 mb-2 block">作品：</span> ${formatPoem(highlightText(item.poems, query))}`;
            poemsPara.className = 'text-gray-700 dark:text-gray-300 poem-content';
            contentDiv.appendChild(poemsPara);
        }
    } else { // work_entry
        // 作品背景 (如果存在)
        if (item.work_background) {
            const workBackgroundPara = document.createElement('div');
            workBackgroundPara.innerHTML = `<span class="font-medium text-gray-700 dark:text-gray-300">背景：</span> ${highlightText(item.work_background, query)}`;
            workBackgroundPara.className = 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-3 rounded';
            contentDiv.appendChild(workBackgroundPara);
        }
        
        // 作品内容
        if (item.poems) {
            const poemsPara = document.createElement('div');
            poemsPara.innerHTML = `<span class="font-medium text-gray-700 dark:text-gray-300 mb-2 block">内容：</span> ${formatPoem(highlightText(item.poems, query))}`;
            poemsPara.className = 'text-gray-700 dark:text-gray-300 poem-content';
            contentDiv.appendChild(poemsPara);
        }
    }
    
    // 渐变遮罩
    const fadeOut = document.createElement('div');
    fadeOut.className = 'fade-out';
    contentDiv.appendChild(fadeOut);
    
    // 展开/收起按钮
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'flex justify-center mt-4';
    
    const expandBtn = document.createElement('button');
    expandBtn.className = 'read-more px-5 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-indigo-500 flex items-center';
    expandBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
        展开全文
    `;
    expandBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        cardDiv.classList.add('expanded');
    });
    
    const collapseBtn = document.createElement('button');
    collapseBtn.className = 'read-less px-5 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-indigo-500 flex items-center';
    collapseBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
        </svg>
        收起
    `;
    collapseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        cardDiv.classList.remove('expanded');
        // 滚动到卡片顶部
        cardDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    
    buttonContainer.appendChild(expandBtn);
    buttonContainer.appendChild(collapseBtn);
    
    // 卡片点击整体展开/收起
    cardDiv.addEventListener('click', () => {
        if (cardDiv.classList.contains('expanded')) {
            cardDiv.classList.remove('expanded');
        } else {
            cardDiv.classList.add('expanded');
        }
    });
    
    // 组装卡片
    cardDiv.appendChild(header);
    cardDiv.appendChild(contentDiv);
    cardDiv.appendChild(buttonContainer);
    
    return cardDiv;
}

// 高亮文本
function highlightText(text, query) {
    if (!text) return '';
    if (!query || query.length < 2) return text;
    
    // 转义特殊字符
    const safeQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    
    // 使用正则表达式进行替换
    const regex = new RegExp(safeQuery, 'gi');
    return text.replace(regex, match => `<span class="highlight">${match}</span>`);
}

// 格式化诗歌文本
function formatPoem(text) {
    if (!text) return '';
    
    // 处理换行符
    let formatted = text.replace(/\n/g, '</p><p>');
    
    // 将整个文本包装在段落中
    formatted = `<p>${formatted}</p>`;
    
    // 移除空段落
    formatted = formatted.replace(/<p><\/p>/g, '');
    
    // 识别并处理诗句
    // 这里使用简单的启发式方法：如果一段文字很短（比如少于30个字符）且包含标点，可能是诗句
    formatted = formatted.replace(/<p>(.{1,30}[，。？！；：])<\/p>/g, '<p class="poem-block">$1</p>');
    
    return formatted;
}

// 页面加载初始化
document.addEventListener('DOMContentLoaded', () => {
    // 检查登录状态并相应处理
    const isLoggedIn = checkLogin();
    
    // 设置登录处理
    setupLogin();
    
    // 设置退出登录
    setupLogout();
    
    // 如果在搜索页面且已登录，自动加载数据
    if (window.location.pathname.includes('search.html') && isLoggedIn) {
        // 设置搜索功能
        setupSearch();
        
        // 加载数据
        loadData();
        
        // 设置暗色模式
        setupDarkMode();
    }
});

// 设置暗色模式
function setupDarkMode() {
    // 检测暗色模式
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
    }
    
    // 监听颜色模式变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        if (event.matches) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    });
}
