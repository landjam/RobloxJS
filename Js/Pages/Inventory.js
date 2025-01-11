// Inventory.js
// landjam
// 12-30-24 (Updated 1-11-25)



class InventoryHandler {
    constructor(containerId, _, pageSize) {
        this.container = document.getElementById(containerId); 
        this.apiUrl = this.container.dataset.collectiblesUrl;
        this.categoryDropdown = this.container.querySelector(".CategoryDropDown");
        this.noItemsLabel = this.container.querySelector(".noItems");
        this.pagingContainer = this.container.querySelector(".PagingContainerDivTop");
        this.prevPageButton = this.container.querySelector(".paging_previous");
        this.nextPageButton = this.container.querySelector(".paging_next");
        this.currentPageIndicator = this.container.querySelector(".paging_currentpage");
        this.inventoryHandle = this.container.querySelector(".InventoryHandle");
        this.itemTemplate = this.container.querySelector(".InventoryItemTemplate");
        this.addButtonTemplate = document.querySelector(".AddButton");
        this.requestButtonTemplate = document.querySelector(".RequestButton");
        this.removeOfferTemplate = document.querySelector(".RemoveFromOffer");
        this.ownedByUser = this.container.getAttribute("ownedbyuser");
        this.correspondingOffer = this.ownedByUser == "True" ? document.querySelector('.OfferList[list-id="OfferList0"]') : document.querySelector('.OfferList[list-id="OfferList1"]');
        this.offerItemsLocation = this.correspondingOffer.querySelector(".OfferItems");
        this.offerValue = this.correspondingOffer.querySelector(".OfferValue");
        this.blankTemplate = document.querySelector(".BlankItem");
        this.OfferRobuxWrapper = this.correspondingOffer.querySelector(".OfferRobuxWrapper");
        this.offeredRobux = this.OfferRobuxWrapper.querySelector(".AddRobuxBox");
        this.offeredRobuxValue = 0;
        this.adjustedOfferedRobuxValue = 0;
        this.category = this.categoryDropdown.value;
        this.imageCache = new Map();
        this.currentPage = 0;
        this.itemsPerPage = pageSize;
        this.isLoading = false;
        this.offeredItems = [];
        this.offeredItemsValue = 0;
        this.requestedItems = [];
        this.target = this.ownedByUser == "True" ? this.offeredItems : this.requestedItems;
        this.allItems = {};
        this.pages = {};
        this.totalPages = {};
        this.pageCursors = {};

        this.initEventListeners();
        this.loadInventory();
        this.initializeOffer();
    }

    initEventListeners() {
        this.categoryDropdown.addEventListener("change", () => this.handleCategoryChange());
        this.prevPageButton.addEventListener("click", () => this.loadPage(this.currentPage - 1));
        this.nextPageButton.addEventListener("click", () => this.loadPage(this.currentPage + 1));
        this.offeredRobux.addEventListener("input", (event) => this.updateOfferedRobux(event));
    }

    async loadInventory() {
        if (!this.allItems[this.category]) {
            this.allItems[this.category] = [];
            this.pages[this.category] = [];
            this.totalPages[this.category] = 0;
            this.pageCursors[this.category] = null;

            await this.loadNextBatch(this.category);
        }
        
        this.loadPage(0);
    }

    async loadNextBatch(category) {
        const limit = 100;
        const url = new URL(this.apiUrl);
        url.searchParams.append("limit", limit);
        url.searchParams.append("assetType", category);

        if (this.pageCursors[category]) {
            url.searchParams.append("cursor", this.pageCursors[category]);
        }

        try {
            const response = await fetch(`https://ro-proxy.hamblo.xyz/?url=${encodeURIComponent(url.toString())}`);
            const data = await response.json();

            if (!data.data) return; // should probably implement some error handling soon

            this.allItems[category] = this.allItems[category].concat(data.data);
            this.pageCursors[category] = data.nextPageCursor;
            this.updateCategoryPages(category);
        } catch (error) {
            console.error("Error loading inventory:", error);
        }
    }

    updateCategoryPages(category) {
        const items = this.allItems[category];
        const totalPages = Math.ceil(items.length / this.itemsPerPage);

        this.pages[category] = [];
        for (let i = 0; i < totalPages; i++) {
            this.pages[category].push(items.slice(i * this.itemsPerPage, (i + 1) * this.itemsPerPage));
        }

        this.totalPages[category] = totalPages;
    }

