# Inventory Setup
1. Clone [Inventory.js](/Js/Pages/Inventory.js) into your desired location (`/Js/Pages/Inventory.js` for this example).
2. Create a new `CSS` file for this page in your desired location (`/CSS/Pages/Trade/Trade.css` for this example).
   ```css
   .robux {
       background-position-y: 3px !important;
   }
   
   .InventoryItemContainerOuter {
       padding: unset !important;
   }
   
   .InventoryHandle {
       display: grid;
       grid-template-columns: auto auto auto auto auto auto auto;
       justify-content: start;
       grid-gap: 5px;
   }
   
   .InventoryItemContainerInner:hover {
       padding-bottom: 20px;
   }
   
   .TradeItemSilverButtonDisabled:hover {
       color: #A7A7A7 !important;
   }
   
   .InventoryItemName, .InventoryItemLink:hover {
       color: rgb(9, 95, 181) !important;
   }
   
   div[fieldname="InventoryItemSize"] {
       width: 60px;
       height: 60px;
   }
   
   .SmallInventoryItem {
       border: navajowhite;
   }
   
   html {
       background-color: unset;
   }
   
   .invisibleButton {
       display: none !important;
   }
   
   input:placeholder-shown {
       font-style: italic;
   }
   ```
3. Acquire the trade window `HTML` (I can't provide it here due to legal reasons, but you should be able to find it if you ask around enough. I can send it to you if you message me on Discord.)
4. Add references to the `CSS` and `JS` files in the `<head>` of your `tradewindow` file.
   ```html
   <link rel="stylesheet" href="/CSS/Pages/Trade/Trade.css">
   <script src="/RobloxJS/Js/Pages/Inventory.js"></script>
   ```
5. Modify the scripts under each inventory element. You should find script elements that look like this:
   ```html
   <!-- DO NOT COPY THIS -->
   <script type="text/javascript">
       $(function () {
           Roblox.InventoryControl.inventoryControls = Roblox.InventoryControl.inventoryControls || [];
           Roblox.InventoryControl.inventoryControls.push(new Roblox.InventoryControl('ctl00_cphRoblox_InventoryControl#_InventoryContainer', null, 14));
       });
   </script>
   <!-- DO NOT COPY THIS -->
   ```
   You will need to replace the first one (`ctl00_cphRoblox_InventoryControl1_InventoryContainer`) with:
   ```html
   <script type="text/javascript">
       document.addEventListener("DOMContentLoaded", function () {
           Roblox.InventoryControl.inventoryControls = Roblox.InventoryControl.inventoryControls || [];
           Roblox.InventoryControl.inventoryControls.push(new Roblox.InventoryControl.InventoryHandler('ctl00_cphRoblox_InventoryControl1_InventoryContainer', null, 14));
       });
   </script>
   ```
   And replace the second one (`ctl00_cphRoblox_InventoryControl2_InventoryContainer`) with:
   ```html
   <script type="text/javascript" defer>
       document.addEventListener("DOMContentLoaded", function () {
           Roblox.InventoryControl.inventoryControls = Roblox.InventoryControl.inventoryControls || [];
           Roblox.InventoryControl.inventoryControls.push(new Roblox.InventoryControl.InventoryHandler('ctl00_cphRoblox_InventoryControl2_InventoryContainer', null, 14));
           Roblox.InventoryControl.InitializedSendTradeHandler = new Roblox.InventoryControl.SendTradeHandler(Roblox.InventoryControl.inventoryControls);
           Roblox.InventoryControl.sendTradeButton = document.querySelector(".SendTrade");

           function showTradeConfirmationModal() {
               Roblox.GenericConfirmation.open({
                   titleText: Roblox.Trade.Offer.Resources.sendRequestTitleText,
                   bodyContent: Roblox.Trade.Offer.Resources.sendRequestText,
                   acceptText: Roblox.Trade.Offer.Resources.acceptText,
                   declineText: Roblox.Trade.Offer.Resources.cancelText,
                   acceptColor: Roblox.GenericConfirmation.blue,
                   declineColor: Roblox.GenericConfirmation.gray,
                   onAccept: Roblox.InventoryControl.InitializedSendTradeHandler.processTradeRequest
               });
           }

           Roblox.InventoryControl.sendTradeButton.addEventListener("click", () => showTradeConfirmationModal());
       });
   </script>
   ``` 
6. Replace the inventory api links with your own.
   ```
   https://inventory.roblox.com/v1/users/261/assets/collectibles  -->  https://inventory.your-private-server.blox/v1/users/261/assets/collectibles
   ```
7. Modify the roblox icon html. Your trade window `html` might have this strange icon class:
   ```html
   <!-- DO NOT COPY THIS -->
   <span class="icon-robux-16x16"></span>
   <!-- DO NOT COPY THIS -->
   ```
   You should replace it with this instead:
   ```html
   <img class="RBXImg" width="18" height="12" src="https://images.rbxcdn.com/a65931a25b2dec839012a81e5d217494.png" alt="RBX">
   ```

That should be all. I'm quite sure this is all I had to modify to get things to work well.

# Gallery

<table style="width: 100%;">
  <tr>
    <td style="width: 50%;"><img src="/demos/inventory/Screenshot 2025-01-22 231059.png" alt="Image 1" style="width: 100%;"></td>
    <td style="width: 50%;"><img src="/demos/inventory/Screenshot 2025-01-22 231209.png" alt="Image 2" style="width: 100%;"></td>
  </tr>
  <tr>
    <td style="width: 50%;"><img src="/demos/inventory/Screenshot 2025-01-22 233433.png" alt="Image 3" style="width: 100%;"></td>
    <td style="width: 50%;"><img src="/demos/inventory/Screenshot 2025-01-22 233445.png" alt="Image 4" style="width: 100%;"></td>
  </tr>
  <tr>
    <td style="width: 50%;"><img src="/demos/inventory/Screenshot 2025-01-22 233551.png" alt="Image 5" style="width: 100%;"></td>
    <td style="width: 50%;"><img src="/demos/inventory/Screenshot 2025-01-22 233713.png" alt="Image 6" style="width: 100%;"></td>
  </tr>
</table>
