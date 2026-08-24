<script type="module">
        /* 暫時註解 Firebase 引入
        import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
        import { getFirestore, doc, onSnapshot, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
        import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
        */

        // 宣告空陣列，等待從 JSON 載入資料
        let myPortfolio = [];
        let currentCategory = '全部';
        let searchQuery = '';
        const categoryOrder = ['全部', '國語遊戲', '數學遊戲', '其他遊戲', '工具區'];

        // 點擊名稱回首頁並清除搜尋狀態
        window.resetToHome = function() {
            currentCategory = '全部';
            searchQuery = '';
            document.getElementById('searchInput').value = '';
            
            // 重新渲染分類按鈕與卡片，並捲回頂部
            renderFilterButtons();
            updateView();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        // 初始化
        document.addEventListener('DOMContentLoaded', async () => {
            // 讀取外部 JSON 檔案
            await loadGamesData();

            // 確保資料載入後才更新畫面
            document.getElementById('gameCount').textContent = myPortfolio.length;
            renderFilterButtons();
            updateView();
            initSearchLogic();
            initBackToTop();
        });

        // 非同步讀取 JSON 的函數
        async function loadGamesData() {
            try {
                const response = await fetch('./games.json');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                myPortfolio = await response.json();
            } catch (error) {
                console.error("無法載入遊戲資料:", error);
                showToast("資料載入失敗，請檢查網路連線或 Local Server");
                myPortfolio = []; 
            }
        }

        function showToast(msg) {
            const toast = document.getElementById('toast');
            toast.textContent = msg;
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
            }, 2500);
        }

        function initBackToTop() {
            const btn = document.getElementById('backToTopBtn');
            window.addEventListener('scroll', () => {
                if (window.scrollY > 300) {
                    btn.classList.remove('opacity-0', 'translate-y-10', 'pointer-events-none');
                    btn.classList.add('opacity-100', 'translate-y-0', 'pointer-events-auto');
                } else {
                    btn.classList.add('opacity-0', 'translate-y-10', 'pointer-events-none');
                    btn.classList.remove('opacity-100', 'translate-y-0', 'pointer-events-auto');
                }
            });
            btn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        function initSearchLogic() {
            const searchBtn = document.getElementById('searchToggleBtn');
            const searchInput = document.getElementById('searchInput');
            const searchSuggestions = document.getElementById('searchSuggestions');
            const suggestionButtons = document.querySelectorAll('#suggestionList button');
            let isExpanded = false;

            // 顯示或隱藏搜尋框與關鍵字選單
            searchBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                isExpanded = !isExpanded;
                if(isExpanded) {
                    searchInput.classList.remove('w-0', 'opacity-0');
                    searchInput.classList.add('w-48', 'opacity-100', 'pr-10'); 
                    searchSuggestions.classList.remove('opacity-0', 'pointer-events-none');
                    searchSuggestions.classList.add('opacity-100', 'pointer-events-auto');
                    searchInput.focus();
                } else {
                    searchInput.classList.remove('w-48', 'opacity-100', 'pr-10');
                    searchInput.classList.add('w-0', 'opacity-0');
                    searchSuggestions.classList.remove('opacity-100', 'pointer-events-auto');
                    searchSuggestions.classList.add('opacity-0', 'pointer-events-none');
                    searchInput.value = '';
                    searchQuery = '';
                    updateView();
                }
            });

            // 點擊其他地方隱藏關鍵字選單
            document.addEventListener('click', (e) => {
                if (isExpanded && !e.target.closest('.relative.flex.items-center.justify-end')) {
                    searchSuggestions.classList.remove('opacity-100', 'pointer-events-auto');
                    searchSuggestions.classList.add('opacity-0', 'pointer-events-none');
                }
            });
            
            // 點擊輸入框時再次顯示關鍵字選單
            searchInput.addEventListener('focus', () => {
                searchSuggestions.classList.remove('opacity-0', 'pointer-events-none');
                searchSuggestions.classList.add('opacity-100', 'pointer-events-auto');
            });

            // 輸入字元時更新畫面
            searchInput.addEventListener('input', (e) => {
                searchQuery = e.target.value.trim().toLowerCase();
                updateView();
            });

            // 處理快速搜尋關鍵字點擊
            suggestionButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const keyword = e.target.getAttribute('data-keyword');
                    searchInput.value = keyword;
                    searchQuery = keyword;
                    searchSuggestions.classList.remove('opacity-100', 'pointer-events-auto');
                    searchSuggestions.classList.add('opacity-0', 'pointer-events-none');
                    updateView();
                });
            });
        }

        function renderFilterButtons() {
            const container = document.getElementById('filterContainer');
            container.innerHTML = '';
            
            const actualCategories = new Set(myPortfolio.map(item => item.category));
            const displayCategories = categoryOrder.filter(c => c === '全部' || actualCategories.has(c));

            displayCategories.forEach(cat => {
                const btn = document.createElement('button');
                const isActive = cat === currentCategory;
                
                btn.className = `px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-300 border whitespace-nowrap ${
                    isActive 
                    ? 'bg-sunshine-primary/10 text-sunshine-primary border-sunshine-primary shadow-[0_0_10px_rgba(251,191,36,0.15)]' 
                    : 'bg-transparent text-sunshine-muted border-transparent hover:bg-white/5 hover:text-white'
                }`;
                btn.textContent = cat;
                btn.onclick = () => {
                    currentCategory = cat;
                    renderFilterButtons();
                    updateView();
                };
                container.appendChild(btn);
            });
        }

        function updateView() {
            const container = document.getElementById('portfolioContainer');
            container.innerHTML = '';

            const filteredData = myPortfolio.filter(item => {
                const matchCategory = currentCategory === '全部' || item.category === currentCategory;
                const matchSearch = item.title.toLowerCase().includes(searchQuery) || 
                                   (item.description && item.description.toLowerCase().includes(searchQuery)) ||
                                   (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchQuery)));
                return matchCategory && matchSearch;
            });

            document.getElementById('gameCount').textContent = filteredData.length;

            if (filteredData.length === 0) {
                container.innerHTML = `
                    <div class="col-span-full py-20 flex flex-col items-center justify-center text-sunshine-muted">
                        <svg class="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <p class="text-lg">找不到相關作品</p>
                    </div>`;
                container.className = "w-full"; 
                return;
            }

            container.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full";

            filteredData.forEach(item => {
                const tagsHtml = (item.tags || []).map(tag => 
                    `<span class="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-white/5 text-sunshine-muted border border-white/10 flex items-center gap-1"><span class="text-sunshine-primary/50">#</span>${tag}</span>`
                ).join('');

                const onClickAction = `window.open('${item.link}', '_blank')`;

                const cardHTML = `
                    <div class="game-card group cursor-pointer bg-sunshine-card rounded-xl border border-sunshine-border overflow-hidden flex flex-col h-full relative" onclick="${onClickAction}">
                        <div class="h-1 w-full bg-gradient-to-r from-sunshine-primary/20 via-sunshine-primary to-sunshine-primary/20 opacity-50 group-hover:opacity-100 group-hover:h-1.5 transition-all duration-300 shadow-[0_0_10px_rgba(251,191,36,0.5)]"></div>
                        
                        <div class="card-img-wrapper relative aspect-video bg-black/50 border-b border-sunshine-border">
                            <div class="absolute top-3 left-3 z-10">
                                <span class="bg-black/70 backdrop-blur-md text-[10px] font-bold tracking-wider text-white px-2.5 py-1 rounded-sm uppercase border border-white/10 shadow-lg flex items-center gap-1.5">
                                    <div class="w-1.5 h-1.5 rounded-full bg-sunshine-primary"></div>
                                    ${item.category}
                                </span>
                            </div>
                            <img src="${item.image}" alt="${item.title}" class="w-full h-full object-cover" onerror="this.src='https://placehold.co/600x400/27272a/a1a1aa?text=Image+Not+Found'">
                            
                            <div class="play-btn absolute bottom-3 right-3 z-20">
                                <div class="bg-sunshine-primary text-black font-bold text-xs pl-3 pr-4 py-2 rounded-full shadow-[0_0_15px_rgba(251,191,36,0.5)] flex items-center gap-1.5 hover:bg-sunshine-secondary hover:scale-105 transition-transform">
                                    <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                    PLAY
                                </div>
                            </div>
                        </div>
                        
                        <div class="p-5 flex flex-col flex-grow relative z-10 bg-gradient-to-b from-sunshine-card to-[#1f1f22]">
                            <h3 class="text-xl font-bold text-white mb-2 group-hover:text-sunshine-primary transition-colors">${item.title}</h3>
                            <p class="text-sm text-sunshine-muted leading-relaxed flex-grow mb-4">${item.description}</p>
                            
                            <div class="flex flex-wrap items-center gap-1.5 mt-auto pt-4 border-t border-white/5">
                                <div class="flex flex-wrap gap-1.5 flex-grow">
                                    ${tagsHtml}
                                </div>
                                <span class="ml-auto text-[10px] text-sunshine-muted/60 font-mono tracking-wider pl-2">
                                    ${item.date ? item.date : ''}
                                </span>
                            </div>
                        </div>
                    </div>
                `;
                container.innerHTML += cardHTML;
            });
        }
    </script>