    async loadPage(pageNumber) {
        // Prevent concurrent calls
        if (this.isLoading) return;
        this.isLoading = true;
    
        if (pageNumber < 0) {
            this.isLoading = false;
            return; // Out of bounds
        }
    
        if (pageNumber === this.totalPages[this.category] - 1 && this.pageCursors[this.category]) {
            await this.loadNextBatch(this.category);
        }
    
        this.currentPage = pageNumber;
        const pageItems = this.pages[this.category][this.currentPage] || [];
        
        this.inventoryHandle.innerHTML = ""; // Clear inventory to avoid duplicates
        await this.populateItems(pageItems);
    
        this.updatePagination();
    
        // Allow subsequent calls
        this.isLoading = false;
    }

    updatePagination() {
        const totalPages = this.totalPages[this.category] || 0;

        this.prevPageButton.style.pointerEvents = this.currentPage > 0 ? "auto" : "none";
        this.prevPageButton.style.opacity = this.currentPage > 0 ? "1" : "0.5";

        const hasMorePages = this.pageCursors[this.category] !== null;
        this.nextPageButton.style.pointerEvents = this.currentPage < totalPages - 1 || hasMorePages ? "auto" : "none";
        this.nextPageButton.style.opacity = this.currentPage < totalPages - 1 || hasMorePages ? "1" : "0.5";

        this.pagingContainer.style.display = totalPages > 1 ? "block" : "none";

        this.currentPageIndicator.textContent = this.currentPage + 1 + " of " + totalPages + (this.pageCursors[this.category] ? "+" : "");
    }

    async populateItems(items) {
        this.inventoryHandle.innerHTML = ""; // Clear previous items

        if (items.length === 0) {
            this.noItemsLabel.style.display = "block";
            return;
        }

        this.noItemsLabel.style.display = "none";

        const assetIdsToFetch = [];

        items.forEach(item => {
            if (!this.imageCache.has(item.assetId)) {
                assetIdsToFetch.push(item.assetId);
            }
        });

        if (assetIdsToFetch.length > 0) {
            await this.fetchThumbnails(assetIdsToFetch);
        }

        items.forEach(item => {
            const itemElement = this.itemTemplate.cloneNode(true);
            let template = this.requestButtonTemplate;
            itemElement.style.display = "block";
            
            if (this.ownedByUser == "True") {
                template = this.addButtonTemplate;
            }

            let clone = template.cloneNode(true);
            let cloneBtn = clone.querySelector(".TradeItemSilverButton");

            if (this.target.includes(item.userAssetId)) {
                cloneBtn.classList.replace("TradeItemSilverButton", "TradeItemSilverButtonDisabled");
            }

            itemElement.classList.replace("InventoryItemTemplate", "LargeInventoryItem");

            itemElement.dataset.identifier = item.userAssetId;
            itemElement.querySelector(".InventoryItemName").textContent = item.name;
            itemElement.querySelector(".InventoryItemLink").href = "http://roblox.com/catalog/" + item.assetId;
            const imgElement = itemElement.querySelector(".ItemImg");
            imgElement.src = this.imageCache.get(item.assetId) || "fallback-image.jpg";
            itemElement.querySelector(".InventoryItemAveragePrice").textContent = item.recentAveragePrice || "---";
            itemElement.querySelector(".InventoryItemOriginalPrice").textContent = item.originalPrice || "---";
            itemElement.querySelector(".InventoryItemSerial").textContent = item.serialNumber || "---";
            itemElement.querySelector(".SerialNumberTotal").textContent = item.assetStock || "---";

            itemElement.querySelector(".FooterButtonPlaceHolder").remove();

            itemElement.querySelector(".HoverContent").appendChild(clone);
            cloneBtn.addEventListener("click", () => {
                let disabled = cloneBtn.classList.contains("TradeItemSilverButtonDisabled");
                
                if (disabled) return;
                if (this.target.length == 4) return;

                cloneBtn.classList.replace("TradeItemSilverButton", "TradeItemSilverButtonDisabled");
                this.target.push(item.userAssetId);
                this.addToOffer(itemElement, cloneBtn, item.userAssetId);
            });

            this.inventoryHandle.appendChild(itemElement);
        });
    }

