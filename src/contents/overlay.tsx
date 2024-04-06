import cssText from "data-text:~/contents/overlay.css"
import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["https://*/*"]
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

export default () => (
  <div className={"button-wrapper"}>
    <div className={"img-container"} onClick={() => {
       chrome.runtime.sendMessage({ openSidebar: true })
    }}></div>
  </div>
)
