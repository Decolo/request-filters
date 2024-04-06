// import { Storage } from "@plasmohq/storage"

// const initStorage = async () => {
//   const storage = new Storage()
// }

// const main = async () => {
//   await initStorage()
// }

// main()

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.openSidebar) {
    chrome.sidePanel.open({
      tabId: sender.tab.id
    }) // 确保你的 Chrome 版本支持这个功能
  }
})