    async fetchThumbnails(assetIds) {
        const chunks = [];
        const preUrl = new URL("https://thumbnails.roblox.com/v1/assets");
        preUrl.searchParams.append("size", "75x75");
        preUrl.searchParams.append("format", "png");
        
        while (assetIds.length) {
            chunks.push(assetIds.splice(0, 14));
        }

        preUrl.searchParams.append("assetids", chunks.join(","));

        const url = `https://ro-proxy.hamblo.xyz/?url=${encodeURIComponent(preUrl.toString())}`;

        console.log(preUrl);
        console.log(url);

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (!data.data) return; // should probably implement some error handling soon

            data.data.forEach(entry => {
                if (entry.state === "Completed") {
                    this.imageCache.set(entry.targetId, entry.imageUrl);
                }
            });
        } catch (error) {
            console.error("Failed to fetch thumbnails:", error);
        }
    }

    async handleCategoryChange() {
        const newCategory = this.categoryDropdown.value;
        if (newCategory !== this.category) {
            this.category = newCategory;
            await this.loadInventory();
            this.loadPage(0);
        }
    }

    initializeOffer() {
        Array.from({ length: 4 }, (x, i) => {
            let blankTemplate = this.blankTemplate.cloneNode(true);
            blankTemplate.dataset.offerId = i;
            this.offerItemsLocation.appendChild(blankTemplate);
        });
    }

    addToOffer(itemContainer, sendingButton, userAssetId) {
        let itemClone = itemContainer.cloneNode(true); // keeps all info so we don't have to refill it
        let buttonContainer = itemClone.querySelector(".TradeItemSilverButtonContainer");
        let averagePrice = itemClone.querySelector(".InventoryItemAveragePrice").textContent; // this is inefficient (I think? idk tables are cooler at least)
        let newButton = this.removeOfferTemplate.cloneNode(true);
        let offerIndex = this.target.indexOf(userAssetId);
        let itemValue = Number(averagePrice);

        itemClone.classList.replace("LargeInventoryItem", "SmallInventoryItem");
        this.offeredItemsValue += itemValue;
        this.offerValue.textContent = this.offeredItemsValue + this.adjustedOfferedRobuxValue;
        buttonContainer.parentNode.appendChild(newButton);
        buttonContainer.remove();

        if (offerIndex < 0) return; // wat how

        newButton.addEventListener("click", () => {
            this.target.splice(this.target.indexOf(userAssetId), 1)
            itemClone.remove();
            sendingButton.classList.replace("TradeItemSilverButtonDisabled", "TradeItemSilverButton");

            this.offeredItemsValue -= itemValue;
            this.offerValue.textContent = this.offeredItemsValue + this.adjustedOfferedRobuxValue;

            this.rearrangeOfferSlots();
        });

        let offerSlot = this.offerItemsLocation.querySelector(`[data-offer-id="${offerIndex}"]`);
        offerSlot.appendChild(itemClone);
    }

    rearrangeOfferSlots() {
        let offerSlots = this.offerItemsLocation.querySelectorAll("[data-offer-id]");
        let items = Array.from(offerSlots)
            .map(slot => slot.firstElementChild)
            .filter(item => item);

        offerSlots.forEach(slot => slot.innerHTML = "");

        items.forEach((item, index) => {
            let slot = this.offerItemsLocation.querySelector(`[data-offer-id="${index}"]`);
            slot.appendChild(item);
        });
    }

    updateOfferedRobux(inputEvent) {
        let inputValue = Number(inputEvent.target.value);
        let afterFeeRobux = this.OfferRobuxWrapper.querySelector(".AfterFeeRobux");
        let robuxCost = afterFeeRobux.querySelector(".RobuxCost");
        
        if (!inputValue) {
            this.offerValue.textContent = this.offeredItemsValue
            this.offeredRobuxValue = 0;
            this.adjustedOfferedRobuxValue = 0;
            afterFeeRobux.style.display = "none";
            return; // not a number? no addition for you
        }

        this.offeredRobuxValue = inputValue;
        this.adjustedOfferedRobuxValue = Math.round(this.offeredRobuxValue * 0.7); // roblox takes 30% 🤑

        afterFeeRobux.style.display = "block";
        robuxCost.textContent = this.adjustedOfferedRobuxValue;
        this.offerValue.textContent = this.offeredItemsValue + this.adjustedOfferedRobuxValue;
    }
}

window.Roblox = window.Roblox || {};
window.Roblox.InventoryControl = window.Roblox.InventoryControl || {};
window.Roblox.InventoryControl.InventoryHandler = InventoryHandler;
